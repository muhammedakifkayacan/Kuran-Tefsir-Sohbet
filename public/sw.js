// Kur'an & Tefsir Rehberi PWA Service Worker (Çevrim Dışı Mod Desteği)
const CACHE_NAME = 'kuran-app-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('SW precache error:', err);
      });
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache First / Stale-While-Revalidate with Offline Fallback
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests or browser extension requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Handle SPA Navigation (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // OFFLINE FALLBACK: Serve cached '/' or '/index.html'
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          return new Response('<html><body><h1>İnternetsiz Mod</h1><p>Çevrim dışısınız, uygulamanız önbellekten açılıyor.</p></body></html>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, Images, Fonts, API calls)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If found in cache, return cached version immediately, update cache in background if online
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {/* Offline: silence fetch failure */});
        return cachedResponse;
      }

      // Not in cache: fetch from network & store in cache
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Return empty offline response for failed media/API calls
          return new Response(JSON.stringify({ offline: true, message: 'Çevrim dışı mod' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          });
        });
    })
  );
});
