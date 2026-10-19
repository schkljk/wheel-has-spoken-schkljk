import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  GEAR,
  GEARK,
  TREE,
  TNODE,
  clockAt,
  dailyState,
  dailyWinCoins,
  endDailyFight,
  enterCareer,
  gearGain,
  gearVerdict,
  bestUpgrades,
  goalEta,
  goalsBySoonest,
  mulberry32,
  newSave,
  oddsWord,
  randomFighter,
  rankTalent,
  reword,
  shareWord,
  talRank,
  unrankTalent,
  wear,
  wheelsMaybe,
  wheelsTotal,
  type CareerFighter,
  type FightOutcome,
  type Game,
} from '../src';

// Fixes from the October 2026 review (docs/SUGGESTIONS.md).
function game(seed = 3): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(new Date(2026, 9, 10)), pool: null, notes: [] };
  enterCareer(g, randomFighter('Tester', rng) as CareerFighter);
  return g;
}
const win = { w: 0, round: 4 } as unknown as FightOutcome;
const loss = { w: 1, round: 4 } as unknown as FightOutcome;
const dayAfter = (g: Game, days: number) => (g.clock = clockAt(new Date(2026, 9, 10 + days)));

describe('A1: the daily streak never punishes a skipped day', () => {
  it('counts wins in a row, whenever they are played', () => {
    const g = game();
    endDailyFight(g, g.F!, win);
    expect(dailyState(g).streak).toBe(1);
    // a week off, then another win: the streak goes on, and so does the pay
    dayAfter(g, 7);
    expect(dailyState(g).streak).toBe(1);
    expect(dailyWinCoins(g)).toBe(9 + 2 * 2);
    endDailyFight(g, g.F!, win);
    expect(dailyState(g).streak).toBe(2);
  });
  it('only a loss resets it', () => {
    const g = game();
    endDailyFight(g, g.F!, win);
    dayAfter(g, 1);
    endDailyFight(g, g.F!, loss);
    dayAfter(g, 2);
    expect(dailyState(g).streak).toBe(0);
  });
  it('the achievement says wins in a row, not days', () => {
    expect(ACHIEVEMENTS.find((a) => a.k === 'daily5')!.d).toBe('Win five daily challenges in a row');
  });
});

describe('A2: HP thresholds read as percentages', () => {
  it('rewrites engine HP as % of max HP', () => {
    expect(reword('Hits 35% harder below 45 HP')).toBe('Hits 35% harder below 45% HP');
    expect(reword('Eat below 30 HP: heal 25')).toBe('Eat below 30% HP: heal 25% HP');
    expect(reword('Heals 3 HP every round')).toBe('Heals 3% HP every round');
    expect(reword('bites heal 10%')).toBe('bites heal 10%');
    expect(reword('They have 150 HP')).toBe('They have 50% more HP');
  });
  it('is idempotent', () => {
    for (const s of ['below 45 HP', 'heal 25', 'They have 150 HP']) expect(reword(reword(s))).toBe(reword(s));
  });
  it('lands in the tables', () => {
    const tal = TREE.flatMap((b) => b.t).find((t) => t[0] === 'snack' || /Eat below/.test(t[5]));
    expect(tal?.[5]).toMatch(/30% HP: heal 25% HP/);
  });
});

describe('A5: gear says whether it is an upgrade', () => {
  it('a mythic over a common is an upgrade, and the reverse a downgrade', () => {
    const g = game();
    const F = g.F!;
    const slot = 'armor';
    const common = GEAR.find((x) => x.slot === slot && x.r === 'common')!;
    const mythic = GEAR.find((x) => x.slot === slot && (x.r === 'mythic' || x.r === 'legendary'))!;
    F.armory = [common.k, mythic.k];
    wear(g, common.k);
    expect(gearVerdict(g, mythic.k)).toBe('up');
    expect(gearGain(g, mythic.k)).toBeGreaterThan(0);
    wear(g, mythic.k);
    expect(gearVerdict(g, common.k)).toBe('down');
    // what is worn is neither
    expect(gearGain(g, mythic.k)).toBe(0);
  });
  it('Wear best picks the upgrade for each slot', () => {
    const g = game();
    const F = g.F!;
    const common = GEAR.find((x) => x.slot === 'boots' && x.r === 'common')!;
    const best = GEAR.find((x) => x.slot === 'boots' && (x.r === 'mythic' || x.r === 'legendary'))!;
    F.armory = [common.k, best.k];
    wear(g, common.k);
    expect(bestUpgrades(g)).toContainEqual(['boots', best.k]);
    wear(g, best.k);
    expect(bestUpgrades(g).find((p) => p[0] === 'boots')).toBeUndefined();
    expect(GEARK[best.k]).toBeDefined();
  });
});

describe('A6: a talent point can be taken back', () => {
  it('undoing the last rank refunds the point', () => {
    const g = game();
    const F = g.F!;
    F.lvl = 10;
    F.tp = 2;
    const key = Object.keys(TNODE).find((k) => TNODE[k]!.tier === 1)!;
    expect(rankTalent(g, key)).toBe(true);
    expect(F.tp).toBe(1);
    expect(unrankTalent(g, key)).toBe(true);
    expect(F.tp).toBe(2);
    expect(talRank(F, key)).toBe(0);
    expect(unrankTalent(g, key)).toBe(false);
  });
});

describe('A8: chances are words', () => {
  it('odds', () => {
    expect(oddsWord(0.97).t).toBe('Sure thing');
    expect(oddsWord(0.8).t).toBe('Heavy favorite');
    expect(oddsWord(0.5).t).toBe('Coin flip');
    expect(oddsWord(0.3).t).toBe('Underdog');
    expect(oddsWord(0.02).t).toBe('Long shot');
    for (let p = 0; p <= 1; p += 0.01) expect(oddsWord(p).t).not.toMatch(/\d/);
  });
  it('shares', () => {
    expect(shareWord(0.95)).toBe('almost all');
    expect(shareWord(0.5)).toBe('about half of the');
  });
});

describe('A10: the build counter never creeps', () => {
  it('says a sub-wheel may still come instead of changing the total', () => {
    const blank = { name: 'X', bonus: {}, boons: [] };
    expect(wheelsMaybe(blank)).toBeGreaterThan(0);
    const total = wheelsTotal(blank);
    expect(total).toBeGreaterThan(15);
  });
});

describe('B6: goals sort by how soon they are done', () => {
  it('a few wins come before a far-off level', () => {
    const g = game();
    const order = goalsBySoonest(g).map((x) => x.k);
    expect(order.indexOf('w10')).toBeLessThan(order.indexOf('lv50'));
    expect(goalEta(g, 'w10')).toBeLessThan(goalEta(g, 'lv25'));
  });
});
