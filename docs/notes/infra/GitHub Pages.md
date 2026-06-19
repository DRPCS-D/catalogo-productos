---
tags: [tipo/infra, area/deploy]
aliases: [Pages, Hosting]
---

# GitHub Pages

> El sitio se sirve desde GitHub Pages — push a `main` → auto-deploy vía [[GitHub Actions (pages.yml)]].

## 📍 Configuración
- Repo: `https://github.com/DRPCS-D/catalogo-productos` (público)
- Branch: `main`
- Source: configurado como **GitHub Actions** (no como branch source clásico)
- Custom domain (si aplica): verificar `CNAME` en raíz

## 🎯 Qué hace
- Sirve `index.html`, `admin.html`, `sw.js`, manifests, icons como contenido estático.
- HTTPS automático (cert de GitHub).
- Sin server-side — toda la lógica corre en el cliente o en Supabase.

## 🔌 Depende de
- [[GitHub Actions (pages.yml)]] (deploy)
- [[Service Worker]] (debe poder cachear todo el shell)

## ⚠️ Gotchas
- Cualquier ruta que el SW no reconozca cae a `index.html` (SPA-like) por el `navigate` fallback — verificar antes de agregar nuevas páginas estáticas.
- El propagation del deploy puede tardar 1–2 min. El `gh-pages` clásico no se usa — todo va por Actions.
- Si el repo se vuelve privado, GitHub Pages necesita Pro/Team — confirmar antes de cambiar visibilidad.
