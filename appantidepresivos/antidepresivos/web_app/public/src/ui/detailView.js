import { store } from "../core/store.js";
import { selectItemById } from "../core/selectors.js";
import { escapeHtml } from "../core/utils.js";

export function renderDetail(view, id) {
   const state = store.getState();
   const item = selectItemById(state, id);

   if (!item) {
      view.innerHTML = `
      <div style="padding:var(--space-8); text-align:center">
        <h2 class="h2">Datos no encontrados</h2>
        <p class="text-muted">No se encontró el fármaco con ID <b>${escapeHtml(id)}</b>.</p>
        <a href="#/list" class="btn btn--primary" style="margin-top:var(--space-6)">Volver al listado</a>
      </div>
    `;
      return;
   }

   const hasBBW = (item.black_box_warning || "").toLowerCase() === "sí" || item.black_box_warning === true;
   const clinicalSummary = buildClinicalSummary(item);

   const contentHTML = `
    <div class="monograph animate-fade-in">
      <!-- Nav Back -->
      <a href="#/list" class="btn btn--ghost text-sm" style="margin-bottom:var(--space-4); font-weight:700; display:inline-flex; align-items:center; gap:6px;">← Listado</a>

      <!-- Header Principal — M3 style -->
      <header class="monograph__header glass-effect" style="border-radius:var(--radius-xl); padding:var(--space-6);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:var(--space-5); flex-wrap:wrap;">
          <div style="flex:1; min-width:200px;">
            ${hasBBW ? `<div class="clinical-chip clinical-chip--danger" style="display:inline-flex; margin-bottom:var(--space-3); font-size:0.7rem;">⚠️ BLACK BOX WARNING</div>` : ""}
            <h1 class="h1" style="margin:0; letter-spacing:-0.03em;">${escapeHtml(item.nombre_generico)}</h1>
            <div style="font-size:1rem; font-weight:600; font-family:var(--font-headers); color:var(--color-text-muted); margin-top:var(--space-2);">${escapeHtml(item.clase_terapeutica)}</div>
            <div style="display:flex; gap:var(--space-2); margin-top:var(--space-3); flex-wrap:wrap; align-items:center;">
              <span class="chip chip--active" style="font-size:0.75rem; font-weight:700;">${escapeHtml(item.codigo_atc)}</span>
              ${item.mecanismo_principal ? `<span class="text-xs text-muted" style="font-weight:500; font-style:italic; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(item.mecanismo_principal)}">${escapeHtml(item.mecanismo_principal)}</span>` : ""}
            </div>
          </div>
          <button id="btnMonoCompare" class="m3-fab" style="align-self:flex-start; flex-shrink:0;">
            ⚖️ Comparar
          </button>
        </div>

        <!-- Clinical Summary Strip — lectura rápida -->
        ${clinicalSummary}
      </header>

      <!-- Tabs Navigation -->
      <nav class="tabs-nav" style="margin-top:var(--space-6);">
        <button class="tab-btn tab-btn--active" data-tab="resumen">Resumen</button>
        <button class="tab-btn" data-tab="dosis">Dosis</button>
        <button class="tab-btn" data-tab="seguridad">Seguridad</button>
        <button class="tab-btn" data-tab="farmaco">Farmacología</button>
        <button class="tab-btn" data-tab="switching">Switching</button>
      </nav>

      <!-- Tab Content Container -->
      <div id="tabContent" style="padding-top:var(--space-4); min-height:500px">
        ${renderTabResumen(item)}
      </div>

    </div>
  `;

   view.innerHTML = contentHTML;

   // --- Logic ---
   initTabGestures(view, item);

   // 1. Tab Switching
   view.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
         view.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("tab-btn--active"));
         e.target.classList.add("tab-btn--active");

         const tabKey = e.target.dataset.tab;
         const container = view.querySelector("#tabContent");
         if (container) {
            if (tabKey === "resumen") container.innerHTML = renderTabResumen(item);
            if (tabKey === "dosis") container.innerHTML = renderTabDosis(item);
            if (tabKey === "seguridad") container.innerHTML = renderTabSeguridad(item);
            if (tabKey === "farmaco") container.innerHTML = renderTabFarmaco(item);
            if (tabKey === "switching") {
               container.innerHTML = renderTabSwitching(item);
               setTimeout(() => initTitrationChart(item), 50);
            }
         }
      });
   });

   // 2. Compare Button
   const btnCmp = view.querySelector("#btnMonoCompare");
   if (btnCmp) {
      btnCmp.addEventListener("click", () => {
         const curr = store.getState().compare?.ids ?? [];
         const set = new Set(curr);
         set.add(String(item.id_farmaco));
         store.setCompareIds([...set], { reason: "ui:detailAddCompare" });
         location.hash = `#/compare?ids=${encodeURIComponent([...set].join(","))}`;
      });
   }
}

