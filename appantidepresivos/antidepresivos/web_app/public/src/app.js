import { store } from "./core/store.js";
import { loadAppData } from "./core/dataLoader.js";
import { mountDisclaimerGate } from "./ui/gatekeeperDisclaimer.js";
import { createRouter } from "./core/router.js";
import * as policy from "./core/policy.js";
import { selectFilteredItems, selectComparisonData } from "./core/selectors.js";
import { renderDetail } from "./ui/detailView.js";
import { renderSwitching } from "./ui/switchView.js";
import { renderAjuste } from "./ui/ajusteView.js";
import { renderInteract } from "./ui/interactView.js";
import { renderQuiz } from "./ui/quizView.js";
import { mountInfoModal } from "./ui/modalInfo.js";
import { initCardSpotlight, updateGooeyNav, initEntranceAnimations } from "./ui/visuals.js";
import { initRibbons } from "./ribbons.js";
import { escapeHtml } from "./core/utils.js";
import { trackInteraction } from "./ui/coffeePopup.js";

/* ============================================================
   App Initialization
   ============================================================ */

async function main() {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app no encontrado");

  root.innerHTML = "<div style='display:flex; height:100vh; align-items:center; justify-content:center;'><p style='font-family:var(--font-headers); font-weight:700; color:var(--color-primary); font-size:1.5rem;' class='animate-fade-in'>Cargando Antidepresivos…</p></div>";

  try {
    const ctx = await loadAppData();

    // Guardar datos antes del gatekeeper
    store.patch({
      data: {
        manifest: ctx.manifest ?? null,
        schema: ctx.schema ?? null,
        dataset: ctx.dataset ?? null,
        legal: ctx.legal ?? null,
        glossary: ctx.glossary ?? null,
        criteria: ctx.criteria ?? null,
        switchingMatrix: ctx.switchingMatrix ?? [],
      },
    });

    mountDisclaimerGate({
      rootEl: root,
      onAllow: () => {
        mountShell(root);
        const d = document.getElementById("debug-error");
        if (d) d.textContent += "[OK] Shell Mounted\n";

        const router = createRouter(store);
        router.start();

        // Init Visuals
        setTimeout(() => {
          try {
            updateGooeyNav();
            initEntranceAnimations();
            initRibbons("ribbons-container");
            mountDock(document.getElementById("dock-container"));

            // Render inicial
            renderRoute(store.getState().route);
            updateHeaderNav(store.getState().route);
          } catch (err) {
            console.error("Init Error:", err);
          }
        }, 50);




        // Re-render cuando cambie la ruta (evento correcto del store)
        store.subscribe("state:path:route", ({ next }) => {
          renderRoute(next);
          updateHeaderNav(next);
          setTimeout(initEntranceAnimations, 10);
          trackInteraction();
        });

        // Compare: contador + re-render si estás en compare (porque route no cambia)
        updateCompareCount();
        store.subscribe("state:path:compare", () => {
          updateCompareCount();
          if (store.getState().route?.name === "compare") {
            renderRoute(store.getState().route);
          }
        });

        // Filters: re-render si cambian filtros y estamos en list
        store.subscribe("state:path:filters", () => {
          if (store.getState().route?.name === "list") {
            renderRoute(store.getState().route);
            setTimeout(initEntranceAnimations, 10);
          }
        });

        // Listeners globales delegados o post-shell
        attachGlobalListeners();
      },
    });
  } catch (e) {
    console.error(e);
    root.innerHTML = `<pre style="padding:40px; color:var(--color-danger); font-family:monospace;">${escapeHtml(String(e?.stack ?? e))}</pre>`;
  }
}

