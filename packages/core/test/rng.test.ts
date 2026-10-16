import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src';

describe('mulberry32', () => {
  it('is deterministic per seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('stays in [0, 1) and looks uniform', () => {
    const r = mulberry32(7);
    let sum = 0;
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      sum += x;
    }
    expect(sum / n).toBeCloseTo(0.5, 2);
  });
});
