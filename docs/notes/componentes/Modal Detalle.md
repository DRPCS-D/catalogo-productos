---
tags: [tipo/componente, area/frontend]
aliases: [Modal, Detalle de producto]
---

# Modal Detalle

> Modal con detalle de un producto: foto grande + strip de colores clickeable + tabla de talles × stock por sucursal (con EAN clickeable) + precios + productos similares.

## 📍 Ubicación
- HTML: `index.html` L3997 (`#modal`)
- JS: `openModal(codFabrica, colorName)` L6619
- EAN clickeable en tabla de talles: L6702 (`openBarcodeModal_`)
- Similares: bloque L6852 (`.modal-similars`, ver [[Productos Similares]])
- Responsive ≤600px: L3130–3134 (similares forzados a 2 columnas con `!important`)

## 🎯 Qué hace
- Recibe `codFabrica` + `colorName`, busca el producto en `products`.
- **Strip de colores**: muestra *todos* los colores del producto; el activo resaltado; **click en un chip re-abre el modal en ese color**.
- Renderiza tabla talles con stock por sucursal; **click en un EAN abre el popup de código de barra** ([[Escáner EAN]]).
- Muestra precios activos (mayorista/minorista, con promo si aplica) en la zona media.
- Botones de agregar al [[Carrito]] por talle.
- Lista [[Productos Similares]] al pie (2 columnas en ≤600px, 3 en tablet+).
- Click en foto abre [[Lightbox]].

## 🔗 Variables / IDs / clases
- HTML: `#modal`, `.modal-overlay`, `.modal-content`, `.modal-similars-grid`
- JS: lee `products`, llama `getActivePrice` L8152 ([[Promociones y Precios]])

## 🔌 Depende de
- [[Gallery View]] · [[Table View]] (abren el modal)
- [[Promociones y Precios]] · [[Productos Similares]] · [[Lightbox]]
- [[Carrito]] · [[Escáner EAN]]

## ⚠️ Gotchas
- El modal usa overlay con `position: fixed` — abrir [[Lightbox]] desde acá implica dos overlays apilados; ambos manejan `Esc` para cerrar el de arriba.
- **Cascada CSS responsive**: el bloque `≤600px` (L3100s) va *antes* que el de `≤768px` en el archivo — a igual especificidad gana el tablet. Por eso el grid de similares móvil lleva `!important`. Cuidado al agregar reglas móviles nuevas.
