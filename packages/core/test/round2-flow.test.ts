import { describe, expect, it } from 'vitest';
import {
  REMIX_GEMS,
  buildRemix,
  builtRemix,
  endRemixFight,
  fightRules,
  remixBodies,
  remixBoss,
  relicOf,
  runMods,
  runSpecOf,
  endRunFight,
  quitRun,
  runFighter,
  runOpponent,
  runState,
  startRun,
  takeBoon,
  ALL_GOALS,
  checkGoals,
  goalCur,
  BOUNTIES,
  BOUNTY_JOB_GEMS,
  POWERS,
  WHEEL,
  bountyBoard,
  bountyJob,
  dropJob,
  jobSlice,
  jobUsed,
  swapBounty,
  takeJob,
  clockAt,
  enterCareer,
  ensureSeen,
  isNew,
  levelUpItem,
  levelUpPreview,
  mulberry32,
  newChapter,
  newOnMore,
  newOnPlay,
  newSave,
  newlyOpen,
  noteUnlocks,
  numStats,
  ctxOf,
  randomFighter,
  seeNew,
  tabDots,
  unlocked,
  type CareerFighter,
  type Game,
  type Step,
} from '../src';

// Review round 2, flow and clarity (H items).
function game(seed = 5, lvl = 3): Game {
  const rng = mulberry32(seed);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  enterCareer(g, randomFighter('Keeper', rng) as CareerFighter);
  g.save.roster.active = 0;
  g.F!.lvl = lvl;
  g.F!.story = newChapter(g, 1, 0) as never;
  return g;
}
const clear = (g: Game, ch: number) => ((g.F!.story as unknown as { cleared: number[] }).cleared ??= []).push(ch);

describe('H1: modes say when they open', () => {
  it('what was open before the ribbons counts as seen; what opens later is new until it is opened', () => {
    const g = game();
    clear(g, 1);
    const before = unlocked(g).map((u) => u.k);
    expect(before).toContain('tower');
    expect(before).not.toContain('rush');
    ensureSeen(g);
    expect(isNew(g, 'tower')).toBe(false);
    expect(newOnPlay(g)).toBe(false);
    // chapter 2 cleared: the boss rush opens
    clear(g, 2);
    expect(isNew(g, 'rush')).toBe(true);
    expect(newOnPlay(g)).toBe(true);
    expect(tabDots(g).play).toBe(true);
    seeNew(g, 'rush');
    expect(isNew(g, 'rush')).toBe(false);
    expect(newOnPlay(g)).toBe(false);
  });
  it('a locked mode is never new, and the More tab says hello once', () => {
    const g = game();
    ensureSeen(g);
    expect(isNew(g, 'rush')).toBe(false);
    expect(newOnMore(g)).toBe(true);
    expect(tabDots(g).more).toBe(true);
    seeNew(g, 'locker');
    seeNew(g, 'ghosts');
    expect(tabDots(g).more).toBe(false);
  });
  it("a fight's result names what it opened, on its lines and on the chapter card", () => {
    const g = game();
    const before = unlocked(g);
    clear(g, 1);
    clear(g, 2);
    const r = { lines: ['🪙 +12'], next: [{ t: 'celebrate', icon: '🏟️', title: 'Chapter 2 cleared', sub: 'Next up: The City Circuit' }, { t: 'map' }] as Step[] };
    noteUnlocks(r, newlyOpen(before, unlocked(g)));
    expect(r.lines).toEqual(['🪙 +12', '🔓 Unlocked: Boss rush', '🔓 Unlocked: Endless tower', '🔓 Unlocked: Hard mode']);
    expect((r.next[0] as { sub: string }).sub).toBe('Next up: The City Circuit. Unlocked: Boss rush, Endless tower, Hard mode');
  });
});

describe('H4: the level-up pick shows the real numbers', () => {
  it('old → new for a stat slice, nothing for an upgrade spin, and the fighter is untouched', () => {
    const g = game(7, 8);
    const now = numStats(g.F!, ctxOf(g));
    const p = levelUpPreview(g, levelUpItem('str2')!)!;
    expect(p.a).toEqual(now);
    expect(p.b.atk).toBeGreaterThan(p.a.atk);
    expect(numStats(g.F!, ctxOf(g))).toEqual(now);
    expect(levelUpPreview(g, levelUpItem('awaken')!)).toBe(null);
    expect(levelUpPreview(g, levelUpItem('arsenal')!)).toBe(null);
  });
});