// --- Clinical Summary Strip builder ---

function buildClinicalSummary(item) {
   function riskVariant(val) {
      if (!val) return "neutral";
      const s = String(val).toLowerCase();
      if (/alto|severo|grave/i.test(s)) return "danger";
      if (/medio|moderado|significativo/i.test(s)) return "warning";
      if (/bajo|leve|mínimo|minimo|nulo|neutro/i.test(s)) return "success";
      return "neutral";
   }

   const sed = parseInt(item.nivel_sedacion, 10);
   const sedLabel = isNaN(sed) ? (item.nivel_sedacion || "N/D") : ["Nula", "Baja", "Moderada", "Alta"][Math.min(sed, 3)];
   const sedVariant = isNaN(sed) ? "neutral" : ["success", "success", "warning", "danger"][Math.min(sed, 3)];

   const items = [
      { label: "Sedación", value: sedLabel, variant: sedVariant },
      { label: "Impacto peso", value: item.perfil_impacto_peso || "N/D", variant: riskVariant(item.perfil_impacto_peso) },
      { label: "D. sexual", value: item.perfil_disfuncion_sexual || "N/D", variant: riskVariant(item.perfil_disfuncion_sexual) },
      { label: "Riesgo QT", value: item.riesgo_prolongacion_qt || "N/D", variant: riskVariant(item.riesgo_prolongacion_qt) },
      { label: "Abstinencia", value: item.riesgo_sindrome_abstinencia || "N/D", variant: riskVariant(item.riesgo_sindrome_abstinencia) },
      { label: "Vida media", value: item.vida_media_parental || "N/D", variant: "neutral" },
   ];

   const variantClass = { danger: "value--danger", warning: "value--warning", success: "value--success", neutral: "" };

   return `
     <div class="clinical-summary-strip">
       ${items.map(i => `
         <div class="clinical-summary-item">
           <span class="clinical-summary-item__label">${escapeHtml(i.label)}</span>
           <span class="clinical-summary-item__value clinical-summary-item__${variantClass[i.variant] || ""}">${escapeHtml(String(i.value))}</span>
         </div>
       `).join("")}
     </div>
   `;
}

// --- Renderers de Tabs ---

