import { ARENAS } from '../data/arenas';
import { BOSSES } from '../data/content/story';
import { CONTRACTS } from '../data/content/economy';
import { MUTATORS } from '../data/misc';
import { applyBonus, levelUp } from '../fighter';
import { headToHead, newBattle, type Battle } from '../battle';
import { poolPick } from '../pool';
import { clamp, shuffle } from '../random';
import { deserFighter, serFighter, type CareerFighter, type Json, type SerFighter } from '../save/fighter';
import { addCoins, coinsOf, ctxOf, pl, spend, type Game } from './game';
import { addMasteryWin, award, awardGems, challengeFighter, gainFame, gainXP, invalidate, randomGear, recordMatch, track } from './career';
import { hpTxt, makeBoss, storyEnsure, storyOf } from './story';
import type { FightOutcome, FightResult, FightTier, Step } from './fight';

const commonAfter = (g: Game, won: boolean, O: CareerFighter) => {
  const F = g.F!;
  F.fights = (F.fights || 0) + 1;
  F.rec = F.rec || { w: 0, l: 0 };
  F.rec[won ? 'w' : 'l']++;
  recordMatch(g, won ? F : O, won ? O : F);
};

// ---------------------------------------------------------------- the daily challenge
export interface DailyState {
  date: string;
  opp: SerFighter;
  mut: string | null;
  done: boolean;
  won?: boolean;
  streak: number;
  lastWin: string | null;
}
export const DAILY_TIER: FightTier = { k: 'daily', n: 'Daily challenge', e: '📆', xpW: 0, coins: 0 };

/** Today's challenge: one opponent matched to the active fighter, one twist, one attempt. */
export function dailyState(g: Game): DailyState {
  const p = g.save.profile;
  const cur = p.dc as unknown as DailyState | undefined;
  if (cur && cur.date === g.clock.today) return cur;
  const F = g.F!;
  const prev = (cur || {}) as Partial<DailyState>;
  const ctx = ctxOf(g);
  const o = poolPick(g.pool, 0.3, 0.8, g.rng, undefined, ctx);
  levelUp(o, Math.max(0, F.lvl || 1), g.rng);
  randomGear(o, 2, g.rng);
  for (let i = 0; i < 6; i++) {
    const pr = headToHead(F, o, g.rng, 60, { ctx });
    if (pr > 0.58) {
      applyBonus(o, { k: 'all1', n: '+1 to everything', e: '💪' });
      invalidate(o);
    } else if (pr < 0.4) {
      applyBonus(o, { k: 'curse', n: 'Eased off', e: '🕊️' });
      invalidate(o);
    } else break;
  }
  const dc: DailyState = {
    date: g.clock.today,
    opp: serFighter(o),
    mut: null,
    done: false,
    streak: prev.lastWin === g.clock.yesterday ? prev.streak || 0 : 0,
    lastWin: prev.lastWin || null,
  };
  p.dc = dc as unknown as Json;
  return dc;
}
/** The Play tab line for the daily challenge. */
export function dailyText(g: Game) {
  const p = g.save.profile;
  const all = p.dc as unknown as DailyState | undefined;
  const dc = all && all.date === g.clock.today ? all : null;
  return dc && dc.done ? (dc.won ? `Won today. Streak: ${pl(dc.streak, 'day')}` : 'Done for today') : `Ready${all && all.streak ? `. Streak: ${pl(all.streak, 'day')}` : ''}`;
}
export const mutatorOf = (k: string | null) => MUTATORS.find((m) => m.k === k) || null;
export function setDailyMutator(g: Game, k: string) {
  dailyState(g).mut = k;
}
/** Coins a daily win pays with the current streak. */
export function dailyWinCoins(g: Game) {
  const dc = dailyState(g);
  const streak = (dc.lastWin === g.clock.yesterday ? dc.streak || 0 : 0) + 1;
  return 9 + 2 * Math.min(streak, 5);
}
export const dailyArena = (k: string | undefined) => (k ? ARENAS.find((a) => a.k === k) || null : null);

