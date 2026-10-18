import { DAILY, EVENTS, MUTATORS } from '../data/misc';
import { GEAR, GEM_PRICE, RARITY } from '../data/gear';
import { ITEMS } from '../data/content/story';
import { BASIC, LOOT_SLICES } from '../data/content/economy';
import { applyBonus } from '../fighter';
import { clamp, pick, pickW } from '../random';
import { eff, gearOf, talEcon } from '../stats';
import { lgLvl } from '../save/career';
import type { CareerFighter, Json } from '../save/fighter';
import type { Gear, RarityKey } from '../types';
import { addCoins, coinsOf, ctxOf, spend, type Game } from './game';
import { addInjury, gainXP, injText, invalidate, markSeen, priceOf, syncArmory, talentPoints, track, STATN } from './career';
import { GEARK } from '../stats';
import { ITEMK } from './lookups';
import { storyEnsure, type Story } from './story';
import { addCopy, bonusCopy, forgetPiece } from './forge';
import { BALANCE } from '../data/balance';

export interface WheelEntry<T> {
  it: T;
  w: number;
  mult: number;
}
export interface OddsNote {
  cls: 'up' | 'down' | 'x';
  txt: string;
}

// ---------------------------------------------------------------- loot
export interface LootSlice {
  n: string;
  e: string;
  q: number;
  d: string;
  rar?: string;
  coins?: number;
  item?: 1;
}
export type LootTable = 'normal' | 'elite' | 'boss' | 'treasure';

/** The loot wheel: a rarity, coins or supplies. Better tables and later chapters shift it up. */
export function lootList(g: Game, table: LootTable): WheelEntry<LootSlice>[] {
  const F = g.F!;
  const S = storyEnsure(g);
  const c = S.ch + (S.ng || 0);
  const boost = (F.lootBoost ? 1.7 : 1) * (1 + 0.15 * talEcon(F, 'loot') + 0.15 * lgLvl(g.save.profile, 'bloodline'));
  const RW = (
    {
      normal: { junk: 1.6, common: 3, rare: 1.2, epic: 0.35, legendary: 0.06 + 0.02 * c, mythic: 0 },
      elite: { junk: 0.6, common: 1.6, rare: 2, epic: 0.9, legendary: 0.18 + 0.05 * c, mythic: 0.02 * c },
      boss: { junk: 0, common: 0.4, rare: 1.4, epic: 1.6, legendary: 0.7 + 0.25 * c, mythic: 0.07 * c },
      treasure: { junk: 0.8, common: 1.6, rare: 1.8, epic: 0.8, legendary: 0.18 + 0.05 * c, mythic: 0.025 * c },
    } as Record<string, Record<string, number>>
  )[table] || { junk: 1, common: 2, rare: 1, epic: 0.3, legendary: 0.05, mythic: 0 };
  const list: WheelEntry<LootSlice>[] = [];
  for (const [rs, n, e] of LOOT_SLICES) {
    const r = rs as RarityKey;
    const w = RW[r]! * (['epic', 'legendary', 'mythic'].includes(r) ? boost : 1);
    if (w > 0) list.push({ it: { n, e, q: RARITY[r]!.q, rar: r, d: `A random ${RARITY[r]!.n.toLowerCase()} piece of armor, trinket or boots` }, w, mult: 1 });
  }
  list.push({ it: { n: 'Coin pouch', e: '💰', q: 1, coins: 6 + c * 2, d: 'Coins' }, w: table === 'boss' ? 0.6 : 1.4, mult: 1 });
  list.push({ it: { n: 'Supplies', e: '🎒', q: 1, item: 1, d: 'A random item for your bag' }, w: 1.2, mult: 1 });
  return list;
}

