import { headToHead, mulberry32, rankPool, winRate, type BattleOpts, type Fighter, type GameContext } from '@whs/core';

// The simulations that would freeze the screen, off the main thread: the day's ranked pool (once a day), each
// fight's win odds (120 fights; half a second on a mid-range phone) and a fighter's rating on their card (160
// fights; over a second). One worker file for all, so the engine is downloaded once for them.
export type PoolRequest = { type: 'pool'; seed: number; ctx: GameContext };
export type OddsRequest = { type: 'odds'; id: number; a: Fighter; b: Fighter; n: number; seed: number; opts: Omit<BattleOpts, 'quiet'> };
export type PoolMessage = { type: 'progress'; done: number; total: number } | { type: 'done'; order: number[]; n: number; seed: number };
export type OddsMessage = { type: 'odds'; id: number; p: number };
/** A fighter's rating (rating.ts winRate): the same fights, so the same number as on the main thread. */
export type RateRequest = { type: 'rate'; id: number; f: Fighter; ctx: GameContext };
export type RateMessage = { type: 'rate'; id: number; p: number };

// (typed by hand: the app's DOM types would treat `self` as a window)
const scope = self as unknown as { onmessage: ((e: MessageEvent<PoolRequest | OddsRequest | RateRequest>) => void) | null; postMessage(m: PoolMessage | OddsMessage | RateMessage): void };

scope.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'odds') {
    scope.postMessage({ type: 'odds', id: m.id, p: headToHead(m.a, m.b, mulberry32(m.seed), m.n, m.opts) });
    return;
  }
  if (m.type === 'rate') {
    scope.postMessage({ type: 'rate', id: m.id, p: winRate(m.f, m.ctx) });
    return;
  }
  const r = rankPool(m.seed, { ctx: m.ctx, onProgress: (done, total) => scope.postMessage({ type: 'progress', done, total }) });
  scope.postMessage({ type: 'done', order: r.order, n: r.n, seed: r.seed });
};
