# Architecture Decision Records (ADRs)

Registro cronológico de las decisiones estructurales del proyecto **Antidepresivos 2026**.
Cada ADR documenta **qué se decidió, por qué, y qué alternativas se descartaron**.

## ¿Cuándo crear un ADR?

- Elección de framework, librería o plataforma
- Cambios en la arquitectura de datos (ej. estructura de los CSV)
- Estrategia de despliegue, cacheo o renderizado
- Cualquier decisión que sea **costosa de revertir**

Para cambios menores (nombres, estilos, refactors locales) **no** hace falta ADR.

## Estados

- **Propuesto** — en discusión (issue o PR abierto)
- **Aceptado** — vigente
- **Rechazado** — considerado y descartado (se conserva por contexto)
- **Obsoleto** — reemplazado por otro ADR (indicar cuál)
- **Deprecado** — ya no recomendado, pero sin reemplazo directo

## Formato del nombre

`ADR-NNN-titulo-corto-en-kebab-case.md`

## Índice

| # | Título | Estado | Fecha |
|---|--------|:------:|-------|
| [001](./ADR-001-cdn-vs-bundle.md) | Chart.js y html2pdf vía CDN | Aceptado | 2026-03-25 |
| [002](./ADR-002-pdf-client-side.md) | Generación de PDF en el cliente | Aceptado | 2026-03-25 |
| [003](./ADR-003-material-design-3.md) | Material Design 3 como sistema de diseño | Aceptado | 2026-03-25 |
| [004](./ADR-004-css-tokens-propios-vs-framework.md) | Tokens CSS propios vs framework de utilidades | Aceptado | 2026-10-04 |
| [005](./ADR-005-cloudflare-pages.md) | Cloudflare Pages como plataforma de despliegue | Aceptado | 2026-10-04 |
| [006](./ADR-006-offline-first.md) | Estrategia offline-first para uso clínico | Aceptado | 2026-10-04 |

## ADRs planificados

Estos ADRs ya están identificados pero su decisión aún no se ha formalizado:

| # | Tema | Prioridad |
|---|------|:---------:|
| 007 | Estructura de datos clínicos (CSV vs JSON vs ambos) | Media |
| 008 | Internacionalización (ES/EN) — estrategia de paridad y validación | Media |
| 009 | Analítica y telemetría respetuosa con privacidad (si se decide añadir) | Baja |
