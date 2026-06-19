---
tags: [tipo/feature, area/frontend]
aliases: [Scroll infinito, Carga progresiva]
---

# Infinite Scroll

> Carga progresiva por lotes de 50. `IntersectionObserver` sobre un sentinel al final de cada vista dispara el siguiente lote cuando entra al viewport.

## 📍 Ubicación
- HTML sentinels: `index.html` L2673 (`#table-sentinel`), L2684 (`#gallery-sentinel`)
- JS variables: `BATCH_SIZE = 50` (L2933), `renderedCount` (L2932), `allCards`
- JS render base: `renderGallery` L4519, `renderTable` L4393
- JS append: `appendNextGalleryBatch` L4601, `appendNextTableBatch` L4500
- JS observer: definido cerca del bottom de las funciones de render (buscar `IntersectionObserver` con `rootMargin: '400px'`)

## 🎯 Qué hace
- Al filtrar/cambiar vista: `renderedCount = 0`, contenedor vacío, renderiza primer lote.
- Sentinel invisible (`height: 1px`) al final del contenedor.
- Observer con `rootMargin: '400px 0px'` dispara `appendNextBatch()` cuando faltan 400px para el fondo.
- Si `renderedCount >= total`, el append es no-op (idempotente).

## 🔗 Variables / IDs / clases
- JS: `BATCH_SIZE`, `renderedCount`, `allCards`, `filteredProducts`
- HTML: `#gallery-sentinel`, `#table-sentinel`

## 🔌 Depende de
- [[Gallery View]] · [[Table View]] (consumidores)
- [[Búsqueda y Filtros]] (input)

## 🔁 Preservación de estado
- `silentRefresh_` (L3249) guarda `renderedCount` y, tras reconstruir `allCards`, llama `appendNextBatch` en loop hasta alcanzar el viejo valor → el usuario no pierde scroll al auto-refresh.

## ⚠️ Gotchas
- El rebote elástico de iOS dispara el observer múltiples veces — el check `renderedCount < total` corta el loop.
- Al **cambiar de sort** la tabla se re-renderiza desde 0 (no es el comportamiento de filtrar — verificar al diseñar nuevos sorts).
- 1800 cards × ~30 nodos ≈ 54k nodos DOM en el peor caso — soportable. Si surge lag, considerar `content-visibility: auto` en lotes anteriores.
