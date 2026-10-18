import { GOALS, LEGACY, MASTERY, MASTERY_RW, COL_STEP, RANKS } from '../data/content/progression';
import { TIERS_T } from '../data/content/economy';
import { ARENAS } from '../data/arenas';
import { GEAR_SLOTS } from '../data/gear';
import { INJURIES } from '../data/misc';
import { RACES } from '../data/wheels';
import { WHEELS, applyBonus, levelUp, randomFighter } from '../fighter';
import { simulate } from '../battle';
import { pick, pickW, shuffle } from '../random';
import { STATLBL, gearPool, setCount, synOf, talEcon, talMap, fullName, bestStat } from '../stats';
import { deserFighter, serFighter, type CareerFighter, type Json, type SerFighter } from '../save/fighter';
import { lgLvl, legacyFx, xpNeed, LEVEL_CAP } from '../save/career';
import type { Profile, Slot } from '../save/schema';
import type { Fighter, Injury, StatKey, Synergy } from '../types';
import { addCoins, ctxOf, newCid, freeSlot, pl, slotOf, type Game } from './game';
import { ACHK, ARCHK, CODEX, CX_CATS, cxKey, lookOf, type Look } from './lookups';

// ---------------------------------------------------------------- records in the save
export interface Champ {
  n: string;
  e: string;
  s: string;
  d: string;
  look: Look;
  best: StatKey;
  score: number;
  fd?: SerFighter;
}
export interface Retired {
  n: string;
  look: Look;
  s: string;
  d: string;
  score: number;
  /** their race's emblem, and the fighter itself for hall of fame exhibitions (upgrade 24, the best six only) */
  e?: string;
  fd?: SerFighter;
}
export interface Rival {
  f: SerFighter;
  beats: number;
  score: number;
  at: number;
}
export type Nemesis = NonNullable<Slot['nemesis']>;
/** One fight with the nemesis: did you win, where, in which round, and the winner's HP left. */
export type NemLog = NonNullable<Nemesis['log']>[number];
export const champsOf = (p: Profile) => p.champs as unknown as Champ[];
export const rivalsOf = (g: Game) => g.save.roster.rivals as unknown as Rival[];

// ---------------------------------------------------------------- XP, levels, injuries
const L = (g: Game, k: string) => lgLvl(g.save.profile, k);

/** Adds XP (legacy perks add 10% per level); returns how many levels were gained. */
export function gainXP(g: Game, f: CareerFighter, n: number): number {
  n = Math.round(n * (1 + 0.1 * L(g, 'xp')));
  f.xp = (f.xp || 0) + n;
  let ups = 0;
  while ((f.lvl || 1) < LEVEL_CAP && f.xp >= xpNeed(f.lvl || 1)) {
    f.xp -= xpNeed(f.lvl || 1);
    f.lvl = (f.lvl || 1) + 1;
    ups++;
  }
  f.pendingLv = (f.pendingLv || 0) + ups;
  if (ups && f.career) {
    f.tp = (f.tp || 0) + ups;
    maybeOfferChallenge(g);
  }
  return ups;
}

export function addInjury(g: Game, f: Fighter): Injury | null {
  const have = new Set((f.inj || []).map((j) => j.k));
  const opts = INJURIES.filter((j) => !have.has(j.k));
  if (!opts.length) return null;
  const j = pick(g.rng, opts);
  (f.inj || (f.inj = [])).push({ k: j.k, left: j.dur } as never);
  invalidate(f);
  return j;
}
export function tickInjuries(f: Fighter) {
  f.inj = ((f.inj || []) as { k: string; left: number }[]).map((j) => ({ k: j.k, left: j.left - 1 })).filter((j) => j.left > 0);
  invalidate(f);
}
export const injText = (j: Injury) =>
  Object.entries(j.m)
    .map(([k, v]) => `${v! > 0 ? '+' : '−'}${Math.abs(v!)} ${STATLBL[k]}`)
    .join(', ');

/** Forgets a fighter's cached rating after their build changed (legacy `f._win=null`). */
export const invalidate = (f: Fighter) => {
  (f as CareerFighter)._win = null;
};

