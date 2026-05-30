import { i18n } from "./i18n.js";

const SEDATION_ES = ["Energía Pura ⚡", "Sedación Sutil 🧘", "Sedación Notoria 😫", "Sedación Profunda 💤"];
const SEDATION_EN = ["None ⚡", "Mild 🧘", "Moderate 😫", "High 💤"];
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

export function drugEmoji(clase) {
  // Normalize accents to match both accented (dataset) and plain ASCII forms
  const c = String(clase || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/isrs/.test(c)) return "🧠";
  if (/dual|irsn/.test(c)) return "🔁";
  if (/triciclico/.test(c)) return "🧬";
  if (/imao/.test(c)) return "🔬";
  if (/melatonina|agomelatina/.test(c)) return "🌙";
  if (/bupropion|ndri/.test(c)) return "🎯";
  if (/mirtazapina|nassa/.test(c)) return "😴";
  if (/estabilizador/.test(c)) return "⚖️";
  if (/antipsicotico/.test(c)) return "🛡️";
  return "💊";
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
