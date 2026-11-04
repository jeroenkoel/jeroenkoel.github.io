function showSection(sectionId, clickedButton) {
    document.querySelectorAll('.admin-section').forEach(section => section.classList.toggle('active-section', section.id === sectionId));
    document.querySelectorAll('.sidebar-button').forEach(button => button.classList.toggle('active', button === clickedButton));
}

async function leaveAdmin() {
    try {
        await fetch('/api/admin/logout', {method: 'POST'});
    } finally {
        window.location.href = 'index.html';
    }
}

document.getElementById('adminBackBtn')?.addEventListener('click', leaveAdmin);

window.addEventListener('pagehide', () => {
    document.querySelector('.admin-container').hidden = true;
    navigator.sendBeacon('/api/admin/logout', new Blob(['{}'], {type: 'application/json'}));
});

window.addEventListener('pageshow', event => {
    if (event.persisted) window.location.replace('index.html?admin=1');
});

// =========================================
// Film border style setting
// =========================================

const filmBorderSelect = document.getElementById("film-border-style");

if (filmBorderSelect) {
    const savedStyle = localStorage.getItem("filmBorderStyle") || "polygon";

    filmBorderSelect.value = savedStyle;

    filmBorderSelect.addEventListener("change", () => {
        localStorage.setItem("filmBorderStyle", filmBorderSelect.value);
    });
}
