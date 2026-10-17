import { settings } from '../state/game';

// Little synthesized sounds (legacy cp_soundwheel.js): wheel ticks, landing fanfares, hits.
let actx: AudioContext | null = null;
let lastTick = 0;

/** The audio context, resumed (browsers only allow sound after a tap). */
export function ac(): AudioContext | null {
  if (!actx) {
    try {
      actx = new AudioContext();
    } catch {
      actx = null;
    }
  }
  if (actx && actx.state === 'suspended') void actx.resume().catch(() => {});
  return actx;
}

export function beep(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.04, when = 0) {
  if (!settings.value.sound) return;
  const a = ac();
  if (!a) return;
  try {
    const t = a.currentTime + when;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    // audio is optional
  }
}

/** A slice edge passing the pointer. */
export function tick(heavy = false) {
  const n = performance.now();
  if (n - lastTick < 28) return;
  lastTick = n;
  beep(heavy ? 700 : 1500, heavy ? 0.06 : 0.025, 'square', heavy ? 0.05 : 0.025);
}
/** The sound of a result: goated, cooked or in between. */
export function landSound(q: number) {
  if (q >= 3) [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.18, 'triangle', 0.06, i * 0.08));
  else if (q === 0) [392, 330, 262].forEach((f, i) => beep(f, 0.22, 'sawtooth', 0.035, i * 0.14));
  else [660, 880].forEach((f, i) => beep(f, 0.12, 'triangle', 0.05, i * 0.07));
}
export const thud = (big: boolean) => beep(big ? 90 : 140, big ? 0.22 : 0.12, 'square', 0.06);
/** The drum roll while a wheel crawls to a stop. */
export function drumRoll(): () => void {
  if (!settings.value.sound) return () => {};
  let i = 0;
  const t = setInterval(() => beep(i++ % 2 ? 190 : 160, 0.05, 'square', 0.022), 95);
  return () => clearInterval(t);
}

/**
 * One voice of a sound: a tone (optionally sliding to `to` Hz) or a burst of filtered noise. Missing
 * length, wave and volume carry over from the voice before, so recipes stay short.
 */
interface Voice {
  f: number;
  to?: number;
  d?: number;
  w?: OscillatorType;
  v?: number;
  at?: number;
  noise?: BiquadFilterType;
}
let noiseBuf: AudioBuffer | null = null;
function voice(a: AudioContext, x: Required<Omit<Voice, 'to' | 'noise'>> & Pick<Voice, 'to' | 'noise'>) {
  const t = a.currentTime + x.at;
  const g = a.createGain();
  g.gain.setValueAtTime(x.v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + x.d);
  g.connect(a.destination);
  if (x.noise) {
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const src = a.createBufferSource();
    src.buffer = noiseBuf;
    const fl = a.createBiquadFilter();
    fl.type = x.noise;
    fl.frequency.setValueAtTime(x.f, t);
    if (x.to) fl.frequency.exponentialRampToValueAtTime(x.to, t + x.d);
    src.connect(fl);
    fl.connect(g);
    src.start(t);
    src.stop(t + x.d + 0.02);
  } else {
    const o = a.createOscillator();
    o.type = x.w;
    o.frequency.setValueAtTime(x.f, t);
    if (x.to) o.frequency.exponentialRampToValueAtTime(x.to, t + x.d);
    o.connect(g);
    o.start(t);
    o.stop(t + x.d + 0.02);
  }
}
function play(rec: Voice[]) {
  if (!settings.value.sound) return;
  const a = ac();
  if (!a) return;
  let d = 0.1;
  let w: OscillatorType = 'triangle';
  let v = 0.04;
  try {
    for (const x of rec) {
      d = x.d ?? d;
      w = x.w ?? w;
      v = x.v ?? v;
      voice(a, { f: x.f, to: x.to, d, w, v, at: x.at ?? 0, noise: x.noise });
    }
  } catch {
    // audio is optional
  }
}

