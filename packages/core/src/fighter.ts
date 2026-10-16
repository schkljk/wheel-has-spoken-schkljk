import {
  ARCHS, ASUB, BACKS, CHA_TIERS, CHAOS, CURED, CURSED, DUR_TIERS, ENCHANTS, GROWTH, HOLY, IQ_TIERS, PM_TIERS, POWERS, QUIRKS, RACES,
  RSUB, SIDEKICKS, SIZES, SKIPPED, SPD_TIERS, SPELLBOOK, STANCES, STR_TIERS, TITLES, WEAKS, WEAPONS, WM_TIERS,
} from './data/wheels';
import { LEVELUP } from './data/misc';
import { pickW } from './random';
import type { Rng } from './rng';
import { ALL, STATLBL, type GameContext } from './stats';
import type { Fighter, Power, WheelItem, WheelKey } from './types';

/** A fighter while it is being built: any subset of picks. */
export type PartialFighter = Partial<Fighter> & { name: string; bonus: Fighter['bonus']; boons: Fighter['boons'] };
/**
 * Any wheel slice, including stat tiers (which have no emoji). Legacy reuses two field names:
 * `v` is a tier number on stats but an attack verb on weapons and powers, and `skip` marks a
 * skipped wheel on tiers but is a turn-skip chance on weaknesses.
 */
export type Slice = Omit<WheelItem, 'e'> & { e?: string; v?: number | string; lab?: string; skip?: boolean | number };
const tierV = (it: Slice) => it.v as number;

export interface Wheel {
  k: WheelKey;
  label: string | ((f: PartialFighter) => string);
  /** lower-case label for odds-shift reasons */
  lc: string;
  items: readonly Slice[] | ((f: PartialFighter, ctx: GameContext) => readonly Slice[]);
  /** a stat tier wheel (1..14) */
  tier?: boolean;
  /** the wheel only appears when this holds */
  cond?: (f: PartialFighter) => boolean;
  /** the pick this wheel hangs off, for the UI */
  from?: (f: PartialFighter) => WheelItem | null | undefined;
  /** the wheel lands on SKIPPED without spinning */
  skipIf?: (f: PartialFighter) => boolean;
}

export function powerPool(f: PartialFighter): { label: string; items: Power[] } {
  const a = f.arch && f.arch.k;
  if (a === 'paladin') return { label: 'Holy powers', items: HOLY };
  if (a === 'necro') return { label: 'Cursed powers', items: CURSED };
  if (a === 'mage') return { label: 'Spellbook', items: SPELLBOOK };
  return { label: 'Power', items: POWERS };
}

/** The reincarnation wheel: your past champions, the last tournament's top three, and two fillers. */
export function reincItems(ctx: GameContext): WheelItem[] {
  const out: WheelItem[] = [];
  const seen = new Set<string>();
  for (const c of ctx.history?.champs ?? []) {
    if (!c || !c.n || seen.has(c.n)) continue;
    seen.add(c.n);
    const b = c.best || 'str';
    const m = ALL(1);
    m[b] = (m[b] ?? 0) + 2;
    out.push({ n: c.n, e: '🏆', w: 3, q: 3, m, look: c.look, d: `Your past champion. +3 ${STATLBL[b]}, +1 to everything` } as WheelItem);
    if (out.length >= 6) break;
  }
  for (const c of ctx.history?.lastTop ?? []) {
    if (!c || !c.n || seen.has(c.n)) continue;
    seen.add(c.n);
    const b = c.best || 'str';
    const top = c.place === 1;
    const m = top ? ALL(1) : {};
    m[b] = (m[b] || 0) + 2;
    out.push({
      n: c.n,
      e: top ? '🏆' : c.place === 2 ? '🥈' : '🥉',
      w: top ? 2.5 : c.place === 2 ? 2 : 1.5,
      q: top ? 3 : 2,
      m,
      look: c.look,
      d: `${top ? 'Won' : c.place === 2 ? 'Reached the final of' : 'Made the semis of'} the last tournament. +2 ${STATLBL[b]}`,
    } as WheelItem);
  }
  out.push({ n: 'A forgotten hero', e: '🗿', w: 2, q: 2, m: ALL(1), d: 'Nobody remembers them. +1 to everything' });
  out.push({ n: 'Some random nobody', e: '🫥', w: 3, q: 0, d: 'Reincarnated as nobody in particular' });
  return out;
}

