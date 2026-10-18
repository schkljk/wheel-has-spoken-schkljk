import { afterEach, describe, expect, it } from 'vitest';
import {
  ARENAS,
  BALANCE,
  LEGACY_BALANCE,
  SEASONAL_ARENAS,
  arenaByKey,
  arenaLand,
  arenaOdds,
  clockAt,
  codexCount,
  enterCareer,
  inSeason,
  infoFor,
  mulberry32,
  newSave,
  randomFighter,
  seasonNews,
  seasonalNow,
  simulate,
  useBalance,
  type CareerFighter,
  type Game,
} from '../src';

// Upgrade 27: calendar-themed arenas, with nothing to miss.
const day = (y: number, m: number, d: number) => clockAt(new Date(y, m - 1, d, 12));
function game(y = 2026, m = 12, d = 10, seed = 1): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: day(y, m, d), pool: null, notes: [] };
  enterCareer(g, randomFighter('Hero', rng) as CareerFighter);
  return g;
}
const keys = (g: Game) => seasonalNow(g).map((a) => a.k);
const saved = { ...BALANCE };
afterEach(() => useBalance(saved));

describe('seasonal arenas', () => {
  it('follow the calendar, across New Year too', () => {
    expect(inSeason([12, 15], [12, 1], [1, 6])).toBe(true);
    expect(inSeason([1, 6], [12, 1], [1, 6])).toBe(true);
    expect(inSeason([1, 7], [12, 1], [1, 6])).toBe(false);
    expect(inSeason([11, 30], [12, 1], [1, 6])).toBe(false);
    expect(keys(game(2026, 12, 10))).toEqual(['snowglobe']);
    expect(keys(game(2026, 12, 31))).toEqual(['snowglobe', 'newyear']);
    expect(keys(game(2027, 1, 2))).toEqual(['snowglobe', 'newyear']);
    expect(keys(game(2026, 10, 18))).toEqual(['pumpkin']);
    expect(keys(game(2026, 2, 14))).toEqual(['valentine']);
    expect(keys(game(2026, 5, 15))).toEqual([]);
    useBalance(LEGACY_BALANCE);
    expect(keys(game(2026, 12, 10))).toEqual([]);
  });

  it('are well-formed: unique, short seasons, mechanics and a joke each', () => {
    const all = [...ARENAS, ...SEASONAL_ARENAS];
    expect(new Set(all.map((a) => a.k)).size).toBe(all.length);
    expect(new Set(all.map((a) => a.n)).size).toBe(all.length);
    for (const a of SEASONAL_ARENAS) {
      // no season is longer than six weeks (the heads-up relies on it)
      let n = 0;
      for (let t = new Date(2026, 0, 1, 12); t.getFullYear() === 2026; t = new Date(t.getTime() + 864e5))
        if (inSeason([t.getMonth() + 1, t.getDate()], a.from, a.to)) n++;
      expect(n, a.k).toBeGreaterThan(2);
      expect(n, a.k).toBeLessThanOrEqual(42);
      expect((a.d || '').length, a.k).toBeGreaterThan(8);
      expect(a.flavor.length, a.k).toBeGreaterThan(20);
      expect(arenaByKey(a.k)).toBe(a);
    }
  });

  it('join the arena wheel in season and say so', () => {
    const g = game(2026, 12, 10);
    const A = g.F!;
    const B = randomFighter('Them', g.rng) as CareerFighter;
    const on = arenaOdds(g, A, B);
    expect(on.list.some((e) => e.it.k === 'snowglobe')).toBe(true);
    expect(on.reasons.some((r) => /Snow globe is in season/.test(r.txt))).toBe(true);
    g.clock = day(2026, 5, 15);
    const off = arenaOdds(g, A, B);
    expect(off.list.map((e) => e.it.k)).toEqual(ARENAS.map((a) => a.k));
  });

  it('fight like any other arena', () => {
    const rng = mulberry32(7);
    for (const arena of SEASONAL_ARENAS) {
      let w = 0;
      for (let i = 0; i < 20; i++) w += simulate(randomFighter('A', rng), randomFighter('B', rng), rng, { arena });
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(20);
    }
  });

  it('cost nothing to miss: not in the collection count, and an info card that says they come back', () => {
    const g = game(2026, 10, 18);
    const before = codexCount(g);
    arenaLand(g, SEASONAL_ARENAS.find((a) => a.k === 'pumpkin')!);
    expect(codexCount(g)).toEqual(before);
    const info = infoFor('it|arena|Pumpkin patch')!;
    expect(info.lines.join(' ')).toMatch(/Comes back every year/);
    expect(info.flavor).toMatch(/pumpkins/);
  });

  it('get one heads-up a season', () => {
    const g = game(2026, 10, 3);
    expect(seasonNews(g)).toMatch(/Pumpkin patch is in season: on the arena wheel until 2 November/);
    expect(seasonNews(g)).toBeNull();
    g.clock = day(2026, 10, 30);
    expect(seasonNews(g)).toBeNull();
    g.clock = day(2026, 11, 5);
    expect(seasonNews(g)).toMatch(/Leaf pile/);
    g.clock = day(2026, 5, 15);
    expect(seasonNews(g)).toBeNull();
    // next year it comes round again
    g.clock = day(2027, 10, 2);
    expect(seasonNews(g)).toMatch(/Pumpkin patch/);
  });
});
