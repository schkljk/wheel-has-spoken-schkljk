// Contact sheets of the fighter sprites and icons, as PNGs, for looking at the art (npx tsx tools/art/sheet.ts).
import { writeFileSync, mkdirSync } from 'node:fs';
import { RACES, ARCHS, WEAPONS, BOSSES } from '@whs/core';
import { buildSprite, SPRITE_W, SPRITE_H, type Look } from '../../apps/game/src/art/sprite';
import { png } from './png';

const OUT = process.argv[2] || 'tools/art/out';
mkdirSync(OUT, { recursive: true });

/** A grid of sprites, each scaled up by `k`, on a checker-free mid background. */
function sheet(file: string, looks: Look[], cols: number, k = 3) {
  const cw = SPRITE_W * k + 8,
    ch = SPRITE_H * k + 8;
  const rows = Math.ceil(looks.length / cols);
  const W = cols * cw,
    H = rows * ch;
  const img = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) img.set([46, 40, 64, 255], i * 4);
  looks.forEach((L, n) => {
    const s = buildSprite(L);
    const ox = (n % cols) * cw + 4,
      oy = Math.floor(n / cols) * ch + 4;
    for (const layer of [s.body, s.arm])
      for (let y = 0; y < SPRITE_H; y++)
        for (let x = 0; x < SPRITE_W; x++) {
          const j = (y * SPRITE_W + x) * 4;
          const a = layer[j + 3]! / 255;
          if (!a) continue;
          for (let dy = 0; dy < k; dy++)
            for (let dx = 0; dx < k; dx++) {
              const o = ((oy + y * k + dy) * W + ox + x * k + dx) * 4;
              for (let c = 0; c < 3; c++) img[o + c] = img[o + c]! * (1 - a) + layer[j + c]! * a;
            }
        }
  });
  writeFileSync(`${OUT}/${file}`, png(W, H, img));
  console.log(`${OUT}/${file}`, looks.length);
}

const W0 = WEAPONS[0]!.n;
sheet('races.png', RACES.map((r, i) => ({ name: 'Sheet ' + i, race: r.n, arch: ARCHS[i % ARCHS.length]!.k, weapon: WEAPONS[(i * 7) % WEAPONS.length]!.n })), 10);
sheet('classes.png', ARCHS.map((a, i) => ({ name: 'Class ' + i, race: 'Human', arch: a.k, weapon: W0 })), 10);
sheet('weapons.png', WEAPONS.map((w, i) => ({ name: 'Wp ' + i, race: 'Human', arch: ARCHS[0]!.k, weapon: w.n })), 12, 2);
sheet('bosses.png', BOSSES.map((b) => ({ name: b.name, race: b.picks.race, rsub: b.picks.rsub, arch: b.picks.arch, weapon: b.picks.weapon, boss: b.name })), 10);

// close-ups: a few looks at 6x (npx tsx tools/art/sheet.ts <dir> zoom Race:arch:weapon ...)
if (process.argv[3] === 'zoom') {
  const looks = process.argv.slice(4).map((s, i) => {
    const [race, arch, weapon, name] = s.split(':');
    return { name: name || 'Zoom ' + i, race, arch, weapon } as Look;
  });
  sheet('zoom.png', looks, Math.min(6, looks.length), 6);
}
