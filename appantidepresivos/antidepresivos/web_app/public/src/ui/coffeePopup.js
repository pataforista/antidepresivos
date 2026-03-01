/**
 * coffeePopup.js — Mini popup de apoyo "Buy Me a Coffee"
 *
 * Estrategia no intrusiva:
 *  - Aparece por primera vez tras SHOW_AFTER interacciones de navegación
 *  - Después de cada descarte, el umbral sube en SNOOZE_INCREMENT
 *  - Se auto-cierra a los 15 segundos si no hay acción
 *  - Solo un popup activo a la vez
 */

const STORAGE_KEY = "pwa_antidep_bmac_v1";
const SHOW_AFTER = 10;          // interacciones antes del 1.er popup
const SNOOZE_INCREMENT = 25;    // interacciones extra por cada descarte
const BMAC_URL = "https://buymeacoffee.com/herramente";
const AUTO_CLOSE_MS = 15_000;

/* ── Estado ─────────────────────────────────────────────────── */

function getState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { count: 0, dismissed: 0 };
  } catch {
    return { count: 0, dismissed: 0 };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage lleno o privado: ignorar */ }
}

/* ── API pública ─────────────────────────────────────────────── */

/**
 * Llamar en cada navegación / interacción significativa.
 * Muestra el popup cuando se alcanza el umbral.
 */
export function trackInteraction() {
  const state = getState();
  state.count = (state.count || 0) + 1;
  saveState(state);

  const threshold = SHOW_AFTER + (state.dismissed || 0) * SNOOZE_INCREMENT;
  if (state.count === threshold) {
    showCoffeePopup();
  }
}

/* ── Popup ───────────────────────────────────────────────────── */

function injectStyles() {
  const id = "bmac-popup-styles";
  if (document.getElementById(id)) return;

  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
    #bmacPopup {
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 18px 20px 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
      z-index: 9990;
      max-width: 270px;
      width: calc(100vw - 40px);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      animation: bmacIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes bmacIn {
      from { transform: translateY(18px) scale(0.88); opacity: 0; }
      to   { transform: translateY(0)    scale(1);    opacity: 1; }
    }
    #bmacPopup.bmac-exit {
      animation: bmacOut 0.28s ease forwards;
    }
    @keyframes bmacOut {
      to { transform: translateY(14px) scale(0.9); opacity: 0; }
    }
    #bmacCloseBtn {
      position: absolute;
      top: 8px;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: var(--color-text-dim, #888);
      padding: 4px 6px;
      line-height: 1;
      border-radius: 50%;
      transition: background 0.15s;
    }
    #bmacCloseBtn:hover {
      background: var(--color-surface-raised, rgba(0,0,0,0.06));
    }
    #bmacCoffeeLink {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #FFDD00;
      color: #111;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 0.85rem;
      text-decoration: none;
      margin-top: 14px;
      font-family: var(--font-headers, sans-serif);
      transition: transform 0.15s, box-shadow 0.15s;
      border: 2px solid transparent;
    }
    #bmacCoffeeLink:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255,221,0,0.45);
    }
    #bmacCoffeeLink:focus-visible {
      outline: 2px solid #FFDD00;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(s);
}

function showCoffeePopup() {
  if (document.getElementById("bmacPopup")) return;
  injectStyles();

  const el = document.createElement("div");
  el.id = "bmacPopup";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Apoyar el proyecto");
  el.innerHTML = `
    <button id="bmacCloseBtn" type="button" aria-label="Cerrar">✕</button>
    <p style="font-size:0.72rem; font-weight:800; color:var(--color-primary); text-transform:uppercase; letter-spacing:0.08em; margin:0 0 6px;">¿Te está siendo útil?</p>
    <p style="font-size:0.82rem; line-height:1.55; color:var(--color-text-main); margin:0;">
      Esta guía clínica se mantiene actualizada de forma independiente. Si te ayuda en tu práctica, considera apoyar su desarrollo.
    </p>
    <a id="bmacCoffeeLink"
       href="${BMAC_URL}"
       target="_blank"
       rel="noopener noreferrer">
      ☕ Invitar un café
    </a>
  `;
  document.body.appendChild(el);

  let timer = setTimeout(dismiss, AUTO_CLOSE_MS);

  function dismiss() {
    clearTimeout(timer);
    const popup = document.getElementById("bmacPopup");
    if (!popup) return;
    popup.classList.add("bmac-exit");
    const state = getState();
    state.dismissed = (state.dismissed || 0) + 1;
    saveState(state);
    setTimeout(() => popup?.remove(), 300);
  }

  document.getElementById("bmacCloseBtn").addEventListener("click", dismiss);

  // Clicking the coffee link counts as a positive interaction — dismiss silently
  document.getElementById("bmacCoffeeLink").addEventListener("click", () => {
    clearTimeout(timer);
    const popup = document.getElementById("bmacPopup");
    if (popup) { popup.classList.add("bmac-exit"); setTimeout(() => popup?.remove(), 300); }
  });
}
