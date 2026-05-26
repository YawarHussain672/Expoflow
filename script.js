// Mobile navigation
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        const isOpen = document.body.classList.toggle('nav-open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
}

// Intersection Observer for animations
const animatedElements = document.querySelectorAll('.feature-card, .step-card, .showcase-grid, .stat-item');

if ('IntersectionObserver' in window) {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach((el) => observer.observe(el));
} else {
    animatedElements.forEach((el) => el.classList.add('animate-fade-in'));
}

// Count-up stats
const statNumbers = document.querySelectorAll('.stat-number');

const formatStatValue = (value, format, suffix) => {
    if (format === 'compact') {
        return `${Math.floor(value / 1000)}K${suffix}`;
    }

    return `${Math.floor(value)}${suffix}`;
};

const animateStat = (stat) => {
    if (stat.dataset.animated === 'true') {
        return;
    }

    stat.dataset.animated = 'true';

    const target = Number(stat.dataset.count || 0);
    const suffix = stat.dataset.suffix || '';
    const format = stat.dataset.format || '';
    const duration = 1600;
    const startTime = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = target * easedProgress;

        stat.textContent = formatStatValue(currentValue, format, suffix);

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            stat.textContent = formatStatValue(target, format, suffix);
        }
    };

    requestAnimationFrame(tick);
};

if ('IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateStat(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    statNumbers.forEach((stat) => statObserver.observe(stat));
} else {
    statNumbers.forEach(animateStat);
}

// Future PHP backend links keep local file previews usable.
const isFilePreview = window.location.protocol === 'file:';

if (isFilePreview) {
    document.querySelectorAll('a[data-static-fallback]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const fallbackSelector = link.dataset.staticFallback;
            const fallbackTarget = fallbackSelector ? document.querySelector(fallbackSelector) : null;

            if (fallbackTarget) {
                e.preventDefault();
                fallbackTarget.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                if (document.body.classList.contains('nav-open')) {
                    document.body.classList.remove('nav-open');
                    menuToggle?.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
}

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        if (!href || href === '#') {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

        if (document.body.classList.contains('nav-open')) {
            document.body.classList.remove('nav-open');
            menuToggle?.setAttribute('aria-expanded', 'false');
        }
    });
});
