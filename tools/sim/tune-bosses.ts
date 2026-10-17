/**
 * Tunes bosses from whole story runs: average builds play the story (story only, auto-battle) and each boss
 * moves toward the win rate per try its chapter aims for. Far off: a stat tier at a time; close: HP, kept
 * within 60-160% of the old game's. Prints the tables for data/balance.ts.
 *   npx tsx tools/sim/tune-bosses.ts [--runs 90] [--rounds 5] [--from 1]
 */
import { BOSS_HP, BOSS_STAT_SHIFT, CHAPTERS, LEGACY_BALANCE, rankPool } from '../../packages/core/src';
import { runMany, type Job } from './story-run';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const RUNS = arg('runs', 90);
/** Boss wins per try for an average build playing only the story. */
export const STORY_AIM = (ch: number) => (ch <= 10 ? 0.72 - 0.02 * (ch - 1) : 0.42 - 0.015 * (ch - 11));

const pool = rankPool(1, { n: 1000, games: 5000 });
let hp = [...BOSS_HP];
let shift = [...BOSS_STAT_SHIFT];
for (let round = 1; round <= arg('rounds', 5); round++) {
  const jobs: Job[] = Array.from({ length: RUNS }, (_, r) => ({ s: 'average', r: r + round * 1000 }));
  const logs = (await runMany(jobs, { seed: 1, to: CHAPTERS.length, pool, bossHp: hp, bossShift: shift })).map((x) => x.log);
  const nh = [...hp];
  const ns = [...shift];
  const rows: string[] = [];
  for (let ch = 1; ch <= CHAPTERS.length; ch++) {
    const i = ch - 1;
    const cs = logs.map((l) => l.chapters.find((c) => c.ch === ch)).filter((c) => !!c);
    const tries = cs.reduce((a, c) => a + c.bossTries, 0);
    const p = tries ? cs.reduce((a, c) => a + c.bossWins, 0) / tries : 0;
    const d = p - STORY_AIM(ch);
    const base = LEGACY_BALANCE.bossHp(ch, 0);
    if (tries >= 15 && ch >= arg('from', 1)) {
      const want = Math.round(hp[i]! * Math.min(1.35, Math.max(0.75, Math.exp(d * 2.2))));
      if (Math.abs(d) > 0.14 || (Math.abs(d) > 0.05 && (want > base * 1.6 || want < base * 0.6))) {
        // far off, or HP would leave its range: a stat tier, with HP back to the middle
        ns[i] = Math.max(-6, Math.min(4, shift[i]! + (d > 0 ? 1 : -1)));
        if (ns[i] !== shift[i]) nh[i] = base;
        else nh[i] = Math.round(Math.min(base * 1.6, Math.max(base * 0.6, want)));
      } else if (Math.abs(d) > 0.05) nh[i] = want;
    }
    rows.push(`${ch}: ${Math.round(p * 100)}% of ${tries} (aim ${Math.round(STORY_AIM(ch) * 100)}%) stats ${shift[i]} hp ${hp[i]} -> stats ${ns[i]} hp ${nh[i]}`);
  }
  console.log(`round ${round}: reached ch20 ${logs.filter((l) => l.chapters.some((c) => c.ch === 20)).length}/${RUNS}\n  ${rows.join('\n  ')}`);
  hp = nh;
  shift = ns;
}
console.log(`BOSS_STAT_SHIFT = [${shift.join(', ')}]`);
console.log(`BOSS_HP = [${hp.join(', ')}]`);
