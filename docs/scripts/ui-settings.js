import { initI18n, onLanguageChange, t, toggleLanguage } from "/scripts/i18n.js";

const DEBUG_KEY = "filmBoxDebugMode";
const ANSWER_MODE_KEY = "filmBoxAnswerMode";
const settingsListeners = new Set();

let debugMode = localStorage.getItem(DEBUG_KEY) === "true";
let answerMode = localStorage.getItem(ANSWER_MODE_KEY) === "single" ? "single" : "grid";
let mounted = false;

export function isDebugMode() {
    return debugMode;
}

export function getAnswerMode() {
    return answerMode;
}

export function setDebugMode(value) {
    const next = Boolean(value);
    if (next === debugMode) return;
    debugMode = next;
    localStorage.setItem(DEBUG_KEY, String(debugMode));
    notifySettingsChange();
}

export function setAnswerMode(value) {
    const next = value === "single" ? "single" : "grid";
    if (next === answerMode) return;
    answerMode = next;
    localStorage.setItem(ANSWER_MODE_KEY, answerMode);
    notifySettingsChange();
}

export function onSettingsChange(listener) {
    settingsListeners.add(listener);
    return () => settingsListeners.delete(listener);
}

function notifySettingsChange() {
    for (const listener of settingsListeners) listener({ debugMode, answerMode });
    updateControls();
}

function makeSwitch(id, checked, ariaLabel) {
    const label = document.createElement("label");
    label.className = "utility-switch";
    label.htmlFor = id;

    const input = document.createElement("input");
    input.id = id;
    input.type = "checkbox";
    input.setAttribute("role", "switch");
    input.checked = checked;
    input.setAttribute("aria-label", ariaLabel);

    const track = document.createElement("span");
    track.className = "utility-switch-track";
    track.setAttribute("aria-hidden", "true");

    label.append(input, track);
    return { label, input };
}

function updateControls() {
    const languageButton = document.getElementById("languageSwitch");
    if (languageButton) {
        languageButton.textContent = t("settings.languageFlag");
        languageButton.setAttribute("aria-label", t("settings.switchLanguage"));
        languageButton.title = t("settings.switchLanguage");
    }

    const debugLabel = document.querySelector("[data-utility-label='debug']");
    if (debugLabel) debugLabel.textContent = t("settings.debug");
    const debugInput = document.getElementById("debugModeSwitch");
    if (debugInput) {
        debugInput.checked = debugMode;
        debugInput.setAttribute("aria-label", t("settings.debugDescription"));
    }

    const answerLabel = document.querySelector("[data-utility-label='answer-mode']");
    if (answerLabel) answerLabel.textContent = t("settings.answerMode");
    const answerInput = document.getElementById("answerModeSwitch");
    if (answerInput) {
        answerInput.checked = answerMode === "single";
        answerInput.setAttribute(
            "aria-label",
            `${t("settings.answerMode")}: ${answerMode === "single" ? t("settings.answerModeSingle") : t("settings.answerModeGrid")}`
        );
    }
    const modeValue = document.querySelector("[data-answer-mode-value]");
    if (modeValue) {
        modeValue.textContent = answerMode === "single" ? t("settings.answerModeSingle") : t("settings.answerModeGrid");
    }
}

async function mountPersistentControls() {
    if (mounted) return;
    mounted = true;
    await initI18n();

    const languageButton = document.createElement("button");
    languageButton.id = "languageSwitch";
    languageButton.className = "language-switch";
    languageButton.type = "button";
    languageButton.addEventListener("click", toggleLanguage);
    document.body.appendChild(languageButton);

    const dock = document.createElement("div");
    dock.className = "utility-dock";
    dock.setAttribute("role", "group");

    const debugGroup = document.createElement("div");
    debugGroup.className = "utility-control";
    const debugText = document.createElement("span");
    debugText.dataset.utilityLabel = "debug";
    const debugSwitch = makeSwitch("debugModeSwitch", debugMode, t("settings.debugDescription"));
    debugSwitch.input.addEventListener("change", event => setDebugMode(event.target.checked));
    debugGroup.append(debugText, debugSwitch.label);
    dock.appendChild(debugGroup);

    const separator = document.createElement("span");
    separator.className = "utility-separator";
    separator.setAttribute("aria-hidden", "true");
    dock.appendChild(separator);

    const answerGroup = document.createElement("div");
    answerGroup.className = "utility-control answer-mode-control";
    const answerText = document.createElement("span");
    answerText.dataset.utilityLabel = "answer-mode";
    const answerSwitch = makeSwitch("answerModeSwitch", answerMode === "single", t("settings.answerMode"));
    answerSwitch.input.addEventListener("change", event => setAnswerMode(event.target.checked ? "single" : "grid"));
    const answerValue = document.createElement("span");
    answerValue.className = "utility-value";
    answerValue.dataset.answerModeValue = "";
    answerGroup.append(answerText, answerSwitch.label, answerValue);
    dock.appendChild(answerGroup);

    document.body.appendChild(dock);
    updateControls();
    onLanguageChange(updateControls);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountPersistentControls, { once: true });
} else {
    mountPersistentControls();
}
