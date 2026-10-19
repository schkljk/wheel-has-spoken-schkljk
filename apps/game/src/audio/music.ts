// The music: one track at a time on the music bus, crossfading when the game moves between menus (the theme),
// an arena (its own light loop) and a boss's phase two. Each track is rendered once, offline, into a loop that
// plays on repeat (mono, 22 kHz): synthesizing it note by note as it played cost 34 ms of every second on the
// hub on a mid-range phone, and about 80 audio nodes a second. Where offline rendering isn't available, tracks
// are scheduled a little ahead on the audio clock, a sixteenth note at a time, as before.

import { effect } from '@preact/signals';
import { settings } from '../state/game';
import { audioCtx, buses, whenUnlocked } from './engine';
import { THEME, bassNotes, chordOf, harmonyUnder, leadNotes, type SongData } from './songs';
import { hz, voice, type Spec } from './synth';

/** A piece of music: its tempo, its length in sixteenths, and what plays on each one. */
export interface Track {
  id: string;
  bpm: number;
  steps: number;
  /** its level, so every track sits about as loud as the others (measured with tools/audio/music.mjs) */
  level: number;
  /** builds the track's nodes into `out` and returns what plays on step s at time t (a sixteenth `len` long) */
  setup(a: BaseAudioContext, out: AudioNode): { step: (s: number, t: number, len: number) => void; dispose?: () => void };
}

let cur: { id: string; g: GainNode; stop: () => void } | null = null;
let want: Track | null = null;

/** The track asked for last (or null for silence). */
export const musicWanted = () => want?.id ?? null;
/** Plays a track (the same one keeps playing), or fades the music out with null. */
export function playMusic(t: Track | null) {
  want = t;
  // its loop renders while the page is idle, before sound is allowed (offline audio needs no tap)
  if (t && settings.value.music !== false) void loopOf(t);
  whenUnlocked(apply);
}
// with the music switched off nothing is scheduled at all; switched back on, the wanted track starts again
let watching = false;
function apply() {
  if (!watching) {
    watching = true;
    effect(() => {
      void settings.value.music;
      apply();
    });
    return;
  }
  const a = audioCtx();
  const bus = buses().music;
  if (!a || !bus) return;
  const target = settings.value.music === false ? null : want;
  if ((cur?.id ?? null) === (target?.id ?? null)) return;
  const t = a.currentTime;
  if (cur) {
    const old = cur;
    old.g.gain.cancelScheduledValues(t);
    old.g.gain.setTargetAtTime(0, t, 0.3);
    setTimeout(() => {
      old.stop();
      old.g.disconnect();
    }, 1600);
    cur = null;
  }
  if (!target) return;
  const g = a.createGain();
  g.gain.setValueAtTime(0, t);
  g.connect(bus);
  const live = () => {
    // scheduled note by note (no offline rendering, or it failed)
    const st = target.setup(a, g);
    const stop = loop(a, target.bpm, target.steps, st.step);
    return () => {
      stop();
      st.dispose?.();
    };
  };
  let stopped = false;
  let stopIt: (() => void) | null = null;
  const entry = {
    id: target.id,
    g,
    stop: () => {
      stopped = true;
      stopIt?.();
    },
  };
  cur = entry;
  const begin = (start: () => () => void) => {
    // a track that was replaced (or switched off) while its loop rendered doesn't start late
    if (stopped || cur !== entry) return;
    const now = a.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0, now);
    g.gain.setTargetAtTime(target.level, now + 0.15, 0.35);
    try {
      stopIt = start();
    } catch {
      if (cur === entry) cur = null;
    }
  };
  if (!canRender()) return begin(live);
  void loopOf(target).then((b) =>
    begin(
      b
        ? () => {
            const src = a.createBufferSource();
            src.buffer = b;
            src.loop = true;
            src.connect(g);
            src.start(a.currentTime + 0.05);
            return () => {
              try {
                src.stop();
              } catch {
                // never started
              }
              src.disconnect();
            };
          }
        : live,
    ),
  );
}

