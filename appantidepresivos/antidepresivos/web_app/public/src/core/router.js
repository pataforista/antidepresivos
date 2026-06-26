/* ============================================================
   src/core/router.js
   History API Router (URLs reales) + Sync compare.ids (URL <-> Store)
   Rutas:
     /                       -> list (home)
     /farmaco/:id            -> detail
     /comparador?ids=a,b,c   -> compare
     /switching              -> switching
     /ajuste                 -> ajuste
     /interacciones          -> interact
     /quiz                   -> quiz
     /combinaciones          -> combo
     /guias                  -> guias

   Incluye un shim que migra enlaces antiguos basados en hash
   (p.ej. /#/compare?ids=a,b) a las nuevas URLs reales, para no
   romper marcadores ni enlaces ya compartidos.
   ============================================================ */

export function createRouter(store, opts = {}) {
  const options = {
    defaultPath: "/",
    maxCompareDesktop: opts.maxCompareDesktop ?? 4,
    maxCompareMobile: opts.maxCompareMobile ?? 2,
  };

  // Tabla canónica nombre <-> path (detail se trata aparte por el :id)
  const NAME_TO_PATH = {
    list: "/",
    compare: "/comparador",
    switching: "/switching",
    ajuste: "/ajuste",
    interact: "/interacciones",
    quiz: "/quiz",
    combo: "/combinaciones",
    guias: "/guias",
  };
  const HEAD_TO_NAME = {
    comparador: "compare",
    switching: "switching",
    ajuste: "ajuste",
    interacciones: "interact",
    quiz: "quiz",
    combinaciones: "combo",
    guias: "guias",
  };

  let started = false;
  let internalWrite = false;   // evita loops history->store->history
  let internalStoreWrite = false;

  function start() {
    if (started) return;
    started = true;

    // 0) Migrar enlaces legacy basados en hash (#/...) a URLs reales
    migrateLegacyHash();

    // 1) Primer parse al arrancar
    handleLocationChange({ reason: "router:init" });

    // 2) Listener popstate (atrás/adelante del navegador)
    window.addEventListener("popstate", () => handleLocationChange({ reason: "router:popstate" }));

    // 3) Sync store -> URL para compare.ids
    store.subscribe("state:path:compare", ({ next }) => {
      if (internalWrite) return;
      const route = store.getState().route;
      if (!route || route.name !== "compare") return;

      const ids = normalizeIds(next?.ids ?? []);
      const current = parseLocation();
      const urlIds = normalizeIds(current.query?.ids ?? []);
      if (sameArray(ids, urlIds)) return;

      internalWrite = true;
      try {
        const nextUrl = buildPath({
          name: "compare",
          params: {},
          query: { ...current.query, ids: ids.join(",") },
        });
        replaceUrl(nextUrl);
      } finally {
        queueMicrotask(() => { internalWrite = false; });
      }
    });
  }

  function navigate(to) {
    const url = typeof to === "string" ? normalizePath(to) : buildPath(to);
    pushUrl(url);
    handleLocationChange({ reason: "router:navigate" });
  }

  function replace(to) {
    const url = typeof to === "string" ? normalizePath(to) : buildPath(to);
    replaceUrl(url);
    handleLocationChange({ reason: "router:replace" });
  }

  function getCurrentRoute() {
    return store.getState().route;
  }

  /* =========================
     Core handlers
     ========================= */

  function handleLocationChange(meta = {}) {
    if (internalWrite) return;

    const parsed = parseLocation();
    const fixed = coerceRoute(parsed);

    // Canonicaliza la URL si difiere de la forma esperada
    const canonical = buildPath(fixed);
    if (currentUrl() !== canonical) {
      internalWrite = true;
      try {
        replaceUrl(canonical);
      } finally {
        queueMicrotask(() => { internalWrite = false; });
      }
    }

    // 1) Actualiza route en store
    internalStoreWrite = true;
    try {
      store.patch(
        { route: { ...fixed, path: canonical } },
        { ...meta, reason: meta.reason ?? "router:setRoute" }
      );
    } finally {
      queueMicrotask(() => { internalStoreWrite = false; });
    }

    // 2) Sync URL -> store.compare.ids si estamos en compare
    if (fixed.name === "compare") {
      const ids = normalizeIds(fixed.query?.ids ?? []);
      const currentIds = normalizeIds(store.getState().compare?.ids ?? []);

      if (!sameArray(ids, currentIds)) {
        internalStoreWrite = true;
        try {
          store.setCompareIds(ids, { ...meta, reason: "router:url->store:compareIds" });
        } finally {
          queueMicrotask(() => { internalStoreWrite = false; });
        }
      }
    }
  }

  /* =========================
     Parsing / Building
     ========================= */

  function parseLocation() {
    const pathname = location.pathname || "/";
    const segs = pathname.split("/").filter(Boolean); // [] | ["comparador"] | ["farmaco","sertralina"]
    const head = segs[0] || "";

    let name = "list";
    let params = {};

    if (!head) {
      name = "list";
    } else if (head === "farmaco") {
      name = "detail";
      params = { id: segs[1] ? decodeURIComponent(segs[1]) : "" };
    } else if (HEAD_TO_NAME[head]) {
      name = HEAD_TO_NAME[head];
    } else {
      name = "unknown";
    }

    const query = parseQuery((location.search || "").replace(/^\?/, ""));
    return { path: currentUrl(), name, params, query };
  }

  function buildPath(route) {
    const name = route?.name ?? "list";
    const q = route?.query ?? {};
    let path;

    if (name === "detail") {
      const id = route?.params?.id ? encodeURIComponent(String(route.params.id)) : "";
      path = `/farmaco/${id}`;
    } else {
      path = NAME_TO_PATH[name] ?? options.defaultPath;
    }

    const qs = buildQuery(q);
    return qs ? `${path}?${qs}` : path;
  }

  function coerceRoute(route) {
    if (!route || route.name === "unknown") {
      return { name: "list", params: {}, query: {}, path: options.defaultPath };
    }

    if (route.name === "detail") {
      const id = (route.params?.id ?? "").trim();
      if (!id) return { name: "list", params: {}, query: {}, path: options.defaultPath };
      return { ...route, params: { id }, query: route.query ?? {} };
    }

    if (route.name === "compare") {
      const ids = normalizeIds(route.query?.ids ?? []);
      return {
        ...route,
        params: {},
        query: { ...route.query, ids: ids.join(",") },
      };
    }

    if (["list", "switching", "ajuste", "interact", "quiz", "combo", "guias"].includes(route.name)) {
      return { ...route, params: {}, query: route.query ?? {} };
    }

    return { name: "list", params: {}, query: {}, path: options.defaultPath };
  }

  /* =========================
     Legacy hash migration (#/...) -> URLs reales
     ========================= */

  function migrateLegacyHash() {
    const h = location.hash || "";
    if (!h.startsWith("#/")) return;

    const raw = h.slice(2); // quita "#/"
    const [pathPart, queryPart] = raw.split("?");
    const segs = (pathPart || "").split("/").filter(Boolean);
    const head = segs[0] || "list";

    let route;
    if (head === "detail") {
      route = { name: "detail", params: { id: segs[1] ? decodeURIComponent(segs[1]) : "" }, query: {} };
    } else if (head === "compare") {
      route = { name: "compare", params: {}, query: parseQuery(queryPart || "") };
    } else {
      route = { name: mapLegacyHead(head), params: {}, query: parseQuery(queryPart || "") };
    }

    const url = buildPath(coerceRoute(route));
    history.replaceState(null, "", url); // limpia el #/ y deja la URL real
  }

  // Mapea los nombres antiguos del hash a los nombres de ruta internos
  function mapLegacyHead(head) {
    const legacy = {
      list: "list",
      switching: "switching",
      ajuste: "ajuste",
      interact: "interact",
      quiz: "quiz",
      combo: "combo",
      guias: "guias",
    };
    return legacy[head] ?? "list";
  }

  /* =========================
     History writers
     ========================= */

  function currentUrl() {
    return `${location.pathname}${location.search}`;
  }

  function pushUrl(url) {
    const target = normalizePath(url);
    if (currentUrl() === target) return;
    history.pushState(null, "", target);
  }

  function replaceUrl(url) {
    history.replaceState(null, "", normalizePath(url));
  }

  function normalizePath(url) {
    if (!url) return options.defaultPath;
    let u = String(url).trim();
    // Tolera formatos legacy "#/list" o "/#/list"
    if (u.startsWith("/#/")) u = u.slice(2);
    if (u.startsWith("#/")) u = u.slice(1);
    if (!u.startsWith("/")) u = "/" + u;
    return u;
  }

  /* =========================
     Query helpers
     ========================= */

  function parseQuery(qs) {
    const out = {};
    const s = (qs || "").trim();
    if (!s) return out;

    for (const part of s.split("&")) {
      if (!part) continue;
      const [k, v] = part.split("=");
      const key = decodeURIComponent(k || "").trim();
      if (!key) continue;
      const val = decodeURIComponent(v ?? "").trim();
      out[key] = val;
    }
    return out;
  }

  function buildQuery(obj) {
    const entries = Object.entries(obj || {})
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");

    if (entries.length === 0) return "";

    return entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
  }

  /* =========================
     Compare ids helpers
     ========================= */

  function normalizeIds(ids) {
    const arr = Array.isArray(ids) ? ids : String(ids ?? "").split(",");
    const clean = arr.map(s => String(s).trim()).filter(Boolean);

    const seen = new Set();
    const out = [];
    for (const id of clean) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }

  function sameArray(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  return {
    start,
    navigate,
    replace,
    parseLocation,
    buildPath,
    getCurrentRoute,
  };
}
