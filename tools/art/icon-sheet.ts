// All pixel icons on one sheet, scaled up (npx tsx tools/art/icon-sheet.ts <out.png> [k]).
import { writeFileSync } from 'node:fs';
import { png } from './png';
import { ICON_NAMES, iconPixels } from '../../apps/game/src/ui/icon-pixels';

const k = Number(process.argv[3] || 6);
const names = ICON_NAMES;
const cols = 12,
  cell = 18 * k;
const W = cols * cell,
  H = Math.ceil(names.length / cols) * cell;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) img.set((Math.floor(i / W / cell) + Math.floor((i % W) / cell)) % 2 ? [236, 230, 218, 255] : [52, 46, 70, 255], i * 4);
names.forEach((n, j) => {
  const p = iconPixels(n, n.startsWith('slot_') ? { x: '#9C6BFF', X: '#D1BCFF' } : undefined);
  if (!p) return;
  const ox = (j % cols) * cell + k,
    oy = Math.floor(j / cols) * cell + k;
  const s = (cell - 2 * k) / p.size;
  for (let y = 0; y < p.size; y++)
    for (let x = 0; x < p.size; x++) {
      const c = p.px[y * p.size + x];
      if (!c) continue;
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) img.set([...c, 255], ((oy + Math.floor(y * s) + dy) * W + ox + Math.floor(x * s) + dx) * 4);
    }
});
writeFileSync(process.argv[2]!, png(W, H, img));
console.log(names.length, 'icons');
