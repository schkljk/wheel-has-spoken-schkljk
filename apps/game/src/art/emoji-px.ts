// Every emoji the game shows becomes a pixel icon, in the same style as the drawn ones. The common ones map to a
// hand-drawn icon (art/icons.ts); the rest come from the baked emoji images (tools/art/bake-emoji.ts: pixelized
// ahead of time from Noto Color Emoji, the emoji Android phones have), or are pixelized here from the phone's
// own emoji if they are missing or still loading (emoji-draw.ts). Browser only.

import { cpuCanvas } from './canvas';
import { iconCanvas } from './portraits';
import { EMOJI_ICON, pixelEmoji } from './emoji-draw';
import E16_URL from './baked/emoji-16.png?url';
import E32_URL from './baked/emoji-32.png?url';
import E16 from './baked/emoji-16.json';
import E32 from './baked/emoji-32.json';

export { EMOJI_ICON, pixelEmoji };

// ---------------------------------------------------------------- the baked images
/** One baked image: every emoji at one size, as a grid of `tile` squares in the order of `list`. */
interface Sheet {
  meta: { tile: number; cols: number; list: string[] };
  url: string;
  img: ImageBitmap | HTMLImageElement | null;
  load: Promise<void> | null;
  at: Map<string, number> | null;
}
const SHEETS: Record<16 | 32, Sheet> = {
  16: { meta: E16, url: E16_URL, img: null, load: null, at: null },
  32: { meta: E32, url: E32_URL, img: null, load: null, at: null },
};
/**
 * Starts loading the baked emojis at one size (once): 16 for the page, at startup; 32 for wheels and fights, with
 * the Pixi chunk.
 */
export function loadEmojiSheet(size: 16 | 32): Promise<void> {
  const S = SHEETS[size];
  return (S.load ??= (async () => {
    try {
      const r = await fetch(S.url);
      if (!r.ok) return;
      const b = await r.blob();
      S.img =
        'createImageBitmap' in window
          ? await createImageBitmap(b)
          : await new Promise<HTMLImageElement>((ok, no) => {
              const im = new Image();
              im.onload = () => ok(im);
              im.onerror = no;
              im.src = URL.createObjectURL(b);
            });
    } catch {
      S.img = null;
    }
  })());
}
function fromSheet(e: string, size: 16 | 32): HTMLCanvasElement | null {
  const S = SHEETS[size];
  if (!S.img) {
    void loadEmojiSheet(size);
    return null;
  }
  S.at ??= new Map(S.meta.list.map((x, i) => [x, i]));
  const i = S.at.get(e);
  if (i == null) return null;
  const { tile, cols } = S.meta;
  const [cv, c] = cpuCanvas(tile, tile);
  c.drawImage(S.img, (i % cols) * tile, Math.floor(i / cols) * tile, tile, tile, 0, 0, tile, tile);
  return cv;
}

// ---------------------------------------------------------------- canvases and URLs, kept
// a few hundred emojis exist; a long session never needs more than this many of each kind at once
const MAX = 700;
const keep = <V,>(m: Map<string, V>, k: string, v: V) => {
  m.set(k, v);
  if (m.size > MAX) m.delete(m.keys().next().value!);
  return v;
};

const canvases = new Map<string, HTMLCanvasElement | null>();
/**
 * The pixel icon for an emoji as a canvas (a hand-drawn icon when there is one), for Pixi and the wheels; `fine`
 * draws it at twice the detail, for pictures shown big.
 */
export function emojiCanvas(e: string, fine = false): HTMLCanvasElement | null {
  const key = fine ? e + '|fine' : e;
  const hit = canvases.get(key);
  if (hit !== undefined) return hit;
  let cv: HTMLCanvasElement | null = null;
  try {
    const name = EMOJI_ICON[e] ?? EMOJI_ICON[e.replace(/️/g, '')] ?? EMOJI_ICON[e + '️'];
    cv = name ? iconCanvas(name, fine ? 2 : 1) : (fromSheet(e, fine ? 32 : 16) ?? pixelEmoji(e, fine ? 32 : 16));
  } catch {
    cv = null;
  }
  return keep(canvases, key, cv);
}

const urls = new Map<string, string | null>();
/** The same icon as an image URL, for the page. */
export function emojiUrl(e: string): string | null {
  const hit = urls.get(e);
  if (hit !== undefined) return hit;
  const cv = emojiCanvas(e);
  return keep(urls, e, cv ? cv.toDataURL('image/png') : null);
}
