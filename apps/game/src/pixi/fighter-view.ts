import { ColorMatrixFilter, Container, Graphics, Sprite, Texture } from 'pixi.js';
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

/**
 * A fighter on the stage: shadow, aura, halo, body and a weapon arm that swings around the shoulder.
 * The container's origin is the point between the feet, on the horizon.
 */
export class FighterView extends Container {
  readonly flip = new Container();
  readonly body = new Container();
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
    this.body.addChild(this.bodySprite, this.armPivot);
    this.flip.addChild(this.glow, this.body);
    this.addChild(this.flip, this.badges);
    if (side === 1) this.flip.scale.x = -1;
    this.mythic = !!opts.mythic;
  }
  private mythic: boolean;

  /** Sizes the fighter to a height (before their size wheel scale). */
  setHeight(chH: number) {
    const sc = (this.look.size && SIZE_H[this.look.size]) || 1;
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
    this.setBadges(this.badgeKey ? this.badgeKey.split(',') : [], true);
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
  private setBadges(names: string[], force = false) {
    const key = names.join(',');
    if (key === this.badgeKey && !force) return;
    this.badgeKey = key;
    for (const c of this.badges.removeChildren()) c.destroy();
    const s = this.badgeSize;
    names.forEach((n, i) => {
      const sp = new Sprite(iconTexture(n));
      sp.width = sp.height = s;
      sp.position.set((i - names.length / 2) * (s + 2) + 1, -s);
      this.badges.addChild(sp);
    });
  }
  /** Frozen fighters go pale and icy; poisoned ones turn a little green. */
  setStatus(st: { frozen?: boolean; poison?: boolean; guard?: boolean; soaked?: boolean; burning?: boolean }) {
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
    this.setBadges([st.guard && 'shield', st.frozen && 'st_frozen', st.soaked && 'st_soaked', st.burning && 'st_burn', st.poison && 'st_poison'].filter((x): x is string => !!x));
  }

  /** Knocked out: lies on the floor, faded (or gets back up). */
  setDown(down: boolean) {
    this.down = down;
    this.body.rotation = down ? (-Math.PI / 2) * (this.side === 0 ? 1 : 1) : 0;
    this.body.x = down ? 18 : 0;
    this.body.alpha = down ? 0.6 : 1;
  }
}
