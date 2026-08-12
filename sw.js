/**
 * Service Worker — Catálogo de Productos PWA
 *
 * Estrategias de cache:
 *   - Shell (HTML, manifest, icons): precache + cache-first
 *   - Supabase catalog_cache: network-first, cache solo como respaldo offline
 *     (ver nota más abajo — antes era stale-while-revalidate)
 *   - Imágenes de Google Drive (lh3.googleusercontent.com): cache-first 7 días
 *
 * Para invalidar todo cuando hagas un deploy nuevo: bumpear CACHE_VERSION.
 */

// v68: botón código de barra EAN en cada línea del carrito.
const CACHE_VERSION = 'v104';
const SHELL_CACHE = 'shell-' + CACHE_VERSION;
const DATA_CACHE  = 'data-'  + CACHE_VERSION;
const IMG_CACHE   = 'img-'   + CACHE_VERSION;

const SHELL_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './manifest-mayorista.json',
  './manifest-minorista.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// 7 días en ms — TTL para imágenes
const IMG_TTL = 7 * 24 * 60 * 60 * 1000;

// =================================================================
// INSTALL — precache del shell
// =================================================================
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return cache.addAll(SHELL_URLS);
    }).then(function () {
      return self.skipWaiting();   // activa el SW nuevo inmediatamente
    })
  );
});

// =================================================================
// ACTIVATE — borrar caches viejos
// =================================================================
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== SHELL_CACHE && k !== DATA_CACHE && k !== IMG_CACHE) {
          return caches.delete(k);
        }
      }));
    }).then(function () {
      return self.clients.claim();   // toma control de las tabs abiertas
    })
  );
});

// =================================================================
// FETCH — ruteo por origen
// =================================================================
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // 1) Imágenes de Google Drive → cache-first con TTL 7 días
  if (url.hostname === 'lh3.googleusercontent.com') {
    event.respondWith(cacheFirstWithTtl_(req, IMG_CACHE, IMG_TTL));
    return;
  }

  // 2) Supabase catalog_cache → network-first, cache solo como respaldo offline.
  //    Antes era stale-while-revalidate (devolvía el cache viejo siempre que
  //    existiera). Eso rompía el chequeo liviano de updated_at en app.js —
  //    que necesita la verdad ACTUAL del servidor para decidir si hace falta
  //    bajar el catálogo completo — y también podía servir el catálogo
  //    completo desactualizado (productos/imágenes recién subidas que no
  //    aparecían hasta el siguiente ciclo de revalidación en background).
  if (url.hostname.endsWith('.supabase.co') && url.pathname.indexOf('/rest/v1/catalog_cache') >= 0) {
    event.respondWith(networkFirstWithCacheFallback_(req, DATA_CACHE));
    return;
  }

  // 3) Shell (mismo origen) → cache-first, network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req).then(function (resp) {
          // Cache opportunistic de assets del propio dominio
          if (resp.ok) {
            var copy = resp.clone();
            caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
          }
          return resp;
        }).catch(function () {
          // Offline + no en cache → si es navegación, devolver index.html
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
    return;
  }

  // 4) Cualquier otra cosa → pasa al network sin tocar
});

// =================================================================
// Helpers de estrategia
// =================================================================
function cacheFirstWithTtl_(req, cacheName, ttlMs) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(req).then(function (cached) {
      if (cached) {
        var dateHeader = cached.headers.get('sw-cache-date');
        if (dateHeader && (Date.now() - parseInt(dateHeader, 10)) < ttlMs) {
          return cached;
        }
      }
      return fetch(req).then(function (resp) {
        if (resp.ok || resp.type === 'opaque') {
          var headers = new Headers(resp.headers);
          headers.set('sw-cache-date', String(Date.now()));
          // No podemos modificar headers de respuesta opaca, pero la guardamos igual
          var clone = resp.clone();
          if (resp.type === 'basic' || resp.type === 'cors') {
            clone.blob().then(function (blob) {
              var wrapped = new Response(blob, {
                status: resp.status,
                statusText: resp.statusText,
                headers: headers
              });
              cache.put(req, wrapped);
            });
          } else {
            cache.put(req, clone);
          }
        }
        return resp;
      }).catch(function () {
        return cached;   // si network falla, devolver lo que sea que tengamos
      });
    });
  });
}

function networkFirstWithCacheFallback_(req, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return fetch(req).then(function (resp) {
      if (resp.ok) cache.put(req, resp.clone());
      return resp;
    }).catch(function () {
      return cache.match(req);   // offline → lo último que tengamos (puede no existir)
    });
  });
}

// =================================================================
// MESSAGE — permite al cliente forzar skipWaiting o limpiar caches
// =================================================================
self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHES') {
    caches.keys().then(function (keys) {
      keys.forEach(function (k) { caches.delete(k); });
    });
  }
});
