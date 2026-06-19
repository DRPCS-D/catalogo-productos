---
tags: [tipo/archivo, area/frontend, tipo/pwa]
aliases: [manifest.json]
---

# PWA Manifests

> 3 manifests para 3 modos de instalación. Cada modo cambia el `start_url` con su query y carga distintos [[Page Modes]].

## 📍 Ubicación
- `manifest.json` — modo general (sin query param)
- `manifest-mayorista.json` — `start_url: ./?mode=ma`
- `manifest-minorista.json` — `start_url: ./?mode=mi`

## 🎯 Qué hace
- Cada manifest declara nombre, icono, color, `display: standalone`.
- En `index.html` se elige cuál `<link rel="manifest">` cargar según `?mode=` o ruta.
- Cuando el usuario instala desde "Agregar a pantalla de inicio", el manifest activo en ese momento dicta el icono y el `start_url`.

## 🔗 Recursos
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png`
- Estos están en `SHELL_URLS` del [[Service Worker]] → precacheados

## 🔌 Depende de
- [[Page Modes]] (lógica del `?mode=` query)
- [[Service Worker]] (precache)

## ⚠️ Gotchas
- iOS Safari ignora algunos campos (`screenshots`, `shortcuts`) — verificar antes de prometer features que dependan de esos campos.
- Cambiar el `start_url` con un parámetro `?mode=` rompe el match con el cache `shell-v5` si el SW intercepta la navegación literalmente. El [[Service Worker]] devuelve `index.html` como fallback de navegación, lo cual mitiga.
