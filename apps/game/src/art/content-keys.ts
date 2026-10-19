// The content icons' keys and the pure helpers around them (cropping, packing), without the sprite drawing code:
// the page reads these in its first chunk, and draws a missing icon once the drawing code has loaded
// (sprite-lazy.ts). content-art.ts draws them. Pure: no DOM.

import type { Look } from './sprite-look';
import type { Rgba } from './wheel-art';

/** The square around the opaque pixels of an RGBA image (only the top `rows` rows when given). */
export function cropRGBA(rgba: Uint8ClampedArray, w: number, h: number, rows?: number): Rgba | null {
  const on = (x: number, y: number) => rgba[(y * w + x) * 4 + 3]! > 0;
  let top = h,
    bottom = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (on(x, y)) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  if (bottom < 0) return null;
  const n = rows ? Math.min(rows, bottom - top + 1) : bottom - top + 1;
  let l = w,
    r = -1;
  for (let y = top; y < top + n; y++)
    for (let x = 0; x < w; x++)
      if (on(x, y)) {
        l = Math.min(l, x);
        r = Math.max(r, x);
      }
  const side = Math.max(n, r - l + 1);
  const x0 = Math.round((l + r + 1) / 2 - side / 2);
  const y0 = rows ? top : Math.round((top + bottom + 1) / 2 - side / 2);
  // a copy of that square (anything outside the image stays clear)
  const d = new Uint8ClampedArray(side * side * 4);
  for (let y = 0; y < side; y++)
    for (let x = 0; x < side; x++) {
      const sx = x0 + x,
        sy = y0 + y;
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
      const i = (sy * w + sx) * 4,
        o = (y * side + x) * 4;
      d[o] = rgba[i]!;
      d[o + 1] = rgba[i + 1]!;
      d[o + 2] = rgba[i + 2]!;
      d[o + 3] = rgba[i + 3]!;
    }
  return { w: side, h: side, d };
}

export const faceKey = (look: Look, rows = 30) => `face|${look.race}|${look.rsub ?? ''}|${look.arch ?? ''}|${rows}`;
export const weaponKey = (name: string, ench?: string) => `weapon|${name}|${ench ?? ''}`;

/** How each kind of wheel slice gets its icon: the look of a face, or a weapon. */
export const raceLook = (n: string): Look => ({ race: n });
export const archLook = (k: string): Look => ({ race: 'Human', arch: k, name: 'Class ' + k });

/** Shelf-packs icons into one image `W` wide: where each one goes, and the image's height. */
export function packAtlas(icons: { key: string; w: number; h: number }[], W = 1024) {
  const at: Record<string, [x: number, y: number, w: number, h: number]> = {};
  let x = 0,
    y = 0,
    row = 0;
  for (const it of [...icons].sort((a, b) => b.h - a.h)) {
    if (x + it.w > W) {
      x = 0;
      y += row + 1;
      row = 0;
    }
    at[it.key] = [x, y, it.w, it.h];
    x += it.w + 1;
    row = Math.max(row, it.h);
  }
  return { at, w: W, h: y + row };
}