/** The 24 build wheels in spin order. */
export const WHEELS: Wheel[] = [
  { k: 'race', label: 'Race', lc: 'race', items: RACES },
  {
    k: 'rsub',
    label: (f) => RSUB[f.race!.n]!.label,
    lc: 'sub-race',
    items: (f) => RSUB[f.race!.n]!.items,
    cond: (f) => !!(f.race && RSUB[f.race.n]),
    from: (f) => f.race,
  },
  { k: 'arch', label: 'Archetype', lc: 'archetype', items: ARCHS },
  {
    k: 'asub',
    label: (f) => ASUB[f.arch!.k]!.label,
    lc: 'specialty',
    items: (f) => ASUB[f.arch!.k]!.items,
    cond: (f) => !!(f.arch && ASUB[f.arch.k]),
    from: (f) => f.arch,
  },
  { k: 'stance', label: 'Fighting stance', lc: 'fighting stance', items: STANCES },
  { k: 'size', label: 'Size', lc: 'size', items: SIZES },
  { k: 'back', label: 'Backstory', lc: 'backstory', items: BACKS },
  {
    k: 'reinc',
    label: 'Reincarnation',
    lc: 'reincarnation',
    items: (_f, ctx) => reincItems(ctx),
    cond: (f) => !!(f.back && f.back.k === 'reinc'),
    from: (f) => f.back,
  },
  { k: 'str', label: 'Strength', lc: 'strength', items: STR_TIERS, tier: true },
  { k: 'spd', label: 'Speed', lc: 'speed', items: SPD_TIERS, tier: true },
  { k: 'dur', label: 'Durability', lc: 'durability', items: DUR_TIERS, tier: true },
  { k: 'iq', label: 'IQ', lc: 'IQ', items: IQ_TIERS, tier: true },
  { k: 'cha', label: 'Charisma', lc: 'charisma', items: CHA_TIERS, tier: true },
  { k: 'growth', label: 'Growth', lc: 'growth', items: GROWTH },
  { k: 'weapon', label: 'Weapon', lc: 'weapon', items: WEAPONS },
  { k: 'wm', label: 'Weapon mastery', lc: 'weapon mastery', items: WM_TIERS, tier: true },
  {
    k: 'power',
    label: (f) => powerPool(f).label,
    lc: 'power',
    items: (f) => powerPool(f).items,
    from: (f) => (f.arch && ['paladin', 'necro', 'mage'].includes(f.arch.k) ? f.arch : null),
  },
  {
    k: 'pm',
    label: 'Power mastery',
    lc: 'power mastery',
    items: PM_TIERS,
    tier: true,
    skipIf: (f) => !!f.power && f.power.k === 'none',
  },
  { k: 'ench', label: 'Enchantment', lc: 'enchantment', items: ENCHANTS },
  { k: 'weak', label: 'Weakness', lc: 'weakness', items: WEAKS },
  { k: 'chaos', label: 'Chaos factor', lc: 'chaos factor', items: CHAOS },
  { k: 'quirk', label: 'Quirk', lc: 'quirk', items: QUIRKS },
  { k: 'side', label: 'Sidekick', lc: 'sidekick', items: SIDEKICKS },
  { k: 'title', label: 'Title', lc: 'title', items: TITLES },
];
export const WHEEL = Object.fromEntries(WHEELS.map((w) => [w.k, w])) as Record<WheelKey, Wheel>;

export const labelOf = (W: Wheel, f: PartialFighter) => (typeof W.label === 'function' ? W.label(f) : W.label);
export const itemsOf = (W: Wheel, f: PartialFighter, ctx: GameContext = {}) => (typeof W.items === 'function' ? W.items(f, ctx) : W.items);

/** The picks a fighter has landed so far, in wheel order. */
export function spunItems(f: PartialFighter): Slice[] {
  const out: Slice[] = [];
  for (const W of WHEELS) {
    const v = f[W.k] as Slice | undefined;
    // note: this also leaves out weaknesses with a turn-skip chance, as the legacy game did
    if (v && !v.skip) out.push(v);
  }
  return out;
}

