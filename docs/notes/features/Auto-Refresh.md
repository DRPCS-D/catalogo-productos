---
tags: [tipo/feature, area/frontend]
aliases: [Refresh chip, silentRefresh]
---

# Auto-Refresh

> Refresca los datos del catálogo en background sin recargar la página. Chip en el [[Header]] muestra cuánto tiempo pasó desde el último refresh exitoso.

## 📍 Ubicación
- `index.html` L3249 — `silentRefresh_()`
- `index.html` L3293 — `updateRefreshChip()`
- `index.html` L3427 — `relativeTime_(ms)` — formatea "hace X" (el "hace" se trimea para el chip)
- `index.html` L3283–3450 — loop que orquesta el ciclo

## 🎯 Qué hace
- Cada N minutos: re-fetch del `catalog_cache` de Supabase, reconstruye `products`, re-aplica filtros.
- **Preserva** `renderedCount` de [[Infinite Scroll]] (re-renderiza lotes hasta alcanzar el valor previo).
- Actualiza el chip cada minuto con el tiempo desde el último refresh:
  - "recién" (≤1 min) → chip muestra solo icono, sin texto.
  - "X min" / "X h" → muestra el número (sin "hace" prefijado).
- Después de 90 min sin éxito, el chip queda en estado **stale** (color de alerta).

## 🔗 Variables / IDs / clases
- JS: `silentRefresh_`, `updateRefreshChip`, `relativeTime_`
- HTML: `#refresh-chip` (L2471)
- CSS: `.refresh-chip`, `.stale`

## 🔌 Depende de
- [[Carga de Datos]] (re-fetch)
- [[Búsqueda y Filtros]] (re-apply)
- [[Infinite Scroll]] (preservación)

## ⚠️ Gotchas
- El re-render de lotes para preservar scroll puede tardar — durante ese loop, el observer de [[Infinite Scroll]] está activo pero el contenedor está siendo poblado batch a batch.
- Si `silentRefresh_` falla, deja `products` y `filteredProducts` intactos y solo marca el chip como stale.