// ---------------------------------------------------------------- nemesis and rivals
/** The nemesis haunting the active fighter (only the fighter they actually beat). */
export function myNemesis(g: Game): Nemesis | null {
  const s = slotOf(g);
  const n = s?.nemesis as Nemesis | null | undefined;
  if (!s || !n || !n.f || !g.F) return null;
  if (n.owner && n.owner !== g.F.cid) {
    s.nemesis = null;
    return null;
  }
  if (!n.owner) {
    if ((n.f.lvl || 1) > (g.F.lvl || 1) + 3) {
      s.nemesis = null;
      return null;
    }
    n.owner = g.F.cid || undefined;
  }
  return n;
}

export function setNemesis(g: Game, O: CareerFighter) {
  const s = slotOf(g)!;
  const old = s.nemesis as Nemesis | null;
  if (old && old.f && old.f.name !== O.name) archiveRival(g, old.f, old.beats);
  const cur = myNemesis(g);
  if (cur && cur.f.name === O.name) {
    cur.beats = (cur.beats || 1) + 1;
    levelUp(O, 1, g.rng);
    O.isNem = true;
    cur.f = serFighter(O);
  } else {
    O.isNem = true;
    s.nemesis = { f: serFighter(O), beats: 1, owner: g.F!.cid } as unknown as Nemesis;
  }
}

const rivalScore = (o: { lvl?: number }, beats?: number) => (o.lvl || 1) * 2 + (beats || 1) * 3;
export function archiveRival(g: Game, ser: SerFighter, beats?: number) {
  if (!ser || !ser.name) return;
  let r = rivalsOf(g).filter((x) => x.f.name !== ser.name);
  r.push({ f: ser, beats: beats || 1, score: rivalScore(ser, beats), at: g.save.profile.entered || 0 });
  r.sort((a, b) => b.score - a.score);
  r = r.slice(0, 6);
  g.save.roster.rivals = r as unknown as Json[];
}
const legends = (g: Game) => champsOf(g.save.profile).filter((c) => c.fd && c.fd.cid !== (g.F && g.F.cid));

/** Every two levels from level 3, an old rival or a hall of fame legend may ask for a fight. */
export function maybeOfferChallenge(g: Game) {
  const F = g.F;
  if (!F || !F.career || F.challenge || (F.lvl || 1) < 3 || (F.lvl || 1) - (F.chalLvl || 0) < 2) return;
  const riv = rivalsOf(g).filter((r) => r.f.cid !== F.cid);
  const leg = legends(g);
  if (!riv.length && !leg.length) return;
  const useLegend = leg.length && (!riv.length || g.rng() < 0.5);
  F.chalLvl = F.lvl;
  if (useLegend) {
    const l = pick(g.rng, leg.slice(0, 6));
    F.challenge = { kind: 'legend', name: l.fd!.name };
  } else {
    const r = pick(g.rng, riv);
    F.challenge = { kind: 'rival', name: r.f.name };
  }
}

/** The rival or legend behind the active fighter's challenge, levelled to fit. */
export function challengeFighter(g: Game): CareerFighter | null {
  const F = g.F;
  const c = F && (F.challenge as { kind: string; name: string } | null);
  if (!F || !c) return null;
  let o: CareerFighter | null = null;
  if (c.kind === 'rival') {
    const r = rivalsOf(g).find((x) => x.f.name === c.name);
    if (r) o = deserFighter(r.f);
  } else {
    const l = champsOf(g.save.profile).find((x) => x.fd && x.fd.name === c.name);
    if (l) o = deserFighter(l.fd);
  }
  if (!o) return null;
  const target = (F.lvl || 1) + (c.kind === 'legend' ? 2 : 1);
  if ((o.lvl || 1) < target) levelUp(o, target - (o.lvl || 1), g.rng);
  o.isRival = c.kind;
  o.isNem = false;
  o.career = false;
  invalidate(o);
  return o;
}

