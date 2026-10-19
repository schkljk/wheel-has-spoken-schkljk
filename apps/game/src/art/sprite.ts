// Fighter sprites: 70x84 pixel art drawn in code (the Phase 4 art pass, which replaced the port of the legacy
// sprites), rendered at two real pixels per art pixel so curves, outlines and shading come out fine.
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

/**
 * Builds both sprite layers for a look. Needs `look.race` (unknown races are drawn as humans). Deterministic: the
 * name hash picks the skin tone (humans), hair color and hair style.
 */
// The page's images, the fight's textures and the portraits all ask for the same fighter, often within a second:
// it used to be drawn three times. The last few builds are kept (least recently used goes first; each is about
// 0.75 MB of pixels, so only a few).
const BUILT = new Map<string, SpriteLayers>();
const BUILT_MAX = 8;
/** A fighter's sprite layers (shared: never change the arrays). */
export function buildSprite(L: Look): SpriteLayers {
  const k = spriteKey(L);
  const hit = BUILT.get(k);
  if (hit) {
    BUILT.delete(k);
    BUILT.set(k, hit);
    return hit;
  }
  const s = drawSprite(L);
  BUILT.set(k, s);
  if (BUILT.size > BUILT_MAX) BUILT.delete(BUILT.keys().next().value!);
  return s;
}

function drawSprite(L: Look): SpriteLayers {
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
  const B = buf(SW, SH, SPRITE_S),
    A = buf(SW, SH, SPRITE_S);
  const arm = race.plan ? CREATURE[race.plan](B, A, c) : humanoid(B, A, c);
  // the weapon goes in first so the hand closes over its grip
  weapon(A, L.weapon, L.ench, arm.hx, arm.hy);
  arm.draw();
  if (L.boss) bossDress(B, L.boss);
  outline(B);
  outline(A);
  return { body: toRGBA(B), arm: toRGBA(A), sx: arm.sx, sy: arm.sy, hx: arm.hx, hy: arm.hy };
}
