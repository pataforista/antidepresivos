\# Changelog — Dataset Canónico de Antidepresivos



Este documento registra de forma cronológica, explícita y auditable

los cambios realizados al dataset canónico de antidepresivos.



El objetivo del changelog es:

\- asegurar trazabilidad clínica y técnica,

\- documentar decisiones metodológicas relevantes,

\- facilitar auditoría, reproducibilidad y mantenimiento a largo plazo.



---



\## \[2.0.0] — 2025-01

\### Fase 2 — Dataset Canónico Farmacológico (Cierre)



\#### ✨ Nuevas incorporaciones

\- Dataset farmacológico completo de antidepresivos organizado por bloques:

&nbsp; - ISRS

&nbsp; - SNRI

&nbsp; - Tricíclicos (TCA)

&nbsp; - IMAO

&nbsp; - Atípicos

&nbsp; - Antidepresivos de acción rápida / vanguardia

\- Inclusión de fármacos de innovación reciente:

&nbsp; - Esketamina (intranasal, REMS)

&nbsp; - Ketamina (off-label)

&nbsp; - Brexanolona (IV, depresión postparto)

&nbsp; - Zuranolona (oral, curso corto 14 días)

\- Inclusión explícita de Mianserina como precursor químico de Mirtazapina.



\#### 🔒 Decisiones canónicas cerradas

\- \*\*Uso pediátrico\*\*:

&nbsp; - Campo estrictamente binario (`Sí` / `No`).

&nbsp; - Se excluyen rangos de edad y dosificación pediátrica.

\- \*\*Embarazo\*\*:

&nbsp; - Campo `riesgo\_embarazo\_multifuente` multifuente y narrativo.

&nbsp; - Prohibida la síntesis en categorías únicas (FDA A/B/C/D/X).

\- \*\*Riesgos clínicos\*\*:

&nbsp; - Todos expresados como categorías ordinales.

&nbsp; - Prohibido el uso de valores numéricos continuos.

\- \*\*Sedación\*\*:

&nbsp; - Escala fija 0–3 (`nivel\_sedacion`).

\- \*\*Peso\*\*:

&nbsp; - Campo `perfil\_impacto\_peso` restringido a:

&nbsp;   - Aumento / Neutro / Pérdida.

\- \*\*Disfunción sexual\*\*:

&nbsp; - Codificada de forma ordinal (Alto / Moderado / Bajo / Nulo).



\#### 🧠 Refinamientos farmacológicos relevantes

\- Corrección de cinética \*\*no lineal\*\* de Paroxetina.

\- Ajuste de vida media de Norfluoxetina y su impacto en estado estacionario.

\- Marcaje de \*\*riesgo QT Alto\*\* en Citalopram.

\- Distinción explícita de perfiles NET > SERT en SNRI.

\- Diferenciación farmacodinámica entre:

&nbsp; - Ketamina / Esketamina (glutamatérgicos, disociativos).

&nbsp; - Neuroesteroides (GABA-A, sedantes).

\- Documentación de:

&nbsp; - riesgo de convulsiones dosis-dependiente (Bupropión),

&nbsp; - priapismo (Trazodona),

&nbsp; - hepatotoxicidad (Agomelatina),

&nbsp; - crisis hipertensiva por tiramina (IMAO).



\#### 🧪 Validación y control de calidad

\- Definición y congelación de `rules\_antidepresivos.yaml`.

\- Implementación de `validate\_antidepresivos.py`:

&nbsp; - validación estructural,

&nbsp; - validación de dominios categóricos,

&nbsp; - chequeos de coherencia clínica interna,

&nbsp; - soporte para validación por bloques o dataset integrado.

\- Introducción de `antidepresivos\_fase2\_completo.csv`

&nbsp; como archivo \*\*derivado\*\*, no editable manualmente.



\#### 🗂️ Arquitectura de datos

\- Separación explícita entre:

&nbsp; - \*\*Farmacología pura\*\* (este dataset).

&nbsp; - \*\*Guías clínicas\*\* (dataset independiente, fase posterior).

\- Inclusión de carpeta de archivo histórico (`archivo\_historico/fase\_1`).



\#### ⚠️ Exclusiones explícitas

\- No se incluyen:

&nbsp; - algoritmos de tratamiento,

&nbsp; - jerarquías de guías,

&nbsp; - cálculos automáticos dentro del CSV,

&nbsp; - escalas de riesgo cuantitativas.



Este cierre define la \*\*línea base estable\*\* del dataset farmacológico.

Cualquier cambio posterior deberá incrementar versión mayor o menor

según impacto clínico.



---



\## \[1.x.x] — Archivo histórico

\### Fase 1 — Versiones preliminares (No canónicas)



\- Registros incompletos o no validados.

\- Uso heterogéneo de formatos numéricos.

\- Ausencia de reglas clínicas explícitas.

\- Conservado únicamente con fines históricos y de trazabilidad.



---



\## Convenciones de versionado



\- \*\*Major (X.0.0)\*\*: cambios metodológicos o clínicos estructurales.

\- \*\*Minor (0.X.0)\*\*: incorporación de nuevos fármacos o campos.

\- \*\*Patch (0.0.X)\*\*: correcciones técnicas sin impacto clínico.



---



\## Autoría y mantenimiento



Dataset desarrollado y curado con criterios clínicos y metodológicos

orientados a comparabilidad, trazabilidad y uso docente/investigación.



Estado actual: \*\*Canónico — Congelado\*\*



