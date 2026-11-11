# Catálogo de Productos — Manual de estructura

Documento de referencia para entender y reconstruir la app **sin tener que mirar Supabase**.
**Regla: cada cambio (tablas, funciones, claves, servidores, flujos) se agrega al final en "Registro de cambios" y se refleja en la sección que corresponda.** El esquema SQL vive en `supabase/schema.sql` y debe actualizarse junto con este manual.

> Este archivo es público (repo en GitHub). No escribir aquí contraseñas, PIN, claves `service_role`, la contraseña de la base ni cadenas de conexión reales.

---

## 1. Visión general

```
ERP "gestor" (API HTTP, ~72 MB JSON)
        │  cada hora, minuto :05
        ▼
sync-server (Docker, Ubuntu "lacostasrl")  ── escribe por conexión directa Postgres ──►  Supabase (Postgres)
        │  también lista fotos en Google Drive (service account)                              ▲  ▲  ▲
        ▼                                                                                      │  │  │ RPC con clave anon
   catálogos JSON por vista                                            PWA (GitHub Pages/Vercel) ┘  │  │
                                                              pdf-service (Docker, Ubuntu) ──────────┘  │
                                                                      Web Rock Sport / compañero ───────┘
```

| Pieza | Dónde | Qué hace |
|---|---|---|
| **PWA** (`index.html`, `app.js`, `style.css`, `sw.js`, `manifest*.json`) | GitHub Pages y Vercel (auto-deploy al hacer push a `main`) | Catálogo para vendedores/clientes. Cuatro vistas: `general`, `mayorista`, `mayorista1`, `minorista`. |
| **Panel admin** (`admin.html`) | mismo hosting | Edita `page_config` (título, sucursales, marcas excluidas…) con el PIN de admin. |
| **sync-server** (`sync-server/`) | Docker en el servidor Ubuntu `diago@lacostasrl`, carpeta `~/sync-server` | Baja la API del ERP, agrupa productos, lista Drive y escribe en Supabase cada hora. |
| **pdf-service** (`pdf-service/`) | Docker en el mismo servidor, carpeta `/home/diago/docker/pdf-service`, puerto 3001 | Genera PDFs (Chromium) y sirve el bot de WhatsApp (`/MARCAS`, `/stock`, etc.). Lee Supabase solo por RPC. |
| **Supabase** | Proyecto Free, región sa-east-1 (São Paulo) | Postgres con RLS + funciones `SECURITY DEFINER`. Sin uso de Edge Functions, Auth de usuarios ni Storage (el panel de uso los muestra en 0). |
| **n8n** | instancia propia | Agente de ventas (hoy inactivo) que usa `buscar_productos_retail`; bot de WhatsApp para PDFs vía Evolution API. |

Deploy de servidores: el usuario copia los archivos por WinSCP y ejecuta `docker compose up -d --build` (los archivos van dentro de la imagen, no se montan).

---

## 2. Base de datos (Supabase, schema `public`)

SQL completo y ejecutable en **`supabase/schema.sql`** (config inicial de vistas en `supabase/seed-page_config.sql`).
Extensiones: `pgcrypto`, `unaccent`, `uuid-ossp` (schema `extensions`). Sin tabla de usuarios: el acceso es por contraseña compartida + PIN de admin.

### 2.1 Tablas

