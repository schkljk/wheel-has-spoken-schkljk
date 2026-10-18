import { describe, expect, it } from 'vitest';
import {
  clockAt,
  endTowerFight,
  enterCareer,
  mulberry32,
  newSave,
  randomFighter,
  towerBest,
  towerMutator,
  towerOpponent,
  type CareerFighter,
  type FightOutcome,
  type Game,
  type Side,
  type TowerState,
} from '../src';

// Upgrade 25: the endless tower.
function game(seed = 1): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Climber', rng) as CareerFighter);
  g.F!.lvl = 12;
  return g;
}
const side = (hp: number) => ({ hp, st: { dodges: 0, combos: 0, rps: 0, taken: 0, ults: 0, guards: 0 } }) as unknown as Side;
const out = (w: 0 | 1, hp = 50): FightOutcome => ({ w, me: side(w === 0 ? hp : 0), them: side(w === 1 ? hp : 0), round: 5, sd: false });

describe('the endless tower', () => {
  it('adds a twist every five floors, the same for the whole block', () => {
    const T: TowerState = { floor: 1, hp: 100, seed: 1234 };
    for (let f = 1; f <= 4; f++) expect(towerMutator(T, f)).toBeNull();
    for (const start of [5, 10, 15, 20]) {
      const m = towerMutator(T, start);
      expect(m).not.toBeNull();
      for (let f = start; f < start + 5; f++) expect(towerMutator(T, f)).toBe(m);
    }
    const seen = new Set(Array.from({ length: 40 }, (_, s) => towerMutator({ floor: 5, hp: 100, seed: s * 7919 }, 5)!.k));
    expect(seen.size).toBeGreaterThan(3);
  });

  it('gets harder the higher you go', () => {
    const g = game();
    const lv = (floor: number) => {
      let n = 0;
      for (let i = 0; i < 20; i++) n += towerOpponent(g, { floor, hp: 100, seed: 1 }).lvl || 1;
      return n / 20;
    };
    expect(lv(20)).toBeGreaterThan(lv(1) + 3);
  });

  it('carries HP up, pays per floor, and keeps the record', () => {
    const g = game();
    const T: TowerState = { floor: 1, hp: 100, seed: 5 };
    const O = randomFighter('Guard', g.rng) as CareerFighter;
    const r = endTowerFight(g, T, O, out(0, 40));
    expect(T.floor).toBe(2);
    expect(T.hp).toBe(70);
    expect(r.next).toEqual([{ t: 'tower' }]);
    expect(towerBest(g)).toEqual({ floor: 1, who: 'Climber' });
    // every fifth floor's landing is a full rest
    T.floor = 4;
    endTowerFight(g, T, O, out(0, 10));
    expect(T.hp).toBe(100);
    // the tenth floor's landing has a chest
    T.floor = 10;
    const ten = endTowerFight(g, T, O, out(0, 90));
    expect(ten.next[0]).toEqual({ t: 'loot', table: 'elite' });
    // a loss costs a heart and you go again; the last heart ends it and keeps the best
    const floor = T.floor;
    const down = endTowerFight(g, T, O, out(1));
    expect(down.next).toEqual([{ t: 'tower' }]);
    expect(T).toMatchObject({ floor, hp: 60, lives: 2 });
    endTowerFight(g, T, O, out(1));
    const lost = endTowerFight(g, T, O, out(1));
    expect(lost.won).toBe(false);
    expect(lost.next.map((s) => s.t)).toEqual(['levelups', 'hub']);
    expect(g.F!.towerBest).toBe(10);
    expect(towerBest(g).floor).toBe(10);
  });
});
