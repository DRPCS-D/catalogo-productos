---
tags: [tipo/componente, area/frontend]
aliases: [Visor]
---

# Lightbox

> Visor fullscreen de una sola imagen con caption. Se abre desde card de [[Gallery View]] o desde foto del [[Modal Detalle]].

## 📍 Ubicación
- HTML: `index.html` L2709 (`#lightbox`), L836–1003 (estructura completa)

## 🎯 Qué hace
- Toma una URL de imagen + caption.
- Muestra la imagen al tamaño máximo del viewport.
- Cierra con `Esc`, click en fondo, o botón ✕.
- Body bloquea scroll mientras está abierto.

## 🔗 Variables / IDs / clases
- HTML: `#lightbox`, `.lightbox-img`, `.lightbox-caption`

## 🔌 Depende de
- [[Gallery View]] · [[Modal Detalle]] (lo invocan)
- [[Google Drive Fotos]] (origen de las imágenes)

## ⚠️ Gotchas
- Para fotos de Drive: la URL del lightbox debería ser la versión fullsize (no la thumbnail), por eso el link de la foto es a `=w1600` o `=s0` en lugar del `=w400` del card.
