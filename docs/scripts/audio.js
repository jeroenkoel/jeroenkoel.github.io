// ===============================
// AUDIO STATE
// ===============================

// false = sound ON
// true  = sound OFF
let mutedVideo = localStorage.getItem("mutedVideo") === "true";
let mutedButton = localStorage.getItem("mutedButton") === "true";


// ===============================
// VIDEO AUDIO
// ===============================

function setMuteVideo(muted) {
    mutedVideo = muted;

    localStorage.setItem("mutedVideo", String(mutedVideo));

    // Immediately update videos that are currently on the page
    document.querySelectorAll("video").forEach(video => {
        video.muted = mutedVideo;
    });

    updateAudioUI();
}

function toggleMuteVideo() {
    setMuteVideo(!mutedVideo);
}


// ===============================
// BUTTON AUDIO
// ===============================

function setMuteButton(muted) {
    mutedButton = muted;

    localStorage.setItem("mutedButton", String(mutedButton));

    updateAudioUI();
}

function toggleMuteButton() {
    setMuteButton(!mutedButton);
}


// ===============================
// BUTTON SOUND
// ===============================

const audioContext = new AudioContext();
let buttonSoundBuffer;

fetch("/assets/sounds/buttonsound.mp3")
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(buffer => {
        buttonSoundBuffer = buffer;
        console.log("Button sound loaded");
    });

async function playButtonSound() {

    if (mutedButton) {
        return;
    }

    if (!buttonSoundBuffer) {
        return;
    }

    if (audioContext.state === "suspended") {
        await audioContext.resume();
    }

    const source = audioContext.createBufferSource();

    source.buffer = buttonSoundBuffer;
    source.connect(audioContext.destination);
    source.start();
}


// ===============================
// UPDATE ALL AUDIO CONTROLS
// ===============================

function updateAudioUI() {

    // Administrator toggles
    const videoToggle = document.getElementById("videoAudioToggle");
    const buttonToggle = document.getElementById("buttonAudioToggle");

    if (videoToggle) {
        videoToggle.checked = !mutedVideo;
    }

    if (buttonToggle) {
        buttonToggle.checked = !mutedButton;
    }


    // Permanent top-right buttons
    const videoButton = document.getElementById("musicSwitch");
    const buttonSoundButton = document.getElementById("audioSwitch");

    if (videoButton) {
        videoButton.textContent = mutedVideo ? "🔇" : "🔊";
    }

    if (buttonSoundButton) {
        buttonSoundButton.textContent = mutedButton ? "🔕" : "🔔";
    }
}


// ===============================
// INITIALISE PAGE
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    const videoToggle = document.getElementById("videoAudioToggle");
    const buttonToggle = document.getElementById("buttonAudioToggle");

    if (videoToggle) {
        videoToggle.addEventListener("change", () => {
            setMuteVideo(!videoToggle.checked);
        });
    }

    if (buttonToggle) {
        buttonToggle.addEventListener("change", () => {
            setMuteButton(!buttonToggle.checked);
        });
    }

    document.querySelectorAll("video").forEach(video => {
        video.muted = mutedVideo;
    });

    updateAudioUI();
});
// Make audio functions available to other scripts
window.toggleMuteVideo = toggleMuteVideo;
window.toggleMuteButton = toggleMuteButton;
window.updateAudioUI = updateAudioUI;
window.playButtonSound = playButtonSound;