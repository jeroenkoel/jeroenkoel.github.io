let mediaRecorder;
let audioChucks = [];
let recordedAudioBlob = null;

const startStop = document.getElementById('startStop');
const recordStatus = document.getElementById('recordStatus');
const audioPlayback = document.getElementById('audioPlayback');

let listening = false;

// Checking for compatible types
let mimeType = 'audio/webm';

if (MediaRecorder.isTypeSupported('audio/wav')) {
    mimeType = 'audio/wav';
} else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    mimeType = 'audio/webm;codecs=opus';
}

startStop.addEventListener('click', async () => {
    if (listening) {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            recordStatus.textContent = "Finished";
            recordStatus.className = "";
            listening = false;
            startStop.textContent = "Begin met opnemen";
        }
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true});
            mediaRecorder = new MediaRecorder(stream);
            audioChucks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChucks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                recordedAudioBlob = new Blob(audioChucks, { type: 'audio/webm' });

                //const audioUrl = URL.createObjectURL(recordedAudioBlob);
                //audioPlayback.src = audioUrl;

                await sendAudioData();
            };

            mediaRecorder.start();
            recordStatus.textContent = "Recording...";
            recordStatus.className = "recording";
            listening = true;
            startStop.textContent = "Stop met opnemen";
        } catch (err) {
            alert("Microphone access denied or not supported");
            console.error(err);
        }
    }
});

let tabSessionId = sessionStorage.getItem('sessionId');
if (!tabSessionId) {
    tabSessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('sessionId', tabSessionId);
}

let questionStartTime = Date.now();
const gameDataLog = {
    sessionId: tabSessionId,
    answers: []
};

const answerButtons = document.querySelectorAll('.answerBtn');
const logOutput = document.getElementById('logOutput');

answerButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const chosenAnswer = e.target.getAttribute('data-answer');
        const timeTakenMs = Date.now() - questionStartTime;

        const entry = {
            question: document.getElementById('QuestionText').textContent,
            chosenAnswer: chosenAnswer,
            timeTakenMs: timeTakenMs,
            timeTakenSeconds: (timeTakenMs / 1000).toFixed(2),
            timestamp: new Date().toISOString()
        };

        gameDataLog.answers.push(entry);
        logOutput.textContent = JSON.stringify(gameDataLog, null, 2);

        questionStartTime = Date.now();
    });
});

async function sendDataToBackend() {
    const formData = new FormData();
    // check if .wav is supported and use that if it is
    const extension = mimeType.includes('wav') ? 'recording.wav' : 'recording.webm';
    formData.append('audio', recordedAudioBlob, extension);
    formData.append('gameData', JSON.stringify(gameDataLog));

    try {
        const response = await fetch('http://localhost:3000/api/save-session', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Server response:', result);

        if (result.data && result.data.transcription) {
            console.log('Transcription:', result.data.transcription);
            gameDataLog.answers.push(result);
            logOutput.textContent = JSON.stringify(gameDataLog, null, 2);
        }
    } catch (err) {
        console.error('Error sending data to server:', err);
    }
}


// Just a test sender. Will be removed later since this frontend page will be done anyway
async function sendAudioData() {
    if (!recordedAudioBlob) return;

    const formData = new FormData();
    const extension = mimeType.includes('wav') ? '.wav' : '.webm';

    const metadata = {
        userId: "test_user",
        sessionId: tabSessionId,
        questionId: "test_q1"
    };

    formData.append(`metadata`, JSON.stringify(metadata));
    formData.append('audio', recordedAudioBlob, `recording${extension}`);

    try {
        const response = await fetch('http://localhost:3000/api/submit-audio', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log('Server response:', result.message);
    } catch (err) {
        console.error('Error sending audio data to server:', err);
    }
}