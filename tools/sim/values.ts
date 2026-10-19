/**
 * What things are worth in a fight, before and after review round 2's balance pass (every K switch off, then
 * on), in win-rate points over the same pairs and dice:
 *   premium  each premium piece in place of a random one (six random common-epic pieces otherwise)
 *   talents  the revive talents and the ones K6 and K10 changed, at max rank, on auto-battle
 *   sets     each full gear set in place of six random pieces
 *   units    +10% dodge, +10% crit, +10% damage reduction, added in the battle
 *   picks    win rates of the outlier picks in random same-level lab fights
 *   npx tsx tools/sim/values.ts <premium|talents|sets|units|picks> [N]
 */
import { PREMIUM, TNODE, gearPool, labFighter, mulberry32, simulate, type Fighter } from '../../packages/core/src';
import { ROUND2_OFF, ROUND2_ON, pairs, pct, pts, rate, wear, withBal, type Tweak } from './paired';

const sec = process.argv[2] ?? 'premium';
const N = Number(process.argv[3] || 1500);
const both = <T>(fn: () => T): [T, T] => [withBal(ROUND2_OFF, fn), withBal(ROUND2_ON, fn)];

if (sec === 'premium') {
  const ps = pairs(N);
  const [b, a] = both(() => [rate(ps), ...PREMIUM().map((g) => rate(ps, wear(g.k)))]);
  console.log(`${N} paired fights, levels 5-30, a premium piece in place of a random one (base ${pct(b[0]!)} / ${pct(a[0]!)})`);
  PREMIUM().forEach((g, i) => console.log(`  ${g.n.padEnd(28)} before ${pts(b[i + 1]!, b[0]!).padStart(6)}   after ${pts(a[i + 1]!, a[0]!).padStart(6)}`));
}

if (sec === 'talents') {
  const ps = pairs(N, 41, 10, 30, false).map((p) => ({ ...p, a: Object.assign(p.a, { talents: {} }) }));
  const ks = ['def_stubborn', 'def_wind', 'for_break', 'spi_drain', 'def_counter', 'def_iguard', 'def_wall', 'tac_evade', 'def_tough'];
  const one = (k: string) => (f: Fighter) => void (f.talents = { [k]: TNODE[k]!.max });
  const pair = (f: Fighter) => void (f.talents = { def_wind: 1, def_stubborn: 1 });
  const [b, a] = both(() => [rate(ps), ...ks.map((k) => rate(ps, one(k))), rate(ps, pair)]);
  console.log(`${N} paired fights, levels 10-30, auto-battle, each talent at max rank (and per point)`);
  ks.forEach((k, i) => {
    const m = TNODE[k]!.max;
    const per = (x: number, y: number) => `${(((x - y) * 100) / m).toFixed(1)}/pt`;
    console.log(`  ${`${TNODE[k]!.n} x${m}`.padEnd(24)} before ${pts(b[i + 1]!, b[0]!).padStart(6)} (${per(b[i + 1]!, b[0]!)})   after ${pts(a[i + 1]!, a[0]!).padStart(6)} (${per(a[i + 1]!, a[0]!)})`);
  });
  console.log(`  ${'Second wind + Stubborn'.padEnd(24)} before ${pts(b[ks.length + 1]!, b[0]!).padStart(6)}            after ${pts(a[ks.length + 1]!, a[0]!).padStart(6)}`);
}

if (sec === 'sets') {
  const ps = pairs(N, 31);
  const SETS = [...new Set(gearPool().filter((g) => g.set).map((g) => g.set!))];
  const setMod = (s: string) => (f: Fighter) => {
    f.gear = { ...(f.gear || {}) };
    for (const g of gearPool().filter((x) => x.set === s)) (f.gear as Record<string, string>)[g.slot] = g.k;
  };
  const [b, a] = both(() => [rate(ps), ...SETS.map((s) => rate(ps, setMod(s)))]);
  console.log(`${N} paired fights, levels 5-30, a full set in place of six random pieces (base ${pct(b[0]!)} / ${pct(a[0]!)})`);
  SETS.forEach((s, i) => {
    const p = gearPool().filter((x) => x.set === s);
    console.log(`  ${`${s} (${p.length}, ${[...new Set(p.map((x) => x.r))].join('/')})`.padEnd(24)} before ${pts(b[i + 1]!, b[0]!).padStart(6)}   after ${pts(a[i + 1]!, a[0]!).padStart(6)}`);
  });
}

if (sec === 'units') {
  const ps = pairs(N, 91, 5, 30, false);
  const T: [string, Tweak][] = [
    ['+10% dodge', (me) => void (me.tr.dodgeB += 0.1)],
    ['+10% crit', (me) => void (me.tr.critB += 0.1)],
    ['+10% damage reduction', (me) => void (me.tr.dr += 0.1)],
  ];
  const [b, a] = both(() => [rate(ps), ...T.map(([, fn]) => rate(ps, undefined, fn))]);
  console.log(`${N} paired fights, levels 5-30, traits added in the battle`);
  T.forEach(([n], i) => console.log(`  ${n.padEnd(24)} before ${pts(b[i + 1]!, b[0]!).padStart(6)}   after ${pts(a[i + 1]!, a[0]!).padStart(6)}`));
}

if (sec === 'picks') {
  const keys: Record<string, (f: Fighter) => string> = { title: (f) => f.title?.n ?? '-', weapon: (f) => f.weapon.n, power: (f) => f.power.n, side: (f) => f.side?.n ?? '-' };
  const show: Record<string, string[]> = {
    title: ['the Undisputed GOAT', 'Plot Twist', 'the Final Boss', 'No title', 'Washed', 'Fraud Watch'],
    weapon: ['Uno reverse card', 'Laser rifle', 'Chainsaw', 'Bo staff'],
    power: ['Regeneration', 'Time stop', 'Poison', 'No power'],
    side: ['Tiny dragon', 'Attack dog', 'Flying solo'],
  };
  const run = () => {
    const acc: Record<string, Map<string, { w: number; n: number }>> = {};
    for (let i = 0; i < N; i++) {
      const rng = mulberry32((5 + i * 7919) >>> 0);
      const lvl = 1 + Math.floor(rng() * 30);
      const a = labFighter(rng, lvl);
      const b = labFighter(rng, lvl);
      const won = simulate(a, b, mulberry32((1000003 + i * 31) >>> 0)) === 0;
      for (const [f, w] of [
        [a, won],
        [b, !won],
      ] as const)
        for (const [t, fn] of Object.entries(keys)) {
          const m = (acc[t] ??= new Map());
          const s = m.get(fn(f)) ?? { w: 0, n: 0 };
          s.n++;
          if (w) s.w++;
          m.set(fn(f), s);
        }
    }
    return acc;
  };
  const [b, a] = both(run);
  console.log(`${N} random same-level lab fights, levels 1-30: win rate by pick, before -> after`);
  for (const [t, names] of Object.entries(show))
    for (const n of names) {
      const x = b[t]!.get(n);
      const y = a[t]!.get(n);
      if (x && y) console.log(`  ${t.padEnd(7)} ${n.padEnd(22)} ${pct(x.w / x.n)} -> ${pct(y.w / y.n)}  (n=${y.n})`);
    }
}
