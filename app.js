// =================================================================
// CONFIG GLOBAL — PWA / GitHub Pages
// =================================================================
// Supabase: anon key es pública por diseño, RLS protege los datos.
// Si querés rotarla, generá una nueva en Supabase Dashboard → API y reemplazá acá.
var SUPABASE_URL      = 'https://uhodmtxzpvilnxyjleri.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVob2RtdHh6cHZpbG54eWpsZXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzMyMzQsImV4cCI6MjA5NjA0OTIzNH0.s9Axz-7qqUj6RFFL2Yh47cPIypDZ6RorUq9-RGNa6rw';

// =================================================================
// MODO DE LA PÁGINA — leído de URL params (?mode=...)
// =================================================================
// PAGE_MODE: 'general' | 'mayorista' | 'minorista'
// Aliases cortos aceptados:
//   ?mode=ma  → mayorista
//   ?mode=mi  → minorista
//   ?mode=g   → general (o sin parámetro)
// Las URLs largas (?mode=mayorista, ?mode=minorista) siguen funcionando
// para no romper bookmarks viejos. El panel admin vive en admin.html.
window.PAGE_MODE = (function () {
  var raw = (new URLSearchParams(location.search)).get('mode') || 'general';
  var aliases = {
    'g':         'general',
    'general':   'general',
    'ma':        'mayorista',
    'mayorista': 'mayorista',
    'mi':        'minorista',
    'minorista': 'minorista'
  };
  return aliases[raw.toLowerCase()] || 'general';
})();

// Configs hardcoded — fallback si fetchPageConfigFromSupabase_ falla.
// La fuente de verdad de los modos vive en la tabla page_config de Supabase
// y se edita desde admin.html. Esta tabla local cubre el caso offline /
// primer pintado antes de que llegue la respuesta de Supabase.
var PAGE_CONFIGS = {
  general: {
    mode:                    'general',
    title:                   'Catálogo de Productos',
    priceMode:               null,
    sucursales:              [],
    marcasExcluidas:         [],
    promoVisible:            true,
    locked:                  false,
    restrictModalSucursales: false
  },
  mayorista: {
    mode:                    'mayorista',
    title:                   'Catálogo Mayorista',
    priceMode:               'mayorista',
    sucursales:              ['LA COSTA S.R.L.', 'ON BRAND&TRADE'],
    marcasExcluidas:         [],
    promoVisible:            false,
    locked:                  true,
    restrictModalSucursales: true
  },
  minorista: {
    mode:                    'minorista',
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
window.PAGE_CONFIG = PAGE_CONFIGS[window.PAGE_MODE] || PAGE_CONFIGS.general;

// =================================================================
// SERVICE WORKER (PWA)
// =================================================================
// Lo registramos al cargar para que la app sea instalable y cachee el shell.
// En desarrollo local (file:// o http://localhost) algunos browsers no lo
// permiten — silenciamos errores.
function registerServiceWorker_() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker.register('./sw.js').then(function (reg) {
    console.log('[SW] registrado, scope:', reg.scope);
  }).catch(function (err) {
    console.warn('[SW] error registrando:', err);
  });
}

// =================================================================
// DATOS DE MUESTRA (solo para preview local)
// =================================================================
var MOCK_DATA = (function () {
  var sucursales = ['PATA 1', 'PATA KM 7', 'PATA LIMPIO', 'PATA CENTRO'];
  var products = [
    { cod: '101', nm: 'PATACHOCA ESCOLAR CUERO NEGRO 26/33', marca: 'PATACHOCA', grupo: 'INFANTIL FEMENINO',   subgrupo: 'ZAPATO ESCOLAR',  col: 'ATEMPORADA', precio: 120000, colors: ['NEGRO', 'CAFE'],   grades: ['26','27','28','29','30','31','32','33'] },
    { cod: '102', nm: 'PATACHOCA SPORT LONA BLANCA 30/38',  marca: 'PATACHOCA', grupo: 'INFANTIL MASCULINO',  subgrupo: 'ZAPATILLA',       col: 'PRIMAVERA',  precio: 98000,  colors: ['BLANCO', 'AZUL'], grades: ['30','31','32','33','34','35','36','37','38'] },
    { cod: '205', nm: 'TOPPER CASUAL CUERO MARRON 36/44',   marca: 'TOPPER',    grupo: 'ADULTO MASCULINO',    subgrupo: 'MOCASIN',         col: 'ATEMPORADA', precio: 215000, colors: ['MARRON', 'NEGRO', 'CAMEL'], grades: ['36','37','38','39','40','41','42','43','44'] },
    { cod: '310', nm: 'GRIMOLDI SANDALIA TACO DORADO 35/40',marca: 'GRIMOLDI',  grupo: 'ADULTO FEMENINO',     subgrupo: 'SANDALIA',        col: 'VERANO',     precio: 185000, colors: ['DORADO', 'PLATEADO'], grades: ['35','36','37','38','39','40'] },
    { cod: '412', nm: 'FLECHA BOTA CUERO NEGRO 38/44',      marca: 'FLECHA',    grupo: 'ADULTO MASCULINO',    subgrupo: 'BOTA',            col: 'INVIERNO',   precio: 340000, colors: ['NEGRO', 'MARRON'], grades: ['38','39','40','41','42','43','44'] },
    { cod: '501', nm: 'TOPPER BEBE LONA ROSA 17/22',        marca: 'TOPPER',    grupo: 'BEBE',                subgrupo: 'ZAPATILLA BEBE',  col: 'PRIMAVERA',  precio: 75000,  colors: ['ROSA', 'CELESTE', 'BLANCO'], grades: ['17','18','19','20','21','22'] },
    { cod: '620', nm: 'GRIMOLDI STILETTO CHAROL NEGRO 35/40',marca:'GRIMOLDI',  grupo: 'ADULTO FEMENINO',     subgrupo: 'STILETTO',        col: 'ATEMPORADA', precio: 275000, colors: ['NEGRO', 'ROJO'], grades: ['35','36','37','38','39','40'] },
    { cod: '715', nm: 'PATACHOCA RUNNING MALLA GRIS 38/46', marca: 'PATACHOCA', grupo: 'ADULTO MASCULINO',    subgrupo: 'ZAPATILLA',       col: 'PRIMAVERA',  precio: 195000, colors: ['GRIS', 'NEGRO', 'AZUL'], grades: ['38','39','40','41','42','43','44','45','46'] }
  ];
  var rows = [];
  var eanBase = 1302141115000;
  products.forEach(function (p) {
    p.colors.forEach(function (color) {
      var img = p.cod + '_C' + color.replace(/ /g,'') + '.jpg';
      p.grades.forEach(function (grade) {
        sucursales.forEach(function (suc, si) {
          var qty = Math.floor(Math.random() * 30) + (si === 0 ? 5 : 0);
          rows.push({
            id: parseInt(p.cod) * 1000 + parseInt(grade),
            ean: String(eanBase++),
            codFabrica: p.cod,
            nmProduto: p.nm,
            marca: p.marca,
            grupo: p.grupo,
            subgrupo: p.subgrupo,
            colecao: p.col,
            color: color,
            grade: grade,
            // Precios — estructura nueva. Mayorista ~70% del minorista.
            precioMinorista: p.precio,
            precioMinoristaPromo: Math.random() < 0.2 ? Math.round(p.precio * 0.85) : 0,
            precioMinoristaPromoInicio: Math.random() < 0.2 ? '2025-01-01' : null,
            precioMinoristaPromoValidade: Math.random() < 0.2 ? '2030-12-31' : null,
            precioMayorista: Math.round(p.precio * 0.7),
            precioMayoristaPromo: 0,
            precioMayoristaPromoInicio: null,
            precioMayoristaPromoValidade: null,
            qMasVendio: ((parseInt(p.cod, 10) || 0) % 12) + 1,   // pseudo-aleatorio
            sucursal: suc,
            cantidad: qty,
            dataUltCmp: qty > 0 ? '2025-0' + (si + 1) + '-15' : null,
            dataUltVnd: '2026-0' + (Math.floor(Math.random() * 5) + 1) + '-' + (10 + si * 3),
            imagen: img
          });
        });
      });
    });
  });
  return rows;
}());

// =================================================================
// ESTADO GLOBAL
// =================================================================
var rawData          = [];
var products         = [];   // jerarquía agrupada
// (imageMap eliminado: el server ya resuelve los fileIds y los embebe en cada
//  color como c.imgId, evitando enviar 1.4 MB de mapping al cliente)
var filteredProducts = [];
var expandedProducts = {};   // codFabrica → bool
var expandedColors   = {};   // cKey → bool
var currentView      = 'gallery';
var sortField        = 'id';      // los productos más nuevos primero (id DESC)
var sortDir          = 'desc';
var sortTieDir       = 'desc';    // desempate por id cuando el campo ordenado tiene empates
var searchText       = '';
var filterMarca      = [];   // arrays para multi-selección
var filterGrupo      = [];
var filterSubgrupo   = [];
var filterColecao    = [];
var filterTalle      = [];   // tallas (grades) seleccionadas
var filterColor      = [];   // colores seleccionados (multi)
var filterSucursal   = [];   // sucursales seleccionadas (multi-select)
var filterPrecioMin  = null;
var filterPrecioMax  = null;
var priceMode        = 'minorista';   // 'minorista' | 'mayorista' — selector global

// SVG icons reutilizables
var SVG_HEART_EMPTY = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
var SVG_HEART_FULL  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
var SVG_X         = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
var SVG_WARNING   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
var SVG_CLIPBOARD = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>';
var SVG_IMG_OFF   = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';

// ============ ACCESO (gate de contraseña) ============
// Se guarda la contraseña en claro en localStorage para re-verificarla por RPC
// en cada carga (así una rotación en el server deslogea a todos). Es una traba
// client-side: frena accesos casuales, no es blindaje.
var ACCESS_STORAGE_KEY = 'lc_access_pw_v1';

// ============ FAVORITOS ============
var FAVORITES_STORAGE_KEY = 'lc_fav_v1';
var favorites = {};   // { "cod::color": {codFabrica, color}, ... }

// ============ CARRITO ============
// Objeto con clave `${codigo}::${color}::${talle}` para evitar duplicados.
// Persistido en localStorage. Línea = { codigo, marca, descripcion, color,
// talle, cantidad, precioUnit, fotoUrl }.
var CART_STORAGE_KEY = 'lc_cart_v1';
var cart = {};

// Mapa código → nombre de sucursal (para resolver qMasVendio en el modal)
var STORE_NAMES = {
  1:'PATA 1', 2:'PATA KM 7', 3:'DEPOSITO KM5 (EX REB.2)', 4:'LA COSTA S.R.L.',
  5:'PATA MULTIPLAZA', 6:'ROCK SPORT', 7:'PDV OTROS', 8:'PATA LIMPIO',
  9:'P. VM.', 10:'PARANARI', 11:'PATA SAN LORENZO', 12:'P. L. R.',
  13:'PCH KM 4', 14:'ROCK SPORT KM7', 17:'PCH LUQUE', 18:'TIENDAS & DEPOSITO',
  19:'MUESTRAS DESARROLLO', 20:'ON BRAND&TRADE',
  21:'LA COSTA MUEBLES Y EQUIP. (EX PINEDO)', 22:'PATA GALERIA',
  23:'TIENDA NUEVA', 24:'MUESTRAS'
};
var filterStockMin   = null;   // stock por color
var filterStockMax   = null;
var filterUltCompraDesde = null;   // string YYYY-MM-DD o null
var filterUltCompraHasta = null;
var filterUltVentaDesde  = null;   // string YYYY-MM-DD o null
var filterUltVentaHasta  = null;
var filterFoto       = 'all';  // 'all' | 'with' | 'without'
var filterPromo      = 'all';  // 'all' | 'with' | 'without' (sobre el precio activo)
var pdfIncludePromo  = false;  // PDF: mostrar precio promo cuando esté activo (default: No)
var pdfHidePrice     = false;  // PDF: ocultar precio completamente (default: No)
var productsLoaded   = false;
// Scroll infinito: cuántos items ya están en el DOM y lotes a renderizar
var renderedCount    = 0;
var BATCH_SIZE       = 50;
var galleryAllCards  = [];   // se rearma en cada renderGallery()
var tableAllProducts = [];   // se rearma en cada renderTable()
var sentinelObserver = null; // IntersectionObserver para infinite scroll
var lastUpdateTs     = 0;                       // timestamp del último fetch exitoso
var STALE_THRESHOLD_MS = 90 * 60 * 1000;        // 90 min → chip pasa a estado "stale"
var AUTO_REFRESH_THRESHOLD_MS = 5 * 60 * 60 * 1000;  // 5 h → dispara refresh automático
var refreshChipTicker = null;
var catalogServerUpdatedAt = null; // ISO string, verdad del servidor (catalog_cache.updated_at)
var lastSyncLogRow = null;         // última fila de sync_log (status/error/ts)
var SYNC_WARNING_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 h sin sync → ícono ⚠️

// =================================================================
// CACHE LOCAL EN INDEXEDDB
// =================================================================
// Reduce egress contra Supabase: en lugar de pedir 3 MB (gzip) al server
// cada vez que un vendedor abre el catálogo, lo guardamos localmente con
// TTL de 1 hora. Si dentro de esa hora vuelve a entrar 20 veces, son 0
// requests al server (excepto los refreshes en background).
// Usa IndexedDB porque el catálogo (19 MB sin comprimir) excede el límite
// de 5-10 MB típico de localStorage. IDB suele aceptar 50 MB+ sin problema.

var IDB_NAME = 'lacosta_catalogo';
var IDB_STORE = 'cache';
var IDB_KEY = 'productos_v1';
var IDB_TTL_MS = 60 * 60 * 1000;   // 1 hora

function idbOpen_() {
  return new Promise(function (resolve, reject) {
    if (!window.indexedDB) return reject(new Error('no IndexedDB'));
    var req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function (e) { reject(e.target.error); };
  });
}

function idbGet_(key) {
  return idbOpen_().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction([IDB_STORE], 'readonly');
      var req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error); };
    });
  });
}

function idbSet_(key, value) {
  return idbOpen_().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction([IDB_STORE], 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  });
}

// Guarda el catálogo recién traído en IDB para próximas cargas
function saveCatalogToLocal_(data, updatedAt) {
  if (!data || !Array.isArray(data) || !data.length) return;
  idbSet_(IDB_KEY, { data: data, ts: Date.now(), updatedAt: updatedAt || null }).then(function () {
    console.log('[cache local] catálogo guardado en IDB:', data.length, 'productos');
  }).catch(function (e) {
    console.warn('[cache local] no se pudo guardar:', e && e.message || e);
  });
}

// Para debug: borrar el cache local desde la consola
window.clearLocalCatalogCache = function () {
  return idbSet_(IDB_KEY, null).then(function () {
    console.log('[cache local] borrado');
  });
};

// =================================================================
// INICIALIZACIÓN
// =================================================================
window.onload = function () {
  checkAccess_();
};

// ===================================================================
// GATE DE CONTRASEÑA DE ACCESO
// ===================================================================
// Verifica la contraseña contra Supabase vía RPC (verify_access_password).
// El hash nunca sale del server; acá sólo se manda la clave y se recibe boolean.
function verifyAccessPassword_(pw) {
  var endpoint = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/verify_access_password';
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type':  'application/json',
      'Accept':        'application/json'
    },
    body: JSON.stringify({ pw: pw })
  }).then(function (resp) {
    if (!resp.ok) throw new Error('verify_access_password HTTP ' + resp.status);
    return resp.json();
  }).then(function (result) { return result === true; });
  // Nota: los errores de red NO se atrapan acá — el caller decide (fail-open al recargar,
  // mensaje de error en el submit).
}

// Decide al arranque si mostrar el gate o entrar directo.
function checkAccess_() {
  var saved = null;
  try { saved = localStorage.getItem(ACCESS_STORAGE_KEY); } catch (e) {}

  if (saved) {
    // Ya autorizado en este dispositivo: re-verificar (por si rotaron la clave).
    verifyAccessPassword_(saved).then(function (ok) {
      if (ok) {
        startApp_();
      } else {
        // El server respondió y la clave ya no vale (rotación): pedir de nuevo.
        try { localStorage.removeItem(ACCESS_STORAGE_KEY); } catch (e) {}
        showAccessGate_();
      }
    }).catch(function () {
      // Error de red / offline: fail-open para que la PWA siga usable sin conexión.
      startApp_();
    });
  } else {
    showAccessGate_();
  }
}

function showAccessGate_() {
  var gate = document.getElementById('access-gate');
  gate.classList.add('open');
  var form  = document.getElementById('access-form');
  var input = document.getElementById('access-input');
  var btn   = document.getElementById('access-btn');
  var err   = document.getElementById('access-error');
  setTimeout(function () { input.focus(); }, 50);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = input.value;
    if (!pw) return;
    btn.disabled = true;
    btn.textContent = 'Verificando…';
    err.textContent = '';

    verifyAccessPassword_(pw).then(function (ok) {
      if (ok) {
        try { localStorage.setItem(ACCESS_STORAGE_KEY, pw); } catch (e) {}
        input.value = '';
        gate.classList.remove('open');
        startApp_();
      } else {
        btn.disabled = false;
        btn.textContent = 'Ingresar';
        err.textContent = 'Contraseña incorrecta';
        input.select();
      }
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Ingresar';
      err.textContent = 'Error de conexión, reintentá';
    });
  });
}

// Arranque real de la app (antes era el cuerpo de window.onload).
function startApp_() {
  setupEvents();
  registerServiceWorker_();

  // Cargar carrito y favoritos desde localStorage temprano para que los badges
  // se pinten antes de que se carguen los productos.
  loadCart_();
  updateCartBadge_();
  loadFavorites_();
  updateFavBadge_();

  // 1) Cargar la config del modo activo desde Supabase (page_config table) y
  //    leer el cache local (IDB) EN PARALELO — son independientes, no hay
  //    motivo para esperar el round-trip de config antes de mirar el cache.
  //    Si falla la red de config, el hardcoded queda como fallback.
  // 2) Con ambas resueltas: si el cache está fresco, se usa directo; si no,
  //    se pide el catálogo al server (fetchCatalogFromServer_ decide si hace
  //    falta bajarlo completo o si alcanza con el chequeo liviano de updated_at).
  // 3) En paralelo (no bloquea), chequear salud del sync (sync_log).
  fetchSyncHealthFromSupabase_();

  var pageConfigReady = fetchPageConfigFromSupabase_();
  var idbCacheReady    = idbGet_(IDB_KEY).catch(function () { return null; }); // IDB no disponible/falló → tratar como miss

  Promise.all([pageConfigReady, idbCacheReady]).then(function (results) {
    var cached = results[1];
    var ageMs  = cached && cached.ts ? (Date.now() - cached.ts) : Infinity;
    var fresh  = cached && cached.data && ageMs < IDB_TTL_MS;

    if (fresh) {
      console.log('[cache local] hit, edad:', Math.floor(ageMs/60000), 'min');
      onProductsLoaded(cached.data);
      lastUpdateTs = cached.ts;       // chip muestra la edad real
      catalogServerUpdatedAt = cached.updatedAt || null;
      updateSyncWarningIcon_();
      return;
    }

    console.log('[cache local] miss o expirado, fetch del server');
    fetchCatalogFromServer_(cached); // cached (vencido) se usa para el chequeo liviano de updated_at
  });
}

/**
 * Lee la config del modo activo desde Supabase y la mergea en window.PAGE_CONFIG.
 * Las claves de la tabla (snake_case) se mapean a camelCase para mantener
 * compatibilidad con el resto del código que ya espera camelCase.
 *
 * Si falla (red caída, RLS, etc.) se mantiene el PAGE_CONFIG hardcoded como
 * fallback — la app sigue funcionando con la config del último deploy.
 */
function fetchPageConfigFromSupabase_() {
  var endpoint = SUPABASE_URL.replace(/\/$/, '') +
                 '/rest/v1/page_config?select=*&mode=eq.' + encodeURIComponent(window.PAGE_MODE);
  return fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Accept':        'application/json'
    }
  }).then(function (resp) {
    if (!resp.ok) throw new Error('page_config HTTP ' + resp.status);
    return resp.json();
  }).then(function (rows) {
    if (!rows || !rows.length) {
      console.warn('[page_config] sin fila para mode=' + window.PAGE_MODE + ', usando hardcoded');
      return;
    }
    var row = rows[0];
    window.PAGE_CONFIG = {
      mode:                    row.mode,
      title:                   row.title,
      priceMode:               row.price_mode || null,
      sucursales:              row.sucursales || [],
      marcasExcluidas:         row.marcas_excluidas || [],
      promoVisible:            row.promo_visible,
      locked:                  row.locked,
      restrictModalSucursales: row.restrict_modal_sucursales
    };
    console.log('[page_config] cargada desde Supabase, mode=' + window.PAGE_MODE);
  }).catch(function (e) {
    console.warn('[page_config] error, uso hardcoded:', e.message || e);
  });
}

/**
 * Lee el estado de la última corrida del sync (tabla sync_log) para detectar
 * si el cron que alimenta catalog_cache dejó de funcionar. Señal independiente
 * del refresh-chip: éste último sólo mide "hace cuánto mi navegador pidió datos",
 * no si el servidor sigue actualizando catalog_cache.
 */
function fetchSyncHealthFromSupabase_() {
  var endpoint = SUPABASE_URL.replace(/\/$/, '') +
                 '/rest/v1/sync_log?select=status,error,ts&order=ts.desc&limit=1';
  return fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Accept':        'application/json'
    }
  }).then(function (resp) {
    if (!resp.ok) throw new Error('sync_log HTTP ' + resp.status);
    return resp.json();
  }).then(function (rows) {
    lastSyncLogRow = (rows && rows[0]) || null;
    updateSyncWarningIcon_();
  }).catch(function (e) {
    console.warn('[sync_log] fetch falló', e);
  });
}

/**
 * Punto de entrada para refrescar el catálogo cuando el cache local venció
 * (o no existe). Si tenemos datos vencidos en IDB con un updatedAt conocido,
 * primero preguntamos SOLO la fecha de última sync del server (payload de
 * unos bytes) antes de bajar el catálogo completo (~2MB gzip / ~20MB JSON).
 * Si no cambió desde la última vez, reusamos los datos que ya teníamos —
 * mismo resultado, sin la transferencia ni el parseo del JSON completo.
 *
 * staleCached (opcional): { data, updatedAt } tal como viene de idbGet_.
 */
function fetchCatalogFromServer_(staleCached) {
  if (staleCached && staleCached.data && staleCached.updatedAt) {
    fetchCatalogUpdatedAt_()
      .then(function (serverUpdatedAt) {
        if (serverUpdatedAt && serverUpdatedAt === staleCached.updatedAt) {
          console.log('[cache local] catálogo sin cambios en el server, reuso cache');
          catalogServerUpdatedAt = serverUpdatedAt;
          onProductsLoaded(staleCached.data);
          // Refrescamos el timestamp local para no volver a chequear hasta la próxima TTL.
          idbSet_(IDB_KEY, { data: staleCached.data, ts: Date.now(), updatedAt: serverUpdatedAt });
          updateSyncWarningIcon_();
          return;
        }
        fetchFullCatalog_();
      })
      .catch(function () { fetchFullCatalog_(); }); // chequeo liviano falló → fetch completo de siempre
    return;
  }
  fetchFullCatalog_();
}

function fetchFullCatalog_() {
  fetchSupabaseCatalog_()
    .then(function (result) {
      catalogServerUpdatedAt = result.updatedAt;
      onProductsLoaded(result.data);
      saveCatalogToLocal_(result.data, result.updatedAt);
      updateSyncWarningIcon_();
    })
    .catch(onProductsError);
}

/**
 * Lee el catálogo agrupado desde Supabase REST API (tabla catalog_cache).
 * Devuelve una Promise con { data, updatedAt }: data es el array de productos
 * agrupado, updatedAt es la verdad del servidor sobre cuándo corrió el sync
 * exitosamente por última vez (columna catalog_cache.updated_at).
 *
 * El JSON ya viene con imgId de Drive resuelto server-side (lo escribe sync.py),
 * así que el browser no necesita llamar a Drive API.
 */
function fetchSupabaseCatalog_() {
  var endpoint = SUPABASE_URL.replace(/\/$/, '') +
                 '/rest/v1/catalog_cache?select=data,updated_at&id=eq.1';
  return fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Accept':        'application/json'
      // Accept-Encoding: gzip lo agrega el browser automáticamente
    }
  }).then(function (resp) {
    if (!resp.ok) throw new Error('Supabase HTTP ' + resp.status);
    return resp.json();
  }).then(function (arr) {
    if (!arr || !arr.length || !arr[0].data) {
      throw new Error('catalog_cache vacío en Supabase');
    }
    return { data: arr[0].data, updatedAt: arr[0].updated_at };
  });
}

/**
 * Igual que fetchSupabaseCatalog_ pero pidiendo SOLO updated_at (sin la
 * columna data) — se usa para decidir si vale la pena bajar el catálogo
 * completo cuando el cache local venció por TTL.
 */
function fetchCatalogUpdatedAt_() {
  var endpoint = SUPABASE_URL.replace(/\/$/, '') +
                 '/rest/v1/catalog_cache?select=updated_at&id=eq.1';
  return fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Accept':        'application/json'
    }
  }).then(function (resp) {
    if (!resp.ok) throw new Error('catalog_cache (updated_at) HTTP ' + resp.status);
    return resp.json();
  }).then(function (arr) {
    if (!arr || !arr.length) throw new Error('catalog_cache vacío en Supabase');
    return arr[0].updated_at;
  });
}

function onProductsLoaded(data) {
  // data ya viene agrupada (desde catalog_cache en Supabase, o groupData() para el preview)
  products = data;

  // Precomputar la fecha de última compra más reciente por producto
  // (se almacena como p._ultCompraMaxIso y p._ultCompraMaxLabel)
  precomputeLastPurchaseDates_();

  // Aplicar config del modo ANTES de populate/render — filtra products,
  // setea priceMode y filterSucursal según el modo.
  applyPageConfig();

  // Después de aplicar la config (que puede sacar marcas excluidas de products)
  // para no precalcular texto normalizado de productos que ni se van a mostrar.
  precomputeSearchFields_();

  populateFilters();
  applyFilters();
  productsLoaded = true;

  hide('loading-state');
  show('gallery-view');

  renderCurrentView();
  updateStats();
  markDataFresh();
  startRefreshChipTicker();
  renderAppVersion_();
  initAppAutoUpdate_();

  // Auto-refresh silencioso DESACTIVADO. El usuario decide cuándo actualizar
  // con el botón 🔄 del header (que pasa a amber sutil tras 90 min).
  // Si querés volver a activarlo, descomentá la línea de abajo:
  // startAutoRefresh();
}

// =================================================================
// APLICAR CONFIG DEL MODO ACTIVO (general / mayorista / minorista)
// =================================================================
// Recorre todos los stock entries de cada producto y guarda la fecha de
// "última compra" más reciente como _ultCompraMaxIso (string YYYY-MM-DD)
// y _ultCompraMaxLabel (DD/MM/YYYY para mostrar). Si el producto no tiene
// ninguna fecha, ambos quedan en null.
function precomputeLastPurchaseDates_() {
  products.forEach(function (p) {
    var maxCmp = null, maxVnd = null;
    p.colorsArr.forEach(function (c) {
      c.gradesArr.forEach(function (g) {
        g.stock.forEach(function (s) {
          if (s.dataUltCmp) {
            // Las fechas vienen como "YYYY-MM-DD". Como strings ISO se pueden
            // comparar lexicográficamente sin parsing.
            var isoC = String(s.dataUltCmp).slice(0, 10);
            if (isoC > (maxCmp || '')) maxCmp = isoC;
          }
          if (s.dataUltVnd) {
            var isoV = String(s.dataUltVnd).slice(0, 10);
            if (isoV > (maxVnd || '')) maxVnd = isoV;
          }
        });
      });
    });
    p._ultCompraMaxIso   = maxCmp;
    p._ultCompraMaxLabel = maxCmp ? fmtDate(maxCmp) : null;
    p._ultVentaMaxIso    = maxVnd;
    p._ultVentaMaxLabel  = maxVnd ? fmtDate(maxVnd) : null;
  });
}

