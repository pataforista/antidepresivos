# Runbook: Rollback de Cloudflare Pages

- **Proyecto**: Antidepresivos 2026
- **Dominio**: antidepresivos.drcelada.com
- **Proyecto Cloudflare Pages**: antidepresivos
- **Nivel de criticidad**: N4 (solo Lead Developer o Owner pueden ejecutar)
- **Última actualización**: 2026-10-04

## 1. 🎯 Propósito

Este runbook describe el procedimiento exacto para revertir la aplicación en producción a una versión anterior conocida como estable cuando un despliegue introduce un fallo crítico. Los despliegues en Cloudflare Pages son inmutables: hacer rollback es instantáneo y no requiere un commit de reversión ni una reconstrucción.

> **Regla de oro**: un rollback restaura el tráfico a un despliegue previo, pero no arregla el código. Una vez estabilizado, es obligatorio hacer *fix forward* en main.

## 2. 🚨 Criterios de activación

Activa un rollback inmediatamente si el deploy actual causa:

| Severidad | Síntoma | Acción |
|-----------|---------|--------|
| 🔴 **Crítica** | La app no carga (pantalla blanca, 500) | Rollback inmediato sin consultar |
| 🔴 **Crítica** | Contenido clínico incorrecto visible (dosis, interacciones) | Rollback inmediato + avisar al Revisor Médico |
| 🟠 **Alta** | `switchingMatrix` devuelve resultados erróneos | Rollback inmediato + issue clínico |
| 🟠 **Alta** | Export PDF roto en producción | Rollback si afecta a >50% de usuarios |
| 🟡 **Media** | Estilos rotos, microinteracciones fallando | Evaluar: rollback vs fix forward rápido |
| 🟢 **Baja** | Typo cosmético, animación menor | No hagas rollback. Fix forward. |

## 3. ⚡ Procedimiento de Rollback (ordenado por velocidad)

### Opción A — Dashboard (más rápido, sin CLI) ✅ Recomendado
**Tiempo estimado:** < 60 segundos

