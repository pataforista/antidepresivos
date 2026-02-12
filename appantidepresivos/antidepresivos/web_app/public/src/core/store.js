/* ============================================================
   src/core/store.js
   Store central con Pub/Sub:
   - state inmutable superficial (copia top-level)
   - setState / patch / reset
   - persistencia localStorage con versionKey (manifest.dataset.hash)
   - helpers: selectors memo simples
   - eventos:
     - "state:changed" (siempre que cambie algo)
     - "state:path:<key>" (si cambia un top-level key)
     - "state:*" (prefijo wildcard)
   ============================================================ */

import { createPubSub } from "./pubsub.js";

export function createStore(initialState = {}, opts = {}) {
  const pubsub = createPubSub();

  const options = {
    storageKey: opts.storageKey ?? "pwa_store",
    // versionKey: algo como "datasetHash:schemaHash:legalHash" para invalidar persistencia
    versionKey: opts.versionKey ?? "v0",
    persistPaths: opts.persistPaths ?? ["ui", "compare", "filters", "legal"],
    debug: !!opts.debug
  };

  let state = deepFreezeDev(cloneShallow(initialState));

  // --- Persistencia: carga al iniciar ---
  const persisted = loadPersistedState(options);
  if (persisted) {
    state = deepFreezeDev(mergePersisted(state, persisted, options.persistPaths));
  }

  function getState() {
    return state;
  }

  /**
   * setState reemplaza el state completo (raramente usado).
   */
  function setState(nextState, meta = {}) {
    const prev = state;
    state = deepFreezeDev(cloneShallow(nextState));

    emitDiff(prev, state, meta);
    persistIfNeeded(state, options);
    return state;
  }

  /**
   * patch: mezcla top-level (o paths específicos) sin mutar el original.
   * Ej: patch({ filters: {...}, ui: {...} })
   */
  function patch(partial, meta = {}) {
    if (!partial || typeof partial !== "object") return state;

    const prev = state;
    const next = { ...state, ...partial };
    state = deepFreezeDev(next);

    emitDiff(prev, state, meta);
    persistIfNeeded(state, options);
    return state;
  }

  /**
   * updatePath: set por path tipo "ui.theme" o "filters.q"
   */
  function updatePath(path, value, meta = {}) {
    const prev = state;
    const next = setByPath(state, path, value);
    state = deepFreezeDev(next);

    emitDiff(prev, state, meta);
    persistIfNeeded(state, options);
    return state;
  }

  function reset(nextInitial = initialState, meta = {}) {
    const prev = state;
    state = deepFreezeDev(cloneShallow(nextInitial));

    emitDiff(prev, state, meta);
    persistIfNeeded(state, options, { force: true });
    return state;
  }

  // --- Subscriptions ---
  // Soporta:
  //   subscribe("state:changed", fn)
  //   subscribe(fn)  -> alias de "state:changed"
  function subscribe(eventOrFn, fnOrOpts, maybeOpts) {
    // subscribe(fn)
    if (typeof eventOrFn === "function") {
      const fn = eventOrFn;
      const opts = fnOrOpts; // aquí puede venir opts
      return pubsub.on("state:changed", fn, opts);
    }

    // subscribe(event, fn, opts)
    const event = eventOrFn;
    const fn = fnOrOpts;
    const opts = maybeOpts;
    return pubsub.on(event, fn, opts);
  }

  // Soporta:
  //   once("state:changed", fn)
  //   once(fn) -> alias de "state:changed"
  function once(eventOrFn, fnOrOpts, maybeOpts) {
    if (typeof eventOrFn === "function") {
      const fn = eventOrFn;
      const opts = fnOrOpts;
      return pubsub.once("state:changed", fn, opts);
    }

    const event = eventOrFn;
    const fn = fnOrOpts;
    const opts = maybeOpts;
    return pubsub.once(event, fn, opts);
  }

  // Soporta:
  //   unsubscribe("state:changed", fn)
  //   unsubscribe(fn) -> alias de "state:changed"
  function unsubscribe(eventOrFn, fn) {
    if (typeof eventOrFn === "function") {
      return pubsub.off("state:changed", eventOrFn);
    }
    return pubsub.off(eventOrFn, fn);
  }


  // --- Selectors (memo ultra simple por referencia) ---
  function createSelector(selectFn) {
    let lastIn = null;
    let lastOut = null;

    return function selector() {
      const s = state;
      if (s === lastIn) return lastOut;
      lastIn = s;
      lastOut = selectFn(s);
      return lastOut;
    };
  }

  // --- Helpers para compare (URL + localStorage) ---
  function setCompareIds(ids, meta = {}) {
    const clean = normalizeIds(ids);
    const compare = { ...(state.compare ?? {}), ids: clean };
    patch({ compare }, { ...meta, reason: meta.reason ?? "compare:setIds" });
  }

  function normalizeIds(ids) {
    const arr = Array.isArray(ids) ? ids : String(ids ?? "").split(",");
    const clean = arr
      .map(s => String(s).trim())
      .filter(Boolean);
    // unique preserve order
    const seen = new Set();
    const out = [];
    for (const id of clean) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }

  // --- Emit diffs top-level ---
  function emitDiff(prev, next, meta) {
    if (prev === next) return;

    // evento general
    pubsub.emit("state:changed", { prev, next }, meta);

    // top-level keys diffs
    const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
    for (const k of keys) {
      if (prev?.[k] !== next?.[k]) {
        pubsub.emit(`state:path:${k}`, { key: k, prev: prev?.[k], next: next?.[k] }, meta);
      }
    }

    // debug trace (opcional)
    if (options.debug) {
      console.log("[store] changed", meta);
    }
  }

  return {
    // core
    getState,
    setState,
    patch,
    updatePath,
    reset,

    // pubsub
    subscribe,
    once,
    unsubscribe,
    emit: pubsub.emit,

    // selectors
    createSelector,

    // compare helper
    setCompareIds
  };
}

