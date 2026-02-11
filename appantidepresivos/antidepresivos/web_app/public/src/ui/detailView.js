import { store } from "../core/store.js";
import { selectItemById } from "../core/selectors.js";

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

   const contentHTML = `
    <div class="monograph animate-fade-in">
      <!-- Nav Back -->
      <a href="#/list" class="btn btn--ghost text-sm" style="margin-bottom:var(--space-4); font-weight:700">← VOLVER AL LISTADO</a>

      <!-- Header Principal -->
      <header class="monograph__header glass-effect">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--space-6); flex-wrap:wrap;">
          <div>
            <h1 class="h1" style="margin:0;">${escapeHtml(item.nombre_generico)}</h1>
            <div class="text-muted" style="font-size:1.25rem; font-weight:600; font-family:var(--font-headers); margin-top:var(--space-2);">${escapeHtml(item.clase_terapeutica)}</div>
             <div class="chip chip--active" style="margin-top:var(--space-4)">${escapeHtml(item.codigo_atc)}</div>
          </div>
          <button id="btnMonoCompare" class="btn btn--primary btn--lg">
             + COMPARAR
          </button>
        </div>
      </header>
      
      <!-- Tabs Navigation -->
      <nav class="tabs-nav" style="margin-top:var(--space-8);">
        <button class="tab-btn tab-btn--active" data-tab="resumen">RESUMEN</button>
        <button class="tab-btn" data-tab="dosis">DOSIS</button>
        <button class="tab-btn" data-tab="seguridad">SEGURIDAD</button>
        <button class="tab-btn" data-tab="farmaco">FARMACOLOGÍA</button>
        <button class="tab-btn" data-tab="switching">SWITCHING</button>
      </nav>

      <!-- Tab Content Container -->
      <div id="tabContent" style="padding-top:var(--space-4); min-height:500px">
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
    <div class="animate-fade-in" style="display:grid; gap:var(--space-6);">
       <section>
         <h3 class="h3 section-title">Mecanismo de Acción</h3>
         <p class="text-body">${escapeHtml(item.mecanismo_principal)}</p>
       </section>

       <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:var(--space-6);">
         <div class="card glass-effect">
           <h4 class="h4" style="color:var(--color-primary); margin-bottom:var(--space-3)">Indicaciones FDA</h4>
           <ul class="list-disc" style="padding-left:20px;">
             ${(item.rel_indicaciones || [])
         .filter(ind => ind.fuente === "FDA")
         .map(ind => `<li class="text-body">${escapeHtml(ind.nombre)}</li>`).join("") || "<li>N/D</li>"}
           </ul>
         </div>
         <div class="card glass-effect">
           <h4 class="h4" style="color:var(--color-secondary); margin-bottom:var(--space-3)">Indicaciones EMA</h4>
           <ul class="list-disc" style="padding-left:20px;">
             ${(item.rel_indicaciones || [])
         .filter(ind => ind.fuente === "EMA")
         .map(ind => `<li class="text-body">${escapeHtml(ind.nombre)}</li>`).join("") || "<li>N/D</li>"}
           </ul>
         </div>
         <div class="card">
           <h4 class="h4" style="margin-bottom:var(--space-3)">Usos Off-Label</h4>
           <ul class="list-disc" style="padding-left:20px;">
              ${(item.rel_indicaciones || [])
         .filter(ind => ind.fuente === "Off-label")
         .map(ind => `<li class="text-body" style="color:var(--color-text-muted)">${escapeHtml(ind.nombre)}</li>`).join("") || "<li>N/D</li>"}
           </ul>
         </div>
       </div>

       ${item.utilidad_sintomatica_clave ? `
       <div class="alert alert--info">
          <div style="font-size:1.5rem">💡</div>
          <div>
            <strong style="display:block; margin-bottom:var(--space-1)">Perlas Clínicas:</strong> 
            <span class="text-body">${escapeHtml(item.utilidad_sintomatica_clave)}</span>
          </div>
       </div>
       ` : ''}
    </div>
  `;
}

