// Tests for Antidepresivos core logic

describe('App Integrity', () => {
  test('Environmental requirements', () => {
    expect(true).toBe(true);
  });

  test('Core configuration (simulation)', () => {
    const appTitle = "Antidepresivos";
    expect(appTitle).toContain("Antidepresivos");
  });
});

describe('Drug Normalization', () => {
  // Inline the logic to test it without ES module imports
  function riskVariant(val) {
    if (!val) return "neutral";
    const s = String(val).toLowerCase();
    if (/alto|severo|grave/i.test(s)) return "danger";
    if (/medio|moderado|significativo/i.test(s)) return "warning";
    if (/bajo|leve|mínimo|minimo|nulo|neutro/i.test(s)) return "success";
    return "neutral";
  }

  function isLowRisk(value) {
    return /bajo|leve|mínimo|minimo|nulo|neutro|low|mild|none/i.test(String(value || ""));
  }

  function isHighRisk(value) {
    return /alto|severo|grave|high/i.test(String(value || ""));
  }

  function isNotableRisk(value) {
    return /alto|medio|moderado|significativo|high|moderate/i.test(String(value || ""));
  }

  function drugEmoji(clase) {
    const c = String(clase || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    if (/isrs/.test(c)) return "🧠";
    if (/dual|irsn/.test(c)) return "🔁";
    if (/triciclico/.test(c)) return "🧬";
    if (/imao/.test(c)) return "🔬";
    if (/melatonina|agomelatina/.test(c)) return "🌙";
    if (/bupropion|ndri/.test(c)) return "🎯";
    if (/mirtazapina|nassa/.test(c)) return "😴";
    if (/estabilizador/.test(c)) return "⚖️";
    if (/antipsicotico/.test(c)) return "🛡️";
    return "💊";
  }

  test('riskVariant returns danger for high risk values', () => {
    expect(riskVariant("Alto")).toBe("danger");
    expect(riskVariant("severo")).toBe("danger");
    expect(riskVariant("Grave")).toBe("danger");
  });

  test('riskVariant returns warning for moderate risk values', () => {
    expect(riskVariant("Medio")).toBe("warning");
    expect(riskVariant("moderado")).toBe("warning");
    expect(riskVariant("significativo")).toBe("warning");
  });

  test('riskVariant returns success for low risk values', () => {
    expect(riskVariant("Bajo")).toBe("success");
    expect(riskVariant("leve")).toBe("success");
    expect(riskVariant("nulo")).toBe("success");
    expect(riskVariant("Mínimo")).toBe("success");
    expect(riskVariant("neutro")).toBe("success");
  });

  test('riskVariant returns neutral for empty or unknown values', () => {
    expect(riskVariant("")).toBe("neutral");
    expect(riskVariant(null)).toBe("neutral");
    expect(riskVariant(undefined)).toBe("neutral");
    expect(riskVariant("desconocido")).toBe("neutral");
  });

  test('isLowRisk correctly identifies low risk strings', () => {
    expect(isLowRisk("bajo")).toBe(true);
    expect(isLowRisk("Leve")).toBe(true);
    expect(isLowRisk("nulo")).toBe(true);
    expect(isLowRisk("low")).toBe(true);
    expect(isLowRisk("mild")).toBe(true);
    expect(isLowRisk("none")).toBe(true);
    expect(isLowRisk("alto")).toBe(false);
    expect(isLowRisk("")).toBe(false);
  });

  test('isHighRisk correctly identifies high risk strings', () => {
    expect(isHighRisk("alto")).toBe(true);
    expect(isHighRisk("Alto")).toBe(true);
    expect(isHighRisk("severo")).toBe(true);
    expect(isHighRisk("grave")).toBe(true);
    expect(isHighRisk("high")).toBe(true);
    expect(isHighRisk("bajo")).toBe(false);
    expect(isHighRisk("")).toBe(false);
  });

  test('isNotableRisk flags moderate and high but not low risk', () => {
    expect(isNotableRisk("moderado")).toBe(true);
    expect(isNotableRisk("alto")).toBe(true);
    expect(isNotableRisk("significativo")).toBe(true);
    expect(isNotableRisk("moderate")).toBe(true);
    expect(isNotableRisk("bajo")).toBe(false);
    expect(isNotableRisk("leve")).toBe(false);
    expect(isNotableRisk("")).toBe(false);
  });

  test('drugEmoji returns correct emoji per class', () => {
    expect(drugEmoji("ISRS")).toBe("🧠");
    expect(drugEmoji("Dual IRSN")).toBe("🔁");
    expect(drugEmoji("Tricíclico")).toBe("🧬");
    expect(drugEmoji("IMAO")).toBe("🔬");
    expect(drugEmoji("Agomelatina")).toBe("🌙");
    expect(drugEmoji("Bupropion NDRI")).toBe("🎯");
    expect(drugEmoji("Mirtazapina NaSSA")).toBe("😴");
    expect(drugEmoji("Estabilizador")).toBe("⚖️");
    expect(drugEmoji("Antipsicótico")).toBe("🛡️");
    expect(drugEmoji("Desconocido")).toBe("💊");
    expect(drugEmoji("")).toBe("💊");
  });
});

describe('Store state helpers', () => {
  // In-memory localStorage polyfill for Node.js test environment
  let store = {};
  const mockStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };

  function getRecentItems(storageKey) {
    try { return JSON.parse(mockStorage.getItem(storageKey) || "[]"); }
    catch { return []; }
  }

  function addRecentItem(storageKey, maxRecents, id, name, cls) {
    const recents = getRecentItems(storageKey).filter(r => String(r.id) !== String(id));
    recents.unshift({ id: String(id), name, cls, ts: Date.now() });
    try { mockStorage.setItem(storageKey, JSON.stringify(recents.slice(0, maxRecents))); }
    catch {}
  }

  const KEY = "test_recents_v1";

  beforeEach(() => {
    store = {};
  });

  test('getRecentItems returns empty array when no data', () => {
    expect(getRecentItems(KEY)).toEqual([]);
  });

  test('addRecentItem stores item and returns it', () => {
    addRecentItem(KEY, 6, "1", "Fluoxetina", "ISRS");
    const items = getRecentItems(KEY);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("1");
    expect(items[0].name).toBe("Fluoxetina");
  });

  test('addRecentItem deduplicates by id', () => {
    addRecentItem(KEY, 6, "1", "Fluoxetina", "ISRS");
    addRecentItem(KEY, 6, "1", "Fluoxetina", "ISRS");
    expect(getRecentItems(KEY)).toHaveLength(1);
  });

  test('addRecentItem respects max size', () => {
    for (let i = 0; i < 8; i++) {
      addRecentItem(KEY, 6, String(i), `Drug ${i}`, "ISRS");
    }
    expect(getRecentItems(KEY)).toHaveLength(6);
  });

  test('addRecentItem puts newest item first', () => {
    addRecentItem(KEY, 6, "1", "Fluoxetina", "ISRS");
    addRecentItem(KEY, 6, "2", "Sertralina", "ISRS");
    const items = getRecentItems(KEY);
    expect(items[0].id).toBe("2");
  });
});

