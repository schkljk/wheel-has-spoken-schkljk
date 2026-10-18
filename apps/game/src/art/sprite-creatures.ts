// Races with body plans of their own. Each draws its body, and returns where the near arm (or wing, or
// tentacle) hangs and how to draw it after the weapon.

import { BASE, DEEP, LIT, OLN, SHD, Bx, C, E, P, RP, S, and, dot, dotOn, ell, ln, raw, type Buf, type Ramp } from './px';
import type { ArmSpec } from './sprite-body';
import { hat } from './sprite-head';
import { GROUND, type Ctx, type PlanKey } from './sprite-data';

const WHITE: readonly [number, number, number] = [250, 250, 246];
type Plan = (B: Buf, A: Buf, c: Ctx) => ArmSpec;
/** where an eldritch horror keeps its eyes, biggest first */
const EYES: [number, number, number][] = [
  [30, 41, 3.2], [41, 39, 2.6], [36, 49, 2.4], [24, 50, 2], [45, 50, 2], [31, 56, 1.8], [40, 56, 2], [47, 43, 1.6], [22, 43, 1.6], [36, 34, 1.6], [45, 57, 1.5],
];

/** Cute 2x3 eyes with a glint. */
function eyes(B: Buf, x: number, y: number, gap: number, R: Ramp = RP('#2A1E36')) {
  for (const ex of [x, x + gap]) {
    dot(B, ex, y - 1, R, OLN);
    dot(B, ex + 1, y - 1, R, OLN);
    raw(B, ex, y, WHITE);
    dot(B, ex + 1, y, R, BASE);
    dot(B, ex, y + 1, R, SHD);
    dot(B, ex + 1, y + 1, R, SHD);
  }
}
const smile = (B: Buf, x: number, y: number, R: Ramp) => {
  dot(B, x, y - 1, R, OLN);
  for (let k = 1; k <= 3; k++) dot(B, x + k, y, R, OLN);
  dot(B, x + 4, y - 1, R, OLN);
};
const arm = (A: Buf, sx: number, sy: number, hx: number, hy: number, w: number, R: Ramp, hr: number, H: Ramp = R, al?: number): ArmSpec => ({
  sx,
  sy,
  hx,
  hy,
  draw: () => {
    C(A, sx, sy, hx, hy - 1, w, R, { ol: true, bv: 2, al });
    E(A, hx, hy + 0.5, hr, hr, H, { ol: true, bv: 2, al });
  },
});

