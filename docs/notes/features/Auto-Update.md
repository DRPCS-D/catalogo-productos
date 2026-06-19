---
tags: [tipo/feature, area/frontend]
aliases: [SW update, Update silencioso]
---

# Auto-Update

> Detecta automáticamente cada 30 min si hay un Service Worker nuevo. Muestra banner y/o recarga **en safe moments** (sin interrumpir al usuario).

## 📍 Ubicación
- `index.html` L3362 — `_newSwWaiting` (estado global)
- `index.html` L3366 — `initAppAutoUpdate_()` (init + intervalo)
- `index.html` L3409 — `activateNewSwAndReload_()` (manda `SKIP_WAITING` + reload)
- `index.html` L3533 — `isUserBusy_()` (gate de safe moment)

## 🎯 Qué hace
1. Al cargar la app, `initAppAutoUpdate_` registra:
   - Polling cada 30 min de `registration.update()`.
   - Listener `updatefound` → guarda en `_newSwWaiting`.
   - Listener `visibilitychange` → si hay SW waiting y el usuario no está ocupado, recarga.
   - Ticker cada 5h → si no está ocupado, recarga.
2. Cuando aparece SW waiting:
   - Si `isUserBusy_()` falso → reload silencioso vía `activateNewSwAndReload_()`.
   - Si está ocupado → muestra [[Update Banner]] para que el usuario decida.

## 🔗 Variables / IDs / clases
- JS: `_newSwWaiting`, `initAppAutoUpdate_`, `activateNewSwAndReload_`, `isUserBusy_`
- HTML: `#update-banner` (L6024)
- Cliente posta `'SKIP_WAITING'` al SW (ver [[Service Worker]] L165)

## 🔌 Depende de
- [[Service Worker]] (eventos `updatefound`, `controllerchange`)
- [[Update Banner]] (UI fallback)
- [[Sistema de Versiones]] (escape hatch manual)

## ⚠️ Gotchas
- `isUserBusy_()` bloquea reload si: PDF overlay abierto, sidebar abierta, input enfocado. Si se agrega un nuevo overlay/modal, **agregarlo a esta función** o se reseteará al usuario en medio del flujo.
- El reload por `visibilitychange` se dispara cuando el usuario vuelve a la pestaña — UX clave en mobile (la pestaña queda en background largo rato).
- `controllerchange` fuerza un `location.reload()` — sin él, el cliente queda atado al SW viejo hasta que cierre todas las tabs.
