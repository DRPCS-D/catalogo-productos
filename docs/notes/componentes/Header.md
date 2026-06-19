---
tags: [tipo/componente, area/frontend]
aliases: [Topbar]
---

# Header

> Barra superior: logo + título + **refresh chip** + **view toggle** Galería/Tabla.

## 📍 Ubicación
- HTML: `index.html` ~L2440–2495
- `#refresh-chip` L2471
- `#btn-view-toggle` L2475
- JS view toggle: `switchView` L5026, `toggleView_` L5044
- CSS: tokens en [[Estilos y Tema]]

## 🎯 Qué hace
- Muestra logo + nombre comercial.
- **Refresh chip**: muestra solo el tiempo desde la última carga (sin "hace"); vacío si "recién".
- **View toggle**: un único botón con icono `⊞` (galería) / `☰` (tabla) que alterna.

## 🔗 Variables / IDs / clases
- HTML: `#refresh-chip`, `#btn-view-toggle`
- JS: `currentView` ([[Glosario]]), `updateRefreshChip` (L3293)
- CSS: `.refresh-chip`, `.view-toggle-btn`

## 🔌 Depende de
- [[Auto-Refresh]] (alimenta `updateRefreshChip`)
- [[Gallery View]] · [[Table View]] (objetos de switch)

## ⚠️ Gotchas
- El `updateRefreshChip` corta la string `hace ` del resultado de `relativeTime_` — si se cambia ese helper, revisar acá (L3293).
