// The wheels as pixel art, drawn with the sprites' engine (px.ts): a face that turns (slices with banded
// shading, outlined dividers and a gold peg on every edge), and the parts that stay put (a bevelled gold rim,
// the bulbs around it, the pointer and the hub). Sizes are in art pixels; the wheel scales them up whole.
//
// Pure: no DOM.

import { BASE, DEEP, LIT, OLN, SHD, SHINE, C, E, P, RP, S, buf, ell, minus, outline, toRGBA, type RGB } from './px';

const TAU = Math.PI * 2;
export interface Rgba {
  w: number;
  h: number;
  d: Uint8ClampedArray;
}

/** Slice colors by quality (cooked .. goated), two per quality so neighbours differ. */
export const SLICE_COLORS: [string, string][] = [
  ['#5b6478', '#4c5568'],
  ['#5b4bb7', '#4e40a3'],
  ['#0e9f8e', '#0b8a7b'],
  ['#e8a93a', '#d99a2b'],
];

/**
 * The turning face, n x n: slices from the top going clockwise (`spans` in radians), shaded in bands from the
 * hub out, a dark divider with a lit edge between slices, and a gold peg at the rim end of every divider.
 * The middle (inside `hole` of the radius) stays clear for the hub.
 */
export function wheelFace(n: number, spans: number[], colors: string[], hole = 0.2): Rgba {
  const d = new Uint8ClampedArray(n * n * 4);
  const c = n / 2;
  const R = n / 2 - 0.5;
  const edges: number[] = [];
  let a = 0;
  for (const s of spans) {
    edges.push(a);
    a += s;
  }
  const ramps = colors.map((h) => RP(h));
  const put = (x: number, y: number, col: RGB) => {
    const i = (y * n + x) * 4;
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = x + 0.5 - c,
        dy = y + 0.5 - c;
      const r = Math.hypot(dx, dy);
      if (r > R || r < R * hole) continue;
      // angle from the top, clockwise
      let ang = Math.atan2(dx, -dy);
      if (ang < 0) ang += TAU;
      let i = edges.length - 1;
      for (let k = 0; k < edges.length; k++)
        if (ang < edges[k]! + spans[k]!) {
          i = k;
          break;
        }
      const Rm = ramps[i % ramps.length]!;
      // how far (in pixels, along the arc) from this slice's start and end edges
      const fromStart = (ang - edges[i]!) * r,
        toEnd = (edges[i]! + spans[i]! - ang) * r;
      const t = r / R;
      let tone = t > 0.9 ? LIT : t < hole + 0.12 ? SHD : BASE;
      // a dithered seam between the bands, the way pixel artists blend
      if ((t > 0.875 && t <= 0.9 && (x + y) % 2 === 0) || (t >= hole + 0.12 && t < hole + 0.145 && (x + y) % 2 === 0)) tone = t > 0.5 ? LIT : SHD;
      if (toEnd < 1.1) tone = OLN;
      else if (fromStart < 1.2) tone = LIT;
      else if (t > 0.965) tone = SHD;
      put(x, y, Rm[tone]!);
    }
  // a gold peg where each divider meets the rim
  const gold = RP('#F2B544');
  const pr = Math.max(1, n / 70);
  for (const e of edges) {
    const px = c + Math.sin(e) * (R - pr - 1.2),
      py = c - Math.cos(e) * (R - pr - 1.2);
    for (let y = Math.floor(py - pr - 1); y <= Math.ceil(py + pr + 1); y++)
      for (let x = Math.floor(px - pr - 1); x <= Math.ceil(px + pr + 1); x++) {
        const q = Math.hypot(x + 0.5 - px, y + 0.5 - py);
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        if (q <= pr) put(x, y, gold[q < pr * 0.5 && x + 0.5 < px && y + 0.5 < py ? SHINE : x + 0.5 < px ? LIT : BASE]!);
        else if (q <= pr + 1) put(x, y, gold[OLN]!);
      }
  }
  return { w: n, h: n, d };
}

