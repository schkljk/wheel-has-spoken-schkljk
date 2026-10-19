// Every sound effect in the game as a recipe: a few synth voices each (audio/synth.ts). Pure data, no DOM, so
// tests can check that every weapon style and every power has its sounds.
//
// Names: w.<style>.<moment> for weapons, p.<power>.<moment> for powers, f.* for the rest of a fight, wh.* for
// the wheels, ui.* for menus, s.* for the story. Moments: draw/charge (before), go (release, swing, cast),
// fly (in the air), hit (contact).

import { hz, type Spec, type Wave } from './synth';

type S = Spec[];
const T = (w: Wave, f: number, d: number, v: number, x: Partial<Spec> = {}): Spec => ({ w, f, d, v, ...x });
const N = (ft: 'lp' | 'hp' | 'bp', f: number, d: number, v: number, x: Partial<Spec> = {}): Spec => ({ w: 'n', ft, f, d, v, ...x });
/** shift a sound later */
const at = (t: number, s: S): S => s.map((x) => ({ ...x, at: (x.at ?? 0) + t }));
/** scale its level */
const vol = (k: number, s: S): S => s.map((x) => ({ ...x, v: x.v * k }));
/** notes one after another: midi notes, step between them, each note's length and level */
const notes = (w: Wave, ms: number[], step: number, d: number, v: number, x: Partial<Spec> = {}): S => ms.map((m, i) => T(w, hz(m), d, v, { at: i * step, ...x }));
/** the same random clicks every time (crackle, rattle, crumble) */
function crackle(n: number, d: number, v: number, lo = 1500, hi = 5000, seed = 7): S {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => N('hp', lo + r() * (hi - lo), 0.014, v * (0.4 + 0.6 * r()), { at: r() * d }));
}

// ---------------------------------------------------------------- building blocks
const whoosh = (f0: number, f1: number, d: number, v: number, x: Partial<Spec> = {}) => [N('bp', f0, d, v, { to: f1, a: d * 0.45, q: 0.9, ...x })];
const thump = (f: number, d: number, v: number): S => [T('sine', f, d, v, { to: f * 0.45 }), T('triangle', f * 2, d * 0.5, v * 0.35, { to: f }), N('lp', 1400, d * 0.6, v * 0.45, { to: 200 })];
/** metal struck: inharmonic partials and a scrape */
const clank = (f: number, d: number, v: number): S => [
  T('square', f, Math.min(0.06, d * 0.2), v * 0.3, { lp: 3500 }),
  T('sine', f, d, v * 0.5),
  T('sine', f * 2.76, d * 0.7, v * 0.32),
  T('sine', f * 5.4, d * 0.4, v * 0.16),
  N('hp', 3200, 0.05, v * 0.5),
];
/** a bell: a long round partial and a shimmer of higher ones */
const bell = (f: number, d: number, v: number): S => [T('sine', f, d, v), T('sine', f * 2, d * 0.6, v * 0.45), T('sine', f * 2.76, d * 0.45, v * 0.3), T('sine', f * 4.07, d * 0.3, v * 0.15), T('sine', f * 5.4, d * 0.2, v * 0.08)];
const ting = (f: number, d: number, v: number, t = 0): S => [T('sine', f, d, v, { at: t }), T('sine', f * 2.01, d * 0.5, v * 0.3, { at: t })];
/** a low boom with dust */
const boom = (v: number): S => [T('sine', 120, 0.55, v, { to: 32 }), T('triangle', 180, 0.25, v * 0.4, { to: 70 }), N('lp', 1600, 0.5, v * 0.7, { to: 90 }), N('bp', 500, 0.12, v * 0.4)];
/** a plucked string: bright, quickly dull */
const pluck = (f: number, d: number, v: number): S => [T('triangle', f * 1.02, d, v, { to: f, a: 0.002 }), T('sawtooth', f, d * 0.4, v * 0.35, { lp: f * 6 }), N('hp', 2500, 0.02, v * 0.4)];
const click = (f: number, v: number, t = 0): Spec => T('square', f, 0.012, v, { lp: 6000, at: t });
/** a sparkle: quick high notes */
const sparkle = (v: number, t = 0): S => at(t, notes('triangle', [96, 100, 103, 108], 0.04, 0.16, v));

