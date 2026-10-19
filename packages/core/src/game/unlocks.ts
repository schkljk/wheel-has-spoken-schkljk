import { TIERS_T } from '../data/content/economy';
import { tierUnlocked } from './cups';
import { exhibitionLegends } from './exhibition';
import type { Step } from './fight';
import type { Game } from './game';
import { hardChapters } from './hard';
import { rushOpen, towerOpen } from './modes';
import { trialsOpen } from './trials';

/**
 * Modes and places that open as a fighter goes (review H1): they say so instead of unlocking silently. A
 * fight's result names what it just opened, and each gets a "New" ribbon until it is first opened. The More
 * tab's own features (Locker, Ghost codes) count as new until they are first looked at.
 */
export interface Unlock {
  k: string;
  n: string;
}
/** What the active fighter has open now, by the names the Play tab uses. */
export function unlocked(g: Game): Unlock[] {
  const F = g.F;
  if (!F) return [];
  const list: Unlock[] = [];
  if (trialsOpen(g)) list.push({ k: 'trials', n: 'Wheelborn trials' });
  if (rushOpen(g)) list.push({ k: 'rush', n: 'Boss rush' });
  if (towerOpen(g)) list.push({ k: 'tower', n: 'Endless tower' });
  if (hardChapters(g).length) list.push({ k: 'hard', n: 'Hard mode' });
  if (exhibitionLegends(g).length >= 2) list.push({ k: 'exhibition', n: 'Exhibition' });
  for (const t of TIERS_T) if (tierUnlocked(t, F)) list.push({ k: `tier:${t.k}`, n: t.n });
  return list;
}
/** The More tab's features that are new until first looked at. */
export const MORE_NEW = ['locker', 'ghosts'] as const;

const seenOf = (g: Game) => g.save.profile.extra.seenNew as string[] | undefined;
/**
 * The first look at a save from before the ribbons: whatever is already open counts as seen, so only what
 * opens from now on gets one (the More tab's features still say hello once).
 */
export function ensureSeen(g: Game): boolean {
  if (seenOf(g)) return false;
  g.save.profile.extra.seenNew = unlocked(g).map((u) => u.k);
  return true;
}
/** Is this open and not looked at yet? */
export const isNew = (g: Game, k: string) => {
  const seen = seenOf(g);
  return !!seen && !seen.includes(k) && (MORE_NEW.includes(k as never) || unlocked(g).some((u) => u.k === k));
};
/** It was looked at: its ribbon goes. */
export function seeNew(g: Game, k: string): boolean {
  const seen = seenOf(g);
  if (!seen || seen.includes(k)) return false;
  seen.push(k);
  return true;
}
/** Anything new on the Play tab, and on the More tab (for the tab dots). */
export const newOnPlay = (g: Game) => !!seenOf(g) && unlocked(g).some((u) => isNew(g, u.k));
export const newOnMore = (g: Game) => MORE_NEW.some((k) => isNew(g, k));

/** What opened between two looks. */
export function newlyOpen(before: Unlock[], after: Unlock[]): Unlock[] {
  const had = new Set(before.map((u) => u.k));
  return after.filter((u) => !had.has(u.k));
}
/**
 * A fight's result names what it just opened: a line each ("🔓 Unlocked: Endless tower"), and the chapter
 * card after it lists them too.
 */
export function noteUnlocks(r: { lines: string[]; next: Step[] }, opened: Unlock[]) {
  if (!opened.length) return;
  r.lines.push(...opened.map((u) => `🔓 Unlocked: ${u.n}`));
  const card = r.next.find((s) => s.t === 'celebrate');
  if (card && card.t === 'celebrate') card.sub = `${card.sub.replace(/\.$/, '')}. Unlocked: ${opened.map((u) => u.n).join(', ')}`;
}
