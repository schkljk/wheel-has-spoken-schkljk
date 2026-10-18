// A contact sheet of the fight's effect sprites (npx tsx tools/art/fx-sheet.ts <out.png>).
import { writeFileSync } from 'node:fs';
import { FX_NAMES, fxArt } from '../../apps/game/src/art/fx-art';
import { png } from './png';

const k = 4,
  cell = 30 * 2 * k;
const names = FX_NAMES;
const cols = 6,
  rows = Math.ceil(names.length / cols);
const W = cols * cell,
  H = rows * cell;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) img.set([46, 40, 64, 255], i * 4);
names.forEach((n, j) => {
  const r = fxArt(n)!;
  const ox = (j % cols) * cell + 4,
    oy = Math.floor(j / cols) * cell + 4;
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const i = (y * r.w + x) * 4;
      const a = r.d[i + 3]! / 255;
      if (!a) continue;
      for (let dy = 0; dy < k; dy++)
        for (let dx = 0; dx < k; dx++) {
          const o = ((oy + y * k + dy) * W + ox + x * k + dx) * 4;
          for (let c = 0; c < 3; c++) img[o + c] = img[o + c]! * (1 - a) + r.d[i + c]! * a;
        }
    }
});
writeFileSync(process.argv[2] || 'tools/art/out/fx.png', png(W, H, img));
