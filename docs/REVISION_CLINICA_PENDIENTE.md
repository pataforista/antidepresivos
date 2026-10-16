# Revisión clínica pendiente: información que necesitamos

| | |
| --- | --- |
| **Fecha** | 2026-10-16 |
| **Dataset auditado** | `public/data/dataset.antidepresivos.v1.0.0.json` (45 fármacos), `dataset.en.json`, `switching_matrix.json`, `synergies.json`, `guias_clinicas.json`, CSV canónicos en `DATASET_PSICOFARMACOLOGIA/antidepresivos/fase_2_canonic/` |
| **Lógica auditada** | `src/ui/switchView.js` (reglas de switching), `tests/switchingMatrix.test.js`, `src/core/selectors.js` |
| **Tipo** | Auditoría de solo lectura. **No se modificó ningún dato clínico ni regla de switching** (AGENTS.md, regla 1) |
| **Quién debe responder** | Psiquiatra o farmacólogo clínico con autoridad de validación (ver `docs/GOVERNANCE.md`) |

## Cómo usar este documento

Cada ítem describe lo que encontramos, por qué importa y la pregunta concreta que necesita respuesta. Los datos salen de scripts que leen los JSON y CSV; no son una opinión clínica nuestra. Donde citamos una ficha técnica, lo marcamos como "a confirmar": la validación final corresponde al revisor.

Para responder, basta con completar la tabla del final (o comentar en el PR) con la decisión, el valor correcto y la fuente. Con esa respuesta, el cambio en código o datos se hace en un PR separado con humano en el circuito.

## Resumen por prioridad

| ID | Prioridad | Área | Hallazgo en una línea |
| --- | --- | --- | --- |
| C-1 | **P1 — seguridad** | Switching | Moclobemida recibe 14 días de lavado en producción; el test afirma 24 h |
| C-2 | **P1 — seguridad** | Switching | Lavados > 14 días antes de un IMAO: solo existe la regla de fluoxetina |
| C-3 | **P1 — seguridad** | Switching | Potenciadores y fármacos de acción rápida reciben un cross-taper genérico |
| C-4 | **P1 — seguridad** | Switching | Fluoxetina → no IMAO: dos reglas distintas (matriz vs. código) |
| C-5 | **P1 — seguridad** | QT | CSV y JSON discrepan en `riesgo_prolongacion_qt` de 10 fármacos |
| C-6 | P2 | Switching | La matriz curada tiene 5 pares; el resto usa un protocolo genérico |
| C-7 | P2 | Dosis | Mianserina y levomilnacipran: valores distintos entre CSV y JSON |
| C-8 | P2 | CYP / interacciones | 11 fármacos sin filas en tablas puente: la monografía muestra "N/D" en CYP |
| C-9 | P2 | Trazabilidad | 14 fármacos solo existen en el JSON, sin CSV canónico ni validador |
| C-10 | P2 | Evidencia | Solo las perlas clínicas tienen fuente; dosis, QT y embarazo no |
| C-11 | P2 | Guías | Versiones antiguas o sin año en `guias_clinicas.json` |
| C-12 | P3 | Dominios | Valores fuera de catálogo (peso, QT de litio, uso pediátrico de sertralina) |
| C-13 | P3 | Completitud | Campos farmacocinéticos vacíos |
| C-14 | P3 | Sinergias | Cuatro combinaciones con fuentes genéricas y lenguaje promocional |
| C-15 | P3 | Idioma | Paridad ES/EN estructuralmente completa; falta revisión semántica |

---

## P1 — Seguridad del paciente

### C-1. Moclobemida (RIMA): el test y la app dicen cosas distintas

**Lo que encontramos**

- En el dataset, la clase de moclobemida es `"IMAO reversible (RIMA)"`.
- `switchView.js` detecta IMAO buscando el texto `imao` en la clase. Moclobemida entra en esa rama y recibe **14 días de lavado**, con el texto "inhibición enzimática irreversible".
- `tests/switchingMatrix.test.js` afirma que moclobemida → ISRS requiere **24 horas**. El test pasa porque usa un fixture con `clase_terapeutica: 'RIMA'` (sin "imao") y una copia de la lógica, no el código real. Con la clase real, la regla de 24 h es inalcanzable.
- La selegilina transdérmica (`"IMAO transdérmico"`) también recibe 14 días y el mismo texto.

**Por qué importa**

Hay una suite de pruebas verde que da una falsa sensación de cobertura en la regla más delicada de la herramienta. Además, el texto sobre la inhibición irreversible es incorrecto para un RIMA.

**Qué necesitamos**

