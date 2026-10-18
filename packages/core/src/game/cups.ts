import { ARENAS } from '../data/arenas';
import { BONUS } from '../data/misc';
import { TIER_PCT } from '../data/content/story';
import { WHEELS, applyBonus, levelUp } from '../fighter';
import { simulate } from '../battle';
import { poolPick } from '../pool';
import { randName } from '../names';
import { clamp, pickW, shuffle } from '../random';
import { bestStat } from '../stats';
import { deserFighter, serFighter, type CareerFighter, type Json, type SerFighter } from '../save/fighter';
import { ctxOf, slotOf, type Game } from './game';
import { myNemesis, randomGear, recordMatch } from './career';
import { TIERK, cxKey, lookOf } from './lookups';

export type Tier = (typeof TIERK)[string];
export const RNAMES: Record<number, string> = { 2: 'Final', 4: 'Semifinals', 8: 'Quarterfinals', 16: 'Round of 16', 32: 'Round of 32' };
export const RNAME1: Record<number, string> = { 2: 'Final', 4: 'Semifinal', 8: 'Quarterfinal', 16: 'Round of 16', 32: 'Round of 32' };

/** A cup in progress (legacy T). fs[me] is the active fighter. */
export interface Cup {
  kind: 'cup';
  tier: Tier;
  size: number;
  fs: CareerFighter[];
  me: number;
  nem: number;
  rounds: [number, number][][];
  res: (number | null)[][];
  r: number;
  done: boolean;
  champ: number | null;
  out: boolean;
  defending: boolean;
  recorded: boolean;
}
/** A gauntlet run (legacy G). */
export interface Gauntlet {
  kind: 'gauntlet';
  tier: Tier;
  streak: number;
  opp: CareerFighter;
  used: Set<string>;
  over?: boolean;
}
export type Run = Cup | Gauntlet;

/** Which cups are open: Regional from chapter 2 of the story, World from chapter 4. */
export function tierUnlocked(t: Tier, f: CareerFighter) {
  // a hard run (upgrade 26) replays an old chapter: the main story decides
  const st = f.storyMain || f.story;
  const ch = (st && st.ch) || 1;
  if (t.k === 'regional') return ch >= 2;
  if (t.k === 'world') return ch >= 4;
  return true;
}

const pairsOf = (a: number[]) => {
  const o: [number, number][] = [];
  for (let i = 0; i < a.length; i += 2) o.push([a[i]!, a[i + 1]!]);
  return o;
};
export const nameKey = (n: string) => n.split(' ').slice(0, 2).join(' ').toLowerCase();
function freshName(g: Game, used: Set<string>) {
  let n: string;
  do n = randName(g.rng);
  while (used.has(nameKey(n)));
  used.add(nameKey(n));
  return n;
}

/** Enters a cup: a bracket of pool fighters around your level, your nemesis on the other side. */
export function startCup(g: Game, k: string): Cup {
  const F = g.F!;
  const tier = TIERK[k]!;
  g.save.profile.entered++;
  const n = tier.size;
  const used = new Set([nameKey(F.name)]);
  let nem: CareerFighter | null = null;
  const NM = myNemesis(g);
  if (NM) {
    nem = deserFighter(NM.f);
    if (nem) {
      nem.isNem = true;
      used.add(nameKey(nem.name));
    }
  }
  const others: CareerFighter[] = [];
  const base = tier.lvl + Math.floor(((F.lvl || 1) - 1) / 2);
  const ctx = ctxOf(g);
  while (others.length < n - 1 - (nem ? 1 : 0)) {
    const pr = TIER_PCT[tier.k] || [0, 1];
    const o = poolPick(g.pool, pr[0], pr[1], g.rng, freshName(g, used), ctx);
    levelUp(o, base + Math.floor(g.rng() * 2), g.rng);
    if (tier.k === 'regional' && g.rng() < 0.6) randomGear(o, 1, g.rng);
    if (tier.k === 'world') randomGear(o, g.rng() < 0.5 ? 2 : 1, g.rng);
    others.push(o);
  }
  const shuffled = shuffle(g.rng, others);
  const half = n / 2;
  const slots: (CareerFighter | null)[] = new Array(n).fill(null);
  const mySlot = Math.floor(g.rng() * half);
  slots[mySlot] = F;
  if (nem) slots[half + Math.floor(g.rng() * half)] = nem;
  for (let i = 0; i < n; i++) if (!slots[i]) slots[i] = shuffled.pop()!;
  const fs = slots as CareerFighter[];
  const T: Cup = {
    kind: 'cup',
    tier,
    size: n,
    fs,
    me: mySlot,
    nem: nem ? fs.indexOf(nem) : -1,
    rounds: [pairsOf([...Array(n).keys()])],
    res: [new Array(n / 2).fill(null)],
    r: 0,
    done: false,
    champ: null,
    out: false,
    defending: !!(F.belts && F.belts[tier.k]),
    recorded: false,
  };
  saveRun(g, T);
  return T;
}

