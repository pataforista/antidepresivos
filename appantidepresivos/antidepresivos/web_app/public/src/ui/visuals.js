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

    document.querySelectorAll(".card, .section-title, .monograph__header").forEach(el => {
        el.style.opacity = "0"; // Initial state
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
