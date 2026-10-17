/**
 * Upgrade 15: how the heaviest crit, dodge and damage-reduction stackers do against random same-level
 * opponents, with the soft caps off and on (same fighters, same fights).
 *   npx tsx tools/sim/stackers.ts [--n 30000]
 */
import { BALANCE, labFighter, mulberry32, newBattle, simulate, useBalance, type Fighter } from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 30000);

/** A fighter's crit and dodge before any move, and their damage reduction. */
function stacks(f: Fighter, o: Fighter) {
  const [x] = newBattle(f, o, mulberry32(1)).P;
  const crit =
    0.06 + x.s.iq * 0.008 + ((x.s.cha || 5) - 6) * 0.004 + (f.arch.k === 'assassin' ? 0.12 : 0) + (x.powOn && f.power.k === 'luck' ? 0.1 : 0) +
    (x.syn.has('backstab') ? 0.15 : 0) + x.tr.critB + (f.ench.k === 'lucky' ? 0.1 : 0);
  const dodge =
    0.04 + (f.arch.k === 'trickster' ? 0.15 : 0) + (x.powOn && f.power.k === 'tele' ? 0.12 : 0) + (x.powOn && f.power.k === 'luck' ? 0.08 : 0) +
    (x.powOn && f.power.k === 'illusion' ? 0.15 : 0) + x.tr.dodgeB;
  return { crit, dodge, dr: x.tr.dr };
}

const rng = mulberry32(11);
const groups: Record<string, { test: (s: ReturnType<typeof stacks>) => boolean; off: number; on: number; n: number }> = {
  'Crit 45% or more': { test: (s) => s.crit >= 0.45, off: 0, on: 0, n: 0 },
  'Dodge 35% or more': { test: (s) => s.dodge >= 0.35, off: 0, on: 0, n: 0 },
  'Damage reduction 15% or more': { test: (s) => s.dr >= 0.15, off: 0, on: 0, n: 0 },
  'Everyone else': { test: () => true, off: 0, on: 0, n: 0 },
};
const tuned = { ...BALANCE };
for (let i = 0; i < N; i++) {
  const lvl = 1 + Math.floor(rng() * 30);
  const a = labFighter(rng, lvl);
  const b = labFighter(rng, lvl);
  const s = stacks(a, b);
  const g = Object.values(groups).find((x) => x.test(s))!;
  const seed = (i * 7919 + 13) >>> 0;
  useBalance({ ...tuned, softCaps: false });
  const off = simulate(a, b, mulberry32(seed)) === 0;
  useBalance({ ...tuned, softCaps: true });
  const on = simulate(a, b, mulberry32(seed)) === 0;
  g.n++;
  if (off) g.off++;
  if (on) g.on++;
}
useBalance(tuned);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
console.log(`Stackers vs random same-level opponents (${N} fights, soft caps off -> on)`);
for (const [k, g] of Object.entries(groups)) console.log(`  ${k.padEnd(30)} ${pct(g.off / g.n).padStart(6)} -> ${pct(g.on / g.n).padStart(6)}   (${g.n} fights)`);
