/**
 * Paired-fight helpers for the balance sims: the same pairs and dice for every variant, so a difference is the
 * variant's alone. A difference of a few hundred fights out of 1,500 pairs is good to about one point.
 */
import {
  BALANCE,
  CW_REC,
  GEARK,
  ULT_WHEEL,
  cwPowOk,
  cwSlices,
  invalidate,
  labFighter,
  mulberry32,
  newBattle,
  pickW,
  randomGear,
  useBalance,
  type Balance,
  type Fighter,
  type Focus,
  type Move,
  type Side,
} from '../../packages/core/src';

export interface Pair {
  a: Fighter;
  b: Fighter;
  s: number;
  lvl: number;
}
/** N same-level pairs of lab fighters, levels lo to hi; with `gear6` side A wears six random common-epic pieces. */
export function pairs(N: number, seed = 61, lo = 5, hi = 30, gear6 = true): Pair[] {
  return Array.from({ length: N }, (_, i) => {
    const rng = mulberry32((seed + i * 7919) >>> 0);
    const lvl = lo + Math.floor(rng() * (hi - lo + 1));
    const a = labFighter(rng, lvl);
    const b = labFighter(rng, lvl);
    if (gear6) {
      a.gear = {};
      randomGear(a, 6, rng);
      invalidate(a);
    }
    return { a, b, s: (i * 104729 + seed * 13) >>> 0, lvl };
  });
}
export type Mod = (f: Fighter) => void;
export type Tweak = (me: Side, op: Side) => void;

/** Win rate of side A over the pairs on auto-battle, A changed by `mod` (on a copy) and the battle by `tweak`. */
export function rate(ps: Pair[], mod?: Mod, tweak?: Tweak): number {
  let w = 0;
  for (const p of ps) {
    let a = p.a;
    if (mod) {
      a = structuredClone(p.a) as Fighter;
      mod(a);
      invalidate(a);
    }
    const bt = newBattle(a, structuredClone(p.b) as Fighter, mulberry32(p.s), { quiet: true });
    if (tweak) tweak(bt.P[0], bt.P[1]);
    bt.start();
    while (!bt.over) bt.step();
    if (bt.w === 0) w++;
  }
  return w / ps.length;
}

/** Like `rate`, but side A follows the read on the combat wheel (B is the AI, at this skill). */
export function rateRead(ps: Pair[], mod?: Mod, aiSkill = 0.3): number {
  let w = 0;
  ps.forEach((p, i) => {
    let a = p.a;
    if (mod) {
      a = structuredClone(p.a) as Fighter;
      mod(a);
      invalidate(a);
    }
    const b = structuredClone(p.b) as Fighter;
    b.aiSkill = aiSkill;
    const bt = newBattle(a, b, mulberry32(p.s), { quiet: true });
    const prng = mulberry32((i * 31 + 7) ^ 0x9e3779b9);
    bt.start();
    while (!bt.over) {
      const pl = bt.plan();
      const me = bt.P[0];
      let focus: Focus = CW_REC[pl.shown] ?? 'atk';
      if (focus === 'pow' && !cwPowOk(me) && cwSlices(me, 'pow').length === 0) focus = 'atk';
      if (me.en >= 100 && pl.shown !== 'guard') focus = 'ult';
      const list = cwSlices(me, focus);
      const it = list[pickW(prng, list)]!.it;
      if (it.c === 'ult') {
        if (it.ultIdx != null) me.ultSpin = ULT_WHEEL[it.ultIdx]!;
        bt.step('ult', null, { ...(it.m || {}) });
      } else bt.step(it.c as Move, null, { ...(it.m || {}) });
    }
    if (bt.w === 0) w++;
  });
  return w / ps.length;
}

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
/** A difference in win-rate points, signed. */
export const pts = (x: number, base: number) => `${x - base >= 0 ? '+' : ''}${((x - base) * 100).toFixed(1)}`;
/** Runs `fn` with some switches set, then puts the tuning back (retuned rows follow the switches). */
export function withBal<T>(b: Partial<Balance>, fn: () => T): T {
  const keep = { ...BALANCE };
  useBalance(b);
  try {
    return fn();
  } finally {
    useBalance(keep);
  }
}
/** Wears these pieces, each in its slot. */
export const wear =
  (...ks: string[]): Mod =>
  (f) => {
    f.gear = { ...(f.gear || {}) };
    for (const k of ks) (f.gear as Record<string, string>)[GEARK[k]!.slot] = k;
  };
/** Review round 2's switches (K1-K10), all off: the game before that pass. */
export const ROUND2_OFF: Partial<Balance> = {
  premiumGate: false,
  clubTight: false,
  runFair: false,
  duelBand: false,
  trialLadder: false,
  reviveCap: false,
  critDodge: false,
  upgradeCarry: false,
  injuryCap: false,
  pickTune: false,
};
export const ROUND2_ON: Partial<Balance> = Object.fromEntries(Object.keys(ROUND2_OFF).map((k) => [k, true]));
