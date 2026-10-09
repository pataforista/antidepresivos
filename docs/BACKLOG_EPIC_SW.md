# 📦 Issue de Implementación — Service Worker Offline-First

**Título**: `feat(pwa): implementar Service Worker offline-first con Workbox`
**Labels**: `enhancement`, `nivel-N2`, `pwa`, `offline-first`
**Milestone sugerido**: `v0.3.0 — Offline-First`
**Origen**: [ADR-006](../adr/ADR-006-offline-first.md) (Aceptado)

---

## Cuerpo del issue (copiar-pegar)

```markdown
## 🎯 Objetivo

Implementar la estrategia offline-first definida en [ADR-006](../adr/ADR-006-offline-first.md), usando **Workbox vía `vite-plugin-pwa` con estrategia `injectManifest`**.

Al terminar este issue:

- La app shell carga sin conexión tras la primera visita con red.
- Chart.js y html2pdf quedan disponibles offline (resuelve también el Issue #2 del backlog).
- El contenido clínico (CSV/JSON) usa `NetworkFirst` con timeout de 3s, priorizando frescura.
- El usuario recibe un banner de "Nueva versión disponible" y decide cuándo actualizar (nunca auto-reload).
- Existe una página `offline.html` útil y con estética M3.

## 📚 Contexto y decisión arquitectónica

Este issue implementa el ADR-006. Antes de empezar, **leer el ADR completo** para entender:

- Por qué Workbox y no SW manual.
- Por qué `injectManifest` y no `generateSW`.
- Por qué `skipWaiting: false` + `clientsClaim: false` (protección del flujo clínico).
- Tabla de estrategias por tipo de recurso.

## 🧭 Alcance

### Incluye

- Instalación y configuración de `vite-plugin-pwa` con `strategies: 'injectManifest'`.
- Service Worker custom en `src/sw.js` con las 4 estrategias del ADR-006.
- Registro del SW en `src/pwa-register.js` con lógica de update prompt.
- Banner UI "Nueva versión disponible" con botón de recarga.
- Página `public/offline.html` con estética M3 + mascota gráfica.
- Manifest PWA en `public/manifest.webmanifest` (nombre, icons, theme_color, display: standalone).
- Iconos PWA 192×192 y 512×512 (reutilizar la mascota).
- Verificación de interacción con `public/_headers` de Cloudflare.
- Documentación en `docs/offline-strategy.md`.

### No incluye

- Sincronización en background (`Background Sync API`) — futuro.
- Push notifications — fuera de alcance.
- Caché de Google Fonts u otros recursos externos no críticos — futuro.
- Migración de CDN a bundle local (decisión cerrada en ADR-001).
- Modo "solo offline" o "solo online" configurable — no aplica.

## 🔧 Plan técnico

### 1. Dependencias a instalar

```bash
npm install --save-dev vite-plugin-pwa workbox-window
```

> `workbox-window` es necesario para la lógica de update desde la app.
> El runtime de Workbox se inyecta automáticamente en el SW vía `injectManifest`, no hay que importarlo en `package.json`.

### 2. Configuración de `vite.config.js`

```js
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: false,  // usamos public/manifest.webmanifest manual
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/sw.js', '**/offline.html']
      },
      devOptions: {
        enabled: false  // SW deshabilitado en dev para evitar cachés fantasma
      }
    })
  ]
}
```

### 3. Estructura de archivos

```text
src/
├── sw.js                    # Service Worker custom (nuevo)
└── pwa-register.js          # Registro + UI de update (nuevo)
public/
├── offline.html             # Fallback offline (nuevo)
├── manifest.webmanifest     # Manifest PWA (nuevo)
└── icons/
    ├── icon-192.png         # (nuevo — reutilizar mascota)
    └── icon-512.png         # (nuevo — reutilizar mascota)
