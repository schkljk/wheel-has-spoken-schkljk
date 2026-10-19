import { BALANCE } from '../data/balance';
import { BOSSES } from '../data/content/story';
import { TITLES } from '../data/wheels';
import { WHEELS, applyBonus, levelUp, randomFighter } from '../fighter';
import { randName } from '../names';
import { poolPick } from '../pool';
import { pickW } from '../random';
import { mulberry32 } from '../rng';
import { deserFighter, serFighter, type CareerFighter, type SerFighter } from '../save/fighter';
import { numStats, synOf } from '../stats';
import { addMasteryWin, awardGems, invalidate, markSeen, randomGear, track } from './career';
import type { FightMod } from '../data/misc';
import type { FightOutcome, FightResult, FightTier } from './fight';
import { ctxOf, pl, type Game } from './game';
import { CX_CATS, cxKey } from './lookups';
import { bossBody } from './story';

/**
 * Spin & Run (review F3): a throwaway fighter for a twenty-minute run. Eight fights and a boss, HP carried
 * from one to the next, and after each win a pick of one boon out of three. The fighter is gone when the run
 * ends, but what it earns stays: its picks in the collection, its wins toward class mastery, gems, and the
 * best run on record. Everything a run rolls comes from its own seed, so closing the app re-rolls nothing.
 */
export const RUN_FIGHTS = 9;
export const RUN_START_LVL = 5;
/** How the run ramps: where in the pool each fight starts, and how many levels under you the opponent is. */
export const RUN_TUNE = { lo0: 0, loStep: 0.06, under: [4, 3, 3, 2, 2, 1, 1, 1] };
/** The HP a second wind leaves you with, in % (review K3). */
export const RUN_WIND_HP = 60;
/** A run has its second wind to lose (review K3). */
export const runWindLeft = (R: RunState) => BALANCE.runFair && !R.wind;
/**
 * The level the run's opponents measure up to: yours before the review's fix, which made "+2 levels" a wash
 * (everyone after got two levels too). With `runFair` (K3) it is where a run is by its fight number alone:
 * the start level plus a level a win, so boons that level you up put you ahead.
 */
const runYardstick = (R: RunState, me: CareerFighter) => (BALANCE.runFair ? RUN_START_LVL + R.i : me.lvl || 1);
export const RUN_TIER = (i: number): FightTier => ({ k: 'run', n: i === RUN_FIGHTS - 1 ? 'Spin & Run: the boss' : `Spin & Run, fight ${i + 1} of ${RUN_FIGHTS}`, e: '🏃', xpW: 0, coins: 0 });

export interface RunBoon {
  k: string;
  n: string;
  e: string;
  d: string;
  /** rarer boons show up less */
  w: number;
}
// prettier-ignore
export const RUN_BOONS: RunBoon[] = [
  { k: 'str', n: '+2 Strength', e: '💪', d: 'Hit harder. Think less.', w: 2 },
  { k: 'spd', n: '+2 Speed', e: '👟', d: 'Arrive first. Leave first.', w: 2 },
  { k: 'dur', n: '+2 Durability', e: '🛡️', d: 'Pain is a suggestion.', w: 2 },
  { k: 'iq', n: '+2 IQ', e: '🧠', d: 'Reads, crits, and smug faces.', w: 1.6 },
  { k: 'wm', n: '+2 Weapon mastery', e: '🗡️', d: 'You finally read the manual.', w: 1.6 },
  { k: 'pm', n: '+2 Power mastery', e: '✨', d: 'Cheaper powers, louder powers.', w: 1.6 },
  { k: 'all1', n: '+1 to everything', e: '🌟', d: 'A little bit of all of it. The buffet.', w: 0.8 },
  { k: 'heal', n: 'Patch up: heal 50% HP', e: '🩹', d: 'Duct tape is technically medicine.', w: 2 },
  { k: 'gear', n: 'A random piece of gear', e: '🎁', d: 'Found it behind the vending machine.', w: 1.4 },
  { k: 'lvl', n: '+2 levels', e: '⏫', d: 'Skipped two grades. Nobody checked.', w: 1.2 },
];

/**
 * Relics (review L5): every third boon is a tradeoff. Each is taken once a run, and two are offered next to a
 * plain boon, so a tradeoff is never forced. Mechanics in `d`, the joke in `f`.
 */
