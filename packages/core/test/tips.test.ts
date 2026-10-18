import { describe, expect, it } from 'vitest';
import { TIPS, defaultSettings, repair, newSave } from '../src';

// Upgrade 31: first-time tips instead of a tour up front.
describe('first-time tips', () => {
  it('each has a title, a plain explanation and a joke', () => {
    for (const [k, t] of Object.entries(TIPS)) {
      expect(t.e, k).toBeTruthy();
      expect(t.t.length, k).toBeGreaterThan(3);
      expect(t.d.length, k).toBeGreaterThan(40);
      expect(t.f.length, k).toBeGreaterThan(10);
      expect(t.d + t.f, k).not.toMatch(/undefined/);
    }
  });

  it('are on by default, and old saves get them on with none seen', () => {
    expect(defaultSettings()).toMatchObject({ tips: true, tipsSeen: [] });
    const s = newSave(0) as unknown as { settings: Record<string, unknown> };
    delete s.settings.tips;
    delete s.settings.tipsSeen;
    const r = repair(s as never);
    expect(r.save.settings).toMatchObject({ tips: true, tipsSeen: [] });
    const bad = newSave(0) as unknown as { settings: Record<string, unknown> };
    bad.settings.tipsSeen = [1, 2];
    expect(repair(bad as never).save.settings.tipsSeen).toEqual([]);
  });

  it('hit effects default to normal, and a broken value is put back (upgrade 33)', () => {
    expect(defaultSettings().fx).toBe('normal');
    const bad = newSave(0) as unknown as { settings: Record<string, unknown> };
    bad.settings.fx = 'explosive';
    expect(repair(bad as never).save.settings.fx).toBe('normal');
  });
});