// ---------------------------------------------------------------- seasons and balance patches
export function recordMatch(g: Game, W: Fighter, Lo: Fighter) {
  const S = g.save.profile.season.stats;
  const inc = (cat: string, k: string, res: 'w' | 'l') => {
    const c = S[cat] || (S[cat] = {});
    const o = c[k] || (c[k] = { w: 0, l: 0 });
    o[res]++;
  };
  inc('race', W.race.n, 'w');
  inc('race', Lo.race.n, 'l');
  inc('arch', W.arch.k, 'w');
  inc('arch', Lo.arch.k, 'l');
}

export interface PatchNote {
  up: boolean;
  txt: string;
  why: string;
}
/** After three tournaments: the league plays 400 fights, then the best get nerfed and the worst buffed. */
export function rollSeason(g: Game) {
  const p = g.save.profile;
  const S = p.season;
  const notes: PatchNote[] = [];
  const ctx = ctxOf(g);
  for (let i = 0; i < 400; i++) {
    const a = randomFighter('a', g.rng, ctx);
    const b = randomFighter('b', g.rng, ctx);
    const w = simulate(a, b, g.rng, { arena: ARENAS[pickW(g.rng, ARENAS)], ctx });
    recordMatch(g, w === 0 ? a : b, w === 0 ? b : a);
  }
  for (const cat of ['race', 'arch'] as const) {
    const rows = Object.entries(S.stats[cat] || {})
      .map(([k, v]) => ({ k, n: v.w + v.l, wr: v.w / Math.max(1, v.w + v.l) }))
      .filter((r) => r.n >= 8)
      .sort((a, b) => b.wr - a.wr);
    if (rows.length < 4) continue;
    const PT = p.patch[cat] || (p.patch[cat] = {});
    const name = (k: string) => (cat === 'race' ? k : ARCHK[k] ? ARCHK[k].n : k);
    const emo = (k: string) => (cat === 'race' ? (RACES.find((r) => r.n === k) || { e: '' }).e : (ARCHK[k] || { e: '' }).e);
    for (const r of rows.slice(0, 2)) {
      const st = pick(g.rng, ['str', 'spd', 'dur'] as const);
      const o = PT[r.k] || (PT[r.k] = {});
      o[st] = Math.max(-3, (o[st] || 0) - 1);
      notes.push({ up: false, txt: `${emo(r.k)} ${name(r.k)}: −1 ${STATLBL[st]}`, why: `Won ${Math.round(r.wr * 100)}% of ${r.n} fights last season` });
    }
    for (const r of rows.slice(-2)) {
      const st = pick(g.rng, ['str', 'spd', 'dur'] as const);
      const o = PT[r.k] || (PT[r.k] = {});
      o[st] = Math.min(3, (o[st] || 0) + 1);
      notes.push({ up: true, txt: `${emo(r.k)} ${name(r.k)}: +1 ${STATLBL[st]}`, why: `Won only ${Math.round(r.wr * 100)}% of ${r.n} fights last season` });
    }
  }
  const n = S.n + 1;
  p.season = { n, tourneys: 0, stats: { race: {}, arch: {} } };
  p.patchNotes = { season: n, notes, unseen: true } as unknown as Json;
  if (g.F) invalidate(g.F);
}

// ---------------------------------------------------------------- achievements, collection, goals
/** Grants achievement titles to the active fighter (+3 coins each); new ones are pushed to `out`. */
export function award(g: Game, keys: string[], out: (typeof ACHK)[string][]) {
  for (const k of keys) {
    const F = g.F;
    if (!F || (F.earned || []).includes(k)) continue;
    const a = ACHK[k];
    if (!a) continue;
    (F.earned || (F.earned = [])).push(k);
    g.save.profile.ach[k] = true;
    markSeen(g, 'ach', a.n);
    addCoins(g, 3);
    out.push(a);
  }
}

/** Logs a collection entry; true if it is new. */
/** A fighter's hidden synergies found in a fight: marks them seen and returns the ones that are new. */
export function discoverHidden(g: Game, f: Fighter): Synergy[] {
  return synOf(f).filter((s) => s.hidden && markSeen(g, 'syn', s.n));
}
/** Whether the player has found this synergy (hidden ones show as ??? until then). */
export const synFound = (g: Game, s: Synergy) => !s.hidden || (g.save.profile.seen.syn || []).includes(s.n);

