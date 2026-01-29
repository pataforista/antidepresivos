import { initCardSpotlight, updateGooeyNav } from "./ui/visuals.js";

async function main() {
  // ... (keep existing setup)

  // (In mountShell)
  // ...
  mountShell(root);
  // Init Visuals
  setTimeout(() => updateGooeyNav(), 50);
  // ...

  // Re-render nav state on route change
  store.subscribe("state:path:route", ({ next }) => {
    renderRoute(next);
    updateHeaderNav(next);
  });
  // ...
}

function updateHeaderNav(route) {
  // Simple class toggling
  document.querySelectorAll(".nav-gooey__link").forEach(el => {
    el.classList.remove("active");
    if (el.getAttribute("href") === `#/${route?.name}`) {
      el.classList.add("active");
    }
  });
  updateGooeyNav();
}

/* ... mountShell ... */
function mountShell(root) {
  // ...
  root.innerHTML = `
    <div id="appShell" class="shell">
      <header class="header">
        <strong class="header__title">${escapeHtml(title)}</strong>

        <nav class="header__nav nav-gooey">
          <div class="nav-gooey__blob"></div>
          <a href="#/list" class="nav-gooey__link active">Lista</a>
          <a href="#/compare" class="nav-gooey__link" id="btnHeaderCompare">Comparar</a>
        </nav>
        
        <div style="display:flex;align-items:center;gap:8px;margin-left:12px">
            <button id="btnClearCompare" type="button" class="btn btn--ghost text-sm" style="display:none">
                Limpiar
            </button>
            <span id="compareCount" class="text-sm text-muted"></span>
        </div>
      </header>
  /* ... */
import { loadAppData } from "./core/dataLoader.js";
import { mountDisclaimerGate } from "./ui/gatekeeperDisclaimer.js";
import { createRouter } from "./core/router.js";
import * as policy from "./core/policy.js";
import { selectFilteredItems, selectComparisonData } from "./core/selectors.js";
import { renderDetail } from "./ui/detailView.js";
import { mountInfoModal } from "./ui/modalInfo.js";

async function main() {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app no encontrado");

  root.innerHTML = "<p style='padding:12px;font-family:system-ui'>Cargando…</p>";

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
        const btnHeaderCompare = document.getElementById("btnHeaderCompare");
        if (btnHeaderCompare) {
          btnHeaderCompare.addEventListener("click", (ev) => {
            ev.preventDefault();
            const ids = store.getState().compare?.ids ?? [];
            if (!ids.length) {
              // sin selección → mejor mandarlo a lista
              location.hash = "#/list";
              // opcional: avisito rápido
              // alert("Selecciona al menos un fármaco para comparar.");
              return;
            }
            location.hash = `# / compare ? ids = ${ encodeURIComponent(ids.join(",")) } `;
          });
        }
        const router = createRouter(store);
        router.start();

        // Render inicial
        renderRoute(store.getState().route);

        // Re-render cuando cambie la ruta (evento correcto del store)
        store.subscribe("state:path:route", ({ next }) => {
          renderRoute(next);
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
          }
        });

        // Compare: contador + re-render si estás en compare

        // Botón limpiar compare
        const btnClear = document.getElementById("btnClearCompare");
        if (btnClear) {
          btnClear.addEventListener("click", () => {
            store.setCompareIds([], { reason: "ui:clearCompare" });
            location.hash = "#/list";
          });
        }
      },
    });
  } catch (e) {
    console.error(e);
    root.innerHTML = `< pre style = "padding:12px;color:#b00" > ${
    escapeHtml(
      String(e?.stack ?? e)
    )
  }</pre > `;
  }
}

