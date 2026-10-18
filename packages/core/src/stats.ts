import { GEAR } from './data/gear';
import { INJURIES } from './data/misc';
import { SYN } from './data/synergies';
import { PERSONALITIES, type Personality, type PersonalityKey } from './data/content/personality';
import { BALANCE, GROWTH_TUNE, SOFT_CAP, soft } from './data/balance';
import { SYN_HIDDEN } from './data/content/hidden-synergies';
import { OLD_TAL, TREE, type TalentEffect } from './data/talents';
import { POWER_SCALE } from './data/misc';
import { clamp } from './random';
import { SYN_TESTS } from './synergy-tests';
import type { Fighter, Gear, GearSlot, Pet, StatKey, StatMods, Stats, Synergy, TalentMap, TraitFx } from './types';

/** Outside state the rules read: balance patches and past champions (both come from the save). */
export interface GameContext {
  /** stat patches per race name and per archetype key */
  patch?: { race?: Record<string, StatMods>; arch?: Record<string, StatMods> };
  /** past champions and the last tournament's top three feed the reincarnation wheel */
  history?: { champs?: HistoryEntry[]; lastTop?: HistoryEntry[] };
}
export interface HistoryEntry {
  n: string;
  best?: StatKey;
  look?: unknown;
  place?: number;
}

export const GEARK: Record<string, Gear> = Object.fromEntries(GEAR.map((g) => [g.k, g]));
export const INJK = Object.fromEntries(INJURIES.map((j) => [j.k, j]));

export const STATLBL: Record<string, string> = {
  str: 'strength',
  spd: 'speed',
  dur: 'durability',
  iq: 'IQ',
  wm: 'weapon mastery',
  pm: 'power mastery',
};
export const ALL = (n: number): StatMods => ({ str: n, spd: n, dur: n, iq: n, wm: n, pm: n });

// ---------- gear ----------
/**
 * What each upgrade level of a piece adds (upgrade 21), by slot: armor and helmets take hits better, boots and
 * capes get out of the way, gloves and trinkets find weak spots. Small on purpose: whole stat points were worth
 * a level or more per piece (PROGRESS.md has the numbers).
 */
export const UPGRADE_FX: Record<GearSlot, [k: 'dr' | 'dodgeB' | 'critB', per: number, word: string]> = {
  armor: ['dr', 0.02, 'damage reduction'],
  helm: ['dr', 0.01, 'damage reduction'],
  boots: ['dodgeB', 0.01, 'dodge'],
  cape: ['dodgeB', 0.01, 'dodge'],
  gloves: ['critB', 0.01, 'crit'],
  trinket: ['critB', 0.01, 'crit'],
};
const UPG_CACHE = new Map<string, Gear>();
/** A piece at an upgrade level, with the bonus folded into its traits. */
export function upgraded(g: Gear, L: number): Gear {
  if (!L) return g;
  const id = `${g.k}+${L}`;
  let u = UPG_CACHE.get(id);
  if (!u) {
    const [k, per] = UPGRADE_FX[g.slot];
    u = { ...g, fx: { ...(g.fx || {}), [k]: (((g.fx || {}) as Record<string, number>)[k] || 0) + per * L } };
    UPG_CACHE.set(id, u);
  }
  return u;
}
export function gearOf(f: Fighter | null | undefined): Gear[] {
  if (!f || !f.gear) return [];
  const out: Gear[] = [];
  const up = BALANCE.gearUpgrades && f.gup;
  for (const s of ['armor', 'trinket', 'boots', 'helm', 'gloves', 'cape'] as const) {
    const g = GEARK[f.gear[s] ?? ''];
    if (g) out.push(up && up[g.k] ? upgraded(g, up[g.k]!) : g);
  }
  return out;
}
export const setCount = (f: Fighter, set: string) => gearOf(f).filter((g) => g.set === set).length;

// ---------- talents ----------
export interface TalentNode {
  key: string;
  br: string;
  k: string;
  n: string;
  e: string;
  max: number;
  eff: TalentEffect;
  d: string;
  tier: number;
}
export const TNODE: Record<string, TalentNode> = {};
for (const br of TREE)
  br.t.forEach((x, i) => {
    const key = `${br.k}_${x[0]}`;
    TNODE[key] = { key, br: br.k, k: x[0], n: x[1], e: x[2], max: x[3], eff: x[4], d: x[5], tier: Math.floor(i / 2) + 1 };
  });
/** Level needed for a talent tier, and points needed in that branch. */
export const TIER_LVL = (t: number) => 3 * (t - 1) + 1;
export const TIER_PTS = (t: number) => 2 * (t - 1);

