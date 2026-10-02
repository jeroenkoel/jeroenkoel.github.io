import { intention01 } from "/levels/intention-01.js";
import { getLanguage, initI18n, onLanguageChange, t } from "/scripts/i18n.js";
import { getAnswerMode, isDebugMode, onSettingsChange } from "/scripts/ui-settings.js";

await initI18n();

const $ = id => document.getElementById(id);
const modal = $("levelModal");
const windowElement = $("levelWindow");
const debugOutput = $("debugOutput");
const keyframeStrip = $("keyframeStrip");
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
const submitButton = $("submitAnswer");
const levelStatus = $("levelStatus");
const rolls = document.querySelectorAll(".film-roll");
const storedRolls = $("storedRolls");
const progressBar = $("topBar");

const sessionId = sessionStorage.getItem("filmBoxSessionId") || crypto.randomUUID();
sessionStorage.setItem("filmBoxSessionId", sessionId);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let activeRoll = null;
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
let assetsReady = false;
let selectedAnswerIndex = 0;
let answerInteractionCount = 0;
let answerStartedAt = null;
let answerSubmitting = false;
let gridSelectionMade = false;

function setPhase(phase) {
    windowElement.classList.remove("phase-video", "phase-reflection", "phase-answer");
    windowElement.classList.add(`phase-${phase}`);
    updateDebugControls();
}

function phaseIs(phase) {
    return windowElement.classList.contains(`phase-${phase}`);
}

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

function updateRollLabels() {
    rolls.forEach(roll => {
        roll.setAttribute("aria-label", t("selection.openRollAria", { number: roll.dataset.rollNumber }));
    });
    storedRolls.querySelectorAll(".stored-roll").forEach(image => {
        image.alt = t("selection.storedRollAlt");
    });
}

