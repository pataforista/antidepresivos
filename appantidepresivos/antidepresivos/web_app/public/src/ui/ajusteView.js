// src/ui/ajusteView.js
import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";

export function renderAjuste(view) {
    const state = store.getState();
    const dataset = state.data?.dataset?.farmacos ?? [];

    view.innerHTML = `
        <div class="animate-fade-in">
            <h2 class="h2">Ajuste de Dosis</h2>
            <p class="text-muted" style="margin-bottom: var(--space-6);">
                Guía de ajuste en poblaciones especiales (Insuficiencia Renal, Hepática y Ancianos).
            </p>

            <div class="card glass-effect" style="margin-bottom: var(--space-8); padding: var(--space-5);">
                <input type="text" id="ajusteSearch" placeholder="Buscar fármaco..." class="btn btn--outline" style="width:100%; text-align:left; background:var(--color-surface); font-size:1rem; padding:14px;">
                
                <div id="ajusteResults" style="margin-top: var(--space-6); display:grid; gap:16px;">
                    <!-- Results generate here -->
                </div>
            </div>
        </div>
    `;

    const input = view.querySelector('#ajusteSearch');
    const results = view.querySelector('#ajusteResults');

    const render = (query = "") => {
        const filtered = dataset.filter(f =>
            f.nombre_generico.toLowerCase().includes(query.toLowerCase())
        );

        results.innerHTML = filtered.map(f => `
            <div class="card card--spotlight" style="padding: var(--space-5); border-left: 4px solid var(--color-primary);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <h4 class="h4" style="margin:0; color:var(--color-primary)">${escapeHtml(f.nombre_generico)}</h4>
                    <span class="chip text-xs">${escapeHtml(f.clase_terapeutica)}</span>
                </div>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
                    <div class="field-box">
                        <div class="field-box__label">Hepatotoxicidad / Hepático</div>
                        <div class="text-sm" style="font-weight:600">${escapeHtml(f.ajuste_insuficiencia_hepatica || "Consultar ficha")}</div>
                    </div>
                    <div class="field-box">
                        <div class="field-box__label">Renal / Excreción</div>
                        <div class="text-sm" style="font-weight:600">${escapeHtml(f.ajuste_insuficiencia_renal || "No requiere ajuste significativo")}</div>
                    </div>
                </div>
            </div>
        `).join('');
    };

    input.addEventListener('input', (e) => render(e.target.value));
    render(); // Initial render
}
