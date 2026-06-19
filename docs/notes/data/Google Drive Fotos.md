---
tags: [tipo/data, area/backend]
aliases: [Drive, Fotos]
---

# Google Drive Fotos

> Carpeta Drive con todas las fotos de productos. El cliente las consume vía thumbnails de `lh3.googleusercontent.com` con cache 7 días en el [[Service Worker]].

## 📍 Ubicación
- Folder ID en `sync-server/sync.py`
- URL del thumbnail en cliente: `https://lh3.googleusercontent.com/d/{fileId}=w{size}` (ej. `=w400`)
- Fullsize para [[Lightbox]]: `=w1600` o `=s0`

## 🎯 Qué hace
- El [[Sync Server (Python)]] lista la carpeta, mapea `cod_producto` → `file_id`.
- El `file_id` viaja en `catalog_cache` como campo del producto.
- El cliente construye la URL al renderizar; el SW cachea con TTL 7 días.

## 🔌 Depende de
- [[Sync Server (Python)]] (mapeo)

## 🔁 Consumido por
- [[Gallery View]] · [[Modal Detalle]] · [[Lightbox]]
- [[Exportar PDF Móvil]] (mismas URLs)

## ⚠️ Gotchas
- Drive cambia ocasionalmente el dominio de thumbnails (`lh3` vs `lh4`/`lh5`) — todas resuelven, pero el SW solo cachea `lh3` literal. Si Drive empuja `lh4`, el cache falla. Si esto pasa, ampliar el match del SW (`sw.js:74`).
- Las imágenes son `opaque` para el SW (no expone CORS) — se cachean pero no se pueden inspeccionar.
- Cambiar el FileId de una foto rompe el cache para ese producto hasta el TTL — para forzar invalidación, bumpear `CACHE_VERSION` (`sw.js:15`).
