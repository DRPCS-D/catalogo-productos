---
tags: [tipo/feature, area/frontend]
aliases: [EAN, Barcode, Escáner]
---

# Escáner EAN

> Tres piezas alrededor del código de barra EAN-13: **búsqueda por EAN** en el buscador, **escáner con cámara** (API nativa `BarcodeDetector`, solo móvil compatible) y **popup que dibuja el código de barra** de un talle.

## 📍 Ubicación
- Botón escanear en el buscador: `#btn-search-scan` L3752 (CSS `.btn-scan-barcode` L1028 — visible solo con soporte, clase `has-scan`)
- Soporte: `scanBarcodeSupported_` L6960 (requiere `BarcodeDetector` + `getUserMedia`)
- Diagnóstico: `showScanDiagnostic_` L6966 — se abre tocando la versión en el pie del [[Sidebar]] (L3881)
- Escáner: `openBarcodeScanner_` L7014 · `scanLoop_` L7048 · `onBarcodeScanned_` L7070 · `closeBarcodeScanner_` L7086
- Popup EAN-13: `openBarcodeModal_` L6931 · `closeBarcodeModal_` L6943 · HTML `#barcode-overlay` L4067

## 🎯 Qué hace
- **Buscar por EAN**: escribir/pegar un EAN completo en `#search-input` filtra la galería y muestra **solo la card del color que matchea** (ignora filtros activos). Normaliza dígitos ancho-completo (teclados asiáticos/iOS).
- **Escanear**: cámara trasera + `BarcodeDetector({ formats: ['ean_13'] })` en loop; al detectar, dispara la misma búsqueda.
- **Popup**: dibuja el EAN-13 como barras SVG/HTML puro (sin librería). Se abre desde la tabla de talles del [[Modal Detalle]] (L6702) y desde el botón ▌▌▌ de cada línea del [[Carrito]].

## 🔌 Depende de
- [[Búsqueda y Filtros]] (el EAN entra por el mismo `applyFilters`)
- [[Modal Detalle]] · [[Carrito]] (consumen `openBarcodeModal_`)

## ⚠️ Gotchas
- `BarcodeDetector` solo existe en Chrome/Edge Android y algunos WebView — **iOS Safari no lo soporta**; ahí el botón de escanear no aparece. El diagnóstico oculto (tap en versión) existe justamente para debuggear esto en campo.
- La búsqueda por EAN **saltea los filtros activos** (`_productPassesFilters_(p, true)` L6805) — si no, un filtro de marca dejaba la galería vacía aunque el EAN matcheara.
- `getUserMedia` requiere HTTPS — funciona en GitHub Pages pero no en `file://` ni HTTP plano.
