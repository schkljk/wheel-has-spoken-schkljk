// Content icons cut from the sprite art: a race's or class's face, a weapon on its own. Built once per name
// and cached as canvases (for Pixi, on the wheels) and PNG data URLs (for <img>). Browser only.

import { ARCHS, RACES, WEAPONS } from '@whs/core';
import { iconPixels } from '../ui/icon-pixels';
import { POWER_ICON } from './icons';
import { buf, outline, toRGBA } from './px';
import { SPRITE_H, SPRITE_W, buildSprite, type Look } from './sprite';
import { weapon } from './sprite-weapons';

const cache = new Map<string, HTMLCanvasElement | null>();
const urls = new Map<string, string | null>();

/** The square around the opaque pixels of an RGBA image (only the top `rows` rows when given). */
function crop(rgba: Uint8ClampedArray, w: number, h: number, rows?: number): HTMLCanvasElement | null {
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
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  const sx = src.getContext('2d')!;
  const id = sx.createImageData(w, h);
  id.data.set(rgba);
  sx.putImageData(id, 0, 0);
  const out = document.createElement('canvas');
  out.width = side;
  out.height = side;
  const cy = rows ? top : Math.round((top + bottom + 1) / 2 - side / 2);
  out.getContext('2d')!.drawImage(src, Math.round((l + r + 1) / 2 - side / 2), cy, side, side, 0, 0, side, side);
  return out;
}

function cached(key: string, make: () => HTMLCanvasElement | null): HTMLCanvasElement | null {
  if (cache.has(key)) return cache.get(key)!;
  let cv: HTMLCanvasElement | null = null;
  try {
    cv = make();
  } catch {
    cv = null;
  }
  cache.set(key, cv);
  return cv;
}
const url = (key: string, cv: () => HTMLCanvasElement | null) => {
  if (!urls.has(key)) urls.set(key, cv()?.toDataURL('image/png') ?? null);
  return urls.get(key)!;
};

/** A face: the top of the sprite (the whole thing for pigeons and rubber ducks), in plain clothes unless a class is given. */
export const faceCanvas = (look: Look, rows = 30) =>
  cached(`face|${look.race}|${look.rsub ?? ''}|${look.arch ?? ''}|${rows}`, () => crop(buildSprite({ name: look.race || 'x', arch: 'npc', ...look, weapon: 'Bare fists' }).body, SPRITE_W, SPRITE_H, rows));
export const facePortrait = (look: Look, rows = 30) => url(`face|${look.race}|${look.rsub ?? ''}|${look.arch ?? ''}|${rows}`, () => faceCanvas(look, rows));

/** A weapon on its own (with its enchant's glow), held at an angle. */
export const weaponCanvas = (name: string, ench?: string) =>
  cached(`weapon|${name}|${ench ?? ''}`, () => {
    const B = buf(40, 40);
    weapon(B, name, ench, 10, 31);
    outline(B);
    return crop(toRGBA(B), 40, 40);
  });
export const weaponPortrait = (name: string, ench?: string) => url(`weapon|${name}|${ench ?? ''}`, () => weaponCanvas(name, ench));

/** A pixel icon as a canvas (for Pixi). */
export const iconCanvas = (name: string) =>
  cached(`icon|${name}`, () => {
    const p = iconPixels(name);
    if (!p) return null;
    const cv = document.createElement('canvas');
    cv.width = cv.height = p.size;
    const x = cv.getContext('2d')!;
    const id = x.createImageData(p.size, p.size);
    p.px.forEach((c, i) => c && id.data.set([c[0], c[1], c[2], p.a ? p.a[i]! : 255], i * 4));
    x.putImageData(id, 0, 0);
    return cv;
  });

/** The icon for a wheel slice or collection entry, if its kind has one. */
export function contentCanvas(cat: string | undefined, it: { n: string; k?: string }, race?: string): HTMLCanvasElement | null {
  if (cat === 'race') return faceCanvas({ race: it.n });
  if (cat === 'rsub' && race) return faceCanvas({ race, rsub: it.n });
  if (cat === 'arch' && it.k) return faceCanvas({ race: 'Human', arch: it.k, name: 'Class ' + it.k });
  if (cat === 'weapon' && it.n !== 'Bare fists') return weaponCanvas(it.n);
  if (cat === 'ench' && it.k && it.k !== 'none') return weaponCanvas('Sword', it.k);
  if (cat === 'power' && it.k && POWER_ICON[it.k]) return iconCanvas(POWER_ICON[it.k]!);
  return null;
}

/**
 * Builds the race, class and weapon icons a few at a time while the browser is idle, so the first wheel that
 * shows them doesn't have to stop and draw 47 faces.
 */
export function warmPortraits() {
  const jobs: (() => unknown)[] = [
    ...RACES.map((r) => () => contentCanvas('race', r)),
    ...ARCHS.map((a) => () => contentCanvas('arch', a)),
    ...WEAPONS.map((w) => () => contentCanvas('weapon', w)),
  ];
  const idle = (f: (d?: IdleDeadline) => void) => ('requestIdleCallback' in window ? requestIdleCallback(f) : setTimeout(f, 40));
  const step = (d?: IdleDeadline) => {
    do jobs.shift()?.();
    while (jobs.length && d && d.timeRemaining() > 4);
    if (jobs.length) idle(step);
  };
  idle(step);
}
