---
tags: [tipo/componente, area/frontend]
aliases: [Barra de Búsqueda]
---

# Filter Bar

> Buscador principal + botón hamburguesa para abrir [[Sidebar]] + badge con conteo de filtros activos.

## 📍 Ubicación
- HTML: `index.html` ~L2480–2510
- `#search-input` L2494
- `#filter-badge` L2490
- JS búsqueda: `applyFilters` L4138, `normTxt_` L5201 (accent-insensitive)
- JS badge: en `applyFilters` (cuenta filtros activos)

## 🎯 Qué hace
- Input de búsqueda con **debounce 220ms**.
- Búsqueda **accent-insensitive** vía `normTxt_` (NFD decomposition).
- Botón hamburguesa abre/cierra [[Sidebar]].
- Badge numérico muestra cuántos filtros multi-select / rangos están activos.

## 🔗 Variables / IDs / clases
- HTML: `#search-input`, `#filter-badge`, `.filter-bar`
- JS: dispara `applyFilters` (L4138)
- Función: `normTxt_(s)` (L5201) — NFD + lowercase para comparar sin acentos

## 🔌 Depende de
- [[Búsqueda y Filtros]] (lógica de matching)
- [[Sidebar]] (objeto del botón hamburguesa)

## ⚠️ Gotchas
- Si cambiás el debounce, hay un `setTimeout` con `220` hardcodeado — buscar `220` cerca del listener.
- `normTxt_` también se usa dentro de los multi-select panels para filtrar opciones — un cambio acá tiene efecto en cascada.
