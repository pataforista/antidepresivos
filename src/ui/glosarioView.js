// src/ui/glosarioView.js
import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { i18n } from "../core/i18n.js";

export function renderGlosario(view) {
  const state = store.getState();
  const glossary = state.data?.glossary ?? [];
  const criteria = state.data?.criteria ?? null;
  const lang = i18n.getLocale();
  const isEn = lang === "en";

  const t = (es, en) => (isEn ? en : es);

  view.innerHTML = `
    <div class="animate-fade-in">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
        <div>
          <h2 class="h2" style="margin:0">${t("Glosario Clínico & Metodología", "Clinical Glossary & Methodology")}</h2>
          <p class="text-sm text-muted" style="margin-top:var(--space-2);">
            ${t("Definiciones psicofarmacológicas estándar, criterios diagnósticos y marco metodológico del catálogo.", "Standard psychopharmacological definitions, diagnostic criteria, and dataset methodology.")}
          </p>
        </div>
        <a href="/" class="btn btn--outline text-xs" style="font-weight:700">← ${i18n.t("btn_back")} ${i18n.t("btn_list")}</a>
      </div>

      <!-- Navigation Tabs -->
      <div style="display:flex; gap:var(--space-2); margin-bottom:var(--space-6); border-bottom:1px solid var(--color-border); padding-bottom:var(--space-2);">
        <button id="tabBtnTerms" class="btn btn--primary text-xs" style="font-weight:600; padding:8px 16px;">
          📖 ${t("Glosario de Términos", "Glossary Terms")} (${glossary.length})
        </button>
        <button id="tabBtnCriteria" class="btn btn--outline text-xs" style="font-weight:600; padding:8px 16px;">
          📋 ${t("Criterios Metodológicos", "Methodology Criteria")}
        </button>
      </div>

      <!-- Section 1: Glossary Terms -->
      <div id="sectionTerms">
        <!-- Search and Filter Bar -->
        <div class="card glass-effect" style="padding:var(--space-5); margin-bottom:var(--space-6);">
          <input type="text" id="glossarySearch" placeholder="${t("Buscar término, definición o concepto (ej. Hunter, QTc, Washout)...", "Search term, definition, or concept (e.g. Hunter, QTc, Washout)...")}"
            class="btn btn--outline" style="width:100%; text-align:left; background:var(--color-surface); font-size:1rem; padding:12px 16px; font-family:var(--font-body); margin-bottom:var(--space-4);">
          
          <div id="categoryChips" style="display:flex; flex-wrap:wrap; gap:8px;">
            <!-- Category filter chips generated dynamically -->
          </div>
        </div>

        <!-- Terms List Container -->
        <div id="glossaryResults" style="display:flex; flex-direction:column; gap:var(--space-4);">
          <!-- Dynamic terms cards -->
        </div>
      </div>

      <!-- Section 2: Methodology Criteria -->
      <div id="sectionCriteria" style="display:none;">
        ${renderCriteriaSection(criteria, isEn, t)}
      </div>

      <!-- Clinical Disclaimer Footer -->
      <div class="alert alert--info" style="margin-top:var(--space-8); border-radius:var(--radius-xl);">
        <div class="text-xs" style="line-height:1.6">
          <strong>${t("Nota para el profesional", "Notice for Clinicians")}:</strong>
          ${t("Este glosario compila criterios validados internacionalmente (Hunter, QTc Fridericia, AEC, FINISH, CANMAT 2023, Maudsley 14.ª Ed.). No sustituye el juicio clínico independiente ni la anamnesis individual.",
              "This glossary compiles internationally validated criteria (Hunter, Fridericia QTc, AEC, FINISH, CANMAT 2023, Maudsley 14th Ed.). It does not replace independent clinical judgment or individualized assessment.")}
        </div>
      </div>
    </div>
  `;

  // Mount Section Toggle
  const tabBtnTerms = view.querySelector("#tabBtnTerms");
  const tabBtnCriteria = view.querySelector("#tabBtnCriteria");
  const sectionTerms = view.querySelector("#sectionTerms");
  const sectionCriteria = view.querySelector("#sectionCriteria");

  tabBtnTerms?.addEventListener("click", () => {
    tabBtnTerms.className = "btn btn--primary text-xs";
    tabBtnCriteria.className = "btn btn--outline text-xs";
    sectionTerms.style.display = "block";
    sectionCriteria.style.display = "none";
  });

  tabBtnCriteria?.addEventListener("click", () => {
    tabBtnCriteria.className = "btn btn--primary text-xs";
    tabBtnTerms.className = "btn btn--outline text-xs";
    sectionTerms.style.display = "none";
    sectionCriteria.style.display = "block";
  });

  // Mount Terms Search & Filter
  setupTermsInteractions(view, glossary, isEn, t);
}