// Precalcula la versión normalizada (normTxt_: minúsculas + sin acentos) de
// todos los campos usados en la búsqueda por texto. Sin esto, normTxt_ (que
// hace normalize('NFKD') + regex) se recalculaba desde cero sobre los mismos
// campos 2-3 veces por búsqueda: en el filtro (_productPassesFilters_), en
// el sort (codigoMatchRank_) y de nuevo en renderGallery al armar las cards.
// Se llama una sola vez al cargar los datos (o tras excluir marcas).
function precomputeSearchFields_() {
  products.forEach(function (p) {
    p._normCod      = normTxt_(p.codFabrica);
    p._normNombre   = normTxt_(p.nmProduto);
    p._normMarca    = normTxt_(p.marca);
    p._normGrupo    = normTxt_(p.grupo);
    p._normSubgrupo = normTxt_(p.subgrupo);
    p._normColecao  = normTxt_(p.colecao);
    p.colorsArr.forEach(function (c) {
      c._normColor = normTxt_(c.color);
      c.gradesArr.forEach(function (g) {
        g._normEan = normTxt_(g.ean);
      });
    });
  });
}

function applyPageConfig() {
  var cfg = window.PAGE_CONFIG || {};

  // Título del header + del tab del browser
  var titleEl = document.querySelector('.header-title');
  if (titleEl) titleEl.textContent = cfg.title;
  document.title = cfg.title;

  // Price mode forzado
  if (cfg.priceMode) {
    priceMode = cfg.priceMode;
    document.querySelectorAll('#filter-pricemode button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-value') === cfg.priceMode);
    });
  } else {
    // Modo general: restaurar selección guardada del usuario
    try {
      var savedMode = localStorage.getItem('lc_price_mode');
      if (savedMode === 'mayorista' || savedMode === 'minorista') {
        priceMode = savedMode;
        document.querySelectorAll('#filter-pricemode button').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-value') === savedMode);
        });
      }
    } catch (_) {}
  }

  // Sucursales pre-filtradas
  if (cfg.sucursales && cfg.sucursales.length) {
    filterSucursal = cfg.sucursales.slice();
  }

  // Override por URL: ?suc=centro o ?suc=centro,norte
  // Match case-insensitive sustring sobre las sucursales reales en products.
  // En modos locked, se intersecta con cfg.sucursales (no se pueden meter sucursales
  // fuera del set permitido). El filtro queda pre-seleccionado pero editable.
  var sucParam = (new URLSearchParams(location.search)).get('suc');
  if (sucParam) {
    var requested = sucParam.split(',')
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(Boolean);
    if (requested.length) {
      var available = {};
      products.forEach(function (p) {
        p.colorsArr.forEach(function (c) {
          c.gradesArr.forEach(function (g) {
            g.stock.forEach(function (s) {
              if (s.sucursal) available[s.sucursal] = true;
            });
          });
        });
      });
      // Para cada query: si hay match exacto (case-insensitive) sobre alguna
      // sucursal real, usar SOLO ese exacto. Si no, caer a substring para
      // permitir abreviaciones tipo ?suc=centro → PATA CENTRO.
      // Evita que "ROCK SPORT" matchee "ROCK SPORT KM7".
      var availableList = Object.keys(available);
      var matched = [];
      requested.forEach(function (q) {
        var exact = availableList.filter(function (name) {
          return name.toLowerCase() === q;
        });
        var hits = exact.length ? exact : availableList.filter(function (name) {
          return name.toLowerCase().indexOf(q) >= 0;
        });
        hits.forEach(function (n) {
          if (matched.indexOf(n) < 0) matched.push(n);
        });
      });
      if (cfg.locked && cfg.sucursales && cfg.sucursales.length) {
        var allowedSet = {};
        cfg.sucursales.forEach(function (s) { allowedSet[s] = true; });
        matched = matched.filter(function (s) { return allowedSet[s]; });
      }
      if (matched.length) filterSucursal = matched;
    }
  }

  // Override por URL: ?marca=VIA+MARTE o ?marca=VIA+MARTE,ADIDAS
  // Match exacto case-insensitive sobre p.marca. Permite múltiples marcas separadas por coma.
  var marcaParam = (new URLSearchParams(location.search)).get('marca');
  if (marcaParam) {
    var requestedMarcas = marcaParam.split(',')
      .map(function (m) { return m.trim(); })
      .filter(Boolean);
    if (requestedMarcas.length) {
      var availableMarcas = {};
      products.forEach(function (p) { if (p.marca) availableMarcas[p.marca] = true; });
      var availableMarcaList = Object.keys(availableMarcas);
      var matchedMarcas = [];
      requestedMarcas.forEach(function (q) {
        var ql = q.toLowerCase();
        var exact = availableMarcaList.filter(function (m) { return m.toLowerCase() === ql; });
        var hits = exact.length ? exact : availableMarcaList.filter(function (m) {
          return m.toLowerCase().indexOf(ql) >= 0;
        });
        hits.forEach(function (m) { if (matchedMarcas.indexOf(m) < 0) matchedMarcas.push(m); });
      });
      if (matchedMarcas.length) filterMarca = matchedMarcas;
    }
  }

  // Override por URL: ?foto=with | ?foto=without | ?foto=all
  var fotoParam = (new URLSearchParams(location.search)).get('foto');
  if (fotoParam === 'with' || fotoParam === 'without' || fotoParam === 'all') {
    filterFoto = fotoParam;
  }

  // Override por URL: ?coleccion=INVIERNO o ?coleccion=INVIERNO,VERANO
  // Match exacto case-insensitive sobre p.colecao.
  var coleccionParam = (new URLSearchParams(location.search)).get('coleccion');
  if (coleccionParam) {
    var requestedColecciones = coleccionParam.split(',')
      .map(function (c) { return c.trim(); })
      .filter(Boolean);
    if (requestedColecciones.length) {
      var availableColecciones = {};
      products.forEach(function (p) { if (p.colecao) availableColecciones[p.colecao] = true; });
      var availableColList = Object.keys(availableColecciones);
      var matchedCol = [];
      requestedColecciones.forEach(function (q) {
        var ql = q.toLowerCase();
        var exact = availableColList.filter(function (c) { return c.toLowerCase() === ql; });
        var hits = exact.length ? exact : availableColList.filter(function (c) {
          return c.toLowerCase().indexOf(ql) >= 0;
        });
        hits.forEach(function (c) { if (matchedCol.indexOf(c) < 0) matchedCol.push(c); });
      });
      if (matchedCol.length) filterColecao = matchedCol;
    }
  }

  // Promo desactivada → ocultar elementos de promo + setear pdfIncludePromo=false
  if (!cfg.promoVisible) {
    pdfIncludePromo = false;
    document.body.classList.add('hide-promo');
    // Sincronizar el switch de pdfIncludePromo visualmente (queda oculto por CSS pero igual)
    var sw = document.getElementById('pdf-include-promo-switch');
    if (sw) sw.checked = false;
  }

  // Marcas excluidas — filtrar el array products
  applyExcludedBrands_();

  // Locked → ocultar controles que no deben tocarse
  if (cfg.locked) {
    document.body.classList.add('mode-locked');
  }
}

// Filtra products[] sacando las marcas configuradas como excluidas en el
// modo activo. Idempotente — llamar tras cualquier reasignación de
// products (load inicial, auto-refresh, manual refresh) para que las
// marcas excluidas no vuelvan a aparecer en chips de filtro ni en las
// vistas galería/tabla.
function applyExcludedBrands_() {
  var cfg = window.PAGE_CONFIG || {};
  if (!cfg.marcasExcluidas || !cfg.marcasExcluidas.length) return;
  products = products.filter(function (p) {
    return cfg.marcasExcluidas.indexOf(p.marca) < 0;
  });
}

function onProductsError(err) {
  hide('loading-state');
  show('error-state');
  document.getElementById('error-detail').textContent =
    err ? (err.message || String(err)) : 'Error desconocido';
}

// =================================================================
// AUTO-REFRESH SILENCIOSO (cada 1 h, preservando estado)
// =================================================================
// Refresca el catálogo sin avisar al usuario, manteniendo:
//   - Filtros aplicados (marca, grupo, sucursal, búsqueda, precio, stock, foto)
//   - Vista actual (Tabla / Galería) y página de paginación
//   - Productos / colores expandidos en la tabla
//   - Sort activo
//   - Posición del scroll
// Si el usuario está en medio de algo (modal, lightbox, confirm abiertos),
// se pospone al siguiente ciclo para no interrumpir.

var REFRESH_INTERVAL_MS = 60 * 60 * 1000;   // 1 hora
var autoRefreshTimer    = null;

function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(silentRefresh_, REFRESH_INTERVAL_MS);
}

function silentRefresh_() {
  // No interrumpir si el usuario tiene algo abierto
  if (isUserBusy_()) return;

  // Snapshot del estado que applyFilters/renderCurrentView resetean
  var savedRendered = renderedCount;
  var scrollY       = window.scrollY || window.pageYOffset || 0;

  fetchSupabaseCatalog_()
    .then(function (result) {
      var data = result.data;
      if (!data || !Array.isArray(data)) return;

      catalogServerUpdatedAt = result.updatedAt;
      products = data;
      precomputeLastPurchaseDates_();
      applyExcludedBrands_();
      precomputeSearchFields_();
      populateFilters();

      // applyFilters resetea renderedCount=0. Después del renderCurrentView,
      // appendeamos batches adicionales hasta restaurar la cantidad que el
      // usuario tenía cargada.
      applyFilters();
      renderCurrentView();
      restoreRenderedCount_(savedRendered);

      updateStats();
      markDataFresh();
      saveCatalogToLocal_(data, result.updatedAt);
      updateSyncWarningIcon_();

      window.scrollTo(0, scrollY);
    })
    .catch(function () {
      // Silenciar errores — al próximo ciclo se intenta de nuevo
    });
}

// =================================================================
// CHIP "Actualizado hace X" + REFRESH MANUAL
// =================================================================
// Marca los datos como recién traídos. Llamar tras cada fetch exitoso.
function markDataFresh() {
  lastUpdateTs = Date.now();
  updateRefreshChip();
}

// Pinta el texto y el estado del chip según cuánto tiempo pasó.
function updateRefreshChip() {
  var label = document.getElementById('refresh-label');
  var chip  = document.getElementById('refresh-chip');
  if (!label || !chip) return;

  if (!lastUpdateTs) { if (label) label.textContent = ''; chip.classList.remove('stale'); chip.title = 'Actualizar ahora'; return; }

  var diff = Date.now() - lastUpdateTs;
  var t = relativeTime_(diff);
  if (label) label.textContent = '';
  chip.title = 'Actualizado ' + t + ' · Click para actualizar';
  chip.classList.toggle('stale', diff > STALE_THRESHOLD_MS);
}

/**
 * Muestra un ⚠️ en el header cuando catalog_cache lleva más de
 * SYNC_WARNING_THRESHOLD_MS sin actualizarse en el servidor — señal
 * independiente de refresh-chip/lastUpdateTs (que sólo mide la recencia
 * del fetch del navegador, no si el sync del servidor sigue vivo).
 */
function updateSyncWarningIcon_() {
  var icon = document.getElementById('sync-warning-icon');
  if (!icon) return;
  if (!lastSyncLogRow || lastSyncLogRow.status !== 'ERROR') {
    icon.style.display = 'none';
    return;
  }
  var msg = 'Sincronización con errores desde ' + relativeTime_(Date.now() - new Date(lastSyncLogRow.ts).getTime()) +
            '. Detalle: ' + (lastSyncLogRow.error || 'error desconocido').slice(0, 120);
  icon.title = msg;
  icon.style.display = 'inline-flex';
}

/* ============ VERSIÓN DE LA APP + FORZAR ACTUALIZACIÓN ============
   Bumpear APP_VERSION en cada deploy notable.
   El sw.js debe mantener su CACHE_VERSION sincronizado para invalidar
   el shell cacheado en clientes existentes. */
var APP_VERSION  = '1.32.0';
var APP_BUILD    = '2026-08-10';

function renderAppVersion_() {
  var el = document.getElementById('app-version');
  if (el) el.textContent = 'v' + APP_VERSION + ' · ' + APP_BUILD;
}

/* Limpia caches del SW, lo desregistra y recarga con cache-buster. */
function forceUpdateApp_() {
  if (!confirm('Esto descargará todo de nuevo y recargará la app.\n¿Continuar?')) return;

  var btn = document.querySelector('.btn-force-update');
  if (btn) { btn.textContent = '⏳ Actualizando...'; btn.disabled = true; }

  var reload = function () {
    var bust = (location.search ? '&' : '?') + 'v=' + Date.now();
    location.replace(location.pathname + location.search + bust);
  };

  Promise.resolve()
    .then(function () {
      if (!('serviceWorker' in navigator)) return;
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('CLEAR_CACHES');
      }
      return navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      });
    })
    .then(function () {
      if (!window.caches) return;
      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      });
    })
    .then(reload)
    .catch(reload);   // aunque falle alguna parte, recargamos igual
}

/* ===================== AUTO-UPDATE EN BACKGROUND =====================
   Política: detectar nuevas versiones del Service Worker en segundo plano
   y aplicar la actualización SIN interrumpir al usuario:
     - Chequeo cada 30 min: registration.update() trae sw.js fresco.
     - Si hay un SW nuevo en estado "installed/waiting" → mostramos un
       banner discreto "Nueva versión · Recargar".
     - Recarga silenciosa automática cuando:
         (a) el usuario sale y vuelve a la app (visibilitychange),
         (b) o el ticker de 5h dispara y isUserBusy_() == false.
     - Nunca recargamos con modales/inputs/overlays activos. */
var _newSwWaiting   = null;
var SW_CHECK_MS     = 30 * 60 * 1000;
var _swReloadInProgress = false;

function initAppAutoUpdate_() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistration().then(function (reg) {
    if (!reg) return;

    // Si ya hay un SW esperando (caso: deploy ocurrió antes de que abrieran)
    if (reg.waiting && navigator.serviceWorker.controller) {
      _newSwWaiting = reg.waiting;
      showUpdateBanner_();
    }

    // Detección en vivo
    reg.addEventListener('updatefound', function () {
      var inst = reg.installing;
      if (!inst) return;
      inst.addEventListener('statechange', function () {
        if (inst.state === 'installed' && navigator.serviceWorker.controller) {
          _newSwWaiting = inst;
          showUpdateBanner_();
        }
      });
    });

    // Polling periódico
    setInterval(function () {
      reg.update().catch(function () {});
    }, SW_CHECK_MS);
  }).catch(function () {});

  // Al volver a la app (cambió de tab/app y volvió) → momento seguro para recargar
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && _newSwWaiting && !isUserBusy_()) {
      activateNewSwAndReload_();
    }
  });
}

function showUpdateBanner_() {
  var el = document.getElementById('update-gate');
  if (el) el.classList.add('open');
}

function activateNewSwAndReload_() {
  if (!_newSwWaiting || _swReloadInProgress) return;
  _swReloadInProgress = true;
  var btn = document.getElementById('update-gate-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }
  var sw = _newSwWaiting;
  _newSwWaiting = null;

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (_swReloadInProgress) { _swReloadInProgress = false; location.reload(); }
  }, { once: true });

  sw.postMessage('SKIP_WAITING');

  // Fallback: si el controllerchange no llega en 4s, recargar igual
  setTimeout(function () {
    if (_swReloadInProgress) { _swReloadInProgress = false; location.reload(); }
  }, 4000);
}

function relativeTime_(ms) {
  var s = Math.floor(ms / 1000);
  if (s < 60) return 'recién';
  var m = Math.floor(s / 60);
  if (m < 60) return 'hace ' + m + ' min';
  var h = Math.floor(m / 60);
  if (h < 24) return 'hace ' + h + ' h';
  var d = Math.floor(h / 24);
  return 'hace ' + d + ' día' + (d > 1 ? 's' : '');
}

// Re-evalúa el texto del chip cada minuto sin tocar la red. Si la data
// lleva más de AUTO_REFRESH_THRESHOLD_MS sin actualizarse, dispara un
// refresh silencioso para que el catálogo no quede arbitrariamente viejo
// (por ejemplo, en una tablet que quedó abierta toda la noche o cuando
// los timers de setInterval no dispararon por suspensión del SO).
function startRefreshChipTicker() {
  if (refreshChipTicker) clearInterval(refreshChipTicker);
  refreshChipTicker = setInterval(function () {
    updateRefreshChip();
    maybeAutoRefreshIfStale_();
    fetchSyncHealthFromSupabase_();
  }, 60 * 1000);
}

function maybeAutoRefreshIfStale_() {
  if (!lastUpdateTs) return;
  if (Date.now() - lastUpdateTs < AUTO_REFRESH_THRESHOLD_MS) return;
  // Si el usuario tiene un modal/lightbox abierto, esperamos al siguiente ciclo
  if (isUserBusy_()) return;
  // Si hay una nueva versión de la app esperando, aprovechamos este momento
  // (5h+ inactivo, sin overlays) para recargar silenciosamente. Esto reemplaza
  // el manualRefresh: la recarga completa ya trae datos frescos.
  if (_newSwWaiting) { activateNewSwAndReload_(); return; }
  // Reutilizamos manualRefresh: muestra el spinner en el chip y NO se
  // saltea si pasa algo, así el usuario ve que el catálogo se está
  // actualizando solo después de muchas horas inactivo.
  manualRefresh();
}

// Refresh manual disparado por click del usuario. Igual que silentRefresh_,
// pero NO chequea isUserBusy_ (es una acción explícita del usuario) y muestra
// estado visual "refreshing" en el chip.
function manualRefresh() {
  var chip = document.getElementById('refresh-chip');
  if (chip && chip.classList.contains('refreshing')) return;
  if (chip) chip.classList.add('refreshing');

  var savedRendered = renderedCount;
  var scrollY       = window.scrollY || window.pageYOffset || 0;

  fetchSupabaseCatalog_()
    .then(function (result) {
      var data = result.data;
      if (data && Array.isArray(data)) {
        catalogServerUpdatedAt = result.updatedAt;
        products = data;
        precomputeLastPurchaseDates_();
        applyExcludedBrands_();
        precomputeSearchFields_();
        populateFilters();
        applyFilters();
        renderCurrentView();
        restoreRenderedCount_(savedRendered);
        updateStats();
        window.scrollTo(0, scrollY);
        markDataFresh();
        saveCatalogToLocal_(data, result.updatedAt);   // refresca el cache local con datos frescos
        updateSyncWarningIcon_();
      }
      if (chip) chip.classList.remove('refreshing');
    })
    .catch(function () {
      if (chip) chip.classList.remove('refreshing');
    });
}

/* Scroll del contenedor .sidebar-body para que la etiqueta del filtro
   quede arriba (con un poco de aire), dejando lugar debajo al panel
   del multi-select recién abierto. Espera un frame para que el panel
   ya esté visible y los cálculos de layout sean correctos. */
function scrollFilterToTop_(root) {
  var sidebarBody = root.closest && root.closest('.sidebar-body');
  if (!sidebarBody) return;
  // Anclar al .sidebar-label que precede al multi-select; fallback al root.
  var anchor = root.previousElementSibling;
  while (anchor && (!anchor.classList || !anchor.classList.contains('sidebar-label'))) {
    anchor = anchor.previousElementSibling;
  }
  if (!anchor) anchor = root;

  // Doble rAF: damos margen a que el panel ya esté display:block y el layout
  // recalculado, así rect.top es post-apertura. Algunos browsers (Safari iOS)
  // a veces ignoran el primer rAF inmediato tras un cambio de clase.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var rect    = anchor.getBoundingClientRect();
      var boxRect = sidebarBody.getBoundingClientRect();
      var delta   = rect.top - boxRect.top;
      var target  = Math.max(0, sidebarBody.scrollTop + delta - 8);

      try {
        sidebarBody.scrollTo({ top: target, behavior: 'smooth' });
      } catch (e) {
        // Fallback para webviews sin opciones de scrollTo
        sidebarBody.scrollTop = target;
      }
    });
  });
}

// ¿El usuario está usando un overlay que no se debe interrumpir?
function isUserBusy_() {
  var modal = document.getElementById('modal');
  if (modal && modal.classList.contains('open')) return true;

  var lightbox = document.getElementById('lightbox');
  if (lightbox && lightbox.classList.contains('open')) return true;

  var confirm = document.getElementById('confirm-overlay');
  if (confirm && confirm.classList.contains('open')) return true;

  // Overlay del PDF móvil (preparando impresión)
  var pmo = document.getElementById('pdf-mobile-overlay');
  if (pmo && pmo.classList.contains('open')) return true;

  // Sidebar abierta en móvil (filtrando)
  var sb = document.querySelector('.sidebar.open');
  if (sb) return true;

  // Input enfocado: probablemente está escribiendo
  var ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT')) {
    return true;
  }

  return false;
}

// =================================================================
// EVENTOS (delegación única por contenedor estático)
// =================================================================
function setupEvents() {
  // Búsqueda con debounce
  var timer;
  var searchInput = document.getElementById('search-input');
  var btnClear    = document.getElementById('btn-search-clear');
  var btnPaste    = document.getElementById('btn-search-paste');

  // Mostrar boton clear o paste segun haya texto. Llamar tambien al cargar
  // por si algun browser preserva el valor del input.
  function updateSearchActionButtons_() {
    var hasText = !!searchInput.value;
    btnClear.style.display = hasText ? '' : 'none';
    btnPaste.style.display = hasText ? 'none' : '';
  }
  updateSearchActionButtons_();

  searchInput.addEventListener('input', function () {
    clearTimeout(timer);
    var val = this.value;
    updateSearchActionButtons_();
    timer = setTimeout(function () {
      searchText = val;
      applyFilters();
      renderCurrentView();
    }, 220);
  });

  // Boton ✕ — limpia el buscador
  btnClear.addEventListener('click', function () {
    searchInput.value = '';
    searchText = '';
    updateSearchActionButtons_();
    applyFilters();
    renderCurrentView();
    searchInput.focus();
  });

  // Boton 📋 — pega contenido del portapapeles
  btnPaste.addEventListener('click', function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      alert('Tu navegador no soporta acceso al portapapeles. Pegá manualmente con Ctrl+V (o tap-hold → Pegar en móvil).');
      searchInput.focus();
      return;
    }
    navigator.clipboard.readText().then(function (text) {
      var trimmed = String(text || '').trim();
      if (!trimmed) {
        // Portapapeles vacío — feedback breve y enfocar input
        btnPaste.textContent = '∅';
        setTimeout(function () { btnPaste.innerHTML = SVG_CLIPBOARD; }, 800);
        searchInput.focus();
        return;
      }
      searchInput.value = trimmed;
      searchText = trimmed;
      updateSearchActionButtons_();
      applyFilters();
      renderCurrentView();
      // Feedback visual breve
      btnClear.classList.add('copied');
      setTimeout(function () { btnClear.classList.remove('copied'); }, 600);
      searchInput.focus();
    }).catch(function (e) {
      // Usuario denegó permisos o error de seguridad (HTTP sin HTTPS)
      console.warn('clipboard read denied:', e);
      alert('No pude leer el portapapeles. Si te aparece un popup pidiendo permiso, aceptalo. O pegá manualmente con Ctrl+V / tap-hold.');
      searchInput.focus();
    });
  });

  // Boton 📷 — escanear código de barra con la cámara (solo si hay soporte)
  var btnScan = document.getElementById('btn-search-scan');
  if (btnScan && scanBarcodeSupported_()) {
    document.querySelector('.search-wrap').classList.add('has-scan');
    btnScan.addEventListener('click', openBarcodeScanner_);
  }

  // Los multi-select se cablean dentro de buildMultiSelect() — no se necesita listener aquí.

  // Cerrar multi-selects al hacer click fuera
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.multi-select.open').forEach(function (root) {
      if (!root.contains(e.target)) {
        root.classList.remove('open');
        var p = root.querySelector('.multi-select-panel');
        if (p) p.style.cssText = '';
      }
    });
  });

  // Cerrar paneles flotantes si el usuario hace scroll dentro del sidebar
  var sidebarBody = document.querySelector('.sidebar-body');
  if (sidebarBody) {
    sidebarBody.addEventListener('scroll', function () {
      document.querySelectorAll('.multi-select.open').forEach(function (root) {
        root.classList.remove('open');
        var p = root.querySelector('.multi-select-panel');
        if (p) p.style.cssText = '';
      });
    }, { passive: true });
  }

  // Filtro de precio y stock (con debounce para no filtrar en cada tecla)
  var rangeTimer;
  ['filter-precio-min', 'filter-precio-max', 'filter-stock-min', 'filter-stock-max',
   'filter-ultcmp-desde', 'filter-ultcmp-hasta',
   'filter-ultvnd-desde', 'filter-ultvnd-hasta']
    .forEach(function (id) {
      document.getElementById(id).addEventListener('input',  function () {
        clearTimeout(rangeTimer);
        rangeTimer = setTimeout(onFilter, 280);
      });
      // Para inputs date, también escuchar 'change' (al elegir del calendario)
      document.getElementById(id).addEventListener('change', function () {
        clearTimeout(rangeTimer);
        rangeTimer = setTimeout(onFilter, 0);
      });
    });

  // Botón limpiar
  document.getElementById('btn-clear').addEventListener('click', clearFilters);

  // Tabla — expand y modal
  document.getElementById('main-table').addEventListener('click', function (e) {
    var detailBtn = closest(e.target, '.btn-detail');
    if (detailBtn) {
      e.stopPropagation();
      openModal(detailBtn.getAttribute('data-cod'), detailBtn.getAttribute('data-color') || null);
      return;
    }
    var colorRow = closest(e.target, 'tr.row-color');
    if (colorRow) {
      e.stopPropagation();
      toggleColor(colorRow.getAttribute('data-key'));
      return;
    }
    var productRow = closest(e.target, 'tr.row-product');
    if (productRow) {
      toggleProduct(productRow.getAttribute('data-key'));
    }
  });

  // Galería — modal + lightbox + copiar código + quick-add carrito
  document.getElementById('gallery-container').addEventListener('click', function (e) {
    // Selección visual de card (borde primario). Click en cualquier parte de la
    // card la marca como seleccionada; sigue corriendo el resto del handler
    // para que los botones internos (quickadd, ver detalles, etc.) sigan
    // funcionando como antes.
    var clickedCard = closest(e.target, '.product-card');
    if (clickedCard) {
      var container = e.currentTarget;
      var prev = container.querySelector('.product-card.is-selected');
      if (prev && prev !== clickedCard) prev.classList.remove('is-selected');
      clickedCard.classList.add('is-selected');
    }

    var shareCardBtn = closest(e.target, '.btn-share-card');
    if (shareCardBtn) {
      e.stopPropagation();
      shareProduct_(shareCardBtn.getAttribute('data-cod'), shareCardBtn.getAttribute('data-color'), shareCardBtn);
      return;
    }
    var copyBtn = closest(e.target, '.btn-copy-code');
    if (copyBtn) {
      e.stopPropagation();
      copyCodeToClipboard_(copyBtn);
      return;
    }
    var favBtn = closest(e.target, '.btn-card-fav');
    if (favBtn) {
      e.stopPropagation();
      toggleFav_(favBtn.getAttribute('data-cod'), favBtn.getAttribute('data-color'));
      return;
    }
    var qaBtn = closest(e.target, '.btn-card-quickadd');
    if (qaBtn) {
      e.stopPropagation();
      openQuickAdd_(qaBtn.getAttribute('data-cod'), qaBtn.getAttribute('data-color'));
      return;
    }
    var btn = closest(e.target, '.btn-card-detail');
    if (btn) { openModal(btn.getAttribute('data-cod'), btn.getAttribute('data-color')); return; }
    var imgWrap = closest(e.target, '.card-img-wrap');
    if (imgWrap && imgWrap.getAttribute('data-img')) openLightbox(imgWrap);
  });

  // Modal — botones de acción en el header
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-btn-share').addEventListener('click', function () {
    shareProduct_(this.getAttribute('data-cod'), this.getAttribute('data-color'), this);
  });
  document.getElementById('modal-btn-fav').addEventListener('click', function () {
    var cod   = this.getAttribute('data-cod');
    var color = this.getAttribute('data-color');
    toggleFav_(cod, color);
    var favActive = isFav_(cod, color);
    this.classList.toggle('is-fav', favActive);
    this.innerHTML = favActive
      ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
      : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  });
  document.getElementById('modal-btn-cart').addEventListener('click', function () {
    openQuickAdd_(this.getAttribute('data-cod'), this.getAttribute('data-color'));
  });
  document.getElementById('modal').addEventListener('click', function (e) {
    // Click en botón de copiar código (al lado del código en el título)
    var copyBtn = closest(e.target, '.btn-copy-code');
    if (copyBtn) {
      e.stopPropagation();
      copyCodeToClipboard_(copyBtn);
      return;
    }
    // Click en la foto del color → abrir lightbox (no cerrar modal)
    var modalImg = closest(e.target, '.modal-color-img');
    if (modalImg && modalImg.getAttribute('data-img')) {
      e.stopPropagation();
      openLightbox(modalImg);
      return;
    }
    // Click en una card similar → reabrir el modal con ese producto
    var sim = closest(e.target, '.modal-similar-card');
    if (sim) {
      var cod   = sim.getAttribute('data-cod');
      var color = sim.getAttribute('data-color') || null;
      if (cod) openModal(cod, color);
      return;
    }
    // Click fuera del contenedor → cerrar
    if (e.target === this) closeModal();
  });

  // Lightbox — cerrar
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', function (e) {
    if (e.target === this) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.getElementById('shortcuts-overlay').classList.contains('open')) closeShortcuts_();
      else if (document.getElementById('scan-overlay').classList.contains('open')) closeBarcodeScanner_();
      else if (document.getElementById('barcode-overlay').classList.contains('open')) closeBarcodeModal_();
      else if (document.getElementById('lightbox').classList.contains('open'))     closeLightbox();
      else if (document.getElementById('sidebar').classList.contains('open'))      toggleSidebar(false);
      else if (document.getElementById('modal').classList.contains('open'))        closeModal();
      else {
        // No hay overlays — deseleccionar la card de la galería si hay una
        var container = document.getElementById('gallery-container');
        var sel = container && container.querySelector('.product-card.is-selected');
        if (sel) sel.classList.remove('is-selected');
      }
    }
  });

  // Navegación con teclado en la galería: flechas mueven la selección,
  // Space abre la foto (lightbox), V abre el detalle. Home/End saltan al
  // primero/último.
  document.addEventListener('keydown', onGalleryKeyNav_);

  // M soltada → ocultar cuadrícula de margen del lightbox (comportamiento
  // "mantener presionada", no toggle).
  document.addEventListener('keyup', function (e) {
    if (e.key === 'm' || e.key === 'M') { lightboxMDown_ = false; hideLightboxMarginGrid_(); }
  });
  // Si la ventana pierde foco con M apretada (alt-tab, etc.), el keyup no
  // llega — soltamos igual para que no quede "trabada".
  window.addEventListener('blur', function () {
    if (lightboxMDown_) { lightboxMDown_ = false; hideLightboxMarginGrid_(); }
  });

  // Segmented control de foto
  document.querySelectorAll('#filter-foto button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterFoto = this.getAttribute('data-value');
      document.querySelectorAll('#filter-foto button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      applyFilters();
      renderCurrentView();
    });
  });

  // Segmented control de promo (sobre el precio activo)
  document.querySelectorAll('#filter-promo button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterPromo = this.getAttribute('data-value');
      document.querySelectorAll('#filter-promo button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      applyFilters();
      renderCurrentView();
    });
  });

  // Switch para incluir precio promo en PDF (vive en la sección Exportar a PDF)
  var promoSwitch = document.getElementById('pdf-include-promo-switch');
  if (promoSwitch) {
    promoSwitch.checked = pdfIncludePromo;  // sync inicial con el global
    promoSwitch.addEventListener('change', function () {
      pdfIncludePromo = this.checked;
    });
  }

  // Switch para ocultar precio en PDF
  var hidePriceSwitch = document.getElementById('pdf-hide-price-switch');
  if (hidePriceSwitch) {
    hidePriceSwitch.checked = pdfHidePrice;
    hidePriceSwitch.addEventListener('change', function () {
      pdfHidePrice = this.checked;
    });
  }

  // Segmented control de precio (Minorista / Mayorista)
  document.querySelectorAll('#filter-pricemode button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      priceMode = this.getAttribute('data-value');
      document.querySelectorAll('#filter-pricemode button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      try { localStorage.setItem('lc_price_mode', priceMode); } catch (_) {}
      applyFilters();
      renderCurrentView();
    });
  });

  // Cabeceras de tabla sortables
  document.querySelectorAll('th.sortable').forEach(function (th) {
    th.addEventListener('click', function () {
      sortBy(this.getAttribute('data-col'));
    });
  });

  // Paginación tabla
  // Paginación reemplazada por scroll infinito — no hay botones que cablear

  // Paginación galería: reemplazada por scroll infinito
}

