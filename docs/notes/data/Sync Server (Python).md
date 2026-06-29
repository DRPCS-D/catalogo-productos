---
tags: [tipo/data, area/backend, tipo/cron]
aliases: [sync.py, Sync server]
---

# Sync Server (Python)

> Cron Docker que sincroniza: API La Costa (HTTP) → Supabase. ~52 MB / ~75k filas por corrida.

## 📍 Ubicación
- `sync-server/sync.py` — orquestador
- `sync-server/Dockerfile`, `docker-compose.yml`, `crontab`, `entrypoint.sh`
- `sync-server/requirements.txt` — `psycopg2`, `requests`, `google-auth`, `google-api-python-client`

## 🎯 Flujo
1. **Fetch API** `http://api.lacostasrl.com.py:56181/productos` (~52 MB JSON).
2. **List Drive** folder de fotos → mapea `cod_producto` → `file_id`.
3. **Group** flat → jerarquía producto → colores → talles → stock.
4. **Write Supabase** en una transacción atómica:
   - Tablas normalizadas: `products`, `product_colors`, `product_grades`, `product_stock`.
   - `catalog_cache` (JSONB con la jerarquía completa — lo que lee el web app).
5. **Log** del resultado en `sync_log` (auditoría).

## ⚙️ Config
- Service Account JSON — autenticación Google Drive (scope `drive.readonly`).
- Connection string Supabase — `SUPABASE_DB_URL` en `.env` (modo pooler `Transaction`).
- Retry exponencial: 5s, 10s, 20s, 40s + jitter.
- Cron: `crontab` configurable (default cada hora, minuto 5).

## 🔗 Referencias hardcodeadas
- Drive Folder ID (fotos) — en `sync.py`.
- API URL La Costa — en `sync.py`.

## 🖥️ Host de producción
- Server: `diago@lacostasrl` (Ubuntu). **Sólo accesible desde la LAN interna** — el hostname no resuelve fuera de la red local. Para deploy hay que estar conectado a la red de la oficina (o vía VPN si hay).
- Ruta remota: `~/sync-server/` (= `/home/diago/sync-server/`).
- Deploy de cambios (desde Windows local, dentro de la LAN):
  ```bash
  scp "E:/claude/Productos/sync-server/sync.py" diago@lacostasrl:~/sync-server/
  scp "E:/claude/Productos/sync-server/README.md" diago@lacostasrl:~/sync-server/
  ```
- Reinicio del cron en el server:
  ```bash
  cd ~/sync-server
  docker compose down && docker compose build && docker compose up -d
  docker compose logs -f
  ```
- Forzar una corrida manual:
  ```bash
  docker compose exec catalog-sync python sync.py
  ```

## 🔌 Depende de
- API La Costa (HTTP del ERP)
- [[Google Drive Fotos]] (listing para mapear `cod` → `file_id`)
- [[Supabase Schema]] (escribe tablas + `catalog_cache` + `sync_log`)

## 🔁 Consumido por
- [[Carga de Datos]] (indirectamente — lee Supabase que este pobla)

## ⚠️ Gotchas
- Si el API del ERP cambia el shape, **el cliente rompe silenciosamente** — la primera barrera es este sync. La fila más reciente de `sync_log` con `status='ERROR'` lo delata.
- Service Account JSON nunca al repo — ver [[Seguridad y Secrets]].
- 52 MB en cada corrida es pesado — considerar incremental si crece más.
