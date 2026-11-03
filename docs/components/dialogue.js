import { t } from "/scripts/i18n.js";
import {isDebugMode, onSettingsChange} from "/scripts/ui-settings.js";
import { isVoiceOverPlaying, onVoiceOverChange, playVoiceOver, stopVoiceOver } from "/scripts/voice-over.js";

class DialogueCard extends HTMLElement {
    connectedCallback() {
        if (this.firstElementChild) return;
        this.innerHTML = `
            <div class="tutorial-card">
                <p class="dialogue-text tutorial-text"></p>
                <button class="primary-button dialogue-next" type="button"></button>
            </div>
        `;
        this.dialogueText = this.querySelector(".dialogue-text");
        this.nextButton = this.querySelector(".dialogue-next");
        this.nextButton.addEventListener("click", () => this.next());
        const updateNext = () => { this.nextButton.disabled = isVoiceOverPlaying() && !isDebugMode(); };
        onVoiceOverChange(updateNext);
        onSettingsChange(updateNext);
        this.hidden = true;
    }

    start(messages, onComplete = null) {
        this.messages = messages;
        this.currentIndex = 0;
        this.onComplete = onComplete;
        this.hidden = false;
        this.showMessage();
    }

    showMessage() {
        const message = this.messages[this.currentIndex];
        this.dialogueText.dataset.i18n = message.key;
        this.dialogueText.textContent = t(message.key);
        const last = this.currentIndex === this.messages.length - 1 && !message.continueButton;
        this.nextButton.dataset.i18n = last ? "common.close" : "tutorial.continue";
        this.nextButton.textContent = t(this.nextButton.dataset.i18n);
        this.nextButton.dataset.icon = last ? "✕" : "→";
        this.nextButton.classList.toggle("danger-button", last);
        this.nextButton.hidden = Boolean(message.noButton);
        message.onShow?.();
        playVoiceOver(message.audio);
    }

    next() {
        if (this.nextButton.disabled || this.nextButton.hidden) return;
        if (++this.currentIndex < this.messages.length) this.showMessage();
        else this.close();
    }

    close() {
        this.hidden = true;
        stopVoiceOver();
        const callback = this.onComplete;
        this.onComplete = null;
        callback?.();
    }
}

customElements.define("dialogue-card", DialogueCard);
