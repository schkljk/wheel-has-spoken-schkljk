import { describe, expect, it } from 'vitest';
import { LAB_TABLES, labRun } from '../src';

// Upgrade 14: the hidden balance lab's numbers.
describe('balance lab', () => {
  const r = labRun(400, 7);

  it('is the same run for the same seed', () => {
    expect(labRun(400, 7)).toEqual(r);
    expect(labRun(400, 8)).not.toEqual(r);
  });

  it('counts every fighter once per table, best win rate first', () => {
    expect(r.tables.map((t) => t.k)).toEqual(LAB_TABLES.map(([k]) => k));
    for (const t of r.tables) {
      expect(t.rows.reduce((a, x) => a + x.n, 0)).toBe(800);
      for (const x of t.rows) {
        expect(x.n).toBeGreaterThan(0);
        expect(x.w).toBeGreaterThanOrEqual(0);
        expect(x.w).toBeLessThanOrEqual(1);
      }
      for (let i = 1; i < t.rows.length; i++) expect(t.rows[i]!.w).toBeLessThanOrEqual(t.rows[i - 1]!.w);
    }
    // half the fighters win: the weighted average is exactly 50%
    const arch = r.tables[0]!.rows;
    expect(arch.reduce((a, x) => a + x.w * x.n, 0)).toBeCloseTo(400, 6);
  });

  it('puts some fighters in full gear sets', () => {
    const sets = r.tables.find((t) => t.k === 'set')!.rows;
    expect(sets.some((x) => x.k !== 'none')).toBe(true);
    expect(sets.find((x) => x.k === 'none')!.n).toBeGreaterThan(300);
  });
});
