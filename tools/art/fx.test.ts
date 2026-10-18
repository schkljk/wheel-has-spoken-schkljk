import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../../packages/core/src';
import { FX_NAMES, fxArt } from '../../apps/game/src/art/fx-art';
import { WEAPON_STYLE, weaponStyle } from '../../apps/game/src/pixi/weapon-style';
import { buf, dot, fine, has, ln, paint, ell, RP, toRGBA, BASE } from '../../apps/game/src/art/px';

const opaque = (a: ArrayLike<number>) => {
  let n = 0;
  for (let i = 3; i < a.length; i += 4) if (a[i]) n++;
  return n;
};

describe('fight effects', () => {
  it('every effect sprite draws something, the same way every time', () => {
    for (const n of FX_NAMES) {
      const r = fxArt(n)!;
      expect(r.d.length, n).toBe(r.w * r.h * 4);
      expect(opaque(r.d), n).toBeGreaterThan(20);
    }
    expect(fxArt('orb', '#FF0000')).not.toBe(fxArt('orb', '#00FF00'));
    expect(fxArt('nope')).toBeNull();
  });
  it('every weapon is used its own way (bows shoot, crossbows too, nothing ranged gets swung)', () => {
    for (const w of WEAPONS) expect(WEAPON_STYLE[w.n], w.n).toBeDefined();
    expect(weaponStyle('Crossbow')).toBe('shoot');
    expect(weaponStyle('Bow')).toBe('shoot');
    expect(weaponStyle('Laser rifle')).toBe('beam');
    for (const n of ['Shuriken', 'Chakram', 'Boomerang', 'Brick']) expect(weaponStyle(n), n).toBe('throw');
    for (const w of WEAPONS) if (w.t?.includes('ranged')) expect(['shoot', 'beam', 'throw'], w.n).toContain(weaponStyle(w.n));
    // a weapon added later falls back on its tags
    expect(weaponStyle('Mystery meat')).toBe('fists');
  });
});

describe('pixel engine at two pixels per art pixel', () => {
  it('draws the same shapes at the same coordinates, finer', () => {
    const a = buf(10, 10),
      b = buf(10, 10, 2);
    for (const B of [a, b]) paint(B, ell(5, 5, 3, 3), 1, 1, 9, 9, RP('#3D8BFF'), { bv: 2 });
    expect(b.w).toBe(20);
    // every art pixel drawn at 1x is drawn at 2x (judged at its center), and the 2x one has more edge detail
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) expect(has(b, x, y), `${x},${y}`).toBe(has(a, x, y));
    expect(opaque(toRGBA(b))).toBeGreaterThan(opaque(toRGBA(a)) * 3);
  });
  it('dots fill whole art pixels, fine pixels and lines are one real pixel', () => {
    const B = buf(4, 4, 2);
    dot(B, 1, 1, RP('#FFFFFF'), BASE);
    expect(opaque(toRGBA(B))).toBe(4);
    fine(B, 3, 3, [255, 0, 0]);
    expect(opaque(toRGBA(B))).toBe(5);
    const L = buf(8, 2, 2);
    // from the middle of the first art pixel to the middle of the last
    ln(L, 0, 0, 7, 0, RP('#FFFFFF'));
    expect(opaque(toRGBA(L))).toBe(15);
  });
});
