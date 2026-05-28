const CACHE_NAME = 'antidepresivos-v7';

// Recursos locales críticos: si falla alguno, la instalación se reintenta.
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './src/vendor/ogl.mjs',
    // Arranque anti-FOUC
    './src/theme-bootstrap.js',
    // Estilos
    './src/styles/reset.css',
    './src/styles/variables.css',
    './src/styles/layout.css',
    './src/styles/components.css',
    './src/styles/playful.css',
    './src/styles/quiz.css',
    // Núcleo
    './src/app.js',
    './src/ribbons.js',
    './src/core/dataLoader.js',
    './src/core/i18n.js',
    './src/core/normalize.js',
    './src/core/policy.js',
    './src/core/pubsub.js',
    './src/core/router.js',
    './src/core/selectors.js',
    './src/core/store.js',
    './src/core/utils.js',
    // Vistas / UI
    './src/ui/ajusteView.js',
    './src/ui/bottomSheet.js',
    './src/ui/coffeePopup.js',
    './src/ui/comboView.js',
    './src/ui/detailView.js',
    './src/ui/gatekeeperDisclaimer.js',
    './src/ui/interactView.js',
    './src/ui/modalInfo.js',
    './src/ui/quizView.js',
    './src/ui/switchView.js',
    './src/ui/visuals.js',
    './src/ui/guiasView.js',
    // Datos (los que carga dataLoader.js)
    './data/manifest.json',
    './data/schemaUI.schema001.js',
    './data/legal.legal001.json',
    './data/locales.json',
    './data/dataset.antidepresivos.v1.0.0.json',
    './data/dataset.en.json',
    './data/switching_matrix.json',
    './data/synergies.json',
    './data/glosario_terminos.json',
    './data/criterios_inclusion_exclusion.json',
    './data/guias_clinicas.json'
];

// Recursos externos (CDN/fuentes): best-effort. El navegador los descarga una
// vez online y quedan disponibles sin conexión; si fallan, NO rompen la instalación.
const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/zingtouch@1.0.6/dist/zingtouch.min.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(CORE_ASSETS);
            // Best-effort: cachear CDN sin hacer fallar la instalación.
            await Promise.allSettled(
                EXTERNAL_ASSETS.map(url =>
                    fetch(url, { mode: 'cors' })
                        .then(res => { if (res && res.ok) return cache.put(url, res.clone()); })
                        .catch(() => {})
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(cacheNames.map((name) => name !== CACHE_NAME ? caches.delete(name) : null))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // 1) Datos: stale-while-revalidate (offline + actualización en segundo plano).
    if (url.pathname.includes('/data/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(req).then(cached => {
                    const network = fetch(req).then(res => {
                        if (res && res.ok) cache.put(req, res.clone());
                        return res;
                    }).catch(() => cached);
                    return cached || network;
                })
            )
        );
        return;
    }

    // 2) Navegación (SPA): red primero, con fallback a index.html en cache si falla.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() =>
                caches.match(req).then(c => c || caches.match('./index.html'))
            )
        );
        return;
    }

    // 3) Resto (módulos, estilos, CDN, fuentes): cache-first con caché en runtime.
    event.respondWith(
        caches.match(req).then(cached => {
            if (cached) return cached;
            return fetch(req).then(res => {
                // Cachea respuestas válidas u opacas (CDN/fuentes) para uso offline.
                if (res && (res.ok || res.type === 'opaque')) {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                }
                return res;
            }).catch(() => cached);
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