export function endDailyFight(g: Game, O: CareerFighter, o: FightOutcome): FightResult {
  const F = g.F!;
  const won = o.w === 0;
  commonAfter(g, won, O);
  const dc = dailyState(g);
  const lines: string[] = [];
  const got: FightResult['got'] = [];
  const keys: string[] = [];
  dc.done = true;
  dc.won = won;
  const xp = won ? 20 : 5;
  let coins = 0;
  let fame = 0;
  if (won) {
    track(g, 'wins');
    addMasteryWin(g, F);
    track(g, 'dailies');
    dc.streak = (dc.lastWin === g.clock.yesterday ? dc.streak || 0 : 0) + 1;
    dc.lastWin = g.clock.today;
    coins = 9 + 2 * Math.min(dc.streak, 5);
    fame = 8;
    awardGems(g, 1, lines);
    if (dc.streak >= 5) keys.push('daily5');
    lines.push(`📆 Streak: ${pl(dc.streak, 'day')}`);
  } else {
    dc.streak = 0;
    lines.push('Streak reset. Try again tomorrow');
  }
  gainXP(g, F, xp);
  addCoins(g, coins);
  award(g, keys, got);
  lines.unshift(`+${xp} XP, +${coins} 🪙`);
  lines.push(...gainFame(g, fame));
  const next: Step[] = won ? [{ t: 'loot', table: 'elite' }] : [];
  next.push({ t: 'levelups' }, { t: 'hub' });
  return {
    won,
    big: won ? 'Challenge won' : 'Challenge lost',
    desc: won ? `${F.name} beats ${O.name}.` : `${O.name} takes today's challenge.`,
    lines,
    got,
    next,
    button: 'Continue',
    q: won ? 2 : 0,
    confetti: won,
  };
}

// ---------------------------------------------------------------- boss rush
export interface RushState {
  i: number;
  /** HP carried over, 0-100 */
  hp: number;
}
export const rushOpen = (g: Game) => {
  const F = g.F;
  return !!F && ((F.story && ((F.story.cleared as number[]) || []).includes(2)) || (F.lvl || 1) >= 10);
};
/** Act I bosses, then Act II bosses once chapter 11 is cleared. */
export const rushBosses = (g: Game) => (g.F && g.F.story && ((g.F.story.cleared as number[]) || []).includes(11) ? BOSSES.slice(10, 20) : BOSSES.slice(0, 10));
export const rushTier = (g: Game, R: RushState): FightTier => ({ k: 'rush', n: `Boss rush ${R.i + 1}/${rushBosses(g).length}`, e: '🏃', xpW: 0, coins: 0 });
/** The next boss of the rush, tuned against the HP you carry. */
export function rushBoss(g: Game, R: RushState) {
  storyEnsure(g);
  const set = rushBosses(g);
  const off = BOSSES.indexOf(set[0]!);
  const S = storyOf(g);
  const keep = S.hp;
  S.hp = R.hp;
  const b = makeBoss(g, off + R.i + 1);
  S.hp = keep;
  return { boss: b, def: set[R.i]! };
}
export function endRushFight(g: Game, R: RushState, O: CareerFighter, o: FightOutcome): FightResult {
  const F = g.F!;
  const p = g.save.profile;
  const won = o.w === 0;
  commonAfter(g, won, O);
  const lines: string[] = [];
  const got: FightResult['got'] = [];
  const keys: string[] = [];
  const total = rushBosses(g).length;
  let xp = 6;
  let coins = 0;
  let fame = 0;
  const next: Step[] = [];
  if (won) {
    track(g, 'wins');
    addMasteryWin(g, F);
    track(g, 'bosses');
    R.i++;
    R.hp = Math.min(100, Math.max(1, Math.ceil(o.me.hp)) + 25);
    xp = 10 + R.i * 3;
    coins = 5 * R.i;
    fame = 3 * R.i;
    awardGems(g, 1, lines);
    if (R.i >= total) {
      track(g, 'rushes');
      coins += 90;
      awardGems(g, 10, lines);
      fame += 35;
      xp += 45;
      keys.push('rush');
      p.rushBest = total;
      lines.push('🏆 Every boss is down!');
      next.push({ t: 'loot', table: 'boss' });
    } else {
      lines.push(`Next: boss ${R.i + 1} of ${total}. You'll have ${hpTxt(g, R.hp)} HP`);
      next.push({ t: 'rush' });
    }
  } else {
    p.rushBest = Math.max(p.rushBest || 0, R.i);
    coins = 5 * R.i;
    lines.push(`Run over after ${pl(R.i, 'boss', 'bosses')}. Best: ${p.rushBest}/${total}`);
  }
  gainXP(g, F, xp);
  addCoins(g, coins);
  award(g, keys, got);
  lines.unshift(`+${xp} XP, +${coins} 🪙`);
  lines.push(...gainFame(g, fame));
  const done = R.i >= total;
  if (!won || done) next.push({ t: 'levelups' }, { t: 'hub' });
  return {
    won,
    big: won ? (done ? 'Rush cleared' : 'Boss down') : 'Rush over',
    desc: won ? `${F.name} beats ${O.name}.` : `${O.name} ends the run.`,
    lines,
    got,
    next,
    button: 'Continue',
    q: won ? 2 : 0,
    confetti: won,
  };
}

