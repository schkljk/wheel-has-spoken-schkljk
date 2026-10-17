/**
 * Boss phase-two slices (upgrade 10): boss win odds per chapter for average builds at the chapter's level, with
 * the player on auto-play, against the same fights where they also take the phase-two slice the first time it
 * shows up. Same builds, same seeds; only that one choice differs.
 *   npx tsx tools/sim/phase-slice.ts [--n 24] [--fights 25]
 */
import {
  CHAPTERS,
  levelUp,
  makeBoss,
  mulberry32,
  newBattle,
  phaseKitOf,
  phaseSlice,
  randomGear,
  rankPool,
  storyOf,
  type CareerFighter,
  type Fighter,
  type Move,
  type Rng,
} from '../../packages/core/src';
import { fighterOfStrength, newRun, spendTalents } from './story';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 24);
const FIGHTS = arg('fights', 25);

/** One boss fight as the story plays it; `slice` takes the phase-two slice the first time it is offered. */
function fight(F: Fighter, boss: Fighter, rng: Rng, slice: boolean) {
  const bt = newBattle(F, boss, rng, { mods: [{ hp: 100 }, { maxHp: boss.maxHp }], maxRounds: 30, suddenDeath: true, quiet: true });
  bt.start();
  const fam = phaseKitOf(boss)!.slice.fam;
  let used = false;
  let took = false;
  while (!bt.over) {
    const s = slice && !used ? phaseSlice(bt, fam, used) : null;
    if (s) {
      used = took = true;
      bt.step(s.c as Move, null, { ...s.m });
    } else bt.step();
  }
  return { won: bt.w === 0, took };
}

export function phaseSliceTable(n = N, fights = FIGHTS) {
  const pool = rankPool(1, { n: 1000, games: 2000 });
  const rows: { ch: number; name: string; before: number; after: number; offered: number }[] = [];
  for (let ch = 1; ch <= CHAPTERS.length; ch++) {
    let before = 0;
    let after = 0;
    let offered = 0;
    for (let i = 0; i < n; i++) {
      const rng = mulberry32(ch * 1000 + i * 7 + 99);
      const g = newRun(rng, pool, fighterOfStrength('average'));
      const F = g.F as CareerFighter;
      const lvl = CHAPTERS[ch - 1]!.lvl;
      levelUp(F, lvl - 1, rng);
      F.lvl = lvl;
      F.tp = lvl - 1;
      spendTalents(g);
      randomGear(F, Math.min(6, Math.floor(ch / 2) + 1), rng);
      F.story = { ...storyOf(g), ch } as never;
      const boss = makeBoss(g, ch);
      for (let k = 0; k < fights; k++) {
        const seed = ch * 100003 + i * 1009 + k;
        if (fight(F, boss, mulberry32(seed), false).won) before++;
        const r = fight(F, boss, mulberry32(seed), true);
        if (r.won) after++;
        if (r.took) offered++;
      }
    }
    const t = n * fights;
    rows.push({ ch, name: CHAPTERS[ch - 1]!.n, before: before / t, after: after / t, offered: offered / t });
  }
  return rows;
}

if (process.argv[1]?.endsWith('phase-slice.ts')) {
  const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(6);
  const rows = phaseSliceTable();
  console.log(`Boss wins, auto-play vs auto-play plus the phase-two slice (${N} average builds x ${FIGHTS} fights per chapter)`);
  console.log(`${'Ch'.padEnd(25)}${'before'.padStart(7)}${'after'.padStart(7)}${'change'.padStart(8)}${'reached'.padStart(9)}`);
  for (const r of rows) {
    const d = Math.round((r.after - r.before) * 100);
    console.log(`${String(r.ch).padStart(2)} ${r.name.slice(0, 21).padEnd(22)}${pct(r.before)} ${pct(r.after)} ${`${d >= 0 ? '+' : ''}${d}`.padStart(7)}${pct(r.offered).padStart(9)}`);
  }
  const avg = (k: 'before' | 'after') => rows.reduce((a, r) => a + r[k], 0) / rows.length;
  console.log(`   ${'average'.padEnd(22)}${pct(avg('before'))} ${pct(avg('after'))} ${`+${Math.round((avg('after') - avg('before')) * 100)}`.padStart(7)}`);
}
