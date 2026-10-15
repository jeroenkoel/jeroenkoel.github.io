import { filmPuzzleAssets } from "/config/film-puzzle.js";
import "/components/level-popup.js";
import { getLanguage, onLanguageChange, t, applyTranslations } from "/scripts/i18n.js";
import { isDebugMode, onSettingsChange } from "/scripts/ui-settings.js";


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
const continueButton = $("continueToLevel");
const micButton = $("microphoneButton");
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
const reflectionFilmPreview = $("reflectionFilmPreview");
const reflectionFilmKeyframeStrip = $("reflectionFilmKeyframeStrip");
const reflectionFilmAnswerSlot = $("reflectionFilmAnswerSlot");
const submitButton = $("submitAnswer");
const levelStatus = $("levelStatus");
const progressBar = $("topBar");

function getActiveUserId() {
    return sessionStorage.getItem("filmBoxUserId") || "guest_user";
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const VIDEO_END_HOLD_MS = 2800;
const FILM_INSERT_DURATION_MS = 1650;
const FILM_INSERT_HOLD_MS = 2800;
const ANSWER_LOOP_DELAY_MS = 650;
const FILM_ANSWER_END_HOLD_MS = 1300;



let activeRollNumber = null;
let activeLevel = null;
let runToken = 0;
let videoSequence = 0;
let recorder = null;
let microphoneStream = null;
let reflectionStart = null;
let reflectionDurationMs = 0;
let hasRecordedReflection = false;
let microphoneFallback = false;
let reflectionAttemptCount = 0;
let microphoneStateKey = "microphone.idle";
let videoMessageState = null;
let assetsReadyFor = null;
let selectedAnswerIndex = 0;
let answerInteractionCount = 0;
let answerStartedAt = null;
let answerSubmitting = false;
let answerSelectionMade = false;
const answerPlayback = new WeakMap();

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
    const heightBased = (height - 6) / 2.72;
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
    const scale = Math.max(1.15, Math.min(1.24, 1.15 + roomFactor * 0.09));

    filmAnswerOptions.querySelectorAll(".film-puzzle-option").forEach(option => {
        option.style.setProperty("--film-selected-scale", scale.toFixed(3));
    });
}

window.addEventListener("resize", () => requestAnimationFrame(updateFilmPuzzleScale));

function updateReflectionContinueVisibility() {
    const canContinue = isDebugMode() || hasRecordedReflection || microphoneFallback;
    const isRecording = Boolean(recorder);
    continueButton.hidden = !canContinue || isRecording;
    continueButton.disabled = !canContinue || isRecording;
}

function setMicrophoneState(key) {
    microphoneStateKey = key;
    micStatus.textContent = t(key);
    const isRecording = key === "microphone.recording";
    micButton.setAttribute("aria-label", t(isRecording ? "microphone.stopAria" : "microphone.startAria"));
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

function stopAnswerVideo(video) {
    clearTimeout(answerPlayback.get(video)?.timer);
    answerPlayback.delete(video);
    video.pause();
    video.classList.remove("is-playing");
    video.currentTime = 0;
}

function startAnswerVideo(video) {
    if (answerPlayback.has(video)) return;
    const state = { timer: null };
    answerPlayback.set(video, state);
    video.currentTime = 0;
    void video.play().then(() => {
        if (answerPlayback.get(video) === state) video.classList.add("is-playing");
    }, () => {
        if (answerPlayback.get(video) === state) stopAnswerVideo(video);
    });
}

function syncAnswerVideo(option) {
    const video = option.querySelector(".film-puzzle-answer-video");
    if (!video) return;
    const isSelected = answerSelectionMade && Number(option.dataset.answerIndex) === selectedAnswerIndex;
    if (!answerSubmitting && (isSelected || option.matches(":hover"))) startAnswerVideo(video);
    else stopAnswerVideo(video);
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

    card.append(frameArt, image);
    if (answer.animation) {
        const clip = document.createElement("video");
        clip.className = "film-puzzle-answer-image film-puzzle-answer-video";
        clip.src = answer.animation;
        clip.defaultMuted = true;
        clip.muted = true;
        clip.playsInline = true;
        clip.preload = "metadata";
        clip.addEventListener("ended", () => {
            const state = answerPlayback.get(clip);
            if (!state) return;
            state.timer = setTimeout(() => {
                if (answerPlayback.get(clip) !== state) return;
                clip.currentTime = 0;
                void clip.play().catch(() => {
                    if (answerPlayback.get(clip) === state) stopAnswerVideo(clip);
                });
            }, ANSWER_LOOP_DELAY_MS);
        });
        card.appendChild(clip);
    }
    card.appendChild(label);
    return card;
}

function buildFilmPuzzleTopInto(keyframeContainer, slotContainer, interactiveSlot = false) {
    keyframeContainer.innerHTML = "";
    slotContainer.innerHTML = "";
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
    if (!interactiveSlot) slotContainer.classList.add("is-preview-slot");
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
        option.disabled = answerSubmitting;
        syncAnswerVideo(option);
    });
}

