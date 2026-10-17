/**
 * Boss difficulty per chapter: average builds (median of 8) at levels around the chapter's level, with
 * gear like a story player has by then, against that chapter's boss as the game builds it.
 *   npx tsx tools/sim/boss-curve.ts [--n 24]
 */
import { CHAPTERS, headToHead, levelUp, mulberry32, randomGear, makeBoss, rankPool, storyOf, type CareerFighter } from '../../packages/core/src';
import { fighterOfStrength, newRun, spendTalents } from './story';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 24);
const pool = rankPool(1, { n: 1000, games: 2000 });
const pad = (x: string | number, w: number) => String(x).padStart(w);
const OFFS = [-2, 0, 2, 4];
console.log(`Boss win odds for average builds at the chapter's level plus ${OFFS.join(', ')} (${N} builds each, full story HP)`);
console.log(`${'Ch'.padEnd(25)}${OFFS.map((o) => pad(o >= 0 ? `+${o}` : o, 7)).join('')}`);
for (let ch = 1; ch <= CHAPTERS.length; ch++) {
  const row = OFFS.map((off) => {
    let s = 0;
    for (let i = 0; i < N; i++) {
      const rng = mulberry32(ch * 1000 + i * 7 + off * 131 + 99);
      const g = newRun(rng, pool, fighterOfStrength('average'));
      const F = g.F as CareerFighter;
      const lvl = Math.max(1, CHAPTERS[ch - 1]!.lvl + off);
      levelUp(F, lvl - 1, rng);
      F.lvl = lvl;
      F.tp = lvl - 1;
      spendTalents(g);
      randomGear(F, Math.min(6, Math.floor(ch / 2) + 1), rng);
      F.story = { ...storyOf(g), ch } as never;
      const b = makeBoss(g, ch);
      s += headToHead(F, b, rng, 40, { mods: [{ hp: 100 }, { maxHp: b.maxHp }] });
    }
    return pad(`${Math.round((s / N) * 100)}%`, 7);
  });
  console.log(`${String(ch).padStart(2)} ${CHAPTERS[ch - 1]!.n.slice(0, 21).padEnd(22)}${row.join('')}`);
}
