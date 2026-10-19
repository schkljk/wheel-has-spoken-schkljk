import { describe, expect, it } from 'vitest';
import { COSMETICS, buyCosmetic, clockAt, newSave, owns, wearCosmetic, worn, mulberry32, type Game } from '../src';

// Review F11: earned looks for gems; nothing in a fight.
const game = (): Game => ({ save: newSave(0), F: null, rng: mulberry32(1), clock: clockAt(), pool: null, notes: [] });

describe('cosmetics', () => {
  it('have unique keys, a price, a joke, and colors where they need them', () => {
    expect(new Set(COSMETICS.map((c) => c.k)).size).toBe(COSMETICS.length);
    for (const c of COSMETICS) {
      expect(c.gems).toBeGreaterThan(0);
      expect(c.f.length).toBeGreaterThan(5);
      if (c.kind !== 'charm') expect(c.col!.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('cost gems, go on when bought, and swap freely', () => {
    const g = game();
    expect(buyCosmetic(g, 'rim_neon')).toBe(false);
    g.save.profile.gems = 20;
    expect(buyCosmetic(g, 'rim_neon')).toBe(true);
    expect(g.save.profile.gems).toBe(14);
    expect(worn(g, 'rim')?.k).toBe('rim_neon');
    // owned: no second purchase
    expect(buyCosmetic(g, 'rim_neon')).toBe(false);
    expect(buyCosmetic(g, 'rim_ruby')).toBe(true);
    wearCosmetic(g, 'rim', 'rim_neon');
    expect(worn(g, 'rim')?.k).toBe('rim_neon');
    wearCosmetic(g, 'rim', null);
    expect(worn(g, 'rim')).toBeNull();
    // can't wear what you don't own, or on the wrong slot
    wearCosmetic(g, 'charm', 'ch_crown');
    wearCosmetic(g, 'charm', 'rim_ruby');
    expect(worn(g, 'charm')).toBeNull();
    expect(owns(g, 'rim_ruby')).toBe(true);
  });
});
