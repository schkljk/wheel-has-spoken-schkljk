import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  useBalance,
  TRIAL_COUNT,
  clockAt,
  endTrialFight,
  enterCareer,
  mulberry32,
  newBattle,
  newSave,
  phaseKits,
  phaseSlice,
  randomFighter,
  trialBoss,
  trialLevel,
  trialsCleared,
  trialsOpen,
  type CareerFighter,
  type FightOutcome,
  type Game,
} from '../src';

// Review F12: an endgame of remixed bosses, levels 32 to 41 since review K5 (34 to 50 before).
function game(lvl = 34): Game {
  const rng = mulberry32(3);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  const f = randomFighter('Veteran', rng) as CareerFighter;
  enterCareer(g, f);
  g.F = f;
  f.lvl = lvl;
  return g;
}

describe('the Wheelborn trials', () => {
  it('open at level 32, a level a trial from 32 to 41 (K5)', () => {
    expect(trialsOpen(game(31))).toBe(false);
    expect(trialsOpen(game(32))).toBe(true);
    expect(trialLevel(0)).toBe(32);
    expect(trialLevel(TRIAL_COUNT - 1)).toBe(41);
    expect(Array.from({ length: TRIAL_COUNT }, (_, i) => trialLevel(i))).toEqual([32, 33, 34, 35, 36, 37, 38, 39, 40, 41]);
  });
  it('kept the old ladder, 34 to 50, with the switch off', () => {
    const keep = { ...BALANCE };
    useBalance({ trialLadder: false });
    try {
      expect(trialsOpen(game(33))).toBe(false);
      expect(trialsOpen(game(34))).toBe(true);
      expect(trialLevel(0)).toBe(34);
      expect(trialLevel(TRIAL_COUNT - 1)).toBe(50);
    } finally {
      useBalance(keep);
    }
  });
  it("remix a boss with two other bosses' phase kits, both on the wheel in phase two", () => {
    const g = game();
    for (let i = 0; i < TRIAL_COUNT; i++) {
      const b = trialBoss(g, i);
      expect(b.isBoss).toBe(true);
      expect(phaseKits(b)).toHaveLength(2);
    }
    const b = trialBoss(g, 0);
    const bt = newBattle(g.F!, b, mulberry32(1), { quiet: true });
    bt.start();
    bt.P[1].phased = 1;
    const [k1, k2] = phaseKits(b);
    const s1 = phaseSlice(bt, k1!.slice.fam, []);
    expect(s1?.n).toBe(k1!.slice.n);
    // landing the first leaves the second
    if (k1!.slice.fam === k2!.slice.fam) expect(phaseSlice(bt, k2!.slice.fam, [k1!.slice.n])?.n).toBe(k2!.slice.n);
    else expect(phaseSlice(bt, k2!.slice.fam, [k1!.slice.n])?.n).toBe(k2!.slice.n);
    expect(phaseSlice(bt, k1!.slice.fam, [k1!.slice.n, k2!.slice.n])).toBeNull();
  });
  it('open one by one, and pay gems for a first clear only', () => {
    const g = game();
    const b = trialBoss(g, 0);
    const win = { w: 0, me: { f: g.F, hp: 50, maxHp: 100 }, round: 9, sd: false } as unknown as FightOutcome;
    const gems = g.save.profile.gems || 0;
    endTrialFight(g, 0, b, win);
    expect(trialsCleared(g)).toBe(1);
    const after = g.save.profile.gems;
    expect(after).toBeGreaterThan(gems);
    endTrialFight(g, 0, b, win);
    expect(g.save.profile.gems).toBe(after);
    expect(trialsCleared(g)).toBe(1);
    endTrialFight(g, 1, trialBoss(g, 1), { ...win, w: 1 } as FightOutcome);
    expect(trialsCleared(g)).toBe(1);
  });
});
