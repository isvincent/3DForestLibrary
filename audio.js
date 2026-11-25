// ==========================================================================
// 森嶼書屋 · 心靈微光圖書館 — Zero-Dependency WebAudio Procedural Soundscape
// 程式合成：窗外細雨、壁爐柴火、森林微風、翻書沙沙聲與動物輕柔互動音
// ==========================================================================

export class LibrarySoundscape {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = false;
    this.channels = {
      rain: { level: 0.35, gainNode: null },
      hearth: { level: 0.28, gainNode: null },
      breeze: { level: 0.30, gainNode: null },
      pages: { level: 0.25, gainNode: null }
    };
    this._timers = [];
  }

  _ensureContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.0;
    this.masterGain.connect(this.ctx.destination);

    const noiseBuffer = this._createNoiseBuffer(3.0);

    // 1. Soft Rain outside library window (bandpass pink-ish noise)
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = noiseBuffer;
    rainSrc.loop = true;
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = "bandpass";
    rainFilter.frequency.value = 1150;
    rainFilter.Q.value = 0.65;
    const rainGain = this.ctx.createGain();
    rainGain.gain.value = this.channels.rain.level * 0.22;
    rainSrc.connect(rainFilter).connect(rainGain).connect(this.masterGain);
    rainSrc.start();
    this.channels.rain.gainNode = rainGain;

    // 2. Forest Breeze through wooden eaves (slow modulated lowpass noise)
    const breezeSrc = this.ctx.createBufferSource();
    breezeSrc.buffer = noiseBuffer;
    breezeSrc.loop = true;
    const breezeFilter = this.ctx.createBiquadFilter();
    breezeFilter.type = "lowpass";
    breezeFilter.frequency.value = 340;
    const breezeLfo = this.ctx.createOscillator();
    breezeLfo.frequency.value = 0.14;
    const breezeLfoGain = this.ctx.createGain();
    breezeLfoGain.gain.value = 130;
    breezeLfo.connect(breezeLfoGain).connect(breezeFilter.frequency);
    breezeLfo.start();
    const breezeGain = this.ctx.createGain();
    breezeGain.gain.value = this.channels.breeze.level * 0.26;
    breezeSrc.connect(breezeFilter).connect(breezeGain).connect(this.masterGain);
    breezeSrc.start();
    this.channels.breeze.gainNode = breezeGain;

    // 3. Hearth Warmth (warm low rumble + gentle crackle)
    const hearthSrc = this.ctx.createBufferSource();
    hearthSrc.buffer = noiseBuffer;
    hearthSrc.loop = true;
    const hearthFilter = this.ctx.createBiquadFilter();
    hearthFilter.type = "lowpass";
    hearthFilter.frequency.value = 190;
    const hearthGain = this.ctx.createGain();
    hearthGain.gain.value = this.channels.hearth.level * 0.30;
    hearthSrc.connect(hearthFilter).connect(hearthGain).connect(this.masterGain);
    hearthSrc.start();
    this.channels.hearth.gainNode = hearthGain;

    // 4. Page-turn & Hearth crackle & Distant wooden wind-chime scheduler
    const pagesGain = this.ctx.createGain();
    pagesGain.gain.value = this.channels.pages.level;
    pagesGain.connect(this.masterGain);
    this.channels.pages.gainNode = pagesGain;

    const crackleTimer = window.setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      if (this.channels.hearth.level > 0.05 && Math.random() < 0.55) {
        this._triggerCrackle(noiseBuffer);
      }
      if (this.channels.pages.level > 0.05 && Math.random() < 0.24) {
        this._triggerPageTurn(noiseBuffer);
      }
    }, 1800);
    this._timers.push(crackleTimer);
  }

  _createNoiseBuffer(seconds) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.14;
    }
    return buffer;
  }

  _triggerCrackle(noiseBuffer) {
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 2200 + Math.random() * 1400;
    hp.Q.value = 2.4;
    const env = this.ctx.createGain();
    const peak = 0.045 * this.channels.hearth.level;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    src.connect(hp).connect(env).connect(this.masterGain);
    src.start(now, Math.random() * 1.5, 0.09);
  }

  _triggerPageTurn(noiseBuffer) {
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1600, now);
    bp.frequency.linearRampToValueAtTime(920, now + 0.28);
    bp.Q.value = 1.1;
    const env = this.ctx.createGain();
    const peak = 0.08 * this.channels.pages.level;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    src.connect(bp).connect(env).connect(this.masterGain);
    src.start(now, Math.random() * 1.2, 0.36);
  }

  toggle(forceState) {
    this._ensureContext();
    if (!this.ctx) return false;
    this.enabled = typeof forceState === "boolean" ? forceState : !this.enabled;
    if (this.enabled && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.enabled ? 0.9 : 0.0, now + 0.45);
    return this.enabled;
  }

  setChannelLevel(channel, value) {
    if (!this.channels[channel]) return;
    this.channels[channel].level = value;
    if (!this.ctx || !this.channels[channel].gainNode) return;
    const mult = channel === "rain" ? 0.22 : channel === "breeze" ? 0.26 : channel === "hearth" ? 0.30 : 1.0;
    this.channels[channel].gainNode.gain.setTargetAtTime(value * mult, this.ctx.currentTime, 0.08);
  }

  playAnimalChime(species = "owl") {
    this._ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    const pitchMap = {
      owl: [523.25, 659.25],
      capybara: [392.0, 440.0],
      bear: [329.63, 392.0],
      rabbit: [659.25, 783.99],
      fox: [587.33, 698.46],
      deer: [493.88, 587.33]
    };
    const notes = pitchMap[species] || [523.25, 659.25];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      g.gain.setValueAtTime(0.0001, now + idx * 0.09);
      g.gain.linearRampToValueAtTime(0.065, now + idx * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.28);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.31);
    });
  }
}
