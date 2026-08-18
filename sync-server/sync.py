#!/usr/bin/env python3
"""
sync.py — Sincroniza el catálogo desde la API HTTP a Supabase.

Reemplaza el sync horario que antes corría en Apps Script (que tenía límite
de 50 MB en UrlFetchApp). Acá no hay límites — corre en tu servidor.

Flujo:
  1. Fetch HTTP a la API de productos
  2. Listar la carpeta de Drive con las fotos (mapea cod -> fileId)
  3. Agrupar productos en jerarquía (mismo algoritmo que groupRaw_ de Apps Script)
  4. Escribir a Supabase: tablas normalizadas (products/colors/grades/stock) +
     catalog_cache (JSONB con la jerarquía completa) + sync_log (auditoría).

Uso local:
  pip install -r requirements.txt
  python sync.py

Auth Drive: usa una Service Account JSON. Por defecto busca
'./service-account.json' o lo que diga la variable de entorno
GOOGLE_APPLICATION_CREDENTIALS.
Auth Supabase: connection string en SUPABASE_DB_URL (.env).
"""

import json
import os
import random
import sys
import time
from datetime import datetime

import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# psycopg2 es opcional: si no está instalado, simplemente se saltea la
# escritura a Supabase (útil para correr en dev sin la dependencia).
try:
    import psycopg2
    from psycopg2.extras import execute_values
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False


# ============================================================================
# CONFIGURACIÓN — editar antes del primer uso
# ============================================================================

API_URL          = "http://api.lacostasrl.com.py:56181/productos"
DRIVE_FOLDER_ID  = "1ZiSrtS6XK698C1rwd3Pn7zgT9nVog-7n"

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
]

# Retry config — exponencial: 5s, 10s, 20s, 40s (con jitter ±2s)
RETRY_MAX_ATTEMPTS = 4
RETRY_BASE_DELAY   = 5
RETRYABLE_HTTP_STATUSES = {429, 500, 502, 503, 504}


# ============================================================================
# RETRY CON BACKOFF EXPONENCIAL
# ============================================================================
# Reintenta automáticamente las llamadas de red que fallen por errores
# transitorios: 502/503 de Google Drive, timeouts de DNS, connection reset,
# JSON cortado a mitad (caso raro pero recuperable). Errores estructurales
# (4xx que no sean 429, código de aplicación) propagan inmediatamente.

def _is_retryable(e):
    """Decide si la excepción justifica un reintento."""
    # Errores de red: conexión rota, timeout, DNS, chunked encoding interrumpido
    if isinstance(e, (
        requests.exceptions.ConnectionError,
        requests.exceptions.Timeout,
        requests.exceptions.ChunkedEncodingError,
    )):
        return True
    # HTTP 5xx / 429 desde la API HTTP del cliente
    if isinstance(e, requests.exceptions.HTTPError):
        status = e.response.status_code if e.response is not None else None
        return status in RETRYABLE_HTTP_STATUSES
    # HTTP 5xx / 429 desde Google Drive API
    if isinstance(e, HttpError):
        status = getattr(e.resp, "status", None)
        try:
            status = int(status) if status is not None else None
        except (TypeError, ValueError):
            status = None
        return status in RETRYABLE_HTTP_STATUSES
    # JSON truncado: la mayoría de las veces es estructural (>50MB), pero
    # ocasionalmente un blip de red corta la respuesta a medias. Reintentar
    # es barato y a veces salva el sync.
    if isinstance(e, json.JSONDecodeError):
        return True
    # Errores de conexión a PostgreSQL (Supabase): connection reset,
    # timeout del pooler, server starting up, etc.
    if HAS_PSYCOPG2:
        if isinstance(e, (psycopg2.OperationalError, psycopg2.InterfaceError)):
            return True
    return False


