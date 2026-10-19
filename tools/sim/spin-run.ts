/**
 * Spin & Run (review F3) on auto-battle: how far runs get. Prints the share of runs by wins, and how many
 * beat the boss.
 *   npx tsx tools/sim/spin-run.ts [--runs 300]
 */
import { RUN_FIGHTS, clockAt, endRunFight, mulberry32, newBattle, newSave, rankPool, runSpecOf, runState, startRun, takeBoon, type Game } from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const RUNS = arg('runs', 300);
const pool = rankPool(1, { n: 1000, games: 3000 });
const wins = Array.from({ length: RUN_FIGHTS + 1 }, () => 0);
for (let r = 0; r < RUNS; r++) {
  const g: Game = { save: newSave(0), F: null, rng: mulberry32(1000 + r), clock: clockAt(), pool, notes: [] };
  startRun(g);
  for (;;) {
    const R = runState(g)!;
    if (R.offer) takeBoon(g, R.offer[0]!);
    const spec = runSpecOf(g, runState(g)!);
    const bt = newBattle(spec.me, spec.opp, g.rng, {
      mods: [{ hp: spec.rushHp }, spec.opp.maxHp ? { maxHp: spec.opp.maxHp } : {}],
      ...(spec.opp.isBoss ? { maxRounds: 30, suddenDeath: true } : {}),
      quiet: true,
    });
    bt.start();
    while (!bt.over) bt.step();
    const res = endRunFight(g, spec.opp, { w: bt.w!, me: bt.P[0], round: bt.round, sd: !!bt.sd });
    if (res.runOver) {
      wins[runState(g)?.i ?? (bt.w === 0 ? RUN_FIGHTS : (g.save.profile.extra.runBest as { wins: number }).wins)]!++;
      break;
    }
  }
}
console.log(`${RUNS} runs on auto-battle, the first boon on offer taken every time`);
wins.forEach((n, i) => console.log(`${String(i).padStart(2)} wins${i === RUN_FIGHTS ? ' (run complete)' : ''}: ${((n / RUNS) * 100).toFixed(1)}%`));
