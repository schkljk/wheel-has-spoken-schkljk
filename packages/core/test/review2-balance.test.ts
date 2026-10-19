import { afterAll, describe, expect, it } from 'vitest';
import {
  BALANCE,
  CHAPTERS,
  GEARK,
  LEGACY_BALANCE,
  R2_TUNE,
  SYN,
  STORY_INJ_MAX,
  TITLES,
  TNODE,
  addCoins,
  buyPremium,
  carryPreview,
  clockAt,
  cwSlices,
  endStoryFight,
  enterCareer,
  levelForWorth,
  mulberry32,
  newBattle,
  newChapter,
  newSave,
  premiumLock,
  randomFighter,
  reviveSources,
  salvageStored,
  sellGear,
  storyInjuries,
  storyOf,
  talMap,
  traitsOf,
  ultWeights,
  upgradeLevel,
  upgradeWorth,
  useBalance,
  wear,
  type CareerFighter,
  type FightOutcome,
  type FightSpec,
  type Fighter,
  type Game,
  type Side,
} from '../src';

// Review round 2's balance pass (K1, K6, K7, K8, K9, K10). K2-K5, G11 and G13 are in the club, run, duel and
// trials tests.
const tuned = { ...BALANCE };
afterAll(() => useBalance(tuned));

function game(seed = 1): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Hero', rng) as CareerFighter);
  g.save.roster.slots[0]!.coins = 5000;
  return g;
}

describe('the retune layer', () => {
  it('lays the new rows over the tables and takes them off with the old tuning', () => {
    expect(GEARK.starcoat!.fx).toEqual({ regen: 4 });
    expect(TNODE.def_wind!.eff.fx?.revive).toBeUndefined();
    useBalance(LEGACY_BALANCE);
    expect(GEARK.starcoat!.fx).toEqual({ regen: 4, revive: 30 });
    expect(TNODE.def_wind!.eff.fx?.revive).toBe(20);
    expect(TITLES.find((t) => t.k === 'goat')!.m).toEqual({ str: 2, spd: 2, dur: 2, iq: 2, wm: 2, pm: 2 });
    expect(SYN.find((s) => s.k === 'set_clown2')!.fx).toEqual({ taunt: 1 });
    useBalance(tuned);
    expect(GEARK.starcoat!.fx).toEqual({ regen: 4 });
    expect(SYN.find((s) => s.k === 'set_clown2')!.fx).toBeUndefined();
    expect(SYN.find((s) => s.k === 'set_clown2')!.m).toEqual({ dur: 2 });
  });
});

describe('K1: premium gear', () => {
  const clearAct1 = (g: Game) => {
    g.F!.story = { ...newChapter(g, 11, 0), cleared: Array.from({ length: 10 }, (_, i) => i + 1) } as never;
  };
  it('opens after Act I, one piece per fighter, and selling frees the spot', () => {
    const g = game();
    g.save.profile.gems = 200;
    g.F!.story = null as never;
    expect(premiumLock(g, 'cometboots')).toMatch(/Act I/);
    expect(buyPremium(g, 'cometboots', 'gem')).toBe(false);
    clearAct1(g);
    expect(premiumLock(g, 'cometboots')).toBeNull();
    expect(buyPremium(g, 'cometboots', 'gem')).toBe(true);
    expect(premiumLock(g, 'diamondhelm')).toMatch(/One premium piece per fighter/);
    expect(buyPremium(g, 'diamondhelm', 'coin')).toBe(false);
    expect(sellGear(g, 'cometboots')).toBe(true);
    expect(buyPremium(g, 'diamondhelm', 'gem')).toBe(true);
  });
  it('counts a premium piece kept in the armory too', () => {
    const g = game();
    clearAct1(g);
    g.F!.armory = ['starcoat'];
    expect(premiumLock(g, 'cometboots')).toMatch(/Coat of a thousand stars/);
    expect(premiumLock(g, 'starcoat')).toMatch(/Already yours/);
  });
  it('the Coat no longer gets back up; the Crown distracts; the halo boots tilt the signature wheel', () => {
    const f = randomFighter('Shopper', mulberry32(3));
    f.gear = { armor: 'starcoat', trinket: 'rizzcrown', boots: 'haloboots' };
    const t = traitsOf(f);
    expect(t.revive).toBe(0);
    expect(t.rizz).toBeGreaterThanOrEqual(0.12);
    const plain = randomFighter('Plain', mulberry32(3));
    const bt = newBattle(f, plain, mulberry32(1), { quiet: true });
    const w = ultWeights(bt.P[0]);
    const bt2 = newBattle(plain, f, mulberry32(1), { quiet: true });
    const w0 = ultWeights(bt2.P[0]);
    expect(w[4]! / w[0]!).toBeGreaterThan((w0[4]! / w0[0]!) * 10);
  });
  it('plays the old shop with the switch off', () => {
    useBalance({ ...tuned, premiumGate: false });
    try {
      const g = game();
      g.save.profile.gems = 200;
      expect(buyPremium(g, 'cometboots', 'gem')).toBe(true);
      expect(buyPremium(g, 'diamondhelm', 'gem')).toBe(true);
    } finally {
      useBalance(tuned);
    }
  });
});

