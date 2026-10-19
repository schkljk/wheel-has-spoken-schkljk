import { BOUNTIES, type Bounty } from '../data/content/bounties';
import { BALANCE } from '../data/balance';
import type { Fighter } from '../types';
import { pick } from '../random';
import { mulberry32 } from '../rng';
import { deserFighter, hashStr } from '../save/fighter';
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
  /** the job taken (L1): this bounty's slice is fixed on the next new fighter's wheel; what it cost */
  job?: { k: string; gems: number } | null;
}
export const BOUNTY_SLOTS = 3;
/** What swapping a bounty for another costs. */
export const BOUNTY_SWAP_GEMS = 1;
/** What taking a job costs (L1): the bounty's slice on your next fighter's wheel. */
export const BOUNTY_JOB_GEMS = 2;
const state = (g: Game) => (g.save.profile.extra.bounty ??= { up: [], done: [], prog: {} }) as unknown as BountyState;
const byKey = (k: string) => BOUNTIES.find((b) => b.k === k);

/** Your fighters as they are now: the one being played, then the others in the roster. */
function roster(g: Game): Fighter[] {
  const out: Fighter[] = g.F ? [g.F] : [];
  g.save.roster.slots.forEach((sl, i) => {
    if (!sl || i === g.save.roster.active) return;
    const f = deserFighter(sl.career);
    if (f) out.push(f);
  });
  return out;
}
/** Who on your roster fits a bounty right now (H5), by name. */
export const bountyFits = (g: Game, b: Bounty, fs: Fighter[] = roster(g)) => fs.filter((f) => b.is(f)).map((f) => f.name);

/**
 * Fills the board up to three from the bounties not up and not done. The pick is its own little die, seeded by
 * the board, so it never moves the game's dice (a fight's or a spin's). While nothing up fits anyone on your
 * roster, a bounty one of them fits goes up first, if there is one (H5): one is always doable.
 */
function deal(g: Game) {
  const s = state(g);
  const rng = mulberry32(hashStr(`${s.up.join()}|${s.done.join()}|${s.last || ''}`));
  s.up = s.up.filter((k) => byKey(k) && !s.done.includes(k));
  if (s.up.length >= BOUNTY_SLOTS) return;
  const fs = roster(g);
  while (s.up.length < BOUNTY_SLOTS) {
    const free = BOUNTIES.filter((b) => !s.up.includes(b.k) && !s.done.includes(b.k) && b.k !== s.last);
    if (!free.length) break;
    const doable = s.up.some((k) => bountyFits(g, byKey(k)!, fs).length) ? [] : free.filter((b) => bountyFits(g, b, fs).length);
    s.up.push(pick(rng, doable.length ? doable : free).k);
    s.last = null;
  }
}

/** The bounties up right now, with how far along each is and who fits it; the ones someone fits come first. */
export function bountyBoard(g: Game): { b: Bounty; cur: number; need: number; fits: string[] }[] {
  deal(g);
  const s = state(g);
  const fs = roster(g);
  const rows = s.up.map((k) => {
    const b = byKey(k)!;
    return { b, cur: s.prog[k] || 0, need: b.need || 1, fits: bountyFits(g, b, fs) };
  });
  return [...rows.filter((r) => r.fits.length), ...rows.filter((r) => !r.fits.length)];
}
export const bountiesDone = (g: Game) => state(g).done.length;

/** A career stat stepped (a boss beaten, a cup won...): bounties on it that the active fighter fits move on. */
export function bountyStep(g: Game, on: string) {
  const F = g.F;
  if (!F || !BALANCE.bounties) return;
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
    // won before its job was used: the job's gems come back
    if (s.job?.k === k) dropJob(g);
    g.notes.push(`${b.e} Bounty: ${b.n}. ${grant(g, { gems: b.gems })}`);
  }
  deal(g);
}

/** Swaps a bounty for a new one, for a gem. False if it can't be paid or isn't up. */
export function swapBounty(g: Game, k: string): boolean {
  const s = state(g);
  const p = g.save.profile;
  if (!s.up.includes(k) || s.job?.k === k || (p.gems || 0) < BOUNTY_SWAP_GEMS) return false;
  p.gems -= BOUNTY_SWAP_GEMS;
  s.up = s.up.filter((x) => x !== k);
  s.last = k;
  deal(g);
  return true;
}

// ---------------------------------------------------------------- take the job (L1)
/** The job taken, if any: its bounty. */
export const bountyJob = (g: Game): Bounty | null => {
  const j = state(g).job;
  return (j && byKey(j.k)) || null;
};
/** Takes a bounty's job: its slice is fixed on your next new fighter's wheel. One job at a time. */
export function takeJob(g: Game, k: string): boolean {
  const s = state(g);
  const b = byKey(k);
  const p = g.save.profile;
  if (!b?.pin || !s.up.includes(k) || s.job || (p.gems || 0) < BOUNTY_JOB_GEMS) return false;
  p.gems -= BOUNTY_JOB_GEMS;
  s.job = { k, gems: BOUNTY_JOB_GEMS };
  return true;
}
/** Drops a job not used yet: its gems come back. */
export function dropJob(g: Game) {
  const s = state(g);
  if (!s.job) return;
  g.save.profile.gems = (g.save.profile.gems || 0) + s.job.gems;
  s.job = null;
}
/** Where on this wheel the job's slice sits, for a fighter being built; -1 if this isn't its wheel or it isn't on it. */
export function jobSlice(g: Game, wheel: string, items: readonly { n: string; k?: string }[]): number {
  const pin = bountyJob(g)?.pin;
  if (!pin || pin.w !== wheel) return -1;
  return items.findIndex((it) => (pin.n != null && it.n === pin.n) || (pin.k != null && it.k === pin.k));
}
/** The job's slice landed on a new fighter: the job is done (the bounty still has to be won). */
export function jobUsed(g: Game) {
  state(g).job = null;
}
