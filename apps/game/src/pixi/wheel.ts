import { Container, Graphics, Sprite, Text, TextStyle, Texture, CanvasTextMetrics } from 'pixi.js';
import { SLICE_COLORS, bulb, sliceMask, wheelFace, wheelHub, wheelPointer, wheelRim, type Rgba } from '../art/wheel-art';
import { emojiCanvas } from '../art/emoji-px';

const TEX = new WeakMap<HTMLCanvasElement, Texture>();
/** A crisp texture for an icon canvas, made once. */
export function texOf(c: HTMLCanvasElement) {
  let t = TEX.get(c);
  if (!t) {
    t = Texture.from(c);
    t.source.scaleMode = 'nearest';
    TEX.set(c, t);
  }
  return t;
}

/** A slice as the wheel draws it. Sizes come from `w`; colors from quality (0 cooked .. 3 goated). */
export interface WheelSlice {
  n: string;
  e?: string;
  q?: number;
  w: number;
  /** odds shifted up or down: a small arrow before the label */
  mark?: 'up' | 'down' | '';
  /** a pixel icon drawn instead of the emoji */
  img?: HTMLCanvasElement | null;
  /** its own color instead of the quality's (the title wheel) */
  col?: string;
}

const TAU = Math.PI * 2;
export const MIN_TURNS = 1.5;
export interface Friction {
  k: number;
  c: number;
}
/** Friction varies a little every spin, so nobody can aim for a slice (legacy frictionFor). */
export function frictionFor(kind: 'flick' | 'button' | 'auto', fast: boolean, rng: () => number): Friction {
  const v = 0.88 + rng() * 0.24;
  if (kind === 'auto') return { k: 2.0 * v, c: 3 * v };
  if (kind === 'button' && fast) return { k: 1.4 * v, c: 2.5 * v };
  return { k: 0.55 * v, c: 0.9 * v };
}
/** How far (radians) a wheel pushed at w rad/s travels before it stops. */
export function predictTravel(w: number, fr: Friction) {
  let o = Math.abs(w);
  let th = 0;
  let t = 0;
  const dt = 1 / 120;
  while (o > 0.02 && t < 40) {
    o = Math.max(0, o - (fr.c + fr.k * o) * dt);
    th += o * dt;
    t += dt;
  }
  return th;
}

interface Phys {
  w: number;
  fr: Friction;
  valid: boolean;
  kind: 'flick' | 'button' | 'auto';
  seg: number;
  bounces: number;
  suspense: boolean;
  travel: number;
}
interface Tween {
  from: number;
  to: number;
  t0: number;
  dur: number;
  idx: number;
  seg: number;
  dir: number;
}

export interface WheelEvents {
  /** a slice edge passed the pointer (heavy: bounced off a peg) */
  tick?: (heavy: boolean) => void;
  /** the wheel slowed enough to be exciting */
  suspense?: () => void;
  /** the wheel stopped on a slice */
  land?: (idx: number, info: { turns: number; flick: boolean }) => void;
  /** a flick that didn't go around 1½ times */
  tooGentle?: (turns: number) => void;
}

/** A texture from pixel art, crisp when scaled up. */
function texRgba(r: Rgba) {
  const cv = document.createElement('canvas');
  cv.width = r.w;
  cv.height = r.h;
  const x = cv.getContext('2d')!;
  const id = x.createImageData(r.w, r.h);
  id.data.set(r.d);
  x.putImageData(id, 0, 0);
  const t = Texture.from(cv);
  t.source.scaleMode = 'nearest';
  return t;
}
const PIXEL_FONT = '"WHS Display", "Saira Condensed", system-ui, sans-serif';

/**
 * A spinning prize wheel in Pixi, in pixel art like the rest of the game: a gold rim with bulbs that chase
 * while it turns, slices sized by weight with a peg on every edge, a pointer on a spring at the top and a
 * medallion hub. It spins two ways: with physics (flicks and the Spin button; where it stops decides the
 * result) or straight to a chosen slice (combat and signature wheels pick first).
 */
