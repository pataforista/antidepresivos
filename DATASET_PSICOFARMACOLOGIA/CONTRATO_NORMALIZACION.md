CONTRATO DE NORMALIZACIÓN — Antidepresivos (CSV → JSON runtime)
Autor: César Celada
Objetivo:
- Preservar el CSV como “verdad editable y auditable”.
- Derivar SOLO lo mínimo para filtros, comparación y búsqueda (sin falsa precisión).

A) Principios
1) Nunca se modifica el dataset (raw). Se añade un bloque derivado:
   - item._norm: valores normalizados para UI/Core
   - item._search: string normalizado para búsqueda includes()
2) Los ordinales son internos (runtime). No se escriben en el CSV.
3) Regla de oro: si el valor es ambiguo o mixto → no se fuerza; se deja null y se usa nullPolicy="include".

B) Salidas generadas por item
1) item._search: string
   - concatena campos seleccionados
   - minúsculas + sin tildes + trim + colapsa espacios

2) item._norm.ord (ordinales)
- peso_ordinal (0–2):
  Origen: perfil_impacto_peso (raw) con posibles valores:
    "Pérdida", "Neutro", "Aumento", o mixtos "Aumento/Neutro"
  Regla: peor-caso (Aumento > Neutro > Pérdida)
  Mapeo:
    Pérdida → 0
    Neutro  → 1
    Aumento → 2
  Si no mapea → null

- disfuncion_sexual_0a2 (0–2):
  Origen: perfil_disfuncion_sexual (raw): Bajo/Moderado/Alto
  Mapeo:
    Bajo → 0
    Moderado → 1
    Alto → 2
  Si no mapea → null

- qt_ordinal (0–2):
  Origen: riesgo_prolongacion_qt (raw): Bajo/Moderado/Alto
  Mapeo: igual que arriba

- abstinencia_ordinal (0–2):
  Origen: riesgo_sindrome_abstinencia (raw): Bajo/Moderado/Alto
  Mapeo: igual que arriba

- activacion_ordinal (0–2):
  Origen: perfil_activacion (raw) si usa Bajo/Moderado/Alto
  Mapeo: igual que arriba
  Si el campo no es consistente en el dataset → null

3) item._norm.flags (booleanos derivables)
- black_box (true/false/null):
  Origen: black_box_warning (raw): Sí/No/Desconocido
- aprobado_pediatria (true/false/null):
  Origen: aprobado_uso_pediatrico (raw): Sí/No/Desconocido
- autorizado_ema (true/false/null):
  Origen: autorizado_ema (raw): Sí/No (si aparece Desconocido, se admite null)

C) Campos NO normalizados (se preservan como raw)
- mecanismos, indicaciones, textos regulatorios, interacciones, embarazo_multifuente, etc.
- Rangos como "2–3 h" o "150–300 mg/día" se dejan como string (no se convierten a numérico).

D) Política de nulls
- Si un _norm.* es null, filtros y comparador deben tratarlo con nullPolicy="include" (no excluye).
