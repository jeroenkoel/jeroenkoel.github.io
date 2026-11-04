import { filmPuzzleAssets } from "/config/film-puzzle.js";
import "../components/level-popup.js";
import { getLanguage, onLanguageChange, t, applyTranslations } from "/scripts/i18n.js";
import { isDebugMode, onSettingsChange } from "/scripts/ui-settings.js";
import { isVoiceOverPlaying, onVoiceOverChange, playVoiceOver } from "/scripts/voice-over.js";


const $ = id => document.getElementById(id);
const modal = $("levelModal");
const windowElement = $("levelWindow");
const debugOutput = $("debugOutput");
const keyframeStrip = $("keyframeStrip");
const videoStage = $("videoStage");
const video = $("levelVideo");
const countdown = $("videoCountdown");
const videoMessage = $("videoMessage");
const skipVideoButton = $("skipVideo");
const filmStartButton = $("filmStartButton");
const continueButton = $("continueToLevel");
const micIndicator = $("microphoneIndicator");
const stopRecordingButton = $("stopRecording");
const micStatus = $("microphoneStatus");
const answerGrid = $("answerGrid");
const singleAnswerView = $("singleAnswerView");
const singleAnswerFrame = $("singleAnswerFrame");
const previousAnswer = $("previousAnswer");
const nextAnswer = $("nextAnswer");
const filmPuzzleView = $("filmPuzzleView");
const filmKeyframeStrip = $("filmKeyframeStrip");
const filmAnswerSlot = $("filmAnswerSlot");
const filmAnswerOptions = $("filmAnswerOptions");
const reflectionStage = $("reflectionStage");
const reflectionFilmPreview = $("reflectionFilmPreview");
const reflectionFilmKeyframeStrip = $("reflectionFilmKeyframeStrip");
const reflectionFilmAnswerSlot = $("reflectionFilmAnswerSlot");
const levelStatus = $("levelStatus");
const progressBar = $("topBar");
const submitButton = $("submitAnswer");
const cancelButton = $("cancelChoice");
const exitButton = $("levelExitButton");
const levelPopup = document.querySelector("level-popup");
const tutorialVoiceBusy = () => levelPopup.isTutorialLevel() && !isDebugMode() && isVoiceOverPlaying();
const tutorialAnswerStep = () => {
    if (!levelPopup.isTutorialLevel()) return 2;
    if (!levelPopup.dialogue?.hidden) return 0;
    return answerSelectionMade ? 2 : 1;
};

