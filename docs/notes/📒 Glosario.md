---
tags: [glosario, area/referencia]
aliases: [Glossary]
---

# 📒 Glosario

> Variables globales JS, claves `localStorage`, tokens CSS, IDs/clases recurrentes. Cuando buscás "¿dónde se define X?" — empezá acá.

## Variables globales JS (`index.html` L4250–4315)

| Nombre | Línea | Tipo | Para qué |
|---|---|---|---|
| `rawData` | 4250 | array | Crudo de Supabase antes de agrupar |
| `products` | 4251 | array | Jerarquía agrupada: producto → colores → talles |
| `filteredProducts` | 4254 | array | Resultado de [[Búsqueda y Filtros]] |
| `currentView` | 4257 | `'gallery' \| 'table' \| 'favorites' \| 'cart'` | Vista activa |
| `sortField` | 4258 | str | Campo de ordenamiento (`'id'` default) |
| `sortDir` | 4259 | `'asc' \| 'desc'` | Dirección (`'desc'` default) |
| `priceMode` | 4270 | `'minorista' \| 'mayorista'` | Selector global de precio — persistido en `lc_price_mode` |
| `favorites` | 4274 | obj | Favoritos `{ "cod::color": {...} }` ([[Favoritos]]) |
| `cart` | 4281 | obj | Carrito `{ "cod::color::talle": {...} }` ([[Carrito]]) |
| `pdfHidePrice` | 4302 | bool | PDF sin precios ([[Exportar PDF Móvil]]) |
| `renderedCount` | 4305 | num | Cuántos items ya están en el DOM ([[Infinite Scroll]]) |
| `BATCH_SIZE` | 4306 | num | Tamaño de lote del scroll infinito (50) |
| `lastSyncLogRow` | 4315 | obj\|null | Última fila de `sync_log` — alimenta el ⚠️ del [[Header]] |
| `APP_VERSION` | 4855 | str | Versión de la app — visible en [[Sidebar]] |
| `APP_BUILD` | 4856 | str | Fecha del build |
| `_newSwWaiting` | 4905 | `ServiceWorker \| null` | SW nuevo en espera de activación ([[Auto-Update]]) |
| `SUPABASE_URL` | 4106 | str | URL del proyecto Supabase (público) |
| `SUPABASE_ANON_KEY` | 4107 | str | Key anon (público por design, RLS protege) |
| `PAGE_CONFIGS` | 4136 | obj | Config por modo ([[Page Modes]]) |

## `localStorage` keys

| Key | Var en código | Línea | Uso | Default |
|---|---|---|---|---|
| `lc_fav_v1` | `FAVORITES_STORAGE_KEY` | 4273 | [[Favoritos]] guardados | `{}` |
| `lc_cart_v1` | `CART_STORAGE_KEY` | 4280 | [[Carrito]] guardado | `{}` |
| `lc_price_mode` | — (literal) | 4620 / 5396 | Minorista/Mayorista elegido | `minorista` |
| `pmo_print_scale` | `PMO_SCALE_KEY` | 8850 | Escala del PDF móvil | `1` |
| `pmo_img_height` | `PMO_IMG_KEY` | 8876 | Alto de foto del PDF | `38mm` |

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
- `#search-input` (L3746) — buscador principal
- `#btn-search-scan` (L3752) — escáner de código de barra ([[Escáner EAN]])
- `#filter-badge` (L3742) — contador de filtros activos
- `#sync-warning-icon` (L3687) — ⚠️ de sync con error ([[Header]])
- `#refresh-chip` (L3688) — chip de actualización
- `#btn-gallery` (L3692), `#btn-table` (L3701) — botones de vista desktop
- `#bottom-nav` (L3709) — nav móvil ([[Bottom Nav]])
- `#sidebar` (L3765) — panel lateral
- `#app-version` (L3881) — versión en pie de sidebar (tap = diagnóstico de escáner)
- `#table-sentinel` (L3937), `#gallery-sentinel` (L3948) — sentinels de [[Infinite Scroll]]
- `#gallery-container` (L3946), `#table-container` — contenedores de vista
- `#favorites-view` (L3955), `#cart-view` (L3967) — vistas [[Favoritos]] y [[Carrito]]
- `#modal` (L3997) — modal de [[Modal Detalle]]
- `#lightbox` (L4013) — visor fullscreen
- `#barcode-overlay` (L4067) — popup EAN-13 ([[Escáner EAN]])
- `#update-banner` (L9121) — banner de [[Auto-Update]]

**Clases**:
- `.card`, `.card-foot`, `.card-cta`, `.btn-card-fav` — anatomía del card de [[Gallery View]]
- `.cart-line-barcode` — botón ▌▌▌ por línea de [[Carrito]]
- `.bnav-btn`, `.bnav-icon-wrap`, `.bnav-badge` — [[Bottom Nav]]
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
| `192.168.90.19:3001` (LAN) | [[PDF Service]] Puppeteer | Solo red interna |
