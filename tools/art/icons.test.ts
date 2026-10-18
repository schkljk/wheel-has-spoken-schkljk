import { describe, expect, it } from 'vitest';
import { POWER_ALL } from '../../packages/core/src';
import { ICON_ART, ICON_SIZE, POWER_ICON, drawIcon } from '../../apps/game/src/art/icons';
import { CHIP_ICON } from '../../apps/game/src/ui/status-icons';

// The 16x16 icon set drawn in code (art/icons.ts).
describe('pixel icons', () => {
  it('every icon draws something that fills its square, the same way every time', () => {
    for (const name of Object.keys(ICON_ART)) {
      const a = drawIcon(name, '#9C6BFF')!;
      expect(a.px.length, name).toBe(ICON_SIZE * ICON_SIZE);
      const on = a.px.filter(Boolean).length;
      expect(on, `${name} has pixels`).toBeGreaterThan(40);
      expect(JSON.stringify(drawIcon(name, '#9C6BFF')), name).toBe(JSON.stringify(a));
    }
  });
  it('gear slot icons take the rarity color', () => {
    for (const slot of ['slot_armor', 'slot_helm', 'slot_boots', 'slot_gloves', 'slot_cape', 'slot_trinket'])
      expect(JSON.stringify(drawIcon(slot, '#E5484D')), slot).not.toBe(JSON.stringify(drawIcon(slot, '#3D8BFF')));
  });
  it('every power and every status chip has an icon that exists', () => {
    for (const p of POWER_ALL) if (p.k !== 'none') expect(ICON_ART[POWER_ICON[p.k] ?? ''], p.k).toBeTypeOf('function');
    for (const [k, n] of Object.entries(CHIP_ICON)) expect(ICON_ART[n], k).toBeTypeOf('function');
  });
});
