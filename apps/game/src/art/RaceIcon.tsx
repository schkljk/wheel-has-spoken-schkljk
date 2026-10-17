import { SPRITE_H, SPRITE_W, buildSprite } from './sprite';

const cache = new Map<string, string | null>();

/**
 * A race's portrait: the top of its pixel sprite (the head for most, the whole thing for pigeons and rubber
 * ducks), cropped square from the sprite's own outline and drawn in plain clothes.
 */
function portrait(race: string): string | null {
  if (cache.has(race)) return cache.get(race)!;
  let url: string | null = null;
  try {
    const px = buildSprite({ name: race, race, arch: 'npc' }).body;
    const W = SPRITE_W;
    const H = SPRITE_H;
    const on = (x: number, y: number) => px[(y * W + x) * 4 + 3]! > 0;
    let top = H;
    let bottom = -1;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (on(x, y)) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    const rows = Math.min(28, bottom - top + 1);
    let l = W;
    let r = -1;
    for (let y = top; y < top + rows; y++)
      for (let x = 0; x < W; x++)
        if (on(x, y)) {
          l = Math.min(l, x);
          r = Math.max(r, x);
        }
    const side = Math.max(rows, r - l + 1);
    const src = document.createElement('canvas');
    src.width = W;
    src.height = H;
    const sx = src.getContext('2d')!;
    const id = sx.createImageData(W, H);
    id.data.set(px);
    sx.putImageData(id, 0, 0);
    const out = document.createElement('canvas');
    out.width = side;
    out.height = side;
    out.getContext('2d')!.drawImage(src, Math.round((l + r + 1) / 2 - side / 2), top, side, side, 0, 0, side, side);
    url = out.toDataURL('image/png');
  } catch {
    url = null;
  }
  cache.set(race, url);
  return url;
}

/** A race as a pixel portrait (its emoji if the sprite can't be drawn). */
export function RaceIcon({ race, e, class: cls }: { race: string; e?: string; class?: string }) {
  const url = portrait(race);
  if (!url) return <span class={cls}>{e}</span>;
  return <img class={`pxi race${cls ? ' ' + cls : ''}`} src={url} alt="" aria-hidden="true" />;
}
