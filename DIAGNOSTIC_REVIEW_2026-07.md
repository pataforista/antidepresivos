# Revisión Diagnóstica — Funcionalidad, Estética y Portabilidad

**Fecha:** 2026-07-10 · **Rama:** `claude/diagnostic-review-2kj2mi` · **Commit base:** `bedbe9c`

Metodología: análisis estático (sintaxis JS, validez JSON, integridad de assets del Service Worker), suite de tests (Jest), y **pruebas funcionales reales en Chromium headless** (Playwright) sobre un servidor estático con fallback SPA, en escritorio (1366×900) y móvil (390×844), tema claro y oscuro, español e inglés.

---

## 1. Resumen ejecutivo

| Área | Veredicto |
|---|---|
| Diagnóstico técnico | ✅ Sano: 20/20 tests, 0 errores JS en runtime, JSON y assets íntegros |
| Funcionalidad | ✅ Todas las rutas y flujos operativos · ⚠️ 1 bug confirmado (modal Legal no se puede cerrar) |
| Estética | ✅ Sistema de diseño coherente y bien tokenizado · ⚠️ detalles menores (botón ☕, fondo del quiz) |
| Portabilidad | ✅ PWA/offline sólidos en Cloudflare Pages · ❌ el despliegue a GitHub Pages está roto por diseño · ⚠️ `wrangler.toml` inválido |

---

## 2. Diagnóstico técnico

Verificado y en orden:

- **Tests:** `npx jest` → 20/20 pasan (normalización de riesgo, helpers de estado, coerción de dataset).
- **Sintaxis:** `node --check` sobre los 31 ficheros JS → sin errores.
- **Datos:** los 13 JSON de `data/` + `manifest.webmanifest` parsean correctamente. Paridad ES/EN completa: 45 fármacos en ambos datasets y 230/230 claves de traducción en `locales.json` sin huecos.
- **Service Worker:** los 47 recursos de `CORE_ASSETS` (`sw.js`) existen en disco — la instalación del SW no fallará por un asset renombrado.
- **Runtime:** 0 errores de consola/página en las 8 rutas, vista de detalle, comparador, quiz y cambio de idioma (excluyendo los fallos de CDN propios del sandbox de prueba, que además confirmaron la degradación elegante).

---

## 3. Funcionalidad

### 3.1 Verificado en navegador (todo funciona)

- **Home:** 45 tarjetas renderizadas; búsqueda en vivo (`sertra` → 1 resultado) conservando foco/caret; chips de filtro por tarea clínica; recientes; estado vacío con "limpiar filtros".
- **Comparador:** añadir 2 fármacos → toast "¡Comparación lista!", navegación a `/comparador?ids=…` (IDs sincronizados en URL), radar SVG + tabla de especificaciones con colores por fármaco, chips eliminables, dropdown "+ Añadir".
- **Switching:** selección desde/hacia genera plan (estrategia cross-taper con notas clínicas), botón "Descargar Plan (PDF)" presente; **sin Chart.js (offline/CDN bloqueado) degrada con mensaje claro en vez de romper** — verificado.
- **Quiz:** selección de nivel, inicio de partida, pregunta renderizada y respuesta registrada.
- **Ajustes:** panel bottom-sheet con idioma/tema/tamaño de texto/animaciones/modo compacto. Cambio a inglés re-renderiza toda la app correctamente ("Antidepressant Comparator", detalle "Ketamine…").
- **Rutas y deep links:** las 8 rutas cargan por URL directa (History API + fallback SPA); ruta desconocida (`/no-existe`) redirige limpiamente a home; migración de enlaces legacy `#/...` implementada.
- **Tema oscuro:** conmuta al instante, persiste (anti-FOUC vía `theme-bootstrap.js` síncrono), `meta theme-color` sincronizado.
- **Móvil (390px):** overflow horizontal = **0 px**; dock desplazable; grid a una columna.

### 3.2 Bugs encontrados

