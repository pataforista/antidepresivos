---
name: 🔴 Cambio clínico
about: Modificación de dosis, interacciones, perlas clínicas o switchingMatrix
title: "[CLÍNICO] "
labels: ["riesgo-clinico-critico", "needs-medical-review"]
assignees: ""
---

> ⚠️ **Antes de continuar**: lee `docs/GOVERNANCE.md §3` (zonas prohibidas para IA) y §3.3 (nivel N3).
> Este issue **no puede cerrarse** sin aprobación explícita de un Revisor Médico.

## 🩺 ¿Qué cambia?

<!-- Describe el cambio clínico en 2–3 líneas. -->

## 📚 Fuente clínica

Obligatorio citar **al menos una** referencia verificable:

- [ ] Maudsley Prescribing Guidelines (edición + sección)
- [ ] APA Practice Guideline (año + sección)
- [ ] NICE Guideline (código + sección)
- [ ] Otra: <!-- especifica -->

**Cita textual / referencia**:

<!-- pega aquí la cita o el fragmento relevante -->
text


## 🎯 Alcance del cambio

- [ ] Dosis
- [ ] Interacción
- [ ] `switchingMatrix` (IMAO ↔ ISRS ↔ otros)
- [ ] Perlas clínicas (ES y/o EN)
- [ ] Categoría / clasificación
- [ ] Otro:

## 🔬 Casos clínicos afectados

<!-- Si toca switchingMatrix, lista los pares de fármacos afectados.
     Ej: "IMAO → ISRS: washout 14 días" -->

## 📂 Archivos a modificar

<!-- ej. data/perlas-es.csv, data/perlas-en.csv, src/lib/switchingMatrix.js -->

## 🧪 Plan de validación

- [ ] Test unitario nuevo en `tests/`
- [ ] Test unitario actualizado (indicar cuál):
- [ ] Verificación manual en la app:
- [ ] Revisión por segunda persona del equipo clínico:

## 👥 Revisores requeridos (N3)

- Revisor Médico: @
- Dev senior: @

## 🚦 Riesgo si NO se aplica

<!-- ej. "Riesgo de síndrome serotoninérgico si un clínico asume washout incorrecto" -->

## 🔗 Issues relacionados

Closes #
Relates to #
