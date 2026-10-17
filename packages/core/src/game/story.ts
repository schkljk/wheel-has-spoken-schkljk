import { BOSSES, CHAPTERS, ITEMS, MERCHANTS, MYSTERY, NODE, SEVENTS, STORY_STOCK, TRAIN } from '../data/content/story';
import { GEAR } from '../data/gear';
import { BALANCE } from '../data/balance';
import { EVENT_TALK, type TalkOption } from '../data/content/charisma';
import { NODE_MORE } from '../data/content/nemesis';
import { CH_EVENTS, type ChapterEvent, type ChapterOpt, type EventFx } from '../data/content/chapter-events';
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
import { addInjury, gainFame, injText, invalidate, markSeen, priceOf, randomGear, STATN } from './career';
import { CX_CATS, ITEMK } from './lookups';

export const LASTCH = CHAPTERS.length;
export const maxGrit = (g: Game) => 3 + lgLvl(g.save.profile, 'grit');

// ---------------------------------------------------------------- chapters and the map
export type NodeKind = 'fight' | 'elite' | 'event' | 'rest' | 'shop' | 'treasure' | 'boss' | 'nemesis';

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
  /** the step the nemesis waits on this chapter, and whether that is settled (upgrade 19) */
  nemRow?: number;
  nemOk?: number;
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
  let [lo, hi] = BALANCE.chPct(S.ch);
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
    if (W.tier) it = list.find((x) => x.v === clamp((def.stats[W.k] || 5) + BALANCE.bossStatShift(ch), 1, 14));
    else if (def.picks[W.k] != null) it = list.find((x) => x.n === def.picks[W.k] || x.k === def.picks[W.k]);
    if (!it) it = W.k === 'title' ? list[0] : list[pickW(g.rng, list)];
    set[W.k] = it;
  }
  Object.assign(f, {
    title: TITLES[0],
    maxHp: BALANCE.bossHp(ch, ng),
    bossFx: def.fx,
    phase: def.phase,
    aiSkill: def.aiSkill + ng * 0.05,
    wheelBoss: def.wheelBoss,
    isBoss: true,
    bossTitle: def.title,
    lvl: BALANCE.bossLvl(ch, ng),
  });
  if (ng) for (const k of ['str', 'spd', 'dur', 'iq', 'wm', 'pm'] as const) f.bonus[k] = (f.bonus[k] || 0) + ng * 2;
  tuneUp(g, f, BALANCE.bossTarget(ch, ng), BALANCE.bossTuneCap);
  for (let i = 0; i < BALANCE.easeMax && storyOdds(g, f) < BALANCE.easeBelow; i++) {
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

/**
 * What the encounter option leads to: a line of text (with the mechanics line `fx` when it is kept apart from
 * the joke), a fight, the mystery wheel or a loot spin.
 */
export type EventOutcome = { txt: string; fx?: string } | { fight: 'fight' | 'elite' } | { wheel: true } | { loot: string; bit: number };

/** An encounter as the screen shows it: options with their mechanics lines. */
export interface StoryEventView {
  k: string;
  e: string;
  t: string;
  d: string;
  o: { l: string; s: string; cost?: number; fight?: string; wheel?: number; loot?: string; risk?: number }[];
}

// ---------------------------------------------------------------- chapter-themed encounters (upgrade 20)
const CH_EVENTK: Record<string, ChapterEvent> = Object.fromEntries(CH_EVENTS.map((e) => [e.k, e]));
const pct = (p: number) => `${Math.round(p * 100)}%`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The mechanics of some effects, in words, what you get before what it costs: "+12 coins, lose 10% HP". */
export function fxText(fx: EventFx = {}): string {
  const gain: string[] = [];
  const cost: string[] = [];
  if (fx.coins) (fx.coins > 0 ? gain : cost).push(fx.coins > 0 ? `+${fx.coins} coins` : `lose ${-fx.coins} coins`);
  if (fx.heal) (fx.heal > 0 ? gain : cost).push(fx.heal > 0 ? `heal ${fx.heal}% HP` : `lose ${-fx.heal}% HP`);
  if (fx.fame) (fx.fame > 0 ? gain : cost).push(fx.fame > 0 ? `+${fx.fame} fame` : `lose ${-fx.fame} fame`);
  if (fx.stat) gain.push(`+1 ${STATN[fx.stat]!.toLowerCase()} for good`);
  if (fx.readB) gain.push(`read your next opponent ${pct(fx.readB)} better`);
  if (fx.en) gain.push('full energy in your next fight');
  if (fx.dmgX) gain.push(`+${pct(fx.dmgX - 1)} damage in your next fight`);
  if (fx.revive) gain.push(`get back up once in your next fight, with ${fx.revive}% HP`);
  if (fx.item) gain.push(`a free ${ITEMK[fx.item]!.e} ${ITEMK[fx.item]!.n}`);
  if (fx.cure) gain.push('injuries cured');
  if (fx.blessing) gain.push('a random blessing');
  if (fx.injury) cost.push(fx.injury >= 1 ? 'an injury' : `a ${pct(fx.injury)} chance of an injury`);
  return [...gain, ...cost].join(', ');
}

/** A chapter event option's mechanics line, written from what it does. */
export function optText(o: Pick<ChapterOpt, 'cost' | 'fight' | 'wheel' | 'loot' | 'risk' | 'fx' | 'p' | 'no'>): string {
  let s: string;
  if (o.fight) s = o.fight === 'elite' ? 'An elite fight with guaranteed loot' : 'A fight at your current HP';
  else if (o.wheel) s = 'Spin the mystery wheel';
  else if (o.loot) s = `A loot spin, but a 40% chance it bites for ${o.risk || 0}% HP`;
  else if (o.p != null) s = `${pct(o.p)}: ${fxText(o.fx) || 'nothing'}. ${pct(1 - o.p)}: ${fxText(o.no) || 'nothing'}`;
  else s = cap(fxText(o.fx)) || 'Nothing happens';
  if (!o.cost) return s;
  return o.p != null ? `${o.cost} coins. ${s}` : `${o.cost} coins: ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
}

const viewOf = (ev: ChapterEvent): StoryEventView => ({
  k: ev.k,
  e: ev.e,
  t: ev.t,
  d: ev.d,
  o: ev.o.map((o) => ({ l: o.l, s: optText(o), cost: o.cost, fight: o.fight, wheel: o.wheel, loot: o.loot, risk: o.risk })),
});
/** An encounter by its key: one of the classic twelve or a chapter's own. */
export const eventOf = (k: string): StoryEventView | undefined => SEVENTS.find((e) => e.k === k) ?? (CH_EVENTK[k] && viewOf(CH_EVENTK[k]));

/** Does what some effects say; returns the mechanics line of what happened. */
function applyFx(g: Game, fx: EventFx = {}): string {
  const F = g.F!;
  const extra: string[] = [];
  if (fx.coins) addCoins(g, fx.coins);
  if (fx.heal) {
    if (fx.heal > 0) healS(g, fx.heal);
    else hurtS(g, -fx.heal);
  }
  if (fx.fame) {
    if (fx.fame > 0) extra.push(...gainFame(g, fx.fame));
    else F.fame = Math.max(0, (F.fame || 0) + fx.fame);
  }
  if (fx.stat) applyBonus(F, { k: fx.stat, n: '+1 ' + STATN[fx.stat], e: '📖' });
  const next: Record<string, number> = {};
  for (const k of ['readB', 'en', 'dmgX', 'revive'] as const) if (fx[k]) next[k] = fx[k]!;
  if (Object.keys(next).length) nextBuff(F, next);
  if (fx.item) {
    F.bag = F.bag || {};
    F.bag[fx.item] = (F.bag[fx.item] || 0) + 1;
  }
  if (fx.cure) F.inj = [];
  let s = cap(fxText({ ...fx, injury: undefined, blessing: undefined }));
  if (fx.injury && g.rng() < fx.injury) {
    const j = addInjury(g, F);
    if (j) extra.push(`${j.e} Injury: ${j.n} (${injText(j)})`);
  }
  if (fx.blessing) extra.push(blessing(g));
  if (extra.length) s = [s, ...extra].filter(Boolean).join('. ');
  invalidate(F);
  return s;
}

/** A chapter event option, or its charisma option at index `ev.o.length`. */
function chapterOption(g: Game, ev: ChapterEvent, i: number): EventOutcome {
  if (i === ev.o.length) {
    const t = ev.talk;
    if (t.cost) spend(g, t.cost);
    return { fx: applyFx(g, t.fx), txt: t.txt };
  }
  const o = ev.o[i]!;
  if (o.cost) spend(g, o.cost);
  if (o.fight) return { fight: o.fight };
  if (o.wheel) return { wheel: true };
  if (o.loot) {
    let bit = 0;
    if (g.rng() < 0.4) {
      hurtS(g, o.risk || 0);
      bit = o.risk || 0;
    }
    return { loot: o.loot, bit };
  }
  const win = o.p == null || g.rng() < o.p;
  const fx = applyFx(g, win ? o.fx : o.no);
  const txt = (win ? o.txt : o.noTxt) || '';
  return { fx: fx || 'Nothing happens.', txt };
}

/** Picks the next unseen encounter of this chapter (more often one of the chapter's own, when it has any left). */
export function storyEvent(g: Game): StoryEventView {
  const S = storyOf(g);
  if (BALANCE.themedEvents) {
    const mine = CH_EVENTS.filter((e) => e.ch === S.ch && !(S.used || []).includes(e.k));
    if (mine.length && g.rng() < 0.6) {
      const ev = pick(g.rng, mine);
      S.used = (S.used || []).concat(ev.k);
      return viewOf(ev);
    }
  }
  const pool = SEVENTS.filter((e) => !(S.used || []).includes(e.k));
  const ev = pick(g.rng, pool.length ? pool : SEVENTS);
  S.used = (S.used || []).concat(ev.k);
  return ev;
}
export const eventOptionOk = (g: Game, o: { cost?: number }) => !o.cost || coinsOf(g) >= o.cost;

/** The charisma the card shows (the stat x5). */
export const charismaOf = (g: Game) => numStats(g.F!, ctxOf(g)).cha;
/**
 * An encounter's charisma option (upgrade 17): offered after the normal ones, as option index `ev.o.length`.
 * `ok` is false below the charisma it needs (it still shows, locked, as a tease).
 */
export function talkOf(g: Game, k: string): { o: TalkOption; ok: boolean; have: number } | null {
  const c = CH_EVENTK[k]?.talk;
  const o = EVENT_TALK[k] ?? (c && { need: c.need, l: c.l, s: optText({ fx: c.fx, cost: c.cost }), cost: c.cost, done: c.txt });
  if (!o) return null;
  const have = charismaOf(g);
  return { o, ok: have >= o.need && eventOptionOk(g, o), have };
}

/** What a charisma option does. */
function talk(g: Game, k: string): EventOutcome {
  const F = g.F!;
  const t = EVENT_TALK[k]!;
  if (t.cost) spend(g, t.cost);
  const done = (extra = '') => ({ txt: [t.done, extra].filter(Boolean).join(' ') });
  switch (k) {
    case 'promoter':
      addCoins(g, 25);
      return done('+25 coins.');
    case 'doctor':
      storyOf(g).hp = 100;
      F.inj = [];
      return done();
    case 'street':
      return done(gainFameText(g, 4));
    case 'mystery':
      return done(blessing(g));
    case 'trainer':
      hurtS(g, 30);
      applyBonus(F, { k: 'str', n: '+1 ' + STATN.str, e: '🥋' });
      applyBonus(F, { k: 'spd', n: '+1 ' + STATN.spd, e: '🥋' });
      return done('+1 strength and +1 speed for good (−30% HP).');
    case 'gambler':
      if (g.rng() < 0.7) {
        addCoins(g, 20);
        return { txt: 'They blink first. You win! +20 coins' };
      }
      return { txt: 'They do not blink. You lose anyway. The rings jingle smugly.' };
    case 'shrine':
      healS(g, 40);
      return done('+40% HP.');
    case 'spy':
      nextBuff(F, { readB: 0.25 });
      return done();
    case 'fans':
      addCoins(g, 12);
      return done(`+12 coins. ${gainFameText(g, 5)}`);
    case 'ambush':
      return done(gainFameText(g, 2));
    case 'smith':
      applyBonus(F, { k: 'wm', n: '+1 Weapon mastery', e: '⚒️' });
      return done();
    case 'box':
      return { loot: 'treasure', bit: 0 };
  }
  return done();
}

/** Plays an encounter option (legacy SEVENTS option functions). */
export function eventOption(g: Game, k: string, i: number): EventOutcome {
  if (CH_EVENTK[k]) {
    const r = chapterOption(g, CH_EVENTK[k], i);
    invalidate(g.F!);
    return r;
  }
  const ev = SEVENTS.find((e) => e.k === k)!;
  if (i === ev.o.length) {
    const r = talk(g, k);
    invalidate(g.F!);
    return r;
  }
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
/** A map step's icon, name and line. */
export const nodeOf = (t: NodeKind) => (NODE[t] ?? NODE_MORE[t])!;
export const bossOf = (ch: number) => BOSSES[ch - 1]!;
export const gritLeft = (g: Game) => pl(storyOf(g).grit, 'grit', 'grit');
