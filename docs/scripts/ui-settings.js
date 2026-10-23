import { initI18n, onLanguageChange, t, toggleLanguage } from "/scripts/i18n.js";
import { tutorialLevel, normalLevels } from "/config/levels.js";

const DEBUG_KEY = "filmBoxDebugMode";
const settingsListeners = new Set();
const SHOW_DEBUG_UI = true;

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
    for (const listener of settingsListeners) listener({ debugMode });
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
    for (const [id, storage, mutedKey, soundKey] of [
        ["musicSwitch", "mutedVideo", "settings.unmuteVideo", "settings.muteVideo"],
        ["audioSwitch", "mutedButton", "settings.unmuteButtons", "settings.muteButtons"]
    ]) {
        const button = document.getElementById(id);
        if (!button) continue;
        const label = t(localStorage.getItem(storage) === "true" ? mutedKey : soundKey);
        button.setAttribute("aria-label", label);
        button.title = label;
    }
    const languageButton = document.getElementById("languageSwitch");
    if (languageButton) {
        languageButton.innerHTML = "";
        const flagImg = document.createElement("img");
        flagImg.src = t("settings.languageFlag");
        flagImg.alt = "";
        flagImg.className = "language-flag-icon";
        flagImg.width = "28";

        languageButton.appendChild(flagImg);
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
    const levelShortcuts = document.getElementById("debugLevels");
    if (levelShortcuts) levelShortcuts.hidden = !debugMode;

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

    // Inject styling sheet for UI elements
    if (!document.getElementById("ui-layer-style")) {
        const link = document.createElement("link");
        link.id = "ui-layer-style";
        link.rel = "stylesheet";
        link.href = "/styles/ui-styles.css";
        document.head.appendChild(link);
    }

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
        updateControls();
    });

    const audioButton = document.createElement("button");
    audioButton.id = "audioSwitch";
    audioButton.className = "permanent-control-button";
    audioButton.type = "button";
    audioButton.addEventListener("click", () => {
        window.toggleMuteButton();
        updateControls();
    });

    const hintButton = document.getElementById("rollHintButton");
    if (hintButton) {
        hintButton.classList.replace("secondary-button", "permanent-control-button");
    }

    if (hintButton) permanentControls.appendChild(hintButton);
    permanentControls.append(audioButton, musicButton, languageButton);
    document.body.appendChild(permanentControls);
    window.updateAudioUI();

    if (SHOW_DEBUG_UI) {
        const dock = document.createElement("div");
        dock.className = "utility-dock";
        dock.setAttribute("role", "group");

        const levelShortcuts = document.createElement("div");
        levelShortcuts.id = "debugLevels";
        levelShortcuts.className = "debug-levels";
        [tutorialLevel, ...normalLevels].forEach(level => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "debug-level-button";
            button.textContent = level.id === "tutorial" ? "T" : `${level.id[0].toUpperCase()}${Number(level.id.split("-")[1])}`;
            button.title = level.id;
            button.addEventListener("click", () => {
                if (!debugMode) return;
                if (document.querySelector("level-popup")) {
                    document.dispatchEvent(new CustomEvent("preview-level", { detail: { level } }));
                } else {
                    window.location.href = `/level-selection.html?preview=${level.id}`;
                }
            });
            levelShortcuts.appendChild(button);
        });
        dock.appendChild(levelShortcuts);

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
