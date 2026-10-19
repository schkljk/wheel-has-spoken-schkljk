import { SKIPPED } from '../data/wheels';
import { WHEELS, labelOf, oddsFor, type OddsEntry, type OddsReason, type PartialFighter, type Slice, type Wheel } from '../fighter';
import { pick } from '../random';
import { synOf } from '../stats';
import type { Fighter, Synergy } from '../types';
import { ctxOf, type Game } from './game';
import { markSeen } from './career';
import { CX_CATS, cxKey } from './lookups';

/** A fighter while its wheels are being spun. */
export type BuildFighter = PartialFighter & { free?: number };
export const newBuild = (name: string): BuildFighter => ({ name, bonus: {}, boons: [], free: 1 });

/**
 * The odds of a build wheel: the fighter's earlier picks shift them (oddsFor), then the collection does:
 * undiscovered slices ×1.25, the last fighter's picks ×0.6, past champions' picks nerfed (legacy playerOdds).
 */
export function playerOdds(g: Game, W: Wheel, f: PartialFighter): { list: OddsEntry[]; reasons: OddsReason[] } {
  const od = oddsFor(W, f, ctxOf(g));
  const list = od.list;
  const reasons = od.reasons.slice();
  if (CX_CATS.has(W.k)) {
    const p = g.save.profile;
    const last = new Set(p.last);
    const seen = p.seen[W.k] || [];
    let hitL = false;
    let hitC = false;
    const und = list.filter((e) => !seen.includes(cxKey(W.k, e.it, f)));
    list.forEach((e) => {
      const id = W.k + '|' + cxKey(W.k, e.it, f);
      if (last.has(id)) {
        e.mult *= 0.6;
        e.w *= 0.6;
        hitL = true;
      }
      const c = p.champIds[id] as number | undefined;
      if (c) {
        const m = Math.max(0.5, Math.pow(0.85, c));
        e.mult *= m;
        e.w *= m;
        hitC = true;
      }
    });
    if (und.length && und.length < list.length) {
      und.forEach((e) => {
        e.mult *= 1.25;
        e.w *= 1.25;
      });
      reasons.push({ cls: 'up', txt: '🔍 Undiscovered slices ×1.25' });
    }
    if (hitL) reasons.push({ cls: 'down', txt: '🔁 Your last fighter had it: ×0.6' });
    if (hitC) reasons.push({ cls: 'down', txt: '🏆 Past champion picks nerfed' });
  }
  return { list, reasons };
}

export const applicable = (W: Wheel, f: PartialFighter) => !W.cond || W.cond(f);
/** The next wheel to spin from index i: skips wheels that don't apply and lands auto-skips. */
export function nextWheel(f: BuildFighter, i: number): number {
  while (i < WHEELS.length) {
    const W = WHEELS[i]!;
    if (W.cond && !W.cond(f)) {
      i++;
      continue;
    }
    if (W.skipIf && W.skipIf(f)) {
      (f as Record<string, unknown>)[W.k] = SKIPPED;
      i++;
      continue;
    }
    break;
  }
  return i;
}
export const wheelsTotal = (f: PartialFighter) => WHEELS.filter((W) => applicable(W, f)).length;
/** Wheels that may still be added: a sub-wheel whose parent wheel (race, archetype, backstory) hasn't landed yet. */
export const wheelsMaybe = (f: PartialFighter) => WHEELS.filter((W) => W.cond && !W.cond(f) && W.from && W.from(f) == null).length;
export const wheelsDone = (f: PartialFighter, i: number) => WHEELS.slice(0, i).filter((W) => applicable(W, f)).length;

const RESIL = ['str', 'spd', 'dur', 'iq'];
export interface BuildLanding {
  /** Resilient fighters re-spin stat tiers below Peak human */
  respin?: boolean;
  newInCollection?: boolean;
  syns: { s: Synergy; isNew: boolean }[];
  /** the sub-wheel this pick opens */
  subWheel?: string;
  best: number;
}
/** A build wheel landed: the pick goes in, the collection logs it, new synergies show up. */
export function buildLand(g: Game, f: BuildFighter, W: Wheel, it: Slice, i: number): BuildLanding {
  g.save.profile.spins++;
  let best = it.q == null ? 1 : it.q;
  if (f.arch && f.arch.k === 'resilient' && RESIL.includes(W.k) && (it.v as number) < 4) return { respin: true, syns: [], best: 1 };
  const before = new Set(synOf(f as Fighter).map((s) => s.k));
  (f as Record<string, unknown>)[W.k] = it;
  const out: BuildLanding = { syns: [], best };
  if (CX_CATS.has(W.k) && markSeen(g, W.k, cxKey(W.k, it, f))) out.newInCollection = true;
  // hidden synergies stay secret until a fight shows them
  for (const s of synOf(f as Fighter).filter((x) => !before.has(x.k) && !x.hidden)) {
    out.syns.push({ s, isNew: markSeen(g, 'syn', s.n) });
    if (!s.anti) best = 3;
  }
  out.best = best;
  const next = WHEELS[i + 1];
  if (next && next.cond && next.cond(f) && next.from && next.from(f) === (it as unknown)) out.subWheel = labelOf(next, f);
  return out;
}
/** The one free reroll: everything from the last spun wheel on is spun again. */
export function reroll(f: BuildFighter, lastSpun: number) {
  if (!(f.free! > 0)) return false;
  f.free!--;
  for (let j = lastSpun; j < WHEELS.length; j++) delete (f as Record<string, unknown>)[WHEELS[j]!.k];
  return true;
}

const REACT = [
  ['💀💀💀', 'Bro is cooked', "It's over", 'Pain.', "Chat, it's over"],
  ['Mid', 'Could be worse', "It'll do", 'Fine, I guess', 'Meh'],
  ["Okay, we're cooking", 'Respectable', 'W spin', "Now we're talking", 'Solid'],
  ['👹👹👹', 'GOATED', 'Absolute cinema', 'The wheel loves you', 'Bro is HIM'],
];
/** The crowd's reaction to a landed slice. */
export function reaction(g: Game, it: { q?: number; r?: string; k?: string }, f?: PartialFighter, single = false) {
  if (single && it.k === 'pm' && f && f.power && f.power.k === 'none') return "You don't even have a power 💀";
  if (it.r) return it.r;
  return pick(g.rng, REACT[it.q == null ? 1 : it.q]!);
}
