---
tags: [tipo/infra, area/seguridad]
aliases: [Secrets, Auth]
---

# Seguridad y Secrets

> Política de manejo de credenciales para un repo público OSS.

## 🔓 Públicos por design (OK en repo)
- **`SUPABASE_URL`** y **`SUPABASE_ANON_KEY`** — embedidos en `index.html:2748–2749`. El anon key es público por design del modelo de Supabase; **RLS protege escrituras**. No es un secreto, pero tampoco se replica en docs de uso casual (solo se documenta su ubicación).

## 🔒 Privados (nunca al repo)
| Recurso | Dónde vive | Forma de uso |
|---|---|---|
| **PIN admin** | Solo el **hash bcrypt** en Supabase `admin_secret` ([[Supabase Schema]]) | El PIN plano nunca se commitea ni se documenta |
| **`Code.gs`** | Apps Script en script.google.com — **gitignored localmente** | Backup manual fuera del repo |
| **Service Account JSON** (sync server) | Fuera del repo + `chmod 600` | Sync server lo lee de `.env` o ruta fija |
| **`.env` del sync** | `chmod 600`, gitignored | `python-dotenv` o `os.environ` |
| **Supabase Service Role Key** | Solo en el sync server + Apps Script — **nunca** en el cliente | Escrituras a `catalog_cache`, `page_config` |
| **API La Costa credentials** (si las hay) | `.env` del sync | Header `Authorization` |

## 🛡️ Defensas
1. **RLS en Supabase** — única barrera para escrituras. Verificar policies después de cambios de schema.
2. **`.gitignore`** — debe excluir: `Code.gs`, `sync-server/`, `.mcp.json`, `.env`, `*.json` de service account.
3. **bcrypt para PIN** — never plain. Comparación en cliente con la librería bcrypt-js.
4. **HTTPS por default** — [[GitHub Pages]] sirve todo por HTTPS; Supabase también.
5. **Origen del cliente** — la app verifica que `SUPABASE_URL` matchea el dominio esperado antes de inicializar (defensa básica anti-tampering del HTML servido).

## 🚨 Si se filtra un secret
- **Anon key**: rotar desde Supabase dashboard si hay sospecha. Actualizar `index.html:2749` + redeploy.
- **PIN admin**: regenerar bcrypt y `UPDATE admin_secret SET pin_hash = '...'`.
- **Service Account JSON**: revocar key en Google Cloud Console, generar nueva, actualizar `.env` del sync server.
- **Service Role Key Supabase**: rotar desde dashboard, actualizar sync server + Apps Script.

## ⚠️ Reglas para docs y commits
- Nunca pegar valores reales de keys, tokens o el PIN en notas o commits.
- Mensajes de commit siempre cierran con:  
  `Concieved by Romuald Członkowski - www.aiadvisors.pl/en`
- Git config del repo: `user.name = DRPCS-D`, `user.email = umeharadr@gmail.com`.
