document.addEventListener('DOMContentLoaded', () => {
    
    // --- State & Elements ---
    let translations = {};
    const supportedLangs = ['tr', 'en'];
    const bannerSizeSelect = document.getElementById('bannerSize');
    const bannerColorInput = document.getElementById('bannerColor');
    const bannerPreview = document.getElementById('bannerPreview');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const burgerBtn = document.getElementById('burger-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const closeBtn = document.getElementById('close-btn');
    const overlay = document.getElementById('overlay');
    const langButtons = document.querySelectorAll('.lang-btn');

    // --- i18n & Language Logic ---
    const fetchTranslations = async (lang) => {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Could not fetch ${lang}.json`);
            }
            return await response.json();
        } catch (error) {
            console.error(error);
            return {}; // Return empty object on error
        }
    };

    const applyTranslations = () => {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            if (translations[key]) {
                el.innerHTML = translations[key];
            }
        });
        // Update copy button text attribute for later use
        if (copyCodeBtn && translations.copyCodeButton) {
            copyCodeBtn.setAttribute('data-default-text', translations.copyCodeButton);
        }
    };

    const setLanguage = async (lang) => {
        translations = await fetchTranslations(lang);
        applyTranslations();
        document.documentElement.lang = lang;
        localStorage.setItem('user-lang', lang);

        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
    };

    const getInitialLang = () => {
        const savedLang = localStorage.getItem('user-lang');
        if (savedLang && supportedLangs.includes(savedLang)) {
            return savedLang;
        }
        const browserLang = navigator.language.split('-')[0];
        return supportedLangs.includes(browserLang) ? browserLang : 'tr';
    };

    // --- Mobile Navigation ---
    const toggleMobileNav = () => {
        mobileNav.classList.toggle('open');
        overlay.classList.toggle('visible');
        document.body.classList.toggle('no-scroll');
    };

    // --- Banner Generator Logic ---
    const getTextColor = (hexColor) => {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 125 ? '#000000' : '#FFFFFF';
    };

    const updateBanner = () => {
        if (!bannerPreview) return;
        const size = bannerSizeSelect.value;
        const color = bannerColorInput.value;
        let p, fs, is; // padding, fontSize, iconSize

        switch (size) {
            case 'small': [p, fs, is] = ['8px 16px', '14px', '18px']; break;
            case 'large': [p, fs, is] = ['16px 24px', '18px', '22px']; break;
            default:      [p, fs, is] = ['12px 20px', '16px', '20px'];
        }

        bannerPreview.style.padding = p;
        bannerPreview.style.fontSize = fs;
        bannerPreview.querySelector('.material-icons-outlined').style.fontSize = is;
        bannerPreview.style.backgroundColor = color;
        bannerPreview.style.color = getTextColor(color);
    };
    
    const copyBannerCode = () => {
        const bannerHTML = bannerPreview.outerHTML.replace(/id=".*?"/g, '').trim();
        navigator.clipboard.writeText(bannerHTML).then(() => {
            const originalText = copyCodeBtn.getAttribute('data-default-text');
            copyCodeBtn.innerHTML = translations.copyCodeSuccess || '✅ Copied!';
            copyCodeBtn.disabled = true;
            setTimeout(() => {
                copyCodeBtn.innerHTML = originalText;
                copyCodeBtn.disabled = false;
            }, 2000);
        });
    };

    // --- Event Listeners ---
    langButtons.forEach(btn => btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang'))));
    burgerBtn?.addEventListener('click', toggleMobileNav);
    closeBtn?.addEventListener('click', toggleMobileNav);
    overlay?.addEventListener('click', toggleMobileNav);
    document.querySelectorAll('.mobile-nav a').forEach(link => link.addEventListener('click', toggleMobileNav));
    
    bannerSizeSelect?.addEventListener('change', updateBanner);
    bannerColorInput?.addEventListener('input', updateBanner);
    copyCodeBtn?.addEventListener('click', copyBannerCode);

    // Header scroll effect
    const header = document.getElementById('pageHeader');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
    });

    // Scroll animations
    const animatedElements = document.querySelectorAll('.fade-in-up');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(el => observer.observe(el));

    // --- Initialization ---
    const init = async () => {
        const initialLang = getInitialLang();
        await setLanguage(initialLang);
        updateBanner();
    };

    init();
});
