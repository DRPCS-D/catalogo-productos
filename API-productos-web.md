# API de productos (solo lectura, sin contraseña, solo precio minorista)

**URL:** `https://bjquqvjdwvbimsffpbmh.supabase.co`
**KEY:** `<la anon larga, eyJ...>` (va en los encabezados `apikey` y `Authorization: Bearer <KEY>`)

Se llama con `POST` a `{URL}/rest/v1/rpc/<funcion>`, con body JSON y `Content-Type: application/json`.

## 1) `get_products_page` — una página de productos

Parámetros (todos opcionales):

| Parámetro | Descripción |
|---|---|
| `p_page` | Número de página, desde 1 (default 1) |
| `p_size` | Productos por página (default 24, máximo 100) |
| `p_search` | Texto: busca por nombre, código y marca; ignora acentos y mayúsculas; todas las palabras tienen que coincidir |
| `p_marca` | Filtro exacto por marca |
| `p_grupo` | Filtro exacto por grupo |
| `p_sucursales` | **Lista** de sucursales, por ejemplo `["ROCK SPORT","ROCK SPORT KM7"]`. Solo productos con stock en alguna de ellas (nombre exacto, sin distinguir mayúsculas). El total y la paginación ya cuentan solo esos productos |
| `p_sucursal` | Una sola sucursal (texto). Equivale a `p_sucursales` con un elemento; si se pasan las dos, se juntan |
| `p_excluir_subgrupos` | **Lista** de subgrupos a excluir, por ejemplo `["FISIOTERAPIA","GYM VARIOS"]`. No distingue mayúsculas. Los valores válidos salen de `get_products_filters` |

Respuesta: `{ page, size, total, total_pages, updated_at, items: [...] }`
Orden: más vendidos primero.

Cada item:

```
id, codFabrica, nmProduto, marca, grupo, subgrupo, colecao,
precioMinorista, precioMinoristaPromo, precioMinoristaPromoInicio,
precioMinoristaPromoValidade, totalStock,
colores: [ { color, imagen, imgId, imgV, totalStock,
             stock:  [ { sucursal, cantidad } ],
             talles: [ { talle, totalStock,
                         stock: [ { sucursal, cantidad } ] } ] } ]
```

- `stock` de cada color es la suma de todos sus talles por sucursal.
- `talles` trae el stock de cada talle, en total y por sucursal.
- Las sucursales sin stock no aparecen en ninguna lista.
- **Con `p_sucursales` (o `p_sucursal`) el stock queda restringido a esas sucursales:** `stock`, `talles[].stock` y los `totalStock` (de talle, color y producto) se recalculan solo con ellas. Los colores sin stock en esas sucursales no vienen. Los talles sí vienen todos, con `totalStock: 0` si no hay ahí.
- Sin `p_sucursales` ni `p_sucursal`, cada producto trae el stock de todas las sucursales.

## 2) `get_products_filters` — valores para los filtros

Respuesta: `{ marcas: [...], grupos: [...], subgrupos: [...], sucursales: [...] }`
Para los desplegables. Pedirla una sola vez por visita.

## Ejemplo

```js
const URL = "https://bjquqvjdwvbimsffpbmh.supabase.co";
const KEY = "LA_CLAVE_ANON_LARGA"; // eyJ...

async function rpc(fn, args = {}) {
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args)
  });
  return r.json();
}

const { items, total, total_pages } = await rpc("get_products_page", {
  p_page: 1, p_size: 24, p_search: "zapatilla", p_marca: "MARCA X",
  p_sucursales: ["ROCK SPORT", "ROCK SPORT KM7"],
  p_excluir_subgrupos: ["FISIOTERAPIA"]
});

const { marcas, grupos, subgrupos, sucursales } = await rpc("get_products_filters");
```

## Precios y promos

- Precios en guaraníes, sin decimales. Mostrar con separador de miles (es-PY).
- La promo vale si `precioMinoristaPromo > 0` y hoy está entre `precioMinoristaPromoInicio` y `precioMinoristaPromoValidade`.
- Un inicio de `"1899-12-30"` significa "sin fecha de inicio".

## Imágenes

Están en Google Drive, no en Supabase:

```
https://lh3.googleusercontent.com/d/{imgId}=w{ancho}?v={imgV}
```

- Ancho sugerido: 400 para tarjeta, 1600 para ampliar.
- `imgId` puede venir vacío: producto sin foto.
- `imgV` es la versión de la foto; cambia cuando se reemplaza la imagen.

## Qué no incluye

- Precios mayoristas (Mayorista 1 y mayorista).
- EAN (código de barras) de cada talle.
- Fechas de última compra y última venta.
- Productos de marcas o sucursales excluidas en la configuración.

## Consumo

Cada llamada es chica (~3 KB por página de 24 productos, comprimida), pero no conviene pedir todas las páginas de golpe: pedir una página por vez, al navegar.
