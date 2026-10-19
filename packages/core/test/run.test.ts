import { describe, expect, it } from 'vitest';
import {
  relicOf,
  RUN_BOONS,
  RUN_FIGHTS,
  RUN_START_LVL,
  RUN_WIND_HP,
  autoChoice,
  clockAt,
  endRunFight,
  eff,
  enterCareer,
  mulberry32,
  newSave,
  numStats,
  quitRun,
  randomFighter,
  runBest,
  runFighter,
  runOpponent,
  runSpecOf,
  runState,
  startBattle,
  startRun,
  takeBoon,
  type CareerFighter,
  type FightOutcome,
  type FightSpec,
  type Game,
} from '../src';

// Review F3: Spin & Run, a throwaway fighter for nine fights.
function game(seed = 4): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  const f = randomFighter('Career', rng) as CareerFighter;
  enterCareer(g, f);
  g.F = f;
  return g;
}
const result = (g: Game, w: 0 | 1, hp = 60) => {
  const f = runFighter(runState(g)!);
  return { w, me: { f, hp, maxHp: 100 }, round: 8, sd: false } as unknown as FightOutcome;
};
const win = (g: Game, hp?: number) => endRunFight(g, runOpponent(g, runState(g)!), result(g, 0, hp));
/** The first plain boon on offer (every third pick also brings relics: L5). */
const plain = (g: Game) => runState(g)!.offer!.find((k) => !relicOf(k))!;

