import { playVoiceOver } from "/scripts/voice-over.js";
const screen = document.querySelector(".story-video-screen");
const video = screen.querySelector("video");
const startButton = screen.querySelector(".video-start-button");
const dialogue = screen.querySelector(".tutorial-card");

async function startVideo() {
    if (startButton) startButton.hidden = true;
    screen.classList.add("is-playing");
    video.muted = localStorage.getItem("mutedVideo") === "true";
    try {
        await video.play();
    } catch (error) {
        screen.classList.remove("is-playing");
        if (startButton) startButton.hidden = false;
        else console.error("Unable to start video.", error);
    }
}

startButton?.addEventListener("click", startVideo);
if (document.body.classList.contains("ending-page")) startVideo();

video.addEventListener("ended", () => {
    screen.classList.remove("is-playing");
    screen.classList.add("is-ended");
    dialogue.hidden = false;
    const endingAudio = document.getElementById("voice-over-end");
    if (endingAudio) playVoiceOver(endingAudio);
}, { once: true });
