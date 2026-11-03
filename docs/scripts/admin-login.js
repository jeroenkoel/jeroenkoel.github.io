import {initI18n, t} from '/scripts/i18n.js';

await initI18n();
const previousSessionLogout = fetch('/api/admin/logout', {method: 'POST'}).catch(() => {});

const dialog = document.getElementById('adminLoginDialog');
const openButton = document.getElementById('adminLoginBtn');
const form = document.getElementById('adminLoginForm');
const passwordInput = document.getElementById('adminPassword');
const errorMessage = document.getElementById('adminLoginError');
const submitButton = document.getElementById('adminLoginSubmit');

function openDialog() {
    errorMessage.hidden = true;
    form.reset();
    if (!dialog.open) dialog.showModal();
    passwordInput.focus();
}

openButton.addEventListener('click', async () => {
    await previousSessionLogout;
    openDialog();
});

document.getElementById('adminLoginCancel').addEventListener('click', () => dialog.close());

form.addEventListener('submit', async event => {
    event.preventDefault();
    await previousSessionLogout;
    errorMessage.hidden = true;
    submitButton.disabled = true;
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: passwordInput.value})
        });
        if (!response.ok) {
            errorMessage.textContent = t(response.status === 401 ? 'administrator.wrongPassword'
                : response.status === 429 ? 'administrator.loginRateLimited'
                : response.status === 503 ? 'administrator.loginNotConfigured' : 'administrator.loginFailed');
            errorMessage.hidden = false;
            passwordInput.select();
            return;
        }
        window.location.href = 'administrator.html';
    } catch (_) {
        errorMessage.textContent = t('administrator.loginNetworkError');
        errorMessage.hidden = false;
    } finally {
        submitButton.disabled = false;
    }
});

if (new URLSearchParams(window.location.search).get('admin') === '1') {
    window.history.replaceState(null, '', window.location.pathname);
    openDialog();
}
