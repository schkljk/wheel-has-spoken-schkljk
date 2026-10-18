import { describe, expect, it } from 'vitest';
import { clockAt, enterCareer, mulberry32, newSave, randomFighter, seeGoals, tabDots, type CareerFighter, type Game } from '../src';

// Upgrade 32: notification dots on the tabs.
function game(): Game {
  const rng = mulberry32(4);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(new Date(2026, 4, 15, 12)), pool: null, notes: [] };
  enterCareer(g, randomFighter('Dot', rng) as CareerFighter);
  return g;
}

describe('tab dots', () => {
  it('Play: the daily wheel or challenge is waiting, and stops once both are done today', () => {
    const g = game();
    expect(tabDots(g).play).toBe(true);
    g.save.profile.daily = g.clock.today;
    g.save.profile.dc = { date: g.clock.today, done: true } as never;
    expect(tabDots(g).play).toBe(false);
    // a new day has its own; nothing about the day before
    g.clock = clockAt(new Date(2026, 4, 16, 12));
    expect(tabDots(g).play).toBe(true);
  });

  it('Fighter: talent points to spend', () => {
    const g = game();
    g.F!.tp = 0;
    expect(tabDots(g).fighter).toBe(false);
    g.F!.tp = 2;
    expect(tabDots(g).fighter).toBe(true);
  });

  it('Goals: a goal done since you last looked', () => {
    const g = game();
    expect(tabDots(g).goals).toBe(false);
    seeGoals(g);
    g.save.profile.goalsDone.push('w1');
    expect(tabDots(g).goals).toBe(true);
    expect(seeGoals(g)).toBe(true);
    expect(tabDots(g).goals).toBe(false);
    expect(seeGoals(g)).toBe(false);
  });
});
