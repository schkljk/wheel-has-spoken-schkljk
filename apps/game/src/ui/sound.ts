// The game's sound calls (legacy cp_soundwheel.js and upgrade 36), now played by the audio engine in audio/:
// named effects (audio/sfx-data.ts), the hit and combo tables below, and the music tracks.

import { settings } from '../state/game';
import { audioCtx, duck, play, sfx } from '../audio/engine';
import { arenaTrack, musicWanted, phaseTrack, playMusic } from '../audio/music';
import type { Spec as SynthSpec } from '../audio/synth';

export { sfx, duck };
let lastTick = 0;

/** The audio context once sound is allowed (after the first tap), or null. */
export const ac = () => audioCtx();

/** One plain tone (the older calls). */
export function beep(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.04, when = 0) {
  play([{ w: type, f: freq, d: dur, v: vol * 1.4, at: when, lp: type === 'square' || type === 'sawtooth' ? 4000 : undefined }], { vary: 0 });
}

/**
 * A slice edge passing the pointer: a click, higher and lighter while the wheel flies, lower and louder as it
 * crawls (the speed comes from how soon this click follows the last one).
 */
export function tick(heavy = false) {
  const n = performance.now();
  const dt = n - lastTick;
  if (dt < 28) return;
  lastTick = n;
  const speed = Math.max(0, Math.min(1, 1 - (dt - 28) / 260));
  sfx(heavy ? 'wh.tick2' : 'wh.tick', { pitch: 0.8 + 0.45 * speed, gain: 0.75 + 0.45 * (1 - speed), vary: 0.04 });
}
/** The sound of a result: goated, good, mid or cooked. */
export function landSound(q: number) {
  sfx(q >= 3 ? 'wh.land3' : q === 2 ? 'wh.land2' : q === 0 ? 'wh.land0' : 'wh.land1', { vary: 0 });
  if (q >= 3) duck(0.5, 0.8, 0.8);
}
export const thud = (big: boolean) => sfx(big ? 'f.ko' : 'f.self', { vary: 0.02 });
/** The drum roll while a wheel crawls to a stop. */
export function drumRoll(): () => void {
  if (!settings.value.sound) return () => {};
  let i = 0;
  const t = setInterval(() => sfx('wh.roll', { pitch: i++ % 2 ? 1.06 : 1, gain: 0.6 + Math.min(0.5, i * 0.02) }), 95);
  return () => clearInterval(t);
}

/**
 * One voice of the older sound tables: a tone (optionally sliding to `to` Hz) or a burst of filtered noise.
 * Missing length, wave and volume carry over from the voice before, so recipes stay short.
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
const NF: Partial<Record<BiquadFilterType, 'lp' | 'hp' | 'bp'>> = { lowpass: 'lp', highpass: 'hp', bandpass: 'bp' };
/** The older tables, played by the engine (1.4x: the engine's buses sit a little lower than the old direct output). */
function playOld(rec: Voice[]) {
  let d = 0.1;
  let w: OscillatorType = 'triangle';
  let v = 0.04;
  const out: SynthSpec[] = [];
  for (const x of rec) {
    d = x.d ?? d;
    w = x.w ?? w;
    v = x.v ?? v;
    out.push(x.noise ? { w: 'n', ft: NF[x.noise] ?? 'bp', f: x.f, to: x.to, d, v: v * 1.4, at: x.at } : { w, f: x.f, to: x.to, d, v: v * 1.4, at: x.at, lp: w === 'square' || w === 'sawtooth' ? 5000 : undefined });
  }
  play(out);
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
export const procSound = (k: string) => playOld(PROC_SOUND[k] ?? PROC_DEFAULT);
export const hasProcSound = (k: string) => k in PROC_SOUND;


/** The arena's loop for a fight (upgrade 36). Returns its stop. */
export function arenaMusic(k: string | undefined): () => void {
  const t = arenaTrack(k);
  playMusic(t);
  return () => stopIf(t.id);
}
/** A boss's phase-two loop. Returns its stop. */
export function phaseMusic(tune: { root: number; bpm: number }): () => void {
  const t = phaseTrack(tune);
  playMusic(t);
  return () => stopIf(t.id);
}
// a fight stops its own loop when it ends, unless something else is playing by then
const stopIf = (id: string) => {
  if (musicWanted() === id) playMusic(null);
};
export { playMusic };

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
  playOld([...base, ...el.map((x) => ({ ...x, v: x.v * (0.6 + 0.4 * k) })), ...(crit ? CRIT : [])]);
  if (strength > 0.7 || crit) duck(0.6, 0.15, 0.4);
}
/** A soft click for a button press. */
export const uiTap = () => sfx('ui.tap', { vary: 0.05 });

/** The knockout blow in slow motion: a deep boom with a falling shimmer. */
export const finisherSound = () => {
  sfx('f.finisher', { vary: 0 });
  duck(0.35, 0.8, 1);
};
