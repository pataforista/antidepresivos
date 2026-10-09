# ADR-006 — Estrategia Offline-First para uso clínico

- **Fecha**: 2026-10-04
- **Estado**: Aceptado
- **Decisores**: Lead Developer, Dr. Celada
- **Relacionado con**: [ADR-001](./ADR-001-cdn-vs-bundle.md), [ADR-002](./ADR-002-pdf-client-side.md), [ADR-005](./ADR-005-cloudflare-pages.md)

## Contexto

La app **Antidepresivos 2026** se promociona como herramienta de apoyo clínico. Su caso de uso real incluye escenarios donde la conectividad **no está garantizada**:
- Consultas rurales o en zonas con cobertura intermitente.
- Hospitales con Wi-Fi restringido o bloqueado.
- Guardias nocturnas en dispositivos personales sin datos móviles.
- Aulas o congresos donde la red colapsa por concurrencia.

Sin una estrategia offline-first sólida, la app falla exactamente donde más se necesita.
El **Roadmap y Backlog** ya identificó la generación de PDF offline como pendiente (§2), y el **Issue #2** del backlog formaliza la necesidad de cachear Chart.js y html2pdf.

Adicionalmente, hay un requisito clínico de **integridad del contenido**: un Service Worker mal configurado puede servir dosis obsoletas o interacciones desactualizadas, lo cual es un riesgo de seguridad del paciente.
La estrategia debe priorizar la **frescura de datos clínicos** sobre la velocidad de carga cuando ambos objetivos entren en conflicto.

### Estado actual
- La app es una **PWA vanilla JS + Vite** desplegada en Cloudflare Pages (ADR-005).
- No existe Service Worker funcional hoy.
- Chart.js y html2pdf se cargan vía CDN (ADR-001) y **no** se cachean offline.
- La generación de PDF es client-side (ADR-002), pero depende de una librería externa que sin caché no funciona offline.

### Restricciones de diseño

| Restricción | Implicación |
|-------------|-------------|
| Vanilla JS + Vite | No hay framework con PWA integrada (Next.js, Angular). La solución debe funcionar con `vite-plugin-pwa` o SW manual. |
| Coste $0 (ADR-005) | No se puede añadir infraestructura de pago. Workbox es open source y `vite-plugin-pwa` es gratis. |
| Contenido clínico crítico | La estrategia de caché **no puede** priorizar velocidad sobre frescura para datos clínicos. |
| Bundle mínimo (ADR-004) | Cualquier dependencia debe justificar su peso. Workbox añade ~22–38 KB gzip. |
| Cloudflare Pages | El SW debe convivir con la política de caché de Cloudflare (`_headers`). |

## Decisión

Implementar un **Service Worker con Workbox vía `vite-plugin-pwa`**, usando la estrategia **`injectManifest`** (no `generateSW`), con:

