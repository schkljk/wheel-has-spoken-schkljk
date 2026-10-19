// The building blocks of the fight's attack animations: the stage they play on (a slice of FightScene), the
// effect sprites as textures, and small moves (fly, beam, bolt, pillar, fade, pop) that the weapon and power
// choreographies in attacks.ts are made of.

import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { fxArt, type FxRgba } from '../art/fx-art';
import { weaponCanvas, iconCanvas } from '../art/portraits';
import type { FightDims } from './dims';
import type { FighterView } from './fighter-view';
import { ease, type Tweens } from './tween';
import { canvasTexture } from './tex';

export interface Pt {
  x: number;
  y: number;
}
/** What the attack animations need from the fight scene. */
export interface Stage {
  readonly fx: Container;
  readonly tw: Tweens;
  readonly F: [FighterView, FighterView];
  readonly homes: [number, number];
  readonly sp: number;
  readonly reduced: boolean;
  readonly fxK: number;
  readonly dims: FightDims;
  ctr(i: 0 | 1): { x: number; y: number; top: number };
  hand(i: 0 | 1): Pt;
  particles(x: number, y: number, colors: number[], n: number, spread?: number): void;
  ring(x: number, y: number, color: number, size?: number): void;
  shake(amp: number, dur: number): Promise<unknown>;
  tintFlash(k: string | undefined, dur: number): void;
  flash(i: 0 | 1, peak: number, dur: number, squash?: boolean): Promise<void>;
  knockback(i: 0 | 1, amt: number): Promise<void>;
  windUp(i: 0 | 1): Promise<void>;
  armTo(i: 0 | 1, angles: number[], dur: number): Promise<void>;
  hitStop(ms: number): Promise<void>;
}

// ---------------------------------------------------------------- textures
const texCache = new Map<string, Texture>();
function rgbaTex(r: FxRgba): Texture {
  const cv = document.createElement('canvas');
  cv.width = r.w;
  cv.height = r.h;
  const x = cv.getContext('2d')!;
  const id = x.createImageData(r.w, r.h);
  id.data.set(r.d);
  x.putImageData(id, 0, 0);
  return canvasTexture(cv);
}
/** An effect sprite's texture (art/fx-art.ts), made once. */
export function fxTex(name: string, hex?: string): Texture {
  const key = 'fx|' + name + '|' + (hex ?? '');
  let t = texCache.get(key);
  if (!t) {
    const r = fxArt(name, hex);
    t = r ? rgbaTex(r) : Texture.WHITE;
    texCache.set(key, t);
  }
  return t;
}
function canvasTex(key: string, cv: HTMLCanvasElement | null): Texture {
  let t = texCache.get(key);
  if (!t) {
    t = cv ? canvasTexture(cv) : Texture.WHITE;
    texCache.set(key, t);
  }
  return t;
}
/** A weapon on its own (thrown ones fly as themselves). */
export const weaponTex = (name: string, ench?: string) => canvasTex(`wp|${name}|${ench ?? ''}`, weaponCanvas(name, ench));
/** A pixel icon at twice the detail. */
export const iconTex = (name: string) => canvasTex(`ic|${name}`, iconCanvas(name, 2));

// ---------------------------------------------------------------- pieces
/** Screen px per effect-art pixel: the same as the fighters' (84 art pixels tall). */
export const artK = (S: Stage) => S.dims.chH / 84;

