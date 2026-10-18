// The pixel engine behind the sprites and the generated icons: hue-shifted color ramps, shapes with real
// volume shading (each shape is inflated into a bevel and lit from the top left, then quantized into ramp
// tones), part outlines and the final silhouette outline.
//
// Pure: no DOM, no randomness.

export type RGB = readonly [number, number, number];
/** Six tones per material: outline, deep shadow, shadow, base, light, shine. */
export type Ramp = readonly [RGB, RGB, RGB, RGB, RGB, RGB];
export const OLN = 0,
  DEEP = 1,
  SHD = 2,
  BASE = 3,
  LIT = 4,
  SHINE = 5;

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- color
export function h2r(h: string): RGB {
  h = h.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function r2hsl([r, g, b]: RGB): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hsl2r(h: number, s: number, l: number): RGB {
  h = (((h % 360) + 360) % 360) / 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  if (!s) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
    p = 2 * l - q;
  const f = (t: number) => {
    t = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}
const toward = (h: number, t: number, a: number) => h + ((((t - h + 540) % 360) - 180) * a);

/**
 * A material's six tones. Shadows drift toward violet and gain saturation, lights drift toward warm yellow, so
 * even greys get a little life; the outline is a dark, saturated version of the material, never plain black.
 */
export function ramp(hex: string): Ramp {
  const [h0, s0, l] = r2hsl(h2r(hex));
  // greys have no hue of their own: give their shadows a cool one and their lights a warm one
  const grey = s0 < 0.08;
  const h = grey ? 240 : h0;
  const sd = grey ? 0.14 : s0;
  return [
    hsl2r(toward(h, 255, 0.35), Math.min(1, sd * 0.75 + 0.18), Math.max(0.05, l * 0.26)),
    hsl2r(toward(h, 255, 0.2), Math.min(1, sd * 0.85 + 0.06), Math.max(0.08, l * 0.58)),
    hsl2r(toward(h, 255, 0.1), Math.min(1, sd * 0.9 + 0.03), Math.max(0.11, l * 0.8)),
    h2r(hex),
    hsl2r(grey ? 48 : toward(h, 52, 0.1), grey ? 0.08 : s0 * 0.95, Math.min(0.95, l + (1 - l) * 0.3)),
    hsl2r(grey ? 48 : toward(h, 52, 0.2), grey ? 0.12 : s0 * 0.8, Math.min(0.98, l + (1 - l) * 0.62)),
  ];
}
const RAMPS = new Map<string, Ramp>();
/** The ramp for a hex color, cached. */
export const RP = (hex: string): Ramp => {
  let r = RAMPS.get(hex);
  if (!r) RAMPS.set(hex, (r = ramp(hex)));
  return r;
};

// ---------------------------------------------------------------- canvas
/** A layer being drawn: per pixel the color, the ramp it came from and its tone (-1 = a raw color), and alpha. */
export interface Buf {
  w: number;
  h: number;
  c: (RGB | null)[];
  r: (Ramp | null)[];
  t: Int8Array;
  a: Uint8Array;
}
export function buf(w: number, h: number): Buf {
  return { w, h, c: new Array<RGB | null>(w * h).fill(null), r: new Array<Ramp | null>(w * h).fill(null), t: new Int8Array(w * h).fill(-1), a: new Uint8Array(w * h) };
}
export const has = (B: Buf, x: number, y: number) => x >= 0 && y >= 0 && x < B.w && y < B.h && !!B.c[y * B.w + x];
/** One pixel in a ramp tone. */
export function dot(B: Buf, x: number, y: number, R: Ramp, tone = BASE, al = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= B.w || y >= B.h) return;
  const i = y * B.w + x;
  B.c[i] = R[tone]!;
  B.r[i] = R;
  B.t[i] = tone;
  B.a[i] = al;
}
/** One pixel in a raw color (eyes, glints). */
export function raw(B: Buf, x: number, y: number, c: RGB, al = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= B.w || y >= B.h) return;
  const i = y * B.w + x;
  B.c[i] = c;
  B.r[i] = null;
  B.t[i] = -1;
  B.a[i] = al;
}
/** Only on pixels already drawn (details that must stay inside their part). */
export function dotOn(B: Buf, x: number, y: number, R: Ramp, tone = BASE) {
  if (has(B, Math.round(x), Math.round(y))) dot(B, x, y, R, tone);
}
/** A 1px line in a ramp tone (Bresenham). */
export function ln(B: Buf, x0: number, y0: number, x1: number, y1: number, R: Ramp, tone = BASE, onlyOn = false) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0),
    dy = -Math.abs(y1 - y0),
    sx = x0 < x1 ? 1 : -1,
    sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (;;) {
    if (onlyOn) dotOn(B, x0, y0, R, tone);
    else dot(B, x0, y0, R, tone);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) {
      e += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      e += dx;
      y0 += sy;
    }
  }
}
/** Darkens a drawn pixel by `n` tones (cast shadows, creases). */
export function shade(B: Buf, x: number, y: number, n = 1) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= B.w || y >= B.h) return;
  const i = y * B.w + x;
  const R = B.r[i];
  if (!R || B.t[i]! <= DEEP) return;
  const t = Math.max(DEEP, B.t[i]! - n);
  B.t[i] = t;
  B.c[i] = R[t]!;
}

