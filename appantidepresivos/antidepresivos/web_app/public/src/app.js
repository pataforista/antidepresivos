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
import { mountInfoModal } from "./ui/modalInfo.js";
import { initCardSpotlight, updateGooeyNav, initEntranceAnimations } from "./ui/visuals.js";
import { initRibbons } from "./ribbons.js";

/* ============================================================
   App Initialization
   ============================================================ */

async function main() {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app no encontrado");

  root.innerHTML = "<div style='display:flex; height:100vh; align-items:center; justify-content:center;'><p style='font-family:var(--font-headers); font-weight:700; color:var(--color-primary); font-size:1.5rem;' class='animate-fade-in'>Cargando Códice…</p></div>";

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
      },
    });

    mountDisclaimerGate({
      rootEl: root,
      onAllow: () => {
        mountShell(root);

        const router = createRouter(store);
        router.start();

        // Init Visuals
        setTimeout(() => {
          updateGooeyNav();
          initEntranceAnimations();
          initRibbons("ribbons-container");
          mountDock(document.getElementById("dock-container"));
        }, 50);

        // Render inicial
        renderRoute(store.getState().route);
        updateHeaderNav(store.getState().route);

        // Re-render cuando cambie la ruta (evento correcto del store)
        store.subscribe("state:path:route", ({ next }) => {
          renderRoute(next);
          updateHeaderNav(next);
          setTimeout(initEntranceAnimations, 10);
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
  document.querySelectorAll(".nav-gooey__link").forEach(el => {
    el.classList.remove("active");
    const href = el.getAttribute("href");
    if (href === `#/${route?.name}` || (route?.name === "list" && href === "#/list")) {
      el.classList.add("active");
    }
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
  const title = state.data?.schema?.meta?.appTitle ?? "Antidepresivos — Códice";

  root.innerHTML = `
    <div id="appShell" class="shell">
      <header class="header glass-effect">
        <strong class="header__title">${escapeHtml(title)}</strong>

        <nav class="header__nav nav-gooey">
          <div class="nav-gooey__blob" style="background: var(--color-primary-light); opacity: 0.2; border-radius: var(--radius-full);"></div>
          <a href="#/list" class="nav-gooey__link">Lista</a>
          <a href="#/compare" class="nav-gooey__link" id="btnHeaderCompare">Comparar</a>
        </nav>
        
        <div style="display:flex;align-items:center;gap:12px;margin-left:auto">
            <button id="btnClearCompare" type="button" class="btn btn--ghost text-xs" style="font-weight:700">
                LIMPIAR
            </button>
            <div id="compareCount" class="chip chip--active text-xs" style="padding: 4px 10px; min-width: 24px; text-align: center; display:none"></div>
        </div>
      </header>

      <main id="appView" class="main" style="padding: var(--space-6) var(--space-5); max-width: 1400px; margin: 0 auto; width: 100%;"></main>

      <footer class="footer" style="padding: var(--space-8) var(--space-5); background: var(--color-surface); border-top: 1px solid var(--color-border); margin-top: auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:1400px; margin:0 auto; width:100%;">
           <span class="text-xs text-muted" style="font-weight:600">© 2024 • DR. CESAR CELADA</span>
           <button id="btnOpenInfo" class="btn btn--outline text-xs" style="padding:var(--space-2) var(--space-4);">
             Fuentes y Disclaimer
           </button>
        </div>
      </footer>
    </div>
  `;
}

function updateCompareCount() {
  const el = document.getElementById("compareCount");
  if (!el) return;
  const ids = store.getState().compare?.ids ?? [];
  el.textContent = ids.length;
  el.style.display = ids.length ? "inline-flex" : "none";

  const btnClear = document.getElementById("btnClearCompare");
  if (btnClear) {
    btnClear.style.display = ids.length ? "inline-block" : "none";
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

  // Clean scroll
  window.scrollTo({ top: 0, behavior: "smooth" });

  setTimeout(() => {
    if (route.name === "list") renderList(view);
    else if (route.name === "detail") renderDetail(view, route.params?.id);
    else if (route.name === "compare") renderCompare(view);
    else if (route.name === "switching") renderSwitching(view);
    else if (route.name === "ajuste") renderAjuste(view);
    else if (route.name === "interact") renderInteract(view);
    else view.innerHTML = "<p>Ruta no reconocida.</p>";
  }, 50);
}

/* ============================================================
   List
   ============================================================ */

function renderList(view) {
  const state = store.getState();
  const items = selectFilteredItems(state);
  const selected = new Set(state.compare?.ids ?? []);

  const filterHTML = renderFilters(state.filters);

  view.innerHTML = `
    <div class="animate-fade-in">
      <h2 class="h2">Listado de Fármacos</h2>
      <p class="text-muted" style="margin-bottom: var(--space-6); font-weight:600">Mostrando <b>${items.length}</b> resultados según los criterios.</p>

      <section style="margin-bottom: var(--space-8);">
        ${filterHTML}
      </section>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-6); gap:var(--space-4); flex-wrap:wrap;">
        <div style="display:flex; gap:var(--space-3); align-items:center;">
          <button id="btnGoCompare" type="button" class="btn btn--primary">
            IR A COMPARAR
          </button>
          <span id="compareHint" class="text-sm text-muted" style="font-weight:500">
            Selecciona fármacos para comparar sus perfiles.
          </span>
        </div>
      </div>

      <div class="grid-cards">
        ${items
      .map((d) => {
        const id = String(d.id_farmaco);
        const name = d.nombre_generico ?? id;
        const atc = d.codigo_atc ?? "N/D";
        const cls = d.clase_terapeutica ?? "";
        const isOn = selected.has(id);

        return `
            <div class="card card--hoverable card--spotlight" style="padding:var(--space-6)">
              <div style="display:flex;gap:var(--space-4);align-items:flex-start">
                <div class="input-checkbox-wrapper">
                  <input type="checkbox" class="chkCompare" data-id="${escapeHtml(id)}" ${isOn ? "checked" : ""} style="width:20px; height:20px; accent-color:var(--color-primary); cursor:pointer;" />
                </div>
                <div style="flex:1">
                  <a href="#/detail/${encodeURIComponent(id)}" style="text-decoration:none;display:block">
                    <div class="card__title">${escapeHtml(name)}</div>
                  </a>
                  <div class="text-muted text-sm" style="font-weight:600; margin-top:2px">${escapeHtml(cls)}</div>
                  <div class="chip text-xs" style="margin-top:var(--space-4); font-weight:700">${escapeHtml(atc)}</div>
                </div>
              </div>
            </div>
          `;
      })
      .join("")}
      </div>
    </div>
  `;

  attachFilterListeners(view);

  const go = document.getElementById("btnGoCompare");
  const hint = document.getElementById("compareHint");
  const compareIds = store.getState().compare?.ids ?? [];
  if (go) {
    go.disabled = compareIds.length === 0;
    go.textContent = compareIds.length ? `IR A COMPARAR (${compareIds.length})` : "IR A COMPARAR";
  }
  if (hint) {
    hint.textContent = compareIds.length
      ? "Has seleccionado fármacos. Revisa el comparador."
      : "Selecciona fármacos con el checkbox.";
  }
  if (go) {
    go.addEventListener("click", () => {
      const ids = store.getState().compare?.ids ?? [];
      if (!ids.length) return;
      location.hash = `#/compare?ids=${encodeURIComponent(ids.join(","))}`;
    });
  }

  view.querySelectorAll(".chkCompare").forEach((el) => {
    el.addEventListener("change", (ev) => {
      const id = ev.target.dataset.id;
      const curr = store.getState().compare?.ids ?? [];
      const set = new Set(curr);

      if (ev.target.checked) set.add(id);
      else set.delete(id);

      store.setCompareIds([...set], { reason: "ui:listToggleCompare" });
      const nextIds = [...set];
      const goBtn = document.getElementById("btnGoCompare");
      const hintEl = document.getElementById("compareHint");
      if (goBtn) {
        goBtn.disabled = nextIds.length === 0;
        goBtn.textContent = nextIds.length ? `IR A COMPARAR (${nextIds.length})` : "IR A COMPARAR";
      }
      if (hintEl) {
        hintEl.textContent = nextIds.length
          ? "Has seleccionado fármacos. Revisa el comparador."
          : "Selecciona fármacos con el checkbox.";
      }
    });
  });

  initCardSpotlight();
}

function renderFilters(filters) {
  const q = filters.q || "";
  const schema = store.getState().data?.schema;

  // Obtener grupos dinámicamente si es posible
  let groups = [];
  if (schema) {
    const groupFilter = schema.filters?.find(f => f.id === "grupo");
    if (groupFilter && groupFilter.valuesFromData) {
      const allItems = store.getState().data?.dataset?.farmacos ?? [];
      groups = [...new Set(allItems.map(i => i.clase_terapeutica))].filter(Boolean).sort();
    }
  }

  if (!groups.length) {
    groups = ["ISRS", "Dual", "Tricíclico", "IMAO", "Atípico", "Modulador"];
  }

  const activeGroups = new Set(filters.grupo || []);

  const groupChips = groups.map(g => {
    const isActive = activeGroups.has(g);
    return `
      <button type="button"
        class="chip ${isActive ? 'chip--active' : ''} filter-group-btn"
        data-group="${escapeHtml(g)}"
        style="cursor:pointer;">
        ${escapeHtml(g)}
      </button>
    `;
  }).join("");

  return `
    <div style="display:flex; flex-direction:column; gap:var(--space-6);">
      <div class="glass-effect" style="border-radius: var(--radius-lg); overflow:hidden;">
        <input type="search" id="inputSearch" class="input" placeholder="Buscar por nombre, mecanismo, clase..." value="${escapeHtml(q)}" 
          style="width:100%; padding: 18px 24px; border: none; font-size: 1.1rem; outline: none; background: transparent; font-family:var(--font-body); font-weight:500;" />
      </div>

      <div class="card glass-effect" style="padding: var(--space-6);">
        <div class="text-xs" style="margin-bottom:var(--space-4); font-family:var(--font-headers); font-weight:800; color:var(--color-primary); letter-spacing:0.1em;">FILTRAR POR GRUPO:</div>
        <div style="display:flex; flex-wrap:wrap; gap:10px;">
          ${groupChips}
        </div>
        
        <div style="margin-top:var(--space-6);">
          <div class="text-xs" style="margin-bottom:var(--space-4); font-family:var(--font-headers); font-weight:800; color:var(--color-primary); letter-spacing:0.1em;">SEDACIÓN MÁXIMA:</div>
          <div style="display:flex; align-items:center; gap:var(--space-5)">
            <input type="range" id="rangeSedacion" min="0" max="3" step="1" value="${filters.sedacion?.max ?? 3}" style="flex:1; accent-color:var(--color-primary); cursor:pointer;" />
            <div id="lblSedacion" class="chip chip--active" style="padding: 6px 14px; font-weight:800; font-size:1rem; min-width:32px; justify-content:center;">${filters.sedacion?.max ?? 3}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachFilterListeners(view) {
  const inputSearch = view.querySelector("#inputSearch");
  if (inputSearch) {
    inputSearch.addEventListener("input", (e) => {
      store.updatePath("filters.q", e.target.value);
    });
  }

  view.querySelectorAll(".filter-group-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const g = e.target.dataset.group;
      let current = store.getState().filters.grupo || [];
      if (current.includes(g)) {
        current = current.filter(x => x !== g);
      } else {
        current = [...current, g];
      }
      store.updatePath("filters.grupo", current);
    });
  });

  const range = view.querySelector("#rangeSedacion");
  if (range) {
    range.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      const lbl = document.getElementById("lblSedacion");
      if (lbl) lbl.textContent = val;
      store.updatePath("filters.sedacion", { min: 0, max: val });
    });
  }
}

/* ============================================================
   Compare
   ============================================================ */

function renderCompare(view) {
  const state = store.getState();
  const { selectedItems: rows, radarData } = selectComparisonData(state);

  if (!rows.length) {
    view.innerHTML = `
      <div class="animate-fade-in" style="text-align:center; padding:var(--space-8);">
        <h2 class="h2">Comparador</h2>
        <p class="text-muted" style="margin-bottom:var(--space-6)">No has seleccionado ningún fármaco para comparar.</p>
        <a href="#/list" class="btn btn--primary">VOLVER A LA LISTA</a>
      </div>
    `;
    return;
  }

  const chips = rows
    .map((d) => {
      const id = d.id_farmaco;
      const label = d?.nombre_generico ?? id;
      return `
        <button class="chip chip--active chipRemove" data-id="${escapeHtml(id)}" type="button" style="cursor:pointer; gap:10px">
          ${escapeHtml(label)} <span style="font-size:1.2rem; opacity:0.7">×</span>
        </button>
      `;
    })
    .join("");

  const radarSVG = renderRadarChart(radarData);

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

      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:var(--space-8)">
        ${chips}
      </div>

      <div class="grid-compare">
        <section class="card glass-effect" style="padding:var(--space-6); border-radius:var(--radius-xl);">
          <h3 class="h3" style="margin-bottom:var(--space-4); font-size:1.25rem;">Impacto Clínico</h3>
          ${radarSVG}
          <div class="alert alert--info" style="margin-top:var(--space-8); padding:var(--space-4);">
            <div class="text-xs" style="line-height:1.5; font-weight:500">
              <strong>Nota:</strong> Los valores son normalizados (0-1). Un área mayor representa mayor carga de efectos adversos o intensidad clínica según el eje.
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
                  ${rows.map(d => `<th style="padding:var(--space-4) var(--space-5); background:var(--color-bg); font-family:var(--font-headers); font-weight:800; border-bottom:2px solid var(--color-border); min-width:180px;">${escapeHtml(d.nombre_generico)}</th>`).join("")}
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

  view.querySelectorAll(".chipRemove").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      const id = ev.currentTarget.dataset.id;
      const next = (store.getState().compare?.ids ?? []).filter(
        (x) => String(x) !== String(id)
      );
      store.setCompareIds(next, { reason: "ui:compareRemove" });
    });
  });
}

function renderRadarChart(data) {
  const size = 320;
  const c = size / 2;
  const r = 110;
  const axes = ["sedacion", "peso", "sexual", "qt", "activacion", "abstinencia"];
  const labels = ["Sedación", "Peso", "Sexual", "QT", "Activación", "Abstinencia"];

  // Premium Palette (Indigo, Rose, Violet, Emerald, Amber)
  const colors = [
    "hsl(243, 75%, 59%)", // Indigo
    "hsl(350, 89%, 60%)", // Rose
    "hsl(262, 80%, 50%)", // Violet
    "hsl(161, 75%, 45%)", // Emerald
    "hsl(38, 92%, 50%)"   // Amber
  ];

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
    const pts = axes.map((ax, i) => {
      const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const val = d[ax] || 0;
      const rad = r * val;
      return `${c + rad * Math.cos(ang)},${c + rad * Math.sin(ang)}`;
    }).join(" ");

    return `
      <g class="radar-poly" style="filter: drop-shadow(0 4px 8px ${color}44)">
        <polygon points="${pts}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" />
        ${axes.map((ax, i) => {
      const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const val = d[ax] || 0;
      const rad = r * val;
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
  const items = [
    { id: "home", label: "Inicio", icon: "🏠", hash: "#/list" },
    { id: "compare", label: "Comparar", icon: "⚖️", hash: "#/compare" },
    { id: "switching", label: "Switching", icon: "🔄", hash: "#/switching" },
    { id: "ajuste", label: "Ajuste", icon: "📏", hash: "#/ajuste" },
    { id: "interact", label: "Interacción", icon: "⚡", hash: "#/interact" },
  ];

  container.innerHTML = `
    <div class="dock-panel animate-fade-in" style="animation-delay: 0.5s">
      ${items.map(item => `
        <div class="dock-item" onclick="location.hash='${item.hash}'">
          <span class="dock-icon">${item.icon}</span>
          <span class="dock-label">${item.label}</span>
        </div>
      `).join("")}
    </div>
  `;
}


/* ============================================================
   Helpers
   ============================================================ */

function escapeHtml(s) {
  return (s ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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