export interface RunRelic {
  k: string;
  n: string;
  e: string;
  d: string;
  f: string;
}
// prettier-ignore
export const RUN_RELICS: RunRelic[] = [
  { k: 'glass', n: 'Glass cannon', e: '🔪', d: '+40% damage, but 25% less max HP for the rest of the run', f: 'Hits like a truck. Built like a teacup.' },
  { k: 'borrowed', n: 'Borrowed time', e: '⏳', d: 'A full heal now, but the run ends after three more fights', f: 'The clock is ticking. Loudly. On purpose.' },
  { k: 'pact', n: 'Blood pact', e: '🩸', d: 'Every fight starts with full energy, but a win heals nothing (no +10 HP)', f: 'The fine print was written in something red.' },
  { k: 'crown', n: 'Cursed crown', e: '👑', d: '+3 to everything, but every opponent gets two more levels', f: 'Heavy is the head. Heavier are the people punching it.' },
];
export const relicOf = (k: string) => RUN_RELICS.find((r) => r.k === k);
const hasRelic = (R: RunState, k: string) => (R.relics || []).includes(k);

export interface RunState {
  /** the throwaway fighter */
  f: SerFighter;
  /** fights won so far (the next fight's index) */
  i: number;
  /** HP carried into the next fight, in % */
  hp: number;
  seed: number;
  /** the boons on offer after a win, until one is picked */
  offer: string[] | null;
  /** the boons taken, in order */
  took: string[];
  /** the second wind is used: the first loss of a run leaves you standing once (review K3) */
  wind?: 1;
  /** relics taken (L5), and the fight count Borrowed time ends the run at */
  relics?: string[];
  ends?: number;
}
export interface RunBest {
  wins: number;
  n: string;
  e: string;
  won: boolean;
}

const prof = (g: Game) => g.save.profile.extra as unknown as { run?: RunState | null; runBest?: RunBest | null };
export const runState = (g: Game): RunState | null => prof(g).run ?? null;
export const runBest = (g: Game): RunBest | null => prof(g).runBest ?? null;
export const runFighter = (R: RunState): CareerFighter => deserFighter(R.f)!;

/** A new run: a fighter from the wheels, all at once. */
export function startRun(g: Game): RunState {
  const seed = Math.floor(g.rng() * 2 ** 31);
  const rng = mulberry32(seed);
  const f = randomFighter(randName(rng), rng, ctxOf(g)) as CareerFighter;
  levelUp(f, RUN_START_LVL - 1, rng);
  f.lvl = RUN_START_LVL;
  randomGear(f, 1, rng);
  invalidate(f);
  // what it rolled goes in the collection, like any build (with `runFair`, review G11: when the run pays out, after a win)
  if (!BALANCE.runFair) collect(g, f);
  const R: RunState = { f: serFighter(f), i: 0, hp: 100, seed, offer: null, took: [] };
  prof(g).run = R;
  return R;
}
/** A run fighter's picks and synergies join the collection; how many were new. */
function collect(g: Game, f: CareerFighter): number {
  let n = 0;
  for (const W of WHEELS) {
    const it = f[W.k] as { n: string; skip?: unknown } | undefined;
    if (CX_CATS.has(W.k) && it && !it.skip && markSeen(g, W.k, cxKey(W.k, it, f))) n++;
  }
  for (const s of synOf(f)) if (!s.hidden && markSeen(g, 'syn', s.n)) n++;
  return n;
}

/** Gives up the run: it counts as ended where it is. Returns what it paid, for the payout card (H2). */
export function quitRun(g: Game): string[] {
  const R = runState(g);
  return R ? settle(g, R, false) : [];
}

/** The run's next opponent: the same one every time it's asked for (its own die). */
export function runOpponent(g: Game, R: RunState): CareerFighter {
  const rng = mulberry32((R.seed + 7919 * (R.i + 1)) >>> 0);
  const me = runFighter(R);
  if (R.i === RUN_FIGHTS - 1) {
    // the boss: one of Act I's, at your level plus one
    const ch = 1 + Math.floor(rng() * 10);
    const def = BOSSES[ch - 1]!;
    const b = bossBody({ ...g, rng }, ch, BALANCE.bossStatShift(ch));
    Object.assign(b, {
      title: TITLES[0],
      maxHp: Math.round(BALANCE.bossHp(ch, 0) * 0.85),
      bossFx: def.fx,
      phase: def.phase,
      aiSkill: def.aiSkill,
      wheelBoss: def.wheelBoss,
      isBoss: true,
      bossTitle: def.title,
      // a Cursed crown makes everyone two levels angrier (L5)
      lvl: runYardstick(R, me) + 1 + (hasRelic(R, 'crown') ? 2 : 0),
    });
    invalidate(b);
    return b;
  }
  // the pool from the bottom up: each fight picks from a little higher, and catches up to your level
  const lo = Math.min(0.85, RUN_TUNE.lo0 + R.i * RUN_TUNE.loStep);
  const o = poolPick(g.pool, lo, Math.min(1, lo + 0.2), rng, undefined, ctxOf(g)) as CareerFighter;
  levelUp(o, Math.max(0, runYardstick(R, me) - 1 - (RUN_TUNE.under[R.i] ?? 0)) + (hasRelic(R, 'crown') ? 2 : 0), rng);
  if (R.i >= 3) randomGear(o, 1 + (R.i >= 6 ? 1 : 0), rng);
  o.aiSkill = 0.05 * R.i;
  invalidate(o);
  return o;
}

