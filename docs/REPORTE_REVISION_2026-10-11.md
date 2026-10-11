# Reporte de revisión: `antidepresivos`

| | |
| --- | --- |
| **Fecha** | 2026-10-11 |
| **Tipo** | Revisión de lectura. **No se modificó código ni configuración.** |
| **Origen** | Evaluación previa a una posible migración de dominio (ver `PLAN_MIGRACION_DOMINIO.md` en `coordinacionclasespsiquiatria`) |
| **No ejecutado** | `npm ci`, lint, pruebas y build. Los hallazgos salen de leer archivos y comparar árboles |

## Resumen

| ID | Severidad | Hallazgo |
| --- | --- | --- |
| A-1 | Alta (probable) | El workflow de deploy publica un árbol distinto del que genera el build |
| A-2 | Media | La documentación de deploy se contradice y cita scripts inexistentes |
| A-3 | Media | Dos copias de la app y de los datos clínicos; la legacy queda fuera de lint y pruebas |
| A-4 | Baja | Un paso del workflow nunca se ejecuta |

---

## A-1. El deploy publica el árbol legacy, no el build

**Evidencia**

- `.github/workflows/deploy-cloudflare.yml` ejecuta `npm run build` y luego despliega con `directory: appantidepresivos/antidepresivos/web_app/public`.
- `npm run build` escribe en `dist/` (`vite.config.js`: `outDir: 'dist'`). `wrangler.toml` declara `pages_build_output_dir = "dist"` y ADR-005 habla de "copiar `dist/`".
- El CI (`ci.yml`) comprueba que exista `dist/index.html`, pero el deploy no usa `dist/`. El build del workflow de deploy es trabajo desechado.
- El árbol legacy está desfasado respecto al raíz:
  - Difieren 10 archivos de `src/`: `app.js`, `core/policy.js`, `core/router.js`, `core/store.js`, `styles/components.css`, `styles/playful.css`, `ui/detailView.js`, `ui/gatekeeperDisclaimer.js`, `ui/modalInfo.js`, `ui/switchView.js`.
  - Al legacy le faltan `src/sw.js` (Workbox) y `src/pwa-update-banner.js`, y tiene su propio `sw.js` sin empaquetar (`antidepresivos-v15`).
  - Su `public/` no tiene `icons/`, `offline.html` ni `theme-bootstrap.js` en la raíz.
  - Último commit en `src/` raíz: `0b28566` (2026-10-07). Último en el legacy: `25c837f` (2026-10-06).

**Impacto**

Si producción se alimenta de este workflow, publica una versión anterior de la app, incluida la lógica de `policy.js` y `gatekeeperDisclaimer.js` (aviso clínico). En una herramienta de apoyo a decisiones, servir una versión vieja es un riesgo, no una molestia.

**Insufficient data for qué hay en producción.** El `wrangler.toml` indica que el deploy puede hacerlo también la integración nativa de Cloudflare con el repo. Para decidir:

1. Panel de Cloudflare → Pages → proyecto `antidepresivos` → *Deployments*: ver el origen de cada despliegue y el directorio de salida configurado.
2. Comparar el nombre del bundle servido (`/assets/index-*.js`) con el de `dist/` tras un build local.

**Sugerencia (no aplicada)**

Apuntar el workflow a `dist` (o eliminar el workflow si manda la integración nativa), y retirar el árbol legacy (A-3).

---

## A-2. Documentación de deploy contradictoria

**Evidencia**

- `CLOUDFLARE_DEPLOYMENT_GUIDE.md`, líneas 148 y 306, usa `appantidepresivos/antidepresivos/web_app/public`. ADR-005 y `wrangler.toml` apuntan a `dist/`.
- La guía invoca `npm run deploy` (líneas 142, 285, 344) y `npm run deploy:prod` (línea 347). `package.json` no define ninguno de los dos.

**Impacto**

Quien siga la guía recibe un error (`Missing script`) o, con el comando `wrangler` directo, publica el árbol legacy.

**Sugerencia (no aplicada)**

Alinear la guía con una sola fuente de verdad y retirar los scripts inexistentes o definirlos.

---

## A-3. Dos copias de la app y de los datos

**Evidencia**

- `appantidepresivos/antidepresivos/web_app/` (≈2.2 MB) duplica `public/` y `src/`.
- `npm run lint` ignora `appantidepresivos/**` y las pruebas no cubren ese árbol.
- Hoy `public/data/` y el `data/` del legacy son idénticos (`diff -rq` sin diferencias). El resto del código ya divergió.

**Impacto**

Los datos farmacológicos coinciden hoy, pero nada impide que una edición futura los separe sin que ningún chequeo lo detecte.

**Sugerencia (no aplicada)**

Eliminar el legacy una vez confirmado A-1, o excluirlo explícitamente del deploy y dejarlo como archivo histórico (`archivo_historico/`).

---

## A-4. Paso "Comment PR with deployment" inalcanzable

**Evidencia**

- El workflow se dispara en `push` a `main` y `workflow_dispatch`; el paso exige `github.event_name == 'pull_request'`, que nunca ocurre.
- Los `permissions` declarados (`contents: read`, `deployments: write`) no permiten comentar en PR.
- Existe además `preview-comment.yml`; no se revisó si cubre ese caso.

**Impacto**

Bajo. Es código muerto que sugiere una función (comentario con vista previa) que no existe.

---

## Fuera de alcance de esta revisión

- Correctitud clínica de los datos farmacológicos.
- Resultados reales de `npm run lint`, `npm test` y `npm run build`.
- Configuración del proyecto en el panel de Cloudflare.