/** A sprite in the effects layer, centered, scaled to the fighters. */
export function piece(S: Stage, tex: Texture, at: Pt, k = 1): Sprite {
  const sp = new Sprite(tex);
  sp.anchor.set(0.5);
  sp.scale.set(artK(S) * k * 0.5);
  sp.position.set(at.x, at.y);
  S.fx.addChild(sp);
  return sp;
}
/** A Graphics in the effects layer. */
export function gfx(S: Stage, at?: Pt): Graphics {
  const g = new Graphics();
  if (at) g.position.set(at.x, at.y);
  S.fx.addChild(g);
  return g;
}
/** Fades something out (growing or rising a little) and removes it. */
export function fade(S: Stage, o: Container, dur: number, grow = 0, rise = 0) {
  const s0x = o.scale.x,
    s0y = o.scale.y,
    y0 = o.y,
    a0 = o.alpha;
  return S.tw
    .run(dur * S.sp, (k) => {
      o.alpha = a0 * (1 - k);
      o.scale.set(s0x * (1 + grow * k), s0y * (1 + grow * k));
      o.y = y0 - rise * k;
    }, ease.out)
    .then(() => o.destroy());
}
/** Pops something in with a little overshoot. */
export function popIn(S: Stage, o: Container, dur = 160) {
  const sx = o.scale.x,
    sy = o.scale.y;
  return S.tw.run(dur * S.sp, (k) => o.scale.set(sx * ease.back(k), sy * ease.back(k)));
}

export interface FlyOpts {
  /** height of the arc at the middle (px, up) */
  arc?: number;
  /** turns while flying */
  spin?: number;
  /** points where it goes */
  face?: boolean;
  /** a trail of dots in this color */
  trail?: number;
  /** a trail of these particle colors instead (embers, sparkles) */
  embers?: number[];
  ease?: (k: number) => number;
  /** sideways curve (px, + is down), for boomerangs and missiles */
  bend?: number;
}
/** Flies a piece from a to b. */
export function fly(S: Stage, o: Container, a: Pt, b: Pt, dur: number, f: FlyOpts = {}) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len,
    ny = dx / len;
  const arc = f.arc ?? 0,
    bend = f.bend ?? 0;
  const r0 = o.rotation;
  let last = 0;
  const at = (k: number) => {
    const h = 4 * k * (1 - k);
    return { x: a.x + dx * k + nx * bend * h, y: a.y + dy * k - arc * h + ny * bend * h };
  };
  o.position.set(a.x, a.y);
  return S.tw.run(
    dur * S.sp,
    (k) => {
      const p = at(k);
      if (f.face) {
        const q = at(Math.min(1, k + 0.02));
        const r = at(Math.max(0, k - 0.02));
        o.rotation = Math.atan2(q.y - r.y, q.x - r.x);
      } else if (f.spin) o.rotation = r0 + f.spin * Math.PI * 2 * k;
      o.position.set(p.x, p.y);
      if ((f.trail != null || f.embers) && !S.reduced && k - last > 0.07) {
        last = k;
        if (f.embers) S.particles(p.x, p.y, f.embers, 2, 10);
        else {
          const d = new Graphics().rect(-3, -3, 6, 6).fill({ color: f.trail!, alpha: 0.85 });
          d.position.set(p.x, p.y);
          d.rotation = Math.PI / 4;
          S.fx.addChildAt(d, 0);
          void S.tw.run(260, (u) => {
            d.scale.set(1 - 0.8 * u);
            d.alpha = 0.85 * (1 - u);
          }).then(() => d.destroy());
        }
      }
    },
    f.ease ?? ease.linear,
  );
}

/** A straight beam from a to b: a wide glow and a hot core, flickering. */
export function beam(S: Stage, a: Pt, b: Pt, color: number, w: number, dur: number) {
  const g = gfx(S);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  g.position.set(a.x, a.y);
  g.rotation = Math.atan2(b.y - a.y, b.x - a.x);
  return S.tw
    .run(dur * S.sp, (k) => {
      const f = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * (0.85 + 0.15 * Math.sin(k * 60));
      const ww = w * (0.4 + 0.6 * f);
      g.clear()
        .rect(0, -ww, len, ww * 2)
        .fill({ color, alpha: 0.45 * f })
        .rect(0, -ww * 0.4, len, ww * 0.8)
        .fill({ color: 0xffffff, alpha: 0.95 * f });
    })
    .then(() => g.destroy());
}