1. **[CONFIRMADO — medio] El modal "Aviso Legal" no se puede cerrar.**
   `gatekeeperDisclaimer.js:17` usa `onclick="this.closest('.gatekeeper').remove()"` inline. La CSP de `index.html` (`script-src 'self' …` sin `'unsafe-inline'`) **bloquea los manejadores inline**: verificado en Chromium — al pulsar ✕ el modal permanece abierto y la consola registra `Refused to execute inline event handler…`. No hay cierre por backdrop ni tecla Esc: el usuario queda atrapado y debe recargar. *Fix:* sustituir por `addEventListener` tras crear el nodo (y añadir cierre por backdrop/Esc).

2. **[latente — bajo] Botón "Reintentar" de la pantalla de error fatal.**
   `app.js:222` usa el mismo patrón `onclick="location.reload()"` inline → la misma CSP lo bloquea. Justo en el peor momento (fallo de carga de datos), el botón de recuperación no hará nada. Mismo fix.

3. **[menor] El panel de Ajustes no re-traduce sus propias etiquetas** al cambiar de idioma mientras está abierto ("Configuración", "IDIOMA"… siguen en español hasta reabrirlo). El resto de la app sí se re-renderiza.

4. **[contenido] `switching_matrix.json` solo tiene 5 pares curados** de las ~1.980 combinaciones posibles (45×44); el resto cae en la estrategia genérica. Funciona, pero conviene señalizar en la UI cuándo el plan es genérico frente a par curado por guías.

5. **[SEO] `sitemap.xml` omite `/quiz` y `/combinaciones`**, ambas rutas indexables y presentes en el dock (y `/quiz` hasta en los shortcuts del manifest).

---

## 4. Estética

### 4.1 Fortalezas