function attachGlobalListeners() {
  // Theme Toggle Logic
  const btnTheme = document.getElementById("btnThemeToggle");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const current = store.getState().ui.theme || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      store.updatePath("ui.theme", next);

      // Apply theme immediately for visual snappiness
      document.documentElement.setAttribute('data-theme', next);
      const metaTheme = document.getElementById("meta-theme-color");
      if (metaTheme) {
        metaTheme.setAttribute('content', next === 'dark' ? '#020617' : '#f8fafc');
      }
    });

    // Sync button icon on state change
    store.subscribe("state:path:ui", ({ next }) => {
      if (btnTheme) {
        btnTheme.innerHTML = next.theme === 'dark' ? '☀️' : '🌙';
      }
    });
  }

  // Listener para el botón de comparar en el header (si existe en mountShell)
  const btnHeaderCompare = document.getElementById("btnHeaderCompare");
  if (btnHeaderCompare) {
    btnHeaderCompare.addEventListener("click", (ev) => {
      ev.preventDefault();
      const ids = store.getState().compare?.ids ?? [];
      if (!ids.length) {
        location.hash = "#/list";
        return;
      }
      location.hash = `#/compare?ids=${encodeURIComponent(ids.join(","))}`;
    });
  }

  // Botón limpiar compare
  const btnClear = document.getElementById("btnClearCompare");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      store.setCompareIds([], { reason: "ui:clearCompare" });
      location.hash = "#/list";
    });
  }

  // Modal de Info
  const btnInfo = document.getElementById("btnOpenInfo");
  if (btnInfo) {
    btnInfo.addEventListener("click", () => mountInfoModal());
  }
}

function updateHeaderNav(route) {
  const routeName = route?.name ?? "";

  // Desktop Gooey Nav
  document.querySelectorAll(".nav-gooey__link").forEach(el => {
    el.classList.remove("active");
    const href = el.getAttribute("href");
    if (href === `#/${routeName}` || (routeName === "list" && href === "#/list")) {
      el.classList.add("active");
    }
  });

  // M3 Bottom Navigation
  document.querySelectorAll(".m3-nav-link").forEach(el => {
    el.classList.remove("active");
    const id = el.dataset.id;
    const matches = id === routeName || (routeName === "list" && id === "list");
    if (matches) el.classList.add("active");
  });

  updateGooeyNav();
}

/* ============================================================
   Schema helpers
   ============================================================ */

function getSchema() {
  return store.getState().data?.schema ?? null;
}

function getFieldSpecList(path, fallbackSpecs) {
  const schema = getSchema();
  if (!schema) return fallbackSpecs;

  const parts = String(path).split(".");
  let cur = schema;
  for (const p of parts) {
    cur = cur?.[p];
    if (cur == null) return fallbackSpecs;
  }

  if (!Array.isArray(cur)) return fallbackSpecs;

  const specs = cur
    .map((x) => {
      if (typeof x === "string") return { id: x, label: x };
      if (x && typeof x === "object" && x.id) return { id: x.id, label: x.label ?? x.id };
      return null;
    })
    .filter(Boolean);

  return specs.length ? specs : fallbackSpecs;
}

/* ============================================================
   Shell
   ============================================================ */

function mountShell(root) {
  const state = store.getState();
  const theme = state.ui?.theme || 'light';
  const title = state.data?.schema?.meta?.appTitle ?? "Antidepresivos";

  root.innerHTML = `
    <div id="appShell" class="shell">
      <header class="header glass-effect">
        <strong class="header__title">${escapeHtml(title)}</strong>

        <nav class="header__nav nav-gooey">
          <div class="nav-gooey__blob" style="background: var(--color-primary-light); opacity: 0.2; border-radius: var(--radius-full);"></div>
          <a href="#/list" class="nav-gooey__link">Lista</a>
          <a href="#/compare" class="nav-gooey__link" id="btnHeaderCompare">Comparar</a>
          <a href="#/switching" class="nav-gooey__link">Switching</a>
          <a href="#/interact" class="nav-gooey__link">Interacciones</a>
          <a href="#/quiz" class="nav-gooey__link nav-gooey__link--quiz">✦ Quiz</a>
        </nav>

        <div class="header__actions">
            <button id="btnThemeToggle" title="Cambiar Tema" class="btn btn--circle btn--ghost" style="font-size: 1.2rem; min-width: 44px; height: 44px; padding:0; border-radius:50%">
              ${theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button id="btnClearCompare" type="button" class="btn btn--ghost text-xs" style="font-weight:700; display:none">
                Limpiar
            </button>
            <div id="compareCount" class="chip chip--active text-xs" style="padding: 4px 10px; min-width: 24px; text-align: center; display:none"></div>
        </div>
      </header>

      <main id="appView" class="main"></main>

      <footer class="footer" style="background: var(--color-surface); border-top: 1px solid var(--color-border); margin-top: auto;">
        <div class="footer__inner">
           <span class="text-xs text-muted" style="font-weight:600">EDICIÓN 2026 • SOPORTE CLÍNICO</span>
           <button id="btnOpenInfo" class="btn btn--outline text-xs" style="padding:var(--space-2) var(--space-4); border-radius:var(--radius-md);">
             Créditos
           </button>
        </div>
      </footer>
    </div>
  `;
}

