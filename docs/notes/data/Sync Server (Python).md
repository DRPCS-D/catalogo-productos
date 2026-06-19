---
tags: [tipo/data, area/backend, tipo/cron]
aliases: [sync.py, Sync server]
---

# Sync Server (Python)

> Cron Docker que sincroniza: API La Costa (HTTP) → Google Sheets `_cache` → Supabase `catalog_cache`. ~52 MB / ~75k filas por corrida.

## 📍 Ubicación
- `sync-server/sync.py` (~27.8 KB) — orquestador
- `sync-server/Dockerfile`, `docker-compose.yml`, `crontab`, `entrypoint.sh`
- `sync-server/requirements.txt` — `psycopg2`, `requests`, `google-auth`

## 🎯 Flujo
1. **Fetch API** `http://api.lacostasrl.com.py:56181/productos` (~52 MB JSON).
2. **List Drive** folder de fotos → mapea `cod_producto` → `file_id`.
3. **Agrupa** flat → jerarquía producto → colores → talles → stock.
4. **Chunkea** JSON (45k chars/chunk) → escribe a hoja `_cache` de [[Google Sheets]].
5. **Anota** metadata en `_meta` (OK/ERROR + duración).
6. **Opcional**: escribe directamente a Supabase `catalog_cache` vía `psycopg2`.

## ⚙️ Config
- Service Account JSON — autenticación Google (`google-auth`).
- Connection string Supabase — `psycopg2`.
- Retry exponencial: 5s, 10s, 20s, 40s + jitter.
- Cron: `crontab` configurable (ej. cada 30 min, cada hora).

## 🔗 Referencias hardcodeadas
- Sheet ID
- Drive Folder ID (fotos)
- API URL La Costa

## 🔌 Depende de
- API La Costa (HTTP del ERP)
- [[Google Sheets]] (escribe `_cache` + `_meta`)
- [[Supabase Schema]] (escribe `catalog_cache`)

## 🔁 Consumido por
- [[Carga de Datos]] (indirectamente — lee Supabase que este pobla)

## ⚠️ Gotchas
- Si el API del ERP cambia el shape, **el cliente rompe silenciosamente** — la primera barrera es este sync. Loguear cambios de schema en `_meta`.
- Service Account JSON nunca al repo — ver [[Seguridad y Secrets]].
- 52 MB en cada corrida es pesado — considerar incremental si crece más.
