import { store } from "../core/store.js";

export function renderDetail(view, id) {
   const state = store.getState();
   const items = state.data?.dataset?.items ?? [];
   const item = items.find((d) => String(d.id_farmaco) === String(id));

   if (!item) {
      view.innerHTML = `
      <div style="padding:24px; text-align:center">
        <h2 class="h2">Datos no encontrados</h2>
        <p class="text-muted">No se encontró el fármaco con ID <b>${escapeHtml(id)}</b>.</p>
        <a href="#/list" class="btn btn--primary" style="margin-top:16px">Volver al listado</a>
      </div>
    `;
      return;
   }

   const contentHTML = `
    <div class="monograph">
      <!-- Nav Back -->
      <a href="#/list" class="btn btn--ghost text-sm" style="margin-bottom:12px">← Volver</a>

      <!-- Header Principal -->
      <header class="card monograph__header" style="border-left: 5px solid var(--color-primary);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
          <div>
            <h1 class="h1" style="margin:0; font-size:1.75rem">${escapeHtml(item.nombre_generico)}</h1>
            <div class="text-muted" style="font-size:1rem; margin-top:4px;">${escapeHtml(item.clase_terapeutica)}</div>
             <div class="chip" style="margin-top:8px">${escapeHtml(item.codigo_atc)}</div>
          </div>
          <button id="btnMonoCompare" class="btn btn--outline text-sm">
             + Comparar
          </button>
        </div>
      </header>
      
      <!-- Tabs Navigation -->
      <div class="tabs-nav" style="margin-top:24px; border-bottom:1px solid var(--color-border); display:flex; gap:24px; overflow-x:auto;">
        <button class="tab-btn tab-btn--active" data-tab="resumen">Resumen</button>
        <button class="tab-btn" data-tab="dosis">Dosis</button>
        <button class="tab-btn" data-tab="seguridad">Seguridad</button>
        <button class="tab-btn" data-tab="farmaco">Farmacología</button>
        <button class="tab-btn" data-tab="switching">Switching</button>
      </div>

      <!-- Tab Content Container -->
      <div id="tabContent" style="padding-top:24px; min-height:400px">
        ${renderTabResumen(item)}
      </div>

    </div>
  `;

   view.innerHTML = contentHTML;

   // --- Logic ---

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
            if (tabKey === "switching") container.innerHTML = renderTabSwitching(item);
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

// --- Renderers de Tabs ---

function renderTabResumen(item) {
   return `
    <div class="animate-fade-in" style="display:grid; gap:24px;">
       <section>
         <h3 class="h3 section-title">Mecanismo de Acción</h3>
         <p class="text-body">${escapeHtml(item.mecanismo_principal)}</p>
       </section>

       <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
         <div class="card bg-soft">
           <h4 class="h4" style="color:var(--color-primary)">Indicaciones FDA</h4>
           <ul class="list-disc" style="padding-left:20px; margin-top:8px;">
             ${splitList(item.indicaciones_aprobadas_fda).map(li => `<li>${escapeHtml(li)}</li>`).join("")}
           </ul>
         </div>
         <div class="card">
           <h4 class="h4">Usos Off-Label / Otros</h4>
           <ul class="list-disc" style="padding-left:20px; margin-top:8px;">
              ${splitList(item.indicaciones_off_label).map(li => `<li>${escapeHtml(li)}</li>`).join("")}
           </ul>
         </div>
       </div>

       ${item.utilidad_sintomatica_clave ? `
       <div class="alert alert--info">
          <strong>💡 Perlas Clínicas:</strong> ${escapeHtml(item.utilidad_sintomatica_clave)}
       </div>
       ` : ''}
    </div>
  `;
}

function renderTabDosis(item) {
   return `
    <div class="animate-fade-in" style="display:grid; gap:24px;">
       <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
          ${infoBox("Inicio", item.dosis_inicio_adulto)}
          ${infoBox("Rango Terapéutico", item.rango_terapeutico_adulto)}
          ${infoBox("Dosis Máxima", item.dosis_maxima_autorizada)}
       </div>

       <section class="card">
          <h4 class="h4">Titulación / Administración</h4>
          <div style="display:grid; gap:12px; margin-top:12px">
             ${rowDetail("Frecuencia", item.frecuencia_administracion)}
             ${rowDetail("Paso de Titulación", item.titulacion_paso)}
             ${rowDetail("Tiempo al efecto (Steady State)", item.tiempo_estado_estacionario)}
          </div>
       </section>

       <section class="card" style="border-left: 4px solid var(--color-warning);">
          <h4 class="h4">Ajustes en Poblaciones Especiales</h4>
          <div style="display:grid; gap:12px; margin-top:12px">
             ${rowDetail("Insuficiencia Renal", item.ajuste_insuficiencia_renal)}
             ${rowDetail("Insuficiencia Hepática", item.ajuste_insuficiencia_hepatica)}
             ${rowDetail("Uso Pediátrico", item.aprobado_uso_pediatrico === "Sí" ? "Aprobado" : `No aprobado (${escapeHtml(item.aprobado_uso_pediatrico)})`)}
          </div>
       </section>
    </div>
   `;
}

function renderTabSeguridad(item) {
   const hasBBW = (item.black_box_warning || "").toLowerCase() === "sí";
   return `
     <div class="animate-fade-in" style="display:grid; gap:24px;">
        ${hasBBW ? `
        <div class="alert alert--danger">
           <strong style="display:block; margin-bottom:4px">⚠️ BLACK BOX WARNING</strong>
           Este fármaco tiene advertencias de seguridad importantes de la FDA.
        </div>
        ` : ''}

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
           <section class="card">
              <h4 class="h4">Efectos Adversos</h4>
              <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px">
                  <div><span class="badge badge--red">Muy Frecuentes</span> <span class="text-sm">${escapeHtml(item.efectos_muy_frecuentes)}</span></div>
                  <div><span class="badge badge--yellow">Frecuentes</span> <span class="text-sm">${escapeHtml(item.efectos_frecuentes)}</span></div>
                  <div><span class="badge badge--gray">Graves/Raros</span> <span class="text-sm">${escapeHtml(item.efectos_raros_graves)}</span></div>
              </div>
           </section>
           
           <section class="card">
              <h4 class="h4">Perfil de Riesgo</h4>
              <div style="margin-top:12px; display:grid; gap:8px">
                 ${rowRisk("Sedación", item.nivel_sedacion)}
                 ${rowRisk("Peso", item.perfil_impacto_peso)}
                 ${rowRisk("Sexual", item.perfil_disfuncion_sexual)}
                 ${rowRisk("QT", item.riesgo_prolongacion_qt)}
                 ${rowRisk("Abstinencia", item.riesgo_sindrome_abstinencia)}
              </div>
           </section>
        </div>

        <section class="card">
           <h4 class="h4">Interacciones Contraindicadas</h4>
           <p class="text-body" style="color:var(--color-danger)">${escapeHtml(item.interacciones_contraindicadas)}</p>
        </section>

        <section class="card bg-soft">
           <h4 class="h4">Embarazo y Lactancia</h4>
           <p class="text-sm">${escapeHtml(item.riesgo_embarazo_multifuente)}</p>
        </section>
     </div>
    `;
}

function renderTabFarmaco(item) {
   return `
     <div class="animate-fade-in" style="display:grid; gap:24px;">
        <section class="card">
           <h4 class="h4">Farmacocinética</h4>
           <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:12px;">
              ${infoBoxClean("Vida Media", item.vida_media_parental)}
              ${infoBoxClean("Tmax", item.t_max)}
              ${infoBoxClean("Biodisponibilidad", item.biodisponibilidad_oral + "%")}
              ${infoBoxClean("Unión a Proteínas", item.union_proteinas_plasmaticas + "%")}
           </div>
        </section>

        <section class="card">
           <h4 class="h4">Metabolismo (CYP450)</h4>
           <div style="display:grid; gap:12px; margin-top:12px">
              ${rowDetail("Sustrato Principal", item.sustrato_enzimatico_principal)}
              ${rowDetail("Inhibición Relevante", item.inhibicion_enzimatica_relevante)}
              ${rowDetail("Inducción", item.induccion_enzimatica)}
              ${rowDetail("Metabolito Activo", item.metabolito_activo_nombre)}
           </div>
        </section>
     </div>
    `;
}

function renderTabSwitching(item) {
   return `
    <div class="animate-fade-in" style="display:grid; gap:24px;">
        <section class="card">
            <h3 class="h3">Estrategias de Cambio (Switching)</h3>
            <p class="text-body" style="margin-top:8px">
                Información para realizar el cambio desde <strong>${escapeHtml(item.nombre_generico)}</strong> hacia otros antidepresivos.
            </p>
            
            <div class="alert alert--info" style="margin-top:16px">
                <strong>Nota Clínica:</strong> Las recomendaciones de switching se basan en vidas medias y riesgos farmacodinámicos. Siempre individualice según la clínica del paciente.
            </div>
        </section>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
            <div class="card shadow-sm">
                <h4 class="h4" style="color:var(--color-primary)">Métodos Generales</h4>
                <ul class="list-disc" style="padding-left:20px; margin-top:12px; font-size:0.95rem">
                    <li><strong>Direct Switch:</strong> Detener fármaco A e iniciar B al día siguiente.</li>
                    <li><strong>Cross-Taper:</strong> Disminuir gradualmente A mientras se introduce B.</li>
                    <li><strong>Washout:</strong> Periodo sin medicación entre el fin de A y el inicio de B.</li>
                </ul>
            </div>

            <div class="card shadow-sm">
                <h4 class="h4">Riesgos Específicos para ${escapeHtml(item.nombre_generico)}</h4>
                <div style="margin-top:12px; display:grid; gap:10px">
                    ${rowRisk("Síndrome de Abstinencia", item.riesgo_sindrome_abstinencia)}
                    ${rowRisk("Riesgo QT (potenciación)", item.riesgo_prolongacion_qt)}
                    <div>
                        <span class="text-sm text-muted">Vida Media:</span>
                        <div style="font-weight:600">${escapeHtml(item.vida_media_parental)}</div>
                    </div>
                </div>
            </div>
        </div>

        <section class="card bg-soft">
            <h4 class="h4">Guía Rápida de Cambio</h4>
            <div style="margin-top:12px; overflow-x:auto;">
                <table class="table-minimal">
                    <thead>
                        <tr>
                            <th>Hacia...</th>
                            <th>Estrategia Recomendada</th>
                            <th>Comentarios</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Otro ISRS / Dual</td>
                            <td>Cross-Taper (2 semanas)</td>
                            <td>Riesgo bajo de interacción. Monitorizar activación.</td>
                        </tr>
                        <tr>
                            <td>IMAO</td>
                            <td>Washout (5 vidas medias)</td>
                            <td style="color:var(--color-danger); font-weight:600">Periodo de seguridad crítico para evitar S. Serotoninérgico.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
    `;
}

// --- Helpers UI ---

function splitList(str) {
   if (!str) return [];
   return str.split(/[;|\n]/).map(s => s.trim()).filter(Boolean);
}

function infoBox(label, val) {
   return `
      <div class="field-box">
        <div class="field-box__label">${escapeHtml(label)}</div>
        <div class="field-box__value" style="font-weight:600">${escapeHtml(val)}</div>
      </div>
    `;
}

function infoBoxClean(label, val) {
   return `
      <div>
        <div class="text-sm text-muted">${escapeHtml(label)}</div>
        <div style="font-weight:600; font-size:1.1rem">${escapeHtml(val)}</div>
      </div>
    `;
}

function rowDetail(label, val) {
   return `
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--color-border); padding-bottom:8px;">
         <span class="text-muted">${escapeHtml(label)}</span>
         <span style="font-weight:500; text-align:right">${escapeHtml(val)}</span>
      </div>
    `;
}

function rowRisk(label, val) {
   const isHigh = (val || "").toLowerCase().includes("alto") || (val === "3") || (val === "2");
   const style = isHigh ? "color:var(--color-danger); font-weight:700" : "";
   return `
      <div style="display:flex; justify-content:space-between;">
         <span>${escapeHtml(label)}</span>
         <span style="${style}">${escapeHtml(val)}</span>
      </div>
    `;
}

function escapeHtml(s) {
   return (s ?? "N/D")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}
