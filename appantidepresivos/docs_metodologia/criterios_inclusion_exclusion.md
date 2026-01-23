{

&nbsp; "meta": {

&nbsp;   "criteriaId": "criterios\_inclusion\_exclusion",

&nbsp;   "format": "criteria-v1",

&nbsp;   "version": "2025.12-demo",

&nbsp;   "hash": "crit001",

&nbsp;   "language": "es",

&nbsp;   "createdAt": "2025-12-20",

&nbsp;   "author": "César Celada",

&nbsp;   "scopeNote": "Criterios orientativos con fines educativos y comparativos. No constituyen indicaciones prescriptivas ni sustituyen guías clínicas."

&nbsp; },

&nbsp; "contexts": \[

&nbsp;   {

&nbsp;     "id": "depresion\_mayor\_adulto",

&nbsp;     "label": "Trastorno depresivo mayor (adultos)",

&nbsp;     "description": "Contexto general de uso en adultos sin comorbilidades mayores no controladas.",

&nbsp;     "appliesTo": {

&nbsp;       "edad": "adulto",

&nbsp;       "diagnostico": "TDM"

&nbsp;     }

&nbsp;   }

&nbsp; ],

&nbsp; "criteria": \[

&nbsp;   {

&nbsp;     "id": "bupropion\_tda",

&nbsp;     "farmaco\_id": "ADP\_ATYP\_01",

&nbsp;     "contextId": "depresion\_mayor\_adulto",

&nbsp;     "inclusion": \[

&nbsp;       {

&nbsp;         "type": "sintoma",

&nbsp;         "label": "Anhedonia predominante",

&nbsp;         "rationale": "Perfil dopaminérgico puede ser útil en anhedonia y enlentecimiento psicomotor.",

&nbsp;         "evidenceLevel": "consenso"

&nbsp;       },

&nbsp;       {

&nbsp;         "type": "comorbilidad",

&nbsp;         "label": "TDAH comórbido",

&nbsp;         "rationale": "Utilizado como opción no estimulante en algunos contextos.",

&nbsp;         "evidenceLevel": "moderada"

&nbsp;       }

&nbsp;     ],

&nbsp;     "exclusion": \[

&nbsp;       {

&nbsp;         "type": "riesgo",

&nbsp;         "label": "Historia de convulsiones",

&nbsp;         "rationale": "Riesgo dosis-dependiente de convulsiones.",

&nbsp;         "severity": "alta"

&nbsp;       },

&nbsp;       {

&nbsp;         "type": "condicion",

&nbsp;         "label": "Trastornos de la conducta alimentaria",

&nbsp;         "rationale": "Aumento del riesgo convulsivo.",

&nbsp;         "severity": "alta"

&nbsp;       }

&nbsp;     ],

&nbsp;     "notes": \[

&nbsp;       "Evitar incrementos rápidos de dosis.",

&nbsp;       "Considerar interacciones vía CYP2B6."

&nbsp;     ]

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "mirtazapina\_insomnio",

&nbsp;     "farmaco\_id": "ADP\_ATYP\_02",

&nbsp;     "contextId": "depresion\_mayor\_adulto",

&nbsp;     "inclusion": \[

&nbsp;       {

&nbsp;         "type": "sintoma",

&nbsp;         "label": "Insomnio severo",

&nbsp;         "rationale": "Antagonismo H1 favorece sedación.",

&nbsp;         "evidenceLevel": "alta"

&nbsp;       },

&nbsp;       {

&nbsp;         "type": "estado\_nutricional",

&nbsp;         "label": "Pérdida de peso o caquexia",

&nbsp;         "rationale": "Estimulación del apetito y ganancia ponderal.",

&nbsp;         "evidenceLevel": "moderada"

&nbsp;       }

&nbsp;     ],

&nbsp;     "exclusion": \[

&nbsp;       {

&nbsp;         "type": "riesgo",

&nbsp;         "label": "Obesidad o síndrome metabólico no controlado",

&nbsp;         "rationale": "Riesgo de aumento de peso y alteraciones metabólicas.",

&nbsp;         "severity": "moderada"

&nbsp;       }

&nbsp;     ],

&nbsp;     "notes": \[

&nbsp;       "Sedación dosis-dependiente inversa (mayor a dosis bajas)."

&nbsp;     ]

&nbsp;   }

&nbsp; ]

}



