// The chapter maps: a landscape in the chapter's theme with a road winding up through every step to the boss's
// lair. Each step is a fork: the road splits into one lane per choice and joins again before the next step.
// mapLayout places everything; renderMap paints the picture (the stops themselves are buttons on top).
//
// Pure: no DOM. Same chapter and seed, same map.

import { ARCHS, BOSSES, hashStr, type NodeKind } from '@whs/core';
import { drawDeco } from './map-deco';
import { mapTheme, type MapTheme } from './map-themes';
import { h2r, unpack, type RGB } from './px';
import type { Look } from './sprite';

export interface MapStop {
  r: number;
  i: number;
  k: NodeKind;
  x: number;
  y: number;
}
export interface MapLayout {
  /** art pixels across and down, and CSS pixels per art pixel */
  W: number;
  H: number;
  k: number;
  /** stops per step; the last step is the boss */
  stops: MapStop[][];
  /** where the road splits before each step (joins[0] is the start) */
  joins: { x: number; y: number }[];
}

function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where everything goes, for a map `cssW` CSS pixels wide. */
export function mapLayout(rows: readonly (readonly NodeKind[])[], cssW: number, seed: number): MapLayout {
  const k = cssW <= 520 ? 3 : 4;
  const W = Math.max(60, Math.ceil(cssW / k));
  const cx = W / 2;
  // the stops stay in a column a phone's width wide, the scenery fills the rest
  const col = Math.min(W - 16, Math.round(380 / k));
  const ROW = Math.round(138 / k),
    BOT = Math.round(200 / k),
    TOP = Math.round(150 / k),
    BOSS = Math.round(ROW * 1.35);
  const last = rows.length - 1;
  const H = BOT + Math.max(0, last - 1) * ROW + BOSS + TOP;
  const R = rng(seed);
  const yOf = (r: number) => (r === last ? H - BOT - (last - 1) * ROW - BOSS : H - BOT - r * ROW);
  const stops = rows.map((row, r) => {
    const n = row.length;
    const xs =
      r === last
        ? [cx]
        : n === 1
          ? [cx + (R() - 0.5) * col * 0.42]
          : n === 2
            ? [cx - col * (0.22 + R() * 0.05), cx + col * (0.22 + R() * 0.05)]
            : [cx - col * 0.37, cx + (R() - 0.5) * col * 0.06, cx + col * 0.37];
    return row.map((t, i) => ({ r, i, k: t, x: Math.round(xs[i] ?? cx), y: Math.round(yOf(r)) }));
  });
  const joins = rows.map((_, r) => (r === 0 ? { x: Math.round(cx), y: H - Math.round(BOT * 0.3) } : { x: Math.round(cx + (R() - 0.5) * col * 0.16), y: Math.round((yOf(r - 1) + yOf(r)) / 2) }));
  return { W, H, k, stops, joins };
}

/** The boss of a chapter as a sprite look, straight from its definition (no wheel spins). */
export function bossLook(ch: number): Look {
  const b = BOSSES[ch - 1]!;
  const p = b.picks;
  const arch = ARCHS.find((a) => a.k === p.arch || a.n === p.arch);
  return { name: b.name, race: p.race, rsub: p.rsub, arch: arch?.k, size: p.size, weapon: p.weapon, power: p.power, ench: p.ench, boss: b.name };
}

