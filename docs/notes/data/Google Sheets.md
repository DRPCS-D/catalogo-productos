---
tags: [tipo/legacy, area/backend]
aliases: [Sheets]
---

# Google Sheets

> **Histórico, fuera del pipeline activo.** Era intermediario entre el sync y Supabase. El sync ahora escribe directo a Supabase.

## 📍 Ubicación
- Sheet ID estaba en `sync-server/sync.py`. Removido al limpiar el sync.

## 🗂️ Hojas (referencia histórica)
- `_cache` — JSON troceado en chunks de 45k chars (límite de celda).
- `_meta` — logs del sync.
- Otras hojas (productos, marcas, _config, _users) — datos manejados por el antiguo [[Apps Script (Code.gs)]].

## ⚠️ Estado actual
- El sync ya no escribe a `_cache` / `_meta`.
- La hoja puede archivarse o eliminarse — ningún componente activo la lee.
- Si alguien necesita el JSON agrupado, el source-of-truth es la tabla `catalog_cache` de [[Supabase Schema]].
