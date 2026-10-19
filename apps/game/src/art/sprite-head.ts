// Heads: the skull shape of each race, a face with a mood, hair, race features (ears, horns, snouts, beaks...),
// class face gear (masks, patches, goggles) and every hat. Faces look right, three-quarter view.

import { BASE, DEEP, LIT, OLN, SHD, SHINE, Bx, C, E, P, RP, S, and, box, dot, dotOn, ell, fine, h2r, has, ln, minus, or, poly, raw, shade, forPx, shadeAt, rampId, type Buf, type RGB, type Ramp, type Test } from './px';
import { HIDES_HAIR, type Ctx, type Mood } from './sprite-data';

const WHITE: RGB = [250, 250, 246];
const BONE = () => RP('#EDE3CC');
const GOLD = () => RP('#E8B33A');

/** Is the hair hidden by headgear? */
export const hidesHair = (c: Ctx) => HIDES_HAIR.includes(c.out.hat) || !!c.out.lucha;

/**
 * The whole head at (cx, hc) with radius r: back hair and ears behind it, the skull, the face, the hair on top,
 * horns and ears above, face gear, then the hat.
 */
export function head(B: Buf, c: Ctx, cx: number, hc: number, r: number) {
  const { race, out, S: SK, HAIR } = c;
  const hairOn = !!race.hair && !hidesHair(c) && !out.bald && !race.cap && !race.gnomehat;
  const st = hairStyle(c);
  // behind the head
  if (hairOn && (st === 1 || st === 5)) backHair(B, c, cx, hc, r, st);
  if (race.ears === 'elf' || race.ears === 'goblin') backEar(B, c, cx, hc, r);
  if (race.horns === 'goat') C(B, cx - 3, hc - r + 4, cx - 9, hc - r - 3, 3.6, RP('#C9B38A'), { ol: true, bv: 2 }, 1.6);
  if (race.head === 'bull') P(B, [[cx - 5, hc - 4], [cx - 13, hc - 8], [cx - 17, hc - 16], [cx - 12, hc - 11], [cx - 4, hc - 9]], BONE(), { ol: true, bv: 2 });
  if (race.fins) P(B, [[cx - 1, hc + 1], [cx - 10, hc - 5], [cx - 11, hc + 3], [cx - 9, hc + 7], [cx - 2, hc + 6]], RP('#3FA79A'), { ol: true, bv: 2 });

  // the skull
  const shapeT = skull(B, c, cx, hc, r);

  face(B, c, cx, hc, r, shapeT);
  features(B, c, cx, hc, r);
  if (race.beard) beard(B, c, cx, hc, r);
  if (hairOn) topHair(B, c, cx, hc, r, st);
  if (race.laurel && !hidesHair(c)) for (let k = -4; k <= 4; k++) E(B, cx + k * 2.2, hc - r + 2.5 + Math.abs(k) * 0.55, 1.4, 1, RP(k % 2 ? '#5DAA4B' : '#3E7A3A'), { bv: 1 });
  topFeatures(B, c, cx, hc, r);
  faceGear(B, c, cx, hc, r);
  hat(B, c, cx, hc, r);
  void HAIR;
}

/** Hair style from the name hash; slim builds favor long hair. */
function hairStyle(c: Ctx) {
  // independent of the skin tone (hs % 6) and hair color (hs >> 3)
  let st = (c.hs >> 6) % 6;
  if (c.race.b === 'slim' && (st === 0 || st === 3)) st = 1;
  if (c.race.fangs) st = 6; // a vampire's slicked back hair with a widow's peak
  return st;
}

function backHair(B: Buf, c: Ctx, cx: number, hc: number, r: number, st: number) {
  if (st === 1) {
    Bx(B, cx - r - 1.5, hc - 6, cx - 3, hc + r + 6, c.HAIR, 4, { ol: true, bv: 3, shine: true });
  } else {
    C(B, cx - r + 1, hc - 4, cx - r - 6, hc + 9, 5.5, c.HAIR, { ol: true, bv: 3, shine: true }, 3);
    E(B, cx - r - 0.5, hc - 2, 2, 2, RP('#E5484D'), { ol: true, bv: 1 });
  }
}

function backEar(B: Buf, c: Ctx, cx: number, hc: number, r: number) {
  const SK = c.S;
  if (c.race.ears === 'elf') {
    P(B, [[cx - 1, hc + 1], [cx - r - 6, hc - 7], [cx - r - 3, hc - 2], [cx - 4, hc + 6]], SK, { ol: true, bv: 2 });
    ln(B, cx - 4, hc + 2, cx - r - 3, hc - 4, SK, SHD);
  } else {
    P(B, [[cx - 2, hc - 1], [cx - r - 9, hc - 4], [cx - r - 6, hc + 3], [cx - 3, hc + 6]], SK, { ol: true, bv: 2 });
    ln(B, cx - 5, hc + 2, cx - r - 6, hc - 1, SK, DEEP);
  }
}

