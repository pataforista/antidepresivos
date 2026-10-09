# ADR-001 — Chart.js y html2pdf vía CDN

- **Fecha**: 2026-03-25
- **Estado**: Aceptado
- **Decisores**: Lead Developer, Dr. Celada

## Contexto

La app usa Chart.js para gráficos clínicos y html2pdf para exportar reportes.
Se barajó bundlearlos con Vite/Webpack o cargarlos desde CDN.

## Decisión

Cargar **Chart.js** y **html2pdf** desde CDN (`<script>` en el HTML).

## Justificación

- Reduce el tamaño del bundle inicial enviado al navegador.
- Los profesionales suelen tener conectividad estable.
- Cloudflare cachea el CDN de forma agresiva → latencia baja.
- Menos complejidad en el build (sin loaders ni optimizaciones adicionales).

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|-------------|---------------------|
| Bundle con Vite | Aumenta el bundle inicial ~180 KB |
| `npm install` + dynamic import | Complejidad extra sin ganancia clara |
| Self-host en Cloudflare | Más control, pero más mantenimiento de versiones |

## Consecuencias

### ✅ Positivas
- Bundle pequeño, carga rápida en primera visita.
- Menos dependencias en `package.json`.

### ⚠️ Negativas / Riesgos
- **Modo offline**: si la CDN no está cacheada por el Service Worker, los gráficos y el PDF no funcionan sin conexión.
- **Supply chain**: dependemos de la disponibilidad y seguridad de la CDN.
- **Versiones**: un cambio en la CDN puede romper la app sin aviso.

## Mitigaciones obligatorias

- [x] Service Worker que cachee las URLs exactas de la CDN (con hash SRI). → Resuelto en [ADR-006](./ADR-006-offline-first.md)
- [ ] Atributos `integrity` + `crossorigin` en los `<script>`.
- [ ] Versiones **fijadas** (no `latest`) en las URLs.
- [ ] Test de regresión manual offline antes de cada release.

## Referencias

- `src/index.html` (tags `<script>`)
- `ROADMAP.md` (pendiente de validar PDF offline)