export class WheelView extends Container {
  readonly disc = new Container();
  private face = new Sprite();
  private hilite = new Sprite();
  private labels = new Container();
  private rim = new Sprite();
  private lights = new Container();
  private bulbs: Sprite[] = [];
  private bulbOn: Texture | null = null;
  private bulbOff: Texture | null = null;
  readonly pointer = new Container();
  private pointerArt = new Sprite();
  readonly hub = new Container();
  private hubArt = new Sprite();
  private hubPic = new Sprite();
  private hubR = 20;
  private hubText = new Text({ text: '?', style: { fontFamily: PIXEL_FONT, fontSize: 30, fill: 0x3a2200, align: 'center' } });
  private sparks = new Container();
  private owned: Texture[] = [];
  private hiTex: Texture | null = null;
  /** CSS pixels per art pixel */
  private px = 3;
  items: WheelSlice[] = [];
  segs: [number, number][] = [];
  size = 300;
  rot = 0;
  private phys: Phys | null = null;
  private tween: Tween | null = null;
  // the pointer's spring, the lights, the landing pop
  private pa = 0;
  private pv = 0;
  private lastFlapAt = 0;
  private clock = 0;
  private chase = 0;
  private lastRot = 0;
  private flashT = -1;
  private popT = -1;
  private suspenseOn = false;
  private sparkV: { g: Graphics; vx: number; vy: number; life: number }[] = [];
  events: WheelEvents = {};
  reduced = false;
  rng: () => number = Math.random;

  constructor() {
    super();
    this.hilite.visible = false;
    this.disc.addChild(this.face, this.hilite, this.labels);
    this.hub.addChild(this.hubArt, this.hubText, this.hubPic);
    for (const sp of [this.face, this.hilite, this.rim, this.hubArt, this.hubPic]) sp.anchor.set(0.5);
    this.hubText.anchor.set(0.5);
    this.hubPic.visible = false;
    this.pointer.addChild(this.pointerArt);
    this.addChild(this.rim, this.disc, this.lights, this.hub, this.pointer, this.sparks);
  }

  get spinning() {
    return !!this.phys || !!this.tween;
  }

  private own(t: Texture) {
    this.owned.push(t);
    return t;
  }

  /** Draws the wheel for these slices at this diameter (call again when either changes). */
  setItems(items: WheelSlice[], size = this.size, hi: number | null = null) {
    this.items = items;
    this.size = size;
    // the old art goes after the next frame, once the renderer no longer holds it
    const old = this.owned;
    this.owned = [];
    if (old.length) setTimeout(() => old.forEach((t) => t.destroy(true)), 100);
    const p = (this.px = Math.max(2, Math.round(size / 105)));
    const N = Math.max(40, Math.round(size / p));
    const rw = Math.max(4, Math.round(N * 0.07));
    const faceN = N - 2 * (rw - 1);
    const hubN = Math.max(9, Math.round(N * 0.22));
    const hole = hubN / faceN;
    const tot = items.reduce((a, b) => a + b.w, 0) || 1;
    this.segs = [];
    let a = 0;
    const spans = items.map((it) => {
      const span = (it.w / tot) * TAU;
      this.segs.push([a, a + span]);
      a += span;
      return span;
    });
    const colors = items.map((it, i) => it.col ?? SLICE_COLORS[it.q == null ? 1 : it.q]![i % 2]!);
    this.face.texture = this.own(texRgba(wheelFace(faceN, spans.length ? spans : [TAU], colors.length ? colors : ['#5b4bb7'], hole)));
    this.face.scale.set(p);
    this.rim.texture = this.own(texRgba(wheelRim(N, rw)));
    this.rim.scale.set(p);
    // labels along each slice, right-aligned at the rim, in the pixel face
    const rIn = (faceN * p) / 2;
    const oldLabels = this.labels.removeChildren();
    if (oldLabels.length) setTimeout(() => oldLabels.forEach((c) => c.destroy({ children: true })), 100);
    items.forEach((it, i) => {
      const [a0, a1] = this.segs[i]!;
      const span = a1 - a0;
      const mid = (a0 + a1) / 2;
      const arc = span * rIn * 0.6;
      if (arc < 9 || (!it.n && !it.img)) return;
      let fs = Math.min(17, Math.max(10, size / 22), arc * 0.9);
      const maxW = rIn * 0.66;
      const mk = it.mark === 'up' ? '▲ ' : it.mark === 'down' ? '▼ ' : '';
      const pic = it.img ? texOf(it.img) : null;
      let label = mk + (it.e && !pic ? it.e + ' ' : '') + it.n;
      if (arc < fs * 1.7 && (it.e || pic)) label = pic ? mk : mk + it.e;
      const style = new TextStyle({ fontFamily: PIXEL_FONT, fontSize: fs, fill: it.q === 3 ? 0x3a2200 : 0xffffff, stroke: it.q === 3 ? undefined : { color: 0x120d28, width: 3 } });
      const width = () => CanvasTextMetrics.measureText(label, style).width;
      while (width() > maxW && fs > 10) {
        fs -= 1;
        style.fontSize = fs;
      }
      while (width() > maxW && label.length > 3) label = label.slice(0, -2) + '…';
      const t = new Text({ text: label, style, resolution: Math.min(devicePixelRatio || 1, 2) });
      t.anchor.set(1, 0.5);
      const holder = new Container();
      holder.rotation = mid - Math.PI / 2;
      t.position.set(rIn - 3 * p, 0.5);
      holder.addChild(t);
      if (pic) {
        // the icon sits just inside the label, upright along the slice, scaled by whole pixels when it can be
        const sp = new Sprite(pic);
        const want = Math.min(fs * 1.7, arc * 1.15);
        const k = want >= pic.width ? Math.floor(want / pic.width) : want / pic.width;
        sp.scale.set(k);
        sp.anchor.set(1, 0.5);
        sp.position.set(rIn - 3 * p - (label ? width() + 3 : 0), 0.5);
        holder.addChild(sp);
      }
      this.labels.addChild(holder);
    });
    this.highlight(hi);
    // the bulbs around the rim
    const bs = Math.max(2, Math.round(rw * 0.55));
    this.bulbOn = this.own(texRgba(bulb(true, bs)));
    this.bulbOff = this.own(texRgba(bulb(false, bs)));
    this.lights.removeChildren().forEach((c) => c.destroy());
    const nb = size > 230 ? 20 : 16;
    this.bulbs = [];
    for (let k = 0; k < nb; k++) {
      const ang = (k / nb) * TAU + TAU / nb / 2;
      const b = new Sprite(this.bulbOn);
      b.anchor.set(0.5);
      b.scale.set(p);
      b.position.set(Math.sin(ang) * ((N / 2 - rw / 2) * p), -Math.cos(ang) * ((N / 2 - rw / 2) * p));
      this.lights.addChild(b);
      this.bulbs.push(b);
    }
    // hub and pointer
    this.hubArt.texture = this.own(texRgba(wheelHub(hubN)));
    this.hubArt.scale.set(p);
    const hr = (hubN * p) / 2;
    this.hubR = hr;
    this.hubText.style.fontSize = Math.round(hr * 1.05);
    this.hubPic.width = this.hubPic.height = hr * 1.15;
    const pt = wheelPointer(Math.max(8, Math.round(N * 0.115)));
    this.pointerArt.texture = this.own(texRgba(pt));
    this.pointerArt.scale.set(p);
    this.pointerArt.anchor.set(pt.px / pt.w, pt.py / pt.h);
    this.pointer.position.set(0, -(N / 2) * p + rw * p * 0.15);
    this.disc.rotation = this.rot;
    this.lastRot = this.rot;
  }