export function markSeen(g: Game, cat: string, key: string): boolean {
  const seen = g.save.profile.seen;
  const a = Array.isArray(seen[cat]) ? seen[cat]! : (seen[cat] = []);
  if (a.includes(key)) return false;
  a.push(key);
  checkCollection(g);
  return true;
}

export function codexCount(g: Game): { f: number; t: number } {
  let f = 0;
  let t = 0;
  for (const [k, , get] of CODEX) {
    const list = get();
    t += list.length;
    const s = g.save.profile.seen[k] || [];
    f += list.filter((x) => s.includes(x.key)).length;
  }
  return { f, t };
}

const ST = (g: Game, k: string) => g.save.profile.stats[k] || 0;
export function track(g: Game, k: string, n = 1) {
  const s = g.save.profile.stats;
  s[k] = (s[k] || 0) + n;
  checkGoals(g);
}
export function trackMax(g: Game, k: string, v: number) {
  const s = g.save.profile.stats;
  if (v > (s[k] || 0)) {
    s[k] = v;
    checkGoals(g);
  }
}

export const masteryLvl = (g: Game, k: string) => {
  const w = g.save.profile.mastery[k] || 0;
  let l = 0;
  for (const t of MASTERY) if (w >= t) l++;
  return l;
};
const maxMastery = (g: Game) => Math.max(0, ...Object.keys(g.save.profile.mastery).map((k) => masteryLvl(g, k)));

/** How far along each goal is. */
const GOAL_CUR: Record<string, (g: Game) => number> = {};
for (const goal of GOALS) {
  const k = goal.k;
  const stat = /^w\d/.test(k)
    ? 'wins'
    : /^e\d/.test(k)
      ? 'elites'
      : /^b\d/.test(k)
        ? 'bosses'
        : /^ch\d/.test(k)
          ? 'chapters'
          : /^cup/.test(k)
            ? 'cups'
            : k === 'world3'
              ? 'worlds'
              : /^g\d/.test(k)
                ? 'gauntletBest'
                : /^dc/.test(k)
                  ? 'dailies'
                  : k === 'rush1'
                    ? 'rushes'
                    : k === 'bet10'
                      ? 'bets'
                      : /^loot/.test(k)
                        ? 'loot'
                        : /^gear/.test(k)
                          ? 'gearFound'
                          : k === 'set'
                            ? 'setsDone'
                            : /^lv/.test(k)
                              ? 'topLevel'
                              : /^build/.test(k)
                                ? 'built'
                                : null;
  GOAL_CUR[k] = stat
    ? (g) => ST(g, stat)
    : k === 'mall'
      ? (g) => Object.keys(g.save.profile.mastery).filter((a) => g.save.profile.mastery[a]! > 0).length
      : maxMastery;
}
export const goalCur = (g: Game, k: string) => GOAL_CUR[k]!(g);

export interface Reward {
  gems?: number;
  coins?: number;
  legacy?: number;
  tp?: number;
}
/** Pays a reward; returns it as text ("💎 3, 🪙 15"). */
export function grant(g: Game, rw: Reward): string {
  const parts: string[] = [];
  const p = g.save.profile;
  if (rw.gems) {
    p.gems = (p.gems || 0) + rw.gems;
    parts.push(`💎 ${rw.gems}`);
  }
  if (rw.coins) {
    addCoins(g, rw.coins);
    parts.push(`🪙 ${rw.coins}`);
  }
  if (rw.legacy) {
    p.legacy.pts = (p.legacy.pts || 0) + rw.legacy;
    parts.push(`✦ ${rw.legacy} legacy`);
  }
  if (rw.tp && g.F) {
    g.F.tp = (g.F.tp || 0) + rw.tp;
    parts.push(`🌟 ${rw.tp} talent ${rw.tp === 1 ? 'point' : 'points'}`);
  }
  return parts.join(', ');
}
export const rwText = (rw: Reward) => [rw.gems ? `💎 ${rw.gems}` : '', rw.coins ? `🪙 ${rw.coins}` : '', rw.legacy ? `✦ ${rw.legacy} legacy` : ''].filter(Boolean).join(', ');

