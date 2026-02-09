import { normalizeDatasetItems } from "./normalize.js";

export async function loadAppData() {
  // 1) manifest
  const manifest = await fetchJson("./data/manifest.json");

  // 2) schemaUI (JS module versionado)
  // manifest.schema.path debe apuntar a /data/schemaUI.<hash>.js
  // Resolvemos la ruta relativa a la base del documento (index.html) para que funcione el import
  const schemaUrl = new URL(manifest.schema.path, document.baseURI).href;
  const schemaModule = await import(schemaUrl);
  const schema = schemaModule.SCHEMA_UI;

  // 3) legal
  const legal = await fetchJson(manifest.legal.path);

  // 4) dataset
  const datasetRaw = await fetchJson(manifest.dataset.path);

  // Asegura forma canónica { meta, items }
  const dataset = coerceDataset(datasetRaw);

  // Normaliza items (clona + _search + _norm + *_ord)
  if (Array.isArray(dataset.farmacos)) {
    dataset.farmacos = normalizeDatasetItems(dataset.farmacos, schema);
  } else {
    dataset.items = normalizeDatasetItems(dataset.items, schema);
  }


  // 5) normalización runtime (NO modifica CSV, solo añade _search/_norm)
  // dataset.items = normalizeDatasetItems(dataset.items, schema);

  return { manifest, schema, legal, dataset };
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  return await res.json();
}
function coerceDataset(datasetRaw) {
  if (Array.isArray(datasetRaw)) return { meta: {}, items: datasetRaw };

  const meta = datasetRaw?.meta ?? {};
  if (Array.isArray(datasetRaw?.items)) return { meta, items: datasetRaw.items };
  if (Array.isArray(datasetRaw?.rows)) return { meta, items: datasetRaw.rows };
  if (Array.isArray(datasetRaw?.data)) return { meta, items: datasetRaw.data };
  if (Array.isArray(datasetRaw?.farmacos)) return { meta, ...datasetRaw };

  const keys = datasetRaw && typeof datasetRaw === "object" ? Object.keys(datasetRaw) : [];
  throw new Error(
    `Dataset inválido: no hay array en items/rows/data ni array directo. Keys: ${keys.join(", ") || "(none)"}`
  );
}
