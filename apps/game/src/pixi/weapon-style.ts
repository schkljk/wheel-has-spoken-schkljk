// Which way each weapon is used in a fight (pixi/attacks.ts plays them). Pure: no Pixi, so tests can check that
// every weapon has one.

import { WEAPONS } from '@whs/core';

export type Style =
  | 'slash'
  | 'heavy'
  | 'reap'
  | 'thrust'
  | 'smash'
  | 'bonk'
  | 'swing'
  | 'flop'
  | 'fists'
  | 'flurry'
  | 'whip'
  | 'rod'
  | 'cast'
  | 'saw'
  | 'shoot'
  | 'beam'
  | 'throw'
  | 'riff';

/** Each weapon's way of hitting. New weapons fall back on their tags (ranged shoots, blades slash, blunt smashes). */
export const WEAPON_STYLE: Record<string, Style> = {
  'Bare fists': 'fists',
  'Wet noodle': 'flop',
  'Pool noodle': 'flop',
  'Rubber chicken': 'smash',
  'Frying pan': 'bonk',
  'Golden frying pan': 'bonk',
  'Giant lollipop': 'bonk',
  Brick: 'throw',
  'Baseball bat': 'swing',
  Dagger: 'thrust',
  Spear: 'thrust',
  Trident: 'thrust',
  'Harpoon spear': 'thrust',
  Rapier: 'thrust',
  Katana: 'slash',
  'Cursed blade': 'slash',
  Greatsword: 'heavy',
  'Planet-cracker axe': 'heavy',
  Scythe: 'reap',
  'War hammer': 'smash',
  Sledgehammer: 'smash',
  'Electric guitar': 'riff',
  Chainsaw: 'saw',
  Bow: 'shoot',
  Crossbow: 'shoot',
  'Laser rifle': 'beam',
  Shuriken: 'throw',
  Chakram: 'throw',
  Boomerang: 'throw',
  'Uno reverse card': 'throw',
  Whip: 'whip',
  'Fishing rod': 'rod',
  Nunchucks: 'flurry',
  'Bo staff': 'flurry',
  'Magic staff': 'cast',
};
export function weaponStyle(name: string | undefined): Style {
  if (name && WEAPON_STYLE[name]) return WEAPON_STYLE[name]!;
  const t = new Set(WEAPONS.find((w) => w.n === name)?.t ?? []);
  return t.has('ranged') ? 'shoot' : t.has('blade') ? 'slash' : t.has('blunt') ? 'smash' : 'fists';
}
