// The Android app icon and splash screens, drawn with the sprite engine (npx tsx tools/art/app-icon.ts).
// A 24x24 pixel wheel, scaled by whole numbers for every screen density so the pixels stay square.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BASE, DEEP, LIT, SHINE, C, E, P, RP, S, buf, dot, outline, pack, rampOf, shade, toRGBA, type Buf } from '../../apps/game/src/art/px';
import { png } from './png';

const RES = resolve(import.meta.dirname, '../../apps/game/android/app/src/main/res');
const BG: [number, number, number] = [0x14, 0x18, 0x2b];
/** One tone lighter (the opposite of shade). */
function lift(B: Buf, x: number, y: number) {
  const i = y * B.w + x,
    R = rampOf(B.r[i]!);
  if (!R || B.t[i]! >= LIT) return;
  B.t[i] = B.t[i]! + 1;
  B.c[i] = pack(R[B.t[i]!]!);
}

/** The 24x24 art: the wheel, its gold rim and pegs, the hub, the red pointer. */
function art() {
  const B = buf(24, 24);
  const cx = 12,
    cy = 13.2;
  const cols = ['#5B4BB7', '#0E9F8E', '#C62F35', '#D99A2B', '#7A5CC9', '#2BB3A3', '#E0504A', '#F2B544'];
  cols.forEach((c, i) => {
    const a0 = (i / 8) * Math.PI * 2 - Math.PI / 2 - Math.PI / 8,
      a1 = a0 + Math.PI / 4;
    S(B, (x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      let a = Math.atan2(y - cy, x - cx);
      if (a < a0) a += Math.PI * 2;
      return d <= 9.2 && a >= a0 && a < a1;
    }, 2, 3, 22, 23, RP(c), { bv: 0 });
  });
  // light from the top left over the whole face: the lower right half a tone darker, a highlight up top
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < 24; x++) {
      const dx = x + 0.5 - cx,
        dy = y + 0.5 - cy;
      if (Math.hypot(dx, dy) > 9.2) continue;
      if (dx + dy > 4) shade(B, x, y, 1);
      else if (dx + dy < -9 && Math.hypot(dx, dy) > 5) lift(B, x, y);
    }
  S(B, (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    return d <= 11 && d > 9.2;
  }, 0.5, 1.5, 23.5, 24, RP('#E8B33A'), { bv: 1, shine: true });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    dot(B, cx + Math.cos(a) * 10.1 - 0.5, cy + Math.sin(a) * 10.1 - 0.5, RP('#FFF6EA'), SHINE);
  }
  E(B, cx, cy, 2.3, 2.3, RP('#FFF1D6'), { ol: true, bv: 2 });
  dot(B, cx - 1, cy - 1, RP('#FFF1D6'), SHINE);
  P(B, [[cx - 3.2, 0.6], [cx + 3.2, 0.6], [cx, 5.6]], RP('#E5484D'), { ol: true, bv: 1, shine: true });
  C(B, cx, cy, cx, cy, 0.1, RP('#FFF1D6'), { tone: BASE });
  outline(B);
  void DEEP;
  return toRGBA(B);
}

/** An image of `size` with the art scaled by k, centered, over a background (or transparent). */
function compose(size: number, k: number, bg: 'none' | 'square' | 'round' | 'full', W = size, H = size) {
  const a = art();
  const img = new Uint8ClampedArray(W * H * 4);
  const r = Math.min(W, H) / 2;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const inBg = bg === 'full' || (bg === 'square' && true) || (bg === 'round' && Math.hypot(x + 0.5 - W / 2, y + 0.5 - H / 2) <= r);
      if (bg !== 'none' && inBg) {
        // a soft spotlight behind the wheel
        const g = Math.max(0, 1 - Math.hypot(x - W / 2, y - H / 2) / (Math.min(W, H) * 0.6));
        img.set([BG[0] + 40 * g, BG[1] + 30 * g, BG[2] + 60 * g, 255], i);
      }
    }
  const ox = Math.floor((W - 24 * k) / 2),
    oy = Math.floor((H - 24 * k) / 2);
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < 24; x++) {
      const j = (y * 24 + x) * 4;
      const al = a[j + 3]! / 255;
      if (!al) continue;
      for (let dy = 0; dy < k; dy++)
        for (let dx = 0; dx < k; dx++) {
          const i = ((oy + y * k + dy) * W + ox + x * k + dx) * 4;
          for (let c = 0; c < 3; c++) img[i + c] = img[i + c]! * (1 - al) + a[j + c]! * al;
          img[i + 3] = Math.max(img[i + 3]!, a[j + 3]!);
        }
    }
  return img;
}

const DENS: [string, number][] = [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]];
for (const [d, m] of DENS) {
  const icon = Math.round(48 * m),
    fg = Math.round(108 * m);
  const kIcon = Math.max(1, Math.floor((icon * 0.84) / 24));
  writeFileSync(`${RES}/mipmap-${d}/ic_launcher.png`, png(icon, icon, compose(icon, kIcon, 'square')));
  writeFileSync(`${RES}/mipmap-${d}/ic_launcher_round.png`, png(icon, icon, compose(icon, Math.max(1, Math.floor((icon * 0.72) / 24)), 'round')));
  // adaptive icon foreground: the safe zone is the middle 66 of 108
  writeFileSync(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, png(fg, fg, compose(fg, Math.max(1, Math.floor((fg * 0.6) / 24)), 'none')));
  for (const [o, w, h] of [['port', 320, 480], ['land', 480, 320]] as const) {
    const W = Math.round(w * m),
      H = Math.round(h * m);
    writeFileSync(`${RES}/drawable-${o}-${d}/splash.png`, png(W, H, compose(W, Math.max(1, Math.floor((Math.min(W, H) * 0.42) / 24)), 'full', W, H)));
  }
}
writeFileSync(`${RES}/drawable/splash.png`, png(480, 320, compose(480, 5, 'full', 480, 320)));
writeFileSync(resolve(import.meta.dirname, '../../apps/game/public/icon-512.png'), png(512, 512, compose(512, 18, 'square')));
console.log('app icons and splash screens written');
