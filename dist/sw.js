// Service Worker básico para PWA
// Permite instalar la app en el celular como app nativa

const CACHE_NAME = 'aye-v1781987236768';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Eliminar todos los cachés viejos
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Las llamadas a la API siempre van a la red
  if (event.request.url.includes('/api/')) return;

  // Los assets de Vite (con hash en el nombre) se pueden cachear
  const url = new URL(event.request.url);
  const isAsset = url.pathname.startsWith('/assets/');

  if (isAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
  }
  // Todo lo demás (index.html, API) va directo a la red
});
