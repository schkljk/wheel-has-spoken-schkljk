/**
 * Upgrade 27: do the seasonal arenas sit inside the range of the regular ones? The same random fighter pairs fight
 * in every arena with the same dice; "flips" is how often the winner differs from the Colosseum (neutral ground).
 *   npx tsx tools/sim/seasonal.ts [--pairs 1500]
 */
import { ARENAS, SEASONAL_ARENAS, levelUp, mulberry32, newBattle, randomFighter, randomGear, type Arena } from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const PAIRS = arg('pairs', 1500);
function fightIn(arena: Arena, i: number) {
  const r = mulberry32(i * 7919 + 1);
  const A = randomFighter('A', r);
  const B = randomFighter('B', r);
  const lvl = 1 + Math.floor(r() * 30);
  levelUp(A, lvl - 1, r);
  levelUp(B, lvl - 1 + Math.floor(r() * 3) - 1, r);
  randomGear(A, Math.floor(r() * 4), r);
  randomGear(B, Math.floor(r() * 4), r);
  const b = newBattle(A, B, mulberry32(i * 104729 + 3), { arena, quiet: true });
  b.start();
  while (!b.over) b.step();
  return { w: b.w!, rounds: b.round };
}
const base = Array.from({ length: PAIRS }, (_, i) => fightIn(ARENAS[0]!, i));
const rows: string[][] = [];
for (const a of [...ARENAS, ...SEASONAL_ARENAS]) {
  let flips = 0;
  let rounds = 0;
  for (let i = 0; i < PAIRS; i++) {
    const o = fightIn(a, i);
    if (o.w !== base[i]!.w) flips++;
    rounds += o.rounds;
  }
  rows.push([`${SEASONAL_ARENAS.includes(a as never) ? '* ' : '  '}${a.n}`, `${((100 * flips) / PAIRS).toFixed(1)}%`, (rounds / PAIRS).toFixed(1)]);
}
const head = ['Arena (* seasonal)', 'Flips vs Colosseum', 'Avg rounds'];
const all = [head, ...rows];
const w = head.map((_, c) => Math.max(...all.map((r) => r[c]!.length)));
const line = (r: string[]) => r.map((x, c) => (c === 0 ? x.padEnd(w[c]!) : x.padStart(w[c]!))).join('  ');
console.log(`${PAIRS} fighter pairs per arena, same dice\n${line(head)}\n${w.map((n) => '-'.repeat(n)).join('  ')}`);
for (const r of rows) console.log(line(r));
