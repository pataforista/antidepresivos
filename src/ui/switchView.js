// src/ui/switchView.js
import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { i18n } from "../core/i18n.js";
import { ensurePdfFooter } from "./pdfFooter.js";
import { computeSwitchProtocol, isNonSwitchable } from "../lib/switchingLogic.js";

export function renderSwitching(view) {
    const state = store.getState();
    const dataset = state.data?.dataset?.farmacos ?? [];

    // Excluir potenciadores y esquemas agudos del selector de switching (C-3)
    const farmacos = [...dataset]
        .filter(f => !isNonSwitchable(f))
        .sort((a, b) => a.nombre_generico.localeCompare(b.nombre_generico));

    const isEn = i18n.getLocale() === 'en';

    view.innerHTML = `
        <div class="animate-fade-in">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
                <h2 class="h2" style="margin:0">${i18n.t("switching_plan")}</h2>
                <a href="/" class="btn btn--outline text-xs" style="font-weight:700">← ${i18n.t("btn_back")} ${i18n.t("btn_list")}</a>
            </div>

            <p class="text-muted" style="margin-bottom: var(--space-6);">
                ${i18n.t("switching_intro")}
            </p>

            <div class="card glass-effect" style="padding: var(--space-6); margin-bottom: var(--space-8);">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                    <div>
                        <label class="field-box__label">${i18n.t("current_drug")}</label>
                        <select id="switchFrom" class="btn btn--outline" style="width:100%; text-align:left; background: var(--color-surface); padding: 12px;">
                            <option value="">${i18n.t("select")}</option>
                            ${farmacos.map(f => `<option value="${f.id_farmaco}">${f.nombre_generico}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="field-box__label">${i18n.t("new_drug")}</label>
                        <select id="switchTo" class="btn btn--outline" style="width:100%; text-align:left; background: var(--color-surface); padding: 12px;">
                            <option value="">${i18n.t("select")}</option>
                            ${farmacos.map(f => `<option value="${f.id_farmaco}">${f.nombre_generico}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <p class="text-xs text-muted" style="margin-top: 14px; margin-bottom: 0; line-height: 1.5;">
                    ${isEn
                        ? "ℹ️ Augmenting agents (Lithium, Atypical Antipsychotics, T3, Stimulants) and acute/infusion therapies (Ketamine, Esketamine, Brexanolone, Zuranolone) are excluded from the switching calculator as they are adjunctive treatments or require independent specialized protocols."
                        : "ℹ️ Los agentes de potenciación (Litio, Antipsicóticos atípicos, T3, Estimulantes) y tratamientos de acción rápida/infusión (Ketamina, Esketamina, Brexanolona, Zuranolona) están excluidos del calculador de switching al tratarse de coadyuvantes o requerir esquemas especializados independientes."}
                </p>
                
                <div id="switchPlanContainer" style="margin-top: 30px; display:none;">
                    <div style="display:flex; justify-content:flex-end; margin-bottom: 20px;">
                        <button id="btnSwitchPDF" class="btn btn--outline" style="display:flex; align-items:center; gap:8px;">
                            <span>↓ ${i18n.t("download_plan_pdf")}</span>
                        </button>
                    </div>
                    <div id="strategyHeader" class="alert alert--info" style="margin-bottom: 20px; display:none; border-radius: var(--radius-xl);">
                        <div>
                            <span id="strategySource" class="clinical-chip" style="display:inline-block; margin-bottom:10px;"></span>
                            <strong id="strategyTitle" style="display:block; margin-bottom: 4px; font-size: 1.1rem; font-family: var(--font-headers);"></strong>
                            <p id="strategyDesc" class="text-sm" style="font-weight: 500;"></p>
                            <div id="strategyRationale" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.05); font-size: 0.8rem; font-style: italic; opacity: 0.8;"></div>
                        </div>
                    </div>
                    
                    <div id="visualTimeline" class="card" style="padding:var(--space-6); background:hsla(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.02); margin-bottom:var(--space-6);">
                        <h4 class="h4" style="margin-bottom:var(--space-4)">${i18n.t("transition_scheme")}</h4>
                        <div style="height:350px; width:100%;">
                            <canvas id="switchChart"></canvas>
                        </div>
                        <p class="text-xs text-muted" style="margin-top:var(--space-4)">${i18n.t("transition_note")}</p>
                    </div>
                    
                    <div id="clinicalNotes" style="margin-top:24px;">
                        <h4 class="h4" style="margin-bottom: 12px;">${i18n.t("clinical_considerations")}</h4>
                        <ul id="notesList" class="text-sm" style="padding-left: 20px; line-height:1.7;"></ul>
                    </div>
                </div>

                <div id="switchEmpty" style="text-align:center; padding: 60px; color: var(--color-text-muted);">
                    <div style="font-size:3rem; margin-bottom:var(--space-4); opacity:0.3">⇄</div>
                    <p style="font-weight:600">${i18n.t("switch_empty_prompt")}</p>
                </div>
            </div>

            <div class="alert alert--danger" style="margin-top: var(--space-8);">
                <div class="text-xs" style="line-height:1.6">
                    ${i18n.t("switching_warning")}
                </div>
            </div>
        </div>
        `;

    const fromSel = view.querySelector('#switchFrom');
    const toSel = view.querySelector('#switchTo');

    fromSel.addEventListener('change', () => updatePlan(fromSel.value, toSel.value, view));
    toSel.addEventListener('change', () => updatePlan(fromSel.value, toSel.value, view));

    // PDF Export listener
    view.querySelector('#btnSwitchPDF')?.addEventListener('click', () => {
        if (typeof html2pdf !== 'function') {
            if (typeof window !== 'undefined' && window.showToast) {
                window.showToast(isEn ? 'PDF export module is not ready or offline.' : 'El módulo de exportación PDF no está disponible sin conexión.', 'warning');
            }
            return;
        }
        const fromName = fromSel.options[fromSel.selectedIndex]?.text || "DrugA";
        const toName = toSel.options[toSel.selectedIndex]?.text || "DrugB";
        const element = view.querySelector('#switchPlanContainer');
        if (!element) return;
        ensurePdfFooter(element);
        
        const opt = {
            margin: 10,
            filename: `Plan_Switching_${fromName}_a_${toName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
}

let activeSwitchChart = null;

function updatePlan(fromId, toId, view) {
    const container = view.querySelector('#switchPlanContainer');
    const empty = view.querySelector('#switchEmpty');

    if (!fromId || !toId) {
        if (container) container.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (container) container.style.display = 'block';
    if (empty) empty.style.display = 'none';

    const state = store.getState();
    const dataset = state.data?.dataset?.farmacos ?? [];
    const fromDrug = dataset.find(f => String(f.id_farmaco) === String(fromId));
    const toDrug = dataset.find(f => String(f.id_farmaco) === String(toId));

    if (!fromDrug || !toDrug) return;

    const matrix = state.data?.switchingMatrix || [];
    const locale = i18n.getLocale() || 'es';
    const isEn = locale === 'en';

    const protocol = computeSwitchProtocol(fromDrug, toDrug, matrix, locale);
    if (!protocol) return;

    const header = view.querySelector('#strategyHeader');
    if (header) {
        header.style.display = 'block';
        header.className = protocol.isHighRisk ? 'alert alert--danger' : 'alert alert--info';
        header.style.borderRadius = 'var(--radius-xl)';
    }

    const srcEl = view.querySelector('#strategySource');
    if (srcEl) {
        if (protocol.source === 'matrix') {
            srcEl.textContent = isEn ? 'Par curado (guías clínicas)' : 'Par curado (guías clínicas)';
            if (isEn) srcEl.textContent = 'Curated pair (clinical guidelines)';
            srcEl.className = 'clinical-chip clinical-chip--success';
        } else if (protocol.source === 'clinical_restriction') {
            srcEl.textContent = isEn ? 'Clinical restriction' : 'Restricción clínica';
            srcEl.className = 'clinical-chip clinical-chip--danger';
        } else {
            srcEl.textContent = isEn ? 'Evidence-based protocol (guidelines)' : 'Protocolo basado en evidencia (guías)';
            srcEl.className = protocol.isHighRisk ? 'clinical-chip clinical-chip--danger' : 'clinical-chip clinical-chip--warning';
        }
        srcEl.style.display = 'inline-block';
        srcEl.style.marginBottom = '10px';
    }

    const strategyTitle = protocol.strategy.replace(/_/g, ' ').toUpperCase();
    view.querySelector('#strategyTitle').textContent = strategyTitle;
    view.querySelector('#strategyDesc').textContent = protocol.desc;

    const rationaleEl = view.querySelector('#strategyRationale');
    if (rationaleEl) rationaleEl.textContent = protocol.rationale;

    const list = view.querySelector('#notesList');
    if (list) {
        list.innerHTML = (protocol.notes || []).map(n => `<li>${escapeHtml(n)}</li>`).join('');
    }

    const timeline = view.querySelector('#visualTimeline');
    if (protocol.strategy === 'not_applicable') {
        if (timeline) timeline.style.display = 'none';
    } else {
        if (timeline) timeline.style.display = 'block';
        renderSwitchChart(protocol, fromDrug.nombre_generico, toDrug.nombre_generico);
    }
}

function renderSwitchChart(entry, fromName, toName) {
    const canvas = document.getElementById('switchChart');
    if (!canvas) return;

    // Chart.js llega por CDN: si no cargó (offline/bloqueado), degradar sin romper
    if (typeof Chart === "undefined") {
        const box = canvas.parentElement;
        if (box) box.innerHTML = `<p class="text-sm text-muted" style="padding:var(--space-4)">Gráfico no disponible sin conexión. Consulte las notas clínicas del plan.</p>`;
        return;
    }

    if (activeSwitchChart) {
        activeSwitchChart.destroy();
    }

    const taperDays = entry.taper_days || 0;
    const washoutDays = entry.washout_days || 0;
    const totalDays = Math.max(taperDays + washoutDays + 14, 21);

    const labels = Array.from({ length: totalDays + 1 }, (_, i) => `${i18n.getLocale() === 'en' ? 'Day' : 'Día'} ${i}`);

    const fromData = [];
    for (let i = 0; i <= totalDays; i++) {
        if (taperDays === 0) {
            fromData.push(i === 0 ? 100 : 0);
        } else if (i <= taperDays) {
            fromData.push(100 - (i * (100 / taperDays)));
        } else {
            fromData.push(0);
        }
    }

    const toData = [];
    for (let i = 0; i <= totalDays; i++) {
        if (i < taperDays + washoutDays) {
            toData.push(0);
        } else if (i <= taperDays + washoutDays + 7) {
            const step = i - (taperDays + washoutDays);
            toData.push(step * (100 / 7));
        } else {
            toData.push(100);
        }
    }

    activeSwitchChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: fromName.toUpperCase(),
                    data: fromData,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    pointRadius: 2,
                    fill: true,
                    tension: 0.2
                },
                {
                    label: toName.toUpperCase(),
                    data: toData,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    pointRadius: 2,
                    fill: true,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 110,
                    ticks: { callback: (v) => v + '%' }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { family: 'Poppins', weight: '600' } }
                }
            }
        }
    });
}
