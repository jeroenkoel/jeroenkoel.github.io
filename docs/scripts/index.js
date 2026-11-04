import { initI18n, t } from "/scripts/i18n.js";

initI18n().catch(console.error);

function initializeHome() {
    const participantInput = document.getElementById("participantInput");
    const startGameBtn = document.getElementById("startGameBtn");
    const errorMessage = document.getElementById("participantInputError");

    function showError(key) {
        errorMessage.textContent = key ? t(key) : "";
        participantInput.classList.toggle("invalid", Boolean(key));
        participantInput.setAttribute("aria-invalid", String(Boolean(key)));
    }

    participantInput.addEventListener("input", () => showError(null));
    participantInput.addEventListener("keydown", event => {
        if (event.key === "Enter") startGameBtn.click();
    });

    startGameBtn.addEventListener("click", async () => {
        const userId = participantInput.value.trim();
        if (!userId) return showError("common.playerIdRequired");
        if (!/^\d{1,32}$/.test(userId)) return showError("common.playerIdNumeric");

        startGameBtn.disabled = true;
        showError(null);
        try {
            if (window.AudioContext || window.webkitAudioContext) {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === "suspended") {
                    audioCtx.resume().catch(error => console.warn("Audio initialization restricted:", error));
                }
            }
        } catch (error) {
            console.warn("Audio initialization restricted:", error);
        }
        // try {
            // const response = await fetch("/api/sessions", {
            //     method: "POST",
            //     headers: {"Content-Type": "application/json"},
            //     body: JSON.stringify({userId})
            // });
            // const result = await response.json();
            // if (!response.ok) {
            //     showError(result.code === "id_taken"
            //         ? (result.incomplete ? "common.playerIdIncomplete" : "common.playerIdTaken")
            //         : result.code === "invalid_id" ? "common.playerIdNumeric" : "common.sessionFailed");
            //     return;
            // }
            sessionStorage.setItem("filmBoxUserId", userId);
            sessionStorage.setItem("filmBoxSessionToken", 1);
            sessionStorage.setItem("filmBoxSessionStartedAt", new Date().toISOString());
            participantInput.value = "";
            window.location.href = "tutorial.html?playAudio=true";
        // } catch (error) {
        //     showError("common.sessionFailed");
        // } finally {
        //     startGameBtn.disabled = false;
        // }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeHome, {once: true});
} else {
    initializeHome();
}
