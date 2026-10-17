import { afterEach, describe, expect, it } from 'vitest';
import {
  BALANCE,
  BOSSES,
  BOSS_HP,
  BOSS_STAT_SHIFT,
  CHAPTERS,
  CH_PCT,
  LEGACY_BALANCE,
  clockAt,
  enterCareer,
  makeBoss,
  mulberry32,
  newChapter,
  newSave,
  randomFighter,
  useBalance,
  type CareerFighter,
  type Game,
} from '../src';

const tuned = { ...BALANCE };
afterEach(() => useBalance(tuned));

function gameAt(ch: number, seed = 1): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Test', rng) as CareerFighter);
  g.F!.story = newChapter(g, ch, 0) as never;
  return g;
}

describe('story balance (Phase 4, upgrade 1)', () => {
  it('has a boss row for every chapter', () => {
    expect(BOSS_HP).toHaveLength(CHAPTERS.length);
    expect(BOSS_STAT_SHIFT).toHaveLength(CHAPTERS.length);
    for (let ch = 1; ch <= CHAPTERS.length; ch++) {
      expect(BALANCE.bossLvl(ch, 0)).toBeGreaterThanOrEqual(1);
      // HP stays in a sane band around the old game's
      expect(BOSS_HP[ch - 1]! / BOSSES[ch - 1]!.maxHp).toBeGreaterThan(0.5);
      expect(BOSS_HP[ch - 1]! / BOSSES[ch - 1]!.maxHp).toBeLessThan(1.7);
    }
  });

  it('builds bosses from the tuned tables', () => {
    const g = gameAt(6);
    const b = makeBoss(g, 6);
    expect(b.maxHp).toBe(BOSS_HP[5]);
    // a boss can only get tougher than its table by the toughening cap
    expect(b.lvl).toBeGreaterThanOrEqual(BALANCE.bossLvl(6, 0));
    expect(b.lvl).toBeLessThanOrEqual(BALANCE.bossLvl(6, 0) + BALANCE.bossTuneCap);
    // stat tiers move by the chapter's shift (clamped to the wheel's 1-14)
    const want = Math.min(14, Math.max(1, BOSSES[5]!.stats.str! + BOSS_STAT_SHIFT[5]!));
    expect((b.str as { v: number }).v).toBe(want);
  });

  it('can switch back to the old game tuning', () => {
    useBalance(LEGACY_BALANCE);
    const b = makeBoss(gameAt(6), 6);
    expect(b.maxHp).toBe(BOSSES[5]!.maxHp);
    expect(b.lvl).toBeGreaterThanOrEqual(CHAPTERS[5]!.lvl + 3);
    expect(BALANCE.chPct(1)).toEqual(CH_PCT[0]);
  });

  it('eases the first chapters only', () => {
    expect(BALANCE.chPct(1)[1]).toBeLessThan(CH_PCT[0]![1]);
    expect(BALANCE.chPct(4)).toEqual(CH_PCT[3]);
    expect(BALANCE.chPct(20)).toEqual(CH_PCT[19]);
  });
});
