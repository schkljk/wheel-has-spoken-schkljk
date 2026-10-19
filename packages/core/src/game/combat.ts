import { ULTS } from '../data/wheels';
import { BOSSES } from '../data/content/story';
import { BOSS_PHASE, type BossPhaseKit } from '../data/content/phase';
import { ULT_WHEEL } from '../data/kits';
import { canPower, powCost, ultWeights, type Battle, type Side } from '../battle';
import { BALANCE } from '../data/balance';
import { kitMoves } from '../kits';
import { clamp } from '../random';
import type { Fighter, RoundMod } from '../types';

/** The four focuses of the combat wheel. */
export type Focus = 'atk' | 'def' | 'pow' | 'ult';
export const CW_FOCUS: [Focus, string, string][] = [
  ['atk', '⚔️', 'Attack'],
  ['def', '🛡️', 'Defend'],
  ['pow', '✨', 'Power'],
  ['ult', '🌟', 'Signature'],
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
  /** the joke under the mechanics (boss phase-two slices) */
  flavor?: string;
}

export const cwPowOk = (me: Side) => me.f.power.k !== 'none' && !me.f.power.passive && me.powOn && canPower(me);

/** The move a focus is about (review E1): Attack strikes, Defend guards, Power uses the power. */
const FAMILY: Record<string, string> = { atk: 'strike', def: 'guard', pow: 'power' };

/**
 * A focus wheel's slices: this fighter's own moves for that focus plus a few basics, near-equal in size and
 * nudged by stats (legacy cwSlices). The Signature wheel is the signature move's damage wheel.
 * With the review's pure focus (E1) every slice is of the focus's own family, so you choose what and the wheel
 * chooses how hard: Attack holds strikes (a quick jab among them), Defend guards and counters, Power powers. A
 * Power wheel with no power to use holds the guard-beating tricks instead (feint, charge up).
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
      BALANCE.pureFocus
        ? { k: 'jab', n: 'Quick jab', e: '⚡', c: 'strike', m: { dmgX: 0.75, first: 1, label: 'Quick jab' } as RoundMod, q: 1, w: nudge(s.spd), d: 'Goes first, 75% damage' }
        : null,
    ],
    def: [
      { k: 'guard', n: 'Guard', e: '🛡️', c: 'guard', q: 1, w: nudge(s.dur), d: 'Beats Strike, blocks and counters' },
      { k: 'dodge', n: 'Sidestep', e: '💨', c: 'dodge', m: { dodge: 0.45 } as RoundMod, q: 1, w: nudge(s.spd), d: 'Big dodge chance against anything but a signature' },
      { k: 'counter', n: 'Counter', e: '🔁', c: 'guard', m: { counterX: 1.7, label: 'Counter' } as RoundMod, q: 1, w: nudge(s.iq), d: 'A guard that counters 70% harder' },
    ],
    pow: [
      pw ? { k: 'power', n: f.power.n, e: f.power.e, c: 'power', q: 1, w: nudge(s.pm), d: 'Breaks Guard' } : null,
      pw && me.en >= powCost(me) + 15
        ? { k: 'surge', n: 'Overcharge', e: '🌩️', c: 'power', m: { dmgX: 1.4, enCost: 15, label: 'Overcharge' } as RoundMod, q: 1, w: nudge(s.pm), d: '+40% power damage, costs 15 more energy' }
        : null,
      { k: 'focus', n: 'Charge up', e: '🧘', c: 'focus', q: 1, w: nudge(s.iq), d: '+30 energy, your next hit lands 25% harder' },
    ],
  };
  const own: CwSlice[] = kitMoves(f)
    .filter((m) => m.fam === focus && (m.c !== 'power' || pw))
    .map((m) => ({ k: 'kit_' + m.n, n: m.n, e: m.e, c: m.c, m: { ...m.rm } as RoundMod, q: m.src === 'class' ? 3 : 2, w: 1.15, d: m.d, src: m.src }));
  let all = [...own, ...(basics[focus] || []).filter((x): x is CwSlice => !!x)];
  if (BALANCE.pureFocus) {
    const pure = all.filter((x) => x.c === FAMILY[focus]);
    // a Power wheel with nothing to cast: the tricks that beat a guard (a feint) or set up the next turn
    all = pure.length ? pure : focus === 'pow' ? [basics.atk![2]!, ...all.filter((x) => x.c === 'focus')] : all;
  }
  const list = all.slice(0, Math.max(5, own.length + 1));
  return list.map((it) => ({ it, w: Math.round(it.w * 100) / 100, mult: 1 }));
}

/** What holding a combat wheel slice shows: roughly what it does to this opponent and what it beats. */
export interface SlicePeek {
  /** damage range of the hit (low and high roll, no crit), or null for moves that don't hit */
  dmg: [number, number] | null;
  /** the counter a guard slice deals when they strike */
  counter: [number, number] | null;
  /** it hits their weak spot */
  weak: boolean;
  /** the matchup, in a few words */
  beats: string;
}

