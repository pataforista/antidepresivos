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
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay for list items
                if (entry.target.classList.contains('stagger-item') || entry.target.closest('.grid-cards')) {
                    const delay = index * 50;
                    entry.target.style.animationDelay = `${delay}ms`;
                }
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

/**
 * Enhanced search with highlighting and clear button functionality
 */
export function initSearchEnhancements() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        // Create wrapper if not exists
        if (!input.parentElement.classList.contains('search-input-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'search-input-wrapper';
            
            const icon = document.createElement('span');
            icon.className = 'search-icon';
            icon.innerHTML = '🔍';
            
            const clearBtn = document.createElement('button');
            clearBtn.className = 'search-clear-btn';
            clearBtn.type = 'button';
            clearBtn.innerHTML = '×';
            clearBtn.setAttribute('aria-label', 'Limpiar búsqueda');
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            wrapper.appendChild(icon);
            wrapper.appendChild(clearBtn);
        }
        
        const wrapper = input.parentElement;
        const clearBtn = wrapper.querySelector('.search-clear-btn');
        
        // Show/hide clear button based on input value
        input.addEventListener('input', () => {
            if (input.value.length > 0) {
                clearBtn.classList.add('visible');
            } else {
                clearBtn.classList.remove('visible');
            }
        });
        
        // Clear button click handler
        clearBtn.addEventListener('click', () => {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
            clearBtn.classList.remove('visible');
        });
        
        // Initialize clear button state
        if (input.value.length > 0) {
            clearBtn.classList.add('visible');
        }
    });
}

/**
 * Applies staggered animation to list items
 */
export function applyStaggerAnimation(containerSelector, itemSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const items = container.querySelectorAll(itemSelector);
    items.forEach((item, index) => {
        item.classList.add('stagger-item');
        item.style.animationDelay = `${index * 50}ms`;
    });
}

/**
 * Highlights matching text in search results
 */
export function highlightSearchText(text, query) {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}