/* ============================================================
   Schema helpers (FUERA de templates)
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

  // Permite ["codigo_atc", ...] o [{id,label}, ...]
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
    < div id = "appShell" class="shell" >
      <header class="header">
        <strong class="header__title">${escapeHtml(title)}</strong>

        <nav class="header__nav">
          <a href="#/list" class="header__nav-link">Lista</a>
          <a href="#/compare" class="header__nav-link" id="btnHeaderCompare">Comparar</a>
          <button id="btnClearCompare" type="button" class="btn btn--ghost text-sm">
            Limpiar
          </button>
          <span id="compareCount" class="text-sm text-muted" style="margin-left: 8px;"></span>
        </nav>
      </header>

      <main id="appView" class="main"></main>

      <footer class="footer">
        <div style="display:flex; justify-content:space-between; align-items:center">
           <span class="text-xs text-muted">© 2024 • Dr. Cesar Celada</span>
           <button id="btnOpenInfo" class="btn btn--ghost text-xs" style="padding:4px 0;">
             Fuentes y Disclaimer
           </button>
        </div>
      </footer>
    </div >
    `;

  // Listener para el Modal de Info
  setTimeout(() => {
    const btnInfo = document.getElementById("btnOpenInfo");
    if (btnInfo) btnInfo.addEventListener("click", () => mountInfoModal());
  }, 0);
}

function updateCompareCount() {
  const el = document.getElementById("compareCount");
  if (!el) return;
  const ids = store.getState().compare?.ids ?? [];
  el.textContent = ids.length ? `Seleccionados: ${ ids.length } ` : "";
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

  if (route.name === "list") return renderList(view);
  if (route.name === "detail") return renderDetail(view, route.params?.id);
  if (route.name === "compare") return renderCompare(view);

  view.innerHTML = "<p>Ruta no reconocida.</p>";
}

/* ============================================================
   List
   ============================================================ */

function renderList(view) {
  const state = store.getState();
  // Usamos el selector para filtrar
  const items = selectFilteredItems(state);
  const selected = new Set(state.compare?.ids ?? []);

  // HTML de filtros
  const filterHTML = renderFilters(state.filters);

  view.innerHTML = `
    < h2 class="h2" > Listado</h2 >
    <p class="text-muted" style="margin-bottom: 12px;">Fármacos encontrados: <b>${items.length}</b></p>

    <!--Barra de Filtros-- >
    <div class="card" style="margin-bottom: 24px; padding: 16px;">
      ${filterHTML}
    </div>

    <div style="display:flex;gap:10px;align-items:center;margin-bottom: 24px;">
      <button id="btnGoCompare" type="button" class="btn btn--primary">
        Ir a comparar
      </button>
      <span class="text-sm text-muted">
        Selecciona con checkbox.
      </span>
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
            <div class="card card--hoverable">
              <div style="display:flex;gap:12px;align-items:flex-start">
                <input type="checkbox" class="chkCompare input-checkbox" data-id="${escapeHtml(id)}" ${isOn ? "checked" : ""} style="margin-top:4px" />
                <div style="flex:1">
                  <a href="#/detail/${encodeURIComponent(id)}" style="text-decoration:none;display:block">
                    <div class="card__title">${escapeHtml(name)}</div>
                  </a>
                  <div class="card__subtitle" style="margin-top:4px">${escapeHtml(cls)}</div>
                  <div class="chip" style="margin-top:12px;font-size:0.75rem">ATC: ${escapeHtml(atc)}</div>
                </div>
              </div>
            </div>
          `;
      })
      .join("")}
    </div>
  `;

  // Attach Listeners
  attachFilterListeners(view);

  const go = document.getElementById("btnGoCompare");
  if (go) {
    go.addEventListener("click", () => {
      const ids = store.getState().compare?.ids ?? [];
      location.hash = `# / compare ? ids = ${ encodeURIComponent(ids.join(",")) } `;
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
    });
  });
}

