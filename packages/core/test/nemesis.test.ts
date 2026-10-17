import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  BALANCE,
  CHAPTERS,
  LEGACY_BALANCE,
  NEM_TAUNTS,
  clockAt,
  endStoryFight,
  endTierFight,
  enterCareer,
  myNemesis,
  mulberry32,
  nemesisOpponent,
  nemesisTaunt,
  newChapter,
  newSave,
  placeNemesis,
  randomFighter,
  rivalsOf,
  storyOf,
  TIERS_T,
  TIERK,
  useBalance,
  type CareerFighter,
  type FightOutcome,
  type FightSpec,
  type Game,
  type Gauntlet,
  type Side,
  type Story,
} from '../src';

// Upgrade 19: the nemesis follows you into the story, remembers your fights and escalates.
function game(seed = 1, ch = 3): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Hero', rng) as CareerFighter);
  g.F!.lvl = CHAPTERS[ch - 1]!.lvl;
  g.F!.story = newChapter(g, ch, 0) as never;
  return g;
}
const side = (hp: number) => ({ hp, st: { dodges: 0, combos: 0, rps: 0, taken: 30, ults: 0, guards: 0 } }) as unknown as Side;
const out = (w: 0 | 1, round = 7, hp = 23): FightOutcome => ({ w, me: side(w === 0 ? hp : 0), them: side(w === 1 ? hp : 0), round, sd: false });
const story = (g: Game, node: FightSpec['node'], O: CareerFighter, o: FightOutcome) =>
  endStoryFight(g, { kind: 'story', node, tier: { k: 'story', n: 'Story fight', e: '📖', xpW: 0, coins: 0 }, opp: O, arena: null, odds: 0.5 }, o);
const pos = (g: Game) => storyOf(g).ch;
/** Moves the story to the next chapter, the way clearing a boss does. */
function nextChapter(g: Game) {
  const S = storyOf(g);
  g.F!.story = { ...newChapter(g, S.ch + 1, 0), cleared: [S.ch] } as never;
}

let saved = { ...BALANCE };
beforeAll(() => {
  saved = { ...BALANCE };
});
afterAll(() => useBalance(saved));

