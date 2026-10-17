import { afterAll, describe, expect, it } from 'vitest';
import {
  BALANCE,
  CHAPTERS,
  CH_EVENTS,
  ITEMK,
  LEGACY_BALANCE,
  SEVENTS,
  STATN,
  charismaOf,
  clockAt,
  coinsOf,
  enterCareer,
  eventOf,
  eventOption,
  mulberry32,
  newChapter,
  newSave,
  optText,
  randomFighter,
  storyEvent,
  storyOf,
  talkOf,
  useBalance,
  type CareerFighter,
  type Game,
} from '../src';

// Upgrade 20: each chapter has encounters of its own, next to the classic twelve.
function game(ch: number, seed = 1, cha?: number): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Tourist', rng) as CareerFighter);
  g.F!.story = newChapter(g, ch, 0) as never;
  g.save.roster.slots[0]!.coins = 100;
  if (cha != null) {
    g.F!.bonus = { ...(g.F!.bonus || {}), cha: 0 };
    g.F!.bonus.cha = Math.round(cha / 5) - Math.round(charismaOf(g) / 5);
  }
  return g;
}
const saved = { ...BALANCE };
afterAll(() => useBalance(saved));

describe('chapter-themed encounters', () => {
  it('gives every chapter two of its own, each with a working charisma option', () => {
    const keys = new Set(SEVENTS.map((e) => e.k));
    for (let ch = 1; ch <= CHAPTERS.length; ch++) expect(CH_EVENTS.filter((e) => e.ch === ch), `chapter ${ch}`).toHaveLength(2);
    for (const ev of CH_EVENTS) {
      expect(keys.has(ev.k), ev.k).toBe(false);
      keys.add(ev.k);
      expect(ev.talk.need, ev.k).toBeGreaterThanOrEqual(30);
      expect(ev.talk.need, ev.k).toBeLessThanOrEqual(60);
      for (const fx of [ev.talk.fx, ...ev.o.flatMap((o) => [o.fx, o.no])]) {
        if (fx?.item) expect(ITEMK[fx.item], `${ev.k} item`).toBeTruthy();
        if (fx?.stat) expect(STATN[fx.stat], `${ev.k} stat`).toBeTruthy();
      }
      for (const o of ev.o) {
        if (o.p != null) expect(o.p > 0 && o.p < 1, ev.k).toBe(true);
        // a joke for every outcome that has no screen of its own
        if (!o.fight && !o.wheel && !o.loot) expect(o.txt, `${ev.k}: ${o.l}`).toBeTruthy();
        if (o.p != null && !o.fight) expect(o.noTxt, `${ev.k}: ${o.l}`).toBeTruthy();
        expect(optText(o).length, `${ev.k}: ${o.l}`).toBeGreaterThan(5);
      }
    }
  });

  it('writes the mechanics line from what an option does', () => {
    const o = (k: string, i: number) => eventOf(k)!.o[i]!.s;
    expect(o('c2_skewers', 0)).toBe('4 coins. 70%: heal 30% HP. 30%: lose 10% HP');
    expect(o('c1_laundromat', 1)).toBe('+1 speed for good, lose 15% HP');
    expect(o('c4_crates', 0)).toBe('A loot spin, but a 40% chance it bites for 25% HP');
    expect(o('c8_implant', 0)).toBe('15 coins. 75%: +1 speed for good. 25%: lose 25% HP, an injury');
    expect(o('c17_sand', 0)).toBe('+15% damage in your next fight');
    expect(o('c6_ghost', 0)).toBe('An elite fight with guaranteed loot');
  });

  it("deals a chapter's own encounters there, and never twice", () => {
    const g = game(6);
    const seen: string[] = [];
    for (let i = 0; i < 14; i++) seen.push(storyEvent(g).k);
    const mine = CH_EVENTS.filter((e) => e.ch === 6).map((e) => e.k);
    for (const k of mine) expect(seen).toContain(k);
    expect(seen.filter((k) => k.startsWith('c') && /^c\d+_/.test(k)).every((k) => mine.includes(k))).toBe(true);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('keeps to the classic twelve with the old balance', () => {
    useBalance({ ...BALANCE, themedEvents: LEGACY_BALANCE.themedEvents });
    try {
      const g = game(6);
      for (let i = 0; i < 12; i++) {
        const k = storyEvent(g).k;
        expect(SEVENTS.some((e) => e.k === k), k).toBe(true);
      }
    } finally {
      useBalance(saved);
    }
  });

  it('does what the line says', () => {
    let g = game(1);
    storyOf(g).hp = 50;
    let r = eventOption(g, 'c1_laundromat', 0);
    expect(storyOf(g).hp).toBe(70);
    expect(r).toMatchObject({ fx: 'Heal 20% HP', txt: expect.stringContaining('towels') });
    const spd = g.F!.bonus.spd || 0;
    eventOption(g, 'c1_laundromat', 1);
    expect(g.F!.bonus.spd).toBe(spd + 1);
    expect(storyOf(g).hp).toBe(55);

    g = game(4);
    g.F!.fame = 1;
    const coins = coinsOf(g);
    eventOption(g, 'c4_crates', 1);
    expect(coinsOf(g)).toBe(coins + 8);
    expect(g.F!.fame).toBe(0);

    g = game(5);
    eventOption(g, 'c5_presser', 1);
    expect((g.F!.next as { readB: number }).readB).toBe(0.15);

    g = game(7);
    expect(eventOption(g, 'c7_luggage', 1)).toMatchObject({ loot: 'treasure' });
    expect(eventOption(g, 'c6_ghost', 0)).toEqual({ fight: 'elite' });

    // a gamble lands both ways, and pays its cost either way
    const outs = new Set<string>();
    for (let s = 1; s <= 30; s++) {
      const h = game(2, s);
      const c0 = coinsOf(h);
      const x = eventOption(h, 'c2_skewers', 0) as { fx: string };
      expect(coinsOf(h)).toBe(c0 - 4);
      outs.add(x.fx);
    }
    expect([...outs].sort()).toEqual(['Heal 30% HP', 'Lose 10% HP']);
  });

  it('opens the charisma option at its threshold, and it pays out', () => {
    for (const ev of CH_EVENTS) {
      const lo = game(ev.ch, 3, 25);
      expect(talkOf(lo, ev.k)!.ok, ev.k).toBe(false);
      const g = game(ev.ch, 3, 60);
      const t = talkOf(g, ev.k)!;
      expect(t.ok, ev.k).toBe(true);
      expect(t.o.s, ev.k).toBe(optText({ fx: ev.talk.fx, cost: ev.talk.cost }));
      const r = eventOption(g, ev.k, ev.o.length) as { fx: string; txt: string };
      expect(r.txt, ev.k).toBe(ev.talk.txt);
      expect(r.fx.length, ev.k).toBeGreaterThan(3);
    }
  });
});
