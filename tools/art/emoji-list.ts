// Every emoji the game can show: any in the game's source (data tables, rules and screens). The baked emoji image
// (bake-emoji.ts) holds these; ones with a hand-drawn icon (EMOJI_ICON) are drawn from that instead.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { EMOJI_ICON, EMOJI_RE } from '../../apps/game/src/art/emoji-draw';

const ROOT = resolve(import.meta.dirname, '../..');
const DIRS = ['packages/core/src', 'apps/game/src'];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}
/** Has a hand-drawn icon (emoji-px.ts looks it up with and without U+FE0F). */
export const handDrawn = (e: string) => !!(EMOJI_ICON[e] ?? EMOJI_ICON[e.replace(/️/g, '')] ?? EMOJI_ICON[e + '️']);

/** The emojis to bake, sorted (so the image only changes when the list or the art does). */
export function gameEmojis(): string[] {
  const out = new Set<string>();
  for (const d of DIRS) for (const f of files(join(ROOT, d))) for (const m of readFileSync(f, 'utf8').matchAll(new RegExp(EMOJI_RE.source, 'gu'))) out.add(m[0]);
  return [...out].filter((e) => !handDrawn(e)).sort();
}
