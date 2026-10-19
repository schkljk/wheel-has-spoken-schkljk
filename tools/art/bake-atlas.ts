import { createHash } from 'node:crypto';
import { bakedIcons, packAtlas } from '../../apps/game/src/art/content-art';
import type { Rgba } from '../../apps/game/src/art/wheel-art';

/** Draws every baked icon and packs them into one RGBA image, with where each one is. */
export function bakeAtlas() {
  const drawn = bakedIcons()
    .map(([key, draw]) => ({ key, r: draw() }))
    .filter((x): x is { key: string; r: Rgba } => !!x.r);
  const { at, w, h } = packAtlas(drawn.map((x) => ({ key: x.key, w: x.r.w, h: x.r.h })));
  const d = new Uint8ClampedArray(w * h * 4);
  for (const { key, r } of drawn) {
    const [x0, y0] = at[key]!;
    for (let y = 0; y < r.h; y++) d.set(r.d.subarray(y * r.w * 4, (y + 1) * r.w * 4), ((y0 + y) * w + x0) * 4);
  }
  // keys sorted, so the file only changes when the art does
  const sorted = Object.fromEntries(Object.keys(at).sort().map((k) => [k, at[k]!]));
  // the pixels' fingerprint: the test that keeps the baked image current compares it
  const hash = createHash('sha1').update(d).digest('hex');
  return { img: { w, h, d }, index: { hash, at: sorted } };
}