describe('the nemesis in the story', () => {
  it('turns a story loss into a nemesis who remembers the fight', () => {
    const g = game(1);
    const O = randomFighter('Bully', g.rng) as CareerFighter;
    const r = story(g, 'fight', O, out(1, 7, 23));
    const n = myNemesis(g)!;
    expect(n.f.name).toBe('Bully');
    expect(n.log).toEqual([{ w: false, where: 'the City Circuit', r: 7, hp: 23 }]);
    expect(n.at).toBe(pos(g) + 1);
    expect(r.lines.some((l) => l.includes('Bully is now your nemesis'))).toBe(true);
    // a second loss to someone else does not replace them, and a boss never becomes one
    story(g, 'fight', randomFighter('Other', g.rng) as CareerFighter, out(1));
    expect(myNemesis(g)!.f.name).toBe('Bully');
  });

  it('never makes one from a boss, or with the old balance', () => {
    const g = game(2);
    story(g, 'boss', randomFighter('Boss', g.rng) as CareerFighter, out(1));
    expect(myNemesis(g)).toBeNull();
    useBalance({ ...BALANCE, storyNemesis: LEGACY_BALANCE.storyNemesis });
    try {
      story(g, 'fight', randomFighter('Bully', g.rng) as CareerFighter, out(1));
      expect(myNemesis(g)).toBeNull();
    } finally {
      useBalance(saved);
    }
  });

  it('shows up on a fight step of the next chapter, once', () => {
    const g = game(3);
    story(g, 'fight', randomFighter('Bully', g.rng) as CareerFighter, out(1));
    expect(placeNemesis(g)).toBe(false); // not this chapter
    nextChapter(g);
    expect(placeNemesis(g)).toBe(true);
    const S = storyOf(g) as Story;
    const r = S.nemRow!;
    expect(r).toBeGreaterThanOrEqual(2);
    expect(r).toBeLessThan(S.rows.length - 1);
    expect(S.rows[r]).toContain('fight');
    expect(S.rows[r]![S.rows[r]!.length - 1]).toBe('nemesis');
    expect(S.rows.flat().filter((k) => k === 'nemesis')).toHaveLength(1);
    expect(placeNemesis(g)).toBe(false);
  });

  it('notices when you walk past, and says so', () => {
    const g = game(4);
    story(g, 'fight', randomFighter('Bully', g.rng) as CareerFighter, out(1));
    nextChapter(g);
    placeNemesis(g);
    const S = storyOf(g) as Story;
    S.picks[S.nemRow!] = 0;
    S.row = S.nemRow! + 1;
    placeNemesis(g);
    const n = myNemesis(g)!;
    expect(n.dodged).toBe(1);
    expect(n.at).toBe(pos(g) + 1);
    nextChapter(g);
    expect(placeNemesis(g)).toBe(true);
    const t = nemesisTaunt(g);
    expect(t.kind).toBe('dodged');
    expect(NEM_TAUNTS.dodged.flat()).toContain(t.line);
  });

  it('opens with a speech about the last fight, angrier every meeting', () => {
    const g = game(5);
    story(g, 'fight', randomFighter('Bully', g.rng) as CareerFighter, out(1, 9, 31));
    const t = nemesisTaunt(g);
    expect(t.kind).toBe('gloat');
    expect(t.meeting).toBe(1);
    expect(t.record).toBe('They beat you once.');
    // every first-meeting gloat names the place, the round or the HP
    expect(/City Circuit|9|31/.test(t.line)).toBe(true);
    for (const k of Object.keys(NEM_TAUNTS) as (keyof typeof NEM_TAUNTS)[]) {
      const [a, b, c] = NEM_TAUNTS[k];
      expect(a.length && b.length && c.length, k).toBeTruthy();
      expect(new Set([...a, ...b, ...c]).size, k).toBe(a.length + b.length + c.length);
    }
  });

  it('comes back stronger after a loss, and retires after three', () => {
    const g = game(6);
    story(g, 'fight', randomFighter('Bully', g.rng) as CareerFighter, out(1));
    for (let k = 1; k <= 3; k++) {
      nextChapter(g);
      nextChapter(g);
      expect(placeNemesis(g), `meeting ${k}`).toBe(true);
      const before = myNemesis(g)!;
      const o = nemesisOpponent(g);
      expect(o.isNem).toBe(true);
      expect(o.lvl).toBeGreaterThanOrEqual(CHAPTERS[storyOf(g).ch - 1]!.lvl + 1);
      const all = before.f.bonus.str || 0;
      const r = story(g, 'nemesis', o, out(0, 4, 40));
      expect(r.lines.some((l) => l.startsWith('😈'))).toBe(true);
      if (k < 3) {
        const n = myNemesis(g)!;
        expect(n.lost).toBe(k);
        expect(n.met).toBe(k);
        expect(n.at).toBe(pos(g) + 2);
        expect(n.f.bonus.str || 0).toBe(all + 1);
        expect(n.log![n.log!.length - 1]).toMatchObject({ w: true, r: 4, hp: 40 });
        expect(nemesisTaunt(g).kind).toBe(k === 2 ? 'final' : 'revenge');
      } else {
        expect(myNemesis(g)).toBeNull();
        expect(rivalsOf(g).some((x) => x.f.name === 'Bully')).toBe(true);
        expect(r.lines.some((l) => l.includes('+21 🪙'))).toBe(true);
      }
    }
  });

  it('gets a level stronger when they win again', () => {
    const g = game(7);
    story(g, 'fight', randomFighter('Bully', g.rng) as CareerFighter, out(1));
    nextChapter(g);
    placeNemesis(g);
    const o = nemesisOpponent(g);
    const lvl = o.lvl || 1;
    story(g, 'nemesis', o, out(1, 12, 5));
    const n = myNemesis(g)!;
    expect(n.beats).toBe(2);
    expect(n.met).toBe(1);
    expect(n.f.lvl).toBe(lvl + 1);
    expect(n.at).toBe(pos(g) + 1);
    expect(nemesisTaunt(g).kind).toBe('gloat');
  });

  it('remembers a cup loss by its name', () => {
    const g = game(8);
    const O = randomFighter('Champ', g.rng) as CareerFighter;
    const tier = TIERS_T[0]!;
    endTierFight(g, { kind: 'challenge' as never, tier, opp: O, arena: null, odds: 0.5 }, out(1));
    expect(myNemesis(g)).toBeNull(); // challenges never make one
    const run = { kind: 'gauntlet', tier: TIERK.gauntlet!, streak: 0, opp: O, used: new Set<string>() } as Gauntlet;
    endTierFight(g, { kind: 'gauntlet', tier: run.tier, opp: O, arena: null, odds: 0.5, run }, out(1, 5, 12));
    expect(myNemesis(g)!.log).toEqual([{ w: false, where: 'the gauntlet', r: 5, hp: 12 }]);
  });
});
