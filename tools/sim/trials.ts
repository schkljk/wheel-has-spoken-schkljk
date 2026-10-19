/**
 * Tunes the Wheelborn trials (review F12, retuned in K5): for each trial, the remix's stat tier and HP that give
 * an average fighter at the trial's level a win rate on the ladder from 55% (trial 1) down to 30% (trial 10).
 * "Average" is the mean win rate of N lab fighters in five random pieces: the median of a few dozen moved by ten
 * points from one sample of fighters to the next. Prints TRIAL_TUNE for packages/core/src/game/trials.ts, then
 * the ladder for weak, average and strong fighters (the 11th percentile, the mean and the 89th). Trials run on
 * worker threads.
 *   npx tsx tools/sim/trials.ts [--n 150] [--fights 20] [--check] [--before] [--seed 1] [--hp-only]
 * --check skips the tuning and prints the ladder with today's table; --before plays the old ladder (levels 34 to
 * 50, the first tune); --hp-only keeps each trial's tier and tunes its HP.
 */
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import {
  BALANCE,
  TRIAL_COUNT,
  TRIAL_TUNE,
  TRIAL_TUNE_V1,
  clockAt,
  enterCareer,
  headToHead,
  labFighter,
  mulberry32,
  newSave,
  randomGear,
  trialBoss,
  trialLevel,
  useBalance,
  type CareerFighter,
  type Game,
} from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
/** --seed n: other fighters (to check a tune on fighters it wasn't tuned on); workers get it with their job */
let SEED = arg('seed', 0);
const aim = (i: number) => 0.55 - (0.25 * i) / (TRIAL_COUNT - 1);

/** Win rates of n lab fighters at trial i's level (five random pieces), sorted. */
function rates(i: number, n: number, fights: number): number[] {
  const ws: number[] = [];
  for (let k = 0; k < n; k++) {
    const rng = mulberry32(100 + i * 31 + k * 7 + SEED * 100003);
    const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
    const f = labFighter(rng, trialLevel(i)) as CareerFighter;
    randomGear(f, 5, rng);
    enterCareer(g, f);
    g.F = f;
    f.lvl = trialLevel(i);
    ws.push(headToHead(f, trialBoss(g, i), mulberry32(k), fights, { maxRounds: 30, suddenDeath: true }));
  }
  return ws.sort((a, b) => a - b);
}
const mean = (i: number, n: number, fights: number) => rates(i, n, fights).reduce((a, b) => a + b, 0) / n;

/** The tier (at 300 HP, closest to the aim, on a quick sample), then the HP by bisection, kept between 160 and 640. */
function tune(i: number, n: number, fights: number, hpOnly: boolean) {
  let best = TRIAL_TUNE.tier[i]!;
  if (!hpOnly) {
    TRIAL_TUNE.hp[i] = 300;
    let gap = 9;
    for (let t = 3; t <= 14; t++) {
      TRIAL_TUNE.tier[i] = t;
      const d = Math.abs(mean(i, Math.max(30, n >> 1), 12) - aim(i));
      if (d < gap) [best, gap] = [t, d];
    }
  }
  TRIAL_TUNE.tier[i] = best;
  let lo = 160;
  let hi = 640;
  for (let it = 0; it < 7; it++) {
    const mid = Math.round((lo + hi) / 2);
    TRIAL_TUNE.hp[i] = mid;
    if (mean(i, n, fights) > aim(i)) lo = mid;
    else hi = mid;
  }
  return { tier: best, hp: Math.round((lo + hi) / 20) * 10 };
}