export interface OddsReason {
  cls: 'off' | 'up' | 'down';
  txt: string;
}
export interface OddsEntry {
  it: Slice;
  w: number;
  mult: number;
}

/** A wheel's slices with their odds after earlier picks shifted them, and why. */
export function oddsFor(W: Wheel, f: PartialFighter, ctx: GameContext = {}): { list: OddsEntry[]; reasons: OddsReason[] } {
  const list: OddsEntry[] = itemsOf(W, f, ctx).map((it) => ({ it, w: it.w, mult: 1 }));
  const reasons: OddsReason[] = [];
  for (const src of spunItems(f)) {
    if (!src.o) continue;
    const who = `${src.e ? src.e + ' ' : ''}${src.n}${src.lab ? ' ' + src.lab : ''}`;
    for (const o of src.o) {
      if (o.w !== W.k) continue;
      if (o.n) {
        const names = o.n;
        const x = o.x!;
        let hit = false;
        for (const e of list)
          if (names.includes(e.it.n)) {
            e.mult *= x;
            hit = true;
          }
        if (hit)
          reasons.push({
            cls: x === 0 ? 'off' : x > 1 ? 'up' : 'down',
            txt: `${who}: ${x === 0 ? 'no ' + names.join(', ') : names.join(', ') + ' ×' + x}`,
          });
      } else if (o.s && W.tier) {
        const s = o.s;
        for (const e of list) e.mult *= Math.pow(1.35, (s * (tierV(e.it) - 5.5)) / 2.5);
        reasons.push({ cls: s > 0 ? 'up' : 'down', txt: `${who}: ${s > 0 ? 'higher' : 'lower'} ${W.lc}` });
      }
    }
  }
  for (const e of list) e.w = e.it.w * e.mult;
  return { list: list.filter((e) => e.w > 1e-6), reasons };
}

const RESIL: readonly string[] = ['str', 'spd', 'dur', 'iq'];

/** Spins every wheel for a brand-new fighter. */
export function randomFighter(name: string, rng: Rng, ctx: GameContext = {}): Fighter {
  const f: PartialFighter = { name, bonus: {}, boons: [] };
  const set = f as Record<string, unknown>;
  for (const W of WHEELS) {
    if (W.cond && !W.cond(f)) continue;
    if (W.skipIf && W.skipIf(f)) {
      set[W.k] = SKIPPED;
      continue;
    }
    const od = oddsFor(W, f, ctx);
    let it = od.list[pickW(rng, od.list)]!.it;
    // resilient fighters respin any stat that lands below peak human
    if (f.arch && f.arch.k === 'resilient' && RESIL.includes(W.k)) {
      let n = 0;
      while (tierV(it) < 4 && n++ < 8) it = od.list[pickW(rng, od.list)]!.it;
    }
    set[W.k] = it;
  }
  return f as Fighter;
}

const BONUS_KEYS = ['str', 'spd', 'dur', 'iq', 'wm', 'pm'] as const;

/** Applies a bonus, level-up or event boon to a fighter (mutates it). */
export function applyBonus(f: Fighter, it: Fighter['boons'][number]): void {
  f.boons.push(it);
  const add = (k: (typeof BONUS_KEYS)[number], n: number) => {
    f.bonus[k] = (f.bonus[k] || 0) + n;
  };
  if ((BONUS_KEYS as readonly string[]).includes(it.k)) add(it.k as (typeof BONUS_KEYS)[number], 1);
  else if (it.k === 'str2') add('str', 2);
  else if (it.k === 'dur2') add('dur', 2);
  else if (it.k === 'all') BONUS_KEYS.forEach((k) => add(k, 2));
  else if (it.k === 'all1') BONUS_KEYS.forEach((k) => add(k, 1));
  else if (it.k === 'curse') BONUS_KEYS.forEach((k) => add(k, -1));
  else if (it.k === 'relic') {
    add('str', 2);
    add('iq', -2);
  } else if (it.k === 'cure') f.weak = CURED;
}

/** Rolls n level-up boons (no respins) and raises the level. */
export function levelUp(f: Fighter, n: number, rng: Rng): void {
  const pool = LEVELUP.filter((x) => !x.respin);
  for (let i = 0; i < n; i++) applyBonus(f, pool[pickW(rng, pool)]!);
  f.lvl = (f.lvl || 1) + n;
}
