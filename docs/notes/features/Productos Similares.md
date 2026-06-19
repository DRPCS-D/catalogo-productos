---
tags: [tipo/feature, area/frontend]
aliases: [Similares]
---

# Productos Similares

> Sección al pie del [[Modal Detalle]] que sugiere hasta N productos parecidos al actual. Scoring por coincidencia de marca/grupo/subgrupo/colección.

## 📍 Ubicación
- `index.html` ~L4716–4965 — dentro del bloque del `openModal`
- Buscar el helper de scoring (similarityScore o equivalente)

## 🎯 Qué hace
- Recibe el producto abierto en modal.
- Recorre `products` (o `filteredProducts`) y puntúa cada uno por coincidencias (peso por dimensión).
- Ordena descendente y devuelve top N (8–12 típicamente).
- Renderiza mini-cards horizontales con foto + nombre + precio.

## 🔗 Variables / IDs / clases
- JS: lee `products`, llama `getActivePrice` ([[Promociones y Precios]])

## 🔌 Depende de
- [[Modal Detalle]] (host)
- [[Carga de Datos]] (lista completa para comparar)
- [[Promociones y Precios]] (precio mostrado)

## ⚠️ Gotchas
- El scoring está hardcodeado en pesos — si se cambia la definición de "similar" (ej. priorizar talle), revisar el peso de cada campo.
- Cuando el catálogo es muy chico (< N candidatos) la sección queda corta o vacía — verificar el render para no mostrar contenedor sin items.
