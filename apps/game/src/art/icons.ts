// The pixel icons, 16x16, drawn with the same engine as the fighters (px.ts): real shapes with volume shading
// lit from the top left, hue-shifted ramps, crease lines and a colored outline. Gear slot icons take a tint
// (the rarity color). One function per icon, so a new icon is one more entry.
//
// Pure: no DOM. ui/icon-pixels.ts turns them into pixels for the SVG icons and the Pixi textures.

import { BASE, DEEP, LIT, OLN, SHD, SHINE, Bx, C, E, P, RP, S, and, buf, dot, ell, ln, or, outline, poly, raw, unpack, type Buf, type Pt, type Ramp, type RGB } from './px';

export const ICON_SIZE = 16;
type Draw = (B: Buf, tint: Ramp) => void;

const K = {
  gold: '#F2B544', red: '#E5484D', blue: '#3D8BFF', cyan: '#4FC3F7', teal: '#2DD4BF', green: '#5DAA4B', lime: '#8FD16A', violet: '#9C6BFF',
  pink: '#FF6FA8', orange: '#E8862E', steel: '#B4BEC9', iron: '#7C8896', wood: '#A8713F', paper: '#F2EBDD', white: '#F7F4EE', ink: '#2A2238',
  skin: '#E8B48A', brown: '#8A5A36', bone: '#EDE6D6', ice: '#BFE9FF',
} as const;
const R = (k: keyof typeof K) => RP(K[k]);
const O = { ol: true, bv: 2 } as const;
const SH = { ol: true, bv: 2, shine: true } as const;
const WHITE: RGB = [255, 255, 255];
const INK: RGB = [42, 34, 56];