describe('K6: one revive in the talent tree', () => {
  it('has exactly one revive talent, and says it does not stack', () => {
    const revives = Object.values(TNODE).filter((n) => n.eff.fx?.revive);
    expect(revives.map((n) => n.key)).toEqual(['def_stubborn']);
    expect(revives[0]!.d).toMatch(/One revive counts a fight/);
  });
  it('names the other things that already get a fighter back up', () => {
    const f = randomFighter('Twisty', mulberry32(5));
    f.title = TITLES.find((t) => t.k === 'twist')!;
    f.talents = {};
    expect(reviveSources(f, 'def_stubborn')).toContain('Plot Twist');
    f.title = TITLES[0]!;
    if (f.arch.k !== 'necro' && f.chaos.k !== 'plot' && f.power.k !== 'miracle') expect(reviveSources(f, 'def_stubborn')).toEqual([]);
  });
});

describe('K7: crit and dodge', () => {
  const sides = (a: Fighter, b: Fighter) => {
    const bt = newBattle(a, b, mulberry32(9), {});
    bt.start();
    return bt;
  };
  it('a dodge grazes a signature for half damage', () => {
    let grazed = 0;
    for (let i = 0; i < 30; i++) {
      const a = randomFighter('A', mulberry32(i));
      const b = randomFighter('B', mulberry32(i + 100));
      const bt = sides(a, b);
      bt.P[0].en = 100;
      bt.P[1].tr.dodgeB = 2;
      const ev = bt.step('ult', 'strike', {}, {});
      if (ev.some((e) => e.text.includes('rolls with it: half damage'))) grazed++;
    }
    expect(grazed).toBeGreaterThan(5);
  });
  it("the Shadow set's first strike of a fight can't be dodged or guarded", () => {
    const a = randomFighter('Shade', mulberry32(2));
    a.gear = { helm: 'shadowhood', gloves: 'shadowgloves', cape: 'shadowcape', armor: 'shadowleathers' };
    const b = randomFighter('Wall', mulberry32(3));
    const bt = sides(a, b);
    bt.P[1].tr.dodgeB = 2;
    const ev = bt.step('strike', 'guard', {}, {});
    const hit = ev.find((e) => e.text.startsWith('🥷'));
    expect(hit).toBeDefined();
    expect(hit!.pills).not.toContain('guard');
  });
  it('Knight is trimmed and Clown does something', () => {
    expect(SYN.find((s) => s.k === 'set_knight4')!.m).toEqual({ dur: 1 });
    expect(SYN.find((s) => s.k === 'set_clown4')!.fx).toMatchObject({ rizz: 0.1 });
  });
});

