import { describe, expect, it } from 'vitest';
import { EMOJI_ICON } from '../../apps/game/src/art/emoji-px';
import { ICON_ART } from '../../apps/game/src/art/icons';
import { findEmojis } from '../../apps/game/src/ui/emoji';

// Every emoji on screen becomes a pixel icon (ui/emoji.ts): which characters count as emojis.
describe('emoji icons', () => {
  it('finds emojis, sequences included, and leaves plain symbols as text', () => {
    expect(findEmojis('Win it: 6 🪙. Defending 🏆')).toEqual(['🪙', '🏆']);
    expect(findEmojis('❤️❤️🖤. Record 3')).toEqual(['❤️', '❤️', '🖤']);
    expect(findEmojis('⚔️ An old rival 😈')).toEqual(['⚔️', '😈']);
    expect(findEmojis('👨‍🍳 and 🏴‍☠️')).toEqual(['👨‍🍳', '🏴‍☠️']);
    expect(findEmojis('★ Rare → ✓ done ✦ ⚠ 2 errors · 50%')).toEqual([]);
    expect(findEmojis('Plain words, digits 123 and #1')).toEqual([]);
  });
  it('every hand-drawn emoji icon exists', () => {
    for (const [e, name] of Object.entries(EMOJI_ICON)) expect(ICON_ART[name], `${e} -> ${name}`).toBeTypeOf('function');
  });
});
