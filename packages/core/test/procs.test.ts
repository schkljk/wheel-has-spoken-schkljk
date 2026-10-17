import { describe, expect, it } from 'vitest';
import { COMBOS, SYN_PROC, finisherOf, levelUp, mulberry32, newBattle, procFeed, procOf, randomFighter, synOf, type BattleEvent, type Fighter } from '../src';

// Upgrade 6: element combos and synergies get a named banner when they go off. The engine tags the events
// where a synergy made the difference; these tests check the tags are true and the banners are not spam.

/** A seeded fight between two random fighters, with every event. */
function fight(seed: number) {
  const rng = mulberry32(seed);
  const A = randomFighter('A', rng);
  const B = randomFighter('B', rng);
  const lv = 1 + Math.floor(rng() * 30);
  levelUp(A, lv, rng);
  levelUp(B, lv, rng);
  const bt = newBattle(A, B, rng);
  const ev: BattleEvent[] = [...bt.start()];
  while (!bt.over) ev.push(...bt.step());
  return { F: [A, B] as [Fighter, Fighter], ev };
}

const N = 1500;

describe('combo and synergy banners', () => {
  const fights = Array.from({ length: N }, (_, i) => fight(i + 1));

  it('tags a synergy only on events its owner really has it for', () => {
    const seen = new Map<string, number>();
    for (const { F, ev } of fights)
      for (const e of ev) {
        const p = procOf(e);
        if (!p || p.kind !== 'synergy') continue;
        expect(synOf(F[p.side]).map((s) => s.k)).toContain(p.k);
        expect(SYN_PROC[p.k]).toBeTruthy();
        seen.set(p.k, (seen.get(p.k) ?? 0) + 1);
      }
    // random fighters set off every one of them
    expect([...seen.keys()].sort()).toEqual(Object.keys(SYN_PROC).sort());
    console.log('synergy procs seen:', Object.fromEntries([...seen].sort((a, b) => b[1] - a[1])));
  });

  it('names every element combo, owned by the attacker', () => {
    let n = 0;
    for (const { ev } of fights)
      for (const e of ev) {
        if (!e.a?.combo) continue;
        const p = procOf(e)!;
        expect(p.kind).toBe('combo');
        expect(COMBOS[p.k]).toBeTruthy();
        expect(p.side).toBe(e.a.by);
        n++;
      }
    expect(n).toBeGreaterThan(20);
  });

  it('shows each synergy once a fight per fighter, and every combo', () => {
    for (const { ev } of fights) {
      const feed = procFeed();
      const shown = ev.map(feed).filter((p) => !!p);
      const syn = shown.filter((p) => p.kind === 'synergy').map((p) => `${p.side}:${p.k}`);
      expect(new Set(syn).size).toBe(syn.length);
      expect(shown.filter((p) => p.kind === 'combo')).toHaveLength(ev.filter((e) => e.a?.combo).length);
    }
  });

  it('finds the knockout blow (upgrade 12): the last hit on the fighter who falls', () => {
    let kos = 0;
    let found = 0;
    for (let seed = 1; seed <= 600; seed++) {
      const rng = mulberry32(seed);
      const A = randomFighter('A', rng);
      const B = randomFighter('B', rng);
      const bt = newBattle(A, B, rng);
      const batches: BattleEvent[][] = [bt.start()];
      while (!bt.over) batches.push(bt.step());
      for (const b of batches) {
        const i = finisherOf(b);
        const ko = b.find((e) => e.a?.t === 'ko');
        if (!ko) {
          expect(i).toBe(-1);
          continue;
        }
        kos++;
        if (i < 0) continue;
        found++;
        const a = b[i]!.a!;
        expect(a.to ?? a.on).toBe(ko.a!.on);
        expect(b.indexOf(ko)).toBeGreaterThan(i);
        // the fallen is at 0 HP from that blow on
        expect(b[i]!.hr[ko.a!.on as 0 | 1]).toBe(0);
      }
    }
    expect(kos).toBeGreaterThan(200);
    expect(found / kos).toBeGreaterThan(0.95);
  });
});