export const CREATURE: Record<PlanKey, Plan> = {
  slime(B, A, c) {
    const { L, S: SK } = c;
    const metal = L.rsub === 'Metal slime';
    E(B, 34.5, 65, 21, 17.5, SK, { ol: true, bv: 7, shine: true, al: metal ? 255 : 232 });
    S(B, and(ell(34.5, 65, 21, 17.5), (_x, y) => y > 78), 13, 77, 56, 83, SK, { bv: 1, sh: -1, onto: true });
    E(B, 27, 56, 4.5, 3, RP('#FFFFFF'), { bv: 1, al: 200 });
    if (L.rsub === 'Acid slime') for (const [x, y, r] of [[24, 68, 2], [44, 72, 1.6], [30, 75, 1.2]] as const) E(B, x, y, r, r, RP('#E9FF8A'), { bv: 1, al: 220 });
    eyes(B, 38, 61, 6);
    smile(B, 39, 67, SK);
    if (L.rsub === 'King slime') P(B, [[25, 50], [26, 41], [30, 46], [34.5, 38], [39, 46], [43, 41], [44, 50]], RP('#F2B544'), { ol: true, bv: 2, shine: true });
    else hat(B, c, 34.5, 57, 10, true);
    return arm(A, 51, 64, 55.5, 57, 5, SK, 3, SK, metal ? undefined : 232);
  },
  ghost(B, A, c) {
    const { L, S: SK } = c;
    P(B, [[20, 38], [49, 38], [52, 62], [49, 74], [44, 68], [39.5, 76], [34.5, 68], [29, 75], [24, 68], [19, 72], [17, 60]], SK, { ol: true, bv: 5, al: 215 });
    E(B, 34.5, 31, 14.5, 14, SK, { ol: true, bv: 6, al: 215 });
    if (L.rsub === 'Banshee') for (let k = 0; k < 5; k++) C(B, 22 + k * 3, 20, 18 + k * 2, 46 + (k % 2) * 4, 2, RP('#F4F7FF'), { bv: 1, al: 200 }, 1.2);
    if (L.rsub === 'Wraith') {
      S(B, and(ell(34.5, 30, 16.5, 16), (x, y) => !ell(39, 33, 10, 10)(x, y)), 18, 14, 51, 47, RP('#3A3550'), { ol: true, bv: 3 });
      for (const x of [36, 42]) raw(B, x, 31, [180, 230, 255]);
    } else {
      for (const x of [36, 43]) Bx(B, x - 0.5, 27, x + 1.5, 32, RP('#2A2240'), 1, { tone: OLN });
      E(B, 40, 37.5, 2.2, 2.8, RP('#2A2240'), { tone: OLN });
      raw(B, 36, 28, WHITE);
      raw(B, 43, 28, WHITE);
    }
    hat(B, c, 34.5, 31, 13, true);
    return arm(A, 47, 42, 52, 53, 5, SK, 2.8, SK, 215);
  },
  pigeon(B, A, c) {
    const { L, S: SK } = c;
    const F = RP('#E8862E');
    for (const x of [30, 38]) {
      ln(B, x, 72, x - 1, 80, F, BASE);
      ln(B, x - 3, 81, x + 2, 81, F, BASE);
    }
    P(B, [[21, 60], [10, 66], [13, 69], [22, 67]], RP('#6E7783'), { ol: true, bv: 2 });
    E(B, 33, 62, 16.5, 13, SK, { ol: true, bv: 6, cast: true });
    E(B, 43.5, 50, 7.5, 6, RP('#5FB37A'), { ol: true, bv: 3, shine: true });
    E(B, 43, 52, 6, 3, RP('#8E5BD6'), { bv: 2, shine: true, onto: true });
    E(B, 45.5, 40, 9, 8.5, SK, { ol: true, bv: 5 });
    P(B, [[53, 38.5], [59.5, 41], [53, 43]], RP('#3A3A40'), { ol: true, bv: 1 });
    E(B, 53, 38.5, 1.4, 1.2, RP('#F4F1EA'), { bv: 1 });
    E(B, 48, 38, 2, 2, F, { bv: 1 });
    dot(B, 49, 38, F, OLN);
    E(B, 29, 60, 10, 6.5, RP('#6E7783'), { ol: true, bv: 3 });
    for (let k = 0; k < 3; k++) ln(B, 22 + k * 4, 63, 26 + k * 4, 66, RP('#6E7783'), DEEP, true);
    if (L.rsub === 'War pigeon') Bx(B, 37, 30, 53, 35, RP('#5A6572'), 2, { ol: true, bv: 2, shine: true });
    else hat(B, c, 45.5, 40, 8.5, true);
    return arm(A, 40, 58, 48, 62, 5, RP('#6E7783'), 2.6, RP('#6E7783'));
  },
  toaster(B, A, c) {
    const { S: SK } = c;
    const D = RP('#3A3A40');
    for (const x of [24, 41]) Bx(B, x, 68, x + 5, 81, D, 1.5, { ol: true, bv: 2 });
    for (const x of [22, 39]) Bx(B, x, 78, x + 9, 82, D, 1.5, { ol: true, bv: 2 });
    Bx(B, 25, 31, 31.5, 45, RP('#D9A35A'), 2, { ol: true, bv: 2 });
    Bx(B, 37, 34, 43.5, 45, RP('#C98A44'), 2, { ol: true, bv: 2 });
    Bx(B, 18, 42, 51, 71, SK, 5, { ol: true, bv: 4, shine: true, cast: true });
    for (const x of [23, 36]) Bx(B, x, 43.5, x + 9, 45.5, RP('#1A1A20'), 0.5, { tone: OLN });
    Bx(B, 35, 51, 47, 58, RP('#1A2230'), 1.5, { ol: true, bv: 1 });
    for (const x of [37, 43]) {
      raw(B, x, 53, [90, 230, 255]);
      raw(B, x + 1, 53, [90, 230, 255]);
    }
    ln(B, 39, 56, 43, 56, RP('#5AE6FF'), BASE);
    Bx(B, 51, 49, 54, 58, D, 1, { ol: true, bv: 1 });
    ln(B, 20, 66, 49, 66, SK, SHD, true);
    hat(B, c, 34.5, 42, 10, true);
    C(B, 21, 52, 15, 64, 2.6, D, { ol: true, bv: 1 });
    return arm(A, 48, 53, 53, 63, 2.6, D, 2.6, SK);
  },
  eldritch(B, A, c) {
    const { L, S: SK } = c;
    for (let k = 0; k < 5; k++) {
      const x = 21 + k * 6.8;
      C(B, x, 62, x + (k % 2 ? 4 : -4), 80, 5, SK, { ol: true, bv: 2, sh: k % 2 ? -1 : 0 }, 2.4);
    }
    E(B, 34.5, 50, 18.5, 21, SK, { ol: true, bv: 6, cast: true });
    const n = L.rsub === 'Three eyes' ? 3 : L.rsub === 'Twelve eyes' ? 7 : L.rsub === 'Too many eyes' ? 9 : 11;
    EYES.slice(0, n).forEach(([x, y, r], k) => {
      E(B, x, y, r, r, RP('#F4F1EA'), { ol: true, bv: 1 });
      raw(B, x, y, [200, 30, 60]);
      if (k === 0) raw(B, x - 1, y - 1, WHITE);
    });
    P(B, [[29, 61], [41, 61], [38, 65], [32, 65]], RP('#2A1530'), { ol: true, bv: 1 });
    for (const x of [31, 34, 37]) raw(B, x, 61, WHITE);
    hat(B, c, 34.5, 36, 13, true);
    return arm(A, 49, 46, 56, 56, 4.5, SK, 2.6);
  },
  djinn(B, A, c) {
    const { S: G } = c;
    const SM = RP('#9DB8F5');
    P(B, [[25, 50], [45, 50], [41, 62], [36, 70], [31, 79], [38, 81], [23, 75], [28, 63]], SM, { ol: true, bv: 4, al: 205 });
    for (const [x, y, r] of [[34, 66, 4], [29, 74, 3.4], [40, 58, 3.6]] as const) E(B, x, y, r, r, SM, { bv: 2, al: 205, onto: true });
    C(B, 27, 34, 22, 48, 5.5, G, { ol: true, bv: 2, sh: -1 });
    E(B, 22, 50, 3, 3, G, { ol: true, bv: 1, sh: -1 });
    Bx(B, 24, 31, 45, 53, G, 5, { ol: true, bv: 4, cast: true });
    Bx(B, 24, 47, 45, 51, RP('#E8B33A'), 1, { ol: true, bv: 1, shine: true });
    P(B, [[24, 32], [30, 32], [28, 47], [24, 47]], RP('#7A2E8E'), { ol: true, bv: 2 });
    E(B, 34.5, 21, 10, 10, G, { ol: true, bv: 5, cast: true });
    Bx(B, 31.5, 9, 37.5, 12.5, RP('#1F1F26'), 1.5, { ol: true, bv: 1 });
    P(B, [[33, 10], [35, 1], [37, 10]], RP('#1F1F26'), { ol: true, bv: 1 });
    eyes(B, 37, 20, 5);
    for (let k = 0; k < 4; k++) dot(B, 38 + k, 26, G, OLN);
    E(B, 26, 23, 1.6, 1.6, RP('#E8B33A'), { ol: true, bv: 1, shine: true });
    hat(B, c, 34.5, 21, 10, true);
    return arm(A, 44, 34, 49, 49, 5.5, G, 3.2);
  },
  snowman(B, A, c) {
    const { S: SK, out } = c;
    const coal = RP('#2A2230');
    const wood = RP('#6E4A30');
    E(B, 34.5, 71, 15.5, 11, SK, { ol: true, bv: 5 });
    C(B, 27, 49, 16, 41, 2, wood, { ol: true, bv: 1 });
    C(B, 19, 43, 15, 44, 1.4, wood, { bv: 1 });
    E(B, 34.5, 51, 11.5, 10, SK, { ol: true, bv: 5, cast: true });
    for (const y of [47, 52, 57]) E(B, 35.5, y, 1.4, 1.4, coal, { bv: 1, shine: true });
    E(B, 34.5, 31, 9.5, 9.5, SK, { ol: true, bv: 5, cast: true });
    const scarf = RP(out.c || '#C0392B');
    Bx(B, 25, 38.5, 44, 42, scarf, 1.5, { ol: true, bv: 2 });
    Bx(B, 26, 41, 30, 49, scarf, 1, { ol: true, bv: 2 });
    for (const x of [37, 41]) {
      raw(B, x, 29, [30, 26, 40]);
      raw(B, x, 30, [30, 26, 40]);
    }
    P(B, [[41, 32], [50, 33.5], [41, 35]], RP('#E8862E'), { ol: true, bv: 1 });
    for (let k = 0; k < 4; k++) raw(B, 36 + k * 1.5, 36 + (k === 0 || k === 3 ? 0 : 1), [30, 26, 40]);
    hat(B, c, 34.5, 31, 9.5, true);
    return {
      sx: 44,
      sy: 48,
      hx: 52,
      hy: 41,
      draw: () => {
        C(A, 44, 48, 52, 42, 2.2, wood, { ol: true, bv: 1 });
        C(A, 50, 43, 54, 39, 1.4, wood, { bv: 1 });
        C(A, 50, 43, 53, 45, 1.4, wood, { bv: 1 });
      },
    };
  },
  duck(B, A, c) {
    const { L, S: SK } = c;
    P(B, [[18, 64], [11, 56], [14, 55], [21, 62]], SK, { ol: true, bv: 2 });
    E(B, 33, 67, 18, 12.5, SK, { ol: true, bv: 6, shine: true, cast: true });
    E(B, 43, 45, 10.5, 10, SK, { ol: true, bv: 6, shine: true });
    P(B, [[51, 45], [60, 46.5], [59, 49], [51, 51]], RP('#E8862E'), { ol: true, bv: 2, shine: true });
    ln(B, 52, 48, 59, 48, RP('#E8862E'), DEEP);
    eyes(B, 45, 42, 0);
    E(B, 29, 65, 9, 5.5, SK, { ol: true, bv: 3, sh: -1 });
    E(B, 26, 59, 2.6, 2, RP('#FFFFFF'), { bv: 1, al: 210 });
    if (L.rsub === 'Debugging duck') {
      for (const x of [43, 48]) Bx(B, x, 40, x + 4, 44, RP('#2B2B33'), 1, { tone: OLN });
      ln(B, 47, 41, 48, 41, RP('#2B2B33'), OLN);
    } else hat(B, c, 43, 45, 10, true);
    return arm(A, 42, 63, 50, 59, 5, SK, 3);
  },
  elemental(B, A, c) {
    const { L, S: G } = c;
    const sub = L.rsub || 'Fire';
    const lite = RP(sub === 'Void' ? '#B388FF' : sub === 'Earth' ? '#C9A27A' : '#FFFFFF');
    const lower: [number, number][] =
      sub === 'Earth' ? [[24, 52], [46, 52], [47, 80], [22, 80]] : sub === 'Water' ? [[24, 52], [46, 52], [44, 72], [34.5, 80], [25, 72]] : [[24, 52], [46, 52], [42, 66], [38, 62], [35, 81], [31, 64], [27, 70]];
    P(B, lower, G, { ol: true, bv: 3, al: sub === 'Earth' ? 255 : 230 });
    C(B, 27, 34, 22, 50, 5.5, G, { ol: true, bv: 2, sh: -1 });
    Bx(B, 24, 30, 45, 55, G, 6, { ol: true, bv: 5, cast: true });
    E(B, 34.5, 41, 4, 4, lite, { bv: 3, shine: true, al: 220 });
    E(B, 34.5, 20, 9.5, 9.5, G, { ol: true, bv: 5 });
    if (sub === 'Earth') for (const [x, y] of [[28, 36], [41, 47], [30, 70], [40, 62]] as const) E(B, x, y, 2.4, 2, RP('#6B5233'), { bv: 1, onto: true });
    else if (sub === 'Ice') for (let k = 0; k < 4; k++) P(B, [[27 + k * 4, 13], [29 + k * 4, 2 + (k % 2) * 3], [31 + k * 4, 13]], RP('#E6FAFF'), { ol: true, bv: 1, shine: true });
    else for (let k = 0; k < 4; k++) P(B, [[27 + k * 4, 14], [29 + k * 4, 3 + (k % 2) * 3], [31 + k * 4, 14]], G, { ol: true, bv: 2 });
    if (sub === 'Void') for (const [x, y] of [[29, 36], [40, 46], [33, 66], [38, 18], [31, 22]] as const) raw(B, x, y, [255, 255, 255]);
    for (const x of [37, 42]) {
      raw(B, x, 19, WHITE);
      raw(B, x + 1, 19, WHITE);
      raw(B, x, 20, WHITE);
      raw(B, x + 1, 20, [200, 220, 255]);
    }
    dotOn(B, 39, 25, G, OLN);
    dotOn(B, 40, 25, G, OLN);
    return arm(A, 44, 33, 49, 50, 5.5, G, 3.2, G, sub === 'Earth' ? undefined : 230);
  },
};
void LIT;
void GROUND;
