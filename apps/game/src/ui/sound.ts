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
function voice(a: AudioContext, x: Required<Omit<Voice, 'to' | 'noise'>> & Pick<Voice, 'to' | 'noise'>, out: AudioNode = a.destination, t0 = a.currentTime) {
  const t = t0 + x.at;
  const g = a.createGain();
  g.gain.setValueAtTime(x.v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + x.d);
  g.connect(out);
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
/** A secret found: a rising sparkle (hidden synergies). */
const SECRET: Voice[] = [523, 659, 784, 1047, 1319].map((f, i) => ({ f, d: 0.22, w: 'triangle', v: 0.045, at: i * 0.07 }));
for (const k of ['h_bgchar', 'h_underdog', 'h_irony', 'h_comic', 'h_dumpster', 'h_trashking']) PROC_SOUND[k] = SECRET;

/** The sound of a combo (by name) or a synergy (by key) going off. */
export const procSound = (k: string) => play(PROC_SOUND[k] ?? PROC_DEFAULT);
export const hasProcSound = (k: string) => k in PROC_SOUND;

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
/** Root movement per bar of the phase-two loop (minor: i, i, III, VII). */
const PHASE_BARS = [0, 0, 3, -2];

/**
 * A music loop (upgrade 36): calls `step` for every sixteenth note just ahead of time, on its own gain that
 * follows the Music switch, until the returned stop is called.
 */
function musicLoop(bpm: number, level: number, step: (a: AudioContext, out: GainNode, s: number, bar: number, t: number, len: number) => void): () => void {
  const a = ac();
  if (!a) return () => {};
  const master = a.createGain();
  master.gain.value = 0;
  master.connect(a.destination);
  const len = 60 / bpm / 4;
  let next = a.currentTime + 0.1;
  let n = 0;
  let on = false;
  const tick = () => {
    const want = settings.value.music !== false;
    if (want !== on) {
      on = want;
      master.gain.cancelScheduledValues(a.currentTime);
      master.gain.setTargetAtTime(on ? level : 0, a.currentTime, 0.3);
    }
    while (next < a.currentTime + 0.12) {
      try {
        step(a, master, n % 16, Math.floor(n / 16), next, len);
      } catch {
        // audio is optional
      }
      next += len;
      n++;
    }
  };
  tick();
  const timer = setInterval(tick, 40);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    try {
      master.gain.cancelScheduledValues(a.currentTime);
      master.gain.setTargetAtTime(0, a.currentTime, 0.25);
      setTimeout(() => master.disconnect(), 1500);
    } catch {
      // already gone
    }
  };
}
const v0 = { at: 0 };

/**
 * The phase-two music: a driving minor-key loop (bass, kick, hats and a stab every other bar) around the
 * boss's root note and tempo, until the returned stop is called.
 */
export function phaseMusic(tune: { root: number; bpm: number }): () => void {
  return musicLoop(tune.bpm, 0.7, (a, out, s, bar, t, len) => {
    const root = tune.root + PHASE_BARS[bar % PHASE_BARS.length]!;
    if (s % 2 === 0) voice(a, { f: hz(root + (s === 6 || s === 14 ? 12 : 0)), d: len * 1.6, w: 'sawtooth', v: 0.05, ...v0 }, out, t);
    if (s === 0 || s === 8 || (s === 10 && bar % 2 === 1)) voice(a, { f: 120, to: 42, d: 0.16, w: 'sine', v: 0.22, ...v0 }, out, t);
    if (s % 4 === 2) voice(a, { f: 7500, d: 0.035, w: 'square', v: 0.05, noise: 'highpass', ...v0 }, out, t);
    if (s === 0 && bar % 2 === 0) for (const iv of [24, 27, 31]) voice(a, { f: hz(root + iv), d: len * 3, w: 'square', v: 0.014, ...v0 }, out, t);
  });
}

