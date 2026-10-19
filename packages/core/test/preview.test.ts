import { describe, expect, it } from 'vitest';
import { BOSSES, CHAPTERS, clockAt, enterCareer, mulberry32, newChapter, newSave, foeLevels, nodePreview, randomFighter, recLevel, startHard, storyPay, type CareerFighter, type Game, type NodeKind } from '../src';

// Upgrade 34: tap a step on the story map to see what it holds.
function game(ch = 4): Game {
  const rng = mulberry32(8);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Scout', rng) as CareerFighter);
  g.F!.lvl = 5;
  g.F!.story = { ...newChapter(g, ch, 0), cleared: Array.from({ length: ch - 1 }, (_, i) => i + 1) } as never;
  return g;
}

describe('story map previews', () => {
  it('describe every kind of step', () => {
    const g = game();
    for (const k of ['fight', 'elite', 'event', 'rest', 'shop', 'treasure', 'boss', 'nemesis'] as NodeKind[]) {
      const p = nodePreview(g, k);
      expect(p.n.length, k).toBeGreaterThan(2);
      expect(p.lines.length, k).toBeGreaterThan(0);
      for (const l of p.lines) expect(l, k).not.toMatch(/undefined|NaN/);
    }
  });

  it('quote what a win actually pays', () => {
    const g = game(6);
    const pay = storyPay('elite', 6);
    // the first line says the level match-up, the second what a win pays
    expect(nodePreview(g, 'elite').lines[1]).toBe(`Win: about ${pay.xp} XP, ${pay.coins} 🪙 and ${pay.fame} fame`);
  });

  it("say the opponents' level against yours, and where the next campfire is", () => {
    const g = game(6);
    const [a, b] = foeLevels(g, 'fight');
    expect(b - a).toBe(1);
    expect(a).toBe(CHAPTERS[5]!.lvl - 1);
    expect(nodePreview(g, 'fight').lines[0]).toBe(`Their level: ${a}–${b}. You are level 5: ${a - 5} below them`);
    const S = g.F!.story as { rows: string[][] };
    const camp = S.rows.findIndex((r) => r.includes('rest'));
    expect(camp).toBeGreaterThan(0);
    const last = nodePreview(g, 'fight', camp - 1).lines.at(-1);
    expect(last).toBe('🔥 A campfire right after this');
    expect(nodePreview(g, 'fight', 0).lines.at(-1)).toMatch(/^🔥 (A campfire right after this|Next campfire: \d+ steps on)$/);
  });

  it("show the boss's recommended level, and how far short you are", () => {
    const g = game(6);
    const p = nodePreview(g, 'boss');
    expect(p.n).toBe(BOSSES[5]!.name);
    expect(recLevel(g)).toBe(CHAPTERS[5]!.lvl);
    expect(p.lines[0]).toBe(`Recommended level ${CHAPTERS[5]!.lvl}. You are level 5: ${CHAPTERS[5]!.lvl - 5} short`);
    expect(p.lines[1]).toMatch(`${2 + 2} gems`);
  });

  it('on hard: three levels more, half again the coins, more gems and a treasure spin', () => {
    const g = game(5);
    startHard(g, 2);
    expect(recLevel(g)).toBe(CHAPTERS[1]!.lvl + 3);
    const b = nodePreview(g, 'boss');
    expect(b.lines[1]).toMatch(/, 5 gems and a boss loot spin, plus a treasure spin/);
    expect(nodePreview(g, 'fight').lines[0]).toMatch(/^Their level: /);
    expect(nodePreview(g, 'fight').lines[1]).toContain(`${Math.round(storyPay('fight', 2).coins * 1.5)} 🪙`);
  });
});
