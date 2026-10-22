import { initI18n, onLanguageChange, t } from "/scripts/i18n.js";
import { initLevelPopup, openLevel } from "/scripts/level-popup.js";
import { tutorialLevel, normalLevels } from "/config/levels.js";
import { isDebugMode } from "/scripts/ui-settings.js";
import { isVoiceOverPlaying, onVoiceOverChange, playVoiceOver } from "/scripts/voice-over.js";

await initI18n();

const rolls = document.querySelectorAll(".film-roll");
const levelModal = document.getElementById("levelModal");
const stage = document.querySelector(".room-stage");
const scenes = [...document.querySelectorAll(".room-scene")];
const title = document.querySelector(".room-header h1");
const hintButton = document.getElementById("rollHintButton");
const CLEAN_ROOM_ANIMATION_MS = 3000;
const HINT_IDLE_MS = 15000;
const HINT_ANIMATION_MS = 2800;
const isTutorial = Boolean(document.querySelector("level-popup[data-is-tutorial]"));
const urlParams = new URLSearchParams(window.location.search);


let sceneIndex = 0;
let nextLevelIndex = 0;
let idleTimer = null;
let hintTimer = null;
let hintedRoll = null;
let collectedRolls = isTutorial ? 0 : 1;

function updateFilmBox(animate = false) {
    const filmBox = (isTutorial ? stage : scenes[sceneIndex]).querySelector(".film-box");
    const filmBoxImage = filmBox.querySelector("img");
    filmBox.classList.toggle("is-empty", collectedRolls === 0);
    filmBox.setAttribute("aria-label", t("selection.filmBoxAria", { count: collectedRolls }));
    const src = `/assets/film-box/film-box-${String(collectedRolls).padStart(2, "0")}.png`;
    if (filmBoxImage.getAttribute("src") !== src) filmBoxImage.src = src;
    if (animate) {
        filmBoxImage.decode().then(() => {
            filmBox.classList.remove("is-collecting");
            void filmBox.offsetWidth;
            filmBox.classList.add("is-collecting");
        }).catch(console.warn);
    }
}

stage.addEventListener("animationend", event => {
    if (event.animationName === "film-box-collect") event.target.classList.remove("is-collecting");
});

function availableRolls() {
    const source = isTutorial ? stage : scenes[sceneIndex];
    return [...source.querySelectorAll(".film-roll:not(:disabled):not(.completed)")]
        .sort((a, b) => Number(a.dataset.rollNumber) - Number(b.dataset.rollNumber));
}

function canHint() {
    return document.visibilityState === "visible" && !levelModal.classList.contains("is-open") && availableRolls().length > 0;
}

function updateHintButton() {
    hintButton.hidden = levelModal.classList.contains("is-open") || availableRolls().length === 0;
    hintButton.disabled = Boolean(hintedRoll) || !canHint();
}

function stopHint() {
    clearTimeout(hintTimer);
    hintedRoll?.classList.remove("hinting");
    hintedRoll = null;
    updateHintButton();
}

function scheduleIdleHint() {
    clearTimeout(idleTimer);
    updateHintButton();
    if (!hintedRoll && canHint()) idleTimer = setTimeout(playHint, HINT_IDLE_MS);
}

function playHint() {
    if (hintedRoll || !canHint()) return;
    clearTimeout(idleTimer);
    hintedRoll = availableRolls()[0];
    hintedRoll.classList.add("hinting");
    updateHintButton();
    hintTimer = setTimeout(() => {
        stopHint();
        scheduleIdleHint();
    }, HINT_ANIMATION_MS);
}


if (isTutorial) {
    onVoiceOverChange(() => {
        const busy = isVoiceOverPlaying();
        rolls.forEach(roll => { roll.disabled = busy; });
        document.getElementById("start-game").disabled = busy;
        scheduleIdleHint();
    });
    if (urlParams.get("playAudio") === "true") playVoiceOver(document.getElementById("voice-over-5"));
}

function showScene(index) {
    stopHint();
    sceneIndex = index;
    scenes.forEach((scene, position) => {
        scene.hidden = position !== index;
        scene.style.display = position === index ? "block" : "none";
    });
    stage.className = `room-stage ${scenes[index].dataset.room}-room-stage`;
    stage.dataset.i18nAriaLabel = scenes[index].dataset.roomAria;
    title.dataset.i18n = index === scenes.length - 1 ? "selection.endingTitle" : "selection.title";
    updateRollLabels();
    scheduleIdleHint();
}

