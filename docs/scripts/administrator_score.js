/* =========================================
   TEMPORARY TEST DATA

   Later this can be replaced with data
   fetched from your API/database.
========================================= */


/* =========================================
   HELPER FUNCTIONS
========================================= */

function formatAnswerLabel(answerId) {
    if (!answerId || answerId === "N/A") return "N/A";
    return answerId.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

const EDUCATION_LEVELS = {
    1: "Minder dan zes klassen lager onderwijs (ZMLK)",
    2: "Zes klassen lager onderwijs (LOM/MLK)",
    3: "Meer dan zes klassen lager onderwijs zonder voltooide vervolgopleiding (VMBO/VGLO)",
    4: "Gediplomeerde schoolopleiding lager dan MULO (LTS (A/B), LEAO, LHNO, Land-en tuinbouwschool, VMBO-b, beroepsgerichte opleiding, MBO1/2)",
    5: "MULO(MAVO, HAVO, MBO 3/4, VMBO-t, LTS, LHNO, BOL)",
    6: "VHMO (HAVO, VWO, HBO, WO propedeuse)",
    7: "Wetenschappelijk onderwijs (bachelor, master, doctoraal, technische hogeschool, landbouwhogeschool)"
};

function formatEducationLevel(eduValue) {
    return EDUCATION_LEVELS[eduValue] || eduValue || "N/A";
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* =========================================
   SCORE CALCULATIONS
========================================= */

function calculateCategoryScore(category) {

    return category.answers.filter(answer =>
        answer.isCorrect || answer.givenAnswer === answer.correctAnswer
    ).length;
}


/*
    Calculate the total score.

    Only categories where
    countsTowardsScore === true
    are included.
*/

function calculateTotalScore(categories) {

    return categories
        .filter(category => category.countsTowardsScore)
        .reduce((total, category) => {

            return total + calculateCategoryScore(category);

        }, 0);
}


/*
    Calculate the maximum possible score.

    Tutorial is excluded because
    countsTowardsScore is false.
*/

function calculateTotalQuestions(categories) {

    return categories
        .filter(category => category.countsTowardsScore)
        .reduce((total, category) => {

            return total + category.answers.length;

        }, 0);
}


/* =========================================
   PARTICIPANT INFORMATION
========================================= */

function renderParticipant(participant) {

    const container = document.getElementById("participantInfo");

    const eduText = formatEducationLevel(participant.educationLevel)

    container.innerHTML = `
        <span class="summary-label">Participant</span>

        <h3>${participant.id}</h3>

        <div class="participant-details">
            <p>Age: ${participant.age}</p>
            <p>Gender: ${participant.gender}</p>
            <p>Education level: ${eduText}</p>
        </div>
    `;
}


/* =========================================
   TOTAL SCORE
========================================= */

function renderTotalScore(categories) {

    const container =
        document.getElementById("totalScore");

    const score =
        calculateTotalScore(categories);

    const total =
        calculateTotalQuestions(categories);


    // Prevent division by zero

    const percentage =
        total === 0
            ? 0
            : Math.round((score / total) * 100);


    container.innerHTML = `
        <span class="summary-label">
            Total score
        </span>

        <div class="total-score-number">

            <strong>
                ${score}
            </strong>

            <span>
                / ${total}
            </span>

        </div>

        <span class="score-percentage">
            ${percentage}%
        </span>
    `;
}


/* =========================================
   CREATE ONE CATEGORY CARD

   Used for ALL categories.
========================================= */

function createScoreCategory(category) {

    const card = document.createElement("div");
    card.classList.add("score-category");

    /* Calculate category score */
    const score = calculateCategoryScore(category);

    /* Create all scenario rows */
    const answerRows = category.answers
        .map((answer, index) => {
            const isCorrect = answer.isCorrect || answer.givenAnswer === answer.correctAnswer;
            const givenText = formatAnswerLabel(answer.givenAnswer);
            const correctText = formatAnswerLabel(answer.correctAnswer);
            const timeStr = answer.timeTakenMs !== undefined 
                ? (answer.timeTakenMs / 1000).toFixed(1) + "s"
                : "-";

            const statusIcon = isCorrect
                /* -------------------------
                CORRECT ANSWER
                Columns: [Number] [Given Answer] [✓] [Empty Spacer] [Time]
                ------------------------- */
                ? `<span class="correct">✓</span><span class="correct-answer"></span>`
                /* -------------------------
                WRONG ANSWER
                Columns: [Number] [Given Answer] [✕] [→ Correct Answer] [Time]
                ------------------------- */
                : `<span class="wrong">✕</span><span class="correct-answer">→ ${correctText}</span>`;


                const transcriptionHtml = answer.transcription
                    ? `<div class="scenario-transcript"><strong>Transcript:</strong> "${escapeHtml(answer.transcription)}"</div>` 
                    : `<div class="scenario-transcript muted"><strong>Transcript:</strong> No audio recording</div>`;
 
                return `
                    <div class="scenario-item">
                        <div class="scenario-row">
                            <span class="scenario-number">${index + 1}.</span>
                            <span class="given-answer">${givenText}</span>
                            ${statusIcon}
                            <span class"answer-time">${timeStr}</span>
                        </div>
                        ${transcriptionHtml}
                    </div>
                `;                    
        }).join("");


    /* Create the category card */
    card.innerHTML = `
        <h3>${category.name}</h3>

        <p class="scenario-count">
            ${category.answers.length}
            ${category.answers.length === 1 ? "scenario" : "scenarios"}
        </p>

        <div class="scenario-list">
            <div class="scenario-list-header">
                <span>Answer time</span>
            </div>
            ${answerRows}
        </div>

        ${
            category.countsTowardsScore
                ? `<div class="category-score">${score} /${category.answers.length}</div>`
                : ""
        }
    `;

    return card;
}


/* =========================================
   RENDER ALL CATEGORIES
========================================= */

function renderScoreCategories(categories) {

    const container =
        document.getElementById("scoreCategories");


    /* Remove existing cards */

    container.innerHTML = "";


    /* Create one card per category */

    categories.forEach(category => {

        const card =
            createScoreCategory(category);

        container.appendChild(card);

    });
}


/* =========================================
   FETCH & RENDER COMPLETE SCORE PAGE
========================================= */

async function loadParticipantScore(userId) {
    const searchError = document.getElementById("scoreSearchError");
    if (searchError) searchError.textContent = "";

    if (!userId) {
        if (searchError) searchError.textContent = "Please enter a valid participant number";
        return;
    }

    try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}/score-details`);   
        
        const result = await response.json();
        
        if(response.ok && result.status === "success") {
            renderParticipant(result.data.participant);
            renderTotalScore(result.data.categories);
            renderScoreCategories(result.data.categories);
            document.getElementById("scoreParticipantInput").value = "";
        } else {
            const errorMsg = result.message || "user not found.";
            if (searchError) searchError.textContent = errorMsg;

            document.getElementById("participantInfo").innerHTML = `<p style="color: red;">${errorMsg}</p>`;
            document.getElementById("totalScore").innerHTML = "";
            document.getElementById("scoreCategories").innerHTML = "";
        }
    } catch (err) {
        console.error("Error fetching participant score data:", err);
        if (searchError) searchError.textContent = "Server communication error.";
    }
}


/* =========================================
   INITIALISE
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("searchParticipantBtn");
    const searchInput = document.getElementById("scoreParticipantInput");
    const printPDF = document.getElementById("downloadParticipant");

    if (searchBtn && searchInput && printPDF) {
        searchBtn.addEventListener("click", () => {
            loadParticipantScore(searchInput.value.trim());
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                loadParticipantScore(searchInput.value.trim());
            }
        });

        printPDF.addEventListener("click", () => {
            window.print();
        })
    }

});