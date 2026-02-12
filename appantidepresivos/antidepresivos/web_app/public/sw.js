const CACHE_NAME = 'antidepresivos-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/icon_dr_mario_8bit.png',
    './src/app.js',
    './src/styles/reset.css',
    './src/styles/variables.css',
    './src/styles/layout.css',
    './src/styles/components.css',
    './src/core/dataLoader.js',
    './src/core/normalize.js',
    './src/core/selectors.js',
    // Framework/Helpers
    './src/core/store.js',
    './src/core/router.js',
    './src/core/policy.js',
    './src/ui/gatekeeperDisclaimer.js',
    './src/ui/detailView.js',
    './src/ui/modalInfo.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Data Strategy: Stale-While-Revalidate (good for json data that updates but needs offline)
    if (url.pathname.includes('/data/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    const networkFetch = fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return cachedResponse || networkFetch;
                });
            })
        );
        return;
    }

    // Assets Strategy: Cache First
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
