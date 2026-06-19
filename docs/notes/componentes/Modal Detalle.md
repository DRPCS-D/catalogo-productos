---
tags: [tipo/componente, area/frontend]
aliases: [Modal, Detalle de producto]
---

# Modal Detalle

> Modal con detalle de un producto: foto grande + tabla de colores × talles × stock por sucursal + precios + productos similares.

## 📍 Ubicación
- HTML: `index.html` L2693 (`#modal`), ~L1042–1281 (estructura interna)
- JS: `openModal(codFabrica, colorName)` L4716
- JS similares dentro del mismo bloque ~L4716–4965

## 🎯 Qué hace
- Recibe `codFabrica` + `colorName`, busca el producto en `products`.
- Renderiza tabla colores/talles con stock por sucursal.
- Muestra precios activos (mayorista/minorista, con promo si aplica).
- Lista [[Productos Similares]] al pie.
- Click en foto abre [[Lightbox]].

## 🔗 Variables / IDs / clases
- HTML: `#modal`, `.modal-overlay`, `.modal-content`
- JS: lee `products`, llama `getActivePrice` ([[Promociones y Precios]])

## 🔌 Depende de
- [[Gallery View]] · [[Table View]] (abren el modal)
- [[Promociones y Precios]]
- [[Productos Similares]]
- [[Lightbox]]

## ⚠️ Gotchas
- El modal usa overlay con `position: fixed` — abrir [[Lightbox]] desde acá implica dos overlays apilados; ambos manejan `Esc` para cerrar el de arriba.