const MATCHUP: Record<string, string> = {
  strike: 'Beats Power · loses to Guard',
  power: 'Breaks Guard · loses to Strike',
  guard: 'Beats Strike · loses to Power',
  feint: 'Baits a Guard · no damage this round',
  focus: 'No damage this round · charges your next hit',
  dodge: "Dodges most things · not a signature",
  ult: "Can't be dodged · a Guard still softens it",
};

/** A slice's preview for the player (side 0) against their opponent, right now. */
export function peekSlice(bt: Battle, it: CwSlice): SlicePeek {
  const rm = it.m || {};
  const kind = it.c === 'ult' ? 'ult' : it.c === 'power' ? 'power' : it.c === 'strike' ? 'strike' : null;
  const ultM = it.ultIdx != null ? ULT_WHEEL[it.ultIdx]!.m : 1;
  const p = kind ? bt.preview(0, kind, rm, ultM) : null;
  const c = it.c === 'guard' ? bt.counterPreview(0, rm) : null;
  return { dmg: p ? [p.lo, p.hi] : null, counter: c ? [c.lo, c.hi] : null, weak: !!p?.weak, beats: MATCHUP[it.c] ?? '' };
}

/** A boss's phase-two kit, found by name so it works in every mode bosses fight in (a remix: its first kit). */
export function phaseKitOf(f: Fighter): BossPhaseKit | null {
  return phaseKits(f)[0] ?? null;
}
/** Every phase-two kit a boss brings: one, or two for a Wheelborn remix (review F12). */
export function phaseKits(f: Fighter): BossPhaseKit[] {
  if (!f.isBoss) return [];
  if (f.remix) return f.remix.map((i) => BOSS_PHASE[i]).filter((k): k is BossPhaseKit => !!k);
  const i = BOSSES.findIndex((b) => b.name === f.name);
  return i >= 0 && BOSS_PHASE[i] ? [BOSS_PHASE[i]] : [];
}

/**
 * The slice a boss's phase two adds to the player's wheel of that focus: only while the boss (side 1) is in
 * phase two, and only until the player has landed it once (`used`: true, or the names of the slices landed).
 */
export function phaseSlice(bt: Battle, focus: Focus, used: boolean | readonly string[]): CwSlice | null {
  const boss = bt.P[1];
  if (used === true || !boss.phased) return null;
  const kit = phaseKits(boss.f).find((k) => k.slice.fam === focus && !(Array.isArray(used) && used.includes(k.slice.n)));
  if (!kit) return null;
  const s = kit.slice;
  return { k: `phase_${s.n}`, n: s.n, e: s.e, c: s.c, q: 3, w: 1.3, d: s.d, m: { ...s.rm, label: s.n, e: s.e }, src: 'phase', flavor: s.flavor };
}
