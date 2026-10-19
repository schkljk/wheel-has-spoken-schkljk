import { describe, expect, it } from 'vitest';
import {
  WAGER_HP,
  canClaim,
  endStoryFight,
  wagerFight,
  autoChoice,
  clockAt,
  deserFighter,
  endFightRec,
  enterCareer,
  fightRec,
  fightUnder,
  loadCareer,
  mulberry32,
  newChapter,
  newSave,
  noteFight,
  openFight,
  persistFighter,
  randomFighter,
  recordRound,
  repair,
  serFighter,
  startBattle,
  startMods,
  storyOpponent,
  type Battle,
  type CareerFighter,
  type FightSpec,
  type Game,
  type Json,
  type SaveData,
} from '../src';

// Review G2: closing the app mid-fight is not a free retry. The fight's dice and every round are kept, and
// opening it again plays the same fight to where it was.
function game(seed = 5): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Keeper', rng) as CareerFighter);
  g.save.roster.active = 0;
  g.F!.lvl = 8;
  g.F!.story = newChapter(g, 2, 0) as never;
  return g;
}
/** The same save opened again: a new launch, with new launch dice. */
function reopen(save: SaveData, seed: number): Game {
  const s = JSON.parse(JSON.stringify(save)) as SaveData;
  const g: Game = { save: s, F: null, rng: mulberry32(seed), clock: clockAt(), pool: null, notes: [] };
  g.F = loadCareer(s.roster.slots[0], s.profile);
  return g;
}
const TIER = { k: 'story', n: 'Story fight', e: '📖', xpW: 0, coins: 0 };

/** Opens a fight the way the game does: its record first, then the battle from the record's dice. */
function open(g: Game, opp: CareerFighter) {
  const rec = openFight(g, 'story', opp.name);
  const spec = { kind: 'story', node: 'fight', tier: TIER, opp, arena: null, odds: 0.5, seed: rec.seed, wheelSeed: rec.wheel, ...(rec.mods ? { mods: rec.mods } : {}) } as FightSpec;
  if (!spec.mods) noteFight(g, { mods: (spec.mods = startMods(g, spec)) as unknown as Json });
  const bt = startBattle(g, spec);
  bt.start();
  // the combat wheel's dice, counted
  const r = mulberry32(rec.wheel);
  const dice = { n: 0, next: () => (dice.n++, r()) };
  return { rec, bt, dice };
}
/** One round as the fight screen plays it on auto-battle: the opponent plans, the wheel picks, and it is kept. */
function round(g: Game, bt: Battle, dice: { n: number; next: () => number }) {
  bt.plan();
  const c = autoChoice(dice.next, bt.P[0], bt.P[1], bt.hist[1]);
  bt.step(c);
  recordRound(g, { c, auto: true }, dice.n);
}
const state = (bt: Battle) => ({ r: bt.round, hp: bt.P.map((p) => p.hp), en: bt.P.map((p) => p.en), w: bt.w, over: bt.over });

