import { describe, expect, it } from 'vitest';
import {
  CALL_PAY,
  buyClubTip,
  clockAt,
  clubLine,
  clubMatchup,
  clubMult,
  clubSettle,
  clubTip,
  coinsOf,
  enterCareer,
  mulberry32,
  newSave,
  randomFighter,
  settleCall,
  type CareerFighter,
  type Exhibition,
  type Game,
} from '../src';

// Review F8: a fight club with good bets in it, and exhibitions you can call.
function game(seed = 4): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Bettor', rng) as CareerFighter);
  g.F!.coins = 100;
  return g;
}

describe('the fight club insider', () => {
  it('pays by the bookie line, which is often off from the real odds', () => {
    const g = game();
    let off = 0;
    for (let i = 0; i < 20; i++) {
      const c = clubMatchup(g);
      expect(c.line).toBeGreaterThanOrEqual(0.06);
      expect(c.line).toBeLessThanOrEqual(0.94);
      if (Math.abs(c.line! - c.pA) >= 0.08) off++;
    }
    expect(off).toBeGreaterThan(5);
    const c = clubMatchup(g);
    c.bet = 10;
    const coins = coinsOf(g);
    const r = clubSettle(g, c, 'A', 0);
    expect(r.mult).toBe(clubMult(clubLine(c)));
    expect(coinsOf(g)).toBe(coins + Math.round(10 * r.mult));
  });
  it('tells the real odds for a gem, once a matchup', () => {
    const g = game();
    g.F!.cha = { ...(g.F!.cha as object), v: 1 } as never;
    const c = clubMatchup(g);
    g.save.profile.gems = 1;
    expect(buyClubTip(g, c)).toBe(true);
    expect(g.save.profile.gems).toBe(0);
    // already bought: free to read again
    expect(buyClubTip(g, c)).toBe(true);
    expect(clubTip(c).lines.length).toBe(2);
    expect(buyClubTip(g, clubMatchup(g))).toBe(false);
  });
});

describe('calling an exhibition', () => {
  it('pays a right call and nothing for a wrong one', () => {
    const g = game();
    const ex = { w: 1 } as Exhibition;
    const coins = coinsOf(g);
    expect(settleCall(g, ex, 0)).toEqual({ right: false, pay: 0 });
    expect(settleCall(g, ex, 1)).toEqual({ right: true, pay: CALL_PAY });
    expect(coinsOf(g)).toBe(coins + CALL_PAY);
  });
});