describe('Spin & Run', () => {
  it('starts with a fresh fighter at level 5 with gear', () => {
    const g = game();
    const R = startRun(g);
    const f = runFighter(R);
    expect(f.lvl).toBe(RUN_START_LVL);
    expect(Object.values(f.gear || {}).filter(Boolean).length).toBeGreaterThan(0);
    expect(R.i).toBe(0);
    expect(R.hp).toBe(100);
    // the career fighter is untouched
    expect(g.F!.name).toBe('Career');
  });
  it('adds its picks to the collection when the run pays out, and only after a win (G11)', () => {
    const g = game();
    startRun(g);
    expect(g.save.profile.seen.race).toBeUndefined();
    // walking away at once: nothing
    quitRun(g);
    expect(g.save.profile.seen.race).toBeUndefined();
    startRun(g);
    win(g);
    expect(g.save.profile.seen.race).toBeUndefined();
    quitRun(g);
    expect((g.save.profile.seen.race as unknown[] | undefined)?.length).toBe(1);
  });
  it('rolls the same opponent every time it is asked, and a boss last', () => {
    const g = game();
    const R = startRun(g);
    const a = runOpponent(g, R);
    const b = runOpponent(g, R);
    expect(a.name).toBe(b.name);
    expect(numStats(a)).toEqual(numStats(b));
    const last = runOpponent(g, { ...R, i: RUN_FIGHTS - 1 });
    expect(last.isBoss).toBe(true);
    // levelled by the fight number (K3): the start level, a level a win, plus one
    expect(last.lvl).toBe(RUN_START_LVL + RUN_FIGHTS - 1 + 1);
  });
  it('levels opponents by fight number, so +2 levels puts you ahead (K3)', () => {
    const g = game();
    const R = startRun(g);
    win(g);
    const before = runOpponent(g, runState(g)!).lvl;
    const S = runState(g)!;
    S.offer = ['lvl', 'str', 'spd'];
    takeBoon(g, 'lvl');
    expect(runFighter(runState(g)!).lvl).toBe(RUN_START_LVL + 3);
    expect(runOpponent(g, runState(g)!).lvl).toBe(before);
    void R;
  });
  it('a win levels up, carries HP plus 10, and offers three different boons', () => {
    const g = game();
    startRun(g);
    const r = win(g, 40);
    const R = runState(g)!;
    expect(r.won).toBe(true);
    expect(r.runOver).toBe(false);
    expect(r.next).toEqual([{ t: 'run' }]);
    expect(R.i).toBe(1);
    expect(R.hp).toBe(50);
    expect(runFighter(R).lvl).toBe(RUN_START_LVL + 1);
    expect(R.offer).toHaveLength(3);
    expect(new Set(R.offer).size).toBe(3);
    for (const k of R.offer!) expect(RUN_BOONS.some((b) => b.k === k)).toBe(true);
    // class mastery counts the run fighter's wins
    expect(Object.values(g.save.profile.mastery).reduce((a, b) => a + b, 0)).toBe(1);
  });
  it('takes only a boon that is on offer, once', () => {
    const g = game();
    startRun(g);
    win(g);
    const R = runState(g)!;
    const off = RUN_BOONS.find((b) => !R.offer!.includes(b.k))!.k;
    takeBoon(g, off);
    expect(runState(g)!.offer).not.toBeNull();
    const k = R.offer![0]!;
    const before = eff(runFighter(runState(g)!));
    takeBoon(g, k);
    const S = runState(g)!;
    expect(S.offer).toBeNull();
    expect(S.took).toEqual([k]);
    if (['str', 'spd', 'dur', 'iq', 'wm', 'pm'].includes(k)) expect(eff(runFighter(S))[k as 'str']).toBeGreaterThan(before[k as 'str']);
    takeBoon(g, k);
    expect(runState(g)!.took).toEqual([k]);
  });
  it('the first loss is a second wind: back up at 60% HP for a rematch (K3)', () => {
    const g = game();
    startRun(g);
    win(g);
    takeBoon(g, runState(g)!.offer![0]!);
    const opp = runOpponent(g, runState(g)!).name;
    const r = endRunFight(g, runOpponent(g, runState(g)!), result(g, 1));
    expect(r.runOver).toBe(false);
    expect(r.next).toEqual([{ t: 'run' }]);
    expect(r.lines.join(' ')).toContain('Second wind');
    const R = runState(g)!;
    expect([R.i, R.hp, R.wind, R.offer]).toEqual([1, RUN_WIND_HP, 1, null]);
    // the rematch is the same opponent
    expect(runOpponent(g, R).name).toBe(opp);
    // the next loss ends it
    expect(endRunFight(g, runOpponent(g, R), result(g, 1)).runOver).toBe(true);
  });
  it('a loss ends the run once the second wind is gone: gems for the wins, the best run kept', () => {
    const g = game();
    startRun(g);
    runState(g)!.wind = 1;
    for (let i = 0; i < 4; i++) {
      win(g);
      takeBoon(g, plain(g));
    }
    const gems = g.save.profile.gems || 0;
    const r = endRunFight(g, runOpponent(g, runState(g)!), result(g, 1));
    expect(r.won).toBe(false);
    expect(r.runOver).toBe(true);
    expect(r.next).toEqual([{ t: 'hub' }]);
    expect(runState(g)).toBeNull();
    expect(g.save.profile.gems).toBe(gems + 2);
    expect(runBest(g)).toMatchObject({ wins: 4, won: false });
    expect(g.save.profile.stats.runs).toBe(1);
  });
  it('the whole run pays 3 gems more and is marked won', () => {
    const g = game();
    startRun(g);
    let r = win(g);
    for (let i = 1; i < RUN_FIGHTS; i++) {
      takeBoon(g, plain(g));
      r = win(g);
    }
    expect(r.runOver).toBe(true);
    expect(r.confetti).toBe(true);
    expect(r.big).toBe('Run complete');
    expect(runState(g)).toBeNull();
    expect(runBest(g)).toMatchObject({ wins: RUN_FIGHTS, won: true });
    // floor(9 / 2) + 3, plus whatever mastery levels paid in gems
    expect(g.save.profile.gems).toBeGreaterThanOrEqual(7);
  });
  it('walking away counts as the end of the run', () => {
    const g = game();
    startRun(g);
    win(g);
    quitRun(g);
    expect(runState(g)).toBeNull();
    expect(runBest(g)).toMatchObject({ wins: 1 });
  });
  it('fights with the run fighter and the HP it carried in', () => {
    const g = game();
    const R = startRun(g);
    R.hp = 40;
    const spec = { ...runSpecOf(g, R), arena: null, odds: 0.5 } as FightSpec;
    const bt = startBattle(g, spec);
    bt.start();
    expect(bt.P[0].f.name).toBe(runFighter(R).name);
    expect(bt.P[0].hp).toBeLessThan(bt.P[0].maxHp);
    const choices = mulberry32(5);
    while (!bt.over) bt.step(autoChoice(choices, bt.P[0], bt.P[1], bt.hist[1]));
    expect(bt.round).toBeGreaterThan(0);
  });
  it('survives a save round trip', () => {
    const g = game();
    startRun(g);
    win(g);
    const back = JSON.parse(JSON.stringify(g.save.profile.extra));
    g.save.profile.extra = back;
    const R = runState(g)!;
    expect(R.i).toBe(1);
    expect(runFighter(R).lvl).toBe(RUN_START_LVL + 1);
  });
});
