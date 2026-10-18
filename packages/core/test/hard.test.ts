import { describe, expect, it } from 'vitest';
import {
  CHAPTERS,
  HARD_TWISTS,
  LEGACY_BALANCE,
  clockAt,
  coinsOf,
  deserFighter,
  endHard,
  endStoryFight,
  enterCareer,
  fightMods,
  hardChapters,
  hardMutator,
  hardOf,
  makeBoss,
  mainStory,
  mulberry32,
  newChapter,
  newSave,
  randomFighter,
  serFighter,
  startHard,
  storyOf,
  storyOpponent,
  tierUnlocked,
  TIERK,
  useBalance,
  BALANCE,
  type CareerFighter,
  type FightOutcome,
  type FightSpec,
  type Game,
  type Side,
} from '../src';

// Upgrade 26: hard mode for cleared chapters.
function game(seed = 1, ch = 5): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Hero', rng) as CareerFighter);
  g.F!.lvl = CHAPTERS[ch - 1]!.lvl;
  g.F!.story = { ...newChapter(g, ch, 0), cleared: Array.from({ length: ch - 1 }, (_, i) => i + 1), row: 2, hp: 64 } as never;
  return g;
}
const side = (hp: number) => ({ hp, st: { dodges: 0, combos: 0, rps: 0, taken: 30, ults: 0, guards: 0 } }) as unknown as Side;
const out = (w: 0 | 1, hp = 40): FightOutcome => ({ w, me: side(w === 0 ? hp : 0), them: side(w === 1 ? hp : 0), round: 6, sd: false });
const story = (g: Game, node: FightSpec['node'], O: CareerFighter, o: FightOutcome) =>
  endStoryFight(g, { kind: 'story', node, tier: { k: 'story', n: 'Story fight', e: '📖', xpW: 0, coins: 0 }, opp: O, arena: null, odds: 0.5 }, o);

