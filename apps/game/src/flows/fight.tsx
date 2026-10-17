import {
  arenaLand,
  arenaOdds,
  endDailyFight,
  endRushFight,
  endStoryFight,
  endTierFight,
  fightOdds,
  type Arena,
  type CareerFighter,
  type FightOutcome,
  type FightResult,
  type FightSpec,
  type RushState,
} from '@whs/core';
import { G, act, go } from '../state/game';
import { spinWheel } from '../screens/Spin';

/** Spins the arena wheel (unless the arena is fixed), opens the fight and resolves with its result. */
export async function fight(spec0: Omit<FightSpec, 'arena' | 'odds'>, opts: { arena?: Arena | null; rush?: RushState } = {}): Promise<FightResult> {
  const F = G.F!;
  const O: CareerFighter = spec0.opp;
  let arena: Arena | null;
  if (opts.arena !== undefined) arena = opts.arena;
  else {
    const od = arenaOdds(G, F, O);
    arena = await spinWheel<Arena>({
      cat: 'arena',
      title: 'Arena',
      who: `${F.name} vs ${O.name}: where does this go down?`,
      list: od.list,
      reasons: od.reasons,
      spinLabel: 'Spin the arena',
      nextLabel: 'To the fight',
      autoNext: 1200,
      onLand: (it) => {
        arenaLand(G, it);
        return <div class="ds">Heading into the arena…</div>;
      },
    });
  }
  const spec = { ...spec0, arena, odds: 0 } as FightSpec;
  spec.odds = fightOdds(G, spec);
  const end = (o: FightOutcome): FightResult => {
    if (spec.kind === 'story') return endStoryFight(G, spec, o);
    if (spec.kind === 'daily') return endDailyFight(G, O, o);
    if (spec.kind === 'rush') return endRushFight(G, opts.rush!, O, o);
    return endTierFight(G, spec, o);
  };
  act(() => 0);
  return new Promise((resolve) => go({ screen: 'fight', spec, end, done: resolve, key: Math.random() }));
}