function updateSubmitAvailability() {
    const needsSelection = !answerSelectionMade;
    submitButton.disabled = answerSubmitting || needsSelection;
}

function renderFilmPuzzle() {
    buildFilmPuzzleTop();
    filmAnswerOptions.querySelectorAll(".film-puzzle-answer-video").forEach(stopAnswerVideo);
    filmAnswerOptions.innerHTML = "";

    activeLevel.answers.forEach((answer, index) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "film-puzzle-option";
        option.dataset.answerIndex = String(index);
        option.setAttribute("aria-label", t(answer.altKey));
        option.setAttribute("aria-pressed", "false");
        option.disabled = answerSubmitting;
        option.appendChild(makePuzzleAnswerCard(answer, index));
        option.addEventListener("pointerenter", () => syncAnswerVideo(option));
        option.addEventListener("pointerleave", () => syncAnswerVideo(option));

        option.addEventListener("click", () => {
            if (answerSubmitting || !phaseIs("answer")) return;
            selectedAnswerIndex = index;
            answerSelectionMade = true;
            answerInteractionCount += 1;
            updateFilmSelection();
            updateSubmitAvailability();
        });
        filmAnswerOptions.appendChild(option);
    });

    updateFilmSelection();
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

async function preloadLevelAssets() {
    if (assetsReadyFor === activeLevel) return;
    const sources = [
        ...activeLevel.keyframes,
        ...activeLevel.answers.map(answer => answer.image),
        filmPuzzleAssets.keyframeStrip,
        filmPuzzleAssets.answerFrame,
        filmPuzzleAssets.answerSlot
    ];
    await Promise.all(sources.map(src => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = () => reject(new Error(t("level.assetLoadError")));
        image.src = src;
    })));
    assetsReadyFor = activeLevel;
}

async function prepareLevel() {
    await preloadLevelAssets();
    buildKeyframes();
    renderAnswers();
}