function getActiveUserId() {
    return sessionStorage.getItem("filmBoxUserId") || "guest_user";
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const VIDEO_END_HOLD_MS = 1000;
const FILM_INSERT_DURATION_MS = 1650;
const FILM_INSERT_HOLD_MS = 1400;
const RECORDING_COMPLETE_HOLD_MS = 1250;



let activeRollNumber = null;
let activeLevel = null;
let runToken = 0;
let videoSequence = 0;
let recorder = null;
let microphoneStream = null;
let reflectionStart = null;
let reflectionDurationMs = 0;
let microphoneFallback = false;
let recordingStarting = false;
let reflectionFinishing = false;
let previewMode = false;
let reflectionAttemptCount = 0;
let microphoneStateKey = "microphone.idle";
let videoMessageState = null;
let assetsReadyFor = null;
let selectedAnswerIndex = 0;
let answerInteractionCount = 0;
let answerStartedAt = null;
let answerSubmitting = false;
let cancelRequested = false;
let currentFilmAnimation = null;
let cancelAnimationWait = null;
let answerSelectionMade = false;
let tutorialAnswer3Played = false;
let tutorialFirstAnswerIndex = null;
let tutorialHasChangedAnswer = false;
let replayInProgress = false;
let replayReturnPhase = null;
let hasReplayed = false;

function setPhase(phase) {
    windowElement.classList.remove("phase-video", "phase-reflection", "phase-answer");
    windowElement.classList.add(`phase-${phase}`);
    syncAnswerModeClass();
    updateDebugControls();
    requestAnimationFrame(updateFilmPuzzleScale);
}

function phaseIs(phase) {
    return windowElement.classList.contains(`phase-${phase}`);
}

function syncAnswerModeClass() {
    windowElement.classList.add("answer-mode-film");
    if (reflectionFilmPreview) reflectionFilmPreview.setAttribute("aria-hidden", "false");
}

function updateVideoSprocketPattern() {
    if (!videoStage || !windowElement) return;
    const stageWidth = videoStage.clientWidth || windowElement.clientWidth || 0;
    if (!stageWidth) return;

    const usableWidth = Math.max(1, stageWidth - Math.max(24, stageWidth * 0.03));
    const targetCellWidth = Math.max(54, Math.min(76, stageWidth * 0.045));
    const holeCount = Math.max(8, Math.min(25, Math.floor(usableWidth / targetCellWidth)));
    windowElement.style.setProperty("--video-hole-cell-width", `${(100 / holeCount).toFixed(5)}%`);
}

function updateFilmPuzzleScale() {
    if (!windowElement?.isConnected) return;
    const width = windowElement.clientWidth;
    const height = windowElement.clientHeight;
    if (!width || !height) return;

    updateVideoSprocketPattern();

    const keyStripAspect = 1588 / 396;
    const answerFrameAspect = 591 / 403;
    const tornBoundsOverlap = 0.548;
    const topJoinGap = Math.max(6, Math.min(8, width * 0.003));
    const horizontalSafety = Math.max(2, Math.min(5, width * 0.0025));
    const widthBased = (width - horizontalSafety * 2 - topJoinGap) /
        (keyStripAspect + answerFrameAspect - tornBoundsOverlap);
    windowElement.style.setProperty("--film-puzzle-top-gap", `${topJoinGap.toFixed(2)}px`);
    const instructionHeight = levelPopup.isTutorialLevel()
        ? Math.ceil(windowElement.querySelector(".tutorial-instruction-measure").getBoundingClientRect().height) + 24
        : 0;
    windowElement.style.setProperty("--tutorial-instruction-height", `${instructionHeight}px`);
    const heightBased = (height - instructionHeight - 6) / 2.72;
    const frameHeight = Math.max(50, Math.min(340, widthBased, heightBased));

    windowElement.style.setProperty("--film-puzzle-frame-height", `${frameHeight.toFixed(2)}px`);
    updateFilmSelectedScale();
}

function updateFilmSelectedScale() {
    if (!filmAnswerOptions || !windowElement) return;

    const width = windowElement.clientWidth || 0;
    const height = windowElement.clientHeight || 0;
    if (!width || !height) return;

    const widthFactor = Math.min(1, width / 1450);
    const heightFactor = Math.min(1, height / 880);
    const roomFactor = Math.min(widthFactor, heightFactor);
    const scale = levelPopup.isTutorialLevel()
        ? 1.35
        : Math.max(1.475, Math.min(1.65, 1.475 + roomFactor * 0.175));

    filmAnswerOptions.querySelectorAll(".film-puzzle-option").forEach(option => {
        option.style.setProperty("--film-selected-scale", scale.toFixed(3));
    });
}

window.addEventListener("resize", () => requestAnimationFrame(updateFilmPuzzleScale));

function updateReflectionContinueVisibility() {
    continueButton.hidden = reflectionFinishing || Boolean(recorder) || !(isDebugMode() || microphoneFallback);
    continueButton.disabled = continueButton.hidden || tutorialVoiceBusy();
    stopRecordingButton.hidden = !recorder || reflectionFinishing;
    stopRecordingButton.disabled = reflectionFinishing || tutorialVoiceBusy();
    reflectionStage.classList.toggle("is-finishing", reflectionFinishing);
    updateReplayAvailability();
}

export function updateReplayAvailability() {
    windowElement.querySelectorAll(".replay-fragment-button").forEach(button => {
        const tutorialLocked = button.classList.contains("tutorial-replay-locked");
        const tutorialReady = button.classList.contains("tutorial-replay-ready");
        if (tutorialLocked) {
            button.disabled = true;
        } else if (tutorialReady) {
            button.disabled = hasReplayed || replayInProgress || answerSubmitting || reflectionFinishing;
        } else {
            button.disabled = hasReplayed || answerSubmitting || reflectionFinishing || tutorialVoiceBusy();
        }
    });
}

function setMicrophoneState(key) {
    microphoneStateKey = key;
    micStatus.textContent = key === "microphone.stopped" ? "" : t(key);
    micIndicator.classList.toggle("is-recording", key === "microphone.recording");
    micIndicator.classList.toggle("is-complete", key === "microphone.stopped");
}

function setVideoMessage(key = null, params = {}) {
    videoMessageState = key ? { key, params } : null;
    videoMessage.textContent = key ? t(key, params) : "";
}

function buildKeyframes() {
    const row = keyframeStrip.querySelector(".keyframe-row");
    row.innerHTML = "";
    activeLevel.keyframes.forEach((src, index) => {
        const frame = document.createElement("div");
        frame.className = "keyframe";
        const image = document.createElement("img");
        image.src = src;
        image.alt = t("level.keyframeAlt", { number: index + 1 });
        frame.appendChild(image);
        row.appendChild(frame);
    });
}

function makeFilmFrame(answer, index) {
    const frame = document.createElement("div");
    frame.className = "answer-film-frame";

    const image = document.createElement("img");
    image.src = answer.image;
    image.alt = t(answer.altKey);
    image.width = 1448;
    image.height = 1086;
    image.decoding = "async";

    const number = document.createElement("span");
    number.className = "answer-number";
    number.textContent = String(index + 1);
    number.setAttribute("aria-hidden", "true");

    frame.append(image, number);
    return frame;
}

function makePuzzleAnswerCard(answer, index) {
    const card = document.createElement("div");
    card.className = "film-puzzle-answer-card";

    const frameArt = document.createElement("img");
    frameArt.className = "film-puzzle-answer-art";
    frameArt.src = filmPuzzleAssets.answerFrame;
    frameArt.alt = "";
    frameArt.setAttribute("aria-hidden", "true");
    frameArt.draggable = false;

    const image = document.createElement("img");
    image.className = "film-puzzle-answer-image";
    image.src = answer.image;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.draggable = false;

    const label = document.createElement("span");
    label.className = `film-puzzle-answer-label film-puzzle-answer-label-${index + 1}`;
    label.textContent = String.fromCharCode(65 + index);
    label.setAttribute("aria-hidden", "true");

    card.append(frameArt, image, label);
    return card;
}


async function replayFragment() {
    const tutorialReplayReady = levelPopup.isTutorialLevel() && phaseIs("reflection") &&
        Boolean(windowElement.querySelector(".replay-reflection.tutorial-replay-ready"));
    if (
        hasReplayed ||
        replayInProgress ||
        !activeLevel ||
        answerSubmitting ||
        reflectionFinishing ||
        (tutorialVoiceBusy() && !tutorialReplayReady) ||
        (!phaseIs("reflection") && !phaseIs("answer"))
    ) return;

    hasReplayed = true;
    windowElement.querySelectorAll(".replay-fragment-button").forEach(button => {
        updateReplayButton(button, true);
    });

    replayInProgress = true;
    const token = runToken;

    replayReturnPhase = phaseIs("reflection")
        ? "reflection"
        : "answer";
    
    console.log("Replaying from:", replayReturnPhase);

    // Switch to the original video frame
    setPhase("video");

    try {
        // Reuse the existing 3-2-1 countdown and video
        await playFilm(token, replayReturnPhase);
        if (token !== runToken || !activeLevel) return;
        
        if (replayReturnPhase === "reflection" && phaseIs("reflection") && levelPopup.isTutorialLevel()) {
            reflectionFilmPreview.classList.remove("is-whitened");
            const reflectionContent = document.getElementById("reflectionContent");

            if (reflectionContent) {
                reflectionContent.hidden = false;
            }

            playVoiceOver("../assets/sounds/voice_over/ne/step13.mp3");
        }
    } catch (error) {
        console.error("Replay failed:", error);

        if (token === runToken && activeLevel && replayReturnPhase) {
            resetVideoElement();
            setPhase(replayReturnPhase);
        }
    } finally {
        if (token === runToken) {
            replayInProgress = false;
            replayReturnPhase = null;
        }
    }
}

function updateReplayButton(button, used) {
    button.disabled = used || answerSubmitting || reflectionFinishing || tutorialVoiceBusy();

    button.innerHTML = `
        <span class="replay-icon ${used ? "crossed-out" : ""}">↻</span>
        <span>${t(used ? "replay.disabled" : "replay.button")}</span>
    `;

    button.setAttribute(
        "aria-label",
        t(used ? "replay.disabled" : "replay.button")
    );
}

function buildFilmPuzzleTopInto(keyframeContainer, slotContainer, interactiveSlot = false) {
    keyframeContainer.innerHTML = "";
    slotContainer.innerHTML = "";

    const replayClass = interactiveSlot
        ? "replay-answer"
        : "replay-reflection";

    windowElement.querySelector(`.${replayClass}`)?.remove();

    slotContainer.classList.remove("is-receiving", "is-filled");

    const stripArt = document.createElement("img");
    stripArt.className = "film-puzzle-keyframe-art";
    stripArt.src = filmPuzzleAssets.keyframeStrip;
    stripArt.alt = "";
    stripArt.setAttribute("aria-hidden", "true");
    stripArt.draggable = false;
    keyframeContainer.appendChild(stripArt);

    activeLevel.keyframes.forEach((src, index) => {
        const image = document.createElement("img");
        image.className = `film-puzzle-keyframe-image film-puzzle-keyframe-${index + 1}`;
        image.src = src;
        image.alt = t("level.keyframeAlt", { number: index + 1 });
        image.draggable = false;
        keyframeContainer.appendChild(image);
    });

    const slotArt = document.createElement("img");
    slotArt.className = "film-puzzle-slot-art";
    slotArt.src = filmPuzzleAssets.answerSlot;
    slotArt.alt = "";
    slotArt.setAttribute("aria-hidden", "true");
    slotArt.draggable = false;

    const question = document.createElement("span");
    question.className = "film-puzzle-question";
    question.textContent = "?";
    question.setAttribute("aria-hidden", "true");

    slotContainer.append(slotArt, question);
    
    const replayButton = document.createElement("button");
    replayButton.type = "button";
    replayButton.className = "primary-button replay-fragment-button";
    replayButton.classList.add(replayClass);
    replayButton.id = "replayButton";
    updateReplayButton(replayButton, hasReplayed);
    replayButton.addEventListener("click", function() {
        replayFragment();
        replayButton.classList.remove("tutorial-highlight");
    });
    if (levelPopup.isTutorialLevel() && replayClass == "replay-reflection") {
        replayButton.hidden = true;
    } 
    windowElement.appendChild(replayButton);

}

function buildFilmPuzzleTop() {
    buildFilmPuzzleTopInto(filmKeyframeStrip, filmAnswerSlot, true);
    buildFilmPuzzleTopInto(reflectionFilmKeyframeStrip, reflectionFilmAnswerSlot, false);
    requestAnimationFrame(updateFilmPuzzleScale);
}

function updateGridSelection() {
    answerGrid.querySelectorAll(".answer-option").forEach(option => {
        const isSelected = answerSelectionMade && Number(option.dataset.answerIndex) === selectedAnswerIndex;
        option.classList.toggle("is-selected", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
    });
}

function updateFilmSelection() {
    updateFilmSelectedScale();
    filmAnswerOptions.querySelectorAll(".film-puzzle-option").forEach(option => {
        const isSelected = answerSelectionMade && Number(option.dataset.answerIndex) === selectedAnswerIndex;
        option.classList.toggle("is-selected", isSelected);
        option.classList.toggle("is-dimmed", answerSelectionMade && !isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
        option.disabled = answerSubmitting || tutorialVoiceBusy() || tutorialAnswerStep() < 1;
    });
}

function updateSubmitAvailability() {
    const needsSelection = !answerSelectionMade;


    const tutorialNotReady =
    levelPopup.isTutorialLevel() &&
    (
        !isDebugMode() && (!tutorialAnswer3Played || !tutorialHasChangedAnswer)
    );
    submitButton.hidden =
        answerSubmitting ||
        needsSelection ||
        tutorialAnswerStep() < 2 ||
        tutorialNotReady;

    submitButton.disabled =
        answerSubmitting ||
        needsSelection ||
        tutorialVoiceBusy() ||
        tutorialAnswerStep() < 2 ||
        tutorialNotReady;
}

function renderFilmPuzzle() {
    buildFilmPuzzleTop();

    const instructionVisible = document.getElementById("tutorial-answer-instruction")?.classList.contains("is-visible");
    document.getElementById("tutorial-answer-instruction")?.remove();

    filmAnswerOptions.innerHTML = "";

    if (levelPopup.isTutorialLevel()) {
        const instruction = document.createElement("p");
        instruction.id = "tutorial-answer-instruction";
        instruction.className = "tutorial-text";
        instruction.classList.toggle("is-visible", Boolean(instructionVisible));
    
        instruction.dataset.i18n =
            tutorialHasChangedAnswer
                ? "helper.answer4"
                : answerSelectionMade
                    ? "helper.answer3"
                    : "helper.answer2";
    
        instruction.textContent = t(instruction.dataset.i18n);
        filmPuzzleView.appendChild(instruction);
    }

    [0, 1, 2].forEach(index => {
        const answer = activeLevel.answers[index];
        const option = document.createElement("button");
        option.type = "button";
        option.className = "film-puzzle-option";
        option.dataset.answerIndex = String(index);
        option.setAttribute("aria-label", t(answer.altKey));
        option.setAttribute("aria-pressed", "false");
        option.disabled = answerSubmitting || tutorialVoiceBusy() || tutorialAnswerStep() < 1;
        option.appendChild(makePuzzleAnswerCard(answer, index));

        option.addEventListener("click", () => {
            if (
                answerSubmitting ||
                tutorialVoiceBusy() ||
                tutorialAnswerStep() < 1 ||
                !phaseIs("answer")
            ) return;
        
            const isTutorial = levelPopup.isTutorialLevel();
            const instruction = document.getElementById("tutorial-answer-instruction");
        
            // First selection
            if (isTutorial && tutorialFirstAnswerIndex === null) {
                tutorialFirstAnswerIndex = index;
        
                selectedAnswerIndex = index;
                answerSelectionMade = true;
                answerInteractionCount++;
        
                if (instruction) {
                    instruction.dataset.i18n = "helper.answer3";
                    instruction.textContent = t("helper.answer3");
                }
        
                playVoiceOver("../assets/sounds/voice_over/ne/step16.mp3");
            } else {
                // Ignore clicking the currently selected answer again
                if (answerSelectionMade && index === selectedAnswerIndex) return;
            
                // First time changing to a different answer
                if (isTutorial && !tutorialHasChangedAnswer) {
                    tutorialHasChangedAnswer = true;
            
                    // Play helper.answer4 audio only once
                    playVoiceOver("../assets/sounds/voice_over/ne/step17.mp3");
                }
            
                selectedAnswerIndex = index;
                answerSelectionMade = true;
                answerInteractionCount++;
            
                // Display helper.answer4 on the screen
                if (isTutorial && instruction) {
                    instruction.dataset.i18n = "helper.answer4";
                    instruction.textContent = t("helper.answer4");
                }
            }
        
            updateFilmSelection();
            updateSubmitAvailability();
        });

    
        filmAnswerOptions.appendChild(option);
    });

    updateFilmSelection();

        // Deselect answer when clicking the empty white area
    filmPuzzleView.addEventListener("click", (event) => {
        // Ignore clicks on answer options and other buttons
        if (event.target.closest(".film-puzzle-option, button")) return;

        // Only allow deselection during the answer phase
        if (
            !phaseIs("answer") ||
            answerSubmitting ||
            tutorialVoiceBusy() ||
            !answerSelectionMade
        ) return;

        // Deselect the current answer
        answerSelectionMade = false;

        // Update the appearance and Confirm button
        updateFilmSelection();
        updateSubmitAvailability();
    });
}

function renderAnswers() {
    syncAnswerModeClass();
    answerGrid.hidden = true;
    singleAnswerView.hidden = true;
    filmPuzzleView.hidden = false;
    
    renderFilmPuzzle();

    updateSubmitAvailability();
    requestAnimationFrame(updateFilmPuzzleScale);
}

async function preloadLevelAssets(level) {
    if (assetsReadyFor === level) return;

    const sources = [
        ...level.keyframes,
        ...level.answers.map(answer => answer.image),
        filmPuzzleAssets.keyframeStrip,
        filmPuzzleAssets.answerFrame,
        filmPuzzleAssets.answerSlot
    ];

    await Promise.all(
        sources.map(src => new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                console.log("Afbeelding geladen:", src);
                resolve();
            };

            image.onerror = () => {
                console.error("Afbeelding kon niet worden geladen:", src);
                reject(new Error(`Afbeelding kon niet worden geladen: ${src}`));
            };

            image.src = src;
        }))
    );

    assetsReadyFor = level;
}

