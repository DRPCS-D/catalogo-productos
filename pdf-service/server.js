const express = require("express");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// CORS — el catálogo (GitHub Pages, HTTPS) le pega a este servicio (ngrok,
// HTTPS) via fetch() desde el navegador del cliente para /pdf/normal.
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const CHROMIUM_PATH = "/usr/bin/chromium";
// Sin --single-process: corre todo (browser + renderer) en un solo proceso,
// modo no soportado oficialmente por Chromium y conocido por causar fallos
// intermitentes de lanzamiento ("Failed to launch the browser process!") en
// contenedores Docker — exactamente el error que se veía. shm_size:256m en
// docker-compose.yml ya cubre lo que --disable-dev-shm-usage protegía.
const LAUNCH_ARGS = [
  "--no-sandbox", "--disable-setuid-sandbox",
  "--disable-dev-shm-usage", "--disable-gpu"
];

const PMO_SCALE = 110;
const PMO_IMG_HEIGHT = 44;
const CATALOG_BASE = "https://catalogo-drpcs.vercel.app/";

// ── Config ────────────────────────────────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const DEFAULT_CONFIG = {
  pin: "1234",
  access_pw: "",          // contraseña de acceso al catálogo (lc_access_pw_v1)
  sucursales: ["LA COSTA S.R.L.", "ON BRAND&TRADE"],
  foto: "with",
  formato_pdf: "A4",
  cantidad_min: 6,
  marcas: [],
  colecciones: [],
  pdf_sort_field: "subgrupo",   // mismos campos que la tabla web (index.html sortField)
  pdf_sort_dir: "asc",          // 'asc' | 'desc'
  pdf_sort_tie_dir: "desc"      // 'asc' | 'desc' — desempate por id cuando hay empate en pdf_sort_field
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return Object.assign({}, DEFAULT_CONFIG, JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")));
    }
  } catch (_) {}
  return Object.assign({}, DEFAULT_CONFIG);
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

let serverConfig = loadConfig();

function buildCatalogUrl(brand) {
  const c = serverConfig;
  let url = CATALOG_BASE + "?";
  if (brand) url += "marca=" + encodeURIComponent(brand) + "&";
  url += "suc=" + encodeURIComponent(c.sucursales.join(","));
  url += "&foto=" + (c.foto || "with");
  url += "&mode=ma";
  if (c.colecciones && c.colecciones.length) url += "&coleccion=" + encodeURIComponent(c.colecciones.join(","));
  return url;
}

// ── TMP ───────────────────────────────────────────────────────────────────────
const TMP_DIR = "/tmp/pdf-cache";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ── PDF Cache (30 min por marca) ──────────────────────────────────────────────
const PDF_CACHE_TTL = 30 * 60 * 1000;
const PDF_BUCKET_MS = 30 * 60 * 1000;
const pdfCacheMap   = new Map();
const CACHE_INDEX_FILE = path.join(TMP_DIR, ".cache-index.json");

function loadCacheIndex() {
  try {
    if (!fs.existsSync(CACHE_INDEX_FILE)) return;
    const data = JSON.parse(fs.readFileSync(CACHE_INDEX_FILE, "utf8"));
    const now = Date.now();
    Object.entries(data).forEach(function([key, entry]) {
      if (entry.expiresAt > now && fs.existsSync(entry.filePath)) {
        pdfCacheMap.set(key, entry);
      }
    });
    if (pdfCacheMap.size > 0) console.log("[cache] restaurados", pdfCacheMap.size, "PDFs del índice");
  } catch (_) {}
}

function saveCacheIndex() {
  try {
    const data = {};
    pdfCacheMap.forEach(function(entry, key) { data[key] = entry; });
    fs.writeFileSync(CACHE_INDEX_FILE, JSON.stringify(data));
  } catch (_) {}
}

function clearAllPdfCache() {
  pdfCacheMap.clear();
  try {
    fs.readdirSync(TMP_DIR).forEach(function(f) {
      if (f === ".cache-index.json") return;
      try { fs.unlinkSync(path.join(TMP_DIR, f)); } catch (_) {}
    });
  } catch (_) {}
  saveCacheIndex();
  console.log("[cache] limpiado por cambio de config");
}

loadCacheIndex();

function configHash() {
  const c = serverConfig;
  return [c.sucursales.join(","), c.foto, c.cantidad_min, (c.colecciones||[]).join(","), c.marcas.join(","), c.pdf_sort_field, c.pdf_sort_dir, c.pdf_sort_tie_dir].join("|");
}

function pdfCacheKey(brand) {
  return brand + "|" + Math.floor(Date.now() / PDF_BUCKET_MS) + "|" + configHash();
}
function getCachedPdf(brand) {
  const entry = pdfCacheMap.get(pdfCacheKey(brand));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt || !fs.existsSync(entry.filePath)) {
    pdfCacheMap.delete(pdfCacheKey(brand));
    return null;
  }
  return entry;
}
function setCachedPdf(brand, filePath) {
  pdfCacheMap.set(pdfCacheKey(brand), { filePath, expiresAt: Date.now() + PDF_CACHE_TTL });
  saveCacheIndex();
}

// ── Cola global (un PDF a la vez) ─────────────────────────────────────────────
let queueProcessing = false;
const jobQueue = [];

function enqueueJob(fn) {
  return new Promise(function(resolve, reject) {
    jobQueue.push({ fn: fn, resolve: resolve, reject: reject });
    drainQueue();
  });
}

function drainQueue() {
  if (queueProcessing || jobQueue.length === 0) return;
  queueProcessing = true;
  var job = jobQueue.shift();
  job.fn().then(function(result) {
    job.resolve(result);
  }).catch(function(err) {
    job.reject(err);
  }).finally(function() {
    queueProcessing = false;
    drainQueue();
  });
}

// ── Brand + collection cache ──────────────────────────────────────────────────
let knownBrands       = [];
let brandsLoadedAt    = 0;
let knownCollections  = [];
let collectionsLoadedAt = 0;
let knownSucursales   = [];
let sucursalesLoadedAt = 0;
const BRANDS_TTL   = 60 * 60 * 1000;

