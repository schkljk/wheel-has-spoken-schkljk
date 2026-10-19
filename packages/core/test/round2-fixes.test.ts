import { describe, expect, it } from 'vitest';
import { GEAR, RSUB, RULES, SIDEKICKS, TALENTS, forwardDay, newSave, readSteps } from '../src';

// Review round 2: G12 (the day only moves forward) and G15 (reads in words, help text that tells the truth).
describe('the game day (G12)', () => {
  const g = { save: newSave(0) };
  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);
  it('moves forward with the phone', () => {
    expect(forwardDay(g, d(2026, 5, 15)).getDate()).toBe(15);
    expect(forwardDay(g, d(2026, 5, 16)).getDate()).toBe(16);
  });
  it('never goes back: yesterday on the phone is still today in the game', () => {
    const back = forwardDay(g, d(2026, 5, 14));
    expect(back.getDate()).toBe(16);
    expect(back.toDateString()).toBe(d(2026, 5, 16).toDateString());
    // and across a month and a year
    expect(forwardDay(g, d(2027, 1, 1)).getFullYear()).toBe(2027);
    expect(forwardDay(g, d(2026, 12, 31)).toDateString()).toBe(d(2027, 1, 1).toDateString());
  });
});

describe('reads are words (G15)', () => {
  it('a read bonus is told in steps up the clue scale', () => {
    expect(readSteps(0.05)).toBe('half a step');
    expect(readSteps(0.1)).toBe('a step');
    expect(readSteps(0.15)).toBe('a step and a half');
    expect(readSteps(0.2)).toBe('two steps');
    expect(readSteps(0.25)).toBe('two and a half steps');
    expect(readSteps(0.375)).toBe('four steps');
  });
  it('no description says a read gets some percent better', () => {
    const texts: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === 'string') texts.push(v);
      else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x);
    };
    walk([GEAR, SIDEKICKS, TALENTS, RULES, RSUB]);
    expect(texts.filter((t) => /reads?\b[^.]*\d+% (better|worse)/i.test(t))).toEqual([]);
  });
  it('from the number the engine uses: the Butler bot (0.15, which used to say 10%) reads a step and a half clearer', () => {
    const b = RSUB.Robot!.items.find((x) => x.n === 'Butler bot')!;
    expect(b.d).toContain('a step and a half clearer');
  });
  it('the coins help tells the real prices', () => {
    const coins = RULES.coins![2].join(' ');
    expect(coins).toContain('A story fight pays 2 coins');
    expect(coins).toContain('one free reroll');
    expect(coins).not.toContain('rerolls (2 each)');
  });
});
