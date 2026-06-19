---
tags: [tipo/componente, area/frontend]
aliases: [Multi-select, Chip]
---

# Multi-Select

> Componente desplegable reutilizable para filtros multi-valor (marca, grupo, subgrupo, colección, talle, sucursal). Búsqueda interna accent-insensitive + chips visibles afuera.

## 📍 Ubicación
- HTML chips: `index.html` ~L403–535
- JS builder: `index.html` ~L3954–4076
- Apertura/cierre handler: ~L3989 (`btn` click) — llama `scrollFilterToTop_` (L3502)

## 🎯 Qué hace
- Click en chip → abre `.multi-select-panel` (`position: absolute`, flota sobre la sidebar).
- Input interno filtra opciones con `normTxt_` (accent-insensitive).
- Checkboxes seleccionables múltiples → al cerrar, dispara `applyFilters`.
- Chip externo muestra "Marca (3)" cuando hay selección.

## 🔗 Variables / IDs / clases
- CSS: `.multi-select-panel`, `.multi-select-btn`, `.multi-select-chip`, `.open`
- JS: builder genérico (recibe la lista, el container, y el callback de change)
- Helpers: `normTxt_` (L5201)

## 🔌 Depende de
- [[Búsqueda y Filtros]] (callback de change)
- [[Sidebar]] (es el host donde se monta)
- `scrollFilterToTop_` ([[Sidebar]])

## ⚠️ Gotchas
- Como el panel es `position: absolute` no empuja contenido — por eso `scrollFilterToTop_` es necesario para que el usuario vea la lista completa en mobile.
- El handler de cierre con click-fuera ignora clicks dentro del panel — verificar el `closest()` si se agregan elementos hijo.
