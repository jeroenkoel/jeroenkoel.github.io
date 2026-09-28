import { intention01 } from "/levels/intention-01.js";
import { LevelEngine } from "/scripts/level/level-engine.js";

const $ = id => document.getElementById(id);
const modal = $("levelModal"), windowElement = $("levelWindow");
const scene = $("levelScene"), controls = $("levelControls"), status = $("levelStatus");
const submitButton = $("submitAnswer"), debugOutput = $("debugOutput");
const keyframes = $("keyframeStrip"), video = $("levelVideo");
const countdown = $("videoCountdown"), videoMessage = $("videoMessage");
const reflectionCountdown = $("reflectionCountdown"), continueButton = $("continueToLevel");
const micButton = $("microphoneButton"), micStatus = $("microphoneStatus");
const rolls = document.querySelectorAll(".film-roll"), storedRolls = $("storedRolls");
const sessionId = sessionStorage.getItem("filmBoxSessionId") || crypto.randomUUID();
sessionStorage.setItem("filmBoxSessionId", sessionId);
let engine, activeRoll, runToken = 0, recorder = null, microphoneStream = null;
let audioChunks = [], reflectionStart = null;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const REFLECTION_SECONDS = 5;

function setPhase(phase) {
    windowElement.classList.remove("phase-video", "phase-reflection", "phase-configuration");
    windowElement.classList.add(`phase-${phase}`);
}

async function loadLevel() {
    const response = await fetch("/config/admin-config.json", {cache: "no-store"});
    if (!response.ok) throw new Error("De niveau-instellingen konden niet worden geladen.");
    const config = (await response.json()).levels[intention01.id];
    if (!config) throw new Error("De niveau-instellingen ontbreken.");
    engine = new LevelEngine({sceneElement:scene, controlsElement:controls,
        statusElement:status, keyframesElement:keyframes});
    await engine.load(intention01, config);
}

function endedOrError(token) {
    return new Promise((resolve, reject) => {
        const ended = () => cleanup(resolve);
        const failed = () => cleanup(() => reject(new Error("De video kon niet worden afgespeeld.")));
        const cleanup = fn => {
            video.removeEventListener("ended", ended);
            video.removeEventListener("error", failed);
            fn();
        };
        video.addEventListener("ended", ended, {once:true});
        video.addEventListener("error", failed, {once:true});
        if (token !== runToken) cleanup(resolve);
    });
}

async function playFilm(token) {
    video.src = intention01.animation;
    video.load();
    video.style.visibility = "hidden";
    videoMessage.textContent = "";
    countdown.textContent = "";
    // Black opening frame and the full countdown, then reveal/play video.
    for (let number = 3; number >= 1; number--) {
        if (token !== runToken) return;
        countdown.textContent = number;
        await wait(1000);
    }
    if (token !== runToken) return;
    countdown.textContent = "";
    video.style.visibility = "visible";
    const finished = endedOrError(token);
    try {
        await video.play();
    } catch (error) {
        videoMessage.textContent = "De video kon niet automatisch starten. Klik op de video om af te spelen.";
        video.controls = true;
        await new Promise((resolve, reject) => {
            video.addEventListener("play", resolve, {once:true});
            video.addEventListener("error", reject, {once:true});
        });
        videoMessage.textContent = "";
    }
    await finished;
    if (token !== runToken) return;
    // The actual last frame remains visible, unchanged, for two seconds.
    video.pause();
    await wait(2000);
    if (token !== runToken) return;
    video.removeAttribute("src"); video.load(); video.controls = false;
    showReflection(token);
}

function showReflection(token) {
    setPhase("reflection");
    reflectionStart = performance.now();
    continueButton.disabled = true;
    micStatus.textContent = "Klik op de microfoon om uw antwoord op te nemen.";
    for (let remaining = REFLECTION_SECONDS; remaining > 0; remaining--) {
        setTimeout(() => {
            if (token !== runToken || !windowElement.classList.contains("phase-reflection")) return;
            reflectionCountdown.textContent = `Verder over ${remaining} s`;
        }, (REFLECTION_SECONDS - remaining) * 1000);
    }
    setTimeout(() => {
        if (token !== runToken || !windowElement.classList.contains("phase-reflection")) return;
        reflectionCountdown.textContent = "";
        continueButton.disabled = false;
    }, REFLECTION_SECONDS * 1000);
}