// Polyfill seguro de Element.closest para navegadores viejos
function closest(el, sel) {
  while (el && el !== document) {
    if (el.matches && el.matches(sel)) return el;
    el = el.parentElement;
  }
  return null;
}

// =================================================================
// AGRUPACIÓN DE DATOS
// =================================================================
function groupData(data) {
  var pMap   = {};
  var pOrder = [];

  data.forEach(function (item) {
    var pKey   = String(item.codFabrica);
    var itemId = Number(item.id) || 0;

    if (!pMap[pKey]) {
      pMap[pKey] = {
        id:         itemId,
        codFabrica: item.codFabrica,
        nmProduto:  item.nmProduto,
        marca:      item.marca,
        grupo:      item.grupo,
        subgrupo:   item.subgrupo,
        colecao:    item.colecao,
        // Precios — estructura nueva
        precioMinorista:               Number(item.precioMinorista)        || 0,
        precioMinoristaPromo:          Number(item.precioMinoristaPromo)   || 0,
        precioMinoristaPromoInicio:    item.precioMinoristaPromoInicio     || null,
        precioMinoristaPromoValidade:  item.precioMinoristaPromoValidade   || null,
        precioMayorista:               Number(item.precioMayorista)        || 0,
        precioMayoristaPromo:          Number(item.precioMayoristaPromo)   || 0,
        precioMayoristaPromoInicio:    item.precioMayoristaPromoInicio     || null,
        precioMayoristaPromoValidade:  item.precioMayoristaPromoValidade   || null,
        qMasVendio: Number(item.qMasVendio) || 0,
        cMap:  {},
        cOrder: []
      };
      pOrder.push(pKey);
    } else if (itemId > pMap[pKey].id) {
      pMap[pKey].id = itemId;
    }

    var prod = pMap[pKey];
    var cKey = String(item.color);

    if (!prod.cMap[cKey]) {
      prod.cMap[cKey] = {
        color:  item.color,
        imagen: item.imagen,
        imgId:  null,       // preview local sin Drive; en producción el server lo resuelve
        gMap:  {},
        gOrder: []
      };
      prod.cOrder.push(cKey);
    }

    var col  = prod.cMap[cKey];
    var gKey = String(item.grade);

    if (!col.gMap[gKey]) {
      col.gMap[gKey] = { grade: item.grade, ean: item.ean, stock: [] };
      col.gOrder.push(gKey);
    }

    col.gMap[gKey].stock.push({
      sucursal:    item.sucursal,
      cantidad:    item.cantidad  || 0,
      dataUltCmp:  item.dataUltCmp,
      dataUltVnd:  item.dataUltVnd
    });
  });

  return pOrder.map(function (pKey) {
    var p = pMap[pKey];

    p.colorsArr = p.cOrder.map(function (cKey) {
      var c = p.cMap[cKey];

      c.gradesArr = c.gOrder
        .map(function (gKey) {
          var g = c.gMap[gKey];
          g.totalStock = g.stock.reduce(function (s, r) { return s + (r.cantidad || 0); }, 0);
          return g;
        })
        .sort(function (a, b) {
          var na = parseInt(a.grade, 10), nb = parseInt(b.grade, 10);
          return (!isNaN(na) && !isNaN(nb)) ? na - nb : String(a.grade).localeCompare(String(b.grade));
        });

      c.totalStock = c.gradesArr.reduce(function (s, g) { return s + g.totalStock; }, 0);
      return c;
    });

    p.totalStock = p.colorsArr.reduce(function (s, c) { return s + c.totalStock; }, 0);
    return p;
  });
}

// =================================================================
// FILTROS
// =================================================================
function populateFilters() {
  var seen = { marca: {}, grupo: {}, subgrupo: {}, colecao: {}, talle: {}, sucursal: {}, color: {} };
  var marcas = [], grupos = [], subgrupos = [], colecoes = [], talles = [], sucursales = [], colores = [];

  products.forEach(function (p) {
    if (p.marca    && !seen.marca[p.marca])       { seen.marca[p.marca]       = 1; marcas.push(p.marca);       }
    if (p.grupo    && !seen.grupo[p.grupo])       { seen.grupo[p.grupo]       = 1; grupos.push(p.grupo);       }
    if (p.subgrupo && !seen.subgrupo[p.subgrupo]) { seen.subgrupo[p.subgrupo] = 1; subgrupos.push(p.subgrupo); }
    if (p.colecao  && !seen.colecao[p.colecao])   { seen.colecao[p.colecao]   = 1; colecoes.push(p.colecao);   }

    // talles, sucursales y colores — viven al nivel más profundo
    p.colorsArr.forEach(function (c) {
      if (c.color && !seen.color[c.color]) { seen.color[c.color] = 1; colores.push(c.color); }
      c.gradesArr.forEach(function (g) {
        if (g.grade != null && g.grade !== '' && !seen.talle[g.grade]) {
          seen.talle[g.grade] = 1;
          talles.push(g.grade);
        }
        g.stock.forEach(function (s) {
          if (s.sucursal && !seen.sucursal[s.sucursal]) {
            seen.sucursal[s.sucursal] = 1;
            sucursales.push(s.sucursal);
          }
        });
      });
    });
  });

  // Ordenar talles numéricamente cuando se pueda, alfa cuando no
  talles.sort(function (a, b) {
    var na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });

  // Sucursales: si el modo tiene un set fijado por config, mostrar solo esas
  // como opciones del dropdown. El usuario puede deseleccionar para refinar,
  // pero no puede agregar sucursales fuera del config.
  var cfg = window.PAGE_CONFIG || {};
  var sucursalesOptions = sucursales.sort();
  if (cfg.locked && cfg.sucursales && cfg.sucursales.length) {
    var allowed = {};
    cfg.sucursales.forEach(function (s) { allowed[s] = true; });
    sucursalesOptions = sucursalesOptions.filter(function (s) { return allowed[s]; });
  }

  buildMultiSelect('filter-marca',    marcas.sort(),     filterMarca);
  buildMultiSelect('filter-grupo',    grupos.sort(),     filterGrupo);
  buildMultiSelect('filter-subgrupo', subgrupos.sort(),  filterSubgrupo);
  buildMultiSelect('filter-colecao',  colecoes.sort(),   filterColecao);
  buildMultiSelect('filter-talle',    talles,            filterTalle);
  buildMultiSelect('filter-sucursal', sucursalesOptions, filterSucursal);
  buildMultiSelect('filter-color',    colores.sort(),    filterColor);
}

// =================================================================
// MULTI-SELECT CON CHECKBOXES
// =================================================================
function buildMultiSelect(id, opts, selectedArr) {
  var root        = document.getElementById(id);
  var placeholder = root.getAttribute('data-placeholder');
  var noun        = root.getAttribute('data-noun');

  root.innerHTML =
    '<button type="button" class="multi-select-btn">' + escHtml(placeholder) + '</button>' +
    '<div class="multi-select-panel">' +
      '<input type="text" class="multi-select-search" placeholder="Buscar...">' +
      '<div class="multi-select-list">' +
        opts.map(function (o) {
          var checked = selectedArr.indexOf(o) >= 0 ? ' checked' : '';
          return '<label class="multi-option" data-value="' + escHtml(o) + '">' +
                   '<input type="checkbox" value="' + escHtml(o) + '"' + checked + '>' +
                   '<span>' + escHtml(o) + '</span>' +
                 '</label>';
        }).join('') +
      '</div>' +
      '<div class="multi-select-footer">' +
        '<button type="button" class="ms-all">Todos</button>' +
        '<button type="button" class="ms-none">Ninguno</button>' +
      '</div>' +
    '</div>';

  var btn    = root.querySelector('.multi-select-btn');
  var panel  = root.querySelector('.multi-select-panel');
  var search = root.querySelector('.multi-select-search');
  var list   = root.querySelector('.multi-select-list');

  function refreshLabel() {
    var n = selectedArr.length;
    if (n === 0) {
      btn.textContent = placeholder;
      btn.classList.remove('has-selection');
    } else if (n === 1) {
      btn.textContent = selectedArr[0];
      btn.classList.add('has-selection');
    } else {
      btn.textContent = n + ' ' + noun + 's';
      btn.classList.add('has-selection');
    }
  }
  refreshLabel();

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var wasOpen = root.classList.contains('open');
    document.querySelectorAll('.multi-select.open').forEach(function (el) {
      el.classList.remove('open');
      var p = el.querySelector('.multi-select-panel');
      if (p) { p.style.cssText = ''; }
    });
    if (!wasOpen) {
      var inSidebar = root.closest && root.closest('.sidebar');
      if (inSidebar) {
        var rect = btn.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left     = rect.left + 'px';
        panel.style.top      = (rect.bottom + 4) + 'px';
        panel.style.width    = rect.width + 'px';
        panel.style.maxWidth = '300px';
        panel.style.zIndex   = '200';
      }
      root.classList.add('open');
      search.value = '';
      list.querySelectorAll('.multi-option').forEach(function (o) { o.style.display = ''; });
      setTimeout(function () { search.focus(); }, 0);
      if (!inSidebar) scrollFilterToTop_(root);
    }
  });

  search.addEventListener('input', function () {
    var q = normTxt_(search.value).trim();
    list.querySelectorAll('.multi-option').forEach(function (o) {
      var val = normTxt_(o.getAttribute('data-value'));
      o.style.display = (!q || val.indexOf(q) >= 0) ? '' : 'none';
    });
  });

  list.addEventListener('change', function (e) {
    var cb = e.target;
    if (cb.tagName !== 'INPUT') return;
    var v   = cb.value;
    var idx = selectedArr.indexOf(v);
    if (cb.checked && idx < 0) selectedArr.push(v);
    if (!cb.checked && idx >= 0) selectedArr.splice(idx, 1);
    refreshLabel();
    applyFilters();
    renderCurrentView();
  });

  // Shift+click → seleccionar rango entre el último click "ancla" y el actual,
  // tipo selección de archivos en Windows Explorer. Los items entre medio
  // quedan en el mismo estado (marcado/desmarcado) que el clickeado.
  // El rango es sobre los items VISIBLES (respeta el buscador del multi-select).
  var anchorValue = null;
  list.addEventListener('click', function (e) {
    var label = e.target.closest('.multi-option');
    if (!label) return;
    var cb = label.querySelector('input[type="checkbox"]');
    if (!cb) return;

    if (e.shiftKey && anchorValue !== null && anchorValue !== cb.value) {
      // Cancelar el toggle por default — lo hacemos manualmente con el rango
      e.preventDefault();
      var targetChecked = !cb.checked;   // estado que el click iba a aplicar al clickeado

      var visible = Array.prototype.filter.call(
        list.querySelectorAll('.multi-option'),
        function (l) { return l.style.display !== 'none'; }
      );
      var aIdx = -1, cIdx = -1;
      for (var i = 0; i < visible.length; i++) {
        if (visible[i].getAttribute('data-value') === anchorValue) aIdx = i;
        if (visible[i] === label) cIdx = i;
      }
      if (aIdx < 0 || cIdx < 0) { anchorValue = cb.value; return; }

      var lo = Math.min(aIdx, cIdx), hi = Math.max(aIdx, cIdx);
      for (var j = lo; j <= hi; j++) {
        var cb2 = visible[j].querySelector('input[type="checkbox"]');
        if (cb2.checked === targetChecked) continue;
        cb2.checked = targetChecked;
        var v = cb2.value;
        var idx = selectedArr.indexOf(v);
        if (targetChecked && idx < 0) selectedArr.push(v);
        if (!targetChecked && idx >= 0) selectedArr.splice(idx, 1);
      }
      refreshLabel();
      applyFilters();
      renderCurrentView();
      // Mantener el ancla original — facilita expandir el rango con más shift+click
      return;
    }

    // Click normal: el ancla es este item
    anchorValue = cb.value;
  });

  root.querySelector('.ms-all').addEventListener('click', function () {
    list.querySelectorAll('.multi-option').forEach(function (o) {
      if (o.style.display === 'none') return;
      var cb = o.querySelector('input');
      if (!cb.checked) {
        cb.checked = true;
        if (selectedArr.indexOf(cb.value) < 0) selectedArr.push(cb.value);
      }
    });
    refreshLabel();
    applyFilters();
    renderCurrentView();
  });

  root.querySelector('.ms-none').addEventListener('click', function () {
    list.querySelectorAll('.multi-option input').forEach(function (cb) { cb.checked = false; });
    selectedArr.length = 0;
    refreshLabel();
    applyFilters();
    renderCurrentView();
  });

  // Guardar referencia para reset desde clearFilters
  root._refreshLabel = refreshLabel;
  root._uncheckAll   = function () {
    list.querySelectorAll('.multi-option input').forEach(function (cb) { cb.checked = false; });
    selectedArr.length = 0;
    refreshLabel();
  };
}

/**
 * Devuelve true si el producto `p` pasa todos los filtros activos del sidebar.
 * @param {boolean} skipSearch  Si true, ignora el filtro de búsqueda por texto.
 *                              Útil para "Productos similares" cuando hay search:
 *                              queremos respetar todos los demás filtros (talle,
 *                              sucursal, marca, etc.) pero no limitar los similares
 *                              al texto buscado.
 */
function _productPassesFilters_(p, skipSearch) {
  if (filterMarca.length    && filterMarca.indexOf(p.marca)       < 0) return false;
  if (filterGrupo.length    && filterGrupo.indexOf(p.grupo)       < 0) return false;
  if (filterSubgrupo.length && filterSubgrupo.indexOf(p.subgrupo) < 0) return false;
  if (filterColecao.length  && filterColecao.indexOf(p.colecao)   < 0) return false;

  // Color: producto pasa si alguno de sus colores está en la selección.
  if (filterColor.length) {
    var hasColor = false;
    for (var cci = 0; cci < p.colorsArr.length; cci++) {
      if (filterColor.indexOf(p.colorsArr[cci].color) >= 0) { hasColor = true; break; }
    }
    if (!hasColor) return false;
  }

  // Talle: producto pasa si alguno de sus colores tiene alguna talla en la selección.
  if (filterTalle.length) {
    var hasTalle = false;
    for (var ci = 0; ci < p.colorsArr.length && !hasTalle; ci++) {
      var grades = p.colorsArr[ci].gradesArr;
      for (var gi = 0; gi < grades.length; gi++) {
        if (filterTalle.indexOf(grades[gi].grade) >= 0) { hasTalle = true; break; }
      }
    }
    if (!hasTalle) return false;
  }

  // Sucursal: producto pasa si tiene stock > 0 en alguna sucursal activa.
  var activeSuc = effectiveSucursalFilter_();
  if (activeSuc.length && getProductStock(p) <= 0) return false;

  var precio = getActivePrice(p).price || 0;
  if (filterPrecioMin !== null && precio < filterPrecioMin) return false;
  if (filterPrecioMax !== null && precio > filterPrecioMax) return false;

  // Stock por color: producto pasa si AL MENOS UN color cumple el rango.
  if (filterStockMin !== null || filterStockMax !== null) {
    var anyColorOk = p.colorsArr.some(colorPassesStock_);
    if (!anyColorOk) return false;
  }

  // Rango de fecha de última compra
  if (filterUltCompraDesde || filterUltCompraHasta) {
    var iso = p._ultCompraMaxIso;
    if (!iso) return false;
    if (filterUltCompraDesde && iso < filterUltCompraDesde) return false;
    if (filterUltCompraHasta && iso > filterUltCompraHasta) return false;
  }

  if (filterUltVentaDesde || filterUltVentaHasta) {
    var isoV = p._ultVentaMaxIso;
    if (!isoV) return false;
    if (filterUltVentaDesde && isoV < filterUltVentaDesde) return false;
    if (filterUltVentaHasta && isoV > filterUltVentaHasta) return false;
  }

  // Foto: producto pasa si AL MENOS UN color cumple
  if (filterFoto !== 'all' && !p.colorsArr.some(colorPassesFoto_)) return false;

  // Promo (sobre el precio activo)
  if (filterPromo === 'with' && !productHasActivePromo_(p)) return false;
  if (filterPromo === 'without' && productHasActivePromo_(p)) return false;

  // Búsqueda por texto (se puede saltar para los similares).
  // Insensible a mayúsculas y a acentos (normTxt_). Usa los campos ya
  // normalizados por precomputeSearchFields_ — evita rehacer normalize('NFKD')
  // sobre los mismos strings en cada tecla.
  if (!skipSearch) {
    var q = normTxt_(searchText).trim();
    if (q) {
      var inProd = [p._normCod, p._normNombre, p._normMarca, p._normGrupo, p._normSubgrupo, p._normColecao]
        .some(function (v) { return v && v.indexOf(q) >= 0; });
      var inColor = p.colorsArr.some(function (c) {
        return c._normColor && c._normColor.indexOf(q) >= 0;
      });
      var inEan = p.colorsArr.some(function (c) {
        return c.gradesArr.some(function (g) { return g._normEan && g._normEan.indexOf(q) >= 0; });
      });
      if (!inProd && !inColor && !inEan) return false;
    }
  }
  return true;
}

// Con búsqueda activa, prioriza productos cuyo código de fábrica matchea el
// texto buscado (rank 0) por sobre los que solo matchean por otro campo
// (nombre, marca, subgrupo, color, EAN, etc. — rank 1). Sin búsqueda no se usa.
function codigoMatchRank_(p, q) {
  return (p._normCod && p._normCod.indexOf(q) >= 0) ? 0 : 1;
}

function applyFilters() {
  renderedCount = 0;   // al filtrar volvemos a renderizar desde el inicio
  filteredProducts = products.filter(function (p) {
    return _productPassesFilters_(p, false);   // false = aplicar todos los filtros (incluye search)
  });

  var qActive = normTxt_(searchText || '').trim();

  if (sortField || qActive) {
    filteredProducts.sort(function (a, b) {
      if (qActive) {
        var ra = codigoMatchRank_(a, qActive);
        var rb = codigoMatchRank_(b, qActive);
        if (ra !== rb) return ra - rb;
      }
      if (!sortField) return 0;

      // Caso especial: ordenar por "precio" usa el precio activo (minorista/mayorista)
      var va, vb;
      if (sortField === 'precio') {
        va = getActivePrice(a).price;
        vb = getActivePrice(b).price;
      } else if (sortField === 'totalStock') {
        va = getProductStock(a);
        vb = getProductStock(b);
      } else {
        va = a[sortField]; vb = b[sortField];
      }
      var na = Number(va), nb = Number(vb);
      var cmp;
      if (va !== '' && vb !== '' && va != null && vb != null && !isNaN(na) && !isNaN(nb)) {
        cmp = sortDir === 'asc' ? na - nb : nb - na;
      } else {
        va = String(va || ''); vb = String(vb || '');
        cmp = sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return cmp !== 0 ? cmp : (sortTieDir === 'asc' ? (a.id - b.id) : (b.id - a.id));
    });
  }

  updateFilterBadge();
}

// =================================================================
// CÁLCULO DE STOCK RESPETANDO EL FILTRO DE SUCURSAL
// =================================================================
// Si hay sucursales seleccionadas, el total se recalcula sumando solo
// esas sucursales. Si no hay filtro activo, devuelve el total precalculado.
//
// IMPORTANTE — Comportamiento en modo locked (mayorista/minorista):
// Si filterSucursal está vacío (usuario desmarcó todas), tratamos eso como
// "todas las sucursales del config" — porque en modos locked el usuario NO
// debe poder ver productos fuera del config. effectiveSucursalFilter_ devuelve
// las del config en ese caso.

function effectiveSucursalFilter_() {
  if (sucursalLockedByConfig_() && filterSucursal.length === 0) {
    var cfg = window.PAGE_CONFIG || {};
    return cfg.sucursales || [];
  }
  return filterSucursal;
}

function getGradeStock(g) {
  var active = effectiveSucursalFilter_();
  if (active.length === 0) return g.totalStock;
  var sum = 0;
  g.stock.forEach(function (s) {
    if (active.indexOf(s.sucursal) >= 0) sum += (s.cantidad || 0);
  });
  return sum;
}

function getColorStock(c) {
  var active = effectiveSucursalFilter_();
  if (active.length === 0) return c.totalStock;
  var sum = 0;
  c.gradesArr.forEach(function (g) { sum += getGradeStock(g); });
  return sum;
}

function getProductStock(p) {
  var active = effectiveSucursalFilter_();
  if (active.length === 0) return p.totalStock;
  var sum = 0;
  p.colorsArr.forEach(function (c) { sum += getColorStock(c); });
  return sum;
}

// ¿El color cumple el rango de stock activo? Usa el stock recalculado.
function colorPassesStock_(c) {
  var s = getColorStock(c);
  if (filterStockMin !== null && s < filterStockMin) return false;
  if (filterStockMax !== null && s > filterStockMax) return false;
  return true;
}

// ¿El color cumple el filtro de foto?
function colorPassesFoto_(c) {
  if (filterFoto === 'with')    return !!c.imgId;
  if (filterFoto === 'without') return !c.imgId;
  return true;
}

// Solo los filtros de rango disparan onFilter (los multi-select se aplican solos)
function onFilter() {
  function num(id) {
    var v = document.getElementById(id).value;
    return (v === '' || isNaN(Number(v))) ? null : Number(v);
  }
  function dateStr(id) {
    var v = document.getElementById(id).value;
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  }
  filterPrecioMin = num('filter-precio-min');
  filterPrecioMax = num('filter-precio-max');
  filterStockMin  = num('filter-stock-min');
  filterStockMax  = num('filter-stock-max');
  filterUltCompraDesde = dateStr('filter-ultcmp-desde');
  filterUltCompraHasta = dateStr('filter-ultcmp-hasta');
  filterUltVentaDesde  = dateStr('filter-ultvnd-desde');
  filterUltVentaHasta  = dateStr('filter-ultvnd-hasta');

  applyFilters();
  renderCurrentView();
}

// ¿El modo tiene sucursales fijadas por config (mayorista/minorista)?
// Si sí: el filtro de sucursal muestra solo esas opciones, "Limpiar filtros"
// las restaura todas (no las vacía), y el badge solo cuenta si el usuario
// deseleccionó alguna.
function sucursalLockedByConfig_() {
  var cfg = window.PAGE_CONFIG || {};
  return !!(cfg.locked && cfg.sucursales && cfg.sucursales.length > 0);
}

function clearFilters() {
  searchText = '';
  sortField  = 'id';
  sortDir    = 'desc';
  sortTieDir = 'desc';
  filterPrecioMin = filterPrecioMax = null;
  filterStockMin  = filterStockMax  = null;
  filterUltCompraDesde = filterUltCompraHasta = null;
  filterUltVentaDesde  = filterUltVentaHasta  = null;
  filterFoto      = 'all';
  filterPromo     = 'all';

  ['search-input',
   'filter-precio-min', 'filter-precio-max',
   'filter-stock-min',  'filter-stock-max',
   'filter-ultcmp-desde', 'filter-ultcmp-hasta',
   'filter-ultvnd-desde', 'filter-ultvnd-hasta'
  ].forEach(function (id) { document.getElementById(id).value = ''; });

  // Despues de clear: actualizar la visibilidad del boton ✕/📋 del buscador
  var btnClearSearch = document.getElementById('btn-search-clear');
  var btnPasteSearch = document.getElementById('btn-search-paste');
  if (btnClearSearch && btnPasteSearch) {
    btnClearSearch.style.display = 'none';
    btnPasteSearch.style.display = '';
  }

  // Limpiar multi-selects de marca/grupo/subgrupo/colección/talle (siempre)
  ['filter-marca', 'filter-grupo', 'filter-subgrupo', 'filter-colecao', 'filter-talle', 'filter-color'].forEach(function (id) {
    var root = document.getElementById(id);
    if (root && root._uncheckAll) root._uncheckAll();
  });

  // Sucursal: si está fijada por config, restaurar a TODAS las del config
  // (no vaciar). Si no, vaciar normal.
  var cfg = window.PAGE_CONFIG || {};
  if (sucursalLockedByConfig_()) {
    filterSucursal = cfg.sucursales.slice();
    // Re-pintar el dropdown con todos marcados
    populateFilters();
  } else {
    var sucRoot = document.getElementById('filter-sucursal');
    if (sucRoot && sucRoot._uncheckAll) sucRoot._uncheckAll();
  }

  // Reset visual del segmented de foto
  document.querySelectorAll('#filter-foto button').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-value') === 'all');
  });

  // Reset visual del segmented de promo
  document.querySelectorAll('#filter-promo button').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-value') === 'all');
  });

  // NO reseteamos pdfIncludePromo — es una preferencia personal del usuario,
  // no un filtro. Si quiere cambiarla, toca el toggle directamente.

  applyFilters();
  renderCurrentView();
}

