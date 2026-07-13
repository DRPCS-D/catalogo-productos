---
tags: [moc, area/index]
aliases: [MOC, Mapa Central]
---

# 🗺️ MOC — Catálogo de Productos

> PWA de catálogo de productos. **GitHub Pages + Supabase + Python sync server**. Las fotos viven en Google Drive (servidas como thumbnails públicos).

## 📐 Arquitectura de un vistazo

```
API La Costa (HTTP) ──► [[Sync Server (Python)]] ──► [[Supabase Schema]] ──┐
                                                                           │
[[Google Drive Fotos]] ◄─ thumbnails lh3.googleusercontent ───────────────┐│
                                                                          ││
                                                    [[Index HTML]] ◄──────┴┴── carga vía [[Carga de Datos]]
                                                          │
                                  [[Service Worker]] ─────┤── intercepta fetch
                                                          │
                                      [[GitHub Pages]] ◄──┤── deploy desde [[GitHub Actions (pages.yml)]]
                                                          │
                                        [[PWA Manifests]] ┘── 3 variantes ([[Page Modes]])

[[PDF Service]] (LAN, Puppeteer) ──► renderiza el catálogo publicado ──► PDF
```

## 🧩 Componentes UI
- **Shell**: [[Header]] · [[Filter Bar]] · [[Sidebar]] · [[Bottom Nav]] · [[Update Banner]]
- **Vistas**: [[Gallery View]] · [[Table View]] · [[Modal Detalle]] · [[Lightbox]]
- **Controles**: [[Multi-Select]] · [[Confirm Dialog]]

## ⚙️ Features
- **Navegación**: [[Búsqueda y Filtros]] · [[Infinite Scroll]] · [[Escáner EAN]]
- **Selección**: [[Favoritos]] · [[Carrito]]
- **Exportación**: [[Exportar PDF Móvil]] · [[Exportar Excel]]
- **Estado app**: [[Sistema de Versiones]] · [[Auto-Update]] · [[Auto-Refresh]]
- **Negocio**: [[Promociones y Precios]] · [[Page Modes]] · [[Productos Similares]]

## 🗂️ Datos
- [[Supabase Schema]] — tablas `catalog_cache`, `page_config`, `admin_secret`, `products` + normalizadas, `sync_log`
- [[Sync Server (Python)]] — cron Docker
- [[Google Drive Fotos]] — imágenes (URL pública)
- Legacy: [[Apps Script (Code.gs)]] · [[Google Sheets]] (ya no en el pipeline activo)

## 🏗️ Infra
- [[GitHub Pages]] · [[GitHub Actions (pages.yml)]] · [[Seguridad y Secrets]]
- [[PDF Service]] — Puppeteer en Docker (LAN `192.168.90.19:3001`)

## 🎨 Diseño
- [[Estilos y Tema]] — Hanken Grotesk, `#2B4193`, radius `4px`

## 📒 Referencia rápida
- [[Glosario]] — variables JS globales, `localStorage` keys, CSS tokens
- [[Index HTML]] — mapa completo de secciones del monolito

## 📍 Mapa de líneas (rapid lookup)

| Tema | Archivo:L |
|---|---|
| CSS tokens (`--primary`, `--surface`, `--radius`) | `index.html:55–80` |
| Bottom nav (CSS) | `index.html:342–408` |
| Sticky header de tabla (`thead tr`) | `index.html:1366` |
| Bloque responsive ≤600px (compact) | `index.html:~3100–3140` |
| Config Supabase + `PAGE_CONFIGS` | `index.html:4106–4136` |
| Variables globales JS | `index.html:4250–4315` |
| `lc_price_mode` (restore / persist) | `index.html:4620 / 5396` |
| URL params `?suc= ?marca= ?foto=` | `index.html:4639–4720` |
| Refresh chip + ⚠️ sync warning | `index.html:4817 / 4838` |
| `APP_VERSION`, `APP_BUILD` | `index.html:4855–4856` |
| Force update + SW update flow | `index.html:4864–5010` |
| `_newSwWaiting` (SW state) | `index.html:4905` |
| Auto-scroll filtro (`scrollFilterToTop_`) | `index.html:5050` |
| `isUserBusy_` (safe-moment) | `index.html:5081` |
| Populate filtros | `index.html:5521` |
| `_productPassesFilters_` | `index.html:5757` |
| `applyFilters` | `index.html:5839` |
| Sort tabla | `index.html:6081–6088` |
| Render Tabla | `index.html:6100–6210` |
| Render Galería | `index.html:6226` |
| `buildGalleryCardHtml_` | `index.html:6453` |
| Modal detalle + similares | `index.html:6619–6860` |
| Popup EAN-13 (`openBarcodeModal_`) | `index.html:6931` |
| Escáner cámara (BarcodeDetector) | `index.html:6952–7090` |
| Switch view | `index.html:7202` |
| Favoritos (estado + render) | `index.html:7274–7420` |
| Carrito (estado + render + barcode btn) | `index.html:7424–7830` |
| `getActivePrice` (precios + promo) | `index.html:8152` |
| `normTxt_` (accent-insensitive) | `index.html:8267` |
| Excel totales por marca | `index.html:8385` |
| Excel principal | `index.html:8507` |
| PDF móvil (`generatePDFMobile` + PMO keys) | `index.html:8734 / 8850 / 8876` |
| `renderPdfCard_` | `index.html:9025` |
| Update banner (HTML) | `index.html:9121` |
| Service Worker | `sw.js:1–171` (`CACHE_VERSION` en L14) |

## 🧭 Convenciones

- **Wikilinks**: `[[Nombre exacto]]` (sin extensión). Los rojos = TODOs.
- **Mantenimiento**: si movés código, actualizá el rango `L…–…` en la nota afectada y en este mapa. Es la única regla.
- **Tags**: `tipo/componente`, `tipo/feature`, `tipo/data`, `area/frontend`, `area/backend`, `area/infra`.
- **No documentar lo obvio**: el qué-hace-cada-línea ya está en el código. Acá registramos **dónde vive** y **con qué se conecta**.
