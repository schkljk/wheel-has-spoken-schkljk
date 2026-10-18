import { CHAPTERS } from '@whs/core';
import { chapterIcon } from './portraits';

/** A chapter's pixel badge (its emoji if it can't be drawn). */
export function ChapterIcon({ ch }: { ch: number }) {
  const url = chapterIcon(ch);
  if (!url) return <span aria-hidden="true">{CHAPTERS[ch - 1]?.e}</span>;
  return <img class="pxi chap" src={url} alt="" aria-hidden="true" />;
}
