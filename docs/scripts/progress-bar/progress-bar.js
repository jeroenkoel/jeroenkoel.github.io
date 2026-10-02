class ProgressBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open"});
        this.timer = null;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 6px;
                background-color: rgba(0, 0, 0, 0.1);
                z-index: 9999; 
                pointer-events: none; 
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease-in-out;
                --blink-speed: 1s;
            }

            :host(.visible) {
                opacity: 1;
                visibility: visible;
            }

            .bar {
                height: 100%;
                width: 0%;
                background-color: var(--primary, #7fbd67);
                transition: width linear;
            }

            .bar.full {
                animation: glow var(--blink-speed) infinite alternate ease-in-out;
            }

            @keyframes glow {
                0% {
                    box-shadow: 0 0 2px var(--primary, #7fbd67), 0 0 5px var(--primary, #7fbd67);
                }
                100% {
                    box-shadow: 0 0 5px var(--primary, #7fbd67), 0 0 10px var(--primary, #7fbd67), 0 0 15px var(--primary, #7fbd67);
                }
            }
        </style>
        <div class = "bar"></div>`;
    }

    start(duration, blinkSpeed) {
        const dur = duration || parseInt(this.getAttribute("duration"), 10) || 30000;
        const speed = blinkSpeed || this.getAttribute("blink-speed") || "1s";

        this.style.setProperty("--blink-speed", typeof speed == "number" ? `${speed}ms` : speed);
        const bar = this.shadowRoot.querySelector(".bar");

        this.stop();
        this.classList.add("visible");

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bar.style.transition = `width ${dur}ms linear`;
                bar.style.width = "100%"; 
            });
        });

        this.timer = setTimeout(() => {
            bar.classList.add("full");
            this.dispatchEvent(new CustomEvent("timer-complete", { bubbles: true, composed: true }));
        }, dur);
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.classList.remove("visible");

        const bar = this.shadowRoot.querySelector(".bar");
        if (bar) {
            bar.classList.remove("full");
            bar.style.transition = "none";
            bar.style.width = "0%";
        }
    }
}

customElements.define("timer-progress-bar", ProgressBar);

