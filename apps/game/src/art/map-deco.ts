// The scenery on the chapter maps: bins and lamps in the alley, lanterns at the night market, graves on the moor,
// gears in the citadel... Each piece is a small sprite drawn with the fighters' engine (px.ts), feet at the
// bottom middle of its box. One entry per piece, so new scenery is one more entry.
//
// Pure: no DOM. `rnd` gives each copy its own small variations.

import { BASE, DEEP, LIT, SHD, SHINE, Bx, C, E, P, RP, S, and, box, buf, dot, ell, ln, minus, or, outline, poly, raw, type Buf, type Pt, type RGB } from './px';

type Draw = (B: Buf, rnd: () => number) => void;
interface Deco {
  w: number;
  h: number;
  d: Draw;
  /** lies flat on the ground: no shadow, drawn under everything else */
  flat?: boolean;
}

const O = { ol: true, bv: 2 } as const;
const O1 = { ol: true, bv: 1 } as const;
const SH = { ol: true, bv: 2, shine: true } as const;
const FL = { bv: 0, tone: BASE } as const;
const W: RGB = [255, 250, 235];
const pick = <T,>(rnd: () => number, a: readonly T[]) => a[Math.floor(rnd() * a.length)]!;
const star = (cx: number, cy: number, n: number, r1: number, r2: number): Pt[] =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1,
      a = -Math.PI / 2 + (i * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
const glow = (B: Buf, x: number, y: number, c: RGB) => {
  raw(B, x, y, c);
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const)
    raw(B, x + dx, y + dy, c, 150);
};