/* =========================
   Persistencia
   ========================= */

function loadPersistedState(options) {
  const key = storageKey(options);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // versión incompatible: ignorar
    if (parsed?.__versionKey !== options.versionKey) return null;
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

function persistIfNeeded(state, options, extra = {}) {
  // guarda solo persistPaths
  const persist = pickPaths(state, options.persistPaths);
  const payload = {
    __versionKey: options.versionKey,
    savedAt: new Date().toISOString(),
    state: persist
  };

  try {
    localStorage.setItem(storageKey(options), JSON.stringify(payload));
  } catch (err) {
    if (extra.force) console.warn("[store] persist failed", err);
  }
}

function storageKey(options) {
  return `${options.storageKey}::${options.versionKey}`;
}

function pickPaths(state, paths) {
  const out = {};
  for (const p of paths) {
    if (state?.[p] !== undefined) out[p] = state[p];
  }
  return out;
}

function mergePersisted(state, persisted, persistPaths) {
  // solo rehidrata las llaves permitidas
  const out = { ...state };
  for (const p of persistPaths) {
    if (persisted?.[p] !== undefined) out[p] = persisted[p];
  }
  return out;
}

/* =========================
   Utils: paths + clones
   ========================= */

function setByPath(obj, path, value) {
  if (!path || typeof path !== "string") return obj;
  const parts = path.split(".");
  const root = cloneShallow(obj);

  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (i === parts.length - 1) {
      cur[key] = value;
    } else {
      const prev = cur[key];
      cur[key] = isPlainObject(prev) ? { ...prev } : {};
      cur = cur[key];
    }
  }
  return root;
}

function cloneShallow(o) {
  return isPlainObject(o) ? { ...o } : o;
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && (v.constructor === Object || Object.getPrototypeOf(v) === Object.prototype);
}

function deepFreezeDev(obj) {
  // en producción puedes apagar esto; aquí lo dejamos “suave”
  // congela top-level y 1 nivel para atrapar mutaciones tontas
  if (!isPlainObject(obj)) return obj;
  Object.freeze(obj);
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (isPlainObject(v) && !Object.isFrozen(v)) Object.freeze(v);
  }
  return obj;
}
// ============================================================
// Instancia única del store (singleton)
// ============================================================

export const store = createStore(
  {
    data: {
      manifest: null,
      schema: null,
      dataset: null,
      legal: null,
      glossary: null,
      criteria: null
    },
    ui: {
      theme: "light",
      disclaimerAccepted: false,
      toasts: []
    },
    filters: {
      q: "",
      grupo: [],
      sedacion: { min: 0, max: 3 },
      peso: null,
      sexual: null,
      qt: null,
      abstinencia: null,
      pediatria: null,
      bbb: null
    },
    compare: {
      ids: []
    },
    route: {
      path: "/#/list",
      name: "list",
      params: {},
      query: {}
    }
  },
  {
    storageKey: "pwa_antidep_2026",
    persistPaths: ["ui", "filters", "compare"],
    debug: false
  }
);

