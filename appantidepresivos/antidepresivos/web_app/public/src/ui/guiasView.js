// src/ui/guiasView.js
import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { i18n } from "../core/i18n.js";

export function renderGuias(view) {
  const state = store.getState();
  const data = state.data?.guias;
  const lang = i18n.getLocale();
  const conditions = data?.conditions ?? [];
  const note = lang === "en" ? data?.meta?.note_en : data?.meta?.note_es;

  const t = (es, en) => (lang === "en" ? en : es);

  if (!conditions.length) {
    view.innerHTML = `
      <div class="animate-fade-in" style="text-align:center; padding:var(--space-8);">
        <h2 class="h2">${t("Guías Clínicas", "Clinical Guidelines")}</h2>
        <p class="text-muted">${t("No se pudieron cargar las guías.", "Could not load the guidelines.")}</p>
        <a href="#/list" class="btn btn--primary" style="margin-top:var(--space-6)">${t("Volver", "Back")}</a>
      </div>`;
    return;
  }

  const cards = conditions.map(c => {
    const label = c.label?.[lang] ?? c.label?.es ?? c.id;
    const blocks = (c.guidelines ?? []).map(g => {
      const recs = g.recs?.[lang] ?? g.recs?.es ?? [];
      return `
        <div style="margin-top:var(--space-4);">
          <div class="text-xs" style="font-weight:800; color:var(--color-primary); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:var(--space-2);">${escapeHtml(g.org)}</div>
          <ul class="list-disc text-sm" style="padding-left:20px; line-height:1.6; margin:0;">
            ${recs.map(r => `<li>${escapeHtml(r)}</li>`).join("")}
          </ul>
        </div>`;
    }).join("");

    return `
      <details class="detail-section" style="margin-bottom:var(--space-4);">
        <summary class="detail-section__summary">
          <span style="display:flex; align-items:center; gap:10px;"><span style="font-size:1.3rem;">${c.icon || "📋"}</span>${escapeHtml(label)}</span>
          <span class="detail-section__chevron">▼</span>
        </summary>
        <div class="detail-section__body">${blocks}</div>
      </details>`;
  }).join("");

  view.innerHTML = `
    <div class="animate-fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
        <div>
          <h2 class="h2" style="margin:0">${t("Guías Clínicas", "Clinical Guidelines")} 📖</h2>
          <p class="text-sm text-muted" style="margin-top:var(--space-2);">${t("Orientaciones de primera línea por trastorno (NICE · APA · CANMAT · ACOG).", "First-line orientations by disorder (NICE · APA · CANMAT · ACOG).")}</p>
        </div>
        <a href="#/list" class="btn btn--outline text-xs" style="font-weight:700">← ${i18n.t("btn_back")} ${i18n.t("btn_list")}</a>
      </div>

      <div>${cards}</div>

      ${note ? `
      <div class="alert alert--danger" style="margin-top:var(--space-8);">
        <div class="text-xs" style="line-height:1.6;"><strong>⚠️ ${t("Aviso", "Notice")}:</strong> ${escapeHtml(note)}</div>
      </div>` : ""}
    </div>
  `;
}