/** A ring (or an arc of one, angles in radians from +x, clockwise on screen). */
function ring(B: Buf, cx: number, cy: number, r: number, w: number, Rm: Ramp, o: object = SH, a0?: number, a1?: number) {
  S(B, (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d > r || d < r - w) return false;
    if (a0 === undefined || a1 === undefined) return true;
    const a = Math.atan2(y - cy, x - cx);
    return a >= a0 && a <= a1;
  }, cx - r, cy - r, cx + r, cy + r, Rm, o);
}
/** The points of an n-pointed star. */
const star = (cx: number, cy: number, n: number, r1: number, r2: number, rot = -Math.PI / 2): Pt[] =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1,
      a = rot + (i * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
const heart = (cx: number, cy: number, s: number) =>
  or(ell(cx - 2.7 * s, cy - 2 * s, 3.6 * s, 3.5 * s), ell(cx + 2.7 * s, cy - 2 * s, 3.6 * s, 3.5 * s), poly([[cx - 6.2 * s, cy - 1 * s], [cx + 6.2 * s, cy - 1 * s], [cx, cy + 6.5 * s]]));
const drop = (cx: number, cy: number, r: number) => or(ell(cx, cy, r, r * 0.95), poly([[cx - r * 0.92, cy - r * 0.35], [cx, cy - r * 2.2], [cx + r * 0.92, cy - r * 0.35]]));
/** A sword from the pommel end (x0, y0) to the tip (x1, y1). */
function sword(B: Buf, x0: number, y0: number, x1: number, y1: number, w = 2.6) {
  const dx = x1 - x0,
    dy = y1 - y0,
    L = Math.hypot(dx, dy),
    ux = dx / L,
    uy = dy / L,
    vx = -uy,
    vy = ux;
  const at = (t: number, s: number): Pt => [x0 + ux * t + vx * s, y0 + uy * t + vy * s];
  P(B, [at(4.6, -w / 2), at(L - 1.6, -w / 2), at(L, 0), at(L - 1.6, w / 2), at(4.6, w / 2)], R('steel'), SH);
  C(B, ...at(1, 0), ...at(4, 0), 1.8, R('wood'), O);
  P(B, [at(3.6, -3), at(4.8, -3), at(4.8, 3), at(3.6, 3)], R('gold'), SH);
  const [px, py] = at(0.3, 0);
  E(B, px, py, 1.2, 1.2, R('gold'), SH);
}

export const ICON_ART: Record<string, Draw> = {
  coin(B) {
    E(B, 8, 8, 6.6, 6.6, R('gold'), { ...SH, bv: 3 });
    E(B, 8, 8, 4.4, 4.4, R('gold'), { bv: 2, sh: -1 });
    Bx(B, 7, 5, 9, 11, R('gold'), 1, { bv: 1, shine: true });
    ln(B, 9, 5.5, 9, 10.5, R('gold'), DEEP);
  },
  gem(B) {
    P(B, [[1.5, 6], [4.8, 2], [11.2, 2], [14.5, 6], [8, 14.8]], R('cyan'), { ...SH, bv: 2 });
    ln(B, 2, 6, 14, 6, R('cyan'), SHINE);
    ln(B, 5, 2.5, 6.5, 6, R('cyan'), SHD);
    ln(B, 11, 2.5, 9.5, 6, R('cyan'), SHD);
    ln(B, 6.5, 6.5, 8, 13.5, R('cyan'), LIT);
    ln(B, 9.5, 6.5, 8, 13.5, R('cyan'), SHD);
    raw(B, 4, 4, WHITE);
  },
  legacy(B) {
    P(B, [[2, 13.5], [2, 5], [5, 8.5], [8, 2.5], [11, 8.5], [14, 5], [14, 13.5]], R('gold'), { ...SH, bv: 2 });
    Bx(B, 2, 11, 14, 13.5, R('gold'), 0, { bv: 1, sh: -1 });
    for (const [x, c] of [[5, K.red], [8, K.cyan], [11, K.green]] as const) E(B, x, 12.2, 1.1, 1.1, RP(c), { bv: 1, shine: true });
  },
  gear(B) {
    S(B, (x, y) => {
      const d = Math.hypot(x - 8, y - 8);
      if (d < 2.4) return false;
      if (d <= 5) return true;
      const a = ((Math.atan2(y - 8, x - 8) / (Math.PI * 2)) * 8 + 8.25) % 1;
      return d <= 7 && a < 0.5;
    }, 0.5, 0.5, 15.5, 15.5, R('steel'), { ...SH, bv: 2 });
    ring(B, 8, 8, 3.6, 1.2, R('steel'), { bv: 1, sh: -1 });
  },
  sound(B) {
    Bx(B, 1.5, 6, 5, 10.5, R('iron'), 0.5, O);
    P(B, [[4.5, 6], [9, 2.5], [9, 13.5], [4.5, 10.5]], R('iron'), SH);
    ring(B, 9, 8, 4.3, 1.3, R('cyan'), { bv: 0, ol: true }, -0.9, 0.9);
    ring(B, 9, 8, 6.6, 1.3, R('cyan'), { bv: 0, ol: true }, -0.8, 0.8);
  },
  mute(B) {
    Bx(B, 1.5, 6, 5, 10.5, R('iron'), 0.5, O);
    P(B, [[4.5, 6], [9, 2.5], [9, 13.5], [4.5, 10.5]], R('iron'), SH);
    C(B, 10.5, 5.5, 14.5, 10.5, 2, R('red'), O);
    C(B, 14.5, 5.5, 10.5, 10.5, 2, R('red'), O);
  },
  bolt(B) {
    P(B, [[9.5, 0.8], [3, 9], [7.3, 9], [5.6, 15.2], [13, 6.8], [8.7, 6.8], [11.4, 0.8]], R('gold'), { ...SH, bv: 2 });
  },
  house(B) {
    Bx(B, 10.5, 2.5, 12.5, 7, R('red'), 0, O);
    Bx(B, 3.5, 7, 12.5, 14.5, R('paper'), 0, O);
    P(B, [[1.2, 8.4], [8, 1.8], [14.8, 8.4]], R('red'), { ...SH, bv: 2, cast: true });
    Bx(B, 6.5, 10, 9.5, 14.5, R('wood'), 0.5, O);
    Bx(B, 10.5, 9.5, 12, 11, R('cyan'), 0, { bv: 0 });
    dot(B, 8.6, 12, R('gold'), SHINE);
  },
  play(B) {
    S(B, or(Bx_(1.5, 4.5, 14.5, 11, 3), ell(4.3, 11, 2.6, 2.6), ell(11.7, 11, 2.6, 2.6)), 1, 4, 15, 14, R('violet'), { ...SH, bv: 3 });
    for (const [x, y] of [[4, 6.5], [4, 8.5], [3, 7.5], [5, 7.5]] as const) raw(B, x, y, WHITE);
    E(B, 11, 6.8, 1, 1, R('pink'), { bv: 0 });
    E(B, 12.5, 8.6, 1, 1, R('cyan'), { bv: 0 });
  },
  fist(B) {
    C(B, 3, 9, 8.5, 11.5, 3.4, R('skin'), O);
    Bx(B, 3.5, 3.5, 13, 11.5, R('skin'), 2.5, { ...O, bv: 3 });
    for (const x of [5.8, 8.2, 10.6]) ln(B, x, 4, x, 7.5, R('skin'), SHD);
    C(B, 3.5, 9.5, 8.5, 10.5, 3, R('skin'), O);
    Bx(B, 4, 11.5, 12.5, 14.5, R('red'), 0.5, O);
  },
  target(B) {
    E(B, 8, 8, 6.8, 6.8, R('red'), { ...SH, bv: 2 });
    E(B, 8, 8, 4.8, 4.8, R('white'), { bv: 1 });
    E(B, 8, 8, 2.9, 2.9, R('red'), { bv: 1, shine: true });
    E(B, 8, 8, 1.1, 1.1, R('white'), { bv: 0 });
  },
  menu(B) {
    for (const y of [2.5, 6.8, 11.1]) Bx(B, 1.5, y, 14.5, y + 2.4, R('paper'), 1, O);
  },
  book(B) {
    Bx(B, 3, 12, 14, 14.5, R('paper'), 0, O);
    Bx(B, 2, 1.5, 13.5, 13, R('red'), 1, { ...O, bv: 2, cast: true });
    Bx(B, 2, 1.5, 4, 13, R('red'), 0, { bv: 1, sh: -1 });
    ln(B, 6, 4, 11, 4, R('gold'), LIT);
    ln(B, 6, 6, 10, 6, R('gold'), BASE);
    Bx(B, 9.5, 11, 11, 15, R('gold'), 0, { bv: 1 });
  },
  calendar(B) {
    Bx(B, 1.5, 3, 14.5, 14.5, R('white'), 1.2, O);
    Bx(B, 1.5, 3, 14.5, 6.5, R('red'), 1, { bv: 1, shine: true, onto: true });
    for (const x of [4.5, 11.5]) C(B, x, 1.5, x, 4.5, 1.6, R('iron'), O);
    for (const y of [8.5, 11.5]) for (const x of [4, 7, 10, 12.5]) dot(B, x, y, R('ink'), BASE);
    Bx(B, 9.5, 10.5, 11.5, 12.5, R('red'), 0, { bv: 0 });
  },
  skull(B) {
    E(B, 8, 7, 6.2, 5.8, R('bone'), { ...O, bv: 3 });
    Bx(B, 4.5, 9.5, 11.5, 14.5, R('bone'), 1.5, O);
    E(B, 5.5, 7.5, 1.8, 2, R('ink'), { tone: OLN });
    E(B, 10.5, 7.5, 1.8, 2, R('ink'), { tone: OLN });
    dot(B, 7.5, 10.5, R('ink'), OLN);
    dot(B, 8.5, 10.5, R('ink'), OLN);
    for (const x of [6.5, 8, 9.5]) ln(B, x, 12, x, 14, R('bone'), DEEP);
  },
  dice(B) {
    const W = RP('#EEF1F6');
    P(B, [[1.5, 4.5], [8, 7.8], [8, 15], [1.5, 11.7]], W, { ol: true, tone: BASE });
    P(B, [[8, 7.8], [14.5, 4.5], [14.5, 11.7], [8, 15]], W, { ol: true, tone: SHD });
    P(B, [[8, 1.2], [14.5, 4.5], [8, 7.8], [1.5, 4.5]], W, { ol: true, tone: LIT });
    E(B, 8, 4.5, 1.4, 0.9, R('red'), { tone: BASE });
    for (const [x, y] of [[3.5, 7.5], [6, 11.5]] as const) dot(B, x, y, R('ink'), BASE);
    for (const [x, y] of [[10, 9], [11.5, 10.5], [13, 12]] as const) dot(B, x, y, R('ink'), BASE);
  },
  cart(B) {
    ln(B, 0.8, 2, 2.5, 3, R('iron'), BASE);
    P(B, [[2.5, 3.5], [14.8, 5], [13.3, 10.5], [4, 10.5]], R('gold'), { ...SH, bv: 2 });
    for (const x of [6.5, 9.5, 12]) ln(B, x, 4.5, x - 0.3, 9.8, R('gold'), DEEP);
    ln(B, 4, 11.5, 13, 11.5, R('iron'), DEEP);
    for (const x of [5.5, 11.5]) E(B, x, 13.5, 1.6, 1.6, R('ink'), SH);
  },
  cup(B) {
    ring(B, 3.6, 5, 2.6, 1.3, R('gold'), SH);
    ring(B, 12.4, 5, 2.6, 1.3, R('gold'), SH);
    P(B, [[3.5, 1.8], [12.5, 1.8], [12, 6.5], [10, 9.5], [6, 9.5], [4, 6.5]], R('gold'), { ...SH, bv: 3 });
    Bx(B, 7, 9.5, 9, 11.5, R('gold'), 0, O);
    Bx(B, 4, 11.5, 12, 14.5, R('wood'), 1, O);
    raw(B, 6, 4, WHITE);
  },
  chain(B) {
    const link = (x0: number, y0: number, x1: number, y1: number) =>
      S(B, (x, y) => {
        const dx = x1 - x0,
          dy = y1 - y0,
          u = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)));
        const d = Math.hypot(x - (x0 + u * dx), y - (y0 + u * dy));
        return d <= 2.9 && d >= 1.4;
      }, Math.min(x0, x1) - 3, Math.min(y0, y1) - 3, Math.max(x0, x1) + 3, Math.max(y0, y1) + 3, R('steel'), SH);
    link(2.8, 2.8, 5.2, 5.2);
    link(10.8, 10.8, 13.2, 13.2);
    S(B, (x, y) => {
      const d = Math.hypot((x - 8) * 0.75 + (y - 8) * 0.75, ((x - 8) - (y - 8)) * 1.6);
      return d <= 3.4 && d >= 1.7;
    }, 4, 4, 12, 12, R('iron'), SH);
  },
  bag(B) {
    ring(B, 8, 5, 3, 1.3, R('brown'), O, -Math.PI, 0);
    Bx(B, 2, 5, 14, 14.5, R('wood'), 2.5, { ...O, bv: 3 });
    Bx(B, 2, 5, 14, 9, RP('#C08457'), 2, { ol: true, bv: 1, onto: true });
    Bx(B, 6.8, 7.8, 9.2, 10.5, R('gold'), 0.5, SH);
  },
  shield(B) {
    P(B, [[2, 1.8], [14, 1.8], [14, 8], [8, 15], [2, 8]], R('gold'), { ...SH, bv: 1 });
    P(B, [[3.6, 3.4], [12.4, 3.4], [12.4, 7.7], [8, 12.8], [3.6, 7.7]], R('blue'), { bv: 3, shine: true });
    Bx(B, 7.2, 3.6, 8.8, 11, R('white'), 0, { bv: 1 });
    Bx(B, 4.5, 5.6, 11.5, 7.2, R('white'), 0, { bv: 1 });
  },
  heart(B) {
    S(B, heart(8, 7.5, 1), 1, 1, 15, 15, R('red'), { ...SH, bv: 3 });
  },
  sword(B) {
    sword(B, 2, 14, 14.5, 1.5);
  },
  spark(B) {
    P(B, star(8, 8, 4, 7.2, 2.2, -Math.PI / 2), R('gold'), { ...SH, bv: 2 });
    E(B, 8, 8, 1.2, 1.2, R('white'), { bv: 0 });
  },
  wing(B) {
    P(B, [[1.5, 13], [3, 7.5], [7, 3.5], [13, 1.5], [14.5, 3], [12.5, 6], [13.5, 7], [10.5, 9.5], [11.5, 11], [6.5, 13.5]], R('white'), { ...O, bv: 3 });
    for (const [a, b, c, d] of [[5, 11, 12, 4], [7, 12.5, 12, 7.5], [4, 10, 9, 4.5]] as const) ln(B, a, b, c, d, R('white'), SHD);
  },
  swirl(B) {
    let px = 8,
      py = 8;
    for (let a = 0.6; a < Math.PI * 4.2; a += 0.45) {
      const r = 0.5 + a * 0.5;
      const x = 8 + Math.cos(a) * r,
        y = 8 + Math.sin(a) * r;
      C(B, px, py, x, y, 2.1, R('violet'), { bv: 1, shine: true });
      px = x;
      py = y;
    }
  },
  chat(B) {
    P(B, [[3.5, 9.5], [2.5, 14.8], [8.5, 10.5]], R('white'), O);
    Bx(B, 1.2, 1.8, 14.8, 11, R('white'), 3, { ...O, bv: 2 });
    for (const x of [4.5, 7.5, 10.5]) Bx(B, x, 5.5, x + 1.8, 7.3, R('ink'), 0.4, { tone: BASE });
  },
  star(B) {
    P(B, star(8, 8.6, 5, 7.4, 3.1), R('gold'), { ...SH, bv: 2 });
  },
  lock(B) {
    ring(B, 8, 7, 4.6, 1.9, R('steel'), SH, -Math.PI, 0);
    Bx(B, 3.2, 6.6, 4.9, 8, R('steel'), 0, O);
    Bx(B, 11.1, 6.6, 12.8, 8, R('steel'), 0, O);
    Bx(B, 2.5, 7.5, 13.5, 14.8, R('gold'), 1.5, { ...SH, bv: 3 });
    E(B, 8, 10.3, 1.3, 1.3, R('ink'), { tone: OLN });
    ln(B, 8, 10.5, 8, 12.8, R('ink'), OLN);
  },
  people(B) {
    Bx(B, 1, 8.5, 9, 14.8, R('blue'), 2.5, O);
    E(B, 5, 5, 2.7, 2.7, R('skin'), O);
    Bx(B, 6.5, 9.5, 15, 15, R('red'), 2.8, { ...O, cast: true });
    E(B, 10.8, 5.8, 2.9, 2.9, R('skin'), O);
  },
  card(B) {
    Bx(B, 1, 2.5, 15, 13.5, R('paper'), 1.5, O);
    Bx(B, 2.8, 4.5, 7, 10.5, R('blue'), 0.5, { bv: 1 });
    E(B, 4.9, 6.6, 1, 1, R('skin'), { bv: 0 });
    for (const [y, x1] of [[5, 13], [7.5, 11.5], [10, 13]] as const) ln(B, 8.5, y, x1, y, R('ink'), BASE);
  },
  flag(B) {
    C(B, 3, 2, 3, 15, 1.6, R('wood'), O);
    P(B, [[3.8, 2], [8.5, 1.4], [14.5, 3.2], [14.5, 9.2], [9, 8.2], [3.8, 9.2]], R('red'), { ...SH, bv: 2 });
    E(B, 3, 1.6, 1.2, 1.2, R('gold'), SH);
  },
  skip(B) {
    P(B, [[1.5, 3], [8, 8], [1.5, 13]], R('paper'), O);
    P(B, [[8, 3], [14.5, 8], [8, 13]], R('paper'), O);
  },
  scroll(B) {
    Bx(B, 3, 3, 13, 13, R('paper'), 0, { ...O, bv: 1 });
    for (const y of [5.5, 7.5, 9.5]) ln(B, 5, y, 11, y, R('paper'), DEEP);
    C(B, 2, 3, 14, 3, 3.2, R('paper'), { ...O, bv: 2 });
    C(B, 2, 13, 14, 13, 3.2, R('paper'), { ...O, bv: 2, sh: -1 });
  },
  robot(B) {
    ln(B, 8, 1.5, 8, 4, R('iron'), BASE);
    E(B, 8, 1.6, 1.3, 1.3, R('red'), SH);
    Bx(B, 1, 7, 2.5, 11, R('iron'), 0.5, O);
    Bx(B, 13.5, 7, 15, 11, R('iron'), 0.5, O);
    Bx(B, 2.5, 4, 13.5, 14, R('steel'), 2, { ...SH, bv: 3 });
    Bx(B, 4, 6.5, 12, 9.5, R('ink'), 1, { tone: BASE });
    for (const x of [6, 10]) {
      raw(B, x, 7.5, [90, 230, 255]);
      raw(B, x, 8.5, [40, 170, 210]);
    }
    for (const x of [6, 8, 10]) ln(B, x, 11, x, 12.5, R('steel'), DEEP);
  },
  question(B) {
    E(B, 8, 8, 6.8, 6.8, R('blue'), { ...SH, bv: 3 });
    for (const [x, y] of [[6, 5], [7, 4], [8, 4], [9, 4], [10, 5], [10, 6], [9, 7], [8, 8], [8, 9], [8, 11.5]] as const) raw(B, x, y, WHITE);
  },
  attack(B) {
    sword(B, 2, 14, 14.5, 1.5, 2.2);
    sword(B, 14, 14, 1.5, 1.5, 2.2);
  },
  special(B) {
    P(B, star(8, 8, 8, 7.4, 3.6), R('orange'), { ...SH, bv: 2 });
    P(B, star(8, 8, 4, 4.6, 1.8, -Math.PI / 4), R('gold'), { bv: 1, shine: true });
    raw(B, 8, 8, WHITE);
  },
  save(B) {
    Bx(B, 1.5, 1.5, 14.5, 14.5, R('blue'), 1, { ...SH, bv: 2 });
    Bx(B, 4.5, 1.5, 11, 6, R('steel'), 0, { ol: true, bv: 1, shine: true });
    Bx(B, 8.5, 2.5, 10, 5, R('ink'), 0, { tone: BASE });
    Bx(B, 3.5, 8.5, 12.5, 14.5, R('paper'), 0.5, O);
    for (const y of [10.5, 12.5]) ln(B, 5, y, 11, y, R('paper'), SHD);
  },
  download(B) {
    Bx(B, 6.4, 1, 9.6, 7, R('teal'), 0, O);
    P(B, [[2.5, 6.5], [13.5, 6.5], [8, 12]], R('teal'), { ...SH, bv: 2 });
    P(B, [[1, 11], [2.5, 11], [2.5, 13], [13.5, 13], [13.5, 11], [15, 11], [15, 15], [1, 15]], R('iron'), O);
  },
  upload(B) {
    P(B, [[2.5, 6.5], [13.5, 6.5], [8, 1]], R('teal'), { ...SH, bv: 2 });
    Bx(B, 6.4, 6, 9.6, 11.5, R('teal'), 0, O);
    P(B, [[1, 11], [2.5, 11], [2.5, 13], [13.5, 13], [13.5, 11], [15, 11], [15, 15], [1, 15]], R('iron'), O);
  },
  trash(B) {
    Bx(B, 6, 1, 10, 3.2, R('red'), 0.5, O);
    P(B, [[2.8, 5], [13.2, 5], [12, 15], [4, 15]], R('red'), { ...SH, bv: 2 });
    Bx(B, 1.5, 3, 14.5, 5.5, R('red'), 0.6, { ...O, cast: true });
    for (const x of [6, 8, 10]) ln(B, x, 7, x, 13, R('red'), DEEP);
  },
  back(B) {
    S(B, or(poly([[1.2, 8], [7.5, 1.8], [7.5, 14.2]]), Bx_(6.5, 5.8, 14.8, 10.2, 0.5)), 1, 1, 15, 15, R('paper'), O);
  },
  close(B) {
    S(B, or(capsuleT(3, 3, 13, 13, 3.2), capsuleT(13, 3, 3, 13, 3.2)), 1, 1, 15, 15, R('paper'), O);
  },
  plus(B) {
    S(B, or(Bx_(6.3, 1.5, 9.7, 14.5, 0.6), Bx_(1.5, 6.3, 14.5, 9.7, 0.6)), 1, 1, 15, 15, R('teal'), SH);
  },
  check(B) {
    S(B, or(capsuleT(2.5, 8.5, 6.5, 12.5, 3.2), capsuleT(6.5, 12.5, 13.5, 3.5, 3.2)), 0.5, 1, 15.5, 15, R('green'), SH);
  },
  clock(B) {
    E(B, 8, 8, 6.8, 6.8, R('white'), { ...O, bv: 2 });
    for (const [x, y] of [[8, 2.5], [13.5, 8], [8, 13.5], [2.5, 8]] as const) dot(B, x, y, R('iron'), BASE);
    ln(B, 8, 8, 8, 4, R('ink'), BASE);
    ln(B, 8, 8, 11, 9.5, R('ink'), BASE);
    dot(B, 8, 8, R('red'), BASE);
  },
  hammer(B) {
    C(B, 6.5, 6, 11, 14.8, 2.4, R('wood'), O);
    Bx(B, 1.5, 1.5, 11, 6.2, R('iron'), 1, { ...SH, bv: 2, cast: true });
    P(B, [[11, 2], [14.5, 1], [14.5, 3], [11, 5.5]], R('iron'), O);
  },
  momentum(B) {
    for (const [y, sh] of [[0, 0], [5, -1]] as const) P(B, [[1.5, 9.5 - y], [8, 3.5 - y], [14.5, 9.5 - y], [14.5, 13 - y], [8, 7.5 - y], [1.5, 13 - y]], R('orange'), { ...SH, bv: 1, sh });
  },
  search(B) {
    C(B, 10, 10, 14.5, 14.5, 2.8, R('wood'), O);
    E(B, 6.5, 6.5, 3.8, 3.8, R('cyan'), { bv: 3, shine: true, al: 210 });
    ring(B, 6.5, 6.5, 5.4, 1.8, R('steel'), SH);
  },

  tower(B) {
    Bx(B, 4.5, 6, 11.5, 15, RP('#A9A39A'), 0, { ...O, bv: 2 });
    Bx(B, 2.5, 3.5, 13.5, 6.5, RP('#A9A39A'), 0, { ...O, bv: 1, cast: true });
    for (const x of [2.5, 6.8, 11.1]) Bx(B, x, 1.2, x + 2.4, 3.5, RP('#A9A39A'), 0, { ol: true, bv: 1 });
    S(B, or(Bx_(7, 8.5, 9, 10.5, 0), ell(8, 8.5, 1, 1)), 6.5, 7, 9.5, 11, R('ink'), { tone: BASE });
    Bx(B, 6.5, 12, 9.5, 15, R('wood'), 0.5, O);
    for (const [x, y] of [[5.5, 11], [10.5, 8], [10, 13]] as const) dot(B, x, y, RP('#A9A39A'), SHD);
  },
  flame(B, T) {
    ICON_ART.st_burn!(B, T);
  },
  gift(B) {
    Bx(B, 2, 7.5, 14, 15, R('red'), 0.5, { ...SH, bv: 2 });
    Bx(B, 1.2, 5, 14.8, 8.2, R('red'), 0.5, { ...SH, bv: 1, cast: true });
    Bx(B, 6.9, 5, 9.1, 15, R('gold'), 0, { bv: 1, shine: true });
    for (const s of [-1, 1]) E(B, 8 + s * 2.8, 3.2, 2.6, 1.8, R('gold'), SH);
    E(B, 8, 3.8, 1.2, 1.2, R('gold'), SH);
  },
  heart_empty(B) {
    S(B, heart(8, 7.5, 1), 1, 1, 15, 15, RP('#4A4458'), { ...O, bv: 3 });
  },
  camp(B) {
    // a campfire: two crossed logs, a flame, a few stones
    C(B, 2, 14.2, 13, 11.2, 2.4, R('wood'), O);
    C(B, 3, 11.2, 14, 14.2, 2.4, R('wood'), O);
    S(B, or(ell(8, 9.2, 3.8, 3.4), poly([[4.4, 8.6], [8, 0.8], [11.6, 8.6]])), 3, 0, 13, 13, R('orange'), SH);
    S(B, or(ell(8, 10.2, 2, 2.1), poly([[6.1, 10], [8, 5], [9.9, 10]])), 5, 4, 11, 13, R('gold'), { bv: 1, shine: true });
    for (const x of [1.6, 14.4]) E(B, x, 13.6, 1.3, 1.1, R('iron'), O);
  },
  chest(B) {
    Bx(B, 1.5, 7, 14.5, 14.8, R('wood'), 0.5, { ...O, bv: 2 });
    S(B, and(ell(8, 7.2, 6.5, 5), (_x, y) => y < 7.4), 1.5, 2, 14.5, 7.5, R('wood'), { ...O, bv: 2 });
    for (const x of [3.5, 12.5]) Bx(B, x - 0.8, 2.6, x + 0.8, 14.8, R('gold'), 0, { bv: 1, shine: true, onto: true });
    ln(B, 2, 7.6, 14, 7.6, R('wood'), DEEP);
    Bx(B, 6.8, 6.4, 9.2, 9.6, R('gold'), 0.4, { ...SH, bv: 1 });
    dot(B, 8, 8.2, R('ink'), BASE);
    raw(B, 5, 4, [255, 246, 200]);
  },

  // ---- powers (the ones no other icon already shows)
  pw_shadow(B) {
    E(B, 8, 8, 6.6, 6.6, RP('#3A2652'), { ol: true, bv: 3 });
    ring(B, 8, 8, 6.6, 1.3, R('violet'), { bv: 0 }, -Math.PI, -Math.PI / 2);
    for (const x of [5.5, 10.5]) {
      raw(B, x, 8, [210, 160, 255]);
      raw(B, x, 9, [160, 110, 230]);
    }
  },
  pw_light(B) {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      C(B, 8 + Math.cos(a) * 5, 8 + Math.sin(a) * 5, 8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7, 1.6, RP('#FFE082'), { ol: true, bv: 0 });
    }
    E(B, 8, 8, 4.2, 4.2, R('gold'), { ...SH, bv: 3 });
  },
  pw_tk(B) {
    for (const [y, w] of [[13, 5], [14.8, 3]] as const) ln(B, 8 - w, y, 8 + w, y, R('pink'), LIT);
    P(B, [[3, 7], [6, 2.5], [12, 3], [13.5, 7.5], [10, 11], [4.5, 10.5]], RP('#9A8F86'), { ...SH, bv: 3 });
    for (const [x, y] of [[2, 3], [14, 2], [14.5, 11]] as const) raw(B, x, y, [255, 150, 210]);
  },
  pw_mind(B) {
    E(B, 5.6, 8, 4.4, 5.4, RP('#F28CB0'), { ...O, bv: 3 });
    E(B, 10.4, 8, 4.4, 5.4, RP('#F28CB0'), { ...O, bv: 3 });
    for (const [a, b, c, d] of [[4, 5, 6, 7], [3.5, 9, 6, 10], [12, 5, 10, 7], [12.5, 9.5, 10, 11]] as const) ln(B, a, b, c, d, RP('#F28CB0'), DEEP);
    ln(B, 8, 3, 8, 13, RP('#F28CB0'), OLN);
  },
  pw_tele(B) {
    E(B, 8, 8, 6.8, 6.8, R('violet'), { ...SH, bv: 2 });
    E(B, 8, 8, 4.6, 4.6, R('cyan'), { bv: 2, shine: true });
    E(B, 8, 8, 2.4, 2.4, RP('#1A1030'), { tone: BASE });
    raw(B, 5, 4, WHITE);
  },
  pw_gravity(B) {
    E(B, 8, 8, 4.8, 4.8, RP('#7A4FD1'), { ...SH, bv: 3 });
    S(B, (x, y) => {
      const u = (x - 8) * 0.9 + (y - 8) * 0.44,
        v = -(x - 8) * 0.44 + (y - 8) * 0.9;
      const d = (u / 7.4) ** 2 + (v / 2.4) ** 2;
      return d <= 1 && d >= 0.5 && !(v < 0 && Math.hypot(x - 8, y - 8) < 4.8);
    }, 0.5, 3, 15.5, 13, R('gold'), { ol: true, bv: 0 });
  },
  pw_shape(B) {
    E(B, 8, 8, 6.6, 6.8, R('skin'), { ...O, bv: 3 });
    S(B, and(ell(8, 8, 6.6, 6.8), (x) => x > 8), 8, 1, 15, 15, R('green'), { bv: 3, shine: true });
    for (let k = 0; k < 4; k++) dot(B, 10 + (k % 2) * 2, 4 + k * 2.5, R('green'), DEEP);
    E(B, 5, 7.5, 1.2, 1.4, R('ink'), { tone: OLN });
    E(B, 11, 7.5, 1.6, 1.6, R('gold'), { bv: 0 });
    ln(B, 11, 6.5, 11, 8.5, R('ink'), OLN);
    ln(B, 4, 11, 12, 11, R('ink'), OLN);
  },

  pw_reality(B) {
    P(B, [[8, 1], [14.5, 8], [8, 15], [1.5, 8]], RP('#FF4F8B'), { ...SH, bv: 3 });
    for (const [a, b, c, d] of [[8, 2, 7, 6], [7, 6, 10, 9], [10, 9, 8.5, 14], [7, 6, 4, 8]] as const) ln(B, a, b, c, d, R('white'), LIT);
  },
  pw_negate(B) {
    S(B, (x, y) => {
      const d = Math.hypot(x - 8, y - 8);
      const slash = Math.abs((x - 8) + (y - 8)) / Math.SQRT2 <= 1.3;
      return d <= 7 && (d >= 4.9 || slash);
    }, 0.5, 0.5, 15.5, 15.5, R('red'), { ...SH, bv: 2 });
  },
  pw_smite(B) {
    for (const [x, y, r] of [[5, 4, 3], [9, 3.5, 3.4], [12, 5, 2.6]] as const) E(B, x, y, r, r * 0.8, R('white'), { ...O, bv: 2 });
    P(B, [[8.5, 6], [5.5, 11], [8, 11], [6.5, 15.2], [11.5, 9.5], [9, 9.5], [10.5, 6]], R('gold'), { ...SH, bv: 1 });
  },
  pw_miracle(B) {
    S(B, (x, y) => {
      const d = ((x - 8) / 6.4) ** 2 + ((y - 3) / 1.8) ** 2;
      return d <= 1 && d >= 0.5;
    }, 1, 0.5, 15, 5.5, R('gold'), { ol: true, bv: 0, shine: true });
    P(B, star(8, 10.5, 4, 5.4, 1.5), RP('#FFF3B0'), { ...SH, bv: 2 });
    for (const [x, y] of [[2.5, 9], [13.5, 12]] as const) raw(B, x, y, [255, 240, 170]);
  },

  pw_drain(B) {
    S(B, drop(8, 10.2, 4.8), 2, 0.5, 14, 15.5, RP('#B71C1C'), { ...SH, bv: 3 });
    for (const x of [6.5, 9.5]) P(B, [[x - 1, 9], [x + 1, 9], [x, 11.5]], R('white'), { bv: 0 });
  },
  pw_arcane(B) {
    ring(B, 8, 8, 7, 1.4, R('violet'), SH);
    P(B, star(8, 8.3, 3, 5, 2.4), R('cyan'), { ol: true, bv: 1, shine: true });
    raw(B, 8, 8, WHITE);
  },
  pw_earth(B) {
    P(B, [[1.5, 14.5], [4, 6], [7.5, 2.5], [11, 5], [14.5, 14.5]], RP('#8D6E46'), { ...O, bv: 3 });
    P(B, [[5.5, 4.5], [7.5, 2.5], [9.5, 4], [8.5, 5.5], [6.5, 5]], R('white'), { bv: 1 });
    ln(B, 7, 9, 9, 12, RP('#8D6E46'), DEEP);
    ln(B, 9, 12, 8, 14, RP('#8D6E46'), DEEP);
  },
  pw_wind(B) {
    const G = RP('#9FE3F5');
    for (const [y, x0, x1] of [[3.5, 2, 10], [8, 1, 12.5], [12.5, 3, 9]] as const) {
      C(B, x0, y, x1, y, 1.5, G, { bv: 0 });
      ring(B, x1, y - 1.6, 2.4, 1.4, G, { bv: 0 }, -Math.PI * 0.9, Math.PI / 2);
    }
  },

  pw_vines(B) {
    let px = 3,
      py = 15;
    for (let t = 1; t <= 10; t++) {
      const x = 3 + t * 1.1 + Math.sin(t * 0.9) * 2,
        y = 15 - t * 1.3;
      C(B, px, py, x, y, 1.8, R('green'), { ol: true, bv: 1 });
      px = x;
      py = y;
    }
    for (const [x, y, s] of [[8.5, 9.5, 1], [4, 6, -1], [11, 4.5, 1]] as const) E(B, x + s * 1.8, y, 2, 1.3, RP('#8FD16A'), { ...O, bv: 1 });
  },
  pw_boom(B) {
    C(B, 10.5, 4, 13, 1.8, 1.4, R('wood'), O);
    P(B, star(13.5, 1.8, 4, 1.8, 0.6), R('gold'), { bv: 0 });
    E(B, 7.5, 9, 6, 6, RP('#3A3344'), { ...SH, bv: 3 });
    Bx(B, 9, 3, 12, 5, R('iron'), 0.5, O);
  },
  pw_magnet(B) {
    S(B, (x, y) => {
      const d = Math.hypot(x - 8, y - 6.5);
      return (y < 6.5 ? d <= 6.6 && d >= 2.8 : (x > 1.4 && x < 5.2) || (x > 10.8 && x < 14.6)) && y < 14.5;
    }, 1, 0, 15, 15, R('red'), { ...SH, bv: 2 });
    for (const x of [1.4, 10.8]) Bx(B, x, 11.5, x + 3.8, 14.5, R('steel'), 0, { ol: true, bv: 1, shine: true });
  },
  pw_summon(B) {
    ring(B, 8, 8, 7, 1.3, RP('#9575CD'), SH);
    const pts = star(8, 8.4, 5, 5.4, 2.2);
    P(B, pts, RP('#E5484D'), { ol: true, bv: 1, shine: true });
  },

  // ---- gear slots (tinted with the rarity color)
  slot_armor(B, T) {
    P(B, [[1.5, 3], [5, 1.5], [8, 3.5], [11, 1.5], [14.5, 3], [13.3, 8], [12.8, 14.5], [3.2, 14.5], [2.7, 8]], T, { ...SH, bv: 3 });
    ln(B, 8, 4, 8, 12, T, SHINE);
    ln(B, 9, 4, 9, 12, T, SHD);
    Bx(B, 3.2, 10, 12.8, 11.5, R('brown'), 0, { bv: 1, onto: true });
    dot(B, 8, 10.5, R('gold'), SHINE);
  },
  slot_helm(B, T) {
    S(B, and(ell(8, 9, 6.6, 7), (_x, y) => y < 12), 1, 1.5, 15, 12, T, { ...SH, bv: 3 });
    Bx(B, 1.5, 10, 4.5, 14.5, T, 1, O);
    Bx(B, 11.5, 10, 14.5, 14.5, T, 1, O);
    Bx(B, 3.5, 7, 12.5, 8.6, R('ink'), 0, { tone: OLN });
    Bx(B, 7.2, 8.6, 8.8, 12, T, 0, { bv: 1, sh: -1 });
    ln(B, 4, 4, 7, 2.5, T, SHINE);
  },
  slot_boots(B, T) {
    P(B, [[3.5, 1.5], [9, 1.5], [9, 9], [14, 10], [14.8, 14.5], [3.5, 14.5]], T, { ...SH, bv: 3 });
    Bx(B, 3.5, 13, 14.8, 14.8, R('brown'), 0, { ol: true, bv: 1 });
    Bx(B, 3.5, 1.5, 9, 3.5, T, 0, { bv: 1, sh: 1 });
  },
  slot_gloves(B, T) {
    for (const [x, y] of [[4.6, 2.5], [7, 1.5], [9.4, 1.8], [11.8, 3]] as const) C(B, x, y, x, 7, 2.2, T, { ol: true, bv: 1 });
    C(B, 2.5, 7, 4.5, 10.5, 2.4, T, O);
    Bx(B, 3.5, 6, 13, 12.5, T, 2.5, { ...SH, bv: 3 });
    Bx(B, 3.5, 11.5, 13, 15, R('steel'), 0.5, { ol: true, bv: 1, shine: true });
  },
  slot_cape(B, T) {
    P(B, [[5, 1.8], [11, 1.8], [13.2, 8], [14.8, 14.8], [1.2, 14.8], [2.8, 8]], T, { ...O, bv: 3 });
    for (const x of [5.5, 8, 10.5]) ln(B, x, 6, x - (x - 8) * 0.4, 14, T, SHD);
    E(B, 8, 3, 1.5, 1.5, R('gold'), SH);
  },
  slot_trinket(B, T) {
    ln(B, 3, 1, 8, 6.5, R('gold'), BASE);
    ln(B, 13, 1, 8, 6.5, R('gold'), BASE);
    E(B, 8, 10.5, 3.8, 4.2, T, { ...SH, bv: 3 });
    raw(B, 7, 9, WHITE);
  },

  // ---- bag items
  it_bandage(B) {
    C(B, 2.5, 12.5, 13.5, 3.5, 5.6, RP('#E8C4A0'), { ...O, bv: 2 });
    E(B, 8, 8, 2.7, 2.7, R('paper'), { bv: 1 });
    for (const [x, y] of [[4, 11], [12, 5], [5, 12.5], [11, 3.8]] as const) dot(B, x, y, RP('#E8C4A0'), SHD);
  },
  it_medkit(B) {
    ring(B, 8, 4.2, 2.8, 1.2, R('iron'), O, -Math.PI, 0);
    Bx(B, 1.2, 4, 14.8, 14.5, R('white'), 1.5, { ...O, bv: 2 });
    Bx(B, 6.8, 6, 9.2, 13, R('red'), 0, { bv: 1, shine: true });
    Bx(B, 4.5, 8.3, 11.5, 10.7, R('red'), 0, { bv: 1, shine: true });
  },
  it_drink(B) {
    Bx(B, 4, 2, 12, 14.8, R('blue'), 1.5, { ...SH, bv: 3 });
    Bx(B, 4, 2, 12, 3.8, R('steel'), 1, { ol: true, bv: 1, shine: true, onto: true });
    P(B, [[8.8, 5], [6, 9.5], [8, 9.5], [7, 13], [10, 8.3], [8, 8.3]], R('gold'), { bv: 1, shine: true });
  },
  it_scout(B) {
    C(B, 2, 14, 7, 9, 3.6, R('wood'), O, 3.4);
    C(B, 7, 9, 13, 3, 3.2, R('gold'), SH, 2.6);
    E(B, 13, 3, 1.7, 1.7, R('cyan'), { ol: true, bv: 1, shine: true });
    ln(B, 6, 10, 8, 8, R('gold'), DEEP);
  },
  it_salts(B) {
    Bx(B, 3, 5, 13, 14.8, RP('#CFE8F5'), 2, { ...SH, bv: 3, al: 230 });
    for (const [x, y] of [[6, 11], [9, 12], [7.5, 9.5], [10, 10]] as const) dot(B, x, y, R('white'), SHINE);
    Bx(B, 4, 2, 12, 5.5, R('wood'), 1, O);
  },
  it_charm(B) {
    C(B, 8, 9, 11, 15, 1.4, R('green'), O);
    for (const [x, y] of [[5.4, 5.4], [10.6, 5.4], [5.4, 10.6], [10.6, 10.6]] as const) S(B, heart(x, y + 0.5, 0.42), x - 3.5, y - 3.5, x + 3.5, y + 3.5, RP('#6CC24A'), { ...SH, bv: 2 });
    raw(B, 8, 8, [255, 230, 120]);
  },
  it_ration(B) {
    E(B, 8, 4, 6, 2, R('steel'), { ...SH, bv: 1 });
    Bx(B, 2, 4, 14, 13, R('steel'), 1.5, { ...SH, bv: 3 });
    E(B, 8, 13, 6, 1.8, R('steel'), { bv: 1, sh: -1, under: true });
    Bx(B, 2, 6.8, 14, 10.5, R('red'), 0, { bv: 1, onto: true });
    E(B, 8, 8.6, 1.6, 1.2, R('white'), { bv: 0 });
  },
  it_grit(B) {
    S(B, heart(7.5, 7.5, 0.95), 1, 1, 14, 14.5, R('red'), { ...SH, bv: 3 });
    S(B, or(Bx_(11.6, 8.5, 13.4, 14.8, 0.3), Bx_(9.7, 10.7, 15.3, 12.5, 0.3)), 9.5, 8.5, 15.5, 15, R('green'), SH);
  },
  it_whetstone(B) {
    P(B, [[1.5, 8.5], [6.5, 11.5], [6.5, 14], [1.5, 11]], R('iron'), { ol: true, bv: 1, sh: -1 });
    P(B, [[6.5, 11.5], [14.5, 6.5], [14.5, 9], [6.5, 14]], R('iron'), { ol: true, bv: 1, sh: -2 });
    P(B, [[1.5, 8.5], [9.5, 3.5], [14.5, 6.5], [6.5, 11.5]], R('steel'), { ol: true, bv: 1, shine: true });
    for (const [x, y] of [[10.5, 1.5], [12.5, 2.5]] as const) raw(B, x, y, WHITE);
  },

  // ---- statuses and moves
  st_burn(B) {
    P(B, [[8, 0.8], [11.5, 5], [13.5, 9.5], [12.5, 13], [8, 15.2], [3.5, 13], [2.5, 9.5], [4.5, 6], [6.3, 8.5], [6.8, 4]], R('orange'), { ...SH, bv: 3 });
    P(B, [[8.3, 6], [10.8, 9.5], [10.5, 12.5], [8, 14], [5.5, 12.5], [5.8, 10]], R('gold'), { bv: 2, shine: true });
    raw(B, 8, 12, WHITE);
  },
  st_poison(B) {
    S(B, drop(8, 10.2, 4.8), 2, 0.5, 14, 15.5, R('lime'), { ...SH, bv: 3 });
    E(B, 6.5, 10, 1.1, 1.3, R('ink'), { tone: OLN });
    E(B, 9.5, 10, 1.1, 1.3, R('ink'), { tone: OLN });
    ln(B, 6.5, 13, 9.5, 13, R('lime'), DEEP);
  },
  st_frozen(B) {
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3 + Math.PI / 2;
      const dx = Math.cos(a) * 6.8,
        dy = Math.sin(a) * 6.8;
      C(B, 8 - dx, 8 - dy, 8 + dx, 8 + dy, 1.6, R('ice'), { ol: true, bv: 1, shine: true });
    }
    E(B, 8, 8, 1.6, 1.6, R('white'), { bv: 1 });
  },
  st_soaked(B) {
    S(B, drop(7, 9.8, 5), 1, 0.5, 13, 15.5, R('blue'), { ...SH, bv: 3 });
    S(B, drop(13, 12.5, 1.8), 10.5, 8, 15.5, 15, R('blue'), { ...SH, bv: 1 });
    raw(B, 5, 9, WHITE);
  },
  st_stun(B) {
    S(B, (x, y) => {
      const d = ((x - 8) / 7) ** 2 + ((y - 11) / 3) ** 2;
      return d <= 1 && d >= 0.55;
    }, 0.5, 7.5, 15.5, 14.5, R('gold'), { tone: SHD });
    P(B, star(8, 6.5, 5, 4.6, 2), R('gold'), { ...SH, bv: 2 });
    P(B, star(2.8, 11.5, 4, 2.3, 0.9), R('gold'), { ol: true, bv: 0 });
    P(B, star(13.2, 11.5, 4, 2.3, 0.9), R('gold'), { ol: true, bv: 0 });
  },
  mv_feint(B) {
    E(B, 8, 8, 6.4, 6.8, R('white'), { ...O, bv: 3 });
    P(B, [[3.5, 6.5], [6.8, 5.8], [6.8, 7.8], [4, 8]], R('ink'), { tone: OLN });
    P(B, [[12.5, 6.5], [9.2, 5.8], [9.2, 7.8], [12, 8]], R('ink'), { tone: OLN });
    for (const [x, y] of [[5.5, 11.5], [6.5, 12], [7.5, 12], [8.5, 12], [9.5, 11.5], [10.5, 10.5]] as const) dot(B, x, y, R('ink'), OLN);
  },
  mv_focus(B) {
    S(B, and(ell(8, 11.5, 9, 7), ell(8, 4.5, 9, 7)), 0.5, 3, 15.5, 13, R('white'), { ...O, bv: 2 });
    E(B, 8, 8, 3, 3, R('violet'), { bv: 2, shine: true });
    E(B, 8, 8, 1.3, 1.3, R('ink'), { tone: OLN });
    raw(B, 7, 7, WHITE);
  },
  st_vuln(B) {
    P(B, [[2, 1.8], [14, 1.8], [14, 8], [8, 15], [2, 8]], R('blue'), { ...SH, bv: 3 });
    for (const [a, b, c, d] of [[8, 2, 6.5, 6], [6.5, 6, 9, 8.5], [9, 8.5, 7, 13]] as const) ln(B, a, b, c, d, R('ink'), BASE);
  },
  st_weak(B) {
    C(B, 3, 13, 5, 11, 1.8, R('wood'), O);
    P(B, [[1.5, 10], [4, 12.5], [5, 11.5], [2.5, 9]], R('gold'), SH);
    P(B, [[4.5, 10.5], [8, 7], [9.3, 8.3], [5.8, 11.8]], R('steel'), SH);
    P(B, [[9.8, 6.2], [13.5, 2.5], [14.5, 1.5], [14.2, 3.4], [11.2, 7.6]], R('steel'), SH);
  },
  st_bent(B) {
    C(B, 2.5, 13.5, 4.5, 11.5, 1.8, R('wood'), O);
    P(B, [[1.2, 10.5], [3.5, 13], [4.5, 12], [2.2, 9.5]], R('gold'), SH);
    let px = 4.5,
      py = 11;
    for (let t = 1; t <= 6; t++) {
      const x = 4.5 + t * 1.6,
        y = 11 - t * 1.5 + t * t * 0.18;
      C(B, px, py, x, y, 2.2, R('steel'), { bv: 1, shine: true, ol: true });
      px = x;
      py = y;
    }
  },
};

