const CACHE_NAME = 'dividamos-cta-v4';
const APP_SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

function isStaticAsset(requestUrl) {
  return /\.(?:png|jpg|jpeg|webp|gif|svg|ico|json|txt|woff2?)$/i.test(requestUrl.pathname);
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)),
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cacheName => cacheName !== CACHE_NAME)
        .map(cacheName => caches.delete(cacheName)),
    )),
  );

  self.clients.claim();
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', responseClone));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return cache.match('/') || Response.error();
        }),
    );
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (!isStaticAsset(requestUrl)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match(event.request) || cache.match('/') || Response.error();
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        if (!response.ok) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      });
    }),
  );
});