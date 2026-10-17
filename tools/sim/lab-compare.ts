/**
 * Balance lab with one balance switch off and on (same seed, same fights): the biggest movers per table.
 *   npx tsx tools/sim/lab-compare.ts softCaps [--fights 20000] [--seed 1]
 */
import { BALANCE, labRun, useBalance, type Balance } from '../../packages/core/src';

const flag = process.argv[2] as keyof Balance;
const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const FIGHTS = arg('fights', 20000);
const SEED = arg('seed', 1);
const tuned = { ...BALANCE };
useBalance({ ...tuned, [flag]: false });
const off = labRun(FIGHTS, SEED);
useBalance({ ...tuned, [flag]: true });
const on = labRun(FIGHTS, SEED);
useBalance(tuned);

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
console.log(`Balance lab, ${FIGHTS} fights, seed ${SEED}: "${String(flag)}" off -> on`);
for (const t of on.tables) {
  const before = new Map(off.tables.find((x) => x.k === t.k)!.rows.map((r) => [r.k, r]));
  const moves = t.rows
    .filter((r) => r.n >= 150)
    .map((r) => ({ r, d: r.w - (before.get(r.k)?.w ?? r.w) }))
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .slice(0, 5);
  const spread = (rows: { w: number; n: number }[]) => {
    const big = rows.filter((r) => r.n >= 150).map((r) => r.w);
    return `${pct(Math.min(...big))} to ${pct(Math.max(...big))}`;
  };
  console.log(`\n${t.title} (range ${spread(off.tables.find((x) => x.k === t.k)!.rows)} -> ${spread(t.rows)})`);
  for (const { r, d } of moves) console.log(`  ${r.e} ${r.label.padEnd(26)} ${pct(before.get(r.k)!.w).padStart(6)} -> ${pct(r.w).padStart(6)}  (${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)})`);
}
