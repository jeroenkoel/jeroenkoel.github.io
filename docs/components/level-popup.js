import { applyTranslations, initI18n } from "/scripts/i18n.js";
import "./dialogue.js"
import { playVoiceOver } from "/scripts/voice-over.js";
class LevelPopup extends HTMLElement {
    connectedCallback() {
        if (this.firstElementChild) return;

        this.innerHTML = `
            <div id="levelModal" class="level-modal" aria-hidden="true">
                <div class="level-backdrop"></div>
                <section id="levelWindow" class="level-window phase-video" role="dialog" aria-modal="true" data-i18n-aria-label="level.dialogAria">
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
                        <h2 data-i18n="level.reflectionPrompt"></h2>
                        <p class="reflection-instructions" data-i18n="level.reflectionInstructions"></p>
                        <div class="reflection-bottom">
                            <div class="reflection-microphone">
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
                                <button id="stopRecording" class="primary-button stop-recording-button" type="button" hidden data-icon="■" data-i18n="microphone.stop" data-i18n-aria-label="microphone.stopAria"></button>
                            </div>
                            <div class="reflection-next">
                                <button id="continueToLevel" class="primary-button reflection-confirm-button" type="button" hidden data-icon="✓" data-i18n="common.confirmAndContinue" data-i18n-aria-label="common.confirmAndContinue"></button>
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
    // startTutorial() {
    //     this.dialogue = this.querySelector("#levelDialogue");

    //     if (this.isTutorialLevel()) {
    //         this.showVideoTutorial();
    //     }
    // }
    startTutorial() {
        this.dialogue = this.querySelector("#levelDialogue");
    }

    showVideoTutorial() {
        this.showDialogue([
            {
                key: "helper.video",
                noButton: true,
                audio: "../assets/sounds/voice_over/ne/video.mp3"

            }

        ]);
    }

    showReflectionTutorial() {
        playVoiceOver("/assets/sounds/voice_over/ne/recording.mp3");
    }

    showAnswerTutorial() {
        this.showDialogue([
            {
                key: "helper.answer1",
                audio: "../assets/sounds/voice_over/ne/answer1.mp3"
            },
            {
                key: "helper.answer2",
                audio: "../assets/sounds/voice_over/ne/answer2.mp3"
            },
            {
                key: "helper.answer3",
                audio: "../assets/sounds/voice_over/ne/answer3.mp3"
            }
        ]);
    }
    isTutorialLevel() {
        return this.dataset.isTutorial === "true";
    }
    // showDialogue(messages, audioFile = null, onComplete = null) {
    //     // Stop any previous voice-over
    //     this.voiceOver?.pause();

    //     this.dialogue.start(messages, onComplete);

    //     if (audioFile) {
    //         this.voiceOver = new Audio(audioFile);
    //         this.voiceOver.play().catch(error => {
    //             console.warn("Voice-over could not play:", error);
    //         });
    //     }
    // }
    showDialogue(messages, onComplete = null) {
        this.dialogue.start(messages, onComplete);
    }
}

customElements.define("level-popup", LevelPopup);