/** Talent ranks by node key. Very old saves stored an array of old talent keys: it becomes a map (in place, as in legacy). */
export function talMap(f: Fighter | null | undefined): TalentMap {
  if (!f) return {};
  if (Array.isArray(f.talents)) {
    const m: TalentMap = {};
    for (const k of f.talents) {
      const n = OLD_TAL[k];
      if (n) m[n] = (m[n] || 0) + 1;
    }
    f.talents = m;
  }
  return f.talents || {};
}
export const talRank = (f: Fighter, key: string) => talMap(f)[key] || 0;
export function talEcon(f: Fighter, kind: string) {
  let r = 0;
  for (const [key, rank] of Object.entries(talMap(f))) {
    const n = TNODE[key];
    if (n && n.eff.econ === kind) r += rank;
  }
  return r;
}
export function branchPts(f: Fighter, br: string) {
  let s = 0;
  for (const [key, rank] of Object.entries(talMap(f))) if (key.startsWith(br + '_')) s += rank;
  return s;
}

// trait keys by how they stack
export const T_ADD = ['rizz', 'regen', 'venom', 'critB', 'dodgeB', 'dr', 'drain', 'extra', 'wlvl', 'guardEn', 'readB', 'counterB', 'guardAdd', 'bluntDR', 'enRegen', 'startEn'] as const;
export const T_MUL = ['dmgX', 'strikeX', 'ultX', 'darkX', 'behindX', 'clutchX'] as const;
export const T_MAX = ['rage', 'revive', 'snack'] as const;
export const T_BOOL = ['unholy', 'immune', 'firstStrike', 'taunt'] as const;
const isMul = (k: string) => (T_MUL as readonly string[]).includes(k);
const isAdd = (k: string) => (T_ADD as readonly string[]).includes(k);

/** A talent's effect scaled by its rank: additive traits multiply, multipliers compound. */
export function talentsOf(f: Fighter | null | undefined): { m?: StatMods; fx?: TraitFx }[] {
  const out: { m?: StatMods; fx?: TraitFx }[] = [];
  for (const [key, rank] of Object.entries(talMap(f))) {
    const n = TNODE[key];
    if (!n || !rank) continue;
    const e = n.eff;
    const o: { m?: StatMods; fx?: TraitFx } = {};
    if (e.m) {
      o.m = {};
      for (const k in e.m) o.m[k as StatKey] = e.m[k as StatKey]! * rank;
    }
    if (e.fx) {
      const fx: Record<string, unknown> = {};
      for (const k in e.fx) {
        const v = (e.fx as Record<string, unknown>)[k];
        if (isMul(k)) fx[k] = Math.pow(v as number, rank);
        else if (isAdd(k)) fx[k] = (v as number) * rank;
        else fx[k] = v;
      }
      o.fx = fx as TraitFx;
    }
    out.push(o);
  }
  return out;
}

// ---------- synergies ----------
export function synOf(f: Fighter): Synergy[] {
  const out = SYN.filter((s) => {
    try {
      return !!SYN_TESTS[s.k]?.(f);
    } catch {
      return false;
    }
  });
  if (BALANCE.jokeSynergies) for (const s of SYN_HIDDEN) if (s.test(f)) out.push(s);
  return out;
}

// ---------- effective stats ----------
/** Where stat modifiers come from, in the legacy order. */
export const MOD_SRC = ['race', 'rsub', 'arch', 'asub', 'stance', 'size', 'back', 'reinc', 'weak', 'quirk', 'title', 'side', 'lfx'] as const;

/** Effective stats (1..20) after every modifier: picks, bonuses, synergies, gear, talents, patches, injuries. */
export function eff(f: Fighter, ctx: GameContext = {}): Stats {
  const s: Stats = { str: f.str.v, spd: f.spd.v, dur: f.dur.v, iq: f.iq.v, wm: f.wm.v, pm: f.pm.v, cha: (f.cha && f.cha.v) || 5 };
  const mods: (StatMods | undefined)[] = MOD_SRC.map((k) => (f[k] as { m?: StatMods } | undefined)?.m);
  mods.push(f.bonus);
  for (const x of synOf(f)) mods.push(x.m);
  for (const g of gearOf(f)) mods.push(g.m);
  for (const t of talentsOf(f)) mods.push(t.m);
  const pr = f.race && ctx.patch?.race?.[f.race.n];
  if (pr) mods.push(pr);
  const pa = f.arch && ctx.patch?.arch?.[f.arch.k];
  if (pa) mods.push(pa);
  if (f.inj)
    for (const j of f.inj) {
      const d = INJK[j.k];
      if (d) mods.push(d.m);
    }
  for (const m of mods) {
    if (!m) continue;
    for (const k in m) if (k in s) s[k as StatKey] += m[k as StatKey]!;
  }
  for (const k in s) s[k as StatKey] = clamp(s[k as StatKey], 1, 20);
  return s;
}

