// The content icons' pixels (a race's or class's face, a weapon on its own), without a canvas: the page turns
// them into canvases (portraits.ts), and the art tools bake the common ones into one image ahead of time
// (tools/art/bake.ts), so the first wheels don't have to draw a hundred faces while the game starts.
//
// Pure: no DOM.

import { ARCHS, ENCHANTS, RACES, WEAPONS } from '@whs/core';
import { buf, outline, toRGBA } from './px';
import { SPRITE_PH, SPRITE_PW, SPRITE_S, buildSprite, type Look } from './sprite';
import { weapon } from './sprite-weapons';
import type { Rgba } from './wheel-art';
import { archLook, cropRGBA, faceKey, raceLook, weaponKey } from './content-keys';

export * from './content-keys';

/** A face: the top of the sprite (the whole thing for pigeons and rubber ducks), in plain clothes unless a class is given. */
export const faceRGBA = (look: Look, rows = 30) =>
  cropRGBA(buildSprite({ name: look.race || 'x', arch: 'npc', ...look, weapon: 'Bare fists' }).body, SPRITE_PW, SPRITE_PH, rows * SPRITE_S);

/** A weapon on its own (with its enchant's glow), held at an angle. */
export function weaponRGBA(name: string, ench?: string) {
  const B = buf(40, 40, SPRITE_S);
  weapon(B, name, ench, 10, 31);
  outline(B);
  return cropRGBA(toRGBA(B), B.w, B.h);
}

/** The icons every new fighter's first wheels show (race, class, weapon, enchant), by cache key. */
export function bakedIcons(): [key: string, draw: () => Rgba | null][] {
  return [
    ...RACES.map((r): [string, () => Rgba | null] => [faceKey(raceLook(r.n)), () => faceRGBA(raceLook(r.n))]),
    ...ARCHS.map((a): [string, () => Rgba | null] => [faceKey(archLook(a.k)), () => faceRGBA(archLook(a.k))]),
    ...WEAPONS.filter((w) => w.n !== 'Bare fists').map((w): [string, () => Rgba | null] => [weaponKey(w.n), () => weaponRGBA(w.n)]),
    ...ENCHANTS.filter((e) => e.k && e.k !== 'none').map((e): [string, () => Rgba | null] => [weaponKey('Sword', e.k), () => weaponRGBA('Sword', e.k)]),
  ];
}