// ---------------------------------------------------------------- shapes
/** A shape: is the pixel whose center is (x, y) inside? */
export type Test = (x: number, y: number) => boolean;
export type Pt = readonly [number, number];
export const ell =
  (cx: number, cy: number, rx: number, ry: number): Test =>
  (x, y) =>
    ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
/** A rounded rectangle in continuous coordinates. */
export const box =
  (x0: number, y0: number, x1: number, y1: number, r = 0): Test =>
  (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = clamp(x, x0 + r, x1 - r),
      cy = clamp(y, y0 + r, y1 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.01;
  };
export function poly(pts: readonly Pt[]): Test {
  return (x, y) => {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i]!,
        [xj, yj] = pts[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
}
/** A thick line with round ends; `w1` tapers it toward the far end. */
export const capsule = (x0: number, y0: number, x1: number, y1: number, w0: number, w1 = w0): Test => {
  const dx = x1 - x0,
    dy = y1 - y0,
    L2 = dx * dx + dy * dy || 1;
  return (x, y) => {
    const u = clamp(((x - x0) * dx + (y - y0) * dy) / L2, 0, 1);
    const r = (w0 + (w1 - w0) * u) / 2;
    return (x - (x0 + u * dx)) ** 2 + (y - (y0 + u * dy)) ** 2 <= r * r;
  };
};
export const and =
  (...t: Test[]): Test =>
  (x, y) =>
    t.every((f) => f(x, y));
export const or =
  (...t: Test[]): Test =>
  (x, y) =>
    t.some((f) => f(x, y));
export const minus =
  (a: Test, b: Test): Test =>
  (x, y) =>
    a(x, y) && !b(x, y);

export interface PaintOpts {
  /** bevel radius in pixels: how round the shape looks (0 = flat) */
  bv?: number;
  /** draw a 1px outline ring around the part (dark outside, a crease line over what's behind it) */
  ol?: boolean;
  /** allow the shine tone (metal, gems, wet things) */
  shine?: boolean;
  /** shift every tone (negative = darker, for the far side of things) */
  sh?: number;
  /** one tone for the whole shape */
  tone?: number;
  /** cast a shadow on what is below and right of it */
  cast?: boolean;
  /** only where something is drawn already / only where nothing is */
  onto?: boolean;
  under?: boolean;
  al?: number;
}

// the light: from the top left and a little in front
const LX = -0.45,
  LY = -0.55,
  LZ = 0.7;

/**
 * Paints a shape. Its shading comes from the shape itself: the distance to its edge becomes a rounded height
 * (a bevel of radius `bv`), the height's slope a normal, the normal against the light a tone.
 */
export function paint(B: Buf, test: Test, x0: number, y0: number, x1: number, y1: number, R: Ramp, o: PaintOpts = {}) {
  const bx0 = Math.max(0, Math.floor(x0) - 1),
    by0 = Math.max(0, Math.floor(y0) - 1),
    bx1 = Math.min(B.w - 1, Math.ceil(x1) + 1),
    by1 = Math.min(B.h - 1, Math.ceil(y1) + 1);
  if (bx1 < bx0 || by1 < by0) return;
  const W = bx1 - bx0 + 3,
    H = by1 - by0 + 3;
  // the mask, with a one pixel empty margin
  const m = new Uint8Array(W * H);
  let n = 0;
  for (let y = by0; y <= by1; y++)
    for (let x = bx0; x <= bx1; x++) {
      if (!test(x + 0.5, y + 0.5)) continue;
      const i = y * B.w + x;
      if (o.onto && !B.c[i]) continue;
      if (o.under && B.c[i]) continue;
      m[(y - by0 + 1) * W + (x - bx0 + 1)] = 1;
      n++;
    }
  if (!n) return;
  const inM = (x: number, y: number) => {
    const lx = x - bx0 + 1,
      ly = y - by0 + 1;
    return lx >= 0 && ly >= 0 && lx < W && ly < H && m[ly * W + lx] === 1;
  };
  // cast shadow: one tone darker on what lies just below and right of the shape
  if (o.cast) {
    const done = new Set<number>();
    for (let y = by0; y <= by1 + 2; y++)
      for (let x = bx0; x <= bx1 + 1; x++) {
        if (inM(x, y) || x >= B.w || y >= B.h) continue;
        if (inM(x, y - 1) || inM(x - 1, y - 1) || inM(x, y - 2)) {
          const i = y * B.w + x;
          if (!done.has(i)) {
            done.add(i);
            shade(B, x, y);
          }
        }
      }
  }
  // the outline ring: dark where it meets nothing, a crease in the darker tone of whatever is behind it
  if (o.ol) {
    for (let y = by0; y <= by1; y++)
      for (let x = bx0; x <= bx1; x++) {
        if (inM(x, y)) continue;
        if (!(inM(x + 1, y) || inM(x - 1, y) || inM(x, y + 1) || inM(x, y - 1))) continue;
        const i = y * B.w + x;
        if (o.onto && !B.c[i]) continue;
        const bR = B.r[i];
        if (!B.c[i]) dot(B, x, y, R, OLN, o.al ?? 255);
        else if (bR && B.t[i]! > DEEP) dot(B, x, y, bR, B.t[i]! >= BASE ? DEEP : OLN);
        else if (!bR) dot(B, x, y, R, OLN);
      }
  }
  // distance to the edge (chamfer 3-4), then a round bevel profile
  const bv = o.bv ?? 3;
  const tone0 = o.tone;
  const d = new Float32Array(W * H);
  if (tone0 === undefined && bv > 0) {
    for (let i = 0; i < W * H; i++) d[i] = m[i] ? 1e6 : 0;
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (!m[i]) continue;
        d[i] = Math.min(d[i]!, d[i - 1]! + 3, d[i - W]! + 3, d[i - W - 1]! + 4, d[i - W + 1]! + 4);
      }
    for (let y = H - 2; y >= 1; y--)
      for (let x = W - 2; x >= 1; x--) {
        const i = y * W + x;
        if (!m[i]) continue;
        d[i] = Math.min(d[i]!, d[i + 1]! + 3, d[i + W]! + 3, d[i + W + 1]! + 4, d[i + W - 1]! + 4);
      }
    for (let i = 0; i < W * H; i++) {
      if (!m[i]) continue;
      const e = Math.min(d[i]! / 3 - 0.5, bv);
      d[i] = Math.sqrt(Math.max(0, bv * bv - (bv - e) * (bv - e)));
    }
  }
  const hAt = (lx: number, ly: number) => (m[ly * W + lx] ? d[ly * W + lx]! : 0);
  const top = o.shine ? SHINE : LIT;
  for (let y = by0; y <= by1; y++)
    for (let x = bx0; x <= bx1; x++) {
      const lx = x - bx0 + 1,
        ly = y - by0 + 1;
      if (!m[ly * W + lx]) continue;
      let t: number;
      if (tone0 !== undefined) t = tone0;
      else if (bv <= 0) t = BASE;
      else {
        const nx = (hAt(lx - 1, ly) - hAt(lx + 1, ly)) / 2,
          ny = (hAt(lx, ly - 1) - hAt(lx, ly + 1)) / 2;
        const L = Math.hypot(nx, ny, 1);
        const I = (nx * LX + ny * LY + LZ) / L;
        t = I < 0.05 ? DEEP : I < 0.42 ? SHD : I < 0.8 ? BASE : I < 0.94 ? LIT : SHINE;
      }
      t = clamp(t + (o.sh ?? 0), DEEP, top);
      dot(B, x, y, R, t, o.al ?? 255);
    }
}

// shortcuts for the common shapes
export const E = (B: Buf, cx: number, cy: number, rx: number, ry: number, R: Ramp, o?: PaintOpts) => paint(B, ell(cx, cy, rx, ry), cx - rx, cy - ry, cx + rx, cy + ry, R, o);
export const Bx = (B: Buf, x0: number, y0: number, x1: number, y1: number, R: Ramp, r = 0, o?: PaintOpts) => paint(B, box(x0, y0, x1, y1, r), x0, y0, x1, y1, R, o);
export function P(B: Buf, pts: readonly Pt[], R: Ramp, o?: PaintOpts) {
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  paint(B, poly(pts), Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), R, o);
}
export function C(B: Buf, x0: number, y0: number, x1: number, y1: number, w: number, R: Ramp, o?: PaintOpts, w1 = w) {
  const r = Math.max(w, w1) / 2;
  paint(B, capsule(x0, y0, x1, y1, w, w1), Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, R, o);
}
/** Any test inside a box. */
export const S = (B: Buf, t: Test, x0: number, y0: number, x1: number, y1: number, R: Ramp, o?: PaintOpts) => paint(B, t, x0, y0, x1, y1, R, o);

