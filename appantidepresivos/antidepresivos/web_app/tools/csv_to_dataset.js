const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_DIR = "C:/Users/Admin/Desktop/Antidepresivos/DATASET_PSICOFARMACOLOGIA/antidepresivos/fase_2_canonic";
const OUTPUT_FILE = "C:/Users/Admin/Desktop/Antidepresivos/appantidepresivos/antidepresivos/web_app/public/data/dataset.antidepresivos.v1.0.0.json";

// --- Normalization Logic (Copied from normalize.js) ---
function normalizeDatasetItems(items, schemaUI = null) {
    const searchSpec = pickSearchSpec(schemaUI);

    return items.map((item) => {
        const out = item;

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

        if (Array.isArray(v)) {
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
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function mapLowModHigh(v) {
    const t = normalizeToken(v);
    if (!t) return null;
    if (t === "bajo") return 0;
    if (t === "moderado") return 1;
    if (t === "alto") return 2;
    // Handle combined logic if needed (e.g. "Moderado-Alto")
    if (t.includes("moderado") && t.includes("alto")) return 1.5; // Custom handling if desired

    if (t === "alto") return 2;
    return null;
}
// Fix typo in mapLowModHigh above (processed inside mapPesoOrdinal logic instead)
// Actually correcting mapLowModHigh:
function mapLowModHigh(v) {
    const t = normalizeToken(v);
    if (!t) return null;
    if (t === "bajo") return 0;
    if (t === "moderado") return 1;
    if (t === "alto") return 2;
    // Simple heuristic for "Moderado-Alto"
    if (t.includes("moderado") && t.includes("alto")) return 2;
    if (t.includes("bajo") && t.includes("moderado")) return 1;
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
        else if (p === "perdida" || p === "pérdida") best = Math.max(best, 0);
    }
    return best >= 0 ? best : null;
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

// --- CSV Parsing Logic ---
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const headers = parseCSVLine(lines[0]);

    const items = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const item = {};
        headers.forEach((h, idx) => {
            let val = values[idx];
            if (val === undefined) val = "";
            val = val.trim();
            item[h] = val;
        });
        items.push(item);
    }
    return items;
}

function parseCSVLine(line) {
    const values = [];
    let current = "";
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuote && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            values.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}

// --- Main Execution ---
try {
    console.log(`Scanning CSVs in ${INPUT_DIR}...`);
    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.csv'));

    let allItems = [];

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const content = fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8');
        const items = parseCSV(content);
        allItems = allItems.concat(items);
    }

    console.log(`Total items loaded: ${allItems.length}`);

    // Normalize
    console.log("Normalizing items...");
    // Pass null schema, rely on fallback
    const normalizedItems = normalizeDatasetItems(allItems, null);

    // Write JSON
    console.log(`Writing to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalizedItems, null, 4), 'utf-8');

    console.log("Done!");
} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
