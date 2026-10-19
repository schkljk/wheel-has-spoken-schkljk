import { describe, expect, it } from 'vitest';
import {
  BOUNTIES,
  BOUNTY_SLOTS,
  bountiesDone,
  bountyBoard,
  clockAt,
  enterCareer,
  mulberry32,
  newSave,
  randomFighter,
  swapBounty,
  track,
  RACES,
  type CareerFighter,
  type Game,
} from '../src';

// Review F5: three standing build challenges, no timers.
function game(seed = 8): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Hunter', rng) as CareerFighter);
  return g;
}
const up = (g: Game) => bountyBoard(g).map((x) => x.b.k);

describe('the bounty board', () => {
  it('keeps three up, with unique keys and real rewards', () => {
    expect(new Set(BOUNTIES.map((b) => b.k)).size).toBe(BOUNTIES.length);
    const g = game();
    expect(up(g)).toHaveLength(BOUNTY_SLOTS);
    // looking again changes nothing: no timers, no rerolls
    expect(up(g)).toEqual(up(g));
  });
  it('pays when the fighter fits as it happens, then puts a new one up', () => {
    const g = game();
    const b = BOUNTIES.find((x) => x.k === 'goblinboss')!;
    bountyBoard(g);
    const s = g.save.profile.extra.bounty as unknown as { up: string[] };
    if (!s.up.includes(b.k)) s.up[0] = b.k;
    g.F!.race = RACES.find((r) => r.n === 'Goblin')!;
    const gems = g.save.profile.gems || 0;
    // a cup is not a boss
    track(g, 'cups');
    expect(up(g)).toContain(b.k);
    track(g, 'bosses');
    // (a goal for the first boss may pay too)
    expect(g.save.profile.gems).toBeGreaterThanOrEqual(gems + b.gems);
    expect(bountiesDone(g)).toBe(1);
    expect(up(g)).not.toContain(b.k);
    expect(up(g)).toHaveLength(BOUNTY_SLOTS);
    expect(g.notes.some((n) => n.includes(b.n))).toBe(true);
  });
  it('counts steps for bounties that need several, only while the fighter fits', () => {
    const g = game();
    const b = BOUNTIES.find((x) => x.k === 'slimewins')!;
    const s = g.save.profile.extra.bounty as unknown as { up: string[] };
    bountyBoard(g);
    s.up[0] = b.k;
    g.F!.race = RACES.find((r) => r.n === 'Human')!;
    track(g, 'wins');
    expect(bountyBoard(g).find((x) => x.b.k === b.k)!.cur).toBe(0);
    g.F!.race = RACES.find((r) => r.n === 'Slime')!;
    for (let i = 0; i < 9; i++) track(g, 'wins');
    expect(bountyBoard(g).find((x) => x.b.k === b.k)!.cur).toBe(9);
    track(g, 'wins');
    expect(up(g)).not.toContain(b.k);
  });
  it('swaps one for a gem', () => {
    const g = game();
    const [k] = up(g);
    expect(swapBounty(g, k!)).toBe(false);
    g.save.profile.gems = 2;
    expect(swapBounty(g, k!)).toBe(true);
    expect(g.save.profile.gems).toBe(1);
    expect(up(g)).not.toContain(k);
    expect(up(g)).toHaveLength(BOUNTY_SLOTS);
  });
});