function normStr(s) {
  return s.toUpperCase().replace(/[\s\-_]+/g, "");
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      if (i === 0) dp[i][j] = j;
      else if (j === 0) dp[i][j] = i;
      else dp[i][j] = 0;
    }
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}
function fuzzyBrands(query, list, max) {
  max = max || 3;
  var q = normStr(query);
  var scored = list.map(function(b) {
    var nb = normStr(b);
    var score;
    if (nb === q) score = 100;
    else if (nb.indexOf(q) >= 0 || q.indexOf(nb) >= 0) score = 80;
    else score = Math.round((1 - levenshtein(q, nb) / Math.max(q.length, nb.length)) * 60);
    return { b: b, score: score };
  });
  return scored
    .filter(function(x) { return x.score >= 40; })
    .sort(function(a, z) { return z.score - a.score; })
    .slice(0, max)
    .map(function(x) { return x.b; });
}

// ── Puppeteer helpers ─────────────────────────────────────────────────────────
// El lanzamiento de Chromium puede fallar de forma transitoria en Docker
// (recursos del host, timing). Un reintento cubre esos casos sin que el
// usuario tenga que volver a tocar el botón "Descargar PDF".
async function launchBrowser_() {
  try {
    return await puppeteer.launch({ executablePath: CHROMIUM_PATH, headless: true, args: LAUNCH_ARGS });
  } catch (err) {
    console.warn("[puppeteer] fallo al lanzar el browser, reintentando en 500ms:", err.message);
    await new Promise(function (r) { setTimeout(r, 500); });
    return puppeteer.launch({ executablePath: CHROMIUM_PATH, headless: true, args: LAUNCH_ARGS });
  }
}

async function newBrowserPage(url) {
  const browser = await launchBrowser_();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setBypassCSP(true);

  // Inyectar la contraseña de acceso en localStorage antes de cargar la página,
  // para que el gate de contraseña no bloquee a Puppeteer.
  if (serverConfig.access_pw) {
    await page.evaluateOnNewDocument(function(key, value) {
      try { localStorage.setItem(key, value); } catch (_) {}
    }, "lc_access_pw_v1", serverConfig.access_pw);
  }

  const cdp = await page.createCDPSession();
  await cdp.send("ServiceWorker.enable");
  await cdp.send("ServiceWorker.stopAllWorkers");
  await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
  return { browser, page };
}

async function extractBrandsFromPage(page) {
  return page.evaluate(function() {
    var source = (window.filteredProducts && window.filteredProducts.length)
      ? window.filteredProducts
      : (window.products || []);
    var set = {};
    var list = [];
    source.forEach(function(p) {
      if (p.marca && !set[p.marca]) { set[p.marca] = 1; list.push(p.marca); }
    });
    return list.sort();
  }).catch(function() { return []; });
}

async function extractCollectionsFromPage(page) {
  return page.evaluate(function() {
    var source = window.products || [];
    var set = {};
    var list = [];
    source.forEach(function(p) {
      if (p.colecao && !set[p.colecao]) { set[p.colecao] = 1; list.push(p.colecao); }
    });
    return list.sort();
  }).catch(function() { return []; });
}

async function extractSucursalesFromPage(page) {
  return page.evaluate(function() {
    var source = window.products || [];
    var set = {};
    var list = [];
    source.forEach(function(p) {
      (p.colorsArr || []).forEach(function(c) {
        (c.gradesArr || []).forEach(function(g) {
          (g.stock || []).forEach(function(s) {
            if (s.sucursal && !set[s.sucursal]) { set[s.sucursal] = 1; list.push(s.sucursal); }
          });
        });
      });
    });
    return list.sort();
  }).catch(function() { return []; });
}

async function generatePdf(url, waitSelector, delayMs, catalogMode, brand) {
  const { browser, page } = await newBrowserPage(url);
  try {
    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 25000 }).catch(function() {});
      await new Promise(function(r) { setTimeout(r, 1500); });
    } else {
      await new Promise(function(r) { setTimeout(r, delayMs); });
    }

    if (catalogMode) {
      await page.evaluate(function() { window.alert = function() {}; });

      const brandFound = await page.evaluate(function() {
        return Array.isArray(window.filterMarca) && window.filterMarca.length > 0;
      });

      if (!brandFound) {
        const brands = await extractBrandsFromPage(page);
        if (brands.length) { knownBrands = brands; brandsLoadedAt = Date.now(); }

        const normQuery = normStr(brand || "");
        const exactMatch = brands.find(function(b) { return normStr(b) === normQuery; });

        if (exactMatch) {
          await page.evaluate(function(b) {
            window.filterMarca = [b];
            if (typeof applyFilters === "function") applyFilters();
          }, exactMatch);
          await new Promise(function(r) { setTimeout(r, 500); });
          brand = exactMatch;
        } else {
          const err = new Error("Marca no encontrada");
          err.code = "NO_BRAND";
          err.suggestions = brand ? fuzzyBrands(brand, knownBrands) : [];
          throw err;
        }
      }

      if (brand && knownBrands.indexOf(brand) < 0) knownBrands.push(brand);

      const stockMin = serverConfig.cantidad_min || 6;
      await page.evaluate(function(min) {
        window.filterStockMin = min;
        if (typeof applyFilters === "function") applyFilters();
      }, stockMin);
      await new Promise(function(r) { setTimeout(r, 800); });

      const sortField  = serverConfig.pdf_sort_field   || "subgrupo";
      const sortDir    = serverConfig.pdf_sort_dir     || "asc";
      const sortTieDir = serverConfig.pdf_sort_tie_dir || "desc";
      await page.evaluate(function(field, dir, tieDir) {
        window.sortField  = field;
        window.sortDir    = dir;
        window.sortTieDir = tieDir;
        if (typeof applyFilters === "function") applyFilters();
      }, sortField, sortDir, sortTieDir);
      await new Promise(function(r) { setTimeout(r, 300); });

      await page.evaluate(function(s, h) {
        try { localStorage.setItem("pmo_print_scale", String(s)); } catch (_) {}
        try { localStorage.setItem("pmo_img_height",  String(h)); } catch (_) {}
      }, PMO_SCALE, PMO_IMG_HEIGHT);

      await page.evaluate(function() {
        if (typeof generatePDFMobile === "function") generatePDFMobile();
      });

      const overlayOk = await page.waitForSelector("#pdf-mobile-overlay.open", { timeout: 10000 })
        .then(function() { return true; })
        .catch(function() { return false; });

      if (!overlayOk) {
        const e = new Error("Sin stock en sucursales");
        e.code = "NO_STOCK";
        throw e;
      }

      // Esperar a que las fotos terminen de cargar. Antes eran 3 s fijos:
      // con ~40 imágenes pidiéndose de golpe a Google casi siempre había al
      // menos una que no llegaba a tiempo y esa card salía en blanco.
      // Ojo: acá el Service Worker está apagado (stopAllWorkers), así que el
      // reintento del sw.js no aplica y hay que reintentar del lado del DOM.
      await page.evaluate(function() {
        var root = document.getElementById("pdf-mobile-overlay");
        if (!root) return null;
        var imgs = Array.prototype.slice.call(root.querySelectorAll("img"));
        return Promise.all(imgs.map(function(img) {
          if (img.complete && img.naturalWidth > 0) return null;
          return new Promise(function(resolve) {
            var done = false;
            var cap = setTimeout(finish, 25000);
            function finish() { if (!done) { done = true; clearTimeout(cap); resolve(); } }
            function onError() {
              // Un reintento con URL nueva (Google ignora los params extra).
              if (!img.getAttribute("data-retried")) {
                img.setAttribute("data-retried", "1");
                var s = img.src;
                img.addEventListener("error", finish, { once: true });
                setTimeout(function() {
                  img.src = s + (s.indexOf("?") < 0 ? "?" : "&") + "r=1";
                }, 500);
                return;
              }
              finish();
            }
            img.addEventListener("load", finish);
            img.addEventListener("error", onError, { once: true });
            // Ya falló antes de que llegáramos a escuchar: el evento 'error'
            // no se repite, así que sin esto quedaría colgado hasta el cap.
            if (img.complete && img.getAttribute("src")) onError();
          });
        }));
      });
    }

    return await page.pdf({
      format: serverConfig.formato_pdf || "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
    });
  } finally {
    await browser.close();
  }
}

