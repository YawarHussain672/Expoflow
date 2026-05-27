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

// Contact form modal
const contactModal = document.getElementById('contact-modal');
const modalTriggers = document.querySelectorAll('[data-modal-target="contact-modal"]');
const modalClose = contactModal?.querySelector('.modal-close');
const contactForm = contactModal?.querySelector('.contact-form');
const formStatus = contactModal?.querySelector('.form-status');
let lastFocusedElement = null;

const openContactModal = () => {
    if (!contactModal) {
        return;
    }

    lastFocusedElement = document.activeElement;
    contactModal.hidden = false;
    document.body.classList.add('modal-open');

    if (document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
    }

    const firstInput = contactModal.querySelector('.contact-form input, .contact-form textarea, .contact-form button');
    firstInput?.focus();
};

const closeContactModal = () => {
    if (!contactModal || contactModal.hidden) {
        return;
    }

    contactModal.hidden = true;
    document.body.classList.remove('modal-open');
    if (formStatus) {
        formStatus.textContent = '';
    }
    lastFocusedElement?.focus();
};

modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openContactModal();
    });
});

modalClose?.addEventListener('click', closeContactModal);

contactModal?.addEventListener('click', (e) => {
    if (e.target === contactModal) {
        closeContactModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeContactModal();
    }
});

if (window.location.hash === '#contact-modal') {
    openContactModal();
}

contactForm?.addEventListener('submit', (e) => {
    if (isFilePreview) {
        e.preventDefault();
        contactForm.reset();
        formStatus.textContent = 'Thanks. This form is ready to post to save-form.php when the PHP backend is connected.';
        formStatus.style.color = 'var(--secondary)';
        return;
    }

    // Modern AJAX Form Submission
    e.preventDefault();
    
    const submitBtn = contactForm.querySelector('.form-submit');
    const originalBtnHTML = submitBtn.innerHTML;
    
    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting... <span aria-hidden="true"><span class="spinner"></span></span>';
    
    // Inject spinner styling inline to avoid CSS clutter
    if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.innerHTML = `
            .spinner {
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #111;
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    formStatus.textContent = '';
    
    const formData = new FormData(contactForm);
    
    fetch('save-form.php', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            formStatus.textContent = data.message;
            formStatus.style.color = '#10b981'; // beautiful green
            contactForm.reset();
            
            // Auto close modal after a short delay
            setTimeout(() => {
                closeContactModal();
            }, 3000);
        } else {
            formStatus.textContent = data.message;
            formStatus.style.color = '#ef4444'; // error red
        }
    })
    .catch(error => {
        console.error('Error submitting form:', error);
        formStatus.textContent = 'Something went wrong. Please try again.';
        formStatus.style.color = '#ef4444';
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
    });
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        if (this.dataset.modalTarget) {
            return;
        }

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
