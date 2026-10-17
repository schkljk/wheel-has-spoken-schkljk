import { BOSSES, CHAPTERS, CH_PCT, ITEMS, MERCHANTS, MYSTERY, SEVENTS, STORY_STOCK, TRAIN } from '../data/content/story';
import { GEAR } from '../data/gear';
import { LEVELUP } from '../data/misc';
import { TITLES, SKIPPED } from '../data/wheels';
import { WHEELS, WHEEL, applyBonus, itemsOf, levelUp, type Slice } from '../fighter';
import { headToHead } from '../battle';
import { poolPick } from '../pool';
import { clamp, pick, pickW, shuffle } from '../random';
import { numStats, talEcon } from '../stats';
import { lgLvl } from '../save/career';
import type { CareerFighter, Json, StoryState } from '../save/fighter';
import type { Fighter, WheelItem } from '../types';
import { addCoins, coinsOf, ctxOf, pl, spend, type Game } from './game';
import { addInjury, gainFame, invalidate, markSeen, priceOf, randomGear, STATN } from './career';
import { CX_CATS, ITEMK } from './lookups';

export const LASTCH = CHAPTERS.length;
export const maxGrit = (g: Game) => 3 + lgLvl(g.save.profile, 'grit');

// ---------------------------------------------------------------- chapters and the map
export type NodeKind = 'fight' | 'elite' | 'event' | 'rest' | 'shop' | 'treasure' | 'boss';

/** Story state with the fields the rules use (the save keeps it as loose JSON). */
export interface Story extends StoryState {
  rows: NodeKind[][];
  picks: number[];
  ng: number;
  seenIntro?: boolean;
  used?: string[];
  cleared?: number[];
  stock?: string[];
  stockRow?: number;
  gearOffers?: string[];
  hagMult?: number;
  hagDone?: number;
  v2?: number;
  v3?: number;
  v4?: number;
  fixedOrder?: number;
}
export const storyOf = (g: Game) => g.F!.story as Story;

function pickWeighted(g: Game, o: Record<string, number>): string {
  const arr = Object.entries(o)
    .filter(([, w]) => w > 0)
    .map(([k, w]) => ({ k, w }));
  return arr[pickW(g.rng, arr)]!.k;
}

/** A chapter's path: fights (sometimes with an elite option), rest spots every third step, the boss last. */
export function genMap(g: Game, C: { len: number }): NodeKind[][] {
  const rows: NodeKind[][] = [];
  for (let r = 0; r < C.len; r++) {
    if (r === C.len - 1) {
      rows.push(['boss']);
      continue;
    }
    const rest = r === C.len - 2 || ((r + 1) % 3 === 0 && r < C.len - 3);
    if (rest) {
      const opts = new Set<string>(r === C.len - 2 ? ['rest'] : []);
      const n = g.rng() < 0.5 ? 3 : 2;
      let tries = 0;
      while (opts.size < n && tries++ < 40) opts.add(pickWeighted(g, { rest: 2, shop: 1.5, event: 2, treasure: 0.8 }));
      rows.push(shuffle(g.rng, [...opts]) as NodeKind[]);
    } else rows.push(r >= 2 && g.rng() < 0.6 ? ['fight', 'elite'] : ['fight']);
  }
  return rows;
}

export function newChapter(g: Game, ch: number, ng = 0): Story {
  return { ch, ng: ng || 0, rows: genMap(g, CHAPTERS[ch - 1]!), row: 0, picks: [], hp: 100, grit: maxGrit(g), seenIntro: false, used: [], v2: 1, v3: 1, v4: 1 };
}