/** One slice's shape, white, for the glow over the slice that won. */
export function sliceMask(n: number, a0: number, a1: number, hole = 0.2): Rgba {
  const d = new Uint8ClampedArray(n * n * 4);
  const c = n / 2,
    R = n / 2 - 0.5;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = x + 0.5 - c,
        dy = y + 0.5 - c;
      const r = Math.hypot(dx, dy);
      if (r > R || r < R * hole) continue;
      let ang = Math.atan2(dx, -dy);
      if (ang < 0) ang += TAU;
      if (ang < a0 || ang >= a1) continue;
      const i = (y * n + x) * 4;
      const edge = (ang - a0) * r < 1.2 || (a1 - ang) * r < 1.2 || r > R - 1.2 || r < R * hole + 1.2;
      d[i] = 255;
      d[i + 1] = edge ? 214 : 255;
      d[i + 2] = edge ? 90 : 255;
      d[i + 3] = edge ? 255 : 110;
    }
  return { w: n, h: n, d };
}

/** The rim that stays put: a bevelled gold ring, outlined, `n` across with a ring `rw` wide. */
export function wheelRim(n: number, rw: number, col = '#E0A13A', lip = '#8C5E14'): Rgba {
  const B = buf(n + 2, n + 2);
  const c = (n + 2) / 2,
    R = n / 2 - 0.5;
  S(B, minus(ell(c, c, R, R), ell(c, c, R - rw, R - rw)), 0, 0, n + 2, n + 2, RP(col), { bv: Math.max(2, rw / 2), shine: true, ol: true });
  // an inner lip, darker, where the rim meets the face
  S(B, minus(ell(c, c, R - rw + 1, R - rw + 1), ell(c, c, R - rw, R - rw)), 0, 0, n + 2, n + 2, RP(lip), { bv: 0, tone: SHD, onto: true });
  outline(B);
  return { w: B.w, h: B.h, d: toRGBA(B) };
}

/** A bulb on the rim: lit (warm white with a glow) or not (dim amber). */
export function bulb(on: boolean, s: number): Rgba {
  const n = s + 4;
  const B = buf(n, n);
  const c = n / 2;
  if (on) {
    E(B, c, c, s / 2 + 1.6, s / 2 + 1.6, RP('#FFE27A'), { bv: 0, tone: BASE, al: 90 });
    E(B, c, c, s / 2, s / 2, RP('#FFF6D0'), { bv: 1, shine: true });
  } else E(B, c, c, s / 2, s / 2, RP('#9A5A1A'), { bv: 1, ol: true });
  return { w: n, h: n, d: toRGBA(B) };
}

/** The pointer at the top: a red wedge hanging from a gold cap, tip down. Its pivot is the cap's center. */
export function wheelPointer(w: number): Rgba & { px: number; py: number } {
  const h = Math.round(w * 1.55);
  const B = buf(w + 2, h + 2);
  const cx = (w + 2) / 2;
  P(B, [[1.5, w * 0.42], [w + 0.5, w * 0.42], [cx, h + 0.5]], RP('#E5484D'), { bv: 2, ol: true, shine: true });
  C(B, cx, w * 0.6, cx, h - 2, Math.max(1, w * 0.12), RP('#FF8A8D'), { bv: 0, tone: LIT, onto: true });
  E(B, cx, w * 0.42, w * 0.36, w * 0.36, RP('#F2B544'), { bv: 2, ol: true, shine: true });
  E(B, cx, w * 0.42, w * 0.13, w * 0.13, RP('#8C5E14'), { bv: 0, tone: SHD });
  outline(B);
  return { w: B.w, h: B.h, d: toRGBA(B), px: cx, py: w * 0.42 + 0.5 };
}

/** The hub: a gold medallion with a cream face, `n` across. */
export function wheelHub(n: number): Rgba {
  const B = buf(n + 2, n + 2);
  const c = (n + 2) / 2,
    R = n / 2 - 0.5;
  E(B, c, c, R, R, RP('#E0A13A'), { bv: 3, shine: true, ol: true });
  E(B, c, c, R * 0.74, R * 0.74, RP('#FFF3D6'), { bv: 2, ol: true });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    const x = c + Math.cos(a) * R * 0.87,
      y = c + Math.sin(a) * R * 0.87;
    E(B, x, y, Math.max(0.7, R * 0.07), Math.max(0.7, R * 0.07), RP('#8C5E14'), { bv: 0, tone: DEEP });
  }
  outline(B);
  return { w: B.w, h: B.h, d: toRGBA(B) };
}
