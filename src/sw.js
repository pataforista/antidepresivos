/**
 * Service Worker — Antidepresivos 2026
 *
 * Estrategia: ver docs/adr/ADR-006-offline-first.md
 *
 * PR 1 (este): precache del app shell + NetworkFirst para navegación.
 * PR 2:      + CacheFirst para CDN (Chart.js, html2pdf)
 * PR 2:      + NetworkFirst para contenido clínico (.csv, .json)
 * PR 3:      + UI de update + SKIP_WAITING desde cliente
 * PR 4:      + offline.html como fallback de navegación
 */

import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching'
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// --- 1. Precache del app shell -------------------------------------------
precacheAndRoute(self.__WB_MANIFEST)

// Limpia cachés de versiones anteriores del SW automáticamente.
cleanupOutdatedCaches()

// --- 2. Navegación --------------------------------------------------------
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'pages-v1',
    networkTimeoutSeconds: 3
  }),
  {
    // Fallback si NetworkFirst falla (offline y no hay caché de la ruta)
    // Workbox sirve /offline.html desde el precache.
    denylist: [/^\/_/, /\/api\//, /\/sw\.js$/]
  }
)
registerRoute(navigationRoute)

// --- 3. Ciclo de vida: SKIP_WAITING --------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// --- 4. Logs de debug ----------------------------------------------------
const DEBUG = false
if (DEBUG) {
  self.addEventListener('install', () => console.log('[SW] install'))
  self.addEventListener('activate', () => console.log('[SW] activate'))
  self.addEventListener('fetch', (e) => console.log('[SW] fetch:', e.request.url))
}

// --- 5. CDN: Chart.js y html2pdf (CacheFirst) ----------------------------
// ADR-001: estas librerías viven en jsdelivr con versión fija en el HTML.
// ADR-006: CacheFirst para que funcionen 100% offline tras la primera visita.
//
// El nombre del cache incluye "v1" — si cambiamos de versión de CDN, hay que
// bumpear a "v2" para invalidar el cache viejo.
const CDN_VERSION = 'v1'
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
  new CacheFirst({
    cacheName: `cdn-${CDN_VERSION}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60  // 1 año — versiones fijas no cambian
      })
    ]
  })
)

// --- 6. Contenido clínico (.csv, .json) — NetworkFirst -------------------
// ADR-006 §Decisión: la frescura clínica es prioritaria sobre la velocidad.
// Si hay red, se sirve la última versión. Si no, se sirve lo cacheado.
// Timeout 3s para no bloquear la UI en redes lentas.
registerRoute(
  ({ url, request }) => {
    if (url.pathname.endsWith('.csv') || url.pathname.endsWith('.json')) return true
    if (request.destination === 'document') return false  // no interceptar HTML
    return false
  },
  new NetworkFirst({
    cacheName: 'clinical-data-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,  // 7 días — datos clínicos caducan rápido
        purgeOnQuotaError: true            // si el navegador se queda sin espacio, libera
      })
    ]
  })
)

// --- 7. Imágenes y fuentes (StaleWhileRevalidate) ------------------------
// No críticos clínicamente. Cache rápido, actualización en background.
registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'assets-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60  // 30 días
      })
    ]
  })
)

// Si la navegación falla completamente (offline + sin caché de la ruta),
// servir /offline.html desde el precache.
setCatchHandler(async ({ event }) => {
  if (event.request.destination === 'document') {
    const cached = await matchPrecache('/offline.html')
    if (cached) return cached
  }
  return Response.error()
})
