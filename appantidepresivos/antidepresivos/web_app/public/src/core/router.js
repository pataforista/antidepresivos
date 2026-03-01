/* ============================================================
   src/core/router.js
   Hash Router + Sync compare.ids (URL <-> Store)
   Rutas:
     /#/list
     /#/detail/:id
     /#/compare?ids=a,b,c
   ============================================================ */

export function createRouter(store, opts = {}) {
  const options = {
    defaultRoute: "/#/list",
    maxCompareDesktop: opts.maxCompareDesktop ?? 4,
    maxCompareMobile: opts.maxCompareMobile ?? 2,
    // Si quieres limitar siempre a maxMobile en móvil, se hace en UI;
    // aquí solo sanitizamos y quitamos duplicados.
  };

  let started = false;
  let internalHashWrite = false;  // evita loops store->hash->store
  let internalStoreWrite = false; // evita loops hash->store->hash

  function start() {
    if (started) return;
    started = true;

    // 1) Primer parse al arrancar
    handleHashChange({ reason: "router:init" });

    // 2) Listener hashchange
    window.addEventListener("hashchange", () => handleHashChange({ reason: "router:hashchange" }));

    // 3) Sync store -> URL para compare.ids
    store.subscribe("state:path:compare", ({ next }, meta) => {
      if (internalStoreWrite) return;
      const route = store.getState().route;
      if (!route || route.name !== "compare") return;

      const ids = normalizeIds(next?.ids ?? []);
      // Escribe al hash solo si realmente difiere
      const current = parseHash(location.hash);
      const urlIds = normalizeIds(current.query?.ids ?? []);
      if (sameArray(ids, urlIds)) return;

      internalHashWrite = true;
      try {
        const nextHash = buildHash({
          name: "compare",
          params: {},
          query: { ...current.query, ids: ids.join(",") },
        });
        replaceHash(nextHash);
      } finally {
        // microtask para dejar que termine el ciclo del navegador
        queueMicrotask(() => { internalHashWrite = false; });
      }
    });
  }

  function navigate(to, meta = {}) {
    // to puede ser string "#/list" o objeto route
    const hash = typeof to === "string" ? normalizeHash(to) : buildHash(to);
    writeHash(hash, meta);
  }

  function replace(to, meta = {}) {
    const hash = typeof to === "string" ? normalizeHash(to) : buildHash(to);
    replaceHash(hash, meta);
  }

  function getCurrentRoute() {
    return store.getState().route;
  }

  /* =========================
     Core handlers
     ========================= */

  function handleHashChange(meta = {}) {
    if (internalHashWrite) return;

    const parsed = parseHash(location.hash);
    const fixed = coerceRoute(parsed);

    // Si el hash es inválido o incompleto, lo corregimos a una forma canónica
    const canonical = buildHash(fixed);
    if (normalizeHash(location.hash) !== canonical) {
      internalHashWrite = true;
      try {
        replaceHash(canonical);
      } finally {
        queueMicrotask(() => { internalHashWrite = false; });
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

  function parseHash(hash) {
    const h = normalizeHash(hash);
    // h siempre tipo "/#/something"
    const raw = h.slice(2); // quita "/#"
    // raw empieza con "/"
    const [pathPart, queryPart] = raw.split("?");
    const path = pathPart || "/list";

    const segs = path.split("/").filter(Boolean); // ["list"] etc.
    const head = segs[0] || "list";

    let name = "list";
    let params = {};
    if (head === "list") name = "list";
    else if (head === "detail") {
      name = "detail";
      params = { id: segs[1] ? decodeURIComponent(segs[1]) : "" };
    } else if (head === "compare") {
      name = "compare";
    } else if (head === "switching") {
      name = "switching";
    } else if (head === "ajuste") {
      name = "ajuste";
    } else if (head === "interact") {
      name = "interact";
    } else if (head === "quiz") {
      name = "quiz";
    } else {
      name = "unknown";
    }

    const query = parseQuery(queryPart || "");
    return {
      path: h,
      name,
      params,
      query,
    };
  }

  function buildHash(route) {
    const name = route?.name ?? "list";
    const q = route?.query ?? {};
    let path = "/#/list";

    if (name === "list") path = "/#/list";
    else if (name === "detail") {
      const id = route?.params?.id ? encodeURIComponent(String(route.params.id)) : "";
      path = `/#/detail/${id}`;
    } else if (name === "compare") {
      path = "/#/compare";
    } else if (name === "switching") {
      path = "/#/switching";
    } else if (name === "ajuste") {
      path = "/#/ajuste";
    } else if (name === "interact") {
      path = "/#/interact";
    } else if (name === "quiz") {
      path = "/#/quiz";
    } else {
      path = options.defaultRoute;
    }

    const qs = buildQuery(q);
    return qs ? `${path}?${qs}` : path;
  }

  function coerceRoute(route) {
    // Normaliza rutas inválidas a algo usable
    if (!route || route.name === "unknown") {
      return { name: "list", params: {}, query: {}, path: options.defaultRoute };
    }

    if (route.name === "detail") {
      const id = (route.params?.id ?? "").trim();
      if (!id) return { name: "list", params: {}, query: {}, path: options.defaultRoute };
      return { ...route, params: { id }, query: route.query ?? {} };
    }

    if (route.name === "compare") {
      const ids = normalizeIds(route.query?.ids ?? []);
      // Canon: siempre guardamos ids en query como string
      return {
        ...route,
        params: {},
        query: { ...route.query, ids: ids.join(",") },
      };
    }

    // list, switching, ajuste, interact, quiz
    if (["list", "switching", "ajuste", "interact", "quiz"].includes(route.name)) {
      return { ...route, params: {}, query: route.query ?? {} };
    }

    return { name: "list", params: {}, query: {}, path: options.defaultRoute };
  }

  /* =========================
     Hash writers
     ========================= */

  function writeHash(hash) {
    location.hash = hash.startsWith("/#/") ? hash.slice(2) : hash; // permite "#/list" también
  }

  function replaceHash(hash) {
    const h = hash.startsWith("/#/") ? hash : normalizeHash(hash);
    const url = `${location.pathname}${location.search}#${h.slice(2)}`; // "#/list"
    history.replaceState(null, "", url);
  }

  function normalizeHash(hash) {
    // Acepta "#/list", "/#/list", "", etc. Devuelve siempre "/#/list..."
    if (!hash) return options.defaultRoute;
    let h = String(hash).trim();

    // location.hash viene como "#/list"
    if (h.startsWith("#")) h = "/#" + h.slice(1);
    if (!h.startsWith("/#/")) return options.defaultRoute;

    // si es solo "/#/" => list
    if (h === "/#/") return options.defaultRoute;

    return h;
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
    parseHash,
    buildHash,
    getCurrentRoute,
  };
}
