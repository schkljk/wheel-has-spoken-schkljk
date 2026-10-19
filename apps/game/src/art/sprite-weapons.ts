// Weapons, held in the near hand. Most are drawn in the weapon's own frame: t runs along the handle (up and
// forward), s across it (positive = toward the edge, forward). Enchanted weapons glow around their outline.

import { BASE, DEEP, LIT, OLN, SHD, SHINE, Bx, C, E, P, RP, S, blank, forPx, ln, pack, rampId, raw, stamp, type Buf, type Pt, type Ramp } from './px';
import { own } from './sprite-data';

/** Weapon glow color per enchant key. */
export const EGLOW: Record<string, string> = {
  flame: '#FF7A2F', frost: '#7FE3FF', thunder: '#FFE14D', holy: '#FFF3B0', vamp: '#D50000', cursed: '#8E24AA', godslayer: '#FFD54F',
  sharp: '#E0F7FA', venom: '#76FF03', lucky: '#7CB342', heavy: '#90A4AE', swift: '#E0F7FA', echo: '#B388FF',
};

const STEEL = () => RP('#C9D1DA');
const WOOD = () => RP('#8D5E3A');
const DARK = () => RP('#3A3344');
const GOLD = () => RP('#E8B33A');
const MET = { ol: true, bv: 2, shine: true } as const;
const MAT = { ol: true, bv: 2 } as const;

/** Draws the weapon for `name` in the hand at (hx, hy). Matched by name keyword; unknown names get a sword. */
export function weapon(A: Buf, name: string | undefined, ench: string | undefined, hx: number, hy: number) {
  const n = (name || '').toLowerCase();
  if (n.includes('fists')) return;
  const W = blank(A);
  draw(W, n, hx, hy);
  const g = own(EGLOW, ench);
  if (g) glow(A, W, RP(g));
  stamp(A, W);
}

/** A soft glow two art pixels wide around everything in W, under it, in A. */
function glow(A: Buf, W: Buf, G: Ramp) {
  const s = W.s,
    r = 2 * s;
  // distance to the nearest drawn pixel, one pass per direction (city block and chessboard)
  const d = new Uint8Array(W.w * W.h);
  for (let y = 0; y < W.h; y++)
    for (let x = 0; x < W.w; x++) {
      if (W.c[y * W.w + x]) continue;
      let best = 0;
      for (let dy = -r; dy <= r && best !== 1; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W.w || ny >= W.h || !W.c[ny * W.w + nx]) continue;
          const m = Math.abs(dx) + Math.abs(dy);
          const k = m <= s ? 1 : Math.max(Math.abs(dx), Math.abs(dy)) <= r && m <= 3 * s ? 2 : 0;
          if (k && (!best || k < best)) best = k;
        }
      d[y * W.w + x] = best;
    }
  let i = 0;
  for (let y = 0; y < W.h; y++)
    for (let x = 0; x < W.w; x++, i++) {
      const k = d[i]!;
      if (!k || A.c[i]) continue;
      A.c[i] = pack(G[k === 1 ? LIT : BASE]!);
      A.r[i] = rampId(G);
      A.t[i] = k === 1 ? LIT : BASE;
      A.a[i] = k === 1 ? 170 : 90;
    }
}