def with_retry(fn, what, max_attempts=RETRY_MAX_ATTEMPTS, base_delay=RETRY_BASE_DELAY):
    """Ejecuta fn() con reintentos exponenciales para errores transitorios.
    Espera base_delay × 2^attempt + jitter entre intentos (5s, 10s, 20s, 40s).
    Errores no-transitorios propagan inmediatamente sin esperar."""
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception as e:
            is_last = attempt == max_attempts - 1
            if is_last or not _is_retryable(e):
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 2)
            print(
                f"   ⚠ {what} falló (intento {attempt+1}/{max_attempts}): "
                f"{type(e).__name__}: {e}",
                file=sys.stderr,
            )
            print(f"     Reintentando en {delay:.1f}s...", file=sys.stderr)
            time.sleep(delay)


# ============================================================================
# AUTENTICACIÓN
# ============================================================================

def authenticate(creds_path):
    creds = service_account.Credentials.from_service_account_file(
        creds_path, scopes=SCOPES
    )
    drive = build("drive", "v3", credentials=creds, cache_discovery=False)
    return drive


# ============================================================================
# FETCH API + Drive
# ============================================================================

def fetch_products():
    print(f"[{datetime.now().isoformat(timespec='seconds')}] Fetch API...")
    t0 = time.time()

    def _do():
        r = requests.get(API_URL, headers={"Accept": "application/json"}, timeout=180)
        r.raise_for_status()
        # Hacer el decode acá dentro: si la respuesta vino cortada (JSONDecodeError),
        # with_retry vuelve a intentar.
        return r.json(), len(r.content)

    data, n_bytes = with_retry(_do, "API fetch")
    dur = time.time() - t0
    print(f"   ✓ {len(data):,} filas en {dur:.1f}s ({n_bytes/1024/1024:.1f} MB)")
    return data


def _img_version(mtime):
    """Token de versión de una foto, derivado del modifiedTime de Drive
    ('2026-08-18T12:34:56.789Z' -> '20260818123456').

    Viaja al web app como imgV y termina en la URL de la imagen como ?v=
    (ver getImgUrl en app.js). Cambia sólo cuando el archivo cambia, así
    reemplazar una foto invalida el cache del navegador y del Service Worker
    de esa foto y de ninguna otra.
    """
    if not mtime:
        return None
    return "".join(ch for ch in mtime if ch.isdigit())[:14] or None


def fetch_image_map(drive):
    print(f"[{datetime.now().isoformat(timespec='seconds')}] Listing Drive folder...")
    t0 = time.time()
    image_map = {}
    page_token = None
    pages = 0
    while True:
        # Capturamos page_token en una default value para que el closure no
        # vea el valor mutado en la siguiente vuelta del while.
        def _do(_pt=page_token):
            return drive.files().list(
                q=f"'{DRIVE_FOLDER_ID}' in parents and trashed = false",
                fields="nextPageToken, files(id, name, modifiedTime)",
                pageSize=1000,
                pageToken=_pt,
            ).execute()

        resp = with_retry(_do, f"Drive list (página {pages+1})")
        for f in resp.get("files", []):
            key   = f["name"].lower()
            mtime = f.get("modifiedTime") or ""
            prev  = image_map.get(key)
            # Drive permite dos archivos con el mismo nombre en la misma
            # carpeta. Antes ganaba el último del listado (orden no
            # garantizado), así que subir una foto nueva sin borrar la vieja
            # podía dejar el catálogo apuntando a la vieja indefinidamente.
            # Nos quedamos con la modificada más recientemente — modifiedTime
            # es RFC3339 en UTC, así que ordena bien comparándolo como string.
            if prev is None or mtime > prev["mtime"]:
                image_map[key] = {"id": f["id"], "mtime": mtime}
        page_token = resp.get("nextPageToken")
        pages += 1
        if not page_token:
            break
    dur = time.time() - t0
    print(f"   ✓ {len(image_map):,} archivos en {dur:.1f}s ({pages} páginas)")
    return image_map


# ============================================================================
# AGRUPACIÓN — port de groupRaw_ de Apps Script
# ============================================================================

