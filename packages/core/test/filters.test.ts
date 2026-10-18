import { describe, expect, it } from 'vitest';
import { CODEX, GEAR_ALL, filterCodex, filterGear, matchText, setsOf, type CodexEntry } from '../src';

// Upgrade 30: filters and search in the collection and the armory.
describe('search', () => {
  it('ignores case and accents, and needs every word somewhere', () => {
    expect(matchText(['Pokémon trainer', '+1 charisma'], 'POKEMON')).toBe(true);
    expect(matchText(['Knight plate', 'Knight set'], 'plate knight')).toBe(true);
    expect(matchText(['Knight plate'], 'knight boots')).toBe(false);
    expect(matchText(['anything'], '   ')).toBe(true);
  });
});

describe('gear filters', () => {
  it('filter by rarity, slot, set and words in the name or effect', () => {
    const all = GEAR_ALL;
    const knight = filterGear(all, { set: 'knight' });
    expect(knight.length).toBe(6);
    expect(filterGear(all, { set: 'knight', slot: 'helm' }).map((g) => g.k)).toEqual(['ironhelm']);
    for (const g of filterGear(all, { rarity: 'legendary' })) expect(g.r).toBe('legendary');
    expect(filterGear(all, { text: 'durability' }).every((g) => /durability/i.test(g.n + g.d))).toBe(true);
    expect(filterGear(all, { text: 'helmet' }).every((g) => g.slot === 'helm')).toBe(true);
    expect(filterGear(all, {})).toHaveLength(all.length);
    expect(setsOf(all)).toEqual(expect.arrayContaining(['knight', 'pirate', 'chef', 'cosmic', 'royal']));
  });
});

describe('collection filters', () => {
  const races = CODEX.find(([k]) => k === 'race')![2]() as CodexEntry[];
  const seen = races.slice(0, 3).map((x) => x.key);
  it('show found, missing or everything, and by tier', () => {
    expect(filterCodex(races, seen, { show: 'found' }).map((x) => x.key)).toEqual(seen);
    expect(filterCodex(races, seen, { show: 'missing' })).toHaveLength(races.length - 3);
    const q = races[0]!.it.q ?? 1;
    expect(filterCodex(races, seen, { q }).every((x) => (x.it.q ?? 1) === q)).toBe(true);
  });
  it("never finds an undiscovered entry by its name (that would give it away)", () => {
    const hidden = races[5]!;
    expect(filterCodex(races, seen, { text: hidden.it.n })).not.toContainEqual(hidden);
    expect(filterCodex(races, [...seen, hidden.key], { text: hidden.it.n })).toContainEqual(hidden);
  });
});
