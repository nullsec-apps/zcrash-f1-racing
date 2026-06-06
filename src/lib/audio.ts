// Tiny WebAudio SFX engine for ZCRASH — engine drone, screech, crash impacts, coin jingle.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let enabled = true;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function setAudioEnabled(v: boolean) {
  enabled = v;
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(v ? 0.35 : 0, ctx.currentTime, 0.05);
  }
  if (!v) stopEngine();
}

export function isAudioEnabled() {
  return enabled;
}

export function unlockAudio() {
  ensureCtx();
}

function now(): number {
  return ctx ? ctx.currentTime : 0;
}

// Continuous engine drone whose pitch tracks speed (0..1)
export function startEngine() {
  const c = ensureCtx();
  if (!c || !masterGain || !enabled) return;
  if (engineOsc) return;
  engineOsc = c.createOscillator();
  engineGain = c.createGain();
  engineOsc.type = "sawtooth";
  engineOsc.frequency.value = 70;
  engineGain.gain.value = 0;
  engineOsc.connect(engineGain);
  engineGain.connect(masterGain);
  engineOsc.start();
}

export function updateEngine(speed01: number) {
  if (!ctx || !engineOsc || !engineGain || !enabled) return;
  const s = Math.max(0, Math.min(1, speed01));
  engineOsc.frequency.setTargetAtTime(60 + s * 220, ctx.currentTime, 0.06);
  engineGain.gain.setTargetAtTime(0.04 + s * 0.10, ctx.currentTime, 0.08);
}

export function stopEngine() {
  if (engineOsc) {
    try { engineOsc.stop(); } catch {}
    try { engineOsc.disconnect(); } catch {}
    engineOsc = null;
  }
  if (engineGain) {
    try { engineGain.disconnect(); } catch {}
    engineGain = null;
  }
}

function tone(
  freqStart: number,
  freqEnd: number,
  dur: number,
  type: OscillatorType,
  vol: number,
) {
  const c = ensureCtx();
  if (!c || !masterGain || !enabled) return;
  const t = now();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBurst(dur: number, vol: number, filterFreq: number) {
  const c = ensureCtx();
  if (!c || !masterGain || !enabled) return;
  const t = now();
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start(t);
  src.stop(t + dur + 0.02);
}

// Crash impact — intensity 0..1 scales boom + crunch
export function playCrash(intensity: number) {
  const i = Math.max(0, Math.min(1, intensity));
  noiseBurst(0.18 + i * 0.4, 0.4 + i * 0.5, 600 + i * 1800);
  tone(180 - i * 60, 40, 0.25 + i * 0.3, "square", 0.25 + i * 0.25);
  if (i > 0.5) tone(90, 30, 0.5, "sawtooth", 0.3);
}

export function playScreech() {
  tone(900, 1400, 0.12, "sawtooth", 0.08);
}

export function playCoin() {
  tone(660, 660, 0.08, "square", 0.2);
  setTimeout(() => tone(990, 990, 0.16, "square", 0.2), 90);
}

export function playUiTick() {
  tone(440, 660, 0.05, "square", 0.12);
}

export function playGameOver() {
  tone(440, 110, 0.6, "sawtooth", 0.25);
  setTimeout(() => tone(330, 80, 0.7, "square", 0.2), 120);
}