  /** Marks the landed slice: it glows, pulsing. */
  highlight(hi: number | null) {
    if (this.hiTex) {
      const t = this.hiTex;
      setTimeout(() => t.destroy(true), 100);
      this.hiTex = null;
    }
    this.hilite.visible = false;
    if (hi == null || !this.segs[hi]) return;
    const p = this.px;
    const N = Math.max(40, Math.round(this.size / p));
    const rw = Math.max(4, Math.round(N * 0.07));
    const faceN = N - 2 * (rw - 1);
    const hubN = Math.max(9, Math.round(N * 0.22));
    const [h0, h1] = this.segs[hi]!;
    this.hiTex = texRgba(sliceMask(faceN, h0, h1, hubN / faceN));
    this.hilite.texture = this.hiTex;
    this.hilite.scale.set(p);
    this.hilite.visible = true;
  }

  /** The hub shows a word, or an emoji as its pixel icon. */
  setHub(text: string) {
    const cv = /^[\p{Extended_Pictographic}\uFE0F\u200D]+$/u.test(text) ? emojiCanvas(text) : null;
    this.hubPic.visible = !!cv;
    this.hubText.visible = !cv;
    if (cv) {
      this.hubPic.texture = texOf(cv);
      this.hubPic.width = this.hubPic.height = this.hubR * 1.15;
    } else this.hubText.text = text;
  }

  /** The slice under the pointer at rotation r. */
  segAt(r = this.rot) {
    const l = ((-r % TAU) + TAU) % TAU;
    for (let i = 0; i < this.segs.length; i++) if (l >= this.segs[i]![0] && l < this.segs[i]![1]) return i;
    return this.segs.length - 1;
  }

  /** The slice at screen angle `phi` around the hub (atan2 of a point minus the centre). */
  segAtAngle(phi: number) {
    return this.segAt(this.rot - phi - Math.PI / 2);
  }