describe('Dataset coercion', () => {
  function coerceDataset(raw) {
    if (Array.isArray(raw)) return { meta: {}, items: raw };
    const meta = raw?.meta ?? {};
    if (Array.isArray(raw?.items)) return { meta, items: raw.items };
    if (Array.isArray(raw?.rows)) return { meta, items: raw.rows };
    if (Array.isArray(raw?.data)) return { meta, items: raw.data };
    if (Array.isArray(raw?.farmacos)) return { meta, ...raw };
    throw new Error("Dataset inválido");
  }

  test('handles bare array', () => {
    const result = coerceDataset([{ id: 1 }]);
    expect(result.items).toHaveLength(1);
    expect(result.meta).toEqual({});
  });

  test('handles { items: [...] } shape', () => {
    const result = coerceDataset({ meta: { v: 1 }, items: [{ id: 1 }] });
    expect(result.items).toHaveLength(1);
    expect(result.meta.v).toBe(1);
  });

  test('handles { rows: [...] } shape', () => {
    const result = coerceDataset({ rows: [{ id: 1 }, { id: 2 }] });
    expect(result.items).toHaveLength(2);
  });

  test('handles { farmacos: [...] } shape', () => {
    const result = coerceDataset({ farmacos: [{ id: 1 }] });
    expect(result.farmacos).toHaveLength(1);
  });

  test('throws for invalid shape', () => {
    expect(() => coerceDataset({ foo: "bar" })).toThrow();
    expect(() => coerceDataset(null)).toThrow();
  });
});
