/* src/ui/visuals.js */

/**
 * Initializes "MagicBento" spotlight effect on cards.
 * Tracks mouse position relative to each card to update CSS variables.
 */
export function initCardSpotlight() {
    const cards = document.querySelectorAll(".card--spotlight");

    cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });
    });
}

/**
 * Observes elements with .animate-on-scroll and applies entrance animations.
 */
export function initEntranceAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("animate-fade-in");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll(".card, .section-title, .monograph__header").forEach(el => {
        if (!prefersReduced) el.style.opacity = "0";
        observer.observe(el);
    });
}

/**
 * Updates the Gooey Nav background position based on the active link.
 */
export function updateGooeyNav() {
    const nav = document.querySelector(".nav-gooey");
    if (!nav) return;

    const activeLink = nav.querySelector(".nav-gooey__link.active");
    const blob = nav.querySelector(".nav-gooey__blob");

    if (activeLink && blob) {
        const rectNav = nav.getBoundingClientRect();
        const rectLink = activeLink.getBoundingClientRect();

        const left = rectLink.left - rectNav.left;
        const width = rectLink.width;

        blob.style.transform = `translateX(${left}px)`;
        blob.style.width = `${width}px`;
        blob.style.opacity = "1";
    } else if (blob) {
        blob.style.opacity = "0";
    }
}

/* ─── Haptic Feedback ───────────────────────────────────────────────────── */

const HAPTIC_PATTERNS = {
    tap:     [8],
    success: [10, 40, 10],
    error:   [30, 20, 30, 20, 30],
    heavy:   [60],
    light:   [4],
    double:  [8, 60, 8],
};

/** Fire a haptic vibration pattern. No-op if unsupported or reduced-motion. */
export function haptic(type = 'tap') {
    if (!('vibrate' in navigator)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    navigator.vibrate(HAPTIC_PATTERNS[type] ?? HAPTIC_PATTERNS.tap);
}

/* ─── Scroll-Hide Header ────────────────────────────────────────────────── */

/**
 * Hides the sticky header when scrolling down; reveals it on scroll up.
 * Reads scroll from window (body-level scroll).
 */
export function initScrollHideHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const currentY = window.scrollY;
            const goingDown = currentY > lastScrollY && currentY > 120;
            header.classList.toggle('header--hidden', goingDown);
            lastScrollY = Math.max(0, currentY);
            ticking = false;
        });
    }, { passive: true });
}

/* ─── Ripple Effect ─────────────────────────────────────────────────────── */

/**
 * Adds a Material-style ink ripple that follows the tap/click origin.
 * Targets buttons, chips, dock items, and hoverable cards.
 */
export function initRippleEffect() {
    document.addEventListener('pointerdown', (e) => {
        const target = e.target.closest(
            '.btn:not(:disabled), .chip, .dock-nav-item, .task-chip, .card--hoverable'
        );
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2.2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-wave';
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
        target.appendChild(ripple);

        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }, { passive: true });
}

/* ─── View Transitions API ──────────────────────────────────────────────── */

/**
 * Wraps a DOM-update function in the View Transitions API for smooth
 * page-to-page animations. Falls back to a plain setTimeout on browsers
 * that don't support it yet.
 */
export function withViewTransition(fn) {
    if (document.startViewTransition) {
        return document.startViewTransition(fn);
    }
    // Fallback: small delay so the click event settles before repainting
    return Promise.resolve(setTimeout(fn, 40));
}