/** Pays out every goal that is now reached (each pays once, for good). */
export function checkGoals(g: Game) {
  const done = g.save.profile.goalsDone;
  for (const goal of GOALS) {
    if (done.includes(goal.k)) continue;
    if (goalCur(g, goal.k) >= goal.need) {
      done.push(goal.k);
      const r = grant(g, goal.rw);
      g.notes.push(`${goal.e} Goal: ${goal.n}. ${r}`);
    }
  }
  checkCollection(g);
}

/** Every COL_STEP collection entries pay 3 gems and 15 coins. */
export function checkCollection(g: Game) {
  const p = g.save.profile;
  const reached = Math.floor(codexCount(g).f / COL_STEP);
  while ((p.colMiles || 0) < reached) {
    p.colMiles = (p.colMiles || 0) + 1;
    const r = grant(g, { gems: 3, coins: 15 });
    g.notes.push(`📚 Collection: ${p.colMiles * COL_STEP} entries found. ${r}`);
  }
}

/** A win with a class counts toward mastering it, across all fighters. */
export function addMasteryWin(g: Game, f: Fighter | null) {
  if (!f || !f.arch) return;
  const k = f.arch.k;
  const before = masteryLvl(g, k);
  const m = g.save.profile.mastery;
  m[k] = (m[k] || 0) + 1;
  const after = masteryLvl(g, k);
  if (after > before) {
    const r = grant(g, MASTERY_RW[after - 1]!);
    g.notes.push(`${f.arch.e} ${f.arch.n} mastery ${after}. ${r}`);
  }
}

export function awardGems(g: Game, n: number, lines?: string[]) {
  if (!n) return;
  g.save.profile.gems = (g.save.profile.gems || 0) + n;
  if (lines) lines.push(`💎 +${n} ${n === 1 ? 'gem' : 'gems'}`);
}

// ---------------------------------------------------------------- fame and ranks
export function rankOf(f: { fame?: number } | null | undefined) {
  const fm = (f && f.fame) || 0;
  let r = 0;
  RANKS.forEach((x, i) => {
    if (fm >= x.fame) r = i;
  });
  return r;
}

/** What reaching rank `r` pays out: coins, talent points and (at the top) gems. */
export function rankReward(r: number) {
  return { coins: 6 * r, tp: 1 + (r === 5 || r === 8 ? 2 : 0), gems: (({ 7: 5, 8: 10, 9: 25 }) as Record<number, number>)[r] || 0 };
}
/** Ranks whose perk does something beyond the payout (a shop discount, legendary gear, the aura). */
export const RANK_EFFECT = new Set([2, 4, 6, 9]);

/** Adds fame (talents and legacy add to it); returns lines describing any rank-ups. */
export function gainFame(g: Game, n: number): string[] {
  const F = g.F;
  if (!F || !F.career || !n) return [];
  n = Math.round(n * (1 + 0.1 * talEcon(F, 'fame') + 0.1 * L(g, 'famous')));
  const before = rankOf(F);
  F.fame = (F.fame || 0) + n;
  const after = rankOf(F);
  const out: string[] = [];
  for (let r = before + 1; r <= after; r++) {
    const R = RANKS[r]!;
    const { coins, tp, gems } = rankReward(r);
    addCoins(g, coins);
    F.tp = (F.tp || 0) + tp;
    if (r >= 7) awardGems(g, gems);
    // legacy said "1 talent point" at Eternal although it paid 3; the text now matches the payout
    out.push(`${R.e} Rank up: ${R.n}! +${coins} 🪙 and ${pl(tp, 'talent point')}. ${R.perk}`);
    if (r === 6) award(g, ['mythic'], []);
  }
  return out;
}

// ---------------------------------------------------------------- prices
export const shopMult = (g: Game) => Math.max(0.5, 1 - 0.04 * talEcon(g.F as Fighter, 'shop') - 0.05 * L(g, 'merchant'));
/** Price after the Pro rank discount, talents and legacy. */
export const priceOf = (g: Game, c: number) => Math.max(1, Math.ceil(c * (g.F && rankOf(g.F) >= 2 ? 0.9 : 1) * shopMult(g)));