// ── PDF "Normal" — reproduce los filtros de la sesión del usuario ────────────
// A diferencia de generatePdf() (catálogo del bot, filtrado por marca +
// config del panel /admin), este toma el estado de filtros TAL CUAL lo tiene
// el usuario en su navegador (filterMarca, filterSubgrupo, searchText, orden,
// etc.) y llama a buildPdfCatalogForExport_() — el mismo layout que arma el
// botón "Normal" del catálogo, pero sin pasar por window.print(): page.pdf()
// lee directo el HTML ya armado en #print-catalog.
async function generateNormalPdf(filters) {
  const { browser, page } = await newBrowserPage(CATALOG_BASE);
  try {
    await page.waitForSelector(".product-card", { timeout: 25000 }).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 1500); });
    await page.evaluate(function() { window.alert = function() {}; });

    await page.evaluate(function(f) {
      if (Array.isArray(f.filterMarca))    window.filterMarca    = f.filterMarca;
      if (Array.isArray(f.filterGrupo))    window.filterGrupo    = f.filterGrupo;
      if (Array.isArray(f.filterSubgrupo)) window.filterSubgrupo = f.filterSubgrupo;
      if (Array.isArray(f.filterColecao))  window.filterColecao  = f.filterColecao;
      if (Array.isArray(f.filterTalle))    window.filterTalle    = f.filterTalle;
      if (Array.isArray(f.filterColor))    window.filterColor    = f.filterColor;
      if (Array.isArray(f.filterSucursal)) window.filterSucursal = f.filterSucursal;
      window.filterStockMin = (f.filterStockMin === null || f.filterStockMin === undefined) ? null : Number(f.filterStockMin);
      window.filterStockMax = (f.filterStockMax === null || f.filterStockMax === undefined) ? null : Number(f.filterStockMax);
      window.filterFoto  = f.filterFoto  || "all";
      window.filterPromo = f.filterPromo || "all";
      window.filterPrecioMin = (f.filterPrecioMin === null || f.filterPrecioMin === undefined) ? null : Number(f.filterPrecioMin);
      window.filterPrecioMax = (f.filterPrecioMax === null || f.filterPrecioMax === undefined) ? null : Number(f.filterPrecioMax);
      window.filterUltCompraDesde = f.filterUltCompraDesde || null;
      window.filterUltCompraHasta = f.filterUltCompraHasta || null;
      window.filterUltVentaDesde  = f.filterUltVentaDesde  || null;
      window.filterUltVentaHasta  = f.filterUltVentaHasta  || null;
      window.searchText  = f.searchText  || "";
      window.sortField   = f.sortField   || "id";
      window.sortDir      = f.sortDir      || "desc";
      window.sortTieDir   = f.sortTieDir   || "desc";
      window.pdfIncludePromo = !!f.pdfIncludePromo;
      window.pdfHidePrice    = !!f.pdfHidePrice;
      window.priceMode       = (f.priceMode === "mayorista") ? "mayorista" : "minorista";
      // Vista Favoritos: los favoritos viven en el localStorage del dispositivo
      // del usuario, al que este browser (recién abierto, sin ese localStorage)
      // no tiene acceso — por eso el cliente manda el objeto `favorites` tal
      // cual, y acá lo pisamos directo en window antes de armar el PDF. El resto
      // del código (renderPrintCatalogHtml_ vía isFavView) ya sabe usarlo.
      if (f.favorites && typeof f.favorites === "object") {
        window.favorites   = f.favorites;
        window.currentView = "favorites";
      }
      if (typeof applyFilters === "function") applyFilters();
    }, filters || {});
    await new Promise(function(r) { setTimeout(r, 500); });

    const cardCount = await page.evaluate(function() {
      return (typeof buildPdfCatalogForExport_ === "function")
        ? buildPdfCatalogForExport_()
        : Promise.reject(new Error("buildPdfCatalogForExport_ no definida — ¿versión vieja del catálogo?"));
    });

    if (!cardCount) {
      const e = new Error("Los filtros no dejan productos para exportar");
      e.code = "NO_CARDS";
      throw e;
    }

    return await page.pdf({
      format: serverConfig.formato_pdf || "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
    });
  } finally {
    await browser.close();
  }
}

