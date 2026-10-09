# Backlog de Issues de Mitigación

Este documento contiene los 6 issues críticos derivados de los ADRs (Architecture Decision Records). 
Copia cada bloque para abrir un nuevo issue en GitHub.

---

## 🔴 Issue #1 — Añadir SRI + crossorigin a los `<script>` de CDN
**Labels**: `security`, `tech-debt`, `nivel-N2`
**Origen**: ADR-001 (docs/adr/ADR-001-cdn-vs-bundle.md)

### Cuerpo:
```markdown
## 🎯 Problema o necesidad
Las librerías **Chart.js** y **html2pdf** se cargan desde CDN sin atributos `integrity` ni `crossorigin`. Esto expone al proyecto a un ataque de supply chain: si la CDN se compromete, un atacante puede inyectar código arbitrario en la app clínica.

## 💡 Propuesta
Añadir SRI (Subresource Integrity) y `crossorigin="anonymous"` a los `<script>` que cargan estas librerías en `src/index.html` (o donde corresponda). Ejemplo del cambio esperado:
```html
<script 
  src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" 
  integrity="sha384-<hash>" 
  crossorigin="anonymous" 
  defer
></script>
```

## 🧭 Alcance
- **Incluye**:
  - Fijar la versión exacta de cada CDN (no latest, no rangos).
  - Calcular el hash SRI para cada librería y versión.
  - Añadir integrity + crossorigin a los `<script>` y `<link>` de CSS si aplica.
  - Documentar el procedimiento para actualizar los hashes cuando se bumpee versión.
- **No incluye**:
  - Migrar a bundle local (eso lo cubre otro issue / decisión futura).
  - Añadir CSP completa (eso es Issue #6).

## 🎨 Impacto en UI/UX
- [x] No toca UI

## 🔧 Impacto técnico
- Archivos afectados: `src/index.html`, posiblemente `src/lib/pdfExport.js` (imports dinámicos).
- ¿Nueva dependencia? No.
- ¿Toca CI/CD? No.

## ✅ Criterios de aceptación
- [ ] Todos los `<script>` y `<link>` externos tienen integrity + crossorigin.
- [ ] Versiones fijadas (sin latest, sin ^, sin ~).
- [ ] Documento breve en `docs/sri-update.md` con el comando para calcular hashes.
- [ ] Verificación manual en navegador: DevTools → Network confirma que las librerías se cargan sin errores de integridad.
- [ ] Test de regresión: app funciona con CDN cacheada y con CDN bypass (hard reload).

## 📚 ¿Requiere doc?
- [ ] Sí → `docs/sri-update.md` (nuevo) y actualizar `docs/adr/ADR-001-cdn-vs-bundle.md` (marcar mitigación como completa).

## 🔗 Referencias
- ADR-001 §Mitigaciones obligatorias
- [MDN — Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
```

---

## 🔴 Issue #2 — Service Worker que cachee Chart.js y html2pdf para offline real
**Labels**: `tech-debt`, `nivel-N2`, `enhancement`
**Origen**: ADR-001

### Cuerpo:
```markdown
## 🎯 Problema o necesidad
La app se promociona como **offline-first** (ver ADR pendiente 006), pero las librerías **Chart.js** y **html2pdf** se cargan desde CDN. Si el usuario abre la app sin conexión (o con la CDN caída), los gráficos y la exportación PDF **no funcionan**. Esto rompe la promesa clínica de uso en entornos con conectividad intermitente (hospitales, consultas rurales).

## 💡 Propuesta
Configurar el **Service Worker** para precachear las URLs exactas de las librerías CDN con estrategia **cache-first**. Al instalar la app por primera vez con conexión, las librerías quedan disponibles offline indefinidamente (hasta invalidación manual por versión).

Estrategia recomendada:
1. Cache-first para URLs de CDN con hash SRI conocido.
2. Fallback a network si la URL no está en el cache (versión nueva).
3. Invalidación por nombre de cache versionado (ej. `cdn-v4.4.0-chart`).

## 🧭 Alcance
- **Incluye**:
  - Añadir URLs de Chart.js y html2pdf al manifest de precache del SW.
  - Estrategia cache-first con invalidación por versión.
  - Fallback graceful si la versión cambió (mostrar mensaje "conéctate para actualizar").
  - Test offline manual en DevTools (Application → Service Workers → Offline).
- **No incluye**:
  - Precaching de Google Fonts u otros recursos externos (issue futuro).
  - Migración a Workbox (decisión en ADR-006, aún no tomada).

## 🎨 Impacto en UI/UX
- [ ] No toca UI
- [x] Toca UI menor → mostrar estado "offline, datos en caché" cuando corresponda

## 🔧 Impacto técnico
- Archivos afectados: `public/sw.js` (o equivalente), posiblemente `public/manifest.json`.
- ¿Nueva dependencia? Evaluar Workbox en ADR-006. Este issue asume SW manual.

## ✅ Criterios de aceptación
- [ ] Con la app cargada una vez online, se puede desconectar y:
  - [ ] Los gráficos Chart.js se renderizan correctamente.
  - [ ] La exportación PDF funciona.
- [ ] Actualizar la versión de Chart.js en el código **invalida** el cache antiguo automáticamente.
- [ ] Logs del SW registran hits/misses del cache para debug.

## 📚 ¿Requiere doc?
- [ ] Sí → comentario en `public/sw.js` explicando la estrategia de cache de CDN, y actualizar ADR-001 (marcar mitigación como completa).

## 🔗 Referencias
- ADR-001 §Mitigaciones obligatorias
- [MDN — Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)

> **Decisión arquitectónica**: ver [ADR-006](../adr/ADR-006-offline-first.md) 
> para la estrategia completa de offline-first y las estrategias de caché por tipo de recurso.
```

