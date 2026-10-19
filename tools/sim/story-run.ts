/**
 * Whole story runs with weak, average and strong builds (see story.ts for the player's choices), spread
 * over worker threads.
 *   npx tsx tools/sim/story-run.ts [--runs 30] [--seed 1] [--to 20] [--cups 0] [--off storyNemesis] [--before]
 */
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { BALANCE, BOSS_HP, BOSS_STAT_SHIFT, CHAPTERS, mulberry32, rankPool, type PoolRanking } from '../../packages/core/src';
import { fighterOfStrength, newRun, playStory, type RunLog } from './story';

export type Strength = 'weak' | 'average' | 'strong';
export interface Job {
  s: Strength;
  r: number;
}
const STRENGTHS: Strength[] = ['weak', 'average', 'strong'];

function runJob(j: Job, seed: number, to: number, pool: PoolRanking, cups: number): RunLog {
  const rng = mulberry32((seed * 7919 + j.r * 104729 + STRENGTHS.indexOf(j.s) * 15485863) >>> 0);
  return playStory(newRun(rng, pool, fighterOfStrength(j.s)), to, cups ? { cupsPerReset: cups, maxResets: 8 } : {});
}

/** Plays these runs on worker threads (with these boss tables, if given). */
/** The on/off switches of the balance table, so worker threads play by the same rules as the main thread. */
const switches = () => Object.fromEntries(Object.entries(BALANCE).filter(([, v]) => typeof v === 'boolean' || typeof v === 'number')) as Record<string, boolean | number>;
/** The game before the review's design pass (E1-E5): its switches off, bosses toughening up to three levels. */
export const BEFORE_REVIEW = { pureFocus: false, fairReads: false, statRoles: false, healRules: false, storyPacing: false, bossTuneCap: 3 };

export async function runMany(jobs: Job[], o: { seed: number; to: number; pool: PoolRanking; cups?: number; bossHp?: number[]; bossShift?: number[] }) {
  const n = Math.max(1, Math.min(availableParallelism(), jobs.length));
  const parts = Array.from({ length: n }, (_, i) => jobs.filter((_, k) => k % n === i));
  const done = await Promise.all(
    parts.map(
      (part) =>
        new Promise<{ j: Job; log: RunLog }[]>((resolve, reject) => {
          // workers don't inherit tsx's loader: register it, then load this file
          const boot = `import(${JSON.stringify(import.meta.resolve('tsx/esm/api'))}).then((m) => (m.register(), import(${JSON.stringify(import.meta.url)})))`;
          const w = new Worker(boot, { eval: true, workerData: { part, ...o, cups: o.cups ?? 0, switches: switches() } });
          w.once('message', resolve);
          w.once('error', reject);
        }),
    ),
  );
  return done.flat();
}

