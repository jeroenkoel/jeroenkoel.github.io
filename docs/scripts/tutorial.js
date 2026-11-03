import { initI18n, t } from "/scripts/i18n.js";
import { isVoiceOverPlaying, onVoiceOverChange, playVoiceOver } from "/scripts/voice-over.js";
import "/scripts/story-video.js";
import {isDebugMode, onSettingsChange} from "/scripts/ui-settings.js";

await initI18n();

const button = document.getElementById("next-button");
const text = document.getElementById("tutorial-intro-1");
const video = document.getElementById("tutorial-video");

const updateButton = () => { button.disabled = isVoiceOverPlaying() && !isDebugMode(); };
onVoiceOverChange(updateButton);
onSettingsChange(updateButton);

function showStep() {
    text.dataset.i18n = "tutorial.intro1";
    text.textContent = t(text.dataset.i18n);
    playVoiceOver(document.getElementById("voice-over-1"));
}

video.addEventListener("ended", showStep, { once: true });
button.addEventListener("click", () => {
    if (button.disabled) return;
    switchScene("level-selection-tutorial.html?playAudio=true");
});