async function prepareLevel(token) {
    await preloadLevelAssets(activeLevel);
    if (token !== runToken) return;
    buildKeyframes();
    renderAnswers();
}

function waitForVideoResult(sequence) {
    return new Promise((resolve, reject) => {
        let frameCallback;
        const holdLastFrame = (_, frame) => {
            // The pool video ends with a black frame.
            if (frame.mediaTime >= video.duration - .1) {
                video.pause();
                ended();
            } else {
                frameCallback = video.requestVideoFrameCallback(holdLastFrame);
            }
        };
        const ended = () => cleanup(() => resolve("ended"));
        const skipped = () => cleanup(() => resolve("skipped"));
        const failed = () => cleanup(() => reject(new Error(t("video.playError"))));
        const cleanup = fn => {
            if (frameCallback !== undefined) video.cancelVideoFrameCallback(frameCallback);
            modal.removeEventListener("level-close", skipped);
            video.removeEventListener("ended", ended);
            video.removeEventListener("debug-skip", skipped);
            video.removeEventListener("error", failed);
            fn();
        };
        video.addEventListener("ended", ended, { once: true });
        video.addEventListener("debug-skip", skipped, { once: true });
        video.addEventListener("error", failed, { once: true });
        modal.addEventListener("level-close", skipped, { once: true });
        if (activeLevel.id === "tutorial") frameCallback = video.requestVideoFrameCallback(holdLastFrame);
        if (sequence !== videoSequence) cleanup(() => resolve("skipped"));
    });
}

