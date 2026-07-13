---
tags: [tipo/componente, area/frontend]
aliases: [Tabla]
---

# Table View

> Vista tabular con **árbol expandible**: producto → color → talle → stock por sucursal. Ordenable por columnas, con **header sticky** al scrollear. Mismo [[Infinite Scroll]] que la galería.

## 📍 Ubicación
- CSS tabla: `index.html` L1351 (`.table-wrap`), L1366 (`thead tr` sticky)
- `#table-sentinel` L3937
- JS render: `renderTable` L6100
- JS batch append: `appendNextTableBatch` L6207
- JS sort: `sortBy` L6081, `updateSortHeaders` L6088

## 🎯 Qué hace
- Render tabla con filas-producto colapsadas; al expandir muestra filas hijo (color → talle).
- Sort ASC/DESC con click en header. Estado en `sortField` + `sortDir` ([[Glosario]]).
- **Header sticky**: `thead tr { position: sticky; top: 0; z-index: 10 }` — los títulos quedan fijos al scrollear.
- Infinite scroll igual que galería — `tbody.innerHTML = html` solo en el primer lote, después `appendChild`.
- Las filas hijo se pre-renderizan con `display:none` y se muestran al expandir.

## 🔗 Variables / IDs / clases
- HTML: `#table-container`, `#table-sentinel`
- JS: `filteredProducts`, `sortField`, `sortDir`, `renderedCount`
- Helpers: `toggle*` (expandir/contraer filas)

## 🔌 Depende de
- [[Carga de Datos]] · [[Búsqueda y Filtros]] · [[Infinite Scroll]]
- [[Promociones y Precios]] (precio en columna)

## ⚠️ Gotchas
- **`.table-wrap` usa `overflow: clip`, no `hidden`** — `hidden` crea un scroll container y rompe el `position: sticky` del header. Si se vuelve a `hidden`, el sticky deja de funcionar silenciosamente.
- Al cambiar de sort, **se re-renderiza desde 0** (igual que al filtrar). No se preserva `renderedCount`.
- El click-handler para expandir usa delegación en `tbody` — agregar nuevos botones dentro requiere chequear los selectores `closest()`.
