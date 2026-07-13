---
tags: [tipo/feature, area/frontend]
aliases: [Cart, Pedido]
---

# Carrito

> Armado de pedido con granularidad **producto × color × talle** + cantidad. Vista propia con líneas editables, botón de código de barra por línea y export a PDF. Persistido en `localStorage` (`lc_cart_v1`).

## 📍 Ubicación
- Estado: `CART_STORAGE_KEY = 'lc_cart_v1'` L4280, `cart = {}` L4281
- JS: `cartKey_(codigo, color, talle)` L7424 · `loadCart_` L7428 · `saveCart_` L7436 · `renderCart_` L7677 · `buildCartLineHtml_` L7725 · `wireCartListEvents_` L7759 · `openCartView_` L7244
- PDF del pedido: `renderCartPdf_` L7976
- HTML: `#cart-view` L3967 (se llena por JS) · botón nav `#bnav-cart` L3721
- Botón código de barra por línea: `.cart-line-barcode` (template L7753, handler L7806, CSS L614)

## 🎯 Qué hace
- Se agrega desde [[Modal Detalle]] (por talle) o botón rápido `+` en la card de [[Gallery View]].
- Cada línea: producto + color + talle + cantidad editable + subtotal + botón ▌▌▌ que abre el popup EAN ([[Escáner EAN]]).
- El botón ▌▌▌ **no guarda el EAN en la línea** — lo resuelve al click desde `products` (`codFabrica → colorsArr → gradesArr → ean`).
- Badge contador en [[Bottom Nav]] y chip del header (`#cart-chip-count`).
- Export del pedido a PDF con `renderCartPdf_`.

## 🔌 Depende de
- [[Modal Detalle]] · [[Gallery View]] (puntos de agregado)
- [[Promociones y Precios]] (precio de línea según `priceMode`)
- [[Escáner EAN]] (`openBarcodeModal_` para el popup)
- [[Bottom Nav]] · [[Header]]

## ⚠️ Gotchas
- Los eventos de la vista se re-enganchan en cada `renderCart_` vía `wireCartListEvents_` — nuevos botones por línea deben registrarse ahí.
- La clave de línea es `cod::color::talle` — cambiar el separador rompe los carritos guardados de los usuarios.
- Si el talle guardado ya no existe en el catálogo, el lookup de EAN cae al primer grade disponible del color.