function waitForPlayOrSkip(sequence) {
    return new Promise((resolve, reject) => {
        const played = () => cleanup(() => resolve("play"));
        const skipped = () => cleanup(() => resolve("skip"));
        const failed = () => cleanup(() => reject(new Error(t("video.playError"))));
        const cleanup = fn => {
            video.removeEventListener("play", played);
            video.removeEventListener("debug-skip", skipped);
            video.removeEventListener("error", failed);
            fn();
        };
        video.addEventListener("play", played, { once: true });
        video.addEventListener("debug-skip", skipped, { once: true });
        video.addEventListener("error", failed, { once: true });
        if (sequence !== videoSequence) cleanup(() => resolve("skip"));
    });
}

function resetVideoElement() {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.controls = false;
    filmStartButton.hidden = true;
    video.style.visibility = "visible";
    countdown.textContent = "";
}

async function playFilm(token, returnPhase = null) {
    const sequence = ++videoSequence;
    video.src = activeLevel.animation;
    video.muted = localStorage.getItem("mutedVideo") === "true";
    video.load();
    console.log("State video muted", video.muted);
    video.playbackRate = activeLevel.id === "tutorial" ? .5 : 1;
    video.controls = false;
    video.style.visibility = "hidden";
    countdown.textContent = "";
    setVideoMessage();
    updateDebugControls();

    if (!returnPhase) {
        filmStartButton.hidden = false;
        filmStartButton.disabled = tutorialVoiceBusy();

        const started = await new Promise(resolve => {
            const cleanup = () => {
                filmStartButton.removeEventListener("click", onStart);
                modal.removeEventListener("level-close", onCancel);
                video.removeEventListener("debug-skip", onCancel);
            };
            const onStart = () => {
                if (filmStartButton.disabled) return;
                cleanup();
                if (!levelPopup.dialogue.hidden) levelPopup.dialogue.close();
                resolve(true);
            };
            const onCancel = () => {
                cleanup();
                resolve(false);
            };
            filmStartButton.addEventListener("click", onStart);
            modal.addEventListener("level-close", onCancel, { once: true });
            video.addEventListener("debug-skip", onCancel, { once: true });
        });
        filmStartButton.hidden = true;
        if (!started || token !== runToken || sequence !== videoSequence || !phaseIs("video")) return;

        for (let number = 3; number >= 1; number--) {
            if (token !== runToken || sequence !== videoSequence || !phaseIs("video")) return;
            countdown.textContent = number;
            await wait(1000);
        }
    }

    if (token !== runToken || sequence !== videoSequence || !phaseIs("video")) return;
    countdown.textContent = "";
    video.style.visibility = "visible";
    const finished = waitForVideoResult(sequence);

    try {
        await video.play();
    } catch (error) {
        if (sequence !== videoSequence || !phaseIs("video")) return;
        setVideoMessage("video.autoplayError");
        video.controls = true;
        const playResult = await waitForPlayOrSkip(sequence);
        if (playResult === "skip" || sequence !== videoSequence || !phaseIs("video")) return;
        setVideoMessage();
    }

    const result = await finished;
    if (result === "skipped" || token !== runToken || sequence !== videoSequence || !phaseIs("video")) return;

    video.pause();
    await wait(activeLevel.id === "tutorial" ? 1200 : VIDEO_END_HOLD_MS);
    if (token !== runToken || sequence !== videoSequence || !phaseIs("video")) return;

    resetVideoElement();
    if (returnPhase === "reflection" || returnPhase === "answer") {
        console.log("Go back to:", replayReturnPhase);
        setPhase(returnPhase);
    } else {
        console.log("Go back to 2:", replayReturnPhase);
        showReflection(token);
    }
}

