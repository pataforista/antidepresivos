# ADR-005 — Cloudflare Pages como plataforma de despliegue

- **Fecha**: 2026-10-04
- **Estado**: Aceptado
- **Decisores**: Lead Developer, Dr. Celada

## Contexto

La app es una **PWA estática con Vite** que necesita:
- Hosting de archivos estáticos (HTML, JS, CSS, assets, manifest, Service Worker)
- **HTTPS obligatorio** (requisito de Service Worker y de cualquier app clínica)
- **CDN global** con latencia baja (usuarios clínicos en múltiples regiones)
- **Coste $0** para el tráfico esperado (proyecto sin monetización directa)
- **CI/CD** desde GitHub sin intervención manual
- **Soporte offline-first** (integración con Service Worker)
- Dominio personalizado: `antidepresivos.drcelada.com`

Se evaluaron varias plataformas de despliegue estático y se eligió una.

## Decisión

Desplegar en **Cloudflare Pages**, con dominio gestionado por **Cloudflare DNS** y despliegue automatizado desde GitHub Actions (o desde la integración nativa de Cloudflare con el repo).

La configuración de despliegue vive en `wrangler.toml` y está documentada en `CLOUDFLARE_DEPLOYMENT_GUIDE.md`.

## Justificación

- **Ancho de banda ilimitado gratis**: Cloudflare Pages no cobra por transferencia. Esto es decisivo para una app clínica que puede tener picos de tráfico sin aviso.
- **Builds ilimitados gratis**: hasta 500 builds/mes en el plan gratuito. Suficiente para iteración agresiva.
- **CDN global integrado**: 300+ PoPs. Un clínico en España, México o Argentina tiene latencia baja sin configuración extra.
- **HTTPS automático** con certificado gestionado.
- **Integración con Cloudflare DNS**: como `drcelada.com` ya está en Cloudflare, conectar `antidepresivos.drcelada.com` es un CNAME y listo.
- **Preview deployments por PR**: cada PR genera una URL de preview. Útil para revisar cambios de UI sin mergear (aunque requiere configurar la integración de Cloudflare con el repo).
- **Soporte nativo de `_headers` y `_redirects`**: podemos fijar CSP, HSTS, `X-Content-Type-Options` desde un archivo en el repo, sin tocar el dashboard.
- **Sin lock-in real**: es hosting estático. Si mañana migramos a Netlify o Vercel, es copiar `dist/` y cambiar el DNS.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|-------------|---------------------|
| **Netlify** | Buen competidor. Plan gratis 100 GB/mes de ancho de banda (Cloudflare es ilimitado). Ya tenemos DNS en Cloudflare, así que Netlify añade una capa extra. |
| **Vercel** | Excelente para Next.js, sobredimensionado para una SPA vanilla. Plan Hobby prohíbe uso comercial (la app podría considerarse "herramienta profesional"). Ambiguo. |
| **GitHub Pages** | Gratis, pero: sin control de headers (no podemos fijar CSP), CDN más lento, builds limitados, HTTPS con dominio custom funciona pero sin opciones avanzadas. |
| **Firebase Hosting** | Gratis con cuota mensual, pero introduce dependencia de Google Cloud. `firebase.json` añade superficie innecesaria. |
| **AWS S3 + CloudFront** | Coste variable no trivial de estimar. Configuración IAM/S3/CloudFront pesada para un proyecto pequeño. Overkill. |
| **Hosting propio (VPS)** | Coste fijo mensual, mantenimiento, parcheo, certificados. Incompatible con la filosofía "coste $0 y cero ops". |
| **Render / Railway** | Diseñados para apps con backend. Para estático puro son sobredimensionados. |

## Consecuencias

### ✅ Positivas
- **Coste $0 sostenible** para el volumen previsto.
- **Cero ops**: sin servidores, sin parcheo, sin certificados manuales.
- **Latencia baja global** sin trabajo extra.
- **Preview URLs por PR** (opcional, activable cuando interese).
- **`_headers` versionado**: cabeceras de seguridad en el repo, auditables.
- **Rollback inmediato**: cualquier deploy anterior se puede promover en 1 clic.

### ⚠️ Negativas / Riesgos
- **Vendor lock-in moderado** en la capa de configuración (wrangler, `_headers`, `_redirects`). No es un problema real porque migrar es copiar `dist/`.
- **Builds limitados a 500/mes**: suficiente hoy, puede apretar si el CI se dispara en cada push a ramas múltiples.
- **Dependencia de Cloudflare** para DNS + hosting + CDN. Si Cloudflare cae, la app cae. Mitigación: es raro y afecta a medio internet cuando pasa.
- **Sin funciones server-side** sin cambiar a Workers/Pages Functions. No las necesitamos hoy (ADR-002 decidió PDF client-side).
- **Analíticas limitadas**: Cloudflare Web Analytics es gratis pero básico. Si se necesita analítica avanzada, habría que añadir un tercero (con implicaciones de privacidad).

## Mitigaciones

- [ ] **Fijar cabeceras de seguridad** en `public/_headers` (CSP, HSTS, X-Content-Type-Options, Referrer-Policy).
- [ ] **Configurar Dependabot** para el `wrangler` en `devDependencies` (ya cubierto por `.github/dependabot.yml`).
- [ ] **Documentar rollback** en `docs/runbooks/rollback-cloudflare.md` (pendiente de crear).
- [ ] **Backup del `dist/`** en cada release como artifact de GitHub Actions (por si Cloudflare pierde el build).
- [ ] **Activar Cloudflare Web Analytics** (gratis, sin cookies, compatible con RGPD).
- [ ] **Confirmar uso comercial**: revisar los Términos de Cloudflare Pages para asegurar que una herramienta profesional sin ánimo de lucro directo entra en el plan gratuito sin ambigüedad.

## Referencias

- `wrangler.toml`
- `CLOUDFLARE_DEPLOYMENT_GUIDE.md`
- `.github/workflows/ci.yml` (build)
- [Cloudflare Pages — Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [ADR-002](./ADR-002-pdf-client-side.md) — PDF client-side (evita necesidad de backend)
- [Roadmap y Backlog §4](../../ROADMAP.md) — pendiente: automatización completa de Secrets