- **Sistema de diseño consistente** ("Neo Bauhaus + Naive"): tokens HSL bien organizados en `variables.css` (superficies cálidas crema, azul acero, terracota, trazo duro #2C2420), tipografías Montserrat/DM Sans con fallbacks correctos.
- **Tema oscuro completo y legible** (verificado en detalle y home); chips de riesgo conservan semántica de color (peligro/aviso/éxito).
- **Microinteracciones cuidadas:** stagger de entrada con tope de 480 ms, spotlight en tarjetas, ripple, haptics, toasts con límite de 3 y toast de deshacer.
- **El quiz tiene identidad propia** (arcade neón) que funciona como cambio de contexto deliberado.
- **Accesibilidad razonable:** skip-link, `aria-pressed` en toggles de comparación, `aria-current` en el dock, `role="search"`, `prefers-reduced-motion` respetado + toggle manual de animaciones, tamaños de texto configurables.

### 4.2 Mejoras sugeridas

1. **El botón flotante ☕ tapa contenido**: en móvil se superpone al texto de las tarjetas (columna izquierda) y en escritorio pisa la fila inferior visible. Sugerencia: ocultarlo al hacer scroll hacia abajo (como el header) o reubicarlo dentro del dock/footer en viewports estrechos.
2. **Fondo del quiz en tema claro**: fuera del contenedor oscuro del quiz se ven franjas tipo "scanline" sobre el fondo crema que parecen un artefacto más que una decisión; limitarlas al contenedor del quiz.
3. **Fondo del documento**: en páginas cortas/overscroll aparece blanco puro bajo el shell crema (visible en capturas full-page de `/switching`). Un `body { background: var(--color-bg); }` global lo elimina.
4. **Abuso de estilos inline en plantillas JS** (`app.js`, vistas): dificulta el mantenimiento, impide reutilizar tokens con media queries y obliga a mantener `'unsafe-inline'` en `style-src`. Migrar progresivamente a clases en `components.css`.
5. El radar SVG no tiene `role="img"`/`<title>` accesible; los datos existen en la tabla adyacente, pero un `aria-label` costaría poco.

---

## 5. Portabilidad

### 5.1 Fortalezas

- **PWA completa:** manifest con `id`, `shortcuts` (4), iconos 192/512, `display: standalone`, metas iOS (`apple-mobile-web-app-*`), anti-FOUC.
- **Offline real:** precache completo de app + datos (v12), stale-while-revalidate para `data/`, red-primero con fallback a `index.html` para navegación, y **degradación elegante verificada** cuando los CDN (Chart.js, ZingTouch, html2pdf) no están disponibles.
- **Vanilla JS con ES modules, sin build**: cero dependencias de runtime propias, deploy = copiar carpeta. Excelente para longevidad.
- **SPA con History API + `_redirects`** correcto para Cloudflare Pages; enlaces legacy con hash migrados.

### 5.2 Problemas

1. **[alto] El workflow de GitHub Pages (`deploy.yml`) publica una app rota.**
   - GH Pages de proyecto sirve bajo `/antidepresivos/`, pero `index.html` fija `<base href="/">` y todas las rutas/manifest asumen raíz → assets y rutas 404.
   - `_redirects` es de Cloudflare/Netlify; GH Pages no lo soporta y no hay `404.html`, así que **cualquier deep link (`/comparador`, `/farmaco/x`) devuelve 404**.
   - Además ambos workflows se disparan en cada push a `main` (doble deploy).
   *Recomendación:* eliminar `deploy.yml` (Cloudflare es el target real) o adaptarlo (base dinámica + `404.html` espejo de `index.html`).

2. **[medio] `wrangler.toml` mezcla configuración de Workers y Pages**: `type = "javascript"`, `zone_id`, `route`, `[build.upload] format = "service-worker"` son claves del Workers legacy; `pages_build_caching` y los bloques `[env.production.routes.N]` con `cache = {…}` no son sintaxis válida de Pages. Hoy el deploy funciona porque la GitHub Action ignora este fichero, pero `npx wrangler pages dev/deploy` (scripts de `package.json`) puede fallar o ignorarlo silenciosamente con wrangler ≥3. Conviene reducirlo a lo mínimo válido para Pages (o borrarlo y configurar en dashboard).

3. **[medio] Peso muerto publicado en producción:** `antidepresivos.zip` (236 KB, copia antigua de la app — incluye `sw.js` e `index.html` de febrero), `tools/create_icon.js` y `data/update_pearls.js` (scripts de desarrollo). Todo lo que está en `public/` se sirve públicamente; mover fuera del directorio desplegado.

4. **[menor] `orientation: "portrait-primary"` en el manifest** fuerza retrato en la app instalada; en tablets/escritorio (donde el comparador brilla) es contraproducente. Sugerencia: `"any"` o eliminar la clave.

5. **[menor] Icono maskable = icono normal** (`icon-192` sin zona de seguridad): en Android con máscara circular las esquinas del logo pueden recortarse. Generar variante con padding ~20%.

6. **[menor] Primera visita depende de Google Fonts y 3 CDN** (luego el SW los cachea). Autohospedar las dos fuentes (woff2 en `assets/fonts/`, carpeta que ya existe en el zip antiguo) eliminaría la última dependencia externa y el FOUT inicial.

7. **[dev] `npm run lint` es un stub** (`echo 'No linter configured'`). Añadir ESLint costaría poco y este codebase (9.900 líneas JS/CSS) ya lo amerita.

---

## 6. Priorización sugerida

| # | Acción | Área | Esfuerzo |
|---|---|---|---|
| 1 | Reemplazar los 2 `onclick` inline (modal Legal + Reintentar) por `addEventListener` | Funcionalidad | Trivial |
| 2 | Eliminar o arreglar `deploy.yml` (GitHub Pages) | Portabilidad | Bajo |
| 3 | Sacar `antidepresivos.zip`, `tools/`, `update_pearls.js` de `public/` | Portabilidad | Trivial |
| 4 | Añadir `/quiz` y `/combinaciones` al sitemap | SEO | Trivial |
| 5 | Sanear `wrangler.toml` a config Pages mínima | Portabilidad | Bajo |
| 6 | Ocultar/reubicar el botón ☕ en móvil | Estética | Bajo |
| 7 | Señalizar plan de switching "genérico" vs "curado" | Contenido | Medio |
| 8 | Fuentes autohospedadas + icono maskable con padding | Portabilidad | Medio |

---

*Informe generado a partir de ejecución real de la aplicación (servidor estático con fallback SPA + Chromium headless), no solo lectura de código. Los hallazgos marcados CONFIRMADO fueron reproducidos en navegador.*