function renderTabDosis(item) {
   return `
    <div class="animate-fade-in" style="display:grid; gap:var(--space-6);">
       <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:var(--space-4);">
          ${infoBox("Inicio", item.dosis_inicio_adulto)}
          ${infoBox("Rango Terapéutico", item.rango_terapeutico_adulto)}
          ${infoBox("Dosis Máxima", item.dosis_maxima_autorizada)}
       </div>

       <section class="card glass-effect">
          <h4 class="h4" style="margin-bottom:var(--space-4)">Titulación / Administración</h4>
          <div style="display:grid; gap:var(--space-3);">
             ${rowDetail("Frecuencia", item.frecuencia_administracion)}
             ${rowDetail("Paso de Titulación", item.titulacion_paso)}
             ${rowDetail("Tiempo al efecto (Steady State)", item.tiempo_estado_estacionario)}
          </div>
       </section>

       <section class="card" style="border-left: 6px solid var(--color-warning);">
          <h4 class="h4" style="margin-bottom:var(--space-4)">Poblaciones Especiales</h4>
          <div style="display:grid; gap:var(--space-3);">
             ${rowDetail("Insuficiencia Renal", item.ajuste_insuficiencia_renal)}
             ${rowDetail("Insuficiencia Hepática", item.ajuste_insuficiencia_hepatica)}
             ${rowDetail("Uso Pediátrico", item.aprobado_uso_pediatrico === "Sí" ? "Aprobado" : `No aprobado (${escapeHtml(item.aprobado_uso_pediatrico)})`)}
          </div>
       </section>

       <section class="card glass-effect">
          <h4 class="h4" style="margin-bottom:var(--space-4)">Equivalencia Terapéutica</h4>
          <div style="display:flex; align-items:center; gap:var(--space-4);">
             <div class="field-box" style="flex:1">
                <div class="field-box__label">Paridad Fluoxetina</div>
                <div class="field-box__value">${item.equiv_fluoxetina || "N/D"}</div>
             </div>
             <p class="text-xs text-muted" style="flex:1">Basado en la dosis mínima efectiva estándar (Maudsley Guidelines). Útil para estimar dosis inicial al rotar fármacos.</p>
          </div>
       </section>
    </div>
   `;
}

function renderTabSeguridad(item) {
   const hasBBW = (item.black_box_warning || "").toLowerCase() === "sí" || item.black_box_warning === true;
   return `
     <div class="animate-fade-in" style="display:grid; gap:var(--space-6);">
        ${hasBBW ? `
        <div class="alert alert--danger">
           <div style="font-size:1.5rem">⚠️</div>
           <div>
             <strong style="display:block; margin-bottom:var(--space-1)">BLACK BOX WARNING</strong>
             <span class="text-body">Este fármaco tiene advertencias de seguridad importantes de la FDA que requieren vigilancia clínica estrecha.</span>
           </div>
        </div>
        ` : ''}

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:var(--space-6);">
           <section class="card glass-effect">
              <h4 class="h4" style="margin-bottom:var(--space-4)">Efectos Adversos</h4>
              <div style="display:flex; flex-direction:column; gap:var(--space-4)">
                  <div>
                    <span class="badge badge--red" style="margin-bottom:var(--space-2)">Muy Frecuentes</span>
                    <p class="text-sm" style="line-height:1.5">${(item.rel_efectos_adversos || [])
         .filter(ea => ea.frecuencia === "muy frecuente")
         .map(ea => escapeHtml(ea.nombre)).join("; ") || "N/D"}</p>
                  </div>
                  <div>
                    <span class="badge badge--yellow" style="margin-bottom:var(--space-2)">Frecuentes</span>
                    <p class="text-sm" style="line-height:1.5">${(item.rel_efectos_adversos || [])
         .filter(ea => ea.frecuencia === "frecuente")
         .map(ea => escapeHtml(ea.nombre)).join("; ") || "N/D"}</p>
                  </div>
                  <div>
                    <span class="badge badge--gray" style="margin-bottom:var(--space-2)">Graves/Raros</span>
                    <p class="text-sm" style="line-height:1.5">${(item.rel_efectos_adversos || [])
         .filter(ea => ea.frecuencia === "raro grave")
         .map(ea => escapeHtml(ea.nombre)).join("; ") || "N/D"}</p>
                  </div>
              </div>
           </section>
           
           <section class="card glass-effect">
              <h4 class="h4" style="margin-bottom:var(--space-4)">Perfil de Riesgo</h4>
              <div style="display:grid; gap:var(--space-3)">
                  ${rowRisk("Sedación", item.nivel_sedacion)}
                  ${rowRisk("Peso", item.perfil_impacto_peso)}
                  ${rowRisk("Sexual", item.perfil_disfuncion_sexual)}
                  ${rowRisk("QT", item.riesgo_prolongacion_qt)}
                  ${rowRisk("Abstinencia", item.riesgo_sindrome_abstinencia)}
                  ${rowRisk("Carga AEC", item.carga_aec)}
                  ${rowRisk("Riesgo SIADH", item.riesgo_siadh)}
               </div>
            </section>
        </div>

         <section class="card" style="border-left: 6px solid var(--color-danger);">
            <h4 class="h4" style="margin-bottom:var(--space-2)">Interacciones Contraindicadas</h4>
            <p class="text-body" style="color:var(--color-danger); font-weight:600">
              ${(item.rel_interacciones || []).map(i => escapeHtml(i.nombre)).join("; ") || "Nula / Ninguna"}
            </p>
         </section>

        <section class="card glass-effect">
           <h4 class="h4" style="margin-bottom:var(--space-2)">Embarazo y Lactancia</h4>
           <p class="text-body text-muted" style="font-size:0.95rem">${escapeHtml(item.riesgo_embarazo_multifuente)}</p>
        </section>
     </div>
    `;
}

