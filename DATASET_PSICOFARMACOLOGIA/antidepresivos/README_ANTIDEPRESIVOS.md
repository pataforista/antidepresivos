

```

DATASET\_PSICOFARMACOLOGIA/

└── antidepresivos/

&nbsp;   └── README\_ANTIDEPRESIVOS.md

```



---



\## `README\_ANTIDEPRESIVOS.md`



````markdown

\# Dataset Canónico de Antidepresivos — Fase 2



Este directorio contiene el \*\*dataset farmacológico canónico de antidepresivos\*\*,

diseñado para uso clínico, docente e investigativo.



El dataset prioriza:

\- comparabilidad entre fármacos,

\- trazabilidad regulatoria y clínica,

\- ausencia de falsa precisión,

\- separación estricta entre farmacología y guías clínicas.



Este \*\*NO es un algoritmo de tratamiento\*\* ni una guía de prescripción.



---



\## 1. Alcance del Dataset



Incluye antidepresivos utilizados en práctica clínica contemporánea,

organizados por \*\*familias farmacológicas\*\*, cubriendo:



\- ISRS

\- SNRI

\- Tricíclicos (TCA)

\- Inhibidores de la MAO (IMAO)

\- Antidepresivos atípicos

\- Antidepresivos de acción rápida / vanguardia



El dataset cubre exclusivamente \*\*farmacología\*\*:

mecanismo, farmacocinética, seguridad, perfiles clínicos comparativos

y estado regulatorio.



Las \*\*guías clínicas\*\* se almacenan en un dataset separado.



---



\## 2. Principios Metodológicos Clave



\### 2.1 No falsa precisión

\- Riesgos clínicos expresados \*\*solo de forma ordinal/categórica\*\*.

\- No se incluyen probabilidades, porcentajes de eventos adversos

&nbsp; ni escalas numéricas no comparables.



\### 2.2 Separación farmacología / evidencia

\- Este dataset responde a \*\*“qué es el fármaco”\*\*.

\- El dataset de guías responde a \*\*“cuándo usarlo”\*\*.



\### 2.3 Campos cerrados

Algunos campos están \*\*canónicamente bloqueados\*\* y no deben redefinirse:



\- `nivel\_sedacion`: escala fija 0–3

\- `perfil\_impacto\_peso`: Aumento / Neutro / Pérdida

\- `riesgo\_embarazo\_multifuente`: texto multifuente, no sintetizado

\- `aprobado\_uso\_pediatrico`: binario (Sí / No)



---



\## 3. Estructura de Archivos



```text

antidepresivos/

├── fase\_2\_canonic/

│   ├── antidepresivos\_isrs.csv

│   ├── antidepresivos\_snri.csv

│   ├── antidepresivos\_tca.csv

│   ├── antidepresivos\_imao.csv

│   ├── antidepresivos\_atipicos.csv

│   ├── antidepresivos\_accion\_rapida.csv

│   └── antidepresivos\_fase2\_completo.csv  ← archivo derivado

│

├── validator/

│   ├── rules\_antidepresivos.yaml

│   └── validate\_antidepresivos.py

│

├── archivo\_historico/

│   └── fase\_1/

│       └── antidepresivos\_fase1.csv

│

├── CHANGELOG.md

└── README\_ANTIDEPRESIVOS.md

````



---



\## 4. Reglas Críticas de Uso



\### 4.1 `antidepresivos\_fase2\_completo.csv`



\* Es un \*\*archivo derivado\*\*.

\* \*\*NO debe editarse manualmente\*\*.

\* Se genera concatenando los bloques canónicos

&nbsp; tras validación individual.



\### 4.2 Validación obligatoria



Todo cambio debe cumplir:



```text

CSV → validador → PASS → merge → PASS final

```



El dataset no se considera válido si no pasa

`validate\_antidepresivos.py`.



---



\## 5. Convenciones Importantes



\### 5.1 Uso pediátrico



\* Campo binario.

\* No se incluyen rangos etarios ni dosis pediátricas.

\* La ausencia de aprobación ≠ contraindicación clínica.



\### 5.2 Embarazo



\* Campo narrativo multifuente.

\* Preserva discrepancias entre agencias (FDA / EMA / otras).

\* No implica recomendación clínica directa.



\### 5.3 Sedación (0–3)



| Valor | Significado   |

| ----- | ------------- |

| 0     | Nulo o mínimo |

| 1     | Leve          |

| 2     | Moderado      |

| 3     | Alto          |



\### 5.4 Peso



Describe \*\*tendencia relativa\*\*, no magnitud ni probabilidad.



---



\## 6. Qué NO incluye este dataset



Explícitamente excluido:



\* algoritmos de tratamiento,

\* jerarquización de líneas terapéuticas,

\* scores de riesgo,

\* síntesis automática de guías,

\* recomendaciones prescriptivas.



Estas capas se implementan \*\*encima\*\*, no aquí.



---



\## 7. Estado del Dataset



\* \*\*Fase actual\*\*: Fase 2

\* \*\*Estado\*\*: Canónico / Congelado

\* \*\*Cambios futuros\*\*:



&nbsp; \* nuevos fármacos → versión minor

&nbsp; \* cambios metodológicos → versión major



Ver `CHANGELOG.md` para trazabilidad completa.



---



\## 8. Público objetivo



Este dataset está diseñado para:



\* psiquiatras y médicos en formación,

\* investigación clínica y psicofarmacológica,

\* docencia estructurada,

\* herramientas de soporte a decisión clínica (CDSS),

\* aplicaciones educativas y comparativas.



No está diseñado para uso directo por pacientes.



---



\## 9. Autoría y Filosofía



Dataset construido bajo principios de:



\* rigor clínico,

\* transparencia metodológica,

\* comparabilidad real,

\* y resistencia a la obsolescencia rápida.



La intención es que el dataset \*\*aguante el paso del tiempo\*\*

y permita crecer capas superiores sin reescritura constante.



---



\## Derechos de autor y uso



© 2025 \*\*César Celada\*\*. Todos los derechos reservados.



Este dataset, su estructura, reglas de validación, criterios metodológicos

y curaduría clínica constituyen una obra intelectual original.



Se permite:

\- uso académico y docente,

\- análisis no comercial,

\- citación con atribución explícita.



No se permite:

\- redistribución comercial sin autorización,

\- modificación y redistribución sin conservar autoría,

\- uso como sustituto de juicio clínico.



El autor no se responsabiliza por el uso clínico directo del dataset

sin supervisión profesional.



---



\*\*Fin del documento\*\*



````