interface Job {
  i: number;
  n: number;
  fights: number;
  check: boolean;
  hpOnly: boolean;
  before: boolean;
  seed: number;
  tier: number[];
  hp: number[];
}
interface Out {
  i: number;
  tier: number;
  hp: number;
  lvl: number;
  w: number[];
}
function runJob(j: Job): Out {
  SEED = j.seed;
  if (j.before) {
    useBalance({ trialLadder: false });
    const r = rates(j.i, j.n, j.fights);
    const at = (q: number) => r[Math.min(j.n - 1, Math.floor(q * j.n))]!;
    return { i: j.i, tier: TRIAL_TUNE_V1.tier[j.i]!, hp: TRIAL_TUNE_V1.hp[j.i]!, lvl: trialLevel(j.i), w: [at(0.11), avg(r), at(0.5), at(0.89)] };
  }
  TRIAL_TUNE.tier.splice(0, TRIAL_COUNT, ...j.tier);
  TRIAL_TUNE.hp.splice(0, TRIAL_COUNT, ...j.hp);
  const t = j.check ? { tier: TRIAL_TUNE.tier[j.i]!, hp: TRIAL_TUNE.hp[j.i]! } : tune(j.i, j.n, j.fights, j.hpOnly);
  TRIAL_TUNE.tier[j.i] = t.tier;
  TRIAL_TUNE.hp[j.i] = t.hp;
  const r = rates(j.i, j.n, j.fights);
  const at = (q: number) => r[Math.min(j.n - 1, Math.floor(q * j.n))]!;
  return { i: j.i, ...t, lvl: trialLevel(j.i), w: [at(0.11), avg(r), at(0.5), at(0.89)] };
}
const avg = (r: number[]) => r.reduce((a, b) => a + b, 0) / r.length;

if (!isMainThread) {
  parentPort!.postMessage((workerData as { jobs: Job[] }).jobs.map(runJob));
} else {
  const n = arg('n', 150);
  const fights = arg('fights', 20);
  const hpOnly = process.argv.includes('--hp-only');
  const check = process.argv.includes('--check') || process.argv.includes('--before');
  const before = process.argv.includes('--before');
  const t0 = Date.now();
  const jobs: Job[] = Array.from({ length: TRIAL_COUNT }, (_, i) => ({ i, n, fights, check, hpOnly, before, seed: SEED, tier: [...TRIAL_TUNE.tier], hp: [...TRIAL_TUNE.hp] }));
  const threads = Math.max(1, Math.min(arg('threads', availableParallelism() - 1), jobs.length));
  // the slow trials first, spread round-robin
  const parts = Array.from({ length: threads }, (_, k) => jobs.filter((_, x) => x % threads === k));
  const outs = (
    await Promise.all(
      parts.map(
        (part) =>
          new Promise<Out[]>((resolve, reject) => {
            const boot = `import(${JSON.stringify(import.meta.resolve('tsx/esm/api'))}).then((m) => (m.register(), import(${JSON.stringify(import.meta.url)})))`;
            const w = new Worker(boot, { eval: true, workerData: { jobs: part } });
            w.once('message', resolve);
            w.once('error', reject);
          }),
      ),
    )
  )
    .flat()
    .sort((a, b) => a.i - b.i);
  const pc = (x: number) => `${Math.round(x * 100)}%`.padStart(5);
  console.log(`${n} lab fighters a trial (five random pieces), ${fights} fights each; weak = 11th percentile, average = the mean, then the median and the 89th percentile${before ? '; the old ladder' : ''}`);
  console.log('trial  level  tier   HP    weak  avg  median strong   aim');
  for (const o of outs) console.log(`${String(o.i + 1).padStart(5)}  ${String(o.lvl).padStart(5)}  ${String(o.tier).padStart(4)}  ${String(o.hp).padStart(4)}  ${o.w.map(pc).join(' ')}  ${pc(aim(o.i))}`);
  if (!check) console.log(`tier: [${outs.map((o) => o.tier).join(', ')}],\nhp: [${outs.map((o) => o.hp).join(', ')}],`);
  console.log(`(${((Date.now() - t0) / 1000).toFixed(0)} s on ${threads} threads; BALANCE.trialLadder ${before ? 'off' : BALANCE.trialLadder ? 'on' : 'off'})`);
}
