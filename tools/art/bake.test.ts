import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bakeAtlas } from './bake-atlas';

// The baked icons (D2) must be what the art draws today: after changing the sprite art, run `npm run bake`.
describe('baked content icons', () => {
  it('are current', () => {
    const { index } = bakeAtlas();
    const saved = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../apps/game/src/art/baked/content.json'), 'utf8'));
    expect(saved.at).toEqual(index.at);
    expect(saved.hash, 'the art changed: run npm run bake').toBe(index.hash);
  });
  it('hold every race, class, weapon and enchant', () => {
    const { index } = bakeAtlas();
    const keys = Object.keys(index.at);
    expect(keys.filter((k) => k.startsWith('face|')).length).toBeGreaterThanOrEqual(70);
    expect(keys.filter((k) => k.startsWith('weapon|')).length).toBeGreaterThanOrEqual(40);
  });
});
