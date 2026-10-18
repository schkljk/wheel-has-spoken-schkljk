import { describe, expect, it } from 'vitest';
import { BOSSES, CHAPTERS, type NodeKind } from '../../packages/core/src';
import { bossLook, mapLayout, renderMap } from '../../apps/game/src/art/map-art';
import { DECO, drawDeco } from '../../apps/game/src/art/map-deco';
import { MAP_THEMES, mapTheme } from '../../apps/game/src/art/map-themes';
import { buildSprite } from '../../apps/game/src/art/sprite';

// The chapter maps (art/map-*.ts): a themed landscape, a road forking at every step, the boss's lair at the end.
const ROWS: NodeKind[][] = [['fight'], ['fight', 'elite'], ['event', 'rest', 'shop'], ['fight'], ['treasure', 'nemesis'], ['fight', 'elite'], ['boss']];

describe('chapter maps', () => {
  it('every chapter has a theme, and every piece of scenery a theme uses exists and draws', () => {
    expect(MAP_THEMES.length).toBe(CHAPTERS.length);
    for (const T of MAP_THEMES)
      for (const d of T.deco) {
        expect(DECO[d], d).toBeDefined();
        const r = drawDeco(d, () => 0.5)!;
        expect(r.B.c.filter(Boolean).length, `${d} has pixels`).toBeGreaterThan(8);
      }
  });
  it('the stops sit inside the map, one step above the other, with the boss at the top', () => {
    for (const w of [320, 390, 430, 844, 1440]) {
      const L = mapLayout(ROWS, w, 7);
      expect(L.W * L.k).toBeGreaterThanOrEqual(w);
      for (const row of L.stops)
        for (const n of row) {
          expect(n.x, `x at ${w}`).toBeGreaterThan(4);
          expect(n.x, `x at ${w}`).toBeLessThan(L.W - 4);
        }
      for (let r = 1; r < L.stops.length; r++) expect(L.stops[r]![0]!.y).toBeLessThan(L.stops[r - 1]![0]!.y);
      expect(L.stops.at(-1)![0]!.k).toBe('boss');
      expect(L.stops.at(-1)![0]!.y).toBeGreaterThan(20);
    }
  });
  it('paints every chapter the same way every time, and differently from the next chapter', () => {
    const L = mapLayout(ROWS, 390, 7);
    const sig = (ch: number) => {
      const I = renderMap(L, ch, { row: 2, picks: [0, 1] }, 7);
      let h = 0;
      for (let i = 0; i < I.d.length; i += 7) h = (h * 31 + I.d[i]!) | 0;
      return h;
    };
    const seen = new Set<number>();
    for (let ch = 1; ch <= CHAPTERS.length; ch++) {
      const a = sig(ch);
      expect(sig(ch), `chapter ${ch} is stable`).toBe(a);
      seen.add(a);
      const I = renderMap(L, ch, { row: 0, picks: [] }, 7);
      // every pixel is painted
      for (let i = 3; i < I.d.length; i += 4 * 97) expect(I.d[i], `chapter ${ch} alpha`).toBe(255);
    }
    expect(seen.size).toBe(CHAPTERS.length);
    expect(mapTheme(99)).toBe(MAP_THEMES.at(-1));
  });
  it('every boss stands on its map as its own sprite', () => {
    for (let ch = 1; ch <= BOSSES.length; ch++) {
      const look = bossLook(ch);
      expect(look.boss).toBe(BOSSES[ch - 1]!.name);
      expect(buildSprite(look).body.some((v, i) => i % 4 === 3 && v > 0), BOSSES[ch - 1]!.name).toBe(true);
    }
  });
});
