import { describe, expect, it } from 'vitest';
import { cwSlices, levelUp, mulberry32, newBattle, peekSlice, randomFighter, type BattleEvent, type Move } from '../src';

// Upgrade 9: holding a combat wheel slice previews roughly what it does. The preview runs the engine's own
// damage formula without drawing anything, so a plain hit should land inside it.

function battle(seed: number) {
  const rng = mulberry32(seed);
  const A = randomFighter('A', rng);
  const B = randomFighter('B', rng);
  const lv = 1 + Math.floor(rng() * 30);
  levelUp(A, lv, rng);
  levelUp(B, lv, rng);
  return newBattle(A, B, rng);
}
/** The player's own plain hit this round: not a crit, combo, matchup bonus, guard, extra hit or weak spot. */
const plainHit = (evs: BattleEvent[], kind: 'melee' | 'ranged' | 'power') =>
  evs.find(
    (e) =>
      e.a?.t === 'hit' && e.a.by === 0 && (kind === 'power' ? e.a.kind === 'power' : e.a.kind !== 'power') && !e.a.crit && !e.a.combo && !e.a.guarded && !e.a.broke &&
      !e.pills.some((p) => p === 'caught' || p === 'interrupted') && !/ again$|Reality bends|The bit kills|fizz|The water/.test(e.text) && e.d != null,
  );

describe('slice damage preview', () => {
  it('draws nothing and changes nothing', () => {
    for (let s = 1; s <= 200; s++) {
      const a = battle(s);
      const b = battle(s);
      a.start();
      b.start();
      while (!a.over) {
        for (const f of ['atk', 'pow', 'def', 'ult'] as const) for (const { it } of cwSlices(a.P[0], f)) peekSlice(a, it);
        expect(a.step('strike')).toEqual(b.step('strike'));
      }
      expect(b.over).toBe(true);
    }
  });

  it('a plain strike lands inside its preview', () => {
    let n = 0;
    let inside = 0;
    for (let s = 1; s <= 1500; s++) {
      const bt = battle(s);
      bt.start();
      while (!bt.over) {
        const p = bt.preview(0, 'strike');
        const mom = bt.P[0].mom || 0;
        const evs = bt.step('strike' as Move, null, {});
        const hit = plainHit(evs, 'melee');
        if (!p || !hit) continue;
        // the round's matchup moves it on purpose: momentum from a read, a failed feint or a focus exposing them
        if ((bt.P[0].mom || 0) !== mom || ['feint', 'focus'].includes(bt.hist[1].at(-1)!)) continue;
        n++;
        if (hit.d! >= p.lo - 1 && hit.d! <= p.hi + 1) inside++;
      }
    }
    console.log(`plain strikes inside the preview: ${inside}/${n} (${((inside / n) * 100).toFixed(1)}%)`);
    expect(n).toBeGreaterThan(1500);
    expect(inside / n).toBeGreaterThan(0.95);
  });
});
