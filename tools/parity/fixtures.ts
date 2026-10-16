import { GEAR, INJURIES, TNODE, mulberry32, type Fighter, type Rng } from '../../packages/core/src';
import { loadLegacyCore, type LegacyCore } from './legacy';

/** Plain-data career extras applied identically to a legacy fighter and its port. */
export interface Extras {
  lvl?: number;
  gear?: Record<string, string>;
  talents?: Record<string, number>;
  inj?: { k: string }[];
  lfx?: { m?: Record<string, number>; fx?: Record<string, number> };
  bossFx?: Record<string, number>;
  maxHp?: number;
  isBoss?: boolean;
  aiSkill?: number;
  phase?: { txt: string; m?: Record<string, number>; fx?: Record<string, number> };
  wheelBoss?: number;
}

const SLOTS = ['armor', 'trinket', 'boots', 'helm', 'gloves', 'cape'] as const;
const pickOne = <T>(r: Rng, a: readonly T[]) => a[Math.floor(r() * a.length)]!;

/** Random but reproducible extras: levels, gear (incl. sets), talents, injuries, perks, boss traits. */
export function randomExtras(seed: number, opts: { boss?: boolean } = {}): Extras {
  const r = mulberry32(seed ^ 0x5bd1e995);
  const x: Extras = {};
  if (r() < 0.8) x.lvl = 1 + Math.floor(r() * 50);
  if (r() < 0.7) {
    x.gear = {};
    const setBias = r() < 0.3 ? pickOne(r, ['knight', 'shadow', 'arcane', 'clown']) : null;
    for (const s of SLOTS) {
      if (r() < 0.35) continue;
      const opts2 = GEAR.filter((g) => g.slot === s && (!setBias || g.set === setBias || r() < 0.2));
      const pool = opts2.length ? opts2 : GEAR.filter((g) => g.slot === s);
      x.gear[s] = pickOne(r, pool).k;
    }
  }
  if (r() < 0.6) {
    x.talents = {};
    const keys = Object.keys(TNODE);
    const n = 1 + Math.floor(r() * 12);
    for (let i = 0; i < n; i++) {
      const k = pickOne(r, keys);
      x.talents[k] = 1 + Math.floor(r() * TNODE[k]!.max);
    }
  }
  if (r() < 0.2) x.inj = INJURIES.filter(() => r() < 0.4).map((j) => ({ k: j.k }));
  if (r() < 0.3) x.lfx = { m: { str: Math.floor(r() * 3), dur: Math.floor(r() * 2) }, fx: { critB: 0.02 * Math.floor(r() * 3), regen: Math.floor(r() * 3) } };
  if (opts.boss || r() < 0.08) {
    x.isBoss = true;
    x.maxHp = 150 + Math.floor(r() * 350);
    x.aiSkill = Math.round(r() * 95) / 100;
    x.bossFx = { dodgeB: 0.05 * Math.floor(r() * 3), critB: 0.04 * Math.floor(r() * 3), regen: Math.floor(r() * 4) };
    if (r() < 0.8) x.phase = { txt: 'Phase two begins.', m: { str: Math.floor(r() * 3), spd: Math.floor(r() * 3) }, fx: { dmgX: 1.15, extra: 0.1, regen: 2 } };
    if (r() < 0.15) x.wheelBoss = 1;
  }
  return x;
}

/** Deep copy of plain data, so the two engines never share mutable objects. */
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
export const decorate = <F extends object>(f: F, x: Extras): F => Object.assign(f, copy(x));

export interface Pair {
  legacy: Record<string, unknown>;
  ported: Fighter;
}

/** Rolls the same fighter in both engines from one seed. */
export function rollPair(L: LegacyCore, seed: number, name: string, ported: (name: string, rng: Rng) => Fighter): Pair {
  L.setRng(mulberry32(seed));
  const legacy = L.get<(n: string) => Record<string, unknown>>('randomFighter')(name);
  const p = ported(name, mulberry32(seed));
  return { legacy, ported: p };
}

let shared: LegacyCore | null = null;
export const legacyCore = () => (shared ??= loadLegacyCore(mulberry32(0)));
