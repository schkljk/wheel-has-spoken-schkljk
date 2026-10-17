import { afterEach, describe, expect, it } from 'vitest';
import {
  BALANCE,
  LEGACY_BALANCE,
  PERSONALITIES,
  autoChoice,
  levelUp,
  mulberry32,
  newBattle,
  personalityOf,
  randomFighter,
  useBalance,
  type Move,
  type Side,
} from '../src';

// Upgrade 11: every fighter has an AI personality read off their build, and it tilts how the AI picks moves.

const tuned = { ...BALANCE };
afterEach(() => useBalance(tuned));

function sides(seed: number) {
  const rng = mulberry32(seed);
  const A = randomFighter('A', rng);
  const B = randomFighter('B', rng);
  levelUp(A, 10, rng);
  levelUp(B, 10, rng);
  return newBattle(A, B, rng).P;
}
/** How often each move comes up for this side, with or without its personality. */
function picks(me: Side, op: Side, withPers: boolean, en = 50, hist: Move[] = []) {
  const keep = me.pers;
  me.pers = withPers ? keep : null;
  me.en = en;
  const rng = mulberry32(42);
  const c: Record<string, number> = {};
  for (let i = 0; i < 4000; i++) {
    const m = autoChoice(rng, me, op, hist);
    c[m] = (c[m] ?? 0) + 1;
  }
  me.pers = keep;
  return (m: string) => (c[m] ?? 0) / 4000;
}

describe('AI personalities', () => {
  it('spreads random fighters about evenly over the four, without drawing anything', () => {
    const rng = mulberry32(1);
    const c: Record<string, number> = {};
    for (let i = 0; i < 4000; i++) {
      const f = randomFighter('X', rng);
      levelUp(f, Math.floor(rng() * 30), rng);
      const p = personalityOf(f);
      expect(personalityOf(f)).toBe(p);
      c[p.k] = (c[p.k] ?? 0) + 1;
    }
    for (const k of Object.keys(PERSONALITIES)) expect(c[k]! / 4000, k).toBeGreaterThan(0.15);
  });

  it('follows the stance first', () => {
    const rng = mulberry32(2);
    let n = 0;
    let tact = 0;
    for (let i = 0; i < 4000; i++) {
      const f = randomFighter('X', rng);
      if (f.stance?.k !== 'tactical') continue;
      n++;
      if (personalityOf(f).k === 'tactician') tact++;
    }
    expect(tact / n).toBeGreaterThan(0.7);
  });

  it('tilts the AI the way the card says', () => {
    let seen = 0;
    for (let s = 1; s <= 300 && seen < 4; s++) {
      const [me, op] = sides(s);
      if (!me.pers) continue;
      const on = picks(me, op, true);
      const off = picks(me, op, false);
      if (me.pers.k === 'aggressive') expect(on('strike')).toBeGreaterThan(off('strike') * 1.1);
      if (me.pers.k === 'turtle') expect(on('guard')).toBeGreaterThan(off('guard') * 1.2);
      if (me.pers.k === 'gambler') {
        expect(on('feint')).toBeGreaterThan(off('feint'));
        // fires the signature the moment the bar is full
        expect(picks(me, op, true, 100)('ult')).toBe(1);
        expect(picks(me, op, false, 100)('ult')).toBeLessThan(0.9);
      }
      if (me.pers.k === 'tactician') {
        // punishes a player who keeps striking: guards more than without the personality
        const h: Move[] = ['strike', 'strike', 'strike'];
        expect(picks(me, op, true, 50, h)('guard')).toBeGreaterThan(picks(me, op, false, 50, h)('guard'));
      }
      seen++;
    }
    expect(seen).toBe(4);
  });

  it('is off with the old game’s balance (parity)', () => {
    useBalance(LEGACY_BALANCE);
    expect(sides(3)[0].pers).toBeNull();
    useBalance(tuned);
    expect(sides(3)[0].pers).not.toBeNull();
  });
});
