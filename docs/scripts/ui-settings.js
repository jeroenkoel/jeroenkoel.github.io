import { initI18n, onLanguageChange, t, toggleLanguage } from "/scripts/i18n.js";

const DEBUG_KEY = "filmBoxDebugMode";
const settingsListeners = new Set();
const SHOW_DEBUG_UI = Boolean(window.__FILM_BOX_CONFIG__?.showDebugUi);

let debugMode = SHOW_DEBUG_UI && localStorage.getItem(DEBUG_KEY) === "true";
let mounted = false;

export function isDebugMode() {
    return debugMode;
}

export function setDebugMode(value) {
    const next = Boolean(value);
    if (next === debugMode) return;
    debugMode = next;
    localStorage.setItem(DEBUG_KEY, String(debugMode));
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

    document.querySelectorAll("[data-answer-mode]").forEach(button => {
        const mode = button.dataset.answerMode;
        const active = mode === answerMode;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
        button.textContent = answerModeLabel(mode);
        button.setAttribute("aria-label", `${t("settings.answerMode")}: ${answerModeLabel(mode)}`);
    });
}

async function mountPersistentControls() {
    if (mounted) return;
    mounted = true;
    await initI18n();

    //make one container that has all controls
    const permanentControls = document.createElement("div");
    permanentControls.className = "permanent-controls";

    const languageButton = document.createElement("button");
    languageButton.id = "languageSwitch";
    languageButton.className = "permanent-control-button";
    languageButton.type = "button";
    languageButton.addEventListener("click", toggleLanguage);

    const musicButton = document.createElement("button");
    musicButton.id = "musicSwitch";
    musicButton.className = "permanent-control-button";
    musicButton.type = "button";
    musicButton.addEventListener("click", () => {
        window.toggleMuteVideo();
    });

    const audioButton = document.createElement("button");
    audioButton.id = "audioSwitch";
    audioButton.className = "permanent-control-button";
    audioButton.type = "button";
    audioButton.addEventListener("click", () => {
        window.toggleMuteButton();
    });

    permanentControls.append(
        audioButton,
        musicButton,
        languageButton
    );
    document.body.appendChild(permanentControls);
    window.updateAudioUI();

    if (SHOW_DEBUG_UI) {
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

        document.body.appendChild(dock);
    }
    updateControls();
    onLanguageChange(updateControls);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountPersistentControls, { once: true });
} else {
    mountPersistentControls();
}