function updateCompareCount() {
  const ids = store.getState().compare?.ids ?? [];

  // Header chip
  const el = document.getElementById("compareCount");
  if (el) {
    el.textContent = ids.length;
    el.style.display = ids.length ? "inline-flex" : "none";
  }

  // Header clear button
  const btnClear = document.getElementById("btnClearCompare");
  if (btnClear) {
    btnClear.style.display = ids.length ? "inline-block" : "none";
  }

  // M3 Nav badge on "Comparar" item
  const navBadge = document.getElementById("navCompareBadge");
  if (navBadge) {
    navBadge.textContent = ids.length;
    navBadge.style.display = ids.length ? "flex" : "none";
  }
}

/* ============================================================
   Router renderer
   ============================================================ */

function renderRoute(route) {
  const view = document.getElementById("appView");

  if (!view) return;

  if (!route) {
    view.innerHTML = "<p>Cargando…</p>";
    return;
  }

  // Clean scroll inside the app viewport to avoid whole-page jumps.
  view.scrollTo({ top: 0, behavior: "auto" });

  setTimeout(() => {
    if (route.name === "list") renderList(view);
    else if (route.name === "detail") {
      // Registrar en recientes antes de renderizar
      const itemId = route.params?.id;
      if (itemId) {
        const allFarmacos = store.getState().data?.dataset?.farmacos ?? [];
        const found = allFarmacos.find(f => String(f.id_farmaco) === String(itemId));
        if (found) addRecentItem(found.id_farmaco, found.nombre_generico, found.clase_terapeutica);
      }
      renderDetail(view, itemId);
    }
    else if (route.name === "compare") renderCompare(view);
    else if (route.name === "switching") renderSwitching(view);
    else if (route.name === "ajuste") renderAjuste(view);
    else if (route.name === "interact") renderInteract(view);
    else if (route.name === "quiz") renderQuiz(view);
    else view.innerHTML = "<p>Ruta no reconocida.</p>";
  }, 50);
}

/* ============================================================
   Recent Items — localStorage helpers
   ============================================================ */
const RECENT_KEY = "antidep_recents_v1";
const MAX_RECENTS = 6;

function getRecentItems() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}

function addRecentItem(id, name, cls) {
  const recents = getRecentItems().filter(r => String(r.id) !== String(id));
  recents.unshift({ id: String(id), name, cls, ts: Date.now() });
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS))); }
  catch {}
}

/* ============================================================
   Task Filter definitions (filtros por tarea clínica)
   ============================================================ */
const TASK_FILTERS = [
  { id: "low_sedation",   label: "↓ Sedación",     icon: "😴",
    test: d => parseInt(d.nivel_sedacion) <= 1 },
  { id: "low_sexual",     label: "↓ D. sexual",    icon: "❤️",
    test: d => /bajo|leve|mínima|minima|nula/i.test(d.perfil_disfuncion_sexual || "") },
  { id: "low_qt",         label: "↓ Riesgo QT",    icon: "💓",
    test: d => /bajo|leve|mínimo|minimo|nulo/i.test(d.riesgo_prolongacion_qt || "") },
  { id: "low_weight",     label: "↓ Impacto peso", icon: "⚖️",
    test: d => /neutro|bajo|pérdida|perdida/i.test(d.perfil_impacto_peso || "") },
  { id: "low_withdrawal", label: "↓ Abstinencia",  icon: "🔄",
    test: d => /bajo|leve|mínimo|minimo|nulo/i.test(d.riesgo_sindrome_abstinencia || "") },
  { id: "isrs",           label: "ISRS",            icon: "💊",
    test: d => /isrs/i.test(d.clase_terapeutica || "") },
  { id: "dual",           label: "Dual (IRSN)",     icon: "🔁",
    test: d => /dual|irsn|snri/i.test(d.clase_terapeutica || d.mecanismo_principal || "") },
];

function applyTaskFilters(items, activeTasks) {
  if (!activeTasks || activeTasks.length === 0) return items;
  const defs = TASK_FILTERS.filter(t => activeTasks.includes(t.id));
  return items.filter(d => defs.every(t => t.test(d)));
}

/* ============================================================
   Clinical Chips helper (lectura rápida)
   ============================================================ */
