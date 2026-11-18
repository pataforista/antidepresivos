/* Selector de herramientas del sistema "humano" (PLAN_COHERENCIA_ECOSISTEMA.md, E1–E2).
   Un solo archivo para las siete apps: no depende de código de ninguna. Uso:
     <script src="/shared/shell/shell.js" data-app="antipsicoticos" defer></script>
   Dibuja un botón «Herramientas» en #humano-shell-slot (o al final de la primera <header>).
   La lista sale de apps.json. La app actual se marca con aria-current="page". */
(function () {
  "use strict";
  const script = document.currentScript;
  const current = (script && script.dataset.app) || "";
  const SRC = (script && script.src) ? script.src.replace(/shell\.js(\?.*)?$/, "") : "./";

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';

  function build(data) {
    const root = document.createElement("div");
    root.className = "hs";
    const panelId = "hs-panel";
    root.innerHTML =
      '<button type="button" class="hs-toggle" aria-expanded="false" aria-controls="' + panelId + '">' +
      ICON + '<span>Herramientas</span></button>' +
      '<div class="hs-panel" id="' + panelId + '" hidden>' +
      Object.keys(data.tareas).map(function (task) {
        const items = data.apps.filter(function (a) { return a.task === task; });
        if (!items.length) return "";
        return '<section class="hs-group"><h2 class="hs-group__title">' + data.tareas[task] + '</h2><ul class="hs-list">' +
          items.map(function (a) {
            const isCurrent = a.id === current;
            return '<li><a class="hs-link" href="' + data.base + a.path + '"' +
              (isCurrent ? ' aria-current="page"' : '') + '>' +
              '<span class="hs-link__name">' + a.name + '</span>' +
              '<span class="hs-link__desc">' + a.desc + '</span></a></li>';
          }).join("") + '</ul></section>';
      }).join("") + '</div>';

    const toggle = root.querySelector(".hs-toggle");
    const panel = root.querySelector(".hs-panel");
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    }
    toggle.addEventListener("click", function () { setOpen(panel.hidden); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!root.contains(e.target) && !panel.hidden) setOpen(false);
    });
    return root;
  }

  function mount(root) {
    const slot = document.getElementById("humano-shell-slot");
    if (slot) { slot.appendChild(root); return; }
    const header = document.querySelector("header");
    if (header) header.appendChild(root);
  }

  fetch(SRC + "apps.json", { cache: "force-cache" })
    .then(function (r) { if (!r.ok) throw new Error("apps.json " + r.status); return r.json(); })
    .then(function (data) { mount(build(data)); })
    .catch(function (err) { console.warn("Selector de herramientas no disponible:", err.message); });
})();
