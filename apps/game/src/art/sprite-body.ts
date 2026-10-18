// Humanoid bodies: wings, tails and capes behind, the far arm, legs and boots, the torso in each class's outfit,
// then the head, and last the near arm on its own layer (it swings) with the weapon in its hand.

import { BASE, DEEP, LIT, OLN, SHD, SHINE, Bx, C, E, P, RP, S, and, box, dot, dotOn, ell, ln, minus, or, poly, raw, shade, type Buf, type Ramp, type Test } from './px';
import { head } from './sprite-head';
import { BUILDS, GROUND, own, SUBCOL, type Ctx } from './sprite-data';

/** Where the near arm hangs: shoulder pivot, hand, and a function that draws it (after the weapon). */
export interface ArmSpec {
  sx: number;
  sy: number;
  hx: number;
  hy: number;
  draw: () => void;
}

const SKIN_LIKE = (top: string) => top === 'bare' || top === 'tank';

export function humanoid(B: Buf, A: Buf, c: Ctx): ArmSpec {
  const { race, out, S: SK, O1, O2, L, hs } = c;
  const K = BUILDS[race.b || 'normal'];
  const cx = 34.5,
    G = GROUND;
  const tl = cx - K.tw / 2,
    tr = cx + K.tw / 2,
    sy = K.sy,
    hy = K.hy;
  const big = race.b === 'big' || race.b === 'stocky';

  const pants = RP(
    out.top === 'plate' ? out.c : out.top === 'gi' ? out.c : out.top === 'tank' ? '#2E3A5C' : out.top === 'leather' ? (out.c === '#1E1E28' ? '#1E1E28' : '#2A2632') : out.top === 'vest' ? '#5A4632' : out.top === 'coat' ? '#3A2E2A' : out.c2,
  );
  const boots = RP(
    out.top === 'plate' ? out.c : out.hat === 'toque' ? '#2A2A30' : out.mask && out.c === '#1E1E28' ? '#16161E' : out.lucha ? out.c : out.top === 'robe' ? '#3A2E26' : '#5A3E2B',
  );

  // ---- behind everything: cape, wings, tail
  const capeHex = out.cape || race.cape;
  if (capeHex) {
    const CP = RP(capeHex);
    P(B, [[tl + 2, sy + 1], [tr - 1, sy + 1], [tr + 2, G - 5], [cx + 3, G - 3], [tl - 3, G - 2], [tl - 7, G - 5]], CP, { ol: true, bv: 3 });
    for (const k of [0, 1]) ln(B, tl - 1 + k * 5, sy + 10, tl - 4 + k * 5, G - 6, CP, SHD, true);
  }
  wings(B, c, cx, sy, tl);
  tail(B, c, tl, hy, hs);
  if (race.fin) P(B, [[tl + 2, sy + 4], [tl - 8, sy + 1], [tl - 3, sy + 9], [tl + 1, sy + 14]], SK, { ol: true, bv: 2 });

  // ---- the far arm (and the tank's shield on it)
  const sleeveR: Ramp = SKIN_LIKE(out.top) ? SK : race.cyborg ? RP('#8A97A6') : O1;
  const bx0 = tl + 2.5,
    by0 = sy + 3.5,
    bhx = tl - 1.5,
    bhy = sy + 17;
  C(B, bx0, by0, bhx, bhy, K.aw, sleeveR, { ol: true, bv: 3, sh: -1 }, out.top === 'robe' ? K.aw + 2.5 : K.aw);
  E(B, bhx, bhy + 2, K.aw * 0.58, K.aw * 0.58, out.top === 'plate' ? O1 : SK, { ol: true, bv: 2, sh: -1 });
  if (out.shield) {
    const SHI = RP('#7C8896');
    P(B, [[tl - 10, sy + 5], [tl + 5, sy + 5], [tl + 5, sy + 18], [tl - 2.5, sy + 27], [tl - 10, sy + 18]], SHI, { ol: true, bv: 3, shine: true });
    P(B, [[tl - 7, sy + 8], [tl + 2, sy + 8], [tl + 2, sy + 17], [tl - 2.5, sy + 23], [tl - 7, sy + 17]], RP('#2F5BB7'), { bv: 2 });
    for (const [x, y] of [[tl - 2.5, sy + 11], [tl - 2.5, sy + 15]] as const) E(B, x, y, 1.6, 1.6, RP('#E8B33A'), { bv: 1, shine: true });
  }

  // ---- legs
  if (race.tailLegs) {
    const T = SK;
    P(B, [[tl + 2, hy - 3], [tr - 2, hy - 3], [cx + 5, G - 10], [cx + 2, G - 6], [cx - 4, G - 10]], T, { ol: true, bv: 3 });
    for (let y = hy; y < G - 9; y += 3) for (let x = Math.round(tl + 3 + ((y / 3) % 2)); x < tr - 2; x += 3) dotOn(B, x, y, T, SHD);
    P(B, [[cx - 1, G - 9], [cx + 13, G - 3], [cx + 11, G + 0.5], [cx + 1, G - 4], [cx - 9, G + 0.5], [cx - 12, G - 3]], RP('#3FA79A'), { ol: true, bv: 2 });
  } else if (out.top !== 'robe') {
    const lw = K.lw,
      gap = big ? 1 : 0.5;
    const hoof = race.head === 'bull' || race.hooves;
    for (const back of [true, false]) {
      const lx = back ? cx - gap - lw : cx + gap;
      const legR = race.boney ? SK : race.hooves ? RP('#7A5A3A') : out.top === 'motley' ? (back ? O1 : O2) : pants;
      const lwid = race.boney ? lw - 2.5 : lw;
      const lx2 = race.boney ? lx + 1.2 : lx;
      Bx(B, lx2, hy - 2, lx2 + lwid, G - 4.5, legR, 2, { ol: true, bv: 2, sh: back ? -1 : 0 });
      if (out.top === 'plate') {
        Bx(B, lx + 0.5, hy + 6, lx + lw - 0.5, hy + 10, RP(out.c2), 1, { ol: true, bv: 1, shine: true, sh: back ? -1 : 0 });
      }
      if (race.talons) {
        const T = RP('#E8A93A');
        for (const d of [-1, 2, 5]) ln(B, lx + 2, G - 4, lx + d + 1, G - 1, T, BASE);
      } else if (hoof) Bx(B, lx, G - 5.5, lx + lw + 0.5, G, RP('#2E2420'), 1.5, { ol: true, bv: 2, shine: true, sh: back ? -1 : 0 });
      else if (out.top === 'gi') {
        Bx(B, lx, G - 4, lx + lw + 2, G, SK, 1.5, { ol: true, bv: 2, sh: back ? -1 : 0 });
        ln(B, lx + 1, G - 2, lx + lw, G - 3, RP('#7A3E14'), BASE);
      } else {
        Bx(B, lx - 0.5, G - 6.5, lx + lw + 2.5, G, boots, 2, { ol: true, bv: 2, sh: back ? -1 : 0, shine: out.top === 'plate' });
        ln(B, lx, G - 1, lx + lw + 1, G - 1, boots, DEEP, true);
        if (out.top !== 'plate') ln(B, lx, G - 6, lx + lw, G - 6, boots, LIT, true);
      }
    }
  }

  // ---- the torso
  const T: Test = poly([[tl + 2, sy], [tr - 2, sy], [tr, sy + 3], [tr - 1, hy - 7], [tr - 0.5, hy + 1], [tl + 0.5, hy + 1], [tl + 1, hy - 7], [tl, sy + 3]]);
  const tb = [tl - 1, sy - 1, tr + 1, hy + 2] as const;
  const torsoO = { ol: true, bv: 4, cast: true } as const;
  const belt = (R: Ramp, y = hy - 4) => {
    S(B, and(T, box(tl - 1, y, tr + 1, y + 2.5)), tl - 1, y, tr + 1, y + 3, R, { bv: 1, ol: true });
    Bx(B, cx + 1, y - 0.5, cx + 4.5, y + 3, RP('#E8B33A'), 0.5, { ol: true, bv: 1, shine: true });
  };
  switch (out.top) {
    case 'robe': {
      const R = poly([[tl + 1.5, sy], [tr - 1.5, sy], [tr + 1, sy + 4], [tr + 4.5, G - 2], [tl - 4.5, G - 2], [tl - 1, sy + 4]]);
      S(B, R, tl - 5, sy, tr + 5, G - 1, O1, torsoO);
      S(B, and(R, box(tl - 6, G - 5.5, tr + 6, G - 2)), tl - 6, G - 6, tr + 6, G - 1, O2, { bv: 1 });
      S(B, and(R, box(cx + 1, sy + 2, cx + 3, G - 2)), cx, sy, cx + 4, G - 1, O2, { bv: 1 });
      belt(O2, hy - 6);
      P(B, [[cx - 4, sy - 0.5], [cx + 6, sy - 0.5], [cx + 1.5, sy + 6]], RP(out.c2), { ol: true, bv: 1 });
      for (let k = 0; k < 3; k++) ln(B, tl + 1 + k * 2, hy, tl - 2 + k * 2, G - 6, O1, SHD, true);
      if (out.stars) for (const [x, y] of [[tl + 3, sy + 10], [tr - 3, sy + 16], [cx - 4, G - 13], [cx + 7, G - 9], [tl, G - 9]] as const) raw(B, x, y, [255, 230, 140]);
      if (out.skullBelt) {
        E(B, cx + 3, hy - 4.5, 2.4, 2.2, RP('#EDE6D6'), { ol: true, bv: 1 });
        dot(B, cx + 2, hy - 5, RP('#2A2230'), OLN);
        dot(B, cx + 4, hy - 5, RP('#2A2230'), OLN);
      }
      // the boot toes peek out under the hem
      Bx(B, cx + 2, G - 3, cx + 9, G, boots, 1.5, { ol: true, bv: 1 });
      break;
    }
    case 'tank':
    case 'bare': {
      S(B, T, ...tb, SK, torsoO);
      // pecs and abs
      ln(B, tl + 3, sy + 8, cx - 1, sy + 9, SK, SHD, true);
      ln(B, cx + 2, sy + 9, tr - 3, sy + 8, SK, SHD, true);
      for (let y = sy + 12; y < hy - 5; y += 3) {
        dotOn(B, cx - 1, y, SK, SHD);
        dotOn(B, cx + 3, y, SK, SHD);
      }
      if (out.top === 'tank') {
        const top = minus(and(T, (x, y) => y > sy + 1 && x > tl + 3 && x < tr - 3), ell(cx + 1.5, sy, 5.5, 4.5));
        S(B, or(top, and(T, box(tl, sy + 7, tr, hy))), ...tb, O1, { ol: true, bv: 3 });
        belt(RP('#2A2A30'));
      } else {
        if (race.fur || race.head === 'bull') for (let k = 0; k < 4; k++) P(B, [[cx - 3 + k * 2, sy + 4], [cx - 2 + k * 2, sy + 9], [cx - 1 + k * 2, sy + 4]], SK, { bv: 1, sh: 1, onto: true });
        if (race.boney) for (let y = sy + 4; y < hy - 5; y += 3) ln(B, tl + 3, y, tr - 3, y, RP('#6E6458'), BASE, true);
        belt(out.lucha ? RP(out.c2) : RP('#5A3E2B'));
        if (out.paint) {
          ln(B, tl + 3, sy + 5, tl + 8, sy + 11, RP('#C62F35'), BASE, true);
          ln(B, tl + 4, sy + 5, tl + 9, sy + 11, RP('#C62F35'), SHD, true);
        }
      }
      break;
    }
    case 'plate': {
      S(B, T, ...tb, O1, { ...torsoO, shine: true });
      ln(B, cx + 1, sy + 3, cx + 1, hy - 6, O1, SHINE, true);
      ln(B, cx + 2, sy + 3, cx + 2, hy - 6, O1, SHD, true);
      ln(B, tl + 2, sy + 12, tr - 2, sy + 12, O1, DEEP, true);
      if (out.tabard) {
        Bx(B, cx - 4.5, sy + 6, cx + 6, hy + 8, RP(out.tabard), 1, { ol: true, bv: 2 });
        if (out.cross) {
          Bx(B, cx, sy + 9, cx + 2, sy + 19, RP('#E8B33A'), 0, { bv: 1, shine: true });
          Bx(B, cx - 2.5, sy + 11.5, cx + 4.5, sy + 13.5, RP('#E8B33A'), 0, { bv: 1, shine: true });
        }
      }
      belt(O2);
      for (let k = 0; k < 2; k++) Bx(B, tl + 1 + k * (K.tw / 2), hy - 1, tl + K.tw / 2 - 0.5 + k * (K.tw / 2), hy + 4, O1, 1, { ol: true, bv: 1, shine: true });
      break;
    }
    case 'leather': {
      S(B, T, ...tb, O1, torsoO);
      P(B, [[cx - 4, sy - 0.5], [cx + 6, sy - 0.5], [cx + 1, sy + 5]], O1, { bv: 1, sh: -1 });
      C(B, tr - 2, sy + 2, tl + 3, hy - 5, 2.4, O2, { bv: 1, ol: true }, 2.4);
      for (const t of [0.3, 0.6]) dot(B, tr - 2 + (tl + 3 - (tr - 2)) * t, sy + 2 + (hy - 7 - sy) * t, RP('#C9D1DA'), SHINE);
      belt(RP('#2A2230'));
      break;
    }
    case 'coat': {
      const coat = poly([[tl + 1.5, sy], [tr - 1.5, sy], [tr, sy + 3], [tr + 1, hy + 11], [tl - 2, hy + 12], [tl, sy + 3]]);
      S(B, coat, tl - 3, sy - 1, tr + 2, hy + 13, O1, torsoO);
      S(B, and(coat, box(cx - 1, sy, cx + 5, hy + 12)), cx - 2, sy, cx + 6, hy + 13, RP('#2A2A30'), { bv: 1, ol: true });
      P(B, [[cx - 2, sy - 0.5], [cx + 1, sy + 9], [cx - 1, sy + 13]], O2, { ol: true, bv: 1 });
      P(B, [[cx + 6, sy - 0.5], [cx + 4, sy + 9], [cx + 6.5, sy + 13]], O2, { ol: true, bv: 1 });
      for (const y of [sy + 15, sy + 19]) dot(B, cx + 6, y, RP('#E8B33A'), SHINE);
      if (out.belts) {
        C(B, tl + 2, sy + 3, tr - 2, hy - 4, 2.2, RP('#5A3E2B'), { bv: 1, ol: true });
        for (const t of [0.25, 0.5, 0.75]) dot(B, tl + 2 + (tr - tl - 4) * t, sy + 3 + (hy - 7 - sy) * t, RP('#E8B33A'), LIT);
      }
      belt(RP('#2A1E1A'));
      break;
    }
    case 'vest': {
      S(B, T, ...tb, RP('#E8E2DA'), torsoO);
      const left = and(T, (x, y) => x < cx - 0.5 + (y - sy) * 0.08),
        right = and(T, (x, y) => x > cx + 4 - (y - sy) * 0.08);
      S(B, or(left, right), ...tb, O1, { bv: 3, ol: true });
      for (const y of [sy + 8, sy + 13, sy + 18]) dot(B, cx + 4, y, O2, LIT);
      if (out.furTrim) {
        C(B, tl + 1, sy + 1, cx - 1, sy + 1, 4, RP('#D7C4A3'), { ol: true, bv: 2 });
        C(B, cx + 5, sy + 1, tr - 1, sy + 1, 4, RP('#D7C4A3'), { ol: true, bv: 2 });
      }
      belt(RP('#3A2A22'));
      break;
    }
    case 'gi': {
      S(B, T, ...tb, O1, torsoO);
      P(B, [[cx - 3.5, sy - 0.5], [cx + 5.5, sy - 0.5], [cx + 1, sy + 10]], SK, { bv: 2, ol: true });
      ln(B, cx - 3, sy, cx + 2, sy + 11, O1, LIT, true);
      ln(B, cx + 2, sy + 11, tr - 2, hy - 4, O1, SHD, true);
      S(B, and(T, box(tl - 1, hy - 5, tr + 1, hy - 2.5)), tl - 1, hy - 5, tr + 1, hy - 2, O2, { bv: 1, ol: true });
      C(B, cx + 3, hy - 3, cx + 2, hy + 5, 2, O2, { ol: true, bv: 1 });
      C(B, cx + 4, hy - 3, cx + 6, hy + 4, 2, O2, { ol: true, bv: 1 });
      break;
    }
    case 'motley': {
      S(B, T, ...tb, O1, torsoO);
      S(B, and(T, (x) => x > cx + 0.5), ...tb, O2, { bv: 4 });
      for (const [x, y] of [[cx - 4, sy + 9], [cx + 5, sy + 15], [cx - 4, sy + 19]] as const)
        P(B, [[x, y - 2.5], [x + 2, y], [x, y + 2.5], [x - 2, y]], RP('#F2B544'), { bv: 1, onto: true });
      for (let k = 0; k < 6; k++) E(B, tl + 3 + k * ((K.tw - 6) / 5), sy + 0.5, 1.8, 1.6, RP(k % 2 ? '#F4F1EA' : '#F2B544'), { ol: true, bv: 1 });
      belt(RP('#2A2230'));
      break;
    }
    default: {
      // tunic
      const tun = poly([[tl + 2, sy], [tr - 2, sy], [tr, sy + 3], [tr - 1, hy - 7], [tr + 0.5, hy + 4], [tl - 0.5, hy + 4], [tl + 1, hy - 7], [tl, sy + 3]]);
      S(B, tun, tl - 1, sy - 1, tr + 1, hy + 5, O1, torsoO);
      S(B, and(tun, box(tl - 2, hy + 1.5, tr + 2, hy + 4)), tl - 2, hy + 1, tr + 2, hy + 5, O1, { bv: 1, sh: -1 });
      P(B, [[cx - 3, sy - 0.5], [cx + 5, sy - 0.5], [cx + 1, sy + 4]], O1, { bv: 1, sh: -2 });
      belt(O2);
      if (out.glow) {
        E(B, cx + 1, sy + 9, 3.2, 3.2, RP('#F2B544'), { ol: true, bv: 2, shine: true });
        raw(B, cx + 1, sy + 9, [255, 255, 255]);
      }
      if (out.hat === 'toque') {
        for (const y of [sy + 6, sy + 11, sy + 16]) for (const x of [cx - 2, cx + 4]) dot(B, x, y, O2, SHD);
        C(B, tl + 2, sy + 2, tr - 2, sy + 2, 3, RP('#E5484D'), { bv: 1 });
      }
    }
  }
  if (out.apron) {
    Bx(B, cx - 5.5, sy + 5, cx + 7, hy + 9, RP('#E8E2DA'), 1.5, { ol: true, bv: 2 });
    Bx(B, cx - 2, hy - 2, cx + 4, hy + 3, RP('#E8E2DA'), 1, { ol: true, bv: 1, sh: -1 });
    for (const [x, y, col] of [[cx - 3, sy + 10, '#7FD957'], [cx + 4, sy + 14, '#B388FF']] as const) dot(B, x, y, RP(col), BASE);
  }
  // race marks on the torso
  if (race.bee) for (let y = sy + 5; y < hy; y += 5) S(B, and(T, box(tl - 1, y, tr + 1, y + 2)), tl - 1, y, tr + 1, y + 2, RP('#2A2230'), { bv: 1, onto: true });
  if (race.mummy) for (let y = sy + 2; y < hy; y += 3) ln(B, tl, y, tr, y + 1, SK, SHD, true);
  if (race.treant) for (const [x, y] of [[tl + 3, sy + 6], [tr - 4, sy + 12], [cx, sy + 17]] as const) ln(B, x, y, x + 1, y + 5, SK, DEEP, true);
  if (race.chitin) for (let y = sy + 5; y < hy - 2; y += 4) ln(B, tl + 2, y, tr - 2, y, SK, DEEP, true);
  if (race.scales && SKIN_LIKE(out.top)) for (let k = 0; k < 8; k++) dotOn(B, tl + 3 + ((k * 7) % (K.tw - 4)), sy + 4 + ((k * 5) % (hy - sy - 8)), SK, SHD);
  if (race.robot) {
    Bx(B, cx - 3, sy + 5, cx + 5, sy + 12, RP('#3A4450'), 1, { ol: true, bv: 1 });
    raw(B, cx - 1, sy + 8, [90, 230, 255]);
    raw(B, cx + 2, sy + 8, [255, 90, 90]);
    raw(B, cx + 2, sy + 10, [255, 214, 79]);
  }
  if (out.beads) for (let k = 0; k < 7; k++) E(B, cx - 4.5 + k * 1.7, sy + 2.5 + Math.abs(3 - k) * -0.6 + 3, 0.9, 0.9, RP('#7A3E14'), { bv: 1, shine: true });
  if (out.bandage) {
    C(B, tl + 1, sy + 6, tr - 1, sy + 13, 2.6, RP('#F0EBDD'), { bv: 1, onto: true });
    dot(B, cx + 2, sy + 9, RP('#C62F35'), BASE);
  }
  if (out.pelt) {
    P(B, [[tl - 2, sy - 1], [tr + 2, sy - 1], [tr + 1, sy + 5], [cx, sy + 8], [tl - 1, sy + 5]], RP('#8D6E63'), { ol: true, bv: 2, cast: true });
    for (let k = 0; k < 5; k++) dotOn(B, tl + k * (K.tw / 4), sy + 3 + (k % 2), RP('#8D6E63'), LIT);
  }
  // shoulders on top of the torso
  if (out.top === 'plate') {
    E(B, tl + 1.5, sy + 2, 4.5, 3.8, O1, { ol: true, bv: 3, shine: true, cast: true });
    if (out.hat === 'kabuto') for (const y of [sy + 1, sy + 3]) ln(B, tl - 2, y, tl + 5, y, RP(out.c2), BASE, true);
  }

  // ---- the head
  const neckR = SK;
  Bx(B, cx - 2.5, K.hc + K.hr * 0.55, cx + 3.5, sy + 2, neckR, 1.5, { bv: 1, ol: true });
  head(B, c, cx, K.hc, K.hr);

  // ---- the near arm, on its own layer
  const shx = tr - 2.5,
    shy = sy + 3.5,
    hx = tr + 4,
    hy2 = sy + 17.5;
  return {
    sx: shx,
    sy: shy,
    hx,
    hy: hy2,
    draw: () => {
      const robe = out.top === 'robe';
      C(A, shx, shy, hx, hy2 - 1, K.aw, sleeveR, { ol: true, bv: 3 }, robe ? K.aw + 3 : K.aw);
      if (!SKIN_LIKE(out.top) && !race.cyborg) {
        const cuff = out.top === 'plate' ? RP(out.c2) : robe ? RP(out.c2) : O1;
        C(A, hx - 1.6, hy2 - 4.2, hx - 0.6, hy2 - 2, robe ? K.aw + 3 : K.aw, cuff, { bv: 1, sh: robe ? 0 : -1 });
      }
      if (out.top === 'plate') E(A, shx, shy - 0.5, 4.5, 3.8, O1, { ol: true, bv: 3, shine: true });
      if (out.pelt) E(A, shx, shy - 1, 4.5, 3.5, RP('#8D6E63'), { ol: true, bv: 2 });
      const handR = out.top === 'plate' ? O1 : out.wraps ? RP('#F4F1EA') : race.cyborg ? RP('#8A97A6') : race.robot ? SK : SK;
      E(A, hx, hy2 + 0.5, K.aw * 0.6, K.aw * 0.6, handR, { ol: true, bv: 2, shine: out.top === 'plate' || !!race.cyborg });
      if (out.wraps) ln(A, hx - 2, hy2 - 0.5, hx + 2, hy2 + 1.5, RP('#C9C2B4'), BASE, true);
      if (race.cyborg) for (const y of [shy + 5, shy + 9]) ln(A, shx - 1, y, shx + 3, y + 1, RP('#8A97A6'), DEEP, true);
      if (race.mummy) for (let k = 0; k < 4; k++) ln(A, shx - 3, shy + 2 + k * 3, shx + 3, shy + 4 + k * 3, SK, SHD, true);
    },
  };
}

