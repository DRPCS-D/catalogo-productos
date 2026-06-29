// ============================================================
// ARCHIVO HISTÓRICO — NO ES RUNTIME
// ============================================================
// Este Apps Script fue el runtime original del catálogo (servía la web app
// vía doGet, sincronizaba a Google Sheets _cache, y autenticaba el panel
// admin). Hoy esas funciones viven en:
//   - Frontend:   index.html + admin.html (GitHub Pages)
//   - Sync batch: sync-server/sync.py (Docker self-host → Supabase)
//   - Auth admin: bcrypt vs Supabase admin_secret
// Se conserva en docs/legacy/ como referencia. No ejecutarlo — su
// comportamiento ya no está alineado con el schema actual de Supabase.
//
// ============================================================
// CONFIGURACIÓN
// ============================================================
var API_URL = 'http://api.lacostasrl.com.py:56181/productos';
var DRIVE_FOLDER_ID = '1ZiSrtS6XK698C1rwd3Pn7zgT9nVog-7n';

// Sheet sync — la fuente de datos en runtime es un Google Sheet alimentado
// por trigger horario. El ID del Sheet se guarda en ScriptProperties.
var SHEET_ID_PROP    = 'PRODUCTS_SHEET_ID';
var SHEET_NAME       = 'Catálogo La Costa — Productos';
var SHEET_PRODUCTOS  = 'Productos';
var SHEET_CACHE      = '_cache';
var SHEET_META       = '_meta';
var SHEET_CONFIG     = '_config';   // hoja con la config de cada modo del catálogo
var SHEET_USERS      = '_users';    // hoja con usuarios habilitados para el panel admin
var SESSION_TTL_SEC  = 60 * 30;     // 30 min de sesión inactiva
var PASSWORD_SALT_KEY = 'PASSWORD_SALT';
var CHUNK_CHARS      = 45000;   // celdas del _cache (límite real de Sheets: 50.000)

// Modos válidos del web app. Si agregás un modo nuevo (ej. 'distribuidor'),
// se agrega acá y se inserta una fila en la hoja _config.
var PAGE_MODES = ['general', 'mayorista', 'minorista'];

// Headers de la hoja _config (orden fijo)
var CONFIG_HEADERS = ['mode', 'title', 'priceMode', 'sucursales',
                      'marcasExcluidas', 'promoVisible', 'locked',
                      'restrictModalSucursales'];

// Defaults usados si la hoja _config no existe o no tiene la fila del modo.
// Los podés editar acá y se sembran al crear la hoja por primera vez.
var DEFAULT_CONFIGS = {
  general: {
    title:                   'Catálogo de Productos',
    priceMode:               '',
    sucursales:              [],
    marcasExcluidas:         [],
    promoVisible:            true,
    locked:                  false,
    restrictModalSucursales: false
  },
  mayorista: {
    title:                   'Catálogo Mayorista',
    priceMode:               'mayorista',
    sucursales:              ['LA COSTA S.R.L.', 'ON BRAND&TRADE'],
    marcasExcluidas:         [],
    promoVisible:            false,
    locked:                  true,
    restrictModalSucursales: true
  },
  minorista: {
    title:                   'Catálogo Minorista',
    priceMode:               'minorista',
    sucursales:              [
      'PATA 1', 'PATA KM 7', 'PCH KM 4', 'PCH LUQUE',
      'PATA LIMPIO', 'PATA MULTIPLAZA', 'PATA SAN LORENZO',
      'ROCK SPORT', 'ROCK SPORT KM7'
    ],
    marcasExcluidas:         [],
    promoVisible:            true,
    locked:                  true,
    restrictModalSucursales: true
  }
};

// ============================================================
// SERVIDOR WEB
// ============================================================

/**
 * Punto de entrada del web app. Sirve index.html.
 * Configurar en: Implementar > Aplicación web
 *   - Ejecutar como: Yo (necesario para acceder a Drive)
 *   - Acceso: Cualquier persona
 */
