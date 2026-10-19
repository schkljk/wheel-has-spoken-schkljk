import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  DUEL_BAND,
  DUEL_WIN_COINS,
  LS,
  duelBestFor,
  duelHpText,
  headToHead,
  useBalance,
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
    const d = duelOf('2026-10-19');
    expect(duelShare(d, { won: false, rounds: 4, hp: 0, sq: '🟥' })).toBe(`The Wheel Has Spoken · Daily duel #${d.no}: lost in 4 rounds\n🟥`);
  });
});

// Review round 2: K4 (fair days) and G13 (losses rank by the opponent's HP), and HP as real numbers.
describe('the daily duel, review round 2', () => {
  const side = (f: FightOutcome['me']['f'], hp: number, maxHp = 100) => ({ f, hp, maxHp, ls: LS(f) }) as unknown as FightOutcome['me'];
  it('re-rolls a lopsided day the same way for everyone (K4)', () => {
    const days = Array.from({ length: 12 }, (_, k) => `2026-03-${String(k + 1).padStart(2, '0')}`);
    for (const day of days) {
      const d = duelOf(day);
      // the same matchup however often it is asked for
      expect(duelOf(day).opp.name).toBe(d.opp.name);
      const p = headToHead(d.me, d.opp, mulberry32(9), 120, { arena: d.arena });
      expect(p, day).toBeGreaterThan(0.12);
      expect(p, day).toBeLessThan(0.88);
    }
    expect(days.some((day) => duelOf(day).tries > 0)).toBe(true);
    expect(DUEL_BAND.lo).toBe(0.25);
  });
  it('keeps the old matchups with the band off', () => {
    const keep = { ...BALANCE };
    useBalance({ duelBand: false });
    try {
      expect(duelOf('2026-03-02').tries).toBe(0);
    } finally {
      useBalance(keep);
    }
  });
  it('ranks a loss by the HP the opponent had left, lower is better (G13)', () => {
    const g = game();
    const d = duelOf('2026-10-19');
    endDuelFight(g, d, { w: 1, me: side(d.me, 0), them: side(d.opp, 60), round: 3, sd: false, hist: [[], []] });
    expect(duelBest(g, d.day)!.ohp).toBe(60);
    // a closer loss in more rounds beats it
    endDuelFight(g, d, { w: 1, me: side(d.me, 0), them: side(d.opp, 20), round: 12, sd: false, hist: [[], []] });
    expect(duelBest(g, d.day)!.ohp).toBe(20);
    // a quicker wipe does not
    const r = endDuelFight(g, d, { w: 1, me: side(d.me, 0), them: side(d.opp, 90), round: 2, sd: false, hist: [[], []] });
    expect(duelBest(g, d.day)!.ohp).toBe(20);
    expect(r.lines.join(' ')).toContain('Your best on this one stands: lost in 12 rounds');
    // an old loss record (no opponent HP) loses to any new loss
    (g.save.profile.extra.duels as unknown as Record<string, unknown>)[d.day] = { won: false, rounds: 5, hp: 0, sq: '' };
    endDuelFight(g, d, { w: 1, me: side(d.me, 0), them: side(d.opp, 95), round: 2, sd: false, hist: [[], []] });
    expect(duelBest(g, d.day)!.ohp).toBe(95);
  });
  it('says HP in real numbers, for new and old records', () => {
    const g = game();
    const d = duelOf('2026-10-19');
    const mx = Math.round(100 * LS(d.me));
    const r = endDuelFight(g, d, { w: 0, me: side(d.me, 50), them: side(d.opp, 0), round: 6, sd: false, hist: [[], []] });
    const s = duelBest(g, d.day)!;
    expect(duelHpText(d, s)).toBe(`${Math.round(50 * LS(d.me))}/${mx} HP`);
    expect(r.lines[0]).toBe(`Won in 6 rounds with ${duelHpText(d, s)} left`);
    expect(r.share).toContain(`won in 6 rounds with ${duelHpText(d, s)} left`);
    expect(r.share).not.toContain('%');
    // an old win stored a percentage only: worked out from the stand-in's max
    expect(duelHpText(d, { won: true, rounds: 4, hp: 50, sq: '' })).toBe(`${Math.round(mx / 2)}/${mx} HP`);
    // a loss says the opponent's HP; an old one says nothing
    const omx = Math.round(100 * LS(d.opp));
    endDuelFight(game(), d, { w: 1, me: side(d.me, 0), them: side(d.opp, 25), round: 7, sd: false, hist: [[], []] });
    expect(duelShare(d, { won: false, rounds: 7, hp: 0, sq: '', ohp: 25, ohr: Math.round(25 * LS(d.opp)), omx })).toContain(`lost in 7 rounds, ${d.opp.name} on ${Math.round(25 * LS(d.opp))}/${omx} HP`);
    expect(duelHpText(d, { won: false, rounds: 7, hp: 0, sq: '' })).toBe('');
  });
  it('only counts a record from the same matchup', () => {
    const g = game();
    const d = duelOf('2026-10-19');
    g.save.profile.extra.duels = { [d.day]: { won: true, rounds: 4, hp: 50, sq: '', opp: 'Somebody else' } };
    expect(duelBestFor(g, d)).toBeNull();
    // the first win against this matchup still pays
    const coins = coinsOf(g);
    endDuelFight(g, d, { w: 0, me: side(d.me, 50), them: side(d.opp, 0), round: 9, sd: false, hist: [[], []] });
    expect(coinsOf(g)).toBe(coins + DUEL_WIN_COINS);
    expect(duelBestFor(g, d)!.opp).toBe(d.opp.name);
  });
});
