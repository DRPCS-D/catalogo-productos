---
tags: [tipo/data, area/backend]
aliases: [Supabase, DB schema]
---

# Supabase Schema

> 3 tablas en Supabase Cloud. Anon key embedido en cliente; RLS protege escrituras.

## 📍 Ubicación de configuración
- URL: `index.html:2748` (`SUPABASE_URL`)
- Anon key: `index.html:2749` (`SUPABASE_ANON_KEY`)

## 📊 Tablas

### `catalog_cache`
- **Propósito**: snapshot del catálogo agrupado, listo para consumir desde el cliente.
- **Origen**: poblada por [[Sync Server (Python)]] o por [[Apps Script (Code.gs)]].
- **Columnas típicas**:
  - `id` (PK)
  - `data` (JSONB con la jerarquía agrupada — puede venir chunkeado si excede tamaño)
  - `updated_at`
- **RLS**: SELECT público (anon key alcanza). INSERT/UPDATE solo service role.

### `page_config`
- **Propósito**: override por modo de los defaults de [[Page Modes]].
- **Columnas típicas**:
  - `mode` (`'general' | 'mayorista' | 'minorista'`) — PK
  - `sucursales` (array)
  - `marcas_excluidas` (array)
  - `price_mode` ('minorista' | 'mayorista')
  - `show_promo` (bool)
- **RLS**: SELECT público. UPDATE solo desde [[Admin HTML]] tras auth contra `admin_secret`.

### `admin_secret`
- **Propósito**: hash bcrypt del PIN admin.
- **Columnas**:
  - `id` (PK)
  - `pin_hash` (text, bcrypt)
- **RLS**: SELECT permitido para que [[Admin HTML]] pueda comparar el bcrypt del input contra el hash. **Nunca insertar PIN plano en la columna.**

## 🔌 Depende de
- [[Sync Server (Python)]] (escribe `catalog_cache`)
- [[Apps Script (Code.gs)]] (puede escribir `catalog_cache` desde Sheets como respaldo)

## 🔁 Consumido por
- [[Carga de Datos]]
- [[Admin HTML]]

## ⚠️ Gotchas
- Si bumpeás el schema, regenerá los tipos en cliente si aplica.
- Las policies de RLS son la única línea de defensa para escrituras — verificar después de cualquier cambio en tablas con `EXPLAIN (FORMAT JSON) SELECT ...` desde el dashboard.
- Ver [[Seguridad y Secrets]] para la política sobre el anon key y el PIN.