function updateRollLabels() {
    stage.setAttribute("aria-label", t(stage.dataset.i18nAriaLabel));
    title.textContent = t(title.dataset.i18n);
    rolls.forEach(roll => {
        roll.setAttribute("aria-label", t("selection.openRollAria", { number: roll.dataset.rollNumber }));
    });

    updateFilmBox();
}

function animateCleanRoom(scene, nextSceneIndex) {
    const sparkles = document.createElement("div");
    sparkles.className = "room-sparkles";
    sparkles.setAttribute("aria-hidden", "true");
    [[23, 34], [69, 25], [43, 57], [81, 65], [29, 79], [62, 82]].forEach(([left, top], index) => {
        const sparkle = document.createElement("span");
        sparkle.className = "room-sparkle";
        sparkle.style.left = `${left}%`;
        sparkle.style.top = `${top}%`;
        sparkle.style.animationDelay = `${index * .35}s`;
        sparkle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 0l3.2 8.8L24 12l-8.8 3.2L12 24l-3.2-8.8L0 12l8.8-3.2Z"/></svg>';
        sparkles.appendChild(sparkle);
    });
    scene.appendChild(sparkles);
    setTimeout(() => sparkles.remove(), CLEAN_ROOM_ANIMATION_MS);
    setTimeout(() => {
        if (nextLevelIndex >= normalLevels.length) {
            switchScene("ending.html");
            return;
        }
        showScene(nextSceneIndex);
    }, CLEAN_ROOM_ANIMATION_MS + 1000);
}

function completeRoll(rollNumber) {
    if (isTutorial) {
        const roll = [...rolls].find(candidate => candidate.dataset.rollNumber === String(rollNumber));
        roll?.classList.add("completed");
        collectedRolls = 1;
        updateFilmBox(true);
        scheduleIdleHint();
        return;
    }

    const scene = scenes[sceneIndex];
    const roll = [...scene.querySelectorAll(".film-roll")].find(candidate => candidate.dataset.rollNumber === String(rollNumber));
    if (!roll || roll.classList.contains("completed")) return;

    roll.classList.add("completed");
    if (scene.dataset.room === "couch" && roll.classList.contains("roll-5")) {
        scene.querySelector(".layer-carpet-front").src = "/assets/rooms/couch-room/trimmed/carpet-straight.png";
        scene.querySelector(".layer-carpet-back").hidden = true;
    }
    nextLevelIndex++;
    collectedRolls++;
    updateFilmBox(true);
    scheduleIdleHint();

    if (!scene.querySelector(".film-roll:not(.completed)")) {
        title.dataset.i18n = "selection.cleanedTitle";
        stage.dataset.i18nAriaLabel = "selection.cleanedRoomAria";
        updateRollLabels();
        animateCleanRoom(scene, sceneIndex + 1);
    }
}

rolls.forEach(roll => {
    roll.addEventListener("click", () => {
        if (roll.disabled || roll.classList.contains("completed")) return;
        clearTimeout(idleTimer);
        stopHint();
        playButtonSound();
        const level = isTutorial ? tutorialLevel : normalLevels[nextLevelIndex];
        if (level) openLevel(level, roll.dataset.rollNumber);
    });
});

hintButton.addEventListener("click", playHint);
stage.addEventListener("pointermove", scheduleIdleHint, { passive: true });
document.addEventListener("keydown", scheduleIdleHint);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        clearTimeout(idleTimer);
        stopHint();
    } else scheduleIdleHint();
});
new MutationObserver(() => {
    if (levelModal.classList.contains("is-open")) {
        clearTimeout(idleTimer);
        stopHint();
    } else scheduleIdleHint();
}).observe(levelModal, { attributes: true, attributeFilter: ["class"] });

levelModal.addEventListener("level-complete", event => completeRoll(event.detail.rollNumber));
onLanguageChange(updateRollLabels);
document.addEventListener("preview-level", event => {
    if (isDebugMode()) openLevel(event.detail.level, null, { preview: true });
});

if (isTutorial) {
    updateRollLabels();
    scheduleIdleHint();
}
else showScene(0);
initLevelPopup();

const previewLevel = [tutorialLevel, ...normalLevels].find(level => level.id === urlParams.get("preview"));
if (isDebugMode() && previewLevel) openLevel(previewLevel, null, { preview: true });
