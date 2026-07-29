/* Service Worker: instant-feel repeat loads with smart caching */
const SW_VERSION = 'v3.2.9-coming-soon-gate-20260728';
const CORE_CACHE = `core-${SW_VERSION}`;
const IMG_CACHE = `img-${SW_VERSION}`;
const STATIC_CACHE = `static-${SW_VERSION}`;

// Compute base path so it works on custom domains and subpaths
const scopeUrl = new URL(self.registration.scope);
const basePath = scopeUrl.pathname.endsWith('/') ? scopeUrl.pathname : scopeUrl.pathname + '/';
function url(p){ return new URL(p.replace(/^\//,''), scopeUrl).toString(); }

const CORE_ASSETS = [
  url('/'),
  url('/index.html'),
  url('/portfolio.html'),
  url('/pricing.html'),
  url('/team.html'),
  url('/about.html'),
  url('/contact.html'),
  url('/booking.html'),
  url('/site-gate.js?v=20260728.1'),
  url('/exact.css?v=20260728.6'),
  url('/data/favorites.js?v=20260728.2'),
  url('/exact.js?v=20260728.11'),
  url('/Images/Logo/logobutton.png'),
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    try { await cache.addAll(CORE_ASSETS); } catch (e) { /* tolerate offline install issues */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if (![CORE_CACHE, IMG_CACHE, STATIC_CACHE].includes(k)) return caches.delete(k);
    }));
    // Enable navigation preload where supported
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch(_){}
    }
    await self.clients.claim();
  })());
});

async function limitCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  // Delete oldest first
  await cache.delete(keys[0]);
  return limitCache(cacheName, max);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const urlObj = new URL(req.url);
  // Do not intercept POST requests (forms). Let them hit the network directly.
  if (req.method === 'POST') return;

  // Only handle same-origin requests
  if (urlObj.origin !== scopeUrl.origin) return;

  // Navigation requests: network-first with fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Use preload response if available
        const preload = await event.preloadResponse;
        const fresh = preload || await fetch(req);
        // Optionally cache the page
        const cache = await caches.open(CORE_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CORE_CACHE);
        const cached = await cache.match(req) || await cache.match(url('/index.html'));
        return cached || Response.error();
      }
    })());
    return;
  }

  // Images: cache-first
  if (req.destination === 'image' || /\.(?:png|jpe?g|webp|gif|svg)$/i.test(urlObj.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req, { integrity: req.integrity, cache: 'no-store' });
        if (resp && resp.ok) {
          cache.put(req, resp.clone());
          limitCache(IMG_CACHE, 80);
        }
        return resp;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  // CSS/JS: stale-while-revalidate
  if (req.destination === 'style' || req.destination === 'script') {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((resp) => {
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // Fallback: default fetch
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