function wings(B: Buf, c: Ctx, cx: number, sy: number, tl: number) {
  const { race, L } = c;
  if (race.wings === 'feather') {
    const W = RP(L.rsub === 'Fallen' ? '#4A4458' : race.talons ? '#B98B5E' : '#F4F1EA');
    P(B, [[cx - 1, sy + 3], [cx - 9, sy - 9], [cx - 20, sy - 14], [cx - 28, sy - 8], [cx - 27, sy + 2], [cx - 20, sy + 12], [cx - 8, sy + 16]], W, { ol: true, bv: 4 });
    for (let k = 0; k < 4; k++) ln(B, cx - 12 - k * 4, sy - 7 + k * 2, cx - 9 - k * 3, sy + 10 - k, W, SHD, true);
    for (let k = 0; k < 4; k++) P(B, [[cx - 14 - k * 4, sy + 8 + k * 1.2], [cx - 18 - k * 3, sy + 17 - k], [cx - 10 - k * 4, sy + 11 + k]], W, { ol: true, bv: 1 });
  } else if (race.wings === 'bat') {
    const W = RP(race.scales ? own(SUBCOL, L.race + '/' + L.rsub) || '#8B2A20' : '#3A1F2E');
    P(B, [[cx - 1, sy + 4], [cx - 12, sy - 11], [cx - 27, sy - 6], [cx - 22, sy + 1], [cx - 27, sy + 7], [cx - 16, sy + 7], [cx - 15, sy + 13], [cx - 5, sy + 13]], W, { ol: true, bv: 2 });
    for (const [x, y] of [[cx - 22, sy + 1], [cx - 16, sy + 7]] as const) ln(B, cx - 12, sy - 10, x, y, W, DEEP, true);
  } else if (race.wings === 'fairy') {
    const W = RP(race.bee ? '#D8F0FF' : '#C9F1FF');
    E(B, cx - 13, sy + 1, 10, 6.5, W, { ol: true, bv: 3, shine: true, al: 185 });
    E(B, cx - 11, sy + 12, 7, 4.5, W, { ol: true, bv: 3, shine: true, al: 185 });
    ln(B, cx - 4, sy + 4, cx - 19, sy - 1, W, LIT, true);
  }
  void tl;
}