def group_raw(raw, image_map):
    """Agrupa filas planas en jerarquía producto → color → grade → stock."""
    p_map   = {}
    p_order = []
    skipped_no_cod = 0

    for item in raw:
        # Skip silencioso de items sin codFabrica — a veces el API devuelve
        # filas malformadas (probablemente productos huérfanos o en migración).
        # Antes esto crasheaba toda la sync; ahora los ignoramos y seguimos.
        cod = item.get("codFabrica")
        if cod is None or cod == "":
            skipped_no_cod += 1
            continue
        p_key   = str(cod)
        item_id = int(item.get("id") or 0)

        if p_key not in p_map:
            p_map[p_key] = {
                "id":                            item_id,
                "codFabrica":                    item["codFabrica"],
                "nmProduto":                     item.get("nmProduto"),
                "marca":                         item.get("marca"),
                "grupo":                         item.get("grupo"),
                "subgrupo":                      item.get("subgrupo"),
                "colecao":                       item.get("colecao"),
                "precioMinorista":               _num(item.get("precioMinorista")),
                "precioMinoristaPromo":          _num(item.get("precioMinoristaPromo")),
                "precioMinoristaPromoInicio":    item.get("precioMinoristaPromoInicio"),
                "precioMinoristaPromoValidade":  item.get("precioMinoristaPromoValidade"),
                "precioMayorista":               _num(item.get("precioMayorista")),
                "precioMayoristaPromo":          _num(item.get("precioMayoristaPromo")),
                "precioMayoristaPromoInicio":    item.get("precioMayoristaPromoInicio"),
                "precioMayoristaPromoValidade":  item.get("precioMayoristaPromoValidade"),
                "qMasVendio":                    int(item.get("qMasVendio") or 0),
                "_cMap":  {},
                "_cOrder": [],
            }
            p_order.append(p_key)
        elif item_id > p_map[p_key]["id"]:
            # Mismo codFabrica con id mayor → actualizar al más reciente
            p_map[p_key]["id"] = item_id

        prod = p_map[p_key]
        c_key = str(item.get("color"))
        if c_key not in prod["_cMap"]:
            filename = item.get("imagen") or ""
            img = image_map.get(filename.lower()) if filename else None
            prod["_cMap"][c_key] = {
                "color":   item.get("color"),
                "imagen":  filename or None,
                "imgId":   img["id"] if img else None,
                "imgV":    _img_version(img["mtime"]) if img else None,
                "_gMap":   {},
                "_gOrder": [],
            }
            prod["_cOrder"].append(c_key)

        col = prod["_cMap"][c_key]
        g_key = str(item.get("grade"))
        if g_key not in col["_gMap"]:
            col["_gMap"][g_key] = {
                "grade":    item.get("grade"),
                "ean":      item.get("ean"),
                # Usamos un dict por sucursal en vez de lista, para deduplicar
                # automáticamente. El API a veces devuelve filas duplicadas con
                # la misma (codFabrica, color, grade, sucursal); si las dejamos
                # acumular como lista, totales quedan inflados y Postgres rechaza
                # por la unique constraint.
                "stock_map": {},
            }
            col["_gOrder"].append(g_key)

        # Merge si la sucursal ya existe: sumar cantidades, quedarse con la
        # fecha más reciente de cada tipo.
        stock_map = col["_gMap"][g_key]["stock_map"]
        suc = item.get("sucursal")
        cantidad = int(item.get("cantidad") or 0)
        cmp_date = item.get("dataUltCmp")
        vnd_date = item.get("dataUltVnd")
        if suc in stock_map:
            existing = stock_map[suc]
            existing["cantidad"] += cantidad
            if cmp_date and (not existing["dataUltCmp"] or str(cmp_date) > str(existing["dataUltCmp"])):
                existing["dataUltCmp"] = cmp_date
            if vnd_date and (not existing["dataUltVnd"] or str(vnd_date) > str(existing["dataUltVnd"])):
                existing["dataUltVnd"] = vnd_date
        else:
            stock_map[suc] = {
                "sucursal":   suc,
                "cantidad":   cantidad,
                "dataUltCmp": cmp_date,
                "dataUltVnd": vnd_date,
            }

    # === Construir array final con totales y orden estable ===
    result = []
    for p_key in p_order:
        p = p_map[p_key]
        colors_arr = []
        for c_key in p["_cOrder"]:
            c = p["_cMap"][c_key]
            grades_arr = []
            for g_key in c["_gOrder"]:
                g = c["_gMap"][g_key]
                # Convertimos el dict por sucursal de vuelta a lista para el JSON
                stock_list = list(g["stock_map"].values())
                total_grade = sum(s["cantidad"] for s in stock_list)
                grades_arr.append({
                    "grade":      g["grade"],
                    "ean":        g["ean"],
                    "stock":      stock_list,
                    "totalStock": total_grade,
                })
            grades_arr.sort(key=_grade_sort_key)

            total_color = sum(g["totalStock"] for g in grades_arr)
            colors_arr.append({
                "color":      c["color"],
                "imagen":     c["imagen"],
                "imgId":      c["imgId"],
                "imgV":       c["imgV"],
                "gradesArr":  grades_arr,
                "totalStock": total_color,
            })

        total_product = sum(c["totalStock"] for c in colors_arr)
        result.append({
            "id":                            p["id"],
            "codFabrica":                    p["codFabrica"],
            "nmProduto":                     p["nmProduto"],
            "marca":                         p["marca"],
            "grupo":                         p["grupo"],
            "subgrupo":                      p["subgrupo"],
            "colecao":                       p["colecao"],
            "precioMinorista":               p["precioMinorista"],
            "precioMinoristaPromo":          p["precioMinoristaPromo"],
            "precioMinoristaPromoInicio":    p["precioMinoristaPromoInicio"],
            "precioMinoristaPromoValidade":  p["precioMinoristaPromoValidade"],
            "precioMayorista":               p["precioMayorista"],
            "precioMayoristaPromo":          p["precioMayoristaPromo"],
            "precioMayoristaPromoInicio":    p["precioMayoristaPromoInicio"],
            "precioMayoristaPromoValidade":  p["precioMayoristaPromoValidade"],
            "qMasVendio":                    p["qMasVendio"],
            "colorsArr":                     colors_arr,
            "totalStock":                    total_product,
        })
    if skipped_no_cod:
        print(f"   ⚠ {skipped_no_cod} filas sin codFabrica ignoradas")
    return result