function draw(W: Buf, n: string, hx: number, hy: number) {
  // the weapon's frame: up and a little forward
  const ux = 0.39,
    uy = -0.92,
    vx = 0.92,
    vy = 0.39;
  const p = (t: number, s: number): Pt => [hx + ux * t + vx * s, hy + uy * t + vy * s];
  const wP = (pts: [number, number][], R: Ramp, o = MAT as object) => P(W, pts.map(([t, s]) => p(t, s)), R, o);
  const wC = (t0: number, t1: number, w: number, R: Ramp, o = MAT as object, w1 = w, s0 = 0, s1 = 0) => {
    const a = p(t0, s0),
      b = p(t1, s1);
    C(W, a[0], a[1], b[0], b[1], w, R, o, w1);
  };
  const wE = (t: number, s: number, rx: number, ry: number, R: Ramp, o = MAT as object) => {
    const [x, y] = p(t, s);
    E(W, x, y, rx, ry, R, o);
  };
  const wL = (t0: number, s0: number, t1: number, s1: number, R: Ramp, tone: number) => {
    const a = p(t0, s0),
      b = p(t1, s1);
    ln(W, a[0], a[1], b[0], b[1], R, tone, true);
  };
  /** a straight sword: grip, pommel, guard and a blade of length L and width w */
  const sword = (L: number, w: number, blade: Ramp, guard: Ramp, grip: Ramp, gw = 5.5, gl = 7) => {
    wC(-gl, 2, 2.6, grip);
    wE(-gl - 1, 0, 1.9, 1.9, guard, MET);
    wP([[3.6, -w / 2], [3.6 + L, -w / 2], [3.6 + L + w * 0.9, 0], [3.6 + L, w / 2], [3.6, w / 2]], blade, MET);
    if (w >= 4) wL(5, 0, 2 + L, 0, blade, DEEP);
    else wL(5, -w / 2 + 0.6, 2 + L, -w / 2 + 0.6, blade, SHINE);
    wP([[1.8, -gw], [3.8, -gw], [3.8, gw], [1.8, gw]], guard, { ol: true, bv: 1, shine: true });
  };

  if (n.includes('greatsword')) return sword(29, 5.6, STEEL(), GOLD(), RP('#5A3A2A'), 7, 9);
  if (n.includes('rapier')) {
    wC(-6, 2, 2.4, RP('#5A3A2A'));
    wP([[3, -0.9], [33, -0.9], [35, 0], [33, 0.9], [3, 0.9]], STEEL(), MET);
    const [x, y] = p(1, 1.5);
    S(W, (X, Y) => {
      const d = Math.hypot(X - x, Y - y);
      return d <= 4.6 && d >= 3.1;
    }, x - 5, y - 5, x + 5, y + 5, GOLD(), MET);
    wE(-7, 0, 1.8, 1.8, GOLD(), MET);
    return;
  }
  if (n.includes('katana')) {
    wC(-8, 2, 2.6, RP('#2A2230'));
    for (let t = -7; t < 2; t += 2.5) {
      const [x, y] = p(t, 0);
      raw(W, x, y, [236, 228, 210]);
    }
    const pts: [number, number][] = [];
    for (let t = 3; t <= 32; t += 3) pts.push([t, -1.4 - 0.007 * (t - 3) ** 2]);
    pts.push([35, -0.007 * 32 * 32 + 0.4]);
    for (let t = 32; t >= 3; t -= 3) pts.push([t, 1.5 - 0.007 * (t - 3) ** 2]);
    wP(pts, STEEL(), MET);
    for (let t = 6; t < 30; t += 1) {
      const [x, y] = p(t, 0.6 - 0.007 * (t - 3) ** 2);
      raw(W, x, y, [250, 250, 255]);
    }
    wE(2.5, 0, 3.4, 3.4, RP('#2A2230'), { ol: true, bv: 1, shine: true });
    return;
  }
  if (n.includes('cursed')) {
    wC(-7, 2, 2.6, RP('#2A1E36'));
    wE(-8, 0, 2, 2, RP('#8E24AA'), MET);
    const pts: [number, number][] = [[3, -2.4]];
    for (let t = 6; t <= 24; t += 4) pts.push([t, -2.4 - (t % 8 === 2 ? 1.6 : 0)]);
    pts.push([30, 0]);
    for (let t = 24; t >= 6; t -= 4) pts.push([t, 2.6 + (t % 8 === 6 ? 1.8 : 0)]);
    pts.push([3, 2.6]);
    wP(pts, RP('#5B2A7A'), MET);
    wL(5, 0, 25, 0, RP('#B388FF'), LIT);
    wP([[1.5, -6], [4, -3], [4, 3], [1.5, 6], [2.5, 0]], RP('#2A1E36'), { ol: true, bv: 1 });
    const [ex, ey] = p(8, 0);
    raw(W, ex, ey, [255, 60, 80]);
    raw(W, ex + 1, ey, [255, 160, 170]);
    return;
  }
  if (n.includes('dagger')) return sword(11, 3.8, STEEL(), GOLD(), RP('#5A3A2A'), 4, 5);
  if (n.includes('chainsaw')) {
    Bx(W, hx - 6, hy - 8, hx + 5, hy, RP('#E8862E'), 2, { ol: true, bv: 2, shine: true });
    Bx(W, hx - 4, hy - 6, hx + 1, hy - 3, RP('#3A3344'), 1, { bv: 1 });
    wP([[3, -2.4], [25, -2.4], [27, 0], [25, 2.4], [3, 2.4]], STEEL(), MET);
    for (let t = 4; t < 26; t += 2) {
      const a = p(t, -2.8),
        b = p(t + 1, 2.8);
      raw(W, a[0], a[1], [60, 60, 70]);
      raw(W, b[0], b[1], [60, 60, 70]);
    }
    return;
  }
  if (n.includes('scythe')) {
    wC(-12, 30, 2.2, RP('#4A3428'));
    wC(10, 10, 2, RP('#4A3428'), MAT, 2, 0, 4);
    wP([[29.5, 1], [31, -3], [29, -10], [24, -17], [21, -19], [25, -11], [27, -4], [27.5, 1]], STEEL(), MET);
    return;
  }
  if (n.includes('trident')) {
    wC(-12, 26, 2.2, GOLD(), MET);
    wP([[25, -6], [27.5, -6], [27.5, 6], [25, 6]], GOLD(), MET);
    for (const s of [-5, 0, 5]) {
      wC(27, s === 0 ? 36 : 34, 1.8, GOLD(), MET, 1.8, s, s);
      wP([[s === 0 ? 36 : 34, s - 1.8], [s === 0 ? 39 : 37, s], [s === 0 ? 36 : 34, s + 1.8]], GOLD(), MET);
    }
    return;
  }
  if (n.includes('harpoon')) {
    wC(-12, 30, 2.2, WOOD());
    wP([[29, -2.4], [37, 0], [29, 2.4], [27.5, 0]], STEEL(), MET);
    wP([[29, -2.4], [27, -4.5], [28.5, -1.5]], STEEL(), MET);
    wP([[29, 2.4], [27, 4.5], [28.5, 1.5]], STEEL(), MET);
    wL(20, 1.2, -6, 3, RP('#E8E2DA'), LIT);
    return;
  }
  if (n.includes('spear')) {
    wC(-12, 30, 2.2, WOOD());
    wP([[29, -2.8], [33, -2.2], [38, 0], [33, 2.2], [29, 2.8], [27.5, 0]], STEEL(), MET);
    wC(26, 28, 3, RP('#C62F35'), { bv: 1 });
    return;
  }
  if (n.includes('planet')) {
    wC(-9, 27, 2.8, RP('#2A2240'), MET);
    wP([[17, 1.5], [15, 9], [19, 16], [25, 17], [29, 13], [29, 1.5]], RP('#6A4CC9'), MET);
    wP([[18, -1.5], [16, -8], [21, -12], [27, -10], [28, -1.5]], RP('#6A4CC9'), MET);
    for (const [t, s] of [[22, 9], [24, 13], [21, -7], [25, 5]] as const) {
      const [x, y] = p(t, s);
      raw(W, x, y, [255, 255, 255]);
    }
    wE(23, 0, 2.6, 2.6, RP('#FFD54F'), MET);
    return;
  }
  if (n.includes('axe')) {
    wC(-8, 25, 2.6, WOOD());
    wP([[16, 1.2], [14.5, 8.5], [18, 13], [25, 13], [27.5, 9], [26, 1.2]], STEEL(), MET);
    wP([[19, -1.2], [21, -5], [24, -1.2]], STEEL(), MET);
    wL(16.5, 9.5, 25.5, 11, STEEL(), SHINE);
    return;
  }
  if (n.includes('sledgehammer')) {
    wC(-10, 23, 2.6, WOOD());
    wP([[21, -6], [30, -6], [30, 9], [21, 9]], RP('#5A6572'), MET);
    wL(22, 8, 29, 8, RP('#5A6572'), DEEP);
    return;
  }
  if (n.includes('hammer')) {
    wC(-8, 22, 2.6, WOOD());
    wP([[19, -7], [27, -7], [27, 8], [19, 8]], STEEL(), MET);
    wP([[27, -2], [31, 0], [27, 2]], STEEL(), MET);
    wL(19.5, -6, 19.5, 7, STEEL(), SHINE);
    return;
  }
  if (n.includes('bat')) {
    wC(-6, 26, 2.6, RP('#C8925A'), MAT, 6.4);
    wC(-6, 1, 2.8, RP('#2A2230'));
    wE(-7, 0, 2.2, 2.2, RP('#C8925A'), MAT);
    return;
  }
  if (n.includes('pan')) {
    const gold = n.includes('golden');
    const R = gold ? GOLD() : RP('#55525F');
    wC(-4, 9, 2.2, gold ? GOLD() : RP('#2A2230'), gold ? MET : MAT);
    wE(16.5, 0, 7.6, 7.6, R, MET);
    wE(16.5, 0, 5.4, 5.4, gold ? RP('#C9921E') : RP('#3A3744'), { bv: 3, shine: true });
    if (gold) for (const [t, s] of [[19, -4], [13, 3]] as const) {
      const [x, y] = p(t, s);
      raw(W, x, y, [255, 255, 255]);
    }
    return;
  }
  if (n.includes('brick')) {
    Bx(W, hx - 2, hy - 10, hx + 9, hy - 3, RP('#B5523B'), 1, { ol: true, bv: 2 });
    ln(W, hx - 1, hy - 7, hx + 8, hy - 7, RP('#B5523B'), DEEP, true);
    for (const x of [hx + 2, hx + 6]) ln(W, x, hy - 9, x, hy - 7, RP('#B5523B'), DEEP, true);
    ln(W, hx + 4, hy - 6, hx + 4, hy - 4, RP('#B5523B'), DEEP, true);
    return;
  }
  if (n.includes('chicken')) {
    const Y = RP('#F4D03F');
    ln(W, hx, hy - 1, hx + 3, hy - 5, RP('#E8862E'), BASE);
    ln(W, hx + 1, hy, hx + 5, hy - 5, RP('#E8862E'), BASE);
    E(W, hx + 5, hy - 10.5, 4.6, 6.8, Y, MAT);
    C(W, hx + 6, hy - 15, hx + 8, hy - 19, 2.6, Y, MAT);
    E(W, hx + 8.5, hy - 20.5, 3.2, 3, Y, MAT);
    P(W, [[hx + 11, hy - 21], [hx + 15, hy - 20], [hx + 11, hy - 19]], RP('#E8862E'), MAT);
    for (const x of [hx + 7, hx + 8.5, hx + 10]) raw(W, x, hy - 24, [220, 40, 40]);
    raw(W, hx + 9, hy - 21, [20, 20, 20]);
    return;
  }
  if (n.includes('pool')) {
    const R = RP('#3CC8E8');
    for (let k = 0; k < 6; k++) {
      const t0 = k * 5,
        t1 = t0 + 5.5;
      wC(t0 - 2, t1 - 2, 5.2, R, { ol: true, bv: 2 }, 5.2, 0.012 * t0 * t0, 0.012 * t1 * t1);
    }
    for (let t = 2; t < 28; t += 4) wL(t, -2 + 0.012 * t * t, t + 1, 2 + 0.012 * t * t, R, SHD);
    return;
  }
  if (n.includes('noodle')) {
    const R = RP('#F4D678');
    for (let k = 0; k < 9; k++) {
      const t0 = k * 2.6,
        t1 = t0 + 3;
      const s = (t: number) => Math.sin(t / 3) * 1.6 + 0.05 * t * t;
      wC(t0, t1, 2.4, R, { ol: true, bv: 1 }, 2.4, s(t0), s(t1));
    }
    return;
  }
  if (n.includes('crossbow')) {
    Bx(W, hx - 7, hy - 3.5, hx + 13, hy - 0.5, WOOD(), 1, { ol: true, bv: 2 });
    C(W, hx + 10, hy - 2, hx + 7, hy - 12, 2.2, DARK(), MAT, 1.4);
    C(W, hx + 10, hy - 2, hx + 7, hy + 8, 2.2, DARK(), MAT, 1.4);
    ln(W, hx + 7, hy - 12, hx + 1, hy - 2, RP('#E8E2DA'), LIT);
    ln(W, hx + 1, hy - 2, hx + 7, hy + 8, RP('#E8E2DA'), LIT);
    ln(W, hx - 2, hy - 4.5, hx + 15, hy - 4.5, STEEL(), LIT);
    P(W, [[hx + 15, hy - 6.5], [hx + 18, hy - 4.5], [hx + 15, hy - 2.5]], STEEL(), MET);
    return;
  }
  if (n.includes('bow')) {
    const R = WOOD();
    C(W, hx + 1, hy + 1, hx + 6, hy - 7, 2.4, R, MAT, 2.2);
    C(W, hx + 6, hy - 7, hx + 3, hy - 16, 2.2, R, MAT, 1.5);
    C(W, hx + 1, hy + 1, hx + 6, hy + 9, 2.4, R, MAT, 2.2);
    C(W, hx + 6, hy + 9, hx + 3, hy + 17, 2.2, R, MAT, 1.5);
    ln(W, hx + 3, hy - 16, hx - 1, hy + 1, RP('#E8E2DA'), LIT);
    ln(W, hx - 1, hy + 1, hx + 3, hy + 17, RP('#E8E2DA'), LIT);
    ln(W, hx - 2, hy + 1, hx + 14, hy + 1, RP('#8D6E46'), BASE);
    P(W, [[hx + 14, hy - 1], [hx + 17, hy + 1], [hx + 14, hy + 3]], STEEL(), MET);
    for (const d of [-1, 1]) ln(W, hx - 2, hy + 1 + d, hx - 4, hy + 1 + d * 2, RP('#E5484D'), BASE);
    return;
  }
  if (n.includes('rifle')) {
    Bx(W, hx - 9, hy - 5, hx - 1, hy + 1, RP('#2A2A34'), 2, { ol: true, bv: 2 });
    Bx(W, hx - 3, hy - 7, hx + 15, hy - 1.5, RP('#3A4450'), 1.5, { ol: true, bv: 2, shine: true });
    Bx(W, hx + 15, hy - 5.5, hx + 23, hy - 3.5, RP('#5A6572'), 0.5, { ol: true, bv: 1, shine: true });
    ln(W, hx - 1, hy - 4, hx + 14, hy - 4, RP('#5AE6FF'), LIT, true);
    Bx(W, hx + 3, hy - 10, hx + 10, hy - 7.5, RP('#2A2A34'), 1, { ol: true, bv: 1 });
    raw(W, hx + 9, hy - 9, [120, 240, 255]);
    raw(W, hx + 23, hy - 5, [120, 240, 255]);
    return;
  }
  if (n.includes('uno')) {
    Bx(W, hx - 1, hy - 13, hx + 8, hy - 1, RP('#E5484D'), 1, { ol: true, bv: 1 });
    E(W, hx + 3.5, hy - 7, 3, 4.2, RP('#F4F1EA'), { bv: 1 });
    raw(W, hx + 2, hy - 9, [60, 150, 255]);
    raw(W, hx + 3, hy - 10, [60, 150, 255]);
    raw(W, hx + 4, hy - 4, [255, 200, 60]);
    raw(W, hx + 5, hy - 5, [255, 200, 60]);
    return;
  }
  if (n.includes('bo staff')) {
    wC(-24, 26, 2.4, RP('#B98B5E'));
    for (const t of [-24, 26]) wE(t, 0, 1.8, 1.8, RP('#5A6572'), MET);
    for (const t of [-3, 5]) wL(t, -1.2, t, 1.2, RP('#B98B5E'), DEEP);
    return;
  }
  if (n.includes('staff')) {
    wC(-14, 25, 2.2, WOOD());
    wC(24, 29, 1.6, WOOD(), MAT, 1.2, -1, -4);
    wC(24, 29, 1.6, WOOD(), MAT, 1.2, 1, 4);
    wE(29.5, 0, 3.9, 3.9, RP('#7FE3FF'), { ol: true, bv: 3, shine: true });
    const [x, y] = p(30.5, -1);
    raw(W, x, y, [255, 255, 255]);
    return;
  }
  if (n.includes('shuriken')) {
    const cx = hx + 4,
      cy = hy - 7;
    P(W, [[cx, cy - 7], [cx + 2, cy - 2], [cx + 7, cy], [cx + 2, cy + 2], [cx, cy + 7], [cx - 2, cy + 2], [cx - 7, cy], [cx - 2, cy - 2]], STEEL(), MET);
    raw(W, cx, cy, [30, 30, 40]);
    return;
  }
  if (n.includes('chakram')) {
    const cx = hx + 3,
      cy = hy - 8;
    const R = GOLD();
    forPx(W, cx - 9, cy - 9, cx + 9, cy + 9, (i, x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      if (d > 7.5 || d < 4.5) return;
      const lit = x - cx + (y - cy) < -2;
      const sh = x - cx + (y - cy) > 3;
      W.c[i] = pack(R[lit ? LIT : sh ? SHD : BASE]!);
      W.r[i] = rampId(R);
      W.t[i] = BASE;
      W.a[i] = 255;
    });
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      P(W, [[cx + Math.cos(a - 0.2) * 7, cy + Math.sin(a - 0.2) * 7], [cx + Math.cos(a) * 10, cy + Math.sin(a) * 10], [cx + Math.cos(a + 0.25) * 7, cy + Math.sin(a + 0.25) * 7]], STEEL(), MET);
    }
    return;
  }
  if (n.includes('boomerang')) {
    C(W, hx - 1, hy - 2, hx + 11, hy - 8, 3.4, RP('#C8925A'), MAT, 3);
    C(W, hx + 11, hy - 8, hx + 7, hy - 19, 3, RP('#C8925A'), MAT, 2.6);
    for (const [x, y] of [[hx + 4, hy - 4], [hx + 9, hy - 13]] as const) raw(W, x, y, [229, 72, 77]);
    return;
  }
  if (n.includes('guitar')) {
    wC(5, 24, 2.2, RP('#5A3A2A'));
    wP([[23.5, -2], [29, -2.5], [29, 2.5], [23.5, 2]], RP('#2A2230'), MAT);
    E(W, hx - 1, hy + 3, 6.4, 5.4, RP('#E5484D'), { ol: true, bv: 3, shine: true });
    E(W, hx + 4, hy - 2, 4.6, 4.2, RP('#E5484D'), { ol: true, bv: 3, shine: true });
    E(W, hx + 1, hy + 1, 2.6, 2.2, RP('#F4F1EA'), { bv: 1 });
    wL(5, -0.5, 23, -0.5, RP('#E8E2DA'), LIT);
    return;
  }
  if (n.includes('whip')) {
    wC(-4, 4, 2.8, RP('#2A2230'));
    let [px, py] = p(4, 0);
    for (let k = 1; k <= 14; k++) {
      const a = -1.2 + k * 0.32;
      const nx = px + Math.cos(a) * 2.4,
        ny = py + Math.sin(a) * 2.4 - (k < 6 ? 1.4 : 0);
      C(W, px, py, nx, ny, Math.max(1.2, 2.2 - k * 0.07), RP('#6B4A2E'), { bv: 1 });
      px = nx;
      py = ny;
    }
    return;
  }
  if (n.includes('nunchuck')) {
    wC(-3, 8, 2.8, RP('#5A3A2A'), MAT);
    const a = p(8, 0);
    for (let k = 1; k <= 3; k++) raw(W, a[0] + k * 1.3, a[1] - k * 0.4, [180, 180, 190]);
    C(W, a[0] + 5, a[1] - 1.5, a[0] + 11, a[1] + 7, 2.8, RP('#5A3A2A'), MAT);
    return;
  }
  if (n.includes('fishing')) {
    wC(-6, 34, 1.7, RP('#2A2230'), MAT, 1.1);
    wE(2, -2, 2, 2, STEEL(), MET);
    const tip = p(34, 0);
    ln(W, tip[0], tip[1], tip[0] + 2, tip[1] + 22, RP('#E8E2DA'), LIT);
    E(W, tip[0] + 2, tip[1] + 24, 2, 2, RP('#E5484D'), { ol: true, bv: 1, shine: true });
    raw(W, tip[0] + 2, tip[1] + 25, [250, 250, 250]);
    return;
  }
  if (n.includes('lollipop')) {
    wC(-3, 14, 1.9, RP('#F4F1EA'));
    wE(20.5, 0, 7.4, 7.4, RP('#FF6FA8'), { ol: true, bv: 3, shine: true });
    const [cx, cy] = p(20.5, 0);
    for (let k = 0; k < 24; k++) {
      const a = k * 0.55,
        r = 0.4 + k * 0.24;
      raw(W, cx + Math.cos(a) * r, cy + Math.sin(a) * r, [255, 245, 250]);
    }
    return;
  }
  // a plain sword
  sword(22, 4, STEEL(), GOLD(), RP('#5A3A2A'));
  void OLN;
}