function getClinicalChips(d) {
  const chips = [];

  // ATC code
  if (d.codigo_atc) {
    chips.push({ label: d.codigo_atc, variant: "primary" });
  }

  // Sedation level
  const sed = parseInt(d.nivel_sedacion, 10);
  if (!isNaN(sed)) {
    const variants = ["success", "success", "warning", "danger"];
    const labels = ["Sin sedación", "Sedación ↓", "Sedación ↑↑", "Sedación ↑↑↑"];
    chips.push({ label: labels[Math.min(sed, 3)], variant: variants[Math.min(sed, 3)] });
  }

  // QT risk — only flag if notable
  const qt = (d.riesgo_prolongacion_qt || "").toLowerCase();
  if (/alto|medio|moderado/i.test(qt)) {
    chips.push({ label: "QT ↑", variant: /alto/i.test(qt) ? "danger" : "warning" });
  }

  // Sexual dysfunction — only flag if notable
  const sex = (d.perfil_disfuncion_sexual || "").toLowerCase();
  if (/alto|medio|moderado|significativo/i.test(sex)) {
    chips.push({ label: "D.sexual ↑", variant: /alto/i.test(sex) ? "danger" : "warning" });
  }

  return chips;
}

function renderClinicalChips(d) {
  const chips = getClinicalChips(d);
  if (!chips.length) return "";
  return `<div class="clinical-chips-row">
    ${chips.map(c => `<span class="clinical-chip clinical-chip--${c.variant}">${escapeHtml(c.label)}</span>`).join("")}
  </div>`;
}

/* ============================================================
   Skeleton cards (estado de carga)
   ============================================================ */
function renderSkeletonGrid(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line skeleton-line--title"></div>
      <div class="skeleton skeleton-line skeleton-line--sub"></div>
      <div style="display:flex; gap:8px; margin-top:8px">
        <div class="skeleton skeleton-line skeleton-line--chip"></div>
        <div class="skeleton skeleton-line skeleton-line--chip"></div>
      </div>
    </div>
  `).join("");
}

/* ============================================================
   List
   ============================================================ */

function renderList(view) {
  const state = store.getState();
  const activeTasks = state.filters?.tasks ?? [];

  // Show skeleton while data loads
  if (!state.data?.dataset) {
    view.innerHTML = `<div class="animate-fade-in"><div class="grid-cards">${renderSkeletonGrid(6)}</div></div>`;
    return;
  }

  let items = selectFilteredItems(state);
  items = applyTaskFilters(items, activeTasks);
  const selected = new Set(state.compare?.ids ?? []);
  const compareIds = [...selected];

  // Recent items
  const allFarmacos = state.data?.dataset?.farmacos ?? [];
  const recentRaw = getRecentItems();
  const recentFarmacos = recentRaw
    .map(r => allFarmacos.find(f => String(f.id_farmaco) === String(r.id)))
    .filter(Boolean)
    .slice(0, 5);

  // Task chips HTML
  const taskChipsHTML = TASK_FILTERS.map(t => {
    const isActive = activeTasks.includes(t.id);
    return `<button type="button" class="task-chip ${isActive ? "active" : ""} task-filter-btn" data-task="${escapeHtml(t.id)}">
      <span class="task-chip__icon">${t.icon}</span>${escapeHtml(t.label)}
    </button>`;
  }).join("");

  // Recents HTML
  const recentsHTML = recentFarmacos.length ? `
    <section class="recents-section animate-fade-in">
      <div class="recents-section__title">Recientes</div>
      <div class="recents-list">
        ${recentFarmacos.map(d => `
          <a href="#/detail/${encodeURIComponent(d.id_farmaco)}" class="recent-item">
            <span class="recent-item__name">${escapeHtml(d.nombre_generico)}</span>
            <span class="recent-item__class">${escapeHtml(d.clase_terapeutica || "")}</span>
          </a>
        `).join("")}
      </div>
    </section>
  ` : "";

  view.innerHTML = `
    <div class="animate-fade-in">

      <!-- Hero search protagonista -->
      <div class="search-hero">
        <span class="search-hero__icon-left">🔍</span>
        <input type="search" id="inputSearch" class="search-hero__input"
          placeholder="Buscar antidepresivo…"
          value="${escapeHtml(state.filters.q || "")}"
          autocomplete="off" autocorrect="off" spellcheck="false" />
      </div>

      <!-- Task chips (filtros por tarea clínica) -->
      <div class="task-chips-bar">
        ${taskChipsHTML}
      </div>

      <!-- Recientes -->
      ${recentsHTML}

      <!-- List header -->
      <div class="list-header">
        <span class="list-header__count">${items.length} fármaco${items.length !== 1 ? "s" : ""}</span>
        <button id="btnGoCompare" type="button" class="m3-fab" ${compareIds.length === 0 ? "disabled" : ""}>
          ⚖️ ${compareIds.length ? `Comparar (${compareIds.length})` : "Comparar"}
        </button>
      </div>

      <!-- Drug grid -->
      <div class="grid-cards">
        ${items.map(d => renderDrugCard(d, selected)).join("") || `
          <div style="grid-column:1/-1; text-align:center; padding:var(--space-8); color:var(--color-text-muted)">
            <div style="font-size:2.5rem; margin-bottom:var(--space-3)">🔍</div>
            <p style="font-weight:700">Sin resultados para esos criterios.</p>
            <p class="text-sm" style="margin-top:var(--space-2)">Prueba quitando algún filtro de tarea.</p>
          </div>
        `}
      </div>
    </div>
  `;

  attachFilterListeners(view);
  initCardSpotlight();

  // Compare button
  const go = document.getElementById("btnGoCompare");
  if (go) {
    go.addEventListener("click", () => {
      const ids = store.getState().compare?.ids ?? [];
      if (!ids.length) return;
      location.hash = `#/compare?ids=${encodeURIComponent(ids.join(","))}`;
    });
  }
}