// ── Cleanup archivos viejos cada 5 min ────────────────────────────────────────
setInterval(function() {
  const now = Date.now();
  let changed = false;
  pdfCacheMap.forEach(function(entry, key) {
    if (now > entry.expiresAt || !fs.existsSync(entry.filePath)) {
      pdfCacheMap.delete(key);
      changed = true;
    }
  });
  try {
    fs.readdirSync(TMP_DIR).forEach(function(f) {
      if (f === ".cache-index.json") return;
      const fp = path.join(TMP_DIR, f);
      try {
        if (now - fs.statSync(fp).mtimeMs > 30 * 60 * 1000) { fs.unlinkSync(fp); changed = true; }
      } catch (_) {}
    });
  } catch (_) {}
  if (changed) saveCacheIndex();
}, 5 * 60 * 1000);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/files", express.static(TMP_DIR));

app.get("/health", function(_, res) { res.json({ ok: true }); });

// /brands — raw=1 requiere PIN y devuelve todas sin filtro de marcas
app.get("/brands", async function(req, res) {
  const isRaw = req.query.raw === "1";
  if (isRaw && req.query.pin !== serverConfig.pin) return res.status(401).json({ error: "PIN incorrecto" });
  try {
    if (knownBrands.length && Date.now() - brandsLoadedAt < BRANDS_TTL) {
      let brands = knownBrands;
      if (!isRaw && serverConfig.marcas && serverConfig.marcas.length) {
        const allowed = serverConfig.marcas.map(normStr);
        brands = brands.filter(function(b) { return allowed.indexOf(normStr(b)) >= 0; });
      }
      return res.json({ ok: true, brands: brands, cached: true });
    }
    const brands = await enqueueJob(async function() {
      const { browser, page } = await newBrowserPage(buildCatalogUrl(null));
      try {
        await page.waitForSelector(".product-card", { timeout: 25000 }).catch(function() {});
        await new Promise(function(r) { setTimeout(r, 2000); });
        const stockMin = serverConfig.cantidad_min || 6;
        await page.evaluate(function(min) {
          window.filterStockMin = min;
          if (typeof applyFilters === "function") applyFilters();
        }, stockMin);
        await new Promise(function(r) { setTimeout(r, 800); });
        return await extractBrandsFromPage(page);
      } finally {
        await browser.close();
      }
    });
    knownBrands = brands;
    brandsLoadedAt = Date.now();
    let result = brands;
    if (!isRaw && serverConfig.marcas && serverConfig.marcas.length) {
      const allowed = serverConfig.marcas.map(normStr);
      result = brands.filter(function(b) { return allowed.indexOf(normStr(b)) >= 0; });
    }
    res.json({ ok: true, brands: result, cached: false });
  } catch (err) {
    console.error("brands error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// /collections — devuelve todas las colecciones disponibles en el catálogo
app.get("/collections", async function(req, res) {
  if (req.query.pin !== serverConfig.pin) return res.status(401).json({ error: "PIN incorrecto" });
  try {
    if (knownCollections.length && Date.now() - collectionsLoadedAt < BRANDS_TTL) {
      return res.json({ ok: true, collections: knownCollections, cached: true });
    }
    const collections = await enqueueJob(async function() {
      const { browser, page } = await newBrowserPage(buildCatalogUrl(null));
      try {
        await page.waitForSelector(".product-card", { timeout: 25000 }).catch(function() {});
        await new Promise(function(r) { setTimeout(r, 2000); });
        return await extractCollectionsFromPage(page);
      } finally {
        await browser.close();
      }
    });
    knownCollections = collections;
    collectionsLoadedAt = Date.now();
    res.json({ ok: true, collections: collections, cached: false });
  } catch (err) {
    console.error("collections error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// /sucursales — devuelve todas las sucursales con stock en el catálogo
app.get("/sucursales", async function(req, res) {
  if (req.query.pin !== serverConfig.pin) return res.status(401).json({ error: "PIN incorrecto" });
  try {
    if (knownSucursales.length && Date.now() - sucursalesLoadedAt < BRANDS_TTL) {
      return res.json({ ok: true, sucursales: knownSucursales, cached: true });
    }
    const sucursales = await enqueueJob(async function() {
      const { browser, page } = await newBrowserPage(buildCatalogUrl(null));
      try {
        await page.waitForSelector(".product-card", { timeout: 25000 }).catch(function() {});
        await new Promise(function(r) { setTimeout(r, 2000); });
        return await extractSucursalesFromPage(page);
      } finally {
        await browser.close();
      }
    });
    knownSucursales = sucursales;
    sucursalesLoadedAt = Date.now();
    res.json({ ok: true, sucursales: sucursales, cached: false });
  } catch (err) {
    console.error("sucursales error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// /stock
app.get("/stock", async function(req, res) {
  var brand = req.query.brand;
  if (!brand) return res.status(400).json({ error: "brand requerida" });

  try {
    var data = await enqueueJob(async function() {
      var bp = await newBrowserPage(buildCatalogUrl(brand));
      var browser = bp.browser, page = bp.page;
      try {
        await page.waitForSelector(".product-card", { timeout: 25000 }).catch(function() {});
        await new Promise(function(r) { setTimeout(r, 1500); });

        var resolvedBrand = brand;
        var brandFound = await page.evaluate(function() {
          return Array.isArray(window.filterMarca) && window.filterMarca.length > 0;
        });

        if (!brandFound) {
          var brands = await extractBrandsFromPage(page);
          if (brands.length) { knownBrands = brands; brandsLoadedAt = Date.now(); }
          var normQuery = normStr(brand);
          var exactMatch = brands.find(function(b) { return normStr(b) === normQuery; });
          if (exactMatch) {
            await page.evaluate(function(b) {
              window.filterMarca = [b];
              if (typeof applyFilters === "function") applyFilters();
            }, exactMatch);
            await new Promise(function(r) { setTimeout(r, 500); });
            resolvedBrand = exactMatch;
          } else {
            var err = new Error("Marca no encontrada");
            err.code = "NO_BRAND";
            err.suggestions = fuzzyBrands(brand, knownBrands);
            throw err;
          }
        }

        const stockMin = serverConfig.cantidad_min || 6;
        await page.evaluate(function(min) {
          window.filterStockMin = min;
          if (typeof applyFilters === "function") applyFilters();
        }, stockMin);
        await new Promise(function(r) { setTimeout(r, 500); });

        var stats = await page.evaluate(function() {
          var prods = window.filteredProducts || [];
          var articulos = 0, unidades = 0;
          prods.forEach(function(p) {
            p.colorsArr.forEach(function(c) {
              var stock = typeof getColorStock === "function" ? getColorStock(c) : (c.totalStock || 0);
              if (stock >= 6) { articulos++; unidades += stock; }
            });
          });
          return { articulos: articulos, unidades: unidades };
        });

        return { ok: true, resolvedBrand: resolvedBrand, articulos: stats.articulos, unidades: stats.unidades };
      } finally {
        await browser.close();
      }
    });
    res.json(data);
  } catch (err) {
    if (err.code === "NO_BRAND")
      return res.status(404).json({ error: "no_brand", suggestions: err.suggestions || [] });
    console.error("stock error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// /pdf
async function handlePdf(params, req, res) {
  let url          = params.url;
  const filename   = params.filename    || "catalogo.pdf";
  const delay_ms   = params.delay_ms    || 8000;
  const waitSel    = params.wait_selector;
  const catalogMode = params.catalog_mode;
  const format     = params.format;
  const phone      = params.phone;
  const brand      = params.brand;

  if (!url && !brand) return res.status(400).json({ error: "url o brand requerida" });

  if (catalogMode === "1" && brand) {
    // Marcas whitelist check
    if (serverConfig.marcas && serverConfig.marcas.length) {
      const allowed = serverConfig.marcas.map(normStr);
      if (allowed.indexOf(normStr(brand)) < 0) {
        return res.status(404).json({ error: "no_brand", suggestions: [] });
      }
    }
    // Build URL from server config (ignores URL passed by n8n)
    url = buildCatalogUrl(brand);

    const cached = getCachedPdf(brand);
    if (cached) {
      const host = req.headers.host || "192.168.90.19:3001";
      console.log("[cache hit]", brand);
      return res.json({
        ok: true,
        url: "http://" + host + "/files/" + path.basename(cached.filePath),
        fileName: filename,
        cached: true
      });
    }
  }

  if (!url) return res.status(400).json({ error: "url requerida" });

  try {
    const pdf = await enqueueJob(function() {
      return generatePdf(url, waitSel, parseInt(delay_ms, 10), catalogMode === "1", brand);
    });
    const uuid = crypto.randomUUID();
    const filePath = path.join(TMP_DIR, uuid + ".pdf");
    fs.writeFileSync(filePath, pdf);

    if (catalogMode === "1" && brand) setCachedPdf(brand, filePath);

    if (format === "url") {
      const host = req.headers.host || "192.168.90.19:3001";
      return res.json({ ok: true, url: "http://" + host + "/files/" + uuid + ".pdf", fileName: filename });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"" + filename + "\"",
      "Content-Length": pdf.length
    });
    res.end(pdf);
  } catch (err) {
    if (err.code === "NO_BRAND")
      return res.status(404).json({ error: "no_brand", suggestions: err.suggestions || [] });
    if (err.code === "NO_STOCK")
      return res.status(422).json({ error: "no_stock" });
    console.error("PDF error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

app.get("/pdf",  function(req, res) { handlePdf(req.query, req, res); });
app.post("/pdf", function(req, res) { handlePdf(req.body,  req, res); });

// /pdf/normal — botón "Normal" del catálogo web: recibe los filtros de la
// sesión del usuario tal cual y devuelve el PDF ya armado (sin diálogo de
// impresión). No usa caché ni whitelist de marcas — es 1 a 1 con lo que el
// usuario está viendo filtrado en su navegador.
app.post("/pdf/normal", async function(req, res) {
  const body     = req.body || {};
  const filters  = body.filters;
  const filename = body.filename || "catalogo.pdf";
  const format   = body.format;

  if (!filters || typeof filters !== "object") {
    return res.status(400).json({ error: "filters requerido" });
  }

  try {
    const pdf = await enqueueJob(function() {
      return generateNormalPdf(filters);
    });

    if (format === "url") {
      const uuid = crypto.randomUUID();
      const filePath = path.join(TMP_DIR, uuid + ".pdf");
      fs.writeFileSync(filePath, pdf);
      const host = req.headers.host || "192.168.90.19:3001";
      return res.json({ ok: true, url: "http://" + host + "/files/" + uuid + ".pdf", fileName: filename });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"" + filename + "\"",
      "Content-Length": pdf.length
    });
    res.end(pdf);
  } catch (err) {
    if (err.code === "NO_CARDS") return res.status(422).json({ error: "no_cards" });
    console.error("PDF normal error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// /config GET — devuelve config sin PIN
app.get("/config", function(req, res) {
  if (req.query.pin !== serverConfig.pin) return res.status(401).json({ error: "PIN incorrecto" });
  const safe = Object.assign({}, serverConfig);
  delete safe.pin;
  safe.cache_count = pdfCacheMap.size;
  res.json(safe);
});

// /config POST — guarda nueva config
app.post("/config", function(req, res) {
  const body = req.body;
  if (!body || body.pin !== serverConfig.pin) return res.status(401).json({ error: "PIN incorrecto" });

  const newConfig = {
    pin: body.new_pin || serverConfig.pin,
    access_pw: body.access_pw !== undefined ? body.access_pw : serverConfig.access_pw,
    sucursales: Array.isArray(body.sucursales) ? body.sucursales : serverConfig.sucursales,
    foto: body.foto || serverConfig.foto,
    formato_pdf: body.formato_pdf || serverConfig.formato_pdf,
    cantidad_min: parseInt(body.cantidad_min) >= 0 ? parseInt(body.cantidad_min) : serverConfig.cantidad_min,
    marcas: Array.isArray(body.marcas) ? body.marcas : serverConfig.marcas,
    colecciones: Array.isArray(body.colecciones) ? body.colecciones : (serverConfig.colecciones || []),
    pdf_sort_field: body.pdf_sort_field || serverConfig.pdf_sort_field,
    pdf_sort_dir: (body.pdf_sort_dir === "asc" || body.pdf_sort_dir === "desc")
      ? body.pdf_sort_dir : serverConfig.pdf_sort_dir,
    pdf_sort_tie_dir: (body.pdf_sort_tie_dir === "asc" || body.pdf_sort_tie_dir === "desc")
      ? body.pdf_sort_tie_dir : serverConfig.pdf_sort_tie_dir
  };

  saveConfig(newConfig);
  serverConfig = newConfig;
  knownBrands = [];
  brandsLoadedAt = 0;
  knownCollections = [];
  collectionsLoadedAt = 0;
  clearAllPdfCache();
  console.log("[config] actualizada:", JSON.stringify(newConfig));
  res.json({ ok: true });
});

// /cache/clear POST
app.post("/cache/clear", function(req, res) {
  if (!req.body || req.body.pin !== serverConfig.pin) return res.status(401).json({ error: "PIN incorrecto" });
  clearAllPdfCache();
  knownBrands = [];
  brandsLoadedAt = 0;
  knownCollections = [];
  collectionsLoadedAt = 0;
  res.json({ ok: true });
});

// /admin — panel de control
app.get("/admin", function(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PDF Service — Panel</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f0f2f5;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px}
.card{background:#fff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,.12);padding:32px;width:100%;max-width:580px}
h1{font-size:18px;font-weight:600;margin-bottom:24px;color:#1a1a2e}
h1 span{font-size:13px;font-weight:400;color:#888;margin-left:8px}
.field{margin-bottom:18px}
label{display:block;font-size:13px;font-weight:500;color:#444;margin-bottom:6px}
input[type=text],input[type=number],input[type=password],select{
  width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:7px;font-size:14px;
  font-family:inherit;transition:border .15s;background:#fff
}
input:focus,select:focus{outline:none;border-color:#5b8dee}
.hint{font-size:11px;color:#aaa;margin-top:4px}
.row{display:flex;gap:12px}
.row .field{flex:1}
.btn{display:block;width:100%;padding:11px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s}
.btn-primary{background:#5b8dee;color:#fff}
.btn-danger{background:#e74c3c;color:#fff}
.btn-sm{padding:5px 13px;font-size:12px;border-radius:6px;border:none;cursor:pointer;font-weight:500;transition:opacity .15s}
.btn-sm:hover,.btn:hover{opacity:.85}
.btn:disabled,.btn-sm:disabled{opacity:.45;cursor:default}
.cache-bar{background:#f8f9fa;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;font-size:13px}
.badge{background:#e8f0fe;color:#5b8dee;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
.msg{margin-top:14px;padding:10px 14px;border-radius:7px;font-size:13px;display:none}
.msg.ok{background:#e8f8f0;color:#27ae60}
.msg.err{background:#fde8e8;color:#e74c3c}
#panel-wrap{display:none}
.section-title{font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:.05em;margin:22px 0 12px}

/* Checkboxes */
.cb-wrap{border:1px solid #e8e8e8;border-radius:8px;padding:12px 14px;max-height:260px;overflow-y:auto}
.cb-item{display:flex;align-items:center;gap:8px;padding:5px 0;cursor:pointer;user-select:none}
.cb-item:hover{color:#5b8dee}
.cb-item input[type=checkbox]{width:15px;height:15px;cursor:pointer;accent-color:#5b8dee;flex-shrink:0}
.cb-item span{font-size:13px;line-height:1.3}
.cb-actions{display:flex;gap:8px;margin-bottom:8px;align-items:center}
.cb-search{flex:1;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;font-family:inherit}
.cb-search:focus{outline:none;border-color:#5b8dee}
.cb-loading{font-size:13px;color:#aaa;padding:8px 0}
.add-row{display:flex;gap:8px;margin-top:8px}
.add-row input{flex:1;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;font-family:inherit}
.add-row input:focus{outline:none;border-color:#5b8dee}
.add-row button{background:#5b8dee;color:#fff;border:none;border-radius:6px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer}
.add-row button:hover{opacity:.85}
</style>
</head>
<body>
<div class="card">
  <h1>PDF Service <span>Panel de control</span></h1>

  <div id="login-wrap">
    <div class="field">
      <label>PIN de acceso</label>
      <input type="password" id="pin-input" placeholder="••••" maxlength="20" autocomplete="off">
    </div>
    <button class="btn btn-primary" onclick="doLogin()">Ingresar</button>
    <div id="login-msg" class="msg"></div>
  </div>

  <div id="panel-wrap">
    <div class="cache-bar">
      <span>PDFs en caché: <span id="cache-count" class="badge">—</span></span>
      <button class="btn-sm btn-danger" onclick="clearCache()">Limpiar caché</button>
    </div>

    <div class="section-title">Sucursales</div>
    <div class="field">
      <div class="cb-actions">
        <button class="btn-sm" style="background:#e8f0fe;color:#5b8dee" onclick="selectAllSucursales()">Todas</button>
        <button class="btn-sm" style="background:#f5f5f5;color:#555" onclick="selectNoneSucursales()">Ninguna</button>
      </div>
      <div id="suc-list" class="cb-wrap"><div class="cb-loading">Cargando sucursales...</div></div>
      <div class="hint" style="margin-top:6px">Sin selección = incluye todas las sucursales</div>
    </div>

    <div class="section-title">Filtros del catálogo</div>

    <div class="row">
      <div class="field">
        <label>Fotos</label>
        <select id="foto">
          <option value="with">Con fotos</option>
          <option value="without">Sin fotos</option>
        </select>
      </div>
      <div class="field">
        <label>Formato PDF</label>
        <select id="formato_pdf">
          <option value="A4">A4</option>
          <option value="Letter">Letter</option>
          <option value="Legal">Legal</option>
          <option value="A3">A3</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label>Cantidad mínima de stock ≥</label>
      <input type="number" id="cantidad_min" min="0" max="999" style="max-width:120px">
      <div class="hint">Artículos con stock por color menor a este valor no aparecen en el catálogo</div>
    </div>

    <div class="section-title">Orden del PDF</div>
    <div class="row">
      <div class="field">
        <label>Ordenar por</label>
        <select id="pdf_sort_field">
          <option value="id">ID</option>
          <option value="codFabrica">Código</option>
          <option value="nmProduto">Producto</option>
          <option value="totalStock">Stock total</option>
          <option value="marca">Marca</option>
          <option value="grupo">Grupo</option>
          <option value="subgrupo">Subgrupo</option>
          <option value="precio">Precio</option>
        </select>
      </div>
      <div class="field">
        <label>Dirección</label>
        <select id="pdf_sort_dir">
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
      </div>
    </div>
    <div class="field">
      <label>Desempate por ID</label>
      <select id="pdf_sort_tie_dir">
        <option value="desc">Descendente (más nuevos primero)</option>
        <option value="asc">Ascendente (más antiguos primero)</option>
      </select>
      <div class="hint">Se usa cuando dos productos empatan en el campo elegido arriba.</div>
    </div>

    <div class="section-title">Colecciones</div>
    <div class="field">
      <div class="cb-actions">
        <button class="btn-sm" style="background:#e8f0fe;color:#5b8dee" onclick="selectAllColecciones()">Todas</button>
        <button class="btn-sm" style="background:#f5f5f5;color:#555" onclick="selectNoneColecciones()">Ninguna</button>
      </div>
      <div id="colecciones-list" class="cb-wrap"><div class="cb-loading">Cargando colecciones...</div></div>
      <div class="hint" style="margin-top:6px">Sin selección = incluye todas las colecciones</div>
    </div>

    <div class="section-title">Marcas permitidas</div>
    <div class="field">
      <div class="cb-actions">
        <input type="text" class="cb-search" id="marca-search" placeholder="Buscar marca..." oninput="filterMarcas()">
        <button class="btn-sm" style="background:#e8f0fe;color:#5b8dee" onclick="selectAllMarcas()">Todas</button>
        <button class="btn-sm" style="background:#f5f5f5;color:#555" onclick="selectNoneMarcas()">Ninguna</button>
      </div>
      <div id="marcas-list" class="cb-wrap"><div class="cb-loading">Cargando marcas...</div></div>
      <div class="hint" style="margin-top:6px">Sin selección = el bot acepta cualquier marca</div>
    </div>

    <div class="section-title">Seguridad</div>
    <div class="field">
      <label>Cambiar PIN del panel (dejá vacío para no cambiar)</label>
      <input type="password" id="new_pin" placeholder="Nuevo PIN" maxlength="20" autocomplete="off">
    </div>
    <div class="field">
      <label>Contraseña de acceso al catálogo</label>
      <input type="password" id="access_pw" placeholder="Igual a la del catálogo web" maxlength="64" autocomplete="off">
      <div class="hint">Debe coincidir con la contraseña configurada en Supabase. Puppeteer la usa para saltear el gate de acceso.</div>
    </div>

    <button class="btn btn-primary" onclick="saveConfig()">Guardar cambios</button>
    <div id="save-msg" class="msg"></div>
  </div>
</div>

<script>
let currentPin = "";
let allSucursales = [];
let allMarcas = [];
let allColecciones = [];
let checkedSucursales = [];
let checkedMarcas = [];
let checkedColecciones = [];

function showMsg(id, text, isOk) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg " + (isOk ? "ok" : "err");
  el.style.display = "block";
  setTimeout(function() { el.style.display = "none"; }, 4000);
}

async function doLogin() {
  const pin = document.getElementById("pin-input").value.trim();
  if (!pin) return;
  try {
    const r = await fetch("/config?pin=" + encodeURIComponent(pin));
    if (r.status === 401) { showMsg("login-msg", "PIN incorrecto", false); return; }
    const data = await r.json();
    currentPin = pin;
    document.getElementById("login-wrap").style.display = "none";
    document.getElementById("panel-wrap").style.display = "block";
    fillForm(data);
    loadMarcas();
    loadColecciones();
    loadSucursales();
  } catch(e) {
    showMsg("login-msg", "Error de conexión", false);
  }
}

async function loadSucursales() {
  try {
    const r = await fetch("/sucursales?pin=" + encodeURIComponent(currentPin));
    if (!r.ok) { document.getElementById("suc-list").innerHTML = '<div class="cb-loading">Error al cargar sucursales</div>'; return; }
    const data = await r.json();
    allSucursales = data.sucursales || [];
    renderSucursales();
  } catch(e) {
    document.getElementById("suc-list").innerHTML = '<div class="cb-loading">Error de conexión</div>';
  }
}

function renderSucursales() {
  const el = document.getElementById("suc-list");
  if (!allSucursales.length) { el.innerHTML = '<div class="cb-loading">Sin sucursales disponibles</div>'; return; }
  el.innerHTML = allSucursales.map(function(s) {
    const checked = checkedSucursales.indexOf(s) >= 0 ? "checked" : "";
    const id = "suc-" + s.replace(/[^a-z0-9]/gi, "_");
    return '<label class="cb-item"><input type="checkbox" id="' + id + '" value="' + s + '" data-sucursal ' + checked + '><span>' + s + '</span></label>';
  }).join("");
}

function selectAllSucursales() {
  document.querySelectorAll("[data-sucursal]").forEach(function(cb) { cb.checked = true; });
}
function selectNoneSucursales() {
  document.querySelectorAll("[data-sucursal]").forEach(function(cb) { cb.checked = false; });
}

function fillForm(data) {
  checkedSucursales = data.sucursales || [];
  checkedMarcas = data.marcas || [];
  checkedColecciones = data.colecciones || [];

  document.getElementById("foto").value = data.foto || "with";
  document.getElementById("formato_pdf").value = data.formato_pdf || "A4";
  document.getElementById("cantidad_min").value = data.cantidad_min != null ? data.cantidad_min : 6;
  document.getElementById("cache-count").textContent = data.cache_count || 0;
  document.getElementById("access_pw").value = data.access_pw || "";
  document.getElementById("pdf_sort_field").value = data.pdf_sort_field || "subgrupo";
  document.getElementById("pdf_sort_dir").value = data.pdf_sort_dir || "asc";
  document.getElementById("pdf_sort_tie_dir").value = data.pdf_sort_tie_dir || "desc";
}

async function loadMarcas() {
  try {
    const r = await fetch("/brands?raw=1&pin=" + encodeURIComponent(currentPin));
    if (!r.ok) { document.getElementById("marcas-list").innerHTML = '<div class="cb-loading">Error al cargar marcas</div>'; return; }
    const data = await r.json();
    allMarcas = data.brands || [];
    renderMarcas(allMarcas);
  } catch(e) {
    document.getElementById("marcas-list").innerHTML = '<div class="cb-loading">Error de conexión</div>';
  }
}

async function loadColecciones() {
  try {
    const r = await fetch("/collections?pin=" + encodeURIComponent(currentPin));
    if (!r.ok) { document.getElementById("colecciones-list").innerHTML = '<div class="cb-loading">Error al cargar colecciones</div>'; return; }
    const data = await r.json();
    allColecciones = data.collections || [];
    renderColecciones();
  } catch(e) {
    document.getElementById("colecciones-list").innerHTML = '<div class="cb-loading">Error de conexión</div>';
  }
}

function renderColecciones() {
  const el = document.getElementById("colecciones-list");
  if (!allColecciones.length) { el.innerHTML = '<div class="cb-loading">Sin colecciones disponibles</div>'; return; }
  el.innerHTML = allColecciones.map(function(c) {
    const checked = !checkedColecciones.length || checkedColecciones.indexOf(c) >= 0 ? "checked" : "";
    const id = "col-" + c.replace(/[^a-z0-9]/gi, "_");
    return '<label class="cb-item"><input type="checkbox" id="' + id + '" value="' + c + '" data-coleccion ' + checked + '><span>' + c + '</span></label>';
  }).join("");
}

function selectAllColecciones() {
  document.querySelectorAll("[data-coleccion]").forEach(function(cb) { cb.checked = true; });
}
function selectNoneColecciones() {
  document.querySelectorAll("[data-coleccion]").forEach(function(cb) { cb.checked = false; });
}
function getCheckedColecciones() {
  const all = Array.from(document.querySelectorAll("[data-coleccion]"));
  const checked = all.filter(function(cb) { return cb.checked; }).map(function(cb) { return cb.value; });
  return checked.length === all.length ? [] : checked;
}

function renderMarcas(list) {
  const el = document.getElementById("marcas-list");
  if (!list.length) { el.innerHTML = '<div class="cb-loading">Sin marcas disponibles</div>'; return; }
  el.innerHTML = list.map(function(m) {
    const checked = checkedMarcas.indexOf(m) >= 0 ? "checked" : "";
    const id = "m-" + m.replace(/[^a-z0-9]/gi, "_");
    return '<label class="cb-item"><input type="checkbox" id="' + id + '" value="' + m + '" data-marca ' + checked + '><span>' + m + '</span></label>';
  }).join("");
}

function filterMarcas() {
  const q = document.getElementById("marca-search").value.toLowerCase();
  renderMarcas(q ? allMarcas.filter(function(m) { return m.toLowerCase().indexOf(q) >= 0; }) : allMarcas);
}

function selectAllMarcas() {
  document.querySelectorAll("[data-marca]").forEach(function(cb) { cb.checked = true; });
}
function selectNoneMarcas() {
  document.querySelectorAll("[data-marca]").forEach(function(cb) { cb.checked = false; });
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && document.getElementById("login-wrap").style.display !== "none") doLogin();
});

function getCheckedSucursales() {
  return Array.from(document.querySelectorAll("[data-sucursal]:checked")).map(function(cb) { return cb.value; });
}
function getCheckedMarcas() {
  return Array.from(document.querySelectorAll("[data-marca]:checked")).map(function(cb) { return cb.value; });
}

async function saveConfig() {
  const payload = {
    pin: currentPin,
    sucursales: getCheckedSucursales(),
    foto: document.getElementById("foto").value,
    formato_pdf: document.getElementById("formato_pdf").value,
    cantidad_min: parseInt(document.getElementById("cantidad_min").value) || 0,
    colecciones: getCheckedColecciones(),
    marcas: getCheckedMarcas(),
    pdf_sort_field: document.getElementById("pdf_sort_field").value,
    pdf_sort_dir: document.getElementById("pdf_sort_dir").value,
    pdf_sort_tie_dir: document.getElementById("pdf_sort_tie_dir").value
  };
  const newPin = document.getElementById("new_pin").value.trim();
  if (newPin) payload.new_pin = newPin;
  payload.access_pw = document.getElementById("access_pw").value;

  try {
    const r = await fetch("/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (r.status === 401) { showMsg("save-msg", "PIN incorrecto", false); return; }
    if (newPin) { currentPin = newPin; document.getElementById("new_pin").value = ""; }
    document.getElementById("cache-count").textContent = 0;
    showMsg("save-msg", "Cambios guardados. Caché limpiado.", true);
  } catch(e) {
    showMsg("save-msg", "Error al guardar", false);
  }
}

async function clearCache() {
  try {
    const r = await fetch("/cache/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: currentPin })
    });
    if (!r.ok) return;
    document.getElementById("cache-count").textContent = 0;
    showMsg("save-msg", "Caché limpiado.", true);
  } catch(e) {}
}
</script>
</body>
</html>`);
});

app.listen(3001, function() { console.log("pdf-service :3001"); });