1. Lavado correcto para moclobemida → ISRS, IRSN, tricíclicos y otros serotoninérgicos.
2. Lavado correcto en sentido inverso (ISRS/IRSN → moclobemida), con la excepción de fluoxetina, si aplica.
3. Reglas para la selegilina transdérmica según dosis (6 / 9 / 12 mg/24 h), si difieren.
4. ¿Se mantiene la postura conservadora de 14 días para todos los IMAO, aceptando el coste clínico, o se distingue RIMA?
5. Texto de justificación correcto para RIMA.

### C-2. Fármacos que requieren más de 14 días de lavado antes de un IMAO

**Lo que encontramos**

El código solo tiene una excepción: fluoxetina → IMAO = 35 días. Cualquier otro fármaco → IMAO recibe 14 días.

**Qué necesitamos**

Lista de fármacos del dataset que requieren un lavado mayor de 14 días antes de iniciar un IMAO, con su valor y fuente. Según nuestra lectura de la ficha FDA de vortioxetina, se indican 21 días (**a confirmar**). Pedimos revisar también clomipramina, bupropión y los fármacos con metabolitos de vida media larga.

### C-3. Potenciadores y fármacos de acción rápida en el selector de switching

**Lo que encontramos**

El selector de switching ofrece los 45 fármacos. Para cualquier par sin entrada en la matriz y sin IMAO, el código propone un **cross-taper genérico de 14 días**. Eso incluye pares como sertralina → litio, escitalopram → liotironina, venlafaxina → ketamina o mirtazapina → brexanolona (IV).

**Por qué importa**

Los potenciadores (aripiprazol, quetiapina, brexpiprazol, litio, liotironina, modafinilo, lisdexanfetamina) se añaden, no sustituyen. Ketamina, esketamina, brexanolona y zuranolona tienen esquemas propios. Un plan de cross-taper para ellos carece de sentido clínico.

**Qué necesitamos**

1. ¿Qué fármacos deben excluirse del selector de switching?
2. Para los que se mantengan, ¿qué mensaje o regla debe mostrar la app?

### C-4. Fluoxetina → otro antidepresivo no IMAO: dos reglas en conflicto

**Lo que encontramos**

- `switching_matrix.json`, fluoxetina → sertralina: `direct_switch`, `taper_days: 0`, `washout_days: 3`.
- Código (fallback para cualquier otro destino): `taper_days: 5`, `washout_days: 3`.
- El test asume `direct_switch` con 3 días para fluoxetina → cualquier ISRS.

**Qué necesitamos**

Una única regla validada (directa, con o sin reducción, días de espera) y si cambia según el destino (ISRS, IRSN, tricíclico, por ejemplo por inhibición de CYP2D6).

### C-5. Riesgo de prolongación del QT: CSV y JSON no coinciden

**Lo que encontramos**

En el CSV canónico, la columna `riesgo_prolongacion_qt` contiene texto de interacciones (columnas desplazadas). El JSON que sirve la app tiene valores distintos:

| Fármaco | CSV (`fase_2_canonic`) | JSON (lo que ve el usuario) |
| --- | --- | --- |
| Citalopram | `IMAO` | `Alto` |
| Escitalopram | `IMAO` | `Moderado` |
| Sertralina | `IMAO; pimozida` | `Bajo` |
| Fluoxetina | `IMAO` | `Bajo` |
| Paroxetina | `IMAO; tioridazina` | `Bajo` |
| Fluvoxamina | `IMAO; tizanidina` | `Bajo` |
| Venlafaxina | `IMAO; linezolid; azul de metileno IV` | `Bajo` |
| Desvenlafaxina | `IMAO; linezolid; azul de metileno IV` | `Bajo` |
| Duloxetina | `IMAO; linezolid; azul de metileno IV` | `Bajo` |
| Brexanolona | `Alcohol; opioides; benzodiacepinas; depresores SNC` | `Bajo` |

**Qué necesitamos**

1. Confirmar los 10 valores del JSON (en particular, citalopram `Alto` frente a escitalopram `Moderado`, y venlafaxina `Bajo`).
2. Confirmar que el texto desplazado del CSV corresponde a `interacciones_contraindicadas` y no a otro campo.
3. Decidir cuál es la fuente canónica: el CSV o el JSON. Hoy no está claro y el CSV es claramente erróneo en estas filas.

---

## P2 — Exactitud y trazabilidad

### C-6. Cobertura de la matriz de switching curada

La matriz tiene **5 pares** (sertralina → venlafaxina, fluoxetina → sertralina, escitalopram → venlafaxina, paroxetina → sertralina, duloxetina → escitalopram). Todo lo demás muestra la etiqueta "Protocolo genérico — verificar en guías". Además, el calendario suma siempre 14 días de titulación del nuevo fármaco, con un mínimo de 21 días en total.

**Qué necesitamos**

1. Lista priorizada de pares frecuentes en la práctica para curar (sugerimos 15–20).
2. Para cada par: estrategia, días de reducción, días de lavado, notas y fuente.
3. Validar o corregir los 5 pares actuales y la regla de 14 días de titulación del calendario.

