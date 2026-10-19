// Review round 2's retune of the ported tables (K1, K6, K7, K10). The tables stay a faithful port of the legacy
// game: each change here is laid over a row while its switch in `BALANCE` is on, and taken off again when the
// tuning switches back (the parity tests play by `LEGACY_BALANCE`, so they see the legacy rows). The rows are
// changed in place, so everything that reads them (the fight engine, the UI's descriptions) follows the switch.
import './wording'; // the wording fixes go on first, so a row's "before" is the worded legacy row
import { BALANCE, onBalance, type BalanceFlag } from './balance';
import { TNODE } from '../stats';
import { TREE } from './talents';

const MISSING = Symbol('missing');
interface Patch {
  flag: BalanceFlag;
  row: Record<string | number, unknown>;
  live: Record<string | number, unknown>;
  old: Record<string | number, unknown>;
}
const PATCHES: Patch[] = [];

/** Lays `live` over `row` while `flag` is on. Only the keys in `live` change (a key set to undefined is removed). */
export function retune<T extends object>(flag: BalanceFlag, row: T | undefined, live: Partial<Record<keyof T, unknown>>) {
  if (!row) throw new Error(`retune: no row for ${flag}`);
  const r = row as Record<string | number, unknown>;
  const old: Record<string | number, unknown> = {};
  for (const k of Object.keys(live)) old[k] = k in r ? r[k] : MISSING;
  PATCHES.push({ flag, row: r, live: live as Record<string, unknown>, old });
}

/** A talent's new effect and description, in the tree and in its node. */
export function retuneTalent(flag: BalanceFlag, key: string, eff: unknown, d: string) {
  const [br, k] = key.split('_') as [string, string];
  const row = TREE.find((b) => b.k === br)?.t.find((x) => x[0] === k);
  retune(flag, row as unknown as Record<number, unknown>, { 4: eff, 5: d });
  retune(flag, TNODE[key], { eff, d });
}

/** Puts every row in the state its switch says. */
export function applyRetune() {
  for (const p of PATCHES) {
    const on = !!BALANCE[p.flag];
    for (const k of Object.keys(p.live)) {
      const v = on ? p.live[k] : p.old[k];
      if (v === MISSING || v === undefined) delete p.row[k];
      else p.row[k] = v;
    }
  }
}
onBalance(applyRetune);