  private setRot(r: number) {
    this.rot = r;
    this.disc.rotation = r;
  }
  /** Turns the wheel by hand (dragging), ticking past slice edges. */
  nudge(d: number) {
    const before = this.segAt();
    this.setRot(this.rot + d);
    if (this.segAt() !== before) this.onEdge(Math.sign(d), false);
  }

  private onEdge(dir: number, heavy: boolean) {
    this.events.tick?.(heavy);
    const now = performance.now();
    if (this.reduced || now - this.lastFlapAt < 30) return;
    this.lastFlapAt = now;
    // the flapper gets knocked the way the pegs pass, harder by a bounce
    this.pv += (dir > 0 ? -1 : 1) * (heavy ? 16 : 9);
  }

  /** The win: the bulbs flash, the wheel pops and sparks fly off the pointer. */
  private celebrate() {
    this.suspenseOn = false;
    if (this.reduced) return;
    this.flashT = 0;
    this.popT = 0;
    const p = this.px;
    const tip = this.pointer.y + this.pointerArt.height * 0.55;
    for (let i = 0; i < 16; i++) {
      const g = new Graphics()
        .rect(-p * 0.75, -p * 0.75, p * 1.5, p * 1.5)
        .fill({ color: [0xffe27a, 0xffffff, 0xffb627, 0xff8ad8][i % 4]! });
      g.position.set(0, tip);
      const a = -Math.PI / 2 + (this.rng() - 0.5) * 2.6;
      const v = 140 + this.rng() * 180;
      this.sparks.addChild(g);
      this.sparkV.push({ g, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.55 + this.rng() * 0.3 });
    }
  }

  /** Physics spin: a flick at w rad/s, or a machine push that always clears the 1½-turn rule. */
  spinPhysics(kind: 'flick' | 'button' | 'auto', fast: boolean, w?: number) {
    const fr = frictionFor(kind, fast, this.rng);
    if (w == null) {
      const want = (kind === 'auto' ? 1.8 + this.rng() * 0.8 : fast ? 2.2 + this.rng() : 3.2 + this.rng() * 1.8) * TAU;
      w = 6;
      while (predictTravel(w, fr) < want && w < 90) w *= 1.08;
    }
    const valid = predictTravel(w, fr) >= MIN_TURNS * TAU;
    this.highlight(null);
    this.suspenseOn = false;
    this.phys = { w, fr, valid, kind, seg: this.segAt(), bounces: 0, suspense: false, travel: 0 };
  }

  /** Spins to a chosen slice (combat and signature wheels), easing out over `dur` ms. */
  spinTo(idx: number, opts: { turns?: number; dur: number; dir?: number }) {
    const seg = this.segs[idx]!;
    const target = seg[0] + (seg[1] - seg[0]) * (0.2 + this.rng() * 0.6);
    const dir = opts.dir && opts.dir < 0 ? -1 : 1;
    const turns = opts.turns ?? 3;
    const want = ((-target % TAU) + TAU) % TAU;
    let end = this.rot - (((this.rot % TAU) + TAU) % TAU) + want;
    if (dir > 0) while (end < this.rot + TAU * turns) end += TAU;
    else while (end > this.rot - TAU * turns) end -= TAU;
    this.highlight(null);
    this.tween = { from: this.rot, to: end, t0: performance.now(), dur: Math.max(1, opts.dur), idx, seg: this.segAt(), dir };
  }

  /** The slice next to `idx` in the direction the wheel last turned (where a nudge would move it). */
  nextSlice(idx: number, dir: number): number {
    const n = this.segs.length;
    const fwd = (j: number) => {
      const [a, b] = this.segs[j]!;
      const want = ((-(a + b) / 2) % TAU + TAU) % TAU;
      const cur = ((this.rot % TAU) + TAU) % TAU;
      const d = dir >= 0 ? want - cur : cur - want;
      return ((d % TAU) + TAU) % TAU || TAU;
    };
    const a = (idx + 1) % n;
    const b = (idx - 1 + n) % n;
    return fwd(a) <= fwd(b) ? a : b;
  }

