import { deserFighter, serFighter, type CareerFighter, type Json, type SerFighter } from '../save/fighter';
import type { Game } from './game';
import type { Step } from './fight';
import { eventOf, storyEvent, storyOf, storyOpponent, type StoryEventView } from './story';

/**
 * What the player is in the middle of (review items A4 and B5), kept in the save, so closing the app loses
 * nothing and re-rolls nothing:
 * - a fighter being built (every wheel spun so far), or built and waiting on "Start their career";
 * - the steps after a fight (reward, loot, a gear choice, level-ups) still to come;
 * - the story step being played, with the opponent or encounter it rolled;
 * - a fight under way: its dice and every round played so far (G2);
 * - and where they were (the map, a bracket, the fighter page), for Continue.
 */
export interface ResumeState {
  /** the roster slot the steps and place belong to */
  slot?: number | null;
  steps?: Step[] | null;
  place?: Place | null;
  /** a fighter being built: the partial fighter, the wheel it is on, and whether every wheel is spun */
  build?: { f: Json; idx: number; done: boolean } | null;
  /** the level-up spins landed so far for the level being picked (review F4): one is kept */
  lv?: string[] | null;
  /** a level-up that landed on Awakening or a New weapon: its upgrade spin still to come (G5) */
  up?: 'power' | 'weapon' | null;
  /** a boss rush or a tower climb under way, between fights (G6) */
  rush?: { i: number; hp: number } | null;
  tower?: { floor: number; hp: number; seed: number; lives?: number } | null;
  /** a fight under way (G2) */
  fight?: FightRec | null;
}
export type Place = 'map' | 'hub' | 'bracket';

const state = (g: Game) => (g.save.profile.extra.resume ??= {}) as ResumeState;
const mine = (g: Game) => {
  const r = state(g);
  return r.slot != null && r.slot === g.save.roster.active ? r : null;
};
/** The state for the active fighter: another fighter's steps, place and half-picked level-up go (G16). */
const own = (g: Game) => {
  const r = state(g);
  if (r.slot !== g.save.roster.active) Object.assign(r, { steps: null, place: null, lv: null, up: null, rush: null, tower: null, fight: null });
  r.slot = g.save.roster.active;
  return r;
};

// ---------------------------------------------------------------- after a fight
/** The steps after a fight still to come for the active fighter (the first is the one being played). */
export const pendingSteps = (g: Game): Step[] => (mine(g)?.steps ?? []).slice();
/** Remembers the steps still to come (none: clears them). */
export function setPendingSteps(g: Game, steps: readonly Step[] | null) {
  own(g).steps = steps && steps.length ? [...steps] : null;
}
/** A step that must happen before the rest (a gear choice from a loot spin). */
export function pushStep(g: Game, s: Step) {
  setPendingSteps(g, [s, ...pendingSteps(g)]);
}
/** The first step is done. */
export function stepDone(g: Game) {
  setPendingSteps(g, pendingSteps(g).slice(1));
}

// ---------------------------------------------------------------- where they were
export function setPlace(g: Game, place: Place | null) {
  own(g).place = place;
}
export const lastPlace = (g: Game): Place | null => mine(g)?.place ?? null;

// ---------------------------------------------------------------- a level-up being picked
/** The level-up slices landed so far for the level being picked (two to choose from with a second opinion). */
export const levelSpins = (g: Game): string[] => (mine(g)?.lv ?? []).slice();
export function addLevelSpin(g: Game, k: string) {
  const prev = levelSpins(g);
  own(g).lv = [...prev, k];
}
export function clearLevelSpins(g: Game) {
  state(g).lv = null;
}
/** A boss rush or tower climb under way: kept between fights, so closing the app doesn't end it (G6). */
export const keptRush = (g: Game) => {
  const r = mine(g)?.rush;
  return r ? { ...r } : null;
};
export const keptTower = (g: Game) => {
  const r = mine(g)?.tower;
  return r ? { ...r } : null;
};
export function keepRun(g: Game, kind: 'rush' | 'tower', run: object | null) {
  (own(g) as Record<string, unknown>)[kind] = run ? { ...run } : null;
}
/** An upgrade spin (Awakening, New weapon) won by a level-up and not spun yet: closing the app keeps it (G5). */
export const pendingUpgrade = (g: Game): 'power' | 'weapon' | null => mine(g)?.up ?? null;
export function setUpgrade(g: Game, kind: 'power' | 'weapon' | null) {
  own(g).up = kind;
}

// ---------------------------------------------------------------- a fight under way (G2)
/** One round as it was played: the move and its slice's tweaks, the signature slice it rolled, a boss's phase-two slice. */
export interface RecMove {
  c: string;
  m?: Json;
  /** the signature wheel's slice */
  u?: number;
  /** the boss phase-two slice it was (each lands once a fight) */
  ph?: string;
  /** auto-battle picked it */
  auto?: boolean;
}
/**
 * A fight under way: its dice and every round as it is played, so closing the app and opening the fight again
 * plays the same fight to where it was, instead of a fresh one (no free retries). Cleared in the same change
 * that pays its result.
 */
