import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../packages/core/src';
import { buildSprite, lookOf, spriteKey, type Look } from '../../apps/game/src/art/sprite';

// Upgrade 38: every story boss has a silhouette of their own on top of their build.
const lookFor = (b: (typeof BOSSES)[number]): Look => ({ name: b.name, race: b.picks.race, rsub: b.picks.rsub, arch: b.picks.arch, size: b.picks.size, weapon: b.picks.weapon, power: b.picks.power, ench: b.picks.ench });
const opaque = (a: ArrayLike<number>) => {
  let n = 0;
  for (let i = 3; i < a.length; i += 4) if (a[i]) n++;
  return n;
};

describe('boss silhouettes', () => {
  it('give every boss something extra, without touching the weapon arm', () => {
    for (const b of BOSSES) {
      const plain = buildSprite(lookFor(b));
      const boss = buildSprite({ ...lookFor(b), boss: b.name });
      expect(opaque(boss.body) - opaque(plain.body), b.name).toBeGreaterThan(8);
      expect(Array.from(boss.arm), b.name).toEqual(Array.from(plain.arm));
    }
  });
  it('only apply to fighters flagged as bosses, and cache apart', () => {
    const b = BOSSES[0]!;
    const f = { name: b.name, race: { n: b.picks.race }, arch: { k: b.picks.arch } };
    expect(lookOf(f).boss).toBeUndefined();
    expect(lookOf({ ...f, isBoss: true }).boss).toBe(b.name);
    expect(spriteKey(lookOf({ ...f, isBoss: true }))).not.toBe(spriteKey(lookOf(f)));
  });
});
