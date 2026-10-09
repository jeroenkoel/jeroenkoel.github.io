import { initI18n, onLanguageChange, t } from "/scripts/i18n.js";
import { initLevelPopup, openLevel } from "/scripts/level-popup.js";

await initI18n();

const rolls = document.querySelectorAll(".film-roll");
const storedRolls = document.getElementById("storedRolls");
const levelModal = document.getElementById("levelModal");
const stage = document.querySelector(".room-stage");
const scenes = [...document.querySelectorAll(".room-scene")];
const title = document.querySelector(".room-header h1");
const CLEAN_ROOM_HOLD_MS = 3000;

let sceneIndex = 0;

function showScene(index) {
    sceneIndex = index;
    scenes.forEach((scene, position) => {
        scene.hidden = position !== index;
        scene.style.display = position === index ? "block" : "none";
    });
    stage.className = `room-stage ${scenes[index].dataset.room}-room-stage`;
    stage.dataset.i18nAriaLabel = scenes[index].dataset.roomAria;
    title.dataset.i18n = index === scenes.length - 1 ? "selection.endingTitle" : "selection.title";
    updateRollLabels();
}

function updateRollLabels() {
    stage.setAttribute("aria-label", t(stage.dataset.i18nAriaLabel));
    title.textContent = t(title.dataset.i18n);
    rolls.forEach(roll => {
        roll.setAttribute("aria-label", t("selection.openRollAria", { number: roll.dataset.rollNumber }));
    });

    storedRolls.querySelectorAll(".stored-roll").forEach(image => {
        image.alt = t("selection.storedRollAlt");
    });
}

function completeRoll(rollNumber) {
    const scene = scenes[sceneIndex];
    const roll = [...scene.querySelectorAll(".film-roll")].find(candidate => candidate.dataset.rollNumber === String(rollNumber));
    if (!roll || roll.classList.contains("completed")) return;

    const image = document.createElement("img");
    image.src = roll.querySelector("img").src;
    image.alt = t("selection.storedRollAlt");
    image.className = "stored-roll";
    storedRolls.appendChild(image);
    roll.classList.add("completed");

    if (!scene.querySelector(".film-roll:not(.completed)")) {
        title.dataset.i18n = "selection.cleanedTitle";
        stage.dataset.i18nAriaLabel = "selection.cleanedRoomAria";
        updateRollLabels();
        const nextSceneIndex = sceneIndex + 1;
        setTimeout(() => showScene(nextSceneIndex), CLEAN_ROOM_HOLD_MS);
    }
}

rolls.forEach(roll => {
    roll.addEventListener("click", () => {
        if (roll.classList.contains("completed")) return;
        playButtonSound();
        openLevel(roll.dataset.rollNumber);
    });
});

levelModal.addEventListener("level-complete", event => completeRoll(event.detail.rollNumber));
onLanguageChange(updateRollLabels);

showScene(0);
initLevelPopup();
