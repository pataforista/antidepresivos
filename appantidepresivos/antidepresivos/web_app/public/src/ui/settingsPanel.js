/* ============================================================
   src/ui/settingsPanel.js
   Panel de configuración central — idioma, tema, tipografía,
   animaciones, densidad. Se monta como bottom sheet.
   ============================================================ */

import { store } from "../core/store.js";
import { i18n } from "../core/i18n.js";
import { mountBottomSheet } from "./bottomSheet.js";

export function mountSettingsPanel() {
  const ui = store.getState().ui ?? {};

  const locale     = ui.locale     ?? "es";
  const theme      = ui.theme      ?? "light";
  const fontSize   = ui.fontSize   ?? "normal";
  const animations = ui.animations !== false;
  const compact    = ui.compact    ?? false;

  const t = (k) => i18n.t(k);

  const optionBtn = (setting, value, label, active) =>
    `<button type="button"
       class="settings-option-btn${active ? " active" : ""}"
       data-setting="${setting}"
       data-value="${value}">
       ${label}
     </button>`;

  const toggleRow = (id, setting, checked) =>
    `<label class="settings-toggle" for="${id}">
       <input type="checkbox" id="${id}"
         class="settings-toggle__input"
         data-setting="${setting}"
         ${checked ? "checked" : ""}>
       <span class="settings-toggle__track">
         <span class="settings-toggle__thumb"></span>
       </span>
       <span class="settings-toggle__label">${checked ? t("settings_on") : t("settings_off")}</span>
     </label>`;

  const contentHTML = `
    <div class="settings-panel">

      <section class="settings-section">
        <div class="settings-section__label">${t("settings_language")}</div>
        <div class="settings-row">
          ${optionBtn("locale", "es", "🇪🇸&nbsp;Español", locale === "es")}
          ${optionBtn("locale", "en", "🇬🇧&nbsp;English", locale === "en")}
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section__label">${t("settings_theme")}</div>
        <div class="settings-row">
          ${optionBtn("theme", "light", `☀️&nbsp;${t("settings_theme_light")}`, theme === "light")}
          ${optionBtn("theme", "dark",  `🌙&nbsp;${t("settings_theme_dark")}`,  theme === "dark")}
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section__label">${t("settings_font_size")}</div>
        <div class="settings-row">
          ${optionBtn("fontSize", "normal", `A&nbsp;${t("settings_font_normal")}`, fontSize === "normal")}
          ${optionBtn("fontSize", "large",  `A+&nbsp;${t("settings_font_large")}`, fontSize === "large")}
          ${optionBtn("fontSize", "xl",     `A++&nbsp;${t("settings_font_xl")}`,   fontSize === "xl")}
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section__label">${t("settings_animations")}</div>
        ${toggleRow("toggleAnimations", "animations", animations)}
      </section>

      <section class="settings-section">
        <div class="settings-section__label">${t("settings_compact")}</div>
        ${toggleRow("toggleCompact", "compact", compact)}
      </section>

      <section class="settings-section settings-section--reset">
        <button type="button" id="btnResetSettings"
          class="btn btn--outline"
          style="width:100%; color:var(--color-danger); border-color:var(--color-danger); font-weight:700;">
          🔄 ${t("settings_reset")}
        </button>
      </section>

    </div>
  `;

  const { close } = mountBottomSheet({
    title: t("settings_title"),
    contentHTML
  }) ?? {};

  const container = document.getElementById("bottom-sheet-container");
  if (!container) return;

  // Option buttons (locale, theme, fontSize)
  container.querySelectorAll("[data-setting][data-value]").forEach(btn => {
    btn.addEventListener("click", () => {
      const { setting, value } = btn.dataset;
      applyUiSetting(setting, value);
      container.querySelectorAll(`[data-setting="${setting}"]`).forEach(b =>
        b.classList.toggle("active", b === btn)
      );
    });
  });

  // Toggle checkboxes (animations, compact)
  container.querySelectorAll("input[data-setting]").forEach(input => {
    input.addEventListener("change", () => {
      const { setting } = input.dataset;
      applyUiSetting(setting, input.checked);
      const lbl = input.closest(".settings-toggle")?.querySelector(".settings-toggle__label");
      if (lbl) lbl.textContent = input.checked ? t("settings_on") : t("settings_off");
    });
  });

  // Reset button
  const btnReset = container.querySelector("#btnResetSettings");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      const defaults = { locale: "es", theme: "light", fontSize: "normal", animations: true, compact: false };
      Object.entries(defaults).forEach(([k, v]) => applyUiSetting(k, v));
      if (close) close();
      setTimeout(mountSettingsPanel, 320);
    });
  }
}

/* ============================================================
   applyUiSetting — actualiza el store y aplica al DOM
   Se exporta para que app.js pueda usarlo en el bootstrap.
   ============================================================ */
export function applyUiSetting(key, value) {
  store.updatePath(`ui.${key}`, value);
  applySettingToDOM(key, value);
}

export function applySettingToDOM(key, value) {
  const html = document.documentElement;

  switch (key) {
    case "theme": {
      html.setAttribute("data-theme", value);
      const meta = document.getElementById("meta-theme-color");
      if (meta) meta.setAttribute("content", value === "dark" ? "#020617" : "#f8fafc");
      break;
    }
    case "fontSize": {
      const sizeMap = { normal: "1rem", large: "1.125rem", xl: "1.25rem" };
      html.style.setProperty("--font-size-base", sizeMap[value] ?? "1rem");
      html.setAttribute("data-font-size", value);
      break;
    }
    case "animations": {
      html.setAttribute("data-reduced-motion", value ? "false" : "true");
      break;
    }
    case "compact": {
      html.setAttribute("data-compact", value ? "true" : "false");
      break;
    }
  }
}
