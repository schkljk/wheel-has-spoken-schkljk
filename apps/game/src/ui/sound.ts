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
