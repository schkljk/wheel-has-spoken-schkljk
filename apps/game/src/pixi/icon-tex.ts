import { Texture } from 'pixi.js';
import { PALETTE } from '../ui/icon-data';
import { ICONS } from '../ui/Icon';

const cache = new Map<string, Texture>();

/** A 12x12 pixel icon as a crisp Pixi texture (kept for the whole session, shared by every scene). */
export function iconTexture(name: string): Texture {
  let t = cache.get(name);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 12;
  const x = c.getContext('2d')!;
  (ICONS[name] ?? []).forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]!;
      if (ch === '.') continue;
      x.fillStyle = PALETTE[ch] ?? '#000';
      x.fillRect(i, y, 1, 1);
    }
  });
  t = Texture.from(c);
  t.source.scaleMode = 'nearest';
  cache.set(name, t);
  return t;
}