/** Before the loot wheel spins: counts the spin, uses up the lucky charm, explains the odds. */
export function lootStart(g: Game, table: LootTable): OddsNote[] {
  storyEnsure(g);
  track(g, 'loot');
  const F = g.F!;
  const reasons: OddsNote[] = [
    {
      cls: 'up',
      txt:
        { normal: 'Regular fight loot', elite: 'Elite loot: epic and legendary more likely', boss: 'Boss loot: the good stuff', treasure: 'Treasure: rarer gear more likely' }[table] ||
        'Loot',
    },
  ];
  if (F.lootBoost) reasons.push({ cls: 'up', txt: '🍀 Lucky charm: epic and up ×1.7' });
  F.lootBoost = false;
  return reasons;
}

export type LootResult =
  | { kind: 'coins'; n: number }
  | { kind: 'item'; item: (typeof ITEMS)[number] }
  /** `copy`: you had it, so it became a copy for upgrades; `bonus`: a copy of a piece you wear came with it (upgrade 21) */
  | { kind: 'gear'; gear: Gear; then: 'equipped' | 'salvaged' | 'choose' | 'copy'; coins?: number; bonus?: Gear | null };

/** The loot wheel landed. Gear goes on if the slot is empty; a duplicate is salvaged; otherwise the player chooses. */
export function lootLand(g: Game, it: LootSlice): LootResult | null {
  const F = g.F!;
  if (it.coins) {
    addCoins(g, it.coins);
    return { kind: 'coins', n: it.coins };
  }
  if (it.item) {
    const i = pick(g.rng, ITEMS);
    F.bag![i.k] = (F.bag![i.k] || 0) + 1;
    return { kind: 'item', item: i };
  }
  if (it.rar) {
    const own = new Set([...Object.values(F.gear || {}), ...(F.armory || [])]);
    let pool = GEAR.filter((x) => x.r === it.rar && !own.has(x.k));
    if (!pool.length) pool = GEAR.filter((x) => x.r === it.rar);
    const gear = pick(g.rng, pool);
    markSeen(g, 'gear', gear.n);
    if (BALANCE.gearUpgrades && own.has(gear.k)) {
      addCopy(g, gear.k);
      return { kind: 'gear', gear, then: 'copy', bonus: bonusCopy(g) };
    }
    if (!F.gear![gear.slot]) {
      F.gear![gear.slot] = gear.k;
      invalidate(F);
      return { kind: 'gear', gear, then: 'equipped', bonus: bonusCopy(g) };
    }
    if (F.gear![gear.slot] === gear.k) {
      const c = Math.max(2, Math.round(gear.cost / 3));
      addCoins(g, c);
      return { kind: 'gear', gear, then: 'salvaged', coins: c };
    }
    return { kind: 'gear', gear, then: 'choose', bonus: bonusCopy(g) };
  }
  return null;
}

// ---------------------------------------------------------------- new gear and the armory
export const ARMORY_CAP = 60;
export const salvageValue = (x: Gear) => Math.max(2, Math.round(x.cost / 3));
/** New gear always lands in the armory first; nothing is lost by swapping. */
export function gearArrives(g: Game, x: Gear) {
  const F = g.F!;
  syncArmory(g, F);
  if (!F.armory!.includes(x.k)) F.armory!.push(x.k);
}
export type GearPick = 'wear' | 'store' | 'salvage';
export function gearChoose(g: Game, x: Gear, c: GearPick) {
  const F = g.F!;
  if (c === 'wear') {
    F.gear![x.slot] = x.k;
    invalidate(F);
  } else if (c === 'salvage') {
    F.armory = F.armory!.filter((k) => k !== x.k);
    addCoins(g, salvageValue(x));
    forgetPiece(g, x.k);
  }
}
export function wear(g: Game, k: string) {
  const F = g.F!;
  const x = GEARK[k]!;
  F.gear![x.slot] = x.k;
  invalidate(F);
}
export function takeOff(g: Game, k: string) {
  const F = g.F!;
  const x = GEARK[k]!;
  delete F.gear![x.slot];
  invalidate(F);
}
/** What gear sells or salvages for: a third of its value, premium pieces 20. */
export const sellValue = (x: Gear) => (x.r === 'premium' ? 20 : Math.max(1, Math.round(x.cost / 3)));
export function salvageStored(g: Game, k: string) {
  const F = g.F!;
  const x = GEARK[k]!;
  F.armory = (F.armory || []).filter((y) => y !== k);
  addCoins(g, Math.max(1, x.r === 'premium' ? 20 : Math.round(x.cost / 3)));
  forgetPiece(g, k);
}

