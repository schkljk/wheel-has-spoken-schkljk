import { CHAPTERS, deserFighter, type SerFighter, type Slot } from '@whs/core';

/** "Level 7, chapter 3" / "Level 1, story not started" (legacy roster line). */
export function careerLine(c: SerFighter): string {
  const st = c.story;
  return `Level ${c.lvl || 1}, ${st ? `chapter ${st.ch}` : 'story not started'}`;
}

export const raceEmoji = (c: SerFighter) => deserFighter(c)?.race.e ?? '❔';

export const chapterName = (ch: number) => CHAPTERS[ch - 1]?.n ?? `Chapter ${ch}`;

export const slotCoins = (s: Slot | null) => (s ? s.coins : 0);
