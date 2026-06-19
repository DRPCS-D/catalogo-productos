---
tags: [tipo/componente, area/frontend]
aliases: [Galería, Cards]
---

# Gallery View

> Grid de cards (producto × color). 4:5 aspect, mix-blend-multiply, "Ver detalles" como CTA full-width. Carga con [[Infinite Scroll]] de 50 en 50.

## 📍 Ubicación
- HTML: `index.html` L2682 (`#gallery-container`), L2684 (`#gallery-sentinel`)
- JS render: `renderGallery` L4519
- JS template: `buildGalleryCardHtml_` L4554
- JS batch append: `appendNextGalleryBatch` L4601
- CSS: tokens en [[Estilos y Tema]] (`.card`, `.card-foot`, `.card-cta`)

## 🎯 Qué hace
- Arma `allCards` (todas las variantes producto × color filtradas).
- Renderiza primer lote de `BATCH_SIZE = 50` cards en `#gallery-container`.
- Cada card: foto (`object-fit: contain`, blend multiply) + nombre + precio + stock badge + botón "Ver detalles".
- Click en foto → [[Lightbox]]; click en CTA → [[Modal Detalle]].
- Lazy-load de imágenes con `IntersectionObserver` aparte (atributo `data-src`).

## 🔗 Variables / IDs / clases
- HTML: `#gallery-container`, `#gallery-sentinel`
- JS: `allCards`, `renderedCount`, `BATCH_SIZE` ([[Glosario]])
- CSS: `.card`, `.card-foot`, `.card-cta`, tokens `--primary-dark`, `--radius`

## 🔌 Depende de
- [[Carga de Datos]] (input)
- [[Búsqueda y Filtros]] (input filtrado)
- [[Infinite Scroll]] (lotes)
- [[Promociones y Precios]] (precio mostrado)
- [[Estilos y Tema]]

## 🔁 Consumido por
- [[Modal Detalle]] (abre desde card)
- [[Lightbox]] (foto fullscreen)
- [[Exportar PDF Móvil]] (reusa el template del card)

## ⚠️ Gotchas
- iOS Safari ≤14 no soporta `aspect-ratio` puro — la app asume ≥15.
- `mix-blend-mode: multiply` requiere fondo no transparente en el parent.
- `appendNextGalleryBatch` es idempotente cuando `renderedCount >= allCards.length` — el sentinel puede dispararlo varias veces durante el rebote elástico de iOS sin romper.
