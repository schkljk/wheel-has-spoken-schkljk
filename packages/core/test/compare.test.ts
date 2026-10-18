import { describe, expect, it } from 'vitest';
import { clockAt, ctxOf, enterCareer, gearCompare, mulberry32, newSave, numStats, randomFighter, wear, type CareerFighter, type Game } from '../src';

// Upgrade 28: compare gear before it goes on.
function game(seed = 1): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Hero', rng) as CareerFighter);
  g.F!.lvl = 10;
  g.F!.gear = {};
  return g;
}

describe('gear compare', () => {
  it('shows exactly the numbers wearing it would give, without touching the fighter', () => {
    const g = game();
    g.F!.gear = { helm: 'leathercap' };
    // (the first stat read tidies up an old-style talents list; that's not the compare's doing)
    numStats(g.F!, ctxOf(g));
    const before = JSON.stringify(g.F);
    const c = gearCompare(g, 'hornedcrown');
    expect(JSON.stringify(g.F)).toBe(before);
    expect(c.old?.k).toBe('leathercap');
    const now = numStats(g.F!, ctxOf(g));
    wear(g, 'hornedcrown');
    const then = numStats(g.F!, ctxOf(g));
    for (const r of c.rows) {
      expect(r.a, r.k).toBe(now[r.k]);
      expect(r.b, r.k).toBe(then[r.k]);
    }
    // +2 strength for +1 durability: attack up, defense down
    expect(c.rows.find((r) => r.k === 'atk')!.b).toBeGreaterThan(c.rows.find((r) => r.k === 'atk')!.a);
    expect(c.rows.find((r) => r.k === 'def')!.b).toBeLessThan(c.rows.find((r) => r.k === 'def')!.a);
  });

  it('names the set bonuses a piece starts or ends', () => {
    const g = game(2);
    g.F!.gear = { helm: 'ironhelm', gloves: 'irongauntlets', armor: 'knightplate' };
    const add = gearCompare(g, 'greaves');
    expect(add.old).toBeNull();
    expect(add.gain.map((s) => s.k)).toContain('set_knight4');
    expect(add.lose).toEqual([]);
    g.F!.gear = { helm: 'ironhelm', gloves: 'irongauntlets' };
    const drop = gearCompare(g, 'thinkcap');
    expect(drop.old?.k).toBe('ironhelm');
    expect(drop.lose.map((s) => s.k)).toContain('set_knight2');
  });

  it('changes nothing for the piece already worn', () => {
    const g = game(3);
    g.F!.gear = { helm: 'thinkcap' };
    const c = gearCompare(g, 'thinkcap');
    expect(c.old).toBeNull();
    expect(c.rows.every((r) => r.a === r.b)).toBe(true);
    expect(c.gain).toEqual([]);
    expect(c.lose).toEqual([]);
  });
});