// ---------------------------------------------------------------- weapons, by style (pixi/weapon-style.ts)
// prettier-ignore
const WEAPON: Record<string, S> = {
  'w.shoot.draw': [T('sawtooth', 70, 0.26, 0.06, { to: 96, lp: 700, trem: 34 }), N('bp', 900, 0.24, 0.04, { to: 1400, q: 6 })],
  'w.shoot.go': [...pluck(196, 0.35, 0.3), T('sine', 2300, 0.2, 0.035, { to: 1500, at: 0.03 }), ...whoosh(2500, 5200, 0.16, 0.08)],
  'w.xbow.go': [click(1900, 0.14), T('square', 130, 0.07, 0.16, { to: 70, lp: 1500 }), N('bp', 2600, 0.06, 0.14), T('triangle', 150, 0.24, 0.16, { to: 140, at: 0.01 }), ...whoosh(3200, 6000, 0.14, 0.06, { at: 0.02 })],
  'w.shoot.hit': [T('sine', 240, 0.1, 0.24, { to: 110 }), N('bp', 1800, 0.05, 0.2, { q: 2 }), T('triangle', 520, 0.2, 0.06, { to: 500, trem: 42, at: 0.01 })],
  'w.beam.charge': [T('sine', 300, 0.2, 0.08, { to: 1800, vib: [24, 0.5] }), T('square', 600, 0.2, 0.02, { to: 3600, lp: 3000 })],
  'w.beam.go': [T('sawtooth', 1600, 0.32, 0.13, { to: 220, lp: 5000, det: 14 }), T('square', 3200, 0.1, 0.04, { to: 800, lp: 6000 }), N('hp', 5000, 0.25, 0.05, { to: 2500 })],
  'w.beam.hit': [N('hp', 4000, 0.3, 0.1, { to: 8000, trem: 50 }), T('sine', 160, 0.15, 0.14, { to: 80 })],
  'w.throw.go': whoosh(500, 2400, 0.2, 0.22),
  'w.throw.fly': [N('bp', 2400, 0.3, 0.09, { trem: 22, q: 3 })],
  'w.throw.hit': [...ting(2600, 0.3, 0.1), N('hp', 3500, 0.04, 0.15), T('sine', 180, 0.08, 0.16, { to: 90 })],
  'w.brick.hit': [...thump(140, 0.2, 0.32), N('lp', 2500, 0.25, 0.12, { to: 600, trem: 35 })],
  'w.card.go': [N('hp', 3000, 0.05, 0.18), ...whoosh(3000, 6200, 0.18, 0.06)],
  'w.slash.go': whoosh(700, 4200, 0.17, 0.24),
  'w.slash.hit': [N('hp', 4500, 0.12, 0.2, { to: 9000 }), T('sine', 3100, 0.3, 0.05), T('sine', 4650, 0.18, 0.03), T('triangle', 1550, 0.08, 0.05, { to: 900 })],
  'w.heavy.go': whoosh(250, 1800, 0.3, 0.3),
  'w.heavy.hit': [...clank(220, 0.45, 0.22), ...vol(0.8, boom(0.3))],
  'w.reap.go': [...whoosh(400, 3000, 0.4, 0.24), ...whoosh(3000, 900, 0.3, 0.12, { at: 0.24 })],
  'w.thrust.go': whoosh(1500, 5000, 0.1, 0.2),
  'w.thrust.hit': [N('bp', 3000, 0.04, 0.26, { q: 3 }), T('sine', 2600, 0.16, 0.05, { to: 2400 }), T('sine', 200, 0.08, 0.16, { to: 100 })],
  'w.smash.go': whoosh(180, 900, 0.34, 0.3),
  'w.smash.hit': [...boom(0.34), ...clank(160, 0.3, 0.1)],
  'w.bonk.hit': [T('square', 620, 0.09, 0.11, { to: 300, lp: 2500 }), ...bell(780, 0.9, 0.14), T('sine', 140, 0.12, 0.2, { to: 70 }), ...at(0.18, notes('sine', [96, 100, 96, 100, 96], 0.07, 0.06, 0.03, { vib: [30, 0.3] }))],
  'w.swing.go': whoosh(400, 2500, 0.22, 0.26),
  'w.swing.hit': [N('bp', 1400, 0.05, 0.34, { q: 2.5 }), click(900, 0.1), T('sine', 180, 0.12, 0.18, { to: 90 }), T('triangle', 420, 0.14, 0.05, { to: 390 })],
  'w.flop.go': [T('sine', 180, 0.38, 0.12, { to: 520, vib: [11, 2] })],
  'w.flop.hit': [N('lp', 1800, 0.12, 0.26, { to: 400 }), T('sine', 260, 0.16, 0.08, { to: 140, vib: [18, 1.5] })],
  'w.fists.go': whoosh(800, 2500, 0.08, 0.15),
  'w.fists.hit': [T('sine', 150, 0.11, 0.34, { to: 60 }), T('triangle', 300, 0.05, 0.12, { to: 150 }), N('lp', 2200, 0.06, 0.24, { to: 500 }), N('bp', 900, 0.03, 0.14)],
  'w.flurry.hit': [T('sine', 200, 0.07, 0.22, { to: 90 }), T('triangle', 400, 0.04, 0.08, { to: 200 }), N('bp', 1500, 0.04, 0.16)],
  'w.whip.go': whoosh(600, 3000, 0.15, 0.16),
  'w.whip.hit': [N('hp', 2500, 0.025, 0.5), N('bp', 5000, 0.08, 0.18, { to: 2500, at: 0.008 }), T('square', 2000, 0.015, 0.12)],
  'w.rod.go': [...whoosh(1200, 3000, 0.2, 0.12), ...Array.from({ length: 10 }, (_, i) => click(2600, 0.05, 0.06 + i * 0.026))],
  'w.rod.hit': [T('sine', 1400, 0.08, 0.1, { to: 2000 }), N('bp', 1200, 0.12, 0.12, { to: 600, at: 0.05 }), ...Array.from({ length: 8 }, (_, i) => click(2200, 0.06, 0.1 + i * 0.022))],
  'w.cast.charge': [...notes('sine', [76, 79, 83, 88], 0.045, 0.24, 0.05, { vib: [7, 0.2] }), T('triangle', 220, 0.3, 0.05, { to: 440 })],
  'w.cast.go': [T('sine', 880, 0.25, 0.12, { to: 330 }), N('bp', 2000, 0.2, 0.1, { to: 600 })],
  'w.cast.hit': [T('triangle', 660, 0.3, 0.1, { to: 1320 }), T('sine', 990, 0.4, 0.06, { vib: [9, 0.4] }), N('bp', 1600, 0.25, 0.12, { to: 4000 })],
  'w.saw.go': [T('sawtooth', 70, 0.66, 0.11, { to: 140, trem: 28, drv: 0.5, lp: 1800 }), T('square', 140, 0.66, 0.035, { to: 280, lp: 1200, trem: 28 }), N('bp', 3000, 0.46, 0.08, { at: 0.2, trem: 40 })],
  'w.saw.hit': [N('hp', 3000, 0.25, 0.15, { trem: 45 }), ...thump(160, 0.15, 0.2)],
  'w.riff.hit': [T('sawtooth', hz(40), 0.7, 0.12, { drv: 0.8, lp: 2400, det: 8 }), T('sawtooth', hz(47), 0.7, 0.09, { drv: 0.8, lp: 2400, det: -8 }), T('sawtooth', hz(52), 0.6, 0.06, { drv: 0.8, lp: 2400 }), ...vol(0.7, boom(0.3))],
};

