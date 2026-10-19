import { BOSSES, CHAPTERS, CH_PCT } from './content/story';

/**
 * Story balance knobs. `LEGACY_BALANCE` is the old game's tuning (the parity tests switch to it);
 * `BALANCE` is what the game plays with. Tuned with `npm run sim` (see PROGRESS.md, Phase 4).
 */
export interface Balance {
  /** a boss is toughened, one level at a time, while the player's odds are above this plus 0.08 */
  bossTarget: (ch: number, ng: number) => number;
  /** at most this many levels of toughening, so levels won elsewhere still count */
  bossTuneCap: number;
  /** boss HP */
  bossHp: (ch: number, ng: number) => number;
  /** boss level */
  bossLvl: (ch: number, ng: number) => number;
  /** added to every stat tier of the boss's table (1 to 14) */
  bossStatShift: (ch: number) => number;
  /** the slice of the ranked pool (0 weakest, 1 strongest) a chapter's regular opponents come from */
  chPct: (ch: number) => readonly [lo: number, hi: number];
  /** a boss the player has less than this chance against eases off (at most `easeMax` times) */
  easeBelow: number;
  easeMax: number;
  /** fighters play to their AI personality (upgrade 11) */
  personalities: boolean;
  /** crit, dodge and damage reduction stack with diminishing returns past a knee (upgrade 15) */
  softCaps: boolean;
  /** joke picks have hidden synergies (upgrade 16) */
  jokeSynergies: boolean;
  /** growth types scale by `GROWTH_TUNE` instead of the wheel's own numbers (upgrade 18) */
  growth: boolean;
  /** the nemesis follows you into the story, and story losses make one (upgrade 19) */
  storyNemesis: boolean;
  /** each chapter has encounters of its own (upgrade 20) */
  themedEvents: boolean;
  /** gear can be upgraded from +1 to +5, and duplicates become copies for it (upgrade 21) */
  gearUpgrades: boolean;
  /** pirate, chef, cosmic and royal gear drop, with their set bonuses (upgrade 22) */
  moreSets: boolean;
  /** calendar-themed arenas join the arena wheel in their season (upgrade 27) */
  seasonal: boolean;
  /** a focus wheel holds only moves of its family: you pick what, the wheel picks how hard (review E1) */
  pureFocus: boolean;
  /** reads leave the AI's skill out, IQ counts half as much, and only tricksters push a read below "Just a hunch" (E2) */
  fairReads: boolean;
  /** speed guards against strikes, IQ against powers and adds crit damage, power mastery makes powers cheaper (E3) */
  statRoles: boolean;
  /** regeneration heals a share of what's missing, heals fade after round 6, one revive per fight, powers pierce durability (E4) */
  healRules: boolean;
  /** every fight row has an elite, sure wins can be claimed, a boss that toughened up for you pays gems (E5) */
  storyPacing: boolean;
  /** every level-up spins twice and you keep one (review F4) */
  secondOpinion: boolean;
  /** the fight club's payouts follow a noisy bookie's line, and an insider tells the real odds (review F8) */
  clubInsider: boolean;
}

export const LEGACY_BALANCE: Balance = {
  bossTarget: (ch, ng) => 0.45 - 0.02 * (ch - 1 + ng),
  bossTuneCap: 8,
  bossHp: (ch, ng) => BOSSES[ch - 1]!.maxHp + ng * 40,
  bossLvl: (ch, ng) => CHAPTERS[ch - 1]!.lvl + 3 + ng * 4,
  bossStatShift: () => 0,
  chPct: (ch) => CH_PCT[ch - 1]!,
  easeBelow: 0.18,
  easeMax: 3,
  personalities: false,
  softCaps: false,
  jokeSynergies: false,
  growth: false,
  storyNemesis: false,
  themedEvents: false,
  gearUpgrades: false,
  moreSets: false,
  seasonal: false,
  pureFocus: false,
  fairReads: false,
  statRoles: false,
  healRules: false,
  storyPacing: false,
  secondOpinion: false,
  clubInsider: false,
};

/** Aimed boss odds for an average build at its chapter's level: a boss toughens while the player is 12 points above. */
export const BOSS_AIM = (ch: number) => (ch <= 10 ? 0.55 - 0.01 * (ch - 1) : 0.37 - 0.01 * (ch - 11));

/** How many levels each boss is above its chapter. */
export const BOSS_LVL_UP: number[] = BOSSES.map(() => 1);
/**
 * Stat tiers taken off (or added to) each boss's table, chapters 1 to 20. Tuned with the HP below over whole
 * story runs (tools/sim/tune-bosses.ts): an average build wins about 72% of tries in chapter 1, 54% at the end
 * of Act I, and 42% to 28% across Act II.
 */
// prettier-ignore
export const BOSS_STAT_SHIFT: number[] = [-6, -4, -3, -5, -3, -3, -5, -2, -5, -5, 2, -4, 3, -5, 0, 4, 4, -5, -5, -6];

/** Boss HP by chapter (see the stat shift above). */
// prettier-ignore
export const BOSS_HP: number[] = [90, 142, 180, 245, 250, 225, 182, 240, 312, 205, 320, 533, 340, 493, 360, 608, 624, 471, 440, 331];

/** Gentler first chapters, so the weakest builds can get going (the rest of CH_PCT is unchanged). */
export const CH_PCT_EASY: (readonly [number, number])[] = [
  [0, 0.18],
  [0.06, 0.32],
  [0.15, 0.45],
];

export const BALANCE: Balance = {
  bossTarget: (ch, ng) => BOSS_AIM(ch) + 0.04 - 0.02 * ng,
  // a boss puts on at most one level after sizing you up (review E5; it was three)
  bossTuneCap: 1,
  bossHp: (ch, ng) => BOSS_HP[ch - 1]! + ng * 40,
  bossLvl: (ch, ng) => Math.max(1, CHAPTERS[ch - 1]!.lvl + BOSS_LVL_UP[ch - 1]! + ng * 4),
  bossStatShift: (ch) => BOSS_STAT_SHIFT[ch - 1]!,
  chPct: (ch) => CH_PCT_EASY[ch - 1] ?? CH_PCT[ch - 1]!,
  easeBelow: 0.18,
  easeMax: 3,
  personalities: true,
  softCaps: true,
  jokeSynergies: true,
  growth: true,
  storyNemesis: true,
  themedEvents: true,
  gearUpgrades: true,
  moreSets: true,
  seasonal: true,
  pureFocus: true,
  fairReads: true,
  statRoles: true,
  healRules: true,
  storyPacing: true,
  secondOpinion: true,
  clubInsider: true,
};

/**
 * Growth types (upgrade 18): [start, growth] multipliers of the level scale, by growth key. Missing keys keep
 * the wheel's numbers.
 */
export const GROWTH_TUNE: Record<string, readonly [s: number, g: number]> = {
  prodigy: [1.04, 1.06],
  unstop: [0.88, 1.32],
  plateau: [1.1, 0.78],
};

/**
 * Diminishing returns (upgrade 15): past the knee, each extra point counts half, up to a ceiling. With the old
 * game's balance it is a plain pass-through.
 */
export const soft = (x: number, knee: number, max = 1) => (!BALANCE.softCaps || x <= knee ? x : Math.min(max, knee + (x - knee) * 0.5));
/** Where crit, dodge and damage reduction start to taper, and how far they can go. */
export const SOFT_CAP = { crit: [0.35, 0.65], dodge: [0.3, 0.6], dr: [0.25, 0.6] } as const;

/** Switches the tuning (the parity tests play by the old game's numbers). */
export function useBalance(b: Balance) {
  Object.assign(BALANCE, b);
}