function renderDrugCard(d, selected) {
  const id = String(d.id_farmaco);
  const name = d.nombre_generico ?? id;
  const cls = d.clase_terapeutica ?? "";
  const isOn = selected.has(id);

  return `
    <div class="card card--hoverable card--spotlight">
      <div class="card-drug__header">
        <a href="#/detail/${encodeURIComponent(id)}" class="card-drug__name">${escapeHtml(name)}</a>
        <button type="button"
          class="card-drug__compare-btn chkCompareBtn ${isOn ? "active" : ""}"
          data-id="${escapeHtml(id)}"
          title="${isOn ? "Quitar del comparador" : "Agregar al comparador"}"
          aria-pressed="${isOn}">
          ${isOn ? "✓" : "+"}
        </button>
      </div>
      <div class="card-drug__class">${escapeHtml(cls)}</div>
      ${renderClinicalChips(d)}
    </div>
  `;
}

function attachFilterListeners(view) {
  // Hero search input
  const inputSearch = view.querySelector("#inputSearch");
  if (inputSearch) {
    inputSearch.addEventListener("input", (e) => {
      store.updatePath("filters.q", e.target.value);
    });
    // Auto-focus search on desktop
    if (window.innerWidth >= 1024) inputSearch.focus();
  }

  // Task chips
  view.querySelectorAll(".task-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const taskId = btn.dataset.task;
      const current = store.getState().filters?.tasks ?? [];
      const next = current.includes(taskId)
        ? current.filter(x => x !== taskId)
        : [...current, taskId];
      store.updatePath("filters.tasks", next);
    });
  });

  // Compare toggle buttons (replacing checkboxes)
  view.querySelectorAll(".chkCompareBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const curr = store.getState().compare?.ids ?? [];
      const set = new Set(curr);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      store.setCompareIds([...set], { reason: "ui:listToggleCompare" });

      // Update button visually immediately
      const isNowOn = set.has(id);
      btn.classList.toggle("active", isNowOn);
      btn.textContent = isNowOn ? "✓" : "+";
      btn.setAttribute("aria-pressed", String(isNowOn));

      // Update compare FAB
      const go = document.getElementById("btnGoCompare");
      if (go) {
        const newIds = [...set];
        go.disabled = newIds.length === 0;
        go.textContent = newIds.length ? `⚖️ Comparar (${newIds.length})` : "⚖️ Comparar";
      }
    });
  });
}

/* ============================================================
   Compare
   ============================================================ */

