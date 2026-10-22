import { initI18n, t } from "/scripts/i18n.js";
import { isVoiceOverPlaying, onVoiceOverChange, playVoiceOver } from "/scripts/voice-over.js";
import "/scripts/story-video.js";

await initI18n();

const button = document.getElementById("next-button");
const text = document.getElementById("tutorial-intro-1");
const video = document.getElementById("tutorial-video");
let step = 1;

onVoiceOverChange(() => {
    button.disabled = isVoiceOverPlaying();
});

function showStep() {
    text.dataset.i18n = `tutorial.intro${step}`;
    text.textContent = t(text.dataset.i18n);
    playVoiceOver(document.getElementById(`voice-over-${step}`));
}

video.addEventListener("ended", showStep, { once: true });
button.addEventListener("click", () => {
    if (button.disabled) return;
    if (++step > 4) {
        switchScene("level-selection-tutorial.html?playAudio=true");
    } else {
        showStep();
    }
});
