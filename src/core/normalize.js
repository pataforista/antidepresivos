export function normalizeDatasetItems(items, schemaUI = null) {
  if (!Array.isArray(items)) {
    throw new Error(`normalizeDatasetItems: se esperaba Array, llegó: ${typeof items}`);
  }

  const searchSpec = pickSearchSpec(schemaUI);

  return items.map((item) => {
    const out = (item && typeof item === "object") ? { ...item } : { value: item };


    out._search = buildSearchIndex(out, searchSpec);

    // Normaliza sedación a escala 0-3 (sin perder el valor original)
    out.nivel_sedacion_raw = out.nivel_sedacion ?? null;
    out.nivel_sedacion = mapSedationOrdinal(out.nivel_sedacion);

    // Normalización de equivalencia (Fluoxetina)
    out.equiv_fluoxetina_raw = out.equiv_fluoxetina ?? null;
    out.equiv_fluoxetina_norm = mapNumericValue(out.equiv_fluoxetina);

    // Ordinales (nombres alineados a tu SCHEMA_UI)
    const ord = {};
    ord.perfil_impacto_peso_ord = mapPesoOrdinal(out.perfil_impacto_peso);
    ord.perfil_disfuncion_sexual_ord = mapLowModHigh(out.perfil_disfuncion_sexual);
    ord.riesgo_prolongacion_qt_ord = mapLowModHigh(out.riesgo_prolongacion_qt);
    ord.riesgo_sindrome_abstinencia_ord = mapLowModHigh(out.riesgo_sindrome_abstinencia);
    ord.perfil_activacion_ord = mapLowModHigh(out.perfil_activacion);

    // Flags
    const flags = {};
    flags.black_box_warning = parseSiNoDesconocido(out.black_box_warning);
    flags.aprobado_uso_pediatrico = parseSiNoDesconocido(out.aprobado_uso_pediatrico);
    flags.autorizado_ema = parseSiNo(out.autorizado_ema);

    out._norm = { ord, flags };

    // Materializa ordFields para que SCHEMA_UI y filtros funcionen
    out.perfil_impacto_peso_ord = ord.perfil_impacto_peso_ord;
    out.perfil_disfuncion_sexual_ord = ord.perfil_disfuncion_sexual_ord;
    out.perfil_disfuncion_erectil_ord = ord.perfil_disfuncion_sexual_ord; // Fallback común
    out.riesgo_prolongacion_qt_ord = ord.riesgo_prolongacion_qt_ord;
    out.riesgo_sindrome_abstinencia_ord = ord.riesgo_sindrome_abstinencia_ord;

    return out;
  });
}

function pickSearchSpec(schemaUI) {
  const fallbackFields = [
    "nombre_generico",
    "id_farmaco",
    "clase_terapeutica",
    "mecanismo_principal",
    "codigo_atc",
    "utilidad_sintomatica_clave",
    "indicaciones_off_label"
  ];

  const fields =
    schemaUI?.search?.fallbackFields ||
    schemaUI?.search?.fields ||
    fallbackFields;

  return { fields };
}

function buildSearchIndex(item, spec) {
  const parts = [];
  for (const f of spec.fields) {
    const v = getPath(item, f);
    if (v === null || v === undefined) continue;

    if (Array.isArray(v)) parts.push(v.join(" "));
    else parts.push(String(v));
  }
  return normalizeText(parts.join(" "));
}

function normalizeText(s) {
  return (s ?? "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function mapLowModHigh(v) {
  const t = normalizeToken(v);
  if (!t) return null;

  if (/^[0-2]$/.test(t)) return Number(t);

  if (t.includes("alto")) return 2;
  if (t.includes("moderado")) return 1;
  if (t.includes("bajo")) return 0;

  if (t === "bajo") return 0;
  if (t === "moderado") return 1;
  if (t === "alto") return 2;
  return null;
}

function mapPesoOrdinal(v) {
  const t = normalizeToken(v);
  if (!t) return null;

  const parts = t.split("/").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  let best = -1;
  for (const p of parts) {
    if (p === "aumento") best = Math.max(best, 2);
    else if (p === "neutro") best = Math.max(best, 1);
    else if (p === "perdida" || p === "pérdida" || p === "bajo") best = Math.max(best, 0);
  }
  return best >= 0 ? best : null;
}

function mapSedationOrdinal(v) {
  const t = normalizeToken(v);
  if (!t) return null;

  if (/^[0-3]$/.test(t)) return Number(t);
  if (t.includes("nulo")) return 0;
  if (t.includes("bajo")) return 1;
  if (t.includes("moderado")) return 2;
  if (t.includes("alto")) return 3;
  return null;
}

function mapNumericValue(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(",", ".").trim();
  const match = s.match(/([0-9]+(\.[0-9]+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

function parseSiNoDesconocido(v) {
  const t = normalizeToken(v);
  if (!t) return null;
  if (t === "si" || t === "sí") return true;
  if (t === "no") return false;
  return null;
}

function parseSiNo(v) {
  const t = normalizeToken(v);
  if (!t) return null;
  if (t === "si" || t === "sí") return true;
  if (t === "no") return false;
  return null;
}

function normalizeToken(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getPath(obj, path) {
  if (!path || typeof path !== "string") return undefined;
  if (!path.includes(".")) return obj[path];

  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
