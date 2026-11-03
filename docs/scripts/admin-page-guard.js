try {
    const response = await fetch('/api/admin/session', {credentials: 'include'});
    const result = response.ok ? await response.json() : null;
    if (result?.authenticated) {
        document.querySelector('.admin-container').hidden = false;
    } else {
        window.location.replace('index.html?admin=1');
    }
} catch (_) {
    window.location.replace('index.html?admin=1');
}
