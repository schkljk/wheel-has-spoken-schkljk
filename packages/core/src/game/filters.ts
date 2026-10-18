import { RARITY, SLOT_N } from '../data/gear';
import type { Gear, GearSlot, RarityKey } from '../types';
import type { CodexEntry } from './lookups';

/**
 * Filters and search for the collection and the armory (Phase 4, upgrade 30). Search is forgiving: any case, no
 * accents needed, every word must match somewhere (name, effect, set, rarity or slot).
 */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
export function matchText(hay: (string | undefined)[], q: string): boolean {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const all = hay.filter(Boolean).map((h) => fold(h!));
  return words.every((w) => all.some((h) => h.includes(w)));
}

export interface GearFilter {
  text?: string;
  rarity?: RarityKey | '';
  slot?: GearSlot | '';
  set?: string;
}
export const gearFilterOn = (f: GearFilter) => !!(f.text?.trim() || f.rarity || f.slot || f.set);
export function filterGear(list: Gear[], f: GearFilter): Gear[] {
  return list.filter(
    (g) =>
      (!f.rarity || g.r === f.rarity) &&
      (!f.slot || g.slot === f.slot) &&
      (!f.set || g.set === f.set) &&
      matchText([g.n, g.d, g.set && `${g.set} set`, RARITY[g.r]?.n, SLOT_N[g.slot]], f.text || ''),
  );
}
/** The sets among some pieces, for a set picker. */
export const setsOf = (list: Gear[]) => [...new Set(list.map((g) => g.set).filter(Boolean) as string[])].sort();

export interface CodexFilter {
  text?: string;
  /** all, only what was found, or only what is still missing */
  show?: 'all' | 'found' | 'missing';
  /** a quality tier, 0 to 3 */
  q?: number | null;
}
export const codexFilterOn = (f: CodexFilter) => !!(f.text?.trim() || (f.show && f.show !== 'all') || f.q != null);
/**
 * Entries of one collection category that pass the filter. Undiscovered entries are "???" in the collection, so
 * a search never matches them by name (that would give them away); it can match their parent, which is shown.
 */
export function filterCodex(list: CodexEntry[], seen: string[], f: CodexFilter): CodexEntry[] {
  const s = new Set(seen);
  return list.filter((x) => {
    const found = s.has(x.key);
    if (f.show === 'found' && !found) return false;
    if (f.show === 'missing' && found) return false;
    if (f.q != null && (x.it.q ?? 1) !== f.q) return false;
    if (!f.text?.trim()) return true;
    return found ? matchText([x.it.n, x.it.d, x.par], f.text) : matchText([x.par], f.text);
  });
}
