// src/ui/interactView.js
import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";

/* ── Columnas CYP a mostrar ──────────────────────────────────────── */
const CYP_COLS = [
    { key: "d6",  name: "CYP2D6",  pattern: /CYP2D6/i },
    { key: "a2",  name: "CYP1A2",  pattern: /CYP1A2/i },
    { key: "a4",  name: "CYP3A4",  pattern: /CYP3A4/i },
    { key: "c19", name: "CYP2C19", pattern: /CYP2C19/i },
    { key: "c9",  name: "CYP2C9",  pattern: /CYP2C9(?!9)/i }, // evita coincidir con CYP2C19
];

/* ── Parser de potencia desde texto libre ────────────────────────── */
function parsePotency(rawStr, col) {
    if (!rawStr || rawStr === "No" || rawStr === "N/D") return "-";

    const idx = rawStr.search(col.pattern);
    if (idx === -1) return "-";

    // Buscar potencia en paréntesis justo después del nombre de la enzima
    const after = rawStr.slice(idx);
    const m = after.match(/\(([^)]+)\)/);
    if (!m) return "+"; // Mencionada sin indicar potencia → asumimos débil

    const p = m[1].toLowerCase();
    if (p.includes("potente") || p.includes("fuerte")) return "+++";
    if (p.includes("moderado"))                          return "++";
    return "+"; // débil, leve, u otro
}

function potencyScore(val) {
    return val === "+++" ? 3 : val === "++" ? 2 : val === "+" ? 1 : 0;
}

function drugTotalScore(row) {
    return CYP_COLS.reduce((sum, col) => sum + potencyScore(row[col.key]), 0);
}

/* ── Helpers visuales ────────────────────────────────────────────── */
const BADGE_CLASS = { "+++": "badge--red", "++": "badge--yellow", "+": "badge--gray" };
const BADGE_LABEL = { "+++": "POTENTE", "++": "MODERADO", "+": "DÉBIL" };

function renderBadge(val) {
    if (val === "-") return `<span style="color:var(--color-text-dim); font-weight:600; font-size:0.9rem">—</span>`;
    return `<span class="badge ${BADGE_CLASS[val]}" style="font-size:0.6rem;">${BADGE_LABEL[val]}</span>`;
}

