import { GEARK, numStats, synOf, type NumStats } from '../stats';
import { GEAR_SLOTS, RARITY_ORDER } from '../data/gear';
import { upgradeLevel } from './forge';
import type { CareerFighter } from '../save/fighter';
import type { Fighter, Gear, Synergy } from '../types';
import { ctxOf, type Game } from './game';

/**
 * Gear compare (Phase 4, upgrade 28): what a piece would change before it goes on. The real numbers with the
 * piece worn against now, and the set bonuses and synergies it would start or end.
 */
export interface StatDiff {
  k: keyof NumStats;
  a: number;
  b: number;
}
export interface GearCompare {
  /** what is in the slot now */
  old: Gear | null;
  /** every real number, now (a) and with the piece (b) */
  rows: StatDiff[];
  gain: Synergy[];
  lose: Synergy[];
}
const KEYS: (keyof NumStats)[] = ['hp', 'atk', 'pow', 'def', 'spd', 'crit', 'dodge', 'cha'];

/** The fighter as they would be wearing `k` (a copy; the fighter is not touched). */
export function wearing(f: Fighter, k: string): Fighter {
  const x = GEARK[k]!;
  return { ...f, gear: { ...(f.gear || {}), [x.slot]: x.k } } as Fighter;
}
export function gearCompare(g: Game, k: string, f: CareerFighter = g.F!): GearCompare {
  const x = GEARK[k]!;
  const ctx = ctxOf(g);
  const after = wearing(f, k);
  const A = numStats(f, ctx);
  const B = numStats(after, ctx);
  const rows = KEYS.filter((s) => A[s] != null && B[s] != null).map((s) => ({ k: s, a: A[s] as number, b: B[s] as number }));
  const before = synOf(f);
  const now = synOf(after);
  const had = new Set(before.map((s) => s.k));
  const has = new Set(now.map((s) => s.k));
  const cur = f.gear?.[x.slot];
  return { old: cur && cur !== x.k ? (GEARK[cur] ?? null) : null, rows, gain: now.filter((s) => !had.has(s.k)), lose: before.filter((s) => !has.has(s.k)) };
}

// how much each real number wins fights, per relative change (crit and dodge: per percentage point / 100)
const WEIGHT: Record<keyof NumStats, number> = { hp: 1, atk: 1, pow: 0.6, def: 1, spd: 0.25, crit: 0.6, dodge: 1, cha: 0.05 };
const PCT = new Set<keyof NumStats>(['crit', 'dodge']);
const tierOf = (f: Fighter, x: Gear | null) => (x ? Math.max(0, RARITY_ORDER.indexOf(x.r)) + 0.5 * upgradeLevel(f, x.k) : -1);

/**
 * How much better (above 0) or worse a piece is than what is in its slot now, roughly in parts of fighting
 * strength: the real numbers it moves, plus what numbers miss (procs, revives, specials), which grows with rarity
 * and upgrade level, and the synergies it starts or ends.
 */
export function gearGain(g: Game, k: string, f: CareerFighter = g.F!): number {
  const x = GEARK[k]!;
  const cur = f.gear?.[x.slot];
  if (cur === k) return 0;
  const c = gearCompare(g, k, f);
  let s = 0;
  for (const r of c.rows) s += WEIGHT[r.k] * (PCT.has(r.k) ? (r.b - r.a) / 100 : (r.b - r.a) / Math.max(1, r.a));
  s += 0.03 * (tierOf(f, x) - tierOf(f, cur ? (GEARK[cur] ?? null) : null));
  s += 0.03 * (c.gain.length - c.lose.length);
  return s;
}
export type GearVerdict = 'up' | 'down' | 'even';
/** Upgrade, downgrade or about even, against what is worn in its slot now. */
export function gearVerdict(g: Game, k: string, f: CareerFighter = g.F!): GearVerdict {
  const v = gearGain(g, k, f);
  return v > 0.015 ? 'up' : v < -0.015 ? 'down' : 'even';
}
/** The best owned piece for a slot when it beats what is worn there, else null. */
export function bestFor(g: Game, slot: string, f: CareerFighter = g.F!): string | null {
  let best: string | null = null;
  let bv = 0.015;
  for (const k of f.armory || []) {
    const x = GEARK[k];
    if (!x || x.slot !== slot || f.gear?.[x.slot] === k) continue;
    const v = gearGain(g, k, f);
    if (v > bv) {
      bv = v;
      best = k;
    }
  }
  return best;
}
/** Every slot's best upgrade from the armory: [slot, piece] pairs. */
export const bestUpgrades = (g: Game, f: CareerFighter = g.F!) =>
  GEAR_SLOTS.map((s) => [s, bestFor(g, s, f)] as const).filter((p): p is readonly [typeof p[0], string] => !!p[1]);
