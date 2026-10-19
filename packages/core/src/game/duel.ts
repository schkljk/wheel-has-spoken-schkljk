import { ARENAS } from '../data/arenas';
import { BALANCE } from '../data/balance';
import { beatsMove, simulate } from '../battle';
import { LS } from '../stats';
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
  /** re-rolls it took to land between 25% and 75% (review K4; 0 when the date's first matchup was fair) */
  tries: number;
}
export interface DuelScore {
  won: boolean;
  rounds: number;
  /** HP left, in % (0 after a loss) */
  hp: number;
  /** each round's read: won, lost or neither (🟩 🟥 ⬜) */
  sq: string;
  /** your real HP left and your max (wins; older records only have `hp`) */
  hr?: number;
  mx?: number;
  /** after a loss, the opponent's HP left: in % (it ranks losses, lower is better), real, and their max (G13) */
  ohp?: number;
  ohr?: number;
  omx?: number;
  /** who it was against (a K4 re-roll can change an old day's matchup; older records don't say) */
  opp?: string;
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

/** The odds band a day's matchup is re-rolled into (review K4), and the fights that measure it. */
export const DUEL_BAND = { lo: 0.25, hi: 0.75, fights: 40, maxTries: 24 };
/** The stand-in's chance on auto-battle, from fixed dice: the same on every device. Gives up early on a blowout. */
function duelOdds(me: CareerFighter, opp: CareerFighter, arena: Arena, seed: number) {
  const rng = mulberry32(seed);
  const n = DUEL_BAND.fights;
  let w = 0;
  for (let i = 0; i < n; i++) {
    if (simulate(me, opp, rng, { arena }) === 0) w++;
    // sixteen fights in, 0 to 1 wins or 15 to 16 is far outside the band
    if (i === 15 && (w <= 1 || w >= 15)) return w / 16;
  }
  return w / n;
}
const DUELS = new Map<string, Duel>();
/**
 * The day's duel. Nothing about the player goes into it. With the review's band (K4) the date's matchup is
 * re-rolled (the date's seed, then the next, and so on) until the stand-in has 25% to 75% on auto-battle, so
 * everyone still gets the same duel; it's worked out once a day.
 */
export function duelOf(day: string): Duel {
  const key = `${day}|${BALANCE.duelBand ? 1 : 0}`;
  const had = DUELS.get(key);
  if (had) return had;
  const h = hash(`duel:${day}`);
  let d = duelRoll(day, h, 0);
  if (BALANCE.duelBand)
    for (let t = 0; t < DUEL_BAND.maxTries; t++) {
      d = duelRoll(day, (h + t) >>> 0, t);
      const p = duelOdds(d.me, d.opp, d.arena, (h ^ 0x5bd1e995) + t);
      if (p >= DUEL_BAND.lo && p <= DUEL_BAND.hi) break;
    }
  if (DUELS.size > 16) DUELS.clear();
  DUELS.set(key, d);
  return d;
}
function duelRoll(day: string, seed: number, tries: number): Duel {
  const rng = mulberry32(seed);
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
  return { day, no: dayNo(day), me, opp, arena, seed: Math.floor(rng() * 2 ** 31), wheelSeed: Math.floor(rng() * 2 ** 31), tries };
}

/** The days a duel can be played: today and the six before it. */
export function duelDays(today: Date, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)));
}

const scores = (g: Game) => (g.save.profile.extra.duels ??= {}) as unknown as Record<string, DuelScore>;
/**
 * A stored score still belongs to the day's matchup: a record names its opponent, and an older one (no name) was
 * played against the date's first roll, which the review's band (K4) keeps only when it was already fair.
 */
