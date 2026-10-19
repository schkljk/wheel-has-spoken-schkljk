import { describe, expect, it } from 'vitest';
import { fightRecap, matchupLine, mulberry32, newBattle, randomFighter, recapTip, type BattleEvent } from '../src';

// Review item C1: a recap says why a fight went the way it did.
function play(seed: number) {
  const rng = mulberry32(seed);
  const a = randomFighter('A', rng);
  const b = randomFighter('B', rng);
  const bt = newBattle(a, b, rng, {});
  const log: BattleEvent[] = [...bt.start()];
  while (!bt.over) log.push(...bt.step());
  return { bt, log };
}

describe('fight recap', () => {
  it('adds up what each side lost and their biggest blows', () => {
    for (let s = 1; s <= 20; s++) {
      const { bt, log } = play(s);
      const r = fightRecap(bt, log, bt.w === 0);
      const loser = bt.w === 0 ? 1 : 0;
      // the loser lost about their whole bar (revives and heals make it more)
      expect(r.lost[loser], `seed ${s}`).toBeGreaterThan(0);
      expect(r.biggest[0] + r.biggest[1]).toBeGreaterThan(0);
      expect(r.reads).toEqual([bt.P[0].st.rps, bt.P[1].st.rps]);
      expect(r.rounds).toBe(bt.round);
      expect(r.tip.length).toBeGreaterThan(20);
      expect(r.tip).not.toMatch(/\d+%/);
    }
  });
  it('picks the most telling tip', () => {
    const base = { lost: [100, 50] as [number, number], biggest: [20, 20] as [number, number], reads: [1, 5] as [number, number], dots: [0, 0] as [number, number], dodges: [0, 0] as [number, number], rounds: 8 };
    expect(recapTip(base, false)).toMatch(/They won 5 matchups to your 1/);
    expect(recapTip({ ...base, reads: [3, 3], dots: [40, 0] }, false)).toMatch(/Burns and poison/);
    expect(recapTip({ ...base, reads: [6, 1] }, true)).toMatch(/You won 6 matchups/);
  });
  it('says a round in words', () => {
    expect(matchupLine('strike', 'guard', 1)).toBe('Your Strike vs their guard: they read it');
    expect(matchupLine('power', 'guard', 0)).toBe('Your Power vs their guard: you read it');
  });
});
