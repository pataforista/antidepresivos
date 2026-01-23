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
      <div class="gatekeeper" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.75);font-family:system-ui">
        <div class="gatekeeper__card" style="max-width:720px;width:100%;background:#0b1220;color:#f9fafb;border-radius:12px;padding:16px">
          <h2 style="margin:0 0 8px">Aviso legal</h2>
          <p style="margin:0 0 10px;opacity:.9;line-height:1.5">
            Antes de usar la app, confirma que entiendes que esto es un recurso educativo
            y no sustituye el juicio clínico ni fuentes primarias.
          </p>
          <div class="gatekeeper__actions" style="display:flex;justify-content:flex-end;gap:8px">
            <button id="btnAcceptDisclaimer"
                    class="btn btn--primary"
                    style="padding:10px 12px;border-radius:10px;border:0;background:#2563eb;color:white;cursor:pointer">
              Entiendo y acepto
            </button>
          </div>
          <p class="gatekeeper__meta" style="margin:10px 0 0;opacity:.7;font-size:12px">
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
