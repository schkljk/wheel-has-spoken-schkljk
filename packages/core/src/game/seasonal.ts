import { ARENAS } from '../data/arenas';
import { BALANCE } from '../data/balance';
import { SEASONAL_ARENAS, type SeasonalArena } from '../data/content/seasonal';
import type { Arena } from '../types';
import type { Clock, Game } from './game';

/**
 * Calendar-themed arenas (Phase 4, upgrade 27): each joins the arena wheel in its season, by the device's date,
 * and comes back every year. Nothing depends on catching one.
 */
export function monthDay(c: Pick<Clock, 'today'>): [number, number] {
  const d = new Date(c.today);
  return Number.isNaN(d.getTime()) ? [0, 0] : [d.getMonth() + 1, d.getDate()];
}
/** Whether a [month, day] is inside a window that may wrap past New Year. */
export function inSeason(md: [number, number], from: [number, number], to: [number, number]) {
  const v = md[0] * 100 + md[1];
  const a = from[0] * 100 + from[1];
  const b = to[0] * 100 + to[1];
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}
/** The seasonal arenas on the wheel today. */
export const seasonalNow = (g: { clock: Pick<Clock, 'today'> }): SeasonalArena[] =>
  BALANCE.seasonal ? SEASONAL_ARENAS.filter((a) => inSeason(monthDay(g.clock), a.from, a.to)) : [];
/** Any arena by key, seasonal ones too. */
export const arenaByKey = (k: string | undefined): Arena | null => (k ? (ARENAS.find((a) => a.k === k) ?? SEASONAL_ARENAS.find((a) => a.k === k) ?? null) : null);
export const isSeasonal = (a: { k: string } | null | undefined): a is SeasonalArena => !!a && SEASONAL_ARENAS.some((x) => x.k === a.k);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "until 2 November" */
export const seasonUntil = (a: SeasonalArena) => `until ${a.to[1]} ${MONTHS[a.to[0] - 1]}`;
/** A heads-up the first time each season that a seasonal arena is on the wheel (once; nothing to do about it). */
export function seasonNews(g: Game): string | null {
  const now = seasonalNow(g);
  if (!now.length) return null;
  const ex = g.save.profile.extra;
  const seen = ((ex.season as Record<string, number> | undefined) ?? {}) as Record<string, number>;
  const t = new Date(g.clock.today).getTime();
  // no season is longer than six weeks, so two months apart is a new season
  const fresh = now.filter((a) => !(seen[a.k] && t - seen[a.k]! < 60 * 864e5));
  if (!fresh.length) return null;
  for (const a of fresh) seen[a.k] = t;
  ex.season = seen;
  return fresh.map((a) => `${a.e} ${a.n} is in season: on the arena wheel ${seasonUntil(a)}`).join('. ');
}
