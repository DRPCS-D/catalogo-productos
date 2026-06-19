---
tags: [glosario, area/referencia]
aliases: [Glossary]
---

# 📒 Glosario

> Variables globales JS, claves `localStorage`, tokens CSS, IDs/clases recurrentes. Cuando buscás "¿dónde se define X?" — empezá acá.

## Variables globales JS (`index.html` L2892–2933)

| Nombre | Línea | Tipo | Para qué |
|---|---|---|---|
| `rawData` | 2892 | array | Crudo de Supabase antes de agrupar |
| `products` | 2893 | array | Jerarquía agrupada: producto → colores → talles |
| `filteredProducts` | 2896 | array | Resultado de [[Búsqueda y Filtros]] |
| `currentView` | 2899 | `'gallery' \| 'table'` | Vista activa |
| `sortField` | 2900 | str | Campo de ordenamiento (`'id'` default) |
| `sortDir` | 2901 | `'asc' \| 'desc'` | Dirección (`'desc'` default) |
| `priceMode` | 2911 | `'minorista' \| 'mayorista'` | Selector global de precio |
| `renderedCount` | 2932 | num | Cuántos items ya están en el DOM ([[Infinite Scroll]]) |
| `BATCH_SIZE` | 2933 | num | Tamaño de lote del scroll infinito (50) |
| `APP_VERSION` | 3312 | str | Versión de la app — visible en [[Sidebar]] |
| `APP_BUILD` | 3313 | str | Fecha del build |
| `_newSwWaiting` | 3362 | `ServiceWorker \| null` | SW nuevo en espera de activación ([[Auto-Update]]) |
| `SUPABASE_URL` | 2748 | str | URL del proyecto Supabase (público) |
| `SUPABASE_ANON_KEY` | 2749 | str | Key anon (público por design, RLS protege) |
| `PAGE_CONFIGS` | 2778 | obj | Config por modo ([[Page Modes]]) |

## `localStorage` keys

| Key | Var en código | Línea | Uso | Default |
|---|---|---|---|---|
| `pmo_print_scale` | `PMO_SCALE_KEY` | 5765 | Escala del PDF móvil | `1` |
| `pmo_photo_h` (aprox) | `PMO_IMG_KEY` | 5796 | Alto de foto del PDF | `27mm` |

> Para una lista exhaustiva: `grep -n "localStorage\\.\\(get\\|set\\)Item" index.html` — completar acá a medida que se identifiquen.

## CSS tokens (`index.html` L55–80)

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#2B4193` | Acentos, botones, links |
| `--primary-dark` | `#1e293b` | Header, botones oscuros (`card-cta`) |
| `--surface` | `#f9f9fb` | Fondo de la app |
| `--surface-dim` | `#d9dadc` | Bordes sutiles |
| `--radius` | `4px` | Cards, botones (ROUND_FOUR del mockup Stitch) |
| `--radius-lg` | `8px` | Modales (verificar línea exacta) |

## IDs y clases recurrentes

**IDs (HTML)**:
- `#search-input` (L2494) — buscador principal
- `#filter-badge` (L2490) — contador de filtros activos
- `#refresh-chip` (L2471) — chip de actualización
- `#btn-view-toggle` (L2475) — toggle Galería ↔ Tabla
- `#sidebar` (L2511) — panel lateral
- `#app-version` (L2620) — versión en pie de sidebar
- `#table-sentinel` (L2673), `#gallery-sentinel` (L2684) — sentinels de [[Infinite Scroll]]
- `#gallery-container` (L2682), `#table-container` — contenedores de vista
- `#modal` (L2693) — modal de [[Modal Detalle]]
- `#lightbox` (L2709) — visor fullscreen
- `#update-banner` (L6024) — banner de [[Auto-Update]]

**Clases**:
- `.card`, `.card-foot`, `.card-cta` — anatomía del card de [[Gallery View]]
- `.multi-select-panel` — panel desplegable de [[Multi-Select]]
- `.sidebar-body`, `.sidebar-label` — scroll de [[Sidebar]] (usados por `scrollFilterToTop_`)
- `.refresh-chip`, `.view-toggle-btn`, `.filter-badge` — controles de [[Header]] y [[Filter Bar]]

## Hosts externos

| Host | Para qué | Nota |
|---|---|---|
| `*.supabase.co` | REST API + auth | [[Supabase Schema]] |
| `lh3.googleusercontent.com` | Thumbnails de Drive | Cache SW 7 días — [[Google Drive Fotos]] |
| `script.google.com` | Apps Script (admin/webhook) | [[Apps Script (Code.gs)]] |
| `api.lacostasrl.com.py:56181` | API ERP origen | Solo lo consume [[Sync Server (Python)]] |
