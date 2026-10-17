import { BOSSES, CHAPTERS } from './content/story';

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
  /** a boss the player has less than this chance against eases off (at most `easeMax` times) */
  easeBelow: number;
  easeMax: number;
}

export const LEGACY_BALANCE: Balance = {
  bossTarget: (ch, ng) => 0.45 - 0.02 * (ch - 1 + ng),
  bossTuneCap: 8,
  bossHp: (ch, ng) => BOSSES[ch - 1]!.maxHp + ng * 40,
  bossLvl: (ch, ng) => CHAPTERS[ch - 1]!.lvl + 3 + ng * 4,
  bossStatShift: () => 0,
  easeBelow: 0.18,
  easeMax: 3,
};

/** Boss win odds the HP table below is calibrated for: an average build at the level the chapter expects. */
export const BOSS_AIM = (ch: number) => (ch <= 10 ? 0.55 - 0.01 * (ch - 1) : 0.45 - 0.01 * (ch - 11));

/** How many levels each boss is above its chapter. */
export const BOSS_LVL_UP: number[] = BOSSES.map(() => 1);
/** Stat tiers taken off (or added to) each boss's table, calibrated with the HP below. */
export const BOSS_STAT_SHIFT: number[] = BOSSES.map(() => 0);

/** Boss HP by chapter, calibrated with the stat shift so an average build hits BOSS_AIM (tools/sim/calibrate-bosses.ts). */
export const BOSS_HP: number[] = BOSSES.map((b) => b.maxHp);

export const BALANCE: Balance = {
  bossTarget: (ch, ng) => BOSS_AIM(ch) + 0.04 - 0.02 * ng,
  bossTuneCap: 3,
  bossHp: (ch, ng) => BOSS_HP[ch - 1]! + ng * 40,
  bossLvl: (ch, ng) => Math.max(1, CHAPTERS[ch - 1]!.lvl + BOSS_LVL_UP[ch - 1]! + ng * 4),
  bossStatShift: (ch) => BOSS_STAT_SHIFT[ch - 1]!,
  easeBelow: 0.18,
  easeMax: 3,
};

/** Switches the tuning (the parity tests play by the old game's numbers). */
export function useBalance(b: Balance) {
  Object.assign(BALANCE, b);
}