// ---------------------------------------------------------------- haggling
/** Chance a haggle for `pct`% off works: charisma matters most, some classes and talents help. */
export function haggleChance(g: Game, pct: 10 | 25 | 40 | 60) {
  const F = g.F;
  const base = { 10: 0.85, 25: 0.62, 40: 0.4, 60: 0.2 }[pct];
  const cha = F ? eff(F, ctxOf(g)).cha : 5;
  const a = F && F.arch && F.arch.k;
  let b = clamp((cha - 6) * 0.035, -0.25, 0.3);
  if (['bard', 'streamer', 'gambler'].includes(a as string)) b += 0.08;
  if (F && F.title && F.title.n === 'Professional Yapper') b += 0.05;
  if (F && F.quirk && F.quirk.k === 'trash') b -= 0.06;
  b += 0.03 * talEcon(F as CareerFighter, 'shop') + 0.03 * lgLvl(g.save.profile, 'merchant');
  return clamp(base + b, 0.03, 0.95);
}
/** One haggle attempt. Returns whether it worked and the new price multiplier. */
export function haggle(g: Game, where: 'merchant' | 'base', pct: 10 | 25 | 40 | 60) {
  const c = Math.round(haggleChance(g, pct) * 100);
  const ok = g.rng() < c / 100;
  const mult = ok ? 1 - pct / 100 : 1 + pct / 200;
  if (where === 'merchant') {
    const S = g.F!.story as Story;
    S.hagMult = mult;
    S.hagDone = 1;
  } else g.save.profile.baseHag = { date: g.clock.today, mult };
  return { ok, mult };
}

// ---------------------------------------------------------------- the base shop (between chapters only)
export const baseOpen = (g: Game) => !g.F || !g.F.story || g.F.story.row === 0;
export const baseHagMult = (g: Game) => {
  const h = g.save.profile.baseHag as { date: string; mult: number } | undefined;
  return h && h.date === g.clock.today ? h.mult : 1;
};
export const baseHagDone = (g: Game) => {
  const h = g.save.profile.baseHag as { date: string } | undefined;
  return !!(h && h.date === g.clock.today);
};
export const basePrice = (g: Game, c: number) => Math.max(1, Math.round(priceOf(g, c) * baseHagMult(g)));
export const basicPrice = (g: Game, k: string) => basePrice(g, ITEMK[k]!.cost + 3);
export const BASICS = BASIC;

export interface Deal {
  date: string;
  cid: string | null;
  star: string | null;
  more: string[];
  sold: string[];
}
/** The daily deal: one starred epic or rare, plus a common and a rare. New every day and every fighter. */
export function dailyDeal(g: Game): Deal {
  const F = g.F;
  const p = g.save.profile;
  let d = p.deal as unknown as Deal | undefined;
  if (!d || d.date !== g.clock.today || d.cid !== (F && F.cid)) {
    const own = new Set(Object.values((F && F.gear) || {}));
    const pickR = (rs: string[]) => {
      const pool = GEAR.filter((x) => rs.includes(x.r) && !x.req && !own.has(x.k));
      return pool.length ? pick(g.rng, pool).k : null;
    };
    d = { date: g.clock.today, cid: (F && F.cid) || null, star: pickR(['epic', 'rare']), more: [pickR(['common']), pickR(['rare'])].filter(Boolean) as string[], sold: [] };
    p.deal = d as unknown as Json;
  }
  return d;
}
export const dealPrice = (g: Game, k: string, star: boolean) => basePrice(g, Math.round(GEARK[k]!.cost * (star ? 1.15 : 1.6)));

