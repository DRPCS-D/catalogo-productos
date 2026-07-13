---
tags: [tipo/componente, area/frontend]
aliases: [Galería, Cards]
---

# Gallery View

> Grid de cards (producto × color). Corazón de [[Favoritos]] + botón rápido de [[Carrito]] sobre la foto. Carga con [[Infinite Scroll]] de 50 en 50. En ≤600px las cards se compactan (foto 4:3).

## 📍 Ubicación
- HTML: `index.html` L3946 (`#gallery-container`), L3948 (`#gallery-sentinel`)
- JS render: `renderGallery` L6226
- JS template: `buildGalleryCardHtml_` L6453
- JS batch append: `appendNextGalleryBatch` L6504
- Compact móvil ≤600px: bloque L3100s (`aspect-ratio: 4/3`, paddings reducidos)
- CSS: tokens en [[Estilos y Tema]] (`.card`, `.card-foot`, `.card-cta`)

## 🎯 Qué hace
- Arma `allCards` (todas las variantes producto × color filtradas).
- Renderiza primer lote de `BATCH_SIZE = 50` cards en `#gallery-container`.
- Cada card: foto (`object-fit: contain`, blend multiply) + corazón `.btn-card-fav` + botón `+` carrito + nombre + precio + stock badge + CTA "Ver detalles".
- Click en foto → [[Lightbox]]; click en CTA → [[Modal Detalle]]; corazón → [[Favoritos]]; `+` → [[Carrito]].
- Lazy-load de imágenes con `IntersectionObserver` aparte (atributo `data-src`).
- Al buscar/escanear un EAN muestra **solo la card del color que matchea** ([[Escáner EAN]]).

## 🔗 Variables / IDs / clases
- HTML: `#gallery-container`, `#gallery-sentinel`
- JS: `allCards`, `renderedCount`, `BATCH_SIZE` ([[Glosario]])
- CSS: `.card`, `.card-foot`, `.card-cta`, `.btn-card-fav`, tokens `--primary-dark`, `--radius`

## 🔌 Depende de
- [[Carga de Datos]] · [[Búsqueda y Filtros]] · [[Infinite Scroll]]
- [[Promociones y Precios]] (precio mostrado)
- [[Estilos y Tema]]

## 🔁 Consumido por
- [[Modal Detalle]] · [[Lightbox]] · [[Favoritos]] (reusa el template) · [[Exportar PDF Móvil]]

## ⚠️ Gotchas
- iOS Safari ≤14 no soporta `aspect-ratio` puro — la app asume ≥15.
- `mix-blend-mode: multiply` requiere fondo no transparente en el parent.
- `appendNextGalleryBatch` es idempotente cuando `renderedCount >= allCards.length` — el sentinel puede dispararlo varias veces durante el rebote elástico de iOS sin romper.
- Los botones sobre la foto (corazón + `+`) usan delegación de eventos en `#gallery-container` — [[Favoritos]] re-engancha aparte en su propio container.
