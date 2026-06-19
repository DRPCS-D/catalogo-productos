---
tags: [tipo/infra, area/deploy, tipo/ci]
aliases: [pages.yml, CI]
---

# GitHub Actions (pages.yml)

> Único workflow del repo. Dispara en push a `main` → empaqueta todo y lo deploya a [[GitHub Pages]].

## 📍 Ubicación
- `.github/workflows/pages.yml`

## 🎯 Pasos
1. `checkout`
2. `actions/configure-pages@v4`
3. `actions/upload-pages-artifact@v3` (sube todo el repo como artifact)
4. `actions/deploy-pages@v4` (publica)

## 🔗 Permisos
- `contents: read`
- `pages: write`
- `id-token: write`

## ⚠️ Gotchas
- El artifact incluye **todo el repo** (no hay `paths:` filter). Cosas como `sync-server/` o `tests/` viajan también — no es problema porque el SW solo precachea lo del shell, pero ocupa espacio en el artifact.
- Si se agregan secrets para builds (no es el caso hoy), recordar **scopear por entorno** — el workflow corre con permisos limitados pero los secrets están disponibles.
- Si el `actions/deploy-pages@v4` empieza a fallar, suele ser porque el repo tiene Pages configurado en "Branch" en vez de "GitHub Actions" — cambiar en Settings → Pages.
