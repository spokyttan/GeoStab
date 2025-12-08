const CACHE_NAME = 'geostab-v3';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/math_engine.js',
    './js/sensor_manager.js',
    './js/sensor_integration.js'
];

// Install: cache assets
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Activate: delete old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    return self.clients.claim();
});

// Fetch: NETWORK FIRST - always try server, fallback to cache
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                // Update cache with fresh response
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
                return networkResponse;
            })
            .catch(() => caches.match(e.request))
    );
});
