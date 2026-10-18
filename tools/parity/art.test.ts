import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { mulberry32, randName, randomFighter } from '../../packages/core/src';
import { hashStr, lookOf, spriteKey, type Look } from '../../apps/game/src/art/sprite';

// The sprites themselves were redrawn in Phase 4 (tools/art/sprites.test.ts covers the new art). What still
// matches the legacy art code: how a name is hashed (it picks skin, hair and style), which fields of a fighter
// the art reads, and the cache key.
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../legacy/src');
const ctx = vm.createContext({ console });
vm.runInContext('const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));', ctx);
vm.runInContext(readFileSync(resolve(SRC, 'art_build.js'), 'utf8') + '\n' + readFileSync(resolve(SRC, 'art_sprite.js'), 'utf8'), ctx, {
  filename: 'art.js',
});
const legacy = <T>(name: string) => vm.runInContext(name, ctx) as T;
const legacyLookOf = legacy<(f: unknown) => Look>('lookOf');
const legacyKey = legacy<(L: Look) => string>('spriteKey');
const legacyHash = legacy<(s: unknown) => number>('hashStr');

describe('art inputs match legacy art_build.js', () => {
  it('hashes names the same way', () => {
    for (const s of ['', 'x', 'Gary', 'Sir Reginald the Unwashed', 'Ünïcødé 🐸', 'a'.repeat(300)]) expect(hashStr(s)).toBe(legacyHash(s));
  });
  it('reads the same fields from 400 random fighters, with the same cache keys', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const r = mulberry32(seed);
      const f = randomFighter(randName(r), r);
      const look = lookOf(f);
      expect(look, `lookOf seed ${seed}`).toEqual({ ...legacyLookOf(JSON.parse(JSON.stringify(f))) });
      expect(spriteKey(look)).toBe(legacyKey(look));
    }
  });
});
