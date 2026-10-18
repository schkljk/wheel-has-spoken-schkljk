import { CHAPTERS } from '../data/content/story';
import { MUTATORS } from '../data/misc';
import { pick } from '../random';
import type { StoryState } from '../save/fighter';
import type { Game } from './game';
import { newChapter, storyOf, type Story } from './story';

/**
 * Hard mode (Phase 4, upgrade 26): any cleared chapter can be played again on hard. Opponents come from higher up
 * the pool and are three levels stronger, bosses are tuned meaner, and one twist (a daily challenge mutator) holds
 * for the whole chapter. Loot is better: half again the coins, boss-grade loot from elites, and an extra treasure
 * spin and gems on the boss. The main story waits, untouched, until the hard run is won or runs out of grit.
 */
export interface HardRun {
  /** the twist for the whole chapter */
  mut: string;
}
/**
 * The twists a hard run can draw: not the ones that force their own arena (they would fight the arena wheel)
 * and not the ones that set your HP (story HP carries from fight to fight).
 */
export const HARD_TWISTS = MUTATORS.filter((x) => !x.arena && x.mods[0].hp == null);
/** The current hard run, if the active story is one. */
export const hardOf = (g: Game): HardRun | null => (g.F && g.F.story ? ((g.F.story as Story).hard ?? null) : null);
export const hardMutator = (g: Game) => {
  const h = hardOf(g);
  return h ? (MUTATORS.find((m) => m.k === h.mut) ?? null) : null;
};
/** The story waiting while a hard run is on (the active one otherwise; null before the story starts). */
export const mainStory = (g: Game): Story | null => ((g.F!.storyMain as Story | undefined) ?? (g.F!.story as Story | null)) || null;
/** Cleared chapters, and whether each was beaten on hard too. */
export function hardChapters(g: Game) {
  const done = new Set(g.F!.hardCleared || []);
  return [...new Set(mainStory(g)?.cleared || [])]
    .sort((a, b) => a - b)
    .map((ch) => ({ ch, n: CHAPTERS[ch - 1]!.n, e: CHAPTERS[ch - 1]!.e, done: done.has(ch) }));
}
/** Starts a hard run of a cleared chapter; the main story waits. */
export function startHard(g: Game, ch: number): boolean {
  const F = g.F!;
  if (hardOf(g) || !F.story || !(storyOf(g).cleared || []).includes(ch)) return false;
  const m = pick(g.rng, HARD_TWISTS);
  F.storyMain = F.story;
  F.story = { ...newChapter(g, ch, 0), cleared: [...(storyOf(g).cleared || [])], hard: { mut: m.k }, seenIntro: false } as unknown as StoryState;
  return true;
}
/** Ends the hard run (won, out of grit or walked away from) and puts the main story back. */
export function endHard(g: Game, won: boolean) {
  const F = g.F!;
  const ch = storyOf(g).ch;
  if (!hardOf(g)) return;
  F.story = (F.storyMain ?? null) as StoryState | null;
  delete F.storyMain;
  if (won) F.hardCleared = [...new Set([...(F.hardCleared || []), ch])].sort((a, b) => a - b);
}