/** Makes sure the active fighter has a story, repairing saves from older versions (legacy storyEnsure). */
export function storyEnsure(g: Game): Story {
  const F = g.F!;
  if (!F.story) F.story = { ...newChapter(g, 1, 0), cleared: [], v2: 1, v3: 1 } as unknown as StoryState;
  let S = F.story as Story;
  // repair stories that skipped chapters because of an old conversion bug
  if (S.v2 && !S.v4) {
    S.v4 = 1;
    const n = new Set(S.cleared || []).size;
    if ((S.ng || 0) === 0 && S.ch > n + 1) {
      const keep = { hp: S.hp, grit: S.grit };
      let to = n + 1;
      let cl = Array.from({ length: n }, (_, i) => i + 1);
      if (S.ch === 7 && n === 2) {
        to = 2;
        cl = [1, 3];
      } else if (S.ch === 3 && n === 1) {
        to = 2;
        cl = [1];
      }
      F.story = { ...newChapter(g, to, 0), cleared: cl, hp: keep.hp, grit: keep.grit, fixedOrder: 1 } as unknown as StoryState;
    }
  }
  S = F.story as Story;
  // the very first story had five chapters: map them onto the ten of Act I
  if (!S.v2) {
    const M: Record<number, number> = { 1: 1, 2: 3, 3: 5, 4: 7, 5: 10 };
    const keep = { hp: S.hp, grit: S.grit, ng: S.ng || 0 };
    F.story = { ...newChapter(g, M[S.ch] || 1, keep.ng), cleared: [...new Set((S.cleared || []).map((c) => M[c] || c))], v2: 1, hp: keep.hp, grit: keep.grit } as unknown as StoryState;
  }
  if (!F.bag) F.bag = {};
  if (!F.gear) F.gear = {};
  S = F.story as Story;
  // chapters got longer: older saves get the new, longer path
  const C = CHAPTERS[S.ch - 1]!;
  if (S.rows.length < C.len) {
    S.rows = genMap(g, C);
    S.picks = (S.picks || []).slice(0, S.row);
    if (S.row >= C.len) S.row = C.len - 1;
  }
  return S;
}

/** Players who had finished the story and were replaying it move on to Act II. Returns a message if so. */
export function act2Migrate(g: Game): string | null {
  const F = g.F;
  if (!F || !F.story || (F.story as Story).v3) return null;
  const S = F.story as Story;
  S.v3 = 1;
  if ((S.ng || 0) > 0 && (S.cleared || []).includes(10) && S.ch <= 10) {
    const keep = { hp: S.hp, grit: S.grit, cleared: S.cleared };
    F.story = { ...newChapter(g, 11, 0), cleared: keep.cleared, v2: 1, v3: 1, hp: keep.hp, grit: keep.grit } as unknown as StoryState;
    return '☁️ Act II is open: ten new chapters past the Wheel';
  }
  return null;
}

/** Story HP (a percentage) as real numbers: "84/120". */
export const hpTxt = (g: Game, p: number) => {
  const mx = numStats(g.F!, ctxOf(g)).hp;
  return `${Math.max(0, Math.round((p / 100) * mx))}/${mx}`;
};
export const healS = (g: Game, n: number) => {
  const S = storyOf(g);
  S.hp = Math.min(100, S.hp + n);
};
export const hurtS = (g: Game, n: number) => {
  const S = storyOf(g);
  S.hp = Math.max(1, S.hp - n);
};

// ---------------------------------------------------------------- opponents
/** How often the active fighter beats `o` at their current story HP. */
export function storyOdds(g: Game, o: Fighter, n = 60) {
  return headToHead(g.F!, o, g.rng, n, { mods: [{ hp: storyOf(g).hp }, o.maxHp ? { maxHp: o.maxHp } : {}], ctx: ctxOf(g) });
}
function tuneUp(g: Game, o: Fighter, target: number, cap = 6) {
  for (let i = 0; i < cap; i++) {
    if (storyOdds(g, o) <= target + 0.08) break;
    applyBonus(o, { k: 'all1', n: '+1 to everything', e: '💪' });
    o.lvl = (o.lvl || 1) + 1;
  }
  invalidate(o);
}

/** A story opponent from the ranked pool slice that fits the chapter (elites come from higher up). */
export function storyOpponent(g: Game, kind: 'fight' | 'elite'): CareerFighter {
  const S = storyOf(g);
  const C = CHAPTERS[S.ch - 1]!;
  const ng = S.ng || 0;
  let [lo, hi] = CH_PCT[S.ch - 1]!;
  if (kind === 'elite') {
    lo = Math.min(0.96, lo + 0.15);
    hi = Math.min(1, hi + 0.12);
  }
  lo = Math.min(0.96, lo + ng * 0.08);
  hi = Math.min(1, hi + ng * 0.08);
  const o = poolPick(g.pool, lo, hi, g.rng, undefined, ctxOf(g));
  levelUp(o, Math.max(0, C.lvl + ng * 4 + (kind === 'elite' ? 2 : 0) + Math.floor(g.rng() * 2) - 1), g.rng);
  if (kind === 'elite' || S.ch >= 3) randomGear(o, kind === 'elite' ? 2 : 1, g.rng);
  o.aiSkill = 0.06 * (S.ch - 1) + (kind === 'elite' ? 0.1 : 0) + ng * 0.05;
  return o;
}

