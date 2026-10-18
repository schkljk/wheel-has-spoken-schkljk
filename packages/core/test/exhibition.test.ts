import { describe, expect, it } from 'vitest';
import {
  CALLS,
  champEntry,
  clockAt,
  enterCareer,
  exhibitionLegends,
  mulberry32,
  newSave,
  randomFighter,
  retire,
  runExhibition,
  type CareerFighter,
  type Game,
  type Legend,
} from '../src';

// Upgrade 24: hall of fame legends fight exhibitions, and two commentators call them.
function game(seed = 1): Game {
  const rng = mulberry32(seed);
  return { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
}
function withChamps(g: Game, names: string[]) {
  g.save.profile.champs = names.map((n, i) => {
    const f = randomFighter(n, g.rng) as CareerFighter;
    f.lvl = 8 + i;
    return champEntry(g, f, `Local brawl. Level ${f.lvl}`, 10 + i);
  }) as never;
}

describe('hall of fame exhibitions', () => {
  it('finds legends among champions and retirees, best first, each once', () => {
    const g = game();
    withChamps(g, ['Ann', 'Bob']);
    // a retiree keeps their fighter now
    enterCareer(g, randomFighter('Cid', g.rng) as CareerFighter);
    g.F!.lvl = 30;
    retire(g);
    const L = exhibitionLegends(g);
    expect(L.map((l) => l.n.split(',')[0])).toEqual(expect.arrayContaining(['Ann', 'Bob', 'Cid']));
    expect(L[0]!.n.startsWith('Cid')).toBe(true);
    expect(new Set(L.map((l) => l.n)).size).toBe(L.length);
    // champions whose fighter the hall of fame dropped don't count
    (g.save.profile.champs as { fd?: unknown }[]).forEach((c) => delete c.fd);
    expect(exhibitionLegends(g).map((l) => l.n.split(',')[0])).toEqual(['Cid']);
  });

  it('plays the same fight and the same calls from the same seed', () => {
    const g = game(2);
    withChamps(g, ['Ann', 'Bob']);
    const [a, b] = exhibitionLegends(g) as [Legend, Legend];
    const one = runExhibition(a, b, 99);
    expect(runExhibition(a, b, 99)).toEqual(one);
    const results = new Set(Array.from({ length: 12 }, (_, s) => JSON.stringify(runExhibition(a, b, s).rounds.map((r) => r.hp))));
    expect(results.size).toBeGreaterThan(1);
  });

  it('calls it round by round, taking turns, with every name filled in', () => {
    const g = game(3);
    withChamps(g, ['Ann', 'Bob']);
    const [a, b] = exhibitionLegends(g) as [Legend, Legend];
    for (let s = 1; s <= 20; s++) {
      const ex = runExhibition(a, b, s);
      const calls = [...ex.intro, ...ex.rounds.flatMap((r) => (r.call ? [r.call] : [])), ...ex.outro];
      calls.forEach((c, i) => expect(c.who, `seed ${s} call ${i}`).toBe(i % 2));
      for (const c of calls) expect(c.txt).not.toMatch(/\{[a-z]\}/);
      for (const r of ex.rounds) {
        for (const h of r.hp) expect(h >= 0 && h <= 100).toBe(true);
        for (const l of r.lines) expect(l).not.toMatch(/\{\d\}/);
      }
      expect(ex.intro).toHaveLength(2);
      expect(ex.outro).toHaveLength(3);
      // the winner is the one left standing (or ahead at the bell)
      const last = ex.rounds[ex.rounds.length - 1]!.hp;
      expect(last[ex.w]).toBeGreaterThanOrEqual(last[1 - ex.w]!);
    }
  });

  it('has a line for every moment, for both commentators', () => {
    for (const [k, [rex, brenda]] of Object.entries(CALLS)) {
      expect(rex.length, k).toBeGreaterThan(0);
      expect(brenda.length, k).toBeGreaterThan(0);
    }
  });
});
