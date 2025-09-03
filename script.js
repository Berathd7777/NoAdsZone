document.addEventListener('DOMContentLoaded', () => {
    
    // --- State & Elements ---
    let translations = {};
    let supportedLangs = [];

    // Yeni bir dil eklemek için sadece bu listeyi güncelleyin.
    // 'code', /locales/ klasöründeki dosya adıyla eşleşmelidir (örn: de.json).
    // 'name', menüde görünecek addır.
    const potentialLanguages = [
        { code: 'tr', name: 'Türkçe' },
        { code: 'en', name: 'English' },
        // Örnek: Almanca eklemek için buraya { code: 'de', name: 'Deutsch' } ekleyin
    ];
    
    const bannerSizeSelect = document.getElementById('bannerSize');
    const bannerColorInput = document.getElementById('bannerColor');
    const bannerPreview = document.getElementById('bannerPreview');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const burgerBtn = document.getElementById('burger-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const closeBtn = document.getElementById('close-btn');
    const overlay = document.getElementById('overlay');
    const langPopupButton = document.getElementById('lang-popup-button');
    const langDropdown = document.getElementById('lang-dropdown');
    const langPopup = document.getElementById('lang-popup');
    const currentLangText = document.getElementById('current-lang-text');


    // --- i18n & Language Logic ---

    // Mevcut dil dosyalarını kontrol edip menüyü oluşturan fonksiyon
    const discoverAndSetupLanguages = async () => {
        const fetchPromises = potentialLanguages.map(lang => 
            fetch(`locales/${lang.code}.json`)
                .then(response => response.ok ? lang : Promise.reject())
        );

        const settledPromises = await Promise.allSettled(fetchPromises);
        const availableLanguages = settledPromises
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);

        supportedLangs = availableLanguages.map(lang => lang.code);
        
        langDropdown.innerHTML = ''; // Menüyü temizle
        availableLanguages.forEach(lang => {
            const item = document.createElement('button');
            item.className = 'lang-dropdown-item';
            item.dataset.lang = lang.code;
            item.textContent = lang.name;
            item.onclick = () => {
                setLanguage(lang.code);
                langPopup.classList.remove('open');
            };
            langDropdown.appendChild(item);
        });
    };

    const fetchTranslations = async (lang) => {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) throw new Error(`Could not fetch ${lang}.json`);
            return await response.json();
        } catch (error) {
            console.error(error);
            return {};
        }
    };

    const applyTranslations = () => {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            el.innerHTML = translations[key] || el.innerHTML;
        });
        if (copyCodeBtn) copyCodeBtn.setAttribute('data-default-text', translations.copyCodeButton);
    };

    const setLanguage = async (lang) => {
        translations = await fetchTranslations(lang);
        applyTranslations();
        document.documentElement.lang = lang;
        localStorage.setItem('user-lang', lang);

        const selectedLang = potentialLanguages.find(l => l.code === lang);
        if (selectedLang) currentLangText.textContent = selectedLang.name.substring(0,2).toUpperCase();
        
        document.querySelectorAll('.lang-dropdown-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    };

    const getInitialLang = () => {
        const savedLang = localStorage.getItem('user-lang');
        if (savedLang && supportedLangs.includes(savedLang)) return savedLang;
        const browserLang = navigator.language.split('-')[0];
        return supportedLangs.includes(browserLang) ? browserLang : 'tr';
    };

    // --- Popup/Dropdown Logic ---
    langPopupButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        langPopup.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
        if (!langPopup?.contains(e.target)) {
            langPopup?.classList.remove('open');
        }
    });

    // --- Mobile Navigation ---
    const toggleMobileNav = () => {
        mobileNav.classList.toggle('open');
        overlay.classList.toggle('visible');
        document.body.classList.toggle('no-scroll');
    };

    // --- Banner Generator Logic ---
    const getTextColor = (hex) => (parseInt(hex.substr(1,2),16)*299 + parseInt(hex.substr(3,2),16)*587 + parseInt(hex.substr(5,2),16)*114)/1000 > 125 ? '#000' : '#FFF';
    const updateBanner = () => {
        if (!bannerPreview) return;
        const [p, fs, is] = {
            'small': ['8px 16px', '14px', '18px'],
            'large': ['16px 24px', '18px', '22px'],
        }[bannerSizeSelect.value] || ['12px 20px', '16px', '20px'];
        bannerPreview.style.padding = p;
        bannerPreview.style.fontSize = fs;
        bannerPreview.querySelector('.material-icons-outlined').style.fontSize = is;
        bannerPreview.style.backgroundColor = bannerColorInput.value;
        bannerPreview.style.color = getTextColor(bannerColorInput.value);
    };
    const copyBannerCode = () => {
        navigator.clipboard.writeText(bannerPreview.outerHTML.replace(/id=".*?"/g, '').trim()).then(() => {
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
    burgerBtn?.addEventListener('click', toggleMobileNav);
    closeBtn?.addEventListener('click', toggleMobileNav);
    overlay?.addEventListener('click', toggleMobileNav);
    document.querySelectorAll('.mobile-nav a').forEach(link => link.addEventListener('click', toggleMobileNav));
    bannerSizeSelect?.addEventListener('change', updateBanner);
    bannerColorInput?.addEventListener('input', updateBanner);
    copyCodeBtn?.addEventListener('click', copyBannerCode);
    window.addEventListener('scroll', () => document.getElementById('pageHeader').classList.toggle('scrolled', window.scrollY > 10));
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));


    // --- Initialization ---
    const init = async () => {
        try {
            await discoverAndSetupLanguages();
            const initialLang = getInitialLang();
            await setLanguage(initialLang);
            updateBanner();
        } catch (error) {
            console.error("Initialization failed:", error);
        }
    };

    init();
});
