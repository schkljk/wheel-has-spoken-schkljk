import { BACKS, CURED, QUIRKS, SKIPPED, STANCES, TITLES, WEAKS } from '../data/wheels';
import { WHEELS, itemsOf, type PartialFighter } from '../fighter';
import type { Fighter, TalentMap, WheelItem } from '../types';

/** Anything JSON can hold; used for save parts whose rules are ported with their screens. */
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** Story mode progress (shape owned by the story rules). */
export interface StoryState {
  ch: number;
  ng?: number;
  rows: string[][];
  row: number;
  picks?: number[];
  /** HP in % of max (0-100) */
  hp: number;
  grit: number;
  cleared?: number[];
  [k: string]: Json | undefined;
}

/** A career fighter: the rolled fighter plus everything their career has added. */
export interface CareerFighter extends Fighter {
  cid?: string | null;
  career?: boolean;
  fame?: number;
  /** unspent talent points */
  tp?: number;
  xp?: number;
  pendingLv?: number;
  rec?: { w: number; l: number };
  earned?: string[];
  next?: Json;
  belts?: Record<string, boolean | number>;
  defenses?: number;
  tourneys?: number;
  fights?: number;
  gbest?: number;
  trained?: number;
  isNem?: boolean;
  challenge?: Json;
  chalLvl?: number;
  story?: StoryState | null;
  bag?: Record<string, number>;
  lootBoost?: boolean;
  armory?: string[];
  /** the highest tower floor this fighter cleared (upgrade 25) */
  towerBest?: number;
  /** chapters beaten on hard, and the main story waiting while a hard run is on (upgrade 26) */
  hardCleared?: number[];
  storyMain?: StoryState | null;
  contract?: Json;
  offers?: Json;
  /** cached rating against random level 1 fighters (runtime only; cleared when the build changes) */
  _win?: number | null;
  /** challenge opponents: 'rival' or 'legend' */
  isRival?: string;
  /** pool opponents: where they rank (0 weakest, 1 strongest) */
  poolPct?: number;
  bossTitle?: string;
}

/** A fighter as saved: every wheel pick by name, plus career fields. Same format as the legacy game. */
export interface SerFighter {
  name: string;
  /** wheel key -> item name, or '__skip' */
  picks: Record<string, string>;
  bonus: Fighter['bonus'];
  boons: { n: string; e: string }[];
  fame: number;
  tp: number;
  talents: TalentMap | string[];
  challenge: Json;
  chalLvl: number;
  story: StoryState | null;
  bag: Record<string, number>;
  lootBoost: boolean;
  lvl: number;
  xp: number;
  pendingLv: number;
  rec: { w: number; l: number };
  earned: string[];
  inj: { k: string; left?: number }[];
  next: Json;
  belts: Record<string, boolean | number>;
  defenses: number;
  tourneys: number;
  fights: number;
  gbest: number;
  trained: number;
  isNem: 0 | 1;
  cid: string | null;
  gear: Fighter['gear'] | null;
  armory: string[];
  contract: Json;
  offers: Json;
  /** a reincarnation pick is stored whole: its wheel is built from past champions */
  reinc?: { n: string; e: string; q: number; m?: Fighter['bonus']; d?: string };
  cured?: 1;
  [k: string]: unknown;
}

