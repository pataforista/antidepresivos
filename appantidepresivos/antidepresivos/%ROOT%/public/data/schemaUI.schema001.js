// public/data/schemaUI.schema001.js
export const SCHEMA_UI = {
  meta: {
    appTitle: "Antidepresivos — Códice",
    author: "César Celada",
    versionKey: "manifest.version",
  },

  keys: {
    primary: "id_farmaco",
    display: "nombre_generico",
    group: "clase_terapeutica",
    atc: "codigo_atc",
  },

  list: {
    titleField: "nombre_generico",
    subtitleFields: ["clase_terapeutica", "mecanismo_principal"],
    rightMetaFields: ["codigo_atc"],
    badges: [
      { id: "sedacion", label: "Sed", rawField: "nivel_sedacion", ordField: "nivel_sedacion", renderer: "badgeSedacion", tooltip: "Nivel de sedación (0–3).", showIfMissing: false },
      { id: "peso", label: "Peso", rawField: "perfil_impacto_peso", ordField: "perfil_impacto_peso_ord", renderer: "badgePeso", tooltip: "Impacto en peso (raw) + ordinal peor-caso (0–2)." },
      { id: "sexual", label: "Sex", rawField: "perfil_disfuncion_sexual", ordField: "perfil_disfuncion_sexual_ord", renderer: "badgeOrdinal3", tooltip: "Disfunción sexual (ordinal 0–2)." },
      { id: "qt", label: "QT", rawField: "riesgo_prolongacion_qt", ordField: "riesgo_prolongacion_qt_ord", renderer: "badgeOrdinal3", tooltip: "Riesgo de QT (ordinal 0–2)." },
      { id: "abstinencia", label: "Abst", rawField: "riesgo_sindrome_abstinencia", ordField: "riesgo_sindrome_abstinencia_ord", renderer: "badgeOrdinal3", tooltip: "Riesgo de síndrome de abstinencia (ordinal 0–2)." },
    ],
  },

  filters: [
    { id: "q", label: "Buscar", type: "textContains", fields: ["nombre_generico", "codigo_atc", "mecanismo_principal", "clase_terapeutica"], normalize: "basic" },
    { id: "grupo", label: "Clase", type: "enum", field: "clase_terapeutica", valuesFromData: true, allowMulti: true },
    { id: "sedacion", label: "Sedación", type: "rangeInt", field: "nivel_sedacion", min: 0, max: 3, nullPolicy: "include" },
    {
      id: "peso", label: "Peso", type: "ordinal", field: "perfil_impacto_peso_ord",
      levels: [{ value: 0, label: "Pérdida" }, { value: 1, label: "Neutro" }, { value: 2, label: "Aumento" }],
      nullPolicy: "include",
    },
    {
      id: "sexual", label: "Disfunción sexual", type: "ordinal", field: "perfil_disfuncion_sexual_ord",
      levels: [{ value: 0, label: "Bajo" }, { value: 1, label: "Moderado" }, { value: 2, label: "Alto" }],
      nullPolicy: "include",
    },
    {
      id: "qt", label: "QT", type: "ordinal", field: "riesgo_prolongacion_qt_ord",
      levels: [{ value: 0, label: "Bajo" }, { value: 1, label: "Moderado" }, { value: 2, label: "Alto" }],
      nullPolicy: "include",
    },
    {
      id: "abstinencia", label: "Abstinencia", type: "ordinal", field: "riesgo_sindrome_abstinencia_ord",
      levels: [{ value: 0, label: "Bajo" }, { value: 1, label: "Moderado" }, { value: 2, label: "Alto" }],
      nullPolicy: "include",
    },
    { id: "pediatria", label: "Aprobado pediatría", type: "boolean", field: "aprobado_uso_pediatrico", trueLabel: "Sí", falseLabel: "No", nullPolicy: "include" },
    { id: "bbb", label: "Black box", type: "boolean", field: "black_box_warning", trueLabel: "Sí", falseLabel: "No", nullPolicy: "include" },
  ],

  detail: {
    sections: [
      {
        id: "identidad", title: "Identidad",
        fields: [
          { field: "nombre_generico", label: "Nombre genérico", renderer: "plain" },
          { field: "clase_terapeutica", label: "Clase", renderer: "plain" },
          { field: "mecanismo_principal", label: "Mecanismo", renderer: "plain" },
          { field: "codigo_atc", label: "ATC", renderer: "mono" },
          { field: "grupo_quimico", label: "Grupo químico", renderer: "plain" },
        ],
      },
      {
        id: "decisivos", title: "Perfiles rápidos",
        fields: [
          { field: "nivel_sedacion", label: "Sedación", renderer: "meterSedacion" },
          { field: "perfil_impacto_peso", label: "Peso", renderer: "badgePesoLargo", ordField: "perfil_impacto_peso_ord" },
          { field: "perfil_disfuncion_sexual", label: "Disfunción sexual", renderer: "meterOrdinal3", ordField: "perfil_disfuncion_sexual_ord" },
          { field: "riesgo_prolongacion_qt", label: "QT", renderer: "meterOrdinal3", ordField: "riesgo_prolongacion_qt_ord" },
          { field: "riesgo_sindrome_abstinencia", label: "Abstinencia", renderer: "meterOrdinal3", ordField: "riesgo_sindrome_abstinencia_ord" },
        ],
      },
      {
        id: "farmacocinetica", title: "Farmacocinética",
        fields: [
          { field: "biodisponibilidad_oral", label: "Biodisponibilidad oral", renderer: "unitPercentOrPlain" },
          { field: "t_max", label: "Tmax", renderer: "plain" },
          { field: "vida_media_parental", label: "Vida media", renderer: "plain" },
          { field: "vida_media_metabolitos", label: "Metabolitos: vida media", renderer: "plain" },
          { field: "sustrato_enzimatico_principal", label: "CYP sustrato", renderer: "bulletsSemicolon" },
          { field: "inhibicion_enzimatica_relevante", label: "CYP inhibición", renderer: "bulletsSemicolon" },
          { field: "induccion_enzimatica", label: "CYP inducción", renderer: "bulletsSemicolon" },
        ],
      },
      {
        id: "dosis", title: "Dosis (adulto)",
        fields: [
          { field: "dosis_inicio_adulto", label: "Inicio", renderer: "plain" },
          { field: "rango_terapeutico_adulto", label: "Rango", renderer: "plain" },
          { field: "dosis_maxima_autorizada", label: "Máxima autorizada", renderer: "plain" },
          { field: "frecuencia_administracion", label: "Frecuencia", renderer: "plain" },
        ],
      },
      {
        id: "seguridad", title: "Seguridad y EA",
        fields: [
          { field: "efectos_muy_frecuentes", label: "Muy frecuentes", renderer: "bulletsSemicolon" },
          { field: "efectos_frecuentes", label: "Frecuentes", renderer: "bulletsSemicolon" },
          { field: "efectos_poco_frecuentes", label: "Poco frecuentes", renderer: "bulletsSemicolon" },
          { field: "efectos_raros_graves", label: "Raros / graves", renderer: "bulletsSemicolon" },
          { field: "interacciones_contraindicadas", label: "Contraindicadas", renderer: "bulletsSemicolon" },
        ],
      },
      { id: "embarazo", title: "Embarazo y lactancia", fields: [{ field: "riesgo_embarazo_multifuente", label: "Multifuente", renderer: "multisourceAccordion" }] },
      {
        id: "regulatorio", title: "Regulatorio",
        fields: [
          { field: "fecha_aprobacion_fda", label: "FDA: aprobación", renderer: "plain" },
          { field: "indicaciones_aprobadas_fda", label: "FDA: indicaciones", renderer: "bulletsSemicolon" },
          { field: "autorizado_ema", label: "EMA: autorizado", renderer: "booleanIcon" },
          { field: "indicaciones_aprobadas_ema", label: "EMA: indicaciones", renderer: "bulletsSemicolon" },
          { field: "restricciones_ue", label: "UE: restricciones", renderer: "bulletsSemicolon" },
          { field: "aprobado_uso_pediatrico", label: "Pediatría", renderer: "booleanIcon" },
          { field: "black_box_warning", label: "Black box", renderer: "booleanIcon" },
        ],
      },
    ],
  },

  compare: {
    maxDesktop: 4,
    maxMobile: 2,
    persistInUrl: true,
    persistInLocalStorage: true,
    fields: [
      { label: "Sedación", rawField: "nivel_sedacion", renderer: "compareMeterSedacion" },
      { label: "Peso", rawField: "perfil_impacto_peso", ordField: "perfil_impacto_peso_ord", renderer: "comparePeso" },
      { label: "Sexual", rawField: "perfil_disfuncion_sexual", ordField: "perfil_disfuncion_sexual_ord", renderer: "compareOrdinal3" },
      { label: "QT", rawField: "riesgo_prolongacion_qt", ordField: "riesgo_prolongacion_qt_ord", renderer: "compareOrdinal3" },
      { label: "Abstinencia", rawField: "riesgo_sindrome_abstinencia", ordField: "riesgo_sindrome_abstinencia_ord", renderer: "compareOrdinal3" },
      { label: "Mecanismo", rawField: "mecanismo_principal", renderer: "plain" },
      { label: "CYP", rawField: "sustrato_enzimatico_principal", renderer: "plain" },
    ],
  },
};