| Tabla | Filas aprox. | Para qué | Quién escribe | Quién lee |
|---|---|---|---|---|
| `catalog_mode_cache` (PK `mode`) | 4 | Catálogo completo en JSON por vista: `general`, `mayorista`, `mayorista1`, `minorista`. ~22 MB. | sync.py | app vía `get_catalog_mode` |
| `catalog_cache` (id=1) | 1 | Catálogo legado (versión anterior). | sync.py | nadie activo (se conserva) |
| `page_config` (PK `mode`) | 4 | Config por vista: título, `price_mode`, `sucursales`, `marcas_excluidas`, `promo_visible`, `locked`, `restrict_modal_sucursales`. | admin vía `save_page_config` | app (SELECT público) y `buscar_productos_retail` |
| `products` / `product_colors` / `product_grades` / `product_stock` | ~12.7k / 16.6k / 51.8k / 99.4k | Datos normalizados (producto → color → talle → stock por sucursal). Se actualizan **cada hora de forma incremental**: solo se insertan/actualizan las filas nuevas o cambiadas y se borran las que ya no vienen (una transacción). | sync.py | `buscar_productos_retail` (agente n8n) |
| `web_catalog` (PK `cod_fabrica`) | ~10.4k | Versión compacta **solo minorista** para la API pública paginada; columnas de búsqueda/orden + JSON `data`. | trigger `web_catalog_refresh` | `get_products_page`, `get_products_filters` |
| `sync_log` | crece | Un registro por sincronización (estado, filas, tiempos, error). | sync.py | lectura pública |
| `access_secret`, `access_secret_mode`, `admin_secret` | 1 / 1 / 1 | **Hashes bcrypt** de contraseñas de acceso y PIN. RLS sin políticas: solo vía funciones. | manual (ver §5) | funciones `SECURITY DEFINER` |

Relaciones: `product_colors → products`, `product_grades → product_colors`, `product_stock → product_grades` (todas `ON DELETE CASCADE`).

### 2.2 Funciones (RPC)

Todas se llaman por `POST {SUPABASE_URL}/rest/v1/rpc/<nombre>` con la clave anon.

| Función | Acceso | Descripción |
|---|---|---|
| `get_catalog_mode(p_mode, pw)` | contraseña de la vista | Devuelve el JSON del catálogo de esa vista. |
| `get_catalog_version(p_mode, pw)` | contraseña | Solo `updated_at`; la app lo usa para saber si recargar (caché IndexedDB 1 h). |
| `verify_access_password(pw)` / `verify_access_password_mode(p_mode, pw)` | pública | ¿Es correcta la contraseña? |
| `verify_admin_pin(pin)` | pública | ¿Es correcto el PIN admin? |
| `admin_catalog_meta(pin)` | PIN | Lista de marcas y sucursales para el panel. |
| `save_page_config(pin, p_mode, p_config)` | PIN | Inserta/actualiza `page_config`. |
| `get_products_page(p_page, p_size, p_search, p_marca, p_grupo, p_sucursal, p_sucursales[], p_excluir_subgrupos[])` | **sin contraseña** | API pública paginada (minorista). Ver `API-productos-web.md`. Orden: más vendido, nombre, cod_fabrica. |
| `get_products_filters()` | sin contraseña | Marcas, grupos, subgrupos y sucursales disponibles. |
| `buscar_productos_retail(...)` | pública | Búsqueda sobre tablas normalizadas con config de `minorista` (agente n8n). |
| `refresh_web_catalog(p_data, p_updated)` | interna | Upsert incremental de `web_catalog` + borrado de los que ya no están. |
| `trg_refresh_web_catalog()` | interna | Trigger: llama a `refresh_web_catalog`. |
| `catalog_mode_pw_ok_(p_mode, pw)` | interna | `general/mayorista/minorista` → `access_secret`; `mayorista1` → `access_secret_mode`. |
| `_web_restrict(p_data, p_sucs[])` | interna | Filtra stock por sucursales en un producto de `web_catalog`. |

**Trigger:** `web_catalog_refresh` en `catalog_mode_cache` (AFTER INSERT/UPDATE, solo `mode='minorista'`) → mantiene `web_catalog` sincronizada.

### 2.3 Seguridad
- La clave **anon** es pública (está en `app.js`, `admin.html`, `pdf-service/server.js`). Lo que protege los datos es RLS + funciones con contraseña/PIN.
- Tablas con RLS activa; solo `page_config` y `sync_log` tienen política de lectura pública. Las demás solo se leen vía funciones.
- La **cadena de conexión directa** (`SUPABASE_DB_URL`) y la clave `service_role` **nunca** van al repo ni a un cliente: solo en el `.env` del servidor de sync.
- Anon tiene `statement_timeout` de 3 s.