/** Each arena's mood: root note, tempo, major or minor, and the lead's wave (upgrade 36). */
// prettier-ignore
const ARENA_TUNES: Record<string, { root: number; bpm: number; minor?: boolean; w: OscillatorType }> = {
  colosseum: { root: 50, bpm: 104, w: 'triangle' }, lava: { root: 45, bpm: 112, minor: true, w: 'sawtooth' },
  flood: { root: 48, bpm: 92, minor: true, w: 'sine' }, tundra: { root: 52, bpm: 84, minor: true, w: 'triangle' },
  graveyard: { root: 43, bpm: 76, minor: true, w: 'sine' }, cathedral: { root: 53, bpm: 72, w: 'sine' },
  thunder: { root: 44, bpm: 120, minor: true, w: 'square' }, forest: { root: 47, bpm: 88, minor: true, w: 'triangle' },
  space: { root: 49, bpm: 80, w: 'sine' }, kitchen: { root: 55, bpm: 116, w: 'square' },
  rooftop: { root: 46, bpm: 96, minor: true, w: 'triangle' }, mirror: { root: 51, bpm: 86, w: 'sine' },
  beach: { root: 53, bpm: 100, w: 'triangle' }, ballpit: { root: 57, bpm: 126, w: 'square' },
  void: { root: 41, bpm: 70, minor: true, w: 'sine' },
  snowglobe: { root: 57, bpm: 90, w: 'triangle' }, newyear: { root: 53, bpm: 118, w: 'square' },
  valentine: { root: 55, bpm: 84, w: 'sine' }, clover: { root: 55, bpm: 112, w: 'triangle' },
  egghunt: { root: 57, bpm: 104, w: 'triangle' }, bonfire: { root: 50, bpm: 96, w: 'triangle' },
  poolparty: { root: 53, bpm: 108, w: 'sine' }, pumpkin: { root: 45, bpm: 92, minor: true, w: 'square' },
  leafpile: { root: 52, bpm: 88, minor: true, w: 'triangle' },
};
/** Chord roots per bar: I V vi IV in major, i VI III VII in minor. */
const MAJOR_BARS = [0, 7, 9, 5];
const MINOR_BARS = [0, 8, 3, 10];
/** A light loop for the arena while the fight is on: soft bass, a pad, a few notes on top and a quiet hat. */
export function arenaMusic(k: string | undefined): () => void {
  const T = ARENA_TUNES[k || ''] ?? ARENA_TUNES.colosseum!;
  const third = T.minor ? 3 : 4;
  return musicLoop(T.bpm, 0.45, (a, out, s, bar, t, len) => {
    const r = T.root + (T.minor ? MINOR_BARS : MAJOR_BARS)[bar % 4]!;
    // in minor, VI and III are major chords and VII is too; the rest follow the key
    const th = T.minor ? ([8, 3, 10].includes(r - T.root) ? 4 : 3) : [9].includes(r - T.root) ? 3 : third;
    if (s % 4 === 0) voice(a, { f: hz(r - 12), d: len * 3, w: 'sine', v: 0.07, ...v0 }, out, t);
    if (s === 0) for (const iv of [0, th, 7]) voice(a, { f: hz(r + 12 + iv), d: len * 15, w: 'sine', v: 0.012, ...v0 }, out, t);
    if ([2, 6, 10, 13].includes(s)) {
      const iv = [12, 12 + th, 19, 24][(s + bar) % 4]!;
      voice(a, { f: hz(r + iv), d: len * 1.5, w: T.w, v: T.w === 'square' || T.w === 'sawtooth' ? 0.008 : 0.016, ...v0 }, out, t);
    }
    if (s % 4 === 2) voice(a, { f: 8000, d: 0.025, w: 'square', v: 0.012, noise: 'highpass', ...v0 }, out, t);
  });
}