describe('H5 and L1: bounties you can steer', () => {
  it("every bounty's job slice is on its wheel", () => {
    for (const b of BOUNTIES) {
      if (!b.pin) continue;
      const W = WHEEL[b.pin.w];
      const items = (typeof W.items === 'function' ? [] : W.items) as readonly { n: string; k?: string }[];
      // the power wheel depends on the class: No power is on the usual one
      const list = b.pin.w === 'power' ? (POWERS as readonly { n: string; k?: string }[]) : items;
      const hit = (x: { n: string; k?: string }) => (b.pin!.n != null && x.n === b.pin!.n) || (b.pin!.k != null && x.k === b.pin!.k);
      expect(list.some(hit), b.k).toBe(true);
      const f = { [b.pin.w]: list.find(hit) } as never;
      expect(b.is(f), b.k).toBe(true);
    }
    expect(BOUNTIES.filter((b) => b.pin).length).toBeGreaterThanOrEqual(BOUNTIES.length - 1);
  });
  it('the board says who fits, puts those first, and always has one the roster can do when any fits', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = game(seed);
      const fitAny = BOUNTIES.some((b) => b.is(g.F!));
      const board = bountyBoard(g);
      expect(board.length).toBe(3);
      if (fitAny) {
        expect(board[0]!.fits).toEqual([g.F!.name]);
        expect(board.some((r) => r.fits.length)).toBe(true);
      }
      // fitting rows come first
      const firstMiss = board.findIndex((r) => !r.fits.length);
      if (firstMiss >= 0) expect(board.slice(firstMiss).every((r) => !r.fits.length)).toBe(true);
    }
  });
  it('a job costs gems, fixes one slice on the next build, and comes back if dropped', () => {
    const g = game(3);
    g.save.profile.gems = 5;
    const row = bountyBoard(g).find((r) => r.b.pin && r.b.pin.w === 'race') ?? bountyBoard(g).find((r) => r.b.pin)!;
    expect(takeJob(g, row.b.k)).toBe(true);
    expect(g.save.profile.gems).toBe(5 - BOUNTY_JOB_GEMS);
    expect(bountyJob(g)!.k).toBe(row.b.k);
    // one job at a time, and that bounty can't be swapped out from under it
    expect(takeJob(g, row.b.k)).toBe(false);
    expect(swapBounty(g, row.b.k)).toBe(false);
    const W = WHEEL[row.b.pin!.w];
    const items = (row.b.pin!.w === 'power' ? POWERS : typeof W.items === 'function' ? [] : W.items) as readonly { n: string; k?: string }[];
    const at = jobSlice(g, row.b.pin!.w, items);
    expect(at).toBeGreaterThanOrEqual(0);
    expect(jobSlice(g, 'title', items)).toBe(-1);
    dropJob(g);
    expect(g.save.profile.gems).toBe(5);
    expect(bountyJob(g)).toBe(null);
    takeJob(g, row.b.k);
    jobUsed(g);
    expect(bountyJob(g)).toBe(null);
    expect(g.save.profile.gems).toBe(5 - BOUNTY_JOB_GEMS);
  });
});

describe('L6: synergy hunt goals', () => {
  it('count the synergies found, pay once, and sit with the rest of the goals', () => {
    const g = game(9);
    expect(ALL_GOALS.map((x) => x.k)).toEqual(expect.arrayContaining(['syn10', 'syn25', 'syn50']));
    expect(goalCur(g, 'syn10')).toBe((g.save.profile.seen.syn || []).length);
    g.save.profile.seen.syn = Array.from({ length: 12 }, (_, i) => `S${i}`);
    const gems = g.save.profile.gems || 0;
    checkGoals(g);
    expect(g.save.profile.goalsDone).toContain('syn10');
    expect(g.save.profile.goalsDone).not.toContain('syn25');
    expect(g.save.profile.gems).toBeGreaterThanOrEqual(gems + 3);
    checkGoals(g);
    expect(g.save.profile.goalsDone.filter((k) => k === 'syn10')).toHaveLength(1);
  });
});

describe('H2: Spin & Run is part of the game', () => {
  it('a run win counts as a win for goals and for bounties the runner fits; walking away says what it paid', () => {
    const g = game(4);
    g.pool = null;
    startRun(g);
    const R = runState(g)!;
    // a Slime runner, for the "Win 10 fights as a Slime" bounty
    (R.f.picks as Record<string, string>).race = 'Slime';
    delete (R.f.picks as Record<string, string>).rsub;
    expect(runFighter(R).race.n).toBe('Slime');
    g.save.profile.extra.bounty = { up: ['slimewins'], done: [], prog: {} } as never;
    const wins0 = g.save.profile.stats.wins || 0;
    endRunFight(g, runOpponent(g, R), { w: 0, me: { hp: 50, maxHp: 100 }, them: { hp: 0, maxHp: 100 }, round: 3, sd: false, hist: [[], []] } as never);
    expect(g.save.profile.stats.wins).toBe(wins0 + 1);
    expect((g.save.profile.extra.bounty as { prog: Record<string, number> }).prog.slimewins).toBe(1);
    takeBoon(g, runState(g)!.offer![0]!);
    const lines = quitRun(g);
    expect(lines.length).toBeGreaterThan(0);
    expect(runState(g)).toBe(null);
  });
  it('no patching up at full HP', () => {
    for (let s = 1; s <= 30; s++) {
      const g = game(s);
      startRun(g);
      const R = runState(g)!;
      endRunFight(g, runOpponent(g, R), { w: 0, me: { hp: 100, maxHp: 100 }, them: { hp: 0, maxHp: 100 }, round: 3, sd: false, hist: [[], []] } as never);
      expect(runState(g)!.hp).toBe(100);
      expect(runState(g)!.offer).not.toContain('heal');
    }
  });
});