describe('a fight under way (G2)', () => {
  it('picks up where it was after the app closes, and ends the same', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const g = game(seed);
      // a next-fight buff is used up when the fight starts: the record keeps it for the fight
      g.F!.next = { dmgX: 0.15 } as never;
      const opp = storyOpponent(g, 'fight');
      const a = open(g, opp);
      for (let i = 0; i < 3 && !a.bt.over; i++) round(g, a.bt, a.dice);
      persistFighter(g);
      const mid = state(a.bt);

      // the app closes; it opens again with other launch dice, and the same fight is entered
      const g2 = reopen(g.save, 1000 + seed);
      const opp2 = deserFighter(serFighter(opp))!;
      expect(g2.F!.next ?? null).toBe(null);
      const rec = fightUnder(g2, 'story', opp2.name)!;
      expect(rec.moves.length).toBe(Math.min(3, mid.r));
      const b = open(g2, Object.assign(opp2, { aiSkill: opp.aiSkill }));
      expect(b.rec.seed).toBe(a.rec.seed);
      for (const mv of rec.moves) {
        b.bt.plan();
        b.bt.step(mv.c as never);
      }
      while (b.dice.n < rec.dn) b.dice.next();
      expect(state(b.bt)).toEqual(mid);

      // both play on: the same fight, the same end
      while (!a.bt.over) round(g, a.bt, a.dice);
      while (!b.bt.over) round(g2, b.bt, b.dice);
      expect(state(b.bt)).toEqual(state(a.bt));
    }
  });
  it('is the one fight: another opponent gets fresh dice, and the result clears it', () => {
    const g = game(3);
    const o1 = storyOpponent(g, 'fight');
    const r1 = openFight(g, 'story', o1.name);
    expect(openFight(g, 'story', o1.name)).toBe(r1);
    expect(fightUnder(g, 'daily', o1.name)).toBe(null);
    const r2 = openFight(g, 'daily', 'Someone Else');
    expect(r2.seed).not.toBe(r1.seed);
    expect(fightRec(g)).toBe(r2);
    endFightRec(g);
    expect(fightRec(g)).toBe(null);
  });
  it("belongs to one fighter: another fighter's fight is not picked up", () => {
    const g = game(4);
    openFight(g, 'story', 'Anyone');
    g.save.roster.active = 1;
    expect(fightRec(g)).toBe(null);
    openFight(g, 'cup', 'Someone');
    g.save.roster.active = 0;
    expect(fightRec(g)).toBe(null);
  });
  it('a damaged record is dropped by the save safety net, the rest is kept', () => {
    const g = game(6);
    openFight(g, 'story', 'Anyone');
    const res = g.save.profile.extra.resume as Record<string, Json>;
    res.place = 'map';
    (res.fight as Record<string, Json>).moves = 'lots' as Json;
    const { save, fixed } = repair(JSON.parse(JSON.stringify(g.save)) as SaveData);
    const r = save.profile.extra.resume as Record<string, Json>;
    expect(r.fight).toBe(null);
    expect(r.place).toBe('map');
    expect(fixed.join()).toMatch(/middle of/);
  });
});

// Review L2: a sure win can be claimed free, or wagered: fought at 60% HP for elite loot and a gem.
describe('claim or wager', () => {
  it('the wager starts the same fight over at 60% HP, is kept with the fight, and pays elite loot and a gem', () => {
    const g = game(7);
    g.F!.lvl = 30;
    const opp = storyOpponent(g, 'fight');
    const rec = openFight(g, 'story', opp.name);
    const spec = { kind: 'story', node: 'fight', tier: TIER, opp, arena: null, odds: 0.95, seed: rec.seed, wheelSeed: rec.wheel } as FightSpec;
    spec.mods = startMods(g, spec);
    const bt = startBattle(g, spec);
    bt.start();
    expect(canClaim(spec, bt)).toBe(true);
    const nb = wagerFight(g, spec, bt)!;
    expect(nb.P[0].hp).toBeLessThanOrEqual(Math.ceil(nb.P[0].maxHp * (WAGER_HP / 100)) + 1);
    expect(nb.P[0].hp).toBeLessThan(bt.P[0].hp);
    expect(fightRec(g)!.wager).toBe(true);
    // no claiming or wagering twice
    expect(canClaim(spec, nb)).toBe(false);
    nb.start();
    while (!nb.over) nb.step();
    const gems = g.save.profile.gems || 0;
    const r = endStoryFight(g, spec, { w: nb.w!, me: nb.P[0], them: nb.P[1], round: nb.round, sd: !!nb.sd, hist: nb.hist });
    if (nb.w === 0) {
      expect(r.next).toContainEqual({ t: 'loot', table: 'elite' });
      expect(g.save.profile.gems).toBe(gems + 1);
      expect(r.lines.join(' ')).toMatch(/Wager won/);
    } else expect(r.lines.join(' ')).toMatch(/wager went the other way/);
  });
});