// =================================================================
// SIDEBAR DE FILTROS
// =================================================================
function toggleSidebar(forceOpen) {
  var sb = document.getElementById('sidebar');
  var bd = document.getElementById('sidebar-backdrop');
  var willOpen = (forceOpen === undefined)
    ? !sb.classList.contains('open')
    : !!forceOpen;

  sb.classList.toggle('open',  willOpen);
  bd.classList.toggle('open',  willOpen);
  document.body.style.overflow = willOpen ? 'hidden' : '';
}

// Badge: cantidad de filtros activos (excluida la búsqueda — esa siempre
// se ve afuera). Se llama desde applyFilters tras recalcular.
function updateFilterBadge() {
  var cfg = window.PAGE_CONFIG || {};
  var sucLocked = sucursalLockedByConfig_();

  // Sucursal cuenta como "filtro activo" cuando:
  //   - Sin modo locked: hay alguna marcada (filterSucursal.length > 0)
  //   - Con modo locked: el usuario tiene un SUBSET propio (ni vacío ni completo).
  //     Vacío equivale a "todas las del config" (effectiveSucursalFilter_).
  //     Lleno = default. Cualquier estado intermedio = filtro activo.
  var sucCount;
  if (sucLocked) {
    var n = filterSucursal.length;
    var full = cfg.sucursales.length;
    sucCount = (n > 0 && n < full) ? 1 : 0;
  } else {
    sucCount = filterSucursal.length > 0 ? 1 : 0;
  }

  var count = 0;
  if (filterMarca.length)    count++;
  if (filterGrupo.length)    count++;
  if (filterSubgrupo.length) count++;
  if (filterColecao.length)  count++;
  if (filterTalle.length)    count++;
  if (filterColor.length)    count++;
  count += sucCount;
  if (filterPrecioMin !== null || filterPrecioMax !== null) count++;
  if (filterStockMin  !== null || filterStockMax  !== null) count++;
  if (filterUltCompraDesde || filterUltCompraHasta) count++;
  if (filterUltVentaDesde  || filterUltVentaHasta)  count++;
  if (filterFoto !== 'all') count++;
  if (filterPromo !== 'all') count++;

  var badge = document.getElementById('filter-badge');
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle('show', count > 0);
}

// =================================================================
// SORT
// =================================================================
function sortBy(field) {
  sortDir   = (sortField === field && sortDir === 'asc') ? 'desc' : 'asc';
  sortField = field;
  applyFilters();
  renderCurrentView();
}

function updateSortHeaders() {
  document.querySelectorAll('th[data-col]').forEach(function (th) {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.getAttribute('data-col') === sortField) {
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

// =================================================================
// RENDER — TABLA
// =================================================================
function renderTable() {
  var tbody = document.getElementById('table-body');
  tableAllProducts = filteredProducts.slice();
  var total = tableAllProducts.length;

  document.getElementById('result-count-txt').textContent =
    total + ' producto' + (total !== 1 ? 's' : '');

  renderedCount = 0;
  tbody.innerHTML = '';

  if (!total) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="10">No se encontraron productos con los filtros actuales</td></tr>';
    updateInfiniteFooter_('table', 0, 0);
    updateSortHeaders();
    return;
  }

  appendNextTableBatch();
  attachSentinel_('table');
  updateSortHeaders();
}

// Construye el HTML de UN producto + sus filas hijo (colores, tallas, stock)
function buildTableRowsHtml_(p) {
    var html    = '';
    var pKey    = String(p.codFabrica);
    var pExpand = !!expandedProducts[pKey];

    // Fila de producto (nivel 1) — siempre visible
    html += '<tr class="row-product" data-key="' + escHtml(pKey) + '">';
    html += '<td><span class="toggle-icon' + (pExpand ? ' expanded' : '') + '">&#9658;</span></td>';
    html += '<td style="color:var(--gray-500); font-size:12px">' + (p.id != null ? escHtml(p.id) : '—') + '</td>';
    html += '<td><strong>' + escHtml(p.codFabrica) + '</strong></td>';
    html += '<td class="hide-md">' + escHtml(p.nmProduto) + '</td>';
    html += '<td style="text-align:right"><strong>' + getProductStock(p) + '</strong> <span style="color:var(--gray-500);font-size:11px">uds</span></td>';
    html += '<td class="hide-xs">' + escHtml(p.marca) + '</td>';
    html += '<td class="hide-sm">' + escHtml(p.grupo) + '</td>';
    html += '<td>' + escHtml(p.subgrupo) + '</td>';
    html += '<td class="price-cell">' + renderPriceHtml(p) + '</td>';
    html += '<td><button class="btn-detail" data-cod="' + escHtml(pKey) + '" data-color="">Ver detalles</button></td>';
    html += '</tr>';

    // Filas de color (nivel 2) — pre-renderizadas, ocultas salvo si el producto está expandido
    var activeSucList        = effectiveSucursalFilter_();
    var sucursalFilterActive = activeSucList.length > 0;
    var fotoFilterActive     = (filterFoto !== 'all');
    p.colorsArr.forEach(function (c) {
      var colorStock = getColorStock(c);
      // Si hay filtro de sucursal y este color no tiene stock en esas sucursales, no renderizar
      if (sucursalFilterActive && colorStock <= 0) return;
      // Filtro de foto
      if (fotoFilterActive && !colorPassesFoto_(c)) return;

      var cKey    = pKey + '|||' + c.color;
      var cExpand = !!expandedColors[cKey];
      var imgUrl  = getImgUrl(c.imgId, 80);   // thumbnail chico para la tabla
      var imgTag  = imgUrl
        ? '<img src="' + imgUrl + '" class="thumb-img" style="margin-right:8px" loading="lazy" onerror="this.style.display=\'none\'">'
        : '<div class="thumb-ph" style="margin-right:8px">&#x1F45F;</div>';

      html += '<tr class="row-color" data-key="' + escHtml(cKey) + '" data-parent="' + escHtml(pKey) + '" style="display:' + (pExpand ? 'table-row' : 'none') + '">';
      html += '<td></td><td></td>';   // col 1: toggle padre · col 2: ID
      html += '<td colspan="2"><div class="cell-flex indent-1"><span class="toggle-icon' + (cExpand ? ' expanded' : '') + '">&#9658;</span>' + imgTag + '<strong>' + escHtml(c.color) + '</strong></div></td>';
      html += '<td style="text-align:right;color:var(--gray-500)"><strong>' + colorStock + '</strong> <span style="font-size:11px">uds</span></td>';
      html += '<td class="hide-xs hide-sm" colspan="3" style="color:var(--gray-500)">Color: <strong>' + escHtml(c.color) + '</strong></td>';
      html += '<td></td>';
      html += '<td></td>';
      html += '</tr>';

      // Filas de talla y stock (niveles 3–4) — pre-renderizadas, ocultas salvo si el color está expandido
      var childVis = pExpand && cExpand;
      c.gradesArr.forEach(function (g) {
        var gradeStock = getGradeStock(g);
        // Si hay filtro de sucursal y esta talla no tiene stock allí, omitirla
        if (sucursalFilterActive && gradeStock <= 0) return;

        html += '<tr class="row-grade" data-parent-color="' + escHtml(cKey) + '" style="display:' + (childVis ? 'table-row' : 'none') + '">';
        html += '<td></td><td></td>';   // col 1: toggle · col 2: ID
        html += '<td colspan="2"><div class="cell-flex indent-2"><span class="badge badge-green">T. ' + escHtml(g.grade) + '</span></div></td>';
        html += '<td style="text-align:right;color:var(--gray-500)"><strong>' + gradeStock + '</strong> <span style="font-size:11px">uds</span></td>';
        html += '<td class="hide-xs" style="color:var(--gray-400);font-size:11px">EAN: ' + escHtml(g.ean) + '</td>';
        html += '<td class="hide-sm" colspan="2" style="color:var(--gray-500)">Talla: <strong>' + escHtml(g.grade) + '</strong></td>';
        html += '<td></td>';
        html += '<td></td>';
        html += '</tr>';

        g.stock.forEach(function (s) {
          // Filtro de sucursal: omitir las que no están en la lista efectiva
          if (sucursalFilterActive && activeSucList.indexOf(s.sucursal) < 0) return;

          html += '<tr class="row-stock" data-parent-color="' + escHtml(cKey) + '" style="display:' + (childVis ? 'table-row' : 'none') + '">';
          html += '<td></td><td></td>';   // col 1: toggle · col 2: ID
          html += '<td colspan="2"><div class="indent-3">' + escHtml(s.sucursal) + '</div></td>';
          html += '<td><strong style="color:var(--primary)">' + (s.cantidad || 0) + ' uds</strong></td>';
          html += '<td class="hide-md">Últ.Compra: ' + fmtDate(s.dataUltCmp) + '</td>';
          html += '<td class="hide-md" colspan="2">Últ.Venta: ' + fmtDate(s.dataUltVnd) + '</td>';
          html += '<td></td><td></td>';
          html += '</tr>';
        });
      });
    });

  return html;
}

// Append del siguiente lote de productos a la tabla
function appendNextTableBatch() {
  if (renderedCount >= tableAllProducts.length) return;
  var tbody = document.getElementById('table-body');
  var next  = tableAllProducts.slice(renderedCount, renderedCount + BATCH_SIZE);
  var html  = next.map(buildTableRowsHtml_).join('');

  var tmp = document.createElement('tbody');
  tmp.innerHTML = html;
  var frag = document.createDocumentFragment();
  while (tmp.firstChild) frag.appendChild(tmp.firstChild);
  tbody.appendChild(frag);

  renderedCount += next.length;
  updateInfiniteFooter_('table', renderedCount, tableAllProducts.length);
}

// =================================================================
// RENDER — GALERÍA (scroll infinito)
// =================================================================
function renderGallery() {
  var container = document.getElementById('gallery-container');

  // Construir lista completa de tarjetas (producto × color) — una sola vez
  galleryAllCards = [];
  var stockFilterActive    = (filterStockMin !== null || filterStockMax !== null);
  var sucursalFilterActive = effectiveSucursalFilter_().length > 0;
  var fotoFilterActive     = (filterFoto !== 'all');

  // Si la búsqueda matcheó SOLO por color (no por código/nombre/marca/etc.),
  // restringir las cards a los colores que matchean — si no, se mostrarían
  // todas las variantes del producto y el usuario ve cards sin el color buscado.
  var qSearch = normTxt_((searchText || '').trim());
  var colorFilterActive = filterColor.length > 0;
  filteredProducts.forEach(function (p) {
    var prodFieldMatched = !qSearch || [p._normCod, p._normNombre, p._normMarca, p._normGrupo, p._normSubgrupo, p._normColecao]
      .some(function (v) { return v && v.indexOf(qSearch) >= 0; });
    var colorNameMatched = qSearch && !prodFieldMatched && p.colorsArr.some(function (c) {
      return c._normColor && c._normColor.indexOf(qSearch) >= 0;
    });
    p.colorsArr.forEach(function (c) {
      // Filtro Color: si está activo, solo mostrar las variantes seleccionadas
      if (colorFilterActive && filterColor.indexOf(c.color) < 0) return;
      if (qSearch && !prodFieldMatched) {
        if (colorNameMatched) {
          // Búsqueda matcheó por nombre de color → restringir a esos colores
          if (!c._normColor || c._normColor.indexOf(qSearch) < 0) return;
        } else {
          // Búsqueda matcheó solo por EAN → restringir al color que tiene ese EAN
          if (!c.gradesArr.some(function (g) { return g._normEan && g._normEan.indexOf(qSearch) >= 0; })) return;
        }
      }
      if (sucursalFilterActive && getColorStock(c) <= 0) return;
      if (stockFilterActive && !colorPassesStock_(c)) return;
      if (fotoFilterActive && !colorPassesFoto_(c)) return;
      galleryAllCards.push({ p: p, c: c });
    });
  });

  var totalCards = galleryAllCards.length;
  document.getElementById('gallery-count-txt').textContent =
    totalCards + ' variante' + (totalCards !== 1 ? 's' : '');

  renderedCount = 0;
  container.innerHTML = '';

  if (!totalCards) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:64px 20px;color:var(--gray-400)">No se encontraron productos</div>';
    updateInfiniteFooter_('gallery', 0, 0);
    return;
  }

  appendNextGalleryBatch();
  attachSentinel_('gallery');
}

// Construye el HTML de UNA card (producto × color)
// Marca una card como seleccionada (clase .is-selected), desmarca la anterior
// y la scrollea al viewport.
function selectCard_(card) {
  if (!card) return;
  var container = document.getElementById('gallery-container');
  if (!container) return;
  var prev = container.querySelector('.product-card.is-selected');
  if (prev && prev !== card) prev.classList.remove('is-selected');
  card.classList.add('is-selected');
  card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// Navegación por teclado en la galería:
//   ← →           card anterior / siguiente
//   ↑ ↓           card en la misma columna fila arriba / abajo
//   Home / End    primera / última card
//   Espacio       abrir foto (lightbox) de la card seleccionada
//   V o Enter     abrir "Ver detalles" de la card seleccionada
//   +             agregar al carrito (quick-add) de la card seleccionada
//   C             copiar el código de la card seleccionada al clipboard
//   B             focus al buscador (toggle, sin importar si hay sidebar)
//   F             abrir/cerrar el sidebar de filtros
// No interfiere cuando se está escribiendo en un input ni cuando hay un
// modificador (Ctrl/Cmd/Alt). Los atajos B y F funcionan aun con modal/
// lightbox/sidebar abierto; el resto solo cuando no hay overlays.
function onGalleryKeyNav_(e) {
  if (currentView !== 'gallery') return;
  var ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  var key = e.key;
  var modalOpen    = document.getElementById('modal').classList.contains('open');
  var lightboxOpen = document.getElementById('lightbox').classList.contains('open');
  var sidebarOpen  = document.getElementById('sidebar').classList.contains('open');
  var shortcutsOpen = document.getElementById('shortcuts-overlay').classList.contains('open');

  // ? toggle popup de atajos (siempre)
  if (key === '?') {
    e.preventDefault();
    if (shortcutsOpen) closeShortcuts_(); else openShortcuts_();
    return;
  }
  // Si el popup de atajos está abierto, ningún otro atajo aplica (sale por Esc o ?)
  if (shortcutsOpen) return;

  // F abre/cierra el sidebar (funciona siempre)
  if (key === 'f' || key === 'F') {
    e.preventDefault();
    toggleSidebar();
    return;
  }
  // B / "/" focus al buscador (funciona siempre)
  if (key === 'b' || key === 'B' || key === '/') {
    e.preventDefault();
    var s = document.getElementById('search-input');
    if (s) { s.focus(); if (typeof s.select === 'function') s.select(); }
    return;
  }

  // M (mantenida) dentro del lightbox → mostrar cuadrícula de margen
  if (lightboxOpen && (key === 'm' || key === 'M')) {
    e.preventDefault();
    lightboxMDown_ = true;
    showLightboxMarginGrid_();
    return;
  }
  // Con M apretada, ↑/↓ ajustan el % de margen en vez de navegar de foto
  if (lightboxOpen && lightboxMDown_ && (key === 'ArrowUp' || key === 'ArrowDown')) {
    e.preventDefault();
    adjustLightboxMarginPct_(key === 'ArrowUp' ? 1 : -1);
    return;
  }
  // Flechas dentro del lightbox → navegar al producto anterior/siguiente con foto
  if (lightboxOpen && (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown')) {
    e.preventDefault();
    advanceLightbox_(key);
    return;
  }
  // Space cierra el lightbox si estaba abierto
  if ((key === ' ' || key === 'Spacebar') && lightboxOpen) {
    e.preventDefault();
    closeLightbox();
    return;
  }
  // V / Enter cierra el modal de detalle si estaba abierto
  if ((key === 'v' || key === 'V' || key === 'Enter') && modalOpen) {
    e.preventDefault();
    closeModal();
    return;
  }

  // Resto de atajos requieren no overlays
  if (modalOpen || lightboxOpen || sidebarOpen) return;

  var isArrow = key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown';
  var isJump  = key === 'Home' || key === 'End';
  var isSpace = key === ' ' || key === 'Spacebar';
  var isV     = key === 'v' || key === 'V' || key === 'Enter';
  var isPlus  = key === '+' || key === '=';
  var isC     = key === 'c' || key === 'C';
  if (!isArrow && !isJump && !isSpace && !isV && !isPlus && !isC) return;

  var container = document.getElementById('gallery-container');
  if (!container) return;
  var cards = Array.prototype.slice.call(container.querySelectorAll('.product-card'));
  if (!cards.length) return;

  var current = container.querySelector('.product-card.is-selected');
  var idx     = current ? cards.indexOf(current) : -1;

  // Sin selección previa: cualquier flecha o Home/End selecciona la primera
  if (idx < 0 && (isArrow || isJump)) {
    e.preventDefault();
    selectCard_(cards[0]);
    return;
  }

  if (key === 'ArrowRight') {
    e.preventDefault();
    if (idx < cards.length - 1) selectCard_(cards[idx + 1]);
  } else if (key === 'ArrowLeft') {
    e.preventDefault();
    if (idx > 0) selectCard_(cards[idx - 1]);
  } else if (key === 'ArrowDown' || key === 'ArrowUp') {
    e.preventDefault();
    var dir = key === 'ArrowDown' ? 1 : -1;
    var curLeft = current.offsetLeft;
    var curTop  = current.offsetTop;
    var best = null, bestScore = Infinity;
    cards.forEach(function (c) {
      if (c === current) return;
      if (dir === 1  && c.offsetTop <= curTop) return;
      if (dir === -1 && c.offsetTop >= curTop) return;
      // Priorizar la fila inmediata; dentro de ella, la columna más cercana en X
      var score = Math.abs(c.offsetTop - curTop) * 10 + Math.abs(c.offsetLeft - curLeft);
      if (score < bestScore) { bestScore = score; best = c; }
    });
    if (best) selectCard_(best);
  } else if (key === 'Home') {
    e.preventDefault();
    selectCard_(cards[0]);
  } else if (key === 'End') {
    e.preventDefault();
    selectCard_(cards[cards.length - 1]);
  } else if (isSpace) {
    // Consumir Space siempre (evita el scroll de la página). Si no hay
    // selección o el producto no tiene foto, no hacer nada más.
    e.preventDefault();
    if (!current) return;
    var wrap = current.querySelector('.card-img-wrap');
    if (wrap && wrap.getAttribute('data-img')) openLightbox(wrap);
  } else if (isV) {
    if (!current) return;
    var btn = current.querySelector('.btn-card-detail');
    if (btn) {
      e.preventDefault();
      openModal(btn.getAttribute('data-cod'), btn.getAttribute('data-color'));
    }
  } else if (isPlus) {
    if (!current) return;
    var qa = current.querySelector('.btn-card-quickadd');
    if (qa) {
      e.preventDefault();
      openQuickAdd_(qa.getAttribute('data-cod'), qa.getAttribute('data-color'));
    }
  } else if (isC) {
    if (!current) return;
    var copy = current.querySelector('.btn-copy-code:not(.btn-share-card)');
    if (copy) {
      e.preventDefault();
      copyCodeToClipboard_(copy);
    }
  }
}

function openShortcuts_() {
  document.getElementById('shortcuts-overlay').classList.add('open');
}
function closeShortcuts_() {
  document.getElementById('shortcuts-overlay').classList.remove('open');
}

function buildGalleryCardHtml_(item) {
    var p = item.p, c = item.c;
    var imgUrl     = getImgUrl(c.imgId, 400);     // thumbnail 400px para la card
    var imgFullUrl = getImgUrl(c.imgId, 1600);    // versión grande para el lightbox
    var cStock     = getColorStock(c);   // total recalculado si hay filtro de sucursal
    var dotClass   = cStock > 10 ? 'dot-ok' : cStock > 0 ? 'dot-low' : 'dot-zero';
    var stockLabel = cStock > 10 ? 'Disponible' : cStock > 0 ? 'Stock bajo' : 'Agotado';

    // src vacío + data-src → IntersectionObserver carga la imagen al entrar al viewport
    var imgHtml = imgUrl
      ? '<img class="card-img lazy-img" data-src="' + imgUrl + '" alt="' + escHtml(c.color) + '"' +
        ' onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\';this.parentNode.style.cursor=\'default\'">' +
        '<div class="card-img-ph" style="display:none"><div class="ph-icon">&#x1F45F;</div><div>Sin imagen</div></div>' +
        '<div class="card-img-zoom">&#x1F50D;</div>'
      : '<div class="card-img-ph"><div class="ph-icon">&#x1F45F;</div><div>Sin imagen</div></div>';

    var wrapAttrs = imgUrl
      ? ' data-img="' + escHtml(imgFullUrl) + '"' +
        ' data-cap-name="' + escHtml(p.nmProduto) + '"' +
        ' data-cap-color="' + escHtml(c.color) + '"' +
        ' data-cap-cod="' + escHtml(p.codFabrica) + '"' +
        ' data-cap-price="' + escHtml(fmtPrice(getActivePrice(p).price)) + '"'
      : ' style="cursor:default"';

    var isFavCard = isFav_(p.codFabrica, c.color);
    return '<div class="product-card">' +
      '<div class="card-img-wrap"' + wrapAttrs + '>' + imgHtml +
        '<button class="btn-card-fav' + (isFavCard ? ' is-fav' : '') + '" data-cod="' + escHtml(p.codFabrica) + '" data-color="' + escHtml(c.color) + '" title="' + (isFavCard ? 'Quitar de favoritos' : 'Guardar en favoritos') + '" aria-label="Favorito">' + (isFavCard ? SVG_HEART_FULL : SVG_HEART_EMPTY) + '</button>' +
        '<button class="btn-card-quickadd" data-cod="' + escHtml(p.codFabrica) + '" data-color="' + escHtml(c.color) + '" title="Agregar al carrito" aria-label="Agregar al carrito"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-code">' + escHtml(p.codFabrica) +
          ' <button class="btn-copy-code" data-copy="' + escHtml(p.codFabrica) + '" title="Copiar código" aria-label="Copiar código">' + SVG_CLIPBOARD + '</button>' +
          ' <button class="btn-copy-code btn-share-card" data-cod="' + escHtml(p.codFabrica) + '" data-color="' + escHtml(c.color) + '" title="Compartir por WhatsApp" aria-label="Compartir por WhatsApp"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>' +
        '</div>' +
        '<div class="card-name">'  + escHtml(p.nmProduto) + '</div>' +
        '<div class="card-marca">Marca: <b>' + escHtml(p.marca) + '</b></div>' +
        (p.subgrupo ? '<div class="card-subgrupo">Subgrupo: <b>' + escHtml(p.subgrupo) + '</b></div>' : '') +
        '<div class="card-color">Color: <b>' + escHtml(c.color) + '</b></div>' +
        '<div class="card-foot">' +
          '<div class="card-price-row">' +
            '<div class="card-price">' + renderPriceHtml(p) + '</div>' +
            '<div class="card-stock">' +
              '<div class="stock-dot ' + dotClass + '"></div>' +
              '<div class="card-stock-txt">' + cStock + ' uds</div>' +
            '</div>' +
          '</div>' +
          '<button class="card-cta btn-card-detail" data-cod="' + escHtml(p.codFabrica) + '" data-color="' + escHtml(c.color) + '">Ver detalles</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// Append del siguiente lote de cards a la galería
function appendNextGalleryBatch() {
  if (renderedCount >= galleryAllCards.length) return;
  var container = document.getElementById('gallery-container');
  var next = galleryAllCards.slice(renderedCount, renderedCount + BATCH_SIZE);
  var html = next.map(buildGalleryCardHtml_).join('');

  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var frag = document.createDocumentFragment();
  while (tmp.firstChild) frag.appendChild(tmp.firstChild);
  container.appendChild(frag);

  renderedCount += next.length;
  updateInfiniteFooter_('gallery', renderedCount, galleryAllCards.length);
  observeLazyImages();
}

// =================================================================
// INFINITE SCROLL — sentinel + IntersectionObserver
// =================================================================
function attachSentinel_(view) {
  var sentinelId = view === 'gallery' ? 'gallery-sentinel' : 'table-sentinel';
  var sentinel = document.getElementById(sentinelId);
  if (!sentinel) return;

  if (!sentinelObserver) {
    sentinelObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        fillViewportWithBatches_(currentView);
      });
    }, { rootMargin: '400px 0px' });
  }
  // Re-observar: el sentinel sigue siendo el mismo nodo, pero unobserve+observe
  // garantiza que dispare aunque ya estuviera dentro del viewport.
  sentinelObserver.unobserve(sentinel);
  sentinelObserver.observe(sentinel);

  // Si tras (re)renderizar el sentinel ya está visible (p.ej. el listado
  // filtrado quedó corto pero el scroll seguía abajo del filtro anterior),
  // el observer no va a disparar porque no hay CAMBIO de intersección.
  // Rellenamos manualmente hasta que el sentinel salga del viewport.
  fillViewportWithBatches_(view);
}

// Sigue appendeando lotes mientras el sentinel esté dentro (o cerca, según
// el mismo rootMargin del observer) del viewport. Cubre el caso en que un
// solo batch no alcanza para empujar el sentinel fuera de vista.
function fillViewportWithBatches_(view) {
  var sentinelId = view === 'gallery' ? 'gallery-sentinel' : 'table-sentinel';
  var sentinel = document.getElementById(sentinelId);
  if (!sentinel) return;

  var guard = 200; // tope defensivo (10k items)
  while (guard-- > 0) {
    var rect = sentinel.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var visible = rect.top < vh + 400 && rect.bottom > -400; // mismo margen del observer
    if (!visible) break;

    var before = renderedCount;
    if (view === 'gallery') appendNextGalleryBatch();
    else                    appendNextTableBatch();
    if (renderedCount === before) break; // ya no hay más para appendear
  }
}

// Después de un refresh silencioso, appendea lotes adicionales hasta llegar al
// renderedCount que el usuario tenía cargado antes del refresh.
function restoreRenderedCount_(targetCount) {
  if (!targetCount || targetCount <= renderedCount) return;
  var guard = 200; // tope defensivo (10k items)
  while (renderedCount < targetCount && guard-- > 0) {
    var before = renderedCount;
    if (currentView === 'gallery') appendNextGalleryBatch();
    else                            appendNextTableBatch();
    if (renderedCount === before) break; // ya no hay más para appendear
  }
}

function updateInfiniteFooter_(view, shown, total) {
  var chipId = view === 'gallery' ? 'gallery-footer-chip' : 'table-footer-chip';
  var chip = document.getElementById(chipId);
  if (!chip) return;
  if (!total) { chip.style.display = 'none'; return; }
  chip.style.display = 'flex';
  if (shown >= total) {
    chip.classList.add('is-end');
    chip.innerHTML = '✓ Fin del catálogo (' + total + ' ' +
      (view === 'gallery' ? 'variantes' : 'productos') + ')';
  } else {
    chip.classList.remove('is-end');
    chip.innerHTML = '<span class="spinner"></span> Mostrando ' + shown +
      ' de ' + total + ' — desliza para ver más';
  }
}

// =================================================================
// LAZY LOADING DE IMÁGENES (IntersectionObserver)
// =================================================================
// Carga la imagen sólo cuando entra al viewport. Soluciona el cuello de
// botella de Drive cuando hay 50 cards intentando descargar a la vez.
var lazyObserver = null;

function observeLazyImages() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: navegadores muy viejos → cargar todo de una
    document.querySelectorAll('img.lazy-img[data-src]').forEach(function (img) {
      img.src = img.getAttribute('data-src');
      img.classList.add('loaded');
    });
    return;
  }

  if (!lazyObserver) {
    lazyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var img = entry.target;
        var src = img.getAttribute('data-src');
        if (src) {
          img.onload = function () { img.classList.add('loaded'); };
          img.src = src;
          img.removeAttribute('data-src');
        }
        lazyObserver.unobserve(img);
      });
    }, {
      // Empieza a precargar 300px antes de que entre al viewport
      rootMargin: '300px 0px',
      threshold: 0.01
    });
  }

  document.querySelectorAll('img.lazy-img[data-src]').forEach(function (img) {
    lazyObserver.observe(img);
  });
}