describe('hard mode', () => {
  it('opens only cleared chapters, and the main story waits untouched', () => {
    const g = game();
    expect(hardChapters(g).map((c) => c.ch)).toEqual([1, 2, 3, 4]);
    expect(startHard(g, 5)).toBe(false);
    const before = JSON.stringify(g.F!.story);
    expect(startHard(g, 2)).toBe(true);
    expect(storyOf(g).ch).toBe(2);
    expect(storyOf(g).row).toBe(0);
    expect(storyOf(g).hp).toBe(100);
    expect(hardOf(g)).not.toBeNull();
    expect(HARD_TWISTS.map((m) => m.k)).toContain(hardOf(g)!.mut);
    expect(JSON.stringify(mainStory(g))).toBe(before);
    // one hard run at a time
    expect(startHard(g, 3)).toBe(false);
    // the main story still decides what is unlocked
    expect(tierUnlocked(TIERK.world!, g.F!)).toBe(true);
    // a save in the middle of a hard run keeps both
    const back = deserFighter(serFighter(g.F!))!;
    expect(back.storyMain).toEqual(g.F!.storyMain);
    expect((back.story as { hard?: unknown }).hard).toEqual(hardOf(g));
    endHard(g, false);
    expect(JSON.stringify(g.F!.story)).toBe(before);
    expect(g.F!.storyMain).toBeUndefined();
    expect(g.F!.hardCleared).toBeUndefined();
  });

  it('never draws a twist that sets your HP or forces an arena', () => {
    for (const m of HARD_TWISTS) {
      expect(m.arena).toBeUndefined();
      expect(m.mods[0].hp).toBeUndefined();
    }
    const seen = new Set<string>();
    for (let s = 1; s <= 40; s++) {
      const g = game(s);
      startHard(g, 1);
      seen.add(hardOf(g)!.mut);
      // the twist is in every fight, and your HP still carries
      storyOf(g).hp = 55;
      const m = hardMutator(g)!;
      const [m0, m1] = fightMods(g, { kind: 'story' } as FightSpec);
      expect(m0.hp).toBe(55);
      for (const [k, v] of Object.entries(m.mods[0])) expect((m0 as Record<string, unknown>)[k]).toBe(v);
      for (const [k, v] of Object.entries(m.mods[1])) expect((m1 as Record<string, unknown>)[k]).toBe(v);
    }
    expect(seen.size).toBeGreaterThan(2);
  });

  it('brings stronger fights and a meaner boss', () => {
    const avg = (hard: boolean, f: (g: Game) => number) => {
      let n = 0;
      for (let s = 1; s <= 30; s++) {
        const g = game(s);
        if (hard) startHard(g, 4);
        else g.F!.story = { ...newChapter(g, 4, 0), cleared: [1, 2, 3, 4] } as never;
        n += f(g);
      }
      return n / 30;
    };
    const lvl = (g: Game) => storyOpponent(g, 'fight').lvl || 1;
    expect(avg(true, lvl)).toBeGreaterThan(avg(false, lvl) + 2);
    const bossPts = (g: Game) => {
      const b = makeBoss(g, 4);
      return Object.values(b.bonus as Record<string, number>).reduce((a, x) => a + (typeof x === 'number' ? x : 0), 0);
    };
    expect(avg(true, bossPts)).toBeGreaterThan(avg(false, bossPts));
  });

  it('pays more, and a boss win marks the chapter for good and goes home', () => {
    const g = game(3);
    const main = JSON.stringify(g.F!.story);
    startHard(g, 3);
    const O = randomFighter('Goon', g.rng) as CareerFighter;
    const c0 = coinsOf(g);
    const r = story(g, 'fight', O, out(0));
    expect(r.won).toBe(true);
    expect(storyOf(g).row).toBe(1);
    const hardCoins = coinsOf(g) - c0;
    // the same win in the main story
    const n = game(3);
    n.F!.story = { ...newChapter(n, 3, 0), cleared: [1, 2, 3, 4] } as never;
    const n0 = coinsOf(n);
    story(n, 'fight', randomFighter('Goon', n.rng) as CareerFighter, out(0));
    expect(hardCoins).toBeGreaterThan(coinsOf(n) - n0);
    // the boss
    storyOf(g).row = storyOf(g).rows.length - 1;
    const boss = story(g, 'boss', O, out(0));
    expect(boss.big).toBe('Hard mode cleared');
    expect(boss.next.map((s) => s.t)).toEqual(['loot', 'loot', 'levelups', 'celebrate', 'hub']);
    expect(boss.next[1]).toEqual({ t: 'loot', table: 'treasure' });
    expect(g.F!.hardCleared).toEqual([3]);
    expect(JSON.stringify(g.F!.story)).toBe(main);
    expect(hardChapters(g).find((c) => c.ch === 3)!.done).toBe(true);
  });

  it('runs out of grit without costing coins or the story', () => {
    const g = game(4);
    const main = JSON.stringify(g.F!.story);
    startHard(g, 2);
    const O = randomFighter('Goon', g.rng) as CareerFighter;
    let r = story(g, 'fight', O, out(1));
    for (let i = 0; i < 10 && hardOf(g); i++) {
      const c0 = coinsOf(g);
      r = story(g, 'fight', O, out(1));
      expect(coinsOf(g)).toBeGreaterThanOrEqual(c0);
    }
    expect(hardOf(g)).toBeNull();
    expect(r.next[r.next.length - 1]).toEqual({ t: 'hub' });
    expect(JSON.stringify(g.F!.story)).toBe(main);
    expect(g.F!.hardCleared).toBeUndefined();
  });

  it('leaves the legacy game alone', () => {
    const saved = { ...BALANCE };
    useBalance(LEGACY_BALANCE);
    try {
      const g = game(5);
      const f = serFighter(g.F!);
      expect('storyMain' in f).toBe(false);
      expect('hardCleared' in f).toBe(false);
    } finally {
      useBalance(saved);
    }
  });
});
