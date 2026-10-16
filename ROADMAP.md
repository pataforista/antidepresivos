# Roadmap y Backlog del Proyecto

Este documento establece qué funcionalidades faltan, los pendientes técnicos (Deuda Técnica) y las próximas iteraciones para el proyecto "Antidepresivos". Sirve como hoja de ruta centralizada.

## 1. Pendientes Clínicos / Datos

- **Ampliación del Dataset**: 
  - Incluir más antidepresivos atípicos emergentes u off-label si falta alguno.
  - Asegurar la paridad completa de "Perlas Clínicas" entre Español e Inglés en los CSV correspondientes (algunos JSON podrían tener vacíos).
- **Validación Médica Continua**: Establecer un flujo sistemático para actualizar las guías clínicas anualmente.
- **Revisión clínica pendiente**: las preguntas concretas para el revisor (switching de RIMA, QT, dosis divergentes, tablas puente vacías, vigencia de guías) están en [`docs/REVISION_CLINICA_PENDIENTE.md`](docs/REVISION_CLINICA_PENDIENTE.md).

## 2. Pendientes de Interfaz (UI/UX)

- **Microinteracciones y Feedback ("Playful")**:
  - Mejorar los "Skeleton Loaders" visuales introduciendo una estética más amigable (ej. con uso de la mascota gráfica).
  - Expandir las microinteracciones en las vistas secundarias (actualmente presentes fuertemente en el dock inferior y botones principales).
  - Añadir soporte visual para las "toast notifications" de modo que sean más fluidas al añadirlas a la cola.
- **Gráficos Avanzados**:
  - Ahora que `Chart.js` y `html2pdf` se usan a través de CDN, asegurar que las funcionalidades de "Descargar PDF" funcionen correctamente en el modo Offline, generando los reportes en el lado del cliente (Client-Side Rendering puro).

## 3. Deuda Técnica y Lógica

- **Consolidación de Tests**: 
  - `tests/switchingMatrix.test.js` cubre los casos IMAO/ISRS, pero sobre una copia de la lógica de `src/ui/switchView.js`, no sobre el código real (ver C-1 en `docs/REVISION_CLINICA_PENDIENTE.md`). Extraer la lógica a una función pura e importarla en el test, una vez validadas las reglas.
- **Limpieza de Linting**:
  - Resuelto: `npm run lint` da cero advertencias, `.eslintignore` se retiró y los `catch` vacíos ahora registran un `console.warn`.
- **CSS modular**:
  - Resuelto: `src/styles/components.css` solo agrega `@import` de `src/styles/components/` (Issue #5), con el CSS del build idéntico byte a byte.
- **Estructura del Proyecto**:
  - Resuelto: Código de la SPA unificado en la raíz (`src/`, `public/`, `dist/`), con los árboles duplicados legacy aislados en `archive/appantidepresivos/` y deploy apuntando a `dist/`.

## 4. Despliegue y SEO

- **Automatización Completa**: 
  - Aunque hay guías (ej. `CLOUDFLARE_DEPLOYMENT_GUIDE.md`), falta integrar y probar los "Secrets" (Tokens) en el panel de GitHub Actions para lograr el CI/CD completo de master a Cloudflare sin intervención manual local.
- **Linkbuilding y SEO Off-Page**: 
  - Ejecutar el plan de backlinks para posicionar el dominio `antidepresivos.drcelada.com` (actualmente en espera de que la herramienta sea lanzada al público general de profesionales).
