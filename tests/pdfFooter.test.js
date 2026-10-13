import { getPdfFooterHtml, ensurePdfFooter } from '../src/ui/pdfFooter.js';

describe('Clinical PDF Footer (Traceability)', () => {
  test('generates valid HTML with default app version and current date', () => {
    const html = getPdfFooterHtml();
    expect(html).toContain('clinical-pdf-footer');
    expect(html).toContain('Antidepresivos');
    expect(html).toContain('antidepresivos.drcelada.com');
    expect(html).toContain('Documento informativo y de apoyo clínico');
  });

  test('generates footer with custom version and timestamp', () => {
    const fixedDate = new Date(2026, 9, 12, 18, 30); // 2026-10-12 18:30
    const html = getPdfFooterHtml({ version: '1.2.3', timestamp: fixedDate });
    expect(html).toContain('Antidepresivos v1.2.3');
    expect(html).toContain('2026-10-12 18:30');
  });

  test('ensurePdfFooter appends footer if not present', () => {
    let appendedChild = null;
    let querySelectorCalled = false;

    // Simular un elemento DOM en entorno Node sin dependencias externas
    const mockContainer = {
      querySelector: () => {
        querySelectorCalled = true;
        return null; // No existe previamente
      },
      appendChild: (child) => {
        appendedChild = child;
      }
    };

    // Mock global document if not present
    const prevDocument = global.document;
    global.document = {
      createElement: () => ({
        innerHTML: '',
        firstElementChild: { className: 'clinical-pdf-footer' }
      })
    };

    try {
      ensurePdfFooter(mockContainer);
      expect(querySelectorCalled).toBe(true);
      expect(appendedChild).not.toBeNull();
      expect(appendedChild.className).toBe('clinical-pdf-footer');
    } finally {
      global.document = prevDocument;
    }
  });

  test('ensurePdfFooter does not duplicate footer if already present', () => {
    let appendCount = 0;
    const mockContainer = {
      querySelector: () => ({ className: 'clinical-pdf-footer' }),
      appendChild: () => { appendCount++; }
    };

    ensurePdfFooter(mockContainer);
    expect(appendCount).toBe(0);
  });
});
