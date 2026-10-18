import { CLOSERS, NO_SYNERGY, STRENGTH_LINES, SYN_JOKES, TRAIT_JOKES, WEAKNESS_LINES, type SumKey } from '../data/content/build-summary';
import { SYN_HIDDEN } from '../data/content/hidden-synergies';
import { FLAVOR } from '../data/content/text';
import { verdict } from '../battle';
import { randomFighter } from '../fighter';
import { mulberry32 } from '../rng';
import { hashStr } from '../save/fighter';
import { activePower, eff, numStats, synOf, type GameContext } from '../stats';
import type { Fighter } from '../types';
import { winRate } from './rating';

/**
 * The scouting report after the wheels (Phase 4, upgrade 29): three strengths, the biggest weakness and the best
 * synergy, each in plain words with a joke. "Strong" means compared with every fighter the wheels can make.
 */
export interface SumLine {
  k: string;
  e: string;
  /** the plain-words label ("Hits hard") */
  n: string;
  /** the mechanics behind it ("Strength 16, among the very best") */
  what: string;
  joke: string;
}
export interface BuildSummary {
  strengths: SumLine[];
  weakness: SumLine;
  synergy: SumLine | null;
  /** said when there is no synergy */
  noSyn: string | null;
  closer: string;
}

const KEYS: SumKey[] = ['str', 'spd', 'dur', 'iq', 'wm', 'pm', 'cha', 'crit', 'dodge'];
const NAMES: Record<SumKey, string> = {
  str: 'Strength',
  spd: 'Speed',
  dur: 'Durability',
  iq: 'IQ',
  wm: 'Weapon mastery',
  pm: 'Power mastery',
  cha: 'Charisma',
  crit: 'Crit chance',
  dodge: 'Dodge chance',
};
function values(f: Fighter, ctx: GameContext): Record<SumKey, number | null> {
  const s = eff(f, ctx);
  const n = numStats(f, ctx);
  return { str: s.str, spd: s.spd, dur: s.dur, iq: s.iq, wm: s.wm, pm: activePower(f) ? s.pm : null, cha: s.cha ?? 5, crit: n.crit, dodge: n.dodge };
}
// what an ordinary fighter looks like: a fixed sample, so the report never changes for the same fighter
let POP: Record<SumKey, [mean: number, sd: number]> | null = null;
function population() {
  if (POP) return POP;
  const r = mulberry32(20261018);
  const acc = Object.fromEntries(KEYS.map((k) => [k, [] as number[]])) as Record<SumKey, number[]>;
  for (let i = 0; i < 600; i++) {
    const v = values(randomFighter('X', r), {});
    for (const k of KEYS) if (v[k] != null) acc[k].push(v[k]!);
  }
  POP = Object.fromEntries(
    KEYS.map((k) => {
      const a = acc[k];
      const m = a.reduce((x, y) => x + y, 0) / a.length;
      return [k, [m, Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) || 1]];
    }),
  ) as Record<SumKey, [number, number]>;
  return POP;
}
const high = (z: number) => (z >= 1.3 ? 'among the very best' : z >= 0.7 ? 'well above average' : z >= 0.2 ? 'above average' : z >= -0.2 ? 'about average' : 'their best of a modest set');
const low = (z: number) => (z <= -1.3 ? 'among the very lowest' : z <= -0.7 ? 'well below average' : 'below average');
const pickBy = <T,>(list: T[], seed: string) => list[hashStr(seed) % list.length]!;

export function buildSummary(f: Fighter, ctx: GameContext = {}): BuildSummary {
  const P = population();
  const v = values(f, ctx);
  const z = KEYS.filter((k) => v[k] != null).map((k) => ({ k, v: v[k]!, z: (v[k]! - P[k][0]) / P[k][1] }));
  const unit = (k: SumKey) => (k === 'crit' || k === 'dodge' ? '%' : '');
  const best = [...z].sort((a, b) => b.z - a.z).slice(0, 3);
  const strengths = best.map(({ k, v: x, z: s }) => {
    const [e, n, jokes] = STRENGTH_LINES[k];
    return { k, e, n, what: `${NAMES[k]} ${x}${unit(k)}, ${high(s)}`, joke: pickBy(jokes, f.name + k) };
  });
  const worst = [...z].filter((x) => !best.includes(x)).sort((a, b) => a.z - b.z)[0];
  let weakness: SumLine;
  // a clearly low stat is the weakness; otherwise it's the one the weakness wheel gave them
  if (worst && (worst.z <= -0.6 || !f.weak || f.weak.k === 'none')) {
    const [e, n, jokes] = WEAKNESS_LINES[worst.k];
    weakness = { k: worst.k, e, n, what: `${NAMES[worst.k]} ${worst.v}${unit(worst.k)}, ${low(worst.z)}`, joke: pickBy(jokes, f.name + worst.k) };
  } else {
    const w = f.weak!;
    weakness = { k: 'weak', e: w.e || '⚠️', n: w.n, what: w.d || '', joke: FLAVOR[w.n] ?? pickBy(TRAIT_JOKES, f.name) };
  }
  // hidden synergies stay a surprise until a fight gives them away
  const hidden = new Set(SYN_HIDDEN.map((s) => s.k));
  const syns = synOf(f).filter((s) => !hidden.has(s.k));
  const top = [...syns].sort((a, b) => (b.q ?? 1) - (a.q ?? 1))[0];
  const synergy = top ? { k: top.k, e: top.e, n: top.n, what: top.d, joke: FLAVOR[top.n] ?? pickBy(SYN_JOKES, f.name + top.k) } : null;
  const q = verdict(winRate(f, ctx)).q;
  return { strengths, weakness, synergy, noSyn: synergy ? null : pickBy(NO_SYNERGY, f.name), closer: pickBy(CLOSERS[q], f.name + 'closer') };
}