---

## 3. Sincronización (`sync-server/`)

- **Fuente de datos:** `API_URL` en `sync.py` (hoy `http://lacosta.gestor.eti.br:56181/productos`; alternativa equivalente `api.lacostasrl.com.py`, misma IP). ~72 MB, sin gzip, cada llamada tarda 60–130 s por cálculo del servidor; `limite` máximo 500. **No paginar:** una sola llamada es lo más rápido.
- **Fotos:** lista la carpeta de Google Drive con una service account (`service-account.json`, montada de solo lectura).
- **Salida:** 4 catálogos JSON en `catalog_mode_cache` (cada uno solo se reescribe si cambió) + tablas normalizadas (upsert incremental con tablas temporales; antes TRUNCATE+INSERT de ~180k filas por hora) + `sync_log`.
- **Programación:** cron cada hora en el minuto :05 (hora Paraguay), dentro del contenedor. Dura ~5–6 min.
- **Protecciones** (desde 2026-11-10): `flock` (no se solapan corridas; si la anterior sigue, se salta y lo escribe), `timeout 45m`, `python -u` (log sin buffer), keepalives TCP y `lock_timeout 60 s` / `statement_timeout 10 min` en la escritura a Postgres.
- **Config:** `sync-server/.env` (solo en el servidor, chmod 600) con `SUPABASE_DB_URL` (pooler de sesión, puerto 5432). `entrypoint.sh` regenera el crontab al arrancar inyectando esas variables (cron no hereda el entorno).
- **Logs:** `docker logs -t catalog-sync --tail 30`. Fin correcto: "SYNC OK". Las horas entre corchetes son hora de Paraguay (UTC-3); las del prefijo `-t` son UTC.
- **Archivos:** `sync.py`, `entrypoint.sh`, `crontab`, `Dockerfile`, `docker-compose.yml`, `requirements.txt`, `README.md`.

## 4. Otros componentes

- **PWA:** `app.js` carga el catálogo con `get_catalog_mode`, lo guarda en IndexedDB (1 h) y revisa `get_catalog_version`. Filtros y búsqueda se hacen en el cliente (`applyFilters`). `sw.js` es el service worker; el sistema de versiones fuerza la actualización. La vista se elige por manifest/URL.
- **pdf-service:** `server.js` (Node + Chromium). Rutas: `/health`, `/brands`, `/collections`, `/stock`, `/pdf`, `/pdf/normal`. Lee Supabase solo por RPC con la clave anon (constantes al inicio de `server.js`). `deploy.bat` copia y reconstruye por SSH.
- **API pública para la web / compañeros:** `API-productos-web.md` (solo la URL y la anon larga `eyJ…`; sin contraseña).
- **Notas históricas** en `docs/notes/` (Obsidian). Algunas están desactualizadas (p. ej. "Supabase Schema" describe solo 3 tablas); **este manual manda**.

## 5. Secretos: cómo recrearlos (sin escribirlos aquí)

Las contraseñas están como hash en `access_secret`, `access_secret_mode` y `admin_secret`. Para fijarlas en un proyecto nuevo, ejecutar en el SQL Editor (con valores reales elegidos por el usuario; no guardarlos en el repo):

```sql
insert into access_secret (id, pw_hash) values (1, extensions.crypt('<CONTRASEÑA_GENERAL>', extensions.gen_salt('bf')))
  on conflict (id) do update set pw_hash = excluded.pw_hash, updated_at = now();
insert into access_secret_mode (mode, pw_hash) values ('mayorista1', extensions.crypt('<CONTRASEÑA_MAYORISTA1>', extensions.gen_salt('bf')))
  on conflict (mode) do update set pw_hash = excluded.pw_hash, updated_at = now();
insert into admin_secret (id, pin_hash) values (1, extensions.crypt('<PIN_ADMIN>', extensions.gen_salt('bf')))
  on conflict (id) do update set pin_hash = excluded.pin_hash, updated_at = now();
```

## 6. Checklist para mover la app a otro proyecto de Supabase

