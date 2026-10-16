import { describe, expect, it } from 'vitest';
import {
  ARCHS, LS, RACES, WHEELS, applyBonus, bestStat, eff, kitMoves, levelUp, mulberry32, numStats, powerScale, randName,
  randomFighter, rate, synOf, traitsBase, traitsOf, type Fighter, type GameContext,
} from '../../packages/core/src';
import { decorate, legacyCore, randomExtras } from './fixtures';

const L = legacyCore();
type LF = Record<string, unknown>;
const lfn = <A extends unknown[], R>(n: string) => L.get<(...a: A) => R>(n);

const id = (it: unknown) => {
  if (!it || typeof it !== 'object') return null;
  const o = it as { k?: string; n?: string; v?: unknown };
  return `${o.k ?? ''}|${o.n}|${typeof o.v === 'number' ? o.v : ''}`;
};

/** Same seed in both engines; also checks both consumed the same number of random draws. */
function roll(seed: number, ctx: GameContext = {}) {
  const lr = mulberry32(seed);
  L.setRng(lr);
  const legacy = lfn<[string], LF>('randomFighter')('Fighter ' + seed);
  const pr = mulberry32(seed);
  const ported = randomFighter('Fighter ' + seed, pr, ctx);
  expect(pr(), `random draws used for seed ${seed}`).toBe(lr());
  return { legacy, ported };
}

const N = 2000;

describe('fighter generation', () => {
  it(`rolls identical fighters for ${N} seeds`, () => {
    for (let seed = 1; seed <= N; seed++) {
      const { legacy, ported } = roll(seed);
      for (const W of WHEELS) expect(id(ported[W.k]), `seed ${seed} wheel ${W.k}`).toBe(id(legacy[W.k]));
    }
  });

  it('rolls the reincarnation wheel from past champions', () => {
    const history = {
      champs: [{ n: 'Old Champ', best: 'dur' as const }, { n: 'Older Champ' }],
      lastTop: [{ n: 'Runner Up', place: 2, best: 'spd' as const }, { n: 'Winner', place: 1 }],
    };
    const H = L.get<{ champs: unknown[]; lastTop: unknown[] }>('HISTORY');
    H.champs = JSON.parse(JSON.stringify(history.champs));
    H.lastTop = JSON.parse(JSON.stringify(history.lastTop));
    try {
      let reinc = 0;
      for (let seed = 1; seed <= N; seed++) {
        const { legacy, ported } = roll(seed, { history });
        if (legacy.reinc) reinc++;
        for (const W of WHEELS) expect(id(ported[W.k]), `seed ${seed} wheel ${W.k}`).toBe(id(legacy[W.k]));
        if (legacy.reinc) expect(ported.reinc).toEqual(legacy.reinc);
      }
      expect(reinc).toBeGreaterThan(5);
    } finally {
      H.champs = [];
      H.lastTop = [];
    }
  });

  it('generates identical names', () => {
    for (let seed = 1; seed <= N; seed++) {
      const lr = mulberry32(seed);
      L.setRng(lr);
      const pr = mulberry32(seed);
      expect(randName(pr)).toBe(lfn<[], string>('randName')());
      expect(pr()).toBe(lr());
    }
  });
});

describe('stats, traits and kits', () => {
  it(`match for ${N} decorated fighters (levels, gear, talents, injuries, perks, bosses)`, () => {
    for (let seed = 1; seed <= N; seed++) {
      const { legacy, ported } = roll(seed);
      const x = randomExtras(seed);
      decorate(legacy, x);
      decorate(ported, x);
      const at = `seed ${seed}`;
      expect(eff(ported), at).toEqual(lfn<[LF], unknown>('eff')(legacy));
      expect(traitsBase(ported), at).toEqual(lfn<[LF], unknown>('traitsBase')(legacy));
      expect(traitsOf(ported), at).toEqual(lfn<[LF], unknown>('traitsOf')(legacy));
      expect(synOf(ported).map((s) => s.k), at).toEqual(lfn<[LF], { k: string }[]>('synOf')(legacy).map((s) => s.k));
      expect(numStats(ported), at).toEqual(lfn<[LF], unknown>('numStats')(legacy));
      expect(rate(ported), at).toBe(lfn<[LF], number>('rate')(legacy));
      expect(LS(ported), at).toBe(lfn<[LF], number>('LS')(legacy));
      expect(powerScale(ported), at).toEqual(lfn<[LF], unknown>('powerScale')(legacy));
      expect(bestStat(ported), at).toBe(lfn<[LF], string>('bestStat')(legacy));
      expect(kitMoves(ported), at).toEqual(lfn<[LF], unknown>('kitMoves')(legacy));
    }
  });

  it('applies balance patches to effective stats', () => {
    const patch = { race: { Human: { str: 1 }, Orc: { dur: -1 } }, arch: { mage: { pm: -1 }, tank: { spd: 1 } } };
    const P = L.get<{ race: unknown; arch: unknown }>('PATCH');
    P.race = patch.race;
    P.arch = patch.arch;
    try {
      for (let seed = 1; seed <= 400; seed++) {
        const { legacy, ported } = roll(seed);
        expect(eff(ported, { patch }), `seed ${seed}`).toEqual(lfn<[LF], unknown>('eff')(legacy));
      }
    } finally {
      P.race = {};
      P.arch = {};
    }
  });

  it('levels up identically', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { legacy, ported } = roll(seed);
      const lr = mulberry32(seed + 7);
      L.setRng(lr);
      lfn<[LF, number], void>('levelUp')(legacy, 5);
      lfn<[LF, unknown], void>('applyBonus')(legacy, { k: 'cure', n: 'Cure', e: '🩹' });
      const pr = mulberry32(seed + 7);
      levelUp(ported, 5, pr);
      applyBonus(ported, { k: 'cure', n: 'Cure', e: '🩹' });
      expect(ported.bonus).toEqual(legacy.bonus);
      expect(ported.lvl).toBe(legacy.lvl);
      expect(ported.weak).toEqual(legacy.weak);
      expect(eff(ported)).toEqual(lfn<[LF], unknown>('eff')(legacy));
    }
  });

  it('only the newer races and classes carry their own traits (the legacy wrapper looked them up there)', () => {
    const newRaces = new Set(L.get<{ n: string; fx?: unknown }[]>('NEW_RACES').filter((r) => r.fx).map((r) => r.n));
    const newArchs = new Set(L.get<{ k: string; fx?: unknown }[]>('NEW_ARCHS').filter((a) => a.fx).map((a) => a.k));
    expect(new Set(RACES.filter((r) => r.fx).map((r) => r.n))).toEqual(newRaces);
    expect(new Set(ARCHS.filter((a) => a.fx).map((a) => a.k))).toEqual(newArchs);
  });
});

export type { Fighter };
