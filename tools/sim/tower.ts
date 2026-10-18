/**
 * Upgrade 25: how high the endless tower goes for weak, average and strong builds at levels 10, 20 and 30
 * (six random pieces of gear, auto-battle, the ranked pool of seed 1).
 *   npx tsx tools/sim/tower.ts [--runs 40]
 */
import { GEAR_SLOTS, levelUp, mulberry32, randomGear, rankPool } from '../../packages/core/src';
import { fighterOfStrength, newRun, playTower } from './story';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const RUNS = arg('runs', 40);
const pool = rankPool(1, { n: 1000, games: 5000 });
const rows: string[][] = [];
for (const s of ['weak', 'average', 'strong'] as const) {
  const row: string[] = [s];
  for (const lvl of [10, 20, 30]) {
    const floors: number[] = [];
    for (let r = 0; r < RUNS; r++) {
      const rng = mulberry32(lvl * 7919 + r * 104729 + s.length);
      const g = newRun(rng, pool, fighterOfStrength(s));
      levelUp(g.F!, lvl - 1, rng);
      randomGear(g.F!, GEAR_SLOTS.length, rng);
      floors.push(playTower(g));
    }
    floors.sort((a, b) => a - b);
    row.push(`${floors[floors.length >> 1]} (${floors[Math.floor(floors.length * 0.9)]})`);
  }
  rows.push(row);
}
const head = ['Floors cleared, median (top 10%)', 'Lvl 10', 'Lvl 20', 'Lvl 30'];
const all = [head, ...rows];
const w = head.map((_, c) => Math.max(...all.map((r) => r[c]!.length)));
const line = (r: string[]) => r.map((x, c) => (c === 0 ? x.padEnd(w[c]!) : x.padStart(w[c]!))).join('  ');
console.log(`Endless tower, ${RUNS} climbs per cell\n${line(head)}\n${w.map((n) => '-'.repeat(n)).join('  ')}`);
for (const r of rows) console.log(line(r));
