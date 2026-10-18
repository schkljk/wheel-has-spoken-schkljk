import { afterAll, describe, expect, it } from 'vitest';
import {
  BALANCE,
  GEARK,
  LEGACY_BALANCE,
  UPGRADE_FX,
  addCopy,
  bonusCopy,
  clockAt,
  coinsOf,
  copiesOf,
  deserFighter,
  enterCareer,
  forgetPiece,
  lootLand,
  mulberry32,
  newSave,
  numStats,
  randomFighter,
  salvageCopy,
  salvageStored,
  serFighter,
  traitsOf,
  upgradeCost,
  upgradeGear,
  upgradeLevel,
  upgradeNext,
  useBalance,
  type CareerFighter,
  type Game,
} from '../src';

// Upgrade 21: gear goes from +1 to +5 for coins, with copies for the last two levels.
function game(seed = 1, coins = 1000): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Smith', rng) as CareerFighter);
  g.save.roster.slots[0]!.coins = coins;
  g.F!.gear = { armor: 'vest', gloves: Object.keys(GEARK).find((k) => GEARK[k]!.slot === 'gloves' && GEARK[k]!.r === 'common')! };
  g.F!.armory = Object.values(g.F!.gear) as string[];
  return g;
}
const saved = { ...BALANCE };
afterAll(() => useBalance(saved));

describe('gear upgrades', () => {
  it('costs coins per level, and a copy for +4 and +5', () => {
    const g = game();
    const vest = GEARK.vest!;
    for (let L = 1; L <= 3; L++) {
      const c = coinsOf(g);
      expect(upgradeNext(g, 'vest').cost).toBe(upgradeCost(vest, L));
      expect(upgradeGear(g, 'vest')).toBe(true);
      expect(coinsOf(g)).toBe(c - upgradeCost(vest, L));
      expect(upgradeLevel(g.F!, 'vest')).toBe(L);
    }
    // +4 needs a copy
    expect(upgradeNext(g, 'vest')).toMatchObject({ L: 4, copies: 1, ok: false, why: 'Needs a copy of it (from loot)' });
    expect(upgradeGear(g, 'vest')).toBe(false);
    addCopy(g, 'vest');
    expect(upgradeGear(g, 'vest')).toBe(true);
    expect(copiesOf(g.F!, 'vest')).toBe(0);
    addCopy(g, 'vest');
    expect(upgradeGear(g, 'vest')).toBe(true);
    expect(upgradeLevel(g.F!, 'vest')).toBe(5);
    expect(upgradeNext(g, 'vest')).toMatchObject({ ok: false, why: 'Fully upgraded' });
    // not enough coins, and never a piece you don't own
    const poor = game(2, 1);
    expect(upgradeNext(poor, 'vest')).toMatchObject({ ok: false, why: `Needs ${upgradeCost(vest, 1)} coins` });
    expect(upgradeGear(game(), 'chain')).toBe(false);
  });

  it('adds its slot bonus to the fighter, and the card shows it', () => {
    const g = game();
    const F = g.F!;
    const dr0 = traitsOf(F).dr;
    const def0 = numStats(F).def;
    for (let i = 0; i < 3; i++) upgradeGear(g, 'vest');
    expect(traitsOf(F).dr).toBeCloseTo(dr0 + UPGRADE_FX.armor[1] * 3, 6);
    expect(numStats(F).def).toBeGreaterThan(def0);
    const gloves = F.gear!.gloves!;
    const crit0 = traitsOf(F).critB;
    upgradeGear(g, gloves);
    expect(traitsOf(F).critB).toBeCloseTo(crit0 + UPGRADE_FX.gloves[1], 6);
    expect(upgradeNext(g, 'vest').step).toBe('+2% damage reduction');
    expect(upgradeNext(g, 'vest').total).toBe('+8% damage reduction');
  });

  it('has no effect with the old balance, and saves and loads', () => {
    const g = game();
    for (let i = 0; i < 3; i++) upgradeGear(g, 'vest');
    addCopy(g, 'vest');
    const back = deserFighter(serFighter(g.F!))!;
    expect(back.gup).toEqual({ vest: 3 });
    expect(back.gcopy).toEqual({ vest: 1 });
    const dr = traitsOf(g.F!).dr;
    useBalance({ ...BALANCE, gearUpgrades: LEGACY_BALANCE.gearUpgrades });
    try {
      expect(traitsOf(g.F!).dr).toBeCloseTo(dr - UPGRADE_FX.armor[1] * 3, 6);
      expect(upgradeGear(g, 'vest')).toBe(false);
    } finally {
      useBalance(saved);
    }
    // a fighter with none saves exactly as before
    const plain = serFighter(game(3).F!);
    expect('gup' in plain || 'gcopy' in plain).toBe(false);
  });

  it('turns loot you already have into a copy instead of coins', () => {
    const g = game(4, 0);
    const F = g.F!;
    // every common piece owned, so a common drop must be a duplicate
    F.armory = Object.keys(GEARK).filter((k) => GEARK[k]!.r === 'common');
    const r = lootLand(g, { rar: 'common', n: 'Common gear', e: '🎁', q: 1 } as never)!;
    expect(r).toMatchObject({ kind: 'gear', then: 'copy' });
    expect(copiesOf(F, (r as { gear: { k: string } }).gear.k)).toBeGreaterThanOrEqual(1);
    expect(coinsOf(g)).toBe(0);
  });

  it('sometimes adds a bonus copy of something you wear', () => {
    let n = 0;
    for (let s = 1; s <= 200; s++) {
      const g = game(s);
      const b = bonusCopy(g);
      if (b) {
        n++;
        expect(Object.values(g.F!.gear!)).toContain(b.k);
        expect(copiesOf(g.F!, b.k)).toBe(1);
      }
    }
    expect(n).toBeGreaterThan(30);
    expect(n).toBeLessThan(70);
  });

  it('salvages copies for what the piece is worth, and a salvaged piece takes its upgrades and copies with it', () => {
    const g = game(5, 100);
    addCopy(g, 'vest');
    const c = coinsOf(g);
    expect(salvageCopy(g, 'vest')).toBeGreaterThan(0);
    expect(coinsOf(g)).toBeGreaterThan(c);
    expect(copiesOf(g.F!, 'vest')).toBe(0);
    upgradeGear(g, 'vest');
    addCopy(g, 'vest');
    addCopy(g, 'vest');
    g.F!.gear = {};
    const before = coinsOf(g);
    salvageStored(g, 'vest');
    expect(upgradeLevel(g.F!, 'vest')).toBe(0);
    expect(copiesOf(g.F!, 'vest')).toBe(0);
    expect(coinsOf(g)).toBeGreaterThan(before + 1);
    expect(forgetPiece(g, 'vest')).toBe(0);
  });
});