function doGet(e) {
  var rawMode = (e && e.parameter && e.parameter.mode) || 'general';

  // Aliases cortos en la URL → modos internos (para que el link sea discreto)
  //   ?mode=ma     → mayorista
  //   ?mode=mi     → minorista
  //   ?mode=admin  → admin
  // Los nombres largos también funcionan (compatibilidad con URLs viejas).
  var URL_ALIASES = {
    'ma':        'mayorista',
    'mi':        'minorista',
    'mayorista': 'mayorista',
    'minorista': 'minorista',
    'general':   'general',
    'admin':     'admin'
  };
  var mode = URL_ALIASES[rawMode] || 'general';

  // Modo admin: panel de configuración (página separada)
  if (mode === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('Configuración — Catálogo La Costa')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Validar modo del catálogo
  if (PAGE_MODES.indexOf(mode) < 0) mode = 'general';

  // Leer la config persistida desde la hoja _config. Si no existe la hoja,
  // se crea con los DEFAULT_CONFIGS y se devuelve esa misma fila.
  var pageConfig = getPageConfig(mode);

  var template = HtmlService.createTemplateFromFile('index');
  template.pageMode   = mode;
  template.pageConfig = JSON.stringify(pageConfig);

  return template.evaluate()
    .setTitle((pageConfig.title || 'Catálogo de Productos') + ' — La Costa')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
// DATOS DE PRODUCTOS
// ============================================================

/**
 * Obtiene todos los productos desde la API.
 * Llamado desde el cliente con google.script.run.getProducts()
 */
function getProducts() {
  var options = {
    method: 'GET',
    muteHttpExceptions: true,
    headers: { Accept: 'application/json' }
  };

  var response = UrlFetchApp.fetch(API_URL, options);
  var code = response.getResponseCode();

  if (code !== 200) {
    throw new Error('Error al conectar con la API. Código HTTP: ' + code);
  }

  return JSON.parse(response.getContentText());
}

// ============================================================
// DATOS AGRUPADOS (optimizado para ~75.000 filas)
// ============================================================

/**
 * Agrupa los productos server-side antes de enviarlos al cliente.
 * Reduce el payload de ~15 MB (75.000 filas planas) a ~900 KB
 * (estructura jerárquica compacta), eliminando datos repetidos.
 *
 * Estructura de retorno:
 * [{ codFabrica, nmProduto, marca, grupo, subgrupo, colecao, precio, totalStock,
 *    colorsArr: [{ color, imagen, totalStock,
 *      gradesArr: [{ grade, ean, totalStock,
 *        stock: [{ sucursal, cantidad, dataUltCmp, dataUltVnd }]
 *      }]
 *    }]
 * }]
 */
/**
 * Devuelve los productos agrupados al cliente.
 *
 * Estrategia multinivel (de más rápido a más lento):
 *   L1 — CacheService (TTL 5 min): hit en milisegundos.
 *   L2 — Hoja `_cache` del Spreadsheet: 1 round-trip a Sheets, <1 s.
 *   L3 — Fallback: corre syncProductsToSheet() inline (sólo la primera vez,
 *        antes de que el trigger horario haya ejecutado al menos una vez).
 *
 * La API HTTP ya NO se consulta desde runtime — sólo desde el trigger.
 */
function getGroupedProducts() {
  var cache  = CacheService.getScriptCache();

  // L1 — Supabase (catalog_cache) es el primary, rápido y atómico.
  // SIN cache local de GAS porque cachePutLarge_ chunking de 19MB toma
  // ~7-10s (worse than the Supabase fetch). Supabase responde en 2-5s.
  var supaJson = readSupabaseCache_();
  if (supaJson) {
    try {
      return JSON.parse(supaJson);
    } catch (e) { Logger.log('Supabase JSON parse error: ' + e.message); }
  }

  // L2 — fallback al Sheet (si Supabase falla por cualquier motivo).
  // Acá SÍ usamos cache GAS porque el Sheet read es aún más lento (~12s).
  var cached = cacheGetLarge_(cache, 'groupedProducts_v1');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* re-fetch */ }
  }
  var json = readCacheSheet_();
  if (json) {
    try {
      var parsed = JSON.parse(json);
      cachePutLarge_(cache, 'groupedProducts_v1', json, 300);
      return parsed;
    } catch (e) { /* json corrupto → re-sync */ }
  }

  // L3 — primera carga histórica antes de que corra el trigger
  syncProductsToSheet();
  json = readCacheSheet_();
  return json ? JSON.parse(json) : [];
}


/**
 * Lee el catálogo agrupado de la tabla catalog_cache de Supabase via REST API.
 * Devuelve el JSON string (no parseado) listo para cachear, o null si falla.
 *
 * Requiere ScriptProperties:
 *   SUPABASE_URL       — https://<ref>.supabase.co
 *   SUPABASE_ANON_KEY  — la anon (public) key del proyecto
 */
function readSupabaseCache_() {
  var props = PropertiesService.getScriptProperties();
  var url   = props.getProperty('SUPABASE_URL');
  var key   = props.getProperty('SUPABASE_ANON_KEY');
  if (!url || !key) {
    Logger.log('Supabase: faltan ScriptProperties SUPABASE_URL / SUPABASE_ANON_KEY');
    return null;
  }

  try {
    // PostgREST: /rest/v1/catalog_cache?select=data&id=eq.1
    // Devuelve un array con un objeto: [{ "data": {...JSONB...} }]
    var endpoint = url.replace(/\/$/, '') +
                   '/rest/v1/catalog_cache?select=data&id=eq.1';
    var resp = UrlFetchApp.fetch(endpoint, {
      method: 'get',
      headers: {
        'apikey':         key,
        'Authorization':  'Bearer ' + key,
        'Accept':         'application/json',
        // Compresión gzip: el JSON de 19MB pasa a ~3MB en el wire.
        // Apps Script descomprime el response automáticamente, así que el
        // resto del código no necesita cambiar.
        'Accept-Encoding': 'gzip',
      },
      muteHttpExceptions: true,
    });
    var code = resp.getResponseCode();
    if (code !== 200) {
      Logger.log('Supabase HTTP ' + code + ': ' + resp.getContentText().slice(0, 300));
      return null;
    }
    var arr = JSON.parse(resp.getContentText());
    if (!arr || !arr.length || !arr[0].data) {
      Logger.log('Supabase: catalog_cache devolvió vacío');
      return null;
    }
    // arr[0].data es el JSONB ya parseado a array de productos. Re-stringify
    // para guardarlo en CacheService (que trabaja con strings).
    return JSON.stringify(arr[0].data);
  } catch (e) {
    Logger.log('readSupabaseCache_ error: ' + e.message);
    return null;
  }
}

/**
 * Agrupa el array plano de la API en la estructura jerárquica que consume
 * el cliente. Extraído del getGroupedProducts() original para que también
 * lo pueda usar syncProductsToSheet().
 *
 * Estructura de retorno:
 * [{ codFabrica, nmProduto, marca, grupo, subgrupo, colecao, precio, totalStock,
 *    colorsArr: [{ color, imagen, totalStock,
 *      gradesArr: [{ grade, ean, totalStock,
 *        stock: [{ sucursal, cantidad, dataUltCmp, dataUltVnd }]
 *      }]
 *    }]
 * }]
 */