1. Abre [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages
2. Selecciona el proyecto `antidepresivos`
3. Ve a la pestaña **Deployments**
4. En la lista *All deployments*, localiza el último despliegue estable (el anterior al problemático)
5. Pulsa el menú de tres puntos (⋯) a la derecha de ese despliegue
6. Selecciona "Rollback to this deployment"
7. Confirma en el diálogo. El cambio es instantáneo.

> ⚠️ Solo puedes hacer rollback a despliegues de producción con build exitoso. Los preview deployments no son objetivos válidos de rollback.

### Opción B — CLI con Wrangler (recomendado para Lead Developer)
**Tiempo estimado:** 1–2 minutos

```bash
# 1. Ver los despliegues recientes (el más reciente aparece arriba)
npx wrangler pages deployment list --project-name=antidepresivos

# 2. Identifica el ID del despliegue estable (columna "ID" o "Deployment ID")
# Ejemplo de salida:
# Environment   Branch  Deployment URL                             Deployment ID
# Production    main    https://abc123.antidepresivos.pages.dev    f64788e9-...
# Production    main    https://def456.antidepresivos.pages.dev    a1b2c3d4-...
# Preview       feature https://ghi789.antidepresivos.pages.dev    e5f6g7h8-...

# 3. Ejecuta el rollback al ID estable
npx wrangler pages deployment rollback <DEPLOYMENT_ID> --project-name=antidepresivos
```

Ejemplo concreto:
```bash
npx wrangler pages deployment rollback f64788e9-fccd-4d4a-a28a-cb84f88f6 \
  --project-name=antidepresivos
```
El comando responde con el objeto del deployment restaurado y una URL de confirmación.

Prerrequisito: Wrangler debe estar autenticado. Si no lo está:
```bash
npx wrangler login
```
Esto abre el navegador para OAuth. No requiere API token manual para uso local.

### Opción C — API REST (para automatización o cuando no hay CLI)
**Tiempo estimado:** 30 segundos (con curl)

```bash
# Variables de entorno (configurar una vez)
export CLOUDFLARE_ACCOUNT_ID="<tu-account-id>"
export CLOUDFLARE_API_TOKEN="<token-con-permiso-Pages-Edit>"
export PROJECT_NAME="antidepresivos"

# Rollback a un deployment específico
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${DEPLOYMENT_ID}/rollback" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json"
```

El endpoint es `POST /accounts/{account_id}/pages/projects/{project_name}/deployments/{deployment_id}/rollback`. El token necesita permiso Account → Cloudflare Pages → Edit.
> ⚠️ Este método no es el preferido para emergencias porque requiere tener el token a mano. Úsalo solo si ya tienes un pipeline automatizado que lo necesite.

### Opción D — Git revert + redeploy (último recurso)
**Tiempo estimado:** 5–15 minutos (requiere build)

Solo si por alguna razón las tres opciones anteriores fallan:
```bash
# 1. Identifica el tag/commit estable anterior
git log --oneline --decorate -10

# 2. Crea una rama de emergencia desde ese punto
git checkout -b hotfix/rollback-$(date +%Y%m%d) <commit-o-tag-estable>

# 3. Fuerza un redeploy (si usas CI/CD, basta con push a main vía PR express)
git push origin hotfix/rollback-$(date +%Y%m%d)
```
Ventaja: queda registrado en Git. Desventaja: lento. Los despliegues de Cloudflare Pages son inmutables, así que el rollback por dashboard/CLI no necesita este paso.

## 4. ✅ Verificación post-rollback

Inmediatamente después del rollback, verifica:
- [ ] URL de producción responde: `https://antidepresivos.drcelada.com` carga sin errores
- [ ] Consola del navegador limpia: sin errores 404/500 en Network
- [ ] Funcionalidad crítica:
  - [ ] `switchingMatrix` devuelve resultados correctos (prueba con 2–3 pares conocidos)
  - [ ] Export PDF funciona
  - [ ] Quiz carga y responde
- [ ] Service Worker: si el usuario tenía la versión rota cacheada, forzar Ctrl+Shift+R (hard reload) o borrar caché del SW en DevTools → Application → Service Workers → Unregister
- [ ] Cloudflare Analytics: el tráfico vuelve a niveles normales en los siguientes 5 minutos

*Truco: abre una ventana de incógnito para verificar. Evita cachés locales que puedan dar falsos positivos.*

## 5. 📢 Comunicación obligatoria

Después del rollback, en este orden:

| Paso | Canal | Contenido |
|------|-------|-----------|
| 1 | Issue en GitHub con label `deploy`, `incident` | "Rollback ejecutado a deployment `<id>` por `<razón>`" |
| 2 | PR de fix forward | Referencia el issue del incidente |
| 3 | CHANGELOG.md (si release-please lo requiere) | Se generará al mergear el fix |
| 4 | (Si fue crítico clínico) Revisor Médico | Notificar por email/WhatsApp |

Plantilla de issue de incidente:
```markdown
## 🚨 Incidente de producción — Rollback ejecutado

- **Fecha/hora**: YYYY-MM-DD HH:MM UTC
- **Deployment problemático**: `<id>`
- **Deployment restaurado**: `<id>`
- **Ejecutado por**: @username
- **Método**: Dashboard / Wrangler / API
- **Motivo**: <descripción en 1 línea>

## Impacto
- Duración del incidente: X minutos
- Usuarios afectados: estimación
- ¿Afectó contenido clínico? Sí/No

## Causa raíz
<por qué llegó a producción>

## Plan de fix forward
- [ ] PR #
- [ ] Test de regresión añadido
- [ ] ¿Requiere ADR? Sí/No
```

## 6. 🛡️ Prevención: cómo evitar necesitar este runbook

| Medida | Estado |
|--------|--------|
| Preview deployments por PR (verificar antes de mergear) | ✅ Activado (ver `CLOUDFLARE_DEPLOYMENT_GUIDE.md`) |
| Smoke test automático post-deploy en CI | ⬜ Pendiente |
| Tests E2E con Playwright (flujo quiz + PDF) | ⬜ Pendiente |
| Canary deploy (10% del tráfico a la versión nueva) | ❌ No aplicable en Pages gratis |
| Feature flags para cambios de riesgo clínico | ⬜ Evaluar en ADR futuro |
| Bloquear merge a main sin CI verde | ⬜ Pendiente (branch protection requiere Pro) |

*Prioridad inmediata: activar los preview deployments por PR. Es gratis en Cloudflare Pages y elimina el 80% de los rollbacks porque permites al equipo ver el build antes de mergear.*

## 7. 🧰 Anexo: comandos de referencia rápida

```bash
# Listar despliegues
npx wrangler pages deployment list --project-name=antidepresivos

# Rollback por ID
npx wrangler pages deployment rollback <ID> --project-name=antidepresivos

# Ver logs en tiempo real (útil para diagnosticar antes de rollback)
npx wrangler pages deployment tail --project-name=antidepresivos

# Ver autenticación actual
npx wrangler whoami

# Re-login si el token expiró
npx wrangler login
```

Dashboard directo:
- Deployments: `https://dash.cloudflare.com/<account-id>/pages/view/antidepresivos`
- Analytics: `https://dash.cloudflare.com/<account-id>/analytics`

## 8. 📚 Referencias

- [Cloudflare Pages — Rollbacks (docs oficiales)](https://developers.cloudflare.com/pages/configuration/rollbacks/)
- [Cloudflare API — Rollback deployment](https://developers.cloudflare.com/api/typescript/resources/pages/subresources/projects/subresources/deployments/methods/rollback/)
- [Wrangler Commands — Pages](https://developers.cloudflare.com/workers/wrangler/commands/)
- `docs/adr/ADR-005-cloudflare-pages.md`
- `CLOUDFLARE_DEPLOYMENT_GUIDE.md`

## 9. ✅ Checklist de preparación (hazlo hoy, no en la emergencia)

- [ ] Confirmar nombre exacto del proyecto en Cloudflare Pages (`antidepresivos`)
- [ ] Confirmar nombre exacto de la rama de producción (`main` o `master`)
- [ ] Verificar que `npx wrangler whoami` responde con tu cuenta correcta
- [ ] Guardar el `CLOUDFLARE_ACCOUNT_ID` en un lugar accesible (gestor de contraseñas del equipo)
- [ ] Probar el comando `wrangler pages deployment list` en local para familiarizarse
- [ ] Añadir bookmark al dashboard de Deployments en el navegador del Lead Developer
- [ ] Imprimir o guardar offline este runbook (por si Cloudflare dashboard no responde)
