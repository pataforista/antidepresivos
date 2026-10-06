/* ============================================================
   src/core/pubsub.js
   Pub/Sub ligero pero serio:
   - on/off/once/emit
   - wildcard "*" y prefijo "state:" etc.
   - prioridad (mayor primero)
   - safe emit (no rompe si un handler truena)
   ============================================================ */

export function createPubSub() {
  /** @type {Map<string, Set<{fn:Function, once:boolean, prio:number}>>} */
  const map = new Map();

  function on(event, fn, opts = {}) {
    if (!event || typeof fn !== "function") throw new Error("pubsub.on requiere (event, fn)");
    const entry = { fn, once: !!opts.once, prio: Number(opts.priority ?? 0) };

    if (!map.has(event)) map.set(event, new Set());
    map.get(event).add(entry);

    // retorna unsubscribe
    return () => off(event, fn);
  }

  function once(event, fn, opts = {}) {
    return on(event, fn, { ...opts, once: true });
  }

  function off(event, fn) {
    const set = map.get(event);
    if (!set) return false;

    let removed = false;
    for (const entry of set) {
      if (entry.fn === fn) {
        set.delete(entry);
        removed = true;
      }
    }
    if (set.size === 0) map.delete(event);
    return removed;
  }

  function emit(event, payload, meta = {}) {
    // 1) handlers exactos
    const exact = collect(map.get(event));
    // 2) wildcard global
    const star = collect(map.get("*"));
    // 3) prefijo: "state:*" (si emites "state:changed", dispara "state:*")
    const prefixStar = collect(map.get(prefixWildcard(event)));

    const all = [...exact, ...prefixStar, ...star]
      .sort((a, b) => (b.prio - a.prio));

    if (all.length === 0) return 0;

    let called = 0;
    for (const entry of all) {
      try {
        entry.fn(payload, { event, ...meta });
        called++;
      } catch (err) {
        // Nunca romper por un listener
        console.error(`[pubsub] handler error on "${event}"`, err);
      } finally {
        if (entry.once) off(event, entry.fn);
      }
    }
    return called;
  }

  function collect(set) {
    if (!set) return [];
    return Array.from(set.values());
  }

  function prefixWildcard(event) {
    const idx = event.indexOf(":");
    if (idx === -1) return "";
    return event.slice(0, idx + 1) + "*";
  }

  return { on, once, off, emit };
}