function groupRaw_(raw, imageMap) {
  var pMap   = {};
  var pOrder = [];
  imageMap   = imageMap || {};

  raw.forEach(function (item) {
    var pKey   = String(item.codFabrica);
    var itemId = Number(item.id) || 0;

    if (!pMap[pKey]) {
      pMap[pKey] = {
        id:         itemId,           // id máximo del sistema principal (= producto más reciente)
        codFabrica: item.codFabrica,
        nmProduto:  item.nmProduto,
        marca:      item.marca,
        grupo:      item.grupo,
        subgrupo:   item.subgrupo,
        colecao:    item.colecao,
        // Precios (estructura nueva — reemplaza el campo único 'precio')
        precioMinorista:               Number(item.precioMinorista)       || 0,
        precioMinoristaPromo:          Number(item.precioMinoristaPromo)  || 0,
        precioMinoristaPromoInicio:    item.precioMinoristaPromoInicio    || null,
        precioMinoristaPromoValidade:  item.precioMinoristaPromoValidade  || null,
        precioMayorista:               Number(item.precioMayorista)       || 0,
        precioMayoristaPromo:          Number(item.precioMayoristaPromo)  || 0,
        precioMayoristaPromoInicio:    item.precioMayoristaPromoInicio    || null,
        precioMayoristaPromoValidade:  item.precioMayoristaPromoValidade  || null,
        qMasVendio: Number(item.qMasVendio) || 0,   // código de tienda más vendedora
        cMap:  {},
        cOrder: []
      };
      pOrder.push(pKey);
    } else if (itemId > pMap[pKey].id) {
      // Si el mismo codFabrica aparece en múltiples rows con distintos ids,
      // nos quedamos con el más alto (= modificación más reciente).
      pMap[pKey].id = itemId;
    }

    var prod = pMap[pKey];
    var cKey = String(item.color);

    if (!prod.cMap[cKey]) {
      prod.cMap[cKey] = { color: item.color, imagen: item.imagen, gMap: {}, gOrder: [] };
      prod.cOrder.push(cKey);
    }

    var col  = prod.cMap[cKey];
    var gKey = String(item.grade);

    if (!col.gMap[gKey]) {
      col.gMap[gKey] = { grade: item.grade, ean: item.ean, stock: [] };
      col.gOrder.push(gKey);
    }

    col.gMap[gKey].stock.push({
      sucursal:   item.sucursal,
      cantidad:   item.cantidad   || 0,
      dataUltCmp: item.dataUltCmp || null,
      dataUltVnd: item.dataUltVnd || null
    });
  });

  return pOrder.map(function (pKey) {
    var p = pMap[pKey];

    var colorsArr = p.cOrder.map(function (cKey) {
      var c = p.cMap[cKey];

      var gradesArr = c.gOrder
        .map(function (gKey) {
          var g          = c.gMap[gKey];
          var totalStock = g.stock.reduce(function (s, r) { return s + (r.cantidad || 0); }, 0);
          return { grade: g.grade, ean: g.ean, stock: g.stock, totalStock: totalStock };
        })
        .sort(function (a, b) {
          var na = parseInt(a.grade, 10), nb = parseInt(b.grade, 10);
          return (!isNaN(na) && !isNaN(nb)) ? na - nb : String(a.grade).localeCompare(String(b.grade));
        });

      var totalStock = gradesArr.reduce(function (s, g) { return s + g.totalStock; }, 0);
      return {
        color:      c.color,
        imagen:     c.imagen,                          // filename (queda en el Sheet para legibilidad)
        imgId:      imageMap[c.imagen] || null,        // fileId resuelto: el cliente lo usa directo
        gradesArr:  gradesArr,
        totalStock: totalStock
      };
    });

    var totalStock = colorsArr.reduce(function (s, c) { return s + c.totalStock; }, 0);
    return {
      id:                            p.id,
      codFabrica:                    p.codFabrica,
      nmProduto:                     p.nmProduto,
      marca:                         p.marca,
      grupo:                         p.grupo,
      subgrupo:                      p.subgrupo,
      colecao:                       p.colecao,
      precioMinorista:               p.precioMinorista,
      precioMinoristaPromo:          p.precioMinoristaPromo,
      precioMinoristaPromoInicio:    p.precioMinoristaPromoInicio,
      precioMinoristaPromoValidade:  p.precioMinoristaPromoValidade,
      precioMayorista:               p.precioMayorista,
      precioMayoristaPromo:          p.precioMayoristaPromo,
      precioMayoristaPromoInicio:    p.precioMayoristaPromoInicio,
      precioMayoristaPromoValidade:  p.precioMayoristaPromoValidade,
      qMasVendio:                    p.qMasVendio,
      colorsArr:  colorsArr,
      totalStock: totalStock
    };
  });
}

/**
 * Limpia el cache de productos (para forzar refresco antes del TTL).
 */
function clearProductsCache() {
  var cache = CacheService.getScriptCache();
  cache.remove('groupedProducts_v1');
  for (var i = 0; i < 50; i++) cache.remove('groupedProducts_v1_' + i);
  Logger.log('Cache de productos borrado.');
}

/**
 * Guarda un string largo en chunks de ~90 KB para sortear el límite
 * de 100 KB por entrada de CacheService.
 */