function renderTabResumen(item) {
   const fdaInds = (item.rel_indicaciones || []).filter(ind => ind.fuente === "FDA");
   const emaInds = (item.rel_indicaciones || []).filter(ind => ind.fuente === "EMA");
   const offInds = (item.rel_indicaciones || []).filter(ind => ind.fuente === "Off-label");

   return `
    <div class="animate-fade-in" style="display:grid; gap:var(--space-4);">

      ${item.utilidad_sintomatica_clave ? `
      <div class="alert alert--info">
         <div style="font-size:1.4rem">💡</div>
         <div>
           <strong style="display:block; margin-bottom:var(--space-1)">Perla Clínica</strong>
           <span class="text-body">${escapeHtml(item.utilidad_sintomatica_clave)}</span>
         </div>
      </div>
      ` : ""}

      <details class="detail-section" open>
        <summary class="detail-section__summary">
          <span>Mecanismo de Acción</span>
          <span class="detail-section__chevron">▼</span>
        </summary>
        <div class="detail-section__body">
          <p class="text-body">${escapeHtml(item.mecanismo_principal || "N/D")}</p>
        </div>
      </details>

      <details class="detail-section" open>
        <summary class="detail-section__summary">
          <span>Indicaciones Aprobadas</span>
          <span class="detail-section__chevron">▼</span>
        </summary>
        <div class="detail-section__body">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:var(--space-5);">
            <div>
              <div class="text-xs" style="font-weight:800; color:var(--color-primary); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:var(--space-2)">FDA</div>
              <ul class="list-disc" style="padding-left:18px; margin:0;">
                ${fdaInds.map(ind => `<li class="text-body">${escapeHtml(ind.nombre)}</li>`).join("") || "<li class='text-muted'>N/D</li>"}
              </ul>
            </div>
            <div>
              <div class="text-xs" style="font-weight:800; color:var(--color-secondary); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:var(--space-2)">EMA</div>
              <ul class="list-disc" style="padding-left:18px; margin:0;">
                ${emaInds.map(ind => `<li class="text-body">${escapeHtml(ind.nombre)}</li>`).join("") || "<li class='text-muted'>N/D</li>"}
              </ul>
            </div>
          </div>
        </div>
      </details>

      ${offInds.length ? `
      <details class="detail-section">
        <summary class="detail-section__summary">
          <span>Usos Off-Label</span>
          <span class="detail-section__chevron">▼</span>
        </summary>
        <div class="detail-section__body">
          <ul class="list-disc" style="padding-left:18px; margin:0;">
            ${offInds.map(ind => `<li class="text-body text-muted">${escapeHtml(ind.nombre)}</li>`).join("")}
          </ul>
        </div>
      </details>
      ` : ""}

    </div>
  `;
}

function renderTabDosis(item) {
   return `
    <div class="animate-fade-in" style="display:grid; gap:var(--space-4);">

      <!-- Quick-read dose chips -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:var(--space-3);">
        ${infoBox("Inicio", item.dosis_inicio_adulto)}
        ${infoBox("Rango Terapéutico", item.rango_terapeutico_adulto)}
        ${infoBox("Dosis Máxima", item.dosis_maxima_autorizada)}
      </div>

      <details class="detail-section" open>
        <summary class="detail-section__summary">
          <span>Titulación y Administración</span>
          <span class="detail-section__chevron">▼</span>
        </summary>
        <div class="detail-section__body">
          <div style="display:grid; gap:var(--space-3);">
            ${rowDetail("Frecuencia", item.frecuencia_administracion)}
            ${rowDetail("Paso de Titulación", item.titulacion_paso)}
            ${rowDetail("Steady State", item.tiempo_estado_estacionario)}
          </div>
        </div>
      </details>

      <details class="detail-section">
        <summary class="detail-section__summary">
          <span>Poblaciones Especiales</span>
          <span class="detail-section__chevron">▼</span>
        </summary>
        <div class="detail-section__body">
          <div style="display:grid; gap:var(--space-3);">
            ${rowDetail("Insuficiencia Renal", item.ajuste_insuficiencia_renal)}
            ${rowDetail("Insuficiencia Hepática", item.ajuste_insuficiencia_hepatica)}
            ${rowDetail("Uso Pediátrico", item.aprobado_uso_pediatrico === "Sí" ? "✓ Aprobado" : `✗ No aprobado (${escapeHtml(item.aprobado_uso_pediatrico || "N/D")})`)}
          </div>
        </div>
      </details>

      <details class="detail-section">
        <summary class="detail-section__summary">
          <span>Equivalencia Terapéutica</span>
          <span class="detail-section__chevron">▼</span>
        </summary>
        <div class="detail-section__body" style="display:flex; align-items:center; gap:var(--space-5); flex-wrap:wrap;">
          <div class="field-box" style="flex:0 0 auto">
            <div class="field-box__label">Paridad Fluoxetina</div>
            <div class="field-box__value">${escapeHtml(item.equiv_fluoxetina || "N/D")}</div>
          </div>
          <p class="text-xs text-muted" style="flex:1; line-height:1.5;">Basado en dosis mínima efectiva estándar (Maudsley Guidelines). Útil para estimar dosis inicial al rotar.</p>
        </div>
      </details>

    </div>
   `;
}

