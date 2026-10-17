import { describe, expect, it } from 'vitest';
import {
  EVENT_TALK,
  SEVENTS,
  charismaOf,
  clockAt,
  coinsOf,
  enterCareer,
  eventOption,
  mulberry32,
  newChapter,
  newSave,
  randomFighter,
  storyOf,
  talkOf,
  type CareerFighter,
  type Game,
} from '../src';

// Upgrade 17: charisma unlocks an extra option in every story encounter.
function game(cha: number, seed = 1): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Talker', rng) as CareerFighter);
  g.F!.story = newChapter(g, 1, 0) as never;
  g.save.roster.slots[0]!.coins = 100;
  // set the shown charisma (the stat x5) to `cha`
  g.F!.bonus = { ...(g.F!.bonus || {}), cha: 0 };
  g.F!.bonus.cha = Math.round(cha / 5) - Math.round(charismaOf(g) / 5);
  delete (g.F as { _eff?: unknown })._eff;
  return g;
}

describe('charisma in story events', () => {
  it('gives every encounter a charisma option, from 30 to 60', () => {
    for (const ev of SEVENTS) {
      const t = EVENT_TALK[ev.k];
      expect(t, ev.k).toBeTruthy();
      expect(t!.need).toBeGreaterThanOrEqual(30);
      expect(t!.need).toBeLessThanOrEqual(60);
      expect(t!.l.length).toBeGreaterThan(3);
      expect(t!.s.length).toBeGreaterThan(3);
    }
  });

  it('locks below the charisma it needs and opens at it', () => {
    const lo = game(25);
    const hi = game(60);
    expect(charismaOf(lo)).toBeLessThan(30);
    expect(charismaOf(hi)).toBeGreaterThanOrEqual(60);
    for (const ev of SEVENTS) {
      expect(talkOf(lo, ev.k)!.ok, ev.k).toBe(false);
      expect(talkOf(hi, ev.k)!.ok, ev.k).toBe(true);
    }
  });

  it('does what it says', () => {
    for (const ev of SEVENTS) {
      const g = game(60, 3);
      const coins = coinsOf(g);
      storyOf(g).hp = 50;
      const r = eventOption(g, ev.k, ev.o.length);
      if (ev.k === 'box') expect(r).toEqual({ loot: 'treasure', bit: 0 });
      else expect('txt' in r && r.txt.length > 0, ev.k).toBe(true);
      if (ev.k === 'promoter') expect(coinsOf(g)).toBe(coins + 25);
      if (ev.k === 'doctor') expect(storyOf(g).hp).toBe(100);
      if (ev.k === 'smith') expect(coinsOf(g)).toBe(coins - 6);
      if (ev.k === 'shrine') expect(storyOf(g).hp).toBe(90);
      if (ev.k === 'street' || ev.k === 'ambush') expect('fight' in r).toBe(false);
    }
  });
});
