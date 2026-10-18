import { ACHIEVEMENTS, MASTERY } from '../data/content/progression';
import { TIERS_T } from '../data/content/economy';
import { BOSSES } from '../data/content/story';
import { ARCHS } from '../data/wheels';
import type { SerFighter } from '../save/fighter';
import type { Json } from '../save/fighter';
import type { Fighter } from '../types';
import { fullName } from '../stats';
import type { Game } from './game';

/**
 * The trophy room (Phase 4, upgrade 23): belts and boss kills across every fighter, rare titles and mastered
 * classes, as shelves. Belts and bosses are counted as they happen; the first look also counts what the
 * fighters on the roster and in the hall of fame already hold.
 */
export interface Trophy {
  /** times won */
  n: number;
  /** who won it first */
  who: string;
}
export interface Trophies {
  v: 1;
  belts: Record<string, Trophy>;
  bosses: Record<string, Trophy>;
}

const nameOf = (f: { name?: string } | Fighter) => ((f as Fighter).race ? fullName(f as Fighter) : (f as { name?: string }).name) || 'Someone';
const bump = (m: Record<string, Trophy>, k: string, who: string) => {
  const t = m[k];
  m[k] = t ? { n: t.n + 1, who: t.who } : { n: 1, who };
};

/** The trophy counts, made on first use from what the fighters already hold. */
export function trophiesOf(g: Game): Trophies {
  const p = g.save.profile as typeof g.save.profile & { trophies?: Trophies };
  if (p.trophies && p.trophies.v === 1) return p.trophies;
  const t: Trophies = { v: 1, belts: {}, bosses: {} };
  const fighters: SerFighter[] = [
    ...g.save.roster.slots.filter((s) => s && s.career).map((s) => s!.career),
    ...((g.save.roster.retired || []) as SerFighter[]),
  ];
  for (const f of fighters) {
    for (const [k, v] of Object.entries(f.belts || {})) if (v) bump(t.belts, k, f.name);
    const cleared = ((f.story as { cleared?: number[] } | null)?.cleared || []) as number[];
    for (const ch of new Set(cleared)) bump(t.bosses, String(ch), f.name);
  }
  p.trophies = t as unknown as Json as unknown as Trophies;
  return t;
}

export function noteBelt(g: Game, tier: string, f: Fighter) {
  bump(trophiesOf(g).belts, tier, nameOf(f));
}
export function noteBoss(g: Game, ch: number, f: Fighter) {
  bump(trophiesOf(g).bosses, String(ch), nameOf(f));
}

/** Everything on the shelves: won ones lit, the rest as silhouettes to aim for. */
export function trophyShelves(g: Game) {
  const t = trophiesOf(g);
  const p = g.save.profile;
  const top = MASTERY[MASTERY.length - 1]!;
  const masteryLvl = (k: string) => MASTERY.filter((m) => (p.mastery[k] || 0) >= m).length;
  return {
    belts: TIERS_T.filter((x) => x.size).map((x) => ({ k: x.k, n: x.n, e: x.e, won: t.belts[x.k] ?? null })),
    bosses: BOSSES.map((b, i) => ({ ch: i + 1, n: b.name, e: b.e, title: b.title, won: t.bosses[String(i + 1)] ?? null })),
    // the rarest titles that aren't a boss (those are on their own shelf)
    titles: ACHIEVEMENTS.filter((a) => a.q >= 3 && !/^story\d+$/.test(a.k)).map((a) => ({ ...a, won: !!p.ach[a.k] })),
    classes: ARCHS.map((a) => ({ k: a.k, n: a.n, e: a.e, wins: p.mastery[a.k] || 0, lvl: masteryLvl(a.k), max: MASTERY.length, top })),
  };
}
