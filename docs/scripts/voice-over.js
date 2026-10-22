let currentAudio = null;
const listeners = new Set();

export function isVoiceOverPlaying() {
    return currentAudio !== null;
}

export function onVoiceOverChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notify() {
    for (const listener of listeners) listener();
}

export function stopVoiceOver() {
    currentAudio?.pause();
    currentAudio = null;
    notify();
}

export function playVoiceOver(source) {
    currentAudio?.pause();
    const audio = typeof source === "string" ? new Audio(source) : source;
    currentAudio = audio || null;
    if (!audio) {
        notify();
        return;
    }

    audio.currentTime = 0;
    const finish = () => {
        if (currentAudio !== audio) return;
        currentAudio = null;
        notify();
    };
    audio.onended = finish;
    audio.onerror = finish;
    notify();
    audio.play().catch(finish);
}
