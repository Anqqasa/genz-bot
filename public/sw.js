const CACHE_NAME = 'sipaling-ai-v4'; // FORCED UPDATE

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
  // Hanya proses GET request
  if (event.request.method !== 'GET') return;
  // Jangan cache API
  if (event.request.url.includes('supabase.co') || event.request.url.includes('/api/')) {
    return;
  }

  // Network-First Strategy agar selalu dapat update terbaru
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Simpan ke cache untuk offline
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clonedResponse);
        });
        return networkResponse;
      })
      .catch(() => {
        // Fallback ke cache jika offline
        return caches.match(event.request);
      })
  );
});
