---
tags: [tipo/archivo, area/frontend]
aliases: [index.html, Monolito]
---

# Index HTML

> Monolito **6031 líneas** con HTML + CSS + JS inline. Esta nota es el mapa de secciones para grep dirigido.

## 📍 Mapa de secciones

| Rango | Sección | Nota |
|---|---|---|
| 49–104 | CSS tokens, reset, Hanken Grotesk | [[Estilos y Tema]] |
| ~106–244 | Header (logo, refresh chip, view toggle) | [[Header]] |
| 2471–2495 | Refresh chip + view toggle + search input | [[Header]] · [[Filter Bar]] |
| 2511–2620 | Sidebar (filtros + pie con `app-version`) | [[Sidebar]] |
| 2673–2684 | Sentinels de tabla y galería | [[Infinite Scroll]] |
| 2682 | `#gallery-container` (grid de cards) | [[Gallery View]] |
| 2693 | `#modal` (modal-overlay) | [[Modal Detalle]] |
| 2709 | `#lightbox` | [[Lightbox]] |
| 2748–2814 | Config Supabase + `PAGE_CONFIGS` | [[Carga de Datos]] · [[Page Modes]] |
| 2892–2933 | Variables globales JS | [[Glosario]] |
| 3047–3222 | Data loading (Supabase fetch, page config, onLoad/onErr) | [[Carga de Datos]] |
| 3249–3300 | `silentRefresh_` + `updateRefreshChip` | [[Auto-Refresh]] |
| 3312–3313 | `APP_VERSION`, `APP_BUILD` | [[Sistema de Versiones]] |
| 3321–3425 | `forceUpdateApp_` + `initAppAutoUpdate_` + `activateNewSwAndReload_` | [[Auto-Update]] |
| 3427 | `relativeTime_` (relativo "hace X") | [[Auto-Refresh]] |
| 3502 | `scrollFilterToTop_` (auto-scroll de sidebar) | [[Sidebar]] · [[Multi-Select]] |
| 3533 | `isUserBusy_` (gate de auto-update) | [[Auto-Update]] |
| 3901 | `populateFilters` | [[Búsqueda y Filtros]] |
| ~3954–4076 | Multi-Select builder | [[Multi-Select]] |
| 4075 | `_productPassesFilters_` | [[Búsqueda y Filtros]] |
| 4138 | `applyFilters` | [[Búsqueda y Filtros]] |
| 4320 | `toggleSidebar` | [[Sidebar]] |
| 4374–4388 | `sortBy` + `updateSortHeaders` | [[Table View]] |
| 4393–4515 | Render Tabla + `appendNextTableBatch` | [[Table View]] · [[Infinite Scroll]] |
| 4519–4620 | Render Galería + `buildGalleryCardHtml_` + `appendNextGalleryBatch` | [[Gallery View]] · [[Infinite Scroll]] |
| 4716–5025 | Modal detalle + productos similares | [[Modal Detalle]] · [[Productos Similares]] |
| 5026–5066 | `switchView` + `toggleView_` | [[Header]] |
| 5086+ | `getActivePrice` (lógica de promo) | [[Promociones y Precios]] |
| 5201 | `normTxt_` (NFD accent-insensitive) | [[Búsqueda y Filtros]] |
| 5315 | `exportToExcelTotalsByMarca_` | [[Exportar Excel]] |
| 5432 | `exportToExcel` | [[Exportar Excel]] |
| 5765–5812 | PDF móvil — `localStorage` keys (`pmo_print_scale`, `PMO_IMG_KEY`) | [[Exportar PDF Móvil]] |
| 6024 | `#update-banner` (HTML, al final del archivo) | [[Auto-Update]] |

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
