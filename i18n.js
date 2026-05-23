(function () {
    'use strict';

    const STORAGE_KEY = 'dsvisual-lang';
    const SUPPORTED = Object.freeze(['zh', 'en']);

    let TRANSLATIONS = { zh: {}, en: {} };
    let currentLang = detectInitialLanguage();

    function detectInitialLanguage() {
        const saved = (typeof localStorage !== 'undefined')
            ? localStorage.getItem(STORAGE_KEY) : null;
        if (SUPPORTED.indexOf(saved) >= 0) return saved;
        const nav = (typeof navigator !== 'undefined' && navigator.language) || '';
        return nav.toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
    }

    function getCurrentLanguage() {
        return currentLang;
    }

    function t(key, vars) {
        const table = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        let str = table[key];
        if (str == null) {
            console.warn('[i18n] missing key:', key, 'for lang:', currentLang);
            str = (TRANSLATIONS.en && TRANSLATIONS.en[key]) != null
                ? TRANSLATIONS.en[key] : key;
        }
        if (vars) {
            str = str.replace(/\{(\w+)\}/g, function (_, name) {
                return vars[name] != null ? String(vars[name]) : '{' + name + '}';
            });
        }
        return str;
    }

    function applyTranslations(root) {
        root = root || (typeof document !== 'undefined' ? document : null);
        if (!root || !root.querySelectorAll) return;
        root.querySelectorAll('[data-i18n-key]').forEach(function (el) {
            el.textContent = t(el.dataset.i18nKey);
        });
        root.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
            el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
        });
        root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
        });
    }

    function setLanguage(lang) {
        if (SUPPORTED.indexOf(lang) < 0) return;
        if (lang === currentLang) return;
        currentLang = lang;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, lang);
        }
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
        }
        applyTranslations();
        if (typeof document !== 'undefined' && document.dispatchEvent) {
            document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
        }
    }

    // Apply initial <html lang> at load time.
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = currentLang === 'zh' ? 'zh-Hant' : 'en';
    }

    const api = {
        SUPPORTED: SUPPORTED,
        getCurrentLanguage: getCurrentLanguage,
        setLanguage: setLanguage,
        t: t,
        applyTranslations: applyTranslations,
        _setTablesForTest: function (next) { TRANSLATIONS = next; },
    };
    if (typeof window !== 'undefined') {
        window.I18N = api;
        window.t = t;
    } else {
        globalThis.I18N = api;
        globalThis.t = t;
    }
})();