/** Plays `runs` stories per build strength and prints a table per chapter. */
export async function storyTables(runs: number, seed: number, to = CHAPTERS.length, cups = 0) {
  const t0 = Date.now();
  const pool = rankPool(seed, { n: 1000, games: 5000 });
  const jobs: Job[] = STRENGTHS.flatMap((s) => Array.from({ length: runs }, (_, r) => ({ s, r })));
  const all: Record<Strength, RunLog[]> = { weak: [], average: [], strong: [] };
  for (const { j, log } of await runMany(jobs, { seed, to, pool, cups })) all[j.s].push(log);

  const pad = (x: string | number, w: number) => String(x).padStart(w);
  console.log(
    `\nStory runs: ${runs} per build strength (worst, median and best of 8 random builds), auto-battle, ${cups ? `${cups} cup(s) after each restart` : 'story only'}`,
  );
  console.log('Reached: runs that cleared the chapter. Lvl: median level at the clear. Win: other fights won. Boss: wins per boss try. Resets: restarts per run (out of grit).');
  console.log(`${'Ch'.padEnd(25)}${pad('Lvl', 4)}${STRENGTHS.map((s) => pad(s, 32)).join('')}`);
  console.log(`${''.padEnd(29)}${STRENGTHS.map(() => pad('Reached  Lvl  Win  Boss Resets', 32)).join('')}`);
  for (let ch = 1; ch <= to; ch++) {
    const cells = STRENGTHS.map((s) => {
      const logs = all[s].map((r) => r.chapters.find((c) => c.ch === ch)).filter((c) => !!c);
      const lv = logs.map((c) => c.lvl).sort((a, b) => a - b);
      const bt = logs.reduce((a, c) => a + c.bossTries, 0);
      const bw = logs.reduce((a, c) => a + c.bossWins, 0);
      const stuck = all[s].filter((r) => r.stuck === ch);
      const tried = logs.length + stuck.length;
      const resets = tried ? (logs.reduce((a, c) => a + c.resets, 0) + stuck.length * 5) / tried : 0;
      const rf = logs.reduce((a, c) => a + c.fights - c.bossTries, 0);
      const rw = logs.reduce((a, c) => a + c.wins - c.bossWins, 0);
      return (
        pad(`${Math.round((logs.length / runs) * 100)}%`, 7) +
        pad(lv.length ? lv[lv.length >> 1]! : '-', 5) +
        pad(rf ? `${Math.round((rw / rf) * 100)}%` : '-', 5) +
        pad(bt ? `${Math.round((bw / bt) * 100)}%` : '-', 6) +
        pad(tried ? resets.toFixed(1) : '-', 7)
      );
    });
    console.log(`${String(ch).padStart(2)} ${CHAPTERS[ch - 1]!.n.slice(0, 21).padEnd(22)}${pad(CHAPTERS[ch - 1]!.lvl, 4)}${cells.map((c) => pad(c, 32)).join('')}`);
  }
  const sum = (s: Strength, k: 'nem' | 'nemWins' | 'nemRetired') => all[s].reduce((a, r) => a + r.chapters.reduce((b, c) => b + c[k], 0), 0);
  if (STRENGTHS.some((s) => sum(s, 'nem')))
    console.log(
      `Nemesis fights per run (won, retired): ${STRENGTHS.map((s) => `${s} ${(sum(s, 'nem') / runs).toFixed(1)} (${Math.round((sum(s, 'nemWins') / Math.max(1, sum(s, 'nem'))) * 100)}%, ${(sum(s, 'nemRetired') / runs).toFixed(2)})`).join(', ')}`,
    );
  const ups = (s: Strength) => all[s].reduce((a, r) => a + (r.upLevels || 0), 0) / runs;
  if (STRENGTHS.some((s) => ups(s))) console.log(`Gear upgrade levels at the end (all pieces): ${STRENGTHS.map((s) => `${s} ${ups(s).toFixed(1)}`).join(', ')}`);
  console.log(`Coins left at the end: ${STRENGTHS.map((s) => `${s} ${Math.round(all[s].reduce((a, r) => a + (r.coins || 0), 0) / runs)}`).join(', ')}`);
  if (cups) console.log(`Cups played per run: ${STRENGTHS.map((s) => `${s} ${(all[s].reduce((a, r) => a + r.chapters.reduce((b, c) => b + c.cups, 0), 0) / runs).toFixed(1)}`).join(', ')}`);
  console.log(`(${runs * 3} runs in ${((Date.now() - t0) / 1000).toFixed(0)} s on ${Math.min(availableParallelism(), jobs.length)} threads)`);
}

if (!isMainThread) {
  const { part, seed, to, pool, cups, bossHp, bossShift, switches: sw } = workerData as {
    part: Job[]; seed: number; to: number; pool: PoolRanking; cups: number; bossHp?: number[]; bossShift?: number[]; switches: Record<string, boolean | number>;
  };
  Object.assign(BALANCE, sw);
  if (bossHp) bossHp.forEach((h, i) => (BOSS_HP[i] = h));
  if (bossShift) bossShift.forEach((h, i) => (BOSS_STAT_SHIFT[i] = h));
  parentPort!.postMessage(part.map((j) => ({ j, log: runJob(j, seed, to, pool, cups) })));
} else if (process.argv[1]?.endsWith('story-run.ts')) {
  const arg = (name: string, def: number) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? Number(process.argv[i + 1]) : def;
  };
  // --off <switch> plays without one of the balance table's switches (they reach the workers too)
  process.argv.forEach((a, i) => a === '--off' && Object.assign(BALANCE, { [process.argv[i + 1]!]: false }));
  // --before plays the game as it was before the review's design pass (with today's boss tables)
  if (process.argv.includes('--before')) Object.assign(BALANCE, BEFORE_REVIEW);
  await storyTables(arg('runs', 30), arg('seed', 1), arg('to', CHAPTERS.length), arg('cups', 0));
}