/** A sound for each element combo and each synergy that can kick in mid-fight. */
// prettier-ignore
const PROC_SOUND: Record<string, Voice[]> = {
  // element combos
  Electrocuted: [{ f: 110, to: 80, d: 0.3, w: 'sawtooth', v: 0.05 }, { f: 1900, d: 0.03, w: 'square', v: 0.035 }, { f: 2600, at: 0.035 }, { f: 1500, at: 0.07 }, { f: 2900, at: 0.105 }, { f: 2100, at: 0.14 }, { noise: 'highpass', f: 4000, d: 0.18, v: 0.05 }],
  Shatter: [{ noise: 'highpass', f: 2500, d: 0.3, v: 0.09 }, { f: 2093, d: 0.12, w: 'triangle', v: 0.05, at: 0.02 }, { f: 1568, at: 0.07 }, { f: 1319, at: 0.12 }, { f: 988, d: 0.25, at: 0.17 }],
  'Fanned flames': [{ noise: 'bandpass', f: 300, to: 2400, d: 0.45, v: 0.14 }, { f: 147, to: 294, d: 0.4, w: 'sawtooth', v: 0.03 }],
  Resonance: [{ f: 440, d: 0.7, w: 'sine', v: 0.05 }, { f: 447 }, { f: 880, d: 0.5, w: 'triangle', v: 0.02, at: 0.05 }],
  Overgrowth: [{ f: 196, d: 0.16, w: 'triangle', v: 0.06 }, { f: 247, at: 0.07 }, { f: 294, at: 0.14 }, { f: 392, d: 0.3, at: 0.21 }],
  'Flash freeze': [{ f: 2800, to: 700, d: 0.4, w: 'sine', v: 0.05 }, { f: 3136, d: 0.08, w: 'triangle', v: 0.03, at: 0.1 }, { f: 2637, at: 0.2 }, { noise: 'highpass', f: 6000, d: 0.25, v: 0.03 }],
  // synergies
  comedy: [{ f: 349, d: 0.12, w: 'square', v: 0.05 }, { f: 440, v: 0.03 }, { f: 349, d: 0.16, v: 0.05, at: 0.18 }, { f: 440, v: 0.03, at: 0.18 }],
  backstab: [{ noise: 'bandpass', f: 5000, to: 9000, d: 0.12, v: 0.08 }, { f: 1760, to: 2640, d: 0.14, w: 'triangle', v: 0.04 }],
  speed: [{ f: 880, d: 0.05, w: 'square', v: 0.03 }, { f: 1175, at: 0.045 }, { f: 1568, at: 0.09 }, { f: 2093, d: 0.1, at: 0.135 }],
  storm2: [{ noise: 'bandpass', f: 600, to: 1800, d: 0.35, v: 0.12 }, { f: 988, d: 0.06, w: 'square', v: 0.025, at: 0.1 }, { f: 1319, d: 0.08, at: 0.17 }],
  tank2: [{ f: 1568, d: 0.5, w: 'triangle', v: 0.04 }, { f: 2349, d: 0.35, v: 0.025 }, { f: 196, d: 0.12, w: 'square', v: 0.05 }],
  zero: [{ f: 1600, to: 400, d: 0.5, w: 'sine', v: 0.05 }, { noise: 'highpass', f: 5000, d: 0.3, v: 0.04 }],
  storm: [{ noise: 'lowpass', f: 400, to: 120, d: 0.7, v: 0.2 }, { f: 2400, d: 0.03, w: 'square', v: 0.03, at: 0.02 }, { f: 1800, at: 0.06 }],
  blood: [{ f: 70, d: 0.12, w: 'sine', v: 0.12 }, { f: 62, d: 0.16, v: 0.1, at: 0.18 }],
  bonelord: [{ f: 98, to: 65, d: 0.6, w: 'sine', v: 0.07, at: 0.05 }, { f: 620, d: 0.03, w: 'square', v: 0.03 }, { f: 520, at: 0.05 }, { f: 640, at: 0.1 }, { f: 500, at: 0.15 }],
  selfown: [{ f: 311, d: 0.22, w: 'sawtooth', v: 0.035 }, { f: 294, at: 0.24 }, { f: 277, at: 0.48 }, { f: 262, to: 247, d: 0.5, at: 0.72 }],
};
const PROC_DEFAULT: Voice[] = [{ f: 784, d: 0.14, w: 'triangle', v: 0.05 }, { f: 1175, at: 0.08 }];

/** The sound of a combo (by name) or a synergy (by key) going off. */
export const procSound = (k: string) => play(PROC_SOUND[k] ?? PROC_DEFAULT);
export const hasProcSound = (k: string) => k in PROC_SOUND;
