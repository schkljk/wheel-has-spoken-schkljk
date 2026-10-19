import { ARENAS } from '../data/arenas';
import { beatsMove } from '../battle';
import { levelUp } from '../fighter';
import { randomFighter } from '../fighter';
import { randName } from '../names';
import { pick } from '../random';
import { mulberry32 } from '../rng';
import type { CareerFighter } from '../save/fighter';
import type { Arena, Move } from '../types';
import { invalidate, randomGear } from './career';
import { addCoins, type Game } from './game';
import type { FightOutcome, FightResult, FightTier, Step } from './fight';

/**
 * The daily duel (review F2): one matchup a day, the same for everyone. Both fighters, the arena and every die
 * come from the date, so the only difference between two players is their choices. Scored by the result, the
 * rounds it took and the HP left. No streak, and every past duel stays playable.
 */
export const DUEL_TIER: FightTier = { k: 'duel', n: 'Daily duel', e: '⚔️', xpW: 0, coins: 0 };
/** Coins for the first win of each day's duel. */
export const DUEL_WIN_COINS = 8;
/** Duel #1 was the first of January 2026. */
const EPOCH = Date.UTC(2026, 0, 1);

export interface Duel {
  /** the day, YYYY-MM-DD */
  day: string;
  no: number;
  me: CareerFighter;
  opp: CareerFighter;
  arena: Arena;
  /** the fight's dice */
  seed: number;
  /** the combat wheel's dice */
  wheelSeed: number;
}
export interface DuelScore {
  won: boolean;
  rounds: number;
  /** HP left, in % (0 after a loss) */
  hp: number;
  /** each round's read: won, lost or neither (🟩 🟥 ⬜) */
  sq: string;
}

/** A local date as YYYY-MM-DD. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayNo = (day: string) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 864e5) + 1;
};
/** A 32-bit seed from a string (FNV-1a). */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h >>> 0;
}

/** The day's duel. Nothing about the player goes into it. */
export function duelOf(day: string): Duel {
  const rng = mulberry32(hash(`duel:${day}`));
  const lvl = 8 + Math.floor(rng() * 10);
  const mk = () => {
    const f = randomFighter(randName(rng), rng) as CareerFighter;
    levelUp(f, lvl - 1, rng);
    f.lvl = lvl;
    randomGear(f, 2 + Math.floor(rng() * 3), rng);
    invalidate(f);
    return f;
  };
  const me = mk();
  const opp = mk();
  const arena = pick(rng, ARENAS);
  return { day, no: dayNo(day), me, opp, arena, seed: Math.floor(rng() * 2 ** 31), wheelSeed: Math.floor(rng() * 2 ** 31) };
}

/** The days a duel can be played: today and the six before it. */
export function duelDays(today: Date, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)));
}

const scores = (g: Game) => (g.save.profile.extra.duels ??= {}) as unknown as Record<string, DuelScore>;
/** The best score so far on a day's duel. */
export const duelBest = (g: Game, day: string): DuelScore | null => scores(g)[day] ?? null;
/** Better: a win beats a loss, then fewer rounds, then more HP left. */
const better = (a: DuelScore, b: DuelScore) => (a.won !== b.won ? a.won : a.rounds !== b.rounds ? a.rounds < b.rounds : a.hp > b.hp);

/** The rounds' reads as squares: your read won, theirs did, or neither. */
export function duelSquares(hist: readonly (readonly Move[])[]): string {
  const [a = [], b = []] = hist;
  return a.map((m, i) => (beatsMove(m, b[i]!) ? '🟩' : beatsMove(b[i]!, m) ? '🟥' : '⬜')).join('');
}
/** The line to share. */
export function duelShare(d: Pick<Duel, 'no'>, s: DuelScore): string {
  const head = s.won ? `won in ${s.rounds} ${s.rounds === 1 ? 'round' : 'rounds'}, ${s.hp}% HP left` : `lost in ${s.rounds} ${s.rounds === 1 ? 'round' : 'rounds'}`;
  return `The Wheel Has Spoken · Daily duel #${d.no}: ${head}\n${s.sq}`;
}

/** After a duel: the score, the best of the day kept, and coins for the day's first win. */
export function endDuelFight(g: Game, d: Duel, o: FightOutcome): FightResult {
  const won = o.w === 0;
  const s: DuelScore = { won, rounds: o.round, hp: won ? Math.max(1, Math.round((o.me.hp / o.me.maxHp) * 100)) : 0, sq: duelSquares(o.hist ?? [[], []]) };
  const all = scores(g);
  const old = all[d.day];
  const first = won && !(old && old.won);
  if (!old || better(s, old)) all[d.day] = s;
  const lines = [won ? `Won in ${s.rounds} rounds with ${s.hp}% HP left` : `Lost in ${s.rounds} rounds`];
  if (old && !better(s, old)) lines.push(`Your best on this one stands: ${old.won ? `won in ${old.rounds} rounds, ${old.hp}% HP` : `lost in ${old.rounds} rounds`}`);
  else if (old) lines.push('A new best on this duel');
  if (first) {
    addCoins(g, DUEL_WIN_COINS);
    lines.push(`+${DUEL_WIN_COINS} 🪙 for the first win`);
  }
  const next: Step[] = [{ t: 'hub' }];
  return {
    won,
    big: won ? 'Duel won' : 'Duel lost',
    desc: `${o.me.f.name} vs ${d.opp.name}. Same fighters, same dice, different excuses.`,
    lines,
    got: [],
    next,
    button: 'Done',
    q: won ? 2 : 0,
    confetti: won,
    share: duelShare(d, s),
  };
}

/** The Play tab's line for today's duel. */
export function duelText(g: Game): string {
  const today = dayKey(new Date(g.clock.today));
  const b = duelBest(g, today);
  const no = dayNo(today);
  return b ? `#${no}: ${b.won ? `won in ${b.rounds} rounds` : 'lost, for now'}` : `#${no} is up. Everyone gets the same one`;
}