function renderTabFarmaco(item) {
   return `
     <div class="animate-fade-in" style="display:grid; gap:var(--space-6);">
        <section class="card glass-effect">
           <h4 class="h4" style="margin-bottom:var(--space-4)">Farmacocinética</h4>
           <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:var(--space-4);">
              ${infoBoxClean("Vida Media", item.vida_media_parental)}
              ${infoBoxClean("Tmax", item.t_max)}
              ${infoBoxClean("Biodisp. Oral", (item.biodisponibilidad_oral || "N/D") + (item.biodisponibilidad_oral ? "%" : ""))}
              ${infoBoxClean("Unión Prot.", (item.union_proteinas_plasmaticas || "N/D") + (item.union_proteinas_plasmaticas ? "%" : ""))}
           </div>
        </section>

        <section class="card glass-effect">
           <h4 class="h4" style="margin-bottom:var(--space-4)">Metabolismo (CYP450)</h4>
           <div style="display:grid; gap:var(--space-3)">
              ${rowDetail("Sustrato Principal", (item.rel_enzimas || []).filter(e => e.rol === "sustrato").map(e => e.nombre).join(", ") || "N/D")}
              ${rowDetail("Inhibición Relevante", (item.rel_enzimas || []).filter(e => e.rol === "inhibidor").map(e => e.nombre).join(", ") || "N/D")}
              ${rowDetail("Inducción", (item.rel_enzimas || []).filter(e => e.rol === "inductor").map(e => e.nombre).join(", ") || "N/D")}
              ${rowDetail("Metabolito Activo", item.metabolito_activo_nombre)}
           </div>
        </section>
     </div>
    `;
}

function renderTabSwitching(item) {
   const vidaMedia = item.vida_media_parental || "N/D";
   return `
    <div class="animate-fade-in" style="display:grid; gap:var(--space-6);">
        <section class="card bg-soft glass-effect">
            <h3 class="h3">Estrategia de Switching</h3>
            <p class="text-body" style="margin-top:var(--space-2)">
                Consideraciones para el cambio desde <strong>${escapeHtml(item.nombre_generico)}</strong>.
            </p>
            <div class="alert alert--info" style="margin-top:var(--space-4)">
                <div style="font-size:1.2rem">💊</div>
                <div class="text-sm">
                  <strong>Protocolo:</strong> El cross-tapering debe ser gradual y monitorizado, especialmente en fármacos con vida media corta para evitar el síndrome de discontinuación.
                </div>
            </div>
        </section>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:var(--space-4);">
            ${infoBox("Vida media", vidaMedia)}
            ${infoBox("Riesgo Abstinencia", item.riesgo_sindrome_abstinencia || "N/D")}
            ${infoBox("Riesgo QT", item.riesgo_prolongacion_qt || "N/D")}
            ${infoBox("Perfil Activación", item.perfil_activacion || "N/D")}
        </div>

        <section class="card glass-effect" style="border-bottom: 4px solid var(--color-primary);">
            <h4 class="h4" style="margin-bottom:var(--space-3)">Factores Críticos</h4>
            <div style="display:grid; gap:var(--space-3)">
                ${rowDetail("Interacciones", (item.rel_interacciones || []).map(i => i.nombre).join("; ") || "Ninguna reportada")}
                ${rowDetail("Black Box Warning", (item.black_box_warning === true || item.black_box_warning === "Sí") ? "Presente" : "No reportada")}
            </div>
        </section>
    </div>
    `;
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

function escapeHtml(s) {
   return (s ?? "N/D")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}
