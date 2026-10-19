import { COSMETICS, type Cosmetic, type CosmeticKind } from '../data/content/cosmetics';
import type { Game } from './game';

/** Earned cosmetics (review F11): bought with gems, worn on wheels, wins and names. None of them do anything in a fight. */
interface CosState {
  own: string[];
  on: Partial<Record<CosmeticKind, string>>;
}
const state = (g: Game) => (g.save.profile.extra.cos ??= { own: [], on: {} }) as unknown as CosState;
export const cosmeticOf = (k: string | undefined | null): Cosmetic | null => (k ? (COSMETICS.find((c) => c.k === k) ?? null) : null);
export const owns = (g: Game, k: string) => state(g).own.includes(k);
/** What is worn, by kind. */
export const worn = (g: Game, kind: CosmeticKind): Cosmetic | null => cosmeticOf(state(g).on[kind]);

/** Buys a cosmetic with gems (and wears it). False if it can't be paid or is already owned. */
export function buyCosmetic(g: Game, k: string): boolean {
  const c = cosmeticOf(k);
  const p = g.save.profile;
  if (!c || owns(g, k) || (p.gems || 0) < c.gems) return false;
  p.gems -= c.gems;
  state(g).own.push(k);
  state(g).on[c.kind] = k;
  return true;
}
/** Wears an owned cosmetic, or takes that kind off (null). */
export function wearCosmetic(g: Game, kind: CosmeticKind, k: string | null) {
  const s = state(g);
  if (k == null) delete s.on[kind];
  else if (owns(g, k) && cosmeticOf(k)?.kind === kind) s.on[kind] = k;
}
