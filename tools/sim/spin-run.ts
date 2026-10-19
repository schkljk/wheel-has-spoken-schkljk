/**
 * Spin & Run (review F3, retuned in K3) on auto-battle: how far runs get, by how the boons are picked, with the
 * review's `runFair` switch off (opponents level with you, no second wind) and on (opponents level by fight
 * number, one second wind). Paired: the same runs and dice in every cell.
 *   npx tsx tools/sim/spin-run.ts [--runs 500] [--only on]
 */
import {
  BALANCE,
  RUN_FIGHTS,
  clockAt,
  endRunFight,
  mulberry32,
  newBattle,
  newSave,
  rankPool,
  relicOf,
  runSpecOf,
  runState,
  startRun,
  takeBoon,
  useBalance,
  type Game,
} from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const RUNS = arg('runs', 500);
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '';
const pool = rankPool(1, { n: 1000, games: 3000 });

type Policy = (offer: string[], hp: number, rng: () => number) => string;
const POLICIES: [string, Policy][] = [
  ['first on offer', (o) => o[0]!],
  ['random', (o, _h, rng) => o[Math.floor(rng() * o.length)]!],
  ['prefer +2 levels', (o, _h, rng) => (o.includes('lvl') ? 'lvl' : o[Math.floor(rng() * o.length)]!)],
  [
    'smart',
    (o, hp) => {
      if (hp < 50 && o.includes('heal')) return 'heal';
      for (const k of ['lvl', 'all1', 'dur', 'spd', 'gear', 'str', 'wm', 'pm', 'iq', 'heal']) if (o.includes(k)) return k;
      return o[0]!;
    },
  ],
  // relics (L5): always take one when offered, or take the Cursed crown and Glass cannon only
  ['relics first', (o, _h, rng) => o.find((k) => relicOf(k)) ?? o[Math.floor(rng() * o.length)]!],
  ['smart + relics', (o, hp) => o.find((k) => k === 'crown' || k === 'glass') ?? (hp < 50 && o.includes('heal') ? 'heal' : (['lvl', 'all1', 'dur', 'spd', 'gear', 'str', 'wm', 'pm', 'iq', 'heal'].find((k) => o.includes(k)) ?? o[0]!))],
];

/** One run to the end; returns its wins, gems and collection entries. */
function play(r: number, pol: Policy) {
  const g: Game = { save: newSave(0), F: null, rng: mulberry32(1000 + r), clock: clockAt(), pool, notes: [] };
  const prng = mulberry32(77 + r);
  startRun(g);
  for (;;) {
    const R = runState(g)!;
    if (R.offer) takeBoon(g, pol(R.offer, R.hp, prng));
    const spec = runSpecOf(g, runState(g)!);
    const bt = newBattle(spec.me, spec.opp, g.rng, {
      // relics (L5) bring their own starting tweaks
      mods: spec.mods ?? [{ hp: spec.rushHp }, spec.opp.maxHp ? { maxHp: spec.opp.maxHp } : {}],
      ...(spec.opp.isBoss ? { maxRounds: 30, suddenDeath: true } : {}),
      quiet: true,
    });
    bt.start();
    while (!bt.over) bt.step();
    const i0 = runState(g)!.i;
    const res = endRunFight(g, spec.opp, { w: bt.w!, me: bt.P[0], round: bt.round, sd: !!bt.sd });
    if (res.runOver) return { wins: bt.w === 0 ? i0 + 1 : i0, gems: g.save.profile.gems || 0 };
  }
}

const keep = { ...BALANCE };
const pc = (x: number) => `${((x / RUNS) * 100).toFixed(1)}%`.padStart(9);
console.log(`${RUNS} runs per cell on auto-battle (paired seeds)`);
console.log(`${'rules'.padEnd(8)}${'boon picks'.padEnd(18)}${'wins'.padStart(6)}${'0 wins'.padStart(9)}${'boss won'.padStart(10)}${'gems'.padStart(7)}  % of runs by wins, 0 to ${RUN_FIGHTS}`);
// the relics (L5) are a third cell: the review's rules with relics on offer
for (const [on, relics] of [
  [false, false],
  [true, false],
  [true, true],
] as const) {
  if (only === 'relics' && !on) continue;
  if (only && only !== 'relics' && (only === 'on') !== on) continue;
  useBalance({ ...keep, runFair: on, runRelics: relics });
  for (const [name, pol] of POLICIES) {
    const hist = Array.from({ length: RUN_FIGHTS + 1 }, () => 0);
    let wins = 0;
    let gems = 0;
    for (let r = 0; r < RUNS; r++) {
      const x = play(r, pol);
      hist[x.wins]!++;
      wins += x.wins;
      gems += x.gems;
    }
    console.log(
      `${(relics ? 'relics' : on ? 'after' : 'before').padEnd(8)}${name.padEnd(18)}${(wins / RUNS).toFixed(2).padStart(6)}${pc(hist[0]!)}${pc(hist[RUN_FIGHTS]!).padStart(10)}${(gems / RUNS).toFixed(2).padStart(7)}  ${hist.map((n) => Math.round((n / RUNS) * 100)).join(' ')}`,
    );
  }
}
useBalance(keep);
