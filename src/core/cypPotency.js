/* ============================================================
   src/core/cypPotency.js
   Lee la potencia de inhibición CYP desde el texto libre del dataset.

   El campo `inhibicion_enzimatica_relevante` llega en formatos variados:
     "Inhibidor potente CYP1A2 y moderado CYP2C19"
     "CYP2C19: inhibidor potente; CYP2D6: inhibidor"
     "Cyp2C19 (Inhibidor); Cyp3A4 (Inductor débil)"
     "Strong CYP2D6; Moderate CYP3A4"
     "Ninguna relevante (sustrato de CYP1A2)"
   Cada segmento (separado por ";", "," o " y "/" and ") se evalúa por separado,
   de modo que la potencia de una enzima no se contagia a la siguiente.

   Valores devueltos:
     "+++" potente · "++" moderado · "+" débil
     "?"   inhibe, pero el dato no gradúa la potencia
     "-"   sin inhibición registrada
   ============================================================ */

const RX_STRONG = /\b(potente|fuerte|strong|potent)\b/i;
const RX_MODERATE = /\b(moderad[oa]|moderate)\b/i;
const RX_WEAK = /\b(d[ée]bil|weak|leve|mild|m[íi]nim[oa])\b/i;
const RX_INDUCER = /\b(inductor|inducer|induc)/i;
const RX_INHIBITOR = /\b(inhibi)/i;
const RX_SUBSTRATE = /\b(sustrato|substrate)\b/i;

function splitSegments(raw) {
    return String(raw)
        // Quita los paréntesis de "sustrato de ..." para que no cuenten como inhibición
        .replace(/\((?:[^)]*\b(?:sustrato|substrate)\b[^)]*)\)/gi, "")
        .split(/;|,|\s+y\s+|\s+and\s+/i)
        .map(s => s.trim())
        .filter(Boolean);
}

/**
 * @param {string} rawStr  Texto de inhibición enzimática del dataset
 * @param {{pattern: RegExp}} col  Columna CYP (p.ej. { pattern: /CYP2D6/i })
 * @returns {"+++"|"++"|"+"|"?"|"-"}
 */
export function parsePotency(rawStr, col) {
    if (!rawStr) return "-";
    let best = "-";
    const rank = { "-": 0, "?": 1, "+": 2, "++": 3, "+++": 4 };

    for (const seg of splitSegments(rawStr)) {
        if (!col.pattern.test(seg)) continue;
        if (RX_SUBSTRATE.test(seg)) continue;
        // Un inductor no es un inhibidor (p.ej. modafinilo sobre CYP3A4)
        if (RX_INDUCER.test(seg) && !RX_INHIBITOR.test(seg)) continue;

        let val;
        if (RX_STRONG.test(seg)) val = "+++";
        else if (RX_MODERATE.test(seg)) val = "++";
        else if (RX_WEAK.test(seg)) val = "+";
        else val = "?";

        if (rank[val] > rank[best]) best = val;
    }
    return best;
}

export function potencyScore(val) {
    return val === "+++" ? 3 : val === "++" ? 2 : val === "+" ? 1 : val === "?" ? 1 : 0;
}
