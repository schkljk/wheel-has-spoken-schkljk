/**
 * Tunes boss HP from whole story runs: average builds play the story (story only, auto-battle), and each
 * boss's HP moves toward the win rate per try that its chapter aims for. Prints the HP table for data/balance.ts.
 *   npx tsx tools/sim/tune-bosses.ts [--runs 60] [--rounds 3]
 */
import { BOSS_HP, CHAPTERS, rankPool } from '../../packages/core/src';
import { runMany, type Job } from './story-run';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const RUNS = arg('runs', 60);
/** Boss wins per try for an average build playing only the story. */
export const STORY_AIM = (ch: number) => (ch <= 10 ? 0.72 - 0.02 * (ch - 1) : 0.5 - 0.015 * (ch - 11));

const pool = rankPool(1, { n: 1000, games: 5000 });
let hp = [...BOSS_HP];
for (let round = 1; round <= arg('rounds', 3); round++) {
  const jobs: Job[] = Array.from({ length: RUNS }, (_, r) => ({ s: 'average', r: r + round * 1000 }));
  const logs = (await runMany(jobs, { seed: 1, to: CHAPTERS.length, pool, bossHp: hp })).map((x) => x.log);
  const next = [...hp];
  const rows: string[] = [];
  for (let ch = 1; ch <= CHAPTERS.length; ch++) {
    const cs = logs.map((l) => l.chapters.find((c) => c.ch === ch)).filter((c) => !!c);
    const tries = cs.reduce((a, c) => a + c.bossTries, 0);
    const wins = cs.reduce((a, c) => a + c.bossWins, 0);
    const p = tries ? wins / tries : 0;
    const aim = STORY_AIM(ch);
    // a boss loses about 10 points of win rate per 25% more HP; only move when clearly off
    if (tries >= 12 && Math.abs(p - aim) > 0.05) next[ch - 1] = Math.round(hp[ch - 1]! * Math.min(1.5, Math.max(0.67, Math.exp((p - aim) * 2.2))));
    rows.push(`${ch}: ${Math.round(p * 100)}% of ${tries} (aim ${Math.round(aim * 100)}%) hp ${hp[ch - 1]} -> ${next[ch - 1]}`);
  }
  console.log(`round ${round}: reached ch20 ${logs.filter((l) => l.chapters.some((c) => c.ch === 20)).length}/${RUNS}\n  ${rows.join('\n  ')}`);
  hp = next;
}
console.log(`BOSS_HP = [${hp.join(', ')}]`);