function cachePutLarge_(cache, key, value, ttl) {
  var CHUNK = 90000;
  if (value.length < 95000) {
    cache.put(key, value, ttl);
    return;
  }
  var chunks = Math.ceil(value.length / CHUNK);
  var meta   = { chunks: chunks };
  cache.put(key, '__CHUNKED__:' + JSON.stringify(meta), ttl);
  for (var i = 0; i < chunks; i++) {
    cache.put(key + '_' + i, value.substr(i * CHUNK, CHUNK), ttl);
  }
}

function cacheGetLarge_(cache, key) {
  var head = cache.get(key);
  if (!head) return null;
  if (head.indexOf('__CHUNKED__:') !== 0) return head;
  var meta = JSON.parse(head.substring('__CHUNKED__:'.length));
  var out  = '';
  for (var i = 0; i < meta.chunks; i++) {
    var part = cache.get(key + '_' + i);
    if (part == null) return null; // chunk faltante → invalidar
    out += part;
  }
  return out;
}

// ============================================================
// IMÁGENES DE GOOGLE DRIVE
// ============================================================

/**
 * Lee la carpeta de Drive y devuelve un mapa { nombreArchivo: fileId }.
 * El cliente construye la URL con: https://lh3.googleusercontent.com/d/<fileId>
 *
 * REQUISITO: La carpeta de Drive debe estar compartida como
 * "Cualquier persona con el enlace puede ver" para que las
 * imágenes sean accesibles públicamente en los navegadores
 * de los vendedores.
 */
function getImageMap() {
  var cache  = CacheService.getScriptCache();
  var cached = cache.get('imageMap_v1');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* re-fetch */ }
  }

  var map = {};
  try {
    if (typeof Drive !== 'undefined' && Drive.Files && Drive.Files.list) {
      // Camino rápido: Advanced Drive Service (1000 archivos por request)
      var pageToken = null;
      do {
        var resp = Drive.Files.list({
          q: "'" + DRIVE_FOLDER_ID + "' in parents and trashed = false",
          fields: 'nextPageToken, items(id,title)',
          maxResults: 1000,
          pageToken: pageToken
        });
        (resp.items || []).forEach(function (f) { map[f.title] = f.id; });
        pageToken = resp.nextPageToken;
      } while (pageToken);
    } else {
      // Fallback: DriveApp (1 request por archivo, más lento)
      var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var files  = folder.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        map[file.getName()] = file.getId();
      }
    }
  } catch (e) {
    Logger.log('Error al leer carpeta de Drive: ' + e.message);
    return {};
  }

  // Guardar en cache si entra en 100 KB (límite por entrada)
  try {
    var json = JSON.stringify(map);
    if (json.length < 95000) {
      cache.put('imageMap_v1', json, 21600); // 6 horas
    }
  } catch (e) { /* ignorar errores de cache */ }

  return map;
}

/**
 * Limpia el cache manualmente. Ejecutar desde el editor de Apps Script
 * si se agregaron o quitaron fotos y se quiere forzar refresco antes
 * de que expire el TTL de 6 horas.
 */
function clearImageCache() {
  CacheService.getScriptCache().remove('imageMap_v1');
  Logger.log('Cache de imageMap borrado.');
}

// ============================================================
// SHEET SYNC — Base de datos en Google Sheet
// ============================================================
//
// El web app ya no consulta la API en runtime. En su lugar:
//   1) Un trigger horario ejecuta syncProductsToSheet().
//   2) Esa función llama a la API, agrupa los datos y los escribe en
//      un Google Sheet (3 hojas: Productos, _cache, _meta).
//   3) getGroupedProducts() lee de _cache (hoja oculta con JSON troceado).
//
// Pasos de despliegue (una vez):
//   1. Ejecutar setupSheet()         → crea el Spreadsheet y guarda su ID
//   2. Ejecutar syncProductsToSheet() → primera carga manual
//   3. Ejecutar installSyncTrigger()  → agenda el sync horario
// ============================================================

/**
 * Crea el Spreadsheet si no existe y guarda su ID en ScriptProperties.
 * Es idempotente: ejecutarlo varias veces no rompe nada.
 *
 * Salida: log con el ID y la URL del Sheet.
 */
function setupSheet() {
  var props = PropertiesService.getScriptProperties();
  var id    = props.getProperty(SHEET_ID_PROP);
  var ss;

  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (e) {
      Logger.log('Sheet anterior no accesible (' + e.message + '). Creando uno nuevo.');
      ss = null;
    }
  }

  if (!ss) {
    ss = SpreadsheetApp.create(SHEET_NAME);
    props.setProperty(SHEET_ID_PROP, ss.getId());
    Logger.log('Spreadsheet creado: ' + ss.getId());
  }

  // Garantizar las 3 hojas
  ensureSheet_(ss, SHEET_PRODUCTOS, [
    'id','codFabrica','nmProduto','marca','grupo','subgrupo','colecao',
    'precioMinorista','precioMinoristaPromo','precioMinoristaPromoInicio','precioMinoristaPromoValidade',
    'precioMayorista','precioMayoristaPromo','precioMayoristaPromoInicio','precioMayoristaPromoValidade',
    'qMasVendio',
    'color','imagen','grade','ean','totalStockGrade','stockJSON','updatedAt'
  ]);
  ensureSheet_(ss, SHEET_CACHE, null);
  var cacheSheet = ss.getSheetByName(SHEET_CACHE);
  if (!cacheSheet.isSheetHidden()) cacheSheet.hideSheet();

  ensureSheet_(ss, SHEET_META, [
    'lastSyncTs','lastSyncOk','rowCount','apiDurationMs','syncDurationMs','error'
  ]);

  // Borrar la hoja "Sheet1" (Hoja 1) por defecto si existe y no es la nuestra
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja 1') || ss.getSheetByName('Hoja1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) { /* ignorar */ }
  }

  Logger.log('Listo. URL del Sheet: ' + ss.getUrl());
  return ss.getId();
}