### C-7. Dosis y vida media con valores divergentes

| Fármaco | Campo | CSV | JSON |
| --- | --- | --- | --- |
| Mianserina | `dosis_maxima_autorizada` | `120 mg/día` | `200 mg/día (histórica)` |
| Mianserina | `vida_media_parental` | `21–61 h` | `20–40 h` |
| Levomilnacipran | `dosis_inicio_adulto` | `Ajustar si ERC` | `20 mg/día` |
| Levomilnacipran | `rango_terapeutico_adulto` | `20 mg/día` | `40–120 mg/día` |
| Levomilnacipran | `dosis_maxima_autorizada` | `40–120 mg/día` | `120 mg/día` |

En levomilnacipran el CSV parece tener columnas desplazadas y el JSON parece correcto. En mianserina la diferencia es real.

**Qué necesitamos**: valores correctos y fuente; para mianserina, si se muestra la dosis máxima "histórica" o la autorizada vigente, y en qué región.

### C-8. Fármacos sin datos en las tablas puente (CYP, indicaciones, efectos, interacciones)

**Lo que encontramos**

Estos 11 fármacos no tienen ninguna fila en `bridge_farmaco_indicacion`, `bridge_farmaco_efecto`, `bridge_farmaco_interaccion` ni `bridge_farmaco_enzima`: tianeptina, reboxetina, maprotilina, amoxapina, aripiprazol, quetiapina, brexpiprazol, litio, liotironina, modafinilo, lisdexanfetamina. Brexanolona tampoco tiene filas de interacción.

**Por qué importa**

La monografía (`detailView.js`) arma "Sustrato de / Inhibe / Induce" desde esas tablas. Para estos fármacos muestra **"N/D"**, aunque el campo de texto `sustrato_enzimatico_principal` sí tiene información. Un clínico puede leer "N/D" como "sin relevancia CYP", lo que es falso, por ejemplo, para quetiapina o aripiprazol.

**Qué necesitamos**: para cada fármaco, las enzimas con su rol (sustrato, inhibidor, inductor), sus indicaciones con fuente (FDA, EMA, off-label), sus efectos adversos por frecuencia y sus interacciones contraindicadas.

### C-9. Fármacos sin CSV canónico

14 fármacos existen en el JSON pero no en `fase_2_canonic/`, por lo que el validador (`validate_antidepresivos.py`) nunca los revisa: moclobemida, tianeptina, reboxetina, maprotilina, amoxapina, dosulepina, lofepramina y los 7 potenciadores. Moclobemida está en este grupo, lo que agrava C-1.

**Qué necesitamos**: confirmar que sus datos fueron revisados y por quién, o programar su revisión.

### C-10. Evidencia por campo

- El objeto `evidence` solo cubre `perlas_clinicas`. Dosis, QT, embarazo, ajuste renal o hepático y black box no tienen fuente asociada.
- Fluvoxamina, desvenlafaxina y levomilnacipran no tienen ninguna evidencia.
- Entre las fuentes de las perlas aparecen Wikipedia (3 citas), Mayo Clinic (2) y "Psychiatry - Clinical Gate" (8), junto a Maudsley con ediciones mezcladas (14.ª, 15.ª y sin edición).

**Qué necesitamos**

1. Sustituir las fuentes de baja jerarquía por fichas técnicas, guías o revisiones.
2. Unificar la edición de Maudsley.
3. Decidir el nivel mínimo de trazabilidad: como mínimo para dosis, QT, embarazo y ajustes por insuficiencia.

### C-11. Vigencia de las guías clínicas

`guias_clinicas.json` cita: NICE NG222 (2022), CANMAT (2016), APA (2010, reafirmada), NICE CG113, CANMAT Anxiety (2014), y tres entradas sin año ("NICE / APA", "NICE CG31 / APA", "ACOG / NICE", "CANMAT / APA").

**Qué necesitamos**

1. Confirmar la versión vigente de cada guía. Para depresión existe una actualización de CANMAT de 2023 (**a confirmar** su incorporación).
2. Año y documento exacto de las entradas sin año.
3. Fecha de la última revisión de cada resumen.

---

## P3 — Consistencia y completitud

### C-12. Valores fuera del catálogo definido

`dataset_metadata.json` fija los dominios permitidos, y hay valores que no encajan:

