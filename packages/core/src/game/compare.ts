import { GEARK, numStats, synOf, type NumStats } from '../stats';
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
