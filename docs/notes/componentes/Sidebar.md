---
tags: [tipo/componente, area/frontend]
aliases: [Panel de filtros]
---

# Sidebar

> Panel lateral con todos los filtros: marca, grupo, talle, sucursal, stock, foto, promo, precio, fecha última compra. Pie con versión + botón **Actualizar app**.

## 📍 Ubicación
- HTML: `index.html` L2511–2620
- Sección "Más opciones" (collapsible): `<details>` dentro del sidebar (Precio, Última compra, Promoción)
- `#app-version` (pie): L2620
- JS: `toggleSidebar` L4320, `scrollFilterToTop_` L3502

## 🎯 Qué hace
- Lista de filtros agrupados por tipo (multi-select, sliders, toggles).
- **Auto-scroll**: al abrir un multi-select panel, hace scroll para que el `.sidebar-label` correspondiente quede al top del `.sidebar-body` (vía `scrollFilterToTop_`).
- Pie: muestra `v{APP_VERSION} · {APP_BUILD}` + botón **Actualizar app** ([[Auto-Update]]/[[Sistema de Versiones]]).
- Colapsable en mobile; siempre visible en desktop.

## 🔗 Variables / IDs / clases
- HTML: `#sidebar`, `#app-version`, `.sidebar-body`, `.sidebar-label`, `.app-version-row`, `details` (Más opciones)
- JS: `toggleSidebar()`, `scrollFilterToTop_()`, `forceUpdateApp_()`

## 🔌 Depende de
- [[Multi-Select]] (panels que dispara)
- [[Búsqueda y Filtros]]
- [[Sistema de Versiones]] · [[Auto-Update]]

## ⚠️ Gotchas
- `scrollFilterToTop_` usa **doble `requestAnimationFrame`** para esperar que el layout se reconcilie tras `panel.classList.add('open')` — si se simplifica a un solo rAF, falla en iOS Safari.
- El pie con `app-version` tiene `white-space: nowrap` + `text-overflow: ellipsis` + `flex-shrink: 0` en el botón para que no wrappee.
- Los `details` de "Más opciones" están abiertos por default si hay algún filtro activo dentro (para no esconder estado).