/** A jagged bolt between a and b (a new path every few frames). */
export function zap(S: Stage, a: Pt, b: Pt, color: number, w: number, dur: number, jag = 18) {
  const g = gfx(S);
  const path = () => {
    const n = 7;
    const pts: Pt[] = [a];
    for (let i = 1; i < n; i++) {
      const k = i / n;
      pts.push({ x: a.x + (b.x - a.x) * k + (Math.random() - 0.5) * jag * 2, y: a.y + (b.y - a.y) * k + (Math.random() - 0.5) * jag * 0.6 });
    }
    pts.push(b);
    return pts;
  };
  let pts = path();
  let t = 0;
  return S.tw
    .run(dur * S.sp, (k) => {
      if (k - t > 0.18) {
        t = k;
        pts = path();
      }
      const al = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      g.clear();
      for (const [ww, c, al2] of [
        [w, color, 0.5],
        [w * 0.35, 0xffffff, 1],
      ] as const) {
        g.moveTo(pts[0]!.x, pts[0]!.y);
        for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
        g.stroke({ width: ww, color: c, alpha: al * al2, cap: 'round', join: 'round' });
      }
    })
    .then(() => g.destroy());
}

/** A column of light from the top of the stage down to y (holy light, smite). */
export function pillar(S: Stage, x: number, y: number, color: number, w: number, dur: number) {
  const g = gfx(S);
  return S.tw
    .run(dur * S.sp, (k) => {
      const grow = Math.min(1, k / 0.25);
      const al = k < 0.25 ? 1 : 1 - (k - 0.25) / 0.75;
      const h = y * ease.out(grow);
      const ww = w * (k < 0.25 ? 0.3 + 0.7 * grow : 1 - 0.5 * ((k - 0.25) / 0.75));
      g.clear()
        .rect(x - ww, 0, ww * 2, h)
        .fill({ color, alpha: 0.5 * al })
        .rect(x - ww * 0.4, 0, ww * 0.8, h)
        .fill({ color: 0xffffff, alpha: 0.9 * al })
        .ellipse(x, y, ww * 1.6, ww * 0.45)
        .fill({ color, alpha: 0.6 * al });
    })
    .then(() => g.destroy());
}

/** Rings that grow out of a point. */
export function shock(S: Stage, at: Pt, color: number, r: number, dur: number, flat = false) {
  const g = gfx(S, at);
  return S.tw
    .run(dur * S.sp, (k) => {
      const rr = r * (0.2 + 0.8 * ease.out(k));
      g.clear();
      if (flat) g.ellipse(0, 0, rr, rr * 0.28);
      else g.circle(0, 0, rr);
      g.stroke({ width: Math.max(2, r * 0.08) * (1 - k * 0.6), color, alpha: 0.9 * (1 - k) });
    })
    .then(() => g.destroy());
}

/** A burst sprite at the point of contact. */
export function burst(S: Stage, at: Pt, hex: string, k = 1) {
  const b = piece(S, fxTex('burst', hex), at, k * 0.9);
  b.rotation = Math.random() * Math.PI;
  const s0 = b.scale.x;
  return S.tw
    .run(320 * S.sp, (u) => {
      b.scale.set(s0 * (u < 0.35 ? 0.4 + 0.75 * (u / 0.35) : 1.15 + 0.25 * ((u - 0.35) / 0.65)));
      b.alpha = u < 0.35 ? 1 : 1 - (u - 0.35) / 0.65;
    })
    .then(() => b.destroy());
}

/** Dust kicked up at someone's feet. */
export function dust(S: Stage, x: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const p = piece(S, fxTex('puff'), { x: x + (i - (n - 1) / 2) * 16, y: S.dims.groundY - 6 }, 0.8 + Math.random() * 0.4);
    p.alpha = 0.8;
    void fade(S, p, 520 + i * 60, 0.6, 14);
  }
}

export const wait = (S: Stage, ms: number) => S.tw.wait(ms * S.sp);
export const dirOf = (i: 0 | 1) => (i === 0 ? 1 : -1);
/** Point between a and b at k. */
export const mix = (a: Pt, b: Pt, k: number): Pt => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
/** A hex color as a number. */
export const hexN = (h: string) => parseInt(h.replace('#', ''), 16);