export function buyBasic(g: Game, k: string): boolean {
  if (!baseOpen(g) || !spend(g, basicPrice(g, k))) return false;
  const F = g.F!;
  F.bag![k] = (F.bag![k] || 0) + 1;
  return true;
}
export function buyDeal(g: Game, k: string): boolean {
  const d = dailyDeal(g);
  if (!baseOpen(g) || d.sold.includes(k) || !spend(g, dealPrice(g, k, k === d.star))) return false;
  wear(g, k);
  markSeen(g, 'gear', GEARK[k]!.n);
  d.sold.push(k);
  return true;
}
export const PREMIUM = () => GEAR.filter((x) => x.r === 'premium');
export const gemPrice = (k: string) => GEM_PRICE[k]!;
export function buyPremium(g: Game, k: string, cur: 'gem' | 'coin'): boolean {
  if (!baseOpen(g)) return false;
  const x = GEARK[k]!;
  const p = g.save.profile;
  if (cur === 'gem') {
    if ((p.gems || 0) < gemPrice(k)) return false;
    p.gems -= gemPrice(k);
  } else if (!spend(g, x.cost)) return false;
  wear(g, k);
  markSeen(g, 'gear', x.n);
  return true;
}

export type Service = 'physio' | 'respec' | 'box';
export const SERVICES: { k: Service; e: string; n: string; cost: number }[] = [
  { k: 'physio', e: '🩺', n: 'Physio', cost: 8 },
  { k: 'respec', e: '🔁', n: 'Talent respec', cost: 20 },
  { k: 'box', e: '🎁', n: 'Mystery box', cost: 16 },
];
export const serviceOk = (g: Game, k: Service) => (k === 'physio' ? (g.F!.inj || []).length > 0 : k === 'respec' ? talentPoints(g.F!) > 0 : true);
/** Buys a service. The mystery box returns the gear it held and whether the player must choose. */
export function buyService(g: Game, k: Service): { gear?: Gear; choose?: boolean; copy?: boolean; refunded?: number } | null {
  const s = SERVICES.find((x) => x.k === k)!;
  if (!baseOpen(g) || !serviceOk(g, k) || !spend(g, basePrice(g, s.cost))) return null;
  const F = g.F!;
  if (k === 'physio') {
    F.inj = [];
    invalidate(F);
    return {};
  }
  if (k === 'respec') {
    const n = talentPoints(F);
    F.talents = {};
    F.tp = (F.tp || 0) + n;
    invalidate(F);
    return { refunded: n };
  }
  const W: Record<string, number> = { junk: 2.4, common: 4, rare: 1.8, epic: 0.6, legendary: 0.1, mythic: 0.015 };
  const rs = Object.keys(W);
  const r = rs[pickW(g.rng, rs.map((x) => ({ w: W[x]! })))]!;
  const x = pick(g.rng, GEAR.filter((y) => y.r === r));
  markSeen(g, 'gear', x.n);
  if (BALANCE.gearUpgrades && (Object.values(F.gear || {}).includes(x.k) || (F.armory || []).includes(x.k))) {
    addCopy(g, x.k);
    return { gear: x, copy: true };
  }
  if (!F.gear![x.slot]) {
    F.gear![x.slot] = x.k;
    invalidate(F);
    return { gear: x };
  }
  return { gear: x, choose: F.gear![x.slot] !== x.k };
}

/**
 * Sells an equipped piece. Legacy only unequipped it, so it stayed in the armory and could be sold
 * again and again (the confirmation said it was gone for good): it now leaves the armory too.
 */
export function sellGear(g: Game, k: string): boolean {
  const F = g.F!;
  const x = GEARK[k]!;
  if (!baseOpen(g) || F.gear![x.slot] !== k) return false;
  addCoins(g, sellValue(x));
  delete F.gear![x.slot];
  F.armory = (F.armory || []).filter((y) => y !== k);
  forgetPiece(g, k);
  invalidate(F);
  return true;
}
export const equippedGear = (g: Game) => gearOf(g.F!);

