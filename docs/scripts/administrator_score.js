import {initI18n, t, onLanguageChange} from "/scripts/i18n.js";


/* =========================================
   HELPER FUNCTIONS
========================================= */

function formatAnswerLabel(answerId) {
    if (!answerId || answerId === "N/A") return t('administrator.notAvailable');
    return answerId.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function formatEducationLevel(value) {
    return value >= 1 && value <= 7 ? t(`administrator.educationLevel${value}`) : t('administrator.notAvailable');
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

    const eduText = formatEducationLevel(participant.educationLevel);
    const genderKey = {male: 'administrator.male', female: 'administrator.female', nvt: 'administrator.na'}[participant.gender];

    container.innerHTML = `
        <span class="summary-label">${t('administrator.participant')}</span>

        <h3>${escapeHtml(participant.id)}</h3>

        <div class="participant-details">
            <p>${t('administrator.age')}: ${escapeHtml(participant.age === 'N/A' ? t('administrator.notAvailable') : participant.age)}</p>
            <p>${t('administrator.gender')}: ${escapeHtml(genderKey ? t(genderKey) : t('administrator.notAvailable'))}</p>
            <p>${t('administrator.education')}: ${escapeHtml(eduText)}</p>
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
        18;


    // Prevent division by zero

    const percentage =
        total === 0
            ? 0
            : Math.round((score / total) * 100);


    container.innerHTML = `
        <span class="summary-label">
            ${t('administrator.totalScore')}
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
                : `<span class="wrong">✕</span><span class="correct-answer">→ ${escapeHtml(correctText)}</span>`;


                const transcriptionHtml = answer.transcription
                    ? `<div class="scenario-transcript"><strong>${t('administrator.transcript')}:</strong> "${escapeHtml(answer.transcription)}"</div>` 
                    : `<div class="scenario-transcript muted"><strong>${t('administrator.transcript')}:</strong> ${t('administrator.noAudioRecording')}</div>`;
 
                return `
                    <div class="scenario-item">
                        <div class="scenario-row">
                            <span class="scenario-number">${index + 1}.</span>
                            <span class="given-answer">${escapeHtml(givenText)}</span>
                            ${statusIcon}
                            <span class="answer-time">${timeStr}</span>
                        </div>
                        ${transcriptionHtml}
                    </div>
                `;                    
        }).join("");


    /* Create the category card */
    card.innerHTML = `
        <h3>${escapeHtml(t(`administrator.category${category.name}`))}</h3>

        <p class="scenario-count">
            ${category.answers.length}
            ${t(category.answers.length === 1 ? 'administrator.scenario' : 'administrator.scenarios')}
        </p>

        <div class="scenario-list">
            <div class="scenario-list-header">
                <span>${t('administrator.answerTime')}</span>
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


let selectedParticipantId = null;

function showParticipantsList() {
    selectedParticipantId = null;
    window.selectedAdminParticipant = null;
    document.getElementById('participantResult').hidden = true;
    document.getElementById('participantsListView').hidden = false;
    searchParticipants();
}

async function searchParticipants() {
    await initI18n();
    const search = document.getElementById('scoreParticipantInput').value.trim();
    const list = document.getElementById('participantsList');
    const error = document.getElementById('scoreSearchError');
    error.textContent = '';
    try {
        const response = await fetch(`/api/users?search=${encodeURIComponent(search)}`);
        if (!response.ok) throw new Error(t('administrator.loadParticipantsFailed'));
        const result = await response.json();
        list.replaceChildren();
        if (!result.data.length) {
            error.textContent = t('administrator.noParticipantsFound');
            return;
        }
        for (const person of result.data) {
            const row = document.createElement('tr');
            row.tabIndex = 0;
            row.setAttribute('aria-label', `${t('administrator.participant')} ${person.id}`);
            const id = document.createElement('th');
            id.scope = 'row';
            id.textContent = person.id;
            const status = document.createElement('td');
            status.textContent = t(person.complete ? 'administrator.complete' : 'administrator.incomplete');
            const progress = document.createElement('td');
            progress.textContent = `${person.answered}/${person.expected}`;
            row.append(id, status, progress);
            row.addEventListener('click', () => loadParticipantScore(person.id));
            row.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    loadParticipantScore(person.id);
                }
            });
            list.appendChild(row);
        }
    } catch (err) {
        error.textContent = err.message;
    }
}

async function loadParticipantScore(userId) {
    const error = document.getElementById(document.getElementById('participantsListView').hidden
        ? 'participantDetailError' : 'scoreSearchError');
    error.textContent = '';
    try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}/score-details`);
        const result = await response.json();
        if (!response.ok) throw new Error(t('administrator.participantNotFound'));
        selectedParticipantId = userId;
        window.selectedAdminParticipant = result.data;
        renderParticipant(result.data.participant);
        renderTotalScore(result.data.categories);
        renderScoreCategories(result.data.categories);
        const folder = document.getElementById('sessionFolder');
        folder.textContent = `${t('administrator.sessionFolder')}: ${result.data.session.folder} · ${t(result.data.session.complete ? 'administrator.complete' : 'administrator.incomplete')} (${result.data.session.answered}/${result.data.session.expected})`;
        document.getElementById('participantsListView').hidden = true;
        document.getElementById('participantResult').hidden = false;
        document.dispatchEvent(new CustomEvent('admin-participant-loaded', {detail: result.data}));
    } catch (err) {
        error.textContent = err.message;
    }
}

