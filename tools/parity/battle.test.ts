import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ARENAS, BALANCE, LEGACY_BALANCE, MUTATORS, ULT_WHEEL, kitMoves, mulberry32, newBattle, randomFighter, useBalance, type Battle, type BattleEvent,
  type Fighter, type Move, type Rng, type RoundMod,
} from '../../packages/core/src';
import { decorate, legacyCore, randomExtras } from './fixtures';

// the old game had no AI personalities: compare with them switched off
const tuned = { ...BALANCE };
beforeAll(() => useBalance(LEGACY_BALANCE));
afterAll(() => useBalance(tuned));

const L = legacyCore();
type LF = Record<string, unknown>;
type LBattle = {
  P: { hp: number; maxHp: number; en: number; st: unknown; ultSpin?: unknown }[];
  round: number;
  over: boolean;
  w: number;
  start(): LEvent[];
  plan(): { shown: string; acc: number };
  step(c0?: string | null, c1?: string | null, m0?: unknown, m1?: unknown): LEvent[];
};
type LEvent = { html: string } & Record<string, unknown>;
const legacyNewBattle = L.get<(a: LF, b: LF, quiet: boolean, opts: unknown) => LBattle>('newBattle');
const legacyRandomFighter = L.get<(n: string) => LF>('randomFighter');
const legacyArenas = L.get<LF[]>('ARENAS');

const NAMES = ['Alpha', 'Bravo'] as const;
const copy = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

interface Setup {
  seed: number;
  extrasA: ReturnType<typeof randomExtras>;
  extrasB: ReturnType<typeof randomExtras>;
  arena: number | null;
  mods?: [Record<string, number>, Record<string, number>];
  maxRounds?: number;
  suddenDeath?: boolean;
}

/** Varied fight setups: arenas, mutators, story HP, round limits, sudden death, bosses. */
function setup(seed: number): Setup {
  const r = mulberry32(seed * 7919 + 13);
  const boss = r() < 0.15;
  const s: Setup = {
    seed,
    extrasA: randomExtras(seed * 2),
    extrasB: randomExtras(seed * 2 + 1, { boss }),
    arena: r() < 0.75 ? Math.floor(r() * ARENAS.length) : null,
  };
  const m = r();
  if (m < 0.25) s.mods = copy(MUTATORS[Math.floor(r() * MUTATORS.length)]!.mods) as Setup['mods'];
  else if (m < 0.45) s.mods = [{ hp: 10 + Math.floor(r() * 90) }, boss ? { maxHp: s.extrasB.maxHp ?? 300 } : {}];
  else if (m < 0.5) s.mods = [{ revive: 30, readB: 0.2 }, { dmgX: 1.25 }];
  const lim = r();
  if (lim < 0.2) s.maxRounds = 20;
  else if (lim < 0.4 || boss) {
    s.maxRounds = 30;
    s.suddenDeath = boss || r() < 0.5;
  }
  if (r() < 0.08) {
    // very short fights hit the judges often, or go to sudden death
    s.maxRounds = 1 + Math.floor(r() * 4);
    s.suddenDeath = r() < 0.5;
  }
  return s;
}

function fighters(s: Setup) {
  L.setRng(mulberry32(s.seed * 2));
  const la = decorate(legacyRandomFighter(NAMES[0]), s.extrasA);
  L.setRng(mulberry32(s.seed * 2 + 1));
  const lb = decorate(legacyRandomFighter(NAMES[1]), s.extrasB);
  const pa = decorate(randomFighter(NAMES[0], mulberry32(s.seed * 2)), s.extrasA);
  const pb = decorate(randomFighter(NAMES[1], mulberry32(s.seed * 2 + 1)), s.extrasB);
  return { la, lb, pa, pb };
}

const legacyOpts = (s: Setup) => ({
  arena: s.arena == null ? undefined : legacyArenas[s.arena],
  mods: copy(s.mods),
  maxRounds: s.maxRounds,
  suddenDeath: s.suddenDeath,
});
const portedOpts = (s: Setup, quiet: boolean) => ({
  arena: s.arena == null ? undefined : ARENAS[s.arena],
  mods: copy(s.mods),
  maxRounds: s.maxRounds,
  suddenDeath: s.suddenDeath,
  quiet,
});

const unescape = (h: string) => h.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const normalize = (e: LEvent) => {
  const { html, ...rest } = e;
  return { text: unescape(html.replaceAll(`<b>${NAMES[0]}</b>`, '{0}').replaceAll(`<b>${NAMES[1]}</b>`, '{1}')), ...rest };
};
/**
 * The new engine adds UI cues legacy doesn't have: synergy tags for the banners (`a.syn`, `a.sb`) and the
 * status icons with their counters (`sx`). They are left out of the comparison.
 */