function renderCompare(view) {
  const state = store.getState();
  const { selectedItems: rows, radarData } = selectComparisonData(state);
  // Premium Palette (Indigo, Rose, Violet, Emerald, Amber, Cyan, Orange, Teal)
  const colors = [
    "hsl(243, 75%, 59%)", // Indigo
    "hsl(350, 89%, 60%)", // Rose
    "hsl(262, 80%, 50%)", // Violet
    "hsl(161, 75%, 45%)", // Emerald
    "hsl(38, 92%, 50%)",   // Amber
    "hsl(190, 90%, 50%)",  // Cyan
    "hsl(20, 90%, 50%)",   // Orange
    "hsl(170, 70%, 40%)"   // Teal
  ];

  // Get all drugs for the dropdown, excluding selected ones
  const allDrugs = state.data?.dataset?.farmacos || [];
  const selectedIds = new Set(rows.map(r => r.id_farmaco));
  const availableDrugs = allDrugs
    .filter(d => !selectedIds.has(d.id_farmaco))
    .sort((a, b) => a.nombre_generico.localeCompare(b.nombre_generico));

  if (!rows.length) {
    view.innerHTML = `
      <div class="animate-fade-in" style="text-align:center; padding:var(--space-8);">
        <h2 class="h2">Comparador</h2>
        <p class="text-muted" style="margin-bottom:var(--space-6)">No has seleccionado ningún fármaco para comparar.</p>
        
        <!-- Empty State Dropdown -->
        <div style="max-width:300px; margin:0 auto var(--space-6);">
            <select id="selCompareEmpty" class="btn btn--outline" style="width:100%; text-align:left; padding:12px;">
                <option value="">+ Agregar Fármaco</option>
                ${availableDrugs.map(d => `<option value="${d.id_farmaco}">${d.nombre_generico}</option>`).join('')}
            </select>
        </div>

        <a href="#/list" class="btn btn--primary">VOLVER A LA LISTA</a>
      </div>
    `;

    // Event listener for empty state dropdown
    const selEmpty = view.querySelector("#selCompareEmpty");
    if (selEmpty) {
      selEmpty.addEventListener("change", (e) => {
        if (!e.target.value) return;
        store.setCompareIds([e.target.value], { reason: "ui:compareAdd" });
      });
    }
    return;
  }

  const chips = rows
    .map((d, i) => {
      const id = d.id_farmaco;
      const label = d?.nombre_generico ?? id;
      const color = colors[i % colors.length];
      return `
        <button class="chip chip--active chipRemove" data-id="${escapeHtml(id)}" type="button" style="cursor:pointer; gap:10px; border-left: 4px solid ${color}; padding-left:8px;">
          <span style="width:8px; height:8px; border-radius:50%; background:${color}; display:inline-block;"></span>
          ${escapeHtml(label)} <span style="font-size:1.2rem; opacity:0.7">×</span>
        </button>
      `;
    })
    .join("");

  const radarSVG = renderRadarChart(radarData, colors);

  // Dinamizar campos desde schema si existe
  const schema = state.data?.schema;
  let tableFields = [];
  if (schema && schema.compare?.fields) {
    tableFields = schema.compare.fields.map(f => ({
      label: f.label,
      key: f.rawField,
      highlight: !!f.ordField
    }));
  } else {
    tableFields = [
      { label: "Clase", key: "clase_terapeutica" },
      { label: "Mecanismo", key: "mecanismo_principal" },
      { label: "Vida Media", key: "vida_media_parental" },
      { label: "Sedación", key: "nivel_sedacion", highlight: true },
      { label: "Peso", key: "perfil_impacto_peso", highlight: true },
      { label: "Sexual", key: "perfil_disfuncion_sexual", highlight: true },
      { label: "QT", key: "riesgo_prolongacion_qt", highlight: true },
      { label: "Abstinencia", key: "riesgo_sindrome_abstinencia", highlight: true }
    ];
  }

  view.innerHTML = `
    <div class="animate-fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
        <h2 class="h2" style="margin:0">Perfil Comparativo</h2>
        <a href="#/list" class="btn btn--outline text-xs" style="font-weight:700">← VOLVER AL LISTADO</a>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:var(--space-4); align-items:center;">
        ${chips}
        
        <!-- Add Drug Dropdown -->
        <div style="position:relative;">
            <select id="selCompareAdd" class="chip" style="cursor:pointer; padding-right:24px; appearance:none; -webkit-appearance:none; border:1px dashed var(--color-border); background:var(--color-bg);">
                <option value="">+ Añadir...</option>
                ${availableDrugs.map(d => `<option value="${d.id_farmaco}">${d.nombre_generico}</option>`).join('')}
            </select>
        </div>
      </div>

      <div class="grid-compare">
        <section class="card glass-effect" style="padding:var(--space-6); border-radius:var(--radius-xl);">
          <h3 class="h3" style="margin-bottom:var(--space-4); font-size:1.25rem;">Impacto Clínico</h3>
          ${radarSVG}
          <div class="alert alert--info" style="margin-top:var(--space-8); padding:var(--space-4);">
            <div class="text-xs" style="line-height:1.5; font-weight:500">
              <strong>Nota:</strong> Los valores son normalizados (0-1). Un área mayor representa mayor carga de efectos adversos o intensidad clínica según el eje. Los colores del gráfico coinciden con los botones de arriba.
            </div>
          </div>
        </section>

        <section class="card glass-effect" style="overflow:hidden; padding:0; border-radius:var(--radius-xl);">
          <div style="padding:var(--space-6); border-bottom:1px solid var(--color-border); background:var(--color-bg);">
            <h3 class="h3" style="margin:0; font-size:1.25rem;">Especificaciones</h3>
          </div>
          <div class="compare-container" style="overflow-x:auto;">
            <table class="compare-table" style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="text-align:left;">
                  <th style="padding:var(--space-4) var(--space-5); color:var(--color-primary); background:var(--color-bg); font-family:var(--font-headers); font-size:0.75rem; letter-spacing:0.1em; border-bottom:2px solid var(--color-border);">RASGO</th>
                  ${rows.map((d, i) => {
    const color = colors[i % colors.length];
    return `<th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-weight:800; border-bottom:2px solid ${color}; min-width:180px; color:${color}">${escapeHtml(d.nombre_generico)}</th>`
  }).join("")}
                </tr>
              </thead>
              <tbody>
                ${tableFields.map(tr => `
                  <tr>
                    <td style="padding:var(--space-4) var(--space-5); font-weight:700; color:var(--color-text-muted); font-size:0.85rem; border-bottom:1px solid var(--color-border); background:rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.02)">${escapeHtml(tr.label)}</td>
                    ${rows.map(d => {
    const val = d[tr.key] ?? "-";
    const isHigh = tr.highlight && (val.toString().toLowerCase().includes("alto") || val === "3" || val === "2");
    const textStyle = isHigh ? 'color:var(--color-danger); font-weight:800;' : 'font-weight:500;';
    return `<td style="padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); font-size:0.95rem; ${textStyle}">${escapeHtml(val)}</td>`;
  }).join("")}
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `;

  // Listener para eliminar chips
  view.querySelectorAll(".chipRemove").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault(); // prevent default just in case
      const id = ev.currentTarget.dataset.id;
      const next = (store.getState().compare?.ids ?? []).filter(
        (x) => String(x) !== String(id)
      );
      store.setCompareIds(next, { reason: "ui:compareRemove" });
    });
  });

  // Listener para añadir desde el dropdown
  const selAdd = view.querySelector("#selCompareAdd");
  if (selAdd) {
    selAdd.addEventListener("change", (e) => {
      const val = e.target.value;
      if (!val) return;
      const curr = store.getState().compare?.ids ?? [];
      store.setCompareIds([...curr, val], { reason: "ui:compareAdd" });
    });
  }
}

