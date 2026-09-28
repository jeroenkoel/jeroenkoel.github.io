function switchScene(sceneName) {
    const targetPath = sceneName.startsWith('/docs/') ? sceneName : `/docs/${sceneName}`;

    window.location.href = targetPath;
}