// ---------------------------------------------------------------- powers (pixi/powers.ts)
// prettier-ignore
const POWER: Record<string, S> = {
  'p.fire.cast': [N('bp', 300, 0.34, 0.22, { to: 1800, a: 0.12 }), ...crackle(10, 0.34, 0.06)],
  'p.fire.hit': [...boom(0.3), N('bp', 600, 0.5, 0.18, { to: 2400 }), ...crackle(14, 0.5, 0.07, 1500, 5000, 3)],
  'p.ice.cast': [T('sine', 2800, 0.25, 0.05, { to: 3600 }), N('hp', 6000, 0.2, 0.05)],
  'p.ice.fly': [T('triangle', 2637, 0.12, 0.07), N('hp', 7000, 0.08, 0.07)],
  'p.ice.hit': [N('hp', 3000, 0.35, 0.22, { to: 8000 }), ...notes('triangle', [100, 98, 95, 93, 91], 0.04, 0.12, 0.05)],
  'p.lightning.cast': [T('sawtooth', 110, 0.34, 0.05, { trem: 35, lp: 2000, to: 220 })],
  'p.lightning.hit': [N('hp', 2500, 0.12, 0.45), T('square', 1800, 0.06, 0.1, { to: 400 }), N('lp', 600, 1.1, 0.34, { to: 60, at: 0.05, trem: 9 }), T('sine', 70, 0.8, 0.24, { to: 35, at: 0.05 })],
  'p.water.cast': [N('lp', 800, 0.3, 0.15, { to: 2000, a: 0.15 })],
  'p.water.fly': [T('sine', 700, 0.06, 0.06, { to: 1400 })],
  'p.water.hit': [N('lp', 3000, 0.4, 0.3, { to: 300 }), ...notes('sine', [84, 88, 81, 86], 0.05, 0.08, 0.05, { to: hz(91) })],
  'p.shadow.cast': [T('sawtooth', 55, 0.6, 0.1, { det: 18, lp: 400, a: 0.2 }), N('lp', 300, 0.5, 0.1, { to: 900, a: 0.3 })],
  'p.shadow.hit': [T('sine', 90, 0.4, 0.26, { to: 45 }), N('bp', 500, 0.35, 0.15, { to: 150 }), T('sawtooth', 110, 0.3, 0.05, { to: 55, lp: 600, det: 25 })],
  'p.summon.cast': [T('sine', 200, 0.6, 0.07, { to: 50, vib: [6, 1] }), N('bp', 400, 0.6, 0.12, { to: 100, a: 0.3 }), T('triangle', 440, 0.5, 0.03, { vib: [5, 0.5], det: 30 })],
  'p.summon.hit': [T('sawtooth', 80, 0.5, 0.11, { drv: 0.6, lp: 900, to: 50 }), ...boom(0.3)],
  'p.chains.cast': [...Array.from({ length: 9 }, (_, i) => ting(2200 + ((i * 677) % 1700), 0.12, 0.05, i * 0.04)).flat(), N('bp', 1800, 0.36, 0.06, { trem: 30 })],
  'p.chains.hit': [...clank(420, 0.4, 0.16), ...Array.from({ length: 6 }, (_, i) => ting(2500 + ((i * 433) % 1200), 0.1, 0.04, 0.05 + i * 0.05)).flat()],
  'p.light.cast': [72, 76, 79, 84].map((m, i) => T('sine', hz(m), 0.9, 0.045, { a: 0.25, vib: [5, 0.15, 0.2], det: 6, at: i * 0.02 })),
  'p.light.hit': [...bell(1047, 1.2, 0.12), N('hp', 6000, 0.6, 0.04)],
  'p.smite.cast': bell(1568, 0.6, 0.08),
  'p.smite.hit': [...boom(0.32), ...bell(523, 1.2, 0.13), T('sine', hz(60), 1, 0.05, { a: 0.05, det: 7 })],
  'p.tk.cast': [N('lp', 200, 0.5, 0.2, { to: 500 }), T('sine', 110, 0.5, 0.05, { to: 330, vib: [7, 0.4] })],
  'p.tk.fly': whoosh(300, 1500, 0.28, 0.2),
  'p.tk.hit': [...boom(0.24), N('lp', 2000, 0.3, 0.2, { to: 300, trem: 30 })],
  'p.earth.cast': [T('sine', 70, 0.3, 0.36, { to: 40 }), T('triangle', 140, 0.15, 0.12, { to: 70 }), N('lp', 300, 0.6, 0.26, { trem: 12 })],
  'p.earth.fly': [N('bp', 900, 0.15, 0.26, { to: 300 }), T('sine', 130, 0.15, 0.2, { to: 70 })],
  'p.earth.hit': [N('lp', 260, 0.8, 0.3, { to: 60, trem: 10 }), T('sine', 55, 0.6, 0.2, { to: 35 })],
  'p.mind.cast': [T('sine', 660, 0.7, 0.08, { vib: [6, 1.2], to: 990 })],
  'p.mind.fly': [T('sine', 880, 0.15, 0.05, { to: 1320 })],
  'p.mind.hit': [T('sine', 440, 0.4, 0.09, { to: 330, vib: [14, 2] }), T('triangle', 660, 0.3, 0.03, { to: 495, vib: [14, 2] })],
  'p.sonic.cast': [T('sawtooth', 600, 0.5, 0.1, { to: 1200, vib: [20, 0.6], lp: 3500, drv: 0.3 }), T('square', 1200, 0.5, 0.035, { to: 2400, lp: 4000 })],
  'p.sonic.hit': [T('sine', 220, 0.3, 0.18, { to: 110, trem: 30 }), N('bp', 1500, 0.3, 0.12, { trem: 30 })],
  'p.tele.cast': [T('sine', 400, 0.18, 0.12, { to: 2400 }), N('hp', 4000, 0.15, 0.05)],
  'p.tele.fly': [T('sine', 2400, 0.18, 0.12, { to: 400 }), N('hp', 4000, 0.12, 0.05)],
  'p.tele.hit': [...vol(0.9, [T('sine', 150, 0.11, 0.34, { to: 60 }), N('lp', 2200, 0.06, 0.24, { to: 500 })]), T('sine', 1800, 0.2, 0.04, { to: 3600 })],
  'p.gravity.cast': [T('sine', 300, 0.6, 0.12, { to: 40 }), T('sawtooth', 80, 0.6, 0.05, { to: 30, lp: 500 })],
  'p.gravity.hit': [...boom(0.3), N('lp', 1200, 0.3, 0.2, { to: 200, trem: 25 }), ...crackle(8, 0.25, 0.06, 800, 3000, 11)],
  'p.shape.cast': [T('sawtooth', 85, 0.5, 0.12, { vib: [9, 1.5], lp: 900, drv: 0.4 }), N('lp', 600, 0.5, 0.1, { trem: 18 })],
  'p.shape.hit': [...whoosh(800, 4000, 0.12, 0.2), ...[0, 0.05, 0.1].map((t) => N('hp', 3500, 0.12, 0.18, { to: 7000, at: t }))],
  'p.reality.cast': notes('square', [91, 78, 97, 84, 72, 101, 88], 0.035, 0.03, 0.04, { lp: 6000 }),
  'p.reality.hit': [N('bp', 1200, 0.3, 0.2, { trem: 60 }), T('square', 2000, 0.25, 0.06, { to: 300, lp: 5000 })],
  'p.negate.hit': [T('square', 110, 0.18, 0.12, { lp: 1500 }), T('square', 104, 0.32, 0.12, { lp: 1500, at: 0.2 })],
  'p.ward.cast': [T('triangle', 523, 0.4, 0.06, { vib: [6, 0.2] }), T('sine', 784, 0.4, 0.04)],
  'p.ward.hit': [...clank(330, 0.4, 0.16), ...bell(659, 0.6, 0.06)],
  'p.miracle.cast': [...notes('triangle', [84, 88, 91, 96], 0.06, 0.5, 0.04), ...[72, 76, 79].map((m) => T('sine', hz(m), 0.9, 0.035, { a: 0.3, vib: [5, 0.15, 0.2], det: 8 }))],
  'p.miracle.hit': [...bell(1319, 1, 0.08), ...sparkle(0.04, 0.05)],
  'p.regen.cast': [N('bp', 5000, 0.4, 0.06, { trem: 25 })],
  'p.regen.hit': notes('triangle', [79, 84, 88], 0.07, 0.3, 0.06),
  'p.luck.cast': [T('sine', 2400, 0.42, 0.08, { to: 500, lin: true })],
  'p.luck.hit': [...clank(180, 1.2, 0.3), ...vol(0.7, boom(0.3))],
  'p.drain.cast': [N('bp', 3000, 0.5, 0.14, { to: 300 }), T('sine', 600, 0.5, 0.04, { to: 150 })],
  'p.drain.hit': [T('sine', 60, 0.12, 0.32), T('triangle', 120, 0.06, 0.1), T('sine', 55, 0.15, 0.26, { at: 0.18 }), T('triangle', 110, 0.06, 0.08, { at: 0.18 })],
  'p.arcane.fly': [T('square', 1400, 0.14, 0.07, { to: 380, lp: 4000 })],
  'p.arcane.hit': [T('triangle', 990, 0.2, 0.08, { to: 1980 }), N('bp', 2400, 0.15, 0.1)],
  'p.wind.cast': [N('bp', 400, 0.6, 0.2, { to: 1600, a: 0.3, q: 0.8 }), N('bp', 1200, 0.5, 0.1, { to: 600, at: 0.2 })],
  'p.wind.hit': [...whoosh(1600, 600, 0.3, 0.16), N('bp', 5000, 0.3, 0.05, { trem: 30 })],
  'p.vines.cast': [T('sawtooth', 90, 0.4, 0.05, { to: 140, lp: 700, trem: 22 }), N('bp', 2500, 0.35, 0.1, { trem: 30, at: 0.1 })],
  'p.vines.hit': [T('sawtooth', 120, 0.3, 0.05, { to: 90, lp: 600, trem: 26 }), N('hp', 2500, 0.025, 0.4), N('bp', 5000, 0.08, 0.15, { to: 2500, at: 0.01 })],
  'p.boom.cast': [N('hp', 5000, 0.4, 0.06, { trem: 40 }), ...whoosh(500, 2000, 0.2, 0.18, { at: 0.1 })],
  'p.boom.hit': [...boom(0.45), N('lp', 3000, 0.9, 0.24, { to: 80 }), ...crackle(16, 0.6, 0.06, 1200, 4500, 5)],
  'p.magnet.cast': [T('square', 60, 0.5, 0.05, { lp: 400 }), T('sine', 120, 0.5, 0.06, { vib: [5, 0.3] })],
  'p.magnet.hit': [T('sine', 300, 0.15, 0.1, { to: 1200 }), ...clank(400, 0.3, 0.12)],
  'p.clones.cast': Array.from({ length: 6 }, (_, i) => [T('sine', 300, 0.04, 0.12, { to: 150, at: i * 0.06 }), N('bp', 1500, 0.03, 0.08, { at: i * 0.06 })]).flat(),
  'p.clones.hit': [0, 0.05, 0.1].flatMap((t) => at(t, [T('sine', 150, 0.11, 0.26, { to: 60 }), N('lp', 2200, 0.06, 0.18, { to: 500 })])),
  'p.illusion.cast': [T('sine', 1200, 0.5, 0.04, { vib: [8, 0.5], det: 25 }), T('sine', 1800, 0.5, 0.03, { vib: [7, 0.5], det: -25 })],
  'p.illusion.hit': [N('hp', 3000, 0.3, 0.1, { to: 8000 }), T('sine', 150, 0.11, 0.3, { to: 60 }), N('lp', 2200, 0.06, 0.2, { to: 500 })],
  'p.poison.cast': [T('sine', 200, 0.12, 0.15, { to: 600 }), T('sine', 300, 0.12, 0.12, { to: 800, at: 0.1 })],
  'p.poison.hit': [N('lp', 1500, 0.2, 0.26, { to: 300 }), N('hp', 4000, 0.6, 0.06, { at: 0.1 }), ...notes('sine', [72, 76, 70, 79], 0.08, 0.06, 0.05, { to: hz(86) })],
  'p.time.cast': [click(3000, 0.12), click(2200, 0.12, 0.14), click(3000, 0.12, 0.28), click(2200, 0.12, 0.42)],
  'p.time.hit': [T('sine', 1200, 0.5, 0.06, { to: 200 }), ...bell(880, 0.6, 0.08)],
};

