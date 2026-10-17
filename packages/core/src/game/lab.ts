import { GEAR } from '../data/gear';
import { simulate } from '../battle';
import { randomFighter, levelUp } from '../fighter';
import { mulberry32, type Rng } from '../rng';
import { pick } from '../random';
import { personalityOf } from '../stats';
import type { Fighter } from '../types';
import { invalidate, randomGear } from './career';

/**
 * The balance lab (Phase 4, upgrade 14, hidden): mass same-level fights between random fighters wearing random
 * gear (some in full sets), with win rates by class, race, weapon, sidekick, gear set, growth and personality.
 */
export interface LabRow {
  k: string;
  label: string;
  e: string;
  /** fighters with it */
  n: number;
  /** their win rate */
  w: number;
}
export interface LabTable {
  k: string;
  title: string;
  rows: LabRow[];
}
export interface LabReport {
  fights: number;
  seed: number;
  tables: LabTable[];
}

const SETS = [...new Set(GEAR.filter((g) => g.set).map((g) => g.set!))];

/** A lab fighter: random build, level, gear, and in 40% of cases 2, 4 or 6 pieces of one set. */
export function labFighter(rng: Rng, lvl: number): Fighter {
  const f = randomFighter('Lab', rng);
  levelUp(f, lvl - 1, rng);
  f.lvl = lvl;
  randomGear(f, Math.floor(rng() * 7), rng);
  if (rng() < 0.4) {
    const set = pick(rng, SETS);
    const pieces = GEAR.filter((g) => g.set === set);
    const want = Math.min(pieces.length, pick(rng, [2, 4, 6]));
    f.gear = f.gear || {};
    for (const g of pieces.slice(0, want)) f.gear[g.slot] = g.k;
    invalidate(f);
  }
  return f;
}

/** What a fighter counts as in each table. */
function keysOf(f: Fighter): Record<string, [k: string, label: string, e: string]> {
  const sets = SETS.map((s) => [s, Object.values(f.gear || {}).filter((k) => GEAR.find((g) => g.k === k)?.set === s).length] as const).filter(
    ([, n]) => n >= 2,
  );
  const [set, n] = sets.sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  const tier = n >= 6 ? 6 : n >= 4 ? 4 : 2;
  const p = personalityOf(f);
  return {
    arch: [f.arch.k, f.arch.n, f.arch.e],
    race: [f.race.n, f.race.n, f.race.e],
    weapon: [f.weapon.n, f.weapon.n, f.weapon.e],
    side: f.side ? [f.side.n, f.side.n, f.side.e] : ['none', 'No sidekick', '·'],
    set: set ? [`${set}${tier}`, `${set[0]!.toUpperCase()}${set.slice(1)} set, ${tier} pieces`, '🛡️'] : ['none', 'No set', '·'],
    growth: f.growth ? [f.growth.n, f.growth.n, f.growth.e] : ['none', 'No growth', '·'],
    pers: [p.k, p.n, p.e],
  };
}

export const LAB_TABLES: [k: string, title: string][] = [
  ['arch', 'Classes'],
  ['race', 'Races'],
  ['weapon', 'Weapons'],
  ['side', 'Sidekicks'],
  ['set', 'Gear sets'],
  ['growth', 'Growth'],
  ['pers', 'Personalities'],
];

/** Runs `fights` seeded fights and returns win rates per table, best first. */
export function labRun(fights: number, seed = 1, onProgress?: (done: number, total: number) => void): LabReport {
  const rng = mulberry32(seed);
  const acc = new Map<string, { label: string; e: string; n: number; w: number }>();
  const add = (t: string, [k, label, e]: [string, string, string], won: boolean) => {
    const id = `${t}|${k}`;
    const a = acc.get(id) ?? { label, e, n: 0, w: 0 };
    a.n++;
    if (won) a.w++;
    acc.set(id, a);
  };
  for (let i = 0; i < fights; i++) {
    const lvl = 1 + Math.floor(rng() * 30);
    const a = labFighter(rng, lvl);
    const b = labFighter(rng, lvl);
    // each fight has its own stream, so the same fighters meet whatever an earlier fight drew (paired comparisons)
    const won = simulate(a, b, mulberry32((seed * 1000003 + i * 7919) >>> 0)) === 0;
    for (const [f, w] of [
      [a, won],
      [b, !won],
    ] as const) {
      const ks = keysOf(f);
      for (const [t] of LAB_TABLES) add(t, ks[t]!, w);
    }
    if (onProgress && (i + 1) % 250 === 0) onProgress(i + 1, fights);
  }
  const tables = LAB_TABLES.map(([k, title]) => ({
    k,
    title,
    rows: [...acc]
      .filter(([id]) => id.startsWith(`${k}|`))
      .map(([id, v]) => ({ k: id.slice(k.length + 1), label: v.label, e: v.e, n: v.n, w: v.w / v.n }))
      .sort((x, y) => y.w - x.w),
  }));
  return { fights, seed, tables };
}
