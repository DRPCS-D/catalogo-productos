---
tags: [tipo/componente, area/frontend]
aliases: [Nav Mobile, Barra inferior]
---

# Bottom Nav

> Barra de navegación inferior **solo móvil** (≤768px) con 4 tabs: Galería · Favoritos · Carrito · Tabla. Tab activa con pill de fondo sobre el ícono.

## 📍 Ubicación
- CSS: L342–408 (`.bottom-nav`, `.bnav-btn`, `.bnav-icon-wrap`, `.bnav-badge`)
- Activación móvil: `.bottom-nav { display: flex }` L3090 (dentro del bloque responsive)
- HTML: `<nav id="bottom-nav">` L3709–3735 (`#bnav-gallery`, `#bnav-fav`, `#bnav-cart`, `#bnav-table`)
- Estado activo: lo setea `switchView` L7202

## 🎯 Qué hace
- 4 botones ícono + label. Favoritos y Carrito muestran badge contador (`.bnav-badge`, visible con clase `.has-badge`).
- Tab activa: color `--primary`, label bold, y **pill** detrás del ícono:
  `background: color-mix(in srgb, var(--primary) 12%, transparent)` (L373).
- En desktop no existe — ahí el switch de vistas son los botones `#btn-gallery` / `#btn-table` del [[Header]].

## 🔌 Depende de
- [[Gallery View]] · [[Table View]] · [[Favoritos]] · [[Carrito]] (destinos)
- `switchView` (única fuente de verdad del estado activo)

## ⚠️ Gotchas
- `color-mix()` requiere navegadores 2023+ — el fallback es simplemente sin pill (degrada bien).
- Al ocultarse en PDF/print, está incluida en el selector de ocultamiento L3502 — si se agregan overlays nuevos revisar esa lista.