/** Stable small hash of a string (legacy art_build.js). */
export function hashStr(s: unknown): number {
  let h = 7;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function serFighter(f: CareerFighter): SerFighter {
  const picks: Record<string, string> = {};
  for (const W of WHEELS) {
    const v = f[W.k] as WheelItem | undefined;
    if (!v) continue;
    picks[W.k] = (v as unknown) === SKIPPED ? '__skip' : v.n;
  }
  const o: SerFighter = {
    name: f.name, picks, bonus: f.bonus || {}, boons: (f.boons || []).slice(-20).map((b) => ({ n: b.n, e: b.e })), fame: f.fame || 0,
    tp: f.tp || 0, talents: f.talents || [], challenge: f.challenge || null, chalLvl: f.chalLvl || 0, story: f.story || null, bag: f.bag || {},
    lootBoost: !!f.lootBoost, lvl: f.lvl || 1, xp: f.xp || 0, pendingLv: f.pendingLv || 0, rec: f.rec || { w: 0, l: 0 }, earned: f.earned || [],
    inj: f.inj || [], next: f.next || null, belts: f.belts || {}, defenses: f.defenses || 0, tourneys: f.tourneys || 0, fights: f.fights || 0,
    gbest: f.gbest || 0, trained: f.trained || 0, isNem: f.isNem ? 1 : 0, cid: f.cid || null, gear: f.gear || null, armory: f.armory || [],
    contract: f.contract || null, offers: f.offers || null,
  };
  if (f.gup && Object.keys(f.gup).length) o.gup = { ...f.gup };
  if (f.gcopy && Object.keys(f.gcopy).length) o.gcopy = { ...f.gcopy };
  if (f.towerBest) o.towerBest = f.towerBest;
  if (f.hardCleared && f.hardCleared.length) o.hardCleared = f.hardCleared.slice();
  if (f.storyMain) o.storyMain = f.storyMain;
  if (f.reinc && !(f.reinc as { skip?: boolean }).skip) o.reinc = { n: f.reinc.n, e: f.reinc.e, q: f.reinc.q, m: f.reinc.m, d: f.reinc.d };
  if (f.weak && f.weak.k === 'cured') o.cured = 1;
  return o;
}

const REQUIRED = ['race', 'arch', 'size', 'str', 'spd', 'dur', 'iq', 'weapon', 'wm', 'power', 'pm', 'ench', 'weak', 'chaos'] as const;

/** Rebuilds a fighter from its saved picks. Returns null when the save can't make a whole fighter. */
export function deserFighter(o: SerFighter | null | undefined): CareerFighter | null {
  if (!o || !o.picks) return null;
  const f = {
    cid: o.cid || null, name: o.name, bonus: { ...o.bonus }, boons: (o.boons || []).map((b) => ({ n: b.n, e: b.e })), lvl: o.lvl || 1,
    xp: o.xp || 0, pendingLv: o.pendingLv || 0, rec: Object.assign({ w: 0, l: 0 }, o.rec), earned: (o.earned || []).slice(),
    inj: (o.inj || []).map((j) => ({ ...j })), next: o.next || null, belts: { ...o.belts }, defenses: o.defenses || 0, tourneys: o.tourneys || 0,
    fights: o.fights || 0, gbest: o.gbest || 0, trained: o.trained || 0,
  } as unknown as CareerFighter & PartialFighter;
  const set = f as unknown as Record<string, unknown>;
  if (o.isNem) f.isNem = true;
  for (const W of WHEELS) {
    const n = o.picks[W.k];
    if (n == null) continue;
    if (n === '__skip') {
      // older saves stored turn-skipping weaknesses this way; restore a matching one instead of an empty slot
      if (W.k === 'weak') {
        const sk = WEAKS.filter((x) => x.skip && x.st);
        f.weak = sk[hashStr(o.name) % sk.length]!;
        continue;
      }
      if (W.k !== 'pm') {
        set[W.k] = itemsOf(W, f)[0];
        continue;
      }
      set[W.k] = SKIPPED;
      continue;
    }
    if (W.k === 'reinc') {
      set.reinc = o.reinc ? { w: 1, ...o.reinc } : { n, e: '🔁', q: 1, w: 1 };
      continue;
    }
    if (W.cond && !W.cond(f)) continue;
    const list = itemsOf(W, f);
    const it = list.find((x) => x.n === n);
    if (it) set[W.k] = it;
    else if (W.k === 'weak' && o.cured) f.weak = CURED;
    else set[W.k] = list[0];
  }
  if (o.cured) f.weak = CURED;
  for (const k of REQUIRED) if (!set[k]) return null;
  if (!f.title) f.title = TITLES[0];
  if (!f.back) f.back = BACKS[0];
  if (!f.stance) f.stance = STANCES.find((s) => s.k === 'balanced');
  if (!f.quirk) f.quirk = QUIRKS[0];
  f.gear = o.gear ? { ...o.gear } : {};
  f.armory = (o.armory || []).slice();
  if (o.gup && typeof o.gup === 'object') f.gup = { ...(o.gup as Record<string, number>) };
  if (o.gcopy && typeof o.gcopy === 'object') f.gcopy = { ...(o.gcopy as Record<string, number>) };
  if (typeof o.towerBest === 'number') f.towerBest = o.towerBest;
  if (Array.isArray(o.hardCleared)) f.hardCleared = (o.hardCleared as number[]).slice();
  if (o.storyMain && typeof o.storyMain === 'object') f.storyMain = o.storyMain as StoryState;
  f.contract = o.contract || null;
  f.offers = o.offers || null;
  f.fame = o.fame || 0;
  f.tp = o.tp || 0;
  f.talents = Array.isArray(o.talents) ? o.talents.slice() : { ...(o.talents || {}) };
  f.challenge = o.challenge || null;
  f.chalLvl = o.chalLvl || 0;
  f.story = o.story || null;
  f.bag = { ...(o.bag || {}) };
  f.lootBoost = !!o.lootBoost;
  return f;
}
