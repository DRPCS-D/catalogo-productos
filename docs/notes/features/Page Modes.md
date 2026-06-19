---
tags: [tipo/feature, area/negocio]
aliases: [Modos, Mayorista, Minorista]
---

# Page Modes

> La app tiene 3 modos: **general**, **mayorista** (`?mode=ma`), **minorista** (`?mode=mi`). Cada modo cambia precio default, sucursales visibles, visibilidad de promo, y manifest PWA.

## 📍 Ubicación
- `index.html` L2778 — `var PAGE_CONFIGS = { ... }` (defaults locales)
- `index.html` L3047 — `fetchPageConfigFromSupabase_()` (overrides desde DB)
- `index.html` ~L3229–3280 — `applyPageConfig` (merge defaults + DB)
- `index.html` ~L2700–2710 — detección de `PAGE_MODE` desde URL

## 🎯 Qué hace
- Lee `?mode=` del URL al cargar.
- Carga `PAGE_CONFIGS[mode]` (sucursales, marcas excluidas, `priceMode` default, `showPromo`).
- Hace merge con la fila de `page_config` de [[Supabase Schema]] (DB pisa al default si existe).
- Aplica: filtra sucursales en filtros, define `priceMode`, oculta promo si corresponde.
- Carga el manifest correcto ([[PWA Manifests]]) para que la instalación use el `start_url` y nombre adecuados.

## 🔗 Variables / IDs / clases
- JS: `PAGE_CONFIGS`, `PAGE_MODE`, `fetchPageConfigFromSupabase_`, `priceMode`
- DB: tabla `page_config` ([[Supabase Schema]])

## 🔌 Depende de
- [[PWA Manifests]] (3 manifests)
- [[Supabase Schema]]
- [[Carga de Datos]]

## 🔁 Consumido por
- [[Promociones y Precios]] (oculta o muestra promo)
- [[Búsqueda y Filtros]] (lista de sucursales)
- [[Exportar Excel]] · [[Exportar PDF Móvil]]

## ⚠️ Gotchas
- Si `?mode=` no matchea ninguno, cae al modo "general" (todas las sucursales, mostrar promo).
- Cambiar config de un modo en runtime requiere editar la fila correspondiente en `page_config` desde [[Admin HTML]] — no requiere redeploy.

## 🔗 Link por sucursal (`?suc=`)
Además de `?mode=`, la URL admite **`?suc=<csv>`** para pre-seleccionar sucursales en el sidebar.
- Match **case-insensitive substring** sobre los nombres reales (ej. `?suc=centro` matchea `PATA CENTRO`).
- Multi-sucursal: `?suc=centro,norte`.
- En modos `locked` se intersecta con `cfg.sucursales` (no se pueden meter sucursales fuera del set permitido).
- El filtro queda **pre-seleccionado pero editable** — el cliente puede agregar/quitar después.
- Generador en [[Admin HTML]] (sección "🔗 Links rápidos por sucursal" debajo de las 3 cards de modo).
- Implementación: `index.html` dentro de `applyPageConfig` (bloque "Override por URL" después de la lectura de `cfg.sucursales`).
