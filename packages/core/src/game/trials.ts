import { BALANCE, onBalance } from '../data/balance';
import { BOSSES } from '../data/content/story';
import { TITLES } from '../data/wheels';
import type { CareerFighter } from '../save/fighter';
import { addMasteryWin, awardGems, gainXP, invalidate, track } from './career';
import { addCoins, pl, type Game } from './game';
import type { FightOutcome, FightResult, FightTier } from './fight';
import { bossBody } from './story';

/**
 * The Wheelborn trials (review F12): an endgame of ten remixed bosses, each one boss's body wearing two other
 * bosses' phase-two kits, so their phase two hands you two one-time slices. No timers, no entry cost: a loss
 * costs nothing, and cleared trials stay open for rematches. Levels 32 to 41, a level a trial (review K5: it was
 * 34 to 50, which took up to 230 chapter-20 fights of levelling after the story).
 */
export const TRIAL_COUNT = 10;
/** The level the trials open at (34 before the review's ladder, K5). Follows the switch. */
export let TRIAL_FROM = BALANCE.trialLadder ? 32 : 34;
onBalance(() => {
  TRIAL_FROM = BALANCE.trialLadder ? 32 : 34;
});
/** Whose body, and whose two kits (boss indexes, chapters 1 to 20 minus one). */
// prettier-ignore
const MIX: [body: number, kitA: number, kitB: number][] = [
  [10, 3, 15], [11, 7, 1], [12, 0, 18], [13, 9, 5], [14, 2, 16], [15, 6, 11], [16, 4, 19], [17, 8, 13], [18, 1, 14], [19, 12, 17],
];
export const trialLevel = (i: number) => (BALANCE.trialLadder ? TRIAL_FROM + i : TRIAL_FROM + Math.round((i * 16) / (TRIAL_COUNT - 1)));
/**
 * How tough the remixes are. A remix keeps its boss's picks (race, class, weapon, power...) but not its stat
 * table: every stat is one tier, the same for a trial whoever's body it is, and HP is set by the trial too.
 * Tuned with tools/sim/trials.ts so an average fighter at the trial's level wins the first about 55% of the
 * time and the last about 30%, a smooth step down (review K5: HP from two tunes on the mean of 450 and 600
 * fighters a trial, checked on 600 others).
 */
// prettier-ignore
export const TRIAL_TUNE = {
  ai0: 0.5, aiStep: 0.03,
  tier: [12, 9, 9, 9, 11, 12, 12, 8, 11, 5],
  hp: [280, 310, 370, 280, 280, 280, 370, 370, 290, 410],
};
/** The first tune, for levels 34 to 50 on 24 fighters (before K5). */
// prettier-ignore
export const TRIAL_TUNE_V1 = {
  ai0: 0.5, aiStep: 0.03,
  tier: [13, 10, 10, 9, 11, 14, 14, 8, 10, 4],
  hp: [290, 310, 250, 310, 320, 280, 230, 310, 430, 260],
};
const tune = () => (BALANCE.trialLadder ? TRIAL_TUNE : TRIAL_TUNE_V1);
export const trialTier = (i: number): FightTier => ({ k: 'trial', n: `Wheelborn trial ${i + 1}`, e: '🌀', xpW: 0, coins: 0 });

const state = (g: Game) => (g.save.profile.extra.trials ??= { best: 0 }) as unknown as { best: number };
/** How many trials are cleared (they clear in order). */
export const trialsCleared = (g: Game) => state(g).best;
export const trialsOpen = (g: Game) => !!g.F && ((g.F.lvl || 1) >= TRIAL_FROM || ((g.F.story?.cleared as number[] | undefined) || []).includes(BOSSES.length));

/** What a trial is, in words: whose body, whose tricks. */
export function trialInfo(i: number) {
  const [a, b, c] = MIX[i]!;
  return { body: BOSSES[a]!, kits: [BOSSES[b]!, BOSSES[c]!], lvl: trialLevel(i) };
}

/** The remixed boss of a trial. */
export function trialBoss(g: Game, i: number): CareerFighter {
  const [a, b, c] = MIX[i]!;
  const def = BOSSES[a]!;
  const T = tune();
  const f = bossBody(g, a + 1, 0, T.tier[i]!);
  Object.assign(f, {
    title: TITLES[0],
    maxHp: T.hp[i]!,
    bossFx: def.fx,
    phase: def.phase,
    aiSkill: T.ai0 + T.aiStep * i,
    wheelBoss: def.wheelBoss,
    isBoss: true,
    bossTitle: `Wheelborn remix ${i + 1}`,
    lvl: trialLevel(i),
    remix: [b, c],
  });
  invalidate(f);
  return f;
}

