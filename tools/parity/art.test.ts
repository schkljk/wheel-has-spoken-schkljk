import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { ARCHS, ENCHANTS, RACES, RSUB, WEAPONS, mulberry32, randName, randomFighter } from '../../packages/core/src';
import { SPRITE_H, SPRITE_W, buildSprite, hashStr, lookOf, spriteKey, type Look } from '../../apps/game/src/art/sprite';

// Legacy art (art_build.js + art_sprite.js, concatenated as assemble.py does) in its own vm context. The only
// outside binding it needs is core's clamp; toURL is swapped for one that returns the ImageData bytes.
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../legacy/src');
const ctx = vm.createContext({ console });
vm.runInContext('const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));', ctx);
vm.runInContext(readFileSync(resolve(SRC, 'art_build.js'), 'utf8') + '\n' + readFileSync(resolve(SRC, 'art_sprite.js'), 'utf8'), ctx, {
  filename: 'art.js',
});
vm.runInContext(
  `toURL = function (B) {
    const d = new Uint8ClampedArray(SW * SH * 4);
    for (let i = 0; i < SW * SH; i++) { const c = B.px[i]; if (!c) continue; d[i*4] = c[0]; d[i*4+1] = c[1]; d[i*4+2] = c[2]; d[i*4+3] = B.a[i]; }
    return d;
  };`,
  ctx,
);
const legacy = <T>(name: string) => vm.runInContext(name, ctx) as T;
interface LegacySprite {
  body: ArrayLike<number>;
  arm: ArrayLike<number>;
  sx: number;
  sy: number;
}
const legacyBuild = legacy<(L: Look) => LegacySprite>('buildBody');
const legacyLookOf = legacy<(f: unknown) => Look>('lookOf');
const legacyKey = legacy<(L: Look) => string>('spriteKey');
const legacyHash = legacy<(s: unknown) => number>('hashStr');

/** First differing pixel, or null when the buffers are identical. */
function firstDiff(a: ArrayLike<number>, b: ArrayLike<number>): string | null {
  if (a.length !== b.length) return `length ${a.length} vs ${b.length}`;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) {
      const p = i / 4,
        px = (o: ArrayLike<number>) => `rgba(${o[i]},${o[i + 1]},${o[i + 2]},${o[i + 3]})`;
      return `pixel (${p % SPRITE_W},${Math.floor(p / SPRITE_W)}): ${px(a)} vs legacy ${px(b)}`;
    }
  }
  return null;
}
const opaque = (a: ArrayLike<number>) => {
  let n = 0;
  for (let i = 3; i < a.length; i += 4) if (a[i]) n++;
  return n;
};

/** Builds a look in both renderers and requires identical bytes and pivots. */
function same(L: Look, label = JSON.stringify(L)) {
  const p = buildSprite(L);
  const l = legacyBuild({ ...L });
  expect(p.body.length).toBe(SPRITE_W * SPRITE_H * 4);
  expect(firstDiff(p.body, l.body), `body ${label}`).toBeNull();
  expect(firstDiff(p.arm, l.arm), `arm ${label}`).toBeNull();
  // legacy returns the pivot scaled to the 100x120 viewBox; the port returns sprite pixels
  expect((p.sx * 100) / SPRITE_W, `sx ${label}`).toBe(l.sx);
  expect((p.sy * 120) / SPRITE_H, `sy ${label}`).toBe(l.sy);
  expect(spriteKey(L)).toBe(legacyKey(L));
  expect(opaque(p.body), `empty body ${label}`).toBeGreaterThan(150);
  expect(opaque(p.arm), `empty arm ${label}`).toBeGreaterThan(5);
}

const pick = <T>(a: readonly T[], i: number) => a[i % a.length]!;
const ENCH = [undefined, ...ENCHANTS.map((e) => e.k)];

describe('pixel sprites match legacy art_sprite.js', () => {
  it('hashes names the same way', () => {
    for (const s of ['', 'x', 'Gary', 'Sir Reginald the Unwashed', 'Ünïcødé 🐸', 'a'.repeat(300)]) expect(hashStr(s)).toBe(legacyHash(s));
  });

  it('every race, with every sub-race and none', () => {
    let i = 0;
    for (const r of RACES) {
      for (const rsub of [undefined, ...(RSUB[r.n]?.items.map((s) => s.n) ?? [])]) {
        i++;
        same({ name: `${r.n} ${rsub ?? ''} ${i}`, race: r.n, rsub, arch: pick(ARCHS, i).k, weapon: pick(WEAPONS, i * 7).n, ench: pick(ENCH, i * 3) });
      }
    }
  });

  it('every archetype on every race', () => {
    let i = 0;
    for (const a of ARCHS)
      for (const r of RACES) {
        i++;
        same({ name: `N${i}`, race: r.n, arch: a.k, weapon: pick(WEAPONS, i).n, ench: pick(ENCH, i) });
      }
  });

  it('every weapon with every enchant (and none)', () => {
    let i = 0;
    for (const w of WEAPONS)
      for (const ench of ENCH) {
        i++;
        same({ name: `W${i}`, race: pick(RACES, i).n, arch: pick(ARCHS, i * 5).k, weapon: w.n, ench });
      }
    // unknown and missing weapons fall back to the default blade / the bare arm
    for (const weapon of [undefined, '', 'Mystery meat'])
      for (const race of ['Human', 'Slime', 'Ghost', 'Pigeon', 'Djinn', 'Snowman']) same({ name: 'odd', race, arch: 'npc', weapon, ench: 'flame' });
  });

  it('name hashes: skin tones, hair colors and styles, fox tails', () => {
    for (let k = 0; k < 60; k++) {
      same({ name: `Hash ${k}`, race: 'Human', arch: pick(['npc', 'monk', 'chosen', 'resilient'], k), weapon: 'Brick' });
      same({ name: `Fox ${k}`, race: 'Kitsune', arch: 'npc', weapon: 'Dagger' });
    }
    same({ race: 'Human', arch: 'npc' });
    same({ name: '', race: 'Elf', arch: 'nope', weapon: 'Bow' });
  });

  it('400 random fighters', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const r = mulberry32(seed);
      const f = randomFighter(randName(r), r);
      const look = lookOf(f);
      expect(look, `lookOf seed ${seed}`).toEqual({ ...legacyLookOf(JSON.parse(JSON.stringify(f))) });
      same(look, `seed ${seed} ${JSON.stringify(look)}`);
    }
  });
});
