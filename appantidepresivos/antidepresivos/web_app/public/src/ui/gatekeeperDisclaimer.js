// public/src/ui/gatekeeperDisclaimer.js
// Gatekeeper: muestra disclaimer hasta que policy permita acceso.
// Importante: re-evalúa al cambiar store.

import { store } from "../core/store.js";
import * as policy from "../core/policy.js";
import { escapeHtml } from "../core/utils.js";

export function mountLegalModal() {
  const modal = document.createElement("div");
  modal.className = "gatekeeper animate-fade-in";
  modal.style.zIndex = "3000";
  modal.innerHTML = `
    <div class="gatekeeper__card" style="position:relative; padding:0; overflow:hidden;">
      <div class="gatekeeper__card-header" style="background:var(--color-stroke); color:var(--color-bg); padding:10px 16px; font-family:var(--font-headers); font-weight:900; font-size:0.75rem; display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid var(--color-stroke);">
        <span>⚖️ AVISO LEGAL</span>
        <button type="button" class="btn btn--circle btn--ghost legalModalClose" aria-label="Cerrar aviso legal" style="width:24px; height:24px; font-size:0.75rem; border:none; box-shadow:none; color:var(--color-bg); background:none; margin:0; padding:0; min-width:auto; cursor:pointer;">✕</button>
      </div>
      <div class="gatekeeper__card-body" style="padding:20px;">
        <h2 class="h2" style="margin-top:0; font-size:1.5rem;">Aviso Legal</h2>
        <div class="alert alert--warning" style="margin-bottom: 24px; text-align: left; font-size: 0.85rem; line-height: 1.5;">
            Esta aplicación está dirigida exclusivamente a profesionales de salud mental como apoyo clínico. No sustituye el juicio clínico, la valoración presencial, las guías oficiales ni la ficha técnica vigente de cada medicamento.<br><br>
            Las dosis, equivalencias (CPZ), estrategias de switching y contenido farmacológico son aproximaciones educativas para consulta rápida. Deben verificarse y personalizarse en cada paciente según comorbilidades, interacciones, edad, estado clínico y normativas locales.<br><br>
            Esta herramienta no está diseñada para automedicación ni para decisiones terapéuticas sin supervisión profesional.
        </div>
      </div>
    </div>
  `;

  // Cierre sin manejadores inline (la CSP bloquea onclick=""): botón ✕,
  // clic en el fondo o tecla Escape.
  function closeModal() {
    document.removeEventListener("keydown", onKeydown);
    modal.remove();
  }
  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
  }
  modal.querySelector(".legalModalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", onKeydown);

  document.body.appendChild(modal);
}

export function mountDisclaimerGate({ rootEl, onAllow }) {
  if (!rootEl) throw new Error("mountDisclaimerGate: rootEl requerido");
  if (typeof onAllow !== "function") throw new Error("mountDisclaimerGate: onAllow debe ser función");

  let mounted = false;
  let unsub = null;

  function renderDisclaimer() {
    rootEl.innerHTML = `
      <div class="gatekeeper">
        <div class="gatekeeper__card" style="padding:0; overflow:hidden;">
          <div class="gatekeeper__card-header" style="background:var(--color-stroke); color:var(--color-bg); padding:10px 16px; font-family:var(--font-headers); font-weight:900; font-size:0.75rem; border-bottom:3px solid var(--color-stroke);">
            <span>⚠️ AVISO DE SOPORTE CLÍNICO</span>
          </div>
          <div class="gatekeeper__card-body" style="padding:20px;">
            <h2 class="h2" style="margin-top:0; font-size:1.5rem;">Aviso y limitaciones de uso</h2>
            <div class="alert alert--warning" style="margin-bottom: 24px; text-align: left; font-size: 0.85rem; line-height: 1.5;">
               Esta aplicación está dirigida exclusivamente a profesionales de salud mental como apoyo clínico. No sustituye el juicio clínico, la valoración presencial, las guías oficiales ni la ficha técnica vigente de cada medicamento.<br><br>
               Las dosis, equivalencias (CPZ), estrategias de switching y contenido farmacológico son aproximaciones educativas para consulta rápida. Deben verificarse y personalizarse en cada paciente según comorbilidades, interacciones, edad, estado clínico y normativas locales.<br><br>
               Esta herramienta no está diseñada para automedicación ni para decisiones terapéuticas sin supervisión profesional.
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px">
              <button id="btnAcceptDisclaimer" class="btn btn--primary">
                Comprendo y Acepto
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const btn = document.getElementById("btnAcceptDisclaimer");
    if (btn) {
      btn.addEventListener("click", () => {
        // Acepta y re-evalúa (NO cierres “a ciegas”)
        policy.acceptDisclaimer();
        evaluateGate();
      });
    }
  }

  function clearGate() {
    // Limpia siempre. El shell real se montará después.
    rootEl.innerHTML = "";
  }

  function evaluateGate() {
    const ok = policy.isDisclaimerSatisfied();

    if (ok) {
      if (!mounted) {
        mounted = true;
        clearGate();
        onAllow();
      }
      return;
    }

    mounted = false;
    renderDisclaimer();
  }

  unsub = store.subscribe(() => {
    evaluateGate();
  });

  evaluateGate();

  return () => {
    try {
      if (typeof unsub === "function") unsub();
    } catch { }
  };
}
