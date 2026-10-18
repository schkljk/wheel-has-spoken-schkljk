import { ARCHS, CHAOS, ENCHANTS, POWER_ALL, QUIRKS, RACES, RSUB, ASUB, SIDEKICKS, SIZES, STANCES, BACKS, TITLES, WEAKS, WEAPONS } from '../data/wheels';
import { ARCH_KIT, RACE_KIT } from '../data/kits';
import { ARENAS } from '../data/arenas';
import { BALANCE } from '../data/balance';
import { SYN_SETS } from '../data/content/gear-sets';
import { gearPool } from '../stats';
import { SYN } from '../data/synergies';
import { SYN_HIDDEN } from '../data/content/hidden-synergies';
import { ACHIEVEMENTS } from '../data/content/progression';
import { CONTRACTS, TIERS_T } from '../data/content/economy';
import { ITEMS } from '../data/content/story';
import type { Fighter } from '../types';

const by = <T, K extends string>(list: readonly T[], key: (t: T) => K) => Object.fromEntries(list.map((x) => [key(x), x])) as Record<string, T>;

export const ARCHK = by(ARCHS, (a) => a.k);
export const ACHK = by(ACHIEVEMENTS, (a) => a.k);
export const CONTRACTK = by(CONTRACTS, (c) => c.k);
export const TIERK = by(TIERS_T, (t) => t.k);
export const ITEMK = by(ITEMS, (i) => i.k);

/** Wheels whose results go into the collection (legacy CX_CATS). */
export const CX_CATS = new Set(['race', 'rsub', 'arch', 'asub', 'stance', 'size', 'back', 'weapon', 'power', 'ench', 'weak', 'chaos', 'quirk', 'title', 'side']);

/** Collection key of a landed slice: sub-wheel results are filed under their parent. */
export function cxKey(k: string, it: { n: string }, f: Partial<Fighter>): string {
  if (k === 'rsub') return (f.race ? f.race.n : '?') + '/' + it.n;
  if (k === 'asub') return (f.arch ? f.arch.k : '?') + '/' + it.n;
  return it.n;
}

export interface CodexEntry {
  it: { n: string; e?: string; q?: number; d?: string };
  key: string;
  /** the parent a sub-race, specialty or move belongs to */
  par?: string;
}
const plain = (list: readonly { n: string; e?: string; q?: number; d?: string }[]) => () => list.map((it) => ({ it, key: it.n }));

/** Every collection category, in the legacy order (sidekicks before titles, moves last). */
export const CODEX: [k: string, label: string, list: () => CodexEntry[]][] = [
  ['race', 'Races', plain(RACES)],
  ['rsub', 'Sub-races and bloodlines', () => Object.entries(RSUB).flatMap(([r, s]) => s.items.map((it) => ({ it, key: r + '/' + it.n, par: r })))],
  ['arch', 'Archetypes', plain(ARCHS)],
  ['asub', 'Specialties', () => Object.entries(ASUB).flatMap(([k, s]) => s.items.map((it) => ({ it, key: k + '/' + it.n, par: ARCHK[k]!.n })))],
  ['stance', 'Fighting stances', plain(STANCES)],
  ['size', 'Sizes', plain(SIZES)],
  ['back', 'Backstories', plain(BACKS)],
  ['weapon', 'Weapons', plain(WEAPONS)],
  ['power', 'Powers', plain(POWER_ALL)],
  ['ench', 'Enchantments', plain(ENCHANTS)],
  ['weak', 'Weaknesses', plain(WEAKS)],
  ['chaos', 'Chaos factors', plain(CHAOS)],
  ['quirk', 'Quirks', plain(QUIRKS)],
  ['side', 'Sidekicks', plain(SIDEKICKS)],
  ['title', 'Titles', plain(TITLES)],
  ['syn', 'Synergies', () => plain([...SYN, ...SYN_HIDDEN, ...(BALANCE.moreSets ? SYN_SETS : [])])()],
  ['arena', 'Arenas', plain(ARENAS)],
  ['gear', 'Gear', () => plain(gearPool())()],
  ['ach', 'Achievements', plain(ACHIEVEMENTS)],
  [
    'moves',
    'Moves',
    () => [
      ...Object.entries(ARCH_KIT).flatMap(([k, ms]) => ms.map((m) => ({ it: { q: 3, ...m }, key: 'mv/' + m.n, par: ARCHK[k] ? ARCHK[k].n : k }))),
      ...Object.entries(RACE_KIT).map(([r, m]) => ({ it: { q: 2, ...m }, key: 'mv/' + m.n, par: r })),
    ],
  ],
];

/** What a fighter looks like: everything the sprite generator reads. Stored in records too. */
export interface Look {
  name?: string;
  race?: string;
  rsub?: string;
  arch?: string;
  size?: string;
  weapon?: string;
  power?: string;
  ench?: string;
}
export function lookOf(f: Partial<Fighter>): Look {
  return {
    name: f.name,
    race: f.race && f.race.n,
    rsub: f.rsub && f.rsub.n,
    arch: f.arch && f.arch.k,
    size: f.size && f.size.n,
    weapon: f.weapon && f.weapon.n,
    power: f.power && f.power.k,
    ench: f.ench && f.ench.k,
  };
}