def _num(v):
    try:
        return float(v) if v is not None else 0
    except (TypeError, ValueError):
        return 0


def _grade_sort_key(g):
    """Ordena grades numéricamente si es posible, alfabéticamente si no."""
    try:
        return (0, int(g["grade"]))
    except (ValueError, TypeError):
        return (1, str(g["grade"]))


# ============================================================================
# ESCRITURA A SUPABASE (PostgreSQL directo, atomico)
# ============================================================================
# Conecta directo a la DB Postgres de Supabase via el pooler. Hace TRUNCATE +
# bulk INSERT dentro de una sola transacción → atómico (todo o nada). Si algo
# falla a mitad, ROLLBACK y la DB queda exactamente como estaba antes.
#
# Tabla mapping:
#   grouped (lista de productos)
#     → products            (1 fila por producto)
#     → product_colors      (1 fila por producto × color)
#     → product_grades      (1 fila por producto × color × talla)
#     → product_stock       (1 fila por producto × color × talla × sucursal)

def _date(v):
    """Convierte fecha del API a string ISO YYYY-MM-DD o None.
    El API devuelve strings tipo '2024-04-26' o null."""
    if v is None or v == "":
        return None
    return str(v)[:10]


def write_to_supabase(grouped, api_ms, json_str=None):
    """Escribe el catálogo agrupado a Supabase en una transacción atómica.
    Si SUPABASE_DB_URL no está seteada, no hace nada (skip silencioso).
    Devuelve True si escribió, False si saltó.

    json_str: si se pasa, además de las 4 tablas normalizadas escribe el JSON
    agrupado completo a catalog_cache (es lo que lee el web app)."""

    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        print("   ⊘ SUPABASE_DB_URL no seteada, saltando escritura a Supabase")
        return False

    if not HAS_PSYCOPG2:
        print("   ⊘ psycopg2 no instalado, saltando escritura a Supabase", file=sys.stderr)
        return False

    print(f"[{datetime.now().isoformat(timespec='seconds')}] Escribiendo a Supabase...")
    t0 = time.time()

    # --- Aplanar la estructura agrupada a 4 listas de tuplas ---
    products_rows = []
    colors_rows   = []
    grades_rows   = []
    stock_rows    = []

    for p in grouped:
        products_rows.append((
            p["codFabrica"],
            p.get("id"),
            p.get("nmProduto"),
            p.get("marca"),
            p.get("grupo"),
            p.get("subgrupo"),
            p.get("colecao"),
            p.get("precioMinorista"),
            p.get("precioMinoristaPromo"),
            _date(p.get("precioMinoristaPromoInicio")),
            _date(p.get("precioMinoristaPromoValidade")),
            p.get("precioMayorista"),
            p.get("precioMayoristaPromo"),
            _date(p.get("precioMayoristaPromoInicio")),
            _date(p.get("precioMayoristaPromoValidade")),
            p.get("qMasVendio"),
            p.get("totalStock"),
        ))
        for c in p.get("colorsArr", []):
            colors_rows.append((
                p["codFabrica"],
                c["color"],
                c.get("imagen"),
                c.get("imgId"),
                c.get("totalStock"),
            ))
            for g in c.get("gradesArr", []):
                grades_rows.append((
                    p["codFabrica"],
                    c["color"],
                    g["grade"],
                    g.get("ean"),
                    g.get("totalStock"),
                ))
                for s in g.get("stock", []):
                    stock_rows.append((
                        p["codFabrica"],
                        c["color"],
                        g["grade"],
                        s.get("sucursal"),
                        int(s.get("cantidad") or 0),
                        _date(s.get("dataUltCmp")),
                        _date(s.get("dataUltVnd")),
                    ))

    print(f"   → {len(products_rows):,} products, {len(colors_rows):,} colors, "
          f"{len(grades_rows):,} grades, {len(stock_rows):,} stock rows")

    # --- TRUNCATE + INSERT en una sola transacción ---
    def _do():
        conn = psycopg2.connect(db_url, connect_timeout=15)
        try:
            with conn:  # commit al salir si OK, rollback si exception
                with conn.cursor() as cur:
                    # TRUNCATE con CASCADE: borra products + las 3 tablas hijas
                    # (CASCADE recorre las FKs ON DELETE CASCADE)
                    cur.execute(
                        "TRUNCATE products, product_colors, product_grades, product_stock "
                        "RESTART IDENTITY CASCADE"
                    )

                    if products_rows:
                        execute_values(cur, """
                            INSERT INTO products (
                              cod_fabrica, id, nm_produto, marca, grupo, subgrupo, colecao,
                              precio_minorista, precio_minorista_promo,
                              precio_minorista_promo_inicio, precio_minorista_promo_validade,
                              precio_mayorista, precio_mayorista_promo,
                              precio_mayorista_promo_inicio, precio_mayorista_promo_validade,
                              q_mas_vendio, total_stock
                            ) VALUES %s
                        """, products_rows, page_size=1000)

                    if colors_rows:
                        execute_values(cur, """
                            INSERT INTO product_colors
                              (cod_fabrica, color, imagen, img_id, total_stock)
                            VALUES %s
                        """, colors_rows, page_size=1000)

                    if grades_rows:
                        execute_values(cur, """
                            INSERT INTO product_grades
                              (cod_fabrica, color, grade, ean, total_stock)
                            VALUES %s
                        """, grades_rows, page_size=1000)

                    if stock_rows:
                        execute_values(cur, """
                            INSERT INTO product_stock
                              (cod_fabrica, color, grade, sucursal, cantidad,
                               data_ult_cmp, data_ult_vnd)
                            VALUES %s
                        """, stock_rows, page_size=1000)

                    # catalog_cache: fila única JSONB con la jerarquía
                    # completa. Es lo que lee el web app en runtime.
                    if json_str:
                        # El WHERE evita tocar updated_at cuando el catálogo
                        # quedó igual que la corrida anterior. El web app usa
                        # updated_at para decidir si vale la pena bajar los
                        # ~20 MB de JSON (fetchCatalogUpdatedAt_ en app.js);
                        # si lo pisábamos con NOW() cada hora aunque nada
                        # hubiera cambiado, todos los dispositivos se bajaban
                        # el catálogo entero igual. Comparar jsonb ignora
                        # orden de claves y espacios, así que sólo cuenta el
                        # contenido real.
                        cur.execute("""
                            INSERT INTO catalog_cache (id, data, updated_at)
                            VALUES (1, %s::jsonb, NOW())
                            ON CONFLICT (id) DO UPDATE
                              SET data = EXCLUDED.data,
                                  updated_at = NOW()
                            WHERE catalog_cache.data IS DISTINCT FROM EXCLUDED.data
                        """, (json_str,))
                        if cur.rowcount == 0:
                            print("   → catalog_cache sin cambios; updated_at "
                                  "intacto (los clientes reusan su cache)")
        finally:
            conn.close()

    with_retry(_do, "Supabase write")

    dur = time.time() - t0
    print(f"   ✓ Supabase OK en {dur:.1f}s")
    return True