/** Draws the skull; returns its shape (to clip things like masks to it). */
function skull(B: Buf, c: Ctx, cx: number, hc: number, r: number): Test {
  const { race, S: SK, L } = c;
  const o = { ol: true, bv: 5, cast: true } as const;
  switch (race.head) {
    case 'wolf': {
      E(B, cx - 1, hc, r, r * 0.92, SK, o);
      P(B, [[cx + 3, hc - 1], [cx + r + 6, hc + 2], [cx + r + 7, hc + 5], [cx + r + 4, hc + 7.5], [cx + 3, hc + 8]], SK, { ol: true, bv: 2 });
      E(B, cx + r + 5.5, hc + 2.5, 1.8, 1.5, RP('#2A2028'), { bv: 1, shine: true });
      ln(B, cx + 5, hc + 6, cx + r + 4, hc + 6, SK, OLN);
      raw(B, cx + r + 1, hc + 7, WHITE);
      for (const s of [-1, 1]) P(B, [[cx - r + 1, hc + 2 + s], [cx - r - 3, hc + 6 + s], [cx - r + 3, hc + 7 + s]], SK, { ol: true, bv: 1 });
      return ell(cx - 1, hc, r, r * 0.92);
    }
    case 'dragon': {
      E(B, cx - 1, hc, r * 0.95, r * 0.9, SK, o);
      P(B, [[cx + 2, hc - 2.5], [cx + r + 8, hc + 0.5], [cx + r + 8.5, hc + 4.5], [cx + 2, hc + 7]], SK, { ol: true, bv: 2 });
      dot(B, cx + r + 6, hc + 1.5, SK, OLN);
      ln(B, cx + 4, hc + 4.5, cx + r + 7, hc + 4.5, SK, OLN);
      for (let k = 0; k < 3; k++) raw(B, cx + 7 + k * 3, hc + 5.5, WHITE);
      for (let k = 0; k < 5; k++) dotOn(B, cx - 6 + ((k * 5) % 9), hc + 2 + ((k * 3) % 5), SK, SHD);
      return ell(cx - 1, hc, r * 0.95, r * 0.9);
    }
    case 'bull': {
      E(B, cx, hc, r + 1, r * 0.92, SK, o);
      E(B, cx + 6.5, hc + 5, 6.2, 4.4, RP('#C9A27A'), { ol: true, bv: 3 });
      dot(B, cx + 5, hc + 4, SK, OLN);
      dot(B, cx + 9, hc + 4, SK, OLN);
      for (const [x, y] of [[cx + 6, hc + 8], [cx + 7, hc + 9], [cx + 8, hc + 8]] as const) dot(B, x, y, GOLD(), LIT);
      E(B, cx - r + 1, hc - 1, 3, 2, SK, { ol: true, bv: 1 });
      return ell(cx, hc, r + 1, r * 0.92);
    }
    case 'frog': {
      E(B, cx + 1, hc + 2, r + 3, r - 1.5, SK, o);
      E(B, cx + 7.5, hc + 7, 5, 2.2, RP('#B9E08C'), { bv: 1, onto: true });
      return ell(cx + 1, hc + 2, r + 3, r - 1.5);
    }
    case 'raccoon': {
      for (const [x, y, rr] of [[cx - 6, hc - r + 3, 3.6], [cx + 3, hc - r + 1.5, 3.4]] as const) {
        E(B, x, y, rr, rr, SK, { ol: true, bv: 2 });
        E(B, x, y + 0.5, rr - 1.6, rr - 1.6, RP('#3A3440'), { bv: 1 });
      }
      E(B, cx, hc, r, r * 0.92, SK, o);
      const hd = ell(cx, hc, r, r * 0.92);
      S(B, and(hd, box(cx - 1.5, hc - 3, cx + r + 2, hc + 2.5, 2)), cx - 2, hc - 3, cx + r + 2, hc + 3, RP('#2A2A30'), { bv: 1 });
      E(B, cx + 6, hc - 4.5, 4.5, 1.4, RP('#E8E6E0'), { bv: 1, onto: true });
      E(B, cx + r - 1.5, hc + 4.5, 4, 2.8, RP('#E8E6E0'), { ol: true, bv: 2 });
      E(B, cx + r + 1.5, hc + 3.5, 1.4, 1.2, RP('#1A1A20'), { bv: 1, shine: true });
      return hd;
    }
    case 'shark': {
      E(B, cx, hc, r + 0.5, r * 0.92, SK, o);
      P(B, [[cx + 2, hc - 3.5], [cx + r + 7.5, hc + 2], [cx + r + 5, hc + 6], [cx + 3, hc + 8.5]], SK, { ol: true, bv: 2 });
      const jaw = and(or(ell(cx, hc, r + 0.5, r * 0.92), poly([[cx + 2, hc - 3.5], [cx + r + 7.5, hc + 2], [cx + r + 5, hc + 6], [cx + 3, hc + 8.5]])), (_x, y) => y > hc + 3.5);
      S(B, jaw, cx - r, hc + 3, cx + r + 8, hc + 9, RP('#E6ECF0'), { bv: 1, onto: true });
      for (let k = 0; k < 6; k++) raw(B, cx + 3 + k * 2, hc + 4 + (k % 2), k % 2 ? [60, 60, 72] : WHITE);
      for (let k = 0; k < 3; k++) ln(B, cx - 5 + k * 2, hc + 2, cx - 6 + k * 2, hc + 5, SK, DEEP);
      return ell(cx, hc, r + 0.5, r * 0.92);
    }
    case 'rat': {
      for (const [x, y, rr] of [[cx - 7, hc - r + 3, 4.4], [cx + 2, hc - r + 1, 4]] as const) {
        E(B, x, y, rr, rr, RP('#D9A0A8'), { ol: true, bv: 2 });
        E(B, x + 0.5, y + 0.5, rr - 2, rr - 2, RP('#F2C4CA'), { bv: 1 });
      }
      E(B, cx - 1, hc, r * 0.9, r * 0.85, SK, o);
      P(B, [[cx + 2, hc - 1.5], [cx + r + 6.5, hc + 3], [cx + 2, hc + 6.5]], SK, { ol: true, bv: 2 });
      E(B, cx + r + 5.5, hc + 3, 1.5, 1.4, RP('#F08CA0'), { bv: 1, shine: true });
      raw(B, cx + r + 2, hc + 5.5, WHITE);
      raw(B, cx + r + 3, hc + 5.5, WHITE);
      return ell(cx - 1, hc, r * 0.9, r * 0.85);
    }
    case 'yeti': {
      E(B, cx, hc, r + 1, r, SK, o);
      for (let k = 0; k < 4; k++) P(B, [[cx - 6 + k * 4, hc - r + 3], [cx - 5 + k * 4, hc - r - 3 + (k % 2)], [cx - 2 + k * 4, hc - r + 3]], SK, { ol: true, bv: 1 });
      E(B, cx + 4.5, hc + 2.5, 6.5, 6.2, RP('#7FA8D9'), { ol: true, bv: 3 });
      return ell(cx, hc, r + 1, r);
    }
  }
  if (race.robot) {
    Bx(B, cx - r + 1, hc - r + 1, cx + r, hc + r - 1, SK, 3.5, { ol: true, bv: 3, shine: true, cast: true });
    Bx(B, cx - 0.5, hc - 3.5, cx + r + 0.5, hc + 2, RP('#1A2230'), 1.5, { ol: true, bv: 1 });
    ln(B, cx + 1, hc - 1, cx + r - 1, hc - 1, RP('#5AE6FF'), LIT);
    ln(B, cx + 1, hc, cx + r - 1, hc, RP('#2AA6CF'), BASE);
    for (let k = 0; k < 3; k++) ln(B, cx + 3 + k * 2, hc + 5, cx + 3 + k * 2, hc + 7, SK, DEEP);
    for (const [x, y] of [[cx - r + 3, hc - r + 3], [cx - r + 3, hc + r - 3]] as const) dot(B, x, y, SK, SHINE);
    C(B, cx + 1.5, hc - r + 1, cx + 1.5, hc - r - 4, 1.4, RP('#5A6572'), { ol: true, bv: 1 });
    E(B, cx + 1.5, hc - r - 5.5, 1.8, 1.8, RP('#E5484D'), { ol: true, bv: 1, shine: true });
    return box(cx - r + 1, hc - r + 1, cx + r, hc + r - 1, 3.5);
  }
  if (race.golem) {
    const glow = L.rsub === 'Diamond' ? '#E0FFFF' : L.rsub === 'Flesh' ? '#FF6B6B' : '#FFB627';
    Bx(B, cx - r + 1.5, hc - r + 2, cx + r - 0.5, hc + r - 0.5, SK, 2.5, { ol: true, bv: 3, cast: true, shine: L.rsub === 'Diamond' || L.rsub === 'Iron' });
    Bx(B, cx - 1, hc - 4.5, cx + r - 0.5, hc - 2.5, SK, 0, { tone: DEEP });
    for (const x of [cx + 2, cx + 7]) {
      raw(B, x, hc - 1, h2r(glow));
      raw(B, x + 1, hc - 1, h2r(glow));
    }
    ln(B, cx - 6, hc - 6, cx - 3, hc + 1, SK, DEEP, true);
    ln(B, cx - 3, hc + 1, cx - 5, hc + 5, SK, DEEP, true);
    return box(cx - r + 1.5, hc - r + 2, cx + r - 0.5, hc + r - 0.5, 2.5);
  }
  E(B, cx, hc, r, r * 0.96, SK, o);
  return ell(cx, hc, r, r * 0.96);
}

