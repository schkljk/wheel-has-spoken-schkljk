import { LEGACY } from '../data/content/progression';
import { TIER_LVL, TIER_PTS, TNODE, branchPts, gearOf, synOf, talMap, talRank, type TalentNode } from '../stats';
import type { Fighter, TraitFx } from '../types';
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
/**
 * Everything else that gets this fighter back up once a fight (review K6): their picks, gear, synergies and other
 * talents. Only one revive counts a fight, so a revive talent on top of these is wasted.
 */
export function reviveSources(f: Fighter, exceptTalent?: string): string[] {
  const out: string[] = [];
  const has = (x: { fx?: TraitFx } | undefined | null) => !!(x && x.fx && x.fx.revive);
  for (const k of ['race', 'rsub', 'arch', 'asub', 'stance', 'back', 'reinc', 'quirk', 'title', 'side'] as const) {
    const it = f[k] as { n: string; fx?: TraitFx } | undefined;
    if (has(it)) out.push(it!.n);
  }
  if (f.arch?.k === 'necro') out.push(f.arch.n);
  if (f.chaos?.k === 'plot') out.push(f.chaos.n);
  if (f.power?.k === 'miracle') out.push(f.power.n);
  for (const g of gearOf(f)) if (has(g)) out.push(g.n);
  for (const s of synOf(f)) if (has(s) && !s.hidden) out.push(s.n);
  for (const [key, r] of Object.entries(talMap(f))) if (r && key !== exceptTalent && TNODE[key]?.eff.fx?.revive) out.push(TNODE[key]!.n);
  return [...new Set(out)];
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

/**
 * Takes back the rank just bought (the 3-second Undo) and refunds its point. Only for the latest rank: that puts
 * the tree back exactly as it was, so every requirement still holds.
 */
export function unrankTalent(g: Game, key: string): boolean {
  const F = g.F!;
  const m = talMap(F);
  if (!TNODE[key] || !m[key]) return false;
  m[key]!--;
  if (!m[key]) delete m[key];
  F.talents = m;
  F.tp = (F.tp || 0) + 1;
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