function showStageDialogue(methodName) {
    const popup = document.querySelector("level-popup");

    if (popup?.dataset.isTutorial !== "true") return;

    popup[methodName]?.();
}

function showReflection(token) {
    if (token !== runToken) return;
    ++videoSequence;
    resetVideoElement();
    setPhase("reflection");
    
    showStageDialogue("showReflectionTutorial");
    document.querySelector("#levelDialogue")?.classList.add("reflection-active");

    reflectionStart = performance.now();
    microphoneFallback = false;
    setMicrophoneState("microphone.starting");
    updateReflectionContinueVisibility();
    void startRecording(token);
}

function skipCurrentVideo() {
    if (skipVideoButton.disabled || !isDebugMode() || !phaseIs("video")) return;
    if (!levelPopup.dialogue.hidden) levelPopup.dialogue.close();

    ++videoSequence;
    video.dispatchEvent(new Event("debug-skip"));
    resetVideoElement();

    if (replayReturnPhase === "reflection" || replayReturnPhase === "answer") {
        console.log("Skipped replay → navigating to:", replayReturnPhase);
        setPhase(replayReturnPhase);
    } else {
        console.log("Skipped original video → navigating to: reflection");
        showReflection(runToken);
    }
}

function updateDebugControls() {
    skipVideoButton.hidden = !(isDebugMode() && phaseIs("video"));
    skipVideoButton.disabled = tutorialVoiceBusy();
}

