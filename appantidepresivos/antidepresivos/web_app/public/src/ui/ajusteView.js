// src/ui/ajusteView.js
import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { i18n } from "../core/i18n.js";

/* ── Helpers de riesgo geriátrico ────────────────────────────────── */
function aecColor(val) {
    if (!val) return "";
    const v = String(val).toLowerCase();
    if (v.includes("alto") || v === "3") return "color:var(--color-danger); font-weight:800;";
    if (v.includes("moderado") || v.includes("medio") || v === "2") return "color:var(--color-warning); font-weight:700;";
    return "";
}

function sedacionGeriatrico(nivel) {
    const n = parseInt(nivel, 10);
    if (n >= 2) return { label: i18n.t("high_fall_risk"), style: "color:var(--color-danger); font-weight:800;" };
    if (n === 1) return { label: i18n.t("mild_monitor"), style: "color:var(--color-warning); font-weight:700;" };
    if (n === 0) return { label: i18n.t("none"), style: "color:var(--color-success); font-weight:600;" };
    return { label: "N/D", style: "" };
}

export function renderAjuste(view) {
    const state   = store.getState();
    const dataset = state.data?.dataset?.farmacos ?? [];

    view.innerHTML = `
        <div class="animate-fade-in">
            <!-- Cabecera -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
                <div>
                    <h2 class="h2" style="margin:0">${i18n.t("dose_adjustment")}</h2>
                    <p class="text-muted" style="margin-top:var(--space-2); margin-bottom:0;">
                        ${i18n.t("adjustment_subtitle")}
                    </p>
                </div>
                <a href="#/list" class="btn btn--outline text-xs" style="font-weight:700">← ${i18n.t("btn_back")} ${i18n.t("btn_list")}</a>
            </div>

            <!-- Nota clínica geriátrica -->
            <div class="alert alert--info" style="margin-bottom:var(--space-6);">
                <div style="font-size:1.3rem;">👴</div>
                <div class="text-xs" style="line-height:1.7;">
                    <strong>${i18n.t("geriatric_note_title")}</strong> ${i18n.t("geriatric_note_text")}
                </div>
            </div>

            <!-- Buscador -->
            <div class="card glass-effect" style="padding: var(--space-5); margin-bottom: var(--space-6);">
                <input type="text" id="ajusteSearch" placeholder="${i18n.t("search_drug_placeholder")}" class="btn btn--outline"
                    style="width:100%; text-align:left; background:var(--color-surface); font-size:1rem; padding:14px; font-family:var(--font-body);">
            </div>

            <!-- Resultados -->
            <div id="ajusteResults" style="display:flex; flex-direction:column; gap:var(--space-4);">
                <!-- Generado por JS -->
            </div>

            <!-- Nota al pie -->
            <div class="alert alert--info" style="margin-top:var(--space-8);">
                <div class="text-xs" style="line-height:1.7;">
                    <strong>${i18n.t("source")}</strong> ${i18n.t("adjustment_footer_note")}
                </div>
            </div>
        </div>
    `;

    const input   = view.querySelector('#ajusteSearch');
    const results = view.querySelector('#ajusteResults');

    const render = (query = "") => {
        const q = query.toLowerCase().trim();
        const filtered = dataset.filter(f =>
            f.nombre_generico.toLowerCase().includes(q) ||
            (f.clase_terapeutica || "").toLowerCase().includes(q)
        );

        if (!filtered.length) {
            results.innerHTML = `
                <div style="text-align:center; padding:var(--space-8); color:var(--color-text-muted);">
                    <div style="font-size:3rem; opacity:0.3; margin-bottom:var(--space-4);">🔍</div>
                    <p style="font-weight:600;">Sin resultados para "<em>${escapeHtml(query)}</em>"</p>
                </div>`;
            return;
        }

        results.innerHTML = filtered.map(f => {
            const sed = sedacionGeriatrico(f.nivel_sedacion);
            const aecStyle = aecColor(f.carga_aec);

            return `
            <div class="card card--spotlight" style="padding:var(--space-5); border-left:4px solid var(--color-primary);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-4); gap:var(--space-3); flex-wrap:wrap;">
                    <div>
                        <h4 class="h4" style="margin:0; color:var(--color-primary)">${escapeHtml(f.nombre_generico)}</h4>
                        <span class="chip text-xs" style="margin-top:6px;">${escapeHtml(f.clase_terapeutica || "N/D")}</span>
                    </div>
                    <div style="text-align:right;">
                        <div class="text-xs text-muted" style="margin-bottom:2px;">${i18n.t("therapeutic_range_label")}</div>
                        <strong style="font-size:0.95rem;">${escapeHtml(f.rango_terapeutico_adulto || "N/D")}</strong>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:var(--space-3);">

                    <!-- Hepático -->
                    <div class="field-box">
                        <div class="field-box__label">${i18n.t("hepatic_impairment_short")}</div>
                        <div class="text-sm" style="font-weight:600; margin-top:4px;">${escapeHtml(f.ajuste_insuficiencia_hepatica || "Consultar ficha")}</div>
                    </div>

                    <!-- Renal -->
                    <div class="field-box">
                        <div class="field-box__label">${i18n.t("renal_impairment_short")}</div>
                        <div class="text-sm" style="font-weight:600; margin-top:4px;">${escapeHtml(f.ajuste_insuficiencia_renal || (i18n.getLocale() === 'en' ? "No significant adjustment required" : "No requiere ajuste significativo"))}</div>
                    </div>

                    <!-- Geriátrico -->
                    <div class="field-box" style="border-left:3px solid var(--color-secondary);">
                        <div class="field-box__label">${i18n.t("geriatric_elderly")}</div>
                        <div style="display:flex; flex-direction:column; gap:6px; margin-top:4px;">
                            <div class="text-xs" style="display:flex; justify-content:space-between;">
                                <span style="color:var(--color-text-muted); font-weight:700;">${i18n.t("aec_label")}</span>
                                <span style="${aecStyle}">${escapeHtml(f.carga_aec || "N/D")}</span>
                            </div>
                            <div class="text-xs" style="display:flex; justify-content:space-between;">
                                <span style="color:var(--color-text-muted); font-weight:700;">${i18n.t("sedation_label")}</span>
                                <span style="${sed.style}">${escapeHtml(sed.label)}</span>
                            </div>
                            <div class="text-xs" style="display:flex; justify-content:space-between;">
                                <span style="color:var(--color-text-muted); font-weight:700;">${i18n.t("pediatric_use_label")}</span>
                                <span style="font-weight:600;">${escapeHtml(String(f.aprobado_uso_pediatrico || "N/D"))}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `}).join('');
    };

    input.addEventListener('input', (e) => render(e.target.value));
    render(); // render inicial sin filtro
}
