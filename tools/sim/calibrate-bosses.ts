/**
 * Finds boss HP per chapter so an average build at the level the chapter expects wins BOSS_AIM of the time
 * (with the boss toughening and easing off as the game does). Prints the HP table for data/balance.ts.
 *   npx tsx tools/sim/calibrate-bosses.ts [--from 1] [--to 20] [--n 32]
 */
import { BOSS_AIM, BOSS_HP, BOSSES, CHAPTERS, LEGACY_BALANCE, headToHead, levelUp, makeBoss, mulberry32, randomGear, rankPool, storyOf, type CareerFighter } from '../../packages/core/src';
import { fighterOfStrength, newRun, spendTalents } from './story';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 32);
const pool = rankPool(1, { n: 1000, games: 2000 });
/** The level a story player has at this boss: a level above the chapter in Act I, the chapter's own in Act II. */
export const expectedLevel = (ch: number) => CHAPTERS[ch - 1]!.lvl + (ch <= 10 ? 1 : 0);

/** Average win odds of N average builds against this chapter's boss with this much HP. */
function odds(ch: number, hp: number) {
  BOSS_HP[ch - 1] = hp;
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

for (let ch = arg('from', 1); ch <= arg('to', CHAPTERS.length); ch++) {
  const base = LEGACY_BALANCE.bossHp(ch, 0);
  const aim = BOSS_AIM(ch);
  let lo = Math.round(base * 0.3);
  let hi = Math.round(base * 2.5);
  const at = { lo: odds(ch, lo), hi: odds(ch, hi) };
  let best = { hp: base, o: odds(ch, base) };
  for (let it = 0; it < 7 && hi - lo > 4; it++) {
    const mid = Math.round((lo + hi) / 2);
    const o = odds(ch, mid);
    if (Math.abs(o - aim) < Math.abs(best.o - aim)) best = { hp: mid, o };
    if (o > aim) lo = mid;
    else hi = mid;
  }
  console.log(`${ch}\t${BOSSES[ch - 1]!.name}\tlegacy ${base}\t-> ${best.hp}\todds ${(best.o * 100).toFixed(0)}% (aim ${(aim * 100).toFixed(0)}%, range ${(at.hi * 100).toFixed(0)}-${(at.lo * 100).toFixed(0)}%)`);
}