function renderTabSeguridad(item) {
   const hasBBW = (item.black_box_warning || "").toLowerCase() === "sí" || item.black_box_warning === true;
   const eas = item.rel_efectos_adversos || [];
   const interacciones = item.rel_interacciones || [];

   return `
     <div class="animate-fade-in" style="display:grid; gap:var(--space-4);">

        ${hasBBW ? `
        <div class="alert alert--danger">
           <div style="font-size:1.4rem">⚠️</div>
           <div>
             <strong style="display:block; margin-bottom:var(--space-1)">Black Box Warning (FDA)</strong>
             <span class="text-body">Este fármaco tiene advertencias de seguridad importantes que requieren vigilancia clínica estrecha.</span>
           </div>
        </div>
        ` : ""}

        <details class="detail-section" open>
          <summary class="detail-section__summary">
            <span>Perfil de Riesgo</span>
            <span class="detail-section__chevron">▼</span>
          </summary>
          <div class="detail-section__body">
            <div style="display:grid; gap:var(--space-3)">
              ${rowRisk("Sedación", item.nivel_sedacion)}
              ${rowRisk("Impacto Peso", item.perfil_impacto_peso)}
              ${rowRisk("Disfunción Sexual", item.perfil_disfuncion_sexual)}
              ${rowRisk("Riesgo QT", item.riesgo_prolongacion_qt)}
              ${rowRisk("Abstinencia", item.riesgo_sindrome_abstinencia)}
              ${rowRisk("Carga Anticolinérgica", item.carga_aec)}
              ${rowRisk("Riesgo SIADH", item.riesgo_siadh)}
            </div>
          </div>
        </details>

        <details class="detail-section" open>
          <summary class="detail-section__summary">
            <span>Efectos Adversos</span>
            <span class="detail-section__chevron">▼</span>
          </summary>
          <div class="detail-section__body" style="display:grid; gap:var(--space-5);">
            <div>
              <div class="clinical-chip clinical-chip--danger" style="display:inline-flex; margin-bottom:var(--space-3);">Muy frecuentes</div>
              <p class="text-sm" style="line-height:1.6; color:var(--color-text-muted);">
                ${eas.filter(ea => ea.frecuencia === "muy frecuente").map(ea => escapeHtml(ea.nombre)).join("; ") || "N/D"}
              </p>
            </div>
            <div>
              <div class="clinical-chip clinical-chip--warning" style="display:inline-flex; margin-bottom:var(--space-3);">Frecuentes</div>
              <p class="text-sm" style="line-height:1.6; color:var(--color-text-muted);">
                ${eas.filter(ea => ea.frecuencia === "frecuente").map(ea => escapeHtml(ea.nombre)).join("; ") || "N/D"}
              </p>
            </div>
            <div>
              <div class="clinical-chip clinical-chip--neutral" style="display:inline-flex; margin-bottom:var(--space-3);">Graves / Raros</div>
              <p class="text-sm" style="line-height:1.6; color:var(--color-text-muted);">
                ${eas.filter(ea => ea.frecuencia === "raro grave").map(ea => escapeHtml(ea.nombre)).join("; ") || "N/D"}
              </p>
            </div>
          </div>
        </details>

        ${interacciones.length ? `
        <details class="detail-section">
          <summary class="detail-section__summary">
            <span style="color:var(--color-danger);">⚠️ Interacciones Contraindicadas</span>
            <span class="detail-section__chevron">▼</span>
          </summary>
          <div class="detail-section__body">
            <p class="text-body" style="color:var(--color-danger); font-weight:600; line-height:1.6;">
              ${interacciones.map(i => escapeHtml(i.nombre)).join("; ")}
            </p>
          </div>
        </details>
        ` : ""}

        <details class="detail-section">
          <summary class="detail-section__summary">
            <span>Embarazo y Lactancia</span>
            <span class="detail-section__chevron">▼</span>
          </summary>
          <div class="detail-section__body">
            <p class="text-body text-muted">${escapeHtml(item.riesgo_embarazo_multifuente || "N/D")}</p>
          </div>
        </details>

     </div>
    `;
}