/**
 * Helper: crea la hoja si no existe; si se le pasan headers, los escribe en
 * la primera fila y deja la hoja con sólo esa fila.
 */
function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (headers) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

/**
 * Sincronización principal: API → Sheet.
 * Llamada por el trigger horario.
 *
 * Por defecto NO escribe la hoja "Productos" (que tarda 1-3 minutos extra)
 * porque el web app NO la lee — solo lee de "_cache". Si querés también
 * refrescar la hoja "Productos" para auditoría visual, ejecutá syncFull()
 * desde el editor.
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.includeProductosSheet=false] — si true, también
 *   escribe la hoja Productos (más lento, riesgo de timeout 6 min).
 */
function syncProductsToSheet(opts) {
  opts = opts || {};
  // El trigger pasa un objeto de evento, no un objeto de opciones nuestro.
  // Detectar y normalizar para que el flag funcione solo cuando llamamos manual.
  if (opts.triggerUid || opts.authMode || opts.minute) opts = {};

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('No se pudo adquirir el lock — ya hay un sync corriendo.');
    return;
  }

  var ss;
  var tStart = Date.now();
  var apiMs  = 0;

  try {
    var id = getSheetId_();
    if (!id) throw new Error('No hay SHEET_ID configurado. Ejecutar setupSheet() primero.');
    ss = SpreadsheetApp.openById(id);

    var tApi = Date.now();
    var raw  = getProducts();
    apiMs    = Date.now() - tApi;

    // Resolver fileIds de Drive AHORA — server-side. Así los embebemos en el
    // JSON y el cliente nunca más necesita el imageMap completo (que pesaría
    // ~1.4 MB con 20.000+ fotos).
    clearImageCache();
    var imgMap = getImageMap();
    Logger.log('imageMap leído de Drive: ' + Object.keys(imgMap).length + ' archivos.');

    var grouped = groupRaw_(raw, imgMap);
    var json    = JSON.stringify(grouped);

    // Hoja Productos: opt-in. Por defecto se saltea (tarda 1-3 min extra).
    if (opts.includeProductosSheet) {
      Logger.log('Escribiendo hoja Productos...');
      writeProductosSheet_(ss, grouped);
    } else {
      Logger.log('Hoja Productos: omitida (usar syncFull() para refrescarla).');
    }

    writeCacheSheet_(ss, json);
    writeMetaSheet_(ss, {
      ok: true,
      rows: grouped.length,
      apiMs: apiMs,
      totalMs: Date.now() - tStart,
      error: ''
    });

    // Precalentar L1 — el próximo vendedor que entre tiene hit instantáneo
    cachePutLarge_(CacheService.getScriptCache(), 'groupedProducts_v1', json, 300);

    Logger.log('Sync OK — ' + grouped.length + ' productos en ' + (Date.now() - tStart) + ' ms.');
  } catch (e) {
    Logger.log('Sync FAILED: ' + e.message);
    if (ss) {
      try {
        writeMetaSheet_(ss, {
          ok: false,
          rows: 0,
          apiMs: apiMs,
          totalMs: Date.now() - tStart,
          error: e.message
        });
      } catch (_) { /* ignorar */ }
    }
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Sincronización completa MANUAL (con escritura de hoja Productos).
 * Ejecutar desde el editor cuando quieras refrescar la hoja Productos para
 * auditoría visual. Tarda más (3-6 min) — puede chocar con el límite de
 * Apps Script si los datos crecieron mucho. El trigger horario NO debe
 * apuntar a esta función.
 */
function syncFull() {
  syncProductsToSheet({ includeProductosSheet: true });
}

/**
 * Escribe la hoja "Productos" — una fila por codFabrica × color × grade.
 * stockJSON contiene el array de sucursales para no inflar a 1 fila por sucursal.
 */
function writeProductosSheet_(ss, grouped) {
  var sh = ss.getSheetByName(SHEET_PRODUCTOS);
  if (!sh) sh = ensureSheet_(ss, SHEET_PRODUCTOS, [
    'id','codFabrica','nmProduto','marca','grupo','subgrupo','colecao',
    'precioMinorista','precioMinoristaPromo','precioMinoristaPromoInicio','precioMinoristaPromoValidade',
    'precioMayorista','precioMayoristaPromo','precioMayoristaPromoInicio','precioMayoristaPromoValidade',
    'qMasVendio',
    'color','imagen','grade','ean','totalStockGrade','stockJSON','updatedAt'
  ]);

  var now = new Date();
  var rows = [];

  grouped.forEach(function (p) {
    p.colorsArr.forEach(function (c) {
      c.gradesArr.forEach(function (g) {
        rows.push([
          p.id || '', p.codFabrica, p.nmProduto, p.marca, p.grupo, p.subgrupo, p.colecao,
          p.precioMinorista || 0, p.precioMinoristaPromo || 0,
          p.precioMinoristaPromoInicio || '', p.precioMinoristaPromoValidade || '',
          p.precioMayorista || 0, p.precioMayoristaPromo || 0,
          p.precioMayoristaPromoInicio || '', p.precioMayoristaPromoValidade || '',
          p.qMasVendio || 0,
          c.color, c.imagen || '', g.grade, g.ean || '', g.totalStock,
          JSON.stringify(g.stock), now
        ]);
      });
    });
  });

  // Limpiar contenido viejo (preservando la fila 1 de headers)
  var lastRow = sh.getLastRow();
  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).clearContent();
  }

  if (rows.length > 0) {
    sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

/**
 * Escribe la hoja "_cache" — el JSON agrupado completo, troceado en celdas
 * de CHUNK_CHARS caracteres en la columna A. Celda B1 con metadata.
 */
function writeCacheSheet_(ss, jsonStr) {
  var sh = ss.getSheetByName(SHEET_CACHE);
  if (!sh) sh = ensureSheet_(ss, SHEET_CACHE, null);

  // Trocear
  var chunks = [];
  for (var i = 0; i < jsonStr.length; i += CHUNK_CHARS) {
    chunks.push([jsonStr.substr(i, CHUNK_CHARS)]);
  }

  // Limpiar todo y reescribir
  sh.clearContents();

  if (chunks.length > 0) {
    sh.getRange(1, 1, chunks.length, 1).setValues(chunks);
  }

  // Metadata en B1
  sh.getRange(1, 2).setValue(JSON.stringify({
    chunks:    chunks.length,
    updatedAt: new Date().toISOString(),
    bytes:     jsonStr.length,
    version:   1
  }));
}

/**
 * Lee el JSON agrupado completo desde la hoja "_cache".
 * Devuelve null si el cache está vacío o no existe.
 */
function readCacheSheet_() {
  try {
    var id = getSheetId_();
    if (!id) return null;
    var ss = SpreadsheetApp.openById(id);
    var sh = ss.getSheetByName(SHEET_CACHE);
    if (!sh) return null;

    // Leer metadata para saber cuántos chunks esperar
    var meta = sh.getRange(1, 2).getValue();
    if (!meta) return null;
    var info;
    try { info = JSON.parse(meta); } catch (e) { return null; }
    if (!info.chunks || info.chunks < 1) return null;

    var values = sh.getRange(1, 1, info.chunks, 1).getValues();
    var parts  = [];
    for (var i = 0; i < values.length; i++) {
      parts.push(values[i][0]);
    }
    return parts.join('');
  } catch (e) {
    Logger.log('readCacheSheet_ error: ' + e.message);
    return null;
  }
}

/**
 * Anota una fila en la hoja "_meta" con el resultado del sync (para auditoría).
 */
function writeMetaSheet_(ss, info) {
  var sh = ss.getSheetByName(SHEET_META);
  if (!sh) sh = ensureSheet_(ss, SHEET_META, [
    'lastSyncTs','lastSyncOk','rowCount','apiDurationMs','syncDurationMs','error'
  ]);

  sh.appendRow([
    new Date(),
    info.ok ? 'OK' : 'ERROR',
    info.rows || 0,
    info.apiMs || 0,
    info.totalMs || 0,
    info.error || ''
  ]);

  // No dejar crecer indefinidamente: conservar últimas 200 filas
  var lastRow = sh.getLastRow();
  if (lastRow > 201) {
    sh.deleteRows(2, lastRow - 201);
  }
}

/**
 * Lee el ID del Spreadsheet desde ScriptProperties.
 */
function getSheetId_() {
  return PropertiesService.getScriptProperties().getProperty(SHEET_ID_PROP);
}

/**
 * Instala el trigger horario que ejecuta syncProductsToSheet().
 * Primero borra triggers anteriores de la misma función para evitar duplicados.
 */
function installSyncTrigger() {
  uninstallSyncTrigger();
  ScriptApp.newTrigger('syncProductsToSheet')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log('Trigger instalado: syncProductsToSheet cada 1 hora.');
}

/**
 * Borra todos los triggers de syncProductsToSheet.
 */
function uninstallSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var n = 0;
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'syncProductsToSheet') {
      ScriptApp.deleteTrigger(t);
      n++;
    }
  });
  Logger.log('Triggers eliminados: ' + n);
}