// =================================================================
// RENDER — MODAL
// =================================================================
function openModal(codFabrica, colorName) {
  var product = null;
  for (var i = 0; i < products.length; i++) {
    if (String(products[i].codFabrica) === String(codFabrica)) { product = products[i]; break; }
  }
  if (!product) return;

  document.getElementById('modal-title').innerHTML =
    escHtml(product.codFabrica) +
    ' <button class="btn-copy-code" data-copy="' + escHtml(product.codFabrica) +
    '" title="Copiar código" aria-label="Copiar código">' + SVG_CLIPBOARD + '</button>';
  document.getElementById('modal-subtitle').textContent =
    product.nmProduto +
    ' · Marca: ' + product.marca +
    ' · ' + product.grupo + ' / ' + product.subgrupo;

  var activeColor = colorName || (product.colorsArr[0] && product.colorsArr[0].color) || '';
  var modalShareBtn = document.getElementById('modal-btn-share');
  var modalFavBtn  = document.getElementById('modal-btn-fav');
  var modalCartBtn = document.getElementById('modal-btn-cart');
  modalShareBtn.setAttribute('data-cod', product.codFabrica);
  modalShareBtn.setAttribute('data-color', activeColor);
  modalFavBtn.setAttribute('data-cod', product.codFabrica);
  modalFavBtn.setAttribute('data-color', activeColor);
  modalCartBtn.setAttribute('data-cod', product.codFabrica);
  modalCartBtn.setAttribute('data-color', activeColor);
  var favActive = isFav_(product.codFabrica, activeColor);
  modalFavBtn.classList.toggle('is-fav', favActive);
  modalFavBtn.innerHTML = favActive
    ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
    : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

  var cols = colorName
    ? product.colorsArr.filter(function (c) { return c.color === colorName; })
    : product.colorsArr;

  // Bloque de precios + top venta — visible siempre en el modal
  var priceBlockHtml = buildModalPriceBlock_(product);

  var modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = cols.map(function (c) {
    var imgUrl     = getImgUrl(c.imgId, 400);   // modal: tamaño medio
    var imgFullUrl = getImgUrl(c.imgId, 1600);  // versión grande para el lightbox
    var imgHtml = imgUrl
      ? '<img class="modal-color-img" src="' + imgUrl + '" loading="lazy"' +
        ' data-img="' + escHtml(imgFullUrl) + '"' +
        ' data-cap-name="' + escHtml(product.nmProduto) + '"' +
        ' data-cap-color="' + escHtml(c.color) + '"' +
        ' data-cap-cod="' + escHtml(product.codFabrica) + '"' +
        ' data-cap-price="' + escHtml(fmtPrice(getActivePrice(product).price)) + '"' +
        ' title="Click para ampliar"' +
        ' onerror="this.style.display=\'none\'">'
      : '<div class="modal-color-ph">&#x1F45F;</div>';

    // Si el config del modo dice restringir sucursales, armar un set para filtrar.
    // Si no está restringido (o no hay sucursales configuradas), restrictSet=null
    // y se muestra todo como antes.
    var cfg = window.PAGE_CONFIG || {};
    var restrictSet = null;
    if (cfg.restrictModalSucursales && cfg.sucursales && cfg.sucursales.length) {
      restrictSet = {};
      cfg.sucursales.forEach(function (s) { restrictSet[s] = true; });
    }

    // Recomputar grades y totales según las sucursales restringidas
    var visibleGrades = c.gradesArr.map(function (g) {
      var stockFiltered = restrictSet
        ? g.stock.filter(function (s) { return restrictSet[s.sucursal]; })
        : g.stock;
      var totalGrade = stockFiltered.reduce(function (sum, s) { return sum + (s.cantidad || 0); }, 0);
      return { grade: g.grade, ean: g.ean, stock: stockFiltered, totalStock: totalGrade };
    }).filter(function (g) {
      // Si restrictSet activo, ocultar grades sin stock en las sucursales válidas
      return !restrictSet || g.totalStock > 0;
    });

    var colorTotal = visibleGrades.reduce(function (sum, g) { return sum + g.totalStock; }, 0);
    var displayTotal = restrictSet ? colorTotal : c.totalStock;
    var displayGradeCount = visibleGrades.length;

    // Skip color blocks with no stock in the active sucursales
    if (restrictSet && colorTotal === 0) return '';

    return '<div class="modal-color-block">' +
      '<div class="modal-color-head">' +
        imgHtml +
        '<div>' +
          '<div class="modal-color-name">Color: ' + escHtml(c.color) + '</div>' +
          '<div class="modal-color-total">Stock total: ' + displayTotal + ' uds · ' + displayGradeCount + ' talla' + (displayGradeCount !== 1 ? 's' : '') + '</div>' +
        '</div>' +
      '</div>' +
      visibleGrades.map(function (g) {
        // Auto-expandir si:
        //  - El usuario filtró esta talla (filterTalle.indexOf(g.grade) >= 0), O
        //  - Es la única talla disponible para este color
        var inFilter      = filterTalle.length > 0 && filterTalle.indexOf(g.grade) >= 0;
        var onlyOne       = visibleGrades.length === 1;
        var openAttr      = (inFilter || onlyOne) ? ' open' : '';
        return '<details class="modal-grade-block"' + openAttr + '>' +
          '<summary class="modal-grade-head">' +
            '<span class="modal-grade-title">Talla ' + escHtml(g.grade) + ' — ' + g.totalStock + ' uds</span>' +
            '<span class="modal-grade-ean modal-grade-ean-clickable" role="button" tabindex="0" title="Ver código de barra"' +
              ' onclick="event.preventDefault();event.stopPropagation();openBarcodeModal_(\'' + escHtml(g.ean) + '\')"' +
              ' onkeydown="if(event.key===\'Enter\'){event.preventDefault();event.stopPropagation();openBarcodeModal_(\'' + escHtml(g.ean) + '\')}">' +
              'EAN: ' + escHtml(g.ean) +
            '</span>' +
          '</summary>' +
          '<table class="stock-table">' +
            '<thead><tr><th>Sucursal</th><th>Cantidad</th><th>Últ. Compra</th><th>Últ. Venta</th></tr></thead>' +
            '<tbody>' +
            g.stock.map(function (s) {
              return '<tr>' +
                '<td>' + escHtml(s.sucursal) + '</td>' +
                '<td><span class="qty-val">' + (s.cantidad || 0) + ' uds</span></td>' +
                '<td>' + fmtDate(s.dataUltCmp) + '</td>' +
                '<td>' + fmtDate(s.dataUltVnd)  + '</td>' +
              '</tr>';
            }).join('') +
            '</tbody>' +
          '</table>' +
        '</details>';
      }).join('') +
    '</div>';
  }).join('');

  // Strip de colores disponibles — solo colores con stock en las sucursales activas
  var availableColors = product.colorsArr.filter(function (c) { return getColorStock(c) > 0; });
  if (availableColors.length > 1) {
    var colorsStripHtml = '<div class="modal-colors-strip"><span class="mcs-label">Colores disponibles (' + availableColors.length + '):</span>' +
      availableColors.map(function (c) { var isActive = colorName && c.color === colorName; return '<span class="mcs-chip' + (isActive ? ' mcs-chip-active' : '') + '" role="button" tabindex="0" onclick="openModal(\'' + escHtml(product.codFabrica) + '\',\'' + escHtml(c.color) + '\')" onkeydown="if(event.key===\'Enter\')openModal(\'' + escHtml(product.codFabrica) + '\',\'' + escHtml(c.color) + '\')">' + escHtml(c.color) + '</span>'; }).join('') +
      '</div>';
    modalBody.insertAdjacentHTML('beforeend', colorsStripHtml);
  }

  // Bloque de precios + top venta + última compra
  modalBody.insertAdjacentHTML('beforeend', priceBlockHtml);

  // Sección "Productos similares" al final del modal-body. Si no hay matches,
  // renderSimilarsBlock_ devuelve '' y no se ve nada.
  modalBody.insertAdjacentHTML('beforeend', renderSimilarsBlock_(product));

  // Resetear scroll del body: si el usuario llegó acá click-eando una card
  // similar del producto anterior, queremos que vea el nuevo producto desde
  // arriba (precios) y no desde la sección similares.
  modalBody.scrollTop = 0;

  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// =================================================================
// PRODUCTOS SIMILARES (sección al final del modal)
// =================================================================

/**
 * Devuelve un score de similitud entre dos productos. Score > 0 = candidato
 * relevante. 0 = mismo producto o sin coincidencias. Más alto = más similar.
 */
function scoreSimilarity_(candidate, ref) {
  if (candidate.codFabrica === ref.codFabrica) return 0;   // mismo producto, excluir
  var s = 0;

  if (candidate.subgrupo && candidate.subgrupo === ref.subgrupo) s += 100;
  if (candidate.grupo    && candidate.grupo    === ref.grupo)    s += 50;
  if (candidate.marca    && candidate.marca    === ref.marca)    s += 30;

  // Color en común: matchea si cualquier color del candidato coincide con
  // cualquiera del producto de referencia (case-insensitive).
  var refColors = {};
  ref.colorsArr.forEach(function (c) { refColors[String(c.color).toUpperCase()] = 1; });
  var hasCommonColor = candidate.colorsArr.some(function (c) {
    return refColors[String(c.color).toUpperCase()];
  });
  if (hasCommonColor) s += 20;

  // Precio similar (usa el priceMode activo: minorista o mayorista)
  var refPrice  = getActivePrice(ref).price  || 0;
  var candPrice = getActivePrice(candidate).price || 0;
  if (refPrice > 0 && candPrice > 0) {
    var diff = Math.abs(refPrice - candPrice) / refPrice;
    if (diff < 0.30)      s += 20;
    else if (diff < 0.50) s += 10;
  }

  if (candidate.colecao && candidate.colecao === ref.colecao) s += 10;

  return s;
}

/**
 * Devuelve hasta `max` productos similares al producto dado, con stock > 0.
 * Ordenados por score descendente. Si no hay candidatos relevantes, devuelve [].
 *
 * Los similares respetan los filtros del sidebar (talle, sucursal, marca, grupo,
 * precio, stock, foto, promo) PERO no respetan la búsqueda por texto. Si el
 * usuario buscó "8700SP" y abrió ese producto, querría ver otros similares —
 * no solo el código exacto que escribió.
 */
function findSimilarProducts_(product, max) {
  max = max || 6;

  var hasSearch = searchText && searchText.trim().length > 0;
  var pool;
  if (hasSearch) {
    // Recomputar el pool ignorando el search filter — el resto sigue aplicando.
    pool = products.filter(function (p) {
      return _productPassesFilters_(p, true);
    });
  } else {
    // Sin búsqueda: reutilizar filteredProducts (más rápido)
    pool = (filteredProducts && filteredProducts.length) ? filteredProducts : products;
  }

  var results = [];
  for (var i = 0; i < pool.length; i++) {
    var p = pool[i];
    if (getProductStock(p) <= 0) continue;   // solo con stock para que sea accionable
    var score = scoreSimilarity_(p, product);
    if (score <= 0) continue;
    results.push({ p: p, score: score });
  }
  results.sort(function (a, b) { return b.score - a.score; });
  return results.slice(0, max).map(function (x) { return x.p; });
}

/**
 * Devuelve el HTML del bloque "Productos similares" para insertar al final
 * del modal-body. Si no hay productos similares, devuelve string vacío.
 */
function renderSimilarsBlock_(product) {
  var similars = findSimilarProducts_(product, 6);
  if (!similars.length) return '';

  var cards = similars.map(function (p) {
    var c0     = p.colorsArr[0];   // primer color como representativo
    var imgUrl = c0 ? getImgUrl(c0.imgId, 200) : null;
    var priceHtml = renderPriceHtml(p);
    var stock = getProductStock(p);

    return '<div class="modal-similar-card" data-cod="' + escHtml(p.codFabrica) + '" data-color="' + escHtml(c0 ? c0.color : '') + '" role="button" tabindex="0" title="Ver detalles">' +
      (imgUrl
        ? '<img class="msc-img" src="' + imgUrl + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
        : '<div class="msc-img-ph">&#x1F45F;</div>') +
      '<div class="msc-body">' +
        '<div class="msc-cod">' + escHtml(p.codFabrica) + '</div>' +
        '<div class="msc-name">' + escHtml(p.nmProduto) + '</div>' +
        '<div class="msc-marca">' + escHtml(p.marca) + '</div>' +
        '<div class="msc-price">' + priceHtml + '</div>' +
        '<div class="msc-stock">' + stock + ' uds</div>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<div class="modal-similars">' +
    '<div class="modal-similars-title">Productos similares</div>' +
    '<div class="modal-similars-grid">' + cards + '</div>' +
  '</div>';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

// =================================================================
// CÓDIGO DE BARRA (EAN-13) — generado en JS puro, sin librería externa
// (la app funciona offline vía Service Worker, así que evitamos CDNs)
// =================================================================
var EAN13_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
var EAN13_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
var EAN13_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
var EAN13_PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

/**
 * Codifica un string de 13 dígitos como EAN-13 y devuelve el SVG del código
 * de barra (con los dígitos legibles debajo, como cualquier etiqueta EAN).
 * Devuelve null si el código no tiene exactamente 13 dígitos numéricos.
 */
function buildEan13Svg_(code) {
  code = String(code || '').trim();
  if (!/^\d{13}$/.test(code)) return null;

  var parity = EAN13_PARITY[Number(code[0])];
  var bits = '101'; // guarda inicial
  for (var i = 0; i < 6; i++) {
    var d = Number(code[1 + i]);
    bits += (parity[i] === 'L') ? EAN13_L[d] : EAN13_G[d];
  }
  bits += '01010'; // guarda central
  for (var j = 0; j < 6; j++) {
    bits += EAN13_R[Number(code[7 + j])];
  }
  bits += '101'; // guarda final

  var UNIT     = 2;
  var QUIET    = 10 * UNIT;
  var BAR_H    = 80;
  var GUARD_H  = 92;
  var totalW   = bits.length * UNIT + QUIET * 2;
  var totalH   = 110;
  var guardRanges = [[0, 3], [45, 50], [92, 95]]; // índices de bit de cada guarda

  function isGuard(idx) {
    for (var k = 0; k < guardRanges.length; k++) {
      if (idx >= guardRanges[k][0] && idx < guardRanges[k][1]) return true;
    }
    return false;
  }

  var rects = '';
  for (var b = 0; b < bits.length; b++) {
    if (bits[b] === '1') {
      var h = isGuard(b) ? GUARD_H : BAR_H;
      rects += '<rect x="' + (QUIET + b * UNIT) + '" y="0" width="' + UNIT + '" height="' + h + '" fill="#000"/>';
    }
  }

  var leftGroupX  = QUIET + 3 * UNIT + (42 * UNIT) / 2;
  var rightGroupX = QUIET + 50 * UNIT + (42 * UNIT) / 2;
  var firstDigitX = QUIET - 4 * UNIT;
  var textY       = totalH - 4;

  var textEls =
    '<text x="' + firstDigitX  + '" y="' + textY + '" font-family="monospace" font-size="14">' + code[0] + '</text>' +
    '<text x="' + leftGroupX   + '" y="' + textY + '" font-family="monospace" font-size="14" text-anchor="middle" letter-spacing="1">' + code.slice(1, 7)  + '</text>' +
    '<text x="' + rightGroupX  + '" y="' + textY + '" font-family="monospace" font-size="14" text-anchor="middle" letter-spacing="1">' + code.slice(7, 13) + '</text>';

  return '<svg viewBox="0 0 ' + totalW + ' ' + totalH + '" width="100%" style="max-width:300px;height:auto;background:#fff">' +
    rects + textEls +
    '</svg>';
}

function openBarcodeModal_(ean) {
  var overlay = document.getElementById('barcode-overlay');
  var body    = document.getElementById('barcode-body');
  if (!overlay || !body) return;

  var svg = buildEan13Svg_(ean);
  body.innerHTML = svg || '<div class="barcode-error">Código EAN no válido: ' + escHtml(String(ean || '')) + '</div>';

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBarcodeModal_() {
  document.getElementById('barcode-overlay').classList.remove('open');
  // No restaurar el scroll si el modal de "Ver detalles" sigue abierto detrás
  if (!document.getElementById('modal').classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

// =================================================================
// ESCÁNER DE CÓDIGO DE BARRA (cámara) — usa la API nativa BarcodeDetector,
// sin librerías externas. Sólo se ofrece en móvil (pointer:coarse) y
// cuando el navegador soporta tanto BarcodeDetector como getUserMedia.
// =================================================================
var scanStream_   = null;
var scanRAF_      = null;
var scanDetector_ = null;

function scanBarcodeSupported_() {
  return !!(window.BarcodeDetector && navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
    window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
}

// Diagnóstico rápido sin devtools — tocando "v1.x.x" en el pie del sidebar.
function showScanDiagnostic_() {
  var TEST_EAN = '2606080009162'; // PJ7207 — confirmado que existe en Supabase
  var rawFound = null;
  (products || []).some(function (p) {
    return p.colorsArr.some(function (c) {
      var hit = c.gradesArr.some(function (g) { return g.ean === TEST_EAN; });
      if (hit) rawFound = p.codFabrica;
      return hit;
    });
  });

  var lines = [
    'BarcodeDetector: '   + (!!window.BarcodeDetector),
    'mediaDevices: '      + (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)),
    'pointer coarse: '    + (!!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)),
    'Contexto seguro (HTTPS): ' + window.isSecureContext,
    '¿Botón debería verse?: ' + scanBarcodeSupported_(),
    '',
    '--- Datos cargados ---',
    'productos en memoria: ' + ((products || []).length),
    'catalogServerUpdatedAt: ' + catalogServerUpdatedAt,
    'PJ7207 (EAN test) encontrado en datos crudos: ' + (rawFound || 'NO'),
    '',
    '--- Filtros activos ---',
    'marca: '     + JSON.stringify(filterMarca),
    'sucursal: '  + JSON.stringify(filterSucursal),
    'stockMin/Max: ' + filterStockMin + ' / ' + filterStockMax,
    'precioMin/Max: ' + filterPrecioMin + ' / ' + filterPrecioMax,
    'foto: ' + filterFoto + ' | promo: ' + filterPromo,
    '',
    '--- Búsqueda ---',
    'searchText actual: "' + searchText + '"',
    'filteredProducts.length: ' + filteredProducts.length,
    '',
    '--- Códigos de caracter del buscador (para detectar chars raros) ---',
    (function () {
      var v = (document.getElementById('search-input') || {}).value || '';
      if (!v) return '(buscador vacío)';
      return v.split('').map(function (ch) {
        return '"' + ch + '"=U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
      }).join('  ');
    })(),
    '',
    navigator.userAgent
  ];
  alert(lines.join('\n'));
}

function openBarcodeScanner_() {
  var overlay = document.getElementById('scan-overlay');
  var video   = document.getElementById('scan-video');
  var status  = document.getElementById('scan-status');
  if (!overlay || !video) return;

  status.textContent = 'Apuntá la cámara al código de barra';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    scanDetector_ = new BarcodeDetector({ formats: ['ean_13'] });
  } catch (e) {
    status.textContent = 'Tu navegador no soporta el escáner de códigos.';
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(function (stream) {
      scanStream_ = stream;
      video.srcObject = stream;
      return video.play();
    })
    .then(function () {
      scanLoop_();
    })
    .catch(function (err) {
      console.warn('[scan] cámara no disponible:', err);
      status.textContent = (err && err.name === 'NotAllowedError')
        ? 'Permiso de cámara denegado. Habilitalo en la configuración del navegador.'
        : 'No se pudo acceder a la cámara.';
    });
}

function scanLoop_() {
  if (!scanStream_) return; // el escáner se cerró mientras esperábamos el frame
  var video = document.getElementById('scan-video');
  if (!video || video.readyState < 2) {
    scanRAF_ = requestAnimationFrame(scanLoop_);
    return;
  }
  scanDetector_.detect(video).then(function (codes) {
    if (!scanStream_) return; // se cerró durante el detect() async
    if (codes && codes.length) {
      var raw = (codes[0].rawValue || '').trim();
      if (/^\d{13}$/.test(raw)) {
        onBarcodeScanned_(raw);
        return;
      }
    }
    scanRAF_ = requestAnimationFrame(scanLoop_);
  }).catch(function () {
    if (scanStream_) scanRAF_ = requestAnimationFrame(scanLoop_);
  });
}

function onBarcodeScanned_(code) {
  if (navigator.vibrate) navigator.vibrate(80);
  closeBarcodeScanner_();

  var searchInput = document.getElementById('search-input');
  var btnClear    = document.getElementById('btn-search-clear');
  var btnPaste    = document.getElementById('btn-search-paste');
  searchInput.value = code;
  searchText = code;
  if (btnClear) btnClear.style.display = '';
  if (btnPaste) btnPaste.style.display = 'none';
  applyFilters();
  renderCurrentView();
  searchInput.focus();
}

function closeBarcodeScanner_() {
  var overlay = document.getElementById('scan-overlay');
  var video   = document.getElementById('scan-video');
  if (scanRAF_) { cancelAnimationFrame(scanRAF_); scanRAF_ = null; }
  if (scanStream_) {
    scanStream_.getTracks().forEach(function (t) { t.stop(); });
    scanStream_ = null;
  }
  if (video) video.srcObject = null;
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// =================================================================
// LIGHTBOX (vista previa de imagen en galería)
// =================================================================
function openLightbox(wrap) {
  var src   = wrap.getAttribute('data-img');
  var name  = wrap.getAttribute('data-cap-name')  || '';
  var color = wrap.getAttribute('data-cap-color') || '';
  var cod   = wrap.getAttribute('data-cap-cod')   || '';
  var price = wrap.getAttribute('data-cap-price') || '';

  document.getElementById('lightbox-img').src    = src;
  document.getElementById('lightbox-img').alt    = name + ' - ' + color;
  document.getElementById('lightbox-caption').innerHTML =
    '<strong>' + escHtml(name) + '</strong> · ' + escHtml(color) +
    '<div class="lb-sub">Cód: ' + escHtml(cod) + ' · ' + escHtml(price) + '</div>';

  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  hideLightboxMarginGrid_();
}

// Cuadrícula de margen dentro de la imagen — se muestra mientras se mantiene
// apretada la tecla M (keydown/keyup, no toggle). Con M apretada, ↑/↓ ajustan
// el porcentaje de margen en vivo (lightboxMarginPct_).
var lightboxMarginPct_ = 15;
var lightboxMDown_     = false;

function showLightboxMarginGrid_() {
  var g = document.getElementById('lightbox-margin-grid');
  var l = document.getElementById('lightbox-margin-label');
  if (g) g.classList.add('show');
  if (l) l.classList.add('show');
}
function hideLightboxMarginGrid_() {
  var g = document.getElementById('lightbox-margin-grid');
  var l = document.getElementById('lightbox-margin-label');
  if (g) g.classList.remove('show');
  if (l) l.classList.remove('show');
}
function setLightboxMarginPct_(pct) {
  lightboxMarginPct_ = Math.max(0, Math.min(45, pct));
  var wrap  = document.getElementById('lightbox-img-wrap');
  var label = document.getElementById('lightbox-margin-label');
  if (wrap)  wrap.style.setProperty('--lb-margin', lightboxMarginPct_ + '%');
  if (label) label.textContent = 'Margen: ' + lightboxMarginPct_ + '%';
}
function adjustLightboxMarginPct_(delta) {
  setLightboxMarginPct_(lightboxMarginPct_ + delta);
}

// Avanza el lightbox al siguiente/anterior producto con foto.
//   ←/↑ retrocede, →/↓ avanza. Si llega al borde, no envuelve.
//   Mueve también la selección de card para que al cerrar quede sincronizado.
function advanceLightbox_(key) {
  var container = document.getElementById('gallery-container');
  if (!container) return;
  var cards = Array.prototype.slice.call(container.querySelectorAll('.product-card'));
  if (!cards.length) return;
  var current = container.querySelector('.product-card.is-selected');
  var idx     = current ? cards.indexOf(current) : -1;
  var dir     = (key === 'ArrowRight' || key === 'ArrowDown') ? 1 : -1;
  if (idx < 0) idx = dir === 1 ? -1 : cards.length;
  for (var i = idx + dir; i >= 0 && i < cards.length; i += dir) {
    var wrap = cards[i].querySelector('.card-img-wrap');
    if (wrap && wrap.getAttribute('data-img')) {
      selectCard_(cards[i]);
      openLightbox(wrap);
      return;
    }
  }
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightbox-img').src = '';
  lightboxMDown_ = false;
  hideLightboxMarginGrid_();
  if (!document.getElementById('modal').classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

// =================================================================
// EXPAND / COLAPSAR — CSS toggle (sin re-render del DOM)
// =================================================================
function toggleProduct(pKey) {
  var nowExpanded = !expandedProducts[pKey];
  expandedProducts[pKey] = nowExpanded;

  // Actualizar flecha en la fila producto
  var productRow = document.querySelector('tr.row-product[data-key="' + pKey + '"]');
  if (!productRow) return;
  productRow.querySelector('.toggle-icon').classList.toggle('expanded', nowExpanded);

  // Mostrar/ocultar filas de color del producto
  document.querySelectorAll('tr.row-color[data-parent="' + pKey + '"]').forEach(function (row) {
    var cKey     = row.getAttribute('data-key');
    var cExpand  = !!expandedColors[cKey];

    if (nowExpanded) {
      // Mostrar color (las filas hijo permanecen en su estado actual)
      row.style.display = 'table-row';
    } else {
      // Ocultar color y forzar colapso de sus hijos
      row.style.display = 'none';
      if (cExpand) {
        expandedColors[cKey] = false;
        var icon = row.querySelector('.toggle-icon');
        if (icon) icon.classList.remove('expanded');
        document.querySelectorAll('[data-parent-color="' + cKey + '"]').forEach(function (r) {
          r.style.display = 'none';
        });
      }
    }
  });
}

function toggleColor(cKey) {
  var nowExpanded = !expandedColors[cKey];
  expandedColors[cKey] = nowExpanded;

  // Actualizar flecha en la fila de color
  var colorRow = document.querySelector('tr.row-color[data-key="' + cKey + '"]');
  if (!colorRow) return;
  colorRow.querySelector('.toggle-icon').classList.toggle('expanded', nowExpanded);

  // Mostrar/ocultar filas de talla y stock de este color
  document.querySelectorAll('[data-parent-color="' + cKey + '"]').forEach(function (row) {
    row.style.display = nowExpanded ? 'table-row' : 'none';
  });
}

// =================================================================
// CAMBIO DE VISTA
// =================================================================
function switchView(view) {
  currentView = view;
  renderedCount = 0;  // al cambiar de vista volvemos a renderizar desde el inicio
  var isTable     = view === 'table';
  var isCart      = view === 'cart';
  var isGallery   = view === 'gallery';
  var isFavorites = view === 'favorites';

  document.getElementById('table-view').style.display     = isTable     ? 'block' : 'none';
  document.getElementById('gallery-view').style.display   = isGallery   ? 'block' : 'none';
  document.getElementById('cart-view').style.display      = isCart      ? 'block' : 'none';
  document.getElementById('favorites-view').style.display = isFavorites ? 'block' : 'none';

  // Botones de galería/tabla en desktop — activo según vista
  var galleryBtn = document.getElementById('btn-gallery');
  var tableBtn   = document.getElementById('btn-table');
  if (galleryBtn) galleryBtn.classList.toggle('active', isGallery);
  if (tableBtn)   tableBtn.classList.toggle('active', isTable);

  // Chips resaltados según vista activa (header — desktop)
  var cartChip = document.getElementById('btn-cart');
  if (cartChip) cartChip.classList.toggle('active', isCart);
  var favChip = document.getElementById('btn-fav');
  if (favChip) favChip.classList.toggle('active', isFavorites);

  // Bottom nav — active state (mobile)
  var bnavMap = { gallery: 'bnav-gallery', favorites: 'bnav-fav', cart: 'bnav-cart', table: 'bnav-table' };
  ['bnav-gallery', 'bnav-fav', 'bnav-cart', 'bnav-table'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  var activeTab = bnavMap[view] && document.getElementById(bnavMap[view]);
  if (activeTab) activeTab.classList.add('active');

  renderCurrentView();
}

function toggleView_() {
  // En cart view, el botón está oculto. Solo alterna gallery <-> table.
  switchView(currentView === 'table' ? 'gallery' : 'table');
}

function openCartView_() {
  // Toggle entre carrito y la vista anterior (default galería)
  if (currentView === 'cart') switchView('gallery');
  else switchView('cart');
}

function openFavView_() {
  if (currentView === 'favorites') switchView('gallery');
  else switchView('favorites');
}

// =================================================================
// HELPERS DE RENDER
// =================================================================
function renderCurrentView() {
  if (!productsLoaded && currentView !== 'cart' && currentView !== 'favorites') return;
  if (currentView === 'table')          renderTable();
  else if (currentView === 'cart')      renderCart_();
  else if (currentView === 'favorites') renderFavorites();
  else                                  renderGallery();
  updateStats();
}

// =================================================================
// FAVORITOS — estado + persistencia + render
// =================================================================
function favKey_(cod, color) {
  return cod + '::' + (color || '');
}

function loadFavorites_() {
  try {
    var raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    favorites = raw ? JSON.parse(raw) : {};
    if (!favorites || typeof favorites !== 'object') favorites = {};
  } catch (e) { favorites = {}; }
}

function saveFavorites_() {
  try { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites)); }
  catch (e) {}
}

function isFav_(cod, color) {
  return !!favorites[favKey_(cod, color)];
}

function toggleFav_(cod, color) {
  var k = favKey_(cod, color);
  if (favorites[k]) {
    delete favorites[k];
  } else {
    favorites[k] = { codFabrica: cod, color: color };
  }
  saveFavorites_();
  updateFavBadge_();
  // Actualizar todos los botones de esa tarjeta en el DOM sin re-renderizar
  var now = isFav_(cod, color);
  document.querySelectorAll('.btn-card-fav[data-cod="' + cod + '"][data-color="' + color + '"]')
    .forEach(function (btn) {
      btn.innerHTML = now ? SVG_HEART_FULL : SVG_HEART_EMPTY;
      btn.title = now ? 'Quitar de favoritos' : 'Guardar en favoritos';
      btn.classList.toggle('is-fav', now);
    });
  // Si estamos en la vista favoritos, re-renderizar para quitar la card desguardada
  if (currentView === 'favorites') renderFavorites();
}

function clearAllFavs_() {
  if (!confirm('¿Seguro que querés borrar todos los favoritos?')) return;
  favorites = {};
  saveFavorites_();
  updateFavBadge_();
  document.querySelectorAll('.btn-card-fav').forEach(function (btn) {
    btn.innerHTML = SVG_HEART_EMPTY;
    btn.title = 'Guardar en favoritos';
    btn.classList.remove('is-fav');
  });
  renderFavorites();
}

function updateFavBadge_() {
  var n = Object.keys(favorites).length;
  var badge = document.getElementById('fav-chip-count');
  if (badge) badge.textContent = n;
  var chip = document.getElementById('btn-fav');
  if (chip) chip.classList.toggle('has-items', n > 0);
  var bnavBadge = document.getElementById('bnav-fav-badge');
  if (bnavBadge) bnavBadge.textContent = n;
  var bnavBtn = document.getElementById('bnav-fav');
  if (bnavBtn) bnavBtn.classList.toggle('has-badge', n > 0);
}

function getFavoriteProducts_() {
  // Devuelve un array de productos con colorsArr reducido solo a los colores
  // guardados como favoritos. Útil para generatePDF() en vista favoritos.
  var productMap = {};
  products.forEach(function (p) { productMap[p.codFabrica] = p; });
  var result = [];
  var seen = {};
  Object.keys(favorites).forEach(function (k) {
    var f = favorites[k];
    var p = productMap[f.codFabrica];
    if (!p) return;
    if (!seen[f.codFabrica]) {
      seen[f.codFabrica] = true;
      // Clonar con solo los colores favoritos para que generatePDF_ los itere
      var favColors = p.colorsArr.filter(function (c) {
        return !!favorites[favKey_(p.codFabrica, c.color)];
      });
      result.push(Object.assign({}, p, { colorsArr: favColors }));
    }
  });
  return result;
}

function renderFavorites() {
  var container = document.getElementById('favorites-container');
  if (!container) return;

  var productMap = {};
  products.forEach(function (p) { productMap[p.codFabrica] = p; });

  var cards = [];
  Object.keys(favorites).forEach(function (k) {
    var f = favorites[k];
    var p = productMap[f.codFabrica];
    if (!p) return;
    var c = p.colorsArr.find(function (col) { return col.color === f.color; });
    if (c) cards.push({ p: p, c: c });
  });

  var countTxt = document.getElementById('fav-count-txt');
  if (countTxt) countTxt.textContent = cards.length + ' favorito' + (cards.length !== 1 ? 's' : '');

  var clearBtn = document.getElementById('btn-clear-favs');
  if (clearBtn) clearBtn.style.display = cards.length ? 'inline-block' : 'none';

  var emptyEl = document.getElementById('favorites-empty');
  if (!cards.length) {
    container.innerHTML = '';
    container.style.display = 'none';
    if (emptyEl) {
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = '<div class="cart-empty">' +
        '<div class="cart-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>' +
        '<div class="cart-empty-title">No hay favoritos guardados</div>' +
        '<div class="cart-empty-sub">Tocá el corazón en cualquier producto para guardarlo aquí.</div>' +
        '<button class="cart-empty-btn" onclick="switchView(\'gallery\')">Ir a galería</button>' +
        '</div>';
    }
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  container.style.display = '';

  container.innerHTML = cards.map(buildGalleryCardHtml_).join('');

  // Delegación de eventos para las tarjetas de la vista favoritos
  // (reutiliza el mismo patrón que gallery-container)
  container.onclick = function (e) {
    var shareCardBtn = closest(e.target, '.btn-share-card');
    if (shareCardBtn) { e.stopPropagation(); shareProduct_(shareCardBtn.getAttribute('data-cod'), shareCardBtn.getAttribute('data-color'), shareCardBtn); return; }
    var favBtn = closest(e.target, '.btn-card-fav');
    if (favBtn) { e.stopPropagation(); toggleFav_(favBtn.getAttribute('data-cod'), favBtn.getAttribute('data-color')); return; }
    var qaBtn = closest(e.target, '.btn-card-quickadd');
    if (qaBtn) { e.stopPropagation(); openQuickAdd_(qaBtn.getAttribute('data-cod'), qaBtn.getAttribute('data-color')); return; }
    var copyBtn = closest(e.target, '.btn-copy-code');
    if (copyBtn) { e.stopPropagation(); copyCodeToClipboard_(copyBtn); return; }
    var btn = closest(e.target, '.btn-card-detail');
    if (btn) { openModal(btn.getAttribute('data-cod'), btn.getAttribute('data-color')); return; }
    var imgWrap = closest(e.target, '.card-img-wrap');
    if (imgWrap && imgWrap.getAttribute('data-img')) openLightbox(imgWrap);
  };

  // Registrar imágenes con el IntersectionObserver global de lazy load
  observeLazyImages();
}

// =================================================================
// CARRITO — estado + persistencia + render (fase 1)
// =================================================================
function cartKey_(codigo, color, talle) {
  return codigo + '::' + (color || '') + '::' + (talle || '');
}

function loadCart_() {
  try {
    var raw = localStorage.getItem(CART_STORAGE_KEY);
    cart = raw ? JSON.parse(raw) : {};
    if (!cart || typeof cart !== 'object') cart = {};
  } catch (e) { cart = {}; }
}

function saveCart_() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); }
  catch (e) { /* localStorage lleno o disabled — silencio */ }
}

function addCartLine_(codigo, color, talle, cantidad, meta) {
  if (!cantidad || cantidad <= 0) return;
  var k = cartKey_(codigo, color, talle);
  if (cart[k]) {
    cart[k].cantidad += cantidad;
  } else {
    cart[k] = Object.assign(
      { codigo: codigo, color: color, talle: talle, cantidad: cantidad },
      meta || {}
    );
  }
  saveCart_();
  updateCartBadge_();
  if (currentView === 'cart') renderCart_();
}

function updateCartQty_(key, qty) {
  if (!cart[key]) return;
  qty = Number(qty) || 0;
  if (qty <= 0) delete cart[key];
  else          cart[key].cantidad = qty;
  saveCart_();
  updateCartBadge_();
  if (currentView === 'cart') renderCart_();
}

function removeCartLine_(key) {
  delete cart[key];
  saveCart_();
  updateCartBadge_();
  if (currentView === 'cart') renderCart_();
}

function clearCart_() {
  cart = {};
  saveCart_();
  updateCartBadge_();
  if (currentView === 'cart') renderCart_();
}

function getCartTotalUnits_() {
  var n = 0;
  for (var k in cart) n += (cart[k].cantidad || 0);
  return n;
}

function getCartTotalAmount_() {
  var t = 0;
  for (var k in cart) {
    var l = cart[k];
    t += (l.precioUnit || 0) * (l.cantidad || 0);
  }
  return t;
}

function updateCartBadge_() {
  var chip = document.getElementById('btn-cart');
  var countEl = document.getElementById('cart-chip-count');
  if (!chip || !countEl) return;
  var n = getCartTotalUnits_();
  countEl.textContent = n;
  chip.classList.toggle('has-items', n > 0);
  var bnavBadge = document.getElementById('bnav-cart-badge');
  if (bnavBadge) bnavBadge.textContent = n;
  var bnavBtn = document.getElementById('bnav-cart');
  if (bnavBtn) bnavBtn.classList.toggle('has-badge', n > 0);
}

// =================================================================
// QUICK-ADD POPOVER — agregar al carrito desde la card de galería
// =================================================================
var quickAddCtx = null;   // { codigo, color, p, c, price, fotoUrl }

function openQuickAdd_(codigo, color) {
  var p = products.find(function (x) { return x.codFabrica === codigo; });
  if (!p) return;
  var c = p.colorsArr.find(function (x) { return x.color === color; });
  if (!c) c = p.colorsArr[0];

  var info  = getActivePrice(p);
  var price = info.price || 0;
  var fotoUrl = getImgUrl(c.imgId, 400) || '';

  quickAddCtx = {
    codigo: p.codFabrica, color: c.color, p: p, c: c,
    price: price, fotoUrl: fotoUrl
  };

  // Header
  document.getElementById('qa-cod').textContent  = 'Cód: ' + p.codFabrica;
  document.getElementById('qa-name').textContent = p.nmProduto;
  document.getElementById('qa-color').textContent = 'Color: ' + c.color + ' · ' + fmtPrice(price) + '/u';

  var thumb = document.getElementById('qa-thumb');
  var thumbUrl = getImgUrl(c.imgId, 200);
  if (thumbUrl) { thumb.src = thumbUrl; thumb.style.display = ''; }
  else          { thumb.removeAttribute('src'); thumb.style.display = 'none'; }

  renderQuickAddSizes_();

  document.getElementById('quickadd-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderQuickAddSizes_() {
  var ctx = quickAddCtx;
  if (!ctx) return;
  var body = document.getElementById('qa-body');
  var grades = ctx.c.gradesArr || [];

  function qtyControls(key) {
    return '<div class="qa-qty">' +
      '<button class="qa-qty-btn" data-act="dec" data-key="' + escHtml(key) + '" aria-label="Restar">−</button>' +
      '<input class="qa-qty-input" type="number" min="0" step="1" value="0" data-key="' + escHtml(key) + '" inputmode="numeric">' +
      '<button class="qa-qty-btn" data-act="inc" data-key="' + escHtml(key) + '" aria-label="Sumar">+</button>' +
    '</div>';
  }

  if (!grades.length) {
    var totalStock = getColorStock(ctx.c);
    body.innerHTML =
      '<div class="qa-row">' +
        '<div class="qa-row-info">' +
          '<div class="qa-row-talle">Sin talle</div>' +
          '<div class="qa-row-stock">' + (totalStock > 0 ? 'Stock: ' + totalStock : '<span style="color:#dc2626">Sin stock</span>') + '</div>' +
        '</div>' +
        qtyControls('__') +
      '</div>';
  } else {
    body.innerHTML = grades.map(function (g) {
      var stock = getGradeStock(g);
      var k = String(g.grade);
      return '<div class="qa-row">' +
        '<div class="qa-row-info">' +
          '<div class="qa-row-talle">Talle ' + escHtml(k) + '</div>' +
          '<div class="qa-row-stock">' + (stock > 0 ? 'Stock: ' + stock : '<span style="color:#dc2626">Sin stock</span>') + '</div>' +
        '</div>' +
        qtyControls(k) +
      '</div>';
    }).join('');
  }

  // Wire +/− y typing en inputs
  body.querySelectorAll('.qa-qty-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-key');
      var input = body.querySelector('.qa-qty-input[data-key="' + cssEscape_(key) + '"]');
      if (!input) return;
      var v = Number(input.value) || 0;
      v = btn.getAttribute('data-act') === 'inc' ? v + 1 : Math.max(0, v - 1);
      input.value = v;
      updateQuickAddTotal_();
    });
  });
  body.querySelectorAll('.qa-qty-input').forEach(function (input) {
    input.addEventListener('input', updateQuickAddTotal_);
    input.addEventListener('blur', function () {
      var v = Number(input.value) || 0;
      if (v < 0) { input.value = 0; updateQuickAddTotal_(); }
    });
  });

  updateQuickAddTotal_();
}

// CSS.escape no existe en IE/Safari viejos — fallback simple para atributos
function cssEscape_(s) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return String(s).replace(/(["\\])/g, '\\$1');
}

function updateQuickAddTotal_() {
  var ctx = quickAddCtx;
  if (!ctx) return;
  var inputs = document.querySelectorAll('#qa-body .qa-qty-input');
  var total = 0;
  inputs.forEach(function (i) { total += Number(i.value) || 0; });
  document.getElementById('qa-total-units').textContent  = total;
  document.getElementById('qa-total-amount').textContent = fmtPrice(total * ctx.price);
  var btn = document.getElementById('qa-confirm');
  btn.disabled = total === 0;
  btn.style.opacity = total === 0 ? '.5' : '1';
}

function closeQuickAdd_() {
  document.getElementById('quickadd-overlay').classList.remove('open');
  document.body.style.overflow = '';
  quickAddCtx = null;
}

function confirmQuickAdd_() {
  var ctx = quickAddCtx;
  if (!ctx) return;
  var inputs = document.querySelectorAll('#qa-body .qa-qty-input');
  var added = 0;
  inputs.forEach(function (i) {
    var qty = Number(i.value) || 0;
    if (qty <= 0) return;
    var talle = i.getAttribute('data-key');
    if (talle === '__') talle = '';
    addCartLine_(ctx.codigo, ctx.color, talle, qty, {
      marca: ctx.p.marca,
      descripcion: ctx.p.nmProduto,
      precioUnit: ctx.price,
      fotoUrl: ctx.fotoUrl
    });
    added += qty;
  });
  closeQuickAdd_();
  if (added > 0) bounceCartChip_();
}

function bounceCartChip_() {
  var chip = document.getElementById('btn-cart');
  if (!chip) return;
  chip.classList.remove('pop');
  // Forzar reflow para que la animación re-dispare aunque la clase ya estuviera
  void chip.offsetWidth;
  chip.classList.add('pop');
  setTimeout(function () { chip.classList.remove('pop'); }, 450);
}

// Cerrar quick-add con Escape o click en backdrop
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && document.getElementById('quickadd-overlay').classList.contains('open')) {
    closeQuickAdd_();
  }
});
document.addEventListener('click', function (e) {
  var overlay = document.getElementById('quickadd-overlay');
  if (overlay && e.target === overlay) closeQuickAdd_();
});

// =================================================================
// VISTA CARRITO — lista editable + totales (fase 3)
// =================================================================
function renderCart_() {
  var el = document.getElementById('cart-view');
  if (!el) return;
  var keys = Object.keys(cart);

  if (!keys.length) {
    el.innerHTML =
      '<div class="cart-empty">' +
        '<div class="cart-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>' +
        '<div class="cart-empty-title">El carrito está vacío</div>' +
        '<div class="cart-empty-sub">Agregá productos desde la galería para verlos acá.</div>' +
        '<button class="cart-empty-btn" onclick="switchView(\'gallery\')">Ir a galería</button>' +
      '</div>';
    return;
  }

  var totalUnits  = getCartTotalUnits_();
  var totalAmount = getCartTotalAmount_();

  el.innerHTML =
    '<div class="cart-header">' +
      '<div class="cart-header-title">' +
        '<h2>Mi pedido</h2>' +
        '<div class="cart-header-sub">' +
          keys.length + ' línea' + (keys.length !== 1 ? 's' : '') + ' · ' +
          '<span id="cart-total-units">' + totalUnits + '</span> uds' +
        '</div>' +
      '</div>' +
      '<button class="cart-clear-btn" onclick="confirmClearCart_()">🗑 Vaciar</button>' +
    '</div>' +
    '<div class="cart-list">' +
      keys.map(buildCartLineHtml_).join('') +
    '</div>' +
    '<div class="cart-summary">' +
      '<div class="cart-summary-row">' +
        '<span>Total productos</span>' +
        '<b id="cart-summary-units">' + totalUnits + ' uds</b>' +
      '</div>' +
      '<div class="cart-summary-row cart-summary-total">' +
        '<span>Total</span>' +
        '<b id="cart-summary-amount">' + fmtPrice(totalAmount) + '</b>' +
      '</div>' +
      '<button class="cart-export-pdf" onclick="exportCartPdf_()" title="Generar PDF nota de pedido">📄 Exportar nota de pedido (PDF)</button>' +
    '</div>';

  wireCartListEvents_();
}

function buildCartLineHtml_(key) {
  var line = cart[key];
  var subtotal = (line.precioUnit || 0) * (line.cantidad || 0);
  var safeKey  = escHtml(key);
  var thumb = line.fotoUrl
    ? '<img src="' + escHtml(line.fotoUrl) + '" alt="" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">' +
      '<div class="cart-line-thumb-ph" style="display:none">' + SVG_IMG_OFF + '</div>'
    : '<div class="cart-line-thumb-ph">' + SVG_IMG_OFF + '</div>';

  return '<div class="cart-line" data-key="' + safeKey + '">' +
    '<div class="cart-line-thumb">' + thumb + '</div>' +
    '<div class="cart-line-info">' +
      '<div class="cart-line-cod">Cód: ' + escHtml(line.codigo) + '</div>' +
      '<div class="cart-line-name">' + escHtml(line.descripcion || '') + '</div>' +
      '<div class="cart-line-meta">' +
        (line.marca ? '<span>' + escHtml(line.marca) + '</span>' : '') +
        '<span>Color: ' + escHtml(line.color || '—') + '</span>' +
        '<span>Talle: ' + escHtml(line.talle || '—') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="cart-line-actions">' +
      '<div class="cart-line-price">' + fmtPrice(line.precioUnit || 0) + ' /u</div>' +
      '<div class="cart-line-qty">' +
        '<button class="cart-qty-btn" data-act="dec" data-key="' + safeKey + '" aria-label="Restar">−</button>' +
        '<input class="cart-qty-input" type="number" min="0" step="1" value="' + (line.cantidad || 0) + '" data-key="' + safeKey + '" inputmode="numeric">' +
        '<button class="cart-qty-btn" data-act="inc" data-key="' + safeKey + '" aria-label="Sumar">+</button>' +
      '</div>' +
      '<div class="cart-line-subtotal">' + fmtPrice(subtotal) + '</div>' +
      '<button class="cart-line-barcode" data-cod="' + escHtml(line.codigo) + '" data-color="' + escHtml(line.color || '') + '" data-talle="' + escHtml(line.talle || '') + '" title="Ver código de barra" aria-label="Código de barra">▌▌▌</button>' +
      '<button class="cart-line-remove" data-key="' + safeKey + '" title="Eliminar" aria-label="Eliminar">×</button>' +
    '</div>' +
  '</div>';
}

function wireCartListEvents_() {
  var view = document.getElementById('cart-view');
  if (!view) return;

  view.querySelectorAll('.cart-qty-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var k = btn.getAttribute('data-key');
      if (!cart[k]) return;
      var v = (cart[k].cantidad || 0);
      v = btn.getAttribute('data-act') === 'inc' ? v + 1 : Math.max(0, v - 1);
      if (v === 0) { removeCartLine_(k); return; }
      cart[k].cantidad = v;
      saveCart_();
      updateCartBadge_();
      var inp = view.querySelector('.cart-qty-input[data-key="' + cssEscape_(k) + '"]');
      if (inp) inp.value = v;
      refreshCartLineSubtotal_(k);
      refreshCartTotals_();
    });
  });

  // Input: update sin re-render para preservar foco. La línea se borra recién
  // en blur si quedó en 0 (no mientras tipea).
  view.querySelectorAll('.cart-qty-input').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var k = inp.getAttribute('data-key');
      if (!cart[k]) return;
      var v = Math.max(0, Number(inp.value) || 0);
      cart[k].cantidad = v;
      saveCart_();
      updateCartBadge_();
      refreshCartLineSubtotal_(k);
      refreshCartTotals_();
    });
    inp.addEventListener('blur', function () {
      var k = inp.getAttribute('data-key');
      if (!cart[k]) return;
      if (cart[k].cantidad === 0) removeCartLine_(k);
    });
  });

  view.querySelectorAll('.cart-line-remove').forEach(function (btn) {
    btn.addEventListener('click', function () {
      removeCartLine_(btn.getAttribute('data-key'));
    });
  });

  view.querySelectorAll('.cart-line-barcode').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cod   = btn.getAttribute('data-cod');
      var color = btn.getAttribute('data-color');
      var talle = btn.getAttribute('data-talle');
      var p = products.find(function (x) { return x.codFabrica === cod; });
      if (!p) return;
      var c = p.colorsArr.find(function (x) { return x.color === color; });
      if (!c) return;
      var g = (c.gradesArr || []).find(function (x) { return x.talle === talle; });
      var ean = g ? g.ean : (c.gradesArr && c.gradesArr[0] ? c.gradesArr[0].ean : null);
      if (ean) openBarcodeModal_(ean);
    });
  });
}