// ---------------------------------------------------------------- the rest of a fight
// prettier-ignore
const FIGHT: Record<string, S> = {
  'f.crit': [T('triangle', 2794, 0.1, 0.08), T('triangle', 3729, 0.2, 0.06, { at: 0.06 })],
  'f.miss': whoosh(1500, 600, 0.2, 0.12),
  'f.guard': clank(300, 0.35, 0.18),
  'f.heal': [...notes('triangle', [76, 79, 84, 88], 0.07, 0.3, 0.07), N('hp', 6000, 0.4, 0.03)],
  'f.status': [T('square', 330, 0.12, 0.06, { to: 220, lp: 2000 }), T('square', 311, 0.2, 0.05, { at: 0.1, lp: 2000 })],
  'f.dot': [T('sine', 400, 0.08, 0.1, { to: 900 }), T('sine', 500, 0.07, 0.07, { to: 1000, at: 0.09 })],
  'f.revive': notes('triangle', [60, 64, 67, 72, 76, 79], 0.06, 0.3, 0.07),
  'f.ko': [...boom(0.4), ...bell(196, 1.6, 0.12), N('lp', 800, 0.8, 0.15, { to: 80 })],
  'f.finisher': [N('lp', 900, 0.9, 0.25, { to: 120 }), T('sine', 90, 0.9, 0.22, { to: 30 }), T('triangle', 1400, 0.55, 0.03, { to: 300, at: 0.05 })],
  'f.ult': [T('sawtooth', hz(45), 0.7, 0.08, { to: hz(57), drv: 0.4, lp: 2500, det: 10 }), T('sawtooth', hz(52), 0.7, 0.06, { to: hz(64), drv: 0.4, lp: 2500, det: -10 }), N('bp', 400, 0.7, 0.12, { to: 3000, a: 0.5 })],
  'f.phase': [T('sawtooth', 110, 0.8, 0.12, { to: 55, drv: 0.6, lp: 1200, vib: [6, 1] }), ...boom(0.3)],
  'f.round': [...bell(1319, 0.7, 0.08), ...at(0.22, bell(1319, 0.9, 0.08))],
  'f.read': [T('p25', 1760, 0.06, 0.06), T('p25', 2637, 0.1, 0.06, { at: 0.07 })],
  'f.timestop': [T('sine', 1600, 0.6, 0.06, { to: 200 }), click(3000, 0.1, 0.1), click(2200, 0.1, 0.3), T('sine', 80, 0.6, 0.15, { to: 40 })],
  'f.uno': [N('hp', 3000, 0.05, 0.16), T('sawtooth', 300, 0.5, 0.06, { to: 600, lp: 1400, vib: [5, 0.5] })],
  'f.skip': [T('sawtooth', 90, 0.35, 0.04, { lp: 500, trem: 14 }), T('sawtooth', 80, 0.4, 0.04, { lp: 500, trem: 14, at: 0.45 })],
  'f.pet': [T('sine', 400, 0.2, 0.08, { to: 900 }), N('bp', 1500, 0.08, 0.06, { at: 0.18 })],
  'f.self': [T('sine', 150, 0.11, 0.3, { to: 60 }), T('triangle', 311, 0.3, 0.04, { to: 233, at: 0.12 })],
  // the end of a fight: a fanfare, or a sad trombone
  'f.win': [
    ...notes('p25', [67, 67, 67], 0.12, 0.1, 0.07),
    T('p25', hz(72), 0.32, 0.07, { at: 0.36, h: 0.2 }), T('p25', hz(76), 0.3, 0.07, { at: 0.7, h: 0.18 }),
    T('p25', hz(74), 0.14, 0.07, { at: 1.0 }), T('p25', hz(76), 0.14, 0.07, { at: 1.15 }),
    T('p25', hz(79), 0.9, 0.08, { at: 1.3, h: 0.5, vib: [5.5, 0.2, 0.2] }),
    ...[[64, 0.36], [67, 0.7], [71, 1.3]].map(([m, t]) => T('triangle', hz(m!), 0.5, 0.05, { at: t, h: 0.2 })),
    ...[[48, 0], [43, 0.36], [48, 0.7], [43, 1.0], [48, 1.3]].map(([m, t]) => T('triangle', hz(m!), 0.3, 0.12, { at: t, h: 0.1 })),
    N('hp', 5000, 1.1, 0.06, { at: 1.3 }),
  ],
  'f.lose': [55, 54, 53].map((m, i) => T('sawtooth', hz(m), 0.3, 0.07, { at: i * 0.32, h: 0.15, lp: 1100 })).concat([T('sawtooth', hz(52), 1.1, 0.07, { at: 0.96, h: 0.6, lp: 1100, vib: [6, 0.5, 0.1] })]),
};