async function downloadCsv(userId) {
    try {
        const query = userId === undefined ? '' : `?userId=${encodeURIComponent(userId)}`;
        const response = await fetch(`/api/export-csv${query}`);
        if (!response.ok) throw new Error(t('administrator.csvDownloadFailed'));
        const url = URL.createObjectURL(await response.blob());
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = userId === undefined ? 'participant_data_export.csv' : `participant_${userId}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        document.getElementById(userId === undefined ? 'scoreSearchError' : 'participantDetailError').textContent = err.message;
    }
}

window.reloadAdminParticipant = async () => {
    if (selectedParticipantId) await loadParticipantScore(selectedParticipantId);
    else await searchParticipants();
};

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('scoreParticipantInput');
    document.getElementById('searchParticipantBtn').addEventListener('click', searchParticipants);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') searchParticipants();
    });
    document.getElementById('backToParticipantsBtn').addEventListener('click', showParticipantsList);
    document.getElementById('downloadParticipant').addEventListener('click', () => window.print());
    document.getElementById('downloadCsvBtn').addEventListener('click', () => {
        if (selectedParticipantId) downloadCsv(selectedParticipantId);
    });
    document.getElementById('downloadAllCsvBtn').addEventListener('click', () => downloadCsv());
    document.getElementById('deleteParticipantBtn').addEventListener('click', async () => {
        if (!selectedParticipantId || !confirm(t('administrator.deleteConfirm', {id: selectedParticipantId}))) return;
        try {
            const response = await fetch(`/api/users/${encodeURIComponent(selectedParticipantId)}`, {method: 'DELETE'});
            if (!response.ok) throw new Error(t('administrator.deleteFailed'));
            showParticipantsList();
        } catch (err) {
            document.getElementById('participantDetailError').textContent = err.message;
        }
    });
    searchParticipants();
    onLanguageChange(() => {
        const data = window.selectedAdminParticipant;
        if (data) {
            renderParticipant(data.participant);
            renderTotalScore(data.categories);
            renderScoreCategories(data.categories);
            const session = data.session;
            document.getElementById('sessionFolder').textContent = `${t('administrator.sessionFolder')}: ${session.folder} · ${t(session.complete ? 'administrator.complete' : 'administrator.incomplete')} (${session.answered}/${session.expected})`;
        }
        if (!document.getElementById('participantsListView').hidden) searchParticipants();
    });
});
