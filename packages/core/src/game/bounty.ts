import { BOUNTIES, type Bounty } from '../data/content/bounties';
import { pick } from '../random';
import { grant } from './career';
import type { Game } from './game';

/**
 * The bounty board (review F5): three standing build challenges, no timers. A new one goes up only when one is
 * done or swapped out. Progress counts across fighters: whoever fits the bounty when it happens counts.
 */
interface BountyState {
  up: string[];
  done: string[];
  /** steps toward bounties that need more than one */
  prog: Record<string, number>;
  /** swapped out last, kept off the board until something else has gone up */
  last?: string | null;
}
export const BOUNTY_SLOTS = 3;
/** What swapping a bounty for another costs. */
export const BOUNTY_SWAP_GEMS = 1;
const state = (g: Game) => (g.save.profile.extra.bounty ??= { up: [], done: [], prog: {} }) as unknown as BountyState;
const byKey = (k: string) => BOUNTIES.find((b) => b.k === k);

/** Fills the board up to three from the bounties not up and not done. */
function deal(g: Game) {
  const s = state(g);
  s.up = s.up.filter((k) => byKey(k) && !s.done.includes(k));
  while (s.up.length < BOUNTY_SLOTS) {
    const free = BOUNTIES.filter((b) => !s.up.includes(b.k) && !s.done.includes(b.k) && b.k !== s.last);
    if (!free.length) break;
    s.up.push(pick(g.rng, free).k);
    s.last = null;
  }
}

/** The bounties up right now, with how far along each is. */
export function bountyBoard(g: Game): { b: Bounty; cur: number; need: number }[] {
  deal(g);
  const s = state(g);
  return s.up.map((k) => {
    const b = byKey(k)!;
    return { b, cur: s.prog[k] || 0, need: b.need || 1 };
  });
}
export const bountiesDone = (g: Game) => state(g).done.length;

/** A career stat stepped (a boss beaten, a cup won...): bounties on it that the active fighter fits move on. */
export function bountyStep(g: Game, on: string) {
  const F = g.F;
  if (!F) return;
  deal(g);
  const s = state(g);
  for (const k of [...s.up]) {
    const b = byKey(k)!;
    if (b.on !== on || !b.is(F)) continue;
    s.prog[k] = (s.prog[k] || 0) + 1;
    if (s.prog[k]! < (b.need || 1)) continue;
    s.done.push(k);
    s.up = s.up.filter((x) => x !== k);
    delete s.prog[k];
    g.notes.push(`${b.e} Bounty: ${b.n}. ${grant(g, { gems: b.gems })}`);
  }
  deal(g);
}

/** Swaps a bounty for a new one, for a gem. False if it can't be paid or isn't up. */
export function swapBounty(g: Game, k: string): boolean {
  const s = state(g);
  const p = g.save.profile;
  if (!s.up.includes(k) || (p.gems || 0) < BOUNTY_SWAP_GEMS) return false;
  p.gems -= BOUNTY_SWAP_GEMS;
  s.up = s.up.filter((x) => x !== k);
  s.last = k;
  deal(g);
  return true;
}