  /** Advances spins, the pointer, the lights and the sparks; call every frame with the elapsed seconds. */
  update(dt: number) {
    this.animate(Math.min(0.05, dt));
    const t = this.tween;
    if (t) {
      const k = Math.min(1, (performance.now() - t.t0) / t.dur);
      const e = 1 - Math.pow(1 - k, 4);
      this.setRot(t.from + (t.to - t.from) * e);
      const sg = this.segAt();
      if (sg !== t.seg) {
        t.seg = sg;
        this.onEdge(t.dir, false);
      }
      if (k >= 1) {
        this.tween = null;
        this.highlight(t.idx);
        this.celebrate();
        this.events.land?.(t.idx, { turns: Math.abs(t.to - t.from) / TAU, flick: false });
      }
      return;
    }
    const p = this.phys;
    if (!p) return;
    dt = Math.min(0.05, dt);
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const s = Math.sign(p.w);
      const o = Math.abs(p.w);
      const no = Math.max(0, o - (p.fr.c + p.fr.k * o) * h);
      p.w = s * no;
      const step = p.w * h;
      this.setRot(this.rot + step);
      p.travel += Math.abs(step);
      const sg = this.segAt();
      if (sg !== p.seg) {
        // a peg sits on every slice edge: a crawling wheel can bounce off it and settle back
        if (p.valid && no < 0.55 && p.bounces < 2 && this.rng() < 0.55) {
          this.setRot(this.rot - step * 1.5);
          p.w = -p.w * 0.45;
          p.bounces++;
          this.onEdge(-s, true);
          continue;
        }
        p.seg = sg;
        this.onEdge(s, false);
      }
      if (no <= 0.02) break;
    }
    if (p.valid && !p.suspense && Math.abs(p.w) < 2.4) {
      p.suspense = true;
      this.suspenseOn = true;
      this.events.suspense?.();
    }
    if (Math.abs(p.w) <= 0.02) {
      this.phys = null;
      this.setRot(((this.rot % TAU) + TAU) % TAU);
      const turns = p.travel / TAU;
      if (!p.valid) {
        this.suspenseOn = false;
        this.events.tooGentle?.(turns);
        return;
      }
      const idx = this.segAt();
      this.highlight(idx);
      this.celebrate();
      this.events.land?.(idx, { turns, flick: p.kind === 'flick' });
    }
  }

  private animate(dt: number) {
    this.clock += dt;
    // the pointer: a damped spring the pegs keep knocking
    if (this.reduced) {
      this.pa = this.pv = 0;
    } else {
      this.pv += (-260 * this.pa - 16 * this.pv) * dt;
      this.pa = Math.max(-0.7, Math.min(0.7, this.pa + this.pv * dt));
    }
    this.pointer.rotation = this.pa;
    // the bulbs: a slow twinkle at rest, a chase as fast as the wheel while it spins, a blink while it slows
    // down, three flashes when it lands
    const speed = Math.abs(this.rot - this.lastRot) / Math.max(dt, 1e-3);
    this.lastRot = this.rot;
    const nb = this.bulbs.length;
    let lit: (k: number) => boolean;
    if (this.reduced) lit = () => true;
    else if (this.flashT >= 0) {
      this.flashT += dt;
      const on = Math.floor(this.flashT * 7) % 2 === 0;
      lit = () => on;
      if (this.flashT > 0.85) this.flashT = -1;
    } else if (this.spinning && this.suspenseOn) {
      const on = Math.floor(this.clock * 9) % 2 === 0;
      lit = (k) => (k % 2 === 0) === on;
    } else if (this.spinning) {
      this.chase += (speed / TAU) * nb * dt * 0.9 + dt * 4;
      const head = Math.floor(this.chase) % nb;
      lit = (k) => (k - head + nb) % 4 === 0;
    } else {
      const half = Math.floor(this.clock / 0.7) % 2;
      lit = (k) => k % 2 === half;
    }
    if (this.bulbOn && this.bulbOff) this.bulbs.forEach((b, k) => (b.texture = lit(k) ? this.bulbOn! : this.bulbOff!));
    // the slice that won pulses
    if (this.hilite.visible) this.hilite.alpha = this.reduced ? 0.85 : 0.6 + 0.4 * Math.sin(this.clock * 7) ** 2;
    // the pop when it lands
    if (this.popT >= 0) {
      this.popT += dt;
      const k = Math.min(1, this.popT / 0.3);
      this.scale.set(1 + 0.05 * Math.sin(Math.PI * k) * (1 - k * 0.3));
      if (k >= 1) {
        this.popT = -1;
        this.scale.set(1);
      }
    }
    // sparks fly and fall
    for (let i = this.sparkV.length - 1; i >= 0; i--) {
      const s = this.sparkV[i]!;
      s.life -= dt;
      s.vy += 520 * dt;
      s.g.x += s.vx * dt;
      s.g.y += s.vy * dt;
      s.g.alpha = Math.max(0, Math.min(1, s.life * 3));
      if (s.life <= 0) {
        s.g.destroy();
        this.sparkV.splice(i, 1);
      }
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    const owned = [...this.owned, ...(this.hiTex ? [this.hiTex] : [])];
    super.destroy(options);
    owned.forEach((t) => t.destroy(true));
  }
}
