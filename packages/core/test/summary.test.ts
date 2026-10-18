import { describe, expect, it } from 'vitest';
import { SYN_HIDDEN, buildSummary, mulberry32, randomFighter, synOf, type Fighter } from '../src';

// Upgrade 29: the scouting report after the wheels.
const fighters = (n: number, seed = 3) => {
  const r = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => randomFighter(`F${i}`, r));
};
const boost = (f: Fighter, m: Record<string, number>) => {
  f.bonus = { ...(f.bonus || {}), ...m } as never;
  return f;
};

describe('the scouting report', () => {
  it('always has three different strengths, a weakness, a synergy line and a sign-off, all filled in', () => {
    for (const f of fighters(60)) {
      const r = buildSummary(f);
      expect(r.strengths).toHaveLength(3);
      expect(new Set(r.strengths.map((s) => s.k)).size).toBe(3);
      expect(r.strengths.map((s) => s.k)).not.toContain(r.weakness.k);
      for (const l of [...r.strengths, r.weakness, ...(r.synergy ? [r.synergy] : [])]) {
        expect(l.n.length, f.name).toBeGreaterThan(0);
        expect(l.joke.length, f.name).toBeGreaterThan(5);
        expect(l.what).not.toMatch(/undefined|NaN/);
      }
      expect(!!r.synergy !== !!r.noSyn).toBe(true);
      expect(r.closer.length).toBeGreaterThan(5);
    }
  });

  it('is the same report every time for the same fighter', () => {
    const [f] = fighters(1, 9);
    expect(buildSummary(f!)).toEqual(buildSummary(f!));
  });

  it('names a towering stat as a strength and a tiny one as the weakness', () => {
    const [f] = fighters(1, 11);
    boost(f!, { str: 20, dur: -12 });
    const r = buildSummary(f!);
    expect(r.strengths[0]).toMatchObject({ k: 'str', n: 'Hits hard' });
    expect(r.strengths[0]!.what).toMatch(/^Strength \d+, among the very best$/);
    expect(r.weakness).toMatchObject({ k: 'dur', n: 'Fragile' });
    expect(r.weakness.what).toMatch(/among the very lowest/);
  });

  it('falls back to the weakness trait when no stat is clearly low', () => {
    const [f] = fighters(1, 13);
    boost(f!, { str: 6, spd: 6, dur: 6, iq: 6, wm: 6, pm: 6, cha: 6 });
    const r = buildSummary(f!);
    expect(r.weakness.k).toBe('weak');
    expect(r.weakness.n).toBe(f!.weak.n);
  });

  it('never gives away a hidden synergy', () => {
    const hidden = new Set(SYN_HIDDEN.map((s) => s.k));
    let seen = 0;
    for (const f of fighters(600, 21)) {
      if (!synOf(f).some((s) => hidden.has(s.k))) continue;
      seen++;
      const r = buildSummary(f);
      expect(r.synergy && hidden.has(r.synergy.k)).toBeFalsy();
    }
    expect(seen).toBeGreaterThan(0);
  });
});