/** The chapter boss, built from its table and tuned to stay a real fight. */
export function makeBoss(g: Game, ch: number): CareerFighter {
  const def = BOSSES[ch - 1]!;
  const ng = storyOf(g).ng || 0;
  const f = { name: def.name, bonus: {}, boons: [] } as unknown as CareerFighter;
  const set = f as unknown as Record<string, unknown>;
  const ctx = ctxOf(g);
  for (const W of WHEELS) {
    if (W.cond && !W.cond(f)) continue;
    if (W.skipIf && W.skipIf(f)) {
      set[W.k] = SKIPPED;
      continue;
    }
    const list = itemsOf(W, f, ctx) as Slice[];
    let it: Slice | undefined;
    if (W.tier) it = list.find((x) => x.v === clamp(def.stats[W.k] || 5, 1, 14));
    else if (def.picks[W.k] != null) it = list.find((x) => x.n === def.picks[W.k] || x.k === def.picks[W.k]);
    if (!it) it = W.k === 'title' ? list[0] : list[pickW(g.rng, list)];
    set[W.k] = it;
  }
  Object.assign(f, {
    title: TITLES[0],
    maxHp: def.maxHp + ng * 40,
    bossFx: def.fx,
    phase: def.phase,
    aiSkill: def.aiSkill + ng * 0.05,
    wheelBoss: def.wheelBoss,
    isBoss: true,
    bossTitle: def.title,
    lvl: CHAPTERS[ch - 1]!.lvl + 3 + ng * 4,
  });
  if (ng) for (const k of ['str', 'spd', 'dur', 'iq', 'wm', 'pm'] as const) f.bonus[k] = (f.bonus[k] || 0) + ng * 2;
  tuneUp(g, f, 0.45 - 0.02 * (ch - 1 + ng), 8);
  for (let i = 0; i < 3 && storyOdds(g, f) < 0.18; i++) {
    applyBonus(f, { k: 'curse', n: 'Eased off', e: '🕊️' });
    invalidate(f);
  }
  return f;
}

// ---------------------------------------------------------------- encounters
const gainFameText = (g: Game, n: number) => {
  const l = gainFame(g, n);
  return `+${n} fame.${l.length ? ' ' + l.join(' ') : ''}`;
};
function trainStat(g: Game, k: 'str' | 'spd' | 'wm') {
  hurtS(g, 20);
  applyBonus(g.F!, { k, n: '+1 ' + STATN[k], e: '🥋' });
  return `+1 ${STATN[k]!.toLowerCase()} for good. Your body hates you right now (−20 HP).`;
}
function blessing(g: Game) {
  const F = g.F!;
  const r = Math.floor(g.rng() * 4);
  if (r === 0) {
    healS(g, 40);
    return 'Warmth fills you. +40% HP';
  }
  if (r === 1) {
    const k = pick(g.rng, ['str', 'spd', 'dur', 'iq', 'wm', 'pm'] as const);
    applyBonus(F, { k, n: '+1 ' + STATN[k], e: '⛩️' });
    return `+1 ${STATN[k]!.toLowerCase()} for good`;
  }
  if (r === 2) {
    addCoins(g, 10);
    return '+10 coins appear in your pocket';
  }
  const it = pick(g.rng, ITEMS);
  F.bag![it.k] = (F.bag![it.k] || 0) + 1;
  return `A gift: ${it.e} ${it.n}`;
}
const nextBuff = (F: CareerFighter, b: Record<string, number>) => {
  F.next = { ...((F.next as Record<string, Json>) || {}), ...b };
};

/** What the encounter option leads to: a line of text, a fight, the mystery wheel or a loot spin. */
export type EventOutcome = { txt: string } | { fight: 'fight' | 'elite' } | { wheel: true } | { loot: string; bit: number };