// ---------------------------------------------------------------- the wheels
// prettier-ignore
const WHEEL: Record<string, S> = {
  'wh.tick': [T('square', 1600, 0.018, 0.05, { lp: 6000 }), N('hp', 5000, 0.012, 0.04)],
  'wh.tick2': [T('square', 700, 0.04, 0.07, { lp: 3000 }), N('bp', 2000, 0.02, 0.05)],
  'wh.spin': [...whoosh(300, 1800, 0.34, 0.15), ...Array.from({ length: 6 }, (_, i) => click(2000 - i * 120, 0.04, 0.05 + i * 0.045))],
  'wh.roll': [N('bp', 1800, 0.06, 0.1, { q: 1 }), T('triangle', 190, 0.04, 0.04)],
  'wh.land0': [55, 54].map((m, i) => T('sawtooth', hz(m), 0.22, 0.05, { at: i * 0.24, h: 0.1, lp: 1100 })).concat([T('sawtooth', hz(52), 0.6, 0.05, { at: 0.48, h: 0.25, lp: 1100, vib: [6, 0.5, 0.1] })]),
  'wh.land1': [T('p25', hz(72), 0.1, 0.06), T('p25', hz(76), 0.16, 0.06, { at: 0.08 })],
  'wh.land2': [...notes('p25', [72, 76, 79], 0.07, 0.18, 0.06), T('triangle', hz(84), 0.4, 0.05, { at: 0.21 }), ...sparkle(0.025, 0.24)],
  'wh.land3': [...notes('p25', [72, 76, 79, 84], 0.07, 0.25, 0.07), ...[72, 76, 79].map((m) => T('triangle', hz(m), 0.8, 0.035, { at: 0.28, h: 0.3 })), N('hp', 5000, 0.8, 0.07, { at: 0.28 }), ...sparkle(0.035, 0.3)],
  'wh.reroll': [...Array.from({ length: 8 }, (_, i) => click(2000 + ((i * 397) % 1500), 0.07, i * 0.035)), T('sine', 180, 0.08, 0.12, { to: 100, at: 0.3 })],
};

