# Roadmap y Backlog del Proyecto

Este documento establece qué funcionalidades faltan, los pendientes técnicos (Deuda Técnica) y las próximas iteraciones para el proyecto "Antidepresivos". Sirve como hoja de ruta centralizada.

## 1. Pendientes Clínicos / Datos

- **Ampliación del Dataset**: 
  - Incluir más antidepresivos atípicos emergentes u off-label si falta alguno.
  - Asegurar la paridad completa de "Perlas Clínicas" entre Español e Inglés en los CSV correspondientes (algunos JSON podrían tener vacíos).
- **Validación Médica Continua**: Establecer un flujo sistemático para actualizar las guías clínicas anualmente.

## 2. Pendientes de Interfaz (UI/UX)

- **Microinteracciones y Feedback ("Playful")**:
  - Mejorar los "Skeleton Loaders" visuales introduciendo una estética más amigable (ej. con uso de la mascota gráfica).
  - Expandir las microinteracciones en las vistas secundarias (actualmente presentes fuertemente en el dock inferior y botones principales).
  - Añadir soporte visual para las "toast notifications" de modo que sean más fluidas al añadirlas a la cola.
- **Gráficos Avanzados**:
  - Ahora que `Chart.js` y `html2pdf` se usan a través de CDN, asegurar que las funcionalidades de "Descargar PDF" funcionen correctamente en el modo Offline, generando los reportes en el lado del cliente (Client-Side Rendering puro).

## 3. Deuda Técnica y Lógica

- **Consolidación de Tests**: 
  - La suite en `tests/basic.test.js` cubre requerimientos de Jest. Ampliar con Unit Tests el manejo complejo de la `switchingMatrix` para cambios entre IMAOs e ISRS (casos críticos de vida o muerte).
- **Limpieza de Linting**:
  - El proyecto introdujo ESLint recientemente, pero arrojó múltiples advertencias (ej. "no-unused-vars", "Empty block statement").
  - Tarea: Limpiar exhaustivamente el código para tener cero advertencias al ejecutar `npm run lint`.
- **Estructura del Proyecto**:
  - `appantidepresivos/antidepresivos/web_app/public/`: La ruta de anidación actual es extremadamente redundante. 
  - **Reorganización recomendada**: Mover todo el contenido de `public/` a la raíz o a un directorio único `/app`, lo cual simplificaría las rutas de desarrollo en Wrangler.

## 4. Despliegue y SEO

- **Automatización Completa**: 
  - Aunque hay guías (ej. `CLOUDFLARE_DEPLOYMENT_GUIDE.md`), falta integrar y probar los "Secrets" (Tokens) en el panel de GitHub Actions para lograr el CI/CD completo de master a Cloudflare sin intervención manual local.
- **Linkbuilding y SEO Off-Page**: 
  - Ejecutar el plan de backlinks para posicionar el dominio `antidepresivos.drcelada.com` (actualmente en espera de que la herramienta sea lanzada al público general de profesionales).
