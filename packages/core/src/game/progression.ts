import { LEGACY } from '../data/content/progression';
import { TIER_LVL, TIER_PTS, TNODE, branchPts, talMap, talRank, type TalentNode } from '../stats';
import { lgLvl } from '../save/career';
import type { CareerFighter } from '../save/fighter';
import type { Game } from './game';
import { invalidate } from './career';

// ---------------------------------------------------------------- talents
/** A talent can take another rank: a point to spend, the level for its tier and enough points in its branch. */
export function canRank(f: CareerFighter | null, n: TalentNode) {
  if (!f) return false;
  const r = talRank(f, n.key);
  return r < n.max && (f.tp || 0) >= 1 && (f.lvl || 1) >= TIER_LVL(n.tier) && branchPts(f, n.br) >= TIER_PTS(n.tier);
}
/** Spends a point on a talent. Old saves' talent lists become a rank map first. */
export function rankTalent(g: Game, key: string): boolean {
  const F = g.F!;
  const n = TNODE[key];
  if (!n || !canRank(F, n)) return false;
  const m = talMap(F);
  m[key] = (m[key] || 0) + 1;
  F.talents = m;
  F.tp = (F.tp || 0) - 1;
  invalidate(F);
  return true;
}

// ---------------------------------------------------------------- legacy perks
export const legacyCost = (g: Game, k: string) => {
  const p = LEGACY.find((x) => x.k === k)!;
  const lv = lgLvl(g.save.profile, k);
  return lv >= p.max ? null : p.cost[lv]!;
};
/** Buys the next level of a legacy perk with legacy points. */
export function buyLegacy(g: Game, k: string): boolean {
  const cost = legacyCost(g, k);
  const L = g.save.profile.legacy;
  if (cost == null || L.pts < cost) return false;
  L.pts -= cost;
  L.perks[k] = lgLvl(g.save.profile, k) + 1;
  return true;
}
