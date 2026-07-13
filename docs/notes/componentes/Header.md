---
tags: [tipo/componente, area/frontend]
aliases: [Topbar]
---

# Header

> Barra superior: logo + título + **⚠️ advertencia de sync** + **refresh chip** + botones **Galería/Tabla** (desktop) + chips de favoritos y carrito.

## 📍 Ubicación
- HTML: `index.html` ~L3680–3745
- `#sync-warning-icon` L3687 (oculto por default)
- `#refresh-chip` L3688
- `#btn-gallery` L3692, `#btn-table` L3701 (botones separados — ya no es un toggle único)
- JS: `switchView` L7202, `toggleView_` L7239, `updateRefreshChip` L4817, `updateSyncWarningIcon_` L4838
- CSS: tokens en [[Estilos y Tema]]

## 🎯 Qué hace
- Muestra logo + nombre comercial.
- **⚠️ Sync warning**: visible **solo si la última fila de `sync_log` tiene `status === 'ERROR'`** (no por antigüedad). El `title` incluye tiempo relativo + primeros 120 chars del error. Estado en `lastSyncLogRow` (L4315), cargado junto al catálogo.
- **Refresh chip**: muestra solo el tiempo desde la última carga (sin "hace"); vacío si "recién".
- **Vista**: en desktop dos botones separados `⊞` Galería / `☰` Tabla con clase `.active`; en móvil los reemplaza la [[Bottom Nav]].
- Chips de [[Favoritos]] y [[Carrito]] con contadores.

## 🔗 Variables / IDs / clases
- HTML: `#sync-warning-icon`, `#refresh-chip`, `#btn-gallery`, `#btn-table`
- JS: `currentView`, `lastSyncLogRow` ([[Glosario]])
- CSS: `.refresh-chip`, `.view-toggle-btn`, `.sync-warning-btn`

## 🔌 Depende de
- [[Auto-Refresh]] (alimenta `updateRefreshChip`)
- [[Sync Server (Python)]] (escribe `sync_log` que alimenta el ⚠️)
- [[Gallery View]] · [[Table View]] · [[Favoritos]] · [[Carrito]]

## ⚠️ Gotchas
- El `updateRefreshChip` corta la string `hace ` del resultado de `relativeTime_` (L4970) — si se cambia ese helper, revisar acá.
- El ⚠️ antes también aparecía por staleness (>3h sin sync) — se quitó a propósito: solo ERROR. No reintroducir sin pedirlo.