function renderCriteriaSection(criteria, isEn, t) {
  if (!criteria) {
    return `<div class="card" style="padding:var(--space-6); text-align:center;">${t("Criterios metodológicos no disponibles.", "Methodology criteria not available.")}</div>`;
  }

  const inc = criteria.inclusion_criteria ?? [];
  const exc = criteria.exclusion_criteria ?? [];
  const scope = isEn ? (criteria.scope_en || criteria.scope) : criteria.scope;

  return `
    <div style="display:flex; flex-direction:column; gap:var(--space-6);">
      <!-- Scope card -->
      <div class="card glass-effect" style="padding:var(--space-6); border-left:4px solid var(--color-primary);">
        <h3 class="h4" style="margin:0 0 var(--space-2); color:var(--color-primary);">${t("Alcance del Catálogo Farmacológico", "Dataset Pharmacological Scope")}</h3>
        <p style="margin:0; line-height:1.6; font-size:0.95rem;">${escapeHtml(scope)}</p>
        <div style="margin-top:var(--space-3); font-size:0.8rem; font-weight:600; color:var(--color-text-muted);">
          ✓ ${criteria.total_molecules} ${t("moléculas clínicas catalogadas", "clinical molecules cataloged")} · ${t("Versión", "Version")} ${criteria.version}
        </div>
      </div>

      <!-- Inclusion Criteria -->
      <div>
        <h3 class="h4" style="margin-bottom:var(--space-4); display:flex; align-items:center; gap:8px;">
          <span>✅</span> ${t("Criterios de Inclusión (45 moléculas)", "Inclusion Criteria (45 molecules)")}
        </h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:var(--space-4);">
          ${inc.map(item => `
            <div class="card card--spotlight" style="padding:var(--space-5); display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                  <span class="chip chip--active text-xs" style="font-weight:700;">${item.count} ${t("fármacos", "drugs")}</span>
                  <span class="text-xs text-muted" style="font-weight:600;">${item.id}</span>
                </div>
                <h4 class="h5" style="margin:0 0 8px; color:var(--color-primary);">${escapeHtml(isEn ? item.category_en : item.category)}</h4>
                <p class="text-sm" style="line-height:1.5; color:var(--color-text-muted); margin-bottom:12px;">
                  ${escapeHtml(isEn ? item.description_en : item.description_es)}
                </p>
              </div>
              ${item.molecules ? `
                <div style="font-size:0.75rem; border-top:1px solid var(--color-border); padding-top:8px; color:var(--color-text-dim);">
                  ${item.molecules.map(m => `• ${escapeHtml(m)}`).join('<br>')}
                </div>` : ''}
              ${item.classes_included ? `
                <div style="font-size:0.75rem; border-top:1px solid var(--color-border); padding-top:8px; color:var(--color-text-dim);">
                  ${item.classes_included.map(c => `• ${escapeHtml(c)}`).join('<br>')}
                </div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Exclusion Criteria -->
      <div>
        <h3 class="h4" style="margin-bottom:var(--space-4); display:flex; align-items:center; gap:8px;">
          <span>🚫</span> ${t("Criterios de Exclusión Deliberada", "Deliberate Exclusion Criteria")}
        </h3>
        <div style="display:flex; flex-direction:column; gap:var(--space-3);">
          ${exc.map(item => `
            <div class="card" style="padding:var(--space-4); border-left:4px solid var(--color-danger); background:var(--color-surface);">
              <div style="display:flex; align-items:flex-start; gap:12px;">
                <span class="badge badge--red" style="font-size:0.65rem; margin-top:2px;">${item.id}</span>
                <p style="margin:0; font-size:0.9rem; line-height:1.5;">
                  ${escapeHtml(isEn ? item.reason_en : item.reason_es)}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function setupTermsInteractions(view, glossary, isEn, t) {
  const input = view.querySelector("#glossarySearch");
  const chipsContainer = view.querySelector("#categoryChips");
  const resultsContainer = view.querySelector("#glossaryResults");

  let selectedCategory = "ALL";

  // Extract unique categories
  const categories = Array.from(new Set(glossary.map(g => isEn ? g.category_en : g.category).filter(Boolean)));

  const renderChips = () => {
    chipsContainer.innerHTML = `
      <button class="chip ${selectedCategory === "ALL" ? "chip--active" : ""}" data-cat="ALL" style="cursor:pointer; font-size:0.8rem;">
        ${t("Todas", "All")} (${glossary.length})
      </button>
      ${categories.map(cat => `
        <button class="chip ${selectedCategory === cat ? "chip--active" : ""}" data-cat="${escapeHtml(cat)}" style="cursor:pointer; font-size:0.8rem;">
          ${escapeHtml(cat)}
        </button>
      `).join('')}
    `;

    chipsContainer.querySelectorAll("button[data-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedCategory = btn.dataset.cat;
        renderChips();
        renderFiltered();
      });
    });
  };

  const renderFiltered = () => {
    const q = (input?.value || "").toLowerCase().trim();

    const filtered = glossary.filter(item => {
      const cat = isEn ? item.category_en : item.category;
      const term = isEn ? item.term_en : item.term_es;
      const def = isEn ? item.definition_en : item.definition_es;
      const pearl = isEn ? item.clinical_pearl_en : item.clinical_pearl_es;

      const matchesCat = (selectedCategory === "ALL" || cat === selectedCategory);
      const matchesQuery = !q ||
        term.toLowerCase().includes(q) ||
        def.toLowerCase().includes(q) ||
        (pearl && pearl.toLowerCase().includes(q)) ||
        cat.toLowerCase().includes(q);

      return matchesCat && matchesQuery;
    });

    if (!filtered.length) {
      resultsContainer.innerHTML = `
        <div style="text-align:center; padding:var(--space-8); color:var(--color-text-muted);">
          <div style="font-size:3rem; opacity:0.3; margin-bottom:var(--space-4);">⌕</div>
          <p style="font-weight:600;">${t("No se encontraron términos para la búsqueda.", "No terms matched your search.")}</p>
        </div>`;
      return;
    }

    resultsContainer.innerHTML = filtered.map(item => {
      const term = isEn ? item.term_en : item.term_es;
      const cat = isEn ? item.category_en : item.category;
      const def = isEn ? item.definition_en : item.definition_es;
      const pearl = isEn ? item.clinical_pearl_en : item.clinical_pearl_es;
      const sources = item.sources ?? [];

      return `
        <div class="card card--spotlight" style="padding:var(--space-6); border-radius:var(--radius-xl); border-left:4px solid var(--color-primary);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:var(--space-3);">
            <div>
              <span class="chip text-xs" style="margin-bottom:6px;">${escapeHtml(cat)}</span>
              <h3 class="h3" style="margin:0; color:var(--color-primary); font-size:1.3rem;">${escapeHtml(term)}</h3>
            </div>
            <span class="text-xs text-muted" style="font-weight:600;">${escapeHtml(item.id)}</span>
          </div>

          <p style="line-height:1.6; font-size:0.95rem; margin-bottom:var(--space-4);">
            ${escapeHtml(def)}
          </p>

          ${pearl ? `
            <div class="card card--tonal" style="padding:var(--space-4); margin-bottom:var(--space-4); border-radius:var(--radius-lg); background:hsla(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.08);">
              <div style="font-size:0.75rem; font-weight:700; color:var(--color-primary); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                <span>💡</span> ${t("Perla Clínica", "Clinical Pearl")}
              </div>
              <div class="text-sm" style="line-height:1.5; font-weight:500;">
                ${escapeHtml(pearl)}
              </div>
            </div>` : ''}

          ${sources.length ? `
            <div style="border-top:1px solid var(--color-border); padding-top:var(--space-3); font-size:0.75rem; color:var(--color-text-muted);">
              <strong>${t("Fuentes", "Sources")}:</strong> ${sources.map(s => escapeHtml(s)).join(' · ')}
            </div>` : ''}
        </div>
      `;
    }).join('');
  };

  input?.addEventListener("input", renderFiltered);
  renderChips();
  renderFiltered();
}
