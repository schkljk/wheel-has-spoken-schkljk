import { Container, FillGradient, Graphics, Text, TextStyle, CanvasTextMetrics } from 'pixi.js';

/** A slice as the wheel draws it. Sizes come from `w`; colors from quality (0 cooked .. 3 goated). */
export interface WheelSlice {
  n: string;
  e?: string;
  q?: number;
  w: number;
  /** odds shifted up or down: a small arrow before the label */
  mark?: 'up' | 'down' | '';
}

const TAU = Math.PI * 2;
// legacy drawWheel colors: two shades per quality so neighbours differ
const QC: [number, number][] = [
  [0x525b6e, 0x465062],
  [0x5b4bb7, 0x4e40a3],
  [0x0e9f8e, 0x0b8a7b],
  [0xe8a93a, 0xd99a2b],
];
const FONT = '"Atkinson Hyperlegible", system-ui, sans-serif';

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

/**
 * A spinning prize wheel in Pixi: brushed gold rim, bulbs, slices sized by weight, a pointer at the top
 * and a hub in the middle. It spins two ways: with physics (flicks and the Spin button; where it stops
 * decides the result) or straight to a chosen slice (combat and signature wheels pick first).
 */
export class WheelView extends Container {
  readonly disc = new Container();
  private slices = new Graphics();
  private labels = new Container();
  private hilite = new Graphics();
  private rim = new Graphics();
  private overlay = new Graphics();
  readonly pointer = new Graphics();
  readonly hub = new Container();
  private hubDisc = new Graphics();
  private hubText = new Text({ text: '?', style: { fontFamily: FONT, fontWeight: '800', fontSize: 30, fill: 0x2a1a05, align: 'center' } });
  private rimG?: FillGradient;
  private shadeG?: FillGradient;
  private glossG?: FillGradient;
  items: WheelSlice[] = [];
  segs: [number, number][] = [];
  size = 300;
  rot = 0;
  private phys: Phys | null = null;
  private tween: Tween | null = null;
  private flap = 0;
  private lastFlapAt = 0;
  events: WheelEvents = {};
  reduced = false;
  rng: () => number = Math.random;

  constructor() {
    super();
    this.disc.addChild(this.slices, this.hilite, this.labels);
    this.hub.addChild(this.hubDisc, this.hubText);
    this.hubText.anchor.set(0.5);
    this.addChild(this.rim, this.disc, this.overlay, this.hub, this.pointer);
  }

  get spinning() {
    return !!this.phys || !!this.tween;
  }

