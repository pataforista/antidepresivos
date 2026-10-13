const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_DIR = path.resolve(__dirname, "../../../../DATASET_PSICOFARMACOLOGIA/antidepresivos/fase_2_canonic");
const OUTPUT_FILE = path.resolve(__dirname, "../public/data/dataset.antidepresivos.v1.0.0.json");

// --- Normalization Logic (Relational Migration & Clinical Validation) ---
function buildRelationalDataset(items) {
    const dataset = {
        farmacos: [],
        indicaciones: [],
        bridge_farmaco_indicacion: [],
        efectos_adversos: [],
        bridge_farmaco_efecto: [],
        interacciones: [],
        bridge_farmaco_interaccion: [],
        enzimas: [],
        bridge_farmaco_enzima: [],
        catalogs: {
            clase_terapeutica: [],
            nivel_sedacion: [
                { id: 0, label: "Nulo" },
                { id: 1, label: "Bajo" },
                { id: 2, label: "Moderado" },
                { id: 3, label: "Alto" }
            ],
            perfil_impacto_peso: [
                { id: 0, label: "Pérdida" },
                { id: 1, label: "Neutro" },
                { id: 2, label: "Aumento" }
            ],
            ordinal_3: [
                { id: 0, label: "Bajo" },
                { id: 1, label: "Moderado" },
                { id: 2, label: "Alto" }
            ]
        }
    };

    const indicacionMap = new Map();
    const efectoMap = new Map();
    const interaccionMap = new Map();
    const enzimaMap = new Map();
    const claseSet = new Set();
    const validationErrors = [];

    items.forEach((item) => {
        const id_farmaco = item.id_farmaco;
        const nombre = item.nombre_generico;

        // 0. Mandatory Field Validation
        const mandatory = ["id_farmaco", "nombre_generico", "clase_terapeutica", "mecanismo_principal"];
        mandatory.forEach(f => {
            if (!item[f] || item[f].trim() === "") {
                validationErrors.push(`[ERROR][${id_farmaco || "UNKNOWN"}] Campo obligatorio faltante: ${f}`);
            }
        });

        // 1. Catalogs & Domain Validation
        if (item.clase_terapeutica) claseSet.add(item.clase_terapeutica);

        const sedVal = parseInt(item.nivel_sedacion, 10);
        if (item.nivel_sedacion !== "" && (isNaN(sedVal) || sedVal < 0 || sedVal > 3)) {
            validationErrors.push(`[DOMAIN][${id_farmaco}] nivel_sedacion inválido: ${item.nivel_sedacion}`);
        }

        // 2. Standardize Missing Data Tokens
        const fieldsToStandardize = [
            "indicaciones_aprobadas_ema", "indicaciones_aprobadas_fda", "indicaciones_off_label",
            "biodisponibilidad_oral", "t_max", "vida_media_parental", "vida_media_metabolitos",
            "ajuste_insuficiencia_hepatica", "ajuste_insuficiencia_renal",
            "efectos_muy_frecuentes", "efectos_frecuentes", "efectos_poco_frecuentes", "efectos_raros_graves",
            "interacciones_contraindicadas", "riesgo_embarazo_multifuente"
        ];
        fieldsToStandardize.forEach(f => {
            if (item[f] === "" || item[f] === undefined) {
                item[f] = "N/D";
            }
        });

        // 3. Clinical Consistency: QT Risk vs EA
        const qtRisk = mapLowModHigh(item.riesgo_prolongacion_qt); // 0=Bajo, 1=Mod, 2=Alto
        if (qtRisk >= 1) { // Moderado o Alto
            const eaText = (item.efectos_raros_graves || "").toLowerCase();
            if (!eaText.includes("qt") && !eaText.includes("arritmia") && !eaText.includes("torsade")) {
                validationErrors.push(`[CLINICAL][${id_farmaco}] Riesgo QT ${qtRisk === 2 ? 'Alto' : 'Mod'} pero no se menciona en efectos raros/graves.`);
            }
        }

        // 4. Indications (FDA, EMA, Off-label)
        processIndications(item.indicaciones_aprobadas_fda, "FDA", id_farmaco, dataset, indicacionMap);
        processIndications(item.indicaciones_aprobadas_ema, "EMA", id_farmaco, dataset, indicacionMap);
        processIndications(item.indicaciones_off_label, "Off-label", id_farmaco, dataset, indicacionMap);

        // 5. Side Effects
        processSideEffects(item.efectos_muy_frecuentes, "muy frecuente", id_farmaco, dataset, efectoMap);
        processSideEffects(item.efectos_frecuentes, "frecuente", id_farmaco, dataset, efectoMap);
        processSideEffects(item.efectos_poco_frecuentes, "poco frecuente", id_farmaco, dataset, efectoMap);
        processSideEffects(item.efectos_raros_graves, "raro grave", id_farmaco, dataset, efectoMap);

        // 6. Interactions
        processInteractions(item.interacciones_contraindicadas, id_farmaco, dataset, interaccionMap);

        // 7. Enzymes (CYP)
        processEnzymes(item.sustrato_enzimatico_principal, "sustrato", id_farmaco, dataset, enzimaMap);
        processEnzymes(item.inhibicion_enzimatica_relevante, "inhibidor", id_farmaco, dataset, enzimaMap);
        processEnzymes(item.induccion_enzimatica, "inductor", id_farmaco, dataset, enzimaMap);

        // 8. Farmaco (Main data)
        const farmaco = { ...item };
        // Remove processed fields to keep it clean (optional, keeping for backward compatibility in rehydration)
        // farmaco._search = buildSearchIndex(farmaco, pickSearchSpec(null)); // Keep for now

        // Add ordinals (schema compliant)
        const ord = {
            perfil_impacto_peso_ord: mapPesoOrdinal(item.perfil_impacto_peso),
            perfil_disfuncion_sexual_ord: mapLowModHigh(item.perfil_disfuncion_sexual),
            riesgo_prolongacion_qt_ord: mapLowModHigh(item.riesgo_prolongacion_qt),
            riesgo_sindrome_abstinencia_ord: mapLowModHigh(item.riesgo_sindrome_abstinencia),
            perfil_activacion_ord: mapLowModHigh(item.perfil_activacion)
        };

        const flags = {
            black_box_warning: parseSiNoDesconocido(item.black_box_warning),
            aprobado_uso_pediatrico: parseSiNoDesconocido(item.aprobado_uso_pediatrico),
            autorizado_ema: parseSiNo(item.autorizado_ema)
        };

        farmaco._norm = { ord, flags };

        // Materialize for schema compatibility
        Object.assign(farmaco, ord);
        Object.assign(farmaco, flags);

        dataset.farmacos.push(farmaco);
    });

    dataset.catalogs.clase_terapeutica = Array.from(claseSet).sort().map((c, i) => ({ id: `CLS_${i}`, label: c }));

    if (validationErrors.length > 0) {
        console.warn("\n=== VALIDATION WARNINGS ===");
        validationErrors.forEach(e => console.warn(e));
        console.warn("============================\n");
    }

    return dataset;
}

