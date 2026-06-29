---
tags: [tipo/legacy, area/backend]
aliases: [Code.gs, Apps Script]
---

# Apps Script (Code.gs)

> **Histórico, fuera del pipeline activo.** Fue el runtime original del catálogo y el sync horario a Google Sheets. Reemplazado por GitHub Pages + Supabase + `sync.py`.

## 📍 Ubicación
- Código preservado en `docs/legacy/Code.gs` (versionado en el repo).
- El proyecto en `script.google.com` puede seguir publicado pero **sin triggers activos**.

## 🎯 Qué hacía (referencia histórica)
- Servía la web app vía `doGet` (reemplazado por [[GitHub Pages]] + `index.html`).
- Sincronizaba el catálogo de la API a [[Google Sheets]] `_cache` (reemplazado por [[Sync Server (Python)]] → [[Supabase Schema]]).
- Autenticaba el panel admin con bcrypt + hoja `_users` (reemplazado por `admin.html` + tabla `admin_secret` en Supabase).
- Mantenía la hoja `_config` con los modos del catálogo (reemplazado por tabla `page_config` en Supabase).

## 🔌 Migración
- Runtime cliente → [[Carga de Datos]] (lee Supabase REST directo).
- Sync batch → [[Sync Server (Python)]] (escribe Supabase + `catalog_cache` JSONB).
- Auth admin → bcrypt comparado contra `admin_secret` desde [[Admin HTML]].
- Configs modo → [[Supabase Schema]] tabla `page_config`.

## ⚠️ Operación pendiente
- Desactivar el trigger horario en `script.google.com` (manual, una vez).
- La hoja vinculada en [[Google Sheets]] puede archivarse — ya no se escribe.
