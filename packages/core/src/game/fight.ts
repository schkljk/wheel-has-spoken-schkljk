import { ARENAS } from '../data/arenas';
import { CHAPTERS } from '../data/content/story';
import { FAME_CUP, FAME_WIN } from '../data/content/progression';
import { headToHead, newBattle, type Battle, type BattleOpts, type Side } from '../battle';
import { activePower, fullName, talEcon } from '../stats';
import { lgLvl } from '../save/career';
import type { CareerFighter, Json } from '../save/fighter';
import type { Arena } from '../types';
import type { FightMod } from '../data/misc';
import { addCoins, coinsOf, ctxOf, pl, slotOf, type Game } from './game';
import {
  addInjury,
  addMasteryWin,
  award,
  awardGems,
  champEntry,
  champsOf,
  gainFame,
  gainXP,
  injText,
  invalidate,
  markSeen,
  pruneDB,
  recordMatch,
  rivalsOf,
  rollSeason,
  setNemesis,
  tickInjuries,
  track,
  trackMax,
  type Nemesis,
} from './career';
import { ACHK, CONTRACTK } from './lookups';
import { RNAME1, nextGauntletOpp, recordCup, resolveMyRound, saveRun, simRest, type Cup, type Gauntlet, type Tier } from './cups';
import { LASTCH, hpTxt, newChapter, storyOf } from './story';
import { nemFought, storyNemesisEnd } from './nemesis';
import { noteBelt, noteBoss } from './trophies';
import { endHard } from './hard';
import { seasonalNow } from './seasonal';
import { MUTATORS } from '../data/misc';
import type { LootTable, OddsNote, WheelEntry } from './economy';
import { rating } from './rating';

export type FightKind = 'cup' | 'gauntlet' | 'challenge' | 'story' | 'daily' | 'rush' | 'tower';
export interface FightTier {
  k: string;
  n: string;
  e: string;
  xpW: number;
  coins: number;
}
/** Everything about the fight about to happen (legacy T, curOppF, curArena, curOdds). */
export interface FightSpec {
  kind: FightKind;
  tier: FightTier | Tier;
  opp: CareerFighter;
  /** story node */
  node?: 'fight' | 'elite' | 'boss' | 'nemesis';
  run?: Cup | Gauntlet;
  /** boss rush HP carried between fights (0-100) */
  rushHp?: number;
  /** daily challenge mutator */
  mut?: { mods: [FightMod, FightMod]; arena?: string };
  arena: Arena | null;
  /** chance to win from simulations, fixed when the fight opens */
  odds: number;
}

/** The header label of a fight. */
export function fightLabel(spec: FightSpec) {
  if (spec.kind === 'cup') {
    const T = spec.run as Cup;
    return RNAME1[T.size >> T.r]!;
  }
  if (spec.kind === 'gauntlet') return `Gauntlet fight ${(spec.run as Gauntlet).streak + 1}`;
  return spec.tier.n;
}

// ---------------------------------------------------------------- the arena wheel
/** The arena wheel: fighters' elements pull matching arenas; the last arena is less likely. */
export function arenaOdds(g: Game, A: CareerFighter, B: CareerFighter): { list: WheelEntry<Arena>[]; reasons: OddsNote[] } {
  const list = ARENAS.map((it) => ({ it, w: it.w, mult: 1 }));
  const reasons: OddsNote[] = [];
  // calendar-themed arenas in their season (upgrade 27)
  for (const it of seasonalNow(g)) {
    list.push({ it, w: it.w, mult: 1 });
    reasons.push({ cls: 'up', txt: `${it.e} ${it.n} is in season` });
  }
  for (const f of [A, B]) {
    const tags = new Set([...(activePower(f) ? f.power.t : []), ...f.weapon.t, ...(f.ench.t || [])]);
    let hit = false;
    list.forEach((e) => {
      const tm = (e.it.tag || {}) as Record<string, number>;
      if ([...tags].some((t) => tm[t]! > 1)) {
        e.mult *= 1.6;
        hit = true;
      }
    });
    if (hit) reasons.push({ cls: 'up', txt: `${f.race.e} ${f.name}'s element pulls matching arenas ×1.6` });
  }
  const last = g.save.profile.lastArena;
  if (last) {
    const e = list.find((x) => x.it.k === last);
    if (e) {
      e.mult *= 0.5;
      reasons.push({ cls: 'down', txt: `${e.it.e} ${e.it.n} was the last arena ×0.5` });
    }
  }
  list.forEach((e) => {
    e.w = e.it.w * e.mult;
  });
  return { list, reasons };
}
export function arenaLand(g: Game, it: Arena) {
  markSeen(g, 'arena', it.n);
  g.save.profile.lastArena = it.k;
}

