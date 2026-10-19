// Bakes the content icons every new fighter's first wheels show (races, classes, weapons, enchants) into one
// image, so the game doesn't draw them while it starts (4.7 s of work on a mid-range phone). Run after changing
// the sprite art: npm run bake. A test fails while the baked image is out of date.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bakeAtlas } from './bake-atlas';
import { png } from './png';

const out = resolve(import.meta.dirname, '../../apps/game/src/art/baked');
const { img, index } = bakeAtlas();
writeFileSync(resolve(out, 'content.png'), png(img.w, img.h, img.d));
writeFileSync(resolve(out, 'content.json'), JSON.stringify(index) + '\n');
console.log(`baked ${Object.keys(index.at).length} icons into ${img.w}x${img.h}`);
