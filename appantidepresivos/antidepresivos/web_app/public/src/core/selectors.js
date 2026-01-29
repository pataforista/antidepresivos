export function selectFilteredItems(state) {
    const items = state.data?.dataset?.items ?? [];
    const { q, grupo, sedacion } = state.filters;

    return items.filter((item) => {
        // 1. Texto (Search)
        if (q) {
            if (!item._search || !item._search.includes(normalizeText(q))) {
                return false;
            }
        }

        // 2. Grupo (Clase Terapéutica)
        // grupo es array de strings, ej: ["ISRS", "Tricíclico"]
        if (grupo && grupo.length > 0) {
            const cls = (item.clase_terapeutica || "").toLowerCase();
            // Chequeo laxo: si el item.class contiene alguna de las keywords seleccionadas
            const match = grupo.some((g) => cls.includes(g.toLowerCase()));
            if (!match) return false;
        }

        // 3. Sedación (Rango numerico 0-3)
        // item.nivel_sedacion suele ser "0", "1", "2" string
        if (sedacion) {
            const val = parseInt(item.nivel_sedacion, 10);
            if (!isNaN(val)) {
                if (val < sedacion.min || val > sedacion.max) return false;
            }
        }

        return true;
    });
}

/**
 * Prepara los datos para el Radar Chart y la Tabla
 */
export function selectComparisonData(state) {
    const allItems = state.data?.dataset?.items ?? [];
    const ids = state.compare?.ids ?? [];

    // Filtrar solo los seleccionados
    const selectedItems = ids
        .map(id => allItems.find(i => String(i.id_farmaco) === String(id)))
        .filter(Boolean);

    /*
      Ejes del Radar (Clínicos):
      - Sedación (0-3)
      - Peso (0:Pérdida/Neutro -> 0.5:Neutro -> 1:Aumento) -> Mapeo especial
      - Sexual (0:Bajo -> 1:Mod -> 2:Alto)
      - QT (0:Bajo -> 1:Mod -> 2:Alto)
      - Activación (0:Bajo -> 1:Mod -> 2:Alto)
      - Abstinencia (0:Bajo -> 1:Mod -> 2:Alto)
    */

    const radarData = selectedItems.map(item => {
        // Helper para normalizar score 0..1
        // Asumimos que normalize.js ya genero _norm.ord con 0,1,2
        // Si no, lo calculamos al vuelo (robustez)

        const norm = item._norm?.ord || {};

        // Sedación: raw es "0","1","2","3". Normalizar a 0..1 (dividiendo por 3)
        const sedRaw = parseInt(item.nivel_sedacion || "0", 10) || 0;
        const sedScore = Math.min(sedRaw / 3, 1);

        // Peso:
        // normalize.js: mapPesoOrdinal -> 0=perdida, 1=neutro, 2=aumento
        // Para el radar, quizas queremos "Impacto": 
        // Si es perdida (0), quizas el "riesgo" es bajo? O es un feature?
        // Vamos a mapear: 0(perdida) -> 0.2, 1(neutro) -> 0.0, 2(aumento) -> 1.0 (Riesgo de engordar)
        // O simplificar: map 0..2 a 0..1 direct (0=0, 1=0.5, 2=1)
        const pesoRaw = norm.perfil_impacto_peso_ord ?? 1; // default neutro
        const pesoScore = pesoRaw / 2;

        // Sexual: 0..2 -> 0..1
        const sexRaw = norm.perfil_disfuncion_sexual_ord ?? 0;
        const sexScore = sexRaw / 2;

        // QT: 0..2 -> 0..1
        const qtRaw = norm.riesgo_prolongacion_qt_ord ?? 0;
        const qtScore = qtRaw / 2;

        // Activación: 0..2 -> 0..1
        // Ojo: Activación no siempre es "malo". Pero para el radar lo graficamos como intensidad.
        const actRaw = norm.perfil_activacion_ord ?? 0;
        const actScore = actRaw / 2;

        // Abstinencia: 0..2 -> 0..1
        const absRaw = norm.riesgo_sindrome_abstinencia_ord ?? 0;
        const absScore = absRaw / 2;

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

// Helper local igual que en normalize.js para consistencia en búsqueda
function normalizeText(s) {
    return (s ?? "")
        .toString()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
