---
tags: [tipo/feature, area/frontend]
aliases: [Filtros, Search]
---

# Búsqueda y Filtros

> Sistema de filtrado: búsqueda principal accent-insensitive + multi-selects por dimensión + sliders/toggles en [[Sidebar]]. Resultado: `filteredProducts`.

## 📍 Ubicación
- `index.html` L3901 — `populateFilters` (llena dropdowns desde `products`)
- `index.html` L4075 — `_productPassesFilters_(p, skipSearch)` (matcher por producto)
- `index.html` L4138 — `applyFilters` (orquestador: filtra → sortea → re-render)
- `index.html` L5201 — `normTxt_(s)` (NFD lowercase, accent-insensitive)

## 🎯 Qué hace
- Search input con debounce 220ms → llama `applyFilters`.
- `_productPassesFilters_` valida cada producto contra: texto (cod, nombre, marca), multi-selects, rango precio, rango fecha última compra, toggles (stock, foto, promo), sucursales.
- `applyFilters` recalcula `filteredProducts`, actualiza badges, llama `renderGallery` / `renderTable`.
- Accent-insensitive: cualquier comparación contra texto del usuario pasa por `normTxt_`.

## 🔗 Variables / IDs / clases
- JS: `filteredProducts`, `applyFilters`, `_productPassesFilters_`, `normTxt_`, `populateFilters`
- HTML: `#search-input`, `#filter-badge`, `.multi-select-*`, `.sidebar`

## 🔌 Depende de
- [[Carga de Datos]] (input `products`)
- [[Sidebar]] · [[Multi-Select]] · [[Filter Bar]] (UI)

## 🔁 Consumido por
- [[Gallery View]] · [[Table View]] (renderean `filteredProducts`)
- [[Exportar PDF Móvil]] · [[Exportar Excel]] (exportan `filteredProducts` completo, no el subset renderizado)

## ⚠️ Gotchas
- **PDF y Excel operan sobre `filteredProducts` entero**, no sobre `renderedCount` — al diseñar nuevos filtros mantener esa garantía.
- `normTxt_` se usa también dentro del builder de [[Multi-Select]] para filtrar opciones — cambios en cascada.
- "Más opciones" (Precio, Última compra, Promoción) están dentro de `<details>` colapsables en la [[Sidebar]].
