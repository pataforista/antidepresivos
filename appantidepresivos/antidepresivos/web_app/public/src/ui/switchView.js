// src/ui/switchView.js
import { store } from "../core/store.js";

export function renderSwitching(view) {
    const state = store.getState();
    const dataset = state.data?.dataset?.farmacos ?? [];

    // Sort alphabetically for the dropdowns
    const farmacos = [...dataset].sort((a, b) => a.nombre_generico.localeCompare(b.nombre_generico));

    view.innerHTML = `
        <div class="animate-fade-in">
            <h2 class="h2">Plan de Switching</h2>
            <p class="text-muted" style="margin-bottom: var(--space-8);">
                Herramienta interactiva para la rotación de antidepresivos. Basado en guías clínicas (Maudsley, CANMAT).
            </p>

            <div class="card glass-effect" style="padding: var(--space-6); margin-bottom: var(--space-8);">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                    <div>
                        <label class="field-box__label">Fármaco Actual (Desde)</label>
                        <select id="switchFrom" class="btn btn--outline" style="width:100%; text-align:left; background: var(--color-surface); padding: 12px;">
                            <option value="">Seleccione...</option>
                            ${farmacos.map(f => `<option value="${f.id_farmaco}">${f.nombre_generico}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="field-box__label">Fármaco Nuevo (Hacia)</label>
                        <select id="switchTo" class="btn btn--outline" style="width:100%; text-align:left; background: var(--color-surface); padding: 12px;">
                            <option value="">Seleccione...</option>
                            ${farmacos.map(f => `<option value="${f.id_farmaco}">${f.nombre_generico}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div id="switchPlanContainer" style="margin-top: 30px; display:none;">
                    <div class="alert alert--info" style="margin-bottom: 20px;">
                        <div>
                            <strong id="strategyTitle" style="display:block; margin-bottom: 4px; font-size: 1.1rem;">Estrategia Sugerida</strong>
                            <p id="strategyDesc" class="text-sm"></p>
                        </div>
                    </div>
                    
                    <div id="visualTimeline" class="switch-visuals"></div>
                    
                    <div id="clinicalNotes" style="margin-top:24px;">
                        <h4 class="h4" style="margin-bottom: 8px;">Consideraciones Clínicas</h4>
                        <ul id="notesList" class="text-sm" style="padding-left: 20px; line-height:1.7;"></ul>
                    </div>
                </div>

                <div id="switchEmpty" style="text-align:center; padding: 40px; color: var(--color-text-muted);">
                    <p>Seleccione ambos fármacos para generar un esquema de transición.</p>
                </div>
            </div>

            <div class="alert alert--danger" style="margin-top: var(--space-8);">
                <div class="text-xs" style="line-height:1.6">
                    <strong>ADVERTENCIA:</strong> Esta herramienta es un apoyo logístico y no sustituye el juicio clínico. 
                    El riesgo de Síndrome Serotoninérgico o recurrencia de síntomas debe evaluarse individualmente.
                </div>
            </div>
        </div>
    `;

    const fromSel = view.querySelector('#switchFrom');
    const toSel = view.querySelector('#switchTo');

    fromSel.addEventListener('change', () => updatePlan(fromSel.value, toSel.value, view));
    toSel.addEventListener('change', () => updatePlan(fromSel.value, toSel.value, view));
}

function updatePlan(fromId, toId, view) {
    const container = view.querySelector('#switchPlanContainer');
    const empty = view.querySelector('#switchEmpty');

    if (!fromId || !toId) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    empty.style.display = 'none';

    const state = store.getState();
    const dataset = state.data?.dataset?.farmacos ?? [];
    const fromDrug = dataset.find(f => f.id_farmaco === fromId);
    const toDrug = dataset.find(f => f.id_farmaco === toId);

    // Logic for AD switching
    // 1. Cross-taper (Default)
    // 2. Washout (MAOIs, Fluoxetine)
    // 3. Direct switch (Same class, low doses)

    let strategy = "Cross-taper (Reducción Gradual Cruzada)";
    let desc = "Disminuir el fármaco actual mientras se introduce el nuevo a dosis bajas.";
    let notes = [
        "Vigilar síntomas de discontinuación.",
        "Riesgo de interacción farmacodinámica persistente.",
        "Titular el nuevo fármaco según tolerancia."
    ];

    const isMAOI = (d) => d?.clase_terapeutica?.toLowerCase().includes('imao');
    const isFluoxetine = (d) => d?.nombre_generico?.toLowerCase().includes('fluoxetina');

    if (isMAOI(fromDrug) || isMAOI(toDrug)) {
        strategy = "Washout Estricto (LAVADO)";
        desc = "Requiere un periodo libre de fármaco de 14 días para evitar Síndrome Serotoninérgico o Crisis Hipertensivas.";
        notes.unshift("REGLA DE ORO: 14 días de espera obligatorios.");
    } else if (isFluoxetine(fromDrug)) {
        strategy = "Taper prolongado / Washout parcial";
        desc = "Fluoxetina tiene una vida media muy larga (semanas).";
        notes.unshift("La inhibición del CYP2D6 persiste tras suspender Fluoxetina.");
    }

    view.querySelector('#strategyTitle').textContent = strategy;
    view.querySelector('#strategyDesc').textContent = desc;

    const list = view.querySelector('#notesList');
    list.innerHTML = notes.map(n => `<li>${n}</li>`).join('');

    // Visual Timeline Sketch
    const timeline = view.querySelector('#visualTimeline');
    timeline.innerHTML = `
        <div class="switch-visual-card">
            <h4>Semana 1</h4>
            <div style="height:4px; background:var(--risk-high); width:100%; border-radius:2px;"></div>
            <div style="height:4px; background:var(--color-border); width:20%; border-radius:2px; margin-top:4px;"></div>
            <p>100% ${fromDrug.nombre_generico} / 0% ${toDrug.nombre_generico}</p>
        </div>
        <div class="switch-visual-card">
            <h4>Semana 2</h4>
            <div style="height:4px; background:var(--risk-mod); width:50%; border-radius:2px;"></div>
            <div style="height:4px; background:var(--risk-low); width:50%; border-radius:2px; margin-top:4px;"></div>
            <p>50% / 50%</p>
        </div>
        <div class="switch-visual-card" style="border-color: var(--color-primary)">
            <h4>Semana 3</h4>
            <div style="height:4px; background:var(--color-border); width:0%; border-radius:2px;"></div>
            <div style="height:4px; background:var(--color-success); width:100%; border-radius:2px; margin-top:4px;"></div>
            <p>0% / 100% ${toDrug.nombre_generico}</p>
        </div>
    `;
}