// ---------------------------------------------------------------- fight setup
/** Per-fighter fight modifiers: next-fight buffs, story or rush HP, the daily mutator, boss HP. */
export function fightMods(g: Game, spec: Pick<FightSpec, 'kind' | 'opp' | 'rushHp' | 'mut'>): [FightMod, FightMod] {
  const F = g.F!;
  const m0 = { ...((F.next as FightMod) || {}) } as FightMod & { halfHp?: number };
  const m1: FightMod = spec.opp && spec.opp.maxHp ? { maxHp: spec.opp.maxHp } : {};
  if (spec.kind === 'story') {
    const S = storyOf(g);
    m0.hp = S.hp;
    if (m0.halfHp) m0.hp = Math.max(1, Math.ceil(S.hp / 2));
    // a hard run's twist holds for every fight in it (upgrade 26)
    const hm = S.hard && MUTATORS.find((m) => m.k === S.hard!.mut);
    if (hm) {
      Object.assign(m0, hm.mods[0]);
      Object.assign(m1, hm.mods[1]);
    }
  }
  if ((spec.kind === 'rush' || spec.kind === 'tower') && spec.rushHp != null) m0.hp = spec.rushHp;
  if ((spec.kind === 'daily' || spec.kind === 'tower') && spec.mut) {
    Object.assign(m0, spec.mut.mods[0]);
    Object.assign(m1, spec.mut.mods[1]);
  }
  return [m0, m1];
}

/** Round limits: bosses get 30 rounds and sudden death; elites, legends and cup finals get 20. */
export function fightRules(spec: Pick<FightSpec, 'kind' | 'node' | 'opp' | 'run' | 'tier'>): Pick<BattleOpts, 'maxRounds' | 'suddenDeath'> {
  if (spec.kind === 'rush' || (spec.kind === 'story' && spec.node === 'boss')) return { maxRounds: 30, suddenDeath: true };
  if (spec.kind === 'story' && (spec.node === 'elite' || spec.node === 'nemesis')) return { maxRounds: 20 };
  if (spec.kind === 'challenge' && spec.opp && spec.opp.isRival === 'legend') return { maxRounds: 20 };
  if (spec.kind === 'cup') {
    const T = spec.run as Cup;
    if (T.rounds[T.r] && T.rounds[T.r]!.length === 1) return { maxRounds: spec.tier.k === 'world' ? 30 : 20 };
  }
  return {};
}

/** Simulated chance to win, shown before the fight (120 fights at the fight's HP, default round limit). */
export const fightOdds = (g: Game, spec: Omit<FightSpec, 'odds'>) => headToHead(g.F!, spec.opp, g.rng, 120, { arena: spec.arena, mods: fightMods(g, spec), ctx: ctxOf(g) });

/** Starts the battle; next-fight buffs are used up. */
export function startBattle(g: Game, spec: FightSpec): Battle {
  const F = g.F!;
  const bt = newBattle(F, spec.opp, g.rng, { arena: spec.arena, mods: fightMods(g, spec), ctx: ctxOf(g), ...fightRules(spec) });
  F.next = null;
  return bt;
}

