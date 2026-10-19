import type { Texture } from 'pixi.js';
import { canvasTexture } from './tex';
import { iconPixels } from '../ui/icon-pixels';

const cache = new Map<string, Texture>();

/** A pixel icon as a crisp Pixi texture (kept for the whole session, shared by every scene). */
export function iconTexture(name: string): Texture {
  let t = cache.get(name);
  if (t) return t;
  const p = iconPixels(name);
  const n = p?.size ?? 16;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const x = c.getContext('2d')!;
  if (p) {
    const id = x.createImageData(n, n);
    p.px.forEach((col, i) => {
      if (!col) return;
      id.data.set([col[0], col[1], col[2], p.a ? p.a[i]! : 255], i * 4);
    });
    x.putImageData(id, 0, 0);
  }
  t = canvasTexture(c);
  cache.set(name, t);
  return t;
}
