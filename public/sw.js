const CACHE_NAME = 'geostab-v4';
const ASSETS = [
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
            // Delete ALL caches, even old geostab ones
            return Promise.all(keyList.map((key) => {
                console.log('Deleting cache:', key);
                return caches.delete(key);
            }));
        }).then(() => {
            // Re-cache everything fresh
            return caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(ASSETS);
            });
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
