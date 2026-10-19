import type { ChapterEvent } from '../data/content/chapter-events';
import { applyBonus } from '../fighter';
import { bestStat } from '../stats';
import { deserFighter, type CareerFighter } from '../save/fighter';
import type { StatKey } from '../types';
import { STATN, invalidate, type Retired } from './career';
import type { Game } from './game';

/**
 * Mentors (review F10): a retired fighter can mentor a new one. The new fighter starts with +1 to the mentor's
 * best stat, and the mentor drops by on the map once a chapter at most, with opinions and a thermos.
 */
export interface Mentor {
  n: string;
  e: string;
  /** the stat they teach: their best */
  k: StatKey;
}

/** Who can mentor: the retired fighters the hall of fame kept, best first (three at most). */
export function mentorOptions(g: Game): (Mentor & { s: string })[] {
  const out: (Mentor & { s: string })[] = [];
  for (const r of ((g.save.roster.retired || []) as unknown as Retired[]).filter(Boolean).sort((a, b) => (b.score || 0) - (a.score || 0))) {
    const f = r.fd && deserFighter(r.fd);
    if (!f) continue;
    out.push({ n: f.name || r.n, e: r.e || f.race.e, k: bestStat(f), s: r.s });
    if (out.length >= 3) break;
  }
  return out;
}

/** The new fighter takes a mentor: +1 to what they teach. */
export function takeMentor(f: CareerFighter, m: Mentor) {
  f.mentor = { n: m.n, e: m.e, k: m.k };
  applyBonus(f, { k: m.k, n: `+1 ${STATN[m.k]} from ${m.n}`, e: '🎓' });
  invalidate(f);
}

/** The mentor's name in an encounter's text. */
export const withMentor = (s: string, g: Pick<Game, 'F'>) => s.replace(/\{m\}/g, g.F?.mentor?.n ?? 'your mentor');

/** The mentor's cameo on the map: one encounter, any chapter, at most once a chapter. */
export const MENTOR_EVENT: ChapterEvent = {
  k: 'mentor',
  ch: 0,
  e: '🎓',
  t: '{m} drops by',
  d: 'Your old mentor, {m}, retired and extremely bored, shows up with opinions and a thermos.',
  o: [
    { l: '"Show me that thing again"', fx: { readB: 0.2 }, txt: '{m} shows you the thing. You will never admit it helped. It helped.' },
    { l: 'Spar, for old times', fx: { dmgX: 1.15 }, txt: '{m} still hits like a truck. You hit back like a slightly smaller truck.' },
    { l: 'Share the thermos', fx: { heal: 25 }, txt: 'It is soup. It is always soup. You feel better anyway.' },
  ],
  talk: { need: 30, l: 'Ask about the secret technique', fx: { readB: 0.25, dmgX: 1.1 }, txt: '"There is no secret." There was a secret. You saw it.' },
};
