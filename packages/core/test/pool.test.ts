import { describe, expect, it } from 'vitest';
import { headToHead, mulberry32, poolFighter, poolPick, poolSeed, rankPool, rankTxt, serFighter } from '../src';

describe('ranked pool', () => {
  const seed = poolSeed('Fri Oct 16 2026');
  const ranking = rankPool(seed, { n: 200, games: 1500 });

  it('is a deterministic ranking of every fighter', () => {
    expect(ranking.order).toHaveLength(200);
    expect(new Set(ranking.order).size).toBe(200);
    expect(rankPool(seed, { n: 200, games: 1500 })).toEqual(ranking);
    expect(poolSeed('Sat Oct 17 2026')).not.toBe(seed);
  });

  it('rebuilds pool fighters identically from the seed', () => {
    expect(serFighter(poolFighter(seed, 17))).toEqual(serFighter(poolFighter(seed, 17)));
    expect(serFighter(poolFighter(seed, 17))).not.toEqual(serFighter(poolFighter(seed, 18)));
  });

  it('puts stronger fighters at the top', () => {
    const rng = mulberry32(5);
    const weak = ranking.order.slice(0, 20).map((i) => poolFighter(seed, i));
    const strong = ranking.order.slice(-20).map((i) => poolFighter(seed, i));
    let r = 0;
    for (let k = 0; k < 20; k++) r += headToHead(strong[k]!, weak[k]!, rng, 20);
    expect(r / 20).toBeGreaterThan(0.75);
  });

  it('picks from the requested slice of the ranking', () => {
    const rng = mulberry32(9);
    for (let k = 0; k < 50; k++) {
      const o = poolPick(ranking, 0.5, 0.8, rng);
      expect(o.poolPct!).toBeGreaterThanOrEqual(0.5);
      expect(o.poolPct!).toBeLessThan(0.8);
      expect(o.name).not.toBe('pool');
      // a rank out of the thousand, never a percentage
      expect(rankTxt(o)).toMatch(/^Rank \d+$/);
    }
    const early = poolPick(null, 0.5, 0.8, rng, 'Before the pool');
    expect(early.name).toBe('Before the pool');
    expect(early.poolPct).toBeUndefined();
  });
});
