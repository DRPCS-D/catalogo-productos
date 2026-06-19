---
tags: [tipo/feature, area/negocio]
aliases: [Precios, Promo]
---

# Promociones y Precios

> Lógica de precio activo: distingue minorista/mayorista, aplica promo si está vigente, formatea en guaraníes.

## 📍 Ubicación
- `index.html` L5086+ — `getActivePrice(p)` y helpers de format
- `index.html` ~L5067–5207 — bloque entero de precio + formato + promo
- `index.html` L2911 — `var priceMode` (selector global)

## 🎯 Qué hace
- Recibe un producto, devuelve `{ price, isPromo, originalPrice, validity }`.
- Aplica `priceMode` global ('minorista' | 'mayorista') definido en [[Page Modes]].
- Si hay promo con `fecha_inicio <= hoy <= fecha_fin`, devuelve el precio promo + flag.
- Función separada de format: separador de miles, prefijo ₲.

## 🔗 Variables / IDs / clases
- JS: `getActivePrice`, `priceMode`, helpers de format
- Datos del producto: `precio_minorista`, `precio_mayorista`, `precio_promo`, `promo_inicio`, `promo_fin`

## 🔌 Depende de
- [[Carga de Datos]] (campos vienen del catálogo)
- [[Page Modes]] (define `priceMode` default y si la promo es visible)

## 🔁 Consumido por
- [[Gallery View]] · [[Table View]] · [[Modal Detalle]]
- [[Exportar PDF Móvil]] · [[Exportar Excel]]

## ⚠️ Gotchas
- Si la promo está pasada (fin < hoy) **igual aparece** en los datos pero `getActivePrice` la descarta — el filtro del usuario por "tiene promo" tiene que respetar este check, no solo la existencia del campo.
- El modo mayorista por configuración suele ocultar promo (ver `PAGE_CONFIGS` en [[Page Modes]]).
