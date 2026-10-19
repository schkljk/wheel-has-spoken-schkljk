// Bakes every emoji the game shows (emoji-list.ts) as pixel art, one image per size (16 for the page, 32 for wheels
// and fights), so the game doesn't redraw them on every launch: 2.7 s of work per fighter build on a mid-range
// phone. The pixel art comes from a browser's emoji (Noto Color Emoji, as on Android), drawn by the game's own
// code (art/emoji-draw.ts) in Chromium. Run after adding emojis: npm run bake:emoji (needs the Playwright
// browser). `--check` compares the baked images with a fresh drawing instead. The game draws any emoji missing
// from the images itself, as before.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { build } from 'esbuild';
import { gameEmojis } from './emoji-list';
import { png } from './png';

export const EMOJI_SIZES = [16, 32] as const;
const out = resolve(import.meta.dirname, '../../apps/game/src/art/baked');

/** The emojis drawn in the page at every size: RGBA per picture (none for an emoji the browser can't draw). */
async function draw(page: Page, list: string[]) {
  const js = (
    await build({ entryPoints: [resolve(import.meta.dirname, '../../apps/game/src/art/emoji-draw.ts')], bundle: true, write: false, format: 'iife', globalName: 'EmojiDraw', target: 'es2022' })
  ).outputFiles[0]!.text;
  await page.addScriptTag({ content: js });
  return page.evaluate(
    ({ list, sizes }) => {
      const D = (globalThis as unknown as { EmojiDraw: { pixelEmoji: (e: string, s: number) => HTMLCanvasElement | null } }).EmojiDraw;
      const res: { e: string; size: number; w: number; h: number; d: number[] }[] = [];
      for (const e of list)
        for (const size of sizes) {
          const cv = D.pixelEmoji(e, size);
          if (cv) res.push({ e, size, w: cv.width, h: cv.height, d: Array.from(cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height).data) });
        }
      return res;
    },
    { list, sizes: [...EMOJI_SIZES] },
  );
}

/** The pictures of `file` (as this browser decodes it) that differ from `d`, by grid index. */
function differing(page: Page, file: string, w: number, h: number, d: Uint8ClampedArray, tile: number, n: number) {
  return page.evaluate(
    async ({ b64, w, h, d, tile, n }) => {
      const im = new Image();
      im.src = 'data:image/png;base64,' + b64;
      await im.decode();
      if (im.width !== w || im.height !== h) return [-1];
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true })!;
      x.drawImage(im, 0, 0);
      const got = x.getImageData(0, 0, w, h).data;
      const cols = Math.floor(w / tile);
      const bad: number[] = [];
      for (let i = 0; i < n; i++) {
        const x0 = (i % cols) * tile,
          y0 = Math.floor(i / cols) * tile;
        let diff = false;
        for (let y = y0; y < y0 + tile && !diff; y++) for (let k = (y * w + x0) * 4; k < (y * w + x0 + tile) * 4; k++) if (got[k] !== d[k]) diff = true;
        if (diff) bad.push(i);
      }
      return bad;
    },
    { b64: readFileSync(file).toString('base64'), w, h, d: Array.from(d), tile, n },
  );
}

async function main(check: boolean) {
  const list = gameEmojis();
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  const drawn = await draw(page, list);
  // every picture of a size is the same square (its outline included): the image is a grid in the list's order.
  // The page's (16) loads at startup, the wheels' and fights' (32) with the Pixi chunk.
  for (const size of EMOJI_SIZES) {
    const tile = size + 2;
    const mine = drawn.filter((x) => x.size === size);
    if (mine.some((x) => x.w !== tile || x.h !== tile)) throw new Error(`an emoji picture at ${size} px is not ${tile}x${tile}`);
    const cols = Math.floor(1024 / tile);
    const w = cols * tile,
      h = Math.ceil(mine.length / cols) * tile;
    const d = new Uint8ClampedArray(w * h * 4);
    mine.forEach((x, i) => {
      const x0 = (i % cols) * tile,
        y0 = Math.floor(i / cols) * tile;
      for (let y = 0; y < tile; y++) d.set(x.d.slice(y * tile * 4, (y + 1) * tile * 4), ((y0 + y) * w + x0) * 4);
    });
    const file = resolve(out, `emoji-${size}.png`);
    if (check) {
      const bad = await differing(page, file, w, h, d, tile, mine.length);
      console.log(`${file}: ${bad.length ? `${bad.length} pictures differ from what this browser draws (${bad.map((i) => mine[i]?.e ?? 'size').join(' ')}): npm run bake:emoji` : `all ${mine.length} match what this browser draws`}`);
      continue;
    }
    const hash = createHash('sha1').update(d).digest('hex');
    writeFileSync(file, png(w, h, d, true));
    writeFileSync(resolve(out, `emoji-${size}.json`), JSON.stringify({ hash, tile, cols, list: mine.map((x) => x.e) }) + '\n');
    console.log(`baked ${mine.length} emojis at ${size} px into ${w}x${h}`);
  }
  const none = list.filter((e) => !drawn.some((x) => x.e === e));
  if (none.length) console.log(`not drawable here: ${none.join(' ')}`);
  await browser.close();
}

if (import.meta.url === `file://${process.argv[1]}`) await main(process.argv.includes('--check'));
