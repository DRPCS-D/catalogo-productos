---
tags: [tipo/data, area/backend]
aliases: [Code.gs, Apps Script]
---

# Apps Script (Code.gs)

> Script de Google Apps Script (~1271 líneas). **Gitignored** — vive solo en script.google.com. Procesamiento adicional, webhook admin, defaults de config (espejo de `PAGE_CONFIGS`).

## 📍 Ubicación
- **No** en el repo (gitignored — `.gitignore` lo excluye).
- Vive en `script.google.com` ligado a la hoja de Google Sheets ([[Google Sheets]]).
- Backup local sugerido: `Code.gs` en la raíz del proyecto (ignorado por git pero presente en disco).

## 🎯 Qué hace
- Triggers webhook desde el [[Admin HTML]] o desde la propia hoja (`onEdit`/`onChange`).
- Lee/escribe `_cache` y `_meta` en la hoja.
- Espejo de `PAGE_CONFIGS` (defaults de [[Page Modes]]) por si el cliente necesita hidratar config sin tocar Supabase.
- Auth del admin (opcional, paralela a `admin_secret`).

## 🔗 Recursos
- Hoja vinculada: ID definido en `sync.py` del [[Sync Server (Python)]].
- Endpoint webhook (URL `script.google.com/macros/s/.../exec`) — usado desde [[Admin HTML]].

## 🔌 Depende de
- [[Google Sheets]]
- [[Supabase Schema]] (puede espejar `catalog_cache`)

## ⚠️ Gotchas
- **Cambios en `Code.gs` no van por git** — para versionar, copiar el archivo local + commit manual a una carpeta `script-backups/` (ignorada por default).
- Triggers tienen quotas de Apps Script — si se llaman muchas veces seguidas pueden silenciarse.
- Si se rompe el script, [[Admin HTML]] puede quedar sin canal para algunas operaciones — fallback es escribir directo a Supabase.
