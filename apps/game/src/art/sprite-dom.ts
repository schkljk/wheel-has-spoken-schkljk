// Browser side of the pixel sprites: turns the RGBA layers from sprite.ts into PNG data URLs (legacy toURL)
// and keeps the recent ones (legacy charSVG kept 140 in insertion order; this one is least-recently-used).

import { SPRITE_H, SPRITE_PH, SPRITE_PW, SPRITE_W, buildSprite, spriteKey, type Look } from './sprite';

/** A sprite ready for <image href>: both layers as PNG data URLs, arm pivot in viewBox units (100 x 120). */
export interface SpriteImages {
  body: string;
  arm: string;
  sx: number;
  sy: number;
}

const MAX = 200;
const cache = new Map<string, SpriteImages>();

/** RGBA bytes -> PNG data URL through a canvas (legacy toURL). */
function toURL(rgba: Uint8ClampedArray): string {
  const cv = document.createElement('canvas');
  cv.width = SPRITE_PW;
  cv.height = SPRITE_PH;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('2d canvas unavailable');
  const id = ctx.createImageData(SPRITE_PW, SPRITE_PH);
  id.data.set(rgba);
  ctx.putImageData(id, 0, 0);
  return cv.toDataURL('image/png');
}

/**
 * The images for a look, built once and cached by everything that changes the pixels. Returns null when there
 * is nothing to draw yet (no race) or the build failed; callers then show the mystery silhouette.
 */
export function spriteImages(look: Look): SpriteImages | null {
  if (!look.race) return null;
  const k = spriteKey(look);
  const hit = cache.get(k);
  if (hit) {
    // move to the back: the oldest entry is the least recently used
    cache.delete(k);
    cache.set(k, hit);
    return hit;
  }
  let c: SpriteImages;
  try {
    const s = buildSprite(look);
    // legacy buildBody scaled the pivot into the 100x120 viewBox exactly like this
    c = { body: toURL(s.body), arm: toURL(s.arm), sx: (s.sx * 100) / SPRITE_W, sy: (s.sy * 120) / SPRITE_H };
  } catch (e) {
    console.warn('sprite failed', e);
    return null;
  }
  cache.set(k, c);
  if (cache.size > MAX) cache.delete(cache.keys().next().value!);
  return c;
}

/** Forget every cached sprite (e.g. after a big roster change, or in tests). */
export function clearSpriteCache() {
  cache.clear();
}
