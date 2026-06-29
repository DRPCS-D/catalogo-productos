# Sync Server — Catálogo

Cron horario que sincroniza el catálogo desde la API HTTP del ERP a Supabase.
Corre en Docker, self-hosted.

**Por qué existe esto:** Apps Script tenía un límite de 50 MB en
`UrlFetchApp.fetch()`. Con los nuevos campos de precio el API crece más allá
de ese límite. Este script corre en tu propio server (Ubuntu + Docker) sin
ningún límite y escribe directo a Supabase.

---

## Flujo

1. **Fetch** del JSON de productos desde el API La Costa (`~52 MB`).
2. **List** de la carpeta de Drive con las fotos → mapea `cod_producto → file_id`.
3. **Group** plano → jerarquía `producto → color → grade → stock`.
4. **Write** a Supabase, en una sola transacción:
   - tablas normalizadas (`products`, `product_colors`, `product_grades`, `product_stock`)
   - `catalog_cache` (JSONB con la jerarquía completa — lo que lee el web app)
5. **Log** del resultado en `sync_log` (auditoría).

---

## Setup inicial

### 1) Service Account de Google (solo Drive)

1. Ir a [Google Cloud Console](https://console.cloud.google.com).
2. Seleccionar tu proyecto.
3. **APIs & Services → Library** → habilitar **Google Drive API**.
4. **IAM & Admin → Service Accounts → Create Service Account**.
   - Nombre: `catalog-sync` (o el que prefieras).
   - Continuar → omitir los roles opcionales → **Done**.
5. En la lista, click sobre el SA → **Keys → Add Key → Create new key → JSON → Create**.
6. Renombrar el archivo descargado a `service-account.json` y guardar en esta carpeta (`chmod 600`).
7. Anotar el email del SA (algo como `catalog-sync@PROJECT.iam.gserviceaccount.com`).

### 2) Compartir Drive con el Service Account

- Abrir la carpeta de Drive con las fotos (`1ZiSrtS6XK698C1rwd3Pn7zgT9nVog-7n`) → Compartir → pegar el email del SA → permiso **Lector** (Viewer) → enviar.

### 3) `.env` con la conexión a Supabase

Crear `sync-server/.env` (`chmod 600`, gitignored):

```
SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-...pooler.supabase.com:6543/postgres
```

La connection string sale del Supabase dashboard → Settings → Database → Connection pooling (modo `Transaction`).

### 4) Probar localmente

```bash
python -m venv .venv
source .venv/bin/activate         # Linux/Mac
.venv\Scripts\activate            # Windows

pip install -r requirements.txt
python sync.py
```

Output esperado:

```
[2026-06-01T15:00:00] Fetch API...
   ✓ 75,432 filas en 35.2s (52.1 MB)
[2026-06-01T15:00:35] Listing Drive folder...
   ✓ 20,433 archivos en 4.8s (21 páginas)
[2026-06-01T15:00:40] Agrupando...
   ✓ 612 productos · JSON 980 KB · 0.8s
[2026-06-01T15:00:41] Escribiendo a Supabase...
   → 612 products, 1,840 colors, 9,210 grades, 32,500 stock rows
   ✓ Supabase OK en 6.2s

✓ SYNC OK — 612 productos en 47.0s
```

### 5) Verificar

1. Supabase dashboard → Table Editor → `catalog_cache`: la fila `id=1` tiene `updated_at` reciente.
2. Tabla `sync_log`: una fila nueva con `status='OK'`.
3. Abrir el web app en ventana incógnito → debería cargar normalmente con los productos sincronizados.

---

## Correr en producción (Docker)

```bash
docker compose build
docker compose up -d
docker compose logs -f
```

Cron corre cada hora en el minuto 5 (ver `crontab`).

Para forzar una corrida adicional:

```bash
docker compose exec catalog-sync python sync.py
```

---

## Solución de problemas

| Error | Causa | Solución |
|---|---|---|
| `credenciales no encontradas` | Falta `service-account.json` | Descargarlo y ponerlo en esta carpeta |
| `403: The caller does not have permission` | No compartiste la carpeta Drive con el SA | Compartirla con permiso **Lector** |
| `ConnectionError` al API | El server del API no está accesible | Probar `curl http://api.lacostasrl.com.py:56181/productos` |
| `SUPABASE_DB_URL no seteada` | Falta `.env` | Crear el archivo con la connection string |
| `psycopg2.OperationalError: SSL...` | Pooler de Supabase rechaza | Verificar que la connection string sea la del pooler (puerto 6543) |

---

Concieved by Romuald Członkowski - www.aiadvisors.pl/en
