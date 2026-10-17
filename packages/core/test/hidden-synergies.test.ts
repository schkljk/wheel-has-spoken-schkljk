import { afterEach, describe, expect, it } from 'vitest';
import {
  ARCHS,
  BALANCE,
  GEAR,
  LEGACY_BALANCE,
  RACES,
  SYN_HIDDEN,
  WEAPONS,
  clockAt,
  discoverHidden,
  enterCareer,
  infoFor,
  invalidate,
  mulberry32,
  newSave,
  randomFighter,
  synFound,
  synOf,
  useBalance,
  type CareerFighter,
  type Fighter,
  type Game,
} from '../src';

// Upgrade 16: joke picks are secretly viable.
const tuned = { ...BALANCE };
afterEach(() => useBalance(tuned));

const keys = (f: Fighter) => synOf(f).map((s) => s.k);
/** A random fighter made into a joke: NPC class, a joke weapon, a joke race, and some junk gear. */
function joke(seed: number, o: { npc?: boolean; weapon?: boolean; race?: boolean; junk?: number } = {}) {
  const f = randomFighter('J', mulberry32(seed));
  if (o.npc) f.arch = ARCHS.find((a) => a.k === 'npc')!;
  if (o.weapon) f.weapon = WEAPONS.find((w) => w.n === 'Wet noodle')!;
  if (o.race) f.race = RACES.find((r) => r.n === 'Pigeon')!;
  if (o.junk) {
    f.gear = {};
    const seen = new Set<string>();
    for (const g of GEAR.filter((x) => x.r === 'junk')) if (!seen.has(g.slot) && seen.size < o.junk) (seen.add(g.slot), (f.gear[g.slot] = g.k));
  }
  invalidate(f);
  return f;
}

describe('hidden synergies', () => {
  it('go to the joke picks and nobody else', () => {
    expect(keys(joke(1, { npc: true }))).toContain('h_bgchar');
    expect(keys(joke(1, { npc: true, weapon: true }))).toEqual(expect.arrayContaining(['h_bgchar', 'h_underdog', 'h_irony']));
    expect(keys(joke(1, { race: true }))).toContain('h_comic');
    expect(keys(joke(1, { junk: 3 }))).toContain('h_dumpster');
    expect(keys(joke(1, { junk: 3 }))).not.toContain('h_trashking');
    expect(keys(joke(1, { junk: 5 }))).toEqual(expect.arrayContaining(['h_dumpster', 'h_trashking']));
    // a normal build has none
    let any = 0;
    const rng = mulberry32(2);
    for (let i = 0; i < 300; i++) {
      const f = randomFighter('N', rng);
      if (f.arch.k === 'npc' || f.weapon.q === 0 || f.race.q === 0) continue;
      any += synOf(f).filter((s) => s.hidden).length;
    }
    expect(any).toBe(0);
  });

  it('each has a mechanics line, a joke and an info card', () => {
    for (const s of SYN_HIDDEN) {
      const it = infoFor(`it|syn|${s.n}`);
      expect(it, s.n).not.toBeNull();
      expect(it!.flavor, s.n).toBe(s.flavor);
    }
  });

  it('stay secret until a fight finds them, and are found once', () => {
    const rng = mulberry32(3);
    const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
    enterCareer(g, joke(4, { npc: true }) as CareerFighter);
    const s = synOf(g.F!).find((x) => x.k === 'h_bgchar')!;
    expect(synFound(g, s)).toBe(false);
    expect(discoverHidden(g, g.F!).map((x) => x.k)).toContain('h_bgchar');
    expect(synFound(g, s)).toBe(true);
    expect(discoverHidden(g, g.F!)).toEqual([]);
  });

  it('are off with the old game’s balance', () => {
    useBalance(LEGACY_BALANCE);
    expect(keys(joke(1, { npc: true, weapon: true, race: true, junk: 5 })).filter((k) => k.startsWith('h_'))).toEqual([]);
  });
});