// ============================================================
// CONFIG DE PÁGINAS — hoja _config + panel admin
// ============================================================
//
// La hoja `_config` tiene una fila por modo. Columnas:
//   mode | title | priceMode | sucursales | marcasExcluidas | promoVisible | locked
//
// `sucursales` y `marcasExcluidas` se guardan como strings JSON ("[]" si vacío).
// `promoVisible` y `locked` son TRUE/FALSE.
//
// API expuesta al cliente:
//   getPageConfig(mode)  → leer config de un modo (lo usa doGet)
//   getAllConfigs()      → leer todos los modos (lo usa admin.html)
//   saveConfig(mode, c)  → guardar cambios (lo usa admin.html)
//   getAllSucursales()   → lista única de sucursales del catálogo actual
//   getAllMarcas()       → lista única de marcas del catálogo actual

function getPageConfig(mode) {
  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_CONFIG);
  if (!sh) sh = createConfigSheetWithDefaults_(ss);
  migrateConfigSheetSchema_(sh);

  var data = sh.getDataRange().getValues();
  if (data.length < 2) return defaultConfig_(mode);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === mode) return rowToConfig_(data[i]);
  }
  return defaultConfig_(mode);
}

function getAllConfigs() {
  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_CONFIG);
  if (!sh) sh = createConfigSheetWithDefaults_(ss);
  migrateConfigSheetSchema_(sh);

  var data = sh.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) result.push(rowToConfig_(data[i]));
  }
  // Garantizar que estén los 3 modos default (por si alguien borró una fila)
  PAGE_MODES.forEach(function (m) {
    if (!result.some(function (c) { return c.mode === m; })) {
      result.push(defaultConfig_(m));
    }
  });
  return result;
}