export function myMatch(T: Cup) {
  const ms = T.rounds[T.r]!;
  for (let i = 0; i < ms.length; i++) if (ms[i]!.includes(T.me)) return i;
  return -1;
}
/** Index of the active fighter's next opponent. */
export function cupOpponent(T: Cup) {
  const m = T.rounds[T.r]![myMatch(T)]!;
  return m[0] === T.me ? m[1] : m[0];
}
function matchWinner(g: Game, T: Cup, a: number, b: number) {
  const A = T.fs[a]!;
  const B = T.fs[b]!;
  const ctx = ctxOf(g);
  const w = simulate(A, B, g.rng, { arena: ARENAS[pickW(g.rng, ARENAS)], ctx }) === 0 ? a : b;
  recordMatch(g, T.fs[w]!, T.fs[w === a ? b : a]!);
  return w;
}
function closeRound(g: Game, T: Cup) {
  const r = T.r;
  const last = T.rounds[r]!.length === 1;
  if (!last)
    T.res[r]!.forEach((wi) => {
      if (wi !== T.me) applyBonus(T.fs[wi!]!, BONUS[pickW(g.rng, BONUS)]!);
    });
  if (last) {
    T.done = true;
    T.champ = T.res[r]![0]!;
    return;
  }
  T.rounds.push(pairsOf(T.res[r] as number[]));
  T.res.push(new Array(T.res[r]!.length / 2).fill(null));
  T.r++;
}
/** Records the active fighter's match and simulates the rest of the round. */
export function resolveMyRound(g: Game, T: Cup, winnerIdx: number) {
  const r = T.r;
  const mi = myMatch(T);
  const m = T.rounds[r]![mi]!;
  T.res[r]![mi] = winnerIdx;
  recordMatch(g, T.fs[winnerIdx]!, T.fs[m[0] === winnerIdx ? m[1] : m[0]]!);
  T.rounds[r]!.forEach((mm, i) => {
    if (i !== mi) T.res[r]![i] = matchWinner(g, T, mm[0], mm[1]);
  });
  closeRound(g, T);
}
export function simRest(g: Game, T: Cup) {
  while (!T.done) {
    const r = T.r;
    T.rounds[r]!.forEach((m, i) => {
      T.res[r]![i] = matchWinner(g, T, m[0], m[1]);
    });
    closeRound(g, T);
  }
}
/** The finished bracket's top four feed the reincarnation wheel; a cup win counts toward champion picks. */
export function recordCup(g: Game, T: Cup) {
  if (!T.done || T.recorded) return;
  T.recorded = true;
  const p = g.save.profile;
  const ctx = ctxOf(g);
  const L = T.rounds.length - 1;
  const finals = T.rounds[L]![0]!;
  const semis = L >= 1 ? T.rounds[L - 1]!.flat() : finals;
  p.lastTop = semis.map((i) => ({ n: T.fs[i]!.name, best: bestStat(T.fs[i]!, ctx), place: i === T.champ ? 1 : finals.includes(i) ? 2 : 3, look: lookOf(T.fs[i]!) })) as unknown as Json[];
  if (T.champ === T.me) {
    const F = g.F!;
    for (const W of WHEELS) {
      if (!['race', 'rsub', 'arch', 'asub', 'weapon', 'power'].includes(W.k)) continue;
      const it = F[W.k] as { n: string; skip?: unknown } | undefined;
      if (!it || it.skip) continue;
      const id = W.k + '|' + cxKey(W.k, it, F);
      p.champIds[id] = ((p.champIds[id] as number) || 0) + 1;
    }
  }
}

