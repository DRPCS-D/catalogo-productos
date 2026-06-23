---
tags: [moc, area/index]
aliases: [MOC, Mapa Central]
---

# 🗺️ MOC — Catálogo de Productos

> PWA de catálogo de productos. **GitHub Pages + Supabase + Google Sheets + Apps Script + Python sync server**.

## 📐 Arquitectura de un vistazo

```
API La Costa (HTTP) ──► [[Sync Server (Python)]] ──► [[Google Sheets]] ──► [[Supabase Schema]] ──┐
                                                                                                 │
[[Google Drive Fotos]] ◄─ thumbnails lh3.googleusercontent ─────────────────────────────────────┐│
                                                                                                ││
                                                                          [[Index HTML]] ◄──────┴┴── carga vía [[Carga de Datos]]
                                                                                │
                                                       [[Service Worker]] ──────┤── intercepta fetch
                                                                                │
                                                            [[GitHub Pages]] ◄──┤── deploy desde [[GitHub Actions (pages.yml)]]
                                                                                │
                                                              [[PWA Manifests]] ┘── 3 variantes ([[Page Modes]])
```

## 🧩 Componentes UI
- **Shell**: [[Header]] · [[Filter Bar]] · [[Sidebar]] · [[Update Banner]]
- **Vistas**: [[Gallery View]] · [[Table View]] · [[Modal Detalle]] · [[Lightbox]]
- **Controles**: [[Multi-Select]] · [[Confirm Dialog]]

## ⚙️ Features
- **Navegación**: [[Búsqueda y Filtros]] · [[Infinite Scroll]]
- **Exportación**: [[Exportar PDF Móvil]] · [[Exportar Excel]]
- **Estado app**: [[Sistema de Versiones]] · [[Auto-Update]] · [[Auto-Refresh]]
- **Negocio**: [[Promociones y Precios]] · [[Page Modes]] · [[Productos Similares]]

## 🗂️ Datos
- [[Supabase Schema]] — tablas `catalog_cache`, `page_config`, `admin_secret`
- [[Apps Script (Code.gs)]] · [[Google Sheets]] · [[Google Drive Fotos]]
- [[Sync Server (Python)]] — cron Docker

## 🏗️ Infra
- [[GitHub Pages]] · [[GitHub Actions (pages.yml)]] · [[Seguridad y Secrets]]

## 🎨 Diseño
- [[Estilos y Tema]] — Hanken Grotesk, `#2B4193`, radius `4px`

## 📒 Referencia rápida
- [[Glosario]] — variables JS globales, `localStorage` keys, CSS tokens
- [[Index HTML]] — mapa completo de secciones del monolito

## 📍 Mapa de líneas (rapid lookup)

| Tema | Archivo:L |
|---|---|
| CSS tokens (`--primary`, `--surface`, `--radius`) | `index.html:55–80` |
| Config Supabase + `PAGE_CONFIGS` | `index.html:2748–2814` |
| Variables globales JS | `index.html:2892–2933` |
| Carga de datos | `index.html:3047–3222` |
| Auto-refresh + refresh chip | `index.html:3249–3300` |
| `APP_VERSION`, `APP_BUILD` | `index.html:3312–3313` |
| Force update + SW update flow | `index.html:3321–3425` |
| `_newSwWaiting` (SW state) | `index.html:3362` |
| Auto-scroll filtro (`scrollFilterToTop_`) | `index.html:3502` |
| `isUserBusy_` (safe-moment) | `index.html:3533` |
| Populate filtros | `index.html:3901` |
| `_productPassesFilters_` | `index.html:4075` |
| `applyFilters` | `index.html:4138` |
| Sidebar toggle | `index.html:4320` |
| Sort tabla | `index.html:4374–4388` |
| Render Tabla | `index.html:4393–4515` |
| Render Galería | `index.html:4519–4620` |
| `buildGalleryCardHtml_` | `index.html:4554` |
| Modal detalle + similares | `index.html:4716–5025` |
| Switch view | `index.html:5026–5066` |
| Precios + promo (`getActivePrice`) | `index.html:5086+` |
| `normTxt_` (accent-insensitive) | `index.html:5201` |
| Excel totales por marca | `index.html:5315` |
| Excel principal | `index.html:5432` |
| PDF localStorage keys (`pmo_print_scale`, `pmo_photo_h`) | `index.html:5765–5812` |
| Update banner (HTML) | `index.html:6024` |
| Service Worker | `sw.js:1–171` (`CACHE_VERSION` en L15) |

## 🧭 Convenciones

- **Wikilinks**: `[[Nombre exacto]]` (sin extensión). Los rojos = TODOs.
- **Mantenimiento**: si movés código, actualizá el rango `L…–…` en la nota afectada y en este mapa. Es la única regla.
- **Tags**: `tipo/componente`, `tipo/feature`, `tipo/data`, `area/frontend`, `area/backend`, `area/infra`.
- **No documentar lo obvio**: el qué-hace-cada-línea ya está en el código. Acá registramos **dónde vive** y **con qué se conecta**.
