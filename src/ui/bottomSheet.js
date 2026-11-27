/* ============================================================
   src/ui/bottomSheet.js
   Responsive Bottom Sheet component for Mobile UX.
   Replaces modales with accessible bottom-swipe sheets.
   ============================================================ */
import { escapeHtml } from "../core/utils.js";

let sheetSeq = 0;

export function mountBottomSheet({ title, contentHTML, onClose }) {
    const container = document.getElementById('bottom-sheet-container');
    if (!container) return;

    const titleId = `bottom-sheet-title-${++sheetSeq}`;
    const opener = document.activeElement;

    const backdrop = document.createElement('div');
    backdrop.className = 'bottom-sheet-backdrop';

    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', titleId);

    sheet.innerHTML = `
        <div class="bottom-sheet__handle" aria-hidden="true"></div>
        <div class="bottom-sheet__header">
            <h3 class="bottom-sheet__title" id="${titleId}">${escapeHtml(title)}</h3>
            <button type="button" class="bottom-sheet__close" aria-label="Cerrar">×</button>
        </div>
        <div class="bottom-sheet__content">
            ${contentHTML}
        </div>
    `;

    container.appendChild(backdrop);
    container.appendChild(sheet);

    requestAnimationFrame(() => {
        backdrop.classList.add('active');
        sheet.classList.add('active');
    });

    const closeBtn = sheet.querySelector('.bottom-sheet__close');
    closeBtn.focus({ preventScroll: true });

    let closed = false;
    const close = () => {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKeydown);
        backdrop.classList.remove('active');
        sheet.classList.remove('active');
        // Devuelve el foco solo si nadie más lo tomó (p.ej. otra hoja abierta a continuación)
        if (opener && typeof opener.focus === 'function' && sheet.contains(document.activeElement)) {
            opener.focus({ preventScroll: true });
        }
        setTimeout(() => {
            // Retira solo esta hoja: puede haberse abierto otra mientras tanto
            backdrop.remove();
            sheet.remove();
            if (onClose) onClose();
        }, 300);
    };

    function onKeydown(e) {
        if (e.key === 'Escape') {
            close();
            return;
        }
        // Trampa de foco mínima dentro del diálogo
        if (e.key === 'Tab') {
            const focusables = sheet.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])');
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }
    document.addEventListener('keydown', onKeydown);

    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);

    // Initializate ZingTouch for swipe down to close
    if (window.ZingTouch) {
        const zt = new window.ZingTouch.Region(sheet);
        zt.bind(sheet.querySelector('.bottom-sheet__handle'), 'swipe', (e) => {
            const angle = e.detail.data[0].currentDirection;
            if (angle > 225 && angle < 315) { // Downward swipe
                close();
            }
        });
    }

    return { close, element: sheet };
}