// ---------------------------------------------------------------- menus
// prettier-ignore
const UI: Record<string, S> = {
  'ui.tap': [T('triangle', 1700, 0.025, 0.035, { to: 1100 }), N('hp', 6000, 0.01, 0.02)],
  'ui.open': [N('bp', 600, 0.16, 0.05, { to: 2000, a: 0.08 }), T('sine', 520, 0.1, 0.03, { to: 780, at: 0.04 })],
  'ui.close': [N('bp', 1800, 0.14, 0.04, { to: 500, a: 0.04 }), T('sine', 700, 0.08, 0.025, { to: 470 })],
  'ui.tab': [T('triangle', 1200, 0.04, 0.035), T('triangle', 1800, 0.05, 0.03, { at: 0.03 })],
  'ui.confirm': [T('triangle', 440, 0.12, 0.05), T('triangle', 660, 0.15, 0.04, { at: 0.06 })],
  'ui.yes': [T('p25', 880, 0.06, 0.05), T('p25', 1320, 0.12, 0.05, { at: 0.06 })],
  'ui.no': [T('triangle', 440, 0.1, 0.05, { to: 330 })],
  'ui.coin': [T('p25', 988, 0.07, 0.06), T('p25', 1319, 0.25, 0.06, { at: 0.07 }), ...ting(2637, 0.3, 0.025, 0.07)],
  'ui.buy': [N('bp', 800, 0.1, 0.06), T('p25', 988, 0.07, 0.06, { at: 0.04 }), T('p25', 1319, 0.25, 0.06, { at: 0.11 }), ...ting(2637, 0.3, 0.025, 0.11)],
  'ui.sell': [...ting(2349, 0.2, 0.05), ...ting(2093, 0.2, 0.05, 0.06), ...ting(2637, 0.3, 0.05, 0.12)],
  'ui.error': [T('square', 180, 0.12, 0.05, { lp: 1200 }), T('square', 150, 0.18, 0.05, { lp: 1200, at: 0.1 })],
  'ui.lvl': [...notes('p25', [67, 72, 76, 79, 84], 0.07, 0.22, 0.07), ...[72, 76, 79].map((m) => T('triangle', hz(m), 0.9, 0.035, { at: 0.35, h: 0.3 })), N('hp', 5000, 0.9, 0.06, { at: 0.35 }), ...sparkle(0.035, 0.38)],
  'ui.stat': notes('triangle', [84, 88, 91], 0.05, 0.15, 0.04),
  'ui.equip': [...clank(500, 0.25, 0.1), N('bp', 1200, 0.08, 0.08)],
  'ui.upgrade': [...clank(700, 0.3, 0.12), ...at(0.16, clank(900, 0.4, 0.14)), ...sparkle(0.03, 0.3)],
  'ui.salvage': [N('lp', 2000, 0.3, 0.15, { trem: 30, to: 500 }), ...clank(400, 0.25, 0.08)],
  'ui.toast': [T('sine', 600, 0.06, 0.04, { to: 1200 })],
  'ui.goal': [...notes('p25', [76, 79, 84], 0.08, 0.2, 0.06), T('triangle', hz(88), 0.5, 0.04, { at: 0.24 })],
  'ui.gem': [...ting(3136, 0.4, 0.06), ...ting(4186, 0.5, 0.05, 0.08)],
  'ui.unlock': [click(2500, 0.08), T('triangle', 523, 0.1, 0.05, { at: 0.04 }), T('triangle', 784, 0.22, 0.05, { at: 0.12 })],
};

