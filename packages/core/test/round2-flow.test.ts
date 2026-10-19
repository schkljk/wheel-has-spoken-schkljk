import { describe, expect, it } from 'vitest';
import {
  clockAt,
  enterCareer,
  ensureSeen,
  isNew,
  levelUpItem,
  levelUpPreview,
  mulberry32,
  newChapter,
  newOnMore,
  newOnPlay,
  newSave,
  newlyOpen,
  noteUnlocks,
  numStats,
  ctxOf,
  randomFighter,
  seeNew,
  tabDots,
  unlocked,
  type CareerFighter,
  type Game,
  type Step,
} from '../src';

// Review round 2, flow and clarity (H items).
function game(seed = 5, lvl = 3): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Keeper', rng) as CareerFighter);
  g.save.roster.active = 0;
  g.F!.lvl = lvl;
  g.F!.story = newChapter(g, 1, 0) as never;
  return g;
}
const clear = (g: Game, ch: number) => ((g.F!.story as unknown as { cleared: number[] }).cleared ??= []).push(ch);

describe('H1: modes say when they open', () => {
  it('what was open before the ribbons counts as seen; what opens later is new until it is opened', () => {
    const g = game();
    clear(g, 1);
    const before = unlocked(g).map((u) => u.k);
    expect(before).toContain('tower');
    expect(before).not.toContain('rush');
    ensureSeen(g);
    expect(isNew(g, 'tower')).toBe(false);
    expect(newOnPlay(g)).toBe(false);
    // chapter 2 cleared: the boss rush opens
    clear(g, 2);
    expect(isNew(g, 'rush')).toBe(true);
    expect(newOnPlay(g)).toBe(true);
    expect(tabDots(g).play).toBe(true);
    seeNew(g, 'rush');
    expect(isNew(g, 'rush')).toBe(false);
    expect(newOnPlay(g)).toBe(false);
  });
  it('a locked mode is never new, and the More tab says hello once', () => {
    const g = game();
    ensureSeen(g);
    expect(isNew(g, 'rush')).toBe(false);
    expect(newOnMore(g)).toBe(true);
    expect(tabDots(g).more).toBe(true);
    seeNew(g, 'locker');
    seeNew(g, 'ghosts');
    expect(tabDots(g).more).toBe(false);
  });
  it("a fight's result names what it opened, on its lines and on the chapter card", () => {
    const g = game();
    const before = unlocked(g);
    clear(g, 1);
    clear(g, 2);
    const r = { lines: ['🪙 +12'], next: [{ t: 'celebrate', icon: '🏟️', title: 'Chapter 2 cleared', sub: 'Next up: The City Circuit' }, { t: 'map' }] as Step[] };
    noteUnlocks(r, newlyOpen(before, unlocked(g)));
    expect(r.lines).toEqual(['🪙 +12', '🔓 Unlocked: Boss rush', '🔓 Unlocked: Endless tower', '🔓 Unlocked: Hard mode']);
    expect((r.next[0] as { sub: string }).sub).toBe('Next up: The City Circuit. Unlocked: Boss rush, Endless tower, Hard mode');
  });
});

describe('H4: the level-up pick shows the real numbers', () => {
  it('old → new for a stat slice, nothing for an upgrade spin, and the fighter is untouched', () => {
    const g = game(7, 8);
    const now = numStats(g.F!, ctxOf(g));
    const p = levelUpPreview(g, levelUpItem('str2')!)!;
    expect(p.a).toEqual(now);
    expect(p.b.atk).toBeGreaterThan(p.a.atk);
    expect(numStats(g.F!, ctxOf(g))).toEqual(now);
    expect(levelUpPreview(g, levelUpItem('awaken')!)).toBe(null);
    expect(levelUpPreview(g, levelUpItem('arsenal')!)).toBe(null);
  });
});