// ---------------------------------------------------------------- the endless tower (upgrade 25)
/**
 * One fight per floor, each a bit higher up the ranked pool and a level stronger every four floors, HP carried
 * between floors (+30% after a win, a full rest on every fifth floor's landing). From floor 5 on, every block of
 * five floors has a mutator from the daily challenge's list. A loss ends the run; the best floor is kept, for
 * the fighter and for the save.
 */
export interface TowerState {
  /** the floor about to be fought (1 = the first) */
  floor: number;
  /** HP carried, 0-100 */
  hp: number;
  /** picks this run's mutators */
  seed: number;
  /** hearts left: a loss costs one and you try the floor again; the last one ends the climb */
  lives?: number;
}
export const TOWER_FROM = 5;
export const TOWER_LIVES = 3;
export const towerOpen = (g: Game) => !!g.F && ((g.F.lvl || 1) >= TOWER_FROM || !!(g.F.story && ((g.F.story.cleared as number[]) || []).includes(1)));
export const towerTier = (T: TowerState): FightTier => ({ k: 'tower', n: `Tower, floor ${T.floor}`, e: '🗼', xpW: 0, coins: 0 });
/** The mutator on a floor: none on floors 1 to 4, then one per block of five, the same for the whole block. */
export function towerMutator(T: TowerState, floor = T.floor) {
  const block = Math.floor(floor / 5);
  if (!block) return null;
  const r = ((T.seed * 2654435761) ^ (block * 40503)) >>> 0;
  // a few cheap rolls of a tiny hash, weighted like the daily challenge's mutator wheel
  let x = r / 4294967296;
  const total = MUTATORS.reduce((a, m) => a + m.w, 0);
  x *= total;
  for (const m of MUTATORS) {
    if ((x -= m.w) < 0) return m;
  }
  return MUTATORS[MUTATORS.length - 1]!;
}
/** The fighter on a floor. */
export function towerOpponent(g: Game, T: TowerState): CareerFighter {
  const F = g.F!;
  const lo = Math.min(0.92, 0.05 + T.floor * 0.025);
  const o = poolPick(g.pool, lo, Math.min(1, lo + 0.12), g.rng, undefined, ctxOf(g)) as CareerFighter;
  levelUp(o, Math.max(0, (F.lvl || 1) - 3 + Math.floor(T.floor / 4)), g.rng);
  randomGear(o, Math.min(6, 1 + Math.floor(T.floor / 3)), g.rng);
  o.aiSkill = Math.min(0.6, 0.04 * T.floor);
  return o;
}
export interface TowerBest {
  /** the highest floor cleared by anyone, and by whom */
  floor: number;
  who: string;
}
export const towerBest = (g: Game) => ((g.save.profile.extra.tower as unknown as TowerBest | undefined) ?? { floor: 0, who: '' });
export function endTowerFight(g: Game, T: TowerState, O: CareerFighter, o: FightOutcome): FightResult {
  const F = g.F!;
  const won = o.w === 0;
  commonAfter(g, won, O);
  const lines: string[] = [];
  const got: FightResult['got'] = [];
  const keys: string[] = [];
  const next: Step[] = [];
  let xp = 4;
  let coins = 0;
  const best = towerBest(g);
  const cleared = won ? T.floor : T.floor - 1;
  if (won) {
    track(g, 'wins');
    addMasteryWin(g, F);
    xp = 6 + 2 * T.floor;
    coins = 2 + T.floor;
    if (T.floor % 10 === 0) {
      awardGems(g, 1 + T.floor / 10, lines);
      next.push({ t: 'loot', table: 'elite' });
      lines.push(`🗼 Floor ${T.floor}: a landing with a chest on it`);
    }
    T.floor++;
    // a landing every five floors: a full rest before the next twist
    const landing = T.floor % 5 === 0;
    T.hp = landing ? 100 : Math.min(100, Math.max(1, Math.ceil(o.me.hp)) + 30);
    const m = towerMutator(T);
    lines.push(
      `Next: floor ${T.floor}. You'll have ${hpTxt(g, T.hp)} HP${landing ? ' after a rest on the landing' : ''}${landing && m ? `. New twist from here: ${m.e} ${m.n}` : ''}`,
    );
    next.push({ t: 'tower' });
  } else {
    T.lives = (T.lives ?? TOWER_LIVES) - 1;
    if (T.lives > 0) {
      T.hp = 60;
      lines.push(`💔 A heart down, ${pl(T.lives, 'heart')} left. Back up floor ${T.floor} with ${hpTxt(g, T.hp)} HP, against someone new`);
      next.push({ t: 'tower' });
    } else lines.push(`The tower wins on floor ${T.floor}. You cleared ${pl(cleared, 'floor')}`);
  }
  const over = !won && (T.lives ?? 0) <= 0;
  // records: the fighter's own best, and the save's
  F.towerBest = Math.max(F.towerBest || 0, cleared);
  if (cleared > best.floor) {
    g.save.profile.extra.tower = { floor: cleared, who: F.name } as unknown as Json;
    if (over || cleared % 5 === 0) lines.push(`🏅 New tower record: floor ${cleared}`);
  }
  gainXP(g, F, xp);
  addCoins(g, coins);
  award(g, keys, got);
  lines.unshift(`+${xp} XP, +${coins} 🪙`);
  if (over) next.push({ t: 'levelups' }, { t: 'hub' });
  return {
    won,
    big: won ? `Floor ${T.floor - 1} cleared` : over ? 'The tower wins' : 'Knocked down a floor',
    desc: won ? `${F.name} beats ${O.name}.` : `${O.name} ends the climb.`,
    lines,
    got,
    next,
    button: 'Continue',
    q: won ? 2 : 0,
    confetti: won && (T.floor - 1) % 10 === 0,
  };
}