function tail(B: Buf, c: Ctx, tl: number, hy: number, hs: number) {
  const { race, S: SK } = c;
  const t = race.tail;
  if (!t) return;
  if (t === 'cat' || t === 'rat') {
    const T = t === 'rat' ? RP('#D9A0A8') : SK;
    C(B, tl + 2, hy - 2, tl - 7, hy - 9, 3, T, { ol: true, bv: 1 }, 2.6);
    C(B, tl - 7, hy - 9, tl - 6, hy - 20, 2.6, T, { ol: true, bv: 1 }, 2);
    if (t === 'cat') E(B, tl - 6, hy - 21, 1.8, 1.8, T, { ol: true, bv: 1 });
  } else if (t === 'wolf' || t === 'fox' || t === 'raccoon') {
    const T = t === 'fox' ? RP('#E8862E') : SK;
    const n = t === 'fox' ? 1 + (hs % 3) : 1;
    for (let k = n - 1; k >= 0; k--) {
      P(B, [[tl + 2, hy - 3], [tl - 7 - k * 2, hy - 9 - k * 5], [tl - 14 - k * 3, hy - 17 - k * 6], [tl - 11 - k * 2, hy - 5 - k * 4], [tl + 1, hy + 2]], T, { ol: true, bv: 3 });
      if (t === 'fox') E(B, tl - 13 - k * 3, hy - 15.5 - k * 6, 2.4, 2.4, RP('#FFF6EA'), { bv: 1, onto: true });
    }
    if (t === 'raccoon') for (let k = 0; k < 3; k++) ln(B, tl - 3 - k * 3.5, hy - 4 - k * 3.5, tl - 1 - k * 3.5, hy - 9 - k * 3.5, RP('#2A2A30'), BASE, true);
  } else {
    const T = t === 'dragon' ? SK : RP('#7A1020');
    C(B, tl + 3, hy - 2, tl - 7, hy + 12, 4, T, { ol: true, bv: 2 }, 3);
    C(B, tl - 7, hy + 12, tl - 14, hy + 9, 3, T, { ol: true, bv: 1 }, 2);
    P(B, [[tl - 17, hy + 5], [tl - 12, hy + 5], [tl - 14, hy + 11]], t === 'demon' ? RP('#2A1E22') : T, { ol: true, bv: 1 });
  }
}

/** For creature plans: a plain round hand. */
export function hand(A: Buf, x: number, y: number, r: number, R: Ramp) {
  E(A, x, y, r, r, R, { ol: true, bv: 2 });
}
export { shade };
