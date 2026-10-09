/* =========================================
   PARTICIPANT DATA
========================================= */
function getParticipantFormData() {

    const participantNumber =
        document.getElementById("participantNumber").value.trim();

    const age =
        document.getElementById("participantAge").value.trim();

    const gender =
        document.querySelector(
            'input[name="participantGender"]:checked'
        )?.value || "";

    const educationLevel =
        document.getElementById("educationLevel").value;


    return {
        participantNumber,
        age,
        gender,
        educationLevel
    };
}

function clearParticipantForm() {
    document.getElementById("participantNumber").value = "";
    document.getElementById("participantAge").value = "";

    const checkedGender = document.querySelector('input[name="participantGender"]:checked');
    if (checkedGender) {
        checkedGender.checked = false;
    }

    document.getElementById("educationLevel").selectedIndex = 0;

    const participantNumberError = document.getElementById("participantNumberError");
    const participantAgeError = document.getElementById("participantAgeError");

    if (participantNumberError) participantNumberError.textContent = "";
    if (participantAgeError) participantAgeError.textContent = "";
}

/* =========================================
   VALIDATE PARTICIPANT DATA
========================================= */

function validateParticipantData(participant) {

    const errors = [];

    // Participant number
    if (participant.participantNumber === "") {
        errors.push("Please enter a participant number.");
    }
    else if (!/^\d+$/.test(participant.participantNumber)) {
        errors.push("Participant number must contain numbers only.");
    }


    // Age
    if (participant.age === "") {
        errors.push("Please enter an age.");
    }
    else if (!/^\d+$/.test(participant.age)) {
        errors.push("Age must contain numbers only.");
    }
    else if (
        Number(participant.age) < 0 ||
        Number(participant.age) > 150
    ) {
        errors.push("Age must be between 0 and 150.");
    }


    // Gender
    const allowedGenders = [
        "male",
        "female",
        "nvt"
    ];

    if (!allowedGenders.includes(participant.gender)) {
        errors.push("Please select a gender.");
    }


    // Education level
    if (participant.educationLevel === "") {
        errors.push("Please select an education level.");
    }


    return errors;
}


/* =========================================
   SHOW SAVE MESSAGE
========================================= */

function showSaveMessage(message, type) {

    const messageElement =
        document.getElementById("saveMessage");

    messageElement.textContent = message;

    messageElement.classList.remove(
        "success",
        "error"
    );

    messageElement.classList.add(type);
}


/* =========================================
   SAVE PARTICIPANT DATA
========================================= */

async function saveParticipantData() {

    const participant = getParticipantFormData();

    const errors = validateParticipantData(participant);

    if (errors.length > 0) {

        showSaveMessage(
            errors.join("\n"),
            "error"
        );
        return;
    }

    const payload = {
        pNumber: String(participant.participantNumber),
        age: Number(participant.age),
        gender: participant.gender,
        eduScale: participant.educationLevel
    };

    try {
        const response = await fetch("/api/userData", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showSaveMessage("Participant data successfully saved!", "success");
            clearParticipantForm();
        } else {
            const serverMsg = result.message || "Failed to save particiapnt data.";
            alert("Error: " + serverMsg);
            showSaveMessage(serverMsg, "error");
        }
    } catch (err) {
        console.error("Error submitting participant data:", err);
        alert("An error occured while communicating with the server.");
        showSaveMessage("Network error. Please try again.", "error");
    }
}

function allowNumbersOnly(input, errorElement) {

    const originalValue = input.value;

    // Remove everything that is not a number
    const numericalValue = originalValue.replace(/\D/g, "");

    // Check if something invalid was entered
    if (originalValue !== numericalValue) {
        errorElement.textContent = "Please enter numbers only.";
    } else {
        errorElement.textContent = "";
    }

    // Put only the numerical value back into the input
    input.value = numericalValue;
}

document.addEventListener("DOMContentLoaded", () => {

    const saveButton =
        document.getElementById("saveParticipantData");

    const participantNumber =
        document.getElementById("participantNumber");

    const participantAge =
        document.getElementById("participantAge");

    const participantNumberError =
        document.getElementById("participantNumberError");

    const participantAgeError =
        document.getElementById("participantAgeError");


    participantNumber.addEventListener("input", () => {
        allowNumbersOnly(
            participantNumber,
            participantNumberError
        );
    });


    participantAge.addEventListener("input", () => {
        allowNumbersOnly(
            participantAge,
            participantAgeError
        );
    });


    if (saveButton) {
        saveButton.addEventListener(
            "click",
            saveParticipantData
        );
    }

});