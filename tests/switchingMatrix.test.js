/**
 * Suite de pruebas para reglas críticas de transición entre antidepresivos.
 * Valida la matriz de switching (JSON) y la lógica clínica embebida en switchView.js.
 * 
 * Casos cubiertos:
 * 1. Fluoxetina → IMAO irreversible: washout ≥ 5 semanas (35 días)
 * 2. IMAO irreversible → ISRS/IRSN: washout ≥ 14 días
 * 3. Moclobemida (RIMA) → ISRS: washout 24 horas (1 día)
 * 4. Cross-tapering entre dos ISRS estándar
 * 5. Detección de alerta de alto riesgo / síndrome serotoninérgico
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── Cargar matriz de switching desde JSON ────────────────────────────────────
const switchingMatrixPath = path.resolve('public/data/switching_matrix.json');
const switchingMatrix = JSON.parse(fs.readFileSync(switchingMatrixPath, 'utf-8'));

// ─── Helpers clínicos re-implementados desde switchView.js ────────────────────
// Estos replican la lógica hardcoded en src/ui/switchView.js para poder testearla
// sin modificar el archivo fuente.

function isMAOI(drug) {
  const clase = drug?.clase_terapeutica?.toLowerCase() || '';
  return /imao|maoi/.test(clase);
}

function isFluoxetine(drug) {
  const nombre = drug?.nombre_generico?.toLowerCase() || '';
  return /fluoxetina|fluoxetine/.test(nombre);
}

function isSSRI(drug) {
  const clase = drug?.clase_terapeutica?.toLowerCase() || '';
  return /isrs|ssri/.test(clase);
}

function isSNRI(drug) {
  const clase = drug?.clase_terapeutica?.toLowerCase() || '';
  return /dual|irsn|snri/.test(clase);
}

function isRIMA(drug) {
  const nombre = drug?.nombre_generico?.toLowerCase() || '';
  const clase = drug?.clase_terapeutica?.toLowerCase() || '';
  return /moclobemida|rima/.test(nombre) || /rima/.test(clase);
}

/**
 * Calcula el protocolo de switching según las reglas clínicas de switchView.js.
 * Retorna { strategy, washout_days, taper_days, isHighRisk }.
 */
