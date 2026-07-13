---
tags: [tipo/feature, area/frontend]
aliases: [Filtros, Search]
---

# Búsqueda y Filtros

> Sistema de filtrado: búsqueda principal accent-insensitive (+ EAN) + multi-selects por dimensión + sliders/toggles en [[Sidebar]] + **overrides por URL**. Resultado: `filteredProducts`.

## 📍 Ubicación
- `index.html` L5521 — `populateFilters` (llena dropdowns desde `products`)
- `index.html` L5757 — `_productPassesFilters_(p, skipSearch)` (matcher por producto)
- `index.html` L5839 — `applyFilters` (orquestador: filtra → sortea → re-render)
- `index.html` L8267 — `normTxt_(s)` (NFD lowercase, accent-insensitive)
- URL params: `?suc=` L4639 · `?marca=` L4683 (acepta lista `A,B`) · `?foto=` L4706 · `?mode=` L4120 ([[Page Modes]])
- Persistencia `priceMode`: lee `lc_price_mode` L4620, guarda L5396

## 🎯 Qué hace
- Search input con debounce 220ms → llama `applyFilters`.
- **EAN completo** en el buscador → muestra solo la card del color que matchea, salteando los filtros activos ([[Escáner EAN]]).
- `_productPassesFilters_` valida cada producto contra: texto (cod, nombre, marca), multi-selects, rango precio, rango fecha última compra, toggles (stock, foto, promo), sucursales.
- **URL params** al cargar: `?marca=VIA+MARTE,ADIDAS`, `?suc=`, `?foto=` pre-setean filtros — sirven para links directos compartibles.
- **Minorista/Mayorista persistido**: la selección se guarda en `localStorage` (`lc_price_mode`) y se restaura al abrir — salvo que el [[Page Modes]] fuerce un modo.
- Accent-insensitive: cualquier comparación contra texto del usuario pasa por `normTxt_`.

## 🔗 Variables / IDs / clases
- JS: `filteredProducts`, `applyFilters`, `_productPassesFilters_`, `normTxt_`, `populateFilters`, `priceMode`
- HTML: `#search-input` L3746, `#filter-badge` L3742, `.multi-select-*`, `#sidebar` L3765

## 🔌 Depende de
- [[Carga de Datos]] (input `products`)
- [[Sidebar]] · [[Multi-Select]] · [[Filter Bar]] (UI)

## 🔁 Consumido por
- [[Gallery View]] · [[Table View]] (renderean `filteredProducts`)
- [[Exportar PDF Móvil]] · [[Exportar Excel]] (exportan `filteredProducts` completo, no el subset renderizado)

## ⚠️ Gotchas
- **PDF y Excel operan sobre `filteredProducts` entero**, no sobre `renderedCount` — al diseñar nuevos filtros mantener esa garantía.
- `normTxt_` se usa también dentro del builder de [[Multi-Select]] para filtrar opciones — cambios en cascada.
- El override de URL solo se aplica **al cargar** — no reacciona a cambios de URL en runtime.
- Si el [[Page Modes]] fija `priceMode`, el valor guardado en `lc_price_mode` se ignora (la config del modo gana).
