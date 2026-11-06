/**
 * Suite de pruebas para reglas críticas de transición entre antidepresivos.
 * Valida la lógica clínica canónica de src/lib/switchingLogic.js
 * y la matriz de switching (public/data/switching_matrix.json).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  computeSwitchProtocol,
  isMAOI,
  isRIMA,
  isIrreversibleMAOI,
  isFluoxetine,
  isVortioxetine,
  isNonSwitchable
} from '../src/lib/switchingLogic.js';

// Cargar matriz de switching desde JSON
const switchingMatrixPath = path.resolve('public/data/switching_matrix.json');
const switchingMatrix = JSON.parse(fs.readFileSync(switchingMatrixPath, 'utf-8'));

describe('Switching Logic & Matrix - Reglas Clínicas Validadas', () => {
  // Fármacos canónicos para pruebas
  const fluoxetina = { id_farmaco: 'ADP_SSRI_01', nombre_generico: 'Fluoxetina', clase_terapeutica: 'ISRS' };
  const paroxetina = { id_farmaco: 'ADP_SSRI_02', nombre_generico: 'Paroxetina', clase_terapeutica: 'ISRS' };
  const sertralina = { id_farmaco: 'ADP_SSRI_03', nombre_generico: 'Sertralina', clase_terapeutica: 'ISRS' };
  const escitalopram = { id_farmaco: 'ADP_SSRI_05', nombre_generico: 'Escitalopram', clase_terapeutica: 'ISRS' };
  const venlafaxina = { id_farmaco: 'ADP_SNRI_01', nombre_generico: 'Venlafaxina', clase_terapeutica: 'Dual IRSN' };
  const vortioxetina = { id_farmaco: 'ADP_MULTI_01', nombre_generico: 'Vortioxetina', clase_terapeutica: 'Antidepresivo multimodal' };
  const clomipramina = { id_farmaco: 'ADP_TCA_01', nombre_generico: 'Clomipramina', clase_terapeutica: 'Tricíclico (TCA)' };
  const selegilina = { id_farmaco: 'ADP_MAOI_04', nombre_generico: 'Selegilina transdérmica', clase_terapeutica: 'IMAO transdérmico' };
  const fenelzina = { id_farmaco: 'ADP_MAOI_01', nombre_generico: 'Fenelzina', clase_terapeutica: 'IMAO irreversible' };
  const tranilcipromina = { id_farmaco: 'ADP_MAOI_02', nombre_generico: 'Tranilcipromina', clase_terapeutica: 'IMAO irreversible' };
  const moclobemida = { id_farmaco: 'ADP_MAOI_05', nombre_generico: 'Moclobemida', clase_terapeutica: 'IMAO reversible (RIMA)' };
  const bupropion = { id_farmaco: 'ADP_NDRI_01', nombre_generico: 'Bupropión', clase_terapeutica: 'IRND' };
  const mirtazapina = { id_farmaco: 'ADP_NASSA_01', nombre_generico: 'Mirtazapina', clase_terapeutica: 'NaSSA' };
  const duloxetina = { id_farmaco: 'ADP_SNRI_02', nombre_generico: 'Duloxetina', clase_terapeutica: 'Dual IRSN' };
  const citalopram = { id_farmaco: 'ADP_SSRI_04', nombre_generico: 'Citalopram', clase_terapeutica: 'ISRS' };

  // Potenciadores y acción rápida
  const litio = { id_farmaco: 'ADP_AUG_04', nombre_generico: 'Litio (Carbonato)', clase_terapeutica: 'Estatibilizador del ánimo / Potenciador' };
  const ketamina = { id_farmaco: 'ADP_RAPID_01', nombre_generico: 'Ketamina', clase_terapeutica: 'Antidepresivo de acción rápida' };
  const aripiprazol = { id_farmaco: 'ADP_AUG_01', nombre_generico: 'Aripiprazol', clase_terapeutica: 'Agonista parcial D2' };

  describe('1. Clasificación farmacológica de MAOIs y RIMAs', () => {
    test('Distingue correctamente RIMA (Moclobemida) de IMAO irreversibles', () => {
      expect(isMAOI(moclobemida)).toBe(true);
      expect(isRIMA(moclobemida)).toBe(true);
      expect(isIrreversibleMAOI(moclobemida)).toBe(false);

      expect(isMAOI(fenelzina)).toBe(true);
      expect(isRIMA(fenelzina)).toBe(false);
      expect(isIrreversibleMAOI(fenelzina)).toBe(true);

      expect(isMAOI(tranilcipromina)).toBe(true);
      expect(isIrreversibleMAOI(tranilcipromina)).toBe(true);

      expect(isMAOI(selegilina)).toBe(true);
      expect(isIrreversibleMAOI(selegilina)).toBe(true);
    });

    test('Distingue fármacos con vidas medias especiales (Fluoxetina, Vortioxetina)', () => {
      expect(isFluoxetine(fluoxetina)).toBe(true);
      expect(isFluoxetine(sertralina)).toBe(false);

      expect(isVortioxetine(vortioxetina)).toBe(true);
      expect(isVortioxetine(escitalopram)).toBe(false);
    });

    test('Identifica potenciadores y agentes de acción rápida no aptos para cross-tapering', () => {
      expect(isNonSwitchable(litio)).toBe(true);
      expect(isNonSwitchable(ketamina)).toBe(true);
      expect(isNonSwitchable(aripiprazol)).toBe(true);
      expect(isNonSwitchable(sertralina)).toBe(false);
      expect(isNonSwitchable(venlafaxina)).toBe(false);
    });
  });

  describe('2. Transiciones con IMAO irreversibles', () => {
    test('Fluoxetina → IMAO irreversible: washout obligatorio de 5 semanas (35 días)', () => {
      const protocol = computeSwitchProtocol(fluoxetina, fenelzina, switchingMatrix);
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBe(35);
      expect(protocol.isHighRisk).toBe(true);
    });

    test('Vortioxetina → IMAO irreversible: washout de 21 días (3 semanas por FDA labeling)', () => {
      const protocol = computeSwitchProtocol(vortioxetina, tranilcipromina, switchingMatrix);
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBe(21);
      expect(protocol.isHighRisk).toBe(true);
      expect(protocol.notes.some(n => n.includes('21 días') || n.includes('21 days'))).toBe(true);
    });

    test('IMAO irreversible → ISRS/IRSN: washout estándar de 14 días', () => {
      const p1 = computeSwitchProtocol(fenelzina, sertralina, switchingMatrix);
      expect(p1.strategy).toBe('washout');
      expect(p1.washout_days).toBe(14);
      expect(p1.isHighRisk).toBe(true);

      const p2 = computeSwitchProtocol(tranilcipromina, venlafaxina, switchingMatrix);
      expect(p2.strategy).toBe('washout');
      expect(p2.washout_days).toBe(14);
      expect(p2.isHighRisk).toBe(true);
    });

    test('Clomipramina → IMAO incluye advertencia de 21 días según guías clínicas', () => {
      const protocol = computeSwitchProtocol(clomipramina, fenelzina, switchingMatrix);
      expect(protocol.washout_days).toBe(14);
      expect(protocol.notes.some(n => n.includes('21 días') || n.includes('21 days'))).toBe(true);
    });

    test('Selegilina parche incluye advertencia de dieta sin tiramina tras suspensión', () => {
      const protocol = computeSwitchProtocol(selegilina, escitalopram, switchingMatrix);
      expect(protocol.washout_days).toBe(14);
      expect(protocol.notes.some(n => n.includes('tiramina') || n.includes('tyramine'))).toBe(true);
    });
  });

  describe('3. Transiciones con Moclobemida (RIMA)', () => {
    test('Moclobemida → ISRS/IRSN: lavado de 24 horas (1 día)', () => {
      const protocol = computeSwitchProtocol(moclobemida, sertralina, switchingMatrix);
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBe(1);
      expect(protocol.taper_days).toBe(0);
      expect(protocol.desc).toMatch(/24 horas|24 hours|24-hour/i);
      expect(protocol.rationale).not.toMatch(/irreversible/i);
    });

    test('Moclobemida → Paroxetina/Venlafaxina: 24 horas y sin cross-taper', () => {
      const p1 = computeSwitchProtocol(moclobemida, paroxetina, switchingMatrix);
      expect(p1.washout_days).toBe(1);
      const p2 = computeSwitchProtocol(moclobemida, venlafaxina, switchingMatrix);
      expect(p2.washout_days).toBe(1);
    });

    test('Serotoninérgico estándar → Moclobemida: lavado de 14 días', () => {
      const protocol = computeSwitchProtocol(sertralina, moclobemida, switchingMatrix);
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBe(14);
      expect(protocol.isHighRisk).toBe(true);
    });

    test('Fluoxetina → Moclobemida: lavado de 35 días (5 semanas)', () => {
      const protocol = computeSwitchProtocol(fluoxetina, moclobemida, switchingMatrix);
      expect(protocol.strategy).toBe('washout');
      expect(protocol.washout_days).toBe(35);
      expect(protocol.isHighRisk).toBe(true);
    });
  });

  describe('4. Salida de Fluoxetina hacia no-IMAO', () => {
    test('Fluoxetina → otro no-IMAO sin matriz: intervalo de 7 días y dosis baja', () => {
      const protocol = computeSwitchProtocol(fluoxetina, escitalopram, []);
      expect(protocol.strategy).toBe('fluoxetine_switch');
      expect(protocol.washout_days).toBe(7);
      expect(protocol.notes.some(n => n.includes('CYP2D6'))).toBe(true);
    });
  });

  describe('5. Exclusión de potenciadores y terapias agudas', () => {
    test('Litio o Ketamina devuelven estrategia not_applicable y mensaje clínico', () => {
      const p1 = computeSwitchProtocol(sertralina, litio, switchingMatrix);
      expect(p1.strategy).toBe('not_applicable');
      expect(p1.isHighRisk).toBe(true);
      expect(p1.desc).toMatch(/potenciación|coadyuvante|augmenting|acute/i);

      const p2 = computeSwitchProtocol(ketamina, venlafaxina, switchingMatrix);
      expect(p2.strategy).toBe('not_applicable');
    });
  });

  describe('6. Pares curados en matriz JSON', () => {
    test('Paroxetina → Sertralina se recupera de la matriz curada', () => {
      const protocol = computeSwitchProtocol(paroxetina, sertralina, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(14);
    });

    test('Escitalopram → Venlafaxina se recupera de la matriz curada', () => {
      const protocol = computeSwitchProtocol(escitalopram, venlafaxina, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(10);
    });

    test('Venlafaxina → Sertralina: cross-taper 14 días (alto riesgo de discontinuación)', () => {
      const protocol = computeSwitchProtocol(venlafaxina, sertralina, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(14);
      expect(protocol.washout_days).toBe(0);
    });

    test('Paroxetina → Venlafaxina: cross-taper gradual 14 días', () => {
      const protocol = computeSwitchProtocol(paroxetina, venlafaxina, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(14);
    });

    test('Sertralina → Bupropión: cross-taper 7 días', () => {
      const protocol = computeSwitchProtocol(sertralina, bupropion, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(7);
    });

    test('Sertralina → Escitalopram: direct switch al día siguiente', () => {
      const protocol = computeSwitchProtocol(sertralina, escitalopram, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('direct_switch');
      expect(protocol.taper_days).toBe(0);
      expect(protocol.washout_days).toBe(0);
    });

    test('Citalopram → Sertralina: direct switch al día siguiente', () => {
      const protocol = computeSwitchProtocol(citalopram, sertralina, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('direct_switch');
      expect(protocol.taper_days).toBe(0);
      expect(protocol.washout_days).toBe(0);
    });

    test('Sertralina → Mirtazapina: cross-taper 7 días', () => {
      const protocol = computeSwitchProtocol(sertralina, mirtazapina, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(7);
    });

    test('Escitalopram → Duloxetina: cross-taper 10 días', () => {
      const protocol = computeSwitchProtocol(escitalopram, duloxetina, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(10);
    });

    test('Venlafaxina → Duloxetina: cross-taper 10 días', () => {
      const protocol = computeSwitchProtocol(venlafaxina, duloxetina, switchingMatrix);
      expect(protocol.source).toBe('matrix');
      expect(protocol.strategy).toBe('cross_taper');
      expect(protocol.taper_days).toBe(10);
    });
  });
});
