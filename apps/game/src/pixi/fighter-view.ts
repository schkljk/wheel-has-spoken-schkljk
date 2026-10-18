import { ColorMatrixFilter, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import type { StatusChip } from '@whs/core';
import { CHIP_ICON } from '../ui/status-icons';
import { iconTexture } from './icon-tex';
import { PAURA, SIZE_H, SPRITE_H, SPRITE_W, buildSprite, type Look } from '../art/sprite';

const cache = new Map<string, { body: Texture; arm: Texture; sx: number; sy: number }>();
function canvasOf(rgba: Uint8ClampedArray) {
  const cv = document.createElement('canvas');
  cv.width = SPRITE_W;
  cv.height = SPRITE_H;
  const ctx = cv.getContext('2d')!;
  const id = ctx.createImageData(SPRITE_W, SPRITE_H);
  id.data.set(rgba);
  ctx.putImageData(id, 0, 0);
  return cv;
}
/** Pixel textures for a look (body and weapon arm), crisp when scaled up. */
export function spriteTextures(look: Look) {
  const k = [look.name, look.race, look.rsub, look.arch, look.weapon, look.ench].join('|');
  let c = cache.get(k);
  if (!c) {
    const s = buildSprite(look);
    const body = Texture.from(canvasOf(s.body));
    const arm = Texture.from(canvasOf(s.arm));
    body.source.scaleMode = 'nearest';
    arm.source.scaleMode = 'nearest';
    c = { body, arm, sx: s.sx, sy: s.sy };
    cache.set(k, c);
    if (cache.size > 40) {
      const first = cache.keys().next().value!;
      cache.delete(first);
    }
  }
  return c;
}

// the sprite box is 100 x 120 units; the feet stand at y 116.5
const FOOT = 116.5 / 120;

/** Chips per row over the head. */
const CHIP_ROW = 4;

/**
 * A fighter on the stage: shadow, aura, halo, body and a weapon arm that swings around the shoulder.
 * The container's origin is the point between the feet, on the horizon.
 */
export class FighterView extends Container {
  readonly flip = new Container();
  readonly body = new Container();
  /** breathing while standing (upgrade 39): scales from the feet, under everything else the body does */
  private breath = new Container();
  private breathT = 0;
  private bodySprite: Sprite;
  private arm: Sprite;
  readonly armPivot = new Container();
  private glow = new Graphics();
  /** status icons above the head */
  readonly badges = new Container();
  private badgeKey = '';
  private badgeSize = 18;
  h = 100;
  w = 83;
  private flash = new ColorMatrixFilter();
  private statusFilter = new ColorMatrixFilter();
  down = false;

  constructor(
    readonly look: Look,
    readonly side: 0 | 1,
    opts: { mythic?: boolean } = {},
  ) {
    super();
    const t = spriteTextures(look);
    this.bodySprite = new Sprite(t.body);
    this.arm = new Sprite(t.arm);
    this.arm.anchor.set(t.sx / SPRITE_W, t.sy / SPRITE_H);
    this.armPivot.addChild(this.arm);
    this.breath.addChild(this.bodySprite, this.armPivot);
    this.body.addChild(this.breath);
    // the two fighters breathe out of step
    this.breathT = side * 1.1;
    this.flip.addChild(this.glow, this.body);
    this.addChild(this.flip, this.badges);
    if (side === 1) this.flip.scale.x = -1;
    this.mythic = !!opts.mythic;
  }
  private mythic: boolean;

  /** Sizes the fighter to a height (before their size wheel scale). */
  setHeight(chH: number) {
    // bosses stand 15% taller than their size alone would make them, up to the tallest size the stage is
    // laid out for (upgrade 38)
    const sz = (this.look.size && SIZE_H[this.look.size]) || 1;
    const sc = this.look.boss ? Math.min(SIZE_H.Colossal!, sz * 1.15) : sz;
    const hh = Math.round(chH * sc);
    const ww = Math.round((hh * 100) / 120);
    this.h = hh;
    this.w = ww;
    const k = hh / SPRITE_H;
    const t = spriteTextures(this.look);
    this.bodySprite.scale.set(k);
    this.bodySprite.position.set(-ww / 2, -hh * FOOT);
    this.arm.scale.set(k);
    this.armPivot.position.set(-ww / 2 + t.sx * k, -hh * FOOT + t.sy * k);
    // the body pivots at the feet, so squash and knock-downs happen from the floor
    this.body.pivot.set(0, 0);
    const g = this.glow;
    g.clear();
    // side glow under the feet (teal for you, red for them), shadow, aura and the chosen one's halo
    g.ellipse(0, 4, ww * 0.75, 13).fill({ color: this.side === 0 ? 0x2dd4bf : 0xe5484d, alpha: 0.22 });
    g.ellipse(0, 0, ww * 0.24, hh * (4.2 / 120)).fill({ color: 0x000000, alpha: 0.28 });
    if (this.look.power && this.look.power !== 'none' && PAURA[this.look.power])
      g.ellipse(0, (-1.5 / 120) * hh, ww * 0.31, hh * (5.5 / 120)).fill({ color: PAURA[this.look.power]!, alpha: 0.5 });
    if (this.look.arch === 'chosen') g.circle(0, ((60 - 116.5) / 120) * hh, ww * 0.44).fill({ color: 0xffe082, alpha: 0.18 });
    if (this.mythic) g.circle(0, -hh * 0.45, ww * 0.62).fill({ color: 0xf2b544, alpha: 0.16 });
    this.badges.position.set(0, -hh * 0.98);
    this.badgeSize = Math.max(14, Math.round(hh * 0.13));
    this.setChips(this.chips, true);
  }

  /** Middle of the body, in stage coordinates. */
  center() {
    return { x: this.x, y: this.y - this.h * 0.45, top: this.y - this.h * 0.95 };
  }

  /** Weapon arm angle in degrees (mirrored for the right-hand fighter by the flip). */
  set armAngle(deg: number) {
    this.armPivot.rotation = (deg * Math.PI) / 180;
  }
  get armAngle() {
    return (this.armPivot.rotation * 180) / Math.PI;
  }

  setBrightness(b: number) {
    if (b === 1) {
      this.body.filters = this.statusOn ? [this.statusFilter] : null;
      return;
    }
    this.flash.brightness(b, false);
    this.body.filters = this.statusOn ? [this.statusFilter, this.flash] : [this.flash];
  }
  private statusOn = false;
  private chips: StatusChip[] = [];
  /** Status and buff icons over the head, each in a green (helps) or red (hurts) frame with its counter. */
  private setChips(chips: StatusChip[], force = false) {
    const key = chips.map((c) => `${c.k}${c.t}`).join(',');
    if (key === this.badgeKey && !force) return;
    this.badgeKey = key;
    this.chips = chips;
    for (const c of this.badges.removeChildren()) c.destroy({ children: true });
    const s = this.badgeSize;
    const pad = 2;
    const cell = s + pad * 2 + 2;
    const rows = Math.ceil(chips.length / CHIP_ROW);
    chips.forEach((c, i) => {
      const row = Math.floor(i / CHIP_ROW);
      const inRow = Math.min(CHIP_ROW, chips.length - row * CHIP_ROW);
      const box = new Container();
      box.position.set((i % CHIP_ROW) * cell - (inRow * cell) / 2, -(rows - row) * cell);
      const frame = new Graphics()
        .roundRect(0, 0, s + pad * 2, s + pad * 2, 4)
        .fill({ color: 0x0a0714, alpha: 0.7 })
        .stroke({ color: c.k === 'guard' ? 0x9cc7ff : c.bad ? 0xff6b6b : 0x5cf2a0, width: 1.5, alpha: 0.95 });
      const sp = new Sprite(iconTexture(CHIP_ICON[c.k] ?? 'question'));
      sp.width = sp.height = s;
      sp.position.set(pad, pad);
      box.addChild(frame, sp);
      if (c.t) {
        const t = new Text({
          text: c.t,
          style: { fontFamily: 'Saira Condensed, Arial Narrow, sans-serif', fontWeight: '800', fontSize: Math.max(10, Math.round(s * 0.62)), fill: 0xffffff, stroke: { color: 0x0a0714, width: 3 } },
        });
        t.anchor.set(1, 1);
        t.position.set(s + pad * 2 + 2, s + pad * 2 + 3);
        box.addChild(t);
      }
      this.badges.addChild(box);
    });
  }
  /** Frozen fighters go pale and icy; poisoned ones turn a little green. Every status shows as an icon with its counter. */
  setStatus(st: { frozen?: boolean; poison?: boolean; guard?: boolean; soaked?: boolean; burning?: boolean }, chips: StatusChip[]) {
    const m = this.statusFilter;
    if (st.frozen) {
      m.saturate(-0.7, false);
      m.brightness(1.15, true);
    } else if (st.poison) {
      m.reset();
      m.matrix[6] = 1.15;
    }
    this.statusOn = !!(st.frozen || st.poison);
    if (!this.statusOn) this.body.filters = null;
    else this.body.filters = [m];
    this.setChips(chips);
  }

  /**
   * Idle breathing: a slow rise and fall of the chest (a hair taller, a hair narrower), quicker when hurt.
   * Lying down, it stops.
   */
  breathe(ms: number, hurt = false) {
    if (this.down) {
      this.breath.scale.set(1);
      return;
    }
    this.breathT += (ms / 1000) * (hurt ? 1.6 : 1);
    const k = Math.sin((this.breathT / 2.6) * Math.PI * 2);
    this.breath.scale.set(1 - 0.006 * k, 1 + 0.016 * k);
  }

  /** Knocked out: lies on the floor, faded (or gets back up). */
  setDown(down: boolean) {
    this.down = down;
    this.body.rotation = down ? (-Math.PI / 2) * (this.side === 0 ? 1 : 1) : 0;
    this.body.x = down ? 18 : 0;
    this.body.alpha = down ? 0.6 : 1;
  }
}