function renderRadarChart(data, colors) {
  const size = 320;
  const c = size / 2;
  const r = 110;

  // Define axes configuration with mappings and max values for normalization
  const axesConfig = [
    { id: "sedacion", label: "Sedación", key: "nivel_sedacion", max: 3 },
    { id: "peso", label: "Peso", key: "perfil_impacto_peso_ord", max: 2 },
    { id: "sexual", label: "Sexual", key: "perfil_disfuncion_sexual_ord", max: 2 },
    { id: "qt", label: "QT", key: "riesgo_prolongacion_qt_ord", max: 2 },
    { id: "activacion", label: "Activación", key: "perfil_activacion_ord", max: 2 },
    { id: "abstinencia", label: "Abstinencia", key: "riesgo_sindrome_abstinencia_ord", max: 2 }
  ];

  const axes = axesConfig.map(a => a.id);
  const labels = axesConfig.map(a => a.label);

  // Fallback colors if not provided
  if (!colors) {
    colors = [
      "hsl(243, 75%, 59%)",
      "hsl(350, 89%, 60%)",
      "hsl(262, 80%, 50%)",
      "hsl(161, 75%, 45%)",
      "hsl(38, 92%, 50%)"
    ];
  }

  const levels = [0.25, 0.5, 0.75, 1];
  const gridSVG = levels.map(l => {
    const pts = axes.map((_, i) => {
      const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const rad = r * l;
      return `${c + rad * Math.cos(ang)},${c + rad * Math.sin(ang)}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="${l === 1 ? '' : '4,4'}" />`;
  }).join("");

  const axesSVG = axes.map((_, i) => {
    const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const x = c + r * Math.cos(ang);
    const y = c + r * Math.sin(ang);
    return `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="var(--color-border)" stroke-width="1" />`;
  }).join("");

  const labelsSVG = labels.map((lbl, i) => {
    const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const dist = r + 30;
    const x = c + dist * Math.cos(ang);
    const y = c + dist * Math.sin(ang);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="900" font-family="var(--font-headers)" fill="var(--color-text-muted)" letter-spacing="0.05em">${lbl.toUpperCase()}</text>`;
  }).join("");

  const polygonsSVG = data.map((d, idx) => {
    const color = colors[idx % colors.length];
    const pts = axesConfig.map((ax, i) => {
      const ang = (Math.PI * 2 * i) / axesConfig.length - Math.PI / 2;

      // Get raw value using the mapped key
      const rawVal = d[ax.key] ?? 0;

      // Normalize to 0-1 range based on max value for that axis
      // Ensure we don't divide by zero and clamp to 0-1
      let normVal = typeof rawVal === 'number' ? rawVal / (ax.max || 1) : 0;
      if (normVal > 1) normVal = 1;
      if (normVal < 0) normVal = 0;

      const rad = r * normVal;
      return `${c + rad * Math.cos(ang)},${c + rad * Math.sin(ang)}`;
    }).join(" ");

    return `
      <g class="radar-poly" style="filter: drop-shadow(0 4px 8px ${color}44)">
        <polygon points="${pts}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" />
        ${axesConfig.map((ax, i) => {
      const ang = (Math.PI * 2 * i) / axesConfig.length - Math.PI / 2;
      const rawVal = d[ax.key] ?? 0;
      let normVal = typeof rawVal === 'number' ? rawVal / (ax.max || 1) : 0;
      if (normVal > 1) normVal = 1;
      if (normVal < 0) normVal = 0;

      const rad = r * normVal;
      return `<circle cx="${c + rad * Math.cos(ang)}" cy="${c + rad * Math.sin(ang)}" r="3" fill="var(--color-surface)" stroke="${color}" stroke-width="1.5" />`;
    }).join("")}
      </g>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 ${size} ${size}" style="max-width:400px; margin:0 auto; display:block;">
      <defs>
        <radialGradient id="radarGrad">
          <stop offset="0%" stop-color="var(--color-bg)" stop-opacity="0" />
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.03" />
        </radialGradient>
      </defs>
      <circle cx="${c}" cy="${c}" r="${r}" fill="url(#radarGrad)" />
      ${gridSVG}${axesSVG}${labelsSVG}${polygonsSVG}
    </svg>
  `;
}

function mountDock(container) {
  if (!container) return;

  // M3 Bottom Navigation — 5 destinos principales
  const items = [
    { id: "list",      label: "Inicio",       icon: "🏠",  hash: "#/list" },
    { id: "compare",   label: "Comparar",     icon: "⚖️",  hash: "#/compare" },
    { id: "switching", label: "Switching",    icon: "🔄",  hash: "#/switching" },
    { id: "interact",  label: "Interacc.",    icon: "⚡",  hash: "#/interact" },
    { id: "quiz",      label: "Quiz",         icon: "✦",   hash: "#/quiz" },
  ];

  // Inject M3 nav bar directly into body (not the dock container, which is hidden on desktop)
  let navBar = document.getElementById("m3-nav-bar");
  if (!navBar) {
    navBar = document.createElement("nav");
    navBar.id = "m3-nav-bar";
    navBar.className = "m3-nav-bar animate-fade-in";
    navBar.style.animationDelay = "0.4s";
    document.body.appendChild(navBar);
  }

  navBar.innerHTML = items.map(item => `
    <a href="${item.hash}" class="m3-nav-item m3-nav-link dock-link" data-id="${item.id}">
      <span class="m3-nav-item__indicator">
        <span class="m3-nav-item__icon">${item.icon}</span>
        ${item.id === "compare" ? `<span class="m3-nav-item__badge" id="navCompareBadge" style="display:none"></span>` : ""}
      </span>
      <span class="m3-nav-item__label">${item.label}</span>
    </a>
  `).join("");
}


/* ============================================================
   Helpers
   ============================================================ */

main();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