// ---------------------------------------------------------------- painting
type Img = { w: number; h: number; d: Uint8ClampedArray };
const put = (I: Img, x: number, y: number, c: RGB, a = 1) => {
  if (x < 0 || y < 0 || x >= I.w || y >= I.h) return;
  const i = (y * I.w + x) * 4;
  if (a >= 1) {
    I.d[i] = c[0];
    I.d[i + 1] = c[1];
    I.d[i + 2] = c[2];
  } else {
    I.d[i] = I.d[i]! + (c[0] - I.d[i]!) * a;
    I.d[i + 1] = I.d[i + 1]! + (c[1] - I.d[i + 1]!) * a;
    I.d[i + 2] = I.d[i + 2]! + (c[2] - I.d[i + 2]!) * a;
  }
  I.d[i + 3] = 255;
};
const dim = (I: Img, x: number, y: number, f: number) => {
  if (x < 0 || y < 0 || x >= I.w || y >= I.h) return;
  const i = (y * I.w + x) * 4;
  I.d[i] = I.d[i]! * f;
  I.d[i + 1] = I.d[i + 1]! * f;
  I.d[i + 2] = I.d[i + 2]! * f;
};
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A pixel's own random number, the same every time. */
const h01 = (x: number, y: number, s: number) => {
  let h = Math.imul(x * 374761393 + y * 668265263 + s * 2246822519, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
/** Smooth noise: random values on a grid `sc` pixels apart, blended between. */
const vnoise = (x: number, y: number, sc: number, s: number) => {
  const gx = x / sc,
    gy = y / sc,
    x0 = Math.floor(gx),
    y0 = Math.floor(gy),
    fx = gx - x0,
    fy = gy - y0;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy);
  const a = h01(x0, y0, s),
    b = h01(x0 + 1, y0, s),
    c = h01(x0, y0 + 1, s),
    d = h01(x0 + 1, y0 + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

function groundAt(T: MapTheme, g: [RGB, RGB, RGB], glowC: RGB, x: number, y: number, s: number, H: number): RGB {
  const [dk, bs, lt] = g;
  const n = h01(x, y, s);
  const N = vnoise(x, y, 9, s);
  switch (T.ground) {
    case 'asphalt':
      return n < 0.1 ? dk : n > 0.94 ? lt : N > 0.66 ? mix(bs, dk, 0.35) : bs;
    case 'tiles': {
      const tx = Math.floor(x / 9),
        ty = Math.floor(y / 9);
      if (x % 9 === 0 || y % 9 === 0) return dk;
      const t = h01(tx, ty, s + 7);
      return t < 0.25 ? mix(bs, lt, 0.5) : n < 0.06 ? dk : bs;
    }
    case 'grass': {
      const band = Math.floor(y / 12) % 2 ? mix(bs, lt, 0.35) : bs;
      return n > 0.95 ? lt : n < 0.05 ? dk : N < 0.25 ? mix(band, dk, 0.3) : band;
    }
    case 'moor':
      return N < 0.35 ? dk : N > 0.72 ? (n > 0.6 ? lt : bs) : n < 0.08 ? dk : bs;
    case 'water': {
      const wave = (x + Math.floor(y / 5) * 7 + Math.round(N * 6)) % 16;
      if (y % 5 === 0 && wave < 4) return lt;
      return N < 0.35 ? dk : n > 0.97 ? lt : bs;
    }
    case 'hex': {
      // pointy hexes 5 pixels across: the cube coordinates' distance from the nearest center
      const q = ((Math.sqrt(3) / 3) * x - y / 3) / 5,
        r = ((2 / 3) * y) / 5,
        c = -q - r;
      let rq = Math.round(q),
        rr = Math.round(r);
      const rc = Math.round(c);
      const dq = Math.abs(rq - q),
        dr = Math.abs(rr - r),
        dc = Math.abs(rc - c);
      if (dq > dr && dq > dc) rq = -rr - rc;
      else if (dr > dc) rr = -rq - rc;
      const e = Math.max(Math.abs(q - rq), Math.abs(r - rr), Math.abs(c - (-rq - rr)));
      return e > 0.43 ? dk : e < 0.18 && h01(rq, rr, s) > 0.7 ? lt : bs;
    }
    case 'check':
      return (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? (n > 0.96 ? lt : dk) : bs;
    case 'sky': {
      const t = y / H;
      const c = mix(lt, bs, Math.min(1, t * 1.4));
      const cl = vnoise(x, y * 1.8, 14, s);
      return cl > 0.72 ? mix(c, [240, 246, 255], 0.55) : cl > 0.66 ? mix(c, [240, 246, 255], 0.25) : c;
    }
    case 'rock': {
      const r = Math.abs(vnoise(x, y, 11, s) - 0.5);
      if (r < 0.022) return glowC;
      if (r < 0.045) return mix(dk, glowC, 0.35);
      return n < 0.12 ? dk : n > 0.95 ? lt : bs;
    }
    case 'plates': {
      const px = x % 18,
        py = y % 13;
      if (px === 0 || py === 0) return dk;
      if ((px === 2 || px === 16) && (py === 2 || py === 11)) return lt;
      return N > 0.7 ? mix(bs, lt, 0.3) : bs;
    }
    case 'sand': {
      const rip = Math.sin(x * 0.35 + y * 0.9 + N * 5);
      return rip > 0.86 ? lt : N < 0.3 ? mix(bs, dk, 0.4) : n < 0.04 ? dk : bs;
    }
    case 'stripes':
      return Math.floor((x + Math.floor(y / 30) * 4) / 7) % 2 ? (n < 0.05 ? dk : bs) : mix(bs, dk, 0.5);
    case 'snow':
      return n > 0.975 ? [255, 255, 255] : N < 0.3 ? bs : N < 0.2 ? dk : lt;
    case 'dream': {
      const w = Math.sin(x * 0.12 + Math.sin(y * 0.07) * 2 + y * 0.05);
      return w > 0.6 ? lt : w < -0.6 ? dk : bs;
    }
    case 'void':
      return n > 0.992 ? [255, 255, 255] : n > 0.982 ? lt : N > 0.7 ? mix(bs, glowC, 0.12) : N < 0.3 ? dk : bs;
    case 'marble': {
      const v = Math.abs(Math.sin(x * 0.08 + y * 0.03 + vnoise(x, y, 12, s) * 7));
      return v < 0.05 ? dk : v < 0.12 ? mix(bs, dk, 0.4) : n > 0.97 ? lt : N > 0.6 ? lt : bs;
    }
  }
}

/** Samples along an S-curve from a to b that leaves and arrives going straight up or down, about one per pixel. */
function lane(a: { x: number; y: number }, b: { x: number; y: number }): [number, number][] {
  const out: [number, number][] = [];
  const my = (b.y - a.y) * 0.55;
  const p1 = [a.x, a.y + my],
    p2 = [b.x, b.y - my];
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 1.3 + 2);
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      u = 1 - t;
    const w0 = u * u * u,
      w1 = 3 * u * u * t,
      w2 = 3 * u * t * t,
      w3 = t * t * t;
    out.push([w0 * a.x + w1 * p1[0]! + w2 * p2[0]! + w3 * b.x, w0 * a.y + w1 * p1[1]! + w2 * p2[1]! + w3 * b.y]);
  }
  return out;
}

/** The pixels of a disc of radius `r` around a pixel center, worked out once per radius. */
const OFFS = new Map<number, [number, number][]>();
function offsets(r: number) {
  let o = OFFS.get(r);
  if (!o) {
    o = [];
    const R = Math.ceil(r);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= r * r) o.push([dx, dy]);
    OFFS.set(r, o);
  }
  return o;
}
const decos = new Map<string, ReturnType<typeof drawDeco>>();
const decoOf = (name: string, v: number) => {
  const key = `${name}|${v}`;
  if (!decos.has(key)) decos.set(key, drawDeco(name, rng(hashStr(key))));
  return decos.get(key)!;
};

export interface MapState {
  /** the step you are on, and which stop you took on each step before it */
  row: number;
  picks: readonly number[];
}

/** The picture under the stops: RGBA, W x H art pixels. */
export function renderMap(L: MapLayout, ch: number, st: MapState, seed: number): Img {
  const T = mapTheme(ch);
  const g = T.g.map(h2r) as [RGB, RGB, RGB];
  const rc = T.r.map(h2r) as [RGB, RGB, RGB];
  const glowC = h2r(T.glow);
  const { W, H } = L;
  const I: Img = { w: W, h: H, d: new Uint8ClampedArray(W * H * 4) };
  const s = hashStr(`map${ch}`) ^ seed;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(I, x, y, groundAt(T, g, glowC, x, y, s, H));

  // ---- the road: every lane from a fork to its stop, and on to the next fork
  const last = L.stops.length - 1;
  const lanes: { pts: [number, number][]; walked: boolean; open: boolean }[] = [];
  L.stops.forEach((row, r) =>
    row.forEach((n) => {
      const walked = r < st.row && st.picks[r] === n.i;
      lanes.push({ pts: lane(L.joins[r]!, n), walked: walked, open: r === st.row });
      if (r < last) {
        const next = L.joins[r + 1]!;
        lanes.push({ pts: lane(n, next), walked: walked && r + 1 <= st.row, open: false });
      }
    }),
  );
  const road = new Uint8Array(W * H);
  const disc = (cx: number, cy: number, rad: number, v: number) => {
    const x0 = Math.round(cx),
      y0 = Math.round(cy);
    for (const [dx, dy] of offsets(rad)) {
      const x = x0 + dx,
        y = y0 + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x;
      if (road[i]! < v) road[i] = v;
    }
  };
  // each lane as whole-pixel centers, once each
  const centers: number[] = [];
  {
    const seen = new Set<number>();
    for (const l of lanes)
      for (const [x, y] of l.pts) {
        const key = Math.round(y) * 4096 + Math.round(x);
        if (seen.has(key)) continue;
        seen.add(key);
        centers.push(Math.round(x), Math.round(y));
      }
  }
  const RW = T.road === 'rope' ? 2.4 : 2.6;
  for (let i = 0; i < centers.length; i += 2) disc(centers[i]!, centers[i + 1]!, RW + 1.2, 1);
  // a clearing at every stop, a bigger one for the lair, and the start
  for (const row of L.stops) for (const n of row) disc(n.x, n.y, n.k === 'boss' ? 15 : 6.5, 1);
  disc(L.joins[0]!.x, L.joins[0]!.y, 5, 1);
  for (let i = 0; i < centers.length; i += 2) disc(centers[i]!, centers[i + 1]!, RW, 2);
  for (const row of L.stops) for (const n of row) disc(n.x, n.y, n.k === 'boss' ? 13.5 : 5.2, 2);
  disc(L.joins[0]!.x, L.joins[0]!.y, 3.8, 2);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = road[y * W + x]!;
      if (!v) continue;
      if (v === 1) {
        // the road's edge: dark, and over water or sky a little see-through
        put(I, x, y, rc[0], T.road === 'rope' ? 0.55 : 1);
        continue;
      }
      const n = h01(x, y, s + 3);
      let c: RGB = rc[1];
      switch (T.road) {
        case 'dirt':
          c = n < 0.12 ? mix(rc[1], rc[0], 0.35) : n > 0.9 ? rc[2] : rc[1];
          break;
        case 'cobble': {
          const cx = Math.floor((x + (Math.floor(y / 3) % 2) * 2) / 4);
          c = (x + (Math.floor(y / 3) % 2) * 2) % 4 === 0 || y % 3 === 0 ? mix(rc[1], rc[0], 0.55) : h01(cx, Math.floor(y / 3), s) > 0.6 ? rc[2] : rc[1];
          break;
        }
        case 'planks':
          c = y % 3 === 0 ? mix(rc[1], rc[0], 0.6) : (Math.floor(y / 3) + (x > W / 2 ? 1 : 0)) % 3 === 0 ? rc[2] : rc[1];
          break;
        case 'rope':
          c = y % 3 === 0 ? mix(g[1], rc[0], 0.3) : rc[1];
          if (y % 3 === 0) {
            put(I, x, y, c, 0.5);
            continue;
          }
          break;
        case 'neon':
          c = n > 0.97 ? rc[2] : rc[1];
          break;
        case 'gold': {
          // a yellow brick road
          const bx = (x + (Math.floor(y / 3) % 2) * 3) % 6;
          c = bx === 0 || y % 3 === 0 ? mix(rc[1], rc[0], 0.45) : n > 0.8 ? rc[2] : rc[1];
          break;
        }
        case 'ice':
          c = n > 0.9 ? rc[2] : (x + y) % 9 === 0 ? rc[2] : rc[1];
          break;
      }
      put(I, x, y, c);
    }
  if (T.road === 'neon')
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (road[y * W + x] === 1) {
          const near = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].some(([dx, dy]) => road[(y + dy!) * W + x + dx!] === 2);
          if (near) put(I, x, y, rc[2], 0.85);
        }

  // ---- footprints on the way you came, a sparkle on the lanes you can take now
  const gold: RGB = [255, 210, 94],
    open: RGB = [255, 250, 230];
  for (const l of lanes) {
    if (!l.walked && !l.open) continue;
    l.pts.forEach(([x, y], i) => {
      if (l.walked && i % 4 === 0) {
        const side = (i / 4) % 2 ? 1 : -1;
        put(I, Math.round(x + side * 0.8), Math.round(y), gold);
      }
      if (l.open && i % 3 === 0) put(I, Math.round(x), Math.round(y), open, 0.85);
    });
  }

  // ---- the boss's lair: a ring in the chapter's glow
  const B = L.stops[last]![0]!;
  for (let y = B.y - 20; y <= B.y + 12; y++)
    for (let x = B.x - 24; x <= B.x + 24; x++) {
      const d = Math.hypot((x - B.x) / 1.6, y - B.y);
      if (d > 13.6 && d < 15.2) put(I, x, y, glowC);
      else if (d >= 15.2 && d < 22) put(I, x, y, glowC, 0.25 * (1 - (d - 15.2) / 6.8));
    }

  // ---- scenery, away from the road and the stops
  const dist = new Float32Array(W * H).fill(1e9);
  for (let i = 0; i < W * H; i++) if (road[i]) dist[i] = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (x > 0) dist[i] = Math.min(dist[i]!, dist[i - 1]! + 1);
      if (y > 0) dist[i] = Math.min(dist[i]!, dist[i - W]! + 1);
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (x < W - 1) dist[i] = Math.min(dist[i]!, dist[i + 1]! + 1);
      if (y < H - 1) dist[i] = Math.min(dist[i]!, dist[i + W]! + 1);
    }
  const R = rng(s);
  const stops = L.stops.flat();
  const cell = 13;
  const placed: { x: number; y: number; name: string; v: number }[] = [];
  for (let gy = 0; gy < H; gy += cell)
    for (let gx = -4; gx < W; gx += cell) {
      if (R() > T.dens) {
        R();
        R();
        continue;
      }
      const x = Math.round(gx + R() * cell),
        y = Math.round(gy + R() * cell);
      const name = T.deco[Math.floor(R() * T.deco.length)]!;
      if (x < 2 || x >= W - 2 || y < 8 || y >= H - 1) continue;
      // keep the road, the stops (and the labels under them) and the lair clear
      if (stops.some((n) => Math.abs(n.x - x) < (n.k === 'boss' ? 30 : 17) && y > n.y - (n.k === 'boss' ? 40 : 14) && y < n.y + (n.k === 'boss' ? 22 : 24))) continue;
      const box = [
        [x, y],
        [x - 5, y],
        [x + 5, y],
        [x, y - 8],
        [x - 5, y - 8],
        [x + 5, y - 8],
        [x, y - 16],
      ];
      if (box.some(([bx, by]) => bx! >= 0 && by! >= 0 && bx! < W && by! < H && dist[by! * W + bx!]! < 3)) continue;
      // three looks per piece, drawn once and reused
      placed.push({ x, y, name, v: Math.floor(R() * 3) });
    }
  placed.sort((a, b) => a.y - b.y);
  const flats = placed.map((p) => ({ p, d: decoOf(p.name, p.v) })).filter((q) => q.d);
  for (const pass of [true, false])
    for (const { p, d } of flats) {
      if (d!.flat !== pass) continue;
      const D = d!.B;
      const ox = Math.round(p.x - D.w / 2),
        oy = p.y - D.h + 1;
      if (!pass)
        // a soft shadow at its feet
        for (let yy = -1; yy <= 1; yy++) for (let xx = -Math.floor(D.w / 2.6); xx <= Math.floor(D.w / 2.6); xx++) dim(I, p.x + xx + 1, p.y + yy, 0.72);
      for (let yy = 0; yy < D.h; yy++)
        for (let xx = 0; xx < D.w; xx++) {
          const c = D.c[yy * D.w + xx]!;
          if (!c) continue;
          put(I, ox + xx, oy + yy, unpack(c), D.a[yy * D.w + xx]! / 255);
        }
    }

  // ---- a vignette at the sides, a touch of mist past the next few steps
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const e = Math.min(x, W - 1 - x) / Math.max(1, W * 0.12);
      if (e < 1) dim(I, x, y, 0.8 + 0.2 * e);
    }
  const mistFrom = st.row + 3;
  if (mistFrom < last) {
    const y0 = L.stops[mistFrom]![0]!.y + 10;
    const yB = B.y + 26;
    for (let y = yB; y < y0; y++) {
      const t = Math.min(1, (y0 - y) / 40) * 0.28;
      for (let x = 0; x < W; x++) put(I, x, y, mix(g[0], [20, 14, 40], 0.5), t * (0.7 + 0.3 * vnoise(x, y, 10, s + 9)));
    }
  }
  return I;
}
