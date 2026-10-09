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

    container.innerHTML = `
        <span class="summary-label">Participant</span>

        <h3>${participant.id}</h3>

        <div class="participant-details">
            <p>Age: ${participant.age}</p>
            <p>Gender: ${participant.gender}</p>
            <p>Education level: ${participant.educationLevel}</p>
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
                : "—";

            /* -------------------------
               CORRECT ANSWER
               Columns: [Number] [Given Answer] [✓] [Empty Spacer] [Time]
            ------------------------- */
            if (isCorrect) {
                return `
                    <div class="scenario-row">
                        <span class="scenario-number">${index + 1}.</span>
                        <span class="given-answer">${givenText}</span>
                        <span class="correct">✓</span>
                        <span class="correct-answer"></span>
                        <span class="answer-time">${timeStr}</span>
                    </div>
                `;
            }

            /* -------------------------
               WRONG ANSWER
               Columns: [Number] [Given Answer] [✕] [→ Correct Answer] [Time]
            ------------------------- */
            return `
                <div class="scenario-row">
                    <span class="scenario-number">${index + 1}.</span>
                    <span class="given-answer">${givenText}</span>
                    <span class="wrong">✕</span>
                    <span class="correct-answer">→ ${correctText}</span>
                    <span class="answer-time">${timeStr}</span>
                </div>
            `;

        })
        .join("");


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

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => {
            loadParticipantScore(searchInput.value.trim());
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                loadParticipantScore(searchInput.value.trim());
            }
        });
    }

});