- `perfil_impacto_peso` (permitido: Pérdida / Neutro / Aumento). 15 fármacos usan valores mixtos: ketamina y esketamina `Neutro/Bajo`, brexanolona `Bajo`, trazodona `Aumento/Neutro`, agomelatina `Pérdida/Bajo`, isocarboxazida `Aumento/Neutro`, fluoxetina `Neutro / Pérdida`, venlafaxina, duloxetina, levomilnacipran y modafinilo `Neutro/Pérdida`, nortriptilina `Neutro/Aumento`, lofepramina `Aumento moderado`, aripiprazol `Bajo/Neutro`, brexpiprazol `Moderado`.
- `riesgo_prolongacion_qt` de litio: `Bajo (raras arritmias)`.
- `aprobado_uso_pediatrico` de sertralina: vacío (`null`).

**Qué necesitamos**: la categoría correcta de cada uno, o ampliar el catálogo, que es una decisión clínica porque alimenta filtros y comparaciones.

### C-13. Campos vacíos

| Campo | Fármacos sin valor |
| --- | --- |
| `biodisponibilidad_oral` | ketamina, esketamina, brexanolona, fenelzina, tranilcipromina, isocarboxazida, selegilina transdérmica, amoxapina |
| `vida_media_metabolitos` | esketamina, brexanolona, zuranolona, mirtazapina, tianeptina, reboxetina, fenelzina, tranilcipromina, isocarboxazida, selegilina |
| `metabolito_activo_nombre` | esketamina, brexanolona, zuranolona, mirtazapina, reboxetina, fenelzina, tranilcipromina, isocarboxazida, selegilina |
| `indicaciones_aprobadas_ema` | ketamina, esketamina, brexanolona, zuranolona, selegilina, amoxapina |
| `indicaciones_off_label` | esketamina, brexanolona, zuranolona, brexpiprazol |
| `estado_comercial_fda` | moclobemida, dosulepina, lofepramina |
| `t_max` | brexanolona, selegilina |
| `union_proteinas_plasmaticas` | isocarboxazida, lisdexanfetamina |
| `vida_media_parental` | isocarboxazida |
| `volumen_distribucion` | lisdexanfetamina |
| `riesgo_embarazo_multifuente` | brexanolona |

Algunos vacíos son legítimos (no hay metabolito activo, no está aprobado por la EMA, vía no oral). **Qué necesitamos**: distinguir "no aplica" de "dato faltante" y completar estos últimos.

### C-14. Sinergias y combinaciones

`synergies.json` contiene 4 entradas (mirtazapina + venlafaxina, bupropión + ISRS, ISRS + trazodona, ISRS + IMAO como alerta). Las fuentes son genéricas ("Stahl 2013", "Guías Clínicas CANMAT" sin año) y algunos textos usan un lenguaje poco cauteloso para una herramienta clínica ("Eficacia extrema", "aumento masivo").

**Qué necesitamos**: validar el contenido, ajustar el tono, añadir fuentes específicas y decidir si se incorporan otras combinaciones, como la potenciación con litio o T3.

### C-15. Paridad español/inglés

Estructuralmente está completa: 45/45 fármacos en ambos idiomas, sin campos vacíos en inglés y sin textos idénticos al español en los campos narrativos. Un script no puede comprobar la equivalencia de significado.

**Qué necesitamos**: revisión por una persona clínica bilingüe, al menos de `perlas_clinicas`, `black_box_warning`, `riesgo_embarazo_multifuente` y los textos de las reglas de switching.

---

## Plantilla de respuesta

| ID | Decisión (aprobar / corregir / excluir) | Valor correcto | Fuente (documento, edición, sección) | Revisor | Fecha |
| --- | --- | --- | --- | --- | --- |
| C-1 | | | | | |
| C-2 | | | | | |
| C-3 | | | | | |
| C-4 | | | | | |
| C-5 | | | | | |
| C-6 | | | | | |
| C-7 | | | | | |
| C-8 | | | | | |
| C-9 | | | | | |
| C-10 | | | | | |
| C-11 | | | | | |
| C-12 | | | | | |
| C-13 | | | | | |
| C-14 | | | | | |
| C-15 | | | | | |

## Cambios técnicos que dependen de esta revisión

Estos cambios no se pueden hacer sin las respuestas de arriba y quedan bloqueados:

- **Extraer la lógica de switching de `switchView.js` a una función pura** e importarla en `tests/switchingMatrix.test.js`, para que el test verifique el código real y no una copia. Requiere C-1, C-2 y C-4.
- **Regenerar el JSON desde los CSV canónicos**, o declarar el JSON como fuente. Requiere C-5, C-7 y C-9.
- **Filtrar el selector de switching.** Requiere C-3.

## Fuera de alcance de esta auditoría

- Exactitud farmacológica de los campos que coinciden entre CSV y JSON: no se comparó con fuentes externas.
- `glosario_terminos.json`, `criterios_inclusion_exclusion.json`, `legal.legal001.json` y el banco de preguntas del quiz.
- Contenido de `missing_pearls.json` más allá de comprobar que todas las entradas tienen evidencia y ningún `quality_flag`.