/** Eyes (2x3 with a glint), brows and mouth by mood. */
function face(B: Buf, c: Ctx, cx: number, hc: number, r: number, hd: Test) {
  const { race, out, S: SK, L } = c;
  const h = race.head;
  const ex = Math.round(cx + 1.5),
    ey = Math.round(hc + 1);
  const eyeHex = race.eye || (race.head === 'wolf' ? '#FFD54F' : race.stars ? '#7FE3FF' : '#2A1E36');
  const EYE = RP(eyeHex);
  const iris = (x: number, y: number, R: Ramp, glint = true) => {
    if (B.s >= 2) {
      // at two pixels per art pixel: a rounded eye under a lid line, a pupil, a one-pixel glint, a lit rim below
      const q = 1 / B.s;
      const lid = race.eye || h === 'wolf' ? DEEP : OLN;
      const X = x,
        Y = y - 1;
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 6; j++) {
          const px = X + i * q,
            py = Y + j * q;
          const edge = i === 0 || i === 3;
          if ((j === 0 || j === 5) && edge) continue;
          let t: number = j <= 1 ? lid : j === 5 ? (race.eye ? LIT : SHD) : BASE;
          if (!race.eye && j >= 2 && j <= 4 && !edge) t = OLN;
          if (race.eye && j >= 3 && j <= 4 && !edge) t = DEEP;
          fine(B, px, py, R, t);
        }
      if (glint) fine(B, X + q, Y + 2 * q, WHITE);
      if (glint) fine(B, X + 2 * q, Y + 4 * q, R, race.eye ? SHINE : LIT);
      return;
    }
    dot(B, x, y - 1, R, race.eye || h === 'wolf' ? DEEP : OLN);
    dot(B, x + 1, y - 1, R, race.eye || h === 'wolf' ? DEEP : OLN);
    if (glint) raw(B, x, y, WHITE);
    else dot(B, x, y, R, BASE);
    dot(B, x + 1, y, R, BASE);
    dot(B, x, y + 1, R, race.eye ? BASE : SHD);
    dot(B, x + 1, y + 1, R, race.eye ? LIT : SHD);
  };
  const mood: Mood = out.mood;
  // the eyes
  if (race.skull) {
    for (const x of [ex, ex + 5]) {
      Bx(B, x - 0.5, ey - 1.5, x + 2.2, ey + 1.8, RP('#2A2230'), 1, { tone: OLN });
      raw(B, x + 1, ey, L.rsub === 'Lich bones' ? [166, 255, 143] : [255, 90, 90]);
    }
    dot(B, cx + 7, ey + 3, RP('#2A2230'), OLN);
    for (let k = 0; k < 5; k++) dot(B, cx + 3 + k, hc + 6.5, k % 2 ? SK : RP('#2A2230'), k % 2 ? LIT : OLN);
    ln(B, cx + 2, hc + 5.5, cx + 8, hc + 5.5, SK, SHD);
    return;
  }
  if (race.robot || race.golem || race.mummy && false) return;
  if (race.bugeyes) {
    E(B, cx + 5.5, hc, 3.8, 4.4, RP(race.bee ? '#2A2230' : '#C0392B'), { ol: true, bv: 2, shine: true });
    for (const [x, y] of [[cx + 4, hc - 1], [cx + 6, hc + 1], [cx + 5, hc + 3]] as const) dotOn(B, x, y, RP(race.bee ? '#2A2230' : '#C0392B'), LIT);
    if (!race.bee) {
      ln(B, cx + 6, hc + 6, cx + 8, hc + 8, SK, OLN);
      ln(B, cx + 9, hc + 6, cx + 8, hc + 8, SK, OLN);
    } else ln(B, cx + 6, hc + 7, cx + 8, hc + 7, SK, OLN);
    return;
  }
  if (h === 'frog') {
    for (const x of [cx - 2, cx + 7]) {
      E(B, x, hc - r + 3, 4, 4, SK, { ol: true, bv: 2 });
      E(B, x + 0.5, hc - r + 3, 2.6, 2.6, RP('#F4F1EA'), { bv: 1 });
      dot(B, x + 1, hc - r + 3, EYE, OLN);
      dot(B, x + 1, hc - r + 4, EYE, OLN);
      raw(B, x, hc - r + 2, WHITE);
    }
    ln(B, cx - 1, hc + 5, cx + 4, hc + 6, SK, OLN);
    ln(B, cx + 4, hc + 6, cx + r + 2, hc + 4, SK, OLN);
    dot(B, cx + 9, hc + 2, RP('#FF8A8A'), BASE);
    return;
  }
  const dead = race.zombie;
  if (race.mummy) {
    iris(ex, ey, RP('#2A1E36'));
    iris(ex + 5, ey, RP('#2A1E36'));
  } else if (h === 'raccoon') {
    for (const x of [ex, ex + 5]) {
      raw(B, x, ey, WHITE);
      raw(B, x + 1, ey, [30, 26, 40]);
      raw(B, x + 1, ey - 1, [30, 26, 40]);
    }
  } else if (out.lucha) {
    // the mask draws its own eye holes
  } else {
    iris(ex, ey, EYE);
    if (out.patch) {
      // the patch covers the far eye
    } else if (dead) {
      dot(B, ex + 5, ey, RP('#DDE6C8'), LIT);
      dot(B, ex + 6, ey, RP('#DDE6C8'), LIT);
      dot(B, ex + 5, ey + 1, SK, SHD);
    } else iris(ex + 5, ey, EYE);
  }
  // brows
  const BR = race.hair && !hidesHair(c) && !out.bald ? c.HAIR : SK;
  const bt = BR === SK ? OLN : DEEP;
  const by = ey - 3;
  // brows: one fine pixel thick on a fine layer (the lower half of each art pixel)
  const brow = (x: number, ys: [number, number, number]) =>
    ys.forEach((dy, i) => {
      if (B.s < 2) return dotOn(B, x - 1 + i, by + dy, BR, bt);
      if (!has(B, x - 1 + i, by + dy)) return;
      for (let k = 0; k < B.s; k++) fine(B, x - 1 + i + k / B.s, by + dy + (B.s - 1) / B.s, BR, bt);
    });
  if (!out.lucha && h !== 'raccoon') {
    const near: [number, number, number] =
      mood === 'angry' ? [-1, 0, 1] : mood === 'worried' ? [1, 0, -1] : mood === 'stern' ? [0, 0, 0] : mood === 'sly' ? [0, 0, 0] : [-1, -1, -1];
    const far: [number, number, number] =
      mood === 'angry' ? [1, 0, -1] : mood === 'worried' ? [-1, 0, 1] : mood === 'stern' ? [0, 0, 0] : mood === 'sly' ? [-2, -2, -1] : [-1, -1, -1];
    brow(ex + 1, near);
    if (!out.patch) brow(ex + 6, far);
    if (race.brow) {
      ln(B, ex - 1, by - 1, ex + 7, by - 1, SK, DEEP, true);
      ln(B, ex - 1, by, ex + 7, by, SK, OLN, true);
    }
  }
  // the mouth (masks cover it)
  if (out.mask || race.beak || out.lucha) return;
  const mx = Math.round(cx + 4),
    my = Math.round(hc + 6);
  const M = (x: number, y: number) => dot(B, x, y, SK, OLN);
  // a mouth line through art pixels: one fine pixel thin on a fine layer, the same pixels as M on a 1x one
  const ml = (...pts: [number, number][]) => {
    if (pts.length === 1) return M(...pts[0]!);
    for (let k = 1; k < pts.length; k++) ln(B, pts[k - 1]![0], pts[k - 1]![1], pts[k]![0], pts[k]![1], SK, OLN);
  };
  const T = (x: number, y: number) => raw(B, x, y, WHITE);
  if (race.clown) {
    for (let k = -1; k <= 4; k++) dot(B, mx + k, my + (k === -1 || k === 4 ? -1 : 0), RP('#D62F45'), BASE);
    for (let k = 0; k <= 3; k++) dot(B, mx + k, my + 1, RP('#D62F45'), SHD);
    return;
  }
  switch (mood) {
    case 'angry':
      M(mx - 1, my + 1);
      M(mx, my);
      M(mx + 1, my);
      M(mx + 2, my);
      M(mx + 3, my + 1);
      T(mx, my + 1);
      T(mx + 1, my + 1);
      T(mx + 2, my + 1);
      break;
    case 'grin':
      M(mx - 1, my - 1);
      for (let k = 0; k <= 3; k++) M(mx + k, my + 1);
      M(mx + 4, my - 1);
      for (let k = 0; k <= 3; k++) T(mx + k, my);
      break;
    case 'happy':
      ml([mx - 1, my - 1], [mx, my], [mx + 2, my], [mx + 3, my - 1]);
      break;
    case 'sly':
      ml([mx, my], [mx + 2, my], [mx + 3, my - 1]);
      break;
    case 'worried':
      ml([mx, my + 1], [mx + 1, my], [mx + 2, my + 1]);
      break;
    case 'stern':
      ml([mx, my], [mx + 2, my]);
      break;
    default:
      ml([mx + 1, my], [mx + 2, my]);
  }
  // a nose shadow and cheeks
  if (!h) dotOn(B, cx + 7, ey + 3, SK, SHD);
  if ((mood === 'happy' || mood === 'grin') && !h && !race.stars) {
    dotOn(B, ex - 1, ey + 2, RP('#FF8A8A'), BASE);
    dotOn(B, ex + 7, ey + 2, RP('#FF8A8A'), BASE);
  }
  void hd;
}

