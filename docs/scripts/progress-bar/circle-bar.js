class CircularTimer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open"});
        this.currentCycle = 0;
        this.timer = null;
        this.colours = ["#7fbd67", "#6f8fae"];
    }

    connectedCallback() {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                position: fixed;
                top: 16px;
                left: 16px;
                z-index: 9999;
                pointer-events: none;
                --timer-size: 50px;
                width: var(--timer-size);
                height: var(--timer-size);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease-in-out;
                --base-colour: rgba(255, 255, 255, 0.2);
                --fill-colour: ${this.colours[0]};
                --blink-speed: 1s;
            }

            :host(.visible) {
                opacity: 1;
                visibility: visible;
            }

            :host(.blinking) svg {
                animation: glow var(--blink-speed) infinite alternate ease-in-out;
            }

            svg {
                width: 100%;
                height: 100%;
                transform: rotate(-90deg); 
            }

            .bg-circle {
                fill: none;
                stroke: var(--base-colour);
                stroke-width: 8;
            }

            .progress-circle {
                fill: none;
                stroke: var(--fill-colour);
                stroke-width: 8;
                stroke-linecap: round;
                stroke-dasharray: ${circumference};
                stroke-dashoffset: ${circumference};
            }

            @keyframes glow {
                0% { filter: drop-shadow(0 0 2px var(--fill-colour)); }
                100% { filter: drop-shadow(0 0 8px var(--fill-colour)); }
            }
        </style>
        <svg viewBox="0 0 100 100">
            <circle class="bg-circle" cx="50" cy="50" r="${radius}" />
            <circle class="progress-circle" cx="50" cy="50" r="${radius}" />
        </svg>
        `;
    }

    start(duration = 3000, maxCycles = 3, blinkSpeed = "1s") {
        this.stop();
        this.classList.add("visible");
        this. style.setProperty("--blink-speed", typeof blinkSpeed === "number" ? `${blinkSpeed}ms` : blinkSpeed);

        const circle = this.shadowRoot.querySelector(".progress-circle");
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        
        const runCycle = () => {
            const activeColour = this.colours[this.currentCycle % this.colours.length];
            const prevColour = this.currentCycle === 0 ? "rgba(0, 0, 0, 0.1)" : this.colours[(this.currentCycle - 1) % this.colours.length];

            this.style.setProperty("--base-colour", prevColour);
            this.style.setProperty("--fill-colour", activeColour);

            circle.style.transition = "none";
            circle.style.strokeDashoffset = `${circumference}`;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    circle.style.transition = `stroke-dashoffset ${duration}ms linear`;
                    circle.style.strokeDashoffset = "0";
                });
            });

            this.currentCycle++;

            if (this.currentCycle > maxCycles && !this.classList.contains("blinking")) {
                this.classList.add("blinking");
                this.dispatchEvent(new CustomEvent("timer-complete", { bubbles: true, composed: true}));
            }

            this.timer = setTimeout(runCycle, duration);
        };

        runCycle();
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.currentCycle = 0;
        this.classList.remove("visible", "blinking");

        const circle = this.shadowRoot.querySelector(".progress-circle");
        if (circle) {
            circle.style.transition = "none";
            circle.style.strokeDashoffset = `${2 * Math.PI * 40}`;
        }
    }
}

customElements.define("timer-circular-progress", CircularTimer);