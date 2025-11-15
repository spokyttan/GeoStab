const CACHE_NAME = 'geostab-cache-v1';
const urlsToCache = [
  '/',
  '/static/styles.css', // Ejemplo: si tienes CSS personalizado
  '/static/icon-192x192.png',
  '/static/icon-512x512.png'
];

// Instalar el Service Worker y cachear el 'app shell'
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Servir desde el caché primero, luego ir a la red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