/** After a trial: a first clear pays gems and opens the next; any win pays XP. */
export function endTrialFight(g: Game, i: number, O: CareerFighter, o: FightOutcome): FightResult {
  const F = g.F!;
  const won = o.w === 0;
  const s = state(g);
  const lines: string[] = [];
  const first = won && i >= s.best;
  if (won) {
    const xp = 40 + 6 * i;
    gainXP(g, F, xp);
    lines.push(`+${xp} XP`);
    addMasteryWin(g, F);
    track(g, 'trials');
  }
  if (first) {
    s.best = i + 1;
    awardGems(g, 4 + i, lines);
    lines.push(i + 1 < TRIAL_COUNT ? `Trial ${i + 2} is open` : 'Every trial cleared. The wheel bows. Slightly.');
  }
  if (!won) lines.push('A trial costs nothing to lose. Rematch whenever');
  invalidate(F);
  return {
    won,
    big: won ? (first ? `Trial ${i + 1} cleared` : 'Remix beaten again') : 'The remix wins',
    desc: won ? `${F.name} beats ${O.name}, remixed.` : `${O.name}, remixed, wins this one. ${pl(TRIAL_COUNT - s.best, 'trial')} to go.`,
    lines,
    got: [],
    next: [{ t: 'levelups' }, { t: 'hub' }],
    button: 'Continue',
    q: won ? (first ? 3 : 2) : 0,
    confetti: won,
  };
}

// ---------------------------------------------------------------- the remix workshop (L4)
/** What building a remix costs. */
export const REMIX_GEMS = 3;
export type RemixMix = [body: number, kitA: number, kitB: number];
const remixState = (g: Game) => g.save.profile.extra as { remix?: { mix: RemixMix } | null };
/**
 * The remix workshop (review L4): a trial of your own. Any boss your fighter has beaten lends the body, any two
 * other bosses lend their phase-two tricks, and it is tuned to your level like the trial of that level. It costs
 * gems to build (a remix that is paid for stays built until it is fought, so closing the app charges nothing
 * twice), and a win pays XP and coins.
 */
export const remixOpen = trialsOpen;
/** The bosses a remix can be built from: the chapters this fighter cleared, Act I at least. */
export function remixBodies(g: Game): number[] {
  const cleared = ((g.F?.story?.cleared as number[] | undefined) || []).filter((c) => c >= 1 && c <= BOSSES.length);
  const list = [...new Set(cleared)].map((c) => c - 1).sort((a, b) => a - b);
  return list.length >= 3 ? list : Array.from({ length: 10 }, (_, i) => i);
}
/** Which trial a remix measures up to: the one nearest the fighter's level. */
const remixRow = (g: Game) => Math.max(0, Math.min(TRIAL_COUNT - 1, (g.F?.lvl || 1) - trialLevel(0)));
/** The remix built and paid for, waiting to be fought. */
export const builtRemix = (g: Game): RemixMix | null => remixState(g).remix?.mix ?? null;
/** Builds a remix: three different bosses, the body one your fighter has beaten. False if it can't be paid. */
export function buildRemix(g: Game, mix: RemixMix): boolean {
  const p = g.save.profile;
  if (builtRemix(g)) return true;
  if (new Set(mix).size !== 3 || !remixBodies(g).includes(mix[0]) || mix.some((i) => !BOSSES[i]) || (p.gems || 0) < REMIX_GEMS) return false;
  p.gems -= REMIX_GEMS;
  remixState(g).remix = { mix: [...mix] as RemixMix };
  return true;
}
/** The remix as a fighter: the trial of its level, wearing the body and kits you chose. */
export function remixBoss(g: Game, mix: RemixMix): CareerFighter {
  const [a, b, c] = mix;
  const def = BOSSES[a]!;
  const i = remixRow(g);
  const T = tune();
  const f = bossBody(g, a + 1, 0, T.tier[i]!);
  Object.assign(f, {
    title: TITLES[0],
    maxHp: T.hp[i]!,
    bossFx: def.fx,
    phase: def.phase,
    aiSkill: T.ai0 + T.aiStep * i,
    wheelBoss: def.wheelBoss,
    isBoss: true,
    bossTitle: 'Your remix',
    lvl: Math.max(g.F?.lvl || 1, trialLevel(0)),
    remix: [b, c],
  });
  invalidate(f);
  return f;
}
export const remixTier: FightTier = { k: 'remix', n: 'Your remix', e: '🧪', xpW: 0, coins: 0 };
/** After a remix: it is used up either way; a win pays XP, coins, and counts toward the remix goals. */
export function endRemixFight(g: Game, O: CareerFighter, o: FightOutcome): FightResult {
  const F = g.F!;
  const won = o.w === 0;
  const lines: string[] = [];
  remixState(g).remix = null;
  if (won) {
    const xp = 40 + 6 * remixRow(g);
    gainXP(g, F, xp);
    addCoins(g, 15);
    lines.push(`+${xp} XP, +15 🪙`);
    addMasteryWin(g, F);
    track(g, 'remixes');
  } else lines.push('The remix is spent. The workshop keeps the receipt');
  invalidate(F);
  return {
    won,
    big: won ? 'Remix beaten' : 'Your remix wins',
    desc: won ? `${F.name} beats the monster they built. Mary Shelley would be proud.` : `${O.name}, the way you built them, wins. You did this to yourself.`,
    lines,
    got: [],
    next: [{ t: 'levelups' }, { t: 'hub' }],
    button: 'Continue',
    q: won ? 2 : 0,
    confetti: won,
  };
}