/**
 * Three boons to pick from after a win (kept until one is picked). No patching up at full HP (H2). Every third
 * pick brings two relics not taken yet, and one plain boon (L5).
 */
function offer(R: RunState): string[] {
  const rng = mulberry32((R.seed ^ Math.imul(0x9e3779b9, R.i + 3)) >>> 0);
  const left = RUN_BOONS.filter((b) => b.k !== 'heal' || R.hp < 95);
  const out: string[] = [];
  if (BALANCE.runRelics && R.i % 3 === 0) {
    const rel = RUN_RELICS.filter((r) => !hasRelic(R, r.k)).map((r) => ({ ...r, w: 1 }));
    while (out.length < 2 && rel.length) out.push(rel.splice(pickW(rng, rel), 1)[0]!.k);
  }
  while (out.length < 3 && left.length) out.push(left.splice(pickW(rng, left), 1)[0]!.k);
  return out;
}
/** A boon, or a relic as one (its mechanics as the description). */
export const boonOf = (k: string): RunBoon => {
  const r = relicOf(k);
  return r ? { k: r.k, n: `Relic: ${r.n}`, e: r.e, d: `${r.d}. ${r.f}`, w: 0 } : RUN_BOONS.find((b) => b.k === k)!;
};
/**
 * The runner's starting tweaks for a fight: the HP carried in, and what the relics change (L5). Engine HP is
 * out of 100 at the base, so Glass cannon's max is 75 and the carried HP scales with it.
 */
export function runMods(R: RunState): FightMod {
  const glass = hasRelic(R, 'glass');
  const m: FightMod = { hp: Math.max(1, Math.round(R.hp * (glass ? 0.75 : 1))) };
  if (glass) Object.assign(m, { maxHp: 75, dmgX: 1.4 });
  if (hasRelic(R, 'pact')) m.en = 100;
  return m;
}

/** Takes one of the boons on offer. */
export function takeBoon(g: Game, k: string) {
  const R = runState(g);
  if (!R || !R.offer || !R.offer.includes(k)) return;
  const f = runFighter(R);
  const rng = mulberry32((R.seed + 104729 * (R.i + 1)) >>> 0);
  const relic = relicOf(k);
  if (relic) {
    R.relics = [...(R.relics || []), k];
    f.boons = [...(f.boons || []), { k, n: relic.n, e: relic.e }];
    if (k === 'borrowed') {
      R.hp = 100;
      R.ends = R.i + 3;
    }
    if (k === 'crown') for (const s of ['str', 'spd', 'dur', 'iq', 'wm', 'pm'] as const) f.bonus[s] = (f.bonus[s] || 0) + 3;
  } else if (k === 'heal') R.hp = Math.min(100, R.hp + 50);
  else if (k === 'gear') randomGear(f, 1, rng);
  else if (k === 'lvl') levelUp(f, 2, rng);
  else if (k === 'all1') applyBonus(f, { k: 'all1', n: '+1 to everything', e: '🌟' });
  else {
    const s = k as 'str' | 'spd' | 'dur' | 'iq' | 'wm' | 'pm';
    f.bonus[s] = (f.bonus[s] || 0) + 2;
    f.boons = [...(f.boons || []), { k, n: boonOf(k).n, e: boonOf(k).e }];
  }
  invalidate(f);
  R.f = serFighter(f);
  R.took.push(k);
  R.offer = null;
}

