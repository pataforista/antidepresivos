# ADR-002 — Generación de PDF en el cliente

- **Fecha**: 2026-03-25
- **Estado**: Aceptado
- **Decisores**: Lead Developer, Dr. Celada

## Contexto

La app permite exportar reportes clínicos a PDF. Se evaluó:
(a) generar en el cliente con `html2pdf`,
(b) generar en un backend (Cloudflare Worker + Puppeteer),
(c) delegar al usuario con la impresión del navegador.

## Decisión

Generación **100% en el cliente** con `html2pdf`.

## Justificación

- **Privacidad**: no se envían datos del reporte a ningún servidor.
- **Offline**: funciona sin conexión una vez cacheada la librería.
- **Cero coste de backend**: no hay compute que pagar por cada export.
- **Simplicidad**: sin servicio adicional que mantener ni desplegar.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|-------------|---------------------|
| Cloudflare Worker + Puppeteer | Envía datos clínicos al servidor (privacidad), cold starts, coste |
| `window.print()` con CSS `@media print` | Poco control sobre el formato final |
| Servicio externo (DocRaptor, etc.) | Dependencia de terceros con datos clínicos |

## Consecuencias

### ✅ Positivas
- Ningún dato clínico sale del navegador.
- Funciona en modo offline.
- Coste marginal cero.

### ⚠️ Negativas / Riesgos
- **Consistencia visual**: el PDF depende del motor de render del navegador del usuario.
- **Tamaño de la librería**: html2pdf es pesada (~150 KB min+gz).
- **Sin control de versiones del output**: distintos navegadores = distintos PDFs.

## Mitigaciones

- [ ] CSS específico `@media print` que fuerce un layout estable.
- [ ] Test manual en Chrome, Safari, Firefox antes de cada release.
- [ ] Marca de agua o footer con versión de la app + fecha en cada PDF exportado.

## Referencias

- `src/lib/pdfExport.js`
- `ROADMAP.md` (pendiente: PDF offline)