// ---------------------------------------------------------------- the story
// prettier-ignore
const STORY: Record<string, S> = {
  's.step': [N('lp', 700, 0.06, 0.12, { to: 250 }), T('sine', 120, 0.05, 0.08, { to: 80 })],
  's.event': [N('hp', 2500, 0.25, 0.05, { to: 5000, trem: 25 })],
  's.shop': [...bell(1568, 0.5, 0.06), ...at(0.14, bell(1319, 0.6, 0.06))],
  's.rest': [...crackle(14, 0.8, 0.04, 1500, 4000, 9), N('lp', 400, 0.8, 0.06)],
  's.chest': [T('sawtooth', 110, 0.3, 0.05, { to: 160, lp: 800, trem: 30 }), ...sparkle(0.035, 0.3)],
  's.boss': [...boom(0.3), T('sawtooth', hz(33), 1.4, 0.09, { lp: 600, det: 12, a: 0.1 }), T('sawtooth', hz(39), 1.2, 0.07, { lp: 600, det: -12, a: 0.1, at: 0.3 })],
  's.nemesis': [T('square', hz(48), 0.25, 0.07, { lp: 1500 }), T('square', hz(47), 0.25, 0.07, { lp: 1500, at: 0.26 }), T('square', hz(43), 0.6, 0.07, { lp: 1500, at: 0.52, vib: [5, 0.4] })],
  's.chapter': [...notes('p25', [60, 64, 67, 72], 0.1, 0.3, 0.06), ...[60, 64, 67].map((m) => T('triangle', hz(m), 0.9, 0.04, { at: 0.4, h: 0.3 }))],
  's.good': [T('p25', 880, 0.06, 0.05), T('p25', 1320, 0.12, 0.05, { at: 0.06 }), ...ting(2637, 0.3, 0.025, 0.12)],
  's.bad': [T('sawtooth', 160, 0.3, 0.05, { to: 110, lp: 900, vib: [8, 1] })],
};