export const DECO: Record<string, Deco> = {
  // ---------------------------------------------------------------- streets
  bin: {
    w: 11,
    h: 14,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#5f7a6a', '#6a6f7c', '#4f6a8a']));
      Bx(B, 1.5, 4, 9.5, 13.5, R, 1, O);
      for (const x of [3.5, 5.5, 7.5]) ln(B, x, 6, x, 12, R, SHD);
      E(B, 5.5, 4, 5, 1.8, R, SH);
      Bx(B, 4, 1, 7, 2.6, R, 0, O1);
      if (rnd() < 0.5) E(B, 7.5, 2.2, 1.6, 1, RP('#F2C14E'), O1);
    },
  },
  crate: {
    w: 12,
    h: 11,
    d: (B) => {
      const R = RP('#A8713F');
      Bx(B, 0.5, 1, 11.5, 10.5, R, 0, O1);
      ln(B, 1, 5.5, 11, 5.5, R, SHD);
      ln(B, 1.5, 1.5, 10.5, 9.5, R, SHD);
      ln(B, 1, 1.5, 11, 1.5, R, LIT);
    },
  },
  tire: {
    w: 11,
    h: 7,
    d: (B) => {
      const R = RP('#3a3640');
      S(B, minus(ell(5.5, 3.5, 5, 3), ell(5.5, 3.3, 2.2, 1.2)), 0, 0, 11, 7, R, O);
    },
  },
  lamp: {
    w: 8,
    h: 24,
    d: (B) => {
      const R = RP('#4a4f5c');
      C(B, 4, 23, 4, 5, 1.8, R, O1);
      Bx(B, 2.5, 21, 5.5, 23.5, R, 0, O1);
      P(B, [[1, 5], [7, 5], [6, 2], [2, 2]], R, O1);
      Bx(B, 2.5, 5, 5.5, 6.5, RP('#FFE27A'), 0, { bv: 0, tone: LIT });
      raw(B, 4, 7, [255, 236, 150], 160);
    },
  },
  bricks: {
    w: 15,
    h: 10,
    d: (B) => {
      const R = RP('#9a4a36');
      P(B, [[0.5, 9.5], [0.5, 3], [5, 3], [5, 0.5], [11, 0.5], [11, 4], [14.5, 4], [14.5, 9.5]], R, O1);
      for (const y of [3, 6]) ln(B, 1, y, 14, y, R, DEEP);
      for (const [x, y0, y1] of [
        [4, 3, 6],
        [9, 3, 6],
        [6, 6, 9],
        [12, 6, 9],
        [8, 0, 3],
      ] as const)
        ln(B, x, y0, x, y1, R, DEEP);
    },
  },
  puddle: {
    w: 14,
    h: 6,
    flat: true,
    d: (B) => {
      E(B, 7, 3, 6.5, 2.5, RP('#3d5a80'), FL);
      E(B, 7.5, 2.6, 5, 1.6, RP('#3d5a80'), { bv: 0, tone: LIT });
      ln(B, 4, 2, 7, 2, RP('#bfe9ff'), SHINE);
    },
  },
  // ---------------------------------------------------------------- night market
  lantern: {
    w: 9,
    h: 15,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#E5484D', '#E8862E', '#F2B544']));
      ln(B, 4.5, 0, 4.5, 3, RP('#3a3640'), BASE);
      E(B, 4.5, 8, 4, 4.6, R, SH);
      for (const x of [2.5, 4.5, 6.5]) ln(B, x, 4.5, x, 11.5, R, SHD);
      Bx(B, 2.5, 2.6, 6.5, 4, RP('#F2B544'), 0, O1);
      Bx(B, 2.5, 12, 6.5, 13.4, RP('#F2B544'), 0, O1);
      ln(B, 4.5, 13.5, 4.5, 14.5, RP('#E5484D'), BASE);
    },
  },
  stall: {
    w: 19,
    h: 17,
    d: (B, rnd) => {
      const wood = RP('#8a5a36');
      const cloth = RP(pick(rnd, ['#E5484D', '#3D8BFF', '#2DD4BF']));
      C(B, 2.5, 16, 2.5, 6, 1.4, wood, O1);
      C(B, 16.5, 16, 16.5, 6, 1.4, wood, O1);
      Bx(B, 1, 10, 18, 15.5, wood, 0, O1);
      ln(B, 1.5, 10.5, 17.5, 10.5, wood, LIT);
      for (let i = 0; i < 3; i++) E(B, 4.5 + i * 5, 9, 1.8, 1.4, RP(pick(rnd, ['#F2B544', '#8FD16A', '#FF6FA8'])), O1);
      P(B, [[0, 6.5], [3, 1], [16, 1], [19, 6.5]], cloth, O);
      for (const x of [5, 9.5, 14]) P(B, [[x - 1.2, 1.5], [x + 1.2, 1.5], [x + 1.8, 6], [x - 1.8, 6]], RP('#F7F4EE'), { bv: 1, onto: true });
      for (let x = 1; x < 19; x += 3) E(B, x + 0.5, 6.8, 1.5, 1.2, cloth, O1);
    },
  },
  barrel: {
    w: 10,
    h: 12,
    d: (B) => {
      const R = RP('#9a6338');
      Bx(B, 1, 1, 9, 11.5, R, 2.5, O);
      for (const y of [3.5, 8.5]) ln(B, 1.5, y, 8.5, y, RP('#7C8896'), BASE);
      E(B, 5, 1.6, 3.6, 1, R, { bv: 0, tone: SHD });
    },
  },
  // ---------------------------------------------------------------- city
  building: {
    w: 17,
    h: 28,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#6a7385', '#5b5f78', '#7a6a6a', '#4f5a6e']));
      const h0 = 3 + Math.floor(rnd() * 8);
      Bx(B, 1, h0, 16, 27.5, R, 0, O1);
      ln(B, 1.5, h0 + 0.5, 15.5, h0 + 0.5, R, LIT);
      const lit: RGB = [255, 214, 110],
        dark: RGB = [40, 44, 64];
      for (let y = h0 + 3; y < 25; y += 4)
        for (let x = 3; x < 15; x += 3) {
          const c = rnd() < 0.45 ? lit : dark;
          raw(B, x, y, c);
          raw(B, x + 1, y, c);
          raw(B, x, y + 1, c);
          raw(B, x + 1, y + 1, c);
        }
      Bx(B, 6.5, 24, 10.5, 27.5, RP('#3a3640'), 0, O1);
    },
  },
  vent: {
    w: 10,
    h: 8,
    d: (B) => {
      const R = RP('#9AA6B2');
      Bx(B, 0.5, 1, 9.5, 7.5, R, 1, O);
      E(B, 5, 4.2, 2.6, 2.2, RP('#4a4f5c'), O1);
      ln(B, 3, 4, 7, 4, R, BASE);
      ln(B, 5, 2.4, 5, 6, R, BASE);
    },
  },
  antenna: {
    w: 9,
    h: 20,
    d: (B) => {
      const R = RP('#7C8896');
      C(B, 4.5, 19, 4.5, 3, 1.4, R, O1);
      for (const [y, w] of [
        [6, 3.5],
        [10, 2.5],
        [14, 3.5],
      ] as const)
        C(B, 4.5 - w, y, 4.5 + w, y, 1, R, O1);
      Bx(B, 2.5, 17.5, 6.5, 19.5, R, 0, O1);
      glow(B, 4, 2, [255, 90, 95]);
    },
  },
  tower: {
    w: 13,
    h: 21,
    d: (B) => {
      const wood = RP('#8a5a36');
      for (const x of [3, 10]) C(B, x, 20, x + (x < 6 ? 1 : -1), 10, 1.4, wood, O1);
      ln(B, 3.5, 15, 9.5, 15, wood, SHD);
      Bx(B, 1, 3, 12, 11, wood, 1.5, O);
      for (const y of [5, 8]) ln(B, 1.5, y, 11.5, y, RP('#4a4f5c'), BASE);
      P(B, [[0.5, 3.5], [6.5, 0], [12.5, 3.5]], RP('#5b5f78'), O1);
    },
  },
  // ---------------------------------------------------------------- water
  buoy: {
    w: 8,
    h: 11,
    d: (B) => {
      E(B, 4, 6.5, 3.5, 4, RP('#E5484D'), SH);
      S(B, and(ell(4, 6.5, 3.5, 4), (_x, y) => y > 5.5 && y < 7.5), 0, 2, 8, 11, RP('#F7F4EE'), { bv: 2 });
      C(B, 4, 3, 4, 0.5, 1, RP('#4a4f5c'), O1);
      glow(B, 4, 0, [255, 226, 122]);
      ln(B, 0, 10, 8, 10, RP('#8cc0ff'), LIT);
    },
  },
  boat: {
    w: 19,
    h: 10,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#A8713F', '#E5484D', '#F7F4EE']));
      P(B, [[0.5, 3], [18.5, 3], [15.5, 8.5], [3.5, 8.5]], R, O);
      ln(B, 2, 4, 17, 4, R, LIT);
      Bx(B, 7, 0.5, 12, 3, RP('#8a5a36'), 0, O1);
      ln(B, 1, 9.5, 18, 9.5, RP('#8cc0ff'), LIT);
    },
  },
  rock: {
    w: 11,
    h: 8,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#7C8896', '#8a7f72', '#6a6f7c']));
      S(B, or(ell(4.5, 4.8, 4.2, 3.2), ell(7.5, 5.2, 3.2, 2.6)), 0, 0, 11, 8, R, O);
      ln(B, 4, 3, 5, 5, R, SHD);
    },
  },
  // ---------------------------------------------------------------- stadium
  flood: {
    w: 11,
    h: 25,
    d: (B) => {
      const R = RP('#9AA6B2');
      C(B, 5.5, 24, 5.5, 6, 1.6, R, O1);
      Bx(B, 0.5, 0.5, 10.5, 6, R, 0.5, O1);
      for (let y = 1.5; y < 5.5; y += 2) for (let x = 2; x < 10; x += 2) raw(B, x, y, [255, 246, 200]);
      Bx(B, 3.5, 22.5, 7.5, 24.5, R, 0, O1);
    },
  },
  cone: {
    w: 8,
    h: 10,
    d: (B) => {
      P(B, [[4, 0.5], [7, 8], [1, 8]], RP('#E8862E'), O);
      S(B, and(poly([[4, 0.5], [7, 8], [1, 8]]), (_x, y) => y > 3.5 && y < 5.5), 0, 0, 8, 10, RP('#F7F4EE'), { bv: 1 });
      Bx(B, 0, 8, 8, 9.5, RP('#E8862E'), 0, O1);
    },
  },
  flag: {
    w: 9,
    h: 17,
    d: (B, rnd) => {
      C(B, 1.5, 16.5, 1.5, 1, 1.2, RP('#7C8896'), O1);
      const R = RP(pick(rnd, ['#E5484D', '#3D8BFF', '#2DD4BF', '#F2B544', '#9C6BFF']));
      P(B, [[2, 1], [8.5, 2], [7, 4.5], [8.5, 7], [2, 7]], R, O1);
      ln(B, 2.5, 2, 7, 2.5, R, LIT);
    },
  },
  bench: {
    w: 14,
    h: 8,
    d: (B) => {
      const R = RP('#A8713F');
      for (const x of [2, 12]) C(B, x, 7.5, x, 3.5, 1.2, RP('#4a4f5c'), O1);
      Bx(B, 0.5, 2, 13.5, 4, R, 0, O1);
      Bx(B, 0.5, 4.5, 13.5, 5.8, R, 0, O1);
    },
  },
  bush: {
    w: 13,
    h: 9,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#3f8f4a', '#4f9a3a', '#2f7a4a']));
      S(B, or(ell(4, 5.5, 3.6, 3.2), ell(8.5, 5.2, 4, 3.6), ell(6.5, 3.4, 3, 2.6)), 0, 0, 13, 9, R, O);
      if (rnd() < 0.4) for (const [x, y] of [[4, 4], [9, 5], [7, 2]] as const) raw(B, x, y, [255, 111, 168]);
    },
  },
  tree: {
    w: 14,
    h: 21,
    d: (B, rnd) => {
      C(B, 7, 20, 7, 11, 2.4, RP('#7a4f2e'), O1);
      const R = RP(pick(rnd, ['#3f8f4a', '#4f9a3a', '#5aa04a']));
      S(B, or(ell(7, 8, 6, 5.6), ell(4, 11, 3.6, 3), ell(10, 11, 3.6, 3)), 0, 0, 14, 15, R, O);
    },
  },
  statue: {
    w: 10,
    h: 21,
    d: (B, rnd) => {
      const R = RP(rnd() < 0.5 ? '#B4BEC9' : '#d9a53a');
      Bx(B, 1, 15, 9, 20.5, RP('#8a7f72'), 0, O1);
      C(B, 5, 14.5, 5, 7, 3.2, R, O);
      E(B, 5, 5, 2.2, 2.2, R, SH);
      C(B, 5, 8.5, 8.5, 4, 1.4, R, O1);
    },
  },
  // ---------------------------------------------------------------- haunted
  deadtree: {
    w: 15,
    h: 21,
    d: (B) => {
      const R = RP('#5b4a5e');
      C(B, 7.5, 20.5, 7, 6, 2.6, R, O, 1.6);
      C(B, 7, 12, 2.5, 7, 1.4, R, O1, 0.8);
      C(B, 7, 9, 12.5, 4, 1.4, R, O1, 0.8);
      C(B, 4, 9, 3, 4, 1, R, O1, 0.6);
      C(B, 7, 6, 8.5, 1, 1, R, O1, 0.6);
    },
  },
  grave: {
    w: 9,
    h: 12,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#8a8a9a', '#7C8896', '#9a948a']));
      S(B, or(box(1, 4, 8, 11.5), ell(4.5, 4.2, 3.5, 3.4)), 0, 0, 9, 12, R, O);
      ln(B, 4.5, 3.5, 4.5, 8, R, DEEP);
      ln(B, 3, 5, 6, 5, R, DEEP);
    },
  },
  pumpkin: {
    w: 10,
    h: 9,
    d: (B) => {
      const R = RP('#E8862E');
      S(B, or(ell(3.5, 5.5, 3, 3), ell(6.5, 5.5, 3, 3), ell(5, 5.2, 2.6, 3.2)), 0, 0, 10, 9, R, SH);
      C(B, 5, 2.6, 5.8, 0.6, 1.2, RP('#4f9a3a'), O1);
      for (const [x, y] of [[3.5, 4.5], [6.5, 4.5]] as const) raw(B, x, y, [255, 226, 122]);
      ln(B, 3.5, 6.8, 6.5, 6.8, RP('#FFE27A'), LIT);
    },
  },
  fence: {
    w: 15,
    h: 10,
    d: (B) => {
      const R = RP('#6a5040');
      for (const x of [2, 7.5, 13]) C(B, x, 9.5, x, 1.5, 1.6, R, O1);
      C(B, 0.5, 4, 14.5, 4.5, 1.1, R, O1);
      C(B, 0.5, 7, 14.5, 6.5, 1.1, R, O1);
    },
  },
  // ---------------------------------------------------------------- neon
  neon: {
    w: 15,
    h: 13,
    d: (B, rnd) => {
      const c: RGB = pick(rnd, [
        [255, 79, 216],
        [79, 195, 247],
        [143, 209, 106],
      ] as const);
      C(B, 3, 12.5, 3, 7, 1.2, RP('#4a4f5c'), O1);
      C(B, 12, 12.5, 12, 7, 1.2, RP('#4a4f5c'), O1);
      Bx(B, 0.5, 0.5, 14.5, 7.5, RP('#1d1838'), 1, O1);
      for (let x = 2; x <= 12; x++) if (rnd() < 0.7) raw(B, x, 3 + (x % 3 === 0 ? 1 : 0), c);
      for (let x = 2; x <= 12; x++) {
        raw(B, x, 1.5, c, 120);
        raw(B, x, 6, c, 120);
      }
    },
  },
  // ---------------------------------------------------------------- hive
  comb: {
    w: 13,
    h: 12,
    d: (B) => {
      const R = RP('#F2C14E');
      const hex = (cx: number, cy: number) => poly(Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i * Math.PI) / 3) * 2.6, cy + Math.sin((i * Math.PI) / 3) * 2.6] as Pt));
      const cells: [number, number][] = [
        [4, 3.5],
        [8.5, 3.5],
        [2, 7.5],
        [6.3, 7.5],
        [10.6, 7.5],
      ];
      S(B, or(...cells.map(([x, y]) => hex(x, y))), 0, 0, 13, 12, R, SH);
      for (const [x, y] of cells) E(B, x, y, 1, 1, RP('#b07614'), { bv: 0, tone: SHD });
    },
  },
  flower: {
    w: 9,
    h: 12,
    d: (B, rnd) => {
      C(B, 4.5, 11.5, 4.5, 5, 1, RP('#4f9a3a'), O1);
      E(B, 6.5, 8.5, 1.6, 0.9, RP('#4f9a3a'), O1);
      const R = RP(pick(rnd, ['#FF6FA8', '#9C6BFF', '#F7F4EE', '#E5484D']));
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        E(B, 4.5 + Math.cos(a) * 2.2, 3.6 + Math.sin(a) * 2.2, 1.6, 1.6, R, O1);
      }
      E(B, 4.5, 3.6, 1.3, 1.3, RP('#F2C14E'), O1);
    },
  },
  drip: {
    w: 8,
    h: 6,
    flat: true,
    d: (B) => {
      E(B, 4, 3, 3.6, 2.4, RP('#e8a83a'), { bv: 0, tone: LIT });
      raw(B, 3, 2, [255, 240, 190]);
    },
  },
  bee: {
    w: 10,
    h: 8,
    d: (B) => {
      E(B, 4, 2.6, 2.2, 1.8, RP('#dfe9f5'), { ol: true, bv: 1, al: 220 });
      E(B, 6.5, 2.4, 2, 1.6, RP('#dfe9f5'), { ol: true, bv: 1, al: 220 });
      E(B, 5, 5, 4, 2.6, RP('#F2C14E'), SH);
      for (const x of [3.5, 5.5]) ln(B, x, 3, x, 7, RP('#2A2238'), BASE, true);
      raw(B, 8, 4.5, [42, 34, 56]);
    },
  },
  // ---------------------------------------------------------------- wheel's domain, carnival
  wheel: {
    w: 15,
    h: 17,
    d: (B, rnd) => {
      C(B, 7.5, 16.5, 7.5, 8, 1.6, RP('#7C8896'), O1);
      Bx(B, 4.5, 15, 10.5, 16.8, RP('#7C8896'), 0, O1);
      const cols = ['#E5484D', '#F2B544', '#3D8BFF', '#2DD4BF', '#9C6BFF', '#E8862E'];
      const off = Math.floor(rnd() * 6);
      for (let i = 0; i < 6; i++) {
        const a0 = (i * Math.PI) / 3,
          a1 = ((i + 1) * Math.PI) / 3;
        S(
          B,
          (x, y) => {
            const dx = x - 7.5,
              dy = y - 7.5;
            if (dx * dx + dy * dy > 42) return false;
            let a = Math.atan2(dy, dx);
            if (a < 0) a += 2 * Math.PI;
            return a >= a0 && a < a1;
          },
          0,
          0,
          15,
          15,
          RP(cols[(i + off) % 6]!),
          { bv: 0, tone: BASE },
        );
      }
      S(B, minus(ell(7.5, 7.5, 7.2, 7.2), ell(7.5, 7.5, 6.4, 6.4)), 0, 0, 15, 15, RP('#F2B544'), SH);
      E(B, 7.5, 7.5, 1.4, 1.4, RP('#F7F4EE'), O1);
      P(B, [[6, 0], [9, 0], [7.5, 2.4]], RP('#E5484D'), O1);
    },
  },
  banner: {
    w: 9,
    h: 19,
    d: (B, rnd) => {
      C(B, 4.5, 18.5, 4.5, 0.5, 1.2, RP('#7C8896'), O1);
      C(B, 0.5, 1.5, 8.5, 1.5, 1, RP('#F2B544'), O1);
      const R = RP(pick(rnd, ['#E5484D', '#9C6BFF', '#3D8BFF']));
      P(B, [[1, 2], [8, 2], [8, 11], [4.5, 9], [1, 11]], R, O);
      ln(B, 1.5, 3, 7.5, 3, RP('#F2B544'), LIT);
      E(B, 4.5, 5.6, 1.4, 1.4, RP('#F2B544'), O1);
    },
  },
  tent: {
    w: 19,
    h: 17,
    d: (B, rnd) => {
      const a = RP(pick(rnd, ['#E5484D', '#9C6BFF', '#3D8BFF'])),
        b = RP('#F7F4EE');
      const body = poly([[1, 16.5], [3, 7], [9.5, 2], [16, 7], [18, 16.5]]);
      S(B, body, 0, 0, 19, 17, a, O);
      S(B, and(body, (x) => Math.floor((x - 9.5) / 3 + 100) % 2 === 0), 0, 0, 19, 17, b, { bv: 2, onto: true });
      P(B, [[7.5, 16.5], [9.5, 10], [11.5, 16.5]], RP('#2A2238'), { bv: 0, tone: DEEP });
      C(B, 9.5, 2, 9.5, 0, 0.8, RP('#7C8896'), O1);
      raw(B, 10, 0, [229, 72, 77]);
    },
  },
  balloon: {
    w: 7,
    h: 15,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#E5484D', '#3D8BFF', '#F2B544', '#FF6FA8', '#8FD16A']));
      ln(B, 3.5, 8, 3, 14.5, RP('#B4BEC9'), BASE);
      E(B, 3.5, 4.5, 3, 3.8, R, SH);
      raw(B, 3.5, 8.5, R[SHD]);
    },
  },
  booth: {
    w: 13,
    h: 15,
    d: (B) => {
      const R = RP('#9C6BFF');
      Bx(B, 1, 5, 12, 14.5, R, 0, O1);
      Bx(B, 3, 7, 10, 10, RP('#2A2238'), 0, { bv: 0, tone: SHD });
      P(B, [[0, 5.5], [6.5, 0.5], [13, 5.5]], RP('#E5484D'), O);
      ln(B, 3.5, 11.5, 9.5, 11.5, RP('#F2B544'), LIT);
    },
  },
  // ---------------------------------------------------------------- sky
  cloud: {
    w: 19,
    h: 9,
    d: (B) => {
      S(B, or(ell(5, 5.5, 4.5, 3), ell(10, 4.4, 5, 4), ell(14.5, 5.8, 4, 2.8)), 0, 0, 19, 9, RP('#eef4ff'), { ol: true, bv: 3, al: 235 });
    },
  },
  isle: {
    w: 19,
    h: 13,
    d: (B, rnd) => {
      P(B, [[1, 4], [18, 4], [12, 12.5], [8, 12], [6, 9]], RP('#8a7f72'), O);
      E(B, 9.5, 4, 8.5, 2.6, RP('#5aa04a'), O);
      if (rnd() < 0.6) {
        C(B, 12, 3.5, 12, 0.5, 1.2, RP('#7a4f2e'), O1);
        E(B, 12, 0.8, 2.2, 1.6, RP('#3f8f4a'), O1);
      }
    },
  },
  bird: {
    w: 7,
    h: 4,
    d: (B) => {
      const R = RP('#2A2238');
      ln(B, 0, 0, 3, 2, R, BASE);
      ln(B, 3, 2, 6, 0, R, BASE);
    },
  },
  // ---------------------------------------------------------------- underworld
  lava: {
    w: 15,
    h: 7,
    flat: true,
    d: (B) => {
      E(B, 7.5, 3.5, 7, 3, RP('#3a1408'), FL);
      E(B, 7.5, 3.4, 5.6, 2.2, RP('#E8862E'), { bv: 0, tone: BASE });
      E(B, 7, 3, 3.4, 1.2, RP('#F2C14E'), { bv: 0, tone: LIT });
    },
  },
  spike: {
    w: 9,
    h: 15,
    d: (B, rnd) => {
      const R = RP('#5a2a22');
      P(B, [[0.5, 14.5], [3.5, 3 + rnd() * 2], [4.5, 0.5], [6, 4], [8.5, 14.5]], R, O);
      ln(B, 4.3, 3, 3, 13, R, LIT);
    },
  },
  skull: {
    w: 9,
    h: 8,
    d: (B) => {
      const R = RP('#EDE6D6');
      S(B, or(ell(4.5, 3.5, 4, 3.3), box(2.5, 5, 6.5, 7.5, 1)), 0, 0, 9, 8, R, O);
      E(B, 3, 3.6, 1.1, 1.1, RP('#2A2238'), { bv: 0, tone: DEEP });
      E(B, 6, 3.6, 1.1, 1.1, RP('#2A2238'), { bv: 0, tone: DEEP });
    },
  },
  flame: {
    w: 8,
    h: 11,
    d: (B) => {
      S(B, or(ell(4, 7.2, 3.5, 3.4), poly([[0.8, 6.5], [4, 0], [7.2, 6.5]])), 0, 0, 8, 11, RP('#E8862E'), SH);
      S(B, or(ell(4, 8, 1.8, 2), poly([[2.3, 8], [4, 4], [5.7, 8]])), 0, 0, 8, 11, RP('#F2C14E'), { bv: 1, shine: true });
    },
  },
  // ---------------------------------------------------------------- clockwork
  gear: {
    w: 15,
    h: 15,
    d: (B, rnd) => {
      const R = RP(rnd() < 0.5 ? '#C9A25B' : '#B4BEC9');
      const teeth = (x: number, y: number) => {
        const a = Math.atan2(y - 7.5, x - 7.5),
          d = Math.hypot(x - 7.5, y - 7.5);
        const r = Math.cos(a * 8) > 0.2 ? 7 : 5.6;
        return d <= r && d >= 2;
      };
      S(B, teeth, 0, 0, 15, 15, R, SH);
      S(B, minus(ell(7.5, 7.5, 4.2, 4.2), ell(7.5, 7.5, 3.2, 3.2)), 0, 0, 15, 15, R, { bv: 0, tone: SHD, onto: true });
    },
  },
  pipe: {
    w: 15,
    h: 13,
    d: (B) => {
      const R = RP('#b87333');
      C(B, 2, 12, 2, 5, 3, R, SH);
      C(B, 2, 4, 12.5, 4, 3, R, SH);
      C(B, 12.5, 4, 12.5, 12, 3, R, SH);
      for (const [x, y] of [[2, 8], [7, 4], [12.5, 8]] as const) E(B, x, y, 2.2, 1.2, R, { ol: true, bv: 1, shine: true });
      raw(B, 13, 1, [230, 236, 245], 160);
      raw(B, 12, 0, [230, 236, 245], 110);
    },
  },
  bolt: {
    w: 8,
    h: 7,
    d: (B) => {
      const R = RP('#9AA6B2');
      P(B, Array.from({ length: 6 }, (_, i) => [4 + Math.cos((i * Math.PI) / 3) * 3.6, 3.5 + Math.sin((i * Math.PI) / 3) * 3] as Pt), R, SH);
      E(B, 4, 3.5, 1.3, 1.1, R, { bv: 0, tone: DEEP });
    },
  },
  clock: {
    w: 12,
    h: 16,
    d: (B) => {
      C(B, 6, 15.5, 6, 9, 1.6, RP('#5e4a2c'), O1);
      E(B, 6, 5.5, 5.2, 5.2, RP('#C9A25B'), SH);
      E(B, 6, 5.5, 3.8, 3.8, RP('#F2EBDD'), { ol: true, bv: 1 });
      ln(B, 6, 5.5, 6, 3, RP('#2A2238'), BASE);
      ln(B, 6, 5.5, 8, 6.5, RP('#2A2238'), BASE);
    },
  },
  // ---------------------------------------------------------------- sea
  coral: {
    w: 13,
    h: 13,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#FF6FA8', '#E8862E', '#9C6BFF']));
      C(B, 6.5, 12.5, 6.5, 5, 2, R, O);
      C(B, 6.5, 8, 2.5, 3, 1.6, R, O);
      C(B, 6.5, 7, 10.5, 2, 1.6, R, O);
      C(B, 2.5, 3, 1.5, 0.8, 1.2, R, O1);
      C(B, 10.5, 2, 11.5, 0.6, 1.2, R, O1);
    },
  },
  weed: {
    w: 8,
    h: 17,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#3f8f4a', '#2DD4BF']));
      let x = 4,
        y = 16.5;
      for (let i = 0; i < 4; i++) {
        const nx = 4 + (i % 2 ? -2 : 2),
          ny = y - 4;
        C(B, x, y, nx, ny, 1.8, R, O1, 1.4);
        x = nx;
        y = ny;
      }
    },
  },
  column: {
    w: 10,
    h: 23,
    d: (B, rnd) => {
      const R = RP('#e2dccf');
      const top = rnd() < 0.3 ? 8 : 2;
      Bx(B, 2, top + 2, 8, 21, R, 0, O);
      for (const x of [4, 6]) ln(B, x, top + 3, x, 20, R, SHD);
      Bx(B, 0.5, top, 9.5, top + 2, R, 0, O1);
      Bx(B, 0.5, 20.5, 9.5, 22.5, R, 0, O1);
    },
  },
  shell: {
    w: 9,
    h: 7,
    d: (B) => {
      const R = RP('#FFB3D9');
      S(B, and(ell(4.5, 6, 4.2, 5.4), (_x, y) => y < 6.5), 0, 0, 9, 7, R, SH);
      for (const x of [2.5, 4.5, 6.5]) ln(B, 4.5, 6, x, 1.5, R, SHD, true);
    },
  },
  // ---------------------------------------------------------------- ice
  pine: {
    w: 13,
    h: 21,
    d: (B) => {
      C(B, 6.5, 20.5, 6.5, 16, 2, RP('#7a4f2e'), O1);
      const R = RP('#2f7a5a');
      for (const [y, w] of [
        [17, 6],
        [12, 4.8],
        [7, 3.4],
      ] as const) {
        P(B, [[6.5 - w, y], [6.5, y - 7], [6.5 + w, y]], R, O);
        P(B, [[6.5 - w * 0.6, y - 2.4], [6.5, y - 7], [6.5 + w * 0.6, y - 2.4]], RP('#eef8ff'), { bv: 1, onto: true });
      }
    },
  },
  icespike: {
    w: 9,
    h: 17,
    d: (B) => {
      const R = RP('#9EE6FF');
      P(B, [[1, 16.5], [3, 4], [4.5, 0.5], [6, 4], [8, 16.5]], R, SH);
      P(B, [[5.5, 16.5], [7.5, 9], [8.8, 16.5]], R, { ol: true, bv: 1, shine: true });
      ln(B, 4.2, 3, 3.2, 14, R, SHINE);
    },
  },
  snowman: {
    w: 10,
    h: 15,
    d: (B) => {
      const R = RP('#F7F4EE');
      E(B, 5, 11, 4.3, 3.8, R, O);
      E(B, 5, 5.6, 3.2, 3, R, O);
      Bx(B, 2.5, 0.5, 7.5, 3, RP('#2A2238'), 0, O1);
      raw(B, 4, 5, [42, 34, 56]);
      raw(B, 6, 5, [42, 34, 56]);
      raw(B, 7, 6, [232, 134, 46]);
    },
  },
  // ---------------------------------------------------------------- dreams, void, gods
  star: {
    w: 9,
    h: 9,
    d: (B, rnd) => {
      P(B, star(4.5, 4.7, 5, 4.3, 1.9), RP(rnd() < 0.5 ? '#F2C14E' : '#F7F4EE'), SH);
    },
  },
  moon: {
    w: 10,
    h: 10,
    d: (B) => {
      S(B, minus(ell(5, 5, 4.5, 4.5), ell(7.2, 3.6, 3.8, 3.8)), 0, 0, 10, 10, RP('#FFE27A'), SH);
    },
  },
  candy: {
    w: 9,
    h: 15,
    d: (B, rnd) => {
      C(B, 4.5, 14.5, 4.5, 8, 1.2, RP('#F7F4EE'), O1);
      const R = RP(pick(rnd, ['#FF6FA8', '#9C6BFF', '#2DD4BF']));
      E(B, 4.5, 4.5, 4, 4, R, SH);
      S(B, (x, y) => {
        const a = Math.atan2(y - 4.5, x - 4.5),
          d = Math.hypot(x - 4.5, y - 4.5);
        return d < 3.8 && Math.sin(a * 2 + d * 1.6) > 0.3;
      }, 0, 0, 9, 9, RP('#F7F4EE'), { bv: 0, tone: LIT, onto: true });
    },
  },
  shard: {
    w: 8,
    h: 15,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#9C6BFF', '#4FC3F7', '#FF6FA8']));
      P(B, [[4, 0.5], [7.5, 6], [5.5, 14.5], [2.5, 14.5], [0.5, 6]], R, SH);
      ln(B, 4, 1.5, 3, 13, R, SHINE);
    },
  },
  floatrock: {
    w: 15,
    h: 12,
    d: (B, rnd) => {
      const R = RP(pick(rnd, ['#5a4a7a', '#4a3a5e']));
      P(B, [[0.5, 3], [14.5, 2.5], [10, 9.5], [5, 9]], R, O);
      E(B, 7.5, 2.8, 7, 2, R, { ol: true, bv: 1, sh: 1 });
      for (const x of [4, 10]) raw(B, x, 11, [156, 107, 255], 180);
      raw(B, 7, 11.5, [156, 107, 255], 120);
    },
  },
  brazier: {
    w: 9,
    h: 13,
    d: (B) => {
      const R = RP('#d9a53a');
      C(B, 4.5, 12.5, 4.5, 7, 1.4, R, O1);
      Bx(B, 2, 11.5, 7, 12.8, R, 0, O1);
      S(B, and(ell(4.5, 5, 4.2, 3), (_x, y) => y > 4.8), 0, 0, 9, 9, R, SH);
      S(B, or(ell(4.5, 4.4, 2.6, 1.6), poly([[2, 4.6], [4.5, 0], [7, 4.6]])), 0, 0, 9, 6, RP('#E8862E'), { bv: 1, shine: true });
      raw(B, 4.5, 2.5, [255, 226, 122]);
    },
  },
};

/** A scenery piece drawn and outlined, ready to place (feet at the bottom middle), or null if unknown. */
export function drawDeco(name: string, rnd: () => number): { B: Buf; flat: boolean } | null {
  const D = DECO[name];
  if (!D) return null;
  const B = buf(D.w + 2, D.h + 2);
  // drawn one pixel in from every side, so the outline has room
  const inner = buf(D.w, D.h);
  D.d(inner, rnd);
  for (let y = 0; y < D.h; y++)
    for (let x = 0; x < D.w; x++) {
      const i = y * D.w + x,
        j = (y + 1) * B.w + x + 1;
      B.c[j] = inner.c[i]!;
      B.r[j] = inner.r[i]!;
      B.t[j] = inner.t[i]!;
      B.a[j] = inner.a[i]!;
    }
  if (!D.flat) outline(B);
  return { B, flat: !!D.flat };
}
void dot;
void W;
