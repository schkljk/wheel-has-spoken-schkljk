import { describe, expect, it } from 'vitest';
import { infoFor, levelUp, mulberry32, newBattle, randomFighter, type BattleEvent, type StatusChip } from '../src';

// Upgrade 8: every status and buff shows over its fighter with a counter. The chips must agree with the
// engine's own status flags, event by event, and their counters must make sense.

function fight(seed: number) {
  const rng = mulberry32(seed);
  const A = randomFighter('A', rng);
  const B = randomFighter('B', rng);
  const lv = 1 + Math.floor(rng() * 30);
  levelUp(A, lv, rng);
  levelUp(B, lv, rng);
  const bt = newBattle(A, B, rng);
  const ev: BattleEvent[] = [...bt.start()];
  while (!bt.over) ev.push(...bt.step());
  return ev;
}

describe('status icons with counters', () => {
  const seen = new Set<string>();
  const evs = Array.from({ length: 1500 }, (_, i) => fight(i + 1)).flat();

  it('match the engine’s status flags on every event', () => {
    for (const e of evs)
      for (const i of [0, 1] as const) {
        const st = e.st[i]!;
        const has = (k: StatusChip['k']) => e.sx[i]!.some((c) => c.k === k);
        expect(has('frozen')).toBe(st.frozen);
        expect(has('burning')).toBe(st.burning);
        expect(has('soaked')).toBe(st.soaked);
        expect(has('poison')).toBe(st.poison);
        expect(has('guard')).toBe(st.guard);
        for (const c of e.sx[i]!) seen.add(c.k);
      }
  });

  it('carry sensible counters, each status once', () => {
    for (const e of evs)
      for (const chips of e.sx) {
        expect(new Set(chips.map((c) => c.k)).size).toBe(chips.length);
        for (const c of chips) {
          if (c.k === 'poison') expect(c.t).toMatch(/^−[1-9]\d*$/);
          else if (c.k === 'bent') expect(c.t).toMatch(/^×[123]$/);
          else if (['guard', 'opened', 'focused'].includes(c.k)) expect(c.t).toBe('');
          else expect(Number(c.t)).toBeGreaterThanOrEqual(1);
          if (c.k === 'burning' || c.k === 'soaked') expect(Number(c.t)).toBeLessThanOrEqual(2);
          expect(c.bad).toBe(['frozen', 'burning', 'poison', 'soaked', 'vuln', 'weak', 'bent'].includes(c.k));
        }
      }
  });

  it('shows up for the common statuses in random fights', () => {
    for (const k of ['guard', 'frozen', 'burning', 'poison', 'soaked', 'bent', 'opened', 'focused']) expect(seen, k).toContain(k);
  });

  it('every status has a help card: what it does, what its number means, and a joke', () => {
    const all: StatusChip['k'][] = ['guard', 'opened', 'focused', 'dmgX', 'dr', 'critB', 'frozen', 'burning', 'poison', 'soaked', 'vuln', 'weak', 'bent'];
    for (const k of all) {
      const it = infoFor(`status|${k}`);
      expect(it, k).not.toBeNull();
      expect(it!.p, k).toBeTruthy();
      expect(it!.flavor, k).toBeTruthy();
      if (!['guard', 'opened', 'focused'].includes(k)) expect(it!.lines.join(' '), k).toMatch(/number on its icon/);
    }
  });
});
