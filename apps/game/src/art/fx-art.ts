// The fight's effect sprites, drawn with the sprites' engine (px.ts) at two pixels per art pixel: what flies
// (arrows, crossbow bolts, fireballs, ice shards, rocks, bombs, orbs), what lands (impact bursts, earth spikes,
// a falling anvil) and the small bits (sparkles, leaves, chain links, drops). Things that fly point right (+x);
// the scene turns them to face where they go.
//
// Pure: no DOM.

import { BASE, DEEP, LIT, SHD, SHINE, C, E, P, RP, S, and, buf, ell, fine, ln, minus, or, outline, poly, raw, toRGBA, type Buf, type Pt } from './px';

export interface FxRgba {
  w: number;
  h: number;
  d: Uint8ClampedArray;
}
const FS = 2;
const MET = { ol: true, bv: 2, shine: true } as const;
const MAT = { ol: true, bv: 2 } as const;

function done(B: Buf, ol = true): FxRgba {
  if (ol) outline(B);
  return { w: B.w, h: B.h, d: toRGBA(B) };
}

/** An n-pointed star's points. */
const star = (cx: number, cy: number, n: number, r1: number, r2: number, rot = -Math.PI / 2): Pt[] =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1,
      a = rot + (i * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });

const ART: Record<string, (hex?: string) => FxRgba> = {
  /** a wooden arrow with a steel head and red fletching */
  arrow() {
    const B = buf(26, 8, FS);
    C(B, 3, 4, 19, 4, 1.3, RP('#B07A45'), { bv: 1, ol: true });
    P(B, [[18, 1.2], [25, 4], [18, 6.8], [19.5, 4]], RP('#C9D2DC'), MET);
    for (const s of [-1, 1]) P(B, [[1, 4 + s * 3.2], [7, 4], [3.5, 4], [0.5, 4 + s * 1.2]], RP(s < 0 ? '#E5484D' : '#F4F1EA'), MAT);
    return done(B);
  },
  /** a short, heavy crossbow bolt with metal vanes */
  bolt() {
    const B = buf(20, 8, FS);
    C(B, 3, 4, 14, 4, 1.9, RP('#8A5A36'), { bv: 1, ol: true });
    P(B, [[13, 1], [19.5, 4], [13, 7], [14.5, 4]], RP('#B4BEC9'), MET);
    for (const s of [-1, 1]) P(B, [[1.5, 4 + s * 2.8], [6, 4], [2.5, 4]], RP('#7C8896'), MET);
    return done(B);
  },
  /** a fireball with its tail behind it: white core, yellow, orange, a red rim */
  fireball() {
    const B = buf(22, 14, FS);
    const tail = poly([[1, 7], [9, 2.2], [15, 3], [15, 11], [9, 11.8]]);
    S(B, or(ell(14.5, 7, 6, 6), tail), 0, 0, 22, 14, RP('#E8501F'), { bv: 2, ol: true });
    S(B, or(ell(15, 7, 4.4, 4.4), poly([[5, 7], [11, 4], [14, 4.5], [14, 9.5], [11, 10]])), 0, 0, 22, 14, RP('#FF9A2F'), { bv: 2, onto: true });
    E(B, 15.5, 7, 2.6, 2.6, RP('#FFE27A'), { bv: 1, shine: true, onto: true });
    E(B, 16, 6.5, 1.1, 1.1, RP('#FFFBE8'), { tone: BASE, onto: true });
    // flame tongues licking back
    for (const [x, y] of [[7, 3.5], [5, 9.5], [10, 12]] as const) E(B, x, y, 1.3, 0.9, RP('#FF9A2F'), { tone: LIT, onto: true });
    return done(B);
  },
  /** a long ice crystal with a lit facet */
  shard() {
    const B = buf(18, 8, FS);
    P(B, [[0.5, 4], [6, 1], [17.5, 4], [6, 7]], RP('#8FE7FF'), MET);
    ln(B, 2, 4, 16, 4, RP('#E8FBFF'), SHINE, true);
    P(B, [[6, 1.6], [12, 3.4], [6, 3.6]], RP('#E8FBFF'), { tone: LIT, onto: true });
    return done(B);
  },
  /** a boulder, cracked */
  rock() {
    const B = buf(14, 13, FS);
    P(B, [[1, 7], [3, 2.5], [8, 1], [12.5, 4], [13, 9], [9, 12], [3.5, 11.5]], RP('#8C7A6B'), { ol: true, bv: 3, cast: true });
    ln(B, 6, 4, 8, 7, RP('#8C7A6B'), DEEP, true);
    ln(B, 8, 7, 7, 10, RP('#8C7A6B'), DEEP, true);
    E(B, 4.5, 4.5, 1.2, 0.8, RP('#B8A898'), { tone: LIT, onto: true });
    return done(B);
  },
  /** a jagged spike of stone bursting out of the floor */
  spike() {
    const B = buf(10, 20, FS);
    P(B, [[0.5, 19.5], [3.5, 6], [5, 0.5], [6.5, 7], [9.5, 19.5]], RP('#8C7A6B'), { ol: true, bv: 2 });
    P(B, [[5, 2], [6.3, 8], [5.2, 18]], RP('#B8A898'), { tone: LIT, onto: true });
    ln(B, 3, 13, 5, 15, RP('#8C7A6B'), DEEP, true);
    return done(B);
  },
  /** a round black bomb with a lit fuse */
  bomb() {
    const B = buf(14, 15, FS);
    E(B, 6.5, 9, 5.2, 5.2, RP('#3A3448'), { ol: true, bv: 3, shine: true });
    C(B, 9.5, 4.5, 10.5, 3, 2.4, RP('#7C8896'), MET);
    ln(B, 11, 2.5, 12.5, 1, RP('#C9A25B'), BASE);
    E(B, 12.8, 1.2, 1.2, 1.2, RP('#FFE27A'), { tone: SHINE });
    return done(B);
  },
  /** an anvil, for absurd luck */
  anvil() {
    const B = buf(22, 14, FS);
    P(B, [[1, 3], [21, 3], [21, 6], [15, 7], [14, 10], [17, 13], [5, 13], [8, 10], [7, 7], [3, 6]], RP('#6E7886'), { ol: true, bv: 2, shine: true, cast: true });
    ln(B, 2, 3.5, 20, 3.5, RP('#B4BEC9'), SHINE, true);
    return done(B);
  },
  /** a glowing ball of `hex`: a soft halo, the ball, a white-hot core */
  orb(hex = '#B388FF') {
    const B = buf(14, 14, FS);
    E(B, 7, 7, 6.5, 6.5, RP(hex), { tone: LIT, al: 90 });
    E(B, 7, 7, 4.6, 4.6, RP(hex), { bv: 2, shine: true });
    E(B, 6.2, 6.2, 1.8, 1.8, RP('#FFFFFF'), { tone: BASE, onto: true });
    return done(B, false);
  },
  /** a drop of `hex` (water, poison), round end forward */
  drop(hex = '#3D8BFF') {
    const B = buf(12, 8, FS);
    S(B, or(ell(8, 4, 3.4, 3.4), poly([[0.5, 4], [7, 1], [7, 7]])), 0, 0, 12, 8, RP(hex), { ol: true, bv: 2, shine: true });
    fine(B, 8.5, 2.5, [255, 255, 255]);
    fine(B, 9, 2.5, [255, 255, 255]);
    return done(B);
  },
  /** the hit itself: a jagged star of `hex` around a white flash */
  burst(hex = '#FFD166') {
    const B = buf(24, 24, FS);
    P(B, star(12, 12, 8, 11.5, 5.2, -Math.PI / 2 + 0.2), RP(hex), { ol: true, bv: 2 });
    P(B, star(12, 12, 8, 7.5, 3.6, -Math.PI / 2 + 0.2), RP('#FFF3C4'), { tone: LIT, onto: true });
    E(B, 12, 12, 3, 3, RP('#FFFFFF'), { tone: BASE, onto: true });
    return done(B, false);
  },
  /** a four-pointed twinkle */
  twinkle(hex = '#FFF3B0') {
    const B = buf(9, 9, FS);
    P(B, star(4.5, 4.5, 4, 4.3, 1.2), RP(hex), { tone: LIT });
    E(B, 4.5, 4.5, 1.1, 1.1, RP('#FFFFFF'), { tone: BASE });
    return done(B, false);
  },
  /** a leaf */
  leaf(hex = '#5DAA4B') {
    const B = buf(9, 6, FS);
    S(B, and(ell(4.5, 0.2, 5, 5), ell(4.5, 5.8, 5, 5)), 0, 0, 9, 6, RP(hex), { ol: true, bv: 1 });
    ln(B, 1.5, 3, 7, 3, RP(hex), DEEP, true);
    return done(B);
  },
  /** one link of a chain */
  link() {
    const B = buf(8, 5, FS);
    S(B, minus(ell(4, 2.5, 3.6, 2.2), ell(4, 2.5, 2, 0.9)), 0, 0, 8, 5, RP('#7C8896'), MET);
    return done(B);
  },
  /** a puff of smoke or gas */
  puff(hex = '#C9C4D6') {
    const B = buf(14, 11, FS);
    const t = or(ell(5, 6.5, 4, 3.6), ell(9, 5.5, 4.2, 4.2), ell(7, 3.8, 3.4, 3));
    S(B, t, 0, 0, 14, 11, RP(hex), { bv: 4, al: 200 });
    return done(B, false);
  },
  /** a claw mark: three curved rips */
  claws(hex = '#FFFFFF') {
    const B = buf(18, 18, FS);
    for (const k of [-4.5, 0, 4.5]) C(B, 4 + k, 2, 13 + k, 16, 1.6, RP(hex), { tone: LIT }, 0.4);
    return done(B, false);
  },
  /** a crescent slash in `hex` (the blade's arc), opening up and right */
  slash(hex = '#FFFFFF') {
    const B = buf(30, 30, FS);
    S(B, minus(ell(15, 15, 13.5, 13.5), ell(10.5, 18.5, 12.5, 12.5)), 0, 0, 30, 30, RP(hex), { tone: LIT });
    S(B, minus(ell(15, 15, 12.6, 12.6), ell(10.5, 18.5, 12.9, 12.9)), 0, 0, 30, 30, RP('#FFFFFF'), { tone: BASE, onto: true });
    return done(B, false);
  },
};
void raw;

const cache = new Map<string, FxRgba>();
/** An effect sprite by name (and color, for the ones that take one), drawn once. */
export function fxArt(name: string, hex?: string): FxRgba | null {
  const key = name + '|' + (hex ?? '');
  let r = cache.get(key);
  if (!r) {
    const f = ART[name];
    if (!f) return null;
    cache.set(key, (r = f(hex)));
  }
  return r;
}
export const FX_NAMES = Object.keys(ART);