/**
 * The silhouette outline: empty pixels next to the drawing take the outline tone of their neighbor. Pixels that
 * already are outline don't get a second one.
 */
export function outline(B: Buf) {
  const add: [number, RGB, Ramp | null][] = [];
  for (let y = 0; y < B.h; y++)
    for (let x = 0; x < B.w; x++) {
      const i = y * B.w + x;
      if (B.c[i]) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= B.w || ny >= B.h) continue;
        const j = ny * B.w + nx;
        if (!B.c[j] || B.a[j]! < 140 || B.t[j] === OLN) continue;
        const R = B.r[j] ?? null;
        add.push([i, R ? R[OLN] : [24, 16, 36], R]);
        break;
      }
    }
  for (const [i, c, R] of add) {
    B.c[i] = c;
    B.r[i] = R;
    B.t[i] = OLN;
    B.a[i] = 255;
  }
}
/** RGBA bytes for ImageData / textures. */
export function toRGBA(B: Buf): Uint8ClampedArray {
  const d = new Uint8ClampedArray(B.w * B.h * 4);
  for (let i = 0; i < B.w * B.h; i++) {
    const c = B.c[i];
    if (!c) continue;
    d[i * 4] = c[0];
    d[i * 4 + 1] = c[1];
    d[i * 4 + 2] = c[2];
    d[i * 4 + 3] = B.a[i]!;
  }
  return d;
}
/** Draws `top` over `B` (only where `top` has pixels; `under` = only where `B` is empty). */
export function stamp(B: Buf, top: Buf, under = false) {
  for (let i = 0; i < B.w * B.h; i++) {
    if (!top.c[i] || (under && B.c[i])) continue;
    B.c[i] = top.c[i]!;
    B.r[i] = top.r[i]!;
    B.t[i] = top.t[i]!;
    B.a[i] = top.a[i]!;
  }
}
