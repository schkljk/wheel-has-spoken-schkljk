// The content icons' pixels (a race's or class's face, a weapon on its own), without a canvas: the page turns
// them into canvases (portraits.ts), and the art tools bake the common ones into one image ahead of time
// (tools/art/bake.ts), so the first wheels don't have to draw a hundred faces while the game starts.
//
// Pure: no DOM.

import { ARCHS, ENCHANTS, RACES, WEAPONS } from '@whs/core';
import { buf, outline, toRGBA } from './px';
import { SPRITE_PH, SPRITE_PW, SPRITE_S, buildSprite, type Look } from './sprite';
import { weapon } from './sprite-weapons';
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
/** A face: the top of the sprite (the whole thing for pigeons and rubber ducks), in plain clothes unless a class is given. */
export const faceRGBA = (look: Look, rows = 30) =>
  cropRGBA(buildSprite({ name: look.race || 'x', arch: 'npc', ...look, weapon: 'Bare fists' }).body, SPRITE_PW, SPRITE_PH, rows * SPRITE_S);

export const weaponKey = (name: string, ench?: string) => `weapon|${name}|${ench ?? ''}`;
/** A weapon on its own (with its enchant's glow), held at an angle. */
export function weaponRGBA(name: string, ench?: string) {
  const B = buf(40, 40, SPRITE_S);
  weapon(B, name, ench, 10, 31);
  outline(B);
  return cropRGBA(toRGBA(B), B.w, B.h);
}

/** How each kind of wheel slice gets its icon: the look of a face, or a weapon. */
export const raceLook = (n: string): Look => ({ race: n });
export const archLook = (k: string): Look => ({ race: 'Human', arch: k, name: 'Class ' + k });

/** The icons every new fighter's first wheels show (race, class, weapon, enchant), by cache key. */
export function bakedIcons(): [key: string, draw: () => Rgba | null][] {
  return [
    ...RACES.map((r): [string, () => Rgba | null] => [faceKey(raceLook(r.n)), () => faceRGBA(raceLook(r.n))]),
    ...ARCHS.map((a): [string, () => Rgba | null] => [faceKey(archLook(a.k)), () => faceRGBA(archLook(a.k))]),
    ...WEAPONS.filter((w) => w.n !== 'Bare fists').map((w): [string, () => Rgba | null] => [weaponKey(w.n), () => weaponRGBA(w.n)]),
    ...ENCHANTS.filter((e) => e.k && e.k !== 'none').map((e): [string, () => Rgba | null] => [weaponKey('Sword', e.k), () => weaponRGBA('Sword', e.k)]),
  ];
}

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
