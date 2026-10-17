import { afterEach, describe, expect, it } from 'vitest';
import { BALANCE, LEGACY_BALANCE, SOFT_CAP, mulberry32, newBattle, randomFighter, soft, useBalance, type BattleEvent } from '../src';

// Upgrade 15: crit, dodge and damage reduction stack with diminishing returns past a knee.
const tuned = { ...BALANCE };
afterEach(() => useBalance(tuned));

/** Share of A's hits that crit, and of B's defences that dodge, when A has huge crit and B huge dodge. */
function rates(seed: number) {
  const rng = mulberry32(seed);
  const bt = newBattle(randomFighter('A', rng), randomFighter('B', rng), rng, { maxRounds: 200 });
  const [A, B] = bt.P;
  A.tr.critB = 1.2;
  B.tr.dodgeB = 1.2;
  A.maxHp = A.hp = B.maxHp = B.hp = 1e9;
  const ev: BattleEvent[] = [];
  for (let i = 0; i < 120 && !bt.over; i++) ev.push(...bt.step('strike', 'strike', {}, {}));
  const hits = ev.filter((e) => e.a?.t === 'hit' && e.a.by === 0);
  const misses = ev.filter((e) => e.a?.t === 'miss' && e.a.by === 0);
  return { crit: hits.filter((e) => e.a!.crit).length / hits.length, dodge: misses.length / (hits.length + misses.length) };
}

describe('soft caps', () => {
  it('halves every point past the knee and stops at the ceiling', () => {
    expect(soft(0.2, ...SOFT_CAP.crit)).toBe(0.2);
    expect(soft(0.45, ...SOFT_CAP.crit)).toBeCloseTo(0.4);
    expect(soft(2, ...SOFT_CAP.crit)).toBe(0.65);
    useBalance(LEGACY_BALANCE);
    expect(soft(2, ...SOFT_CAP.crit)).toBe(2);
  });

  it('keeps a stacked crit and dodge at their ceilings in real fights', () => {
    const on = rates(5);
    expect(on.crit).toBeLessThan(0.75);
    expect(on.crit).toBeGreaterThan(0.55);
    expect(on.dodge).toBeLessThan(0.66);
    useBalance(LEGACY_BALANCE);
    const off = rates(5);
    // without them every hit crits, and dodge sits at the old hard cap of 60%
    expect(off.crit).toBe(1);
    expect(off.dodge).toBeGreaterThan(0.5);
  });
});