function refreshCartLineSubtotal_(key) {
  var row = document.querySelector('.cart-line[data-key="' + cssEscape_(key) + '"]');
  if (!row || !cart[key]) return;
  var sub = row.querySelector('.cart-line-subtotal');
  if (sub) sub.textContent = fmtPrice((cart[key].precioUnit || 0) * (cart[key].cantidad || 0));
}

function refreshCartTotals_() {
  var u = getCartTotalUnits_();
  var a = getCartTotalAmount_();
  var elU  = document.getElementById('cart-total-units');
  var elU2 = document.getElementById('cart-summary-units');
  var elA  = document.getElementById('cart-summary-amount');
  if (elU)  elU.textContent  = u;
  if (elU2) elU2.textContent = u + ' uds';
  if (elA)  elA.textContent  = fmtPrice(a);
}

function confirmClearCart_() {
  var n = Object.keys(cart).length;
  if (!n) return;
  if (confirm('¿Vaciar todo el carrito? Esto borra ' + n + ' línea' + (n !== 1 ? 's' : '') + '.')) {
    clearCart_();
  }
}

// =================================================================
// PDF NOTA DE PEDIDO — overlay paralelo al PDF de catálogo (pmo_*)
// Flujo: tap "Exportar" -> mini-form (cliente / vendedor / descuento %)
// -> renderCartPdf_() arma el overlay -> window.print().
// =================================================================
function exportCartPdf_() {
  var keys = Object.keys(cart);
  if (!keys.length) {
    alert('El carrito está vacío. Agregá productos antes de exportar.');
    return;
  }
  openCartPdfForm_();
}

function openCartPdfForm_() {
  var totalAmount = getCartTotalAmount_();
  var overlay = document.getElementById('cart-pdf-form-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cart-pdf-form-overlay';
    overlay.className = 'cpf-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCartPdfForm_();
    });
  }
  overlay.innerHTML =
    '<div class="cpf-sheet" role="dialog" aria-label="Datos de la nota de pedido">' +
      '<div class="cpf-head">' +
        '<h3>Datos de la nota de pedido</h3>' +
        '<button class="cpf-close" onclick="closeCartPdfForm_()" aria-label="Cerrar">' + SVG_X + '</button>' +
      '</div>' +
      '<div class="cpf-body">' +
        '<div class="cpf-field">' +
          '<label for="cpf-cliente">Cliente</label>' +
          '<input id="cpf-cliente" type="text" placeholder="Nombre del cliente (opcional)" maxlength="120" autocomplete="off">' +
        '</div>' +
        '<div class="cpf-field">' +
          '<label for="cpf-vendedor">Vendedor</label>' +
          '<input id="cpf-vendedor" type="text" placeholder="Nombre del vendedor (opcional)" maxlength="80" autocomplete="off">' +
        '</div>' +
        '<div class="cpf-field">' +
          '<label for="cpf-descuento">Descuento</label>' +
          '<div class="cpf-desc-row">' +
            '<input id="cpf-descuento" type="number" min="0" max="100" step="0.01" placeholder="0" inputmode="decimal">' +
            '<div class="cpf-desc-suffix">%</div>' +
          '</div>' +
          '<div class="cpf-field-hint">Se aplica sobre el total. Dejá en 0 si no hay descuento.</div>' +
        '</div>' +
        '<div class="cpf-preview" id="cpf-preview">' +
          '<div class="cpf-prev-row"><span>Subtotal</span><b id="cpf-prev-sub">' + fmtPrice(totalAmount) + '</b></div>' +
          '<div class="cpf-prev-row" id="cpf-prev-desc-row" style="display:none"><span id="cpf-prev-desc-lbl">Descuento</span><b id="cpf-prev-desc">−' + fmtPrice(0) + '</b></div>' +
          '<div class="cpf-prev-row cpf-prev-total"><span>Total</span><b id="cpf-prev-total">' + fmtPrice(totalAmount) + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="cpf-foot">' +
        '<button class="cpf-btn-cancel" onclick="closeCartPdfForm_()">Cancelar</button>' +
        '<button class="cpf-btn-go" onclick="submitCartPdfForm_()">Generar PDF</button>' +
      '</div>' +
    '</div>';

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  var descInp = document.getElementById('cpf-descuento');
  if (descInp) descInp.addEventListener('input', updateCartPdfFormPreview_);
  var cli = document.getElementById('cpf-cliente');
  if (cli) setTimeout(function () { cli.focus(); }, 50);
}

function updateCartPdfFormPreview_() {
  var sub = getCartTotalAmount_();
  var pct = parseCartPdfDescPct_();
  var desc = sub * (pct / 100);
  var total = sub - desc;
  var row = document.getElementById('cpf-prev-desc-row');
  var lbl = document.getElementById('cpf-prev-desc-lbl');
  var d   = document.getElementById('cpf-prev-desc');
  var t   = document.getElementById('cpf-prev-total');
  if (pct > 0) {
    if (row) row.style.display = 'flex';
    if (lbl) lbl.textContent = 'Descuento (' + fmtPct_(pct) + '%)';
    if (d)   d.textContent   = '−' + fmtPrice(desc);
  } else {
    if (row) row.style.display = 'none';
  }
  if (t) t.textContent = fmtPrice(total);
}

function parseCartPdfDescPct_() {
  var inp = document.getElementById('cpf-descuento');
  if (!inp) return 0;
  var v = parseFloat((inp.value || '').replace(',', '.'));
  if (!isFinite(v) || v < 0) return 0;
  if (v > 100) v = 100;
  return v;
}

function fmtPct_(n) {
  // 10 -> "10", 12.5 -> "12,5", 12.50 -> "12,5"
  var s = (Math.round(n * 100) / 100).toString();
  return s.replace('.', ',');
}

function closeCartPdfForm_() {
  var overlay = document.getElementById('cart-pdf-form-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.innerHTML = '';
  }
  // Solo liberar overflow si el PDF tampoco está abierto
  if (!document.body.classList.contains('cart-pdf-active')) {
    document.body.style.overflow = '';
  }
}

function submitCartPdfForm_() {
  var cliente   = (document.getElementById('cpf-cliente')   || {}).value || '';
  var vendedor  = (document.getElementById('cpf-vendedor')  || {}).value || '';
  var descPct   = parseCartPdfDescPct_();
  closeCartPdfForm_();
  renderCartPdf_({
    cliente:    cliente.trim(),
    vendedor:   vendedor.trim(),
    descuentoPct: descPct
  });
}

