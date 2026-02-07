export function selectFilteredItems(state) {
    const dataset = state.data?.dataset;
    const items = dataset?.farmacos ?? [];
    const { q, grupo, sedacion } = state.filters;

    const filtered = items.filter((item) => {
        // 1. Texto (Search)
        if (q) {
            if (!item._search || !item._search.includes(normalizeText(q))) {
                return false;
            }
        }

        // 2. Grupo (Clase Terapéutica)
        if (grupo && grupo.length > 0) {
            const cls = (item.clase_terapeutica || "").toLowerCase();
            const match = grupo.some((g) => cls.includes(g.toLowerCase()));
            if (!match) return false;
        }

        // 3. Sedación (Rango numerico 0-3)
        if (sedacion) {
            const val = parseInt(item.nivel_sedacion, 10);
            if (!isNaN(val)) {
                if (val < sedacion.min || val > sedacion.max) return false;
            }
        }

        return true;
    });

    return filtered.map(item => rehydrateFarmaco(item, dataset));
}

/**
 * Prepara los datos para el Radar Chart y la Tabla
 */
export function selectComparisonData(state) {
    const dataset = state.data?.dataset;
    const allItems = dataset?.farmacos ?? [];
    const ids = state.compare?.ids ?? [];

    const selectedItems = ids
        .map(id => {
            const item = allItems.find(i => String(i.id_farmaco) === String(id));
            return item ? rehydrateFarmaco(item, dataset) : null;
        })
        .filter(Boolean);

    const radarData = selectedItems.map(item => {
        const norm = item._norm?.ord || {};

        const sedRaw = parseInt(item.nivel_sedacion || "0", 10) || 0;
        const sedScore = Math.min(sedRaw / 3, 1);

        const pesoRaw = norm.perfil_impacto_peso_ord ?? 1;
        const pesoScore = pesoRaw / 2;

        const sexScore = (norm.perfil_disfuncion_sexual_ord ?? 0) / 2;
        const qtScore = (norm.riesgo_prolongacion_qt_ord ?? 0) / 2;
        const actScore = (norm.perfil_activacion_ord ?? 0) / 2;
        const absScore = (norm.riesgo_sindrome_abstinencia_ord ?? 0) / 2;

        return {
            id: item.id_farmaco,
            name: item.nombre_generico ?? item.id_farmaco,
            scores: {
                sedacion: sedScore,
                peso: pesoScore,
                sexual: sexScore,
                qt: qtScore,
                activacion: actScore,
                abstinencia: absScore
            },
            raw: item
        };
    });

    return { selectedItems, radarData };
}

/**
 * Rehidrata un fármaco con sus relaciones
 */
export function rehydrateFarmaco(farmaco, dataset) {
    if (!dataset || !farmaco) return farmaco;

    const rehydrated = { ...farmaco };

    // 1. Indications
    if (dataset.bridge_farmaco_indicacion) {
        const bridges = dataset.bridge_farmaco_indicacion.filter(b => b.farmaco_id === farmaco.id_farmaco);
        rehydrated.rel_indicaciones = bridges.map(b => {
            const ind = dataset.indicaciones.find(i => i.id === b.indicacion_id);
            return { ...ind, fuente: b.fuente };
        });
    }

    // 2. Side Effects
    if (dataset.bridge_farmaco_efecto) {
        const bridges = dataset.bridge_farmaco_efecto.filter(b => b.farmaco_id === farmaco.id_farmaco);
        rehydrated.rel_efectos_adversos = bridges.map(b => {
            const ea = dataset.efectos_adversos.find(i => i.id === b.efecto_id);
            return { ...ea, frecuencia: b.frecuencia };
        });
    }

    // 3. Interactions
    if (dataset.bridge_farmaco_interaccion) {
        const bridges = dataset.bridge_farmaco_interaccion.filter(b => b.farmaco_id === farmaco.id_farmaco);
        rehydrated.rel_interacciones = bridges.map(b => {
            return dataset.interacciones.find(i => i.id === b.interaccion_id);
        });
    }

    // 4. Enzymes
    if (dataset.bridge_farmaco_enzima) {
        const bridges = dataset.bridge_farmaco_enzima.filter(b => b.farmaco_id === farmaco.id_farmaco);
        rehydrated.rel_enzimas = bridges.map(b => {
            const enz = dataset.enzimas.find(i => i.id === b.enzima_id);
            return { ...enz, rol: b.rol };
        });
    }

    return rehydrated;
}

export function selectItemById(state, id) {
    const dataset = state.data?.dataset;
    const items = dataset?.farmacos ?? [];
    const item = items.find(i => String(i.id_farmaco) === String(id));
    return item ? rehydrateFarmaco(item, dataset) : null;
}

function normalizeText(s) {
    return (s ?? "")
        .toString()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
