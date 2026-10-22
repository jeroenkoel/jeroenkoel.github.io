import { t } from "/scripts/i18n.js";

document.addEventListener("DOMContentLoaded", () => {
    const participantInput = document.getElementById("participantInput");
    const startGameBtn = document.getElementById("startGameBtn");

    // Restore saved ID if already set in session
    // const currentUserId = sessionStorage.getItem("filmBoxUserId");
    // if (currentUserId && participantInput) {
    //     participantInput.value = currentUserId;
    // }

    if (startGameBtn) {
        startGameBtn.addEventListener("click", () => {
            const pNumber = participantInput.value.trim();

            if (!pNumber) {
                alert(t("common.playerIdRequired"));
                participantInput.focus();
                return;
            }

            // Save active participant ID for all gameplay submissions
            sessionStorage.setItem("filmBoxUserId", pNumber);
            sessionStorage.setItem("filmBoxSessionStartedAt", new Date().toISOString());

            participantInput.value = "";

            // Proceed to game
            if (typeof switchScene === "function") {
                switchScene("tutorial.html?playAudio=true");
            } else {
                window.location.href = "tutorial.html?playAudio=true";
            }
        });
    }
});