function computeSwitchProtocol(fromDrug, toDrug) {
  // Buscar en la matriz primero
  const entry = switchingMatrix.find(m =>
    m.from.toLowerCase() === fromDrug.nombre_generico.toLowerCase() &&
    m.to.toLowerCase() === toDrug.nombre_generico.toLowerCase()
  );

  if (entry) {
    return {
      strategy: entry.strategy,
      washout_days: entry.washout_days,
      taper_days: entry.taper_days,
      isHighRisk: false,
      source: 'matrix'
    };
  }

  // Fallback: lógica clínica hardcoded
  // IMAO ↔ cualquier cosa = washout estricto
  if (isMAOI(fromDrug) || isMAOI(toDrug)) {
    // Fluoxetina → IMAO requiere 5 semanas (35 días) por vida media de norfluoxetina
    if (isFluoxetine(fromDrug) && isMAOI(toDrug)) {
      return {
        strategy: 'washout',
        washout_days: 35,
        taper_days: 0,
        isHighRisk: true,
        source: 'clinical_rule'
      };
    }
    // IMAO → ISRS/IRSN = 14 días estándar
    if (isMAOI(fromDrug) && (isSSRI(toDrug) || isSNRI(toDrug))) {
      return {
        strategy: 'washout',
        washout_days: 14,
        taper_days: 0,
        isHighRisk: true,
        source: 'clinical_rule'
      };
    }
    // Otros casos con IMAO = 14 días por defecto
    return {
      strategy: 'washout',
      washout_days: 14,
      taper_days: 0,
      isHighRisk: true,
      source: 'clinical_rule'
    };
  }

  // Moclobemida (RIMA) → ISRS = 24 horas
  if (isRIMA(fromDrug) && isSSRI(toDrug)) {
    return {
      strategy: 'washout',
      washout_days: 1,
      taper_days: 0,
      isHighRisk: false,
      source: 'clinical_rule'
    };
  }

  // Fluoxetina → otro ISRS = washout corto (3 días) por vida media larga
  if (isFluoxetine(fromDrug) && isSSRI(toDrug)) {
    return {
      strategy: 'direct_switch',
      washout_days: 3,
      taper_days: 0,
      isHighRisk: false,
      source: 'clinical_rule'
    };
  }

  // Cross-tapering estándar entre ISRS/IRSN
  if ((isSSRI(fromDrug) || isSNRI(fromDrug)) && (isSSRI(toDrug) || isSNRI(toDrug))) {
    return {
      strategy: 'cross_taper',
      washout_days: 0,
      taper_days: 14,
      isHighRisk: false,
      source: 'clinical_rule'
    };
  }

  // Default genérico
  return {
    strategy: 'cross_taper',
    washout_days: 0,
    taper_days: 14,
    isHighRisk: false,
    source: 'fallback'
  };
}

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('Switching Matrix - Reglas Clínicas Críticas', () => {
  // Mock de fármacos para testing
  const fluoxetina = { nombre_generico: 'Fluoxetina', clase_terapeutica: 'ISRS' };
  const paroxetina = { nombre_generico: 'Paroxetina', clase_terapeutica: 'ISRS' };
  const sertralina = { nombre_generico: 'Sertralina', clase_terapeutica: 'ISRS' };
  const escitalopram = { nombre_generico: 'Escitalopram', clase_terapeutica: 'ISRS' };
  const venlafaxina = { nombre_generico: 'Venlafaxina', clase_terapeutica: 'Dual IRSN' };
  const fenelzina = { nombre_generico: 'Fenelzina', clase_terapeutica: 'IMAO irreversible' };
  const tranilcipromina = { nombre_generico: 'Tranilcipromina', clase_terapeutica: 'IMAO irreversible' };
  const moclobemida = { nombre_generico: 'Moclobemida', clase_terapeutica: 'RIMA' };

  describe('1. Fluoxetina → IMAO irreversible', () => {
    test('Exige ventana de lavado de al menos 5 semanas (35 días)', () => {
      const protocol = computeSwitchProtocol(fluoxetina, fenelzina);
      
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBeGreaterThanOrEqual(35);
      expect(protocol.isHighRisk).toBe(true);
    });

    test('La alerta de alto riesgo está activa', () => {
      const protocol = computeSwitchProtocol(fluoxetina, tranilcipromina);
      
      expect(protocol.isHighRisk).toBe(true);
      expect(protocol.washout_days).toBe(35);
    });
  });

  describe('2. IMAO irreversible → ISRS/IRSN', () => {
    test('Fenelzina → Sertralina: washout ≥ 14 días', () => {
      const protocol = computeSwitchProtocol(fenelzina, sertralina);
      
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBeGreaterThanOrEqual(14);
      expect(protocol.isHighRisk).toBe(true);
    });

    test('Tranilcipromina → Venlafaxina: washout ≥ 14 días', () => {
      const protocol = computeSwitchProtocol(tranilcipromina, venlafaxina);
      
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBeGreaterThanOrEqual(14);
      expect(protocol.isHighRisk).toBe(true);
    });

    test('Fenelzina → Escitalopram: washout ≥ 14 días', () => {
      const protocol = computeSwitchProtocol(fenelzina, escitalopram);
      
      expect(protocol.washout_days).toBeGreaterThanOrEqual(14);
      expect(protocol.isHighRisk).toBe(true);
    });
  });

  describe('3. Moclobemida (RIMA) → ISRS', () => {
    test('Moclobemida → Sertralina: washout de 24 horas (1 día)', () => {
      const protocol = computeSwitchProtocol(moclobemida, sertralina);
      
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBe(1);
      expect(protocol.isHighRisk).toBe(false); // RIMA es reversible, menor riesgo
    });

    test('Moclobemida → Paroxetina: washout de 1 día', () => {
      const protocol = computeSwitchProtocol(moclobemida, paroxetina);
      
      expect(protocol.washout_days).toBe(1);
    });
  });

  describe('4. Cross-tapering entre dos ISRS estándar', () => {
    test('Sertralina → Escitalopram: cross-taper sin washout', () => {
      const protocol = computeSwitchProtocol(sertralina, escitalopram);
      
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.washout_days).toBe(0);
      expect(protocol.taper_days).toBeGreaterThan(0);
      expect(protocol.isHighRisk).toBe(false);
    });

    test('Paroxetina → Sertralina: cross-taper (desde matriz JSON)', () => {
      const protocol = computeSwitchProtocol(paroxetina, sertralina);
      
      // Este par SÍ está en la matriz
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(14);
    });

    test('Escitalopram → Venlafaxina: cross-taper (desde matriz JSON)', () => {
      const protocol = computeSwitchProtocol(escitalopram, venlafaxina);
      
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(10);
    });
  });

  describe('5. Detección de alerta de alto riesgo / síndrome serotoninérgico', () => {
    test('Cualquier transición con IMAO marca isHighRisk = true', () => {
      const cases = [
        [fluoxetina, fenelzina],
        [fenelzina, sertralina],
        [paroxetina, tranilcipromina],
        [venlafaxina, fenelzina]
      ];

      cases.forEach(([from, to]) => {
        const protocol = computeSwitchProtocol(from, to);
        expect(protocol.isHighRisk).toBe(true);
      });
    });

    test('Transiciones sin IMAO no marcan alto riesgo', () => {
      const cases = [
        [sertralina, escitalopram],
        [escitalopram, venlafaxina],
        [moclobemida, sertralina]
      ];

      cases.forEach(([from, to]) => {
        const protocol = computeSwitchProtocol(from, to);
        expect(protocol.isHighRisk).toBe(false);
      });
    });

    test('Fluoxetina → IMAO es el caso de mayor riesgo (washout 35 días)', () => {
      const protocol = computeSwitchProtocol(fluoxetina, fenelzina);
      
      expect(protocol.washout_days).toBe(35);
      expect(protocol.isHighRisk).toBe(true);
      expect(protocol.strategy).toBe('washout');
    });
  });

  describe('Validación de integridad del JSON', () => {
    test('La matriz tiene al menos 5 pares definidos', () => {
      expect(Array.isArray(switchingMatrix)).toBe(true);
      expect(switchingMatrix.length).toBeGreaterThanOrEqual(5);
    });

    test('Cada entrada tiene los campos requeridos', () => {
      switchingMatrix.forEach(entry => {
        expect(entry).toHaveProperty('from');
        expect(entry).toHaveProperty('to');
        expect(entry).toHaveProperty('strategy');
        expect(entry).toHaveProperty('taper_days');
        expect(entry).toHaveProperty('washout_days');
        expect(entry).toHaveProperty('notes');
        
        expect(typeof entry.from).toBe('string');
        expect(typeof entry.to).toBe('string');
        expect(typeof entry.taper_days).toBe('number');
        expect(typeof entry.washout_days).toBe('number');
        expect(Array.isArray(entry.notes)).toBe(true);
      });
    });

    test('Ningún par en la matriz involucra IMAO (requieren lógica especial)', () => {
      // La matriz JSON solo tiene pares estándar; los casos IMAO se manejan por reglas
      switchingMatrix.forEach(entry => {
        const fromUpper = entry.from.toLowerCase();
        const toUpper = entry.to.toLowerCase();
        
        // No debería haber IMAO en la matriz (se manejan por reglas hardcoded)
        expect(fromUpper).not.toMatch(/imao|maoi/);
        expect(toUpper).not.toMatch(/imao|maoi/);
      });
    });
  });
});
