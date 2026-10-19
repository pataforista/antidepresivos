// Contraste WCAG de los tokens del sistema "humano" (docs/PLAN_ESTETICA_HUMANO.md §8, PR A1).
// Lee public/shared/humano-tokens.css, resuelve las variables de cada tema y exige ≥ 4.5:1 en los pares
// de texto clínico y ≥ 3:1 en series de datos.
import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CSS = readFileSync(resolve(ROOT, 'public/shared/humano-tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function block(selectorStart) {
  const i = CSS.indexOf(selectorStart);
  if (i < 0) throw new Error(`No encuentro el bloque ${selectorStart}`);
  const open = CSS.indexOf('{', i);
  const close = CSS.indexOf('}', open);
  const vars = {};
  for (const m of CSS.slice(open + 1, close).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

const ROOT_VARS = block(':root');
const THEMES = {
  light: { ...ROOT_VARS, ...block('.theme-light') },
  dark: { ...ROOT_VARS, ...block('.theme-dark') },
};

function resolveVar(theme, value, depth = 0) {
  if (depth > 10) throw new Error(`Referencia circular: ${value}`);
  const m = /^var\((--[\w-]+)(?:\s*,\s*(.+))?\)$/.exec(value);
  if (!m) return value;
  const next = THEMES[theme][m[1]] ?? m[2];
  if (next === undefined) throw new Error(`${m[1]} no está definido en el tema ${theme}`);
  return resolveVar(theme, next.trim(), depth + 1);
}

function color(theme, nameOrHex) {
  const raw = nameOrHex.startsWith('--') ? resolveVar(theme, `var(${nameOrHex})`) : nameOrHex;
  const hex = /^#([0-9a-f]{6})$/i.exec(raw);
  if (!hex) throw new Error(`${nameOrHex} (${theme}) no es un color hex opaco: ${raw}`);
  return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255);
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [texto, fondo]. En claro no hay --h-btn: el botón sólido usa el primario.
const PAIRS = {
  light: [
    ['--text-main', '--bg-app'],
    ['--text-main', '--bg-surface'],
    ['--text-muted', '--bg-surface'],
    ['--text-muted', '--bg-elevated'],
    ['--ritual-red', '--bg-surface'],
    ['#FFFFFF', '--h-indigo'],
    ['#FFFFFF', '--color-primary'],
    ['--accent', '--bg-surface'],
    ['--h-warn-text', '--h-warn-bg'],
    ['--risk-high', '--bg-surface'],
    ['--risk-mod', '--bg-surface'],
    ['--risk-low', '--bg-surface'],
    ['--risk-high', '--bg-app'],
    ['--risk-mod', '--bg-app'],
    ['--risk-low', '--bg-app'],
  ],
  dark: [
    ['--text-main', '--bg-app'],
    ['--text-main', '--bg-surface'],
    ['--text-muted', '--bg-surface'],
    ['--text-muted', '--bg-elevated'],
    ['--ritual-red', '--bg-surface'],
    ['#FFFFFF', '--h-indigo'],
    ['#FFFFFF', '--h-btn'],
    ['--accent', '--bg-surface'],
    ['--color-primary', '--bg-surface'],
    ['--h-warn-text', '--h-warn-bg'],
    ['--risk-high', '--bg-surface'],
    ['--risk-mod', '--bg-surface'],
    ['--risk-low', '--bg-surface'],
    ['--risk-high', '--bg-app'],
    ['--risk-mod', '--bg-app'],
    ['--risk-low', '--bg-app'],
  ],
};

describe('humano-tokens: contraste WCAG AA', () => {
  for (const [theme, pairs] of Object.entries(PAIRS)) {
    for (const [fg, bg] of pairs) {
      it(`${theme}: ${fg} sobre ${bg} ≥ 4.5:1`, () => {
        const ratio = contrast(color(theme, fg), color(theme, bg));
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  // Elementos gráficos (series del radar y del comparador): WCAG 1.4.11 pide 3:1.
  for (const theme of ['light', 'dark']) {
    for (const n of [1, 2, 3, 4, 5]) {
      it(`${theme}: --viz-${n} sobre --bg-surface ≥ 3:1`, () => {
        const ratio = contrast(color(theme, `--viz-${n}`), color(theme, '--bg-surface'));
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it('el cálculo de contraste coincide con un valor conocido (negro/blanco = 21:1)', () => {
    expect(contrast([0, 0, 0], [1, 1, 1])).toBeCloseTo(21, 5);
  });
});
