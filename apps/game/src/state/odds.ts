import { fightOddsJob, headToHead, mulberry32, serFighter, winRate, type CareerFighter, type FightSpec, type GameContext } from '@whs/core';
import type { OddsMessage, OddsRequest, RateMessage, RateRequest } from '../workers/sim.worker';
import { G } from './game';

// Fight odds come from a worker that stays up between fights. If workers are missing or a fighter can't be
// copied over, the same numbers are worked out here instead.
let worker: Worker | null = null;
let nextId = 1;
const waiting = new Map<number, (p: number) => void>();

function oddsWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('../workers/sim.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<OddsMessage | RateMessage>) => {
      waiting.get(e.data.id)?.(e.data.p);
      waiting.delete(e.data.id);
    };
    worker.onerror = () => {
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

/** The fight's simulated chance to win, worked out off the main thread. Sets `spec.odds` when it is known. */
export function oddsFor(spec: FightSpec): Promise<number> {
  const job = fightOddsJob(G, spec);
  const here = () => headToHead(job.a, job.b, mulberry32(job.seed), job.n, job.opts);
  const set = (p: number) => ((spec.odds = p), p);
  const w = oddsWorker();
  if (!w) return Promise.resolve(set(here()));
  const id = nextId++;
  return new Promise<number>((resolve) => {
    waiting.set(id, (p) => resolve(set(p)));
    try {
      w.postMessage({ type: 'odds', id, ...job } satisfies OddsRequest);
    } catch {
      waiting.delete(id);
      resolve(set(here()));
    }
  });
}

type Rated = CareerFighter & { _win?: number | null };
const rating = new WeakMap<object, Promise<number>>();
/**
 * A fighter's rating (their share of wins against random level 1 fighters: 160 fights, over a second on a
 * mid-range phone), worked out in the worker. It lands in the fighter's own cache (`_win`), as if worked out
 * here, unless their build changed while it was on the way.
 */
export function rateFor(f: Rated, ctx: GameContext): Promise<number> {
  if (f._win != null) return Promise.resolve(f._win);
  const hit = rating.get(f);
  if (hit) return hit;
  const sig = () => JSON.stringify([serFighter(f), ctx]);
  const before = sig();
  const keep = (p: number) => {
    rating.delete(f);
    if (f._win == null && sig() === before) f._win = p;
    return p;
  };
  // no worker: here, but after the screen has drawn
  const here = () => new Promise<number>((ok) => setTimeout(() => ok(keep(f._win ?? winRate(f, ctx))), 30));
  const w = oddsWorker();
  let p: Promise<number>;
  if (!w) p = here();
  else {
    const id = nextId++;
    p = new Promise<number>((resolve) => {
      waiting.set(id, (x) => resolve(keep(x)));
      try {
        w.postMessage({ type: 'rate', id, f, ctx } satisfies RateRequest);
      } catch {
        waiting.delete(id);
        void here().then(resolve);
      }
    });
  }
  rating.set(f, p);
  return p;
}
