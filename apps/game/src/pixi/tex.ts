import { Texture } from 'pixi.js';

/**
 * A texture for a canvas the game keeps (icons, art, sprites). It stays out of Pixi's global texture cache, which
 * held every canvas ever drawn for good, and its GPU copy is let go once it hasn't been drawn for a minute
 * (Pixi's GC; it is uploaded again if it is drawn again). Without this, about 6 GL textures a fight never left.
 */
export function canvasTexture(cv: HTMLCanvasElement, scaleMode: 'nearest' | 'linear' = 'nearest'): Texture {
  const t = Texture.from(cv, true);
  t.source.scaleMode = scaleMode;
  t.source.autoGarbageCollect = true;
  return t;
}
