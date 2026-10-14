/* Web Audio: eventos imediatos, trilhas locais e suspensão junto com o jogo. */
const ORBITAL_PHASE_TRACKS = Object.freeze(['adventure1', 'action1', 'adventure2', 'action2', 'adventureBoss', 'briefing', 'action3', 'boss']);
const ORBITAL_CUES = Object.freeze({
  shot: { asset: 'shot', gain: .13, interval: .10, duration: .22 },
  explosion: { asset: 'explosion', gain: .48, interval: .035, duration: .75 },
  impact: { asset: 'impact', gain: .32, interval: .06, duration: .35 },
  earth: { asset: 'earth', gain: .65, interval: .08, duration: .9, duck: .45 },
  noise: { asset: 'noise', gain: .24, interval: .15, duration: .28 },
  spy: { asset: 'spy', gain: .30, interval: .15, duration: .45 },
  cannon: { asset: 'cannon', gain: .72, interval: .5, duration: 1, duck: 1.2 },
  mothership: { asset: 'mothership', gain: .8, interval: .5, duration: 1.5, duck: 1.5 },
  ui: { notes: [660, 880], gain: .045, interval: .07, duration: .08 },
  move: { notes: [260], gain: .035, interval: .075, duration: .065 },
  confirm: { notes: [440, 660, 880], gain: .09, interval: .2, duration: .22 },
  phase: { notes: [392, 523, 784], gain: .10, interval: .3, duration: .3 },
  hadamard: { notes: [523, 659, 784, 1047], gain: .09, interval: .2, duration: .35 },
  correction: { notes: [392, 587, 784], gain: .09, interval: .2, duration: .3 },
  regenReady: { notes: [330, 494, 660], gain: .075, interval: .2, duration: .3 },
  compromised: { notes: [220, 207, 220, 207], gain: .10, interval: .4, duration: .5, duck: .7 },
  interference: { notes: [196, 294, 196], gain: .075, interval: .5, duration: .36, duck: .4 },
  defeat: { notes: [392, 330, 262, 196], gain: .11, interval: .5, duration: .7 },
  victory: { notes: [523, 659, 784, 1047], gain: .12, interval: .5, duration: .65 }
});

