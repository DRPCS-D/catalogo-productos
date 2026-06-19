---
tags: [tipo/archivo, area/frontend]
aliases: [admin.html]
---

# Admin HTML

> Panel admin separado (`admin.html`, ~871 líneas). Autenticación con PIN (bcrypt vs `admin_secret` en Supabase) + escritura directa a `page_config` y `catalog_cache`.

## 📍 Ubicación
- `admin.html` (raíz del repo) — todo el panel
- Se sirve desde `https://<usuario>.github.io/<repo>/admin.html`

## 🎯 Qué hace
- Login con PIN — `bcrypt.compare()` contra hash en `admin_secret`.
- Editor de `page_config` por modo (mayorista / minorista / general).
- Forzar invalidación de `catalog_cache`.
- Visor de logs de sync (lee `_meta` indirectamente vía Supabase si está espejado).
- **🔗 Generador de links por sucursal** — card "Links rápidos" debajo de las 3 cards de modo. Combina `?mode=` + `?suc=` y devuelve URL copiable. Implementación: `renderQuickLinks_()` / `buildQuickLink_()`. Ver [[Page Modes]].

## 🔗 Variables / IDs / clases
- HTML: `#login-form`, `#admin-panel`, `#config-editor`
- JS: usa la misma `SUPABASE_URL` + `SUPABASE_ANON_KEY` que `index.html` (RLS protege la escritura a tablas admin)

## 🔌 Depende de
- [[Supabase Schema]] — `admin_secret`, `page_config`
- [[Seguridad y Secrets]]

## ⚠️ Gotchas
- La RLS de Supabase debe permitir SELECT a `admin_secret` solo cuando el PIN matchea — verificar policies si falla el login.
- `bcrypt` corre en cliente: librería incluida vía CDN.
