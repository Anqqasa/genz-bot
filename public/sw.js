const CACHE_NAME = 'sipaling-ai-v1';

// Daftar file yang ingin dicache
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Hanya proses GET request untuk page / asset statis (bukan API POST)
  if (event.request.method !== 'GET') return;
  // Jangan cache request Supabase / API external
  if (event.request.url.includes('supabase.co') || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cache if available
        if (response) {
          return response;
        }
        // Else fetch from network
        return fetch(event.request).catch(() => {
          // Fallback if offline
        });
      })
  );
});
