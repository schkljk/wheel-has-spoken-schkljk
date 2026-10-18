import { afterAll, describe, expect, it } from 'vitest';
import {
  BALANCE,
  CODEX,
  GEAR,
  GEARK,
  GEAR_MORE,
  LEGACY_BALANCE,
  SYN_SETS,
  gearPool,
  infoFor,
  mulberry32,
  randomFighter,
  synOf,
  traitsOf,
  useBalance,
  type Fighter,
} from '../src';

// Upgrade 22: pirate, chef, cosmic and royal gear, with set bonuses at 2, 4 and 6 pieces.
const saved = { ...BALANCE };
afterAll(() => useBalance(saved));
const wearing = (set: string, n: number): Fighter => {
  const f = randomFighter('Model', mulberry32(7));
  f.gear = Object.fromEntries(GEAR_MORE.filter((g) => g.set === set).slice(0, n).map((g) => [g.slot, g.k]));
  return f;
};

describe('more gear sets', () => {
  it('adds four whole sets that never clash with the ported gear', () => {
    const keys = new Set(GEAR.map((g) => g.k));
    const names = new Set(GEAR.map((g) => g.n));
    for (const g of GEAR_MORE) {
      expect(keys.has(g.k), g.k).toBe(false);
      expect(names.has(g.n), g.n).toBe(false);
      expect(GEARK[g.k]).toBe(g);
      expect(g.d.endsWith(' set'), g.k).toBe(true);
    }
    const count = (s: string) => GEAR_MORE.filter((g) => g.set === s);
    expect(count('pirate')).toHaveLength(6);
    expect(count('chef')).toHaveLength(4);
    expect(count('cosmic')).toHaveLength(6);
    expect(count('royal')).toHaveLength(6);
    // one piece per slot in each set
    for (const s of ['pirate', 'chef', 'cosmic', 'royal']) expect(new Set(count(s).map((g) => g.slot)).size).toBe(count(s).length);
  });

  it('gives the set bonus at 2, 4 and 6 pieces', () => {
    expect(synOf(wearing('pirate', 1)).some((s) => s.k.startsWith('set_pirate'))).toBe(false);
    expect(synOf(wearing('pirate', 2)).map((s) => s.k)).toContain('set_pirate2');
    const six = synOf(wearing('pirate', 6)).map((s) => s.k);
    expect(six).toEqual(expect.arrayContaining(['set_pirate2', 'set_pirate4', 'set_pirate6']));
    expect(traitsOf(wearing('pirate', 6)).firstStrike).toBe(true);
    expect(synOf(wearing('chef', 4)).map((s) => s.k)).toEqual(expect.arrayContaining(['set_chef2', 'set_chef4']));
    expect(traitsOf(wearing('chef', 4)).regen).toBeGreaterThanOrEqual(2);
  });

  it('stays out of loot, shops and set bonuses with the old balance', () => {
    expect(gearPool()).toHaveLength(GEAR.length + GEAR_MORE.length);
    useBalance({ ...BALANCE, moreSets: LEGACY_BALANCE.moreSets });
    try {
      expect(gearPool()).toBe(GEAR);
      expect(synOf(wearing('royal', 6)).some((s) => s.k.startsWith('set_royal'))).toBe(false);
    } finally {
      useBalance(saved);
    }
  });

  it('shows up in the collection and has info cards with a joke', () => {
    const gear = CODEX.find((c) => c[0] === 'gear')![2]().map((x) => x.it.n);
    expect(gear).toContain('Loud parrot');
    const syn = CODEX.find((c) => c[0] === 'syn')![2]().map((x) => x.it.n);
    expect(syn).toContain('Royal set (6)');
    expect(infoFor('it|gear|Heavy crown')?.title).toBe('Heavy crown');
    for (const s of SYN_SETS) expect(infoFor(`it|syn|${s.n}`)?.flavor, s.k).toBeTruthy();
  });
});
