/* ============================================================
   src/core/normalize.js
   Normalización runtime (CSV→JSON ya parseado)
   - Genera: item._search, item._norm.ord, item._norm.flags
   - NO altera valores raw (solo añade propiedades)
   ============================================================ */

export function normalizeDatasetItems(items, schemaUI = null) {
  const searchSpec = pickSearchSpec(schemaUI);

  return items.map((item) => {
    const out = item; // mutación controlada (más rápido). Si prefieres inmutable: {...item}

    // _search
    out._search = buildSearchIndex(out, searchSpec);

    // _norm
    const ord = {};
    ord.peso_ordinal = mapPesoOrdinal(out.perfil_impacto_peso);
    ord.disfuncion_sexual_0a2 = mapLowModHigh(out.perfil_disfuncion_sexual);
    ord.qt_ordinal = mapLowModHigh(out.riesgo_prolongacion_qt);
    ord.abstinencia_ordinal = mapLowModHigh(out.riesgo_sindrome_abstinencia);
    ord.activacion_ordinal = mapLowModHigh(out.perfil_activacion);

    const flags = {};
    flags.black_box = parseSiNoDesconocido(out.black_box_warning);
    flags.aprobado_pediatria = parseSiNoDesconocido(out.aprobado_uso_pediatrico);
    flags.autorizado_ema = parseSiNo(out.autorizado_ema);

    out._norm = { ord, flags };

    return out;
  });
}

/* =========================
   Search spec
   ========================= */

function pickSearchSpec(schemaUI) {
  // Preferimos el esquema si existe; si no, fallback seguro.
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

    if (Array.isArray(v)) {
      // listas: join con espacio
      parts.push(v.join(" "));
    } else {
      parts.push(String(v));
    }
  }
  return normalizeText(parts.join(" "));
}

function normalizeText(s) {
  return (s ?? "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .toLowerCase()
    .replace(/\s+/g, " "); // colapsa espacios
}

/* =========================
   Ordinal mappers
   ========================= */

function mapLowModHigh(v) {
  const t = normalizeToken(v);
  if (!t) return null;
  if (t === "bajo") return 0;
  if (t === "moderado") return 1;
  if (t === "alto") return 2;
  return null;
}

function mapPesoOrdinal(v) {
  const t = normalizeToken(v);
  if (!t) return null;

  // Acepta "Aumento/Neutro" etc.
  const parts = t.split("/").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  // peor-caso: Aumento(2) > Neutro(1) > Pérdida(0)
  let best = -1;
  for (const p of parts) {
    if (p === "aumento") best = Math.max(best, 2);
    else if (p === "neutro") best = Math.max(best, 1);
    else if (p === "perdida" || p === "pérdida") best = Math.max(best, 0);
  }
  return best >= 0 ? best : null;
}

/* =========================
   Boolean policies
   ========================= */

function parseSiNoDesconocido(v) {
  const t = normalizeToken(v);
  if (!t) return null;
  if (t === "si" || t === "sí") return true;
  if (t === "no") return false;
  // valores típicos: "desconocido", "n/d", "", etc.
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

/* =========================
   Utils: getPath
   ========================= */

function getPath(obj, path) {
  // Soporta "a.b.c" y también campos simples "nombre"
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