function saveConfig(mode, config, token) {
  var session = verifySession(token);
  if (!session) return { ok: false, error: 'No autorizado — sesión inválida o vencida' };

  if (PAGE_MODES.indexOf(mode) < 0) {
    return { ok: false, error: 'Modo inválido: ' + mode };
  }
  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_CONFIG);
  if (!sh) sh = createConfigSheetWithDefaults_(ss);
  migrateConfigSheetSchema_(sh);

  var row = configToRow_(mode, config);
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === mode) {
      sh.getRange(i + 1, 1, 1, CONFIG_HEADERS.length).setValues([row]);
      return { ok: true, mode: mode };
    }
  }
  // Si no existía la fila, appendear
  sh.appendRow(row);
  return { ok: true, mode: mode, created: true };
}

function getAllSucursales() {
  // Lista única de sucursales con stock en los productos actuales.
  var grouped = getGroupedProducts();
  var set = {};
  grouped.forEach(function (p) {
    p.colorsArr.forEach(function (c) {
      c.gradesArr.forEach(function (g) {
        g.stock.forEach(function (s) {
          if (s.sucursal) set[s.sucursal] = 1;
        });
      });
    });
  });
  return Object.keys(set).sort();
}

function getAllMarcas() {
  // Lista única de marcas de los productos actuales.
  var grouped = getGroupedProducts();
  var set = {};
  grouped.forEach(function (p) {
    if (p.marca) set[p.marca] = 1;
  });
  return Object.keys(set).sort();
}

// ----- Helpers internos -----

function getConfigSpreadsheet_() {
  var id = getSheetId_();
  if (!id) throw new Error('No hay SHEET_ID configurado. Ejecutar setupSheet() primero.');
  return SpreadsheetApp.openById(id);
}

function createConfigSheetWithDefaults_(ss) {
  var sh = ensureSheet_(ss, SHEET_CONFIG, CONFIG_HEADERS);
  // Sembrar las 3 filas default
  var rows = PAGE_MODES.map(function (m) {
    return configToRow_(m, DEFAULT_CONFIGS[m]);
  });
  sh.getRange(2, 1, rows.length, CONFIG_HEADERS.length).setValues(rows);
  Logger.log('Hoja _config creada con defaults para: ' + PAGE_MODES.join(', '));
  return sh;
}

/**
 * Migra la hoja _config si fue creada con un esquema viejo (faltan columnas
 * agregadas después). Es idempotente — si los headers ya están bien, no toca
 * nada. Se llama lazy desde getPageConfig/getAllConfigs/saveConfig.
 */
function migrateConfigSheetSchema_(sh) {
  var lastCol = sh.getLastColumn();
  if (lastCol >= CONFIG_HEADERS.length) return;   // ya está actualizado

  // Escribir los headers nuevos (rellena las celdas faltantes a la derecha)
  sh.getRange(1, 1, 1, CONFIG_HEADERS.length).setValues([CONFIG_HEADERS]);
  Logger.log('Schema de _config migrado: agregadas columnas ' +
             CONFIG_HEADERS.slice(lastCol).join(', '));
}

function rowToConfig_(row) {
  function parseJSON_(s) {
    if (!s) return [];
    try { return JSON.parse(s); } catch (e) { return []; }
  }
  function parseBool_(v) {
    return v === true || v === 'TRUE' || v === 'true';
  }
  return {
    mode:                    String(row[0] || ''),
    title:                   String(row[1] || ''),
    priceMode:               String(row[2] || '') || null,
    sucursales:              parseJSON_(row[3]),
    marcasExcluidas:         parseJSON_(row[4]),
    promoVisible:            parseBool_(row[5]),
    locked:                  parseBool_(row[6]),
    restrictModalSucursales: parseBool_(row[7])
  };
}

function configToRow_(mode, c) {
  return [
    mode,
    c.title || '',
    c.priceMode || '',
    JSON.stringify(c.sucursales || []),
    JSON.stringify(c.marcasExcluidas || []),
    !!c.promoVisible,
    !!c.locked,
    !!c.restrictModalSucursales
  ];
}

function defaultConfig_(mode) {
  var d = DEFAULT_CONFIGS[mode] || DEFAULT_CONFIGS.general;
  return {
    mode:                    mode,
    title:                   d.title,
    priceMode:               d.priceMode || null,
    sucursales:              d.sucursales.slice(),
    marcasExcluidas:         d.marcasExcluidas.slice(),
    promoVisible:            d.promoVisible,
    locked:                  d.locked,
    restrictModalSucursales: !!d.restrictModalSucursales
  };
}

// ============================================================
// AUTENTICACIÓN — login + gestión de usuarios
// ============================================================
//
// El panel admin (?mode=admin) requiere login. Los usuarios viven en la hoja
// `_users` del Spreadsheet. Las contraseñas se guardan hasheadas (SHA-256 +
// salt único guardado en ScriptProperties).
//
// Los tokens de sesión se guardan en CacheService con TTL de 30 min. Se
// refrescan en cada llamada.
//
// Bootstrap: ejecutar setupUsers() UNA VEZ desde el editor para crear el
// usuario inicial. Después, todos los usuarios se gestionan desde el panel.

var USER_HEADERS = ['username', 'passwordHash', 'name', 'role', 'createdAt', 'lastLogin'];

/**
 * Crea la hoja _users con un usuario admin inicial.
 * Username: admin · Password: changeme
 * IMPORTANTE: cambiar la contraseña desde el panel después del primer login.
 */
