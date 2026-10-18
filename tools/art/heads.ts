// Head close-ups at 10x: the top 40 rows of each look (npx tsx tools/art/heads.ts <out.png> Race:arch ...).
import { writeFileSync } from 'node:fs';
import { buildSprite, SPRITE_PW, SPRITE_S, type Look } from '../../apps/game/src/art/sprite';
import { png } from './png';

// in real pixels (SPRITE_S per art pixel)
const k = 10 / SPRITE_S,
  rows = 46 * SPRITE_S,
  cols = 36 * SPRITE_S,
  x0 = 17 * SPRITE_S;
const looks: Look[] = process.argv.slice(3).map((s, i) => {
  const [race, arch, name] = s.split(':');
  return { name: name || 'Head ' + i, race, arch, weapon: 'Bare fists' };
});
const W = looks.length * cols * k,
  H = rows * k;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) img.set([46, 40, 64, 255], i * 4);
looks.forEach((L, n) => {
  const s = buildSprite(L).body;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const j = (y * SPRITE_PW + x + x0) * 4;
      if (!s[j + 3]) continue;
      for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) img.set([s[j]!, s[j + 1]!, s[j + 2]!, 255], ((y * k + dy) * W + n * cols * k + x * k + dx) * 4);
    }
});
writeFileSync(process.argv[2]!, png(W, H, img));
