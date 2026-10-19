import { describe, expect, it } from 'vitest';
import { GEAR, RSUB, RULES, SIDEKICKS, TREE, forwardDay, newSave, readSteps } from '../src';

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
    walk([GEAR, SIDEKICKS, TREE, RULES, RSUB]);
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

describe('the save safety net knows the new parts (G14)', () => {
  it('repairs damaged bounty, locker, run, resume, tower and stats instead of failing every win', async () => {
    const { repair, newSave, enterCareer, randomFighter, mulberry32, clockAt, track } = await import('../src');
    const s = newSave(0);
    Object.assign(s.profile.extra, {
      bounty: { up: 'oops', done: null },
      cos: { own: null, on: 3 },
      run: { f: {} },
      resume: { lv: {}, steps: 'x' },
      tower: { floor: '9' },
      duels: { '2026-05-15': { won: true, rounds: 4, hp: 50, sq: '' }, bad: 7 },
    });
    s.profile.stats.wins = '5' as unknown as number;
    const { save, fixed } = repair(JSON.parse(JSON.stringify(s)));
    expect(fixed.length).toBeGreaterThan(4);
    const x = save.profile.extra as Record<string, unknown>;
    expect(x.bounty).toEqual({ up: [], done: [], prog: {} });
    expect(x.cos).toEqual({ own: [], on: {} });
    expect(x.run).toBeNull();
    expect((x.resume as { lv: unknown }).lv).toBeNull();
    expect(x.tower).toEqual({ floor: 9, who: '' });
    expect(Object.keys(x.duels as object)).toEqual(['2026-05-15']);
    expect(save.profile.stats.wins).toBe(5);
    // and the game plays on: a win counts (it used to throw in the bounty board)
    const rng = mulberry32(1);
    const g = { save, F: null, rng, clock: clockAt(), pool: null, notes: [] as string[] };
    enterCareer(g, randomFighter('Fixed', rng) as never);
    track(g, 'wins');
    expect(g.save.profile.stats.wins).toBe(6);
  });
});

describe('a rush or a climb under way survives closing the app (G6)', () => {
  it('keeps the run between fights and clears it when the run ends', async () => {
    const { endRushFight, endTowerFight, enterCareer, keptRush, keptTower, mulberry32, newSave, randomFighter, clockAt } = await import('../src');
    const rng = mulberry32(2);
    const g = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] as string[] } as never as Parameters<typeof keptRush>[0];
    enterCareer(g, randomFighter('Climber', rng) as never);
    g.save.roster.active = 0;
    const O = randomFighter('Foe', rng) as never;
    const out = (w: 0 | 1) => ({ w, me: { f: g.F, hp: 60, maxHp: 100 }, round: 6, sd: false }) as never;
    endRushFight(g, { i: 0, hp: 100 }, O, out(0));
    expect(keptRush(g)).toMatchObject({ i: 1 });
    // a round trip through the save keeps it
    const h = { ...g, save: JSON.parse(JSON.stringify(g.save)) };
    expect(keptRush(h)).toMatchObject({ i: 1 });
    endRushFight(g, keptRush(g)!, O, out(1));
    expect(keptRush(g)).toBeNull();
    endTowerFight(g, { floor: 3, hp: 80, seed: 7 }, O, out(0));
    expect(keptTower(g)).toMatchObject({ floor: 4 });
    endTowerFight(g, { floor: 4, hp: 80, seed: 7, lives: 1 }, O, out(1));
    expect(keptTower(g)).toBeNull();
  });
});
