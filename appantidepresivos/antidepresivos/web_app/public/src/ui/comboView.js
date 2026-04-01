// src/ui/comboView.js
import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { i18n } from "../core/i18n.js";

export function renderCombo(view) {
    const state = store.getState();
    const dataset = state.data?.dataset?.farmacos ?? [];
    const synergies = state.data?.synergies ?? [];

    // Sort alphabetically
    const farmacos = [...dataset].sort((a, b) => a.nombre_generico.localeCompare(b.nombre_generico));

    view.innerHTML = `
        <div class="animate-fade-in">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
                <div>
                    <h2 class="h2" style="margin:0">${i18n.t("combo_title")} 🚀</h2>
                    <p class="text-sm text-muted">${i18n.t("combo_subtitle")}</p>
                </div>
                <a href="#/list" class="btn btn--outline text-xs" style="font-weight:700">← ${i18n.t("btn_back")} ${i18n.t("btn_list")}</a>
            </div>

            <div class="card glass-effect" style="padding: var(--space-6); border-radius: var(--radius-2xl); margin-bottom: var(--space-8);">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                    <div class="field-box" style="background: var(--color-bg); border-radius: var(--radius-xl);">
                        <label class="field-box__label">${i18n.t("combo_select_primary")}</label>
                        <select id="comboPrimary" class="btn btn--ghost" style="width:100%; text-align:left; padding: 8px 0; font-size: 1.1rem; border: none; box-shadow: none;">
                            <option value="">${i18n.t("select")}</option>
                            ${farmacos.map(f => `<option value="${f.id_farmaco}">${f.nombre_generico}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field-box" style="background: var(--color-bg); border-radius: var(--radius-xl);">
                        <label class="field-box__label">${i18n.t("combo_select_secondary")}</label>
                        <select id="comboSecondary" class="btn btn--ghost" style="width:100%; text-align:left; padding: 8px 0; font-size: 1.1rem; border: none; box-shadow: none;">
                            <option value="">${i18n.t("select")}</option>
                            ${farmacos.map(f => `<option value="${f.id_farmaco}">${f.nombre_generico}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div id="comboResultContainer" style="margin-top: 40px; display:none;">
                    <!-- Result will be injected here -->
                </div>

                <div id="comboEmpty" style="text-align:center; padding: 60px; color: var(--color-text-muted);">
                    <div style="font-size:4rem; margin-bottom:var(--space-4); opacity:0.2">🧪</div>
                    <p style="font-weight:600; max-width: 300px; margin: 0 auto;">${i18n.t("combo_empty_state")}</p>
                </div>
            </div>

            <div class="alert alert--info" style="margin-top: var(--space-8); border-radius: var(--radius-xl);">
                <div class="text-xs" style="line-height:1.6">
                    <strong>Nota para el clínico:</strong> Las sinergias presentadas se basan en mecanismos farmacodinámicos conocidos (ej. Stahl, CANMAT). Evalúe siempre la tolerancia individual y el riesgo de efectos adversos acumulativos.
                </div>
            </div>
        </div >
    `;

    const primSel = view.querySelector('#comboPrimary');
    const secSel = view.querySelector('#comboSecondary');

    const update = () => {
        const id1 = primSel.value;
        const id2 = secSel.value;
        renderResult(id1, id2, view, synergies, dataset);
    };

    primSel.addEventListener('change', update);
    secSel.addEventListener('change', update);
}

function renderResult(id1, id2, view, synergies, dataset) {
    const container = view.querySelector('#comboResultContainer');
    const empty = view.querySelector('#comboEmpty');

    if (!id1 || !id2) {
        if (container) container.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (container) container.style.display = 'block';
    if (empty) empty.style.display = 'none';

    const drug1 = dataset.find(f => String(f.id_farmaco) === String(id1));
    const drug2 = dataset.find(f => String(f.id_farmaco) === String(id2));

    if (!drug1 || !drug2) return;

    // Logic to find synergy
    const found = findSynergy(drug1, drug2, synergies);

    if (found) {
        container.innerHTML = `
            <div class="animate-fade-in">
                <div class="card ${found.type === 'danger' ? 'alert--danger' : 'card--tonal'}" style="margin-bottom: 24px; padding: 24px; border-radius: var(--radius-2xl);">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom: 16px;">
                        <div style="font-size: 2.5rem;">${found.type === 'danger' ? '⚠️' : '✨'}</div>
                        <div>
                            <h3 style="margin:0; font-family:var(--font-headers); font-weight:800; font-size: 1.5rem;">${escapeHtml(found.name)}</h3>
                            <p style="margin:0; font-size: 0.9rem; opacity: 0.8;">${escapeHtml(found.description)}</p>
                        </div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr; gap: 20px;">
                        <div class="field-box" style="background: rgba(255,255,255,0.3); padding: 20px; border-radius: var(--radius-xl);">
                             <label class="field-box__label" style="color: inherit; opacity: 0.7;">${i18n.t("combo_mechanism")}</label>
                             <p style="margin: 8px 0 0; line-height: 1.6; font-weight: 500;">${escapeHtml(found.mechanism)}</p>
                        </div>

                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                            <div class="card" style="background: rgba(255,255,255,0.4); border:none; padding: 20px; border-radius: var(--radius-xl);">
                                <label class="field-box__label">${i18n.t("combo_benefits")}</label>
                                <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 0.85rem; line-height: 1.5;">
                                    ${found.clinical_benefits.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="card" style="background: rgba(255,255,255,0.4); border:none; padding: 20px; border-radius: var(--radius-xl);">
                                <label class="field-box__label">${i18n.t("combo_warnings")}</label>
                                <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 0.85rem; line-height: 1.5;">
                                    ${found.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 20px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.75rem; opacity: 0.6;">
                        <strong>Fuentes:</strong> ${found.sources.join(', ')}
                    </div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="animate-fade-in card" style="text-align:center; padding: 40px; background: var(--color-surface-raised); border-radius: var(--radius-2xl);">
                <div style="font-size: 2.5rem; margin-bottom: 16px;">❔</div>
                <p class="text-sm" style="max-width: 400px; margin: 0 auto; color: var(--color-text-muted);">
                    ${i18n.t("combo_not_found")}
                </p>
                <div style="margin-top: 20px; display:flex; gap: 8px; justify-content: center;">
                    <span class="chip">${escapeHtml(drug1.clase_terapeutica)}</span>
                    <span style="font-size: 1.4rem;">+</span>
                    <span class="chip">${escapeHtml(drug2.clase_terapeutica)}</span>
                </div>
            </div>
        `;
    }
}

function findSynergy(d1, d2, synergies) {
    const n1 = d1.nombre_generico.toLowerCase();
    const n2 = d2.nombre_generico.toLowerCase();
    const c1 = d1.clase_terapeutica?.toLowerCase() || "";
    const c2 = d2.clase_terapeutica?.toLowerCase() || "";

    // 1. Search by exact drug names
    const exact = synergies.find(s => 
        (s.drugs.some(d => n1.includes(d.toLowerCase())) && s.drugs.some(d => n2.includes(d.toLowerCase())))
    );
    if (exact) return exact;

    // 2. Search by classes (generic matches)
    const classMatch = synergies.find(s => 
        (s.drug_classes.some(c => c1.includes(c.toLowerCase())) && s.drug_classes.some(c => c2.includes(c.toLowerCase())))
    );
    return classMatch;
}
