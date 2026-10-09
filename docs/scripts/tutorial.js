import { initI18n, t } from "/scripts/i18n.js";
await initI18n();
const urlParams = new URLSearchParams(window.location.search);

let clickCount = 0;

document.getElementById('next-button').addEventListener('click', function() {
    const p = document.getElementById('tutorial-intro-1');
    clickCount++;
    if (clickCount === 1){
        const audio = document.getElementById('voice-over-2');
        if (audio) {
            audio.play().catch(error => {
                console.log("Autoplay denied", error);
            });
        }
        p.setAttribute('data-i18n', 'tutorial.intro2');
        p.textContent = t('tutorial.intro2');
    }
    else if (clickCount === 2){
        const audio = document.getElementById('voice-over-3');
        if (audio) {
            audio.play().catch(error => {
                console.log("Autoplay denied", error);
            });
        }
        p.setAttribute('data-i18n', 'tutorial.intro3');
        p.textContent = t('tutorial.intro3');
    }
    else{
        switchScene('level-selection-tutorial.html?playAudio=true')
    }
    
});


if (urlParams.get('playAudio') === 'true') {
    const audio = document.getElementById('voice-over-1');
    
    if (audio) {
        audio.play().catch(error => {
            console.log("Autoplay denied", error);
        });
    }
}

