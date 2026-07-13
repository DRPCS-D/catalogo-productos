---
tags: [tipo/archivo, area/frontend]
aliases: [index.html, Monolito]
---

# Index HTML

> Monolito **~9130 líneas** con HTML + CSS + JS inline. Esta nota es el mapa de secciones para grep dirigido.

## 📍 Mapa de secciones

| Rango | Sección | Nota |
|---|---|---|
| 49–104 | CSS tokens, reset, Hanken Grotesk | [[Estilos y Tema]] |
| 342–408 | CSS bottom nav | [[Bottom Nav]] |
| 614–628 | CSS `.cart-line-barcode` | [[Carrito]] |
| 1351–1370 | CSS tabla (`.table-wrap` clip + `thead` sticky) | [[Table View]] |
| 2572+ | CSS escáner de código de barra | [[Escáner EAN]] |
| ~3070–3300 | Bloques responsive (≤600px compact, tablet) | [[Estilos y Tema]] |
| 3680–3745 | Header (⚠️ sync, refresh chip, btns vista, chips) | [[Header]] |
| 3709–3735 | `#bottom-nav` (HTML) | [[Bottom Nav]] |
| 3742–3760 | Search input + botón escanear | [[Filter Bar]] · [[Escáner EAN]] |
| 3765–3890 | Sidebar (filtros + switch PDF sin precio + pie con `app-version`) | [[Sidebar]] |
| 3937 / 3948 | Sentinels de tabla y galería | [[Infinite Scroll]] |
| 3946 | `#gallery-container` (grid de cards) | [[Gallery View]] |
| 3955 / 3967 | `#favorites-view` / `#cart-view` | [[Favoritos]] · [[Carrito]] |
| 3997 | `#modal` (modal-overlay) | [[Modal Detalle]] |
| 4013 | `#lightbox` | [[Lightbox]] |
| 4067 | `#barcode-overlay` (popup EAN-13) | [[Escáner EAN]] |
| 4106–4136 | Config Supabase + `PAGE_CONFIGS` | [[Carga de Datos]] · [[Page Modes]] |
| 4250–4315 | Variables globales JS | [[Glosario]] |
| 4496–4720 | Data loading (Supabase fetch, sync_log, URL params) | [[Carga de Datos]] |
| 4620 / 5396 | `lc_price_mode` restore / persist | [[Búsqueda y Filtros]] |
| 4769–4838 | `silentRefresh_` + `updateRefreshChip` + `updateSyncWarningIcon_` | [[Auto-Refresh]] · [[Header]] |
| 4855–4856 | `APP_VERSION`, `APP_BUILD` | [[Sistema de Versiones]] |
| 4864–5010 | `forceUpdateApp_` + `initAppAutoUpdate_` + `activateNewSwAndReload_` | [[Auto-Update]] |
| 4970 | `relativeTime_` (relativo "hace X") | [[Auto-Refresh]] |
| 5050 | `scrollFilterToTop_` (auto-scroll de sidebar) | [[Sidebar]] · [[Multi-Select]] |
| 5081 | `isUserBusy_` (gate de auto-update) | [[Auto-Update]] |
| 5521 | `populateFilters` | [[Búsqueda y Filtros]] |
| 5579+ | `buildMultiSelect` | [[Multi-Select]] |
| 5757 | `_productPassesFilters_` | [[Búsqueda y Filtros]] |
| 5839 | `applyFilters` | [[Búsqueda y Filtros]] |
| 6025 | `toggleSidebar` | [[Sidebar]] |
| 6081–6088 | `sortBy` + `updateSortHeaders` | [[Table View]] |
| 6100–6210 | Render Tabla + `appendNextTableBatch` | [[Table View]] · [[Infinite Scroll]] |
| 6226–6510 | Render Galería + `buildGalleryCardHtml_` + `appendNextGalleryBatch` | [[Gallery View]] · [[Infinite Scroll]] |
| 6619–6860 | Modal detalle + productos similares | [[Modal Detalle]] · [[Productos Similares]] |
| 6931–6943 | `openBarcodeModal_` / `closeBarcodeModal_` | [[Escáner EAN]] |
| 6952–7090 | Escáner cámara (`BarcodeDetector`, diagnóstico) | [[Escáner EAN]] |
| 7202–7250 | `switchView` + `toggleView_` + `openCartView_` + `openFavView_` | [[Header]] · [[Bottom Nav]] |
| 7274–7420 | Favoritos (load/save/toggle/clear/render) | [[Favoritos]] |
| 7424–7830 | Carrito (load/save/render/eventos/barcode) | [[Carrito]] |
| 7976 | `renderCartPdf_` | [[Carrito]] |
| 8152 | `getActivePrice` (lógica de promo) | [[Promociones y Precios]] |
| 8267 | `normTxt_` (NFD accent-insensitive) | [[Búsqueda y Filtros]] |
| 8385 | `exportToExcelTotalsByMarca_` | [[Exportar Excel]] |
| 8507 | `exportToExcel` | [[Exportar Excel]] |
| 8734 | `generatePDFMobile` | [[Exportar PDF Móvil]] |
| 8850 / 8876 | PDF móvil — `localStorage` keys (`pmo_print_scale`, `pmo_img_height`) | [[Exportar PDF Móvil]] |
| 9025 | `renderPdfCard_` | [[Exportar PDF Móvil]] |
| 9121 | `#update-banner` (HTML, al final del archivo) | [[Auto-Update]] |

## ⚠️ Convención de mantenimiento

Cuando movés código, actualizás el rango acá **y** en la nota de la feature/componente. Es la única regla — el resto del contenido envejece menos.

## 🧰 Greps útiles

```bash
# Encontrar la línea exacta de una función:
grep -n "^function nombreFuncion" index.html

# Encontrar IDs:
grep -n 'id="nombre-id"' index.html

# Variables globales:
grep -nE "^(var|const|let)\s+\w+" index.html | head -50
```