async function openLevel(roll) {
    if (modal.classList.contains("is-open") || roll.classList.contains("completed")) return;
    const token = ++runToken;
    activeRoll = roll;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("level-open");
    setPhase("video");
    submitButton.disabled = true;
    videoMessage.textContent = "";
    try {
        await loadLevel();
        if (token !== runToken) return;
        submitButton.disabled = false;
        await playFilm(token);
    } catch (error) {
        console.error(error);
        videoMessage.textContent = `Het fragment kon niet worden geladen: ${error.message}`;
        videoMessage.innerHTML = "";
        const message = document.createElement("span"); message.textContent = `Het fragment kon niet worden geladen: ${error.message} `;
        const retry = document.createElement("button"); retry.type = "button"; retry.textContent = "Verder naar de vraag";
        retry.addEventListener("click", () => showReflection(token), {once:true});
        videoMessage.append(message, retry);
    }
}

async function finishRecording() {
    if (!recorder) return;
    const current = recorder;
    recorder = null;
    if (current.state !== "inactive") current.stop();
    microphoneStream?.getTracks().forEach(track => track.stop());
    microphoneStream = null;
    micButton.classList.remove("is-recording");
    micButton.setAttribute("aria-label", "Start geluidsopname");
    micStatus.textContent = "Opname gestopt.";
}

micButton.addEventListener("click", async () => {
    if (recorder) { await finishRecording(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        micStatus.textContent = "Opnemen is niet beschikbaar in deze browser."; return;
    }
    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({audio:true});
        if (!windowElement.classList.contains("phase-reflection")) {
            microphoneStream.getTracks().forEach(t => t.stop()); return;
        }
        audioChunks = [];
        const format = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
        recorder = new MediaRecorder(microphoneStream, format ? {mimeType:format} : {});
        const capture = recorder;
        capture.ondataavailable = event => { if (event.data.size) audioChunks.push(event.data); };
        capture.onstop = async () => {
            if (!audioChunks.length) return;
            const blob = new Blob(audioChunks, {type:capture.mimeType});
            const form = new FormData();
            const ext = capture.mimeType.includes("mp4") ? "mp4" : "webm";
            form.append("metadata", JSON.stringify({userId:sessionId,sessionId,
                questionId:`${intention01.id}-${activeRoll?.classList[1] || "roll"}`,roll:activeRoll?.className,reflectionDurationMs:Math.round(performance.now()-reflectionStart)}));
            form.append("audio", blob, `reflection.${ext}`);
            try {
                const response = await fetch("/api/submit-audio", {method:"POST",body:form});
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
            } catch (error) { console.warn("Audio upload failed", error); }
        };
        capture.start();
        micButton.classList.add("is-recording");
        micButton.setAttribute("aria-label", "Stop geluidsopname");
        micStatus.textContent = "Wij nemen u nu op … Klik opnieuw om te stoppen.";
    } catch (error) {
        micStatus.textContent = "Geen toegang tot de microfoon. U kunt wel verdergaan.";
        console.warn(error);
    }
});

continueButton.addEventListener("click", async () => {
    if (continueButton.disabled) return;
    await finishRecording();
    setPhase("configuration");
    engine.startedAt = performance.now(); // Time only the configurable answer stage.
    submitButton.focus();
});

function closeLevel() {
    ++runToken;
    video.pause(); video.removeAttribute("src"); video.load();
    finishRecording();
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("level-open");
}
rolls.forEach(roll => roll.addEventListener("click", () => openLevel(roll)));
submitButton.addEventListener("click", async () => {
    if (!engine || submitButton.disabled || !windowElement.classList.contains("phase-configuration")) return;
    const result = engine.submit();
    result.userId = sessionId;
    result.sessionId = sessionId;
    result.reflectionTimeMs = Math.round(performance.now() - reflectionStart);
    debugOutput.textContent = JSON.stringify(result, null, 2);

    const form = new FormData();
    form.append("metadata", JSON.stringify(result));

    try { 
        const response = await fetch("/api/submit-question", { method: "POST", body: form });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) { console.warn("Failed to submit question", error); }
    if (activeRoll && !activeRoll.classList.contains("completed")) {
        const image = document.createElement("img");
        image.src = activeRoll.querySelector("img").src;
        image.alt = "Opgeruimde filmrol";
        image.className = "stored-roll";
        storedRolls.appendChild(image);
        activeRoll.classList.add("completed");
    }
    closeLevel();
});