export async function openLevel(level, rollNumber, { preview = false } = {}) {

    if (modal.classList.contains("is-open")) {
        if (!preview || answerSubmitting) return;
        closeLevel();
    }
    hasReplayed = false;
    replayInProgress = false;
    replayReturnPhase = null;
    previewMode = preview;

    const token = ++runToken;
    activeLevel = level;
    activeRollNumber = rollNumber;
    selectedAnswerIndex = 0;
    answerInteractionCount = 0;
    answerStartedAt = null;
    answerSubmitting = false;
    answerSelectionMade = false;
    tutorialAnswer3Played = false;
    tutorialFirstAnswerIndex = null;
    tutorialHasChangedAnswer = false;
    cancelRequested = false;
    currentFilmAnimation = null;
    cancelAnimationWait = null;
    cancelButton.hidden = true;
    submitButton.hidden = false;
    reflectionStart = null;
    reflectionDurationMs = 0;
    levelStatus.textContent = "";
    microphoneFallback = false;
    recordingStarting = false;
    reflectionFinishing = false;
    reflectionAttemptCount = 0;
    setMicrophoneState("microphone.idle");
    updateReflectionContinueVisibility();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("level-open");
    setPhase("video");
    setVideoMessage();
    showStageDialogue("showVideoTutorial");

    try {
        await prepareLevel(token);
        if (token !== runToken) return;
        await playFilm(token);
    } catch (error) {
        console.error(error);
        if (token !== runToken) return;
        videoMessage.innerHTML = "";
        const message = document.createElement("span");
        message.textContent = `${t("video.loadError", { message: error.message })} `;
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "secondary-button compact-button";
        retry.dataset.i18n = "video.continueQuestion";
        retry.dataset.icon = "→";
        retry.textContent = t("video.continueQuestion");
        retry.setAttribute("aria-label", t("video.continueQuestion"));
        retry.addEventListener("click", () => showReflection(token), { once: true });
        videoMessage.append(message, retry);
    }
}

function finishRecording({ discard = false } = {}) {
    reflectionDurationMs = reflectionStart ? Math.round(performance.now() - reflectionStart) : 0;
    if (!recorder) return;
    const current = recorder;
    recorder = null;
    if (discard) current.onstop = null;
    if (current.state !== "inactive") current.stop();
    microphoneStream?.getTracks().forEach(track => track.stop());
    microphoneStream = null;
    if (!discard) setMicrophoneState("microphone.stopped");
    updateReflectionContinueVisibility();
}

async function startRecording(token) {
    if (recordingStarting || recorder) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        microphoneFallback = true;
        setMicrophoneState("microphone.unavailable");
        updateReflectionContinueVisibility();
        return;
    }

    recordingStarting = true;
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (token !== runToken || reflectionFinishing || (!phaseIs("reflection") && replayReturnPhase !== "reflection")) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        const localChunks = [];
        const levelId = activeLevel.id;
        const rollNumber = activeRollNumber;
        const attemptIndex = ++reflectionAttemptCount;
        const attemptId = crypto.randomUUID();
        const preview = previewMode;
        const userId = getActiveUserId();
        const sessionStartedAt = sessionStorage.getItem("filmBoxSessionStartedAt");
        const startedAt = reflectionStart;
        const format = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
        const capture = new MediaRecorder(stream, format ? { mimeType: format } : {});
        microphoneStream = stream;
        recorder = capture;

        capture.ondataavailable = event => {
            if (!preview && event.data.size) localChunks.push(event.data);
        };

        capture.onstop = async () => {
            if (preview || !localChunks.length) return;
            const blob = new Blob(localChunks, { type: capture.mimeType });
            const form = new FormData();
            const ext = capture.mimeType.includes("mp4") ? "mp4" : "webm";
            form.append("metadata", JSON.stringify({
                userId,
                sessionToken: 1,
                sessionStartedAt,
                questionId: levelId,
                roll: rollNumber,
                attemptId,
                attemptIndex,
                language: getLanguage(),
                reflectionDurationMs: startedAt ? Math.round(performance.now() - startedAt) : 0
            }));
            form.append("audio", blob, `reflection-${attemptIndex}.${ext}`);

            try {
                const response = await fetch("/api/submit-audio", { method: "POST", body: form });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                console.warn("Audio upload failed", error);
            }
        };

        microphoneFallback = false;
        capture.start();
        setMicrophoneState("microphone.recording");
        updateReflectionContinueVisibility();
    } catch (error) {
        stream?.getTracks().forEach(track => track.stop());
        if (token !== runToken) return;
        recorder = null;
        microphoneStream = null;
        microphoneFallback = true;
        setMicrophoneState("microphone.denied");
        updateReflectionContinueVisibility();
        console.warn(error);
    } finally {
        if (token === runToken) recordingStarting = false;
    }
}

