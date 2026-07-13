---
tags: [tipo/infra, area/backend]
aliases: [pdf-service, Puppeteer]
---

# PDF Service

> Microservicio Node/Express + **Puppeteer** que renderiza el catálogo en Chromium headless y genera PDFs vía `page.pdf()`. Corre en Docker en el servidor Ubuntu de la LAN. Copia local del código en `pdf-service/`.

## 📍 Ubicación
- Local (copia espejo): `pdf-service/` — `server.js`, `Dockerfile`, `docker-compose.yml`, `package.json`
- Producción: `/home/diago/docker/pdf-service/` en el Ubuntu de la LAN (`diago@192.168.90.19`)
- Puerto: `:3001` (`app.listen` en `server.js` L862)

## 🎯 Endpoints (`server.js`)
| Ruta | Qué hace |
|---|---|
| `GET /health` | ping (L334) |
| `GET /brands` | lista de marcas disponibles (L337) |
| `GET /stock` | consulta de stock (L380) |
| `GET/POST /pdf` | genera el PDF del catálogo (L520–521) |
| `GET/POST /config` | lee/escribe configuración (L524, L533) |
| `POST /cache/clear` | invalida cache interno (L558) |
| `GET /admin` | mini panel HTML de administración (L567) |

## ⚙️ Cómo genera el PDF
- `puppeteer.launch()` (L200) → viewport 1280×900 → navega al catálogo → `page.pdf()` (L299).
- Las fotos del card usan `object-fit: contain` con **fondo blanco** — con fondo de color quedaban bandas laterales (letterboxing) en fotos no-4:3.

## 🖥️ Deploy
```bash
scp -i ~/.ssh/id_ed25519 pdf-service/server.js diago@192.168.90.19:~/docker/pdf-service/
ssh diago@192.168.90.19 "cd ~/docker/pdf-service && docker compose down && docker compose up -d --build"
```

## 🔌 Depende de
- [[Supabase Schema]] / el catálogo publicado (lo que Chromium renderiza)
- [[GitHub Pages]] (URL del catálogo que abre Puppeteer)

## ⚠️ Gotchas
- El código se `COPY`a a la imagen (no volume) — cambios en `server.js` requieren rebuild con `--build`.
- Solo accesible desde la LAN, igual que el [[Sync Server (Python)]].
- Mantener la copia local `pdf-service/` en sync con el server — es la fuente de verdad versionada.