// ---------------------------------------------------------------- hits (upgrade 36)
export type HitKind = 'blade' | 'blunt' | 'ranged' | 'fist' | 'magic';
/** a voice with its length and volume spelled out, so scaling one never leans on the voice before */
type Spec = Voice & { d: number; v: number };
/** What a hit sounds like, by what it was dealt with. Every voice spells out its length, wave and volume. */
// prettier-ignore
const HIT: Record<HitKind, Spec[]> = {
  blade: [{ noise: 'bandpass', f: 2800, to: 7200, d: 0.09, v: 0.08 }, { f: 2100, to: 1300, d: 0.09, w: 'triangle', v: 0.018, at: 0.03 }],
  blunt: [{ f: 115, to: 52, d: 0.17, w: 'sine', v: 0.17 }, { noise: 'lowpass', f: 900, to: 180, d: 0.13, v: 0.11 }],
  ranged: [{ noise: 'highpass', f: 2400, to: 5200, d: 0.1, v: 0.05 }, { f: 420, to: 190, d: 0.07, w: 'square', v: 0.035, at: 0.08 }],
  fist: [{ f: 165, to: 80, d: 0.11, w: 'sine', v: 0.15 }, { noise: 'lowpass', f: 1300, to: 400, d: 0.07, v: 0.08 }],
  magic: [{ f: 220, to: 110, d: 0.2, w: 'sine', v: 0.1 }, { noise: 'bandpass', f: 1200, to: 600, d: 0.18, v: 0.06 }],
};
/** An element layer on top of the hit. */
// prettier-ignore
const ELEMENT: Record<string, Spec[]> = {
  fire: [{ noise: 'bandpass', f: 500, to: 2200, d: 0.28, v: 0.09 }],
  ice: [{ f: 2637, d: 0.12, w: 'triangle', v: 0.025, at: 0.02 }, { f: 3520, d: 0.14, w: 'triangle', v: 0.018, at: 0.07 }],
  lightning: [{ f: 1900, to: 600, d: 0.12, w: 'square', v: 0.025 }, { noise: 'highpass', f: 4500, d: 0.1, v: 0.05 }],
  water: [{ noise: 'lowpass', f: 1600, to: 300, d: 0.24, v: 0.1 }, { f: 520, to: 260, d: 0.12, w: 'sine', v: 0.03, at: 0.03 }],
  wind: [{ noise: 'bandpass', f: 700, to: 2600, d: 0.3, v: 0.07 }],
  shadow: [{ f: 82, d: 0.3, w: 'sine', v: 0.08 }, { f: 87, d: 0.3, w: 'sine', v: 0.06 }],
  light: [{ f: 1047, d: 0.14, w: 'triangle', v: 0.025 }, { f: 1319, d: 0.14, w: 'triangle', v: 0.02, at: 0.05 }, { f: 1568, d: 0.18, w: 'triangle', v: 0.018, at: 0.1 }],
  poison: [{ f: 300, to: 520, d: 0.06, w: 'sine', v: 0.03 }, { f: 260, to: 480, d: 0.06, w: 'sine', v: 0.03, at: 0.08 }],
  plant: [{ noise: 'bandpass', f: 1800, to: 900, d: 0.16, v: 0.05 }, { f: 330, d: 0.1, w: 'triangle', v: 0.025, at: 0.05 }],
  sonic: [{ f: 660, d: 0.25, w: 'sine', v: 0.03 }, { f: 667, d: 0.25, w: 'sine', v: 0.03 }],
  gravity: [{ f: 70, to: 40, d: 0.35, w: 'sine', v: 0.12 }],
  earth: [{ noise: 'lowpass', f: 400, to: 90, d: 0.3, v: 0.14 }],
  mind: [{ f: 880, to: 1320, d: 0.2, w: 'sine', v: 0.02 }, { f: 1320, to: 880, d: 0.2, w: 'sine', v: 0.02 }],
};
const CRIT: Voice[] = [{ f: 2794, d: 0.08, w: 'triangle', v: 0.03, at: 0.04 }, { f: 3729, d: 0.12, w: 'triangle', v: 0.022, at: 0.09 }];
/**
 * One hit: what it was dealt with, its element, and how hard it landed (0 to 1). Harder hits are louder and
 * deeper; crits get a bright ting on top.
 */
export function hitSound(kind: HitKind, element: string | undefined, strength: number, crit = false) {
  const k = 0.55 + 0.75 * Math.max(0, Math.min(1, strength));
  const deep = 1.15 - 0.3 * Math.max(0, Math.min(1, strength));
  const base = HIT[kind].map((x) => ({ ...x, v: x.v * k, f: x.noise ? x.f : x.f * deep, to: x.to && !x.noise ? x.to * deep : x.to }));
  const el = (element && ELEMENT[element]) || [];
  play([...base, ...el.map((x) => ({ ...x, v: x.v * (0.6 + 0.4 * k) })), ...(crit ? CRIT : [])]);
}
/** A soft click for a button press. */
export const uiTap = () => play([{ f: 1700, to: 1100, d: 0.022, w: 'triangle', v: 0.012 }]);

/** The knockout blow in slow motion: a deep boom with a falling shimmer. */
export const finisherSound = () =>
  play([
    { noise: 'lowpass', f: 900, to: 120, d: 0.9, v: 0.25 },
    { f: 90, to: 30, d: 0.9, w: 'sine', v: 0.22 },
    { f: 1400, to: 300, d: 0.55, w: 'triangle', v: 0.03, at: 0.05 },
  ]);