const uncue = (e: unknown) => {
  const { sx: _x, ...x } = e as BattleEvent;
  if (!x.a || x.a.syn == null) return x;
  const { syn: _s, sb: _b, ...a } = x.a;
  return { ...x, a };
};
const state = (b: { P: { hp: number; maxHp: number; en: number; st: unknown }[]; round: number; w: number | null }) => ({
  w: b.w,
  round: b.round,
  hp: b.P.map((x) => x.hp),
  maxHp: b.P.map((x) => x.maxHp),
  en: b.P.map((x) => x.en),
  st: b.P.map((x) => x.st),
});

const N = 2000;

describe('battle engine parity', () => {
  it(`AI vs AI: same winner, rounds and HP for ${N} seeded pairs`, () => {
    let sd = 0;
    let judged = 0;
    for (let seed = 1; seed <= N; seed++) {
      const s = setup(seed);
      const { la, lb, pa, pb } = fighters(s);
      const lr = mulberry32(seed);
      L.setRng(lr);
      const lb2 = legacyNewBattle(la, lb, true, legacyOpts(s));
      lb2.start();
      while (!lb2.over) lb2.step();
      const pr = mulberry32(seed);
      const pb2 = newBattle(pa, pb, pr, portedOpts(s, true));
      pb2.start();
      while (!pb2.over) pb2.step();
      expect(state(pb2), `seed ${seed}`).toEqual(state(lb2));
      expect(pr(), `random draws used, seed ${seed}`).toBe(lr());
      if (pb2.sd) sd++;
      if (pb2.P[0].hp > 0 && pb2.P[1].hp > 0) judged++;
    }
    // the setups really exercise sudden death and decisions on points
    expect(sd).toBeGreaterThan(50);
    expect(judged).toBeGreaterThan(50);
    console.log(`sudden death: ${sd}, decided on points: ${judged}`);
  });

  it('narration and animation cues match event for event', () => {
    for (let seed = 1; seed <= 600; seed++) {
      const s = setup(seed);
      const { la, lb, pa, pb } = fighters(s);
      L.setRng(mulberry32(seed));
      const lbt = legacyNewBattle(la, lb, false, legacyOpts(s));
      const pbt = newBattle(pa, pb, mulberry32(seed), portedOpts(s, false));
      const lev: unknown[] = lbt.start().map(normalize);
      const pev: BattleEvent[] = pbt.start();
      while (!lbt.over) lev.push(...lbt.step().map(normalize));
      while (!pbt.over) pev.push(...pbt.step());
      expect(pev.map(uncue), `seed ${seed}`).toEqual(lev);
    }
  });

  it('player-driven fights (plan, chosen moves, kit moves, landed signature) match', () => {
    const MOVES: Move[] = ['strike', 'power', 'guard', 'feint', 'focus', 'ult', 'dodge'];
    for (let seed = 1; seed <= 600; seed++) {
      const s = setup(seed + 5000);
      const { la, lb, pa, pb } = fighters(s);
      const lr = mulberry32(seed);
      L.setRng(lr);
      const lbt = legacyNewBattle(la, lb, false, legacyOpts(s));
      const pr = mulberry32(seed);
      const pbt: Battle = newBattle(pa, pb, pr, portedOpts(s, false));
      const lev: unknown[] = lbt.start().map(normalize);
      const pev: unknown[] = pbt.start();
      // the "player" decides from their own RNG, identically for both engines
      const choose: Rng = mulberry32(seed + 99);
      const kit = kitMoves(pa);
      while (!lbt.over && !pbt.over) {
        expect(pbt.plan()).toEqual(lbt.plan());
        let c: Move = MOVES[Math.floor(choose() * MOVES.length)]!;
        let m: RoundMod = {};
        const roll = choose();
        if (roll < 0.35 && kit.length) {
          const k = kit[Math.floor(choose() * kit.length)]!;
          c = k.c;
          m = k.rm;
        } else if (roll < 0.45) m = { dmgX: 1.45, slow: 1, label: 'Heavy blow' };
        if (choose() < 0.3) {
          const u = ULT_WHEEL[Math.floor(choose() * ULT_WHEEL.length)]!;
          lbt.P[0]!.ultSpin = copy(u);
          pbt.P[0].ultSpin = copy(u);
        }
        lev.push(...lbt.step(c, null, copy(m)).map(normalize));
        pev.push(...pbt.step(c, null, copy(m)));
      }
      expect(pbt.over).toBe(lbt.over);
      expect(state(pbt), `seed ${seed}`).toEqual(state(lbt));
      expect(pev.map(uncue), `seed ${seed}`).toEqual(lev);
      expect(pr()).toBe(lr());
    }
  });
});

export type { Fighter };