// ---------------------------------------------------------------- after the fight
/** What the fight left behind, for the results. */
export interface FightOutcome {
  w: 0 | 1;
  /** the player's side at the end */
  me: Side;
  /** the opponent's side at the end (newer callers) */
  them?: Side;
  round: number;
  /** ended in sudden death */
  sd: boolean;
}
export type Step =
  | { t: 'loot'; table: LootTable }
  | { t: 'reward' }
  | { t: 'event' }
  | { t: 'levelups' }
  | { t: 'celebrate'; icon: string; title: string; sub: string }
  | { t: 'map' }
  | { t: 'hub' }
  | { t: 'bracket' }
  | { t: 'gauntlet' }
  | { t: 'rush' }
  | { t: 'tower' };
export interface FightResult {
  won: boolean;
  big: string;
  desc: string;
  lines: string[];
  got: (typeof ACHK)[string][];
  /** what happens after the results, in order */
  next: Step[];
  /** label of the button that starts `next` */
  button: string;
  /** cups: offer a look at how the bracket ended */
  bracket?: boolean;
  /** sound and celebration: 0 lost, 2 won, 3 big win */
  q: 0 | 2 | 3;
  confetti: boolean;
}

/** Achievement keys every fight can earn. */
function fightKeys(won: boolean, o: FightOutcome, odds: number, F: CareerFighter, keys: string[]) {
  const me = o.me;
  if (won && odds < 0.35) keys.push('giant');
  if (won && me.hp < 10) keys.push('comeback');
  if (won && me.st.taken < 0.5) keys.push('flawless');
  if (won && o.round <= 1) keys.push('onepunch');
  if (me.st.dodges >= 3) keys.push('untouch');
  if (me.st.rps >= 4) keys.push('reader');
  if (me.st.combos >= 3) keys.push('combo');
  return F;
}

/** Sponsor contract check. Returns the contract if it was completed. */
function contractDone(g: Game, spec: FightSpec, o: FightOutcome, won: boolean, extra: { semis?: boolean; streak?: boolean }) {
  const F = g.F!;
  if (!F.contract || !CONTRACTK[F.contract as string]) return null;
  const c = CONTRACTK[F.contract as string]!;
  const me = o.me;
  const AR = (spec.arena || {}) as Partial<Arena> & { hazard?: unknown; sunBurn?: unknown };
  const ok: Record<string, boolean> = {
    combo2: me.st.combos >= 2,
    reads3: me.st.rps >= 3,
    clean: won && me.st.taken < 25,
    upset: won && spec.odds < 0.45,
    quick: won && o.round <= 3,
    ults: me.st.ults >= 2,
    wall: won && me.st.guards >= 3,
    hazard: won && !!(AR.hazard || AR.sunBurn),
    bigger: won && (spec.opp.lvl || 1) >= (F.lvl || 1) + 2,
  };
  if (spec.kind !== 'story') {
    ok.semis = !!extra.semis;
    ok.streak = !!extra.streak;
  }
  if (!ok[c.k]) return null;
  F.contract = null;
  F.offers = null;
  return c;
}

