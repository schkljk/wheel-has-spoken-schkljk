import { simulate } from './battle';
import { randomFighter } from './fighter';
import { randName } from './names';
import { clamp } from './random';
import { mulberry32, type Rng } from './rng';
import { deserFighter, hashStr, serFighter, type CareerFighter } from './save/fighter';
import type { GameContext } from './stats';

// The ranked pool: 1,000 random fighters rated against each other (Elo over 5,000 simulated
// fights), so opponents can be drawn from the slice of the ranking where they belong.
// Same rules as the legacy pool; the difference is that fighter i is rolled from its own seed,
// so a ranking can be cached as a list of indices and any fighter rebuilt on demand.

export const POOL_N = 1000;
export const POOL_GAMES = 5000;

export interface PoolRanking {
  seed: number;
  n: number;
  /** fighter indices from weakest to strongest */
  order: number[];
}

/** The day's pool seed (a date key such as "Fri Oct 16 2026"). */
export const poolSeed = (dayKey: string) => hashStr('pool|' + dayKey);

/** Pool fighter i, rebuilt identically from the seed every time. */
export function poolFighter(seed: number, i: number, ctx: GameContext = {}) {
  return randomFighter('pool', mulberry32((seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0), ctx);
}

/** Rates the pool. Heavy (thousands of fights): run it in a Web Worker. */
export function rankPool(
  seed: number,
  opts: { n?: number; games?: number; ctx?: GameContext; onProgress?: (done: number, total: number) => void } = {},
): PoolRanking {
  const n = opts.n ?? POOL_N;
  const games = opts.games ?? POOL_GAMES;
  const ctx = opts.ctx ?? {};
  const list = Array.from({ length: n }, (_, i) => poolFighter(seed, i, ctx));
  const elo = new Array<number>(n).fill(1000);
  const rng = mulberry32(seed ^ 0x51ed270b);
  for (let g = 0; g < games; g++) {
    const a = Math.floor(rng() * n);
    const b = (a + 1 + Math.floor(rng() * (n - 1))) % n;
    const w = simulate(list[a]!, list[b]!, rng, { ctx }) === 0 ? 1 : 0;
    const ea = 1 / (1 + Math.pow(10, (elo[b]! - elo[a]!) / 400));
    const K = g < games * 0.4 ? 40 : g < games * 0.75 ? 24 : 12;
    elo[a]! += K * (w - ea);
    elo[b]! -= K * (w - ea);
    if (opts.onProgress && (g + 1) % 250 === 0) opts.onProgress(g + 1, games);
  }
  const order = list.map((_, i) => i).sort((x, y) => elo[x]! - elo[y]!);
  return { seed, n, order };
}

export type PoolPick = CareerFighter & { poolPct?: number };

/**
 * An opponent from a slice of the ranking (0 = weakest, 1 = strongest). Before the pool is ready
 * this is simply a random fighter, as in the legacy game.
 */
export function poolPick(ranking: PoolRanking | null, lo: number, hi: number, rng: Rng, name?: string, ctx: GameContext = {}): PoolPick {
  if (!ranking) return randomFighter(name || randName(rng), rng, ctx);
  const n = ranking.order.length;
  const i = clamp(Math.floor((lo + rng() * Math.max(0.001, hi - lo)) * n), 0, n - 1);
  const o = deserFighter(serFighter(poolFighter(ranking.seed, ranking.order[i]!, ctx)))! as PoolPick;
  o.name = name || randName(rng);
  o.poolPct = i / n;
  return o;
}

/** "Top 12%" style label for a pool fighter. */
export const rankTxt = (o: { poolPct?: number } | null | undefined) =>
  o && o.poolPct != null ? `Rank ${Math.max(1, Math.round((1 - o.poolPct) * 1000))}` : '';
