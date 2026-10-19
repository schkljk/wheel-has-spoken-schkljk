// The live audio: one context, started by the first tap (browsers allow sound only after one), with a bus for
// sound effects and one for music, each following its switch and volume in Settings, both through a limiter
// so nothing clips. Music dips under big moments. Sound pauses while the game is in the background.

import { effect } from '@preact/signals';
import { settings } from '../state/game';
import { SFX } from './sfx-data';
import { lengthOf, render, type RenderOpts, type Spec } from './synth';

export const DEFAULT_SFX_VOL = 0.8;
export const DEFAULT_MUSIC_VOL = 0.55;

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let duckGain: GainNode | null = null;
let unlocked = false;
const pending: (() => void)[] = [];

function build() {
  const a = new AudioContext({ latencyHint: 'interactive' });
  const lim = a.createDynamicsCompressor();
  lim.threshold.value = -9;
  lim.knee.value = 6;
  lim.ratio.value = 10;
  lim.attack.value = 0.002;
  lim.release.value = 0.2;
  const master = a.createGain();
  master.gain.value = 0.95;
  sfxBus = a.createGain();
  musicBus = a.createGain();
  duckGain = a.createGain();
  sfxBus.connect(lim);
  musicBus.connect(duckGain);
  duckGain.connect(lim);
  lim.connect(master);
  master.connect(a.destination);
  ctx = a;
  applyVolumes();
}

function applyVolumes() {
  if (!ctx || !sfxBus || !musicBus) return;
  const s = settings.value;
  const t = ctx.currentTime;
  sfxBus.gain.setTargetAtTime(s.sound ? (s.sfxVol ?? DEFAULT_SFX_VOL) : 0, t, 0.05);
  musicBus.gain.setTargetAtTime(s.music !== false ? (s.musicVol ?? DEFAULT_MUSIC_VOL) : 0, t, 0.25);
}

/** Sets a bus's level for a moment without saving it (a volume slider being dragged). */
export function previewVolume(kind: 'sfx' | 'music', v: number) {
  const bus = kind === 'sfx' ? sfxBus : musicBus;
  if (ctx && bus) bus.gain.setTargetAtTime(v, ctx.currentTime, 0.03);
}

/** The audio context once sound is allowed (after the first tap), resumed; null before. */
export function audioCtx(): AudioContext | null {
  if (!unlocked) return null;
  if (!ctx) {
    try {
      build();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended' && !document.hidden) void ctx.resume().catch(() => {});
  return ctx;
}
export const buses = () => ({ sfx: sfxBus, music: musicBus });
/** Runs f once sound is allowed (now, if it already is). */
export function whenUnlocked(f: () => void) {
  if (unlocked) f();
  else pending.push(f);
}

/** Sound starts with the first tap or key; settings changes reach the buses; the background pauses it. */
export function installAudio() {
  const go = () => {
    if (unlocked) return;
    unlocked = true;
    audioCtx();
    for (const f of pending.splice(0)) f();
    for (const e of ['pointerdown', 'keydown', 'touchend'] as const) window.removeEventListener(e, go, true);
  };
  for (const e of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(e, go, true);
  effect(() => {
    void settings.value;
    applyVolumes();
  });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend().catch(() => {});
    else void ctx.resume().catch(() => {});
  });
}

export interface SfxOpts extends RenderOpts {
  /** random pitch spread, as a fraction (default 3%), so repeats never sound identical */
  vary?: number;
  /** seconds from now */
  delay?: number;
}
/** Plays a sound by name (audio/sfx-data.ts). */
export function sfx(name: string, o: SfxOpts = {}) {
  const specs = SFX[name];
  if (specs) play(specs, o);
}
/** Plays a sound given as voices. */
export function play(specs: readonly Spec[], o: SfxOpts = {}) {
  if (!settings.value.sound) return;
  const a = audioCtx();
  if (!a || !sfxBus) return;
  try {
    const vary = o.vary ?? 0.03;
    const pitch = (o.pitch ?? 1) * (1 + (Math.random() * 2 - 1) * vary);
    render(a, specs, sfxBus, a.currentTime + 0.004 + (o.delay ?? 0), { pitch, gain: o.gain });
  } catch {
    // sound is optional
  }
}

/** The music dips for a moment (a knockout, a fanfare) and comes back. */
export function duck(depth = 0.4, hold = 0.3, back = 0.6) {
  const a = ctx;
  if (!a || !duckGain) return;
  const t = a.currentTime;
  const g = duckGain.gain;
  g.cancelScheduledValues(t);
  g.setTargetAtTime(depth, t, 0.03);
  g.setTargetAtTime(1, t + hold, back / 3);
}

// the loudness check (tools/audio) renders every sound offline in a browser
(globalThis as unknown as { __whsSfx?: unknown }).__whsSfx = {
  names: () => Object.keys(SFX),
  async measure(name: string) {
    const specs = SFX[name];
    if (!specs) return null;
    const len = lengthOf(specs) + 0.15;
    const oc = new OfflineAudioContext(1, Math.ceil(len * 44100), 44100);
    render(oc, specs, oc.destination, 0);
    const b = await oc.startRendering();
    const d = b.getChannelData(0);
    let peak = 0,
      sum = 0,
      n = 0;
    for (let i = 0; i < d.length; i++) {
      const x = Math.abs(d[i]!);
      peak = Math.max(peak, x);
      if (x > 0.001) {
        sum += x * x;
        n++;
      }
    }
    return { name, len, peak, rms: Math.sqrt(sum / Math.max(1, n)) };
  },
};