function waitForVideoResult(sequence) {
    return new Promise((resolve, reject) => {
        const ended = () => cleanup(() => resolve("ended"));
        const skipped = () => cleanup(() => resolve("skipped"));
        const failed = () => cleanup(() => reject(new Error(t("video.playError"))));
        const cleanup = fn => {
            video.removeEventListener("ended", ended);
            video.removeEventListener("debug-skip", skipped);
            video.removeEventListener("error", failed);
            fn();
        };
        video.addEventListener("ended", ended, { once: true });
        video.addEventListener("debug-skip", skipped, { once: true });
        video.addEventListener("error", failed, { once: true });
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
    video.style.visibility = "visible";
    countdown.textContent = "";
}

async function playFilm(token) {
    const sequence = ++videoSequence;
    video.src = activeLevel.animation;
    video.muted = localStorage.getItem("mutedVideo") === "true";
    video.load();
    console.log("State video muted", video.muted);
    video.controls = false;
    video.style.visibility = "hidden";
    countdown.textContent = "";
    setVideoMessage();
    updateDebugControls();

    for (let number = 3; number >= 1; number--) {
        if (token !== runToken || sequence !== videoSequence || !phaseIs("video")) return;
        countdown.textContent = number;
        await wait(1000);
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
    await wait(VIDEO_END_HOLD_MS);
    if (token !== runToken || sequence !== videoSequence || !phaseIs("video")) return;
    resetVideoElement();
    showReflection(token);
}

function showReflection(token) {
    if (token !== runToken) return;
    ++videoSequence;
    resetVideoElement();
    setPhase("reflection");
    reflectionStart = performance.now();
    hasRecordedReflection = false;
    microphoneFallback = false;
    micButton.classList.remove("is-recording");
    setMicrophoneState("microphone.idle");
    updateReflectionContinueVisibility();
}

function skipCurrentVideo() {
    if (!isDebugMode() || !phaseIs("video")) return;
    ++videoSequence;
    video.dispatchEvent(new Event("debug-skip"));
    resetVideoElement();
    showReflection(runToken);
}

function updateDebugControls() {
    skipVideoButton.hidden = !(isDebugMode() && phaseIs("video"));
}

export async function openLevel(level, rollNumber) {
    if (modal.classList.contains("is-open")) return;

    const token = ++runToken;
    activeLevel = level;
    activeRollNumber = rollNumber;
    selectedAnswerIndex = 0;
    answerInteractionCount = 0;
    answerStartedAt = null;
    answerSubmitting = false;
    answerSelectionMade = false;
    reflectionStart = null;
    reflectionDurationMs = 0;
    levelStatus.textContent = "";
    hasRecordedReflection = false;
    microphoneFallback = false;
    reflectionAttemptCount = 0;
    updateReflectionContinueVisibility();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("level-open");
    setPhase("video");
    setVideoMessage();

    try {
        await prepareLevel();
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

async function finishRecording() {
    if (!recorder) return false;
    const current = recorder;
    recorder = null;
    if (current.state !== "inactive") current.stop();
    microphoneStream?.getTracks().forEach(track => track.stop());
    microphoneStream = null;
    micButton.classList.remove("is-recording");
    if (phaseIs("reflection")) {
        hasRecordedReflection = true;
        microphoneFallback = false;
        setMicrophoneState("microphone.stopped");
        updateReflectionContinueVisibility();
    }
    return true;
}

micButton.addEventListener("click", async () => {
    if (recorder) {
        await finishRecording();
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        microphoneFallback = true;
        setMicrophoneState("microphone.unavailable");
        updateReflectionContinueVisibility();
        return;
    }

    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!phaseIs("reflection")) {
            microphoneStream.getTracks().forEach(track => track.stop());
            microphoneStream = null;
            return;
        }

        const localChunks = [];
        const levelId = activeLevel.id;
        const rollNumber = activeRollNumber;
        const attemptIndex = ++reflectionAttemptCount;
        const attemptId = crypto.randomUUID();
        const format = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
        recorder = new MediaRecorder(microphoneStream, format ? { mimeType: format } : {});
        const capture = recorder;

        capture.ondataavailable = event => {
            if (event.data.size) localChunks.push(event.data);
        };

        capture.onstop = async () => {
            if (!localChunks.length) return;
            const blob = new Blob(localChunks, { type: capture.mimeType });
            const form = new FormData();
            const ext = capture.mimeType.includes("mp4") ? "mp4" : "webm";
            form.append("metadata", JSON.stringify({
                userId: getActiveUserId(),
                questionId: levelId,
                roll: rollNumber,
                attemptId,
                attemptIndex,
                language: getLanguage(),
                reflectionDurationMs: reflectionStart ? Math.round(performance.now() - reflectionStart) : 0
            }));
            form.append("audio", blob, `reflection-${attemptIndex}.${ext}`);

            try {
                const response = await fetch("/api/submit-audio", { method: "POST", body: form });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                console.warn("Audio upload failed", error);
            }
        };

        hasRecordedReflection = false;
        microphoneFallback = false;
        capture.start();
        micButton.classList.add("is-recording");
        setMicrophoneState("microphone.recording");
        updateReflectionContinueVisibility();
    } catch (error) {
        microphoneFallback = true;
        setMicrophoneState("microphone.denied");
        updateReflectionContinueVisibility();
        console.warn(error);
    }
});

continueButton.addEventListener("click", async () => {
    if (continueButton.disabled) return;
    await finishRecording();
    reflectionDurationMs = reflectionStart ? Math.round(performance.now() - reflectionStart) : 0;
    setPhase("answer");
    answerStartedAt = performance.now();
    renderAnswers();
    progressBar?.start?.(30000, "1s");

    filmAnswerOptions.querySelector(".film-puzzle-option")?.focus();
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

async function animateFilmPuzzleSelection() {
    const option = filmAnswerOptions.querySelector(`.film-puzzle-option[data-answer-index="${selectedAnswerIndex}"]`);
    const card = option?.querySelector(".film-puzzle-answer-card");
    if (!option || !card || !filmAnswerSlot) return;

    option.classList.add("is-locking");
    filmAnswerSlot.classList.add("is-receiving");
    await wait(260);

    const from = card.getBoundingClientRect();
    const to = filmAnswerSlot.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height) return;

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
        { transform: `translate(${dx * 0.18}px, ${dy * 0.08}px) scale(1, 1)`, offset: 0.18 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})` }
    ], {
        duration: FILM_INSERT_DURATION_MS,
        easing: "cubic-bezier(.22,.72,.18,1)",
        fill: "forwards"
    });

    try {
        await animation.finished;
    } catch {
    }

    filmAnswerSlot.classList.add("is-filled");
    const clip = flyer.querySelector(".film-puzzle-answer-video");
    if (clip) {
        const ended = new Promise((resolve, reject) => {
            clip.addEventListener("ended", resolve, { once: true });
            clip.addEventListener("error", reject, { once: true });
        });
        try {
            clip.currentTime = 0;
            await clip.play();
            clip.classList.add("is-playing");
            await ended;
            await wait(FILM_ANSWER_END_HOLD_MS);
        } catch {
            await wait(FILM_INSERT_HOLD_MS);
        }
    } else {
        await wait(FILM_INSERT_HOLD_MS);
    }
    flyer.remove();
}

async function submitSelectedAnswer() {
    if (answerSubmitting || !phaseIs("answer")) return;
    const modeAtSubmission = "film";
    answerSubmitting = true;
    renderAnswers();
    progressBar?.stop?.();

    const selectedAnswer = activeLevel.answers[selectedAnswerIndex];

    const correctAnswerObj = activeLevel.answers.find(ans => ans.correct === true);

    const levelCategory = activeLevel.category || "Cognitive";
    const result = {
        userId: getActiveUserId(),
        levelId: activeLevel.id,
        category: levelCategory,
        finalAnswer: selectedAnswer.id,
        correctAnswer: correctAnswerObj ? correctAnswerObj.id : null,
        selectedAnswerId: selectedAnswer.id,
        answerMode: modeAtSubmission,
        interactionCount: answerInteractionCount,
        responseTimeMs: answerStartedAt ? Math.round(performance.now() - answerStartedAt) : 0,
        reflectionTimeMs: reflectionDurationMs,
        correct: Boolean(selectedAnswer.correct),
        language: getLanguage(),
        submittedAt: new Date().toISOString()
    };

    levelStatus.textContent = t("answer.saved");
    debugOutput.textContent = JSON.stringify(result, null, 2);

    const form = new FormData();
    form.append("metadata", JSON.stringify(result));

    fetch("/api/submit-question", { method: "POST", body: form })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        })
        .catch(error => console.warn("Failed to submit question", error));

    if (modeAtSubmission === "film") {
        await animateFilmPuzzleSelection();
    }

    modal.dispatchEvent(new CustomEvent("level-complete", {
        detail: { rollNumber: activeRollNumber, result }
    }));

    closeLevel();
}

function closeLevel() {
    ++runToken;
    ++videoSequence;
    progressBar?.stop?.();
    resetVideoElement();
    finishRecording();
    document.querySelectorAll(".film-puzzle-flyer").forEach(element => element.remove());
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("level-open");
    answerSubmitting = false;
    activeRollNumber = null;
    activeLevel = null;

    const mainTextElement = document.getElementById('tutorial-selection-text'); 
    
    if (mainTextElement) {
        // Pas de i18n-sleutel aan en zet direct de vertaalde tekst neer
        mainTextElement.setAttribute('data-i18n', 'tutorial.success');
        mainTextElement.textContent = t('tutorial.success');
    }

    const startButton = document.getElementById('start-game')
    if (startButton){
        startButton.style.display = '';

    }
}

skipVideoButton.addEventListener("click", skipCurrentVideo);

onSettingsChange(() => {
    syncAnswerModeClass();
    updateDebugControls();
    if (phaseIs("reflection")) {
        updateReflectionContinueVisibility();
        buildFilmPuzzleTop();
    }
    if (phaseIs("answer") && !answerSubmitting) renderAnswers();
    requestAnimationFrame(updateFilmPuzzleScale);
});

onLanguageChange(() => {
    if (activeLevel) {
        buildKeyframes();
        buildFilmPuzzleTop();
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
}
