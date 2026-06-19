---
tags: [tipo/data, area/frontend]
aliases: [Data loading]
---

# Carga de Datos

> Flujo de carga inicial: IndexedDB (cache local) → Supabase (`catalog_cache`) → `products` agrupado. Muestra mock si no hay backend (preview local).

## 📍 Ubicación
- `index.html` L2748–2814 — config Supabase + `PAGE_CONFIGS`
- `index.html` L2832–2888 — mock data (preview sin backend)
- `index.html` L3047 — `fetchPageConfigFromSupabase_()`
- `index.html` L3098 — `fetchSupabaseCatalog_()`
- `index.html` L3120 — `onProductsLoaded(data)` — agrupa producto → color → talle, llena `products`
- `index.html` L3222 — `onProductsError(err)`
- `index.html` ~L3152–3180 — precompute fechas última compra por sucursal

## 🎯 Qué hace
1. Lee `?mode=` → carga `PAGE_CONFIGS[mode]`.
2. (Opcional) carga override de `page_config` desde Supabase.
3. Fetch a `catalog_cache` (REST + anon key).
4. Si hay IndexedDB cacheado (<1h), lo usa primero — el [[Service Worker]] con strategy stale-while-revalidate también ayuda.
5. `onProductsLoaded` agrupa flat → jerarquía + precalcula últimas compras.
6. Llama `applyFilters` → arranca UI.

## 🔗 Variables / IDs / clases
- JS: `rawData`, `products`, `filteredProducts`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PAGE_CONFIGS`
- Constantes `IDB_*` para keys de IndexedDB

## 🔌 Depende de
- [[Supabase Schema]] (`catalog_cache`, `page_config`)
- [[Service Worker]] (intercepta el fetch)
- [[Page Modes]] (qué traer)

## 🔁 Consumido por
- [[Búsqueda y Filtros]]
- [[Gallery View]] · [[Table View]]
- [[Auto-Refresh]] (re-fetch periódico)

## ⚠️ Gotchas
- El anon key está embedido en `index.html` — público por design, RLS protege escrituras. **No es un secreto** pero tampoco lo replicamos en docs.
- Si el JSON de `catalog_cache` viene troceado (sync server lo parte en chunks), el cliente concatena antes de parsear.
- TTL del IDB cache: ~1 hora.
