import { getLanguage, initI18n, onLanguageChange, t } from "/scripts/i18n.js";

await initI18n();

let mediaRecorder;
let audioChunks = [];
let recordedAudioBlob = null;
let listening = false;
let statusKey = "test.statusInactive";

const startStop = document.getElementById("startStop");
const recordStatus = document.getElementById("recordStatus");
const logOutput = document.getElementById("logOutput");

function renderRecordingState() {
    const buttonKey = listening ? "test.recordStop" : "test.recordStart";
    recordStatus.textContent = t(statusKey);
    startStop.textContent = t(buttonKey);
    startStop.dataset.icon = listening ? "■" : "🎙";
    startStop.setAttribute("aria-label", t(buttonKey));
    recordStatus.className = listening ? "recording" : "";
}

onLanguageChange(renderRecordingState);
renderRecordingState();

document.addEventListener("DOMContentLoaded", async () => {
    await customElements.whenDefined("timer-circular-progress");
    document.getElementById("circle")?.start(1000, 4, "0.5s");
});

let mimeType = "audio/webm";
if (MediaRecorder.isTypeSupported("audio/wav")) {
    mimeType = "audio/wav";
} else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    mimeType = "audio/webm;codecs=opus";
}

startStop.addEventListener("click", async () => {
    if (listening) {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            statusKey = "test.statusFinished";
            listening = false;
            renderRecordingState();
        }
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            recordedAudioBlob = new Blob(audioChunks, { type: "audio/webm" });
            await sendAudioData();
        };

        mediaRecorder.start();
        statusKey = "test.statusRecording";
        listening = true;
        renderRecordingState();
    } catch (error) {
        alert(t("test.microphoneError"));
        console.error(error);
    }
});

let tabSessionId = sessionStorage.getItem("sessionId");
if (!tabSessionId) {
    tabSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("sessionId", tabSessionId);
}

let questionStartTime = Date.now();
const gameDataLog = {
    sessionId: tabSessionId,
    answers: []
};

document.querySelectorAll(".answerBtn").forEach(button => {
    button.addEventListener("click", event => {
        const chosenAnswer = event.target.getAttribute("data-answer");
        const timeTakenMs = Date.now() - questionStartTime;
        const entry = {
            question: document.getElementById("QuestionText").textContent,
            chosenAnswer,
            timeTakenMs,
            timeTakenSeconds: (timeTakenMs / 1000).toFixed(2),
            timestamp: new Date().toISOString()
        };

        gameDataLog.answers.push(entry);
        logOutput.textContent = JSON.stringify(gameDataLog, null, 2);
        questionStartTime = Date.now();
    });
});

async function sendAudioData() {
    if (!recordedAudioBlob) return;

    const formData = new FormData();
    const extension = mimeType.includes("wav") ? ".wav" : ".webm";
    const metadata = {
        userId: "test_user",
        sessionId: tabSessionId,
        questionId: "test_q1",
        language: getLanguage()
    };

    formData.append("metadata", JSON.stringify(metadata));
    formData.append("audio", recordedAudioBlob, `recording${extension}`);

    try {
        const response = await fetch("/api/submit-audio", { method: "POST", body: formData });
        const result = await response.json();
        console.log("Server response:", result.message);
    } catch (error) {
        console.error("Error sending audio data to server:", error);
    }
}
