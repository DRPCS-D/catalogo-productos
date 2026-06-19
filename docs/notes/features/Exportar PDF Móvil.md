---
tags: [tipo/feature, area/frontend, tipo/export]
aliases: [PDF, PDF Beta, PMO]
---

# Exportar PDF Móvil

> Generador de PDF imprimible desde el navegador (beta) con overlay de ajuste de **escala** y **alto de foto** persistidos por dispositivo en `localStorage`. Layout grid 3×3.

## 📍 Ubicación
- HTML overlay/toolbar: `index.html` ~L1714–1855
- `localStorage` keys: `PMO_SCALE_KEY = 'pmo_print_scale'` (L5765), `PMO_IMG_KEY` (L5796)
- Getters/setters: L5770–5812
- CSS `@media print` con `zoom: var(--pmo-print-scale, 1)` — buscar en bloque de estilos

## 🎯 Qué hace
- Renderiza `filteredProducts` como grid 3×3 print-ready.
- Toolbar con controles `Escala −/+` y `Foto −/+`.
- Persiste cada cambio en `localStorage` → cada dispositivo recuerda su valor.
- `object-fit: contain` evita recortes de fotos.
- Foto del card es link a versión fullsize en Drive.

## 🔗 Variables / IDs / clases
- JS: lee `filteredProducts`, `localStorage` (`pmo_print_scale`, key del alto de foto)
- HTML: overlay con id propio, toolbar `Imprimir` + −/+
- CSS: `--pmo-print-scale`, `@media print { zoom: var(--pmo-print-scale, 1) }`

## 🔌 Depende de
- [[Búsqueda y Filtros]] (`filteredProducts`)
- [[Promociones y Precios]] (precio activo en render)
- [[Page Modes]] (incluir/excluir promo según modo)
- [[Gallery View]] (template del card reusado)

## ⚠️ Gotchas
- iOS Safari + `zoom` + print mete saltos de página fantasma — por eso varios iPads necesitan 89–95% de escala. Cada usuario ajusta lo suyo.
- Toolbar con `flex-wrap` para ≥720px → si se agregan controles, verificar que el botón **Imprimir** no se oculte.
- El template del card en PDF es prácticamente el mismo que el de [[Gallery View]] — cuidar al modificar `.card` no romper el print.
