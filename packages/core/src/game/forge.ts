import { BALANCE } from '../data/balance';
import { clamp } from '../random';
import { GEARK, UPGRADE_FX } from '../stats';
import type { Fighter, Gear } from '../types';
import { addCoins, coinsOf, spend, type Game } from './game';
import { invalidate } from './career';

/**
 * Gear upgrades (Phase 4, upgrade 21): any piece you own goes from +1 to +5 for coins, and the last two
 * levels also take a copy of it. Copies come from loot that lands a piece you already have (it used to be
 * salvaged on the spot) and, a quarter of the time, as a bonus on any gear drop. A copy you don't need
 * salvages for the same coins the piece would.
 */
export const UPGRADE_MAX = 5;
export const upgradeLevel = (f: Fighter, k: string) => (f.gup && f.gup[k]) || 0;
export const copiesOf = (f: Fighter, k: string) => (f.gcopy && f.gcopy[k]) || 0;
/** Coins for upgrading to level `L`: a step per level, scaled by what the piece is worth. */
export const upgradeCost = (x: Gear, L: number) => clamp(Math.round(x.cost * 0.6), 3, 60) * L;
/** Copies the step to level `L` takes. */
export const copiesFor = (L: number) => (L >= 4 ? 1 : 0);
/** What a copy salvages for. */
export const copyValue = (x: Gear) => (x.r === 'premium' ? 20 : Math.max(1, Math.round(x.cost / 3)));
const owns = (f: Fighter, k: string) => Object.values(f.gear || {}).includes(k) || ((f as { armory?: string[] }).armory || []).includes(k);

/** The next step for a piece: its level, what it costs, whether you can pay, and what it gives. */
export function upgradeNext(g: Game, k: string) {
  const F = g.F!;
  const x = GEARK[k]!;
  const L = upgradeLevel(F, k) + 1;
  const cost = upgradeCost(x, L);
  const copies = copiesFor(L);
  const [, per, word] = UPGRADE_FX[x.slot];
  const why =
    L > UPGRADE_MAX ? 'Fully upgraded' : coinsOf(g) < cost ? `Needs ${cost} coins` : copiesOf(F, k) < copies ? 'Needs a copy of it (from loot)' : null;
  /** what one level adds, and what the piece will add in all, in words */
  const pct = (n: number) => `+${Math.round(n * 1000) / 10}% ${word}`;
  return { L, cost, copies, step: pct(per), now: pct(per * (L - 1)), total: pct(per * Math.min(L, UPGRADE_MAX)), ok: !why && owns(F, k), why };
}

/** Upgrades a piece by one level. Returns whether it worked. */
export function upgradeGear(g: Game, k: string): boolean {
  const F = g.F!;
  const u = upgradeNext(g, k);
  if (!BALANCE.gearUpgrades || !u.ok || !spend(g, u.cost)) return false;
  if (u.copies) F.gcopy![k] = copiesOf(F, k) - u.copies;
  F.gup = { ...(F.gup || {}), [k]: u.L };
  if (F.gcopy && !F.gcopy[k]) delete F.gcopy[k];
  invalidate(F);
  return true;
}

export function addCopy(g: Game, k: string) {
  const F = g.F!;
  F.gcopy = { ...(F.gcopy || {}), [k]: copiesOf(F, k) + 1 };
}
/** Salvages one copy. Returns the coins. */
export function salvageCopy(g: Game, k: string): number {
  const F = g.F!;
  if (!copiesOf(F, k)) return 0;
  F.gcopy![k]!--;
  if (!F.gcopy![k]) delete F.gcopy![k];
  const c = copyValue(GEARK[k]!);
  addCoins(g, c);
  return c;
}
/** A piece leaves for good (sold or salvaged): its level goes, its copies are salvaged too. Returns their coins. */
export function forgetPiece(g: Game, k: string): number {
  const F = g.F!;
  let c = 0;
  while (copiesOf(F, k)) c += salvageCopy(g, k);
  if (F.gup && F.gup[k]) {
    delete F.gup[k];
    invalidate(F);
  }
  return c;
}

/** A bonus copy of a piece you are wearing, a quarter of the time a gear drop lands (null otherwise). */
export function bonusCopy(g: Game): Gear | null {
  const F = g.F!;
  const worn = Object.values(F.gear || {}).filter((k): k is string => !!k && !!GEARK[k]);
  if (!BALANCE.gearUpgrades || !worn.length || g.rng() >= 0.25) return null;
  const k = worn[Math.floor(g.rng() * worn.length)]!;
  addCopy(g, k);
  return GEARK[k]!;
}
