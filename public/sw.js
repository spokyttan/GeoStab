const CACHE_NAME = 'geostab-v3';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/math_engine.js',
    './imagenes/muestra_taludes.png.png',
    './imagenes/prevencion.png.png',
    './imagenes/decision.png.png',
    './imagenes/economicas.png.png',
    './imagenes/zonas_seguras.png.png'
];

self.addEventListener('install', (e) => {
    self.skipWaiting(); // Force activation
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
