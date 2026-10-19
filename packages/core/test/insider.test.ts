import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  CALL_PAY,
  CLUB_TUNE,
  clubFight,
  clubWaiting,
  useBalance,
  addCoins,
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
  addCoins(g, 100);
  return g;
}

describe('the fight club insider', () => {
  it('pays by the bookie line, which is often off from the real odds', () => {
    const g = game();
    let off = 0;
    for (let i = 0; i < 20; i++) {
      // a matchup stays up until a bet (review K2): take it down to see the next one
      delete g.save.profile.extra.club;
      const c = clubMatchup(g);
      expect(c.line).toBeGreaterThanOrEqual(0.06);
      expect(c.line).toBeLessThanOrEqual(0.94);
      // within 10 points of the real odds since review K2 (20 before)
      if (Math.abs(c.line! - c.pA) >= 0.04) off++;
    }
    expect(off).toBeGreaterThan(5);
    const c = clubMatchup(g);
    c.bet = 10;
    const coins = coinsOf(g);
    const r = clubSettle(g, c, 'A', 0);
    expect(r.mult).toBe(clubMult(clubLine(c)));
    expect(r.pay).toBe(Math.round(10 * r.mult));
    // (a goal for betting may pay on top)
    expect(coinsOf(g)).toBeGreaterThanOrEqual(coins + r.pay);
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
    // the matchup is still up, tipped (K2); after a bet, a new one needs a new tip
    expect(clubMatchup(g).tipped).toBe(true);
    c.bet = 5;
    expect(clubFight(g, c)).not.toBeNull();
    expect(buyClubTip(g, clubMatchup(g))).toBe(false);
  });
});

// Review round 2, K2: a tighter line, a smaller payout, an insider with words only, no free re-rolls.
describe('the fight club, tightened', () => {
  it('keeps a matchup on the board until a bet is placed', () => {
    const g = game();
    const a = clubMatchup(g);
    expect(clubWaiting(g)).toBe(true);
    const b = clubMatchup(g);
    expect([b.A.name, b.B.name, b.pA, b.line]).toEqual([a.A.name, a.B.name, a.pA, a.line]);
    // the fighters come back whole: same numbers, same build
    expect(b.A.lvl).toBe(a.A.lvl);
    expect(Object.values(b.A.gear || {})).toEqual(Object.values(a.A.gear || {}));
    b.bet = 5;
    expect(clubFight(g, b)).not.toBeNull();
    expect(clubWaiting(g)).toBe(false);
    expect(clubMatchup(g).A.name + clubMatchup(g).B.name).not.toBe(a.A.name + a.B.name);
  });
  it('pays 0.88 over the odds, with a line within 10 points', () => {
    expect(clubMult(0.5)).toBe(Math.round((0.88 / 0.5) * 10) / 10);
    const g = game();
    for (let i = 0; i < 20; i++) {
      delete g.save.profile.extra.club;
      const c = clubMatchup(g);
      expect(Math.abs(c.line! - c.pA)).toBeLessThanOrEqual(CLUB_TUNE.noise[1] / 2 + 1e-9);
    }
  });
  it('the insider gives the odds in words and names no side to back', () => {
    const g = game();
    for (let i = 0; i < 12; i++) {
      delete g.save.profile.extra.club;
      const c = clubMatchup(g);
      const [odds, shrug] = clubTip(c).lines;
      expect(odds).toContain(c.A.name);
      expect(shrug).not.toContain(c.A.name);
      expect(shrug).not.toContain(c.B.name);
      expect(`${odds} ${shrug}`).not.toMatch(/\d+%/);
    }
  });
  it('plays the old club with the switch off', () => {
    const keep = { ...BALANCE };
    useBalance({ clubTight: false });
    try {
      expect(clubMult(0.5)).toBe(1.8);
      const g = game();
      clubMatchup(g);
      expect(clubWaiting(g)).toBe(false);
    } finally {
      useBalance(keep);
    }
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