/** Cups, the gauntlet and challenges (legacy endFight). */
export function endTierFight(g: Game, spec: FightSpec, o: FightOutcome): FightResult {
  const F = g.F!;
  const s = slotOf(g)!;
  const won = o.w === 0;
  const O = spec.opp;
  if (won) {
    track(g, 'wins');
    addMasteryWin(g, F);
  }
  const gaunt = spec.kind === 'gauntlet';
  const chal = spec.kind === 'challenge';
  const T = spec.kind === 'cup' ? (spec.run as Cup) : null;
  const G = gaunt ? (spec.run as Gauntlet) : null;
  const tier = spec.tier;
  const rIdx = T ? T.r : 0;
  F.fights = (F.fights || 0) + 1;
  F.rec = F.rec || { w: 0, l: 0 };
  F.rec[won ? 'w' : 'l']++;
  const lines: string[] = [];
  const got: FightResult['got'] = [];
  const keys: string[] = [];
  let xp = won ? (gaunt ? 8 : tier.xpW) : 4;
  let coins = won ? (gaunt ? 1 : 2) : 0;
  let fame = won ? FAME_WIN[chal ? 'challenge' : gaunt ? 'gauntlet' : tier.k] || 0 : 0;
  let nemBeaten = false;
  if (O.isNem && won) {
    nemBeaten = true;
    s.nemesis = null;
    coins += 6;
    xp += 10;
    lines.push('😈 Nemesis defeated: +6 🪙, +10 XP');
  }
  if (!won && !chal) {
    setNemesis(g, O);
    nemFought(g, O, false, o, gaunt ? 'the gauntlet' : `the ${tier.n}`);
    lines.push(`😈 ${O.name} is now your nemesis`);
  }
  if (!won && g.rng() < 0.35) {
    const j = addInjury(g, F);
    if (j) lines.push(`${j.e} Injury: ${j.n} (${injText(j)})`);
  }
  fightKeys(won, o, spec.odds, F, keys);
  if (nemBeaten) keys.push('revenge');
  if ((F.fights || 0) >= 25) keys.push('iron');
  let tWon = false;
  if (chal) {
    recordMatch(g, won ? F : O, won ? O : F);
    if (won) {
      coins += 6;
      if (O.isRival === 'legend') awardGems(g, 2, lines);
      keys.push(O.isRival === 'legend' ? 'surpass' : 'oldscore');
      if (O.isRival === 'rival') g.save.roster.rivals = rivalsOf(g).filter((r) => r.f.name !== O.name) as unknown as Json[];
      // legacy said +10 here although the challenge paid 6
      lines.push('⚔️ Challenge won: +6 🪙');
    } else lines.push(`⚔️ ${O.name} wins this one. They might come back`);
    F.challenge = null;
  } else if (G) {
    recordMatch(g, won ? F : O, won ? O : F);
    if (won) {
      G.streak++;
      trackMax(g, 'gauntletBest', G.streak);
      if (G.streak >= 10) keys.push('gauntlet');
    } else {
      G.over = true;
      if (G.streak > (F.gbest || 0)) F.gbest = G.streak;
      if (G.streak > g.save.profile.gbest) g.save.profile.gbest = G.streak;
      lines.push(`🔥 Gauntlet over: ${G.streak} in a row`);
      tickInjuries(F);
      F.tourneys = (F.tourneys || 0) + 1;
    }
  } else if (T) {
    const oi = T.rounds[T.r]![T.rounds[T.r]!.findIndex((m) => m.includes(T.me))]!;
    const opp = oi[0] === T.me ? oi[1] : oi[0];
    if (won) resolveMyRound(g, T, T.me);
    else {
      resolveMyRound(g, T, opp);
      T.out = true;
      simRest(g, T);
    }
    if (T.done) {
      tWon = T.champ === T.me;
      finishCup(g, T, tWon, keys, lines);
      if (tWon) {
        coins += tier.coins;
        fame += FAME_CUP[tier.k] || 0;
        track(g, 'cups');
        if (tier.k === 'world') track(g, 'worlds');
        awardGems(g, tier.k === 'world' ? 3 : tier.k === 'regional' ? 1 : 0, lines);
      }
    }
  }
  const semis = !!T && won && !T.done && !!T.rounds[T.r] && T.rounds[T.r]!.length <= 2;
  const c = contractDone(g, spec, o, won, { semis: semis || tWon, streak: !!G && won && G.streak >= 3 });
  if (c) {
    coins += c.coins;
    xp += c.xp;
    lines.push(`📜 Contract done: ${c.e} ${c.n}, +${c.coins} 🪙, +${c.xp} XP`);
  }
  gainXP(g, F, xp);
  if ((F.lvl || 1) >= 10) keys.push('lvl10');
  addCoins(g, coins);
  award(g, keys, got);
  if (nemBeaten) fame += 5;
  lines.push(...gainFame(g, fame));
  if (fame) lines.push(`⭐ +${fame} fame`);
  if (F.pendingLv) lines.push(`⬆️ Level ${F.lvl} reached`);
  lines.unshift(`+${xp} XP, +${coins} 🪙${got.length ? `, +${got.length * 3} 🪙 for new titles` : ''}`);
  invalidate(F);
  let big: string;
  let desc: string;
  if (chal) {
    big = won ? 'Challenge won' : 'Challenge lost';
    desc = won ? `${F.name} beats ${O.name}.` : `${O.name} still has it. Train up and try again.`;
  } else if (G) {
    big = won ? `${G.streak} in a row` : 'Gauntlet over';
    desc = won ? `${F.name} keeps going.` : `${O.name} ends the run. Who's next? 💀`;
  } else if (tWon) {
    big = 'Champion';
    desc = `${fullName(F)} won the ${tier.n}. 👹`;
  } else if (won) {
    big = `${RNAME1[T!.size >> rIdx]} won`;
    desc = `${F.name} advances.`;
  } else {
    big = 'Eliminated';
    desc = `${O.name} sends ${F.name} home.${T && T.done && T.champ != null ? ` ${T.fs[T.champ]!.name} went on to win it all.` : ''} Who's next? 💀`;
  }
  const next: Step[] = [];
  let button = 'Back to your fighter';
  let bracket = false;
  if (G) {
    if (won) {
      if (G.streak % 3 === 0) next.push({ t: 'event' });
      next.push({ t: 'levelups' });
      nextGauntletOpp(g, G);
      next.push({ t: 'gauntlet' });
      button = 'Keep going';
    } else next.push({ t: 'levelups' }, { t: 'hub' });
  } else if (won && T && !T.done) {
    next.push({ t: 'event' }, { t: 'levelups' }, { t: 'bracket' });
    button = 'Spin the event wheel';
  } else {
    next.push({ t: 'levelups' }, { t: 'hub' });
    bracket = !!T;
  }
  if (T || G) saveRun(g, (T || G)!);
  return { won, big, desc, lines, got, next, button, bracket, q: won ? (tWon ? 3 : 2) : 0, confetti: tWon || (!!G && won && G.streak % 5 === 0) };
}

