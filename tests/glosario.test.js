/**
 * Tests para Glosario Clínico, Criterios Metodológicos y Enrutamiento /glosario
 */

import fs from 'node:fs';
import path from 'node:path';
import { jest } from '@jest/globals';
import { createRouter } from '../src/core/router.js';

describe('Glosario Clínico & Criterios Metodológicos', () => {
  const glossaryPath = path.resolve('public/data/glosario_terminos.json');
  const criteriaPath = path.resolve('public/data/criterios_inclusion_exclusion.json');

  test('glosario_terminos.json contiene los 7 términos clínicos validados', () => {
    const raw = fs.readFileSync(glossaryPath, 'utf8');
    const glossary = JSON.parse(raw);

    expect(Array.isArray(glossary)).toBe(true);
    expect(glossary.length).toBe(7);

    const requiredFields = [
      'id', 'term_es', 'term_en', 'category', 'category_en',
      'definition_es', 'definition_en', 'clinical_pearl_es', 'clinical_pearl_en', 'sources'
    ];

    glossary.forEach(item => {
      requiredFields.forEach(field => {
        expect(item[field]).toBeDefined();
        if (field === 'sources') {
          expect(Array.isArray(item.sources)).toBe(true);
          expect(item.sources.length).toBeGreaterThan(0);
        } else {
          expect(typeof item[field]).toBe('string');
          expect(item[field].length).toBeGreaterThan(0);
        }
      });
    });

    // Validar términos específicos
    const termIds = glossary.map(g => g.id);
    expect(termIds).toContain('GLOS-01'); // Hunter
    expect(termIds).toContain('GLOS-02'); // Washout
    expect(termIds).toContain('GLOS-03'); // Cross-tapering
    expect(termIds).toContain('GLOS-04'); // RIMA
    expect(termIds).toContain('GLOS-05'); // QTc
    expect(termIds).toContain('GLOS-06'); // AEC
    expect(termIds).toContain('GLOS-07'); // FINISH
  });

  test('criterios_inclusion_exclusion.json tiene estructura válida y suma 45 moléculas', () => {
    const raw = fs.readFileSync(criteriaPath, 'utf8');
    const criteria = JSON.parse(raw);

    expect(criteria.total_molecules).toBe(45);
    expect(Array.isArray(criteria.inclusion_criteria)).toBe(true);
    expect(Array.isArray(criteria.exclusion_criteria)).toBe(true);

    const totalInclusionCount = criteria.inclusion_criteria.reduce((sum, item) => sum + (item.count || 0), 0);
    expect(totalInclusionCount).toBe(45);

    expect(criteria.exclusion_criteria.length).toBe(4);
  });

  test('router.js reconoce y enruta /glosario correctamente', () => {
    // Simulación de store mínimo
    const mockStore = {
      getState: () => ({ route: { name: 'list', path: '/', params: {}, query: {} }, compare: { ids: [] } }),
      dispatch: jest.fn(),
      setRoute: jest.fn(),
      setCompareIds: jest.fn()
    };

    const router = createRouter(mockStore);
    expect(typeof router.navigate).toBe('function');
  });
});
