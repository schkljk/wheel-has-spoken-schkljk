import { dailyReady } from './economy';
import type { Game } from './game';

/**
 * Notification dots on the tabs (Phase 4, upgrade 32): something new is waiting there. Play: the daily wheel or
 * today's daily challenge, or a challenger. Fighter: talent points to spend. Goals: a goal finished since you
 * last looked. Nothing nags about a day you missed; tomorrow just has its own.
 */
export interface TabDots {
  play: boolean;
  fighter: boolean;
  goals: boolean;
}
export function tabDots(g: Game): TabDots {
  const F = g.F;
  const p = g.save.profile;
  const dc = p.dc as { date?: string; done?: boolean } | null | undefined;
  const challengeReady = !(dc && dc.date === g.clock.today && dc.done);
  const seen = p.extra.goalsSeen as number | undefined;
  return {
    play: !!F && (dailyReady(g) || challengeReady || !!F.challenge),
    fighter: !!F && (F.tp || 0) > 0,
    goals: seen != null && p.goalsDone.length > seen,
  };
}
/** Looking at the Goals tab clears its dot (and starts the count for saves from before the dots). */
export function seeGoals(g: Game): boolean {
  const p = g.save.profile;
  if (p.extra.goalsSeen === p.goalsDone.length) return false;
  p.extra.goalsSeen = p.goalsDone.length;
  return true;
}