/* ── Render principal ────────────────────────────────────────────── */
export function renderInteract(view) {
    const state  = store.getState();
    const dataset = state.data?.dataset?.farmacos ?? [];

    // Construir la tabla desde el dataset real
    const cypData = dataset
        .map(drug => {
            const raw = drug.inhibicion_enzimatica_relevante || "";
            const row = {
                name:  drug.nombre_generico,
                clase: drug.clase_terapeutica || "",
            };
            CYP_COLS.forEach(col => { row[col.key] = parsePotency(raw, col); });
            return row;
        })
        .filter(row => CYP_COLS.some(col => row[col.key] !== "-")) // Solo los que inhiben algo
        .sort((a, b) => drugTotalScore(b) - drugTotalScore(a));    // Más inhibidores primero

    view.innerHTML = `
        <div class="animate-fade-in">
            <!-- Cabecera -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
                <div>
                    <h2 class="h2" style="margin:0">Interaccionómetro CYP450</h2>
                    <p class="text-muted" style="margin-top:var(--space-2); margin-bottom:0;">
                        Inhibición enzimática por antidepresivos · <strong>${cypData.length}</strong> fármacos con inhibición relevante
                    </p>
                </div>
                <a href="#/list" class="btn btn--outline text-xs" style="font-weight:700">← VOLVER AL LISTADO</a>
            </div>

            <!-- Leyenda -->
            <div style="display:flex; gap:var(--space-4); flex-wrap:wrap; margin-bottom:var(--space-6); align-items:center; padding:var(--space-4); background:var(--color-surface-raised); border-radius:var(--radius-md);">
                <span class="text-xs" style="font-weight:800; color:var(--color-text-muted); letter-spacing:0.08em;">INTENSIDAD:</span>
                <span class="badge badge--red"    style="font-size:0.65rem;">POTENTE — inhibe significativamente el metabolismo</span>
                <span class="badge badge--yellow" style="font-size:0.65rem;">MODERADO — monitorizar</span>
                <span class="badge badge--gray"   style="font-size:0.65rem;">DÉBIL — riesgo bajo en monoterapia</span>
                <span style="color:var(--color-text-dim); font-size:0.85rem; font-weight:600">— = sin inhibición relevante</span>
            </div>

            <!-- Tabla CYP -->
            <div class="card glass-effect" style="padding:0; overflow:hidden;">
                <div class="compare-container" style="overflow-x:auto;">
                    <table class="compare-table" style="width:100%; border-collapse:collapse; min-width:600px;">
                        <thead>
                            <tr style="text-align:left;">
                                <th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-size:0.7rem; letter-spacing:0.1em; border-bottom:2px solid var(--color-border); min-width:160px;">FÁRMACO</th>
                                ${CYP_COLS.map(col => `
                                    <th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-size:0.7rem; letter-spacing:0.1em; border-bottom:2px solid var(--color-border); text-align:center; white-space:nowrap;">${escapeHtml(col.name)}</th>
                                `).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${cypData.map((row, i) => `
                                <tr style="${i % 2 === 1 ? "background:rgba(var(--color-primary-h),var(--color-primary-s),var(--color-primary-l),0.02);" : ""}">
                                    <td style="padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border);">
                                        <span style="font-weight:700;">${escapeHtml(row.name)}</span>
                                        <div class="text-xs text-muted" style="font-weight:600; margin-top:2px;">${escapeHtml(row.clase)}</div>
                                    </td>
                                    ${CYP_COLS.map(col => `
                                        <td style="padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); text-align:center;">
                                            ${renderBadge(row[col.key])}
                                        </td>
                                    `).join("")}
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Perlas Clínicas -->
            <h3 class="h3" style="margin-top:var(--space-8); margin-bottom:var(--space-4);">Perlas Clínicas Clave</h3>
            <div class="grid-cards" style="margin-bottom: var(--space-6);">
                <div class="card card--spotlight" style="padding:var(--space-5); border-left:4px solid var(--color-danger);">
                    <h4 class="h4" style="color:var(--color-danger); margin-bottom:8px;">Tamoxifeno &amp; CYP2D6</h4>
                    <p class="text-sm" style="line-height:1.6">Fluoxetina y Paroxetina inhiben <strong>potentemente</strong> la conversión de tamoxifeno a endoxifeno (metabolito activo). <strong>Contraindicado en cáncer de mama en tratamiento activo.</strong> Alternativas: Venlafaxina, Sertralina (inhibición débil o mínima).</p>
                </div>
                <div class="card card--spotlight" style="padding:var(--space-5); border-left:4px solid var(--color-danger);">
                    <h4 class="h4" style="color:var(--color-danger); margin-bottom:8px;">Clozapina &amp; CYP1A2</h4>
                    <p class="text-sm" style="line-height:1.6">Fluvoxamina eleva los niveles de clozapina hasta 5-10 veces por inhibición de CYP1A2. <strong>Riesgo de convulsiones, agranulocitosis y cardiotoxicidad.</strong> Si se requiere combinación, reducir dosis de clozapina hasta 1/3 y monitorizar estrechamente.</p>
                </div>
                <div class="card card--spotlight" style="padding:var(--space-5); border-left:4px solid var(--color-warning);">
                    <h4 class="h4" style="color:var(--color-warning); margin-bottom:8px;">Warfarina &amp; CYP2C9 / 3A4</h4>
                    <p class="text-sm" style="line-height:1.6">Fluvoxamina inhibe CYP2C9 y CYP3A4. Puede elevar el INR con warfarina y aumentar niveles de anticoagulantes NOAC metabolizados por 3A4. <strong>Controlar INR 3-5 días tras inicio o suspensión.</strong></p>
                </div>
                <div class="card card--spotlight" style="padding:var(--space-5); border-left:4px solid var(--color-warning);">
                    <h4 class="h4" style="color:var(--color-warning); margin-bottom:8px;">Nefazodona &amp; CYP3A4</h4>
                    <p class="text-sm" style="line-height:1.6">Inhibidor potente de CYP3A4. Eleva significativamente niveles de benzodiacepinas (triazolam, alprazolam), estatinas (simvastatina), y ciclosporina. <strong>Revisar todo el régimen concomitante antes de prescribir.</strong></p>
                </div>
                <div class="card card--spotlight" style="padding:var(--space-5); border-left:4px solid var(--color-primary);">
                    <h4 class="h4" style="color:var(--color-primary); margin-bottom:8px;">Codeína &amp; CYP2D6</h4>
                    <p class="text-sm" style="line-height:1.6">Los inhibidores potentes de CYP2D6 (Fluoxetina, Paroxetina, Bupropión) bloquean la conversión de codeína a morfina, reduciendo eficacia analgésica. <strong>Evaluar eficacia del analgésico en pacientes con estos antidepresivos.</strong></p>
                </div>
                <div class="card card--spotlight" style="padding:var(--space-5); border-left:4px solid var(--color-primary);">
                    <h4 class="h4" style="color:var(--color-primary); margin-bottom:8px;">Antipsicóticos &amp; CYP2D6</h4>
                    <p class="text-sm" style="line-height:1.6">Varios antipsicóticos (haloperidol, risperidona, aripiprazol) son sustratos de CYP2D6. La inhibición potente puede aumentar sus niveles y el riesgo de efectos extrapiramidales y QT prolongado. <strong>Monitorizar y reducir dosis del antipsicótico.</strong></p>
                </div>
            </div>

            <div class="alert alert--info">
                <div class="text-xs" style="line-height:1.7">
                    <strong>Fuente y limitaciones:</strong> Datos derivados del dataset clínico validado a partir de fichas técnicas FDA/EMA y Guías Maudsley. La inhibición enzimática puede variar por polimorfismos genéticos (CYP2D6 PM/UM), dosis y formulación. Para decisiones de alto riesgo, consultar siempre bases de datos especializadas (Lexicomp®, Micromedex®, Drugs.com) e individualizar según el paciente.
                </div>
            </div>
        </div>
    `;
}