/**
 * Level trims from the loudness check (tools/audio/levels.mjs, which renders every sound offline): hits sit
 * around -20 to -26 dB RMS, swings and casts -30 to -37, menu sounds -37 to -41. These bring the outliers in.
 */
// prettier-ignore
const TRIM: Record<string, number> = {
  'w.throw.fly': 2.5, 's.rest': 2, 'p.regen.cast': 2, 'f.skip': 1.8, 'p.lightning.cast': 2, 'p.vines.cast': 1.8, 's.good': 1.5,
  'ui.close': 1.3, 'f.crit': 1.4, 'f.lose': 1.4, 'w.whip.hit': 0.7, 'p.lightning.hit': 0.85, 'p.boom.hit': 0.9,
};
/** Every sound, by name. */
export const SFX: Record<string, S> = Object.fromEntries(
  Object.entries({ ...WEAPON, ...POWER, ...FIGHT, ...WHEEL, ...UI, ...STORY }).map(([k, v]) => [k, TRIM[k] ? vol(TRIM[k]!, v) : v]),
);

/** The sound test page's groups. */
export const SFX_GROUPS: { n: string; keys: string[] }[] = [
  { n: 'Weapons', keys: Object.keys(WEAPON) },
  { n: 'Powers', keys: Object.keys(POWER) },
  { n: 'Fight', keys: Object.keys(FIGHT) },
  { n: 'Wheels', keys: Object.keys(WHEEL) },
  { n: 'Menus', keys: Object.keys(UI) },
  { n: 'Story', keys: Object.keys(STORY) },
];
