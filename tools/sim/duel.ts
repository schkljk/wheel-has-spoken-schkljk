/**
 * Daily duel days (review F2, banded in K4): the stand-in's odds on auto-battle over many days (200 fights
 * each), with the `duelBand` re-roll off and on, and how many rolls a day takes.
 *   npx tsx tools/sim/duel.ts [--days 200]
 */
import { duelOf, headToHead, mulberry32 } from '../../packages/core/src';
import { withBal } from './paired';

const i = process.argv.indexOf('--days');
const DAYS = i > 0 ? Number(process.argv[i + 1]) : 200;
const days = Array.from({ length: DAYS }, (_, k) => new Date(Date.UTC(2026, 0, 1 + k)).toISOString().slice(0, 10));
for (const on of [false, true])
  withBal({ duelBand: on }, () => {
    const t0 = performance.now();
    const ds = days.map((d) => duelOf(d));
    const ms = (performance.now() - t0) / DAYS;
    const o = ds.map((d, k) => headToHead(d.me, d.opp, mulberry32(k + 5), 200, { arena: d.arena }));
    const sh = (lo: number, hi: number) => `${Math.round((o.filter((x) => x >= lo && x <= hi).length / DAYS) * 100)}%`;
    const rolls = ds.reduce((a, d) => a + d.tries + 1, 0) / DAYS;
    console.log(
      `${on ? 'band on ' : 'band off'}: ${DAYS} days. 25-75%: ${sh(0.25, 0.75)}, 35-65%: ${sh(0.35, 0.65)}, under 15%: ${sh(0, 0.1499)}, over 85%: ${sh(0.8501, 1)}` +
        (on ? `; ${rolls.toFixed(1)} rolls a day (most ${Math.max(...ds.map((d) => d.tries + 1))}), ${ms.toFixed(0)} ms a day here` : ''),
    );
  });
