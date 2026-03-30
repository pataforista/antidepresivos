import { store } from "./store.js";

/**
 * i18n core utility for Antidepresivos 2026.
 * Manages UI translations based on locales.json.
 */

export const i18n = {
  /**
   * Translates a key based on the current locale in the store.
   * @param {string} key - The translation key.
   * @returns {string} - The translated string or the key if not found.
   */
  t(key) {
    const state = store.getState();
    const locale = state.ui.locale || "es";
    const dict = state.data.locales?.[locale];
    
    if (!dict) return key;
    return dict[key] || key;
  },

  /**
   * Sets the current locale and triggers language-specific data loading.
   * @param {string} nextLocale - 'es' or 'en'.
   */
  async setLocale(nextLocale) {
    if (nextLocale !== "es" && nextLocale !== "en") return;
    
    store.updatePath("ui.locale", nextLocale);
    
    // In a real app, this might trigger a reload or a re-fetch of the dataset.
    // For now, we update the state so components can re-render.
    console.log(`[i18n] Switched to ${nextLocale}`);
  },

  /**
   * Returns the current locale.
   */
  getLocale() {
    return store.getState().ui.locale || "es";
  }
};
