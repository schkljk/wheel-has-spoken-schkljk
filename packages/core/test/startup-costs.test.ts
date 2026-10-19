import { describe, expect, it } from 'vitest';
import * as D from '../src/data';
import { reword } from '../src/data/wording';
import { clockAt, shortDate } from '../src/game/game';

// Startup costs taken out of the first second (review round 2, J10): the same results, less work.

/** The rewording before its fast path (data/wording.ts): every string through both patterns. */
function rewordRef(s: string): string {
  const EXACT: [string, string][] = [
    ['Win the daily challenge five days in a row', 'Win five daily challenges in a row'],
    [
      'Win for coins, XP, fame and an elite loot spin. Win on consecutive days to grow your streak bonus. You get one attempt a day.',
      'Win for coins, XP, fame and an elite loot spin. Wins in a row grow your streak bonus, and skipping a day never breaks it. You get one attempt a day.',
    ],
    ['They have 150 HP', 'They have 50% more HP'],
    ['you get 25 back after each win', 'you get 25% HP back after each win'],
  ];
  for (const [a, b] of EXACT) if (s.includes(a)) s = s.split(a).join(b);
  return s.replace(/(?<![\d%.])(\d+) ?HP\b/g, '$1% HP').replace(/\b([Hh]eal(?:s|ing)?) (\d+)(?![\d%.])(?! ?HP)/g, '$1 $2% HP');
}

describe('rewording, with its fast path', () => {
  it('rewords like every string went through both patterns', () => {
    const strs: string[] = [];
    const seen = new Set<unknown>();
    const walk = (v: unknown) => {
      if (typeof v === 'string') return void strs.push(v);
      if (!v || typeof v !== 'object' || seen.has(v)) return;
      seen.add(v);
      for (const x of Object.values(v)) if (typeof x !== 'function') walk(x);
    };
    walk(D);
    expect(strs.length).toBeGreaterThan(5000);
    const samples = ['Below 45 HP', 'heals 25', 'Healing 10 HP', 'They have 150 HP', 'you get 25 back after each win', 'Heal 3', 'no numbers', '12HP', '50% HP'];
    for (const s of [...strs, ...samples]) expect(reword(s), s).toBe(rewordRef(s));
  });
});

describe('the clock', () => {
  it('writes record dates by hand', () => {
    expect(shortDate(new Date(2026, 9, 17, 12))).toBe('17 Oct 2026');
    expect(shortDate(new Date(2027, 0, 3, 12))).toBe('3 Jan 2027');
    const c = clockAt(new Date(2026, 9, 17, 12));
    expect(c).toEqual({ today: 'Sat Oct 17 2026', yesterday: 'Fri Oct 16 2026', date: '17 Oct 2026' });
  });
});