1. Crear el proyecto (misma región sa-east-1 si es posible).
2. Ejecutar `supabase/schema.sql`, luego `supabase/seed-page_config.sql`.
3. Fijar contraseñas y PIN (§5).
4. Cambiar `SUPABASE_DB_URL` en `sync-server/.env` (conexión de pooler de sesión, puerto 5432) y reconstruir el contenedor; esperar la primera sincronización ("SYNC OK") para que se llenen los catálogos y tablas.
5. Cambiar **URL y clave anon** en: `app.js` (líneas 6–7), `admin.html` (~línea 600), `pdf-service/server.js` (líneas 59–60), `API-productos-web.md`. Subir la PWA (push a `main`) y reconstruir `pdf-service`.
6. Avisar a quien consuma la API (web de Rock Sport, compañero) de la nueva URL y clave anon.
7. Credenciales de n8n que apunten a Supabase (agente de ventas, hoy inactivo).
8. Probar: abrir cada vista de la PWA con su contraseña, `get_products_page` desde `curl`, `/brands` y `/pdf` del bot.
9. Mantener el proyecto viejo unos días como respaldo y luego eliminarlo.

## 7. Operación y diagnóstico

- **Tamaño de la base:** `pg_database_size` vs suma de `pg_total_relation_size` (ver historial abajo). Las tablas reales suman ~94 MB; el excedente es espacio huérfano de escrituras interrumpidas.
- **Egress:** lo consume sobre todo la descarga del catálogo (22 MB por vista, con caché de 1 h) y la API pública.
- **Sync caída:** revisar `docker logs` y la tabla `sync_log` (`select * from sync_log order by ts desc limit 10`).

---

## Registro de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-11 | `sync.py`: las 4 tablas normalizadas pasan de TRUNCATE+INSERT a **upsert incremental** (tabla temporal + `INSERT … ON CONFLICT DO UPDATE … WHERE … IS DISTINCT FROM` + borrado de lo que ya no viene). Motivo: la reescritura total dejaba mucho espacio muerto (la base nueva pasó de 72 a 87 MB en pocas horas con datos iguales). Lógica probada en Supabase con rollback: corrida sin cambios = 0 filas escritas; cambio, alta y baja de producto con hijos correctos. |
| 2026-11-11 | **Migración a un proyecto nuevo de Supabase** (cuenta nueva, `catalogo-productos`, ref `hyjshnfeioabpqqlvmmt`, sa-east-1): esquema aplicado desde `supabase/schema.sql`, contraseñas/PIN fijados a mano, primera sincronización OK (base de 72 MB frente a 334 MB). `app.js`, `admin.html`, `pdf-service/server.js` y `API-productos-web.md` apuntan al nuevo; `sync-server/.env` con la nueva `SUPABASE_DB_URL`. App 1.41.0, `sw.js` v129. El proyecto viejo (`bjquqvjdwvbimsffpbmh`) queda como respaldo temporal. |
| 2026-11-11 | Creado este manual y `supabase/schema.sql` / `supabase/seed-page_config.sql` extrayendo el esquema del proyecto original. |
| 2026-11-10 | `sync.py`: API apunta a `lacosta.gestor.eti.br`; keepalives TCP, `lock_timeout`/`statement_timeout`; `crontab`/`entrypoint.sh`: `flock`, `timeout 45m`, `python -u`. |
| 2026-11-09/10 | `web_catalog` (tabla compacta) + `refresh_web_catalog` incremental + trigger; funciones `get_products_page` y `get_products_filters` (API pública paginada, filtros por sucursal/subgrupo, stock por sucursal y por talle). Orden estable con desempate por `cod_fabrica`; comparaciones con `lower(btrim())`. |
| 2026-11-10/11 | Investigación del tamaño de la base: tablas ~94 MB estables; excedente huérfano 131 → 206 → 240 MB tras reinicios de Postgres (9 nov 19:11 UTC y 10 nov 22:10 UTC). Ticket a soporte de Supabase preparado. |
