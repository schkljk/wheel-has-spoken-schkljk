/**
 * The fight club's money (review F8, tightened in K2): what a coin bet returns by strategy, with the `clubTight`
 * switch off and on. Each matchup's real odds (100 simulated fights) are taken as the truth; the bookie's line is
 * redrawn 400 times a matchup.
 *   npx tsx tools/sim/club.ts [--m 300]
 */
import { CLUB_TUNE, clockAt, clubMatchup, clubMult, clubTip, labFighter, mulberry32, newSave, oddsWord, powerScale, rankPool, type CareerFighter, type Game } from '../../packages/core/src';
import { withBal } from './paired';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const M = arg('m', 300);
const K = 400;
const pool = rankPool(1, { n: 1000, games: 3000 });
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const WORDS = ['Long shot', 'Big underdog', 'Underdog', 'Coin flip', 'Favorite', 'Heavy favorite', 'Sure thing'];
const word = (p: number) => WORDS.indexOf(oddsWord(p).t);
// the matchups once: fighters and real odds don't depend on the switch
const ms = Array.from({ length: M }, (_, m) => {
  const rng = mulberry32(5000 + m);
  const F = labFighter(rng, [5, 15, 25][m % 3]!) as CareerFighter;
  const g: Game = { save: newSave(0), F, rng, clock: clockAt(), pool, notes: [] };
  const c = withBal({ clubTight: false }, () => clubMatchup(g));
  return { c, psA: powerScale(c.A).v, psB: powerScale(c.B).v };
});
for (const on of [false, true])
  withBal({ clubTight: on }, () => {
    const st: Record<string, { n: number; ev: number }> = {};
    const add = (k: string, ev: number) => {
      const s = (st[k] ??= { n: 0, ev: 0 });
      s.n++;
      s.ev += ev;
    };
    const rng = mulberry32(on ? 2 : 1);
    for (const { c, psA, psB } of ms)
      for (let k = 0; k < K; k++) {
        const pA = c.pA;
        const line = clamp(pA + (rng() - 0.5) * CLUB_TUNE.noise[on ? 1 : 0], 0.06, 0.94);
        const evA = pA * clubMult(line) - 1;
        const evB = (1 - pA) * clubMult(1 - line) - 1;
        add('back the line favorite', line >= 0.5 ? evA : evB);
        add('back the line underdog', line >= 0.5 ? evB : evA);
        if (psA !== psB && psA > psB === line < 0.5) add('card reader: bigger power scale, line says underdog', psA > psB ? evA : evB);
        if (!on) {
          const off = pA - line;
          if (clubTip({ ...c, line }).lines.length > 1 && Math.abs(off) >= 0.08) add('insider: back the side the dirt names', off >= 0 ? evA : evB);
        } else if (word(pA) > word(line)) add("insider: a side whose real word beats the line's", evA);
        else if (word(1 - pA) > word(1 - line)) add("insider: a side whose real word beats the line's", evB);
      }
    console.log(`${on ? 'after' : 'before'}: ${M} matchups x ${K} lines, payout ${CLUB_TUNE.vig[on ? 1 : 0]}/p, line within ±${CLUB_TUNE.noise[on ? 1 : 0] / 2}`);
    for (const [k, v] of Object.entries(st)) console.log(`  ${k.padEnd(54)} ${`${((v.ev / v.n) * 100).toFixed(1)}%`.padStart(7)} per coin, on ${Math.round((v.n / (M * K)) * 100)}% of matchups`);
  });
