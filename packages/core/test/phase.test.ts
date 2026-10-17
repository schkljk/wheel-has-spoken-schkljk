import { describe, expect, it } from 'vitest';
import {
  BOSSES,
  BOSS_PHASE,
  clockAt,
  enterCareer,
  makeBoss,
  mulberry32,
  newBattle,
  newChapter,
  newSave,
  phaseKitOf,
  phaseSlice,
  randomFighter,
  type CareerFighter,
  type Game,
  type Move,
} from '../src';

// Upgrade 10: a boss in phase two changes the arena's light and music and adds one slice, once, to the
// player's combat wheel.

function bossFight(ch: number, seed = 1) {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Hero', rng) as CareerFighter);
  g.F!.story = newChapter(g, ch, 0) as never;
  const boss = makeBoss(g, ch);
  const bt = newBattle(g.F!, boss, rng, { mods: [{ hp: 100 }, { maxHp: boss.maxHp }], maxRounds: 30, suddenDeath: true });
  bt.start();
  return { bt, boss };
}

const FAMILY: Record<string, string[]> = { atk: ['strike', 'feint'], def: ['guard', 'dodge', 'focus'], pow: ['power', 'focus'] };

describe('boss phase two', () => {
  it('has a kit for every boss: a light, a tune and a slice with a joke', () => {
    expect(BOSS_PHASE).toHaveLength(BOSSES.length);
    for (const k of BOSS_PHASE) {
      expect(k.light).toBeGreaterThan(0);
      expect(k.tune.root).toBeGreaterThan(20);
      expect(k.tune.bpm).toBeGreaterThan(60);
      expect(FAMILY[k.slice.fam]).toContain(k.slice.c);
      expect(k.slice.d.length).toBeGreaterThan(8);
      expect(k.slice.flavor.length).toBeGreaterThan(8);
    }
    expect(new Set(BOSS_PHASE.map((k) => k.slice.n)).size).toBe(BOSS_PHASE.length);
  });

  it('adds the slice only in phase two, only to its wheel, and only until it is used', () => {
    for (let ch = 1; ch <= BOSSES.length; ch++) {
      const { bt, boss } = bossFight(ch);
      const kit = phaseKitOf(boss)!;
      expect(kit).toBe(BOSS_PHASE[ch - 1]);
      expect(phaseSlice(bt, kit.slice.fam, false)).toBeNull();
      bt.P[1].hp = bt.P[1].maxHp * 0.4;
      bt.step('guard', 'guard', {}, {});
      expect(bt.P[1].phased).toBe(1);
      const s = phaseSlice(bt, kit.slice.fam, false)!;
      expect(s.n).toBe(kit.slice.n);
      expect(s.q).toBe(3);
      for (const f of ['atk', 'def', 'pow'] as const) if (f !== kit.slice.fam) expect(phaseSlice(bt, f, false)).toBeNull();
      expect(phaseSlice(bt, kit.slice.fam, true)).toBeNull();
      // the engine plays it like any slice and names it in the log
      const evs = bt.over ? [] : bt.step(s.c as Move, 'strike', { ...s.m }, {});
      if (evs.length && !bt.P[0].frozen) expect(evs.map((e) => e.text).join('\n')).toContain(s.n);
    }
  });

  it('no regular opponent has one', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 50; i++) expect(phaseKitOf(randomFighter('X', rng))).toBeNull();
  });
});
