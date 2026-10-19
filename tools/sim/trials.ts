/**
 * Tunes the Wheelborn trials (review F12): for each trial, the remix's HP that gives fighters at the trial's
 * level a median win rate on the ladder from 55% (trial 1) down to 30% (trial 10). Prints the table for
 * TRIAL_TUNE.hp in packages/core/src/game/trials.ts.
 *   npx tsx tools/sim/trials.ts [--n 24]
 */
import { TRIAL_COUNT, TRIAL_TUNE, clockAt, enterCareer, headToHead, labFighter, mulberry32, newSave, randomGear, trialBoss, trialLevel, type CareerFighter, type Game } from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 24);
const aim = (i: number) => 0.55 - (0.25 * i) / (TRIAL_COUNT - 1);

/** The median win rate of N fighters at the trial's level (well geared) against trial i. */
function median(i: number) {
  const ws: number[] = [];
  for (let k = 0; k < N; k++) {
    const rng = mulberry32(100 + i * 31 + k * 7);
    const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
    const f = labFighter(rng, trialLevel(i)) as CareerFighter;
    randomGear(f, 5, rng);
    enterCareer(g, f);
    g.F = f;
    f.lvl = trialLevel(i);
    ws.push(headToHead(f, trialBoss(g, i), mulberry32(k), 30, { maxRounds: 30, suddenDeath: true }));
  }
  return ws.sort((a, b) => a - b)[N >> 1]!;
}

// first the stat tier, at 300 HP (closest to the aim); then HP, kept between 180 and 600
for (let i = 0; i < TRIAL_COUNT; i++) {
  TRIAL_TUNE.hp[i] = 300;
  let best = 8;
  let gap = 9;
  for (let t = 3; t <= 14; t++) {
    TRIAL_TUNE.tier[i] = t;
    const d = Math.abs(median(i) - aim(i));
    if (d < gap) [best, gap] = [t, d];
  }
  TRIAL_TUNE.tier[i] = best;
  let lo = 180;
  let hi = 600;
  for (let it = 0; it < 7; it++) {
    const mid = Math.round((lo + hi) / 2);
    TRIAL_TUNE.hp[i] = mid;
    if (median(i) > aim(i)) lo = mid;
    else hi = mid;
  }
  TRIAL_TUNE.hp[i] = Math.round((lo + hi) / 20) * 10;
  console.log(`trial ${i + 1} (level ${trialLevel(i)}): tier ${best}, HP ${TRIAL_TUNE.hp[i]} -> median ${Math.round(median(i) * 100)}% (aim ${Math.round(aim(i) * 100)}%)`);
}
console.log(`tier: [${TRIAL_TUNE.tier.join(', ')}],\nhp: [${TRIAL_TUNE.hp.join(', ')}],`);