// ---------- traits ----------
export interface Traits {
  pets: Pet[];
  guardX: number;
  rageAt: number | null;
  breath: string | null;
  rizz: number; regen: number; venom: number; critB: number; dodgeB: number; dr: number; drain: number; extra: number;
  wlvl: number; guardEn: number; readB: number; counterB: number; guardAdd: number; bluntDR: number; enRegen: number; startEn: number;
  dmgX: number; strikeX: number; ultX: number; darkX: number; behindX: number; clutchX: number;
  rage: number; revive: number; snack: number;
  unholy: boolean; immune: boolean; firstStrike: boolean; taunt: boolean;
}

function freshTraits(): Traits {
  const t = { pets: [], guardX: 0.4, rageAt: null, breath: null } as unknown as Record<string, unknown>;
  for (const k of T_ADD) t[k] = 0;
  for (const k of T_MUL) t[k] = 1;
  for (const k of T_MAX) t[k] = 0;
  for (const k of T_BOOL) t[k] = false;
  return t as unknown as Traits;
}

/** Stacks the four plain trait families from one source. */
function stack(t: Traits, x: TraitFx) {
  for (const a of T_ADD) if (x[a]) t[a] += x[a]!;
  for (const a of T_MUL) if (x[a]) t[a] *= x[a]!;
  for (const a of T_MAX) if (x[a]) t[a] = Math.max(t[a], x[a]!);
  for (const a of T_BOOL) if (x[a]) t[a] = true;
}

/**
 * Traits before synergies. The legacy game built this up in layers (base sources, then new
 * races and classes, then the sidekick) and synergies test it, so the layers and their order
 * are kept exactly: summing the same floats in another order can flip a close fight.
 */
export function traitsBase(f: Fighter): Traits {
  const t = freshTraits();
  const srcs: ({ fx?: TraitFx } | undefined)[] = [f.rsub, f.asub, f.stance, f.back, f.reinc, f.quirk, f.title];
  srcs.push(...gearOf(f), ...talentsOf(f));
  if (f.bossFx) srcs.push({ fx: f.bossFx });
  for (const it of srcs) {
    const x = it && it.fx;
    if (!x) continue;
    stack(t, x);
    if (x.rageAt != null) t.rageAt = x.rageAt;
    if (x.guardX) t.guardX = Math.min(t.guardX, x.guardX);
    if (x.pet) t.pets.push(x.pet);
    if (x.breath) t.breath = x.breath;
  }
  // class and race traits (only the newer classes and races carry them)
  if (f.arch && f.arch.fx) stack(t, f.arch.fx);
  if (f.race && f.race.fx) stack(t, f.race.fx);
  // sidekick
  const sx = f.side && f.side.fx;
  if (sx) {
    stack(t, sx);
    if (sx.pet) t.pets.push(sx.pet);
  }
  return t;
}

/** Everything the fight engine reads about a fighter beyond raw stats. */
export function traitsOf(f: Fighter): Traits {
  const t = traitsBase(f);
  for (const s of synOf(f)) {
    const x = s.fx;
    if (!x) continue;
    stack(t, x);
    if (x.pet) t.pets.push(x.pet);
  }
  // legacy perks only ever add
  const lx = f.lfx && f.lfx.fx;
  if (lx) for (const k of T_ADD) if (lx[k]) t[k] += lx[k]!;
  return t;
}

// ---------- numbers ----------
export const activePower = (f: Fighter) => f.power.k !== 'none' && !f.power.passive;

/** Level scale: 1 at level 1, about +12% per level, shaped by the growth type. */
export function LS(f: Fighter | null | undefined): number {
  const g = (f && f.growth) || ({} as { k?: string; s?: number; g?: number });
  const l = (f && f.lvl) || 1;
  const [s, gr] = (BALANCE.growth && g.k && GROWTH_TUNE[g.k]) || [g.s || 1, g.g || 1];
  return s * (1 + 0.12 * gr * (l - 1));
}

export interface NumStats {
  hp: number;
  atk: number;
  pow: number | null;
  def: number;
  spd: number;
  crit: number;
  dodge: number;
  cha: number;
}

