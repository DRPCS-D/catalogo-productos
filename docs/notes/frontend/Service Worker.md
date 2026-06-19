---
tags: [tipo/archivo, area/frontend, tipo/pwa]
aliases: [sw.js, SW]
---

# Service Worker

> PWA Service Worker. **3 estrategias de cache** + control del ciclo de vida para [[Auto-Update]].

## 📍 Ubicación
- `sw.js` (171 líneas) — todo el SW
- `CACHE_VERSION = 'v5'` en `sw.js:15` ← **bumpear acá para invalidar todo**
- Registro: `index.html:2816–2830` (`navigator.serviceWorker.register('./sw.js')`)

## 🎯 Qué hace

| Recurso | Estrategia | Cache name |
|---|---|---|
| Shell (HTML, manifest, icons) | precache + cache-first, fallback a network | `shell-v5` |
| `catalog_cache` (Supabase REST) | stale-while-revalidate | `data-v5` |
| Imágenes Drive (`lh3.googleusercontent.com`) | cache-first con TTL 7 días | `img-v5` |

- `install` → precache `SHELL_URLS` + `skipWaiting()` (activa el SW nuevo enseguida)
- `activate` → borra caches viejos + `clients.claim()`
- `fetch` → router por hostname/path (orden de chequeo: imgs Drive → Supabase → mismo origen → passthrough)
- `message` → acepta `'SKIP_WAITING'` y `'CLEAR_CACHES'` desde el cliente

## 🔗 Variables / IDs / clases
- SW: `CACHE_VERSION`, `SHELL_CACHE`, `DATA_CACHE`, `IMG_CACHE`, `SHELL_URLS`, `IMG_TTL`
- Helpers: `cacheFirstWithTtl_`, `staleWhileRevalidate_`
- En cliente: `_newSwWaiting` ([[Glosario]]), funciones de [[Auto-Update]]

## 🔌 Depende de
- [[PWA Manifests]] (sirve los manifests precacheados)

## 🔁 Consumido por
- [[Auto-Update]] (escucha `updatefound` + `controllerchange`)
- [[Carga de Datos]] (stale-while-revalidate sirve datos instantáneos)
- [[Google Drive Fotos]] (cache 7 días)

## ⚠️ Gotchas
- **Bumpear `CACHE_VERSION`** en cada deploy con cambios de shell, o los usuarios quedan en la versión vieja hasta que la PWA detecte el SW nuevo.
- `skipWaiting()` en `install` significa que el SW nuevo toma control inmediato — combinado con `clients.claim()` puede causar reload-mid-session si no se gestiona desde [[Auto-Update]] con `controllerchange`.
- Respuestas `opaque` (cross-origin sin CORS) no se pueden inspeccionar — se guardan tal cual.