/** Picks the next unseen encounter of this chapter. */
export function storyEvent(g: Game) {
  const S = storyOf(g);
  const pool = SEVENTS.filter((e) => !(S.used || []).includes(e.k));
  const ev = pick(g.rng, pool.length ? pool : SEVENTS);
  S.used = (S.used || []).concat(ev.k);
  return ev;
}
export const eventOptionOk = (g: Game, o: { cost?: number }) => !o.cost || coinsOf(g) >= o.cost;

/** Plays an encounter option (legacy SEVENTS option functions). */
export function eventOption(g: Game, k: string, i: number): EventOutcome {
  const ev = SEVENTS.find((e) => e.k === k)!;
  const o = ev.o[i]!;
  const F = g.F!;
  if (o.cost) spend(g, o.cost);
  if (o.fight) return { fight: o.fight as 'fight' | 'elite' };
  if (o.wheel) return { wheel: true };
  if (o.loot) {
    let bit = 0;
    if (g.rng() < 0.4) {
      hurtS(g, o.risk || 0);
      bit = o.risk || 0;
    }
    return { loot: o.loot, bit };
  }
  const fns: Record<string, (() => string)[]> = {
    promoter: [
      () => {
        addCoins(g, 15);
        nextBuff(F, { halfHp: 1 });
        return 'You pocket the cash. Your conscience will be quiet by the next fight.';
      },
      () => gainFameText(g, 4),
    ],
    doctor: [
      () => {
        storyOf(g).hp = 100;
        F.inj = [];
        return 'Good as new. Mostly.';
      },
      () => {
        healS(g, 30);
        if (g.rng() < 0.3) {
          const j = addInjury(g, F);
          if (j) return `It heals crooked. ${j.e} ${j.n}`;
        }
        return 'Not bad for a first try. +30% HP';
      },
      () => 'You keep moving.',
    ],
    street: [
      () => '',
      () => {
        F.fame = Math.max(0, (F.fame || 0) - 3);
        return 'The crowd boos. You walk on.';
      },
    ],
    mystery: [() => '', () => 'You leave it. Somewhere, a wheel sulks.'],
    trainer: [() => trainStat(g, 'str'), () => trainStat(g, 'spd'), () => trainStat(g, 'wm')],
    gambler: [
      () => {
        if (g.rng() < 0.5) {
          addCoins(g, 20);
          return 'You win! +20 coins';
        }
        return 'You lose. The rings jingle smugly.';
      },
      () => 'Smart.',
    ],
    shrine: [
      () => {
        healS(g, 25);
        return 'You feel lighter. +25% HP';
      },
      () => blessing(g),
    ],
    spy: [
      () => {
        nextBuff(F, { readB: 0.25 });
        return 'Now you know their tells.';
      },
      () => 'They vanish into the fog.',
    ],
    fans: [
      () => {
        addCoins(g, 8);
        hurtS(g, 10);
        return '+8 coins. ' + gainFameText(g, 3);
      },
      () => {
        healS(g, 15);
        return 'A quiet moment. +15% HP';
      },
    ],
    smith: [
      () => {
        applyBonus(F, { k: 'wm', n: '+1 Weapon mastery', e: '⚒️' });
        return 'Your weapon has never felt better.';
      },
      () => 'Maybe next time.',
    ],
    box: [() => '', () => 'You leave the humming box alone.'],
  };
  const txt = fns[k]![i]!();
  invalidate(F);
  return { txt };
}

/** The mystery wheel's effects. */
export function mysteryLand(g: Game, it: { k: string }): string {
  const F = g.F!;
  let t = '';
  if (it.k === 'all1') {
    applyBonus(F, { k: 'all1', n: '+1 to everything', e: '🌟' });
    t = '+1 to everything, for good';
  } else if (it.k === 'heal') {
    storyOf(g).hp = 100;
    t = 'Back to full HP';
  } else if (it.k === 'coins') {
    addCoins(g, 15);
    t = '+15 coins';
  } else if (it.k === 'item') {
    const i = pick(g.rng, ITEMS);
    F.bag![i.k] = (F.bag![i.k] || 0) + 1;
    t = `${i.e} ${i.n} added to your bag`;
  } else if (it.k === 'curse') {
    applyBonus(F, { k: 'curse', n: 'Cursed: −1 to everything', e: '🕳️' });
    t = '−1 to everything. Ouch';
  } else if (it.k === 'hurt') {
    hurtS(g, 30);
    t = '−30% HP';
  }
  invalidate(F);
  return t;
}
export const mysteryList = () => MYSTERY.map((it) => ({ it, w: it.w, mult: 1 }));

