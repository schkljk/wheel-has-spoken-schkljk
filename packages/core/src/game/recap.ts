import { MOVE_N, type Battle, type BattleEvent } from '../battle';
import type { Move } from '../types';

/**
 * The fight recap (review item C1): why a fight went the way it did, from its events. Damage is in real HP,
 * read off the HP each event leaves behind, so heals and revives never count as damage.
 */
export interface Recap {
  /** real HP each side lost: [you, them] */
  lost: [number, number];
  /** the hardest single blow each side landed */
  biggest: [number, number];
  /** rounds whose matchup each side won (a read) */
  reads: [number, number];
  /** damage over time (burns, poison, bleeds) each side took */
  dots: [number, number];
  dodges: [number, number];
  rounds: number;
  /** one thing to try next time, or to keep doing */
  tip: string;
}

// events that are one fighter's blow landing on the other
const BLOW = new Set(['hit', 'ult', 'pet', 'atk', 'fire', 'ice', 'lightning', 'poison', 'light', 'gravity', 'mind']);

export function fightRecap(bt: Battle, log: BattleEvent[], won: boolean): Recap {
  const lost: [number, number] = [0, 0];
  const biggest: [number, number] = [0, 0];
  const dots: [number, number] = [0, 0];
  let prev: number[] | null = null;
  for (const e of log) {
    if (prev && e.hr) for (const i of [0, 1] as const) lost[i] += Math.max(0, (prev[i] ?? 0) - (e.hr[i] ?? 0));
    if (e.hr) prev = e.hr;
    const a = e.a;
    if (!a || e.d == null || e.d <= 0) continue;
    if (a.t === 'dot' && (a.on === 0 || a.on === 1)) dots[a.on] += e.d;
    else if (BLOW.has(a.t) && (a.by === 0 || a.by === 1)) biggest[a.by] = Math.max(biggest[a.by], e.d);
  }
  const reads: [number, number] = [bt.P[0].st.rps, bt.P[1].st.rps];
  const dodges: [number, number] = [bt.P[0].st.dodges, bt.P[1].st.dodges];
  const r = { lost, biggest, reads, dots, dodges, rounds: bt.round };
  return { ...r, tip: recapTip(r, won) };
}

/** The one line of advice, from the most telling number. */
export function recapTip(r: Omit<Recap, 'tip'>, won: boolean): string {
  const [myReads, theirReads] = r.reads;
  if (!won && theirReads >= myReads + 2) return `They won ${theirReads} matchups to your ${myReads}. The teal ring on a focus button counters the read: follow it when the read is sure.`;
  if (!won && r.lost[0] > 0 && r.dots[0] >= r.lost[0] * 0.3) return 'Burns and poison did a big share of the damage. Cures in your bag, or ending fights sooner, take the sting out.';
  if (!won && r.dodges[1] >= 3) return `They dodged ${r.dodges[1]} times. Your signature move can't be dodged: build energy and save it for them.`;
  if (!won && r.biggest[1] >= r.lost[0] * 0.4) return 'One huge hit decided it. Defending when the read says Strike or Signature takes the worst of it.';
  if (!won) return 'Close enough to blame the wheel. Levels, gear and talents all move the odds; so does following the read.';
  if (myReads >= theirReads + 2) return `You won ${myReads} matchups to their ${theirReads}. Reading them is how fights like this are won.`;
  if (r.lost[0] === 0) return 'Not a scratch. They will be telling people they tripped.';
  return 'A win is a win. The wheel will remember it, and so will their family.';
}

/** The round's matchup as a line: "Your Strike vs their Guard: they read it" (or a draw). */
export function matchupLine(mine: Move, theirs: Move, winner: 0 | 1 | null): string {
  const m = MOVE_N[mine] ?? mine;
  const t = (MOVE_N[theirs] ?? theirs).toLowerCase();
  const out = winner === 0 ? 'you read it' : winner === 1 ? 'they read it' : 'no read either way';
  return `Your ${m} vs their ${t}: ${out}`;
}
