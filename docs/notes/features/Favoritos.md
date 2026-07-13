---
tags: [tipo/feature, area/frontend]
aliases: [Favorites, Corazón]
---

# Favoritos

> Selección personal de productos con ❤️ por tarjeta (granularidad **producto × color**). Vista propia con export PDF/Excel. Persistido en `localStorage` (`lc_fav_v1`).

## 📍 Ubicación
- Estado: `FAVORITES_STORAGE_KEY = 'lc_fav_v1'` L4273, `favorites = {}` L4274 (clave `cod::color`)
- JS: `loadFavorites_` L7274 · `toggleFav_` L7291 · `clearAllFavs_` L7312 · `updateFavBadge_` L7325 · `renderFavorites` L7360 · `openFavView_` L7250
- HTML: `#favorites-view` L3955 · `#favorites-container` L3961 · botón nav `#bnav-fav` L3714
- Botón corazón por card: `.btn-card-fav` dentro de `buildGalleryCardHtml_` L6453

## 🎯 Qué hace
- Cada card de [[Gallery View]] tiene un corazón (🤍/❤️) que guarda/desguarda el par producto×color.
- Vista favoritos reusa `buildGalleryCardHtml_` — mismas cards, sin aplicar filtros activos.
- Estado vacío centrado en `#favorites-empty` (fuera del grid — dentro del grid quedaba alineado a la izquierda).
- **Borrar todo** (`#btn-clear-favs`): visible solo con favoritos, con `confirm()` previo; resetea corazones en las cards de galería sin re-render completo.
- Badge contador en [[Bottom Nav]] y chip del header.
- Exportar desde la vista favoritos: [[Exportar PDF Móvil]] (`generatePDFMobile` L8734 usa favoritos si `currentView === 'favorites'`) y [[Exportar Excel]].

## 🔌 Depende de
- [[Gallery View]] (template de card + corazón)
- [[Bottom Nav]] · [[Header]] (accesos)
- [[Exportar PDF Móvil]] · [[Exportar Excel]] (fuente alternativa a `filteredProducts`)

## ⚠️ Gotchas
- `toggleFav_` actualiza el ícono **por selector** (`.btn-card-fav[data-cod][data-color]`) sin re-render — si se cambia el markup del botón, revisar ese selector.
- La vista favoritos **ignora los filtros activos** — muestra todo lo guardado sin importar marca/stock/sucursal. Es intencional.
- Si un producto guardado desaparece del catálogo (sync lo borra), `renderFavorites` lo omite silenciosamente pero la entrada queda en `localStorage`.
