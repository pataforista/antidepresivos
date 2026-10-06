<!--
  Gracias por contribuir a Antidepresivos 2026.
  Este proyecto es de uso clínico: toda contribución debe ser trazable.
  Lee docs/GOVERNANCE.md antes de continuar.
-->

## 📌 Resumen del cambio

<!-- Describe en 1–3 líneas QUÉ cambia y POR QUÉ. -->

**Tipo de cambio** (marca uno):
- [ ] 🐛 Bug fix
- [ ] ✨ Nueva funcionalidad
- [ ] 🎨 UI / UX / estilos
- [ ] 🧪 Tests
- [ ] 🧹 Refactor / limpieza de lint
- [ ] 📚 Documentación
- [ ] 🔧 Infra / CI / despliegue
- [ ] 🔴 Cambio clínico (dosis, interacciones, perlas)

---

## 🤖 Origen del cambio

- [ ] 👤 **Humano** (sin asistencia de IA)
- [ ] 🤝 **Asistido por IA** (IA ayudó pero humano revisó línea a línea)
- [ ] 🤖 **Generado por IA** (IA produjo el grueso; requiere revisión N2+)

**Modelo(s) usado(s)** (si aplica): <!-- ej. Claude Sonnet 4.5, GPT-5, Copilot -->

**Prompt(s) relevante(s)** (si aplica):
<details>
<summary>Ver prompt</summary>

<!-- pega aquí el prompt principal -->
text

</details>

---

## 🧭 Nivel de revisión requerido

| Nivel | Descripción | Aplica |
|-------|-------------|:------:|
| **N1 — Light** | Typos, docs, comentarios, CSS menor | [ ] |
| **N2 — Standard** | Lógica UI, componentes, refactors | [ ] |
| **N3 — Critical** | Lógica clínica, datos médicos, `switchingMatrix` | [ ] |
| **N4 — Restringido** | Secrets, CI/CD, permisos, despliegue | [ ] |

> ⚠️ Si marcas **N3** o **N4**, asigna obligatoriamente los revisores indicados en `docs/GOVERNANCE.md §3.3`.

---

## ⚕️ Riesgo clínico

- [ ] ✅ **Ninguno** — cambio puramente técnico o visual
- [ ] 🟡 **Bajo** — afecta UX pero no contenido clínico
- [ ] 🟠 **Alto** — toca contenido médico pero no lógica de decisión
- [ ] 🔴 **Crítico** — afecta dosis, interacciones o `switchingMatrix`

**Si es Alto o Crítico**, indica la **referencia bibliográfica** que respalda el cambio:
<!-- ej. Maudsley 14th ed., sección X; APA Practice Guideline 2024; NICE NG222 -->

---

## 🧪 Checklist de calidad

- [ ] `npm run lint` → **0 warnings** (no se aceptan advertencias)
- [ ] `npm test` → **verde**
- [ ] Build de producción funciona (`npm run build`)
- [ ] Sin `console.log` de debug
- [ ] Sin código comentado "por si acaso"
- [ ] Sin `TODO` sin issue asociado
- [ ] Rama con prefijo correcto (`feature/`, `fix/`, `claude/`, `copilot/`, `cursor/`)

---

## 🎨 Si toca UI/UX

- [ ] Respeta tokens en `src/styles/variables.css`
- [ ] Usa componentes M3 existentes (`components.css`)
- [ ] Contraste AA verificado
- [ ] Navegación por teclado probada
- [ ] Responsive verificado (móvil + desktop)
- [ ] Playfulness añadido de forma **estratégica** (no invasiva)

---

## 🔐 Seguridad

- [ ] No introduce secretos, tokens ni API keys
- [ ] No pega datos reales de pacientes
- [ ] No modifica `.env`, `wrangler.toml`, ni GitHub Secrets (si aplica → N4)

---

## 📚 Documentación

- [ ] `docs/GOVERNANCE.md` — sin cambios necesarios
- [ ] `docs/design-system.md` — actualizado (si toca UI)
- [ ] `docs/clinica/` — actualizado (si toca contenido médico)
- [ ] `CLOUDFLARE_DEPLOYMENT_GUIDE.md` — actualizado (si toca deploy)
- [ ] `Roadmap y Backlog del Proyecto.txt` — deuda técnica registrada

---

## 🖼️ Capturas / Evidencia

<!-- Antes / Después si es UI. Logs si es fix. Output de tests si es lógica clínica. -->

| Antes | Después |
|-------|---------|
|       |         |

---

## 🔗 Issues relacionados

Closes #
Relates to #

---

## ✅ Confirmación final

- [ ] He leído `docs/GOVERNANCE.md` y cumplo sus reglas.
- [ ] Entiendo que **ningún PR se mergea sin revisión humana explícita**.
- [ ] Si este PR fue generado por IA, **lo he revisado línea a línea** y asumo responsabilidad.
- [ ] El contenido clínico (si aplica) ha sido validado por un Revisor Médico.

---

**Revisores asignados** (según nivel):
- N1: @<!-- dev -->
- N2: @<!-- dev senior -->
- N3: @<!-- dev senior --> + @<!-- revisor médico -->
- N4: @<!-- lead developer -->

---

## 🤖 Sección adicional si el PR fue generado por IA

Marca solo si aplica:

- [ ] Origen: `ai-generated` / `ai-assisted`
- [ ] Modelo usado: <!-- ej. Claude Sonnet 4.5, GPT-5 -->

### Auto-verificación honesta

- [ ] `npm run lint` → 0 warnings (ejecutado, no asumido)
- [ ] `npm test` → verde (ejecutado, no asumido)
- [ ] `npm run build` → éxito (ejecutado, no asumido)
- [ ] Revisé el `git diff` **completo** y no hay cambios que no entienda
- [ ] No hay `TODO`, `FIXME`, `catch {}` vacíos, `console.log` de debug
- [ ] Todos los imports nuevos apuntan a archivos/dependencias reales

### Lo que la IA NO pudo verificar

<!-- Se honesto. Ej: "no pude probar offline", "no verifiqué accesibilidad",
     "no comprobé el comportamiento en Safari" -->

### Confirmación humana

- [ ] Un humano revisó el diff **línea a línea** (no solo "pasó CI")
- [ ] Un humano ejecutó el preview deployment y probó el flujo afectado
- [ ] Si toca UI: un humano verificó visualmente el cambio en desktop y móvil
- [ ] Si toca lógica: un humano escribió o revisó un test que valida el comportamiento
