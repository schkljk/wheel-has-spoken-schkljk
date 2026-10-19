// Content icons cut from the sprite art: a race's or class's face, a weapon on its own. Built once per name
// and cached as canvases (for Pixi, on the wheels) and PNG data URLs (for <img>). Browser only.

import { ARCHS, RACES, WEAPONS } from '@whs/core';
import { iconPixels } from '../ui/icon-pixels';
import { POWER_ICON } from './icons';
import { drawDeco } from './map-deco';
import { mapTheme } from './map-themes';
import { toRGBA } from './px';
import { cpuCanvas } from './canvas';
import { SPRITE_PH, SPRITE_PW, SPRITE_S, buildSprite, type Look } from './sprite';
import { archLook, cropRGBA, faceKey, faceRGBA, raceLook, weaponKey, weaponRGBA } from './content-art';
import type { Rgba } from './wheel-art';
// the baked race, class, weapon and enchant icons (tools/art/bake.ts): the image and where each one is in it
import ATLAS_URL from './baked/content.png?url';
import ATLAS from './baked/content.json';

const cache = new Map<string, HTMLCanvasElement | null>();
const urls = new Map<string, string | null>();
// every fighter's face is its own entry, so a long session would keep adding: the oldest go past this many
const MAX = 400;
const capped = <V,>(m: Map<string, V>, k: string, v: V) => {
  m.set(k, v);
  if (m.size > MAX) m.delete(m.keys().next().value!);
};

/** A canvas holding RGBA pixels (CPU-backed: they get read back as images). */
function rgbaCanvas(r: Rgba | null): HTMLCanvasElement | null {
  if (!r) return null;
  const [cv, x] = cpuCanvas(r.w, r.h);
  const id = x.createImageData(r.w, r.h);
  id.data.set(r.d);
  x.putImageData(id, 0, 0);
  return cv;
}
const crop = (rgba: Uint8ClampedArray, w: number, h: number, rows?: number) => rgbaCanvas(cropRGBA(rgba, w, h, rows));

// ---------------------------------------------------------------- the baked atlas
// The race, class, weapon and enchant icons are drawn ahead of time into one image (tools/art/bake.ts); while it
// loads, or if it can't, they are drawn here as before.
let atlas: ImageBitmap | HTMLImageElement | null = null;
let atlasLoad: Promise<void> | null = null;
/** Starts loading the baked icons (once). */
export function loadAtlas(): Promise<void> {
  return (atlasLoad ??= (async () => {
    try {
      const r = await fetch(ATLAS_URL);
      if (!r.ok) return;
      const b = await r.blob();
      atlas = 'createImageBitmap' in window ? await createImageBitmap(b) : await new Promise<HTMLImageElement>((ok, no) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = no;
        im.src = URL.createObjectURL(b);
      });
    } catch {
      atlas = null;
    }
  })());
}
function fromAtlas(key: string): HTMLCanvasElement | null {
  const at = atlas && (ATLAS.at as unknown as Record<string, [number, number, number, number]>)[key];
  if (!at) return null;
  const [x, y, w, h] = at;
  const [cv, c] = cpuCanvas(w, h);
  c.drawImage(atlas!, x, y, w, h, 0, 0, w, h);
  return cv;
}

function cached(key: string, make: () => HTMLCanvasElement | null): HTMLCanvasElement | null {
  if (cache.has(key)) return cache.get(key)!;
  let cv: HTMLCanvasElement | null = null;
  try {
    cv = fromAtlas(key) ?? make();
  } catch {
    cv = null;
  }
  capped(cache, key, cv);
  return cv;
}
const url = (key: string, cv: () => HTMLCanvasElement | null) => {
  if (!urls.has(key)) capped(urls, key, cv()?.toDataURL('image/png') ?? null);
  return urls.get(key)!;
};

/** A face: the top of the sprite (the whole thing for pigeons and rubber ducks), in plain clothes unless a class is given. */
export const faceCanvas = (look: Look, rows = 30) => cached(faceKey(look, rows), () => rgbaCanvas(faceRGBA(look, rows)));
export const facePortrait = (look: Look, rows = 30) => url(faceKey(look, rows), () => faceCanvas(look, rows));
/** A chapter's badge: the piece of its map's scenery that stands for it (a bin for the alley, a gear for the citadel). */
export const chapterIcon = (ch: number) =>
  url(`chap|${ch}`, () =>
    cached(`chap|${ch}`, () => {
      const d = drawDeco(mapTheme(ch).icon, () => 0.3, SPRITE_S);
      return d ? crop(toRGBA(d.B), d.B.w, d.B.h) : null;
    }),
  );
/** One fighter's own face: their skin, hair and class outfit (the name picks the first two), for avatars. */
export const fighterFace = (look: Look) =>
  url(`fface|${look.name}|${look.race}|${look.rsub ?? ''}|${look.arch ?? ''}|${look.boss ?? ''}`, () =>
    cached(`fface|${look.name}|${look.race}|${look.rsub ?? ''}|${look.arch ?? ''}|${look.boss ?? ''}`, () =>
      crop(buildSprite({ ...look, weapon: 'Bare fists' }).body, SPRITE_PW, SPRITE_PH, 30 * SPRITE_S),
    ),
  );

/** A weapon on its own (with its enchant's glow), held at an angle. */
export const weaponCanvas = (name: string, ench?: string) => cached(weaponKey(name, ench), () => rgbaCanvas(weaponRGBA(name, ench)));
export const weaponPortrait = (name: string, ench?: string) => url(weaponKey(name, ench), () => weaponCanvas(name, ench));

/** A pixel icon as a canvas (for Pixi), `s` real pixels per art pixel. */
export const iconCanvas = (name: string, s = 1) =>
  cached(`icon|${name}|${s}`, () => {
    const p = iconPixels(name, undefined, s);
    if (!p) return null;
    const [cv, x] = cpuCanvas(p.size, p.size);
    const id = x.createImageData(p.size, p.size);
    p.px.forEach((c, i) => c && id.data.set([c[0], c[1], c[2], p.a ? p.a[i]! : 255], i * 4));
    x.putImageData(id, 0, 0);
    return cv;
  });

/** The icon for a wheel slice or collection entry, if its kind has one. */
export function contentCanvas(cat: string | undefined, it: { n: string; k?: string }, race?: string): HTMLCanvasElement | null {
  if (cat === 'race') return faceCanvas(raceLook(it.n));
  if (cat === 'rsub' && race) return faceCanvas({ race, rsub: it.n });
  if (cat === 'arch' && it.k) return faceCanvas(archLook(it.k));
  if (cat === 'weapon' && it.n !== 'Bare fists') return weaponCanvas(it.n);
  if (cat === 'ench' && it.k && it.k !== 'none') return weaponCanvas('Sword', it.k);
  if (cat === 'power' && it.k && POWER_ICON[it.k]) return iconCanvas(POWER_ICON[it.k]!, 2);
  return null;
}

/**
 * Gets the race, class and weapon icons ready while the browser is idle, so the first wheel that shows them
 * doesn't have to stop and draw 47 faces: from the baked image when it loads, drawn a few at a time otherwise.
 */
export function warmPortraits() {
  void loadAtlas().then(() => {
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
  });
}
