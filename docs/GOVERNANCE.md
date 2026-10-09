# 📘 Documento de Gobernanza — Proyecto "Antidepresivos"

**Versión:** 1.0  
**Fecha:** 2026-03-25  
**Ámbito:** Equipo humano de desarrollo + agentes IA (Claude, Copilot, Cursor, etc.)  
**Estado:** Activo — revisión trimestral obligatoria  

## 1. 🎯 Propósito y Alcance

Este documento define cómo se toman decisiones, quién las aprueba y qué reglas deben seguir tanto desarrolladores humanos como asistentes de IA al contribuir al proyecto Antidepresivos 2026 (antidepresivos.drcelada.com).

Dado que el proyecto es de uso clínico profesional, cualquier cambio puede tener implicaciones de seguridad del paciente. Por tanto, el principio rector es:

> "Ninguna contribución, humana o generada por IA, se fusiona a master sin revisión humana explícita y trazabilidad del origen."

## 2. 👥 Roles y Responsabilidades

| Rol | Titular | Responsabilidad |
| --- | --- | --- |
| **Owner / Product Owner** | Dr. Celada | Visión clínica, aprobación final de contenido médico |
| **Lead Developer** | (asignado) | Arquitectura, merges a master, despliegues |
| **Revisor Médico** | (rotativo entre clínicos) | Valida dosis, interacciones, perlas clínicas |
| **Contribuidor Humano** | Devs, diseñadores | Código, UI/UX, tests, docs |
| **Agente IA** | Claude / Copilot / Cursor | Asistencia en código, refactor, docs, tests |
| **Revisor de IA** | Cualquier humano del equipo | Audita cada PR etiquetado como `ai-generated` |

**Regla clave:** Un agente IA nunca tiene permisos de push directo a `main`/`master` ni de merge. Siempre opera sobre ramas efímeras.

## 3. 🤖 Uso de IA — Reglas Vinculantes

### 3.1 Etiquetado obligatorio
Todo commit, PR o issue que haya sido generado o asistido por IA debe llevar:
- Etiqueta `ai-generated` o `ai-assisted`
- En el cuerpo del PR: modelo usado, prompt principal, nivel de revisión humana aplicada (ver §3.3).

### 3.2 Zonas prohibidas para IA sin supervisión reforzada

| Zona | Riesgo | Requisito |
| --- | --- | --- |
| `switchingMatrix` (IMAOs ↔ ISRS) | 🔴 Vida o muerte | 2 revisores humanos + test unitario dedicado |
| Dosis y perlas clínicas (CSV/JSON) | 🔴 Clínico | Aprobación del Revisor Médico |
| Lógica de cálculo de interacciones | 🔴 Clínico | Par de revisión + referencia bibliográfica citada en el PR |
| Migraciones de datos / esquemas | 🟠 Datos | Lead Developer |
| CI/CD y Secrets | 🟠 Seguridad | Lead Developer, nunca IA |

### 3.3 Niveles de revisión humana

| Nivel | Aplica a | Revisor |
| --- | --- | --- |
| **N1 — Light** | Typos, docs, comentarios, estilos CSS | Cualquier dev |
| **N2 — Standard** | Lógica UI, componentes, refactors | Dev senior |
| **N3 — Critical** | Lógica clínica, datos médicos, `switchingMatrix` | Dev senior + Revisor Médico |
| **N4 — Restringido** | Secrets, CI/CD, permisos, despliegue | Lead Developer únicamente |

> ⚠️ **Nota operativa (2026-10-04)**: este proyecto **no usa `CODEOWNERS`** ni 
> branch protection (repo privado, plan gratuito de GitHub). Los niveles N1–N4 
> son por tanto **convención social reforzada por el PR template**, no enforced 
> por GitHub. La disciplina de asignar revisores manualmente según el nivel 
> recae en quien abre el PR y en el Lead Developer.

### 3.4 Prohibiciones explícitas para agentes IA
- ❌ No generar ni modificar contenido de dosificación sin cita a guía clínica (APA, NICE, Maudsley).
- ❌ No introducir dependencias nuevas sin aprobación del Lead.
- ❌ No tocar `.env`, `wrangler.toml`, GitHub Secrets ni configuración de Cloudflare.
- ❌ No "limpiar" código en zonas críticas sin entender por qué está así (ej. manejo de casos límite).
- ❌ No inventar APIs, bibliotecas o endpoints. Si no está en `package.json`, se pregunta.

## 4. 🔀 Flujo de Trabajo (Git & PRs)

```text
main/master  ←── solo merges con PR + CI verde + revisores N2/N3
   ↑
develop      ←── integración continua
   ↑
feature/*    ←── ramas de trabajo (humanas o IA)
   ↑
claude/*, copilot/*, cursor/*  ←── ramas generadas por IA (prefijo obligatorio)
```

**Reglas de PR**
- Un PR = un cambio coherente. Nada de "refactor + feature + fix" mezclados.
- Plantilla obligatoria con:
  - Descripción del cambio
  - Origen: `human` / `ai-assisted` / `ai-generated` + modelo
  - Nivel de revisión (N1–N4)
  - Riesgo clínico: `ninguno` / `bajo` / `alto` / `crítico`
  - Checklist de tests
- CI debe pasar: `npm run lint` (0 warnings) + `npm test` + build.
- Squash merge para mantener historial limpio.
- No force-push sobre ramas compartidas.

## 4.bis Git Hooks — Candado Local

El repo usa **husky** para instalar dos hooks:

