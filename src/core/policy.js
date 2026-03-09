// public/src/core/policy.js
// Policy = reglas de acceso (disclaimer) + recibo persistente por versión de datos

import { store } from "./store.js";

const APP_ID = "antidepresivos_codice";
const LS_KEY = `legalReceipt::${APP_ID}`;

/**
 * Construye una versión estable basada en la fuente de verdad (manifest),
 * NO en ui.versionKey (que puede estar en "boot" o pisarse por persistencia).
 */
function getVersionKeyFromManifest() {
  const m = store.getState()?.data?.manifest;

  // Toma hashes/versiones del manifest. Ajusta keys si tu manifest usa otros nombres.
  const d = m?.dataset?.hash ?? m?.dataset?.version ?? m?.dataset?.id ?? "dataset";
  const s = m?.schema?.hash ?? m?.schema?.version ?? m?.schema?.id ?? "schema";
  const l = m?.legal?.hash ?? m?.legal?.version ?? m?.legal?.id ?? "legal";

  return `dataset:${d}|schema:${s}|legal:${l}`;
}

function readReceipt() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function writeReceipt(receipt) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(receipt));
  } catch {
    // sin storage, solo degradar silenciosamente
  }
}

export function isDisclaimerSatisfied() {
  const state = store.getState();

  // Si aún no cargó legal/manifest, no permitimos acceso (evita aceptar con "boot")
  if (!state?.data?.manifest || !state?.data?.legal) return false;

  // Si ya está aceptado en store y coincide la versión, ok
  const vk = getVersionKeyFromManifest();
  const receipt = readReceipt();
  return !!(receipt && receipt.accepted === true && receipt.versionKey === vk);
}

export function acceptDisclaimer() {
  const state = store.getState();

  // Si aún no cargó manifest/legal, no aceptamos (evita recibos inválidos)
  if (!state?.data?.manifest || !state?.data?.legal) {
    console.warn("[policy] No se puede aceptar: manifest/legal no cargados aún.");
    return;
  }

  const vk = getVersionKeyFromManifest();

  // 1) persistencia fuerte: receipt
  writeReceipt({
    accepted: true,
    versionKey: vk,
    acceptedAt: new Date().toISOString()
  });

  // 2) estado UI (para render inmediato). No es la fuente de verdad.
  store.updatePath("ui.disclaimerAccepted", true);

}

/** Útil para debug / botón "Reset legal" */
export function resetDisclaimer() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
  store.updatePath("ui.disclaimerAccepted", false);

}
