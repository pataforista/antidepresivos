// src/ui/interactView.js
import { store } from "../core/store.js";

export function renderInteract(view) {
    const cypData = [
        { name: "Fluoxetina", d26: "+++", a12: "d", a34: "+", c19: "++" },
        { name: "Paroxetina", d26: "+++", a12: "d", a34: "d", c19: "d" },
        { name: "Bupropión", d26: "+++", a12: "-", a34: "-", c19: "-" },
        { name: "Duloxetina", d26: "++", a12: "-", a34: "-", c19: "-" },
        { name: "Fluvoxamina", d26: "d", a12: "+++", a34: "+", c19: "+++" },
        { name: "Sertralina", d26: "+", a12: "-", a34: "-", c19: "-" },
        { name: "Citalopram", d26: "+", a12: "-", a34: "-", c19: "-" },
        { name: "Escitalopram", d26: "+", a12: "-", a34: "-", c19: "-" },
        { name: "Venlafaxina", d26: "+", a12: "-", a34: "-", c19: "-" },
        { name: "Nefazodona", d26: "-", a12: "-", a34: "+++", c19: "-" },
    ];

    const getInhibClass = (val) => {
        if (val === "+++") return "badge--red";
        if (val === "++") return "badge--yellow";
        if (val === "+") return "badge--yellow";
        if (val === "d") return "badge--gray";
        return "";
    };

    const getInhibLabel = (val) => {
        if (val === "+++") return "POTENTE";
        if (val === "++") return "MODERADO";
        if (val === "+") return "DÉBIL";
        if (val === "d") return "MÍNIMO";
        return "-";
    };

    view.innerHTML = `
        <div class="animate-fade-in">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
                <h2 class="h2" style="margin:0">Interaccionómetro CYP</h2>
                <a href="#/list" class="btn btn--outline text-xs" style="font-weight:700">← VOLVER AL LISTADO</a>
            </div>
            
            <p class="text-muted" style="margin-bottom: var(--space-8);">
                Inhibición enzimática por antidepresivos. Crucial para prevenir toxicidad en polifarmacia.
            </p>

            <div class="card glass-effect" style="padding:0; overflow:hidden;">
                <div class="compare-container" style="overflow-x:auto;">
                    <table class="compare-table" style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="text-align:left;">
                                <th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-size:0.75rem; border-bottom:2px solid var(--color-border);">FÁRMACO</th>
                                <th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-size:0.75rem; border-bottom:2px solid var(--color-border);">CYP2D6</th>
                                <th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-size:0.75rem; border-bottom:2px solid var(--color-border);">CYP1A2</th>
                                <th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-size:0.75rem; border-bottom:2px solid var(--color-border);">CYP3A4</th>
                                <th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-size:0.75rem; border-bottom:2px solid var(--color-border);">CYP2C19</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cypData.map(row => `
                                <tr>
                                    <td style="padding:var(--space-4) var(--space-5); font-weight:700; border-bottom:1px solid var(--color-border);">${row.name}</td>
                                    <td style="padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border);">
                                        <span class="badge ${getInhibClass(row.d26)}" style="font-size:0.6rem;">${getInhibLabel(row.d26)}</span>
                                    </td>
                                    <td style="padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border);">
                                        <span class="badge ${getInhibClass(row.a12)}" style="font-size:0.6rem;">${getInhibLabel(row.a12)}</span>
                                    </td>
                                    <td style="padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border);">
                                        <span class="badge ${getInhibClass(row.a34)}" style="font-size:0.6rem;">${getInhibLabel(row.a34)}</span>
                                    </td>
                                    <td style="padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border);">
                                        <span class="badge ${getInhibClass(row.c19)}" style="font-size:0.6rem;">${getInhibLabel(row.c19)}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="grid-cards" style="margin-top: var(--space-8);">
                <div class="card card--spotlight" style="padding: var(--space-5);">
                    <h4 class="h4" style="color:var(--color-danger); margin-bottom:10px;">Tamoxifeno & 2D6</h4>
                    <p class="text-sm">Fluoxetina y Paroxetina inhiben la activación de tamoxifeno. <strong>Evitar en cáncer de mama en tratamiento.</strong></p>
                </div>
                <div class="card card--spotlight" style="padding: var(--space-5);">
                    <h4 class="h4" style="color:var(--color-danger); margin-bottom:10px;">Clozapina & 1A2</h4>
                    <p class="text-sm">Fluvoxamina eleva masivamente niveles de clozapina. <strong>Riesgo de convulsiones y toxicidad.</strong></p>
                </div>
            </div>
        </div >
        `;
}
