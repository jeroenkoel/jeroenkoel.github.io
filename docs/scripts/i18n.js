const LANGUAGE_STORAGE_KEY = "filmBoxLanguage";
const DEFAULT_LANGUAGE = "nl";
const SUPPORTED_LANGUAGES = new Set(["nl", "en"]);

let language = SUPPORTED_LANGUAGES.has(localStorage.getItem(LANGUAGE_STORAGE_KEY))
    ? localStorage.getItem(LANGUAGE_STORAGE_KEY)
    : DEFAULT_LANGUAGE;
let translations = null;
let loadPromise = null;
const listeners = new Set();

export async function initI18n() {
    if (!loadPromise) {
        loadPromise = fetch("/config/texts.json", { cache: "no-store" })
            .then(response => {
                if (!response.ok) throw new Error(`Could not load translations (HTTP ${response.status}).`);
                return response.json();
            })
            .then(data => {
                translations = data;
                document.documentElement.lang = language;
                applyTranslations();
                return data;
            });
    }
    return loadPromise;
}

export function getLanguage() {
    return language;
}

export function t(key, params = {}) {
    const value = translations?.[language]?.[key]
        ?? translations?.[DEFAULT_LANGUAGE]?.[key]
        ?? key;

    return String(value).replace(/\{(\w+)\}/g, (_, name) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`
    );
}

export function applyTranslations(root = document) {
    if (!translations) return;

    root.querySelectorAll("[data-i18n]").forEach(element => {
        element.textContent = t(element.dataset.i18n);
    });

    const translatedAttributes = [
        ["i18nAriaLabel", "aria-label"],
        ["i18nTitle", "title"],
        ["i18nPlaceholder", "placeholder"]
    ];

    for (const [datasetKey, attribute] of translatedAttributes) {
        root.querySelectorAll(`[data-${datasetKey.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}]`).forEach(element => {
            element.setAttribute(attribute, t(element.dataset[datasetKey]));
        });
    }

    const titleKey = document.body?.dataset.i18nDocumentTitle;
    if (titleKey) document.title = t(titleKey);
}

export function setLanguage(nextLanguage) {
    if (!SUPPORTED_LANGUAGES.has(nextLanguage) || nextLanguage === language) return;
    language = nextLanguage;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    applyTranslations();
    for (const listener of listeners) listener(language);
}

export function toggleLanguage() {
    setLanguage(language === "nl" ? "en" : "nl");
}

export function onLanguageChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
