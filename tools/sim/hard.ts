/**
 * Upgrade 26: how often hard mode is beaten, and what it pays. Each fighter plays the story on auto-battle up to
 * a chapter, then tries that chapter on hard and the one two chapters back (from the same save).
 *   npx tsx tools/sim/hard.ts [--runs 30]
 */
import { coinsOf, mulberry32, rankPool, startHard, type Game } from '../../packages/core/src';
import { fighterOfStrength, newRun, playHard, playStory } from './story';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const RUNS = arg('runs', 30);
const pool = rankPool(1, { n: 1000, games: 5000 });
const copy = (g: Game): Game => ({ ...g, F: structuredClone(g.F), save: structuredClone(g.save) });
const rows: string[][] = [];
for (const s of ['weak', 'average', 'strong'] as const) {
  for (const upTo of [4, 8, 12]) {
    const res = { same: [] as number[], back: [] as number[], coins: [] as number[], fights: [] as number[] };
    let played = 0;
    for (let r = 0; r < RUNS; r++) {
      const rng = mulberry32(upTo * 7919 + r * 104729 + s.length);
      const g = newRun(rng, pool, fighterOfStrength(s));
      const log = playStory(g, upTo, { maxResets: 6, cupsPerReset: 1 });
      if (log.stuck) continue;
      played++;
      for (const [ch, list] of [
        [upTo, res.same],
        [upTo - 2, res.back],
      ] as const) {
        const h = copy(g);
        const c0 = coinsOf(h);
        startHard(h, ch);
        const out = playHard(h);
        list.push(out.won ? 1 : 0);
        if (ch === upTo) {
          res.coins.push(coinsOf(h) - c0);
          res.fights.push(out.fights);
        }
      }
    }
    const pct = (a: number[]) => (a.length ? `${Math.round((100 * a.reduce((x, y) => x + y, 0)) / a.length)}%` : '-');
    const avg = (a: number[]) => (a.length ? String(Math.round(a.reduce((x, y) => x + y, 0) / a.length)) : '-');
    rows.push([s, `ch ${upTo}`, String(played), pct(res.same), pct(res.back), avg(res.fights), avg(res.coins)]);
  }
}
const head = ['Build', 'Cleared to', 'Runs', 'Hard, same ch', 'Hard, 2 back', 'Fights', 'Coins net'];
const all = [head, ...rows];
const w = head.map((_, c) => Math.max(...all.map((r) => r[c]!.length)));
const line = (r: string[]) => r.map((x, c) => (c < 2 ? x.padEnd(w[c]!) : x.padStart(w[c]!))).join('  ');
console.log(`Hard mode, up to ${RUNS} fighters per row\n${line(head)}\n${w.map((n) => '-'.repeat(n)).join('  ')}`);
for (const r of rows) console.log(line(r));