// ---------------------------------------------------------------- campfire
export type CampChoice = 'sleep' | 'train' | 'medic';
/** Campfire: sleep (+45% HP), train (−10 HP, then the training wheel) or the medic (cure, +20% HP). */
export function campfire(g: Game, c: CampChoice) {
  const F = g.F!;
  if (c === 'sleep') healS(g, 45);
  else if (c === 'train') hurtS(g, 10);
  else {
    F.inj = [];
    invalidate(F);
    healS(g, 20);
  }
}
export const trainList = () => TRAIN.map((it) => ({ it, w: it.w, mult: 1 }));
/** The training wheel: a permanent stat point, or a pulled muscle (−10 more HP). */
export function trainLand(g: Game, it: (typeof TRAIN)[number]): string {
  if (it.k === 'oops') {
    hurtS(g, 10);
    return '−10 more HP. Nothing gained';
  }
  applyBonus(g.F!, it as never);
  invalidate(g.F!);
  return '';
}

// ---------------------------------------------------------------- rewards
/** After a story win: a loot spin, 25% HP back, or prize money. */
export const prizeMoney = (g: Game) => 4 + storyOf(g).ch;

// ---------------------------------------------------------------- level-ups
export const levelUpList = () => LEVELUP.map((it) => ({ it, w: it.w, mult: 1 }));
/** A level-up spin landed: stat bonuses apply at once; awaken and arsenal lead to an upgrade spin. */
export function levelUpLand(g: Game, it: (typeof LEVELUP)[number]): 'power' | 'weapon' | null {
  const F = g.F!;
  F.pendingLv = Math.max(0, (F.pendingLv || 0) - 1);
  if (it.k === 'awaken') return 'power';
  if (it.k === 'arsenal') return 'weapon';
  applyBonus(F, it);
  invalidate(F);
  return null;
}

/** The slices of an upgrade spin: only equal or better than what the fighter has. Null if nothing is better. */
export function upgradeLists(g: Game, kind: 'power' | 'weapon') {
  const F = g.F!;
  const W = WHEEL[kind];
  const MK = kind === 'power' ? 'pm' : 'wm';
  const MW = WHEEL[MK];
  const old = F[kind] as WheelItem;
  const cur = F[MK] as Slice & { skip?: unknown };
  const oldM = (cur && !cur.skip ? cur : (MW.items as Slice[])[0]!) as Slice;
  const oq = old.q == null ? 1 : old.q;
  const list = (itemsOf(W, F, ctxOf(g)) as Slice[]).filter((x) => x.n !== old.n && x.k !== 'none' && (x.q == null ? 1 : x.q) >= oq).map((it) => ({ it, w: it.w, mult: 1 }));
  const mlist = (MW.items as Slice[]).filter((x) => (x.v as number) >= (oldM.v as number)).map((it) => ({ it, w: it.w, mult: 1 }));
  return { list, mlist, old, oldM, MK } as const;
}
/** Nothing better exists: +1 mastery instead. */
export function upgradeNone(g: Game, kind: 'power' | 'weapon') {
  const MK = kind === 'power' ? 'pm' : 'wm';
  applyBonus(g.F!, { k: MK, n: '+1 ' + STATN[MK], e: '⬆️' });
  return `Nothing better exists. +1 ${STATN[MK]!.toLowerCase()} instead`;
}
/** Swap to the new pick, or keep the old one for +1 mastery. */
export function upgradeChoose(g: Game, kind: 'power' | 'weapon', take: { it: Slice; m: Slice } | null) {
  const F = g.F!;
  const MK = kind === 'power' ? 'pm' : 'wm';
  const set = F as unknown as Record<string, unknown>;
  if (take) {
    set[kind] = take.it;
    set[MK] = take.m;
    if (CX_CATS.has(kind)) markSeen(g, kind, take.it.n);
  } else applyBonus(F, { k: MK, n: '+1 ' + STATN[MK], e: '🤝' });
  invalidate(F);
}