/** Face features that belong to the race. */
function features(B: Buf, c: Ctx, cx: number, hc: number, r: number) {
  const { race, S: SK, L } = c;
  if (race.head === 'wolf') {
    for (const [x0, x1, x2] of [[-7, -5, -1], [-1, 3, 6]] as const) {
      P(B, [[cx + x0, hc - r + 5], [cx + x1, hc - r - 6], [cx + x2, hc - r + 4]], SK, { ol: true, bv: 2 });
      ln(B, cx + x1, hc - r - 3, cx + x1, hc - r + 2, SK, DEEP);
    }
  }
  if (race.head === 'dragon' && !race.noHorns) {
    C(B, cx - 3, hc - r + 3, cx - 12, hc - r - 5, 3.4, BONE(), { ol: true, bv: 2 }, 1.2);
    C(B, cx + 1, hc - r + 2, cx - 5, hc - r - 8, 3, BONE(), { ol: true, bv: 2 }, 1.1);
  }
  if (race.head === 'dragon' && race.noHorns) for (let k = 0; k < 3; k++) P(B, [[cx - 8 + k * 3, hc - r + 3 + k], [cx - 10 + k * 3, hc - r - 2 + k], [cx - 6 + k * 3, hc - r + 2 + k]], RP('#E5484D'), { ol: true, bv: 1 });
  if (race.head === 'bull') P(B, [[cx + 5, hc - 7], [cx + 13, hc - 10], [cx + 17, hc - 18], [cx + 16, hc - 9], [cx + 8, hc - 4]], BONE(), { ol: true, bv: 2 });
  if (race.head === 'shark') P(B, [[cx - 5, hc - r + 3], [cx - 4, hc - r - 8], [cx + 3, hc - r + 2]], c.S, { ol: true, bv: 2 });
  if (race.head === 'rat' || race.whiskers) {
    const wx = race.head === 'rat' ? cx + r + 3 : cx + r - 1;
    const wy = race.head === 'rat' ? hc + 4 : hc + 4;
    for (const d of [-2, 1]) ln(B, wx, wy, wx + 6, wy + d, RP('#F0EBE1'), LIT);
  }
  if (race.stars) for (const [x, y] of [[cx - 5, hc - 4], [cx - 2, hc + 5], [cx + 2, hc - 7], [cx - 7, hc + 2], [cx + 8, hc + 8]] as const) raw(B, x, y, [255, 255, 255]);
  if (race.beak) {
    P(B, [[cx + r - 2.5, hc - 0.5], [cx + r + 6, hc + 2.5], [cx + r - 2.5, hc + 5.5]], RP('#E8A93A'), { ol: true, bv: 2, shine: true });
    ln(B, cx + r - 1, hc + 2.5, cx + r + 4, hc + 2.5, RP('#E8A93A'), DEEP);
  }
  if (race.nose) {
    P(B, [[cx + r - 3, hc - 0.5], [cx + r + 6, hc + 3.5], [cx + r - 2.5, hc + 5]], SK, { ol: true, bv: 2 });
  }
  if (race.clown) {
    E(B, cx + r - 0.5, hc + 3, 2.5, 2.5, RP('#E5484D'), { ol: true, bv: 2, shine: true });
    for (const [x, y] of [[cx + 2, hc - 2], [cx + 2, hc + 3], [cx + 7, hc - 2], [cx + 7, hc + 3]] as const) raw(B, x, y, [70, 130, 230]);
  }
  if (race.mummy) {
    for (let y = Math.round(hc - r + 2); y < hc + r - 1; y += 3) ln(B, cx - r + 1, y, cx + r - 1, y + 1, SK, SHD, true);
    ln(B, cx - r + 2, hc + 3, cx + r - 2, hc - 3, SK, DEEP, true);
  }
  if (race.treant) {
    for (let k = 0; k < 3; k++) ln(B, cx - 6 + k * 3, hc + 3, cx - 7 + k * 3, hc + 9, SK, DEEP, true);
    const leaves = ['#3E7A3A', '#5DAA4B', '#7CC05E', '#3E7A3A', '#5DAA4B', '#2F6B33', '#7CC05E'];
    if (L.rsub === 'Venus flytrap') {
      P(B, [[cx - 8, hc - r + 4], [cx - 2, hc - r - 8], [cx + 4, hc - r + 3]], RP('#5DAA4B'), { ol: true, bv: 2 });
      P(B, [[cx + 1, hc - r + 3], [cx + 9, hc - r - 6], [cx + 11, hc - r + 5]], RP('#C0392B'), { ol: true, bv: 2 });
    } else leaves.forEach((h, k) => E(B, cx - 9 + k * 3, hc - r + 1 + (k % 2 ? -2 : 1), 4, 3.2, RP(h), { ol: true, bv: 2 }));
  }
  if (race.ogre) {
    for (const x of [cx + 3, cx + 8]) {
      dot(B, x, hc + 5, RP('#F4EEDC'), LIT);
      dot(B, x, hc + 4, RP('#F4EEDC'), LIT);
    }
  }
  if (race.tusks && !race.ogre) {
    for (const x of [cx + 3, cx + 8]) {
      dot(B, x, hc + 6, RP('#F4EEDC'), BASE);
      dot(B, x, hc + 5, RP('#F4EEDC'), LIT);
      dot(B, x, hc + 4, RP('#F4EEDC'), SHINE);
    }
  }
  if (race.fangs) {
    raw(B, cx + 5, hc + 7, WHITE);
    raw(B, cx + 7, hc + 7, WHITE);
  }
  if (race.zombie) {
    ln(B, cx - 5, hc - 6, cx + 1, hc - 2, RP('#3C1E28'), BASE, true);
    for (let k = 0; k < 3; k++) {
      dotOn(B, cx - 4 + k * 2, hc - 6 + k * 1.4, RP('#3C1E28'), BASE);
      dotOn(B, cx - 3 + k * 2, hc - 3 + k * 1.4, RP('#3C1E28'), BASE);
    }
  }
  if (race.cyborg) {
    Bx(B, cx + 4.5, hc - 5, cx + r + 0.5, hc + 3.5, RP('#8A97A6'), 1.5, { ol: true, bv: 2, shine: true });
    raw(B, cx + 7, hc + 1, [255, 60, 60]);
    raw(B, cx + 8, hc + 1, [255, 160, 160]);
    raw(B, cx + 7, hc, [200, 30, 40]);
    dot(B, cx + 10, hc - 3, RP('#8A97A6'), SHINE);
  }
  if (race.fur && race.head !== 'wolf' && race.head !== 'yeti') for (let k = 0; k < 4; k++) dotOn(B, cx - 7 + k * 2, hc - r + 5 + (k % 2), SK, SHD);
}