  /** Draws the wheel for these slices at this diameter (call again when either changes). */
  setItems(items: WheelSlice[], size = this.size, hi: number | null = null) {
    this.items = items;
    this.size = size;
    const R = size / 2;
    const rIn = R - 11;
    const tot = items.reduce((a, b) => a + b.w, 0) || 1;
    // brushed-gold rim
    const rimG = (this.rimG ??= new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      colorStops: [
        { offset: 0, color: '#FBE3A6' },
        { offset: 0.45, color: '#C98F2E' },
        { offset: 0.55, color: '#F5D27A' },
        { offset: 1, color: '#8C5E14' },
      ],
      textureSpace: 'local',
    }));
    this.rim.clear().circle(0, 0, R - 1).fill(rimG).stroke({ width: 1.5, color: 0x1a1328 });
    // slices: angle 0 is the top, going clockwise
    this.slices.clear();
    this.segs = [];
    let a = 0;
    items.forEach((it, i) => {
      const span = (it.w / tot) * TAU;
      this.segs.push([a, a + span]);
      const q = it.q == null ? 1 : it.q;
      this.slices
        .moveTo(0, 0)
        .arc(0, 0, rIn, a - Math.PI / 2, a + span - Math.PI / 2)
        .closePath()
        .fill({ color: QC[q]![i % 2]! })
        .stroke({ width: 1.5, color: 0xfff6ea, alpha: 0.75 });
      a += span;
    });
    // labels along each slice, right-aligned at the rim
    // old labels go after the next frame, once the renderer no longer holds their textures
    const old = this.labels.removeChildren();
    if (old.length) setTimeout(() => old.forEach((c) => c.destroy({ children: true })), 100);
    items.forEach((it, i) => {
      const [a0, a1] = this.segs[i]!;
      const span = a1 - a0;
      const mid = (a0 + a1) / 2;
      const arc = span * rIn * 0.6;
      if (arc < 9) return;
      let fs = Math.min(15, Math.max(9, size / 25), arc * 0.8);
      const maxW = rIn * 0.68;
      const mk = it.mark === 'up' ? '▲ ' : it.mark === 'down' ? '▼ ' : '';
      let label = mk + (it.e ? it.e + ' ' : '') + it.n;
      if (arc < fs * 1.7 && it.e) label = mk + it.e;
      const style = new TextStyle({ fontFamily: FONT, fontWeight: '700', fontSize: fs, fill: it.q === 3 ? 0x2a1a05 : 0xffffff });
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
      t.position.set(rIn - 9, 0.5);
      holder.addChild(t);
      this.labels.addChild(holder);
    });
    this.highlight(hi);
    // depth, bulbs and a glossy dome over the slices (they don't turn)
    const shade = (this.shadeG ??= new FillGradient({
      type: 'radial',
      center: { x: 0.5, y: 0.5 },
      innerRadius: 0.175,
      outerCenter: { x: 0.5, y: 0.5 },
      outerRadius: 0.5,
      colorStops: [
        { offset: 0, color: 'rgba(0,0,0,0)' },
        { offset: 1, color: 'rgba(0,0,0,0.28)' },
      ],
      textureSpace: 'local',
    }));
    const gloss = (this.glossG ??= new FillGradient({
      type: 'radial',
      center: { x: 0.33, y: 0.25 },
      innerRadius: 0.03,
      outerCenter: { x: 0.37, y: 0.33 },
      outerRadius: 0.55,
      colorStops: [
        { offset: 0, color: 'rgba(255,255,255,0.26)' },
        { offset: 0.45, color: 'rgba(255,255,255,0.06)' },
        { offset: 1, color: 'rgba(255,255,255,0)' },
      ],
      textureSpace: 'local',
    }));
    this.overlay.clear().circle(0, 0, rIn).fill(shade).circle(0, 0, rIn).fill(gloss);
    const nb = 28;
    for (let k = 0; k < nb; k++) {
      const ang = (k / nb) * TAU;
      this.overlay.circle(Math.cos(ang) * (R - 5.5), Math.sin(ang) * (R - 5.5), 2.6).fill({ color: k % 2 ? 0xffb627 : 0xff4f8b });
    }
    // hub and pointer
    const hr = Math.max(18, size * 0.11);
    this.hubDisc.clear().circle(0, 0, hr).fill({ color: 0xfff6e0 }).stroke({ width: Math.max(3, size * 0.014), color: 0xd99a2b });
    this.hubText.style.fontSize = hr * 0.95;
    const pw = Math.max(9, size * 0.045);
    this.pointer.clear().poly([-pw, 0, pw, 0, 0, pw * 1.9]).fill({ color: 0xe5484d }).stroke({ width: 2, color: 0x8e1d22 });
    this.pointer.pivot.set(0, pw * 0.4);
    this.pointer.position.set(0, -R - pw * 0.5);
    this.disc.rotation = this.rot;
  }

  /** Marks the landed slice. */
  highlight(hi: number | null) {
    this.hilite.clear();
    if (hi == null || !this.segs[hi]) return;
    const rIn = this.size / 2 - 11;
    const [h0, h1] = this.segs[hi]!;
    this.hilite
      .moveTo(0, 0)
      .arc(0, 0, rIn, h0 - Math.PI / 2, h1 - Math.PI / 2)
      .closePath()
      .fill({ color: 0xffffff, alpha: 0.28 })
      .stroke({ width: 4, color: 0xffb627 });
  }

  setHub(text: string) {
    this.hubText.text = text;
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
    if (this.reduced || now - this.lastFlapAt < 35) return;
    this.lastFlapAt = now;
    this.flap = dir > 0 ? -1 : 1;
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

  /** Advances spins and the pointer flap; call every frame with the elapsed seconds. */
  update(dt: number) {
    if (this.flap) {
      this.pointer.rotation = this.flap * 0.3;
      this.flap = 0;
    } else this.pointer.rotation *= 0.75;
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
      this.events.suspense?.();
    }
    if (Math.abs(p.w) <= 0.02) {
      this.phys = null;
      this.setRot(((this.rot % TAU) + TAU) % TAU);
      const turns = p.travel / TAU;
      if (!p.valid) {
        this.events.tooGentle?.(turns);
        return;
      }
      const idx = this.segAt();
      this.highlight(idx);
      this.events.land?.(idx, { turns, flick: p.kind === 'flick' });
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    super.destroy(options);
    for (const g of [this.rimG, this.shadeG, this.glossG]) g?.destroy();
  }
}
