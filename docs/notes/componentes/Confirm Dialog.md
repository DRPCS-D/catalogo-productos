---
tags: [tipo/componente, area/frontend]
aliases: [Confirm popup]
---

# Confirm Dialog

> Popup propio (no usa `window.confirm`) para confirmaciones — botón **Cancelar** + **Confirmar**.

## 📍 Ubicación
- HTML: `index.html` ~L1330–1413

## 🎯 Qué hace
- Se invoca con título + mensaje + callback de aceptación.
- Reemplaza `window.confirm` (más customizable, consistente con [[Estilos y Tema]]).
- Lo usa `forceUpdateApp_()` (L3321) entre otros lugares.

## 🔗 Variables / IDs / clases
- HTML: `.confirm-dialog`, `.confirm-overlay`

## 🔌 Consumido por
- [[Sistema de Versiones]] (force update)
- Cualquier acción destructiva del [[Admin HTML]]

## ⚠️ Gotchas
- Si se llama dos veces seguidas, el segundo dialog no se monta sobre el primero — verificar que cierre el anterior antes de abrir.
