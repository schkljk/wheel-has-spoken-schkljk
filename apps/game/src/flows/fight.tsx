import {
  arenaOdds,
  endDailyFight,
  endRushFight,
  endStoryFight,
  endTierFight,
  endTowerFight,
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
}

/** Opens the fight (its arena spins during the walk-in unless it is fixed) and resolves with its result. */
export async function fight(spec0: Omit<FightSpec, 'arena' | 'odds'>, opts: { arena?: Arena | null; rush?: RushState; tower?: TowerState } = {}): Promise<FightResult> {
  const F = G.F!;
  const O: CareerFighter = spec0.opp;
  const fixed = opts.arena !== undefined;
  const spec = { ...spec0, arena: fixed ? opts.arena! : null, odds: NaN } as FightSpec;
  // a fixed arena's odds are worked out now (off the main thread); a spun one's once it lands
  if (fixed) void oddsFor(spec);
  const arenaWheel: ArenaWheel | null = fixed ? null : arenaOdds(G, F, O);
  const end = (o: FightOutcome): FightResult => {
    if (spec.kind === 'story') return endStoryFight(G, spec, o);
    if (spec.kind === 'daily') return endDailyFight(G, O, o);
    if (spec.kind === 'rush') return endRushFight(G, opts.rush!, O, o);
    if (spec.kind === 'tower') return endTowerFight(G, opts.tower!, O, o);
    return endTierFight(G, spec, o);
  };
  act(() => 0);
  return new Promise((resolve) => go({ screen: 'fight', spec, end, done: resolve, arenaWheel, key: Math.random() }));
}
