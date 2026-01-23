// public/src/app.js

import { store } from "./core/store.js";
import { loadAppData } from "./core/dataLoader.js";
import { mountDisclaimerGate } from "./ui/gatekeeperDisclaimer.js";
import { createRouter } from "./core/router.js";
import * as policy from "./core/policy.js";

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
    location.hash = `#/compare?ids=${encodeURIComponent(ids.join(","))}`;
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
    root.innerHTML = `<pre style="padding:12px;color:#b00">${escapeHtml(
      String(e?.stack ?? e)
    )}</pre>`;
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
    <div id="appShell" style="font-family:system-ui">
      <header style="padding:12px;border-bottom:1px solid rgba(0,0,0,.15);display:flex;align-items:center;gap:12px">
        <strong>${escapeHtml(title)}</strong>

        <nav style="margin-left:auto;display:flex;gap:10px;align-items:center">
          <a href="#/list">Lista</a>
          <a href="#/compare" id="btnHeaderCompare">Comparar</a>
          <button id="btnClearCompare" type="button" style="padding:6px 10px;cursor:pointer">
            Limpiar
          </button>
          <span id="compareCount" style="opacity:.75;font-size:12px"></span>
        </nav>
      </header>

      <main id="appView" style="padding:12px"></main>

      <footer style="padding:12px;border-top:1px solid rgba(0,0,0,.15);opacity:.7;font-size:12px">
        Disclaimer (policy): <b>${policy.isDisclaimerSatisfied() ? "Sí" : "No"}</b>
      </footer>
    </div>
  `;
}

function updateCompareCount() {
  const el = document.getElementById("compareCount");
  if (!el) return;
  const ids = store.getState().compare?.ids ?? [];
  el.textContent = ids.length ? `Seleccionados: ${ids.length}` : "";
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
  const items = state.data?.dataset?.items ?? [];
  const selected = new Set(state.compare?.ids ?? []);

  view.innerHTML = `
    <h2 style="margin:0 0 8px">Listado</h2>
    <p style="margin:0 0 12px;opacity:.8">Fármacos cargados: <b>${items.length}</b></p>

    <div style="display:flex;gap:10px;align-items:center;margin:0 0 12px">
      <button id="btnGoCompare" type="button" style="padding:8px 10px;cursor:pointer">
        Ir a comparar
      </button>
      <span style="opacity:.75;font-size:12px">
        Selecciona con checkbox. En /compare el URL se sincroniza con store.compare.ids.
      </span>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px">
      ${items
        .map((d) => {
          const id = String(d.id_farmaco);
          const name = d.nombre_generico ?? id;
          const atc = d.codigo_atc ?? "N/D";
          const cls = d.clase_terapeutica ?? "";
          const isOn = selected.has(id);

          return `
            <div style="border:1px solid rgba(0,0,0,.15);border-radius:10px;padding:10px;display:flex;gap:10px;align-items:flex-start">
              <input type="checkbox" class="chkCompare" data-id="${escapeHtml(id)}" ${isOn ? "checked" : ""} style="margin-top:4px" />
              <div style="flex:1">
                <a href="#/detail/${encodeURIComponent(id)}" style="text-decoration:none;display:block">
                  <div style="font-weight:700">${escapeHtml(name)}</div>
                </a>
                <div style="opacity:.8">${escapeHtml(cls)}</div>
                <div style="opacity:.7;font-size:12px;margin-top:6px">ATC: ${escapeHtml(atc)}</div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  const go = document.getElementById("btnGoCompare");
  if (go) {
    go.addEventListener("click", () => {
      const ids = store.getState().compare?.ids ?? [];
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
      // contador y rerender en compare ya lo maneja el subscriber global
    });
  });
}

/* ============================================================
   Detail (todavía hardcode; lo hacemos schema-driven después)
   ============================================================ */

function renderDetail(view, id) {
  const state = store.getState();
  const items = state.data?.dataset?.items ?? [];
  const item = items.find((d) => String(d.id_farmaco) === String(id));

  if (!item) {
    view.innerHTML = `
      <p>No encontrado: <code>${escapeHtml(id)}</code></p>
      <p><a href="#/list">Volver</a></p>
    `;
    return;
  }

  view.innerHTML = `
    <p style="margin:0 0 10px"><a href="#/list">← Volver</a></p>

    <h2 style="margin:0 0 6px">${escapeHtml(item.nombre_generico ?? item.id_farmaco)}</h2>
    <div style="opacity:.8;margin-bottom:12px">${escapeHtml(item.clase_terapeutica ?? "")}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${field("ID", item.id_farmaco)}
      ${field("ATC", item.codigo_atc)}
      ${field("Mecanismo", item.mecanismo_principal)}
      ${field("t_max", item.t_max)}
      ${field("Vida media", item.vida_media_parental)}
      ${field("Sedación (0–3)", item.nivel_sedacion)}
      ${field("Activación", item.perfil_activacion)}
      ${field("Peso", item.perfil_impacto_peso)}
      ${field("Disfunción sexual", item.perfil_disfuncion_sexual)}
      ${field("Abstinencia", item.riesgo_sindrome_abstinencia)}
      ${field("QT", item.riesgo_prolongacion_qt)}
      ${field("Interacciones contraindicadas", item.interacciones_contraindicadas)}
    </div>

    <div style="margin-top:14px;display:flex;gap:10px;align-items:center">
      <button id="btnAddToCompare" type="button" style="padding:8px 10px;cursor:pointer">
        Añadir a comparar
      </button>
      <a href="#/compare?ids=${encodeURIComponent((store.getState().compare?.ids ?? []).join(","))}">Ir a /compare</a>
    </div>
  `;

  const btn = document.getElementById("btnAddToCompare");
  if (btn) {
    btn.addEventListener("click", () => {
      const curr = store.getState().compare?.ids ?? [];
      const set = new Set(curr);
      set.add(String(item.id_farmaco));
      store.setCompareIds([...set], { reason: "ui:detailAddCompare" });
      location.hash = `#/compare?ids=${encodeURIComponent([...set].join(","))}`;
    });
  }
}

