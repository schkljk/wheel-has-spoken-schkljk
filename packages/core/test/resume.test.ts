import { describe, expect, it } from 'vitest';
import {
  addLevelSpin,
  levelSpins,
  levelSpinsPerLevel,
  levelUpItem,
  levelUpLand,
  clockAt,
  clearBuild,
  clearNode,
  enterCareer,
  headToHead,
  lastPlace,
  markNode,
  mulberry32,
  newChapter,
  newSave,
  nodeEvent,
  nodeFoe,
  pendingNode,
  pendingSteps,
  pushStep,
  randomFighter,
  saveBuild,
  savedBuild,
  setPendingSteps,
  setPlace,
  stepDone,
  storyOf,
  type CareerFighter,
  type Game,
} from '../src';

// Review items A4 and B5: nothing in progress is lost or re-rolled when the app closes.
function game(seed = 5): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Keeper', rng) as CareerFighter);
  g.save.roster.active = 0;
  g.F!.story = newChapter(g, 4, 0) as never;
  return g;
}

describe('the steps after a fight', () => {
  it('are kept until each is done, a gear choice going first', () => {
    const g = game();
    setPendingSteps(g, [{ t: 'loot', table: 'normal' }, { t: 'levelups' }, { t: 'map' }]);
    expect(pendingSteps(g).map((s) => s.t)).toEqual(['loot', 'levelups', 'map']);
    // the loot lands on a piece that needs a choice: the loot is done, the choice comes before the rest
    stepDone(g);
    pushStep(g, { t: 'gear', k: 'knight_plate' });
    expect(pendingSteps(g).map((s) => s.t)).toEqual(['gear', 'levelups', 'map']);
    stepDone(g);
    stepDone(g);
    stepDone(g);
    expect(pendingSteps(g)).toEqual([]);
  });
  it('belong to one fighter', () => {
    const g = game();
    setPendingSteps(g, [{ t: 'reward' }]);
    g.save.roster.active = 1;
    expect(pendingSteps(g)).toEqual([]);
    g.save.roster.active = 0;
    expect(pendingSteps(g)).toEqual([{ t: 'reward' }]);
  });
  it('survive a save round trip', () => {
    const g = game();
    setPendingSteps(g, [{ t: 'gear', k: 'x' }]);
    setPlace(g, 'map');
    const copy = JSON.parse(JSON.stringify(g.save));
    const h = { ...g, save: copy };
    expect(pendingSteps(h)).toEqual([{ t: 'gear', k: 'x' }]);
    expect(lastPlace(h)).toBe('map');
  });
});

describe('a story step in progress', () => {
  it('keeps the opponent it rolled', () => {
    const g = game();
    markNode(g, 1);
    const a = nodeFoe(g, 'fight');
    const b = nodeFoe(g, 'fight');
    expect(b.name).toBe(a.name);
    expect(b.lvl).toBe(a.lvl);
    expect(b.aiSkill).toBe(a.aiSkill);
    expect(headToHead(g.F!, b, mulberry32(3), 40)).toBe(headToHead(g.F!, a, mulberry32(3), 40));
    expect(pendingNode(g)).toBe(1);
  });
  it('keeps the encounter it drew', () => {
    const g = game();
    markNode(g, 0);
    const a = nodeEvent(g);
    expect(nodeEvent(g).k).toBe(a.k);
  });
  it('is forgotten once the map moves on, or when cleared', () => {
    const g = game();
    markNode(g, 0);
    storyOf(g).row++;
    expect(pendingNode(g)).toBeNull();
    markNode(g, 2);
    clearNode(g);
    expect(pendingNode(g)).toBeNull();
  });
});

describe('a fighter being built', () => {
  it('is kept until it starts a career or is scrapped', () => {
    const g = game();
    saveBuild(g, { name: 'Half', race: { n: 'Human' } }, 3, false);
    expect(savedBuild(g)).toMatchObject({ idx: 3, done: false, f: { name: 'Half' } });
    clearBuild(g);
    expect(savedBuild(g)).toBeNull();
  });
});

describe('a level-up being picked (F4, a second opinion)', () => {
  it('keeps the spins landed so far until one is kept', () => {
    const g = game();
    g.F!.pendingLv = 1;
    expect(levelSpinsPerLevel()).toBe(2);
    addLevelSpin(g, 'str');
    // closing the app here keeps the first spin
    const h = { ...g, save: JSON.parse(JSON.stringify(g.save)) };
    expect(levelSpins(h)).toEqual(['str']);
    addLevelSpin(g, 'awaken');
    expect(levelSpins(g)).toEqual(['str', 'awaken']);
    levelUpLand(g, levelUpItem('str')!);
    expect(levelSpins(g)).toEqual([]);
    expect(g.F!.pendingLv).toBe(0);
  });
  it("stays with its fighter: another fighter's map or steps don't inherit it (G16)", () => {
    const g = game();
    addLevelSpin(g, 'str');
    g.save.roster.active = 1;
    setPlace(g, 'map');
    expect(levelSpins(g)).toEqual([]);
    setPendingSteps(g, [{ t: 'levelups' }]);
    expect(levelSpins(g)).toEqual([]);
  });
});