function renderTabFarmaco(item) {
   const enzimas = item.rel_enzimas || [];
   return `
     <div class="animate-fade-in" style="display:grid; gap:var(--space-4);">

       <details class="detail-section" open>
         <summary class="detail-section__summary">
           <span>Farmacocinética</span>
           <span class="detail-section__chevron">▼</span>
         </summary>
         <div class="detail-section__body">
           <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:var(--space-4);">
             ${infoBoxClean("Vida Media", item.vida_media_parental)}
             ${infoBoxClean("Tmax", item.t_max)}
             ${infoBoxClean("Biodisp. Oral", item.biodisponibilidad_oral || "N/D")}
             ${infoBoxClean("Unión Prot.", item.union_proteinas_plasmaticas || "N/D")}
           </div>
         </div>
       </details>

       <details class="detail-section" open>
         <summary class="detail-section__summary">
           <span>Metabolismo CYP450</span>
           <span class="detail-section__chevron">▼</span>
         </summary>
         <div class="detail-section__body">
           <div style="display:grid; gap:var(--space-3)">
             ${rowDetail("Sustrato de", enzimas.filter(e => e.rol === "sustrato").map(e => e.nombre).join(", ") || "N/D")}
             ${rowDetail("Inhibe", enzimas.filter(e => e.rol === "inhibidor").map(e => e.nombre).join(", ") || "N/D")}
             ${rowDetail("Induce", enzimas.filter(e => e.rol === "inductor").map(e => e.nombre).join(", ") || "N/D")}
             ${rowDetail("Metabolito activo", item.metabolito_activo_nombre || "N/D")}
           </div>
         </div>
       </details>

     </div>
    `;
}

function renderTabSwitching(item) {
   const vidaMedia = item.vida_media_parental || "N/D";
   const switchingMatrix = store.getState().data?.switchingMatrix || [];
   const availableTargets = switchingMatrix
      .filter(m => m.from === item.nombre_generico.toLowerCase())
      .map(m => m.to);

   return `
    <div class="animate-fade-in" style="display:grid; gap:var(--space-6);">
        <section class="card bg-soft glass-effect">
            <h3 class="h3">Estrategia de Switching</h3>
            <p class="text-body" style="margin-top:var(--space-2)">
                Consideraciones para el cambio desde <strong>${escapeHtml(item.nombre_generico)}</strong>.
            </p>
            
            <div style="margin-top:var(--space-4); display:flex; gap:var(--space-3); align-items:center; flex-wrap:wrap;">
               <span class="text-sm" style="font-weight:700">CAMBIAR A:</span>
               <select id="selSwitchTarget" class="btn btn--outline btn--sm" style="min-width:150px">
                  <option value="">Seleccionar fármaco...</option>
                  ${availableTargets.map(t => `<option value="${t}">${t.toUpperCase()}</option>`).join("")}
               </select>
            </div>

            <div id="switchingDetails" style="margin-top:var(--space-6);">
               <div class="alert alert--info">
                  <div style="font-size:1.2rem">💊</div>
                  <div class="text-sm">
                    Seleccione un fármaco destino para ver el protocolo de titulación sugerido.
                  </div>
               </div>
            </div>
        </section>

        <div id="chartContainer" class="card glass-effect" style="display:none; padding:var(--space-6);">
            <h4 class="h4" style="margin-bottom:var(--space-4)">Visualización de Titulación Sugerida</h4>
            <div style="height:300px; width:100%;">
               <canvas id="titrationChart"></canvas>
            </div>
            <p class="text-xs text-muted" style="margin-top:var(--space-4)">* Este gráfico es una representación esquemática del protocolo. Ajuste según respuesta clínica.</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:var(--space-4);">
            ${infoBox("Vida media", vidaMedia)}
            ${infoBox("Riesgo Abstinencia", item.riesgo_sindrome_abstinencia || "N/D")}
            ${infoBox("Riesgo QT", item.riesgo_prolongacion_qt || "N/D")}
            ${infoBox("Perfil Activación", item.perfil_activacion || "N/D")}
        </div>
    </div>
    `;
}