// ---------------------------------------------------------------- merchants and the bag
export const merchantOf = (g: Game) => MERCHANTS[storyOf(g).ch - 1]!;
/** Opens the merchant of this step: new stock and gear every visit. */
export function merchantStock(g: Game) {
  const F = g.F!;
  const S = storyOf(g);
  if (S.stockRow !== S.row) {
    S.stock = shuffle(g.rng, STORY_STOCK).slice(0, 4);
    S.stockRow = S.row;
    S.hagMult = 1;
    S.hagDone = 0;
    const own = Object.values(F.gear || {});
    const rs = S.ch >= 7 ? ['rare', 'epic', 'legendary'] : S.ch >= 3 ? ['common', 'rare', 'epic'] : ['common', 'rare'];
    S.gearOffers = shuffle(
      g.rng,
      GEAR.filter((x) => !x.req && rs.includes(x.r) && !own.includes(x.k)),
    )
      .slice(0, 2)
      .map((x) => x.k);
  }
  return S;
}
export const hagMult = (g: Game) => (g.F && g.F.story && (g.F.story as Story).hagMult) || 1;
export const itemPriceM = (g: Game, i: { cost: number }) => Math.max(1, Math.round(priceOf(g, i.cost + 2 + storyOf(g).ch) * hagMult(g)));
export const gearPriceM = (g: Game, x: { cost: number }) => Math.max(1, Math.round(priceOf(g, Math.round(x.cost * 1.8 + 6 * storyOf(g).ch)) * hagMult(g)));

export function buyMerchantItem(g: Game, k: string): boolean {
  const F = g.F!;
  const i = ITEMK[k]!;
  if (!spend(g, itemPriceM(g, i))) return false;
  F.bag![i.k] = (F.bag![i.k] || 0) + 1;
  const S = storyOf(g);
  S.stock = (S.stock || []).filter((x) => x !== i.k);
  return true;
}
export function buyMerchantGear(g: Game, k: string): boolean {
  const F = g.F!;
  const G = GEAR.find((x) => x.k === k)!;
  if (!spend(g, gearPriceM(g, G))) return false;
  F.gear![G.slot] = G.k;
  invalidate(F);
  markSeen(g, 'gear', G.n);
  const S = storyOf(g);
  S.gearOffers = (S.gearOffers || []).filter((x) => x !== G.k);
  return true;
}

/** Uses an item from the bag; returns the message to show, or null if it can't be used. */
export function useItem(g: Game, k: string): string | null {
  const F = g.F!;
  if (!(F.bag && F.bag[k]! > 0)) return null;
  const S = storyEnsure(g);
  const med = 10 * talEcon(F, 'heal');
  if (k === 'grit' && S.grit >= maxGrit(g)) return 'Your grit is already full';
  F.bag[k]!--;
  const pctHp = (p: number) => `+${p}% HP (+${Math.round((p / 100) * numStats(F, ctxOf(g)).hp)})`;
  let msg = '';
  if (k === 'bandage') {
    healS(g, 35 + med);
    msg = pctHp(35 + med);
  } else if (k === 'ration') {
    healS(g, 25 + med);
    msg = pctHp(25 + med);
  } else if (k === 'medkit') {
    S.hp = 100;
    F.inj = [];
    invalidate(F);
    msg = 'Fully healed';
  } else if (k === 'grit') {
    S.grit = Math.min(maxGrit(g), S.grit + 1);
    msg = '+1 grit';
  } else if (k === 'whetstone') {
    nextBuff(F, { dmgX: 1.15 });
    msg = '+15% damage next fight';
  } else if (k === 'drink') {
    nextBuff(F, { en: 100 });
    msg = 'Full energy next fight';
  } else if (k === 'scout') {
    nextBuff(F, { readB: 0.2 });
    msg = 'Better reads next fight';
  } else if (k === 'salts') {
    nextBuff(F, { revive: 30 });
    msg = 'You will get back up once next fight';
  } else if (k === 'charm') {
    F.lootBoost = true;
    msg = 'Next loot spin is luckier';
  }
  return msg;
}
/** How much HP a heal item gives (bandage 35, ration 25, plus the Medic talent). */
export const healAmount = (g: Game, k: string) => (k === 'bandage' ? 35 : k === 'ration' ? 25 : 0) + 10 * talEcon(g.F!, 'heal');

export const chapterOf = (ch: number) => CHAPTERS[ch - 1]!;
export const bossOf = (ch: number) => BOSSES[ch - 1]!;
export const gritLeft = (g: Game) => pl(storyOf(g).grit, 'grit', 'grit');
