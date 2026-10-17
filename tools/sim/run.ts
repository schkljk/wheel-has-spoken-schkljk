/**
 * Balance simulations on the ported engine. Prints tables.
 *
 *   npm run sim                 # default: 20,000 fights per table, then 20 story runs per build strength
 *   npm run sim -- --fights 5000 --seed 7
 *   npm run sim -- --story-runs 40 --cups 1   # more story runs; a cup after each chapter restart
 *   npm run sim -- --story-runs 0             # skip the story runs
 */
import { mulberry32, randomFighter, simulate, type Fighter, type Rng } from '../../packages/core/src';
import { storyTables } from './story-run';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const FIGHTS = arg('fights', 20000);
const SEED = arg('seed', 1);

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
function table(title: string, head: string[], rows: (string | number)[][]) {
  const all = [head, ...rows.map((r) => r.map(String))];
  const w = head.map((_, c) => Math.max(...all.map((r) => r[c]!.length)));
  const line = (r: string[]) => r.map((x, c) => (c === 0 ? x.padEnd(w[c]!) : x.padStart(w[c]!))).join('  ');
  console.log(`\n${title}\n${line(head)}\n${w.map((n) => '-'.repeat(n)).join('  ')}`);
  for (const r of all.slice(1)) console.log(line(r));
}

const fighterAt = (rng: Rng, lvl: number): Fighter => Object.assign(randomFighter('Sim', rng), { lvl });

/** Win rate of the higher-level fighter, by level gap. */
function levelGaps(rng: Rng) {
  const rows: (string | number)[][] = [];
  const n = Math.round(FIGHTS / 6);
  for (const gap of [0, 1, 2, 3, 5, 8]) {
    let w = 0;
    for (let i = 0; i < n; i++) {
      const base = 1 + Math.floor(rng() * 30);
      if (simulate(fighterAt(rng, base + gap), fighterAt(rng, base), rng) === 0) w++;
    }
    rows.push([`+${gap} levels`, pct(w / n), n]);
  }
  table('Higher level vs lower level (random builds, levels 1-38)', ['Gap', 'Win rate', 'Fights'], rows);

  // the same build on both sides isolates what levels alone are worth
  const same: (string | number)[][] = [];
  for (const gap of [0, 1, 2, 3, 5, 8]) {
    let w = 0;
    for (let i = 0; i < n; i++) {
      const base = 1 + Math.floor(rng() * 30);
      const a = fighterAt(rng, base + gap);
      const b = { ...a, name: 'Twin', lvl: base };
      if (simulate(a, b, rng) === 0) w++;
    }
    same.push([`+${gap} levels`, pct(w / n), n]);
  }
  table('Same build, higher level vs lower level', ['Gap', 'Win rate', 'Fights'], same);
}

/** Win rate of each slice on one wheel against random same-level opponents. */
function byPick(rng: Rng, title: string, keyOf: (f: Fighter) => string, top = 0) {
  const stats = new Map<string, { w: number; n: number }>();
  for (let i = 0; i < FIGHTS; i++) {
    const lvl = 1 + Math.floor(rng() * 30);
    const a = fighterAt(rng, lvl);
    const b = fighterAt(rng, lvl);
    const won = simulate(a, b, rng) === 0;
    for (const [f, win] of [
      [a, won],
      [b, !won],
    ] as const) {
      const k = keyOf(f);
      const s = stats.get(k) ?? { w: 0, n: 0 };
      s.n++;
      if (win) s.w++;
      stats.set(k, s);
    }
  }
  let rows = [...stats].map(([k, s]) => ({ k, r: s.w / s.n, n: s.n })).sort((x, y) => y.r - x.r);
  if (top && rows.length > top * 2) rows = [...rows.slice(0, top), { k: '…', r: NaN, n: 0 }, ...rows.slice(-top)];
  table(title, ['Pick', 'Win rate', 'Fights'], rows.map((x) => [x.k, Number.isNaN(x.r) ? '' : pct(x.r), x.n || '']));
}

const t0 = Date.now();
const rng = mulberry32(SEED);
console.log(`The Wheel Has Spoken: balance simulation (${FIGHTS} fights per table, seed ${SEED})`);
levelGaps(rng);
byPick(rng, 'Archetypes vs random same-level opponents', (f) => `${f.arch.e} ${f.arch.n}`);
byPick(rng, 'Races vs random same-level opponents (top and bottom 8)', (f) => `${f.race.e} ${f.race.n}`, 8);
byPick(rng, 'Growth types vs random same-level opponents', (f) => `${f.growth?.e} ${f.growth?.n}`);
const STORY_RUNS = arg('story-runs', 20);
if (STORY_RUNS > 0) await storyTables(STORY_RUNS, SEED, undefined, arg('cups', 0));
console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
