import { describe, expect, it } from 'vitest';
import { ARCHS, RACES, RSUB, WEAPONS, mulberry32, randName, randomFighter } from '../../packages/core/src';
import { EGLOW, SPRITE_H, SPRITE_W, buildSprite, lookOf, type Look } from '../../apps/game/src/art/sprite';

// The Phase 4 sprites: every race, sub-race, class and weapon draws something sensible, the same way every time.
const opaque = (a: ArrayLike<number>) => {
  let n = 0;
  for (let i = 3; i < a.length; i += 4) if (a[i]) n++;
  return n;
};
/** lowest row with a pixel */
const bottom = (a: ArrayLike<number>) => {
  for (let y = SPRITE_H - 1; y >= 0; y--) for (let x = 0; x < SPRITE_W; x++) if (a[(y * SPRITE_W + x) * 4 + 3]) return y;
  return -1;
};
function sane(L: Look) {
  const s = buildSprite(L);
  const label = JSON.stringify(L);
  expect(s.body.length, label).toBe(SPRITE_W * SPRITE_H * 4);
  expect(opaque(s.body), `body ${label}`).toBeGreaterThan(500);
  expect(opaque(s.arm), `arm ${label}`).toBeGreaterThan(8);
  expect(s.sx, label).toBeGreaterThan(10);
  expect(s.sx, label).toBeLessThan(SPRITE_W - 10);
  expect(s.sy, label).toBeGreaterThan(10);
  expect(s.sy, label).toBeLessThan(SPRITE_H - 10);
  // everyone stands on the ground (ghosts and djinn float a little)
  expect(bottom(s.body), `feet ${label}`).toBeGreaterThanOrEqual(74);
  return s;
}
const pick = <T>(a: readonly T[], i: number) => a[i % a.length]!;

describe('fighter sprites', () => {
  it('every race, with every sub-race and none', () => {
    for (const r of RACES) {
      sane({ name: r.n, race: r.n, arch: 'npc', weapon: 'Dagger' });
      for (const s of RSUB[r.n]?.items ?? []) sane({ name: r.n + s.n, race: r.n, rsub: s.n, arch: 'brawler', weapon: 'Brick' });
    }
  });
  it('every class on every race', () => {
    for (const r of RACES) for (const a of ARCHS) sane({ name: `${r.n} ${a.k}`, race: r.n, arch: a.k, weapon: 'Spear' });
  });
  it('every weapon with every enchant, and each weapon looks like itself', () => {
    const base: Look = { name: 'Armory', race: 'Human', arch: 'npc' };
    const arms = new Set<string>();
    for (const w of WEAPONS) {
      const plain = sane({ ...base, weapon: w.n });
      arms.add(Array.from(plain.arm).join(','));
      for (const e of Object.keys(EGLOW)) {
        const glow = sane({ ...base, weapon: w.n, ench: e });
        if (w.n !== 'Bare fists') expect(opaque(glow.arm), `${w.n} ${e} glows`).toBeGreaterThan(opaque(plain.arm));
      }
    }
    expect(arms.size).toBe(WEAPONS.length);
  });
  it('is the same every time, and names give variety', () => {
    const L: Look = { name: 'Gary', race: 'Human', arch: 'monk', weapon: 'Bat', ench: 'flame' };
    expect(Array.from(buildSprite(L).body)).toEqual(Array.from(buildSprite({ ...L }).body));
    const looks = new Set<string>();
    for (let k = 0; k < 40; k++) looks.add(Array.from(buildSprite({ name: `Person ${k}`, race: 'Human', arch: 'npc', weapon: 'Brick' }).body).join(','));
    expect(looks.size).toBeGreaterThan(30);
  });
  it('odd input: unknown races, classes and weapons, no name', () => {
    sane({ race: 'Human', arch: 'npc' });
    sane({ name: '', race: 'Elf', arch: 'nope', weapon: 'Mystery meat' });
    sane({ name: 'x', race: 'Space lobster', arch: 'mage', weapon: undefined });
  });
  it('400 random fighters, fast enough to draw on demand', () => {
    const t = performance.now();
    for (let seed = 1; seed <= 400; seed++) {
      const r = mulberry32(seed);
      sane(lookOf(randomFighter(randName(r), r)));
    }
    // a sprite is drawn once and cached; this only guards against something pathological
    expect((performance.now() - t) / 400).toBeLessThan(60);
  });
  void pick;
});
