import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../packages/core/src';
import { loadLegacyCore } from './legacy';

type Fighter = { name: string; lvl?: number };

describe('legacy core harness', () => {
  const legacy = loadLegacyCore(mulberry32(1));
  const randomFighter = legacy.get<(name?: string) => Fighter>('randomFighter');
  const simulate = legacy.get<(a: Fighter, b: Fighter) => number>('simulate');

  it('exposes the core API', () => {
    for (const name of ['randomFighter', 'newBattle', 'numStats', 'LS', 'simulate', 'RACES', 'GEAR']) {
      expect(legacy.get(name), name).toBeDefined();
    }
  });

  it('is deterministic under a seeded RNG', () => {
    const run = (seed: number) => {
      legacy.setRng(mulberry32(seed));
      const a = randomFighter('A');
      const b = randomFighter('B');
      return { a: JSON.stringify(a), b: JSON.stringify(b), w: simulate(a, b) };
    };
    expect(run(123)).toEqual(run(123));
    expect(run(123)).not.toEqual(run(456));
  });
});