1. **Precache del app shell** (HTML, CSS, JS propios, manifest, iconos) en la instalación.
2. **Runtime caching diferenciado por tipo de recurso**:
   - **App shell** → `CacheFirst` (carga instantánea, updates vía SW lifecycle).
   - **Librerías CDN** (Chart.js, html2pdf) → `CacheFirst` con invalidación por versión (complementa Issue #2).
   - **Contenido clínico** (CSV/JSON de dosis, perlas, switchingMatrix) → `NetworkFirst` con timeout de 3s y fallback a caché.
   - **Navegación HTML** → `NetworkFirst` con fallback a `offline.html`.
3. **Página de fallback offline** (`offline.html`) precacheada.
4. **Estrategia de update controlada**: `skipWaiting: false` + `clientsClaim: false` por defecto. El usuario ve un aviso "Nueva versión disponible" y decide cuándo actualizar. Nunca se fuerza un reload en mitad de una consulta clínica.

## Justificación

### Por qué Workbox y no SW manual
- **Madurez y mantenimiento**: Workbox 7 es el estándar de facto para Service Workers desde 2023. Escribir un SW manual para cubrir precaching, versionado, limpieza de cachés, estrategias runtime y manejo de updates requiere 2000+ líneas de lógica compleja con alto riesgo de bugs sutiles.
- **Estrategias probadas**: `CacheFirst`, `NetworkFirst`, `StaleWhileRevalidate` están implementadas y testeadas por Google. Reinventarlas es coste puro sin beneficio.
- **Integración con Vite**: `vite-plugin-pwa` es la integración de referencia para Vite. El plugin genera el manifest de precache automáticamente desde el output de build, con hashes de contenido, sin intervención manual.
- **Manejo de versionado**: Workbox limpia automáticamente cachés obsoletas cuando el SW se actualiza. Un SW manual mal versionado puede dejar contenido clínico obsoleto indefinidamente.
- **Testing**: Workbox incluye utilidades de test para Service Workers, lo cual es relevante dado el nivel de disciplina de testing del proyecto (ver `GOVERNANCE.md §5`).

### Por qué `injectManifest` y no `generateSW`
`generateSW` genera todo el SW automáticamente a partir de configuración. Es más simple, pero **no permite lógica custom**.
`injectManifest` inyecta el manifest de precache en un archivo SW que **tú escribes**, dándote control total sobre los handlers de `fetch`, `install`, `activate` y la lógica de update.

Para este proyecto, el control es necesario porque:
- La lógica de update debe ser **custom**: no queremos `skipWaiting` automático (riesgo de reload durante una consulta).
- El fallback offline debe ser clínicamente apropiado (no una página genérica "sin conexión").
- La estrategia de caché para contenido clínico debe ser **distinta** de la de assets estáticos, y necesitamos poder auditarla en un solo archivo legible.

### Por qué `skipWaiting: false` + `clientsClaim: false`
`skipWaiting` fuerza que un nuevo SW tome el control **inmediatamente**, sin esperar a que se cierren las pestañas antiguas. `clientsClaim` hace que el nuevo SW controle todas las pestañas abiertas al activarse.
En una app clínica, esto es **peligroso**:
- Un médico puede estar consultando una dosis mientras el SW se actualiza en background.
- Si el SW hace reload automático, la consulta se interrumpe.
- Si los assets cacheados y el nuevo SW son incompatibles, la app puede romperse en runtime.

**Decisión**: notificar al usuario de que hay una actualización disponible y dejarle decidir cuándo recargar. Es la misma UX que usan Slack, Notion o Linear.

### Estrategia por tipo de recurso

| Recurso | Estrategia | Rationale clínico |
|---------|------------|-------------------|
| App shell (HTML/CSS/JS propio) | `CacheFirst` | Carga instantánea. Los assets tienen hash de contenido (Vite), así que un cambio de versión invalida el cache automáticamente. |
| Chart.js, html2pdf (CDN) | `CacheFirst` con versión fija | Sin conexión, estas librerías deben estar disponibles. La versión se fija en el código (Issue #1) para invalidación determinista. |
| Contenido clínico (CSV/JSON) | `NetworkFirst` (timeout 3s) | **Frescura prioritaria**. Un dato desactualizado es un riesgo clínico. Si hay red, se usa la última versión. Si no, se sirve la última cacheada. |
| Navegación HTML | `NetworkFirst` → fallback `offline.html` | El usuario siempre intenta ver la versión más reciente de la app. Si falla, ve una página de fallback útil. |
| Imágenes, fuentes, iconos | `StaleWhileRevalidate` | No son críticos clínicamente. Sirve rápido, actualiza en background. |

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|-------------|---------------------|
| **SW manual sin Workbox** | 2000+ líneas de lógica frágil. Riesgo alto de bugs en precaching, versionado y update flow. El equipo es pequeño y la deuda de mantenimiento no es asumible. |
| **`generateSW` (Workbox automático)** | No permite lógica custom. No podemos implementar update controlado ni fallback clínico específico. |
| **Serwist (fork de Workbox para Next.js)** | Diseñado para Next.js. El proyecto es vanilla + Vite. Añadiría dependencia innecesaria. |
| **`sw-precache` / `sw-toolbox`** | Deprecados por Google, reemplazados por Workbox. |
| **Caché de Cloudflare únicamente (sin SW client-side)** | No funciona offline: Cloudflare cachea en el edge, pero sin conexión el navegador no puede alcanzar el edge. Un SW es imprescindible para offline real. |
| **No hacer nada (dejar offline como "nice to have")** | Incompatible con el caso de uso clínico documentado. La app se rompería exactamente donde más se necesita. |

## Consecuencias

### ✅ Positivas
- **Offline real**: la app shell, las librerías CDN y el contenido clínico quedan disponibles sin conexión tras la primera visita con red.
- **Carga instantánea** en visitas repetidas (CacheFirst para shell + librerías).
- **Frescura clínica garantizada**: `NetworkFirst` con timeout para datos médicos asegura que un clínico online siempre ve la versión más reciente.
- **Update no invasivo**: el usuario controla cuándo actualizar. No hay reloads sorpresa durante una consulta.
- **Base para PWA instalable**: el SW es prerequisito para que la app sea instalable como PWA en Android/iOS.
- **Resuelve el Issue #2** del backlog (caché de Chart.js y html2pdf offline).

### ⚠️ Negativas / Riesgos
- **+22–38 KB gzip** por el runtime de Workbox. Es aceptable dado que se ejecuta **en el contexto del SW**, no en el main thread, y no bloquea la primera carga.
- **Complejidad de debugging**: el ciclo de vida del SW es notoriamente difícil de depurar (cachés persistentes entre versiones, estados de waiting/active, interacción con Cloudflare).
- **Riesgo de caché obsoleta**: si el versionado falla, un usuario podría ver contenido clínico desactualizado. Mitigado por `NetworkFirst` para datos médicos y por invalidación automática de Workbox para assets.
- **Interacción con Cloudflare `_headers`**: Cloudflare Pages sirve assets con `cache-control: public, max-age=0, must-revalidate` por defecto para HTML/SW. Esto es correcto: el SW debe revalidarse en cada visita para detectar updates. Los assets hashed (`/assets/*`) pueden cachearse a largo plazo (`immutable`).
- **iOS Safari quirks**: aunque iOS 16.4+ soporta SW plenamente, hay diferencias sutiles en el comportamiento de caché y en el límite de almacenamiento. Requiere testing específico.

## Mitigaciones

- [ ] **Documentar la estrategia de caché** en `docs/offline-strategy.md` con una tabla de decisión (qué se cachea, con qué estrategia, con qué TTL).
- [ ] **Implementar banner de "Nueva versión disponible"** con acción explícita de recarga. Nunca auto-reload.
- [ ] **Test offline obligatorio** en el checklist de PR para cualquier cambio que toque `sw.js`, `vite.config.js` o assets críticos.
- [ ] **Verificar interacción con Cloudflare `_headers`**: el SW debe coexistir con las políticas de caché del edge. Los assets hashed van a `/assets/*` y pueden cachearse `immutable`.
- [ ] **Test en iOS Safari** (mínimo iOS 16.4+) y Android Chrome antes de cada release que toque el SW.
- [ ] **Logs de debug en el SW** (en modo dev únicamente) para trazar hits/misses de caché.
- [ ] **Actualizar ADR-001** marcando la mitigación "Service Worker que cachee Chart.js y html2pdf" como resuelta por este ADR.
- [ ] **Actualizar `CLOUDFLARE_DEPLOYMENT_GUIDE.md`** con la política de `_headers` para SW y assets hashed.

## Notas de implementación

### Estructura de archivos esperada
```text
src/
├── sw.js                 # Service Worker custom (injectManifest)
├── pwa-register.js       # Registro del SW + lógica de update UI
public/
├── offline.html          # Fallback offline (estilo M3, con mascota)
├── manifest.webmanifest  # Manifest PWA
├── icons/                # 192x192, 512x512
vite.config.js            # vite-plugin-pwa con injectManifest
```

### Configuración base de `vite-plugin-pwa`
```js
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt', // No autoUpdate
      injectRegister: 'auto',
      manifest: { /* ... */ },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/sw.js']
      }
    })
  ]
}
```

### Estrategias en `src/sw.js`
```js
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache del app shell (inyectado por vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)

// CDN: Chart.js, html2pdf — CacheFirst con versión fija
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
  new CacheFirst({
    cacheName: 'cdn-v1',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
)

// Contenido clínico — NetworkFirst con timeout 3s
registerRoute(
  ({ url }) => url.pathname.endsWith('.csv') || url.pathname.endsWith('.json'),
  new NetworkFirst({
    cacheName: 'clinical-data-v1',
    networkTimeoutSeconds: 3
  })
)

// Navegación — NetworkFirst con fallback offline
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-v1',
    plugins: [/* offline fallback plugin */]
  })
)
```

### Flujo de update
1. SW nuevo se instala → queda en estado `waiting`.
2. La app detecta waiting vía `registration.onupdatefound` / `registration.waiting`.
3. Se muestra banner: "Nueva versión disponible. [Actualizar]".
4. Si el usuario pulsa, la app envía `SKIP_WAITING` al SW en waiting.
5. El SW se activa, dispara `controllerchange`, la app recarga.
6. Si el usuario no pulsa, el SW activa cuando cierre todas las pestañas.

## Referencias
- `vite.config.js` (configuración de vite-plugin-pwa)
- `src/sw.js` (Service Worker custom)
- `public/offline.html`
- `public/_headers` (interacción con Cloudflare)
- [vite-plugin-pwa — injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest)
- [Workbox — Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- [Workbox — Precaching](https://developer.chrome.com/docs/workbox/modules/workbox-precaching)
- [The Service Worker Lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [ADR-001](./ADR-001-cdn-vs-bundle.md) — CDN vs bundle
- [ADR-002](./ADR-002-pdf-client-side.md) — PDF client-side
- [ADR-005](./ADR-005-cloudflare-pages.md) — Cloudflare Pages
- Issue #2 en `docs/BACKLOG_ISSUES.md`
- Roadmap y Backlog del Proyecto.txt §2
