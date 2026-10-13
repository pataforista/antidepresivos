const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Admin/Desktop/Antidepresivos/DATASET_PSICOFARMACOLOGIA/antidepresivos/fase_2_canonic';

const patches = [
    {
        id: "ADP_SSRI_01",
        name: "Sertralina",
        patch: {
            indicaciones_aprobadas_ema: "Enfermedad depresiva; Trastorno obsesivo-compulsivo (TOC); Trastorno de pánico; Trastorno de ansiedad social; Trastorno de estrés postraumático (TEPT)",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAO); Pimozida"
        }
    },
    {
        id: "ADP_SSRI_02",
        name: "Fluoxetina",
        patch: {
            indicaciones_aprobadas_ema: "Depresión mayor; Bulimia nerviosa; Trastorno obsesivo-compulsivo (TOC)",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAO); Pimozida; Tioridazina"
        }
    },
    {
        id: "ADP_SSRI_03",
        name: "Paroxetina",
        patch: {
            indicaciones_aprobadas_ema: "Depresión mayor; Trastorno de ansiedad social; Trastorno por estrés postraumático (TEPT); Trastorno de ansiedad generalizada; Trastorno obsesivo-compulsivo; Trastorno de pánico",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAO); Tioridazina"
        }
    },
    {
        id: "ADP_SSRI_04",
        name: "Citalopram",
        patch: {
            indicaciones_aprobadas_ema: "Enfermedad depresiva; Trastorno de pánico",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAO); Pimozida; Linezolid; Azul de metileno; Uroquinasa; Dapoxetina"
        }
    },
    {
        id: "ADP_SSRI_05",
        name: "Escitalopram",
        patch: {
            indicaciones_aprobadas_ema: "Enfermedad depresiva; Trastorno de ansiedad generalizada; Trastorno obsesivo-compulsivo; Trastorno de pánico; Trastorno de ansiedad social",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAO)"
        }
    },
    {
        id: "ADP_SSRI_06",
        name: "Fluvoxamina",
        patch: {
            indicaciones_aprobadas_ema: "Enfermedad depresiva; Trastorno obsesivo-compulsivo",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAO); Tizanidina; Terfenadina; Astemizol"
        }
    },
    {
        id: "ADP_SNRI_01",
        name: "Venlafaxina",
        patch: {
            indicaciones_aprobadas_ema: "Trastorno depresivo mayor; trastorno de ansiedad generalizada; trastorno de ansiedad social",
            inhibicion_enzimatica_relevante: "CYP2D6: inhibidor débil",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAOs); Riesgo de arritmia cardíaca; Hipertensión no controlada"
        }
    },
    {
        id: "ADP_SNRI_02",
        name: "Desvenlafaxina",
        patch: {
            indicaciones_aprobadas_ema: "No aprobada por EMA/UK para depresión (autorizada fuera de UE)",
            inhibicion_enzimatica_relevante: "CYP2D6: inhibidor débil",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAOs)"
        }
    },
    {
        id: "ADP_SNRI_03",
        name: "Duloxetina",
        patch: {
            indicaciones_aprobadas_ema: "Trastorno depresivo mayor; Trastorno de ansiedad generalizada; Neuropatía diabética; Incontinencia urinaria de esfuerzo",
            interacciones_contraindicadas: "Inhibidores de la Monoaminooxidasa (IMAO); Tioridazina; Glaucoma de ángulo estrecho no controlado; Inhibidores potentes de CYP1A2 (fluvoxamina, ciprofloxacino)"
        }
    },
    {
        id: "ADP_SNRI_04",
        name: "Levomilnacipran",
        patch: {
            inhibicion_enzimatica_relevante: "CYP2D6: inhibidor débil",
            restricciones_ue: "Not licensed in the UK/EU for depression"
        }
    },
    {
        id: "ADP_ATYP_04",
        name: "Vortioxetina",
        patch: {
            metabolito_activo_nombre: "Nula",
            vida_media_metabolitos: "N/A",
            inhibicion_enzimatica_relevante: "Ninguna relevante (sustrato de múltiples enzimas)"
        }
    },
    {
        id: "ADP_ATYP_05",
        name: "Vilazodona",
        patch: {
            metabolito_activo_nombre: "Nula",
            vida_media_metabolitos: "N/A",
            inhibicion_enzimatica_relevante: "CYP2C8: inhibidor"
        }
    },
    {
        id: "ADP_ATYP_06",
        name: "Agomelatina",
        patch: {
            metabolito_activo_nombre: "Nula",
            vida_media_metabolitos: "N/A",
            inhibicion_enzimatica_relevante: "Ninguna relevante (sustrato de CYP1A2)"
        }
    },
    {
        id: "ADP_ATYP_07",
        name: "Mianserina",
        patch: {
            metabolito_activo_nombre: "Nula",
            vida_media_metabolitos: "N/A",
            inhibicion_enzimatica_relevante: "Ninguna relevante"
        }
    },
    {
        id: "ADP_ATYP_03",
        name: "Trazodona",
        patch: {
            inhibicion_enzimatica_relevante: "Ninguna reportada (sustrato de CYP3A4)"
        }
    },
    {
        id: "ADP_TCA_01",
        name: "Imipramina",
        patch: {
            inhibicion_enzimatica_relevante: "CYP2C19: inhibidor potente; CYP2D6: inhibidor; CYP1A2: inhibidor; CYP3A4: inhibidor"
        }
    },
    {
        id: "ADP_TCA_02",
        name: "Amitriptilina",
        patch: {
            inhibicion_enzimatica_relevante: "CYP2C19: inhibidor potente; CYP2D6: inhibidor; CYP1A2: inhibidor; CYP2C9: inhibidor; CYP3A4: inhibidor"
        }
    },
    {
        id: "ADP_TCA_03",
        name: "Nortriptilina",
        patch: {
            inhibicion_enzimatica_relevante: "CYP2D6: inhibidor débil"
        }
    },
    {
        id: "ADP_TCA_04",
        name: "Desipramina",
        patch: {
            inhibicion_enzimatica_relevante: "CYP2D6: inhibidor débil"
        }
    },
    {
        id: "ADP_TCA_05",
        name: "Doxepina",
        patch: {
            inhibicion_enzimatica_relevante: "CYP2C19: inhibidor; CYP2D6: inhibidor; CYP1A2: inhibidor; CYP3A4: inhibidor; CYP2C9: inhibidor"
        }
    },
    {
        id: "ADP_TCA_06",
        name: "Clomipramina",
        patch: {
            inhibicion_enzimatica_relevante: "CYP2C19: inhibidor potente; CYP2D6: inhibidor; CYP1A2: inhibidor; CYP3A4: inhibidor"
        }
    }
];

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

function escapeCSV(val) {
    if (val === null || val === undefined) return "";
    val = String(val).trim();
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return;

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(parseCSVLine);

    let modified = false;
    const updatedRows = rows.map(row => {
        const idIndex = headers.indexOf('id_farmaco');
        const nameIndex = headers.indexOf('nombre_generico');
        const id = row[idIndex];
        const name = row[nameIndex];

        const patchFound = patches.find(p => p.id === id || p.name.toLowerCase() === name.toLowerCase());
        if (patchFound) {
            modified = true;
            console.log(`Patching ${name} (${id}) in ${file}`);
            Object.keys(patchFound.patch).forEach(field => {
                const colIndex = headers.indexOf(field);
                if (colIndex !== -1) {
                    row[colIndex] = patchFound.patch[field];
                } else {
                    console.warn(`Field ${field} not found in CSV headers`);
                }
            });
        }
        return row;
    });

    if (modified) {
        const newContent = [headers.join(',')].concat(updatedRows.map(r => r.map(escapeCSV).join(','))).join('\n');
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated ${file}`);
    }
});