function initTitrationChart(item) {
   const sel = document.getElementById("selSwitchTarget");
   if (!sel) return;

   sel.addEventListener("change", (e) => {
      const target = e.target.value;
      const container = document.getElementById("chartContainer");
      const details = document.getElementById("switchingDetails");

      if (!target) {
         if (container) container.style.display = "none";
         return;
      }

      const matrix = store.getState().data?.switchingMatrix || [];
      const entry = matrix.find(m => m.from === item.nombre_generico.toLowerCase() && m.to === target.toLowerCase());

      if (entry) {
         if (container) container.style.display = "block";
         renderTitrationChart(entry, item.nombre_generico, target);

         if (details) {
            details.innerHTML = `
               <div class="card" style="border-left:4px solid var(--color-primary); background:rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.05)">
                  <h5 class="h5" style="margin-bottom:var(--space-2)">Protocolo: ${entry.strategy.replace("_", " ").toUpperCase()}</h5>
                  <ul class="list-disc" style="padding-left:var(--space-5); margin-bottom:var(--space-3)">
                     <li><b>Periodo de cambio:</b> ${entry.taper_days} días</li>
                     ${entry.washout_days > 0 ? `<li><b>Washout:</b> ${entry.washout_days} días requeridos</li>` : ""}
                     ${entry.notes.map(n => `<li>${escapeHtml(n)}</li>`).join("")}
                  </ul>
                  ${entry.contraindications.length ? `<p class="text-xs color-danger"><b>Contraindicaciones:</b> ${entry.contraindications.join(", ")}</p>` : ""}
               </div>
            `;
         }
      }
   });
}

let titrationChartInstance = null;

function renderTitrationChart(entry, fromName, toName) {
   const ctx = document.getElementById('titrationChart');
   if (!ctx) return;

   if (titrationChartInstance) {
      titrationChartInstance.destroy();
   }

   const taperDays = entry.taper_days || 7;
   const washoutDays = entry.washout_days || 0;
   const totalDays = taperDays + washoutDays + 7; // Mostrar 7 días adicionales de dosis plena

   const labels = Array.from({ length: totalDays + 1 }, (_, i) => `Día ${i}`);

   // Datos fármaco origen (descenso)
   const fromData = [];
   for (let i = 0; i <= totalDays; i++) {
      if (i <= taperDays) {
         fromData.push(100 - (i * (100 / taperDays)));
      } else {
         fromData.push(0);
      }
   }

   // Datos fármaco destino (ascenso)
   const toData = [];
   for (let i = 0; i <= totalDays; i++) {
      if (i < taperDays + washoutDays) {
         toData.push(0);
      } else if (i <= taperDays + washoutDays + 7) {
         const daysSinceStart = i - (taperDays + washoutDays);
         toData.push(Math.min(daysSinceStart * (100 / 7), 100)); // Ascenso en 7 días
      } else {
         toData.push(100);
      }
   }

   titrationChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
         labels: labels,
         datasets: [
            {
               label: fromName.toUpperCase(),
               data: fromData,
               borderColor: 'rgba(239, 68, 68, 1)',
               backgroundColor: 'rgba(239, 68, 68, 0.1)',
               fill: true,
               tension: 0.3
            },
            {
               label: toName.toUpperCase(),
               data: toData,
               borderColor: 'rgba(16, 185, 129, 1)',
               backgroundColor: 'rgba(16, 185, 129, 0.1)',
               fill: true,
               tension: 0.3
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
               title: {
                  display: true,
                  text: 'Dosis relativa (%)'
               }
            },
            x: {
               title: {
                  display: true,
                  text: 'Tiempo'
               }
            }
         },
         plugins: {
            legend: {
               position: 'top',
               labels: {
                  font: {
                     family: 'Outfit',
                     weight: 'bold'
                  }
               }
            }
         }
      }
   });
}