/** The run is over: gems for how far it got, the best run kept, and the fighter goes. */
function settle(g: Game, R: RunState, won: boolean): string[] {
  const lines: string[] = [];
  const wins = R.i;
  const gems = Math.floor(wins / 2) + (won ? 3 : 0);
  if (gems) awardGems(g, gems, lines);
  else lines.push('No gems: a run pays one for every two wins');
  const f = runFighter(R);
  // the picks join the collection when the run pays out, and only after a win (G11: walking away at once was a free farm)
  if (BALANCE.runFair && wins > 0) {
    const n = collect(g, f);
    if (n) lines.push(`📚 ${pl(n, 'new entry', 'new entries')} in your collection`);
  }
  const best = runBest(g);
  if (!best || wins > best.wins || (won && !best.won)) {
    prof(g).runBest = { wins, n: f.name, e: f.race.e, won };
    if (best) lines.push(`🏃 A new best run: ${pl(wins, 'win')}`);
  }
  track(g, 'runs');
  prof(g).run = null;
  return lines;
}

/** After a run fight: HP carries over, a win levels the fighter and offers boons, a loss ends the run. */
export function endRunFight(g: Game, O: CareerFighter, o: FightOutcome): FightResult & { runOver: boolean } {
  const R = runState(g)!;
  const won = o.w === 0;
  const f = runFighter(R);
  const lines: string[] = [];
  let over = !won;
  // the second wind (K3): the first loss of a run leaves you up, at 60% HP, for a rematch
  const wind = !won && runWindLeft(R);
  if (wind) {
    R.wind = 1;
    R.hp = RUN_WIND_HP;
    over = false;
    const mx = numStats(f).hp;
    lines.push(`💨 Second wind: ${f.name} gets back up with ${Math.round((RUN_WIND_HP / 100) * mx)}/${mx} HP for a rematch. The next loss ends the run`);
  }
  if (won) {
    R.i++;
    // a Blood pact heals nothing after a win (L5)
    R.hp = Math.min(100, Math.max(1, Math.ceil((o.me.hp / o.me.maxHp) * 100)) + (hasRelic(R, 'pact') ? 0 : 10));
    // a level a win, and the class mastery counts it, run fighter or not
    levelUp(f, 1, mulberry32((R.seed + 31 * R.i) >>> 0));
    invalidate(f);
    R.f = serFighter(f);
    addMasteryWin(g, f);
    // a run's win is a win: goals count it, and bounties the runner fits (H2)
    track(g, 'wins', 1, f);
    // real numbers, and the +10 named (H9, G15)
    const mx = numStats(f).hp;
    lines.push(
      hasRelic(R, 'pact')
        ? `${f.name} is level ${f.lvl}. The blood pact heals nothing: ${Math.max(1, Math.round((R.hp / 100) * mx))}/${mx} HP for the next one`
        : `${f.name} is level ${f.lvl}. +10 HP after the win: ${Math.max(1, Math.round((R.hp / 100) * mx))}/${mx} HP for the next one`,
    );
    if (R.i >= RUN_FIGHTS) over = true;
    else if (R.ends != null && R.i >= R.ends) {
      // Borrowed time is up (L5): the run ends here and pays out
      over = true;
      lines.push(`⏳ Borrowed time is up. ${f.name} walks off with ${pl(R.i, 'win')}`);
    } else R.offer = offer(R);
  }
  const done = R.i >= RUN_FIGHTS;
  if (over) lines.push(...settle(g, R, done));
  return {
    won,
    big: done ? 'Run complete' : won ? `Fight ${R.i} of ${RUN_FIGHTS} won` : wind ? 'Down, not out' : 'Run over',
    desc: done
      ? `${f.name} beat the whole run. Built in two minutes, lasted the distance.`
      : won
        ? `${f.name} beats ${O.name}.`
        : wind
          ? `${O.name} wins this one. ${f.name} refuses to read the room.`
          : `${O.name} ends the run after ${pl(R.i, 'win')}. Built in two minutes. Expected to last three.`,
    lines,
    got: [],
    next: over ? [{ t: 'hub' }] : [{ t: 'run' }],
    button: over ? 'Done' : wind ? 'Back on your feet' : 'Pick a boon',
    q: won ? (done ? 3 : 2) : 0,
    confetti: done,
    runOver: over,
  };
}

/** The run's fighter for a fight, with HP carried in (`rushHp`). */
export const runSpecOf = (g: Game, R: RunState) => {
  const opp = runOpponent(g, R);
  // relics (L5) change the runner's starting tweaks; without any, the HP carried in is all there is
  const mods = R.relics?.length ? { mods: [runMods(R), opp.maxHp ? { maxHp: opp.maxHp } : {}] as [FightMod, FightMod] } : {};
  return { kind: 'run' as const, tier: RUN_TIER(R.i), opp, me: runFighter(R), rushHp: R.hp, ...mods };
};