function renderFilters(filters) {
  const q = filters.q || "";
  const groups = [
    "ISRS", "Dual", "Tricíclico", "IMAO", "Atípico", "Modulador"
  ];
  const activeGroups = new Set(filters.grupo || []);

  const groupChips = groups.map(g => {
    const isActive = activeGroups.has(g);
    // Usamos data-group para el handler
    return `
    < button type = "button"
  class="chip ${isActive ? 'chip--active' : ''} filter-group-btn"
  data - group="${g}"
  style = "cursor:pointer; ${isActive ? 'background:var(--color-primary);color:white' : ''}" >
    ${ g }
      </button >
    `;
  }).join("");

  return `
    < div style = "display:flex; flex-direction:column; gap:16px;" >
      < !--Buscador -->
      <div class="field-box" style="padding:0; border:none;">
        <input type="search" id="inputSearch" class="input" placeholder="Buscar por nombre, mecanismo..." value="${escapeHtml(q)}" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid var(--color-border);" />
      </div>

      <!--Grupos -->
      <div>
        <div class="text-sm text-muted" style="margin-bottom:8px">Filtrar por Grupo:</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${groupChips}
        </div>
      </div>
      
      <!--Sedación(Slider simple) -->
    <div>
      <div class="text-sm text-muted" style="margin-bottom:8px">Nivel Sedación (0 - 3):</div>
      <div style="display:flex; align-items:center; gap:12px">
        <input type="range" id="rangeSedacion" min="0" max="3" step="1" value="${filters.sedacion?.max ?? 3}" style="flex:1" />
        <span id="lblSedacion">${filters.sedacion?.max ?? 3}</span>
      </div>
    </div>
    </div >
    `;
}

function attachFilterListeners(view) {
  // Search
  const inputSearch = view.querySelector("#inputSearch");
  if (inputSearch) {
    inputSearch.addEventListener("input", (e) => {
      store.updatePath("filters.q", e.target.value);
    });
  }

  // Groups
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

  // Sedacion
  const range = view.querySelector("#rangeSedacion");
  if (range) {
    range.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      document.getElementById("lblSedacion").textContent = val;
      // Filtramos de 0 a val
      store.updatePath("filters.sedacion", { min: 0, max: val });
    });
  }
}

/* ============================================================
   Detail (todavía hardcode; lo hacemos schema-driven después)
   ============================================================ */

/* renderDetail movido a ./ui/detailView.js */


/* ============================================================
   Compare (schema-driven opcional)
   ============================================================ */

