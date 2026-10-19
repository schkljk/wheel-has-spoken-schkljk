// What the page needs to know about a fighter's sprite without drawing one: the look (from a fighter), the cache
// key, sizes and colors. The drawing code (sprite.ts and its parts, about 55 KB) loads on its own, a moment after
// the first screen (sprite-lazy.ts); this stays in the first chunk. Pure.

import type { Look } from './sprite-data';
import { SH, SW } from './sprite-dims';

export type { Look };

/** The sprite's size in art pixels (the coordinates everything is drawn in). */
export const SPRITE_W = SW;
export const SPRITE_H = SH;
/** Real pixels per art pixel, each way. */
export const SPRITE_S = 2;
/** The size of the RGBA layers, in real pixels. */
export const SPRITE_PW = SW * SPRITE_S;
export const SPRITE_PH = SH * SPRITE_S;

type Named = { n?: string } | null | undefined;
type Keyed = { k?: string } | null | undefined;
/** The parts of a fighter lookOf reads (a core `Fighter` fits). */
export interface LookSource {
  name?: string;
  race?: Named;
  rsub?: Named;
  arch?: Keyed;
  size?: Named;
  weapon?: Named;
  power?: Keyed;
  ench?: Keyed;
  isBoss?: boolean;
}

export function lookOf(f: LookSource): Look {
  return {
    name: f.name,
    race: f.race?.n,
    rsub: f.rsub?.n,
    arch: f.arch?.k,
    size: f.size?.n,
    weapon: f.weapon?.n,
    power: f.power?.k,
    ench: f.ench?.k,
    ...(f.isBoss && f.name ? { boss: f.name } : {}),
  };
}

/** Cache key: the fields that change the pixels (size and power are drawn around the sprite, not in it). */
export const spriteKey = (L: Look) => [L.name, L.race, L.rsub, L.arch, L.weapon, L.ench].join('|') + (L.boss ? '|boss' : '');

/** Outline ink used by the mystery silhouette. */
export const OL = '#1A1328';
/** Height scale per size wheel result (used when a sprite is drawn "sized"). */
export const SIZE_H: Record<string, number> = { Tiny: 0.72, Small: 0.86, Average: 1, Large: 1.1, Huge: 1.2, Colossal: 1.32 };
/** Ground aura color per power key. */
export const PAURA: Record<string, string> = {
  fire: '#FF7A2F', ice: '#7FE3FF', lightning: '#FFE14D', water: '#3D8BFF', shadow: '#1B0B2E', light: '#FFE082', tk: '#A1887F',
  mind: '#FF4FD8', tele: '#B388FF', regen: '#4CD964', luck: '#7CB342', poison: '#B6F23B', gravity: '#6B2FBF', clones: '#B0BEC5',
  shape: '#26A69A', time: '#CFD8DC', reality: '#FF4F8B', negate: '#E53935', smite: '#FFD54F', ward: '#FFF3B0', miracle: '#FFFDE7',
  drain: '#B71C1C', chains: '#37474F', arcane: '#B388FF', earth: '#A1887F', wind: '#CFF4FF', sonic: '#FFD180', vines: '#66BB6A',
  boom: '#FF7043', magnet: '#B0BEC5', illusion: '#E1BEE7', summon: '#9575CD',
};

export interface SpriteLayers {
  /** body layer, RGBA bytes, SPRITE_PW x SPRITE_PH */
  body: Uint8ClampedArray;
  /** near arm + weapon layer, same size; it swings around (sx, sy) */
  arm: Uint8ClampedArray;
  /** arm pivot (the shoulder) in art pixels */
  sx: number;
  sy: number;
  /** the weapon hand, in art pixels (with the arm at rest) */
  hx: number;
  hy: number;
}