const current = (s: DuelScore | undefined, d: Duel) => !!s && (s.opp ? s.opp === d.opp.name : d.tries === 0);
/** The best score stored for a day (cheap: it doesn't build the duel, so it can't tell a record from before a K4 re-roll). */
export const duelBest = (g: Game, day: string): DuelScore | null => scores(g)[day] ?? null;
/** The best score on this duel: only a record from this matchup counts. */
export const duelBestFor = (g: Game, d: Duel): DuelScore | null => {
  const s = scores(g)[d.day];
  return s && current(s, d) ? s : null;
};
/** How much the opponent had left after a loss, in % (older records don't say: count it as untouched). */
const theirHp = (s: DuelScore) => s.ohp ?? 100;
/**
 * Better: a win beats a loss. Wins: fewer rounds, then more HP left. Losses (G13): the less HP the opponent had
 * left, the closer it was; then more rounds. (A loss used to rank by fewer rounds, so a 3-round wipe beat a
 * 12-round brawl.)
 */
export const duelBetter = (a: DuelScore, b: DuelScore) =>
  a.won !== b.won
    ? a.won
    : a.won
      ? a.rounds !== b.rounds
        ? a.rounds < b.rounds
        : a.hp > b.hp
      : theirHp(a) !== theirHp(b)
        ? theirHp(a) < theirHp(b)
        : a.rounds > b.rounds;
/** Real HP from a share of a fighter's max. */
const realMax = (f: CareerFighter) => Math.round((f.maxHp || 100) * LS(f));
/**
 * The HP a score is ranked by, as real numbers: your HP left after a win ("84/131 HP"), the opponent's after a
 * loss. Older records kept only a percentage: a win is worked out from the stand-in's max, a loss says nothing ('').
 */
export function duelHpText(d: Duel, s: DuelScore): string {
  if (s.won) {
    const mx = s.mx ?? realMax(d.me);
    return `${s.hr ?? Math.max(1, Math.round((s.hp / 100) * mx))}/${mx} HP`;
  }
  return s.ohr != null && s.omx != null ? `${s.ohr}/${s.omx} HP` : '';
}
/** A score in words: "won in 5 rounds with 84/131 HP left", "lost in 7 rounds, Bob on 40/150 HP". */
export function duelScoreText(d: Duel, s: DuelScore): string {
  const r = `${s.rounds} ${s.rounds === 1 ? 'round' : 'rounds'}`;
  const hp = duelHpText(d, s);
  return s.won ? `won in ${r} with ${hp} left` : `lost in ${r}${hp ? `, ${d.opp.name} on ${hp}` : ''}`;
}

/** The rounds' reads as squares: your read won, theirs did, or neither. */
export function duelSquares(hist: readonly (readonly Move[])[]): string {
  const [a = [], b = []] = hist;
  return a.map((m, i) => (beatsMove(m, b[i]!) ? '🟩' : beatsMove(b[i]!, m) ? '🟥' : '⬜')).join('');
}
/** The line to share. */
export function duelShare(d: Duel, s: DuelScore): string {
  return `The Wheel Has Spoken · Daily duel #${d.no}: ${duelScoreText(d, s)}\n${s.sq}`;
}

/** After a duel: the score, the best of the day kept, and coins for the day's first win. */
export function endDuelFight(g: Game, d: Duel, o: FightOutcome): FightResult {
  const won = o.w === 0;
  const real = (x: FightOutcome['me']) => Math.max(0, Math.round(x.hp * (x.ls || 1)));
  const max = (x: FightOutcome['me']) => Math.round(x.maxHp * (x.ls || 1));
  const s: DuelScore = { won, rounds: o.round, hp: won ? Math.max(1, Math.round((o.me.hp / o.me.maxHp) * 100)) : 0, sq: duelSquares(o.hist ?? [[], []]), opp: d.opp.name };
  if (won) Object.assign(s, { hr: Math.max(1, real(o.me)), mx: max(o.me) });
  else if (o.them) Object.assign(s, { ohp: Math.max(1, Math.ceil((o.them.hp / o.them.maxHp) * 100)), ohr: Math.max(1, real(o.them)), omx: max(o.them) });
  const all = scores(g);
  const stored = all[d.day];
  const old = current(stored, d) ? stored : undefined;
  const first = won && !(old && old.won);
  if (!old || duelBetter(s, old)) all[d.day] = s;
  const cap = (t: string) => t[0]!.toUpperCase() + t.slice(1);
  const lines = [cap(duelScoreText(d, s))];
  if (old && !duelBetter(s, old)) lines.push(`Your best on this one stands: ${duelScoreText(d, old)}`);
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
