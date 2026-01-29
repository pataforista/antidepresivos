// public/src/ui/gatekeeperDisclaimer.js
// Gatekeeper: muestra disclaimer hasta que policy permita acceso.
// Importante: re-evalúa al cambiar store.

import { store } from "../core/store.js";
import * as policy from "../core/policy.js";

export function mountDisclaimerGate({ rootEl, onAllow }) {
  if (!rootEl) throw new Error("mountDisclaimerGate: rootEl requerido");
  if (typeof onAllow !== "function") throw new Error("mountDisclaimerGate: onAllow debe ser función");

  let mounted = false;
  let unsub = null;

  function renderDisclaimer() {
    rootEl.innerHTML = `
      <div class="gatekeeper">
        <div class="gatekeeper__card">
          <h2 class="h2">Aviso legal</h2>
          <p class="text-muted" style="margin-bottom: 24px;">
            Antes de usar la app, confirma que entiendes que esto es un recurso educativo
            y no sustituye el juicio clínico ni fuentes primarias.
          </p>
          <div style="display:flex;justify-content:flex-end;gap:8px">
            <button id="btnAcceptDisclaimer" class="btn btn--primary">
              Entiendo y acepto
            </button>
          </div>
          <p class="text-sm text-muted" style="margin-top: 16px;">
            Autor: César Celada
          </p>
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
    } catch {}
  };
}
