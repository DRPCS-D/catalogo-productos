---
tags: [tipo/feature, area/frontend, tipo/export]
aliases: [Excel, XLSX]
---

# Exportar Excel

> Exporta `filteredProducts` a XLSX — o los [[Favoritos]] si la vista activa es favoritos. 2 modos: tabla detallada (productos × sucursales con totales por fila + grand total) y totales por marca.

## 📍 Ubicación
- `index.html` L8507 — `exportToExcel(opts)` — export principal con columna **total** al final de cada fila + fila TOTAL al pie
- `index.html` L8385 — `exportToExcelTotalsByMarca_()` — agregado por marca con fila TOTAL

## 🎯 Qué hace
- Construye headers desde la lista de sucursales filtradas.
- Por cada producto: cantidades por sucursal + columna **total** (suma de sucursales) al final.
- Fila final **TOTAL**: suma vertical de cada sucursal + grand total.
- Genera XLSX vía librería incluida.

## 🔗 Variables / IDs / clases
- JS: `filteredProducts`, `headers.concat(['total'])`, `rowTotal`, `grandTotal`
- Botones de disparo en bloque export de [[Filter Bar]] o [[Sidebar]]

## 🔌 Depende de
- [[Búsqueda y Filtros]] (`filteredProducts`)
- [[Favoritos]] (fuente alternativa cuando `currentView === 'favorites'`)
- [[Page Modes]] (qué sucursales considerar)

## ⚠️ Gotchas
- Las exportaciones siempre toman **todo `filteredProducts`** — no el subset visible por [[Infinite Scroll]]. Mantener esta garantía.
- Si se agrega una columna a la izquierda de `total`, ajustar el cálculo de `grandTotal` y de la fila TOTAL final.
