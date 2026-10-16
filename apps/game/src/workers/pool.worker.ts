import { rankPool, type GameContext } from '@whs/core';

// Rates the day's ranked pool off the main thread.
export type PoolRequest = { seed: number; ctx: GameContext };
export type PoolMessage = { type: 'progress'; done: number; total: number } | { type: 'done'; order: number[]; n: number; seed: number };

// (typed by hand: the app's DOM types would treat `self` as a window)
const scope = self as unknown as { onmessage: ((e: MessageEvent<PoolRequest>) => void) | null; postMessage(m: PoolMessage): void };

scope.onmessage = (e) => {
  const { seed, ctx } = e.data;
  const r = rankPool(seed, { ctx, onProgress: (done, total) => scope.postMessage({ type: 'progress', done, total }) });
  scope.postMessage({ type: 'done', order: r.order, n: r.n, seed: r.seed });
};
