import { describe, expect, it } from 'vitest';
import {
  DUEL_WIN_COINS,
  autoChoice,
  clockAt,
  coinsOf,
  dayKey,
  duelBest,
  duelDays,
  duelOf,
  duelShare,
  duelSquares,
  endDuelFight,
  enterCareer,
  mulberry32,
  newSave,
  randomFighter,
  startBattle,
  DUEL_TIER,
  type CareerFighter,
  type FightOutcome,
  type FightSpec,
  type Game,
} from '../src';

// Review F2: one matchup a day, the same for everyone.
function game(seed = 2): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(new Date(2026, 9, 19)), pool: null, notes: [] };
  enterCareer(g, randomFighter('Somebody', rng) as CareerFighter);
  return g;
}
const play = (g: Game, day: string) => {
  const d = duelOf(day);
  const spec = { kind: 'duel', tier: DUEL_TIER, opp: d.opp, me: d.me, seed: d.seed, arena: d.arena, odds: 0.5 } as FightSpec;
  const bt = startBattle(g, spec);
  const choices = mulberry32(d.wheelSeed);
  bt.start();
  while (!bt.over) bt.step(autoChoice(choices, bt.P[0], bt.P[1], bt.hist[1]));
  return { d, bt };
};

describe('the daily duel', () => {
  it('is the same fight for everyone on the same day, whoever plays it', () => {
    const a = duelOf('2026-10-19');
    const b = duelOf('2026-10-19');
    expect(b.me.name).toBe(a.me.name);
    expect(b.opp.name).toBe(a.opp.name);
    expect(b.arena.k).toBe(a.arena.k);
    expect(duelOf('2026-10-20').me.name).not.toBe(a.me.name);
    // two different players, same choices: same fight
    const x = play(game(1), '2026-10-19').bt;
    const y = play(game(99), '2026-10-19').bt;
    expect([y.w, y.round, y.P[0].hp]).toEqual([x.w, x.round, x.P[0].hp]);
  });
  it('numbers the days and lists the last week', () => {
    expect(duelOf('2026-01-01').no).toBe(1);
    const days = duelDays(new Date(2026, 9, 19));
    expect(days).toHaveLength(7);
    expect(days[0]).toBe(dayKey(new Date(2026, 9, 19)));
    expect(days[1]).toBe('2026-10-18');
  });
  it('keeps the best score of each day and pays the first win once', () => {
    const g = game();
    const d = duelOf('2026-10-19');
    const me = { f: d.me, hp: 50, maxHp: 100 } as unknown as FightOutcome['me'];
    const coins = coinsOf(g);
    const r1 = endDuelFight(g, d, { w: 0, me, round: 9, sd: false, hist: [['strike', 'guard'], ['power', 'power']] });
    expect(coinsOf(g)).toBe(coins + DUEL_WIN_COINS);
    expect(r1.share).toContain('#' + d.no);
    expect(r1.share).toContain('🟩🟥');
    endDuelFight(g, d, { w: 0, me, round: 6, sd: false, hist: [[], []] });
    expect(coinsOf(g)).toBe(coins + DUEL_WIN_COINS);
    expect(duelBest(g, '2026-10-19')!.rounds).toBe(6);
    endDuelFight(g, d, { w: 1, me, round: 3, sd: false, hist: [[], []] });
    expect(duelBest(g, '2026-10-19')!.won).toBe(true);
  });
  it('writes the reads as squares', () => {
    expect(duelSquares([['strike', 'strike', 'guard'], ['power', 'guard', 'guard']])).toBe('🟩🟥⬜');
    expect(duelShare({ no: 7 }, { won: false, rounds: 4, hp: 0, sq: '🟥' })).toBe('The Wheel Has Spoken · Daily duel #7: lost in 4 rounds\n🟥');
  });
});