// shape tests used above (the px shortcuts paint straight away; these only describe)
function Bx_(x0: number, y0: number, x1: number, y1: number, r: number) {
  return (x: number, y: number) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.max(x0 + r, Math.min(x, x1 - r)),
      cy = Math.max(y0 + r, Math.min(y, y1 - r));
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.01;
  };
}
function capsuleT(x0: number, y0: number, x1: number, y1: number, w: number) {
  const dx = x1 - x0,
    dy = y1 - y0,
    L2 = dx * dx + dy * dy;
  return (x: number, y: number) => {
    const u = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L2));
    return (x - (x0 + u * dx)) ** 2 + (y - (y0 + u * dy)) ** 2 <= (w / 2) ** 2;
  };
}

/** The icon for each power (by key): its own, or the one that already shows it (fire is a flame...). */
export const POWER_ICON: Record<string, string> = {
  fire: 'flame', ice: 'st_frozen', lightning: 'bolt', water: 'st_soaked', shadow: 'pw_shadow', light: 'pw_light', tk: 'pw_tk', mind: 'pw_mind',
  tele: 'pw_tele', regen: 'it_grit', luck: 'it_charm', poison: 'st_poison', gravity: 'pw_gravity', clones: 'people', shape: 'pw_shape',
  time: 'clock', reality: 'pw_reality', negate: 'pw_negate', smite: 'pw_smite', ward: 'shield', miracle: 'pw_miracle', drain: 'pw_drain',
  chains: 'chain', arcane: 'pw_arcane', earth: 'pw_earth', wind: 'pw_wind', sonic: 'sound', vines: 'pw_vines', boom: 'pw_boom',
  magnet: 'pw_magnet', illusion: 'mv_feint', summon: 'pw_summon',
};

/**
 * An icon drawn and outlined: colors and alphas, or null if there is no such icon. `s` real pixels per art
 * pixel: 16x16 for the page, finer (32x32) for big pictures like wheel slices and fight effects.
 */
export function drawIcon(name: string, tintHex?: string, s = 1): { px: (RGB | null)[]; a: Uint8Array; size: number } | null {
  const f = ICON_ART[name];
  if (!f) return null;
  const B = buf(ICON_SIZE, ICON_SIZE, s);
  f(B, RP(tintHex || '#9AA6B2'));
  outline(B);
  return { px: Array.from(B.c, (c) => (c ? unpack(c) : null)), a: B.a, size: B.w };
}
void INK;