class OrbitalAudioEngine {
  constructor({ assets = {}, createContext, storage, onChange = () => {} } = {}) {
    this.assets = assets;
    this.createContext = createContext || (() => { const Context = globalThis.AudioContext || globalThis.webkitAudioContext; return Context ? new Context({ latencyHint: 'interactive' }) : null; });
    this.storage = storage; this.onChange = onChange;
    this.context = null; this.preferences = { muted: false, music: .16, effects: .65 };
    try { const saved = JSON.parse(storage?.getItem('qubit-audio') || 'null'); if (saved) { this.preferences.muted = saved.muted === true; for (const key of ['music', 'effects']) if (Number.isFinite(saved[key])) this.preferences[key] = Math.max(0, Math.min(1, saved[key])); } } catch {}
    this.scene = 'menu'; this.phase = 1; this.track = 'menu';
    this.pauses = new Set(); this.buffers = new Map(); this.loading = new Map();
    this.voices = new Set(); this.musicVoices = new Set(); this.loops = new Map(); this.lastCue = new Map();
    this.musicVoice = null; this.revision = 0; this.shotIndex = 0; this.errors = [];
  }
  notify() { this.onChange(this.status()); }
  status() { return { ready: !!this.context, running: this.context?.state === 'running', scene: this.scene, track: this.track, muted: this.preferences.muted, paused: this.pauses.size > 0, musicSources: this.musicVoices.size, effects: this.voices.size, loops: [...this.loops.keys()], decoded: this.buffers.size, errors: [...this.errors] }; }
  unlock() {
    if (!this.context) {
      try {
        this.context = this.createContext(); if (!this.context) return;
        const c = this.context;
        this.master = c.createGain(); this.musicBus = c.createGain(); this.effectBus = c.createGain(); this.duckBus = c.createGain();
        this.compressor = c.createDynamicsCompressor(); this.compressor.threshold.value = -10; this.compressor.knee.value = 12; this.compressor.ratio.value = 4; this.compressor.attack.value = .005; this.compressor.release.value = .15;
        this.musicBus.connect(this.duckBus); this.duckBus.connect(this.master); this.effectBus.connect(this.master); this.master.connect(this.compressor); this.compressor.connect(c.destination);
        this.applyVolumes();
        for (const [key, asset] of Object.entries(this.assets)) if (asset.kind === 'sfx') this.load(key);
        this.ensureMusic();
      } catch { this.context = null; this.notify(); return; }
    }
    if (!this.pauses.size && this.context.state !== 'running') this.context.resume().catch(() => {});
    this.notify();
  }
  async load(key) {
    if (this.buffers.has(key)) return this.buffers.get(key);
    if (this.loading.has(key)) return this.loading.get(key);
    if (!this.context || !this.assets[key]) return null;
    const pending = Promise.resolve().then(async () => {
      try {
        const binary = atob(this.assets[key].data), bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
        const buffer = await this.context.decodeAudioData(bytes.buffer);
        this.buffers.set(key, buffer); return buffer;
      } catch { if (!this.errors.includes(key)) this.errors.push(key); return null; }
    });
    this.loading.set(key, pending); pending.finally(() => this.loading.delete(key)); return pending;
  }
  trackFor(scene, phase) {
    if (scene === 'phase') return ORBITAL_PHASE_TRACKS[Math.max(0, Math.min(7, phase - 1))];
    if (scene === 'finale') return 'boss';
    if (scene === 'boss') return phase >= 7 ? 'boss' : 'adventureBoss';
    if (scene === 'victory') return 'victory';
    if (scene === 'defeat') return null;
    return scene === 'menu' ? 'menu' : 'briefing';
  }
  sceneGain() { return ['story', 'briefing'].includes(this.scene) ? .22 : this.scene === 'menu' ? .32 : this.scene === 'tutorial' ? .3 : this.scene === 'finale' ? .32 : .52; }
  setScene(scene, phase = 1) {
    this.scene = scene; this.phase = phase; this.track = this.trackFor(scene, phase); this.revision++;
    if (this.context) {
      this.applyVolumes(); this.ensureMusic();
      // Prepare the next gameplay track while the player reads or trains.
      const next = scene === 'briefing' ? ORBITAL_PHASE_TRACKS[phase - 1] : scene === 'tutorial' ? ORBITAL_PHASE_TRACKS[0] : null;
      if (next) this.load(next).then(() => this.trimMusicBuffers());
    }
    this.notify();
  }
  async ensureMusic() {
    if (!this.context) return;
    const revision = this.revision, key = this.track;
    if (!key) { if (this.musicVoice) this.retireMusic(this.musicVoice); this.musicVoice = null; return; }
    if (this.musicVoice?.key === key) return;
    const buffer = await this.load(key);
    if (!buffer || revision !== this.revision || key !== this.track) return;
    // Multiple unlocks and scene requests must never create duplicate loops.
    if (this.musicVoice?.key === key) return;
    const c = this.context, source = c.createBufferSource(), gain = c.createGain();
    source.buffer = buffer; source.loop = true; source.connect(gain); gain.connect(this.musicBus);
    gain.gain.setValueAtTime(0, c.currentTime); gain.gain.linearRampToValueAtTime(1, c.currentTime + .8);
    const voice = { key, source, gain }; this.musicVoices.add(voice);
    source.onended = () => { source.disconnect(); gain.disconnect(); this.musicVoices.delete(voice); this.trimMusicBuffers(); };
    if (this.musicVoice) this.retireMusic(this.musicVoice);
    this.musicVoice = voice; source.start(c.currentTime);
    this.trimMusicBuffers();
    if (this.scene === 'phase' && this.phase < 8) this.load(ORBITAL_PHASE_TRACKS[this.phase]).then(() => this.trimMusicBuffers());
    this.notify();
  }
  retireMusic(voice) {
    const t = this.context.currentTime;
    voice.gain.gain.cancelScheduledValues(t); voice.gain.gain.setValueAtTime(voice.gain.gain.value, t); voice.gain.gain.linearRampToValueAtTime(0, t + .8);
    try { voice.source.stop(t + .82); } catch {}
  }
  trimMusicBuffers() {
    const keep = new Set([this.track, ...[...this.musicVoices].map(v => v.key)]);
    if (this.scene === 'phase' && this.phase < 8) keep.add(ORBITAL_PHASE_TRACKS[this.phase]);
    if (this.scene === 'briefing') keep.add(ORBITAL_PHASE_TRACKS[this.phase - 1]);
    if (this.scene === 'tutorial') keep.add(ORBITAL_PHASE_TRACKS[0]);
    for (const key of this.buffers.keys()) if (this.assets[key]?.kind === 'music' && !keep.has(key)) this.buffers.delete(key);
  }
  setPaused(reason, paused) {
    paused ? this.pauses.add(reason) : this.pauses.delete(reason);
    if (this.context) {
      const operation = this.pauses.size ? this.context.suspend() : this.context.resume();
      operation.then(() => {
        // A quick pause/resume may finish promises in the opposite order.
        if (this.pauses.size && this.context.state === 'running') this.context.suspend().catch(() => {});
        if (!this.pauses.size && this.context.state === 'suspended') this.context.resume().catch(() => {});
        this.notify();
      }).catch(() => {});
    }
    this.notify();
  }
  applyVolumes() {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.preferences.muted ? 0 : .85, t, .025);
    this.musicBus.gain.setTargetAtTime(this.preferences.music * this.sceneGain(), t, .08);
    this.effectBus.gain.setTargetAtTime(this.preferences.effects, t, .025);
  }
  setPreferences(change) {
    if (typeof change.muted === 'boolean') this.preferences.muted = change.muted;
    for (const key of ['music', 'effects']) if (Number.isFinite(change[key])) this.preferences[key] = Math.max(0, Math.min(1, change[key]));
    try { this.storage?.setItem('qubit-audio', JSON.stringify(this.preferences)); } catch {}
    if (this.preferences.muted) for (const voice of [...this.voices]) this.stopVoice(voice);
    this.applyVolumes(); this.notify();
  }
  duck(duration) {
    const p = this.duckBus.gain, t = this.context.currentTime;
    p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(.32, t + .025); p.setValueAtTime(.32, t + duration); p.linearRampToValueAtTime(1, t + duration + .3);
  }
  sfx(name, options = {}) {
    const cue = ORBITAL_CUES[name], c = this.context;
    if (!cue || !c || c.state !== 'running' || this.pauses.size || this.preferences.muted || this.preferences.effects === 0) return false;
    const now = c.currentTime;
    if (now - (this.lastCue.get(name) ?? -Infinity) < cue.interval) return false;
    this.lastCue.set(name, now);
    // Quiet repetitive cues yield to impacts and alerts.
    if (this.voices.size >= 18) { if (['shot', 'move', 'ui'].includes(name)) return false; this.stopVoice(this.voices.values().next().value); }
    if (cue.duck) this.duck(cue.duck);
    let asset = cue.asset;
    if (name === 'shot') asset = this.shotIndex++ % 2 ? 'shotAlt' : 'shot';
    const buffer = this.buffers.get(asset);
    if (buffer) this.bufferVoice(buffer, cue, options, name);
    else this.toneVoice(cue.notes || (name === 'shot' ? [900, 240] : [180, 90]), cue.gain, cue.duration, options.pan, name);
    return true;
  }
  output(gain, pan = 0) {
    const c = this.context;
    if (!c.createStereoPanner) { gain.connect(this.effectBus); return null; }
    const panner = c.createStereoPanner(); panner.pan.value = Math.max(-.65, Math.min(.65, Number(pan) || 0)); gain.connect(panner); panner.connect(this.effectBus); return panner;
  }
  bufferVoice(buffer, cue, options, name) {
    const c = this.context, source = c.createBufferSource(), gain = c.createGain(), t = c.currentTime;
    const duration = Math.min(buffer.duration, cue.duration), voice = { nodes: [source], gain, panner: this.output(gain, options.pan), name };
    source.buffer = buffer; source.connect(gain);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(cue.gain, t + .004); gain.gain.setValueAtTime(cue.gain, t + Math.max(.004, duration - .03)); gain.gain.linearRampToValueAtTime(0, t + duration);
    this.voices.add(voice); source.onended = () => this.disposeVoice(voice);
    source.start(t, 0, duration); source.stop(t + duration + .01);
  }
  toneVoice(notes, volume, duration, pan = 0, name = 'tone') {
    const c = this.context, gain = c.createGain(), t = c.currentTime;
    const voice = { nodes: [], gain, panner: this.output(gain, pan), name }; this.voices.add(voice);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(volume, t + .008); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    const oscillator = c.createOscillator(); oscillator.type = name === 'move' ? 'sine' : 'triangle'; oscillator.connect(gain);
    notes.forEach((note, index) => oscillator.frequency.setValueAtTime(note, t + index * duration / notes.length));
    voice.nodes.push(oscillator); oscillator.onended = () => this.disposeVoice(voice); oscillator.start(t); oscillator.stop(t + duration + .01);
  }
  disposeVoice(voice) { for (const node of voice.nodes) node.disconnect(); voice.gain.disconnect(); voice.panner?.disconnect(); this.voices.delete(voice); }
  stopVoice(voice) { if (!voice) return; for (const node of voice.nodes) { try { node.stop(); } catch {} } this.disposeVoice(voice); }
  startLoop(name) {
    if (!this.context || this.pauses.size || this.loops.has(name)) return;
    const c = this.context, gain = c.createGain(), t = c.currentTime;
    const base = name === 'charge' ? 70 : name === 'beam' ? 95 : 110;
    const loop = { nodes: [], gain, base };
    gain.connect(this.effectBus); gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(name === 'beam' ? .10 : .045, t + .08);
    for (const multiplier of [1, 1.5, 2.01]) {
      const oscillator = c.createOscillator(); oscillator.type = name === 'beam' ? 'sawtooth' : 'sine'; oscillator.frequency.value = base * multiplier;
      oscillator.connect(gain); oscillator.start(t); loop.nodes.push(oscillator);
    }
    this.loops.set(name, loop);
  }
  setLoopPitch(name, ratio) { const loop = this.loops.get(name); if (loop) loop.nodes.forEach((node, index) => node.frequency.setTargetAtTime(loop.base * [1, 1.5, 2.01][index] * ratio, this.context.currentTime, .025)); }
  stopLoop(name) {
    const loop = this.loops.get(name); if (!loop) return;
    const t = this.context.currentTime; loop.gain.gain.cancelScheduledValues(t); loop.gain.gain.setTargetAtTime(0, t, .01);
    let remaining = loop.nodes.length;
    for (const node of loop.nodes) { node.onended = () => { node.disconnect(); if (--remaining === 0) loop.gain.disconnect(); }; try { node.stop(t + .06); } catch {} }
    this.loops.delete(name);
  }
  stopEffects() { for (const name of [...this.loops.keys()]) this.stopLoop(name); for (const voice of [...this.voices]) this.stopVoice(voice); this.lastCue.clear(); }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { OrbitalAudioEngine, ORBITAL_PHASE_TRACKS, ORBITAL_CUES };
