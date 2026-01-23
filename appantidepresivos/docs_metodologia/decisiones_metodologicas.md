\# Convención canónica de ordinales (Fase App)



\## 1. Principio rector



El dataset original en formato CSV conserva exclusivamente valores

\*\*clínicamente legibles y categóricos\*\* (texto).



La aplicación \*\*no modifica ni reescribe\*\* dichos valores.

Para fines de comparación, filtrado y ordenamiento en la interfaz,

se generan \*\*valores ordinales derivados\*\*, utilizados únicamente a nivel

de lógica interna.



> Los valores ordinales son una \*\*representación relativa\*\*, no una

> cuantificación clínica absoluta.



---



\## 2. Excepción explícita: nivel de sedación



\### Campo: `nivel\_sedacion`



\- Se mantiene \*\*tal cual\*\* en el CSV.

\- Escala numérica discreta \*\*0–3\*\*.

\- No se remapea ni se deriva.



| Valor | Interpretación clínica |

|------|------------------------|

| 0 | Nulo / activador |

| 1 | Bajo |

| 2 | Moderado |

| 3 | Alto |



Este es el \*\*único campo ordinal nativo numérico\*\* permitido en el dataset,

por ser estable, ampliamente comprendido y clínicamente intuitivo.



---



\## 3. Ordinales categóricos derivados (0–2)



\### Regla general



Los siguientes campos:

\- permanecen como \*\*texto\*\* en el CSV,

\- se convierten internamente a un \*\*ordinal discreto\*\*,

\- \*\*nunca\*\* se presentan como números al usuario final.



---



\### 3.1 Disfunción sexual



\*\*Campo CSV:\*\* `perfil\_disfuncion\_sexual`



Valores admitidos:

\- Bajo

\- Moderado

\- Alto (si aparece en versiones futuras)

\- N/D o vacío



\*\*Mapeo interno:\*\*



| Valor CSV | Ordinal |

|---------|--------|

| Bajo | 0 |

| Moderado | 1 |

| Alto | 2 |

| N/D / vacío | null |



\*\*Campo derivado interno:\*\*  

`perfil\_disfuncion\_sexual\_ord`



---



\### 3.2 Riesgo de síndrome de abstinencia  

\### 3.3 Riesgo de prolongación QT



Ambos campos comparten la misma escala ordinal.



\*\*Campos CSV:\*\*

\- `riesgo\_sindrome\_abstinencia`

\- `riesgo\_prolongacion\_qt`



Valores admitidos:

\- Bajo

\- Moderado

\- Alto



\*\*Mapeo interno:\*\*



| Valor CSV | Ordinal |

|---------|--------|

| Bajo | 0 |

| Moderado | 1 |

| Alto | 2 |

| N/D / vacío | null |



\*\*Campos derivados internos:\*\*

\- `riesgo\_sindrome\_abstinencia\_ord`

\- `riesgo\_prolongacion\_qt\_ord`



> Este mapeo indica \*\*orden relativo de riesgo\*\*, no equivalencia clínica

> entre dominios distintos.



---



\### 3.4 Impacto en peso (caso especial)



\*\*Campo CSV:\*\* `perfil\_impacto\_peso`



Valores permitidos:

\- Pérdida

\- Neutro

\- Aumento

\- Pérdida/Neutro

\- Aumento/Neutro

\- Neutro/Aumento



\#### Regla canónica



El valor textual completo se conserva como referencia clínica.

El ordinal interno toma \*\*siempre el peor escenario posible\*\*.



\*\*Mapeo base:\*\*



| Categoría | Ordinal |

|----------|--------|

| Pérdida | 0 |

| Neutro | 1 |

| Aumento | 2 |



\*\*Regla para valores compuestos:\*\*

\- Contiene “Aumento” → ordinal = 2

\- Si no contiene Aumento pero contiene “Neutro” → ordinal = 1

\- Solo “Pérdida” → ordinal = 0



\*\*Ejemplos:\*\*



| Valor CSV | Ordinal |

|---------|--------|

| Pérdida | 0 |

| Neutro | 1 |

| Aumento | 2 |

| Pérdida/Neutro | 1 |

| Aumento/Neutro | 2 |

| Neutro/Aumento | 2 |



\*\*Campo derivado interno:\*\*  

`perfil\_impacto\_peso\_ord`



Esta estrategia evita:

\- promedios artificiales,

\- valores intermedios ficticios,

\- falsa precisión cuantitativa.



---



\## 4. Justificación metodológica



\- El dataset permanece \*\*legible, clínicamente interpretable y publicable\*\*.

\- No se introducen escalas numéricas donde no existen en la evidencia.

\- El comparador y los filtros funcionan de forma robusta y consistente.

\- La estructura es \*\*extensible\*\*: nuevos valores categóricos pueden

&nbsp; incorporarse actualizando solo el mapeo interno.



---



\## 5. Nota de implementación



Los ordinales derivados se generan en la capa de normalización

(`normalize.js`) y \*\*no se persisten\*\* en el dataset original.



Ejemplo conceptual:



```js

export function mapOrdinal(value, map) {

&nbsp; if (!value) return null;

&nbsp; return map\[value] ?? null;

}



export function mapPeso(value) {

&nbsp; if (!value) return null;

&nbsp; if (value.includes("Aumento")) return 2;

&nbsp; if (value.includes("Neutro")) return 1;

&nbsp; if (value.includes("Pérdida")) return 0;

&nbsp; return null;

}



