// Talbiyah.ai - Premium Interactions

document.addEventListener('DOMContentLoaded', () => {
    initPricingTabs();
    initSmoothScroll();
    initScrollAnimations();
    initNavbarScroll();
});

// Pricing tabs
function initPricingTabs() {
    const tabs = document.querySelectorAll('.toggle-btn');
    const panels = document.querySelectorAll('.pricing-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            panels.forEach(panel => {
                panel.classList.toggle('active', panel.id === targetId);
            });
        });
    });
}

// Smooth scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offset = 80;
                const pos = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: pos, behavior: 'smooth' });
            }
        });
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '-50px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    // Add animation to cards and sections
    const animatedElements = document.querySelectorAll(
        '.step-card, .subject-card, .trust-card, .pricing-card, .payg-card, .section-header, .features-content, .sadaqah-content, .founder-content'
    );

    animatedElements.forEach((el, i) => {
        el.classList.add('animate-on-scroll');
        // Stagger animations within groups
        const parent = el.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(child =>
                child.classList.contains('step-card') ||
                child.classList.contains('subject-card') ||
                child.classList.contains('trust-card') ||
                child.classList.contains('pricing-card') ||
                child.classList.contains('payg-card')
            );
            const index = siblings.indexOf(el);
            if (index > -1 && index < 6) {
                el.classList.add(`animate-delay-${index + 1}`);
            }
        }
        observer.observe(el);
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;
    const scrollThreshold = 100;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add background when scrolled
        if (currentScroll > scrollThreshold) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.85)';
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    }, { passive: true });
}
