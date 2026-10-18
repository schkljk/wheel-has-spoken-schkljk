import { describe, expect, it } from 'vitest';
import { SLICE_COLORS, bulb, sliceMask, wheelFace, wheelHub, wheelPointer, wheelRim } from '../../apps/game/src/art/wheel-art';

// The wheels in pixel art (art/wheel-art.ts).
const opaque = (d: Uint8ClampedArray) => {
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
  return n;
};
describe('pixel wheels', () => {
  it('the face fills its disc around the hub hole, the same way every time', () => {
    const spans = [1, 2, 1.5, Math.PI * 2 - 4.5];
    const cols = spans.map((_, i) => SLICE_COLORS[i % 4]![i % 2]!);
    const f = wheelFace(100, spans, cols, 0.2);
    const disc = Math.PI * 50 * 50 * (1 - 0.04);
    expect(opaque(f.d)).toBeGreaterThan(disc * 0.95);
    expect(opaque(f.d)).toBeLessThan(disc * 1.05);
    expect(wheelFace(100, spans, cols, 0.2).d).toEqual(f.d);
    // the middle is left for the hub
    const mid = (50 * 100 + 50) * 4 + 3;
    expect(f.d[mid]).toBe(0);
  });
  it('a slice mask covers just its slice', () => {
    const half = sliceMask(80, 0, Math.PI, 0.2);
    const full = sliceMask(80, 0, Math.PI * 2, 0.2);
    expect(Math.abs(opaque(half.d) * 2 - opaque(full.d))).toBeLessThan(opaque(full.d) * 0.06);
  });
  it('the rim, bulbs, pointer and hub all draw', () => {
    expect(opaque(wheelRim(100, 7).d)).toBeGreaterThan(1500);
    expect(opaque(bulb(true, 3).d)).toBeGreaterThan(opaque(bulb(false, 3).d));
    const pt = wheelPointer(11);
    expect(opaque(pt.d)).toBeGreaterThan(60);
    expect(pt.py).toBeLessThan(pt.h / 2);
    expect(opaque(wheelHub(22).d)).toBeGreaterThan(300);
  });
});
