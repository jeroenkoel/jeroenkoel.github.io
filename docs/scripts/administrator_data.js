import {t} from '/scripts/i18n.js';

const formFields = {
    participantNumber: 'participantNumberError',
    participantAge: 'participantAgeError',
    genderSelector: 'participantGenderError',
    educationLevel: 'educationLevelError'
};

function showFieldError(fieldId, message = '') {
    const field = document.getElementById(fieldId);
    field.classList.toggle('invalid', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
    document.getElementById(formFields[fieldId]).textContent = message;
}

function openParticipantEditor() {
    const participant = window.selectedAdminParticipant?.participant;
    if (!participant) return;
    const dialog = document.getElementById('editParticipantDialog');
    document.getElementById('participantNumber').value = participant.id;
    document.getElementById('participantAge').value = participant.age === 'N/A' ? '' : participant.age;
    document.querySelectorAll('[name="participantGender"]').forEach(radio => radio.checked = radio.value === participant.gender);
    document.getElementById('educationLevel').value = participant.educationLevel === 'N/A' ? '' : participant.educationLevel;
    document.getElementById('saveMessage').textContent = '';
    Object.keys(formFields).forEach(field => showFieldError(field));
    dialog.showModal();
}

async function saveParticipantData(event) {
    event.preventDefault();
    const id = document.getElementById('participantNumber').value.trim();
    const age = document.getElementById('participantAge').value.trim();
    const gender = document.querySelector('[name="participantGender"]:checked')?.value;
    const education = document.getElementById('educationLevel').value;
    let valid = true;
    const errors = {
        participantNumber: /^\d{1,32}$/.test(id) ? '' : t('administrator.invalidParticipantNumber'),
        participantAge: !age ? t('administrator.ageRequired') : !/^\d+$/.test(age) || Number(age) > 150 ? t('administrator.invalidAge') : '',
        genderSelector: !gender ? t('administrator.genderRequired') : '',
        educationLevel: !education ? t('administrator.educationRequired') : ''
    };
    for (const [field, message] of Object.entries(errors)) {
        showFieldError(field, message);
        if (message) valid = false;
    }
    if (!valid) return;
    const save = document.getElementById('saveParticipantData');
    save.disabled = true;
    try {
        const response = await fetch('/api/userData', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({pNumber: id, age: Number(age), gender, eduScale: Number(education)})
        });
        if (!response.ok) throw new Error(t('administrator.saveFailed'));
        document.getElementById('editParticipantDialog').close();
        await window.reloadAdminParticipant();
    } catch (error) {
        document.getElementById('saveMessage').textContent = error.message;
        document.getElementById('saveMessage').className = 'save-message error';
    } finally {
        save.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('educationLevel');
    for (let value = 1; value <= 7; value++) {
        const option = document.createElement('option');
        option.value = value;
        option.dataset.i18n = `administrator.educationLevel${value}`;
        option.textContent = t(option.dataset.i18n);
        dropdown.appendChild(option);
    }
    document.getElementById('editParticipantBtn').addEventListener('click', openParticipantEditor);
    document.getElementById('cancelParticipantEdit').addEventListener('click', () => document.getElementById('editParticipantDialog').close());
    document.getElementById('editParticipantForm').addEventListener('submit', saveParticipantData);
    for (const field of Object.keys(formFields)) {
        document.getElementById(field).addEventListener(field === 'genderSelector' || field === 'educationLevel' ? 'change' : 'input', () => showFieldError(field));
    }
});