/* ============================================================
   Compare (schema-driven opcional)
   ============================================================ */

function renderCompare(view) {
  const state = store.getState();
  const items = state.data?.dataset?.items ?? [];
  const ids = state.compare?.ids ?? [];

  const rows = ids
    .map((id) => items.find((d) => String(d.id_farmaco) === String(id)))
    .filter(Boolean);

  if (!rows.length) {
    view.innerHTML = `
      <h2 style="margin:0 0 8px">Comparador</h2>
      <p style="opacity:.8">No hay fármacos seleccionados.</p>
      <p><a href="#/list">Volver a lista</a></p>
    `;
    return;
  }

  const chips = ids
    .map((id) => {
      const d = items.find((x) => String(x.id_farmaco) === String(id));
      const label = d?.nombre_generico ?? id;
      return `
        <button class="chipRemove" data-id="${escapeHtml(id)}" type="button"
          style="padding:6px 10px;border:1px solid rgba(0,0,0,.15);border-radius:999px;cursor:pointer">
          ${escapeHtml(label)} ✕
        </button>
      `;
    })
    .join("");

  const fallbackFields = [
    ["clase_terapeutica", "Clase"],
    ["mecanismo_principal", "Mecanismo"],
    ["codigo_atc", "ATC"],
    ["t_max", "t_max"],
    ["vida_media_parental", "Vida media"],
    ["nivel_sedacion", "Sedación (0–3)"],
    ["perfil_activacion", "Activación"],
    ["perfil_impacto_peso", "Peso"],
    ["perfil_disfuncion_sexual", "Disfunción sexual"],
    ["riesgo_sindrome_abstinencia", "Abstinencia"],
    ["riesgo_prolongacion_qt", "QT"],
    ["interacciones_contraindicadas", "Interacciones CI"],
  ].map(([id, label]) => ({ id, label }));

  const fieldSpecs = getFieldSpecList("compare.fields", fallbackFields);

  view.innerHTML = `
    <h2 style="margin:0 0 8px">Comparador</h2>
    <p style="opacity:.8;margin:0 0 12px">Seleccionados: <b>${rows.length}</b></p>

    <div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px">
      ${chips}
    </div>

    <div style="margin:0 0 12px;display:flex;gap:10px;align-items:center">
      <a href="#/list">← Volver a lista</a>
      <span style="opacity:.75;font-size:12px">Tip: desmarca en Lista o usa “Limpiar”.</span>
    </div>

    <div style="overflow:auto;border:1px solid rgba(0,0,0,.15);border-radius:10px">
      <table style="border-collapse:collapse;min-width:900px;width:100%">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.15)">Campo</th>
            ${rows
              .map(
                (d) => `
                  <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.15)">
                    ${escapeHtml(d.nombre_generico ?? d.id_farmaco)}
                                       <div style="opacity:.7;font-size:12px">
                      ${escapeHtml(d.codigo_atc ?? "")}
                    </div>
                  </th>
                `
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${fieldSpecs
            .map(
              (fs) => `
                <tr>
                  <td style="padding:10px;border-bottom:1px solid rgba(0,0,0,.08);opacity:.85">
                    <b>${escapeHtml(fs.label)}</b>
                  </td>
                  ${rows
                    .map(
                      (d) => `
                        <td style="padding:10px;border-bottom:1px solid rgba(0,0,0,.08)">
                          ${escapeHtml(d[fs.id] ?? "N/D")}
                        </td>
                      `
                    )
                    .join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  // Handlers: eliminar solo el fármaco clickeado
  view.querySelectorAll(".chipRemove").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      const id = ev.currentTarget.dataset.id;
      const next = (store.getState().compare?.ids ?? []).filter(
        (x) => String(x) !== String(id)
      );
      store.setCompareIds(next, { reason: "ui:compareRemove" });
      // NO tocar location.hash: el router se encarga
    });
  });
}

/* ============================================================
   Helpers
   ============================================================ */

function field(label, value) {
  return `
    <div style="border:1px solid rgba(0,0,0,.15);border-radius:10px;padding:10px">
      <div style="font-size:12px;opacity:.7">${escapeHtml(label)}</div>
      <div style="margin-top:4px">${escapeHtml(value ?? "N/D")}</div>
    </div>
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

