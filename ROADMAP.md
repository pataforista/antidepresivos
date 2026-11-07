# Roadmap y Backlog del Proyecto

Este documento establece qué funcionalidades se han completado, los pendientes técnicos y las próximas iteraciones para el proyecto "Antidepresivos". Sirve como hoja de ruta centralizada.

## 1. Estado Clínico y Datos (Completado)

- **Revisión Clínica Completa ([`docs/REVISION_CLINICA_PENDIENTE.md`](docs/REVISION_CLINICA_PENDIENTE.md))**:
  - **Resuelto (100% C-1 a C-15)**: Auditoría clínica integral cerrada y validada por revisor humano.
  - **Seguridad en Switching**:
    - Moclobemida (RIMA) con lavado de 24 h hacia serotoninérgicos (sin cross-taper) y justificación de inhibición reversible de MAO-A.
    - Vortioxetina con lavado estricto de 21 días pre-IMAO según ficha técnica FDA.
    - Exclusión de potenciadores (`ADP_AUG_*`) y fármacos de acción rápida/infusión (`ADP_RAPID_*`) del calculador de switching, desplegando avisos clínicos explicativos.
    - Matriz de switching curada ampliada de 5 a 14 pares clínicos prioritarios de alta frecuencia en consulta.
  - **Exactitud Farmacológica y Dominios**:
    - Riesgo QT actualizado (Litio a `Moderado`, Citalopram `Alto`, Escitalopram `Moderado`, Venlafaxina `Bajo`).
    - Dosis máxima de Mianserina estandarizada a `120 mg/día`.
    - Normalización de los 45 fármacos al catálogo estricto de impacto en peso (`Pérdida`, `Neutro`, `Aumento`).
    - Aprobación pediátrica de Sertralina confirmada (`true`) para TOC en ≥ 6 años.
    - Estandarización de farmacocinética para vías no orales y ketamina (`Baja ~17–20% vía oral; estándar IV/IM 100%/93%`).
    - Fallback en monografía (`detailView.js`) para evitar falsos "N/D" en metabolismo CYP450.
  - **Sinergias y Evidencia**:
    - Lenguaje depurado en `synergies.json` (eliminadas hipérboles) e integrados criterios de Hunter y tiempos de lavado en alertas serotoninérgicas.
    - Sustitución de fuentes informales por Fichas Técnicas (FDA, AEMPS, EMA), *The Maudsley Prescribing Guidelines (14th Ed.)* y *Stahl's Essential Psychopharmacology*.
    - Actualización de guías clínicas a CANMAT 2023 Update, NICE CG113 (2011, rev. 2020), NICE CG31 (con vigilancia 2027), NICE CG159 y ACOG CPG 4 (2023).
  - **Gobernanza de Datos**:
    - Declaración formal en [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) (§2.1) de `dataset.antidepresivos.v1.0.0.json` como la **Fuente Única de Verdad (SSOT)** del proyecto.
  - **Paridad y Calidad Lingüística**:
    - Paridad semántica cualitativa ES/EN completada en monografías, embarazo y diccionario UI (`locales.json`).

## 2. Pendientes de Interfaz (UI/UX)

- **Microinteracciones y Feedback ("Playful")**:
  - Mejorar los "Skeleton Loaders" visuales introduciendo una estética más amigable (con uso de la mascota gráfica).
  - Expandir las microinteracciones en las vistas secundarias (actualmente presentes fuertemente en el dock inferior y botones principales).
  - Añadir soporte visual para las "toast notifications" de modo que sean fluidas al añadirlas a la cola.
- **Gráficos Avanzados y Exportación**:
  - Asegurar que las funcionalidades de "Descargar PDF" funcionen de forma óptima en el modo Offline, generando los reportes en el lado del cliente (Client-Side Rendering puro con `html2pdf.js`).

## 3. Deuda Técnica y Lógica

- **Consolidación de Tests y Arquitectura**: 
  - Resuelto: Lógica de switching extraída a un módulo puro desacoplado ([`src/lib/switchingLogic.js`](src/lib/switchingLogic.js)), testeado directamente por [`tests/switchingMatrix.test.js`](tests/switchingMatrix.test.js) con 101 tests en verde y 85.7% de cobertura de código.
- **Limpieza de Linting**:
  - Resuelto: `npm run lint` da cero advertencias, `.eslintignore` se retiró y los `catch` vacíos ahora registran un `console.warn`.
- **CSS modular**:
  - Resuelto: `src/styles/components.css` solo agrega `@import` de `src/styles/components/` (Issue #5), con el CSS del build idéntico byte a byte.
- **Estructura del Proyecto**:
  - Resuelto: Código de la SPA unificado en la raíz (`src/`, `public/`, `dist/`), con los árboles duplicados legacy aislados en `archive/appantidepresivos/` y deploy apuntando a `dist/`.

## 4. Despliegue y SEO

- **Automatización Completa**: 
  - Configurado workflow en `.github/workflows/deploy-cloudflare.yml` apuntando a `dist/` tras `npm run build`. Falta verificar los secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) en el panel de GitHub Actions.
- **Linkbuilding y SEO Off-Page**: 
  - Ejecutar el plan de backlinks para posicionar el dominio `antidepresivos.drcelada.com`.