function processIndications(raw, source, farmacoId, dataset, map) {
    if (!raw || raw === "N/D" || raw === "Nula") return;
    const parts = raw.split(";").map(p => p.trim()).filter(Boolean);
    parts.forEach(p => {
        let id;
        if (map.has(p)) {
            id = map.get(p);
        } else {
            id = `IND_${String(dataset.indicaciones.length).padStart(3, '0')}`;
            dataset.indicaciones.push({ id, nombre: p });
            map.set(p, id);
        }
        dataset.bridge_farmaco_indicacion.push({ farmaco_id: farmacoId, indicacion_id: id, fuente: source });
    });
}

function processSideEffects(raw, severity, farmacoId, dataset, map) {
    if (!raw || raw === "N/D" || raw === "Nula") return;
    const parts = raw.split(";").map(p => p.trim()).filter(Boolean);
    parts.forEach(p => {
        let id;
        if (map.has(p)) {
            id = map.get(p);
        } else {
            id = `EA_${String(dataset.efectos_adversos.length).padStart(3, '0')}`;
            dataset.efectos_adversos.push({ id, nombre: p });
            map.set(p, id);
        }
        dataset.bridge_farmaco_efecto.push({ farmaco_id: farmacoId, efecto_id: id, frecuencia: severity });
    });
}

function processInteractions(raw, farmacoId, dataset, map) {
    if (!raw || raw === "N/D" || raw === "Nula") return;
    const parts = raw.split(";").map(p => p.trim()).filter(Boolean);
    parts.forEach(p => {
        let id;
        if (map.has(p)) {
            id = map.get(p);
        } else {
            id = `INT_${String(dataset.interacciones.length).padStart(3, '0')}`;
            dataset.interacciones.push({ id, nombre: p });
            map.set(p, id);
        }
        dataset.bridge_farmaco_interaccion.push({ farmaco_id: farmacoId, interaccion_id: id });
    });
}

function processEnzymes(raw, role, farmacoId, dataset, map) {
    if (!raw || raw === "N/D" || raw === "No" || raw === "Nula") return;
    const parts = raw.split(";").map(p => p.trim()).filter(Boolean);
    parts.forEach(p => {
        let id;
        if (map.has(p)) {
            id = map.get(p);
        } else {
            id = `CYP_${String(dataset.enzimas.length).padStart(3, '0')}`;
            dataset.enzimas.push({ id, nombre: p });
            map.set(p, id);
        }
        dataset.bridge_farmaco_enzima.push({ farmaco_id: farmacoId, enzima_id: id, rol: role });
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
    const files = fs.readdirSync(INPUT_DIR)
        .filter(f => f.endsWith('.csv'))
        .sort((a, b) => a.localeCompare(b));

    let allItems = [];

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const content = fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8');
        const items = parseCSV(content);
        allItems = allItems.concat(items);
    }

    console.log(`Total items loaded: ${allItems.length}`);

    // Build Relational Dataset
    console.log("Building relational dataset...");
    const relationalDataset = buildRelationalDataset(allItems);

    // Build search index for each drug (using rehydrated-like fields)
    const searchSpec = pickSearchSpec(null);
    relationalDataset.farmacos.forEach(f => {
        f._search = buildSearchIndex(f, searchSpec);
    });

    // Write JSON
    console.log(`Writing to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(relationalDataset, null, 4), 'utf-8');

    console.log("Done!");
} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