/** The numbers a player sees. They mirror the fight math; level scales them all. */
export function numStats(f: Fighter, ctx: GameContext = {}): NumStats {
  const s = eff(f, ctx);
  const tr = traitsOf(f);
  const ls = LS(f);
  const wl = (f.arch.k === 'brawler' && f.weapon.fists ? 3 : f.weapon.l) + (tr.wlvl || 0);
  const off = 0.6 * s.str + 0.4 * s.wm + 0.5 * wl + (f.ench.l || 0);
  const pw = f.power && f.power.k !== 'none' && !f.power.passive ? 0.75 * s.pm + 0.25 * s.iq + 0.5 * (f.power.l || 0) : null;
  const hpBase = f.maxHp || 100;
  return {
    hp: Math.round(hpBase * ls),
    atk: Math.round(10 * ls * Math.pow(1.17, off - 6)),
    pow: pw == null ? null : Math.round(10 * ls * Math.pow(1.17, pw - 6)),
    def: Math.round(10 * ls * Math.pow(1.17, s.dur - 6) * (1 + (tr.dr || 0))),
    spd: Math.round(4 * s.spd + 2 * ((f.lvl || 1) - 1)),
    crit: Math.round(Math.min(60, soft(0.06 + s.iq * 0.008 + ((s.cha || 5) - 6) * 0.004 + (tr.critB || 0), ...SOFT_CAP.crit) * 100)),
    dodge: Math.round(Math.min(45, soft(0.03 + s.spd * 0.012 + (tr.dodgeB || 0), ...SOFT_CAP.dodge) * 100)),
    cha: Math.round((s.cha || 5) * 5),
  };
}

/** Rough strength rating used for giant-slayer checks. */
export function rate(f: Fighter, ctx: GameContext = {}): number {
  const s = eff(f, ctx);
  return s.str + s.spd + s.dur + 0.5 * s.iq + 0.5 * s.wm + (activePower(f) ? 0.8 * s.pm + f.power.l : 0) + f.weapon.l * 0.6 + (f.ench.l || 0);
}

export function powerScale(f: Fighter, ctx: GameContext = {}) {
  const s = eff(f, ctx);
  const att = Math.max(s.str * 0.6 + s.wm * 0.4, activePower(f) ? s.pm * 0.75 + s.iq * 0.25 : 0);
  const v = clamp(Math.round((att * 1.2 + s.dur + s.spd * 0.4) / 2.6), 1, 20);
  return { v, n: POWER_SCALE[v - 1]! };
}

export function bestStat(f: Fighter, ctx: GameContext = {}): StatKey {
  const s = eff(f, ctx);
  let b: StatKey = 'str';
  for (const k of ['spd', 'dur', 'iq'] as const) if (s[k] > s[b]) b = k;
  return b;
}

export const fullName = (f: Fighter) => f.name + (f.title && f.title.k && f.title.k !== 'none' ? ', ' + f.title.n : '');

/** Quirks that make a fighter play like a gambler. */
const GAMBLER_CHAOS = new Set(['unhinged', 'lucky', 'badluck', 'glitch']);
/**
 * A fighter's AI personality, read off their build: the stance first, then which stats stand out against
 * their own average (strength and speed play aggressive, durability turtle, IQ tactician, power mastery,
 * charisma and chaos quirks gamble). The weights spread random fighters about evenly over the four.
 */
export function personalityOf(f: Fighter, ctx: GameContext = {}): Personality {
  const s = eff(f, ctx);
  const st = f.stance?.k ?? '';
  const base = (s.str + s.spd + s.dur + s.iq + s.wm + s.pm) / 6;
  const stance = (...ks: string[]) => (ks.includes(st) ? 1.5 : 0);
  const score: Record<PersonalityKey, number> = {
    aggressive: (s.str - base + 0.5 * (s.spd - base)) / 6 + stance('aggressive', 'reckless'),
    turtle: (s.dur - base) / 5 - 0.15 + stance('defensive', 'counter'),
    tactician: (s.iq - base) / 4.5 + 0.5 + stance('tactical'),
    gambler: (s.pm - base + 0.5 * ((s.cha || 5) - 7)) / 5.5 + 0.35 + (GAMBLER_CHAOS.has(f.chaos?.k ?? '') ? 1 : 0) + stance('showboat'),
  };
  let best: PersonalityKey = 'aggressive';
  for (const k of ['turtle', 'tactician', 'gambler'] as const) if (score[k] > score[best]) best = k;
  return PERSONALITIES[best];
}
