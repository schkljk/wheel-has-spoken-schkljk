/**
 * Upgrade 18: what each growth type is worth by level. Two tables per run:
 *  - random lab fighters (random gear, some sets) against random same-level opponents, by growth;
 *  - the same fighter twice, once with the growth type and once Steady (only the growth differs).
 *   npx tsx tools/sim/growth.ts [--n 6000] [--legacy]
 */
import { BALANCE, GROWTH, LEGACY_BALANCE, labFighter, mulberry32, simulate, useBalance, type Fighter } from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 6000);
const LEVELS = [1, 10, 20, 30, 40, 50];
if (process.argv.includes('--legacy')) useBalance({ ...BALANCE, growth: LEGACY_BALANCE.growth });

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
function table(title: string, head: string[], rows: string[][]) {
  const all = [head, ...rows];
  const w = head.map((_, c) => Math.max(...all.map((r) => r[c]!.length)));
  const line = (r: string[]) => r.map((x, c) => (c === 0 ? x.padEnd(w[c]!) : x.padStart(w[c]!))).join('  ');
  console.log(`\n${title}\n${line(head)}\n${w.map((n) => '-'.repeat(n)).join('  ')}`);
  for (const r of rows) console.log(line(r));
}

const label = (k: string) => {
  const g = GROWTH.find((x) => x.k === k)!;
  return `${g.e} ${g.n}`;
};
const withGrowth = (f: Fighter, k: string): Fighter => ({ ...f, growth: GROWTH.find((x) => x.k === k)!, _win: null }) as Fighter;

const open: Record<string, string[]> = {};
const twin: Record<string, string[]> = {};
for (const g of GROWTH) {
  open[g.k] = [label(g.k)];
  twin[g.k] = [label(g.k)];
}
for (const lvl of LEVELS) {
  const rng = mulberry32(lvl * 101 + 7);
  const acc: Record<string, { n: number; w: number; tn: number; tw: number }> = {};
  for (const g of GROWTH) acc[g.k] = { n: 0, w: 0, tn: 0, tw: 0 };
  for (let i = 0; i < N; i++) {
    const a = labFighter(rng, lvl);
    const b = labFighter(rng, lvl);
    const seed = (lvl * 1000003 + i * 7919) >>> 0;
    const won = simulate(a, b, mulberry32(seed)) === 0;
    for (const [f, w] of [
      [a, won],
      [b, !won],
    ] as const) {
      const x = acc[f.growth?.k ?? 'steady']!;
      x.n++;
      if (w) x.w++;
    }
    // the twin test: a with each growth type against a as Steady, on both sides of the coin
    for (const g of GROWTH) {
      if (g.k === 'steady') continue;
      const x = acc[g.k]!;
      const me = withGrowth(a, g.k);
      const st = withGrowth(a, 'steady');
      const w = i % 2 === 0 ? simulate(me, st, mulberry32(seed + 1)) === 0 : simulate(st, me, mulberry32(seed + 1)) === 1;
      x.tn++;
      if (w) x.tw++;
    }
  }
  for (const g of GROWTH) {
    const x = acc[g.k]!;
    open[g.k]!.push(pct(x.w / x.n));
    twin[g.k]!.push(g.k === 'steady' ? '-' : pct(x.tw / x.tn));
  }
}
const head = ['Growth', ...LEVELS.map((l) => `Lvl ${l}`)];
console.log(`Growth types (${N} fights per level, growth tuning ${BALANCE.growth ? 'on' : 'off'})`);
table('Against random same-level opponents', head, Object.values(open));
table('Against their own Steady twin (only the growth differs)', head, Object.values(twin));
