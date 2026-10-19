import { afterEach, describe, expect, it } from 'vitest';
import {
  ARCHS,
  BALANCE,
  CHAOS,
  CHAPTERS,
  LEGACY_BALANCE,
  canClaim,
  claimWin,
  clockAt,
  cwSlices,
  enterCareer,
  genMap,
  healFade,
  labFighter,
  mulberry32,
  newBattle,
  newChapter,
  newSave,
  powCost,
  randomFighter,
  startBattle,
  tunedBossGems,
  useBalance,
  type Battle,
  type CareerFighter,
  type FightSpec,
  type Fighter,
  type Game,
} from '../src';

// The review's game-design pass (docs/SUGGESTIONS.md, E1-E5): each rule is a switch the old game's tuning leaves off.
const tuned = { ...BALANCE };
afterEach(() => useBalance(tuned));

const fighter = (seed: number, lvl = 10) => labFighter(mulberry32(seed), lvl);
const battle = (a: Fighter, b: Fighter, seed = 1): Battle => {
  const bt = newBattle(a, b, mulberry32(seed), { quiet: true });
  bt.start();
  return bt;
};

describe('E1: you pick what, the wheel picks how hard', () => {
  it('fills each focus wheel with its own family only', () => {
    for (let s = 1; s <= 40; s++) {
      const me = battle(fighter(s), fighter(s + 100)).P[0];
      me.en = 60;
      expect(cwSlices(me, 'atk').every((x) => x.it.c === 'strike')).toBe(true);
      expect(cwSlices(me, 'def').every((x) => x.it.c === 'guard')).toBe(true);
      const pow = cwSlices(me, 'pow').map((x) => x.it.c);
      // with a power to cast, only powers; without one, the tricks that beat a guard
      expect(pow.every((c) => c === 'power') || pow.every((c) => c === 'feint' || c === 'focus')).toBe(true);
    }
  });
  it('keeps the old mixed wheels with the old tuning', () => {
    useBalance(LEGACY_BALANCE);
    const me = battle(fighter(3), fighter(4)).P[0];
    expect(cwSlices(me, 'atk').map((x) => x.it.c)).toContain('feint');
    expect(cwSlices(me, 'def').map((x) => x.it.c)).toContain('dodge');
  });
});

describe('E2: reads stay readable', () => {
  it('never drop below Just a hunch against a skilled opponent, and leave its skill out', () => {
    const a = fighter(5);
    const b = fighter(6);
    b.arch = ARCHS.find((x) => x.k === 'monk')!;
    const read = (skill: number) => {
      b.aiSkill = skill;
      return battle(a, b).plan().acc;
    };
    expect(read(1.5)).toBe(read(0));
    expect(read(1.5)).toBeGreaterThanOrEqual(0.5);
  });
  it('can still be a wild guess against a trickster', () => {
    const a = fighter(5);
    a.bonus = { ...a.bonus, iq: -10 };
    const b = fighter(6);
    b.arch = ARCHS.find((x) => x.k === 'trickster')!;
    b.bonus = { ...b.bonus, iq: 10 };
    expect(battle(a, b).plan().acc).toBeLessThan(0.5);
  });
});

describe('E3: every stat has a job', () => {
  it('makes powers cheaper with power mastery, down to 15 energy', () => {
    const me = battle(fighter(7), fighter(8)).P[0];
    me.s.pm = 6;
    expect(powCost(me)).toBe(25);
    me.s.pm = 10;
    expect(powCost(me)).toBe(20);
    me.s.pm = 20;
    expect(powCost(me)).toBe(15);
    useBalance(LEGACY_BALANCE);
    expect(powCost(me)).toBe(25);
  });
  it('lets speed soften strikes and IQ soften powers', () => {
    const a = fighter(9);
    const b = fighter(10);
    const hit = (k: 'strike' | 'power', stat: 'spd' | 'iq', v: number) => {
      const bt = battle(a, b);
      bt.P[1].s[stat] = v;
      bt.P[0].en = 100;
      return bt.preview(0, k)?.hi ?? 0;
    };
    expect(hit('strike', 'spd', 12)).toBeLessThan(hit('strike', 'spd', 2));
    if (a.power.k !== 'none' && !a.power.passive) expect(hit('power', 'iq', 12)).toBeLessThan(hit('power', 'iq', 2));
  });
});

describe('E4: heals fade, the dead rise once', () => {
  it('fades heals after round 6, to a fifth', () => {
    expect(healFade(6)).toBe(1);
    expect(healFade(8)).toBeCloseTo(0.68);
    expect(healFade(30)).toBe(0.2);
    useBalance(LEGACY_BALANCE);
    expect(healFade(30)).toBe(1);
  });
  it('gives one revive per fight, whatever its source', () => {
    // a necromancer with plot armor and smelling salts could get up three times in the old game
    const count = () => {
      let most = 0;
      for (let s = 1; s <= 60; s++) {
        const a = fighter(s, 5);
        a.arch = ARCHS.find((x) => x.k === 'necro')!;
        a.chaos = CHAOS.find((x) => x.k === 'plot')!;
        const b = fighter(s + 500, 14);
        const bt = newBattle(a, b, mulberry32(s), { mods: [{ revive: 30 }, {}] });
        const evs = bt.start();
        while (!bt.over) evs.push(...bt.step());
        most = Math.max(most, evs.filter((e) => e.a?.t === 'revive' && e.a.on === 0 && e.a.fx !== '💥').length);
      }
      return most;
    };
    expect(count()).toBe(1);
    useBalance(LEGACY_BALANCE);
    expect(count()).toBeGreaterThan(1);
  });
});

describe('E5: story pacing', () => {
  function game(seed = 2): Game {
    const rng = mulberry32(seed);
    const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
    enterCareer(g, randomFighter('Pacer', rng) as CareerFighter);
    g.F!.story = newChapter(g, 3, 0) as never;
    return g;
  }
  it('offers an elite on every fight row after the first', () => {
    const g = game();
    const rows = genMap(g, CHAPTERS[4]!);
    const fights = rows.filter((r) => r.includes('fight'));
    expect(fights[0]).toEqual(['fight']);
    for (const r of fights.slice(1)) expect(r).toEqual(['fight', 'elite']);
  });
  it('lets a sure story win be claimed before the first round, with full rewards', () => {
    const g = game();
    const opp = fighter(77, 1) as CareerFighter;
    g.F!.lvl = 12;
    const spec = { kind: 'story', node: 'fight', tier: { k: 'story', n: 'Story fight', e: '📖', xpW: 0, coins: 0 }, opp, arena: null, odds: 0.95 } as FightSpec;
    const bt = startBattle(g, spec);
    expect(canClaim(spec, bt)).toBe(true);
    const won = claimWin(g, spec, bt)!;
    expect(won.bt.w).toBe(0);
    expect(won.events.length).toBeGreaterThan(0);
    // not for a boss, not once it's under way, not below the bar
    expect(canClaim({ ...spec, node: 'boss' }, bt)).toBe(false);
    expect(canClaim({ ...spec, odds: 0.7 }, bt)).toBe(false);
    bt.step();
    expect(canClaim(spec, bt)).toBe(false);
  });
  it('pays gems for a boss that sized you up', () => {
    const b = fighter(1) as Fighter;
    expect(tunedBossGems(b)).toBe(0);
    b.tuned = 1;
    expect(tunedBossGems(b)).toBe(2);
    useBalance(LEGACY_BALANCE);
    expect(tunedBossGems(b)).toBe(0);
  });
});