function showAnswers() {
    reflectionFinishing = false;
    reflectionStage.classList.remove("is-finishing");
    setPhase("answer");

    showStageDialogue("showAnswerTutorial");

    if (levelPopup.isTutorialLevel()) {
        levelPopup.dialogue.onComplete = () => {
            const instruction = document.getElementById("tutorial-answer-instruction");
        
            if (instruction) {
                instruction.classList.add("is-visible");
                playVoiceOver("../assets/sounds/voice_over/ne/step15.mp3");
            }
        
            updateFilmSelection();
            updateSubmitAvailability();
        };
    }

    answerStartedAt = performance.now();
    renderAnswers();
    updateReplayAvailability();
    progressBar?.start?.(30000, "1s");
    filmAnswerOptions.querySelector(".film-puzzle-option")?.focus();
}

stopRecordingButton.addEventListener("click", async () => {
    if (stopRecordingButton.disabled || !recorder || reflectionFinishing || !phaseIs("reflection")) return;
    const token = runToken;
    reflectionFinishing = true;
    finishRecording();
    await wait(RECORDING_COMPLETE_HOLD_MS);
    if (token === runToken) showAnswers();
});

continueButton.addEventListener("click", () => {
    if (continueButton.disabled || !phaseIs("reflection")) return;
    reflectionFinishing = true;
    reflectionDurationMs = reflectionStart ? Math.round(performance.now() - reflectionStart) : 0;
    updateReflectionContinueVisibility();
    showAnswers();
});

previousAnswer.addEventListener("click", () => {
    if (answerSubmitting || !phaseIs("answer")) return;
    selectedAnswerIndex = (selectedAnswerIndex - 1 + activeLevel.answers.length) % activeLevel.answers.length;
    answerInteractionCount += 1;
    renderAnswers();
});

nextAnswer.addEventListener("click", () => {
    if (answerSubmitting || !phaseIs("answer")) return;
    selectedAnswerIndex = (selectedAnswerIndex + 1) % activeLevel.answers.length;
    answerInteractionCount += 1;
    renderAnswers();
});

submitButton.addEventListener("click", () => {
    if (answerSubmitting || !phaseIs("answer")) return;
    if (!answerSelectionMade) return;
    answerInteractionCount += 1;
    submitSelectedAnswer();
});

cancelButton.addEventListener("click", () => {
    if (cancelButton.disabled || !answerSubmitting || cancelRequested) return;

    cancelRequested = true;

    // Stop the moving film strip
    currentFilmAnimation?.cancel();

    // Interrupt the pause after the animation
    cancelAnimationWait?.();

    // Remove the animated strip
    document.querySelectorAll(".film-puzzle-flyer")
        .forEach(element => element.remove());

    // Restore the answer selection screen
    answerSubmitting = false;
    answerSelectionMade = false;
    cancelButton.hidden = true;
    submitButton.hidden = false;

    filmAnswerSlot.classList.remove("is-filled", "is-receiving");

    renderAnswers();
});