// ---------------------------------------------------------------- the daily wheel and the event wheel
export const dailyReady = (g: Game) => g.save.profile.daily !== g.clock.today;
export const dailyList = () => DAILY.map((it) => ({ it, w: it.w, mult: 1 }));
/** One free spin a day. */
export function dailyLand(g: Game, it: (typeof DAILY)[number]): string {
  const F = g.F!;
  g.save.profile.daily = g.clock.today;
  let out = '';
  const nx = (b: Record<string, number>) => {
    F.next = { ...((F.next as Record<string, Json>) || {}), ...b };
  };
  switch (it.k) {
    case 'c5':
      addCoins(g, 5);
      out = '+5 coins';
      break;
    case 'c10':
      addCoins(g, 10);
      out = '+10 coins';
      break;
    case 'c25':
      addCoins(g, 25);
      out = '+25 coins';
      break;
    case 'xp':
      gainXP(g, F, 15);
      out = '+15 XP';
      break;
    case 'gear': {
      if (!F.gear!.trinket) {
        const x = pick(g.rng, GEAR.filter((y) => y.slot === 'trinket'));
        F.gear!.trinket = x.k;
        markSeen(g, 'gear', x.n);
        out = `Free trinket: ${x.e} ${x.n}`;
      } else {
        addCoins(g, 8);
        out = 'Your trinket slot is full, so you get 8 coins instead';
      }
      break;
    }
    case 'lvl':
      F.pendingLv = (F.pendingLv || 0) + 1;
      out = 'A level-up spin is waiting';
      break;
    case 'drink':
      nx({ en: 100 });
      out = 'Full energy next fight';
      break;
    case 'scout':
      nx({ readB: 0.2 });
      out = 'Reads 20% better next fight';
      break;
    default:
      out = 'Better luck tomorrow';
  }
  invalidate(F);
  return out;
}

export const eventList = () => EVENTS.map((it) => ({ it, w: it.w, mult: 1 }));
/** The event wheel between cup rounds. */
export function applyEvent(g: Game, it: (typeof EVENTS)[number]): string {
  const F = g.F!;
  let out = '';
  const nx = (b: Record<string, number>) => {
    F.next = { ...((F.next as Record<string, Json>) || {}), ...b };
  };
  switch (it.k) {
    case 'train': {
      const k = pick(g.rng, ['str', 'spd', 'dur', 'iq', 'wm', 'pm'] as const);
      applyBonus(F, { k, n: '+1 ' + STATN[k], e: '🏋️' });
      out = `+1 ${STATN[k]}`;
      break;
    }
    case 'sponsor':
      addCoins(g, 4);
      out = '+4 coins';
      break;
    case 'injury': {
      const j = addInjury(g, F);
      out = j ? `${j.e} ${j.n}: ${injText(j)} for ${j.dur} tournament${j.dur > 1 ? 's' : ''}` : 'Shook it off';
      break;
    }
    case 'taunt':
      nx({ dmgX: 1.15 });
      out = '+15% damage next fight';
      break;
    case 'stranger':
      applyBonus(F, { k: 'pm', n: '+1 Power mastery', e: '🧙' });
      out = '+1 power mastery';
      break;
    case 'food':
      nx({ hp: 80 });
      out = 'Starts the next fight at 80 HP';
      break;
    case 'energy':
      nx({ en: 100 });
      out = 'Full energy next fight';
      break;
    case 'scout':
      nx({ readB: 0.2 });
      out = 'Reads 20% better next fight';
      break;
    case 'relic':
      applyBonus(F, { k: 'relic', n: 'Cursed relic', e: '🗿' });
      out = '+2 strength, −2 IQ';
      break;
    case 'blessing':
      applyBonus(F, { k: 'all1', n: 'Cosmic blessing', e: '🌠' });
      out = '+1 to everything';
      break;
  }
  invalidate(F);
  return out;
}
export const mutatorList = () => MUTATORS.map((it) => ({ it, w: it.w, mult: 1 }));
export const coins = coinsOf;