```

### 4. `src/sw.js` — Service Worker

Implementar las 4 estrategias de [ADR-006 §Decisión]:

| Tipo | Estrategia | Cache name |
|------|-----------|------------|
| App shell | `precacheAndRoute` (Workbox auto) | `workbox-precache-v2` |
| CDN (jsdelivr) | `CacheFirst` + `ExpirationPlugin(30d)` | `cdn-v1` |
| Contenido clínico (`.csv`, `.json`) | `NetworkFirst` con `networkTimeoutSeconds: 3` | `clinical-data-v1` |
| Navegación (`.mode === 'navigate'`) | `NetworkFirst` con fallback a `/offline.html` | `pages-v1` |
| Imágenes/fuentes | `StaleWhileRevalidate` | `assets-v1` |

Además:

- **Logs de debug** condicionales (`if (import.meta.env.DEV)` — aunque el SW corre sin Vite, se puede usar un flag manual).
- **Handler `message`** para recibir `SKIP_WAITING` desde la app.
- **Comentarios explicativos** en cada bloque (el SW es un archivo crítico; debe ser auditable).

### 5. `src/pwa-register.js` — Update UX

Implementar el flujo de update controlado de [ADR-006 §Notas de implementación → Flujo de update]:

1. Registrar el SW con `workbox-window`.
2. Detectar `waiting` (`wb.addEventListener('waiting', ...)`).
3. Mostrar banner UI: *"Nueva versión disponible. [Actualizar] [Descartar]"*.
4. Si pulsa "Actualizar" → `wb.messageSkipWaiting()` + reload.
5. Si no pulsa → el SW se activa al cerrar todas las pestañas.

**Regla crítica**: **NUNCA** hacer `window.location.reload()` automático. Solo tras acción explícita del usuario.

### 6. `public/offline.html` — Página de fallback

Debe:

- Usar tokens M3 de `src/styles/variables.css` (copiar los relevantes inline, ya que es HTML estático servido desde caché).
- Mostrar la **mascota gráfica** con un mensaje amigable ("Sin conexión — mostrando datos en caché").
- Botón "Reintentar" que hace `location.reload()`.
- Enlace a la última versión disponible (si hay caché).
- **No** cargar scripts externos (debe funcionar al 100% offline).

### 7. `public/manifest.webmanifest`

```json
{
  "name": "Antidepresivos 2026",
  "short_name": "Antidepresivos",
  "description": "Herramienta clínica de apoyo para prescripción de antidepresivos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFBFE",
  "theme_color": "#6750A4",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 8. Verificar interacción con Cloudflare `public/_headers`

Añadir reglas para que:

- `/sw.js` se sirva con `Cache-Control: public, max-age=0, must-revalidate` (obligatorio para detectar updates).
- `/assets/*` (hashed por Vite) se sirva con `Cache-Control: public, max-age=31536000, immutable`.
- El resto mantiene la política por defecto de Pages.

## ✅ Criterios de aceptación

### Funcionalidad offline

- [ ] Tras cargar la app una vez con red, desconectar y recargar:
  - [ ] La app shell carga correctamente.
  - [ ] `switchingMatrix` funciona.
  - [ ] Los gráficos Chart.js se renderizan.
  - [ ] La exportación PDF funciona.
- [ ] En la pestaña Network de DevTools (modo offline) no hay errores rojos.
- [ ] Al navegar a una ruta no cacheada, aparece `offline.html` con la mascota.

### Funcionalidad online / frescura clínica

- [ ] Con red, un CSV modificado en el servidor se refleja en la siguiente carga (NetworkFirst con timeout 3s).
- [ ] Si la red es lenta (>3s), se sirve la versión cacheada sin bloqueo.
- [ ] Los assets hashed (`/assets/*.js`) se sirven desde caché sin revalidación.

### Update UX

- [ ] Al desplegar una nueva versión, el usuario ve el banner "Nueva versión disponible".
- [ ] Pulsar "Actualizar" recarga la app con la nueva versión.
- [ ] Ignorar el banner: el SW se activa al cerrar todas las pestañas.
- [ ] **Nunca** hay reload automático (verificar en logs).

### PWA instalable

- [ ] Chrome (desktop y Android) ofrece "Instalar app" en la barra de direcciones.
- [ ] Safari iOS 16.4+ permite "Añadir a pantalla de inicio".
- [ ] Los iconos se muestran correctamente en la pantalla de inicio.

### Calidad

- [ ] `npm run lint` → 0 warnings.
- [ ] `npm test` → verde.
- [ ] `npm run build` produce `dist/sw.js` con el manifest de precache inyectado.
- [ ] El bundle JS principal no crece más de +5 KB gzip.

## 🧪 Testing

### Checklist de pruebas manuales obligatorias antes de mergear

| Escenario | Chrome | Safari iOS | Firefox |
|-----------|:------:|:----------:|:-------:|
| Primera carga online | [ ] | [ ] | [ ] |
| Recarga offline | [ ] | [ ] | [ ] |
| PDF offline | [ ] | [ ] | [ ] |
| Chart.js offline | [ ] | [ ] | [ ] |
| Update banner aparece | [ ] | [ ] | [ ] |
| Update aplicado tras click | [ ] | [ ] | [ ] |
| Instalación como PWA | [ ] | [ ] | N/A |

**iOS Safari**: probar en dispositivo real (no solo simulador). El simulador tiene comportamientos de caché distintos.

### Test en preview deployment

Antes de mergear:

1. Abrir el preview URL del PR.
2. Hacer `Ctrl+Shift+R` para forzar SW nuevo.
3. Verificar en DevTools → Application → Service Workers que el SW está activo.
4. Revisar cachés creadas (`cdn-v1`, `clinical-data-v1`, `pages-v1`, `assets-v1`).
5. Activar "Offline" en DevTools → recargar → verificar que todo funciona.

## 📚 Documentación

- [ ] Crear `docs/offline-strategy.md` con:
  - Tabla de estrategias por tipo de recurso.
  - Cómo testear offline en local.
  - Cómo forzar un update del SW en desarrollo (`Ctrl+Shift+R` + DevTools → Application → Service Workers → Unregister).
  - Cómo funciona el flujo de update UX.
- [ ] Actualizar `CLOUDFLARE_DEPLOYMENT_GUIDE.md` con la política de `_headers` para SW y assets hashed.
- [ ] Actualizar `docs/adr/ADR-006-offline-first.md` cambiando estado de "Aceptado" a "Implementado" cuando el issue cierre.
- [ ] Añadir entrada en `CHANGELOG.md` (se genera automáticamente con el commit `feat(pwa):`).

## ⚠️ Riesgos conocidos

| Riesgo | Mitigación |
|--------|-----------|
| SW cachea versión obsoleta de `switchingMatrix` y sirve datos incorrectos | `NetworkFirst` con timeout 3s para `.csv`/`.json`. Nunca cachear agresivamente contenido clínico. |
| iOS Safari con caché fantasma entre versiones | Testing en dispositivo real. DevTools de Safari permite inspeccionar SW. |
| Interacción conflictiva con `_headers` de Cloudflare | Documentar política y verificar en preview deployment. |
| SW bloqueado en estado `waiting` indefinidamente si el usuario no cierra pestañas | El SW se activa automáticamente cuando todas las pestañas del scope se cierran. Además, el banner permite forzar. |
| Usuarios que ya visitaron la app antes del SW tienen la versión antigua cacheada por el navegador | En la primera visita tras el deploy, el SW se registra. Segunda visita ya está bajo control del SW. |

## 🚦 Sub-tareas (checklist de progreso)

- [ ] **Setup** — `npm install` de `vite-plugin-pwa` y `workbox-window`; configurar `vite.config.js`.
- [ ] **SW básico** — `src/sw.js` con precache del app shell + estrategia para navegación. Verificar que la app carga con SW activo.
- [ ] **CDN caching** — añadir `CacheFirst` para jsdelivr. Verificar offline de Chart.js y html2pdf.
- [ ] **Contenido clínico** — añadir `NetworkFirst` para `.csv` y `.json` con timeout 3s.
- [ ] **Update UX** — `src/pwa-register.js` + banner UI. Verificar flujo manualmente.
- [ ] **offline.html** — página de fallback con mascota y tokens M3.
- [ ] **Manifest + iconos** — `manifest.webmanifest` + iconos 192/512. Verificar instalación PWA.
- [ ] **`_headers`** — verificar y ajustar política de caché en Cloudflare.
- [ ] **Documentación** — `docs/offline-strategy.md`.
- [ ] **Testing cross-browser** — tabla de pruebas completa.
- [ ] **Preview deployment** — verificar todo en el preview URL del PR.
- [ ] **Merge a main** — mergear con commit `feat(pwa): implementar Service Worker offline-first`.

## 🔗 Referencias

- [ADR-006 — Estrategia Offline-First](../adr/ADR-006-offline-first.md)
- [ADR-001 — CDN vs bundle](../adr/ADR-001-cdn-vs-bundle.md) (mitigación cerrada por este issue)
- [ADR-002 — PDF client-side](../adr/ADR-002-pdf-client-side.md)
- [Issue #2 del BACKLOG_ISSUES.md](../BACKLOG_ISSUES.md) — Service Worker caché de CDN
- [vite-plugin-pwa — injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest)
- [Workbox — Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- [The Service Worker Lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [Cloudflare Pages — Headers](https://developers.cloudflare.com/pages/configuration/headers/)
```