// ---------------------------------------------------------------- the gauntlet
export function startGauntlet(g: Game): Gauntlet {
  const G: Gauntlet = { kind: 'gauntlet', tier: TIERK.gauntlet!, streak: 0, opp: null as unknown as CareerFighter, used: new Set([nameKey(g.F!.name)]) };
  nextGauntletOpp(g, G);
  saveRun(g, G);
  return G;
}
/** The next gauntlet opponent: tougher every two wins, geared up from four. */
export function nextGauntletOpp(g: Game, G: Gauntlet) {
  const F = g.F!;
  const o = poolPick(g.pool, clamp(0.1 + G.streak * 0.05, 0, 0.9), clamp(0.3 + G.streak * 0.05, 0.2, 1), g.rng, freshName(g, G.used), ctxOf(g));
  levelUp(o, Math.floor(G.streak / 2) + Math.floor(((F.lvl || 1) - 1) / 2), g.rng);
  if (G.streak >= 4) randomGear(o, G.streak >= 8 ? 2 : 1, g.rng);
  G.opp = o;
}

// ---------------------------------------------------------------- an unfinished run survives closing the app
export function saveRun(g: Game, T: Run | null) {
  const s = slotOf(g);
  if (!s) return;
  if (!T || !g.F || !g.F.career) {
    s.tourney = null;
    return;
  }
  if (T.kind === 'gauntlet') s.tourney = !T.over ? { g: 1, streak: T.streak, opp: serFighter(T.opp) as unknown as Json } : null;
  else if (T.done || T.out) s.tourney = null;
  else
    s.tourney = {
      k: T.tier.k,
      size: T.size,
      me: T.me,
      nem: T.nem,
      fs: T.fs.map((f, i) => (i === T.me ? null : (serFighter(f) as unknown as Json))),
      rounds: T.rounds as unknown as Json,
      res: T.res as unknown as Json,
      r: T.r,
      defending: !!T.defending,
    };
}
export function loadRun(g: Game): Run | null {
  const s = slotOf(g);
  const d = s?.tourney as Record<string, unknown> | null | undefined;
  if (!s || !d || !g.F) return null;
  try {
    if (d.g) {
      const o = deserFighter(d.opp as SerFighter);
      if (!o) throw new Error('opp');
      return { kind: 'gauntlet', tier: TIERK.gauntlet!, streak: (d.streak as number) || 0, opp: o, used: new Set([nameKey(g.F.name), nameKey(o.name)]) };
    }
    const fs = (d.fs as (SerFighter | null)[]).map((o, i) => (i === d.me ? g.F : deserFighter(o)));
    if (fs.some((f) => !f) || !TIERK[d.k as string]) throw new Error('fighters');
    return {
      kind: 'cup',
      tier: TIERK[d.k as string]!,
      size: d.size as number,
      fs: fs as CareerFighter[],
      me: d.me as number,
      nem: d.nem as number,
      rounds: d.rounds as [number, number][][],
      res: d.res as (number | null)[][],
      r: d.r as number,
      done: false,
      champ: null,
      out: false,
      defending: !!d.defending,
      recorded: false,
    };
  } catch {
    s.tourney = null;
    return null;
  }
}
/** Describes the unfinished run on the Play tab. */
export function runSummary(g: Game): { e: string; n: string; sub: string } | null {
  const d = slotOf(g)?.tourney as Record<string, unknown> | null | undefined;
  if (!d) return null;
  const tn = d.g ? TIERK.gauntlet : TIERK[d.k as string];
  const streak = (d.streak as number) || 0;
  return {
    e: tn ? tn.e : '🏆',
    n: tn ? tn.n : 'Tournament',
    sub: d.g ? `${streak} ${streak === 1 ? 'win' : 'wins'} in a row so far` : `Up next: ${RNAMES[(d.size as number) >> (d.r as number)] || 'the next round'}`,
  };
}
export function abandonRun(g: Game) {
  const s = slotOf(g);
  if (s) s.tourney = null;
}
