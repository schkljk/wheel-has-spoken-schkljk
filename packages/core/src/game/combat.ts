import { ULTS } from '../data/wheels';
import { ULT_WHEEL } from '../data/kits';
import { POW_COST, canPower, ultWeights, type Side } from '../battle';
import { kitMoves } from '../kits';
import { clamp } from '../random';
import type { RoundMod } from '../types';

/** The four focuses of the combat wheel. */
export type Focus = 'atk' | 'def' | 'pow' | 'ult';
export const CW_FOCUS: [Focus, string, string][] = [
  ['atk', '⚔️', 'Attack'],
  ['def', '🛡️', 'Defend'],
  ['pow', '✨', 'Skill'],
  ['ult', '🌟', 'Special'],
];
/** The focus that counters what the read says they will do. */
export const CW_REC: Record<string, Focus> = { strike: 'def', power: 'atk', guard: 'pow', ult: 'def', feint: 'atk', focus: 'atk' };
export const READ_NAME: Record<string, string> = { strike: 'Strike', power: 'Power', guard: 'Guard', ult: 'Signature', feint: 'Feint', focus: 'Charging up' };

/** How sure a read is, in words (never a percentage). */
export function readClue(a: number) {
  return a >= 0.9 ? 'Clear as day' : a >= 0.8 ? 'Pretty sure' : a >= 0.7 ? 'Probably' : a >= 0.6 ? 'Maybe' : a >= 0.5 ? 'Just a hunch' : 'Wild guess';
}

export interface CwSlice {
  k: string;
  n: string;
  e: string;
  c: string;
  q: number;
  w: number;
  d: string;
  m?: RoundMod;
  src?: string;
  ultIdx?: number;
}

export const cwPowOk = (me: Side) => me.f.power.k !== 'none' && !me.f.power.passive && me.powOn && canPower(me) && me.en >= POW_COST;

/**
 * A focus wheel's slices: this fighter's own moves for that focus plus a few basics, near-equal in size and
 * nudged by stats (legacy cwSlices). The Special wheel is the signature move's damage wheel.
 */
export function cwSlices(me: Side, focus: Focus): { it: CwSlice; w: number; mult: number }[] {
  if (focus === 'ult') {
    const w = ultWeights(me);
    const sig = ULTS[me.f.arch.k] || 'Signature';
    return ULT_WHEEL.map((u, i) => ({
      it: { k: 'ult_' + u.k, n: `${u.n} ×${u.m}`, e: u.e, c: 'ult', q: u.q, w: w[i]!, ultIdx: i, d: `${sig} lands for ${u.m}× damage` },
      w: Math.round(w[i]! * 100) / 100,
      mult: 1,
    }));
  }
  const s = me.s;
  const f = me.f;
  const pw = cwPowOk(me);
  const nudge = (v: number) => clamp(1 + (v - 6) * 0.035, 0.8, 1.25);
  const basics: Record<string, (CwSlice | null)[]> = {
    atk: [
      { k: 'strike', n: 'Strike', e: f.weapon.e || '👊', c: 'strike', q: 1, w: nudge(s.str), d: 'Beats Power' },
      { k: 'heavy', n: 'Heavy blow', e: '🔨', c: 'strike', m: { dmgX: 1.45, slow: 1, label: 'Heavy blow' } as RoundMod, q: 1, w: nudge((s.str + s.wm) / 2), d: '+45% damage, goes second' },
      { k: 'feint', n: 'Feint', e: '🎭', c: 'feint', q: 1, w: nudge(s.iq), d: 'Baits a guard: the next hit lands 40% harder' },
    ],
    def: [
      { k: 'guard', n: 'Guard', e: '🛡️', c: 'guard', q: 1, w: nudge(s.dur), d: 'Beats Strike, blocks and counters' },
      { k: 'dodge', n: 'Sidestep', e: '💨', c: 'dodge', m: { dodge: 0.45 } as RoundMod, q: 1, w: nudge(s.spd), d: 'Big dodge chance against anything but a signature' },
      { k: 'counter', n: 'Counter', e: '🔁', c: 'guard', m: { counterX: 1.7, label: 'Counter' } as RoundMod, q: 1, w: nudge(s.iq), d: 'A guard that counters 70% harder' },
    ],
    pow: [
      pw ? { k: 'power', n: f.power.n, e: f.power.e, c: 'power', q: 1, w: nudge(s.pm), d: 'Breaks Guard' } : null,
      pw && me.en >= POW_COST + 15
        ? { k: 'surge', n: 'Overcharge', e: '🌩️', c: 'power', m: { dmgX: 1.4, enCost: 15, label: 'Overcharge' } as RoundMod, q: 1, w: nudge(s.pm), d: '+40% power damage, costs 15 more energy' }
        : null,
      { k: 'focus', n: 'Charge up', e: '🧘', c: 'focus', q: 1, w: nudge(s.iq), d: '+30 energy, your next hit lands 25% harder' },
    ],
  };
  const own: CwSlice[] = kitMoves(f)
    .filter((m) => m.fam === focus && (m.c !== 'power' || pw))
    .map((m) => ({ k: 'kit_' + m.n, n: m.n, e: m.e, c: m.c, m: { ...m.rm } as RoundMod, q: m.src === 'class' ? 3 : 2, w: 1.15, d: m.d, src: m.src }));
  const list = [...own, ...(basics[focus] || []).filter((x): x is CwSlice => !!x)].slice(0, Math.max(5, own.length + 1));
  return list.map((it) => ({ it, w: Math.round(it.w * 100) / 100, mult: 1 }));
}
