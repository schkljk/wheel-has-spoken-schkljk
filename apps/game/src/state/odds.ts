import { fightOddsJob, headToHead, mulberry32, type FightSpec } from '@whs/core';
import type { OddsMessage, OddsRequest } from '../workers/sim.worker';
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
    worker.onmessage = (e: MessageEvent<OddsMessage>) => {
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