// ---------------------------------------------------------------- loops rendered offline
const RATE = 22050;
/** Sixteenths of the pass before rendered ahead of the loop: their echoes and long notes ring into its start. */
const LEAD = 32;
const canRender = () => typeof OfflineAudioContext !== 'undefined';
const loops = new Map<string, Promise<AudioBuffer | null>>();
/** The theme, plus this many other loops, are kept (an arena's is about 1 MB). */
const KEEP = 3;
/** A track's loop as one buffer, rendered once (null if it can't be). */
function loopOf(t: Track): Promise<AudioBuffer | null> {
  let p = loops.get(t.id);
  if (p) {
    loops.delete(t.id);
    loops.set(t.id, p);
    return p;
  }
  p = canRender() ? renderLoop(t).catch(() => null) : Promise.resolve(null);
  loops.set(t.id, p);
  const others = [...loops.keys()].filter((k) => k !== THEME_ID);
  if (others.length > KEEP) loops.delete(others[0]!);
  return p;
}
const idle = () => new Promise<void>((r) => ('requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 250 }) : setTimeout(r, 16)));
/**
 * Renders one pass of a track into a buffer that loops without a seam: the end of the pass before is rendered
 * first, so the start carries its tails exactly as the second time round does live. The notes are made a few
 * dozen at a time while the page is idle; the rendering itself runs off the main thread.
 */
export async function renderLoop(t: Track, rate = RATE): Promise<AudioBuffer> {
  const len = 60 / t.bpm / 4;
  const lead = Math.min(LEAD, t.steps);
  const from = Math.round((0.05 + lead * len) * rate);
  const n = Math.round(t.steps * len * rate);
  const oc = new OfflineAudioContext(1, from + n, rate);
  const st = t.setup(oc, oc.destination);
  for (let i = 0; i < lead + t.steps; i++) {
    if (i % 24 === 0) await idle();
    try {
      st.step(i < lead ? t.steps - lead + i : i - lead, 0.05 + i * len, len);
    } catch {
      // a missed note is better than no music
    }
  }
  const all = await oc.startRendering();
  const out = oc.createBuffer(1, n, rate);
  out.copyToChannel(all.getChannelData(0).subarray(from, from + n), 0);
  return out;
}

/**
 * A loop on the audio clock: calls `step` for every sixteenth note a little ahead of time (step number, its
 * start time, the length of a sixteenth) until stopped.
 */
function loop(a: AudioContext, bpm: number, total: number, step: (s: number, t: number, len: number) => void): () => void {
  const len = 60 / bpm / 4;
  let next = a.currentTime + 0.12;
  let n = 0;
  const tick = () => {
    // a long pause (the game in the background) restarts from now instead of catching up
    if (next < a.currentTime - 0.2) next = a.currentTime + 0.05;
    while (next < a.currentTime + 0.25) {
      try {
        step(n % total, next, len);
      } catch {
        // a missed note is better than no music
      }
      next += len;
      n++;
    }
  };
  tick();
  const timer = setInterval(tick, 50);
  return () => clearInterval(timer);
}

// ---------------------------------------------------------------- the instruments
type Ctx = BaseAudioContext;
const v = (a: Ctx, s: Spec, out: AudioNode, t: number) => voice(a, s, out, t);
const kick = (a: Ctx, o: AudioNode, t: number, k = 1) => {
  v(a, { w: 'sine', f: 150, to: 45, d: 0.16, v: 0.32 * k }, o, t);
  // the part a phone speaker can play
  v(a, { w: 'triangle', f: 220, to: 110, d: 0.06, v: 0.12 * k }, o, t);
  v(a, { w: 'n', ft: 'hp', f: 4000, d: 0.01, v: 0.05 * k }, o, t);
};
const snare = (a: Ctx, o: AudioNode, t: number, k = 1) => {
  v(a, { w: 'n', ft: 'bp', f: 1900, q: 0.8, d: 0.15, v: 0.15 * k }, o, t);
  v(a, { w: 'triangle', f: 200, to: 140, d: 0.08, v: 0.08 * k }, o, t);
};
const hat = (a: Ctx, o: AudioNode, t: number, open = false) => v(a, { w: 'n', ft: 'hp', f: 8000, d: open ? 0.16 : 0.035, v: open ? 0.035 : 0.04 }, o, t);
const crash = (a: Ctx, o: AudioNode, t: number) => v(a, { w: 'n', ft: 'hp', f: 5000, d: 1.4, v: 0.045 }, o, t);

/** A song written as SongData, with an echo on its lead. */
export function songTrack(id: string, S: SongData): Track {
  return {
    id,
    bpm: S.bpm,
    steps: S.chords.length * 16,
    level: 0.6,
    setup(a, out) {
      const lead = leadNotes(S);
      const byStep = new Map(lead.map((n) => [n.step, n]));
      const chords = S.chords.map(chordOf);
      // the lead's echo: a dotted eighth, quiet, a little darker
      const echo = a.createDelay(1);
      echo.delayTime.value = (60 / S.bpm) * 0.75;
      const fb = a.createGain();
      fb.gain.value = 0.28;
      const wet = a.createGain();
      wet.gain.value = 0.15;
      const tone = a.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 2600;
      echo.connect(tone);
      tone.connect(fb);
      fb.connect(echo);
      tone.connect(wet);
      wet.connect(out);
      const leadBus = a.createGain();
      leadBus.connect(out);
      leadBus.connect(echo);
      const step = (s: number, t: number, len: number) => {
        const bar = Math.floor(s / 16),
          q = s % 16;
        const ch = chords[bar]!;
        const root = ch[0]!;
        // lead (and its harmony)
        const n = byStep.get(s);
        if (n) {
          const d = n.len * len;
          v(a, { w: 'p25', f: hz(n.midi), d: d + 0.06, v: 0.065, a: 0.008, h: d * 0.75, lp: 5000, vib: [5.5, 0.16, Math.min(0.25, d * 0.5)] }, leadBus, t);
          if (S.harm[bar]) v(a, { w: 'p12', f: hz(harmonyUnder(n.midi, ch)), d: d + 0.04, v: 0.03, a: 0.01, h: d * 0.5, lp: 4000 }, out, t);
        }
        // bass: a square for the phone speaker over a triangle for the weight
        for (const b of bassNotes(S.bass[bar]!, ch))
          if (b.s === q) {
            const d = b.len * len;
            v(a, { w: 'triangle', f: hz(b.midi), d: d + 0.03, v: 0.13, h: d * 0.6 }, out, t);
            v(a, { w: 'square', f: hz(b.midi), d: d + 0.03, v: 0.035, h: d * 0.5, lp: 900 }, out, t);
          }
        // arpeggios: the chord climbing in sixteenths, two octaves up
        if (S.arp[bar]) {
          const tones = [0, 1, 2, 1].map((i) => ch[i]!);
          const pc = tones[q % 4]!;
          const m = 72 + ((pc - root + 12) % 12) + (root < 5 ? root : root - 12);
          v(a, { w: 'p12', f: hz(m), d: len * 0.9, v: 0.018, lp: 6000 }, out, t);
        }
        // the pad: the chord held for the bar, soft and wide
        if (S.pad[bar] && q === 0)
          for (const pc of ch.slice(0, 3)) {
            const m = 57 + ((pc - 9 + 12) % 12);
            v(a, { w: 'sawtooth', f: hz(m), d: len * 16, v: 0.012, a: 0.35, h: len * 10, lp: 1100, det: 9 }, out, t);
          }
        // drums
        const dr = S.drums[bar]![q];
        if (dr === 'k') kick(a, out, t);
        else if (dr === 's') snare(a, out, t);
        else if (dr === 'h') hat(a, out, t);
        else if (dr === 'o') hat(a, out, t, true);
        else if (dr === 'c') {
          crash(a, out, t);
          kick(a, out, t);
        }
      };
      return {
        step,
        dispose: () =>
          setTimeout(() => {
            leadBus.disconnect();
            wet.disconnect();
          }, 1500),
      };
    },
  };
}

const THEME_ID = 'theme';
/** The game's theme (menus, the map, the wheels). */
export const THEME_TRACK = songTrack(THEME_ID, THEME);

// ---------------------------------------------------------------- the arena loops (upgrade 36)
const v0 = (s: Omit<Spec, 'at'>) => s as Spec;
/** Each arena's mood: root note, tempo, major or minor, and the lead's wave. */
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

/** A light loop for an arena while the fight is on: bass, a pad, a few notes on top, a kick and a hat. */
export function arenaTrack(k: string | undefined): Track {
  const T = ARENA_TUNES[k || ''] ?? ARENA_TUNES.colosseum!;
  const third = T.minor ? 3 : 4;
  return {
    id: 'arena:' + (k || 'colosseum'),
    bpm: T.bpm,
    steps: 64,
    level: 1.7,
    setup: (a, out) => ({
      step: (s, t, len) => {
        const bar = Math.floor(s / 16),
          q = s % 16;
        const r = T.root + (T.minor ? MINOR_BARS : MAJOR_BARS)[bar % 4]!;
        // in minor, VI, III and VII are major chords; in major, vi is minor
        const th = T.minor ? ([8, 3, 10].includes(r - T.root) ? 4 : 3) : r - T.root === 9 ? 3 : third;
        if (q % 4 === 0) {
          v(a, v0({ w: 'triangle', f: hz(r - 12), d: len * 3, v: 0.11 }), out, t);
          v(a, v0({ w: 'square', f: hz(r - 12), d: len * 2.5, v: 0.025, lp: 800 }), out, t);
        }
        if (q === 0) for (const iv of [0, th, 7]) v(a, v0({ w: 'sine', f: hz(r + 12 + iv), d: len * 15, v: 0.014, a: 0.2 }), out, t);
        if ([2, 6, 10, 13].includes(q)) {
          const iv = [12, 12 + th, 19, 24][(q + bar) % 4]!;
          v(a, v0({ w: T.w, f: hz(r + iv), d: len * 1.5, v: T.w === 'square' || T.w === 'sawtooth' ? 0.012 : 0.022, lp: 4000 }), out, t);
        }
        if (q === 0 || q === 8) kick(a, out, t, 0.55);
        if (q % 4 === 2) hat(a, out, t);
      },
    }),
  };
}

/** Root movement per bar of the phase-two loop (minor: i, i, III, VII). */
const PHASE_BARS = [0, 0, 3, -2];
/** A boss's phase two: a driving minor loop (bass, kick, hats and a stab every other bar) around their root and tempo. */
export function phaseTrack(tune: { root: number; bpm: number }): Track {
  return {
    id: `phase:${tune.root}:${tune.bpm}`,
    bpm: tune.bpm,
    steps: 64,
    level: 1.9,
    setup: (a, out) => ({
      step: (s, t, len) => {
        const bar = Math.floor(s / 16),
          q = s % 16;
        const root = tune.root + PHASE_BARS[bar % PHASE_BARS.length]!;
        if (q % 2 === 0) v(a, v0({ w: 'sawtooth', f: hz(root + (q === 6 || q === 14 ? 12 : 0)), d: len * 1.6, v: 0.06, lp: 1400 }), out, t);
        if (q === 0 || q === 8 || (q === 10 && bar % 2 === 1)) kick(a, out, t, 0.9);
        if (q === 4 || q === 12) snare(a, out, t, 0.8);
        if (q % 4 === 2) hat(a, out, t);
        if (q === 0 && bar % 2 === 0) for (const iv of [24, 27, 31]) v(a, v0({ w: 'p25', f: hz(root + iv), d: len * 3, v: 0.016, lp: 3000 }), out, t);
      },
    }),
  };
}

/**
 * Renders a track offline (for the loudness check and for listening outside the game): `loops` times through,
 * into stereo at `rate`. Returns the buffer.
 */
export async function renderTrack(t: Track, loops = 1, rate = 44100): Promise<AudioBuffer> {
  const len = 60 / t.bpm / 4;
  const dur = t.steps * loops * len + 2;
  const oc = new OfflineAudioContext(2, Math.ceil(dur * rate), rate);
  const g = oc.createGain();
  g.gain.value = t.level;
  g.connect(oc.destination);
  const st = t.setup(oc, g);
  for (let n = 0; n < t.steps * loops; n++) st.step(n % t.steps, 0.05 + n * len, len);
  return oc.startRendering();
}

// the loudness check and the preview files (tools/audio) render the music offline in a browser
(globalThis as unknown as { __whsMusic?: unknown }).__whsMusic = {
  /** what is playing now (for the tests) */
  playing: () => cur?.id ?? null,
  /**
   * The theme twice in a row, the way the game loops it, cut down to exactly one loop starting at the second
   * pass (so it carries the first pass's tail, as in the game). Returns how the join compares with the rest
   * (level just before and after it, and the biggest sample-to-sample jump there and anywhere), and the cut as
   * a WAV that loops without a gap.
   */
  async seam() {
    const t = THEME_TRACK;
    const rate = 44100;
    const b = await renderTrack(t, 2, rate);
    const L = b.getChannelData(0),
      R = b.getChannelData(1);
    const len = 60 / t.bpm / 4;
    const loopN = Math.round(t.steps * len * rate);
    const s0 = Math.round((0.05 + t.steps * len) * rate);
    const mono = (i: number) => (L[i]! + R[i]!) / 2;
    const rms = (a: number, n: number) => {
      let q = 0;
      for (let i = a; i < a + n; i++) q += mono(i) ** 2;
      return Math.sqrt(q / n);
    };
    const w = Math.round(0.25 * rate);
    let jumpSeam = 0,
      jumpAll = 0;
    for (let i = 1; i < L.length; i++) {
      const j = Math.abs(mono(i) - mono(i - 1));
      jumpAll = Math.max(jumpAll, j);
      if (Math.abs(i - s0) < 0.05 * rate) jumpSeam = Math.max(jumpSeam, j);
    }
    // the bar lines elsewhere, for comparison: every bar's level change across its line
    const bar = Math.round(16 * len * rate);
    const changes: number[] = [];
    for (let k = 1; k < 24; k++) {
      const at = Math.round(0.05 * rate) + k * bar;
      changes.push(Math.abs(20 * Math.log10(rms(at, w) / rms(at - w, w))));
    }
    const seamChange = Math.abs(20 * Math.log10(rms(s0, w) / rms(s0 - w, w)));
    // the loop file: one pass, starting at the second, 16-bit stereo
    let peak = 0;
    for (let i = s0; i < s0 + loopN; i++) peak = Math.max(peak, Math.abs(L[i]!), Math.abs(R[i]!));
    const k = 0.9 / peak;
    const buf = new DataView(new ArrayBuffer(44 + loopN * 4));
    const str = (o: number, x: string) => [...x].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF');
    buf.setUint32(4, 36 + loopN * 4, true);
    str(8, 'WAVEfmt ');
    buf.setUint32(16, 16, true);
    buf.setUint16(20, 1, true);
    buf.setUint16(22, 2, true);
    buf.setUint32(24, rate, true);
    buf.setUint32(28, rate * 4, true);
    buf.setUint16(32, 4, true);
    buf.setUint16(34, 16, true);
    str(36, 'data');
    buf.setUint32(40, loopN * 4, true);
    for (let i = 0; i < loopN; i++) {
      buf.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[s0 + i]! * k)) * 32767, true);
      buf.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[s0 + i]! * k)) * 32767, true);
    }
    const bytes = new Uint8Array(buf.buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return {
      loopSeconds: loopN / rate,
      seamLevelChangeDb: seamChange,
      barLevelChangeDb: { median: changes.sort((a, b) => a - b)[11], max: changes[changes.length - 1] },
      jumpAtSeam: jumpSeam,
      jumpAnywhere: jumpAll,
      wav: btoa(bin),
    };
  },
  async measure(id: 'theme' | 'arena' | 'phase', wav = false) {
    const t = id === 'theme' ? THEME_TRACK : id === 'arena' ? arenaTrack('colosseum') : phaseTrack({ root: 45, bpm: 132 });
    const b = await renderTrack(t, 1, wav ? 22050 : 44100);
    const L = b.getChannelData(0),
      R = b.getChannelData(1);
    let peak = 0,
      sum = 0;
    for (let i = 0; i < L.length; i++) {
      const x = Math.max(Math.abs(L[i]!), Math.abs(R[i]!));
      peak = Math.max(peak, x);
      sum += ((L[i]! + R[i]!) / 2) ** 2;
    }
    let data: string | null = null;
    if (wav) {
      // 16-bit mono WAV, base64
      const n = L.length;
      const buf = new DataView(new ArrayBuffer(44 + n * 2));
      const str = (o: number, s: string) => [...s].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
      str(0, 'RIFF');
      buf.setUint32(4, 36 + n * 2, true);
      str(8, 'WAVEfmt ');
      buf.setUint32(16, 16, true);
      buf.setUint16(20, 1, true);
      buf.setUint16(22, 1, true);
      buf.setUint32(24, b.sampleRate, true);
      buf.setUint32(28, b.sampleRate * 2, true);
      buf.setUint16(32, 2, true);
      buf.setUint16(34, 16, true);
      str(36, 'data');
      buf.setUint32(40, n * 2, true);
      // the live mix runs through a limiter at about this level; the preview gets the same headroom
      const k = 0.9 / Math.max(peak, 0.0001);
      for (let i = 0; i < n; i++) buf.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ((L[i]! + R[i]!) / 2) * k)) * 32767, true);
      const bytes = new Uint8Array(buf.buffer);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      data = btoa(bin);
    }
    return { id, seconds: b.duration, peak, rms: Math.sqrt(sum / L.length), wav: data };
  },
};
