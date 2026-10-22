const screen = document.querySelector(".story-video-screen");
const video = screen.querySelector("video");
const startButton = screen.querySelector(".video-start-button");
const dialogue = screen.querySelector(".tutorial-card");

startButton.addEventListener("click", async () => {
    startButton.hidden = true;
    screen.classList.add("is-playing");
    video.muted = localStorage.getItem("mutedVideo") === "true";
    try {
        await video.play();
    } catch {
        screen.classList.remove("is-playing");
        startButton.hidden = false;
    }
});

video.addEventListener("ended", () => {
    screen.classList.remove("is-playing");
    screen.classList.add("is-ended");
    dialogue.hidden = false;
}, { once: true });
