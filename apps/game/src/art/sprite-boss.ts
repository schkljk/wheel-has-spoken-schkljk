// Boss silhouettes (upgrade 38): each story boss gets something nobody else has, on top of their race and
// class: a crown, horns, a halo, a collar, a fin, a wheel... Placed from the sprite's own outline (the top rows
// and the shoulders) so it fits any build. Things behind the body only fill pixels the body left empty.

import { BASE, LIT, Bx, C, E, P, RP, S, blank, dot, has, ln, raw, stamp, type Buf, type Ramp } from './px';
import { SH, SW } from './sprite-data';

export function bossDress(B: Buf, name: string) {
  let top = 0;
  const rowAny = (y: number) => {
    for (let x = 0; x < SW; x++) if (has(B, x, y)) return true;
    return false;
  };
  while (top < SH && !rowAny(top)) top++;
  const cols = (y: number) => {
    let a = SW,
      b = -1;
    for (let x = 0; x < SW; x++)
      if (has(B, x, y)) {
        a = Math.min(a, x);
        b = Math.max(b, x);
      }
    return [a, b] as const;
  };
  const [h0, h1] = cols(Math.min(SH - 1, top + 4));
  const hx = (h0 + h1) / 2;
  const hw = Math.max(10, h1 - h0);
  // the shoulders: the first row well below the head that is much wider than it
  let sh = top + 14;
  while (sh < Math.min(SH - 20, top + 34) && cols(sh)[1] - cols(sh)[0] < hw * 1.3) sh++;
  const [s0, s1] = cols(sh + 1);
  const back = blank(B);
  const gold = RP('#F2B544'),
    white = RP('#F4F1EA');
  const MET = { ol: true, bv: 2, shine: true } as const;
  const crown = (y: number, w: number, R: Ramp) => {
    P(B, [[hx - w, y + 5], [hx - w, y], [hx - w / 2, y + 2.5], [hx, y - 2.5], [hx + w / 2, y + 2.5], [hx + w, y], [hx + w, y + 5]], R, MET);
    E(B, hx, y + 2.5, 1.4, 1.4, RP('#E5484D'), { bv: 1, shine: true });
  };
  const ring = (L: Buf, cx: number, cy: number, r: number, w: number, R: Ramp, o: object = MET) =>
    S(L, (x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      return d <= r && d >= r - w;
    }, cx - r, cy - r, cx + r, cy + r, R, o);
  switch (name) {
    case 'Big Tony':
      for (const x of [s0 + 2, s1 - 2]) {
        E(B, x, sh, 5, 3.4, RP('#3A3A44'), MET);
        for (const d of [-3, 0, 3]) P(B, [[x + d - 1.3, sh - 2], [x + d, sh - 7], [x + d + 1.3, sh - 2]], RP('#C9C2D8'), MET);
      }
      for (let i = 0; i < 9; i++) E(B, s0 + 5 + i * ((s1 - s0 - 10) / 8), sh + 6 + (4 - Math.abs(4 - i)) * 0.8, 1.3, 1.3, gold, { bv: 1, shine: true });
      break;
    case 'Mama Gnocchi':
      C(back, hx - 15, sh + 30, hx + 10, top - 4, 3.6, RP('#B98B5E'), { ol: true, bv: 2 });
      E(back, hx + 12, top - 7, 5.5, 6.5, RP('#B98B5E'), { ol: true, bv: 3 });
      for (let i = 0; i < 7; i++) E(B, s0 + 4 + i * ((s1 - s0 - 8) / 6), sh + 3, 1.1, 1.1, white, { bv: 1, shine: true });
      break;
    case 'Lady Venom':
      P(back, [[s0 - 3, sh + 4], [hx - hw / 2 - 5, top - 5], [hx, sh - 2], [hx + hw / 2 + 5, top - 5], [s1 + 3, sh + 4]], RP('#5B1730'), { ol: true, bv: 3 });
      crown(top - 3, 3.5, RP('#C9C2D8'));
      break;
    case 'Admiral Saltbeard':
      for (const x of [s0 + 2, s1 - 2]) {
        E(B, x, sh + 1, 4.5, 2.6, gold, MET);
        for (let k = -3; k <= 3; k += 2) ln(B, x + k, sh + 3, x + k, sh + 6, gold, BASE);
      }
      break;
    case 'The Professor':
      for (const [a, b, c, d] of [[-14, 0, -22, -16], [14, 0, 23, -13], [-10, 12, -24, 3]] as const) C(back, hx + a, sh + b, hx + c, sh + d, 3.6, RP('#6A4C93'), { ol: true, bv: 2 }, 2);
      ring(B, hx + hw / 4, top + 9, 2.6, 1.2, gold);
      break;
    case 'Count Crypt':
      for (const [x, d] of [[s0, -1], [s1, 1]] as const) C(back, x, sh + 2, x + d * 8, top - 6, 3, RP('#E8E1CC'), { ol: true, bv: 1 }, 1.2);
      crown(top - 3, 6, RP('#E8E1CC'));
      break;
    case 'Titan Prime':
      for (const x of [s0 + 2, s1 - 2]) E(B, x, sh, 5.5, 4, RP('#7D7469'), { ol: true, bv: 3 });
      P(back, [[hx - 20, sh + 2], [hx - 12, top - 3], [hx - 4, sh + 2]], RP('#6B6258'), { ol: true, bv: 2 });
      P(back, [[hx + 4, sh + 2], [hx + 13, top - 1], [hx + 21, sh + 2]], RP('#6B6258'), { ol: true, bv: 2 });
      break;
    case 'Neon Ronin':
      Bx(B, hx - 1, top + 10, hx + hw / 2 + 1, top + 11.5, RP('#2DF0FF'), 0, { bv: 1, shine: true });
      C(back, hx - 13, sh + 20, hx + 7, top - 4, 2.2, RP('#C9C2D8'), MET);
      C(back, hx + 13, sh + 20, hx - 7, top - 4, 2.2, RP('#C9C2D8'), MET);
      break;
    case 'Queen Hivemind':
      crown(top - 4, 5.5, gold);
      P(back, [[hx, sh + 6], [hx - 24, sh - 8], [hx - 26, sh + 6]], RP('#CFE8F5'), { ol: true, bv: 3, shine: true, al: 190 });
      P(back, [[hx, sh + 6], [hx + 24, sh - 8], [hx + 26, sh + 6]], RP('#CFE8F5'), { ol: true, bv: 3, shine: true, al: 190 });
      break;
    case 'The Wheelmaster':
      ring(back, hx, sh - 3, 20, 2.4, gold);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ln(back, hx + Math.cos(a) * 4, sh - 3 + Math.sin(a) * 4, hx + Math.cos(a) * 18, sh - 3 + Math.sin(a) * 18, gold, BASE);
      }
      crown(top - 3, 4.5, gold);
      break;
    case 'Captain Cumulus':
      C(B, hx + 2, top - 1, hx + 10, top - 9, 2.4, white, { ol: true, bv: 1 }, 1.4);
      for (let i = 0; i < 4; i++) E(B, 17 + i * 12, 79, 6.5, 3.4, white, { ol: true, bv: 3 });
      break;
    case 'Baron Brimstone':
      P(back, [[hx - 11, top + 6], [hx - 15, top - 7], [hx - 6, top - 10], [hx, top - 4], [hx + 6, top - 10], [hx + 15, top - 7], [hx + 11, top + 6]], RP('#FF7A2F'), { ol: true, bv: 3, shine: true, al: 225 });
      C(B, hx - hw / 2, top + 4, hx - hw / 2 - 7, top - 5, 3.4, RP('#2B1A16'), MET, 1.2);
      C(B, hx + hw / 2, top + 4, hx + hw / 2 + 7, top - 5, 3.4, RP('#2B1A16'), MET, 1.2);
      break;
    case 'The Clockmaker': {
      const g = RP('#C9A25B');
      ring(back, hx, sh - 1, 15, 4.5, g);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        E(back, hx + Math.cos(a) * 16, sh - 1 + Math.sin(a) * 16, 2.2, 2.2, g, MET);
      }
      ring(B, hx + hw / 4, top + 9, 2.6, 1.2, RP('#B87333'));
      break;
    }
    case 'Leviathan Rex':
      P(back, [[hx - 6, sh + 12], [hx - 22, top - 9], [hx - 15, sh + 2], [hx - 19, sh + 15]], RP('#4E7FA6'), { ol: true, bv: 3 });
      crown(top - 4, 5.5, gold);
      break;
    case 'Mister Giggles':
      for (let i = 0; i < 8; i++) E(B, hx - 9 + i * (18 / 7), sh - 1, 2.8, 2.6, i % 2 ? RP('#E5484D') : white, { ol: true, bv: 1 });
      ln(back, hx - 13, sh + 10, hx - 18, top - 2, RP('#C9C2D8'), BASE);
      E(back, hx - 18, top - 7, 4.5, 5.5, RP('#E5484D'), { ol: true, bv: 3, shine: true });
      break;
    case 'The Frost Queen':
      for (const [dx, h] of [[-7, 7], [-3.5, 11], [0, 14], [3.5, 11], [7, 7]] as const) P(B, [[hx + dx - 1.7, top + 1], [hx + dx, top + 1 - h], [hx + dx + 1.7, top + 1]], RP('#BFE9FF'), MET);
      break;
    case 'The Sandman':
      S(back, (x, y) => Math.hypot(x - (hx - 9), y - (top - 1)) <= 8 && Math.hypot(x - (hx - 5.5), y - (top - 3)) > 7, hx - 17, top - 9, hx - 1, top + 7, RP('#FFE082'), MET);
      for (let i = 0; i < 14; i++) dot(B, 12 + ((i * 37) % 46), 77 + (i % 3), RP('#E8C987'), LIT);
      break;
    case 'Null':
      ring(back, hx, top + 6, 15, 3.4, RP('#3B1F5E'));
      E(back, hx, top - 7, 3.4, 2.2, RP('#B388FF'), { ol: true, bv: 1, shine: true });
      for (const [a, c, d] of [[-1, -25, sh + 18], [1, 25, sh + 16], [-1, -21, sh + 30]] as const) C(back, hx + a * 6, sh + 8, hx + c, d, 3, RP('#2B1033'), { ol: true, bv: 1 }, 1.4);
      break;
    case 'Aurelion the Radiant':
      ring(B, hx, top - 4, 7, 1.8, gold);
      P(back, [[hx - 3, top + 4], [hx - 15, top - 10], [hx - 10, top - 11], [hx + 1, top + 1]], gold, MET);
      break;
    case 'The First Wheel':
      ring(back, hx, sh, 23, 3, RP('#FF4F8B'));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ln(back, hx + Math.cos(a) * 5, sh + Math.sin(a) * 5, hx + Math.cos(a) * 20, sh + Math.sin(a) * 20, RP('#FF4F8B'), BASE);
      }
      crown(top - 3, 5.5, gold);
      break;
  }
  stamp(B, back, true);
  void raw;
}
