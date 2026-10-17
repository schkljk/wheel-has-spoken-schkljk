import type { BattleEvent } from '../battle';
import { SYN } from '../data/synergies';

/** A named moment in a fight: an element combo landing or a synergy kicking in. */
export interface Proc {
  kind: 'combo' | 'synergy';
  /** the combo's name or the synergy's key */
  k: string;
  n: string;
  e: string;
  /** what it did, in a few words */
  sub: string;
  /** whose combo or synergy it is */
  side: 0 | 1;
  /** a joke synergy that just hurt its owner */
  anti: boolean;
}

/** The element combos (battle.ts calc), with what each does in a few words. */
export const COMBOS: Record<string, { e: string; sub: string; tint: string }> = {
  Electrocuted: { e: '⚡', sub: 'Lightning on soaked: double damage', tint: 'lightning' },
  Shatter: { e: '🧊', sub: 'Blunt on frozen: double damage', tint: 'ice' },
  'Fanned flames': { e: '🔥', sub: 'Wind on burning: +60% damage', tint: 'fire' },
  Resonance: { e: '🔊', sub: 'Sonic on frozen: +80% damage', tint: 'sonic' },
  Overgrowth: { e: '🌿', sub: 'Plants on soaked: +40% damage', tint: 'plant' },
  'Flash freeze': { e: '❄️', sub: 'Ice on soaked: loses a turn', tint: 'ice' },
};

/** What a synergy did when the engine tags an event with it (battle.ts synCue). */
export const SYN_PROC: Record<string, string> = {
  comedy: 'Triple damage',
  backstab: 'The +15% crit chance pays off',
  speed: 'Too fast: an extra hit',
  storm2: 'Swift winds: an extra hit',
  tank2: 'Guard blocks 85%',
  zero: 'Freezes way more often',
  storm: 'The lightning chains',
  blood: 'Drains twice as much',
  bonelord: 'Rises with 60 HP',
  selfown: 'The attack backfires',
};

const SYN_BY_K = new Map(SYN.map((s) => [s.k, s]));

/** The combo or synergy behind an event, if any. */
export function procOf(e: BattleEvent): Proc | null {
  const a = e.a;
  if (!a) return null;
  if (typeof a.combo === 'string' && COMBOS[a.combo]) {
    const c = COMBOS[a.combo]!;
    return { kind: 'combo', k: a.combo, n: a.combo, e: c.e, sub: c.sub, side: (a.by ?? 0) as 0 | 1, anti: false };
  }
  if (a.syn) {
    const s = SYN_BY_K.get(a.syn);
    if (!s) return null;
    return { kind: 'synergy', k: s.k, n: s.n, e: s.e, sub: SYN_PROC[s.k] || s.d, side: (a.sb ?? 0) as 0 | 1, anti: !!s.anti };
  }
  return null;
}

/**
 * Which procs get a banner in one fight: every element combo (they are the player's doing), each synergy
 * once per fighter (a backstabber crits a lot; the first one makes the point).
 */
export function procFeed(): (e: BattleEvent) => Proc | null {
  const seen = new Set<string>();
  return (e) => {
    const p = procOf(e);
    if (!p || p.kind === 'combo') return p;
    const id = `${p.side}:${p.k}`;
    if (seen.has(id)) return null;
    seen.add(id);
    return p;
  };
}

/** The blow that knocks someone out in a batch of events: the last thing that hurt the fallen before the K.O. (or -1). */
export function finisherOf(evs: readonly BattleEvent[]): number {
  const k = evs.findIndex((e) => e.a?.t === 'ko');
  if (k < 0) return -1;
  const on = evs[k]!.a!.on;
  for (let i = k - 1; i >= 0; i--) {
    const a = evs[i]!.a;
    if (a && ['hit', 'ult', 'pet', 'dot', 'self', 'uno'].includes(a.t) && (a.to ?? a.on) === on) return i;
  }
  return -1;
}