export interface FightRec {
  kind: string;
  /** who it is against: only the same fight against the same opponent picks it up */
  opp: string;
  /** the battle's dice, the combat wheel's and the arena wheel's */
  seed: number;
  wheel: number;
  arena: number;
  /** the arena it landed on */
  arenaK?: string | null;
  /** the fight's starting tweaks as it began (its next-fight buffs are used up by then) */
  mods?: Json | null;
  moves: RecMove[];
  /** draws from the combat wheel's dice so far */
  dn: number;
  /** a spin that landed and isn't played yet: it is the next round */
  pend?: RecMove | null;
  nudged?: boolean;
  /** the sure win was wagered (L2) */
  wager?: boolean;
}
/** The fight under way for the active fighter, if any. */
export const fightRec = (g: Game): FightRec | null => mine(g)?.fight ?? null;
/** The fight of this kind against this opponent, if it is the one under way. */
export const fightUnder = (g: Game, kind: string, opp: string): FightRec | null => {
  const r = fightRec(g);
  return r && r.kind === kind && r.opp === opp ? r : null;
};
/** A fight opens: the same fight under way picks up where it was; any other gets fresh dice, kept at once. */
export function openFight(g: Game, kind: string, opp: string): FightRec {
  const old = fightUnder(g, kind, opp);
  if (old) return old;
  const die = () => Math.floor(g.rng() * 2 ** 31);
  const rec: FightRec = { kind, opp, seed: die(), wheel: die(), arena: die(), moves: [], dn: 0 };
  own(g).fight = rec;
  return rec;
}
/** Keeps the fight's arena or starting tweaks once they are known. */
export function noteFight(g: Game, patch: Partial<Pick<FightRec, 'arenaK' | 'mods' | 'wager'>>) {
  const r = fightRec(g);
  if (r) Object.assign(r, JSON.parse(JSON.stringify(patch)));
}
/** A spin landed (it is the next round), or a round was played; `dn` is the combat wheel's draws so far. */
export function recordSpin(g: Game, mv: RecMove, dn: number, nudged: boolean) {
  const r = fightRec(g);
  if (r) Object.assign(r, { pend: JSON.parse(JSON.stringify(mv)) as RecMove, dn, nudged });
}
export function recordRound(g: Game, mv: RecMove, dn: number) {
  const r = fightRec(g);
  if (!r) return;
  r.moves.push(JSON.parse(JSON.stringify(mv)) as RecMove);
  r.dn = dn;
  r.pend = null;
}
/** The fight is over (or was never real). */
export function endFightRec(g: Game) {
  const r = mine(g);
  if (r) r.fight = null;
}

// ---------------------------------------------------------------- a fighter being built
export const savedBuild = (g: Game) => state(g).build ?? null;
export function saveBuild(g: Game, f: object, idx: number, done: boolean) {
  state(g).build = { f: JSON.parse(JSON.stringify(f)) as Json, idx, done };
}
export function clearBuild(g: Game) {
  state(g).build = null;
}

// ---------------------------------------------------------------- the story step being played
interface NodeState {
  row: number;
  i: number;
  /** the opponent it rolled, and what a save doesn't keep of them */
  foe?: SerFighter;
  fx?: { aiSkill?: number; poolPct?: number };
  /** the encounter it drew */
  ev?: string;
  /** what comes after the step's choice was made: a fight from an encounter, a spin (loot, mystery, training) */
  then?: string;
}
const nodeOf = (g: Game) => {
  const S = storyOf(g);
  const n = S.pend as unknown as NodeState | undefined;
  return n && n.row === S.row ? n : null;
};
/** The step (its index on the current row) that was entered and not finished, if any. */
export const pendingNode = (g: Game): number | null => nodeOf(g)?.i ?? null;
/** A step is being entered. */
export function markNode(g: Game, i: number) {
  const S = storyOf(g);
  const n = nodeOf(g);
  // entering the same step again keeps what it rolled
  if (!n || n.i !== i) S.pend = { row: S.row, i } as unknown as Json;
}
/** The step is over (its fight ended, its encounter was answered, the map moved on). */
export function clearNode(g: Game) {
  delete storyOf(g).pend;
}
/** The step is done: the map moves on (in the same change as whatever it paid, so nothing pays twice). */
export function nodeDone(g: Game) {
  storyOf(g).row++;
  clearNode(g);
}
/** The step's choice is made and this comes next ("fight:elite", "loot:treasure", "mystery", "train"). */
export function setNodeThen(g: Game, then: string) {
  const n = nodeOf(g);
  if (n) n.then = then;
}
export const nodeThen = (g: Game): string | null => nodeOf(g)?.then ?? null;
/** The step's opponent: the one it rolled before, or a new one (kept, so a reload meets the same one). */
export function nodeFoe(g: Game, kind: 'fight' | 'elite'): CareerFighter {
  const n = nodeOf(g);
  if (n?.foe) {
    const o = deserFighter(n.foe);
    if (o) return Object.assign(o, n.fx ?? {});
  }
  const o = storyOpponent(g, kind);
  if (n) {
    n.foe = serFighter(o);
    n.fx = { aiSkill: o.aiSkill, poolPct: (o as { poolPct?: number }).poolPct };
  }
  return o;
}
/** The step's encounter: the one it drew before, or a new one (kept). */
export function nodeEvent(g: Game): StoryEventView {
  const n = nodeOf(g);
  const old = n?.ev ? eventOf(n.ev, g) : undefined;
  if (old) return old;
  const ev = storyEvent(g);
  if (n) n.ev = ev.k;
  return ev;
}