let audioStorage;
try { if (typeof localStorage !== 'undefined') audioStorage = localStorage; } catch {}
const gameAudio = new OrbitalAudioEngine({ assets: globalThis.ORBITAL_AUDIO_ASSETS || {}, storage: audioStorage });

if (typeof document !== 'undefined') {
  const ui = document.createElement('aside'); ui.className = 'audio-controls'; ui.setAttribute('aria-label', 'Configurações de áudio');
  ui.innerHTML = '<button type="button" id="audioToggle" aria-expanded="false" aria-controls="audioPanel">♫ <span>Som</span></button><div id="audioPanel" class="audio-panel" hidden><div><b>Áudio da missão</b><button type="button" id="audioClose" aria-label="Fechar configurações de áudio">×</button></div><button type="button" id="audioMute" aria-pressed="false">Silenciar tudo · M</button><label for="audioMusic">Música <output id="audioMusicValue"></output></label><input id="audioMusic" type="range" min="0" max="100" step="1"><label for="audioEffects">Efeitos <output id="audioEffectsValue"></output></label><input id="audioEffects" type="range" min="0" max="100" step="1"><small id="audioStatus">O som começa após seu primeiro toque.</small><a href="assets/audio/CREDITS.md" target="_blank" rel="noopener noreferrer">Créditos dos áudios</a></div>';
  document.body.appendChild(ui);
  const element = id => document.getElementById(id);
  const refresh = () => {
    const pref = gameAudio.preferences;
    element('audioMute').setAttribute('aria-pressed', String(pref.muted)); element('audioMute').textContent = pref.muted ? 'Ativar som · M' : 'Silenciar tudo · M';
    element('audioToggle').classList.toggle('muted', pref.muted);
    for (const [id, key] of [['Music', 'music'], ['Effects', 'effects']]) { element('audio' + id).value = Math.round(pref[key] * 100); element('audio' + id + 'Value').textContent = Math.round(pref[key] * 100) + '%'; }
    element('audioStatus').textContent = !gameAudio.context ? 'O som começa após seu primeiro toque.' : pref.muted ? 'Som desativado.' : gameAudio.pauses.size ? 'Áudio pausado.' : 'Música discreta; efeitos acompanham as ações.';
  };
  gameAudio.onChange = refresh; refresh();
  const panel = open => { element('audioPanel').hidden = !open; element('audioToggle').setAttribute('aria-expanded', String(open)); };
  element('audioToggle').addEventListener('click', () => panel(element('audioPanel').hidden));
  element('audioClose').addEventListener('click', () => { panel(false); element('audioToggle').focus(); });
  element('audioMute').addEventListener('click', () => gameAudio.setPreferences({ muted: !gameAudio.preferences.muted }));
  element('audioMusic').addEventListener('input', event => gameAudio.setPreferences({ music: Number(event.target.value) / 100 }));
  element('audioEffects').addEventListener('input', event => gameAudio.setPreferences({ effects: Number(event.target.value) / 100 }));
  document.addEventListener('pointerdown', () => gameAudio.unlock(), { capture: true });
  document.addEventListener('keydown', event => {
    gameAudio.unlock();
    if (event.code === 'KeyM' && !event.repeat && !event.target.closest('input, textarea, [contenteditable]')) { event.preventDefault(); gameAudio.setPreferences({ muted: !gameAudio.preferences.muted }); }
    if (event.target.closest('.audio-controls')) { if (event.code === 'Escape') { panel(false); element('audioToggle').focus(); } event.stopPropagation(); }
  }, { capture: true });
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && !button.disabled && !button.closest('.audio-controls, .touch-controls, .training-flight-controls') && !['btnContinue', 'btnStart', 'trainingNext'].includes(button.id) && !button.dataset.trainingAction) gameAudio.sfx('ui');
    if (!event.target.closest('.audio-controls')) panel(false);
  });
  window.addEventListener('blur', () => gameAudio.setPaused('hidden', true));
  window.addEventListener('focus', () => { if (!document.hidden) gameAudio.setPaused('hidden', false); });
  document.addEventListener('visibilitychange', () => gameAudio.setPaused('hidden', document.hidden));
}
