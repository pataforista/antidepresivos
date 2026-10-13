/**
 * Módulo de Trazabilidad para Reportes Clínicos (PDF / Impresión)
 * Origen: ADR-002, Issue #4 (BACKLOG_ISSUES.md)
 *
 * Genera e inyecta un pie de página en los reportes clínicos descargados o impresos
 * con la versión exacta de la aplicación, timestamp y aviso de responsabilidad clínica.
 */

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

/**
 * Genera el markup HTML para el footer de trazabilidad del reporte.
 * @param {Object} [options]
 * @param {string} [options.version]
 * @param {Date} [options.timestamp]
 * @returns {string} HTML string del footer
 */
export function getPdfFooterHtml(options = {}) {
  const version = options.version || APP_VERSION;
  const now = options.timestamp || new Date();

  // Formato: YYYY-MM-DD HH:mm (hora local)
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return `
<footer class="clinical-pdf-footer" style="margin-top:24px; padding-top:12px; border-top:1px solid #d0c8c0; font-family:'DM Sans', sans-serif, -apple-system; font-size:11px; color:#6b5d52; line-height:1.45; text-align:center;">
  <div style="font-weight:600; margin-bottom:3px; color:#4a3f36;">
    Antidepresivos v${version} &bull; Generado: ${dateStr} &bull; <a href="https://antidepresivos.drcelada.com" style="color:inherit; text-decoration:none;">antidepresivos.drcelada.com</a>
  </div>
  <div style="font-size:10px; color:#857568;">
    Documento informativo y de apoyo clínico. No sustituye juicio médico individual ni guías oficiales vigentes. Uso profesional.
  </div>
</footer>
`.trim();
}

/**
 * Asegura que el contenedor tenga el footer de trazabilidad inyectado antes de generar el PDF.
 * @param {HTMLElement} containerElement - El nodo DOM que será capturado por html2pdf
 */
export function ensurePdfFooter(containerElement) {
  if (!containerElement) return;
  const existing = containerElement.querySelector('.clinical-pdf-footer');
  if (!existing) {
    const temp = document.createElement('div');
    temp.innerHTML = getPdfFooterHtml();
    if (temp.firstElementChild) {
      containerElement.appendChild(temp.firstElementChild);
    }
  }
}