async function animateFilmPuzzleSelection() {
    const option = filmAnswerOptions.querySelector(
        `.film-puzzle-option[data-answer-index="${selectedAnswerIndex}"]`
    );

    const card = option?.querySelector(".film-puzzle-answer-card");

    if (!option || !card || !filmAnswerSlot) return false;

    option.classList.add("is-locking");
    filmAnswerSlot.classList.add("is-receiving");

    await wait(260);

    if (cancelRequested) return false;

    const from = card.getBoundingClientRect();
    const to = filmAnswerSlot.getBoundingClientRect();

    if (!from.width || !from.height || !to.width || !to.height) {
        return false;
    }

    const flyer = card.cloneNode(true);
    flyer.classList.add("film-puzzle-flyer");

    Object.assign(flyer.style, {
        position: "fixed",
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
        margin: "0",
        zIndex: "14000",
        pointerEvents: "none",
        transformOrigin: "top left",
        boxShadow: "none",
        outline: "none",
        filter: "none",
        background: "transparent"
    });

    document.body.appendChild(flyer);
    option.style.visibility = "hidden";

    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const scaleX = to.width / from.width;
    const scaleY = to.height / from.height;

    const animation = flyer.animate([
        { transform: "translate(0, 0) scale(1, 1)" },
        {
            transform: `translate(${dx * 0.18}px, ${dy * 0.08}px) scale(1, 1)`,
            offset: 0.18
        },
        {
            transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`
        }
    ], {
        duration: FILM_INSERT_DURATION_MS,
        easing: "cubic-bezier(.22,.72,.18,1)",
        fill: "forwards"
    });

    currentFilmAnimation = animation;

    try {
        await animation.finished;
    } catch {
        // Animation was cancelled
    }

    currentFilmAnimation = null;

    if (cancelRequested) {
        flyer.remove();
        return false;
    }

    filmAnswerSlot.classList.add("is-filled");

    // Wait 2.8 seconds, but allow cancellation immediately
    await new Promise(resolve => {
        const timeout = setTimeout(() => {
            cancelAnimationWait = null;
            resolve();
        }, FILM_INSERT_HOLD_MS);

        cancelAnimationWait = () => {
            clearTimeout(timeout);
            cancelAnimationWait = null;
            resolve();
        };
    });

    flyer.remove();

    return !cancelRequested;
}

async function submitSelectedAnswer() {
    if (
        answerSubmitting ||
        tutorialVoiceBusy() ||
        tutorialAnswerStep() < 2 ||
        (
            levelPopup.isTutorialLevel() &&
            (
                !isDebugMode() && (!tutorialAnswer3Played || !tutorialHasChangedAnswer)
            )
        ) ||
        !phaseIs("answer")
        
    ) return;

    answerSubmitting = true;
    cancelRequested = false;

    // Replace Confirm with Cancel choice
    submitButton.hidden = true;
    cancelButton.hidden = false;
    cancelButton.disabled = true;

    renderAnswers();
    progressBar?.stop?.();
    const preview = previewMode;

    const selectedAnswer = activeLevel.answers[selectedAnswerIndex];
    const level = activeLevel;
    const rollNumber = activeRollNumber;
    const token = runToken;

    setTimeout(() => {
        if (token === runToken && answerSubmitting) cancelButton.disabled = false;
    }, 300);

    const completed = await animateFilmPuzzleSelection();

    // Do not save if cancelled or the level changed
    if (!completed || cancelRequested || token !== runToken) return;

    // Cancellation window has ended
    cancelButton.hidden = true;

    const correctAnswerObj = level.answers.find(
        ans => ans.correct === true
    );

    const result = {
        userId: getActiveUserId(),
        sessionToken: 1,
        levelId: level.id,
        finalAnswer: selectedAnswer.id,
        correctAnswer: correctAnswerObj ? correctAnswerObj.id : null,
        interactionCount: answerInteractionCount,
        responseTimeMs: answerStartedAt
            ? Math.round(performance.now() - answerStartedAt)
            : 0,
        correct: Boolean(selectedAnswer.correct),
        submittedAt: new Date().toISOString()
    };

    if (!preview) {
        levelStatus.textContent = t("answer.saved");
        debugOutput.textContent = JSON.stringify({...result, sessionToken: undefined}, null, 2);
        const form = new FormData();
        form.append("metadata", JSON.stringify(result));

        try {
            const response = await fetch("/api/submit-question", {method: "POST", body: form});
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.warn("Failed to submit question", error);
            levelStatus.textContent = t("answer.saveFailed");
            answerSubmitting = false;
            filmAnswerSlot.classList.remove("is-filled", "is-receiving");
            renderAnswers();
            return;
        }

        modal.dispatchEvent(new CustomEvent("level-complete", {
            detail: { rollNumber, result }
        }));
    }

    closeLevel({ completed: !preview });
}

function closeLevel({ completed = false } = {}) {
    ++runToken;
    ++videoSequence;
    modal.dispatchEvent(new Event("level-close"));
    levelPopup.dialogue.close();
    progressBar?.stop?.();
    video.dispatchEvent(new Event("debug-skip"));
    resetVideoElement();
    finishRecording({ discard: true });
    document.querySelectorAll(".film-puzzle-flyer").forEach(element => element.remove());
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("level-open");
    answerSubmitting = false;
    cancelButton.hidden = true;
    submitButton.hidden = false;
    activeRollNumber = null;
    activeLevel = null;

    if (!completed) return;

    const mainTextElement = document.getElementById('tutorial-selection-text'); 
    const startButton = document.getElementById('start-game')
    
    if (mainTextElement) {
        mainTextElement.setAttribute('data-i18n', 'tutorial.success');
        mainTextElement.textContent = t('tutorial.success');
        const audio = document.getElementById('voice-over-succes');
        playVoiceOver(audio);
    }

    if (startButton && !startButton.hasAttribute('data-keep-hidden')){
        startButton.style.display = '';
    }
}

skipVideoButton.addEventListener("click", skipCurrentVideo);

onVoiceOverChange(() => {
    if (
        levelPopup.isTutorialLevel() &&
        phaseIs("answer") &&
        answerSelectionMade &&
        !isVoiceOverPlaying()
    ) {
        tutorialAnswer3Played = true;
    }

    filmStartButton.disabled = tutorialVoiceBusy();

    // Update all buttons when voice-over starts or finishes
    updateDebugControls();
    updateReflectionContinueVisibility();
    updateReplayAvailability();

    if (activeLevel) {
        updateSubmitAvailability();
        updateFilmSelection();
    }
});

onSettingsChange(() => {
    syncAnswerModeClass();
    updateDebugControls();
    if (phaseIs("reflection")) {
        updateReflectionContinueVisibility();
        if (!levelPopup.isTutorialLevel()) buildFilmPuzzleTop();
    }
    if (phaseIs("answer") && !answerSubmitting) renderAnswers();
    requestAnimationFrame(updateFilmPuzzleScale);
});

onLanguageChange(() => {
    if (activeLevel) {
        buildKeyframes();
        for (const container of [filmKeyframeStrip, reflectionFilmKeyframeStrip]) {
            container.querySelectorAll(".film-puzzle-keyframe-image").forEach((image, index) => {
                image.alt = t("level.keyframeAlt", { number: index + 1 });
            });
        }
        windowElement.querySelectorAll(".replay-fragment-button").forEach(button => {
            updateReplayButton(button, hasReplayed);
        });
        updateReplayAvailability();
        if (phaseIs("answer") && !answerSubmitting) renderAnswers();
    }
    setMicrophoneState(microphoneStateKey);
    if (videoMessageState) setVideoMessage(videoMessageState.key, videoMessageState.params);
});

export function initLevelPopup() {
    applyTranslations(document.querySelector("level-popup"));
    setMicrophoneState("microphone.idle");
    syncAnswerModeClass();
    updateDebugControls();

    exitButton.addEventListener("click", () => {
        if (confirm(t("common.confirmExitFilmroll"))) {
            closeLevel();
        }
    });
}
