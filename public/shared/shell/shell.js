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
    // En móvil el panel ocupa el ancho de la ventana. «position: fixed» se mide desde la
    // ventana salvo que un ancestro tenga filter, transform o backdrop-filter (p. ej. una
    // cabecera de vidrio): entonces se mide desde ese ancestro y el panel queda fuera de
    // sitio. Se mide el origen real y se compensa, así funciona con cualquier cabecera.
    function place() {
      if (panel.hidden) return;
      const narrow = window.matchMedia("(max-width: 480px)").matches;
      ["top", "left", "width", "maxHeight"].forEach(function (k) { panel.style[k] = ""; });
      if (!narrow) return;
      panel.style.top = "0px"; panel.style.left = "0px";
      const origin = panel.getBoundingClientRect();
      const top = Math.round(toggle.getBoundingClientRect().bottom + 8);
      panel.style.top = (top - origin.top) + "px";
      panel.style.left = (12 - origin.left) + "px";
      panel.style.width = (window.innerWidth - 24) + "px";
      panel.style.maxHeight = Math.max(160, window.innerHeight - top - 12) + "px";
    }
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      if (open) place();
    }
    window.addEventListener("resize", place);
    toggle.addEventListener("click", function () { setOpen(panel.hidden); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!root.contains(e.target) && !panel.hidden) setOpen(false);
    });
    return root;
  }

  // Monta cuando exista el punto de montaje: la cabecera de algunas apps la pinta JavaScript.
  function mount(root) {
    function find() {
      return document.getElementById("humano-shell-slot") || document.querySelector("header");
    }
    function place(target) { target.appendChild(root); }
    const now = find();
    if (now) { place(now); return; }
    const obs = new MutationObserver(function () {
      const target = find();
      if (target) { obs.disconnect(); place(target); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 15000);
  }

  fetch(SRC + "apps.json", { cache: "force-cache" })
    .then(function (r) { if (!r.ok) throw new Error("apps.json " + r.status); return r.json(); })
    .then(function (data) { mount(build(data)); })
    .catch(function (err) { console.warn("Selector de herramientas no disponible:", err.message); });
})();