/** A cup is over: belts, the hall of fame, injuries heal a little, and every third cup a new season. */
function finishCup(g: Game, T: Cup, won: boolean, keys: string[], lines: string[]) {
  const F = g.F!;
  const p = g.save.profile;
  const tier = T.tier;
  F.tourneys = (F.tourneys || 0) + 1;
  tickInjuries(F);
  recordCup(g, T);
  F.belts = F.belts || {};
  if (won) {
    noteBelt(g, tier.k, F);
    p.won++;
    if (T.defending) {
      F.defenses = (F.defenses || 0) + 1;
      keys.push('defender');
      lines.push(`🛡️ Title defended (${F.defenses} so far)`);
    }
    F.belts[tier.k] = true;
    if (tier.k === 'regional') keys.push('regional');
    if (tier.k === 'world') keys.push('world');
    if (winRateOf(g, F) < 0.35) keys.push('underdog');
    if (F.race.n === 'Pigeon') keys.push('pigeon');
    champsOf(p).unshift(
      champEntry(g, F, `${tier.n}. Level ${F.lvl} ${F.race.n.toLowerCase()} ${F.arch.n.toLowerCase()}`, ({ local: 1, regional: 2, world: 3 } as Record<string, number>)[tier.k]! * 10 + (F.lvl || 1)),
    );
    pruneDB(g);
    lines.push(`🏆 ${tier.n} champion: +${tier.coins} 🪙`);
  } else if (T.defending) {
    F.belts[tier.k] = false;
    lines.push(`💔 Lost the ${tier.n} belt`);
  }
  p.season.tourneys = (p.season.tourneys || 0) + 1;
  if (p.season.tourneys >= 3) {
    rollSeason(g);
    lines.push(`📜 Season ${p.season.n} starts. The patch notes are waiting at your fighter's page`);
  }
}
const winRateOf = (g: Game, f: CareerFighter) => rating.winRate(f, ctxOf(g));

