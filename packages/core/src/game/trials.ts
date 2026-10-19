import { BOSSES } from '../data/content/story';
import { TITLES } from '../data/wheels';
import type { CareerFighter } from '../save/fighter';
import { addMasteryWin, awardGems, gainXP, invalidate, track } from './career';
import { pl, type Game } from './game';
import type { FightOutcome, FightResult, FightTier } from './fight';
import { bossBody } from './story';

/**
 * The Wheelborn trials (review F12): an endgame for levels 34 to 50. Ten remixed bosses, each one boss's body
 * wearing two other bosses' phase-two kits, so their phase two hands you two one-time slices. No timers, no
 * entry cost: a loss costs nothing, and cleared trials stay open for rematches.
 */
export const TRIAL_FROM = 34;
export const TRIAL_COUNT = 10;
/** Whose body, and whose two kits (boss indexes, chapters 1 to 20 minus one). */
// prettier-ignore
const MIX: [body: number, kitA: number, kitB: number][] = [
  [10, 3, 15], [11, 7, 1], [12, 0, 18], [13, 9, 5], [14, 2, 16], [15, 6, 11], [16, 4, 19], [17, 8, 13], [18, 1, 14], [19, 12, 17],
];
export const trialLevel = (i: number) => TRIAL_FROM + Math.round((i * 16) / (TRIAL_COUNT - 1));
/**
 * How tough the remixes are. A remix keeps its boss's picks (race, class, weapon, power...) but not its stat
 * table: every stat is one tier, the same for a trial whoever's body it is, and HP is set by the trial too.
 * Tuned with tools/sim/trials.ts so a fighter at the trial's level wins the first about half the time and
 * the last about a third of the time.
 */
// prettier-ignore
export const TRIAL_TUNE = {
  ai0: 0.5, aiStep: 0.03,
  tier: [13, 10, 10, 9, 11, 14, 14, 8, 10, 4],
  hp: [290, 310, 250, 310, 320, 280, 230, 310, 430, 260],
};
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
  const T = TRIAL_TUNE;
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