function renderCompare(view) {
  const state = store.getState();
  // Usamos el selector para preparar datos del radar
  const { selectedItems: rows, radarData } = selectComparisonData(state);

  if (!rows.length) {
    view.innerHTML = `
    < h2 class="h2" > Comparador</h2 >
      <p class="text-muted">No hay fármacos seleccionados.</p>
      <p><a href="#/list" class="btn btn--primary">Volver a lista</a></p>
  `;
    return;
  }

  const chips = rows
    .map((d) => {
      const id = d.id_farmaco;
      const label = d?.nombre_generico ?? id;
      return `
    < button class="chip chip--removable chipRemove" data - id="${escapeHtml(id)}" type = "button" >
      ${ escapeHtml(label) } ✕
        </button >
    `;
    })
    .join("");

  // --- Radar Chart SVG ---
  const radarSVG = renderRadarChart(radarData);

  // --- Tabla ---
  // Definimos campos a mostrar. Podemos reusar getFieldSpecList si quisiéramos.
  // Aquí hardcodeamos los "Ejes Clínicos" + info básica
  const tableRows = [
    { label: "Clase", key: "clase_terapeutica" },
    { label: "Mecanismo", key: "mecanismo_principal" },
    { label: "Vida Media", key: "vida_media_parental" },
    { label: "Sedación", key: "nivel_sedacion", highlight: true },
    { label: "Peso", key: "perfil_impacto_peso", highlight: true },
    { label: "Sexual", key: "perfil_disfuncion_sexual", highlight: true },
    { label: "QT", key: "riesgo_prolongacion_qt", highlight: true },
    { label: "Abstinencia", key: "riesgo_sindrome_abstinencia", highlight: true }
  ];

  view.innerHTML = `
    < div style = "display:flex;align-items:center;justify-content:space-between;margin-bottom:16px" >
      <h2 class="h2" style="margin:0">Comparador</h2>
      <a href="#/list" class="btn btn--ghost text-sm">← Volver</a>
    </div >

    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px">
      ${chips}
    </div>

    <!--Layout: Radar a la izquierda(desktop) o arriba(mobile)-- >
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">

      <!-- Radar Card -->
      <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 24px;">
        <h3 class="h3" style="margin-bottom:16px">Perfil Clínico (Radar)</h3>
        ${radarSVG}
        <div class="text-xs text-muted" style="margin-top:12px; text-align:center">
          Comparación normalizada de efectos (Mayor área = Mayor intensidad/riesgo/impacto)
        </div>
      </div>

      <!-- Tabla Card -->
      <div class="card" style="overflow:hidden; padding:0;">
        <div class="compare-container" style="border:none; border-radius:0;">
          <table class="compare-table">
            <thead>
              <tr>
                <th style="min-width:120px">Rasgo</th>
                ${rows.map(d => `<th>${escapeHtml(d.nombre_generico)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableRows.map(tr => `
                <tr>
                  <td style="font-weight:600; color:var(--color-text-muted)">${tr.label}</td>
                  ${rows.map(d => `<td class="${tr.highlight ? 'text-sm' : ''}">${escapeHtml(d[tr.key] ?? "-")}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  // Handlers
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
  // data: [{ name, scores: {sedacion:0..1, ...} }, ...]
  const size = 300;
  const c = size / 2;
  const r = 100;
  const axes = ["sedacion", "peso", "sexual", "qt", "activacion", "abstinencia"];
  const labels = ["Sedación", "Peso", "Sexual", "QT", "Activación", "Abstinencia"];

  // Colors
  const colors = ["#0f766e", "#e11d48", "#2563eb", "#d97706", "#7c3aed"];

  // Grid
  const levels = [0.25, 0.5, 0.75, 1];
  const gridSVG = levels.map(l => {
    const pts = axes.map((_, i) => {
      const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const rad = r * l;
      return `${ c + rad * Math.cos(ang) },${ c + rad * Math.sin(ang) } `;
    }).join(" ");
    return `< polygon points = "${pts}" fill = "none" stroke = "var(--color-border)" stroke - width="1" /> `;
  }).join("");

  // Axes lines
  const axesSVG = axes.map((_, i) => {
    const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const x = c + r * Math.cos(ang);
    const y = c + r * Math.sin(ang);
    return `< line x1 = "${c}" y1 = "${c}" x2 = "${x}" y2 = "${y}" stroke = "var(--color-border)" stroke - width="1" /> `;
  }).join("");

  // Labels
  const labelsSVG = labels.map((lbl, i) => {
    const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const dist = r + 20;
    const x = c + dist * Math.cos(ang);
    const y = c + dist * Math.sin(ang);
    return `< text x = "${x}" y = "${y}" text - anchor="middle" dominant - baseline="middle" font - size="10" fill = "var(--color-text-muted)" > ${ lbl }</text > `;
  }).join("");

  // Polygons
  const polys = data.map((item, idx) => {
    const color = colors[idx % colors.length];
    const pts = axes.map((key, i) => {
      const val = item.scores[key] ?? 0; // 0..1
      const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const rad = r * val; // scale 0..1 to radius
      return `${ c + rad * Math.cos(ang) },${ c + rad * Math.sin(ang) } `;
    }).join(" ");
    return `
    < polygon points = "${pts}" fill = "${color}" fill - opacity="0.2" stroke = "${color}" stroke - width="2" />
      <g>
        ${axes.map((key, i) => {
          const val = item.scores[key] ?? 0;
          const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
          const rad = r * val;
          const px = c + rad * Math.cos(ang);
          const py = c + rad * Math.sin(ang);
          return `<circle cx="${px}" cy="${py}" r="3" fill="${color}" />`;
        }).join("")}
      </g>
  `;
  }).join("");

  // Leyenda
  const legend = `
    < div style = "display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-top:12px;" >
      ${
        data.map((d, i) => `
         <div style="display:flex; align-items:center; gap:6px; font-size:12px;">
           <span style="display:inline-block; width:10px; height:10px; background:${colors[i % colors.length]}; border-radius:50%;"></span>
           <span>${escapeHtml(d.name)}</span>
         </div>
      `).join("")
  }
    </div >
    `;

  return `
    < svg width = "${size}" height = "${size}" viewBox = "0 0 ${size} ${size}" >
      ${ gridSVG }
       ${ axesSVG }
       ${ polys }
       ${ labelsSVG }
    </svg >
    ${ legend }
  `;
}

/* ============================================================
   Helpers
   ============================================================ */

function field(label, value) {
  return `
    < div class="field-box" >
      <div class="field-box__label">${escapeHtml(label)}</div>
      <div class="field-box__value">${escapeHtml(value ?? "N/D")}</div>
    </div >
    `;
}

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

