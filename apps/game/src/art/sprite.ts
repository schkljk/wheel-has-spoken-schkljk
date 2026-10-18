// Fighter sprites: 70x84 pixel art drawn in code (the Phase 4 art pass, which replaced the port of the legacy
// sprites).
//
// Chunky, big-headed proportions that read at a glance on a phone. Every part is a shape whose shading comes
// from its own volume, lit from the top left and quantized into six hue-shifted tones per material (px.ts).
// Parts in front get a crease line in the darker tone of what's behind them; the silhouette gets a colored
// outline. Faces have a mood per class. The weapon arm is a separate layer that swings around the shoulder.
//
// Pure: no DOM, no randomness (the name is hashed). Turning the buffers into images lives in sprite-dom.ts.

import { hashStr } from '@whs/core';
import { RP, buf, outline, toRGBA } from './px';
import { bossDress } from './sprite-boss';
import { humanoid } from './sprite-body';
import { CREATURE } from './sprite-creatures';
import { HAIRS, HSKIN, OUT, RACE_SP, SH, SUBCOL, SW, own, type Ctx, type Look } from './sprite-data';
import { weapon } from './sprite-weapons';

export { hashStr };
export type { Look };
export { EGLOW } from './sprite-weapons';
export { ramp, type RGB, type Ramp } from './px';

export const SPRITE_W = SW;
export const SPRITE_H = SH;

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
  /** body layer, RGBA bytes, SPRITE_W x SPRITE_H */
  body: Uint8ClampedArray;
  /** near arm + weapon layer, same size; it swings around (sx, sy) */
  arm: Uint8ClampedArray;
  /** arm pivot (the shoulder) in sprite pixels */
  sx: number;
  sy: number;
}

/**
 * Builds both sprite layers for a look. Needs `look.race` (unknown races are drawn as humans). Deterministic: the
 * name hash picks the skin tone (humans), hair color and hair style.
 */
export function buildSprite(L: Look): SpriteLayers {
  const race = own(RACE_SP, L.race) || RACE_SP.Human!,
    out = own(OUT, L.arch) || OUT.npc!,
    hs = hashStr(L.name || 'x');
  const skinHex = own(SUBCOL, L.race + '/' + L.rsub) || (L.race === 'Human' || !race.skin ? HSKIN[hs % HSKIN.length]! : race.skin);
  const c: Ctx = {
    L,
    race,
    out,
    hs,
    skinHex,
    S: RP(skinHex),
    O1: RP(out.c),
    O2: RP(out.c2),
    HAIR: RP(race.hairCol || HAIRS[(hs >> 3) % HAIRS.length]!),
  };
  const B = buf(SW, SH),
    A = buf(SW, SH);
  const arm = race.plan ? CREATURE[race.plan](B, A, c) : humanoid(B, A, c);
  // the weapon goes in first so the hand closes over its grip
  weapon(A, L.weapon, L.ench, arm.hx, arm.hy);
  arm.draw();
  if (L.boss) bossDress(B, L.boss);
  outline(B);
  outline(A);
  return { body: toRGBA(B), arm: toRGBA(A), sx: arm.sx, sy: arm.sy };
}
