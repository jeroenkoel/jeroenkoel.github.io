export class LevelEngine {
  constructor({ sceneElement, controlsElement, statusElement, keyframesElement }) {
    this.sceneElement = sceneElement;
    this.controlsElement = controlsElement;
    this.statusElement = statusElement;
    this.keyframesElement = keyframesElement;
    this.currentStates = {};
    this.controlStates = new Map();
    this.interactionCount = 0;
    this.startedAt = null;
  }

  async load(levelDefinition, levelConfiguration) {
    this.level = levelDefinition;
    this.config = levelConfiguration;
    this.validate();
    await this.preloadAssets();
    this.buildKeyframes();
    this.buildScene();
    this.initializeState();
    this.buildControls();
    this.render();
    this.startedAt = performance.now();
  }

  validate() {
    if (!this.level?.scene || !this.level?.elements) throw new Error("Invalid level definition.");
    if (!Array.isArray(this.config?.controls)) throw new Error("Admin configuration must contain controls.");
    const controlled = new Set();
    for (const control of this.config.controls) {
      if (!control.states?.length) throw new Error(`Control '${control.id}' has no states.`);
      if (!control.states.some(s => s.id === control.correctState)) throw new Error(`Control '${control.id}' has no valid correct state.`);
      const groupElements = new Set();
      for (const state of control.states) {
        for (const [elementId, elementState] of Object.entries(state.elements ?? {})) {
          const element = this.level.elements[elementId];
          if (!element) throw new Error(`Unknown element '${elementId}' in control '${control.id}'.`);
          if (!element.states[elementState]) throw new Error(`Unknown state '${elementState}' for '${elementId}'.`);
          groupElements.add(elementId);
        }
      }
      for (const elementId of groupElements) {
        if (controlled.has(elementId)) throw new Error(`Element '${elementId}' is controlled by more than one control.`);
        controlled.add(elementId);
      }
    }
    for (const [elementId, stateId] of Object.entries(this.config.fixedElements ?? {})) {
      const element = this.level.elements[elementId];
      if (!element?.states[stateId]) throw new Error(`Invalid fixed state '${elementId}:${stateId}'.`);
      if (controlled.has(elementId)) throw new Error(`Element '${elementId}' is both fixed and controlled.`);
    }
    for (const elementId of Object.keys(this.level.elements)) {
      if (!controlled.has(elementId) && !(elementId in (this.config.fixedElements ?? {}))) {
        throw new Error(`Element '${elementId}' is neither controlled nor fixed.`);
      }
    }
  }

  getAllImageSources() {
    return [...new Set([
      this.level.scene.background,
      ...(this.level.keyframes ?? []).filter(Boolean),
      ...Object.values(this.level.elements).flatMap(element =>
        Object.values(element.states).flatMap(state => (state.images ?? []).map(image => image.src))
      )
    ])];
  }

  preloadAssets() {
    return Promise.all(this.getAllImageSources().map(src => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Could not load image '${src}'.`));
      image.src = src;
    })));
  }

  buildKeyframes() {
    if (!this.keyframesElement) return;
    const row = this.keyframesElement.querySelector('.keyframe-row');
    row.innerHTML = '';
    const frames = this.level.keyframes ?? [];
    for (let i = 0; i < 3; i++) {
      const frame = document.createElement('div');
      frame.className = 'keyframe';
      if (frames[i]) frame.innerHTML = `<img src="${frames[i]}" alt="Sleutelframe ${i + 1}">`;
      else frame.textContent = `Sleutelframe ${i + 1}`;
      row.appendChild(frame);
    }
  }

  buildScene() {
    const { width, height, background } = this.level.scene;
    this.sceneElement.style.setProperty("--scene-ratio", `${width} / ${height}`);
    this.sceneElement.innerHTML = `<img class="scene-background" src="${background}" alt="">`;
    this.layersElement = document.createElement("div");
    this.layersElement.className = "scene-layers";
    this.sceneElement.appendChild(this.layersElement);
  }

  initializeState() {
    this.currentStates = { ...(this.config.fixedElements ?? {}) };
    this.controlStates.clear();
    for (const control of this.config.controls) {
      this.controlStates.set(control.id, 0);
      this.applyControlState(control.states[0]);
    }
    this.interactionCount = 0;
  }

  buildControls() {
    this.controlsElement.innerHTML = "";
    for (const control of this.config.controls) {
      const wrapper = document.createElement("div");
      wrapper.className = "object-control";
      wrapper.dataset.controlId = control.id;
      wrapper.innerHTML = `
        <button class="control-arrow previous" type="button" aria-label="Vorige stand van ${control.label ?? control.id}">‹</button>
        <div class="control-middle">
          <div class="control-icon-box"><img class="control-icon" alt=""></div>
          <span class="control-name"></span>
          <span class="control-state"></span>
        </div>
        <button class="control-arrow next" type="button" aria-label="Volgende stand van ${control.label ?? control.id}">›</button>`;
      wrapper.querySelector('.previous').addEventListener('click', () => this.cycleControl(control.id, -1));
      wrapper.querySelector('.next').addEventListener('click', () => this.cycleControl(control.id, 1));
      this.controlsElement.appendChild(wrapper);
    }
    this.updateControls();
  }

  cycleControl(controlId, direction) {
    const control = this.config.controls.find(c => c.id === controlId);
    const currentIndex = this.controlStates.get(controlId) ?? 0;
    const nextIndex = (currentIndex + direction + control.states.length) % control.states.length;
    this.controlStates.set(controlId, nextIndex);
    this.applyControlState(control.states[nextIndex]);
    this.interactionCount += 1;
    this.render();
    this.updateControls();
    this.statusElement.textContent = "";
  }

  applyControlState(state) {
    for (const [elementId, elementState] of Object.entries(state.elements)) this.currentStates[elementId] = elementState;
  }

  render() {
    this.layersElement.innerHTML = "";
    const { width, height } = this.level.scene;
    for (const [elementId, stateId] of Object.entries(this.currentStates)) {
      const state = this.level.elements[elementId].states[stateId];
      for (const imageConfig of state.images ?? []) {
        const image = document.createElement("img");
        image.className = "scene-object";
        image.src = imageConfig.src;
        image.alt = "";
        image.style.left = `${(imageConfig.x / width) * 100}%`;
        image.style.top = `${(imageConfig.y / height) * 100}%`;
        image.style.width = `${(imageConfig.width / width) * 100}%`;
        image.style.zIndex = imageConfig.zIndex ?? 1;
        this.layersElement.appendChild(image);
      }
    }
  }

  getControlThumbnail(control, state) {
    const preferredElement = control.iconElement && state.elements[control.iconElement]
      ? control.iconElement
      : Object.keys(state.elements)[0];
    const stateId = state.elements[preferredElement];
    return this.level.elements[preferredElement]?.states[stateId]?.images?.[0]?.src ?? "";
  }

  updateControls() {
    for (const control of this.config.controls) {
      const index = this.controlStates.get(control.id) ?? 0;
      const state = control.states[index];
      const wrapper = this.controlsElement.querySelector(`[data-control-id="${control.id}"]`);
      wrapper.querySelector(".control-name").textContent = control.label ?? control.id;
      wrapper.querySelector(".control-icon").src = this.getControlThumbnail(control, state);
      wrapper.querySelector(".control-state").innerHTML = control.states
        .map((_, i) => `<span class="state-dot ${i === index ? 'active' : ''}">[${i + 1}]</span>`)
        .join(' ');
    }
  }

  submit() {
    const selectedControlStates = {};
    let correct = true;
    for (const control of this.config.controls) {
      const state = control.states[this.controlStates.get(control.id) ?? 0];
      selectedControlStates[control.id] = state.id;
      if (state.id !== control.correctState) correct = false;
    }
    const result = {
      levelId: this.level.id,
      configuration: structuredClone(this.config),
      finalAnswer: { ...this.currentStates },
      selectedControlStates,
      interactionCount: this.interactionCount,
      responseTimeMs: Math.round(performance.now() - this.startedAt),
      correct,
      submittedAt: new Date().toISOString()
    };
    this.statusElement.textContent = "Keuze opgeslagen.";
    return result;
  }
}