function beard(B: Buf, c: Ctx, cx: number, hc: number, r: number) {
  const H = c.HAIR;
  const long = c.race.b === 'stocky' || c.race.gnomehat;
  P(B, [[cx - 4, hc + 1.5], [cx + r + 0.5, hc + 1.5], [cx + r, hc + 8], [cx + 8, hc + r + (long ? 12 : 6)], [cx + 3, hc + r + (long ? 15 : 8)], [cx - 1, hc + r + (long ? 9 : 4)], [cx - 5, hc + 6]], H, { ol: true, bv: 3, shine: true, cast: true });
  for (let k = 0; k < 3; k++) ln(B, cx + 1 + k * 3, hc + 8, cx + 2 + k * 3, hc + r + (long ? 8 : 4), H, SHD, true);
  // the mustache over it
  P(B, [[cx + 2, hc + 4], [cx + 10, hc + 4], [cx + 11, hc + 7], [cx + 6, hc + 5.5], [cx + 1, hc + 7]], H, { ol: true, bv: 1 });
}

/** Hair on top: a cap following the skull, with bangs or spikes by style. */
function topHair(B: Buf, c: Ctx, cx: number, hc: number, r: number, st: number) {
  const H = c.HAIR;
  const o = { ol: true, bv: 3, shine: true, cast: true } as const;
  const cap = ell(cx - 0.3, hc - 0.6, r + 0.9, r * 0.96 + 0.9);
  const line = (x: number) => hc - 2.5 - (x - cx) * 0.42;
  if (st === 6) {
    // slicked back, widow's peak
    const t = and(cap, (x, y) => y < hc - 3.5 - (x - cx) * 0.25 + (Math.abs(x - (cx + 5)) < 1.6 ? 2 : 0));
    S(B, t, cx - r - 1, hc - r - 1, cx + r + 1, hc + 3, H, o);
    return;
  }
  if (st === 4) {
    const t = and(ell(cx - 0.5, hc - 0.2, r + 1.4, r * 0.96 + 1.2), (x, y) => y < (x < cx - 1 ? hc + 5 : line(x) - 0.5));
    S(B, t, cx - r - 2, hc - r - 2, cx + r + 2, hc + r, H, o);
    strands(B, H, cx, hc, r);
    P(B, [[cx + 1, hc - r + 1], [cx + r + 1, hc - 6], [cx + r + 1.5, hc - 1], [cx + 6, hc - 4]], H, o);
    return;
  }
  S(B, and(cap, (x, y) => y < line(x)), cx - r - 1, hc - r - 1, cx + r + 1, hc + 4, H, o);
  strands(B, H, cx, hc, r);
  if (st === 2) {
    for (let k = 0; k < 5; k++) {
      const a = Math.PI * (1.05 + k * 0.2);
      const bx = cx + Math.cos(a) * (r - 1),
        byy = hc + Math.sin(a) * (r - 1);
      const tx = cx + Math.cos(a - 0.3) * (r + 4.5),
        ty = hc + Math.sin(a - 0.3) * (r + 4.5);
      P(B, [[bx - 3, byy + 1.5], [tx, ty], [bx + 3, byy + 1.5]], H, o);
    }
  } else if (st === 3) {
    P(B, [[cx - 3, hc - r + 3], [cx + 1, hc - r - 4], [cx + 8, hc - r - 4], [cx + 11, hc - r], [cx + 6, hc - r + 3]], H, o);
  } else {
    // bangs over the forehead
    P(B, [[cx + 1, line(cx + 1) - 1], [cx + 5, line(cx + 5) - 1], [cx + 3, line(cx + 3) + 3]], H, o);
    P(B, [[cx + 5, line(cx + 5) - 1], [cx + 10, line(cx + 10) - 1], [cx + 8.5, line(cx + 8.5) + 2.5]], H, o);
  }
}

