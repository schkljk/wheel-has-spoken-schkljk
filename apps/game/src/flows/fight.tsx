import {
  arenaByKey,
  arenaOdds,
  endDailyFight,
  endDuelFight,
  endGhostFight,
  endTrialFight,
  endRunFight,
  type Duel,
  endRushFight,
  endStoryFight,
  endTierFight,
  endTowerFight,
  openFight,
  newlyOpen,
  noteUnlocks,
  unlocked,
  type Arena,
  type CareerFighter,
  type FightOutcome,
  type FightResult,
  type FightSpec,
  type OddsNote,
  type RushState,
  type WheelEntry,
  type TowerState,
} from '@whs/core';
import { G, act, go } from '../state/game';
import { oddsFor } from '../state/odds';

/** The arena wheel the fight screen spins while the fighters walk in (no separate screen, no extra tap). */
export interface ArenaWheel {
  list: WheelEntry<Arena>[];
  reasons: OddsNote[];
  /** its die, kept with the fight (G2) */
  seed?: number;
}

/** Opens the fight (its arena spins during the walk-in unless it is fixed) and resolves with its result. */
export async function fight(spec0: Omit<FightSpec, 'arena' | 'odds'>, opts: { arena?: Arena | null; rush?: RushState; tower?: TowerState; duel?: Duel; trial?: number } = {}): Promise<FightResult> {
  const F = G.F!;
  const O: CareerFighter = spec0.opp;
  // the fight's dice are kept in the save as it opens, and every round as it is played: closing the app and
  // opening this fight again plays the same fight to where it was, not a fresh one (G2)
  const rec = act((g) => openFight(g, spec0.kind, O.name));
  const landed = arenaByKey(rec.arenaK ?? undefined);
  const fixed = opts.arena !== undefined || !!landed;
  const spec = {
    ...spec0,
    seed: spec0.seed ?? rec.seed,
    wheelSeed: spec0.wheelSeed ?? rec.wheel,
    ...(rec.mods ? { mods: rec.mods } : {}),
    ...(rec.wager ? { wager: true } : {}),
    arena: opts.arena !== undefined ? opts.arena : landed,
    odds: NaN,
  } as FightSpec;
  // a fixed arena's odds are worked out now (off the main thread); a spun one's once it lands
  if (fixed) void oddsFor(spec);
  // the arena wheel leans toward whoever actually fights: a stand-in (a Spin & Run runner), or the fighter (G16)
  const arenaWheel: ArenaWheel | null = fixed ? null : { ...arenaOdds(G, spec0.me ?? F, O), seed: rec.arena };
  // a fight that opens a mode says so on its result (H1)
  const end = (o: FightOutcome): FightResult => {
    const before = unlocked(G);
    const r = endOf(o);
    noteUnlocks(r, newlyOpen(before, unlocked(G)));
    return r;
  };
  const endOf = (o: FightOutcome): FightResult => {
    if (spec.kind === 'story') return endStoryFight(G, spec, o);
    if (spec.kind === 'daily') return endDailyFight(G, O, o);
    if (spec.kind === 'duel') return endDuelFight(G, opts.duel!, o);
    if (spec.kind === 'ghost') return endGhostFight(G, O, o);
    if (spec.kind === 'trial') return endTrialFight(G, opts.trial!, O, o);
    if (spec.kind === 'run') return endRunFight(G, O, o);
    if (spec.kind === 'rush') return endRushFight(G, opts.rush!, O, o);
    if (spec.kind === 'tower') return endTowerFight(G, opts.tower!, O, o);
    return endTierFight(G, spec, o);
  };
  return new Promise((resolve) => go({ screen: 'fight', spec, end, done: resolve, arenaWheel, key: Math.random() }));
}