// ---------------------------------------------------------------- story fights
/** After a story fight (legacy storyEndFight). */
export function endStoryFight(g: Game, spec: FightSpec, o: FightOutcome): FightResult {
  const F = g.F!;
  const S = storyOf(g);
  const p = g.save.profile;
  const won = o.w === 0;
  const O = spec.opp;
  const me = o.me;
  const node = spec.node!;
  const ch = S.ch;
  F.fights = (F.fights || 0) + 1;
  F.rec = F.rec || { w: 0, l: 0 };
  F.rec[won ? 'w' : 'l']++;
  recordMatch(g, won ? F : O, won ? O : F);
  const lines: string[] = [];
  const got: FightResult['got'] = [];
  const keys: string[] = [];
  let xp = won ? { fight: 8, elite: 14, boss: 30, nemesis: 14 }[node] + ch * 2 : 4;
  let coins = won ? { fight: 2, elite: 4, boss: 14, nemesis: 4 }[node] + Math.floor(ch / 2) : 0;
  let fame = won ? { fight: 2, elite: 5, boss: 20, nemesis: 5 }[node] + ch : 0;
  if (won) {
    S.hp = Math.min(100, Math.max(1, Math.ceil(me.hp)) + 10);
    if (spec.odds < 0.35) keys.push('giant');
    if (me.hp < 10) keys.push('comeback');
    if (me.st.taken < 0.5) keys.push('flawless');
    if (o.round <= 1) keys.push('onepunch');
  } else {
    S.grit--;
    S.hp = 60;
    lines.push(`💔 You lose a grit. ${pl(S.grit, 'grit', 'grit')} left`);
    if (g.rng() < 0.3) {
      const j = addInjury(g, F);
      if (j) lines.push(`${j.e} Injury: ${j.n} (${injText(j)})`);
    }
  }
  if (me.st.dodges >= 3) keys.push('untouch');
  if (me.st.rps >= 4) keys.push('reader');
  if (me.st.combos >= 3) keys.push('combo');
  if ((F.fights || 0) >= 25) keys.push('iron');
  const c = contractDone(g, spec, o, won, {});
  if (c) {
    coins += c.coins;
    xp += c.xp;
    fame += 4;
    lines.push(`📜 Contract done: ${c.e} ${c.n}, +${c.coins} 🪙, +${c.xp} XP`);
  }
  const nem = storyNemesisEnd(g, node, O, o, lines, keys);
  xp += nem.xp;
  coins += nem.coins;
  fame += nem.fame;
  if (won) coins = Math.round((coins + 2 * talEcon(F, 'coins')) * (1 + 0.25 * talEcon(F, 'gold')));
  // a hard run (upgrade 26): half again the coins, and its own way to end
  const hard = !!S.hard;
  if (hard) coins = Math.round(coins * 1.5);
  let hardDone = false;
  let hardOut = false;
  let cleared = false;
  let reset = false;
  const trust = lgLvl(p, 'trust');
  if (hard && won && node === 'boss') {
    hardDone = true;
    coins += 10 + ch * 2;
    lines.push(`🔥 Chapter ${ch} beaten on hard: ${CHAPTERS[ch - 1]!.n}. Your story is right where you left it`);
  } else if (hard && !won && S.grit <= 0) {
    hardOut = true;
    lines.push(`🔥 Out of grit. The hard run ends, no coins lost. Your story is right where you left it`);
  } else if (won && node === 'boss') {
    noteBoss(g, ch, F);
    cleared = true;
    keys.push('story' + ch);
    S.cleared = (S.cleared || []).concat(ch);
    lines.push(`👑 Chapter ${ch} cleared: ${CHAPTERS[ch - 1]!.n}`);
    if (trust) {
      coins += 10 * trust;
      lines.push(`🏦 Trust fund: +${10 * trust} 🪙`);
    }
    if (ch === LASTCH) {
      champsOf(p).unshift(champEntry(g, F, `Beat the Wheelmaster${S.ng ? ' (encore ' + S.ng + ')' : ''}. Level ${F.lvl} ${F.race.n.toLowerCase()}`, 60 + (F.lvl || 1) + (S.ng || 0) * 10));
      pruneDB(g);
    }
  } else if (!won && S.grit <= 0) {
    reset = true;
    const lost = Math.floor(coinsOf(g) * 0.25);
    addCoins(g, -lost);
    lines.push(`☠️ Out of grit. Chapter ${ch} starts over on a new path${lost ? `, and you drop ${lost} 🪙` : ''}`);
  }
  gainXP(g, F, xp);
  addCoins(g, coins);
  award(g, keys, got);
  lines.unshift(`+${xp} XP, +${coins} 🪙`);
  if (won) awardGems(g, (node === 'boss' ? 2 + Math.floor(ch / 3) + (hard ? 3 : 0) : node === 'elite' || node === 'nemesis' ? 1 : 0) + (o.sd ? 1 : 0), lines);
  if (won) {
    track(g, 'wins');
    addMasteryWin(g, F);
    if (node === 'elite') track(g, 'elites');
    if (node === 'boss') track(g, 'bosses');
  }
  if (cleared) track(g, 'chapters');
  lines.push(...gainFame(g, fame));
  if (fame) lines.push(`⭐ +${fame} fame`);
  // move along the map
  if (hardDone || hardOut) endHard(g, hardDone);
  else if (cleared) {
    let nxt = ch < LASTCH ? ch + 1 : LASTCH;
    const ng = ch < LASTCH ? S.ng : (S.ng || 0) + 1;
    if (ch < LASTCH) while (nxt < LASTCH && (S.cleared || []).includes(nxt) && !S.ng) nxt++;
    F.story = { ...newChapter(g, nxt, ng), cleared: S.cleared } as never;
  } else if (reset) F.story = { ...newChapter(g, ch, S.ng), cleared: S.cleared } as never;
  else if (won || node !== 'boss') S.row++;
  const big = hardDone ? 'Hard mode cleared' : cleared ? (ch === LASTCH ? 'The wheel has spoken' : `Chapter ${ch} cleared`) : won ? (node === 'boss' ? 'Boss down' : 'Victory') : 'Defeat';
  const desc = won
    ? `${F.name} beats ${O.name}.${!cleared && !hardDone ? ` HP ${hpTxt(g, storyOf(g).hp)}.` : ''}`
    : `${O.name} wins this one.${!reset && !hardOut ? ` ${node === 'boss' ? 'The boss is still waiting.' : 'You move on.'}` : ''}`;
  const next: Step[] = [];
  if (won) {
    if (node === 'boss') next.push({ t: 'loot', table: 'boss' }, ...(hardDone ? [{ t: 'loot', table: 'treasure' } as Step] : []));
    else {
      if (node === 'elite' || node === 'nemesis') next.push({ t: 'loot', table: hard ? 'boss' : 'elite' });
      next.push({ t: 'reward' });
    }
  }
  next.push({ t: 'levelups' });
  if (hardDone) next.push({ t: 'celebrate', icon: '🔥', title: `Chapter ${ch} beaten on hard`, sub: `${CHAPTERS[ch - 1]!.n}, the hard way. It is on your record for good` });
  if (hardDone || hardOut) {
    next.push({ t: 'hub' });
    invalidate(F);
    return { won, big, desc, lines, got, next, button: 'Continue', q: won ? 3 : 0, confetti: won };
  }
  if (cleared)
    next.push({
      t: 'celebrate',
      icon: CHAPTERS[ch - 1]!.e,
      title: ch === LASTCH ? 'Story complete' : `Chapter ${ch} cleared`,
      sub: ch === LASTCH ? 'The Wheelmaster falls. The wheel keeps spinning, and so do you: encore mode starts now, with tougher fights.' : `Next up: ${CHAPTERS[ch]!.n}`,
    });
  next.push({ t: 'map' });
  const button = cleared ? 'Claim the boss loot' : won && next.length > 2 ? 'Continue' : 'Back to the map';
  invalidate(F);
  return { won, big, desc, lines, got, next, button, q: won ? (cleared ? 3 : 2) : 0, confetti: won };
}

export type { Nemesis };