/** A few strands sweeping from the crown, so hair reads as hair and not a helmet. */
function strands(B: Buf, H: Ramp, cx: number, hc: number, r: number) {
  for (const [a, b] of [[-6, -1], [-2, 3], [2, 7]] as const) ln(B, cx + a, hc - r + 2, cx + b - 3, hc - r + 7, H, SHD, true);
  ln(B, cx - 4, hc - r + 1, cx + 1, hc - r + 1, H, LIT, true);
}

/** Things on top of the head that belong to the race: horns, animal ears, antennae, halos. */
function topFeatures(B: Buf, c: Ctx, cx: number, hc: number, r: number) {
  const { race, S: SK, L } = c;
  if ((race.ears === 'cat' || race.ears === 'fox') && !hidesHair(c)) {
    const fox = race.ears === 'fox';
    const R = fox ? RP('#E8862E') : SK;
    for (const [a, b, d] of [[-8, -6, -1], [0, 4, 7]] as const) {
      P(B, [[cx + a, hc - r + 5], [cx + b, hc - r - (fox ? 8 : 5)], [cx + d, hc - r + 3]], R, { ol: true, bv: 2 });
      ln(B, cx + b, hc - r - (fox ? 5 : 2), cx + (a + d) / 2, hc - r + 3, fox ? RP('#FFF1DC') : RP('#F0A0AA'), BASE);
      if (fox) dot(B, cx + b, hc - r - 8, RP('#FFF1DC'), LIT);
    }
  }
  if (race.horns === 'demon') {
    C(B, cx - 3, hc - r + 4, cx - 8, hc - r - 5, 3.4, RP('#3A2A2C'), { ol: true, bv: 2, shine: true }, 1);
    C(B, cx + 4, hc - r + 3, cx + 7, hc - r - 7, 3.4, RP('#3A2A2C'), { ol: true, bv: 2, shine: true }, 1);
  }
  if (race.horns === 'goat') {
    C(B, cx + 2, hc - r + 3, cx + 7, hc - r - 2, 3.4, RP('#C9B38A'), { ol: true, bv: 2 }, 2.2);
    C(B, cx + 7, hc - r - 2, cx + 8, hc - r + 4, 2.2, RP('#C9B38A'), { ol: true, bv: 1 }, 1.2);
  }
  if (race.antennae) {
    for (const [x0, x1, y1] of [[cx + 1, cx + 3, hc - r - 7], [cx + 5, cx + 10, hc - r - 6]] as const) {
      ln(B, x0, hc - r + 1, x1, y1, SK, OLN);
      E(B, x1, y1, 1.6, 1.6, race.bee ? RP('#2A2230') : SK, { ol: true, bv: 1, shine: true });
    }
  }
  if (race.halo) {
    const ring = (x: number, y: number) => {
      const d = ((x - cx) / 7.5) ** 2 + ((y - (hc - r - 4)) / 2.4) ** 2;
      return d <= 1 && d >= 0.32;
    };
    S(B, ring, cx - 8, hc - r - 7, cx + 8, hc - r - 1, RP('#F2C94C'), { bv: 1, shine: true, ol: true, al: 235 });
  }
  if (race.cap) {
    const red = RP(L.rsub === 'Toadstool' ? '#8E5BD6' : '#D64545');
    S(B, and(ell(cx, hc - 2, r + 6, r - 1), (_x, y) => y < hc - 1), cx - r - 6, hc - r - 3, cx + r + 6, hc, red, { ol: true, bv: 4, shine: true, cast: true });
    for (const [x, y, rr] of [[cx - 8, hc - 5, 2], [cx + 1, hc - 9, 2.6], [cx + 9, hc - 4, 1.8], [cx - 2, hc - 3.5, 1.4]] as const) E(B, x, y, rr, rr * 0.8, RP('#FFF6EA'), { bv: 1, onto: true });
  }
  if (race.gnomehat) {
    P(B, [[cx - r - 1.5, hc - 2], [cx + r + 1.5, hc - 3], [cx + 1, hc - r - 8], [cx - 7, hc - r - 16], [cx - 4, hc - r - 6]], RP('#D64545'), { ol: true, bv: 3, cast: true });
    Bx(B, cx - r - 1.5, hc - 4.5, cx + r + 1.5, hc - 1.5, RP('#B8302F'), 1.5, { ol: true, bv: 1 });
  }
}

