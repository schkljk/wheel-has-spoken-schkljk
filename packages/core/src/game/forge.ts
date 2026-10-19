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
export const upgradeCost = (x: Gear, L: number) => clamp(x.cost, 6, 100) * L;
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
// ---------------------------------------------------------------- upgrades carry over (review K8)
/** The coins a piece's upgrade levels cost, all told. */
export const upgradeWorth = (x: Gear, L: number) => clamp(x.cost, 6, 100) * ((L * (L + 1)) / 2);
/**
 * The level those coins buy on another piece, at most +5. A carry is worth what was paid, so upgrading cheap
 * junk and moving it onto a legendary doesn't skip the legendary's price.
 */
export const levelForWorth = (x: Gear, coins: number) => {
  let L = 0;
  while (L < UPGRADE_MAX && upgradeWorth(x, L + 1) <= coins + 1e-9) L++;
  return L;
};
/** Where a slot's waiting carry is kept, in the upgrade map (coins, not a level: the next piece decides). */
const carryKey = (slot: string) => `@${slot}`;
/**
 * What happens to a piece's upgrades if it leaves now (sold or salvaged), in words, or null: they go to the piece
 * worn in its slot (the one that replaced it), or wait for the next piece worn there.
 */
export function carryPreview(g: Game, k: string): string | null {
  const F = g.F!;
  const L = upgradeLevel(F, k);
  if (!BALANCE.upgradeCarry || !L) return null;
  const x = GEARK[k]!;
  const worn = F.gear?.[x.slot];
  if (worn && worn !== k) {
    const y = GEARK[worn]!;
    const L2 = Math.max(upgradeLevel(F, worn), levelForWorth(y, upgradeWorth(x, L)));
    return L2 > upgradeLevel(F, worn) ? `Its +${L} carries over: your ${y.n} becomes +${L2}.` : `Its +${L} carries over, but your ${y.n} is already +${upgradeLevel(F, worn)}.`;
  }
  return `Its +${L} waits for the next ${x.slot} you wear (worth what you paid for it).`;
}
/** Moves a leaving piece's upgrades on (K8). */
function carryUpgrade(F: Fighter, k: string, L: number) {
  const x = GEARK[k]!;
  const worth = upgradeWorth(x, L);
  const worn = F.gear?.[x.slot];
  F.gup = { ...(F.gup || {}) };
  if (worn && worn !== k) F.gup[worn] = Math.max(F.gup[worn] || 0, levelForWorth(GEARK[worn]!, worth));
  else F.gup[carryKey(x.slot)] = Math.max(F.gup[carryKey(x.slot)] || 0, worth);
}
/** A piece goes on: a carry waiting in its slot lands on it (K8). Call after the piece is worn. */
export function settleCarry(F: Fighter, k: string) {
  const x = GEARK[k];
  const key = x && carryKey(x.slot);
  const worth = key ? F.gup?.[key] : 0;
  if (!x || !worth) return;
  F.gup = { ...(F.gup || {}) };
  delete F.gup[key!];
  F.gup[k] = Math.max(F.gup[k] || 0, levelForWorth(x, worth));
  invalidate(F);
}

/**
 * A piece leaves for good (sold or salvaged): its copies are salvaged too, and its level goes, or with the
 * review's carry (K8) moves to the piece that replaces it in its slot. Returns the copies' coins.
 */
export function forgetPiece(g: Game, k: string): number {
  const F = g.F!;
  let c = 0;
  while (copiesOf(F, k)) c += salvageCopy(g, k);
  if (F.gup && F.gup[k]) {
    const L = F.gup[k]!;
    delete F.gup[k];
    if (BALANCE.upgradeCarry) carryUpgrade(F, k, L);
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