function buildKeyframes() {
    const row = keyframeStrip.querySelector(".keyframe-row");
    row.innerHTML = "";
    intention01.keyframes.forEach((src, index) => {
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
    image.width = 1672;
    image.height = 941;
    image.decoding = "async";

    const number = document.createElement("span");
    number.className = "answer-number";
    number.textContent = String(index + 1);
    number.setAttribute("aria-hidden", "true");

    frame.append(image, number);
    return frame;
}

function updateGridSelection() {
    answerGrid.querySelectorAll(".answer-option").forEach(option => {
        const isSelected = gridSelectionMade && Number(option.dataset.answerIndex) === selectedAnswerIndex;
        option.classList.toggle("is-selected", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
    });
}

function updateSubmitAvailability() {
    const needsGridSelection = getAnswerMode() === "grid" && !gridSelectionMade;
    submitButton.disabled = answerSubmitting || needsGridSelection;
}

function renderAnswers() {
    const mode = getAnswerMode();
    answerGrid.hidden = mode !== "grid";
    singleAnswerView.hidden = mode !== "single";

    if (mode === "grid") {
        answerGrid.innerHTML = "";
        intention01.answers.forEach((answer, index) => {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "answer-option";
            option.dataset.answerIndex = String(index);
            option.setAttribute("aria-label", t(answer.altKey));
            option.setAttribute("aria-pressed", "false");
            option.disabled = answerSubmitting;
            option.appendChild(makeFilmFrame(answer, index));

            const selectedIndicator = document.createElement("span");
            selectedIndicator.className = "answer-selected-indicator";
            selectedIndicator.textContent = "✓";
            selectedIndicator.setAttribute("aria-hidden", "true");
            option.appendChild(selectedIndicator);

            option.addEventListener("click", () => {
                if (answerSubmitting || !phaseIs("answer")) return;
                selectedAnswerIndex = index;
                gridSelectionMade = true;
                answerInteractionCount += 1;
                updateGridSelection();
                updateSubmitAvailability();
            });
            answerGrid.appendChild(option);
        });
        updateGridSelection();
    } else {
        const answer = intention01.answers[selectedAnswerIndex];
        singleAnswerFrame.innerHTML = "";
        singleAnswerFrame.appendChild(makeFilmFrame(answer, selectedAnswerIndex));
        previousAnswer.disabled = answerSubmitting;
        nextAnswer.disabled = answerSubmitting;
    }

    updateSubmitAvailability();
}

async function preloadLevelAssets() {
    if (assetsReady) return;
    const sources = [
        ...intention01.keyframes,
        ...intention01.answers.map(answer => answer.image)
    ];
    await Promise.all(sources.map(src => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = () => reject(new Error(t("level.assetLoadError")));
        image.src = src;
    })));
    assetsReady = true;
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
    video.src = intention01.animation;
    video.load();
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
    await wait(2000);
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

async function openLevel(roll) {
    if (modal.classList.contains("is-open") || roll.classList.contains("completed")) return;

    const token = ++runToken;
    activeRoll = roll;
    selectedAnswerIndex = 0;
    answerInteractionCount = 0;
    answerStartedAt = null;
    answerSubmitting = false;
    gridSelectionMade = false;
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
                userId: sessionId,
                sessionId,
                questionId: `${intention01.id}-${activeRoll?.dataset.rollNumber || "roll"}`,
                roll: activeRoll?.dataset.rollNumber,
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

    if (getAnswerMode() === "single") submitButton.focus();
    else answerGrid.querySelector(".answer-option")?.focus();
});

previousAnswer.addEventListener("click", () => {
    if (answerSubmitting || !phaseIs("answer")) return;
    selectedAnswerIndex = (selectedAnswerIndex - 1 + intention01.answers.length) % intention01.answers.length;
    answerInteractionCount += 1;
    renderAnswers();
});

nextAnswer.addEventListener("click", () => {
    if (answerSubmitting || !phaseIs("answer")) return;
    selectedAnswerIndex = (selectedAnswerIndex + 1) % intention01.answers.length;
    answerInteractionCount += 1;
    renderAnswers();
});

submitButton.addEventListener("click", () => {
    if (answerSubmitting || !phaseIs("answer")) return;
    if (getAnswerMode() === "grid" && !gridSelectionMade) return;
    answerInteractionCount += 1;
    submitSelectedAnswer();
});

async function submitSelectedAnswer() {
    if (answerSubmitting || !phaseIs("answer")) return;
    answerSubmitting = true;
    renderAnswers();
    progressBar?.stop?.();

    const selectedAnswer = intention01.answers[selectedAnswerIndex];
    const result = {
        userId: sessionId,
        sessionId,
        levelId: intention01.id,
        finalAnswer: selectedAnswer.id,
        selectedAnswerId: selectedAnswer.id,
        answerMode: getAnswerMode(),
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

    try {
        const response = await fetch("/api/submit-question", { method: "POST", body: form });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        console.warn("Failed to submit question", error);
    }

    if (activeRoll && !activeRoll.classList.contains("completed")) {
        const image = document.createElement("img");
        image.src = activeRoll.querySelector("img").src;
        image.alt = t("selection.storedRollAlt");
        image.className = "stored-roll";
        storedRolls.appendChild(image);
        activeRoll.classList.add("completed");
    }

    closeLevel();
}

function closeLevel() {
    ++runToken;
    ++videoSequence;
    progressBar?.stop?.();
    resetVideoElement();
    finishRecording();
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("level-open");
    answerSubmitting = false;
}

rolls.forEach(roll => roll.addEventListener("click", () => openLevel(roll)));
skipVideoButton.addEventListener("click", skipCurrentVideo);

onSettingsChange(({ debugMode, answerMode }) => {
    updateDebugControls();
    if (phaseIs("reflection")) updateReflectionContinueVisibility();
    if (phaseIs("answer")) renderAnswers();
});

onLanguageChange(() => {
    updateRollLabels();
    buildKeyframes();
    if (phaseIs("answer")) renderAnswers();
    setMicrophoneState(microphoneStateKey);
    if (videoMessageState) setVideoMessage(videoMessageState.key, videoMessageState.params);
});

updateRollLabels();
setMicrophoneState("microphone.idle");
updateDebugControls();
