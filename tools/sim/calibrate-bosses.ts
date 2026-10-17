/**
 * Finds each boss's stat tier shift and HP so an average build at the level the chapter expects
 * wins BOSS_AIM of the time, with the boss toughening and easing off as the game does. Prints the tables for
 * data/balance.ts.
 *   npx tsx tools/sim/calibrate-bosses.ts [--from 1] [--to 20] [--n 24]
 */
import { BOSS_AIM, BOSS_HP, BOSS_STAT_SHIFT, BOSSES, CHAPTERS, LEGACY_BALANCE, headToHead, levelUp, makeBoss, mulberry32, randomGear, rankPool, storyOf, type CareerFighter } from '../../packages/core/src';
import { fighterOfStrength, newRun, spendTalents } from './story';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 24);
const pool = rankPool(1, { n: 1000, games: 2000 });
/** The level a story player has at this boss: a level above the chapter in Act I, the chapter's own in Act II. */
export const expectedLevel = (ch: number) => CHAPTERS[ch - 1]!.lvl + (ch <= 10 ? 1 : 0);

/** Average win odds of N average builds against this chapter's boss. */
function odds(ch: number, hp: number, shift: number) {
  BOSS_HP[ch - 1] = hp;
  BOSS_STAT_SHIFT[ch - 1] = shift;
  let s = 0;
  for (let i = 0; i < N; i++) {
    const rng = mulberry32(ch * 7717 + i * 31 + 5);
    const g = newRun(rng, pool, fighterOfStrength('average'));
    const F = g.F as CareerFighter;
    const lvl = expectedLevel(ch);
    levelUp(F, lvl - 1, rng);
    F.lvl = lvl;
    F.tp = lvl - 1;
    spendTalents(g);
    randomGear(F, Math.min(6, Math.floor(ch / 2) + 1), rng);
    F.story = { ...storyOf(g), ch } as never;
    const b = makeBoss(g, ch);
    s += headToHead(F, b, rng, 40, { mods: [{ hp: 100 }, { maxHp: b.maxHp }] });
  }
  return s / N;
}

const hpOut: string[] = [];
const shiftOut: string[] = [];
for (let ch = arg('from', 1); ch <= arg('to', CHAPTERS.length); ch++) {
  const base = LEGACY_BALANCE.bossHp(ch, 0);
  const aim = BOSS_AIM(ch);
  // stat tiers first (in either direction) until the old HP gets within reach
  let sh = 0;
  let o = odds(ch, base, sh);
  while (o < aim - 0.04 && sh > -6) o = odds(ch, base, --sh);
  while (o > aim + 0.08 && sh < 3) o = odds(ch, base, ++sh);
  // then HP for the last few points
  let lo = Math.round(base * 0.4);
  let hi = Math.round(base * 1.6);
  let best = { hp: base, o };
  for (let it = 0; it < 6 && hi - lo > 4; it++) {
    const mid = Math.round((lo + hi) / 2);
    const m = odds(ch, mid, sh);
    if (Math.abs(m - aim) < Math.abs(best.o - aim)) best = { hp: mid, o: m };
    if (m > aim) lo = mid;
    else hi = mid;
  }
  hpOut.push(`${ch}:${best.hp}`);
  shiftOut.push(`${ch}:${sh}`);
  console.log(`${ch}\t${BOSSES[ch - 1]!.name}\tstats ${sh >= 0 ? '+' : ''}${sh}, HP ${base} -> ${best.hp}\todds ${(best.o * 100).toFixed(0)}% (aim ${(aim * 100).toFixed(0)}%)`);
}
console.log(`HP ${hpOut.join(' ')}`);
console.log(`SHIFT ${shiftOut.join(' ')}`);
