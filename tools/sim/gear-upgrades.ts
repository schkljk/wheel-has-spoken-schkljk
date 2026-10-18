/**
 * Upgrade 21: what gear upgrades are worth. The same fighter in the same six pieces fights itself with the
 * pieces upgraded and not (paired seeds, both sides of the coin), next to what extra levels are worth.
 *   npx tsx tools/sim/gear-upgrades.ts [--n 4000]
 */
import { GEAR_SLOTS, labFighter, mulberry32, randomGear, simulate, type Fighter } from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 4000);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

const kits: [label: string, make: (f: Fighter) => Fighter][] = [
  ['One piece at +5', (f) => ({ ...f, gup: { [Object.values(f.gear!)[0]!]: 5 } })],
  ['All six at +3', (f) => ({ ...f, gup: Object.fromEntries(Object.values(f.gear!).map((k) => [k!, 3])) })],
  ['All six at +5', (f) => ({ ...f, gup: Object.fromEntries(Object.values(f.gear!).map((k) => [k!, 5])) })],
  ['(for scale) one level up', (f) => ({ ...f, lvl: (f.lvl || 1) + 1 })],
  ['(for scale) three levels up', (f) => ({ ...f, lvl: (f.lvl || 1) + 3 })],
];
const rows: string[][] = [];
for (const [label, make] of kits) {
  const row = [label];
  for (const lvl of [10, 20, 30]) {
    const rng = mulberry32(lvl * 31 + 5);
    let w = 0;
    for (let i = 0; i < N; i++) {
      const f = labFighter(rng, lvl);
      randomGear(f, GEAR_SLOTS.length, rng);
      const up = make(f);
      const s = mulberry32((lvl * 7919 + i * 104729) >>> 0);
      w += i % 2 ? (simulate(up, f, s) === 0 ? 1 : 0) : simulate(f, up, s) === 1 ? 1 : 0;
    }
    row.push(pct(w / N));
  }
  rows.push(row);
}
const head = ['Against the same fighter', 'Lvl 10', 'Lvl 20', 'Lvl 30'];
const all = [head, ...rows];
const wd = head.map((_, c) => Math.max(...all.map((r) => r[c]!.length)));
const line = (r: string[]) => r.map((x, c) => (c === 0 ? x.padEnd(wd[c]!) : x.padStart(wd[c]!))).join('  ');
console.log(`Gear upgrades (${N} paired fights per cell)\n${line(head)}\n${wd.map((n) => '-'.repeat(n)).join('  ')}`);
for (const r of rows) console.log(line(r));
