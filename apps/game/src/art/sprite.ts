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
import { SPRITE_S, spriteKey, type SpriteLayers } from './sprite-look';
import { weapon } from './sprite-weapons';

export { hashStr };
export { EGLOW } from './sprite-weapons';
export { ramp, type RGB, type Ramp } from './px';

export * from './sprite-look';

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