/** Class gear on the face: masks, patches, goggles, headsets, war paint. */
function faceGear(B: Buf, c: Ctx, cx: number, hc: number, r: number) {
  const { out, O1, O2 } = c;
  if (out.mask) {
    const m = and(ell(cx, hc, r + 0.4, r + 0.2), (x, y) => y > hc + 3.5 - (x - cx) * 0.05 && x > cx - 4);
    S(B, m, cx - 4, hc + 2, cx + r + 1, hc + r + 1, out.top === 'leather' && out.c2 !== '#3A3A4A' ? O2 : RP('#22222C'), { ol: true, bv: 2 });
  }
  if (out.patch) {
    Bx(B, cx + 5.5, hc - 1, cx + 9, hc + 2.5, RP('#1A1A20'), 1, { ol: true, bv: 1 });
    ln(B, cx - r + 1, hc - 5, cx + 6, hc - 1, RP('#2A2A30'), BASE);
  }
  if (out.goggles) {
    Bx(B, cx - r + 0.5, hc - 6.5, cx + r + 0.5, hc - 4.5, RP('#5A4632'), 0.5, { bv: 1, onto: true });
    for (const x of [cx + 3, cx + 8]) {
      E(B, x, hc - 6, 2.6, 2.6, RP('#B87333'), { ol: true, bv: 1 });
      E(B, x, hc - 6, 1.6, 1.6, RP('#7FE3FF'), { bv: 1, shine: true });
    }
  }
  if (out.lucha) {
    const hd = ell(cx, hc, r + 0.6, r * 0.96 + 0.6);
    const mouth = ell(cx + 6, hc + 7, 4.5, 3);
    S(B, minus(hd, mouth), cx - r - 1, hc - r - 1, cx + r + 1, hc + r + 1, O1, { ol: true, bv: 4, cast: true });
    for (const x of [cx + 1.5, cx + 6.5]) {
      E(B, x + 1, hc + 1, 2.6, 2.2, RP(out.c2), { ol: true, bv: 1 });
      raw(B, x + 1, hc + 1, WHITE);
      raw(B, x + 2, hc + 1, [20, 20, 30]);
    }
    for (let y = Math.round(hc - r); y < hc - 2; y++) dotOn(B, cx - 1, y, RP(out.c2), BASE);
    ln(B, cx + 4, hc + 6, cx + 8, hc + 6, c.S, OLN);
  }
  if (out.headset) {
    S(B, (x, y) => {
      const d = ((x - cx) / (r + 1.4)) ** 2 + ((y - hc) / (r + 1.2)) ** 2;
      return d <= 1 && d >= 0.8 && y < hc;
    }, cx - r - 2, hc - r - 2, cx + r + 2, hc, RP('#2B2B33'), { bv: 1 });
    E(B, cx - 3.5, hc + 2, 2.4, 3, RP('#2B2B33'), { ol: true, bv: 2, shine: true });
    ln(B, cx - 2, hc + 4, cx + 5, hc + 7, RP('#2B2B33'), BASE);
    raw(B, cx + 5, hc + 7, [229, 72, 77]);
  }
  if (out.paint) {
    ln(B, cx + 1, hc + 3, cx + 9, hc + 3, RP('#C62F35'), BASE, true);
    ln(B, cx + 1, hc + 4, cx + 9, hc + 4, RP('#C62F35'), SHD, true);
  }
  void O2;
}

