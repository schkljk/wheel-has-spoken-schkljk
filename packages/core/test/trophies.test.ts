import { describe, expect, it } from 'vitest';
import {
  CHAPTERS,
  MASTERY,
  clockAt,
  enterCareer,
  mulberry32,
  newChapter,
  newSave,
  noteBelt,
  noteBoss,
  persistFighter,
  randomFighter,
  trophiesOf,
  trophyShelves,
  type CareerFighter,
  type Game,
} from '../src';

// Upgrade 23: the trophy room counts belts and bosses across every fighter, and shows titles and mastery.
function game(): Game {
  const rng = mulberry32(5);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Champ', rng) as CareerFighter);
  return g;
}

describe('the trophy room', () => {
  it('starts from what the fighters already hold, once', () => {
    const g = game();
    g.F!.belts = { local: true, regional: false };
    g.F!.story = { ...newChapter(g, 3, 0), cleared: [1, 2, 2] } as never;
    persistFighter(g);
    const t = trophiesOf(g);
    expect(Object.keys(t.belts)).toEqual(['local']);
    expect(t.belts.local!.n).toBe(1);
    expect(Object.keys(t.bosses).sort()).toEqual(['1', '2']);
    // later changes to the fighter don't count twice: only new wins do
    g.F!.belts.world = true;
    persistFighter(g);
    expect(trophiesOf(g).belts.world).toBeUndefined();
  });

  it('counts belts and boss kills as they happen, and remembers who was first', () => {
    const g = game();
    noteBelt(g, 'world', g.F!);
    noteBelt(g, 'world', { ...g.F!, name: 'Someone Else' } as CareerFighter);
    noteBoss(g, 20, g.F!);
    const t = trophiesOf(g);
    expect(t.belts.world!.n).toBe(2);
    expect(t.belts.world!.who).toContain('Champ');
    expect(t.bosses['20']!.n).toBe(1);
  });

  it('lays out the shelves', () => {
    const g = game();
    g.save.profile.ach = { giant: true, story1: true };
    g.save.profile.mastery = { tank: MASTERY[MASTERY.length - 1]!, mage: MASTERY[0]! };
    noteBoss(g, 1, g.F!);
    const s = trophyShelves(g);
    expect(s.belts.map((b) => b.k)).toEqual(['local', 'regional', 'world']);
    expect(s.bosses).toHaveLength(CHAPTERS.length);
    expect(s.bosses[0]!.won).toBeTruthy();
    // boss titles live on the boss shelf, not the titles one
    expect(s.titles.some((t) => t.k === 'story1')).toBe(false);
    expect(s.titles.find((t) => t.k === 'giant')!.won).toBe(true);
    expect(s.classes.find((c) => c.k === 'tank')!.lvl).toBe(MASTERY.length);
    expect(s.classes.find((c) => c.k === 'mage')!.lvl).toBe(1);
  });
});
