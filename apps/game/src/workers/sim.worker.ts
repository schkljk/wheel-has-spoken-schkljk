import { headToHead, mulberry32, rankPool, type BattleOpts, type Fighter, type GameContext } from '@whs/core';

// The simulations that would freeze the screen, off the main thread: the day's ranked pool (once a day) and each
// fight's win odds (120 fights; half a second on a mid-range phone). One worker file for both, so the engine is
// downloaded once for them.
export type PoolRequest = { type: 'pool'; seed: number; ctx: GameContext };
export type OddsRequest = { type: 'odds'; id: number; a: Fighter; b: Fighter; n: number; seed: number; opts: Omit<BattleOpts, 'quiet'> };
export type PoolMessage = { type: 'progress'; done: number; total: number } | { type: 'done'; order: number[]; n: number; seed: number };
export type OddsMessage = { type: 'odds'; id: number; p: number };

// (typed by hand: the app's DOM types would treat `self` as a window)
const scope = self as unknown as { onmessage: ((e: MessageEvent<PoolRequest | OddsRequest>) => void) | null; postMessage(m: PoolMessage | OddsMessage): void };

scope.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'odds') {
    scope.postMessage({ type: 'odds', id: m.id, p: headToHead(m.a, m.b, mulberry32(m.seed), m.n, m.opts) });
    return;
  }
  const r = rankPool(m.seed, { ctx: m.ctx, onProgress: (done, total) => scope.postMessage({ type: 'progress', done, total }) });
  scope.postMessage({ type: 'done', order: r.order, n: r.n, seed: r.seed });
};