---

## 🔴 Issue #3 — CSS @media print para PDF estable entre navegadores
**Labels**: `tech-debt`, `nivel-N2`
**Origen**: ADR-002

### Cuerpo:
```markdown
## 🎯 Problema o necesidad
La generación de PDF con **html2pdf** corre en el cliente (ADR-002), lo que significa que el **render final depende del motor del navegador** (Chrome/Blink, Safari/WebKit, Firefox/Gecko). Sin una hoja de estilos `@media print` explícita, el PDF resultante puede variar en:
- Saltos de página (cortes en medio de una sección clínica)
- Márgenes y paddings
- Colores (algunos navegadores "imprimen" en blanco y negro)

Para un reporte clínico, esta inconsistencia es inaceptable.

## 💡 Propuesta
Crear una hoja `src/styles/print.css` cargada con `media="print"` que garantice un layout **determinista** en el PDF.

## 🧭 Alcance
- **Incluye**:
  - Archivo `print.css` con reglas para layout determinista.
  - Importarlo en `index.html` con `<link rel="stylesheet" media="print" href="...">`.
  - Test manual en Chrome, Safari, Firefox antes de cada release.
- **No incluye**:
  - Migrar de html2pdf a otro motor.

## 🎨 Impacto en UI/UX
- [x] Toca UI (solo en modo impresión / export PDF)

## 🔧 Impacto técnico
- Archivos afectados: `src/styles/print.css` (nuevo), `src/index.html`.

## ✅ Criterios de aceptación
- [ ] PDF generado en Chrome tiene la misma estructura que en Safari y Firefox.
- [ ] Ninguna tabla o bloque clínico se corta a mitad de página.
- [ ] Colores de severidad (ej. rojo de interacción crítica) se preservan en el PDF.
- [ ] La dock inferior y los FABs no aparecen en el PDF.
```

---

## 🟡 Issue #4 — Footer con versión + fecha en PDFs exportados
**Labels**: `enhancement`, `nivel-N2`
**Origen**: ADR-002

### Cuerpo:
```markdown
## 🎯 Problema o necesidad
Los PDFs exportados desde la app **no llevan marca de versión ni fecha**. Esto genera dos problemas:
1. **Trazabilidad clínica**: si un médico archiva un PDF y meses después consulta una dosis, no puede saber si el PDF se generó con datos desactualizados.
2. **Soporte**: cuando un usuario reporta un problema con un PDF, no podemos saber qué versión de la app lo generó.

## 💡 Propuesta
Añadir un **footer automático** en cada PDF exportado con:
- Versión de la app (leída de `package.json`, inyectada en build time via Vite)
- Fecha y hora de generación (ISO 8601, zona horaria del usuario)

Ejemplo visual:
```text
─────────────────────────────────────────────
Antidepresivos 2026 v0.3.0 · 2026-10-04 14:32 (UTC-6)
https://antidepresivos.drcelada.com · Verificar dosis vigentes
```

## 🧭 Alcance
- **Incluye**: Inyectar versión de package.json en build time. Footer en cada página. Aviso legal/clínico discreto.

## ✅ Criterios de aceptación
- [ ] Cada PDF exportado muestra versión + fecha + URL.
- [ ] La versión coincide con la de `package.json`.
- [ ] El footer es discreto: gris claro, tipografía pequeña.
```

---

## 🔴 Issue #5 — Dividir components.css en módulos por familia
**Labels**: `tech-debt`, `nivel-N2`
**Origen**: ADR-004

### Cuerpo:
```markdown
## 🎯 Problema o necesidad
`src/styles/components.css` tiene **1226 líneas** y sigue creciendo. En el ADR-004 ya se documentó como mitigación dividirlo cuando supere las 1500 líneas. Este issue sirve como **alerta temprana** para hacer la refactorización antes de que se convierta en un problema.

## 💡 Propuesta
Dividir `components.css` en módulos por familia semántica (`_buttons.css`, `_cards.css`, etc.) importándolos desde `components.css`.

## 🧭 Alcance
- **Incluye**: Refactor puro: **cero cambios visuales, cero cambios de selectores**. Verificar que `npm run build` produce el mismo CSS final.

## ✅ Criterios de aceptación
- [ ] Cada familia tiene su archivo en la carpeta `components/`.
- [ ] `components.css` es un agregador de `@import`.
- [ ] Sin cambios visuales y bundle equivalente.
```

---

## 🔴 Issue #6 — Cabeceras de seguridad en public/_headers
**Labels**: `security`, `nivel-N2`
**Origen**: ADR-005

### Cuerpo:
```markdown
## 🎯 Problema o necesidad
La app desplegada en Cloudflare Pages **no tiene cabeceras de seguridad explícitas**. Conviene fijar CSP, HSTS, X-Content-Type-Options y Referrer-Policy para prevenir XSS y forzar HTTPS en un contexto médico.

## 💡 Propuesta
Crear `public/_headers` (archivo nativo de Cloudflare Pages) con las cabeceras.

## 🧭 Alcance
- **Incluye**: 
  - `public/_headers` con las cabeceras.
  - Despliegue en modo **Content-Security-Policy-Report-Only** primero.

## ✅ Criterios de aceptación
- [ ] `public/_headers` versionado en el repo.
- [ ] Desplegado primero en modo Report-Only durante ≥ 1 semana.
- [ ] Cero violaciones de CSP en la consola.
- [ ] Test funcional: PDF export sigue funcionando, gráficos cargan.
```
