/* ============================================================
   src/ui/bottomSheet.js
   Responsive Bottom Sheet component for Mobile UX.
   Replaces modales with accessible bottom-swipe sheets.
   ============================================================ */
import { escapeHtml } from "../core/utils.js";

export function mountBottomSheet({ title, contentHTML, onClose }) {
    const container = document.getElementById('bottom-sheet-container');
    if (!container) return;

    // Create backdrop and sheet
    const backdrop = document.createElement('div');
    backdrop.className = 'bottom-sheet-backdrop';

    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';

    sheet.innerHTML = `
        <div class="bottom-sheet__handle"></div>
        <div class="bottom-sheet__header">
            <h3 class="bottom-sheet__title">${escapeHtml(title)}</h3>
            <button class="bottom-sheet__close" aria-label="Cerrar">×</button>
        </div>
        <div class="bottom-sheet__content">
            ${contentHTML}
        </div>
    `;

    container.appendChild(backdrop);
    container.appendChild(sheet);

    // Entrance animation
    requestAnimationFrame(() => {
        backdrop.classList.add('active');
        sheet.classList.add('active');
    });

    const close = () => {
        backdrop.classList.remove('active');
        sheet.classList.remove('active');
        setTimeout(() => {
            container.innerHTML = '';
            if (onClose) onClose();
        }, 300);
    };

    backdrop.addEventListener('click', close);
    sheet.querySelector('.bottom-sheet__close').addEventListener('click', close);

    // Initializate ZingTouch for swipe down to close
    if (window.ZingTouch) {
        const zt = new ZingTouch.Region(sheet);
        zt.bind(sheet.querySelector('.bottom-sheet__handle'), 'swipe', (e) => {
            const angle = e.detail.data[0].currentDirection;
            if (angle > 225 && angle < 315) { // Downward swipe
                close();
            }
        });
    }

    return { close };
}