// ---------------------------------------------------------------- fight club
export interface Club {
  A: CareerFighter;
  B: CareerFighter;
  /** A's chance to win */
  pA: number;
  bet: number;
}
export const CLUB_BETS = [5, 10, 25, 50];
/** Payout multiplier for backing a side with chance p: underdogs pay more. */
export const clubMult = (p: number) => Math.round(clamp(0.92 / p, 1.1, 8) * 10) / 10;
/** A new matchup of two pool fighters around your level. */
export function clubMatchup(g: Game): Club {
  const F = g.F!;
  const lv = Math.max(1, F.lvl || 1);
  const ctx = ctxOf(g);
  const mk = () => {
    const o = poolPick(g.pool, 0, 1, g.rng, undefined, ctx);
    levelUp(o, Math.max(0, lv - 1 + Math.floor(g.rng() * 3)), g.rng);
    if (g.rng() < 0.6) randomGear(o, 1 + Math.floor(g.rng() * 2), g.rng);
    return o;
  };
  const A = mk();
  const B = mk();
  const pA = clamp(headToHead(A, B, g.rng, 100, { ctx }), 0.05, 0.95);
  return { A, B, pA, bet: Math.min(10, coinsOf(g)) };
}
/** Places the bet and starts the fight (narrated, so it can be watched). */
export function clubFight(g: Game, c: Club): Battle | null {
  if (c.bet <= 0 || !spend(g, c.bet)) return null;
  return newBattle(c.A, c.B, g.rng, { ctx: ctxOf(g) });
}
/** Pays out a won bet. */
export function clubSettle(g: Game, c: Club, side: 'A' | 'B', w: 0 | 1) {
  const won = (w === 0) === (side === 'A');
  const mult = clubMult(side === 'A' ? c.pA : 1 - c.pA);
  let pay = 0;
  if (won) {
    pay = Math.round(c.bet * mult);
    addCoins(g, pay);
    track(g, 'bets');
    if (mult >= 3) award(g, ['bigbet'], []);
  }
  return { won, pay, mult };
}

// ---------------------------------------------------------------- rival and legend challenges
export function challengeSpec(g: Game) {
  const o = challengeFighter(g);
  const F = g.F!;
  if (!o) {
    F.challenge = null;
    return null;
  }
  const kind = (F.challenge as { kind: string }).kind;
  const tier: FightTier = { k: 'challenge', n: kind === 'legend' ? 'Legend challenge' : 'Rival rematch', e: '⚔️', xpW: 16, coins: 0 };
  return { opp: o, tier };
}
export function declineChallenge(g: Game) {
  g.F!.challenge = null;
}

// ---------------------------------------------------------------- sponsor contracts
/** Three contract offers when the fighter has none. */
export function contractOffers(g: Game): string[] {
  const F = g.F!;
  if (!F.contract && !(F.offers && (F.offers as string[]).length)) F.offers = shuffle(g.rng, CONTRACTS.map((c) => c.k)).slice(0, 3);
  return (F.offers as string[]) || [];
}
export function takeContract(g: Game, k: string) {
  const F = g.F!;
  F.contract = k;
  F.offers = null;
}
export function dropContract(g: Game) {
  const F = g.F!;
  F.contract = null;
  F.offers = null;
}
export { deserFighter };
