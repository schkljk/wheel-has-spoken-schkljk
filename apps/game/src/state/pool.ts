import { signal } from '@preact/signals';
import { hashStr, poolSeed, type GameContext, type PoolRanking } from '@whs/core';
import type { PoolMessage } from '../workers/pool.worker';
import { kv } from './storage';

// The ranked pool is built in a Web Worker once per day and cached.
const CACHE = 'whs:pool';
export const todayKey = () => new Date().toDateString();

export const pool = signal<PoolRanking | null>(null);
/** 0..1 while building, 1 when ready */
export const poolProgress = signal(0);

/** The pool depends on balance patches and past champions (reincarnation slices). */
const ctxKey = (ctx: GameContext) => hashStr(JSON.stringify([ctx.patch ?? null, (ctx.history?.champs ?? []).map((c) => c.n)]));

let worker: Worker | null = null;

export function ensurePool(ctx: GameContext): void {
  const day = todayKey();
  const key = ctxKey(ctx);
  try {
    const c = JSON.parse(kv.getItem(CACHE) || 'null') as { day: string; key: number; ranking: PoolRanking } | null;
    if (c && c.day === day && c.key === key && c.ranking?.order?.length) {
      pool.value = c.ranking;
      poolProgress.value = 1;
      return;
    }
  } catch {
    // rebuild below
  }
  if (worker) return;
  pool.value = null;
  poolProgress.value = 0;
  const seed = poolSeed(day);
  worker = new Worker(new URL('../workers/pool.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<PoolMessage>) => {
    const m = e.data;
    if (m.type === 'progress') poolProgress.value = m.done / m.total;
    else {
      const ranking: PoolRanking = { seed: m.seed, n: m.n, order: m.order };
      pool.value = ranking;
      poolProgress.value = 1;
      try {
        kv.setItem(CACHE, JSON.stringify({ day, key, ranking }));
      } catch {
        // cache is optional
      }
      worker?.terminate();
      worker = null;
    }
  };
  worker.postMessage({ seed, ctx });
}
