---
tags: [tipo/componente, area/frontend]
aliases: [Banner de actualización]
---

# Update Banner

> Banner inferior "Nueva versión disponible — Recargar" que aparece cuando hay un SW nuevo esperando activación.

## 📍 Ubicación
- HTML: `index.html` L6024 (`#update-banner`, al final del archivo, `display:none` inicial)
- JS: `initAppAutoUpdate_` L3366, `activateNewSwAndReload_` L3409 — controlan show/hide

## 🎯 Qué hace
- Se muestra cuando `_newSwWaiting` deja de ser `null` (SW nuevo en estado `waiting`).
- Botón "Recargar" → `activateNewSwAndReload_()` (manda `SKIP_WAITING` al SW + reload).
- En "safe moments" (visibilitychange, idle 5h sin actividad), el reload se hace automático sin tocar el banner.

## 🔗 Variables / IDs / clases
- HTML: `#update-banner`, `.update-banner`
- JS: `_newSwWaiting` ([[Glosario]]), funciones del [[Auto-Update]]

## 🔌 Depende de
- [[Service Worker]] (evento `updatefound`)
- [[Auto-Update]] (orquesta el flujo)

## ⚠️ Gotchas
- El banner solo aparece si `isUserBusy_()` (L3533) **no** matchea — si el usuario tiene PDF abierto, sidebar abierta o input enfocado, se posterga.