def write_supabase_sync_log(status, info):
    """Registra el resultado del sync en la tabla sync_log de Supabase.
    Conexión separada para que un fallo en el log no rompa nada más."""
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url or not HAS_PSYCOPG2:
        return
    try:
        conn = psycopg2.connect(db_url, connect_timeout=10)
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO sync_log
                          (status, rows_api, products, api_ms, total_ms, error)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        status,
                        info.get("rowsApi"),
                        info.get("rows"),
                        info.get("apiMs"),
                        info.get("totalMs"),
                        info.get("error"),
                    ))
        finally:
            conn.close()
    except Exception as e:
        # No queremos que el log de error rompa el sync. Solo lo notamos.
        print(f"   ⚠ No se pudo escribir sync_log a Supabase: {e}", file=sys.stderr)


# ============================================================================
# MAIN
# ============================================================================

def main():
    creds_path = os.environ.get(
        "GOOGLE_APPLICATION_CREDENTIALS", "./service-account.json"
    )
    if not os.path.exists(creds_path):
        print(f"ERROR: credenciales no encontradas en {creds_path}", file=sys.stderr)
        print("       Descargar el JSON del Service Account y guardar como service-account.json")
        sys.exit(1)

    t_start = time.time()
    drive = authenticate(creds_path)

    api_ms = 0
    try:
        t_api = time.time()
        raw = fetch_products()
        api_ms = int((time.time() - t_api) * 1000)

        image_map = fetch_image_map(drive)

        print(f"[{datetime.now().isoformat(timespec='seconds')}] Agrupando...")
        t0 = time.time()
        grouped = group_raw(raw, image_map)
        json_str = json.dumps(grouped, ensure_ascii=False, default=str)
        print(f"   ✓ {len(grouped):,} productos · JSON {len(json_str)/1024:.0f} KB · {time.time()-t0:.1f}s")

        # Escritura a Supabase: tablas normalizadas + catalog_cache (JSONB).
        # Si SUPABASE_DB_URL no está seteada, no hace nada.
        write_to_supabase(grouped, api_ms, json_str=json_str)

        total_ms = int((time.time() - t_start) * 1000)
        write_supabase_sync_log("OK", {
            "rowsApi": len(raw),
            "rows": len(grouped),
            "apiMs": api_ms,
            "totalMs": total_ms,
        })
        print(f"\n✓ SYNC OK — {len(grouped):,} productos en {total_ms/1000:.1f}s")

    except Exception as e:
        total_ms = int((time.time() - t_start) * 1000)
        print(f"\n✗ SYNC FAILED: {e}", file=sys.stderr)
        write_supabase_sync_log("ERROR", {
            "rowsApi": 0,
            "rows": 0,
            "apiMs": api_ms,
            "totalMs": total_ms,
            "error": str(e)[:500],
        })
        raise


if __name__ == "__main__":
    main()