- **pre-commit** → `lint-staged` (ESLint + tests relacionados sobre archivos staged)
- **commit-msg** → `commitlint` (Conventional Commits + tipo `clinical` custom)

### Política de bypass

`git commit --no-verify` **está prohibido** salvo emergencia documentada.
Si lo usas, **debes**:
1. Justificarlo en el PR (sección "Notas para revisores").
2. Asegurarte de que CI pasa.
3. Avisar al Lead Developer.

El bypass recurrente es motivo de conversación de equipo.

### Formato obligatorio de commits

```text
<tipo>(<scope opcional>): <descripción en imperativo>

[cuerpo opcional]

[footer opcional: Refs, Reviewer, Closes]
```

Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `clinical`.

### Commits `clinical:` requieren:

- Scope relacionado (`switching-matrix`, `data`, `i18n`, etc.)
- Footer con `Refs:` citando la fuente clínica (Maudsley, APA, NICE)
- Footer con `Reviewer:` mencionando al Revisor Médico

## 5. 🧪 Calidad y Deuda Técnica

### 5.1 Criterios de aceptación mínimos
- **Lint:** 0 warnings (`no-unused-vars`, `Empty block statement` incluidos).
- **Tests:** cobertura de `switchingMatrix` ≥ 90% antes de tocar IMAO/ISRS.
- **Accesibilidad:** contraste AA, navegación por teclado, ARIA en componentes M3.
- **Rendimiento:** sin regresiones >10% en Lighthouse.

### 5.2 Deuda técnica registrada
Ver `ROADMAP.md`. Toda nueva deuda detectada se registra como issue con etiqueta `tech-debt` + estimación.

## 6. 🔐 Seguridad y Datos
- **Secretos:** solo en GitHub Actions Secrets y Cloudflare. Nunca en código, nunca en prompts de IA.
- **Prompts a IA:** no pegar fragmentos con datos reales de pacientes, tokens, ni claves API.
- **Datos clínicos:** los CSV/JSON son contenido editorial, no datos de pacientes. Aun así, cambios requieren N3.
- **Dependencias:** auditoría `npm audit` en cada release; CVEs críticos = bloqueo de despliegue.

## 7. 🚀 Despliegue

| Etapa | Responsable | Automatización |
| --- | --- | --- |
| PR → develop | CI (GitHub Actions) | Auto |
| develop → master | Lead Developer | Manual (aprobar PR) |
| master → Cloudflare | GitHub Actions (pendiente de secrets) | Auto tras aprobación |
| Rollback | Lead Developer | Manual (< 5 min) |

*Pendiente crítico: completar Secrets en GitHub Actions para CI/CD 100% automático.*

## 7.bis Releases Automáticas (release-please)

Las releases se generan automáticamente a partir de commits convencionales.
`release-please` mantiene una PR de release en `main` que, al mergearse:
- Crea el tag `vX.Y.Z`
- Publica la GitHub Release
- Actualiza `CHANGELOG.md` y `package.json`

### Tipos de commit → bump de versión

| Tipo | Bump | Sección en changelog |
|------|:----:|---------------------|
| `clinical` | minor | 🩺 Cambios Clínicos |
| `feat` | minor | ✨ Features |
| `fix` | patch | 🐛 Bug Fixes |
| `feat!` / `fix!` | major | ⚠️ Breaking Changes |
| `docs`, `style`, `test`, `ci`, `build`, `chore` | ninguno | (hidden) |

### Regla de oro

Nunca mergear la PR de release sin revisar el `CHANGELOG.md` generado.
Es la última oportunidad de corregir la narrativa antes de publicar.

## 8. 📝 Documentación Obligatoria
Todo cambio que afecte a:
- **Lógica clínica** → actualizar `docs/clinica/`
- **UI/UX** → actualizar `docs/design-system.md`
- **Infraestructura** → actualizar `CLOUDFLARE_DEPLOYMENT_GUIDE.md`
- **API interna** → actualizar `docs/api/`

**Regla:** PR sin doc actualizada = PR bloqueado (excepto N1).

## 9. 🧭 Toma de Decisiones

| Tipo de decisión | Método |
| --- | --- |
| Cambio estético menor | Lead Developer |
| Nueva funcionalidad UI | Discusión en issue + Lead |
| Cambio clínico (dosis, interacciones) | Revisor Médico + Lead |
| Arquitectura / stack | RFC breve en `docs/rfcs/` + aprobación Owner |
| Uso de nueva IA / modelo | Lead Developer + registro en este doc |

## 10. 🔁 Revisión y Versionado
- Este documento se revisa trimestralmente (próxima: 2026-06-25).
- Cambios al documento requieren PR + aprobación del Owner.
- Versión semántica: `MAJOR.MINOR` (cambios de reglas = MAJOR).

## 11. ✅ Checklist rápida antes de un PR
- [ ] Rama con prefijo correcto (`feature/`, `claude/`, etc.)
- [ ] Etiqueta `ai-generated` / `ai-assisted` si aplica
- [ ] Nivel de revisión declarado (N1–N4)
- [ ] `npm run lint` → 0 warnings
- [ ] `npm test` → verde
- [ ] Docs actualizadas si aplica
- [ ] Sin secretos ni datos sensibles
- [ ] Revisores asignados según nivel

---
*Aprobado por: Dr. Celada (Owner) · Lead Developer*  
*Última actualización: 2026-03-25*  
*Rama de referencia: claude/review-app-aesthetics-BpT5B*
