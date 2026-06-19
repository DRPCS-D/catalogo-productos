---
tags: [tipo/feature, area/frontend]
aliases: [Versionado, APP_VERSION]
---

# Sistema de Versiones

> `APP_VERSION` + `APP_BUILD` visibles en el pie de [[Sidebar]]. Botón **Actualizar app** fuerza recarga limpia (unregister SW + clear caches + reload).

## 📍 Ubicación
- `index.html` L3312–3313 — declaración:
  ```js
  var APP_VERSION = '1.2.2';
  var APP_BUILD   = '2026-06-11';
  ```
- `index.html` L3321 — `forceUpdateApp_()` (action del botón "Actualizar app")
- `index.html` L2620 — `#app-version` (donde se pinta)

## 🎯 Qué hace
- Muestra `v{APP_VERSION} · {APP_BUILD}` en el pie de la sidebar.
- Botón "Actualizar app" → `forceUpdateApp_()`:
  1. Confirma con [[Confirm Dialog]].
  2. `registration.unregister()` (SW)
  3. `caches.delete(...)` para todos los caches del SW
  4. `location.reload(true)`

## 🔗 Variables / IDs / clases
- JS: `APP_VERSION`, `APP_BUILD`, `forceUpdateApp_`
- HTML: `#app-version`, botón "Actualizar app" en sidebar footer
- CSS: `.app-version-row` con `white-space: nowrap`

## 🔌 Depende de
- [[Service Worker]] (lo desregistra)
- [[Confirm Dialog]]
- [[Sidebar]] (host)

## 🔁 Relación con [[Auto-Update]]
- El versioning es **manual + visible** (el usuario sabe qué corre).
- El auto-update es **automático + transparente** (detecta SW nuevo y recarga en safe moment).
- Ambos coexisten — el botón es el escape hatch cuando el auto no se disparó.

## ⚠️ Gotchas
- Subir `APP_VERSION` no invalida el cache por sí solo — hay que también bumpear `CACHE_VERSION` en `sw.js:15` para que el shell se redescargue.
