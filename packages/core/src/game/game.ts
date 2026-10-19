import type { Rng } from '../rng';
import type { GameContext } from '../stats';
import type { PoolRanking } from '../pool';
import type { CareerFighter } from '../save/fighter';
import type { SaveData, Slot } from '../save/schema';

/**
 * Everything the game rules act on: the save, the fighter being played (rebuilt from its slot),
 * a random source and the date. The legacy game kept these in globals (DB, F, Math.random, Date).
 * Rules change `save` and `F` in place; the app writes them back with `commitGame`.
 */
export interface Game {
  save: SaveData;
  /** the active career fighter, live (null on the title screen or while a new fighter is built) */
  F: CareerFighter | null;
  rng: Rng;
  clock: Clock;
  /** the day's ranked opponent pool (null until it is built: opponents are then plain random fighters) */
  pool: PoolRanking | null;
  /** messages for the player that don't belong to a screen (goal done, mastery up...), oldest first */
  notes: string[];
}

export interface Clock {
  /** date key of today and yesterday (legacy: `new Date().toDateString()`) */
  today: string;
  yesterday: string;
  /** short date for records ("17 Oct 2026") */
  date: string;
}

/**
 * The game's day only moves forward (review G12). Setting the phone's date back used to bring back a fresh daily
 * challenge, daily wheel and deal on every switch; now the day is never earlier than the latest one seen (kept in
 * the save), so going back in time just finds the dailies already used.
 */
export function forwardDay(g: Pick<Game, 'save'>, d: Date): Date {
  const x = g.save.profile.extra as { dayMax?: number };
  const day = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  if (typeof x.dayMax === 'number' && day < x.dayMax) {
    const m = new Date(x.dayMax);
    return new Date(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate(), 12);
  }
  if (x.dayMax !== day) x.dayMax = day;
  return d;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/**
 * "17 Oct 2026", written by hand: the first locale-aware format of a session (toLocaleDateString) loads the
 * browser's date data, 120 to 155 ms on a mid-range phone, and the clock is read on every action.
 */
export const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export function clockAt(d = new Date()): Clock {
  const y = new Date(d.getTime() - 864e5);
  return { today: d.toDateString(), yesterday: y.toDateString(), date: shortDate(d) };
}

/** Balance patches and past champions, as the stat and wheel rules read them. */
export function ctxOf(g: Pick<Game, 'save'>): GameContext {
  const p = g.save.profile;
  return {
    patch: p.patch as GameContext['patch'],
    history: { champs: (p.champs as { best?: string }[]).filter((c) => c && c.best) as never, lastTop: p.lastTop as never },
  };
}

/** The active roster slot (holds the coins, nemesis and unfinished cup of the fighter being played). */
export function slotOf(g: Game): Slot | null {
  const a = g.save.roster.active;
  return a == null ? null : g.save.roster.slots[a] || null;
}

export const coinsOf = (g: Game) => slotOf(g)?.coins ?? 0;
export function addCoins(g: Game, n: number) {
  const s = slotOf(g);
  if (s) s.coins = Math.max(0, s.coins + n);
}
/** Spends coins if there are enough. */
export function spend(g: Game, n: number): boolean {
  const s = slotOf(g);
  if (!s || s.coins < n) return false;
  s.coins -= n;
  return true;
}

export const freeSlot = (g: Game) => g.save.roster.slots.findIndex((s) => !s);

/** A career id: unique per fighter, survives renames and saves. */
export const newCid = (g: Game) => Date.now().toString(36) + g.rng().toString(36).slice(2, 7);

export const pl = (n: number, one: string, many?: string) => `${n} ${n === 1 ? one : many || one + 's'}`;
