---
tags: [tipo/data, area/backend]
aliases: [Sheets]
---

# Google Sheets

> Hoja vinculada al proyecto. Sirve como intermediario entre el sync server y Supabase, y como backup human-readable de los datos.

## 📍 Ubicación
- Sheet ID en `sync-server/sync.py` (no replicar acá)

## 🗂️ Hojas
- **`_cache`** — JSON troceado en chunks de 45k chars (limite por celda). Una columna `chunk_id`, otra `data`.
- **`_meta`** — logs del sync (timestamp, status, duración, errores).
- Otras hojas (productos, marcas, etc.) — datos source-of-truth para el equipo comercial.

## 🔌 Depende de
- [[Sync Server (Python)]] (escribe `_cache` y `_meta`)
- [[Apps Script (Code.gs)]] (puede leer/escribir)

## 🔁 Consumido por
- [[Supabase Schema]] (el sync espeja desde acá a `catalog_cache`)
- [[Apps Script (Code.gs)]]

## ⚠️ Gotchas
- Si alguien edita manualmente las hojas source y el sync sobreescribe — coordinar antes de tocar.
- El troceado en `_cache` necesita reensamblarse en el orden correcto (`chunk_id` ASC).
