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
 * Updates the Gooey Nav background position based on the active link.
 */
export function updateGooeyNav() {
    const nav = document.querySelector(".nav-gooey");
    if (!nav) return;

    const activeLink = nav.querySelector(".nav-gooey__link.active");
    const blob = nav.querySelector(".nav-gooey__blob");

    if (activeLink && blob) {
        // Move blob to active link
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

/**
 * Attaches hover listeners to nav links for "preview" effect (optional)
 * or just rely on route changes for "active" state.
 */
export function initGooeyNavInteractions() {
    // Only if we wanted hover effects to move the blob temporarily
    // For now, let's stick to "Current Active Route" logic for stability
}
