---
tags: [tipo/feature, area/frontend, tipo/export]
aliases: [PDF, PDF Beta, PMO]
---

# Exportar PDF Móvil

> Generador de PDF imprimible desde el navegador (beta) con overlay de ajuste de **escala** y **alto de foto** persistidos por dispositivo en `localStorage`, más switch para **ocultar precios**. Layout grid 3×3.

## 📍 Ubicación
- Botón disparo: `#btn-pdf-mobile` L3859 · función `generatePDFMobile` L8734
- Switch ocultar precio: `#pdf-hide-price-switch` L3852–3853, estado `pdfHidePrice` L4302, wiring L5381
- `localStorage` keys: `PMO_SCALE_KEY = 'pmo_print_scale'` L8850, `PMO_IMG_KEY = 'pmo_img_height'` L8876
- Template de card PDF: `renderPdfCard_` L9025 (precio condicional en L9038–9040)
- CSS `@media print` con `zoom: var(--pmo-print-scale, 1)` — en el bloque de estilos

## 🎯 Qué hace
- Renderiza `filteredProducts` — o los [[Favoritos]] si `currentView === 'favorites'` — como grid 3×3 print-ready.
- Toolbar con controles `Escala −/+` y `Foto −/+` (default de alto de foto: **38mm**).
- **Switch "ocultar precio"** en el [[Sidebar]]: genera el PDF sin precios (para compartir con clientes sin revelar lista).
- Persiste cada ajuste en `localStorage` → cada dispositivo recuerda su valor.
- `object-fit: contain` con **fondo blanco** en la foto — con fondo de color quedaban bandas laterales en fotos no proporcionales.
- Foto del card es link a versión fullsize en Drive.

## 🔗 Variables / IDs / clases
- JS: `filteredProducts` / favoritos, `pdfHidePrice`, `localStorage` (`pmo_print_scale`, `pmo_img_height`)
- CSS: `--pmo-print-scale`, `@media print { zoom: var(--pmo-print-scale, 1) }`

## 🔌 Depende de
- [[Búsqueda y Filtros]] (`filteredProducts`) · [[Favoritos]] (fuente alternativa)
- [[Promociones y Precios]] · [[Page Modes]] (incluir/excluir promo según modo)
- [[Gallery View]] (template del card reusado)

## ⚠️ Gotchas
- iOS Safari + `zoom` + print mete saltos de página fantasma — por eso varios iPads necesitan 89–95% de escala. Cada usuario ajusta lo suyo.
- Toolbar con `flex-wrap` para ≥720px → si se agregan controles, verificar que el botón **Imprimir** no se oculte.
- El template del card en PDF es prácticamente el mismo que el de [[Gallery View]] — cuidar al modificar `.card` no romper el print.
- No confundir con el [[PDF Service]] del servidor (Puppeteer) — este es 100% client-side.