// ---------------------------------------------------------------- gear
/** Puts every equipped piece in the armory and counts newly found gear and sets. */
export function syncArmory(g: Game, f: CareerFighter | null) {
  if (!f) return;
  f.armory = f.armory || [];
  for (const k of Object.values(f.gear || {})) if (k && !f.armory.includes(k)) f.armory.push(k);
  if (f === g.F) {
    const seen = g.save.profile.gearSeen;
    let added = 0;
    for (const k of f.armory)
      if (!seen.includes(k)) {
        seen.push(k);
        added++;
      }
    if (added) track(g, 'gearFound', added);
    const sets: Record<string, number> = { knight: 6, shadow: 6, arcane: 6, clown: 4 };
    trackMax(g, 'setsDone', Object.keys(sets).filter((s) => setCount(f, s) >= sets[s]!).length);
    trackMax(g, 'topLevel', f.lvl || 1);
  }
}

/** Random gear for an opponent: n different slots, common to epic. */
export function randomGear(f: Fighter, n: number, rng: Game['rng']) {
  f.gear = f.gear || {};
  const slots = shuffle(rng, GEAR_SLOTS).slice(0, n);
  for (const s of slots) {
    const opts = gearPool().filter((x) => x.slot === s && !x.req && ['common', 'rare', 'epic'].includes(x.r));
    f.gear[s] = pick(rng, opts).k;
  }
  invalidate(f);
}

// ---------------------------------------------------------------- new careers, legacy, retiring
/** Legacy points a fighter leaves when they retire. */
export const legacyEarned = (f: CareerFighter) =>
  Math.floor((f.lvl || 1) / 2) + Object.values(f.belts || {}).filter(Boolean).length * 2 + Math.floor((f.earned || []).length / 3) + rankOf(f);

/** Legacy perks and class mastery give a new fighter their head start. */
export function applyLegacyStart(g: Game, f: CareerFighter) {
  addCoins(g, 15 * L(g, 'coins'));
  f.tp = (f.tp || 0) + L(g, 'talent');
  f.gear = f.gear || {};
  f.bag = f.bag || {};
  if (L(g, 'gear')) {
    const it = pick(g.rng, gearPool().filter((x) => x.slot === 'trinket' && ['common', 'rare'].includes(x.r)));
    f.gear.trinket = it.k;
  }
  if (L(g, 'crest')) {
    const it = pick(g.rng, gearPool().filter((x) => x.r === 'rare' && !f.gear![x.slot]));
    if (it) f.gear[it.slot] = it.k;
  }
  if (L(g, 'recipe')) f.bag.bandage = (f.bag.bandage || 0) + 2 * L(g, 'recipe');
  for (let i = 0; i < L(g, 'mentor'); i++) {
    const k = pick(g.rng, ['str', 'spd', 'dur', 'iq', 'wm', 'pm'] as const);
    applyBonus(f, { k, n: '+1 ' + STATN[k], e: '🧓' });
  }
  f.lfx = legacyFx(g.save.profile);
  // class mastery (ui_goals.js)
  track(g, 'built');
  const l = masteryLvl(g, f.arch.k);
  if (l >= 2) f.tp = (f.tp || 0) + 1;
  if (l >= 4) applyBonus(f, { k: 'all1', n: '+1 to everything', e: '🎓' });
}
export const STATN: Record<string, string> = {
  str: 'Strength',
  spd: 'Speed',
  dur: 'Durability',
  iq: 'IQ',
  wm: 'Weapon mastery',
  pm: 'Power mastery',
  cha: 'Charisma',
};

/** A finished build: synergies and the landed slices go into the collection's "new" markers. */
export function finishBuild(g: Game, f: Fighter) {
  for (const s of synOf(f)) if (!s.hidden) markSeen(g, 'syn', s.n);
  g.save.profile.last = WHEELS.filter((W) => CX_CATS.has(W.k) && f[W.k] && !(f[W.k] as { skip?: unknown }).skip).map(
    (W) => W.k + '|' + cxKey(W.k, f[W.k] as { n: string }, f),
  );
  invalidate(f);
}

