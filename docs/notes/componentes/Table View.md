---
tags: [tipo/componente, area/frontend]
aliases: [Tabla]
---

# Table View

> Vista tabular con **árbol expandible**: producto → color → talle → stock por sucursal. Ordenable por columnas. Mismo [[Infinite Scroll]] que la galería.

## 📍 Ubicación
- HTML: `index.html` L607–771 (estructura tabla + modal de expansión)
- `#table-sentinel` L2673
- JS render: `renderTable` L4393
- JS batch append: `appendNextTableBatch` L4500
- JS sort: `sortBy` L4374, `updateSortHeaders` L4381

## 🎯 Qué hace
- Render tabla con filas-producto colapsadas; al expandir muestra filas hijo (color → talle).
- Sort ASC/DESC con click en header. Estado en `sortField` + `sortDir` ([[Glosario]]).
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
- Al cambiar de sort, **se re-renderiza desde 0** (igual que al filtrar). No se preserva `renderedCount`.
- El click-handler para expandir usa delegación en `tbody` — agregar nuevos botones dentro requiere chequear los selectores `closest()`.
