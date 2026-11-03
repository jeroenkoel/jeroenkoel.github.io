import { applyTranslations, initI18n } from "/scripts/i18n.js";
import "./dialogue.js"
import {updateReplayAvailability} from "/scripts/level-popup.js"
import { playVoiceOver } from "/scripts/voice-over.js";
const $ = id => document.getElementById(id);
const windowElement = $("levelWindow");

function applyFilmBorderStyle() {
    const style = localStorage.getItem("filmBorderStyle") || "polygon";

    document.documentElement.classList.toggle(
        "film-border-polygon",
        style === "polygon"
    );
}

applyFilmBorderStyle();

class LevelPopup extends HTMLElement {
    connectedCallback() {
        if (this.firstElementChild) return;

        this.innerHTML = `
            <div id="levelModal" class="level-modal" aria-hidden="true">
                <div class="level-backdrop"></div>
                <section id="levelWindow" class="level-window phase-video" role="dialog" aria-modal="true" data-i18n-aria-label="level.dialogAria">
                    <div class="tutorial-instruction-measure" aria-hidden="true">
                        <p class="tutorial-text" data-i18n="helper.answer2"></p>
                        <p class="tutorial-text" data-i18n="helper.answer3"></p>
                        <p class="tutorial-text" data-i18n="helper.answer4"></p>
                    </div>
                    <div id="videoStage" class="video-stage" data-i18n-aria-label="level.videoStageAria">
                        <div class="film-holes film-holes-top" aria-hidden="true"></div>
                        <div class="video-frame">
                            <video id="levelVideo" playsinline preload="auto" data-i18n-aria-label="level.videoAria"></video>
                            <button id="filmStartButton" class="primary-button video-start-button" type="button" hidden data-icon="▶" data-i18n="video.start" data-i18n-aria-label="video.start"></button>
                            <div id="videoCountdown" class="video-countdown" aria-live="assertive"></div>
                            <div id="videoMessage" class="video-message" role="status"></div>
                            <button id="skipVideo" class="secondary-button skip-video-button" type="button" hidden data-icon="⏭" data-i18n="video.skip" data-i18n-aria-label="video.skipAria"></button>
                        </div>
                        <div class="film-holes film-holes-bottom" aria-hidden="true"></div>
                    </div>

                    <div id="keyframeStrip" class="film-strip keyframe-strip" data-i18n-aria-label="level.keyframesAria">
                        <div class="film-holes film-holes-top" aria-hidden="true"></div>
                        <div class="keyframe-row"></div>
                        <div class="film-holes film-holes-bottom" aria-hidden="true"></div>
                    </div>

                    <div id="reflectionStage" class="reflection-stage" data-i18n-aria-label="level.reflectionAria">
                        <div id="reflectionFilmPreview" class="film-puzzle-top-row reflection-film-preview" aria-hidden="true">
                            <div id="reflectionFilmKeyframeStrip" class="film-puzzle-keyframe-strip"></div>
                            <div id="reflectionFilmAnswerSlot" class="film-puzzle-answer-slot"></div>
                        </div>
                        <div id="reflectionContent">
                            <h2 style="white-space: pre-line;" data-i18n="level.reflectionPrompt"></h2>
                            <div class="reflection-bottom">
                                <div class="reflection-microphone">
                                    <button id="stopRecording" class="primary-button stop-recording-button" type="button" hidden data-icon="■" data-i18n="microphone.stop" data-i18n-aria-label="microphone.stopAria"></button>
                                    <div id="microphoneIndicator" class="microphone-indicator" aria-hidden="true">
                                        <svg class="microphone-completion-ring" viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="56" pathLength="1"></circle>
                                        </svg>
                                        <svg class="microphone-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
                                            <rect x="22" y="8" width="20" height="32" rx="10"></rect>
                                            <path d="M16 31v3c0 9 7 16 16 16s16-7 16-16v-3"></path>
                                            <path d="M32 50v8"></path>
                                            <path d="M24 58h16"></path>
                                        </svg>
                                    </div>
                                    <p id="microphoneStatus" role="status"></p>
                                </div>
                                <div class="reflection-next">
                                    <button id="continueToLevel" class="primary-button reflection-confirm-button" type="button" hidden data-icon="✓" data-i18n="common.confirmAndContinue" data-i18n-aria-label="common.confirmAndContinue"></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="answerStage" class="answer-stage" data-i18n-aria-label="level.answerStageAria">
                        <h2 class="level-title" data-i18n="level.answerTitle"></h2>
                        <div id="answerGrid" class="answer-grid"></div>
                        <div id="singleAnswerView" class="single-answer-view" hidden>
                            <div class="single-answer-row">
                                <button id="previousAnswer" class="answer-arrow" type="button" data-i18n-aria-label="level.previousAnswerAria">‹</button>
                                <div id="singleAnswerFrame" class="single-answer-frame"></div>
                                <button id="nextAnswer" class="answer-arrow" type="button" data-i18n-aria-label="level.nextAnswerAria">›</button>
                            </div>
                        </div>
                        <div id="filmPuzzleView" class="film-puzzle-view" hidden>
                            <div class="film-puzzle-top-row">
                                <div id="filmKeyframeStrip" class="film-puzzle-keyframe-strip" aria-hidden="true"></div>
                                <div id="filmAnswerSlot" class="film-puzzle-answer-slot" aria-hidden="true"></div>
                            </div>
                            <div id="filmAnswerOptions" class="film-puzzle-options"></div>
                        </div>
                        <div class="answer-confirm-row">
                            <button
                                id="cancelChoice"
                                class="primary-button danger-button cancel-choice-button"
                                type="button"
                                hidden
                                data-icon="✕"
                                data-i18n="cancel.button"
                                data-i18n-aria-label="cancel.button"
                            >
                            </button>
                        
                            <button
                                id="submitAnswer"
                                class="primary-button"
                                type="button"
                                disabled
                                data-icon="✓"
                                data-i18n="common.confirm"
                                data-i18n-aria-label="common.confirm"
                            ></button>
                        </div>
                        <span id="levelStatus" class="level-status" aria-live="polite"></span>
                    </div>
                    <button id="levelExitButton" class="secondary-button level-exit-button" type="button" data-icon="←" data-i18n-aria-label="common.backToRoom" data-i18n-title="common.backToRoom"></button>
                    <dialogue-card id="levelDialogue"></dialogue-card>
                </section>

            </div>


            <pre id="debugOutput" class="visually-hidden" aria-hidden="true"></pre>
        `;
        // this.dialogue = this.querySelector("#levelDialogue");
        void initI18n().then(() => {
            applyTranslations(this);
            this.startTutorial();
        });
    }