/** Class headgear. */
export function hat(B: Buf, c: Ctx, cx: number, hc: number, r: number, creature = false) {
  const { out } = c;
  const H = RP(out.hatC || '#555555');
  const t = hc - r;
  const o = { ol: true, bv: 3, cast: true } as const;
  switch (out.hat) {
    case 'wizard': {
      P(B, [[cx - r + 1.5, t + 5.5], [cx + r - 1.5, t + 5.5], [cx + 2, t - 7], [cx - 5, t - 15], [cx - 3, t - 5]], H, o);
      Bx(B, cx - r + 2, t + 2, cx + r - 2, t + 4.5, RP(out.c2), 0, { bv: 1, onto: true });
      E(B, cx, t + 5.5, r + 6, 2.8, H, { ol: true, bv: 2 });
      for (const [x, y] of [[cx - 3, t - 3], [cx + 2, t - 1], [cx - 5, t - 9]] as const) raw(B, x, y, [255, 226, 120]);
      break;
    }
    case 'hood': {
      if (creature) break;
      const outer = ell(cx - 0.5, hc - 0.5, r + 2.2, r + 2.5);
      const hole = ell(cx + 4.2, hc + 2, r - 2.4, r - 2.2);
      S(B, or(minus(outer, hole), poly([[cx - r - 2.5, hc + 2], [cx + 1, hc + 7], [cx + 3, hc + r + 5], [cx - r - 3, hc + r + 6]])), cx - r - 4, hc - r - 4, cx + r + 4, hc + r + 7, H, { ol: true, bv: 3 });
      // the hood's shadow on the face
      forPx(B, Math.round(cx - r), Math.round(hc - r), cx + r + 2, hc + r, (i, x, y) => {
        if (hole(x, y) && B.r[i] === rampId(c.S) && (!hole(x, y - 2) || !hole(x - 2, y))) shadeAt(B, i, 1);
      });
      break;
    }
    case 'helm': {
      Bx(B, cx - r - 1, hc - r - 1.5, cx + r + 1.5, hc + r - 0.5, H, 4.5, { ol: true, bv: 3, shine: true, cast: true });
      Bx(B, cx + 1, hc - 1.5, cx + r + 1.5, hc + 0.5, RP('#14111C'), 0, { tone: OLN });
      ln(B, cx + 1, hc - 2.5, cx + r, hc - 2.5, H, SHINE, true);
      ln(B, cx - 2, hc - r, cx - 2, hc + r - 2, H, SHD, true);
      for (const y of [hc + 3, hc + 5]) for (const x of [cx + 5, cx + 7, cx + 9]) dotOn(B, x, y, H, OLN);
      for (const [x, y] of [[cx - r + 1, hc - 2], [cx - r + 1, hc + 4]] as const) dotOn(B, x, y, H, SHINE);
      break;
    }
    case 'horned': {
      C(B, cx - r + 2, hc - 6, cx - r - 4, hc - 14, 3.6, BONE(), { ol: true, bv: 2 }, 1.3);
      C(B, cx + r - 2, hc - 7, cx + r + 3, hc - 15, 3.6, BONE(), { ol: true, bv: 2 }, 1.3);
      S(B, and(ell(cx, hc - 1, r + 1.2, r + 0.6), (_x, y) => y < hc - 2), cx - r - 2, hc - r - 2, cx + r + 2, hc - 2, H, { ...o, shine: true });
      Bx(B, cx - r - 1, hc - 4.5, cx + r + 1.2, hc - 1.5, RP('#5A6572'), 1, { ol: true, bv: 1 });
      for (let x = Math.round(cx - r + 1); x < cx + r; x += 3) dotOn(B, x, hc - 3, H, SHINE);
      Bx(B, cx + 4, hc - 2, cx + 5.8, hc + 3.5, H, 0.5, { ol: true, bv: 1, shine: true });
      break;
    }
    case 'jester': {
      const g = RP('#2ECC71');
      P(B, [[cx - r + 1, t + 5], [cx - r - 8, t - 4], [cx - r - 8, t + 1], [cx - 1, t + 2]], H, { ol: true, bv: 2 });
      P(B, [[cx - 1, t + 2], [cx + r + 7, t - 6], [cx + r + 5, t], [cx + r - 1, t + 5]], g, { ol: true, bv: 2 });
      for (const [x, y] of [[cx - r - 8, t - 3], [cx + r + 7, t - 5]] as const) E(B, x, y, 1.9, 1.9, RP('#F2B544'), { ol: true, bv: 1, shine: true });
      Bx(B, cx - r, t + 2, cx + r, t + 5.5, H, 1.5, { ol: true, bv: 1 });
      for (let x = Math.round(cx - r + 2); x < cx + r; x += 4) dotOn(B, x, t + 4, g, BASE);
      break;
    }
    case 'circlet': {
      S(B, and(ell(cx, hc, r + 0.6, r + 0.6), box(cx - r - 1, hc - 6, cx + r + 1, hc - 4.5)), cx - r - 1, hc - 6, cx + r + 1, hc - 4, GOLD(), { bv: 1, shine: true });
      E(B, cx + 5, hc - 5.5, 1.6, 1.6, RP('#E5484D'), { ol: true, bv: 1, shine: true });
      break;
    }
    case 'band': {
      P(B, [[cx - r + 1, hc - 5], [cx - r - 7, hc - 1], [cx - r - 6, hc - 4], [cx - r - 9, hc - 7]], H, { ol: true, bv: 1 });
      S(B, and(ell(cx, hc, r + 0.6, r + 0.6), box(cx - r - 1, hc - 7, cx + r + 1, hc - 4)), cx - r - 1, hc - 7, cx + r + 1, hc - 3.5, H, { ol: true, bv: 1 });
      break;
    }
    case 'ranger': {
      Bx(B, cx - r + 2, t - 3, cx + r - 1, t + 5.5, H, 4, o);
      Bx(B, cx - r + 2, t + 2, cx + r - 1, t + 4, RP(out.feather ? '#F2B544' : '#B3262B'), 0, { bv: 1, onto: true });
      E(B, cx + 1, t + 5.5, r + 5, 2.4, H, { ol: true, bv: 2 });
      if (out.feather) C(B, cx - 4, t + 2, cx - 13, t - 9, 3, RP('#F4F1EA'), { ol: true, bv: 1 }, 1);
      break;
    }
    case 'wide': {
      Bx(B, cx - r + 2.5, t - 4, cx + r - 2.5, t + 5.5, H, 3, o);
      dotOn(B, cx, t - 3, H, DEEP);
      dotOn(B, cx + 1, t - 3, H, DEEP);
      Bx(B, cx - r + 2.5, t + 2, cx + r - 2.5, t + 4, RP('#2A1E1A'), 0, { bv: 1, onto: true });
      S(B, (x, y) => ((x - cx) / (r + 8.5)) ** 2 + ((y - (t + 5.5 - Math.abs(x - cx) * 0.12)) / 2.6) ** 2 <= 1, cx - r - 9, t, cx + r + 9, t + 8.5, H, { ol: true, bv: 2 });
      break;
    }
    case 'tricorn': {
      P(B, [[cx - r - 5, t + 6], [cx - 3, t - 5], [cx + 4, t - 4], [cx + r + 5, t + 6], [cx + 1, t + 3.5]], H, o);
      ln(B, cx - r - 4, t + 6, cx + 1, t + 4, RP('#C9A25B'), LIT);
      ln(B, cx + 1, t + 4, cx + r + 4, t + 6, RP('#C9A25B'), BASE);
      raw(B, cx, t, WHITE);
      raw(B, cx + 1, t, WHITE);
      raw(B, cx, t + 1, [40, 30, 40]);
      break;
    }
    case 'antlers': {
      const A = RP('#8D6E46');
      for (const s of [-1, 1]) {
        const bx = cx + s * 3;
        C(B, bx, t + 3, bx + s * 5, t - 7, 2.2, A, { ol: true, bv: 1 }, 1.4);
        C(B, bx + s * 2.5, t - 2, bx + s * 8, t - 4, 1.8, A, { ol: true, bv: 1 }, 1);
        C(B, bx + s * 4, t - 4.5, bx + s * 3, t - 10, 1.6, A, { ol: true, bv: 1 }, 1);
      }
      for (let k = 0; k < 7; k++) E(B, cx - 9 + k * 3, t + 3 + (k % 2), 2.4, 1.8, RP(k % 2 ? '#5DAA4B' : '#3E7A3A'), { ol: true, bv: 1 });
      break;
    }
    case 'toque': {
      Bx(B, cx - r + 2, t - 1, cx + r - 2, t + 5.5, H, 1.5, o);
      for (const [x, y, rx] of [[cx - 5, t - 3, 5], [cx + 1, t - 6, 6], [cx + 6, t - 3, 4.8]] as const) E(B, x, y, rx, rx * 0.9, H, { ol: true, bv: 3 });
      for (let x = Math.round(cx - r + 4); x < cx + r - 3; x += 3) dotOn(B, x, t + 2, H, SHD);
      break;
    }
    case 'cap': {
      S(B, and(ell(cx - 0.5, hc - 1.5, r + 1, r + 0.2), (_x, y) => y < hc - 3), cx - r - 2, hc - r - 2, cx + r + 2, hc - 3, H, { ...o, shine: true });
      P(B, [[cx + r - 4, hc - 6], [cx + r + 8, hc - 4], [cx + r + 7, hc - 2], [cx + r - 4, hc - 3]], H, { ol: true, bv: 1 });
      E(B, cx + 2, hc - r + 3, 1.8, 1.8, RP('#9B5CFF'), { bv: 1, shine: true, onto: true });
      break;
    }
    case 'visor': {
      S(B, and(ell(cx, hc, r + 0.6, r + 0.6), box(cx - r - 1, hc - 7, cx + r + 1, hc - 5)), cx - r - 1, hc - 7, cx + r + 1, hc - 4.5, RP('#2A2A30'), { bv: 1 });
      P(B, [[cx - 1, hc - 7], [cx + r + 7, hc - 6], [cx + r + 5, hc - 3], [cx - 1, hc - 4.5]], H, { ol: true, bv: 1, al: 225 });
      break;
    }
    case 'kabuto': {
      P(B, [[cx - r - 3, hc - 3], [cx - 1, hc - 3], [cx - 1, hc + 5], [cx - r - 6, hc + 7]], H, { ol: true, bv: 2 });
      for (const y of [hc, hc + 3]) ln(B, cx - r - 3, y, cx - 2, y - 0.5, H, LIT, true);
      S(B, and(ell(cx, hc - 1.5, r + 1.6, r + 0.9), (_x, y) => y < hc - 1.5), cx - r - 2, hc - r - 3, cx + r + 2, hc - 1, H, { ...o, shine: true });
      Bx(B, cx - r - 1, hc - 3.5, cx + r + 1.5, hc - 1.5, RP('#A3242E'), 0.5, { ol: true, bv: 1 });
      C(B, cx + 3, t + 1, cx - 3, t - 9, 2.6, GOLD(), { ol: true, bv: 1, shine: true }, 1.1);
      C(B, cx + 4, t + 1, cx + 11, t - 8, 2.6, GOLD(), { ol: true, bv: 1, shine: true }, 1.1);
      E(B, cx + 3.5, t + 1.5, 1.8, 1.8, GOLD(), { ol: true, bv: 1, shine: true });
      break;
    }
  }
}