// --- Helpers UI ---

function infoBox(label, val) {
   return `
      <div class="field-box">
        <div class="field-box__label">${escapeHtml(label)}</div>
        <div class="field-box__value">${escapeHtml(val)}</div>
      </div>
    `;
}

function infoBoxClean(label, val) {
   return `
      <div style="padding:var(--space-2) 0">
        <div class="text-xs text-muted" style="text-transform:uppercase; font-weight:800; letter-spacing:0.05em; margin-bottom:4px">${escapeHtml(label)}</div>
        <div style="font-weight:700; font-size:1.15rem; color:var(--color-primary-dark)">${escapeHtml(val)}</div>
      </div>
    `;
}

function rowDetail(label, val) {
   return `
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border); padding-bottom:var(--space-2); align-items:flex-start; gap:var(--space-4)">
         <span class="text-muted text-sm" style="font-weight:600">${escapeHtml(label)}</span>
         <span style="font-weight:600; text-align:right">${escapeHtml(val)}</span>
      </div>
    `;
}

function rowRisk(label, val) {
   const isHigh = (val || "").toLowerCase().includes("alto") || (val === "3") || (val === "2");
   const style = isHigh ? "color:var(--color-danger); font-weight:800" : "font-weight:600";
   return `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-border); padding-bottom:var(--space-2);">
         <span class="text-sm" style="font-weight:600">${escapeHtml(label)}</span>
         <span style="${style}">${escapeHtml(val)}</span>
      </div>
    `;
}

// --- Helpers UI ---
// (No change to infoBox/rowDetail/etc as they already used escapeHtml)

// --- Gesture Logic ---
function initTabGestures(view, item) {
   if (!window.ZingTouch) return;

   const zr = new ZingTouch.Region(view);
   const tabs = ["resumen", "dosis", "seguridad", "farmaco", "switching"];

   zr.bind(view, 'swipe', (e) => {
      const angle = e.detail.data[0].currentDirection;
      // Swipe direction logic: 
      // 180 is Left, 0/360 is Right
      const activeBtn = view.querySelector(".tab-btn--active");
      if (!activeBtn) return;

      const currentTab = activeBtn.dataset.tab;
      const currentIndex = tabs.indexOf(currentTab);

      let nextIndex = currentIndex;

      // ZingTouch angles: 0 (right), 90 (up), 180 (left), 270 (down)
      if (angle >= 135 && angle <= 225) { // Swipe Left -> Next Tab
         nextIndex = Math.min(currentIndex + 1, tabs.length - 1);
      } else if ((angle >= 0 && angle <= 45) || (angle >= 315 && angle <= 360)) { // Swipe Right -> Prev Tab
         nextIndex = Math.max(currentIndex - 1, 0);
      }

      if (nextIndex !== currentIndex) {
         const nextTab = tabs[nextIndex];
         const nextBtn = view.querySelector(`.tab-btn[data-tab="${nextTab}"]`);
         if (nextBtn) nextBtn.click();
      }
   });
}