    startTutorial() {
        this.dialogue = this.querySelector("#levelDialogue");
    }

    showVideoTutorial() {
        this.showDialogue([
            {
                key: "helper.video",
                noButton: true,
                audio: "../assets/sounds/voice_over/ne/step8.mp3"

            }

        ]);
    }

    showReflectionTutorial() {
        const reflectionContent = document.getElementById("reflectionContent");
        const replayButton = document.querySelector(".replay-reflection")
        const reflectionPreview = document.getElementById("reflectionFilmPreview");

        if (reflectionContent) {
            reflectionContent.hidden = true;
        }
        reflectionPreview.classList.remove("is-whitened");

        if (replayButton) {
            replayButton.hidden = true;
            replayButton.disabled = true;
            replayButton.classList.add("tutorial-replay-locked");
            replayButton.classList.remove("tutorial-replay-ready");

            replayButton.addEventListener("click", () => {
                this.dialogue.close();
                replayButton.classList.remove(
                    "tutorial-replay-locked",
                    "tutorial-replay-ready"
                );
                if (reflectionContent) {
                    reflectionContent.hidden = false;
                }
                updateReplayAvailability();
            }, { once: true });
        }
        this.showDialogue([
            {
                key: "helper.reflection1",
                audio: "../assets/sounds/voice_over/ne/step9.mp3",

                onShow: () => {
                    if (replayButton) {
                        replayButton.hidden = true;
                        replayButton.disabled = true;
                        replayButton.classList.add("tutorial-replay-locked");
                        replayButton.classList.remove("tutorial-replay-ready");
                        updateReplayAvailability();
                    }
                }
            },
            {
                key: "helper.reflection2",
                audio: "../assets/sounds/voice_over/ne/step10.mp3",

                onShow: () => {
                    
                    if (replayButton) {

                        replayButton.hidden = false;
                        replayButton.disabled = true;
                        reflectionPreview.classList.add("is-whitened");
                        reflectionPreview.hidden = false;
                        replayButton.classList.add("tutorial-replay-locked");
                        replayButton.classList.add("tutorial-highlight");
                        replayButton.classList.remove("tutorial-replay-ready");
                        // updateReplayAvailability();
                    }
                }
            },
            {
                key: "helper.reflection3",
                audio: "../assets/sounds/voice_over/ne/step11.mp3",
                noButton: true,

                onShow: () => {
                    if (replayButton) {
                        replayButton.hidden = false;
                        replayButton.classList.remove("tutorial-replay-locked");
                        replayButton.classList.add("tutorial-replay-ready");
                        replayButton.classList.add("tutorial-highlight");
                        // updateReplayAvailability();
                        replayButton.disabled = false;
                        reflectionPreview.classList.add("is-whitened");
                        reflectionPreview.hidden = false;
                        
                    }
                }
            },
        ]);
        // playVoiceOver("/assets/sounds/voice_over/ne/recording.mp3");
    }

 
    showAnswerTutorial() {
        this.showDialogue([
            {
                key: "helper.answer1",
                continueButton: true,
                audio: "../assets/sounds/voice_over/ne/step14.mp3"
            }
        ]);
    }

    isTutorialLevel() {
        return this.dataset.isTutorial === "true";
    }

    showDialogue(messages, onComplete = null) {
        this.dialogue.start(messages, onComplete);
    }
}

customElements.define("level-popup", LevelPopup);
