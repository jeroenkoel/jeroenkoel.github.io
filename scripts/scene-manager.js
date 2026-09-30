function switchScene(sceneName) {
    const targetPath = sceneName.startsWith('/scenes/') ? sceneName : `/scenes/${sceneName}`;

    window.location.href = targetPath;
}