function renderCartPdf_(opts) {
  opts = opts || {};
  var keys = Object.keys(cart);
  if (!keys.length) return;

  var fecha = new Date().toLocaleDateString('es-PY',
    { day: '2-digit', month: '2-digit', year: 'numeric' });
  var hora  = new Date().toLocaleTimeString('es-PY',
    { hour: '2-digit', minute: '2-digit' });
  var modoLabel = (window.PAGE_CONFIG && window.PAGE_CONFIG.title)
    ? window.PAGE_CONFIG.title
    : (priceMode === 'mayorista' ? 'Mayorista' : 'Minorista');

  var totalUnits   = getCartTotalUnits_();
  var subtotalAmt  = getCartTotalAmount_();
  var descPct      = Math.max(0, Math.min(100, Number(opts.descuentoPct) || 0));
  var descAmt      = subtotalAmt * (descPct / 100);
  var totalAmount  = subtotalAmt - descAmt;

  // Filas de la tabla
  var rowsHtml = keys.map(function (k, i) {
    var l = cart[k];
    var subtotal = (l.precioUnit || 0) * (l.cantidad || 0);
    var fotoCell = l.fotoUrl
      ? '<img src="' + escHtml(l.fotoUrl) + '" alt="">'
      : '<span class="cpo-col-foto-ph">' + SVG_IMG_OFF + '</span>';
    return '<tr>' +
      '<td class="cpo-col-num">' + (i + 1) + '</td>' +
      '<td class="cpo-col-foto">' + fotoCell + '</td>' +
      '<td class="cpo-col-cod">' + escHtml(l.codigo) + '</td>' +
      '<td>' +
        '<div><b>' + escHtml(l.descripcion || '') + '</b></div>' +
        (l.marca ? '<div style="font-size:8.5pt;color:#666">' + escHtml(l.marca) + '</div>' : '') +
      '</td>' +
      '<td class="cpo-col-color">' + escHtml(l.color || '—') + '</td>' +
      '<td class="cpo-col-talle">' + escHtml(l.talle || '—') + '</td>' +
      '<td class="cpo-col-cant">' + (l.cantidad || 0) + '</td>' +
      '<td class="cpo-col-precio">' + fmtPrice(l.precioUnit || 0) + '</td>' +
      '<td class="cpo-col-subtotal">' + fmtPrice(subtotal) + '</td>' +
    '</tr>';
  }).join('');

  var pageHtml =
    '<div class="cpo-page">' +
      '<div class="cpo-head">' +
        '<div>' +
          '<div class="cpo-head-title">Nota de Pedido</div>' +
          '<div class="cpo-head-sub">Catálogo de Productos · ' + escHtml(modoLabel) + '</div>' +
        '</div>' +
        '<div class="cpo-head-meta">' +
          '<div class="cpo-head-meta-row"><b>Fecha:</b> ' + fecha + '</div>' +
          '<div class="cpo-head-meta-row"><b>Hora:</b> ' + hora + '</div>' +
          '<div class="cpo-head-meta-row"><b>N° Pedido:</b> ____________</div>' +
        '</div>' +
      '</div>' +

      '<div class="cpo-cliente">' +
        '<div class="cpo-cliente-field">' +
          '<div class="cpo-cliente-label">Cliente</div>' +
          (opts.cliente ? escHtml(opts.cliente) : '&nbsp;') +
        '</div>' +
        '<div class="cpo-cliente-field" style="flex:0 0 35%">' +
          '<div class="cpo-cliente-label">Vendedor</div>' +
          (opts.vendedor ? escHtml(opts.vendedor) : '&nbsp;') +
        '</div>' +
      '</div>' +

      '<table class="cpo-table">' +
        '<thead><tr>' +
          '<th class="cpo-col-num">#</th>' +
          '<th class="cpo-col-foto">Foto</th>' +
          '<th class="cpo-col-cod">Cód</th>' +
          '<th>Producto</th>' +
          '<th class="cpo-col-color">Color</th>' +
          '<th class="cpo-col-talle">Talle</th>' +
          '<th class="cpo-col-cant">Cant</th>' +
          '<th class="cpo-col-precio">P. Unit.</th>' +
          '<th class="cpo-col-subtotal">Subtotal</th>' +
        '</tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +

      '<div class="cpo-totals">' +
        '<div class="cpo-totals-box">' +
          '<div class="cpo-totals-row">' +
            '<span>Líneas</span><b>' + keys.length + '</b>' +
          '</div>' +
          '<div class="cpo-totals-row">' +
            '<span>Total unidades</span><b>' + totalUnits + '</b>' +
          '</div>' +
          (descPct > 0
            ? '<div class="cpo-totals-row">' +
                '<span>Subtotal</span><b>' + fmtPrice(subtotalAmt) + '</b>' +
              '</div>' +
              '<div class="cpo-totals-row">' +
                '<span>Descuento (' + fmtPct_(descPct) + '%)</span><b>−' + fmtPrice(descAmt) + '</b>' +
              '</div>'
            : '') +
          '<div class="cpo-totals-row cpo-totals-grand">' +
            '<span>TOTAL</span><b>' + fmtPrice(totalAmount) + '</b>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="cpo-foot">' +
        '<div class="cpo-firma">Firma cliente</div>' +
        '<div class="cpo-firma">Firma vendedor</div>' +
      '</div>' +
    '</div>';

  var overlay = document.getElementById('cart-pdf-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cart-pdf-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML =
    '<div class="cpo-toolbar">' +
      '<button class="cpo-close" onclick="closeCartPdf_()">' + SVG_X + ' Cerrar</button>' +
      '<div class="cpo-hint">Tocá Imprimir y elegí "Guardar como PDF" en el diálogo del navegador.</div>' +
      '<button class="cpo-print" onclick="window.print()">🖨️ Imprimir</button>' +
    '</div>' +
    pageHtml;

  overlay.classList.add('open');
  document.body.classList.add('cart-pdf-active');
  document.body.style.overflow = 'hidden';
}

function closeCartPdf_() {
  var overlay = document.getElementById('cart-pdf-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.innerHTML = '';
  }
  document.body.classList.remove('cart-pdf-active');
  document.body.style.overflow = '';
}

// Cerrar el PDF (o su mini-form previo) con Escape
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  var pdf  = document.getElementById('cart-pdf-overlay');
  if (pdf && pdf.classList.contains('open'))  { closeCartPdf_(); return; }
  var form = document.getElementById('cart-pdf-form-overlay');
  if (form && form.classList.contains('open')) { closeCartPdfForm_(); return; }
});

function updateStats() {
  var el = document.getElementById('stats-count');
  if (!el || !productsLoaded) return;
  var t = products.length, f = filteredProducts.length;
  el.textContent = f === t
    ? t + ' productos'
    : f + ' de ' + t + ' productos';
}

// =================================================================
// UTILIDADES
// =================================================================
// fileId: el ID de Drive ya resuelto server-side (viene como c.imgId en cada color).
// size:   ancho deseado en px. Drive sirve un thumbnail pre-cacheado → 10–50x más rápido.
function getImgUrl(fileId, size) {
  if (!fileId) return null;
  var url = 'https://lh3.googleusercontent.com/d/' + fileId;
  return size ? url + '=w' + size : url;
}

function fmtPrice(v) {
  if (v == null || v === '') return '—';
  return '₲ ' + Number(v).toLocaleString('es-PY');
}

// =================================================================
// COMPARTIR POR WHATSAPP (mensaje o estado)
// =================================================================
// Arma el texto y la foto del producto/color y delega a shareViaWhatsapp_.
function shareProduct_(cod, colorName, btn) {
  var product = null;
  for (var i = 0; i < products.length; i++) {
    if (String(products[i].codFabrica) === String(cod)) { product = products[i]; break; }
  }
  if (!product) return;

  var color = null;
  for (var j = 0; j < product.colorsArr.length; j++) {
    if (product.colorsArr[j].color === colorName) { color = product.colorsArr[j]; break; }
  }
  if (!color) color = product.colorsArr[0];

  var price = getActivePrice(product).price;
  var lines = ['Código: ' + product.codFabrica];
  if (color && color.color) lines.push('Color: ' + color.color);
  lines.push('Precio: ' + fmtPrice(price));
  var text = lines.join('\n');
  var imgUrl = (color && color.imgId) ? getImgUrl(color.imgId, 1200) : null;

  shareViaWhatsapp_(text, imgUrl, btn);
}

// Comparte por WhatsApp (mensaje o estado, según elija el usuario en el
// selector nativo). Con foto cuando el navegador soporta adjuntar archivos
// (navigator.canShare + files) — solo celulares. Si no hay soporte, cae a un
// link wa.me con el texto (sin foto).
//
// IMPORTANTE: navigator.share() (y window.open) sólo funcionan mientras el
// navegador todavía considera que estás "cerca" del click del usuario (user
// activation). El fetch() de la imagen puede tardar (wifi de tienda, cache
// frío) y para cuando termina esa ventana ya se cerró — ahí navigator.share
// rechaza con NotAllowedError y el fallback a window.open también queda
// bloqueado (el aviso de "popup bloqueado"). Por eso: si la foto tarda más
// de IMG_FETCH_TIMEOUT_MS, se abandona y se comparte solo texto de inmediato.
//
// Además, algunos WebView de Android pueden dejar la hoja nativa de
// "Compartir" colgada (el Promise de navigator.share nunca resuelve ni
// rechaza), dejando la app inutilizable hasta cerrarla y volver a abrirla.
// Contra eso: SHARE_TIMEOUT_MS fuerza la recuperación de la UI aunque el
// navegador nunca responda, y shareLock_ evita que un segundo click dispare
// otro share() mientras el anterior sigue "colgado" (lo que empeora el bug
// en algunos dispositivos).
var IMG_FETCH_TIMEOUT_MS = 1200;
var SHARE_TIMEOUT_MS     = 8000;
var shareLock_ = false;

function shareViaWhatsapp_(text, imgUrl, btn) {
  if (shareLock_) return;   // ya hay un share en curso (posiblemente colgado) — ignorar
  shareLock_ = true;

  var recovered = false;
  var hardTimer = setTimeout(function () {
    recovered = true;
    shareLock_ = false;
    if (btn) btn.disabled = false;
  }, SHARE_TIMEOUT_MS);

  function fallbackToLink_() {
    if (recovered) return;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }
  function done_() {
    if (recovered) return;   // ya se recuperó por el timeout — no pisar ese estado
    clearTimeout(hardTimer);
    shareLock_ = false;
    if (btn) btn.disabled = false;
  }
  function shareTextOnly_() {
    navigator.share({ text: text })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;   // el usuario canceló el selector
        fallbackToLink_();
      })
      .then(done_);
  }

  if (!navigator.share) { fallbackToLink_(); done_(); return; }

  if (!imgUrl || !navigator.canShare) {
    shareTextOnly_();
    return;
  }

  if (btn) btn.disabled = true;

  var imgSettled = false;   // ya se compartió (por timeout de imagen o por la foto) — evita duplicar
  var imgTimer = setTimeout(function () {
    if (imgSettled) return;
    imgSettled = true;
    shareTextOnly_();
  }, IMG_FETCH_TIMEOUT_MS);

  fetch(imgUrl)
    .then(function (res) { return res.blob(); })
    .then(function (blob) {
      if (imgSettled) return;   // ya se compartió solo texto por timeout, no duplicar
      clearTimeout(imgTimer);
      imgSettled = true;
      var file = new File([blob], 'producto.jpg', { type: blob.type || 'image/jpeg' });
      var sharePromise = navigator.canShare({ files: [file] })
        ? navigator.share({ files: [file], text: text })
        : navigator.share({ text: text });
      return sharePromise
        .catch(function (err) {
          if (err && err.name === 'AbortError') return;
          fallbackToLink_();
        })
        .then(done_);
    })
    .catch(function () {
      if (imgSettled) return;   // ya se compartió solo texto por timeout
      clearTimeout(imgTimer);
      imgSettled = true;
      shareTextOnly_();
    });
}

// =================================================================
// PRECIOS — Minorista / Mayorista + Promo activa
// =================================================================
function getActivePrice(p) {
  if (priceMode === 'mayorista') {
    if (isPromoActive_(p.precioMayoristaPromo, p.precioMayoristaPromoInicio, p.precioMayoristaPromoValidade)) {
      return { price: p.precioMayoristaPromo, regularPrice: p.precioMayorista, isPromo: true };
    }
    return { price: p.precioMayorista || 0, regularPrice: null, isPromo: false };
  }
  if (isPromoActive_(p.precioMinoristaPromo, p.precioMinoristaPromoInicio, p.precioMinoristaPromoValidade)) {
    return { price: p.precioMinoristaPromo, regularPrice: p.precioMinorista, isPromo: true };
  }
  return { price: p.precioMinorista || 0, regularPrice: null, isPromo: false };
}

function isPromoActive_(promo, inicio, validade) {
  if (!promo || promo <= 0) return false;
  if (!inicio || !validade) return false;
  var today  = new Date();
  var dStart = new Date(inicio);
  var dEnd   = new Date(validade);
  if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return false;
  return dStart <= today && today <= dEnd;
}

function renderPriceHtml(p) {
  var info = getActivePrice(p);
  if (info.isPromo) {
    return '<span class="price-old">' + fmtPrice(info.regularPrice) + '</span> ' +
           '<span class="price-promo">' + fmtPrice(info.price) + '</span>';
  }
  return fmtPrice(info.price);
}

// ¿El producto tiene promo activa SEGÚN el priceMode actual?
// Si priceMode = minorista, mira el promo minorista. Si mayorista, el mayorista.
function productHasActivePromo_(p) {
  if (priceMode === 'mayorista') {
    return isPromoActive_(p.precioMayoristaPromo, p.precioMayoristaPromoInicio, p.precioMayoristaPromoValidade);
  }
  return isPromoActive_(p.precioMinoristaPromo, p.precioMinoristaPromoInicio, p.precioMinoristaPromoValidade);
}

// Bloque HTML para el modal de detalle: minorista + mayorista (ambos) + top venta
function buildModalPriceBlock_(p) {
  var cfg = window.PAGE_CONFIG || {};

  // ¿Qué precios mostrar?
  // - Si el modo tiene priceMode = 'minorista' → solo minorista
  // - Si tiene priceMode = 'mayorista' → solo mayorista
  // - Si no tiene priceMode (general) → ambos
  var showMinorista = !cfg.priceMode || cfg.priceMode === 'minorista';
  var showMayorista = !cfg.priceMode || cfg.priceMode === 'mayorista';

  var minPromoActive = isPromoActive_(p.precioMinoristaPromo, p.precioMinoristaPromoInicio, p.precioMinoristaPromoValidade);
  var mayPromoActive = isPromoActive_(p.precioMayoristaPromo, p.precioMayoristaPromoInicio, p.precioMayoristaPromoValidade);

  var html = '<div class="modal-price-block">';

  // Línea minorista (solo si el modo lo permite)
  if (showMinorista) {
    html += '<div><strong>Minorista:</strong> ' + fmtPrice(p.precioMinorista || 0);
    if (p.precioMinoristaPromo > 0) {
      html += ' · <span class="' + (minPromoActive ? 'price-promo' : 'price-promo-inactive') + '">' +
              'Promo: ' + fmtPrice(p.precioMinoristaPromo);
      if (p.precioMinoristaPromoInicio || p.precioMinoristaPromoValidade) {
        html += ' (' + fmtDate(p.precioMinoristaPromoInicio) +
                ' a ' + fmtDate(p.precioMinoristaPromoValidade) + ')';
      }
      if (!minPromoActive) html += ' [vencida]';
      html += '</span>';
    }
    html += '</div>';
  }

  // Línea mayorista (solo si el modo lo permite Y el producto tiene precio mayorista)
  if (showMayorista && ((p.precioMayorista || 0) > 0 || (p.precioMayoristaPromo || 0) > 0)) {
    html += '<div><strong>Mayorista:</strong> ' +
            ((p.precioMayorista || 0) > 0 ? fmtPrice(p.precioMayorista) : '—');
    if (p.precioMayoristaPromo > 0) {
      html += ' · <span class="' + (mayPromoActive ? 'price-promo' : 'price-promo-inactive') + '">' +
              'Promo: ' + fmtPrice(p.precioMayoristaPromo);
      if (p.precioMayoristaPromoInicio || p.precioMayoristaPromoValidade) {
        html += ' (' + fmtDate(p.precioMayoristaPromoInicio) +
                ' a ' + fmtDate(p.precioMayoristaPromoValidade) + ')';
      }
      if (!mayPromoActive) html += ' [vencida]';
      html += '</span>';
    }
    html += '</div>';
  }

  // Top venta (qMasVendio): solo se muestra en el modo general.
  // En mayorista/minorista no aplica porque la sucursal top podría no estar
  // dentro del config y confundir al vendedor.
  if (window.PAGE_MODE === 'general' && p.qMasVendio > 0) {
    var storeName = STORE_NAMES[p.qMasVendio] || ('Tienda ' + p.qMasVendio);
    html += '<div class="modal-top-store">🏆 Top venta: <strong>' + escHtml(storeName) + '</strong></div>';
  }

  // Última compra (fecha más reciente entre todas las sucursales del producto)
  if (p._ultCompraMaxLabel) {
    html += '<div class="modal-top-store">📅 Última compra: <strong>' + escHtml(p._ultCompraMaxLabel) + '</strong></div>';
  }

  html += '</div>';
  return html;
}

function fmtDate(d) {
  if (!d) return '—';
  var p = String(d).split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d;
}

/* Normaliza texto para búsquedas: minúsculas + sin acentos/diacríticos.
   "Café" → "cafe", "PIÑON" → "pinon", "Açaí" → "acai". */
function normTxt_(s) {
  if (s == null) return '';
  // NFKD (no NFD): además de separar acentos, también pliega variantes de
  // compatibilidad Unicode — ej. dígitos "ancho completo" (０-９) que insertan
  // algunos teclados Android — a su forma ASCII normal. Sin esto, un EAN
  // tipeado con esos dígitos no matchea contra el mismo código en ASCII plano.
  // ̀-ͯ = bloque "Combining Diacritical Marks" (acentos, tildes, etc.)
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function show(id) { document.getElementById(id).style.display = 'block'; }
function hide(id) { document.getElementById(id).style.display = 'none';  }

// =================================================================
// CONFIRM DIALOG (reemplazo de confirm() nativo)
// =================================================================
// Devuelve una Promise<boolean>. Uso:
//   confirmDialog({ title, body, okText, cancelText, icon }).then(ok => { ... })
function confirmDialog(opts) {
  opts = opts || {};
  var overlay  = document.getElementById('confirm-overlay');
  var elTitle  = document.getElementById('confirm-title');
  var elBody   = document.getElementById('confirm-body');
  var elIcon   = document.getElementById('confirm-icon');
  var btnOk    = document.getElementById('confirm-btn-ok');
  var btnCanc  = document.getElementById('confirm-btn-cancel');

  elTitle.textContent = opts.title || 'Confirmar';
  elIcon.innerHTML    = opts.icon  || SVG_WARNING;
  // body acepta HTML para que se pueda resaltar con <strong>
  elBody.innerHTML    = opts.body || '';
  btnOk.textContent   = opts.okText     || 'Continuar';
  btnCanc.textContent = opts.cancelText || 'Cancelar';

  return new Promise(function (resolve) {
    function cleanup() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      btnOk.removeEventListener('click',  onOk);
      btnCanc.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
    }
    function onOk()       { cleanup(); resolve(true);  }
    function onCancel()   { cleanup(); resolve(false); }
    function onBackdrop(e){ if (e.target === overlay) onCancel(); }
    function onKey(e) {
      if (e.key === 'Escape') onCancel();
      else if (e.key === 'Enter') onOk();
    }

    btnOk.addEventListener('click',   onOk);
    btnCanc.addEventListener('click', onCancel);
    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { btnOk.focus(); }, 50);
  });
}

// =================================================================
// EXPORTACIÓN A EXCEL (CSV con BOM UTF-8)
// =================================================================
// Descarga un CSV con una fila por (producto × color) y una columna por
// sucursal con el stock total de ese color en esa sucursal. Respeta los
// mismos filtros que la galería y el PDF.
//
// Estructura del CSV:
//   codFabrica ; nmProduto ; marca ; color ; imagen ; <suc1> ; <suc2> ; …
//
// Sucursales que aparecen:
//   - Si filterSucursal está activo: solo esas (en orden alfabético).
//   - Si no: todas las que aparezcan con stock > 0 en los productos filtrados.
//
// Celdas sin stock → vacías. Separador ';' (más compatible con Excel es-PY).

/**
 * Wrapper llamado por el botón "Exportar Excel" del sidebar.
 * Lee el estado de los switches y delega a exportToExcel.
 */
function exportExcelFromSwitch_() {
  var swGrade  = document.getElementById('excel-with-grade');
  var swMarca  = document.getElementById('excel-totals-marca');
  if (swMarca && swMarca.checked) {
    exportToExcelTotalsByMarca_();
    return;
  }
  exportToExcel({ withGrade: swGrade ? swGrade.checked : false });
}

/**
 * Los dos switches son mutuamente excluyentes (uno cambia la granularidad
 * a "más detalle", el otro a "menos detalle"). Activar uno desactiva el otro.
 */
function onExcelSwitchChange_(which) {
  var swGrade = document.getElementById('excel-with-grade');
  var swMarca = document.getElementById('excel-totals-marca');
  if (which === 'grade' && swGrade && swGrade.checked && swMarca) swMarca.checked = false;
  if (which === 'marca' && swMarca && swMarca.checked && swGrade) swGrade.checked = false;
}

/**
 * Export agregado: 1 fila por marca, con totales de unidades por sucursal.
 * Mismo formato general (separador ;, BOM UTF-8). Respeta los filtros
 * activos (sucursal, stock, foto) igual que el export normal.
 */
function exportToExcelTotalsByMarca_() {
  var isFavView   = currentView === 'favorites';
  var sourceProds = isFavView ? getFavoriteProducts_() : filteredProducts;

  if (!sourceProds || !sourceProds.length) {
    alert(isFavView
      ? 'No hay favoritos guardados para exportar.'
      : 'No hay productos para exportar. Ajustá los filtros.');
    return;
  }

  var sucursalActive = !isFavView && effectiveSucursalFilter_().length > 0;
  var stockActive    = !isFavView && (filterStockMin !== null || filterStockMax !== null);
  var fotoActive     = !isFavView && (filterFoto !== 'all');

  // 1) Lista de sucursales (columnas)
  var sucursales;
  if (sucursalActive) {
    sucursales = effectiveSucursalFilter_().slice().sort();
  } else {
    var sucSet = {};
    sourceProds.forEach(function (p) {
      p.colorsArr.forEach(function (c) {
        c.gradesArr.forEach(function (g) {
          g.stock.forEach(function (s) {
            if ((s.cantidad || 0) > 0) sucSet[s.sucursal] = 1;
          });
        });
      });
    });
    sucursales = Object.keys(sucSet).sort();
  }
  if (!sucursales.length) {
    alert('No hay sucursales con stock para exportar.');
    return;
  }

  // 2) Agregar: marca → { sucursal → totalUds }
  var byMarca = {};   // { marca: { sucursal: cantidad } }
  sourceProds.forEach(function (p) {
    var marca = p.marca || '(sin marca)';
    p.colorsArr.forEach(function (c) {
      if (sucursalActive && getColorStock(c) <= 0) return;
      if (stockActive    && !colorPassesStock_(c)) return;
      if (fotoActive     && !colorPassesFoto_(c)) return;

      c.gradesArr.forEach(function (g) {
        g.stock.forEach(function (s) {
          if (sucursales.indexOf(s.sucursal) < 0) return;
          if (!byMarca[marca]) byMarca[marca] = {};
          byMarca[marca][s.sucursal] =
            (byMarca[marca][s.sucursal] || 0) + (s.cantidad || 0);
        });
      });
    });
  });

  // 3) Filas: marca + 1 columna por sucursal + total
  var headers = ['marca'].concat(sucursales).concat(['total']);
  var rows = [headers];

  var sucTotals = {};
  sucursales.forEach(function (suc) { sucTotals[suc] = 0; });
  var grandTotal = 0;

  Object.keys(byMarca).sort().forEach(function (marca) {
    var perSuc = byMarca[marca];
    var total = 0;
    var row = [marca];
    sucursales.forEach(function (suc) {
      var q = perSuc[suc] || 0;
      total += q;
      sucTotals[suc] += q;
      row.push(q ? q : '');
    });
    row.push(total);
    if (total > 0) {
      rows.push(row);
    } else {
      // revertir contribución a sucTotals si no se incluye la fila
      sucursales.forEach(function (suc) {
        sucTotals[suc] -= (perSuc[suc] || 0);
      });
    }
  });

  if (rows.length <= 1) {
    alert('Los filtros activos no dejan ninguna fila para exportar.');
    return;
  }

  // Fila TOTAL por sucursal
  var totalRow = ['TOTAL'];
  sucursales.forEach(function (suc) {
    var q = sucTotals[suc] || 0;
    grandTotal += q;
    totalRow.push(q ? q : '');
  });
  totalRow.push(grandTotal);
  rows.push(totalRow);

  // 4) Serializar y disparar la descarga
  var csv = rows.map(function (r) { return r.map(csvCell_).join(';'); }).join('\r\n');
  var bom  = '﻿';
  var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  var fecha = new Date().toISOString().slice(0, 10);
  var url   = URL.createObjectURL(blob);
  var a     = document.createElement('a');
  a.href     = url;
  a.download = 'catalogo-totales-marca-' + fecha + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

/**
 * Exporta a CSV el filtro actual.
 * @param {Object} opts
 * @param {boolean} opts.withGrade  Si true → 1 fila por producto×color×talle.
 *                                  Si false (default) → 1 fila por producto×color.
 */
function exportToExcel(opts) {
  opts = opts || {};
  var withGrade = !!opts.withGrade;

  var isFavView   = currentView === 'favorites';
  var sourceProds = isFavView ? getFavoriteProducts_() : filteredProducts;

  if (!sourceProds || !sourceProds.length) {
    alert(isFavView
      ? 'No hay favoritos guardados para exportar.'
      : 'No hay productos para exportar. Ajustá los filtros.');
    return;
  }

  var sucursalActive = !isFavView && effectiveSucursalFilter_().length > 0;
  var stockActive    = !isFavView && (filterStockMin !== null || filterStockMax !== null);
  var fotoActive     = !isFavView && (filterFoto !== 'all');
  var talleActive    = !isFavView && filterTalle.length > 0;

  // 1) Determinar la lista de sucursales que aparecerán como columnas
  var sucursales;
  if (sucursalActive) {
    sucursales = effectiveSucursalFilter_().slice().sort();
  } else {
    var sucSet = {};
    sourceProds.forEach(function (p) {
      p.colorsArr.forEach(function (c) {
        c.gradesArr.forEach(function (g) {
          g.stock.forEach(function (s) {
            if ((s.cantidad || 0) > 0) sucSet[s.sucursal] = 1;
          });
        });
      });
    });
    sucursales = Object.keys(sucSet).sort();
  }

  if (!sucursales.length) {
    alert('No hay sucursales con stock para exportar.');
    return;
  }

  // 2) Cabecera — top_venta se agrega siempre, talle solo si withGrade
  var baseHeaders = ['codFabrica', 'nmProduto', 'marca', 'color'];
  if (withGrade) baseHeaders.push('talle');
  baseHeaders.push('imagen', 'top_venta');
  var headers = baseHeaders.concat(sucursales).concat(['total']);
  var rows    = [headers];

  // Acumulador para fila TOTAL al final
  var sucTotals = {};
  sucursales.forEach(function (suc) { sucTotals[suc] = 0; });
  var sucColStart = baseHeaders.length;   // índice donde arrancan las columnas de sucursal

  // 3) Filas: 1 por producto × color (× talle si withGrade), mismos filtros que galería/PDF
  sourceProds.forEach(function (p) {
    var topVenta = STORE_NAMES[p.qMasVendio] || (p.qMasVendio ? ('Tienda ' + p.qMasVendio) : '');

    p.colorsArr.forEach(function (c) {
      if (sucursalActive && getColorStock(c) <= 0) return;
      if (stockActive    && !colorPassesStock_(c)) return;
      if (fotoActive     && !colorPassesFoto_(c)) return;

      if (withGrade) {
        // 1 fila por talle — si hay filtro de talle activo, solo esos talles
        c.gradesArr.forEach(function (g) {
          if (talleActive && filterTalle.indexOf(g.grade) < 0) return;

          // Stock por sucursal SOLO de este talle
          var stockBySucursal = {};
          g.stock.forEach(function (s) {
            if (sucursales.indexOf(s.sucursal) < 0) return;
            stockBySucursal[s.sucursal] = (stockBySucursal[s.sucursal] || 0) + (s.cantidad || 0);
          });
          // Skipear fila si el talle no tiene stock en ninguna sucursal del set
          var totalGrade = 0;
          for (var k in stockBySucursal) totalGrade += stockBySucursal[k];
          if (totalGrade <= 0) return;

          var row = [p.codFabrica, p.nmProduto, p.marca, c.color, g.grade, c.imagen || '', topVenta];
          var rowTotal = 0;
          sucursales.forEach(function (suc) {
            var q = stockBySucursal[suc] || 0;
            rowTotal += q;
            row.push(q ? q : '');
          });
          row.push(rowTotal);
          rows.push(row);
        });
      } else {
        // 1 fila por color — sumar stock de TODOS los talles, o solo de los
        // talles seleccionados si hay filtro de talle activo.
        var stockBySucursal = {};
        c.gradesArr.forEach(function (g) {
          if (talleActive && filterTalle.indexOf(g.grade) < 0) return;
          g.stock.forEach(function (s) {
            if (sucursales.indexOf(s.sucursal) < 0) return;
            stockBySucursal[s.sucursal] = (stockBySucursal[s.sucursal] || 0) + (s.cantidad || 0);
          });
        });

        var rowTotal = 0;
        sucursales.forEach(function (suc) { rowTotal += stockBySucursal[suc] || 0; });
        // Skipear fila si el filtro de talle deja el color sin stock
        if (talleActive && rowTotal <= 0) return;

        var row = [p.codFabrica, p.nmProduto, p.marca, c.color, c.imagen || '', topVenta];
        rowTotal = 0;
        sucursales.forEach(function (suc) {
          var q = stockBySucursal[suc] || 0;
          rowTotal += q;
          row.push(q ? q : '');
        });
        row.push(rowTotal);
        rows.push(row);
      }
    });
  });

  if (rows.length <= 1) {
    alert('Los filtros activos no dejan ninguna fila para exportar.');
    return;
  }

  // Sumar totales por sucursal a partir de las filas de datos (excluye header)
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    sucursales.forEach(function (suc, idx) {
      var v = r[sucColStart + idx];
      if (typeof v === 'number') sucTotals[suc] += v;
    });
  }

  // Fila TOTAL: etiqueta en la primera columna, vacías hasta las sucursales, luego sumas
  var totalRow = new Array(baseHeaders.length).fill('');
  totalRow[0] = 'TOTAL';
  var grandTotal = 0;
  sucursales.forEach(function (suc) {
    var q = sucTotals[suc] || 0;
    grandTotal += q;
    totalRow.push(q ? q : '');
  });
  totalRow.push(grandTotal);
  rows.push(totalRow);

  // 4) Serializar a CSV. Separador ';' para Excel en es-PY/AR.
  var csv = rows
    .map(function (r) { return r.map(csvCell_).join(';'); })
    .join('\r\n');

  // BOM UTF-8 para que Excel detecte correctamente tildes y ñ
  var bom  = '﻿';
  var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  // 5) Disparar la descarga
  var fecha   = new Date().toISOString().slice(0, 10);   // YYYY-MM-DD
  var suffix  = withGrade ? '-con-talle' : '';
  var url     = URL.createObjectURL(blob);
  var a       = document.createElement('a');
  a.href     = url;
  a.download = 'catalogo' + suffix + '-' + fecha + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

// Escapa un valor para CSV (RFC 4180).
// Si contiene ';', ',', comilla doble o salto de línea → envolver en comillas
// dobles y duplicar las internas.
// Copia el código del producto al portapapeles y muestra feedback breve
// cambiando el ícono 📋 → ✓ por ~1,5 s.
function copyCodeToClipboard_(btn) {
  var text = btn.getAttribute('data-copy') || '';
  if (!text) return;

  function showCopied() {
    var original = btn.innerHTML;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.innerHTML = original;
      btn.classList.remove('copied');
    }, 1500);
  }

  // Camino moderno (https): navigator.clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showCopied).catch(function () {
      // Si falla, intentar fallback
      fallbackCopy_(text, showCopied);
    });
  } else {
    fallbackCopy_(text, showCopied);
  }
}