function setupUsers() {
  // Generar salt si no existe
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PASSWORD_SALT_KEY)) {
    props.setProperty(PASSWORD_SALT_KEY, Utilities.getUuid());
    Logger.log('Salt generado y guardado en ScriptProperties.');
  }

  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) sh = ensureSheet_(ss, SHEET_USERS, USER_HEADERS);

  var data = sh.getDataRange().getValues();
  if (data.length > 1 && data[1][0]) {
    Logger.log('La hoja _users ya tiene usuarios. No se creó ninguno.');
    return;
  }

  // Sembrar usuario admin/changeme
  sh.appendRow([
    'admin',
    hashPassword_('changeme'),
    'Administrador',
    'admin',
    new Date().toISOString(),
    ''
  ]);

  Logger.log('=================================================');
  Logger.log('Usuario admin creado:');
  Logger.log('   Usuario:  admin');
  Logger.log('   Password: changeme');
  Logger.log('⚠ Cambiá la contraseña inmediatamente desde el panel admin.');
  Logger.log('=================================================');
}

function loginUser(username, password) {
  if (!username || !password) return { ok: false, error: 'Usuario y contraseña requeridos' };

  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) return { ok: false, error: 'Sistema sin usuarios. Ejecutar setupUsers().' };

  var data = sh.getDataRange().getValues();
  var hash = hashPassword_(password);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === username && String(data[i][1]) === hash) {
      // Login OK
      var token = Utilities.getUuid();
      var sessionData = {
        username: username,
        name:     String(data[i][2] || username),
        role:     String(data[i][3] || 'admin')
      };
      CacheService.getScriptCache().put(
        'session_' + token,
        JSON.stringify(sessionData),
        SESSION_TTL_SEC
      );
      // Update lastLogin
      try { sh.getRange(i + 1, 6).setValue(new Date().toISOString()); } catch (e) {}
      return {
        ok: true,
        token: token,
        name: sessionData.name,
        role: sessionData.role,
        username: username
      };
    }
  }
  return { ok: false, error: 'Usuario o contraseña incorrectos' };
}

/**
 * Verifica un token de sesión. Devuelve el objeto de sesión o null si
 * inválido/expirado. Como side effect refresca el TTL de la sesión.
 */
function verifySession(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  var raw = cache.get('session_' + token);
  if (!raw) return null;
  try {
    var data = JSON.parse(raw);
    cache.put('session_' + token, raw, SESSION_TTL_SEC);  // sliding TTL
    return data;
  } catch (e) {
    return null;
  }
}

function logoutUser(token) {
  if (token) CacheService.getScriptCache().remove('session_' + token);
  return { ok: true };
}

function listUsers(token) {
  var session = verifySession(token);
  if (!session) return { ok: false, error: 'No autorizado' };
  if (session.role !== 'admin') return { ok: false, error: 'Solo los admin pueden ver usuarios' };

  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) return { ok: true, users: [] };

  var data = sh.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      users.push({
        username:  String(data[i][0]),
        name:      String(data[i][2] || ''),
        role:      String(data[i][3] || 'admin'),
        createdAt: String(data[i][4] || ''),
        lastLogin: String(data[i][5] || '')
      });
    }
  }
  return { ok: true, users: users };
}

function createUser(token, userData) {
  var session = verifySession(token);
  if (!session) return { ok: false, error: 'No autorizado' };
  if (session.role !== 'admin') return { ok: false, error: 'Solo los admin pueden crear usuarios' };

  if (!userData || !userData.username || !userData.password) {
    return { ok: false, error: 'Usuario y contraseña son obligatorios' };
  }
  if (userData.password.length < 4) {
    return { ok: false, error: 'Contraseña muy corta (mínimo 4 caracteres)' };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(userData.username)) {
    return { ok: false, error: 'Username solo puede tener letras, números, ".", "_", "-"' };
  }

  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) sh = ensureSheet_(ss, SHEET_USERS, USER_HEADERS);

  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === userData.username) {
      return { ok: false, error: 'Ya existe un usuario con ese nombre' };
    }
  }

  sh.appendRow([
    userData.username,
    hashPassword_(userData.password),
    userData.name || userData.username,
    userData.role || 'admin',
    new Date().toISOString(),
    ''
  ]);
  return { ok: true };
}

function deleteUser(token, username) {
  var session = verifySession(token);
  if (!session) return { ok: false, error: 'No autorizado' };
  if (session.role !== 'admin') return { ok: false, error: 'Solo los admin pueden borrar usuarios' };
  if (username === session.username) return { ok: false, error: 'No podés borrarte a vos mismo' };

  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) return { ok: false, error: 'No hay usuarios' };

  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === username) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Usuario no encontrado' };
}

function changePassword(token, oldPassword, newPassword) {
  var session = verifySession(token);
  if (!session) return { ok: false, error: 'No autorizado' };
  if (!newPassword || newPassword.length < 4) return { ok: false, error: 'Contraseña muy corta (mínimo 4)' };

  var ss = getConfigSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) return { ok: false, error: 'Sistema sin usuarios' };

  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === session.username) {
      if (String(data[i][1]) !== hashPassword_(oldPassword)) {
        return { ok: false, error: 'Contraseña actual incorrecta' };
      }
      sh.getRange(i + 1, 2).setValue(hashPassword_(newPassword));
      return { ok: true };
    }
  }
  return { ok: false, error: 'Usuario no encontrado' };
}

/**
 * Hashea password con SHA-256 + salt (script-wide).
 * Devuelve hex string de 64 caracteres.
 */
function hashPassword_(password) {
  var salt = PropertiesService.getScriptProperties().getProperty(PASSWORD_SALT_KEY) || 'default-salt';
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + ':' + salt,
    Utilities.Charset.UTF_8
  );
  // bytes son signed -128..127 → convertir a hex
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex += ('0' + b.toString(16)).slice(-2);
  }
  return hex;
}