/** Starts the career of a freshly built fighter in the first free roster slot. */
export function enterCareer(g: Game, f: CareerFighter): number {
  const i = freeSlot(g);
  const slot = i < 0 ? 0 : i;
  g.save.roster.slots[slot] = { career: serFighter(f), nemesis: null, tourney: null, coins: 0 };
  g.save.roster.active = slot;
  Object.assign(f, {
    career: true,
    cid: newCid(g),
    lvl: 1,
    xp: 0,
    pendingLv: 0,
    rec: { w: 0, l: 0 },
    earned: [],
    inj: [],
    next: null,
    belts: {},
    defenses: 0,
    tourneys: 0,
    fights: 0,
    gbest: 0,
    trained: 0,
    fame: 0,
    tp: 0,
    talents: [],
    challenge: null,
  });
  g.F = f;
  applyLegacyStart(g, f);
  delete (f as { free?: number }).free;
  persistFighter(g);
  return slot;
}

/** Writes the live fighter back into their roster slot (legacy saveCareer). */
export function persistFighter(g: Game) {
  const s = slotOf(g);
  if (!g.F || !g.F.career || !s) return;
  syncArmory(g, g.F);
  s.career = serFighter(g.F);
}

/** Retires the active fighter: legacy points, a hall of fame entry, and the slot is freed. */
export function retire(g: Game) {
  const F = g.F;
  if (!F) return;
  const p = g.save.profile;
  const belts = TIERS_T.filter((t) => F.belts && F.belts[t.k])
    .map((t) => t.e)
    .join('');
  const lp = legacyEarned(F);
  p.legacy.pts += lp;
  p.lastLegacy = lp;
  const s = slotOf(g);
  const nem = s?.nemesis as Nemesis | null;
  if (nem && nem.f) archiveRival(g, nem.f, nem.beats);
  const rec = F.rec || { w: 0, l: 0 };
  (g.save.roster.retired as unknown as Retired[]).unshift({
    n: fullName(F),
    look: lookOf(F),
    s: `Level ${F.lvl} ${RANKS[rankOf(F)]!.n}, ${pl(rec.w, 'win')}, ${pl(rec.l, 'loss', 'losses')}${belts ? ', belts ' + belts : ''}`,
    d: g.clock.date,
    score: (F.lvl || 1) + Object.values(F.belts || {}).filter(Boolean).length * 3 + rankOf(F) * 2,
    e: F.race.e,
    fd: serFighter(F),
  });
  pruneDB(g);
  g.save.roster.retired = g.save.roster.retired.slice(0, 20);
  if (g.save.roster.active != null) g.save.roster.slots[g.save.roster.active] = null;
  g.save.roster.active = null;
  g.F = null;
}

/** Keeps the save small: only the best champions, retirees and recent rivals stay. */
export function pruneDB(g: Game) {
  const p = g.save.profile;
  const champs = champsOf(p).filter(Boolean);
  champs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = champs.slice(0, 10);
  top.forEach((c, i) => {
    if (i >= 6 && c.fd) delete c.fd;
  });
  p.champs = top as unknown as Json[];
  const retired = (g.save.roster.retired as unknown as Retired[]).filter(Boolean).sort((a, b) => (b.score || 0) - (a.score || 0));
  retired.forEach((r, i) => {
    if (i >= 6 && r.fd) delete r.fd;
  });
  g.save.roster.retired = retired.slice(0, 10) as never;
  g.save.roster.rivals = rivalsOf(g)
    .filter((r) => r && r.f && (p.entered || 0) - (r.at || 0) <= 25)
    .slice(0, 6) as unknown as Json[];
  p.champIds = Object.fromEntries(
    Object.entries(p.champIds || {})
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 60),
  );
  const pn = p.patchNotes as { unseen?: boolean } | null;
  if (pn && !pn.unseen && (p.season.tourneys || 0) >= 2) p.patchNotes = null;
}

/** A hall of fame entry for a fresh champion. */
export function champEntry(g: Game, f: CareerFighter, s: string, score: number): Champ {
  return { n: fullName(f), e: f.race.e, s, d: g.clock.date, look: lookOf(f), best: bestStat(f, ctxOf(g)), score, fd: serFighter(f) };
}

export const talentPoints = (f: Fighter) => Object.values(talMap(f)).reduce((a, b) => a + b, 0);