// Fallback para browsers viejos o contextos sin clipboard API
function fallbackCopy_(text, onSuccess) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    onSuccess();
  } catch (e) { /* nada */ }
  document.body.removeChild(ta);
}

function csvCell_(v) {
  if (v == null) return '';
  var s = String(v);
  if (/[";,\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// =================================================================
// GENERACIÓN DE CATÁLOGO PDF (window.print → guardar como PDF)
// =================================================================
// Arma un HTML completo del catálogo en #print-catalog (oculto en pantalla,
// visible al imprimir vía @media print) y dispara el diálogo del navegador.
// Respeta TODOS los filtros activos, incluido sucursal (totales recalculados).

// =================================================================
// PDF MÓVIL — BETA / EXPERIMENTAL
// =================================================================
// Enfoque distinto del generatePDF tradicional, pensado para Android Chrome
// donde window.print() + @media print tienen problemas.
//
// Estrategia: renderizar el catálogo como un overlay full-screen sobre la
// misma página (NO nueva pestaña, NO print automático). El usuario lo ve y
// usa el menú nativo del navegador (⋮ → Imprimir / Compartir / Guardar PDF).
// Esto evita por completo los problemas de timing/permisos.

function generatePDFMobile() {
  var isFavView   = currentView === 'favorites';
  var sourceProds = isFavView ? getFavoriteProducts_() : filteredProducts;

  if (!sourceProds || !sourceProds.length) {
    alert(isFavView
      ? 'No hay favoritos guardados para incluir en el PDF.'
      : 'No hay productos para incluir en el PDF. Ajustá los filtros.');
    return;
  }

  var sucursalActive = !isFavView && effectiveSucursalFilter_().length > 0;
  var stockActive    = !isFavView && (filterStockMin !== null || filterStockMax !== null);
  var fotoActive     = !isFavView && (filterFoto !== 'all');
  var filtroResumen  = isFavView ? 'Favoritos' : buildFilterSummary_();
  var fecha          = new Date().toLocaleDateString('es-PY',
                          { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Recolectar las cards filtradas (una entrada por producto×color)
  var cardsHtmlArr = [];
  sourceProds.forEach(function (p) {
    p.colorsArr.forEach(function (c) {
      if (sucursalActive && getColorStock(c) <= 0) return;
      if (stockActive    && !colorPassesStock_(c)) return;
      if (fotoActive     && !colorPassesFoto_(c)) return;
      cardsHtmlArr.push(renderPdfCard_(p, c));
    });
  });
  var cardCount = cardsHtmlArr.length;

  if (cardCount === 0) {
    alert('Los filtros activos no dejan ningún producto/color para imprimir.');
    return;
  }

  // Pre-paginación: chunkear las cards en bloques de tamaño fijo para que
  // cada bloque sea una hoja A4. Esto evita que iOS Safari corte cards a la
  // mitad (page-break-inside: avoid sobre items de un display:grid no es
  // confiable en Safari iOS — sí lo es page-break-after: always sobre un
  // bloque que ya cabe entero).
  //
  // En print el grid se fuerza a 3 columnas. Cada card ocupa ~70mm de alto
  // y la hoja útil mide ~277mm. La primera hoja lleva el header (~25mm),
  // por eso entran menos cards que en las siguientes.
  // Primera hoja: 6 cards (2 filas × 3 cols) — el header le come ~15-20mm
  // y en iPhone Safari la 3ra fila no entra al 100% (en Android sí, pero
  // diferenciamos para mantener compatibilidad cross-platform).
  // Hojas siguientes: 9 cards (3 filas × 3 cols) — sin header entran holgadas.
  var FIRST_PAGE_CARDS = 6;
  var OTHER_PAGE_CARDS = 9;

  var pagesHtml = '';
  var idx = 0;
  var pageIdx = 0;
  while (idx < cardCount) {
    var perPage = (pageIdx === 0) ? FIRST_PAGE_CARDS : OTHER_PAGE_CARDS;
    var chunk = cardsHtmlArr.slice(idx, idx + perPage).join('');
    var headerHtml = (pageIdx === 0)
      ? '<div class="pdf-header">' +
          '<h1>Catálogo de Productos</h1>' +
          '<div class="pdf-meta">' + escHtml(filtroResumen) +
            ' · ' + cardCount + ' artículos · ' + fecha + '</div>' +
        '</div>'
      : '';
    pagesHtml += '<div class="pmo-page">' + headerHtml +
                   '<div class="pdf-grid">' + chunk + '</div>' +
                 '</div>';
    idx += perPage;
    pageIdx++;
  }

  // Mostrar/crear el overlay
  var overlay = document.getElementById('pdf-mobile-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pdf-mobile-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML =
    '<div class="pmo-toolbar">' +
      '<button class="pmo-close" onclick="closePdfMobile_()">' + SVG_X + ' Cerrar</button>' +
      '<div class="pmo-scale" title="Ajusta el tamaño general con el que se imprime. Se guarda en este dispositivo.">' +
        '<span class="pmo-scale-label">Escala</span>' +
        '<button class="pmo-scale-btn" onclick="adjustPmoScale_(-1)" aria-label="Reducir escala">−</button>' +
        '<span class="pmo-scale-val" id="pmo-scale-val">100%</span>' +
        '<button class="pmo-scale-btn" onclick="adjustPmoScale_(1)" aria-label="Aumentar escala">+</button>' +
      '</div>' +
      '<div class="pmo-scale" title="Ajusta el alto de las fotos en el print. Se guarda en este dispositivo.">' +
        '<span class="pmo-scale-label">Foto</span>' +
        '<button class="pmo-scale-btn" onclick="adjustPmoImg_(-1)" aria-label="Foto más chica">−</button>' +
        '<span class="pmo-scale-val" id="pmo-img-val">27mm</span>' +
        '<button class="pmo-scale-btn" onclick="adjustPmoImg_(1)" aria-label="Foto más grande">+</button>' +
      '</div>' +
      '<button class="pmo-print" onclick="window.print()">🖨️ Imprimir</button>' +
    '</div>' +
    pagesHtml;

  overlay.classList.add('open');
  document.body.classList.add('pmo-active');   // necesario para @media print
  document.body.style.overflow = 'hidden';
  applyPmoScale_(getPmoScale_());
  applyPmoImg_(getPmoImg_());
}

function closePdfMobile_() {
  var overlay = document.getElementById('pdf-mobile-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.innerHTML = '';
  }
  document.body.classList.remove('pmo-active');
  document.body.style.overflow = '';
}

/* ---- Escalado configurable del PDF móvil (persistido) ---- */
var PMO_SCALE_KEY = 'pmo_print_scale';
var PMO_SCALE_MIN = 70;
var PMO_SCALE_MAX = 110;
function getPmoScale_() {
  var raw = null;
  try { raw = localStorage.getItem(PMO_SCALE_KEY); } catch (e) {}
  var v = parseInt(raw || '100', 10);
  if (isNaN(v)) v = 100;
  if (v < PMO_SCALE_MIN) v = PMO_SCALE_MIN;
  if (v > PMO_SCALE_MAX) v = PMO_SCALE_MAX;
  return v;
}
function applyPmoScale_(v) {
  document.documentElement.style.setProperty('--pmo-print-scale', (v / 100).toString());
  var el = document.getElementById('pmo-scale-val');
  if (el) el.textContent = v + '%';
}
function adjustPmoScale_(delta) {
  var v = getPmoScale_() + delta;
  if (v < PMO_SCALE_MIN) v = PMO_SCALE_MIN;
  if (v > PMO_SCALE_MAX) v = PMO_SCALE_MAX;
  try { localStorage.setItem(PMO_SCALE_KEY, v.toString()); } catch (e) {}
  applyPmoScale_(v);
}

/* ---- Alto de imagen configurable en print (persistido) ---- */
var PMO_IMG_KEY = 'pmo_img_height';
var PMO_IMG_MIN = 18;
var PMO_IMG_MAX = 50;
function getPmoImg_() {
  var raw = null;
  try { raw = localStorage.getItem(PMO_IMG_KEY); } catch (e) {}
  var v = parseInt(raw || '27', 10);
  if (isNaN(v)) v = 27;
  if (v < PMO_IMG_MIN) v = PMO_IMG_MIN;
  if (v > PMO_IMG_MAX) v = PMO_IMG_MAX;
  return v;
}
function applyPmoImg_(v) {
  document.documentElement.style.setProperty('--pmo-img-height', v + 'mm');
  var el = document.getElementById('pmo-img-val');
  if (el) el.textContent = v + 'mm';
}
function adjustPmoImg_(delta) {
  var v = getPmoImg_() + delta;
  if (v < PMO_IMG_MIN) v = PMO_IMG_MIN;
  if (v > PMO_IMG_MAX) v = PMO_IMG_MAX;
  try { localStorage.setItem(PMO_IMG_KEY, v.toString()); } catch (e) {}
  applyPmoImg_(v);
}

function generatePDF() {
  var isFavView   = currentView === 'favorites';
  var sourceProds = isFavView ? getFavoriteProducts_() : filteredProducts;

  if (!sourceProds || !sourceProds.length) {
    alert(isFavView
      ? 'No hay favoritos guardados para incluir en el PDF.'
      : 'No hay productos para incluir en el PDF. Ajustá los filtros.');
    return;
  }

  var cardCount = countPdfCards_(sourceProds, isFavView);

  if (cardCount === 0) {
    alert('Los filtros activos no dejan ningún producto/color para imprimir.');
    return;
  }

  // Advertencia para PDFs largos (>150 cards ≈ >17 páginas con 9 cards/hoja)
  var PDF_WARN_THRESHOLD = 150;
  if (cardCount > PDF_WARN_THRESHOLD) {
    var paginas = Math.ceil(cardCount / 9);
    confirmDialog({
      title:      'PDF largo',
      icon:       '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      okText:     'Continuar',
      cancelText: 'Cancelar',
      body:
        'El PDF va a tener <strong>' + cardCount + ' artículos</strong> en ' +
        'aproximadamente <strong>' + paginas + ' páginas</strong>.\n\n' +
        'La preparación puede tardar entre 10 y 60 segundos según cuántas ' +
        'imágenes haya que descargar.\n\n¿Querés continuar?'
    }).then(function (ok) {
      if (ok) printCatalogPdf_();
    });
    return;
  }

  printCatalogPdf_();
}

// Cuenta cuántas cards (producto×color) van a salir en el PDF "Normal" con
// los filtros activos, sin armar el HTML todavía (para el aviso de PDF largo).
function countPdfCards_(sourceProds, isFavView) {
  var sucursalActive = !isFavView && effectiveSucursalFilter_().length > 0;
  var stockActive    = !isFavView && (filterStockMin !== null || filterStockMax !== null);
  var cardCount = 0;
  sourceProds.forEach(function (p) {
    p.colorsArr.forEach(function (c) {
      if (sucursalActive && getColorStock(c) <= 0) return;
      if (stockActive    && !colorPassesStock_(c)) return;
      if (!isFavView && filterFoto !== 'all' && !colorPassesFoto_(c)) return;
      cardCount++;
    });
  });
  return cardCount;
}

// Arma el HTML del catálogo "Normal" (#print-catalog) para el filtro/vista
// actual. Reutilizado por el botón (que después llama a window.print()) y por
// buildPdfCatalogForExport_ (que llama pdf-service/Puppeteer directamente).
function renderPrintCatalogHtml_() {
  var isFavView      = currentView === 'favorites';
  var sourceProds     = isFavView ? getFavoriteProducts_() : filteredProducts;
  var container       = document.getElementById('print-catalog');
  var sucursalActive  = !isFavView && effectiveSucursalFilter_().length > 0;
  var stockActive     = !isFavView && (filterStockMin !== null || filterStockMax !== null);
  var filtroResumen   = isFavView ? 'Favoritos' : buildFilterSummary_();
  var fecha           = new Date().toLocaleDateString('es-PY',
                          { day: '2-digit', month: '2-digit', year: 'numeric' });

  var cardsHtml = '';
  var cardCount = 0;
  sourceProds.forEach(function (p) {
    p.colorsArr.forEach(function (c) {
      if (sucursalActive && getColorStock(c) <= 0) return;
      if (stockActive    && !colorPassesStock_(c)) return;
      if (!isFavView && filterFoto !== 'all' && !colorPassesFoto_(c)) return;
      cardsHtml += renderPdfCard_(p, c);
      cardCount++;
    });
  });

  container.innerHTML =
    '<div class="pdf-header">' +
      '<h1>Catálogo de Productos</h1>' +
      '<div class="pdf-meta">' + escHtml(filtroResumen) +
        ' · ' + cardCount + ' artículos · ' + fecha + '</div>' +
    '</div>' +
    '<div class="pdf-grid">' + cardsHtml + '</div>';

  return { container: container, cardCount: cardCount };
}

// Arma el catálogo y dispara el diálogo de impresión del navegador (uso
// interactivo del botón "Normal").
function printCatalogPdf_() {
  var res = renderPrintCatalogHtml_();

  // Feedback en el botón mientras carga
  var btn = document.getElementById('btn-pdf');
  var btnOriginal = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '⏳ Preparando...'; btn.disabled = true; }

  // ESPERAR a que TODAS las imágenes carguen antes de window.print().
  // Sin esto, las imágenes que aún no estaban en cache del browser aparecen
  // vacías en la vista previa (window.print no espera por imágenes async).
  waitForImages_(res.container).then(function () {
    if (btn) { btn.innerHTML = btnOriginal; btn.disabled = false; }
    window.print();
    // Limpiar el DOM después de que se cierra el diálogo
    setTimeout(function () { res.container.innerHTML = ''; }, 500);
  });
}

// Usado por pdf-service (Puppeteer): arma el catálogo "Normal" con los
// filtros ya seteados en window.* (ver server.js) y espera a que las
// imágenes carguen. Sin window.print() — page.pdf() del lado del server lee
// directamente el DOM ya armado (usa media "print" por default). Devuelve
// una Promise<cardCount> para que Puppeteer sepa si hubo contenido.
function buildPdfCatalogForExport_() {
  var res = renderPrintCatalogHtml_();
  return waitForImages_(res.container).then(function () {
    return res.cardCount;
  });
}

// =================================================================
// EXPORTAR PDF "NORMAL" VÍA PDF-SERVICE (sin diálogo de impresión)
// =================================================================
// URL pública de pdf-service (Puppeteer corriendo en el servidor). Reemplazar
// por la URL real (ngrok u otro túnel/dominio con HTTPS) antes de deployar —
// tiene que ser HTTPS porque esta página se sirve por HTTPS (GitHub Pages) y
// el navegador bloquea fetch() a HTTP ("mixed content").
var PDF_SERVICE_URL = 'https://lacostasrl.tail33d868.ts.net';

// Arma un objeto con el estado de filtros/orden/búsqueda actual de la sesión,
// tal cual lo necesita generateNormalPdf() en server.js para reproducirlo.
function buildCurrentFilterState_() {
  return {
    filterMarca:    filterMarca.slice(),
    filterGrupo:    filterGrupo.slice(),
    filterSubgrupo: filterSubgrupo.slice(),
    filterColecao:  filterColecao.slice(),
    filterTalle:    filterTalle.slice(),
    filterColor:    filterColor.slice(),
    filterSucursal: effectiveSucursalFilter_().slice(),
    filterStockMin: filterStockMin,
    filterStockMax: filterStockMax,
    filterFoto:     filterFoto,
    filterPromo:    filterPromo,
    filterPrecioMin: filterPrecioMin,
    filterPrecioMax: filterPrecioMax,
    filterUltCompraDesde: filterUltCompraDesde,
    filterUltCompraHasta: filterUltCompraHasta,
    filterUltVentaDesde:  filterUltVentaDesde,
    filterUltVentaHasta:  filterUltVentaHasta,
    searchText:     searchText,
    sortField:      sortField,
    sortDir:        sortDir,
    sortTieDir:     sortTieDir,
    pdfIncludePromo: pdfIncludePromo,
    pdfHidePrice:    pdfHidePrice,
    priceMode:       priceMode
  };
}

// Botón "Normal" del menú de Filtros. Genera el PDF del lado del servidor
// (pdf-service/Puppeteer) y lo descarga directo, sin pasar por window.print().
// En Favoritos: como esa lista vive solo en el localStorage de este
// dispositivo (pdf-service abre una página nueva, sin ese localStorage), se
// manda el objeto `favorites` en el request para que el servidor lo reproduzca
// (ver generateNormalPdf en server.js).
function exportPdfNormal_() {
  var isFavView   = currentView === 'favorites';
  var sourceProds = isFavView ? getFavoriteProducts_() : filteredProducts;

  if (!sourceProds || !sourceProds.length) {
    alert(isFavView
      ? 'No hay favoritos guardados para incluir en el PDF.'
      : 'No hay productos para incluir en el PDF. Ajustá los filtros.');
    return;
  }

  var cardCount = countPdfCards_(sourceProds, isFavView);
  if (cardCount === 0) {
    alert('Los filtros activos no dejan ningún producto/color para imprimir.');
    return;
  }

  var PDF_WARN_THRESHOLD = 150;
  if (cardCount > PDF_WARN_THRESHOLD) {
    var paginas = Math.ceil(cardCount / 9);
    confirmDialog({
      title:      'PDF largo',
      icon:       '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      okText:     'Continuar',
      cancelText: 'Cancelar',
      body:
        'El PDF va a tener <strong>' + cardCount + ' artículos</strong> en ' +
        'aproximadamente <strong>' + paginas + ' páginas</strong>.\n\n' +
        'La generación puede tardar entre 10 y 60 segundos según cuántas ' +
        'imágenes haya que descargar.\n\n¿Querés continuar?'
    }).then(function (ok) {
      if (ok) requestPdfFromService_(isFavView);
    });
    return;
  }

  requestPdfFromService_(isFavView);
}

function requestPdfFromService_(isFavView) {
  var btn = document.getElementById('btn-pdf');
  var btnOriginal = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '⏳ Generando...'; btn.disabled = true; }

  var payloadFilters = buildCurrentFilterState_();
  if (isFavView) payloadFilters.favorites = favorites;
  var filename = isFavView ? 'favoritos.pdf' : 'catalogo.pdf';

  fetch(PDF_SERVICE_URL + '/pdf/normal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify({
      filters:  payloadFilters,
      filename: filename
    })
  })
    .then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          throw new Error(data.error || ('Error del servidor (' + res.status + ')'));
        });
      }
      return res.blob();
    })
    .then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    })
    .catch(function (err) {
      alert('No se pudo generar el PDF: ' + err.message + '\n\n¿Está el servicio de PDF encendido y accesible?');
    })
    .finally(function () {
      if (btn) { btn.innerHTML = btnOriginal; btn.disabled = false; }
    });
}

/**
 * Espera a que todas las <img> dentro de `root` terminen de cargar (o fallen).
 * Devuelve una Promise. Tiene un timeout duro de 30 s para no colgarse si
 * Drive no responde — en ese caso imprime lo que haya.
 */
function waitForImages_(root) {
  var imgs = root.querySelectorAll('img');
  if (imgs.length === 0) return Promise.resolve();

  var promises = [];
  for (var i = 0; i < imgs.length; i++) {
    (function (img) {
      // Ya cargada y con dimensiones reales
      if (img.complete && img.naturalWidth > 0) return;

      promises.push(new Promise(function (resolve) {
        var done = false;
        function finish() { if (!done) { done = true; resolve(); } }
        img.addEventListener('load',  finish);
        img.addEventListener('error', finish);
      }));
    })(imgs[i]);
  }

  // Timeout absoluto de seguridad: 30 s
  var timeout = new Promise(function (resolve) { setTimeout(resolve, 30000); });
  return Promise.race([Promise.all(promises), timeout]);
}

function renderPdfCard_(p, c) {
  var imgUrl = getImgUrl(c.imgId, 400);
  var stockTot = getColorStock(c);

  // Tallas con cantidad — si hay filtro de sucursal, omitir tallas con stock 0
  var gradesHtml = c.gradesArr
    .map(function (g) {
      var gs = getGradeStock(g);
      if (gs <= 0) return '';
      return '<span class="grade-chip">T.' + escHtml(g.grade) + ': <b>' + gs + '</b></span>';
    })
    .join('');

  // Precio: pdfHidePrice=true → sin precio. pdfIncludePromo=true → con promo.
  var priceHtml;
  if (pdfHidePrice) {
    priceHtml = '';
  } else if (pdfIncludePromo) {
    priceHtml = renderPriceHtml(p);
  } else {
    var basePrice = (priceMode === 'mayorista')
      ? (p.precioMayorista || 0)
      : (p.precioMinorista || 0);
    priceHtml = fmtPrice(basePrice);
  }

  // Link a la versión grande de la foto: clickeable en el PDF guardado
  // (Safari, Chrome, Preview en iOS/Android conservan los <a href>).
  var fullImgUrl = getImgUrl(c.imgId, 1600);

  return '<div class="pdf-card">' +
    (imgUrl
      ? '<a class="pdf-card-img-link" href="' + fullImgUrl + '" target="_blank" rel="noopener">' +
          '<img class="pdf-card-img" src="' + imgUrl + '" alt="">' +
        '</a>'
      : '<div class="pdf-card-img-ph"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span class="pdf-card-img-ph-txt">Sin imagen</span></div>') +
    '<div class="pdf-card-body">' +
      '<div class="pdf-card-cod">Cód: ' + escHtml(p.codFabrica) +
        ' · ' + escHtml(p.marca) + '</div>' +
      '<div class="pdf-card-name">' + escHtml(p.nmProduto) + '</div>' +
      '<div class="pdf-card-color">' + escHtml(c.color) + '</div>' +
      '<div class="pdf-card-price">' + priceHtml + '</div>' +
      '<div class="pdf-card-stock">Total: ' + stockTot + ' uds</div>' +
      '<div class="pdf-card-grades">' + gradesHtml + '</div>' +
    '</div>' +
  '</div>';
}

// Resumen textual de los filtros activos (para el encabezado del PDF)
function buildFilterSummary_() {
  var parts = [];
  parts.push('Precio: ' + (priceMode === 'mayorista' ? 'Mayorista' : 'Minorista'));
  if (searchText)            parts.push('Búsqueda: "' + searchText + '"');
  if (filterMarca.length)    parts.push('Marca: '    + filterMarca.join(', '));
  if (filterGrupo.length)    parts.push('Grupo: '    + filterGrupo.join(', '));
  if (filterSubgrupo.length) parts.push('Subgrupo: ' + filterSubgrupo.join(', '));
  if (filterColecao.length)  parts.push('Colección: '+ filterColecao.join(', '));
  if (filterTalle.length)    parts.push('Talle: '    + filterTalle.join(', '));
  if (filterColor.length)    parts.push('Color: '    + filterColor.join(', '));
  // Sucursal: mostrar la lista efectiva (incluye el caso "modo locked + vacío"
  // que en realidad significa "todas las del config")
  var sucEff = effectiveSucursalFilter_();
  if (sucEff.length) parts.push('Sucursal: ' + sucEff.join(', '));
  if (filterPrecioMin !== null || filterPrecioMax !== null) {
    parts.push('Precio: ' + (filterPrecioMin != null ? filterPrecioMin : '0') +
               ' – ' + (filterPrecioMax != null ? filterPrecioMax : '∞'));
  }
  if (filterStockMin !== null || filterStockMax !== null) {
    parts.push('Stock: ' + (filterStockMin != null ? filterStockMin : '0') +
               ' – ' + (filterStockMax != null ? filterStockMax : '∞'));
  }
  if (filterUltCompraDesde || filterUltCompraHasta) {
    parts.push('Últ. compra: ' +
               (filterUltCompraDesde ? fmtDate(filterUltCompraDesde) : '—') +
               ' a ' + (filterUltCompraHasta ? fmtDate(filterUltCompraHasta) : 'hoy'));
  }
  if (filterUltVentaDesde || filterUltVentaHasta) {
    parts.push('Últ. venta: ' +
               (filterUltVentaDesde ? fmtDate(filterUltVentaDesde) : '—') +
               ' a ' + (filterUltVentaHasta ? fmtDate(filterUltVentaHasta) : 'hoy'));
  }
  if (filterFoto === 'with')    parts.push('Solo con foto');
  if (filterFoto === 'without') parts.push('Solo sin foto');
  if (filterPromo === 'with')    parts.push('Solo con promo');
  if (filterPromo === 'without') parts.push('Solo sin promo');
  if (!pdfIncludePromo)          parts.push('PDF sin precios promo');
  if (!parts.length) parts.push('Todos los productos');
  return parts.join(' · ');
}

// Paginación clásica reemplazada por scroll infinito.
// La lógica vive en attachSentinel_, appendNextGalleryBatch, appendNextTableBatch
// y updateInfiniteFooter_ (ver bloque RENDER — GALERÍA arriba).
