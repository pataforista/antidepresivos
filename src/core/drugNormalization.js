import { i18n } from "./i18n.js";

const SEDATION_ES = ["Energía Pura", "Sedación Sutil", "Sedación Notoria", "Sedación Profunda"];
const SEDATION_EN = ["None", "Mild", "Moderate", "High"];
const SEDATION_VARIANTS = ["success", "success", "warning", "danger"];

export function riskVariant(val) {
  if (!val) return "neutral";
  const s = String(val).toLowerCase();
  if (/alto|severo|grave/i.test(s)) return "danger";
  if (/medio|moderado|significativo/i.test(s)) return "warning";
  if (/bajo|leve|mínimo|minimo|nulo|neutro/i.test(s)) return "success";
  return "neutral";
}

export function sedationLabel(nivel) {
  const sed = parseInt(nivel, 10);
  if (isNaN(sed)) return String(nivel || "N/D");
  const idx = Math.min(sed, 3);
  return i18n.getLocale() === "en" ? SEDATION_EN[idx] : SEDATION_ES[idx];
}

export function sedationVariant(nivel) {
  const sed = parseInt(nivel, 10);
  if (isNaN(sed)) return "neutral";
  return SEDATION_VARIANTS[Math.min(sed, 3)];
}

export function isLowRisk(value) {
  return /bajo|leve|mínimo|minimo|nulo|neutro|low|mild|none/i.test(String(value || ""));
}

export function isHighRisk(value) {
  return /alto|severo|grave|high/i.test(String(value || ""));
}

export function isNotableRisk(value) {
  return /alto|medio|moderado|significativo|high|moderate/i.test(String(value || ""));
}