describe('L5: Spin & Run relics', () => {
  const win = (g: Game, hp = 80) => endRunFight(g, runOpponent(g, runState(g)!), { w: 0, me: { hp, maxHp: 100 }, them: { hp: 0, maxHp: 100 }, round: 3, sd: false, hist: [[], []] } as never);
  const pickPlain = (g: Game) => takeBoon(g, runState(g)!.offer!.find((k) => !relicOf(k))!);
  it('every third pick offers two relics and a plain boon; the others none', () => {
    const g = game(5);
    startRun(g);
    for (let i = 1; i <= 6; i++) {
      win(g);
      const o = runState(g)!.offer!;
      expect(o).toHaveLength(3);
      expect(o.filter((k) => relicOf(k)).length, `after win ${i}`).toBe(i % 3 === 0 ? 2 : 0);
      pickPlain(g);
    }
  });
  it('Glass cannon, Blood pact, Borrowed time and the Cursed crown do what they say', () => {
    const g = game(6);
    startRun(g);
    const R = () => runState(g)!;
    for (let i = 0; i < 3; i++) (win(g), i < 2 && pickPlain(g));
    const take = (k: string) => {
      R().offer = [k, 'str', 'spd'];
      takeBoon(g, k);
    };
    const before = runOpponent(g, R()).lvl || 1;
    take('crown');
    expect(runOpponent(g, R()).lvl).toBe(before + 2);
    R().offer = ['glass'];
    takeBoon(g, 'glass');
    R().hp = 80;
    expect(runMods(R())).toMatchObject({ hp: 60, maxHp: 75, dmgX: 1.4 });
    expect(runSpecOf(g, R()).mods![0]).toMatchObject({ maxHp: 75 });
    R().offer = ['pact'];
    takeBoon(g, 'pact');
    expect(runMods(R()).en).toBe(100);
    // a win under the pact heals nothing
    win(g, 50);
    expect(R().hp).toBe(50);
    pickPlain(g);
    R().offer = ['borrowed'];
    takeBoon(g, 'borrowed');
    expect(R().hp).toBe(100);
    const ends = R().ends!;
    expect(ends).toBe(R().i + 3);
    while (runState(g) && runState(g)!.i < ends) {
      const r = win(g);
      if (runState(g)?.offer) pickPlain(g);
      if (!runState(g)) expect(r.lines.join(' ')).toMatch(/Borrowed time is up/);
    }
    expect(runState(g)).toBe(null);
  });
});

describe('L4: the remix workshop', () => {
  it('builds a remix from a beaten boss and two others, for gems, once; it fights like a trial and counts toward the goals', () => {
    const g = game(8, 36);
    for (const c of [1, 2, 3, 4]) clear(g, c);
    expect(remixBodies(g)).toEqual([0, 1, 2, 3]);
    g.save.profile.gems = REMIX_GEMS + 1;
    // the same boss twice, or a body not beaten yet: no
    expect(buildRemix(g, [0, 0, 5])).toBe(false);
    expect(buildRemix(g, [9, 2, 5])).toBe(false);
    expect(g.save.profile.gems).toBe(REMIX_GEMS + 1);
    expect(buildRemix(g, [2, 7, 15])).toBe(true);
    expect(g.save.profile.gems).toBe(1);
    // built: building again charges nothing
    expect(buildRemix(g, [2, 7, 15])).toBe(true);
    expect(g.save.profile.gems).toBe(1);
    const b = remixBoss(g, builtRemix(g)!);
    expect(b.remix).toEqual([7, 15]);
    expect(b.lvl).toBe(36);
    expect(fightRules({ kind: 'remix', opp: b } as never)).toMatchObject({ maxRounds: 30, suddenDeath: true });
    const r = endRemixFight(g, b, { w: 0, me: g.F, them: b, round: 9, sd: false, hist: [[], []] } as never);
    expect(r.won).toBe(true);
    expect(builtRemix(g)).toBe(null);
    expect(goalCur(g, 'remix1')).toBe(1);
    checkGoals(g);
    expect(g.save.profile.goalsDone).toContain('remix1');
  });
});
