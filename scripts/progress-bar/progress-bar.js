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
            }

            :host(.visible) {
                opacity: 1;
                visibility: visible;
            }

            .bar {
                height: 100%;
                width: 0%;
                background-color: #3b82f6;
                transition: width linear;
            }
        </style>
        <div class = "bar"></div>
        `;
    }

    start(duration) {
        const dur = duration || parseInt(this.getAttribute("duration"), 10) || 30000;
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
            bar.style.transition = "none";
            bar.style.width = "0%";
        }
    }
}

customElements.define("timer-progress-bar", ProgressBar);

