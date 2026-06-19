---
tags: [tipo/archivo, area/frontend, tipo/diseño]
aliases: [Tema, CSS, Tokens, Stitch]
---

# Estilos y Tema

> Sistema de diseño basado en el mockup **Stitch (Google)**. Hanken Grotesk + paleta minimalista + radius `4px`.

## 📍 Ubicación
- `index.html` L49–104 — definición de `:root` (tokens) + reset + tipografía
- `index.html` L~1856–2042 — media queries responsive

## 🎨 Tokens principales (L55–80)

```css
:root {
  --primary:      #2B4193;   /* acentos */
  --primary-dark: #1e293b;   /* header / botones oscuros */
  --surface:      #f9f9fb;   /* fondo */
  --surface-dim:  #d9dadc;   /* bordes sutiles */
  --radius:       4px;       /* ROUND_FOUR del mockup */
  --radius-lg:    8px;       /* modales */
}
```

## 🅰️ Tipografía
- **Hanken Grotesk** (Google Fonts) — pesos 300/400/500/600/700
- Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Link en `<head>`: `https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap`

## 🧱 Componentes con estilos propios
- `.card` — aspect-ratio `4/5`, `mix-blend-mode: multiply` en la foto, radius `4px`
- `.card-foot` — wrapper de precio + stock + botón
- `.card-cta` — botón "Ver detalles" full-width, fondo `--primary-dark`
- `.refresh-chip`, `.view-toggle-btn`, `.filter-badge` — micro-controles del [[Header]] / [[Filter Bar]]

## 📱 Breakpoints
- Mobile ≤ 600px
- Tablet 601–1024px
- Desktop > 1024px
- PDF print (`@media print`) — usa `--pmo-print-scale` para zoom (ver [[Exportar PDF Móvil]])

## 🔌 Consumido por
- **Todos los componentes UI** — cambios en los tokens afectan toda la app
- [[Exportar PDF Móvil]] — variables custom para print scale

## ⚠️ Gotchas
- `mix-blend-mode: multiply` requiere fondo no transparente en el parent del `<img>`.
- `aspect-ratio: 4/5` funciona en iOS Safari ≥15. Para 14- habría que usar el padding-hack.
- El theme-color del navegador es `#1e293b` (header oscuro) — coherente con `--primary-dark`.

## 🎨 Inspiración
- Mockup original de [stitch.withgoogle.com](https://stitch.withgoogle.com) — el redesign se llamó internamente "Stitch redesign" (sin importar Tailwind, solo extrayendo tokens).