describe('K8: gear upgrades carry over', () => {
  const smith = () => {
    const g = game();
    g.F!.gear = { helm: 'ironhelm' };
    g.F!.armory = ['ironhelm', 'diamondhelm'];
    return g;
  };
  it('a salvaged piece hands its upgrades to the piece that replaced it, worth what was paid', () => {
    const g = smith();
    g.F!.gup = { diamondhelm: 3 };
    expect(carryPreview(g, 'diamondhelm')).toMatch(/Iron helm becomes \+/);
    salvageStored(g, 'diamondhelm');
    const want = levelForWorth(GEARK.ironhelm!, upgradeWorth(GEARK.diamondhelm!, 3));
    expect(want).toBeGreaterThanOrEqual(3);
    expect(upgradeLevel(g.F!, 'ironhelm')).toBe(want);
    expect(upgradeLevel(g.F!, 'diamondhelm')).toBe(0);
  });
  it("cheap upgrades don't buy a legendary its levels", () => {
    expect(levelForWorth(GEARK.diamondhelm!, upgradeWorth(GEARK.papercrown!, 5))).toBeLessThan(5);
  });
  it('a sold piece leaves its upgrades waiting for the next piece worn in that slot', () => {
    const g = smith();
    g.F!.gup = { ironhelm: 2 };
    expect(carryPreview(g, 'ironhelm')).toMatch(/waits for the next helm/);
    expect(sellGear(g, 'ironhelm')).toBe(true);
    expect(upgradeLevel(g.F!, 'ironhelm')).toBe(0);
    wear(g, 'diamondhelm');
    expect(upgradeLevel(g.F!, 'diamondhelm')).toBe(levelForWorth(GEARK.diamondhelm!, upgradeWorth(GEARK.ironhelm!, 2)));
    expect(Object.keys(g.F!.gup || {}).filter((k) => k.startsWith('@'))).toEqual([]);
  });
  it('loses them with the switch off, as before', () => {
    useBalance({ ...tuned, upgradeCarry: false });
    try {
      const g = smith();
      g.F!.gup = { diamondhelm: 3 };
      expect(carryPreview(g, 'diamondhelm')).toBeNull();
      salvageStored(g, 'diamondhelm');
      expect(upgradeLevel(g.F!, 'ironhelm')).toBe(0);
    } finally {
      useBalance(tuned);
    }
  });
});

describe('K9: story injuries', () => {
  const side = (hp: number) => ({ hp, st: { dodges: 0, combos: 0, rps: 0, taken: 30, ults: 0, guards: 0 } }) as unknown as Side;
  const lose = (g: Game) =>
    endStoryFight(
      g,
      { kind: 'story', node: 'fight', tier: { k: 'story', n: 'Story fight', e: '📖', xpW: 0, coins: 0 }, opp: randomFighter('Bully', g.rng) as CareerFighter, arena: null, odds: 0.5 },
      { w: 1, me: side(0), them: side(40), round: 7, sd: false } as FightOutcome,
    );
  it('stop at two from story losses, and heal when the chapter starts over', () => {
    const g = game(8);
    g.F!.lvl = CHAPTERS[0]!.lvl;
    g.F!.story = newChapter(g, 1, 0) as never;
    let medkit = false;
    for (let i = 0; i < 40; i++) {
      storyOf(g).grit = 5;
      const r = lose(g);
      if (r.lines.some((l) => l.includes('med kit'))) medkit = true;
      expect(storyInjuries(g.F!)).toBeLessThanOrEqual(STORY_INJ_MAX);
    }
    expect(storyInjuries(g.F!)).toBe(STORY_INJ_MAX);
    expect(medkit).toBe(true);
    storyOf(g).grit = 1;
    const r = lose(g);
    expect(r.lines.join(' ')).toMatch(/2 story injuries heal/);
    expect(storyInjuries(g.F!)).toBe(0);
  });
});

describe('K10: small balance items', () => {
  it('the quick jab hits for 90%', () => {
    const f = randomFighter('Jabber', mulberry32(4));
    const bt = newBattle(f, randomFighter('Bag', mulberry32(5)), mulberry32(1), { quiet: true });
    const jab = cwSlices(bt.P[0], 'atk').find((s) => s.it.k === 'jab')!;
    expect(jab.it.m!.dmgX).toBe(R2_TUNE.jab);
    expect(jab.it.d).toBe('Goes first, 90% damage');
  });
  it('lifesteal heals: a drain under 1 is a share of the damage', () => {
    let healed = 0;
    for (let i = 0; i < 10; i++) {
      const a = randomFighter('Leech', mulberry32(i));
      a.talents = { spi_drain: 3 };
      talMap(a);
      const bt = newBattle(a, randomFighter('Snack', mulberry32(i + 50)), mulberry32(i), {});
      bt.start();
      bt.P[0].hp = 50;
      const ev = bt.step('strike', 'power', {}, {});
      if (ev.some((e) => e.text.includes('drinks') && e.cls === 'heal')) healed++;
    }
    expect(healed).toBeGreaterThan(2);
  });
  it('the dead talents do something, and the outliers moved', () => {
    expect(TNODE.def_counter!.eff.fx?.counterB).toBe(0.3);
    expect(TNODE.def_iguard!.eff.fx?.dr).toBe(0.02);
    expect(TNODE.tac_evade!.eff.fx?.dodgeB).toBe(0.05);
    expect(TITLES.find((t) => t.k === 'fraud')!.m).toEqual({ str: -1, spd: -1, dur: -1 });
  });
});
