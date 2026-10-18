import { Application, ColorMatrixFilter, Container, FillGradient, Graphics, Text, TextStyle } from 'pixi.js';
import { COMBOS, WEAPONS, type Arena, type BattleEvent, type Proc, type Snap } from '@whs/core';
import type { Look } from '../art/sprite';
import { beep, finisherSound, hitSound, procSound, thud, type HitKind } from '../ui/sound';
import { buzz } from '../state/game';
import { FighterView } from './fighter-view';
import { Ambient, chapterSVG, drawFloor, sceneSVG } from './scenery';
import { Tweens, ease } from './tween';
import { WheelView } from './wheel';

import { fightDims, type FightDims } from './dims';

export { fightDims, type FightDims };
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

const TINT_COL: Record<string, number> = {
  fire: 0xff7a2f,
  ice: 0x8fe7ff,
  lightning: 0xffe14d,
  water: 0x3d8bff,
  shadow: 0x6a1b9a,
  light: 0xfff3b0,
  poison: 0x76ff03,
  gravity: 0x9c6bff,
  mind: 0xff4fd8,
  wind: 0xcff4ff,
  plant: 0x66bb6a,
  sonic: 0xffd180,
  time: 0xcfd8dc,
  reality: 0xff4f8b,
  arcane: 0xb388ff,
  ult: 0xffffff,
};
const FLOAT: Record<string, Partial<TextStyle>> = {
  '': { fill: 0xffffff, fontSize: 22 },
  crit: { fill: 0xffd166, fontSize: 28 },
  weak: { fill: 0xff7ab8, fontSize: 20 },
  info: { fill: 0xdcd4f2, fontSize: 17 },
  heal: { fill: 0x5cf2a0, fontSize: 22 },
};
const FONT = '"Saira Condensed", "Arial Narrow", sans-serif';

/**
 * The arena: sky and scenery, the floor, two fighters on the horizon, effects, and the combat wheel
 * standing on the floor. Battle events play as animations (legacy cp_anims.js playOne).
 */
export class FightScene {
  readonly world = new Container();
  private sky = new Graphics();
  private scenery = new Container();
  private floor = new Graphics();
  private ambient: Ambient;
  private fighters = new Container();
  private fx = new Container();
  private tint = new Graphics();
  private vignette = new Graphics();
  /** phase two: the boss's light over the backdrop (the fighters stay in their own colors) */
  private phaseGlow = new Graphics();
  /** set when the opponent is a boss: its phase-two light and music tempo */
  phaseKit: { light: number; bpm: number } | null = null;
  private phaseAmt = 0;
  private phaseT = 0;
  private top = new Container();
  readonly wheel = new WheelView();
  readonly F: [FighterView, FighterView];
  readonly tw = new Tweens();
  dims!: FightDims;
  /** animation speed factor (fast mode halves it) */
  sp = 1;
  reduced = false;
  /** the story chapter, whose horizon (Act II) goes behind the arena (upgrade 37) */
  private chapter?: number;
  /** HP in %, for breathing harder when hurt (upgrade 39) */
  private hpPct: [number, number] = [100, 100];
  /** each side's class, for their victory pose (upgrade 39) */
  private archs: [string, string] = ['', ''];
  /** what each side hits with, for the hit sounds (upgrade 36) */
  private hitKinds: [HitKind, HitKind] = ['fist', 'fist'];
  /** effects intensity: shake and particle bursts scale with it (upgrade 33) */
  fxK = 1;
  private grads: FillGradient[] = [];
  private gray = new ColorMatrixFilter();

  constructor(
    readonly app: Application,
    looks: [Look, Look],
    readonly arena: Arena | null,
    opts: { mythic?: boolean; chapter?: number } = {},
  ) {
    this.chapter = opts.chapter;
    this.ambient = new Ambient(arena?.k);
    this.hitKinds = [hitKindOf(looks[0]), hitKindOf(looks[1])];
    this.archs = [looks[0].arch || '', looks[1].arch || ''];
    this.F = [new FighterView(looks[0], 0, { mythic: opts.mythic }), new FighterView(looks[1], 1)];
    this.fighters.addChild(this.F[0], this.F[1]);
    this.world.addChild(this.sky, this.scenery, this.ambient, this.floor, this.phaseGlow, this.fighters, this.fx, this.tint, this.vignette);
    this.phaseGlow.blendMode = 'multiply';
    this.phaseGlow.alpha = 0;
    this.wheel.visible = false;
    app.stage.addChild(this.world, this.wheel, this.top);
    app.ticker.add((t) => {
      this.tw.update(t.deltaMS);
      if (!this.reduced) this.F.forEach((f, i) => f.breathe(t.deltaMS, this.hpPct[i]! < 30));
      if (!this.reduced) this.ambient.update(t.deltaMS / 1000);
      this.wheel.update(t.deltaMS / 1000);
      if (this.phaseAmt > 0) {
        // the light breathes with the phase-two music, two beats a breath
        this.phaseT += t.deltaMS / 1000;
        const beat = 120 / (this.phaseKit?.bpm || 120);
        this.phaseGlow.alpha = this.phaseAmt * (this.reduced ? 0.55 : 0.52 + 0.1 * Math.sin((this.phaseT / beat) * Math.PI * 2));
      }
    });
  }

  /** Lays the scene out for the current screen size. Fighters only move when the screen size changes. */
  layout(W: number, H: number) {
    const d = (this.dims = fightDims(W, H));
    const sky = this.arena?.sky || '#2A2342';
    const floorCol = this.arena?.floor || '#2A2342';
    this.sky.clear().rect(0, 0, W, d.groundY).fill({ color: sky });
    // scenery above the horizon: the legacy 400 x 240 backdrop, bottom-centered, covering the width
    for (const c of this.scenery.removeChildren()) c.destroy();
    const far = chapterSVG(this.chapter);
    if (far) {
      const g = new Graphics().svg(far);
      const sceneH = d.groundY - 10;
      const k = Math.max(d.stageW / 400, sceneH / 240);
      g.scale.set(k);
      g.position.set(d.stageW / 2 - 200 * k, sceneH - 240 * k);
      this.scenery.addChild(g);
    }
    if (this.arena?.k) {
      const g = new Graphics().svg(sceneSVG(this.arena.k));
      const sceneH = d.groundY - 18;
      const k = Math.max(d.stageW / 400, sceneH / 240);
      g.scale.set(k);
      g.position.set(d.stageW / 2 - 200 * k, sceneH - 240 * k);
      this.scenery.addChild(g);
    }
    this.ambient.resize(d.stageW, d.groundY);
    for (const gr of this.grads) gr.destroy();
    this.grads = [drawFloor(this.floor, W, d.groundY - 24, H - d.groundY + 24, floorCol)];
    const vg = new FillGradient({
      type: 'radial',
      center: { x: 0.5, y: 0.45 },
      innerRadius: 0.33,
      outerCenter: { x: 0.5, y: 0.45 },
      outerRadius: 0.75,
      colorStops: [
        { offset: 0, color: 'rgba(0,0,0,0)' },
        { offset: 1, color: 'rgba(0,0,0,0.42)' },
      ],
      textureSpace: 'local',
    });
    this.grads.push(vg);
    this.vignette.clear().rect(0, 0, W, H).fill(vg);
    if (this.phaseKit) this.phaseGlow.clear().rect(0, 0, W, H).fill({ color: this.phaseKit.light });
    for (const f of this.F) f.setHeight(d.chH);
    this.F[0].position.set(d.fcx - d.span, d.groundY);
    this.F[1].position.set(d.fcx + d.span, d.groundY);
    this.homes = [d.fcx - d.span, d.fcx + d.span];
  }
  private homes: [number, number] = [0, 0];

  /** Puts the combat wheel where the DOM left room for it (stage pixels). */
  placeWheel(cx: number, cy: number, size: number, items?: Parameters<WheelView['setItems']>[0]) {
    this.wheel.position.set(cx, cy);
    if (items) this.wheel.setItems(items, size);
    else if (Math.abs(this.wheel.size - size) > 1) this.wheel.setItems(this.wheel.items, size);
  }

  /** The fighters walk in. */
  async intro() {
    const [a, b] = this.F;
    // the hit flash's shader compiles on first use: do it now, not on the first hit
    a.setBrightness(1.001);
    if (this.reduced) {
      await this.tw.run(1, () => {});
      a.setBrightness(1);
      return;
    }
    const d = this.dims;
    await Promise.all([
      this.tw.run(700 * this.sp, (k) => {
        a.x = this.homes[0] - d.stageW * 0.6 * (1 - k);
        a.alpha = k;
      }, ease.out),
      this.tw.run(700 * this.sp, (k) => {
        b.x = this.homes[1] + d.stageW * 0.6 * (1 - k);
        b.alpha = k;
      }, ease.out),
    ]);
    a.setBrightness(1);
  }

  applySnap(s: Snap | null) {
    if (!s) return;
    for (const i of [0, 1] as const) this.F[i].setStatus(s.st[i]!, s.sx?.[i] ?? []);
    if (s.h) this.hpPct = [s.h[0] ?? 100, s.h[1] ?? 100];
  }

  // ---------------------------------------------------------------- effect helpers
  private ctr(i: 0 | 1) {
    return this.F[i].center();
  }
  particles(x: number, y: number, colors: number[], n0: number, spread0 = 40) {
    if (this.reduced) return;
    const n = Math.max(1, Math.round(n0 * this.fxK));
    const spread = spread0 * Math.sqrt(this.fxK);
    for (let i = 0; i < n; i++) {
      const p = new Graphics().rect(-2, -2, 4, 4).fill({ color: colors[i % colors.length]! });
      const sz = (3 + Math.random() * 5) / 4;
      p.scale.set(sz);
      p.position.set(x, y);
      this.fx.addChild(p);
      const ang = Math.random() * Math.PI * 2;
      const dist = spread * (0.5 + Math.random());
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist - 10;
      void this.tw
        .run(
          520 + Math.random() * 260,
          (k) => {
            const u = Math.min(1, k / 0.6);
            p.x = x + dx * (k < 0.6 ? ease.out(u) : 1 + 0.15 * ((k - 0.6) / 0.4));
            p.y = y + dy * (k < 0.6 ? ease.out(u) : 1) + (k > 0.6 ? 26 * ((k - 0.6) / 0.4) : 0);
            p.alpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
          },
          ease.linear,
        )
        .then(() => p.destroy());
    }
  }
  ring(x: number, y: number, color: number, size = 1.6) {
    if (this.reduced) return;
    const r = new Graphics().circle(0, 0, 22).stroke({ width: 3, color });
    r.position.set(x, y);
    this.fx.addChild(r);
    void this.tw
      .run(420, (k) => {
        r.scale.set(0.2 + (size - 0.2) * k);
        r.alpha = 0.9 * (1 - k);
      }, ease.out)
      .then(() => r.destroy());
  }
  floatAt(i: 0 | 1, text: string, cls = '', dy = 0) {
    const c = this.ctr(i);
    const st = FLOAT[cls] || FLOAT['']!;
    const t = new Text({
      text,
      style: { fontFamily: FONT, fontWeight: '800', ...st, stroke: { color: 0x120e1f, width: 4 }, align: 'center' },
    });
    t.anchor.set(0.5, 1);
    const y0 = Math.max(4, c.top - 4 - dy);
    t.position.set(c.x, y0);
    this.fx.addChild(t);
    void this.tw
      .run(1000 * this.sp, (k) => {
        t.y = y0 - (k < 0.22 ? 14 * (k / 0.22) : 14 + 32 * ((k - 0.22) / 0.78));
        t.scale.set(k < 0.22 ? 0.6 + 0.52 * (k / 0.22) : 1.12 - 0.12 * ((k - 0.22) / 0.78));
        t.alpha = k < 0.22 ? k / 0.22 : 1 - (k - 0.22) / 0.78;
      }, ease.out)
      .then(() => t.destroy());
  }
  private emoji(text: string, size: number) {
    const t = new Text({ text, style: { fontSize: size } });
    t.anchor.set(0.5);
    this.fx.addChild(t);
    return t;
  }
  popEmoji(i: 0 | 1, e: string, dy: number | 'top', dur: number, dx = 0) {
    const c = this.ctr(i);
    const t = this.emoji(e, 30);
    const y = dy === 'top' ? c.top - 8 : c.y - dy;
    t.position.set(c.x + dx, y);
    return this.tw
      .run(dur, (k) => {
        t.scale.set(k < 0.3 ? 1.3 * (k / 0.3) : k < 0.75 ? 1.3 - 0.3 * ((k - 0.3) / 0.45) : 1);
        t.alpha = k < 0.3 ? k / 0.3 : k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
        t.y = y - (k < 0.75 ? 0.1 * 30 * (k / 0.75) : 3 + 7 * ((k - 0.75) / 0.25));
      })
      .then(() => t.destroy());
  }
  projectile(from: 0 | 1, to: 0 | 1, e: string, dur: number, o: { size?: number; arc?: number; spin?: boolean; trail?: number } = {}) {
    const a = this.ctr(from);
    const b = this.ctr(to);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = this.emoji(e || '✨', o.size || 28);
    t.position.set(a.x, a.y);
    const arc = o.arc || 0;
    const rot = o.spin ? Math.PI * 4 * (dx > 0 ? 1 : -1) : 0;
    let lastTrail = 0;
    return this.tw
      .run(
        dur,
        (k) => {
          t.x = a.x + dx * k;
          t.y = a.y + dy * k - arc * 4 * k * (1 - k);
          t.rotation = rot * k;
          if (o.trail != null && !this.reduced && k - lastTrail > 0.16) {
            lastTrail = k;
            const d = new Graphics().circle(0, 0, 4).fill({ color: o.trail, alpha: 0.85 });
            d.position.set(t.x, t.y);
            this.fx.addChild(d);
            void this.tw.run(300, (u) => {
              d.scale.set(1 - 0.8 * u);
              d.alpha = 0.85 * (1 - u);
            }).then(() => d.destroy());
          }
        },
        ease.in,
      )
      .then(() => t.destroy());
  }
  private bannerText: Text | null = null;
  banner(text: string, dur: number, keep = false) {
    this.bannerText?.destroy();
    const d = this.dims;
    const t = new Text({
      text,
      style: { fontFamily: FONT, fontWeight: '800', fontSize: Math.round(clamp(d.stageW / 9, 30, 64)), fill: 0xfff3c4, stroke: { color: 0x1a1328, width: 6 }, align: 'center' },
    });
    t.anchor.set(0.5);
    t.position.set(d.fcx, d.groundY * 0.42);
    this.top.addChild(t);
    this.bannerText = t;
    return this.tw.run(dur, (k) => {
      if (t.destroyed) return;
      if (keep) {
        t.scale.set(k < 0.35 ? 0.4 + 0.72 * (k / 0.35) : 1.12 - 0.12 * Math.min(1, (k - 0.35) / 0.3));
        t.alpha = Math.min(1, k / 0.35);
      } else {
        t.scale.set(k < 0.25 ? 0.4 + 0.72 * (k / 0.25) : k < 0.7 ? 1.12 - 0.12 * ((k - 0.25) / 0.45) : 1 + 0.15 * ((k - 0.7) / 0.3));
        t.alpha = k < 0.25 ? k / 0.25 : k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      }
    }).then(() => {
      if (!keep && !t.destroyed) {
        t.destroy();
        if (this.bannerText === t) this.bannerText = null;
      }
    });
  }
  clearBanner() {
    this.bannerText?.destroy();
    this.bannerText = null;
    this.dropProc();
  }
  private dropProc() {
    this.procBox?.destroy({ children: true });
    this.procBox = null;
  }

  private procBox: Container | null = null;
  /** Where the combo or synergy banner sits at full size, in stage pixels (for the layout tests). */
  procBounds() {
    const b = this.procBox;
    if (!b || b.destroyed) return null;
    const lb = b.getLocalBounds();
    return { left: b.x + lb.x, top: b.y + lb.y, right: b.x + lb.x + lb.width, bottom: b.y + lb.y + lb.height };
  }
  private pendingProc: Proc | null = null;
  /**
   * A combo or synergy going off: its name and what it did, over the fighter it belongs to, with its own
   * sound. Shown at the moment of impact for hits.
   */
  showProc(p: Proc) {
    this.procBox?.destroy({ children: true });
    const d = this.dims;
    const mine = p.side === 0;
    const fill = p.kind === 'combo' ? (TINT_COL[COMBOS[p.k]?.tint ?? ''] ?? 0xffd166) : p.anti ? 0xc9c1dc : mine ? 0xffd166 : 0xff9db0;
    const box = new Container();
    const name = new Text({
      text: `${p.n.toUpperCase()}!`,
      style: { fontFamily: FONT, fontWeight: '800', fontSize: Math.round(clamp(d.stageW / 12, 24, 44)), fill, stroke: { color: 0x1a1328, width: 6 }, align: 'center' },
    });
    name.anchor.set(0.5, 1);
    const kind = p.kind === 'combo' ? 'Element combo' : `${mine ? 'Your' : 'Their'} synergy`;
    const sub = new Text({
      text: `${kind} · ${p.sub}`,
      style: { fontFamily: FONT, fontWeight: '700', fontSize: Math.round(clamp(d.stageW / 30, 12, 17)), fill: 0xf3eeff, stroke: { color: 0x1a1328, width: 4 }, align: 'center' },
    });
    sub.anchor.set(0.5, 0);
    sub.y = 2;
    // long names shrink to fit narrow phones
    for (const t of [name, sub]) {
      const max = d.stageW - 20;
      if (t.width > max) t.style.fontSize = Math.floor((t.style.fontSize * max) / t.width);
    }
    box.addChild(name, sub);
    // over its owner, kept on the stage; in the gap between the HP bars and the fighters' heads
    const half = Math.max(name.width, sub.width) / 2 + 8;
    const x = d.fcx + (mine ? -1 : 1) * d.span * 0.55;
    const heads = d.groundY - d.chH;
    box.position.set(clamp(x, half, Math.max(half, d.stageW - half)), Math.max(d.hud + name.height + 4, d.hud + (heads - d.hud) * 0.55));
    this.top.addChild(box);
    this.procBox = box;
    procSound(p.k);
    buzz(p.kind === 'combo' ? [20, 30, 20] : 20);
    const dur = 1500 * this.sp;
    const still = this.reduced;
    void this.tw
      .run(dur, (k) => {
        if (box.destroyed) return;
        if (!still) box.scale.set(k < 0.18 ? 0.4 + 0.75 * (k / 0.18) : k < 0.32 ? 1.15 - 0.15 * ((k - 0.18) / 0.14) : 1);
        box.alpha = k < 0.12 ? k / 0.12 : k < 0.78 ? 1 : 1 - (k - 0.78) / 0.22;
        if (!still && k > 0.78) box.y -= 0.6;
      })
      .then(() => {
        if (!box.destroyed) box.destroy({ children: true });
        if (this.procBox === box) this.procBox = null;
      });
  }
  tintFlash(k: string | undefined, dur: number) {
    if (!k) return;
    const col = TINT_COL[k] ?? 0xffffff;
    const d = this.dims;
    this.tint.clear().rect(0, 0, d.W, d.H).fill({ color: col });
    void this.tw.run(dur, (u) => (this.tint.alpha = 0.42 * Math.sin(u * Math.PI)));
  }
  shake(amp0: number, dur: number) {
    if (this.reduced) return Promise.resolve();
    const amp = amp0 * this.fxK;
    return this.tw.keys(dur, [0, -amp, amp, -amp * 0.6, amp * 0.4, 0], (v) => (this.world.pivot.x = v)).then(() => (this.world.pivot.x = 0));
  }
  private hitStop(ms: number) {
    return this.reduced ? Promise.resolve() : this.tw.wait(ms);
  }
  private windUp(i: 0 | 1) {
    const b = this.F[i].body;
    return this.tw.keys(180 * this.sp, [0, 1, 0], (v) => b.scale.set(1 + 0.08 * v, 1 - 0.12 * v));
  }
  private knockback(i: 0 | 1, amt: number) {
    const f = this.F[i];
    const dir = i === 0 ? -1 : 1;
    const home = this.homes[i];
    return this.tw.keys(360 * this.sp, [0, dir * amt, 0], (v) => (f.x = home + v), ease.out, [0, 0.35, 1]);
  }
  private flash(i: 0 | 1, peak: number, dur: number, squash = false) {
    const f = this.F[i];
    return this.tw
      .keys(dur, [0, 1, 0], (v) => {
        f.setBrightness(1 + (peak - 1) * v);
        if (squash) f.body.scale.set(1 - 0.1 * v, 1 + 0.08 * v);
      })
      .then(() => f.setBrightness(1));
  }
  armTo(i: 0 | 1, angles: number[], dur: number) {
    if (this.reduced) return Promise.resolve();
    const f = this.F[i];
    return this.tw.keys(dur, angles, (v) => (f.armAngle = v), ease.inOut);
  }

  private impact(e: BattleEvent, a: Record<string, unknown>) {
    const sp = this.sp;
    if (this.pendingProc) {
      this.showProc(this.pendingProc);
      this.pendingProc = null;
    }
    const t = a.to as 0 | 1;
    const big = !!a.crit || a.t === 'ult';
    this.applySnap(e);
    void this.knockback(t, big ? 26 : 12);
    if (this.finOn) {
      this.tintFlash('ult', 380 * sp);
      void this.shake(12, 420 * sp);
    } else if (big && !this.reduced) {
      const d = this.dims;
      void this.tw.keys(320 * sp, [1, 1.05, 1], (v) => {
        this.world.scale.set(v);
        this.world.position.set(d.fcx * (1 - v), d.groundY * 0.6 * (1 - v));
      });
    }
    void this.flash(t, 2.4, 280 * sp, true);
    const c = this.ctr(t);
    const col = TINT_COL[a.tint as string] ?? (a.kind === 'melee' ? 0xffe082 : 0xffffff);
    this.particles(c.x, c.y - 6, [col, 0xffffff], big ? 20 : 10, big ? 70 : 44);
    this.ring(c.x, c.y - 6, col, big ? 2.4 : 1.5);
    const bt = this.emoji(a.kind === 'power' || a.kind === 'ult' ? ((a.fx as string) || '💥') : '💥', a.t === 'ult' ? 64 : 40);
    bt.position.set(c.x + (a.by === 0 ? -8 : 8), c.y - 6);
    void this.tw
      .run(380 * sp, (k) => {
        bt.scale.set(k < 0.5 ? 0.3 + 0.95 * (k / 0.5) : 1.25 + 0.35 * ((k - 0.5) / 0.5));
        bt.alpha = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
      })
      .then(() => bt.destroy());
    let dy = 0;
    if (e.d != null) {
      this.floatAt(t, '−' + e.d, big ? 'crit' : '', dy);
      dy += 26;
    }
    if (a.crit) {
      this.floatAt(t, 'Crit!', 'crit', dy);
      dy += 26;
    }
    if (a.weak) {
      this.floatAt(t, 'Weak spot!', 'weak', dy);
      dy += 22;
    }
    if (a.broke) {
      this.floatAt(t, 'Guard broken', 'info', dy);
      dy += 22;
    }
    if (a.guarded) this.floatAt(t, 'Guarded', 'info', dy);
    if (a.tint) this.tintFlash(a.tint as string, 440 * sp);
    if (big) void this.shake(a.t === 'ult' ? 10 : 6, 380 * sp);
    // what it was dealt with, its element, and how hard it landed
    const by = (a.by ?? 0) as 0 | 1;
    hitSound(a.kind === 'power' || a.kind === 'ult' ? 'magic' : this.hitKinds[by], a.tint as string | undefined, big ? 1 : Math.min(1, (e.d || 0) / 30), !!a.crit);
    if (big) buzz(30);
  }

  /**
   * The winner's pose, by class (upgrade 39): the strong flex, casters float with their weapon held high,
   * the quick ones twirl, the honourable salute, the showmen dance, everyone else hops with an arm up.
   */
  private async victoryPose(w: 0 | 1) {
    const sp = this.sp;
    const f = this.F[w];
    const b = f.body;
    const pose = POSE[this.archs[w]] ?? 'hop';
    if (this.reduced) {
      void this.armTo(w, [0, -150], 1);
      return this.tw.wait(500);
    }
    if (pose === 'flex') {
      void this.armTo(w, [0, -120, -95, -120], 900 * sp);
      void this.tw.keys(900 * sp, [0, 1, 0, 1, 0], (v) => b.scale.set(1 + 0.08 * v, 1 - 0.06 * v));
      void this.shake(4, 300 * sp);
    } else if (pose === 'float') {
      void this.armTo(w, [0, -170], 500 * sp);
      void this.tw.keys(1000 * sp, [0, -16, -12, -16], (v) => (b.y = v));
      const c = this.ctr(w);
      setTimeout(() => this.particles(c.x, c.y - 20, [0xb388ff, 0xffffff, 0x3dd6c6], 16, 60), 300 * sp);
    } else if (pose === 'twirl') {
      void this.tw.keys(700 * sp, [1, -1, 1], (v) => (f.flip.scale.x = (w === 1 ? -1 : 1) * v));
      void this.armTo(w, [0, -60, -150], 800 * sp);
      void this.tw.keys(700 * sp, [0, -14, 0], (v) => (b.y = v));
    } else if (pose === 'salute') {
      void this.armTo(w, [0, -95, -95], 700 * sp);
      void this.tw.keys(900 * sp, [0, 0.12, 0.12, 0], (v) => (b.rotation = (w === 0 ? 1 : -1) * v * 0.35));
    } else if (pose === 'dance') {
      const home = f.x;
      void this.armTo(w, [0, -150, -40, -150, -40, -150], 1000 * sp);
      void this.tw.keys(1000 * sp, [0, -8, 8, -8, 8, 0], (v) => (f.x = home + v));
      void this.tw.keys(1000 * sp, [0, -10, 0, -10, 0, -10, 0], (v) => (b.y = v));
    } else {
      void this.armTo(w, [0, -160], 500 * sp);
      void this.tw.keys(800 * sp, [0, -22, 0, -12, 0], (v) => (b.y = v));
    }
    await this.tw.wait(1000 * sp);
  }

  // ---------------------------------------------------------------- battle animations
  /** Phase two: the arena slowly takes on the boss's light. */
  phaseLight() {
    if (!this.phaseKit || this.phaseAmt > 0) return;
    this.phaseGlow.clear().rect(0, 0, this.dims.W, this.dims.H).fill({ color: this.phaseKit.light });
    this.phaseAmt = 0.001;
    void this.tw.run(this.reduced ? 1 : 1400, (k) => (this.phaseAmt = Math.max(0.001, k)));
  }

  /**
   * Plays one event; `p` is the combo or synergy behind it that gets a banner, if any. The `finisher` (the blow
   * that leads into a knockout) plays in slow motion with the camera pushed in on its target.
   */
  async play(e: BattleEvent, p: Proc | null = null, finisher = false): Promise<void> {
    if (!finisher || this.reduced) return this.playOne(e, p);
    const base = this.sp;
    const a = e.a as { to?: 0 | 1; on?: 0 | 1 } | null;
    this.finisherIn((a?.to ?? a?.on ?? 1) as 0 | 1);
    this.sp = base * 2.4;
    try {
      await this.playOne(e, p);
    } finally {
      this.sp = base;
    }
  }

  // ---------------------------------------------------------------- the finisher
  private finOn = false;
  private bars: Graphics | null = null;
  /** how many finishers played (for the tests) */
  finishers = 0;
  /** Slow motion starts: cinema bars slide in and the camera pushes in on the fighter about to fall. */
  private finisherIn(t: 0 | 1) {
    const d = this.dims;
    const c = this.ctr(t);
    this.finOn = true;
    this.finishers++;
    const zoom = 1.3;
    const cx = clamp(c.x, d.stageW * 0.3, d.stageW * 0.7);
    const cy = c.y;
    void this.tw.run(420, (k) => {
      const s = 1 + (zoom - 1) * ease.out(k);
      this.world.scale.set(s);
      this.world.position.set(cx * (1 - s), cy * (1 - s));
    });
    this.bars?.destroy();
    const bars = (this.bars = new Graphics());
    this.top.addChildAt(bars, 0);
    const bh = Math.round(d.H * 0.07);
    void this.tw.run(300, (k) => {
      if (bars.destroyed) return;
      const h = bh * ease.out(k);
      bars.clear().rect(0, 0, d.stageW, h).rect(0, d.H - h, d.stageW, h).fill({ color: 0x000000, alpha: 0.85 });
    });
    finisherSound();
    buzz([20, 40, 80]);
  }
  /** Back to normal speed and framing (after the K.O., or at once when skipping). */
  private finisherOut(instant = false) {
    if (!this.finOn) return;
    this.finOn = false;
    const bars = this.bars;
    this.bars = null;
    const s0 = this.world.scale.x;
    const p0 = { x: this.world.position.x, y: this.world.position.y };
    const done = () => {
      this.world.scale.set(1);
      this.world.position.set(0, 0);
      bars?.destroy();
    };
    if (instant) return done();
    void this.tw
      .run(450, (k) => {
        const u = ease.inOut(k);
        this.world.scale.set(s0 + (1 - s0) * u);
        this.world.position.set(p0.x * (1 - u), p0.y * (1 - u));
        if (bars && !bars.destroyed) bars.alpha = 1 - u;
      })
      .then(done);
  }

  private async playOne(e: BattleEvent, p: Proc | null): Promise<void> {
    const sp = this.sp;
    const a = e.a as (Record<string, unknown> & { t: string; by?: 0 | 1; to?: 0 | 1; on?: 0 | 1 }) | null;
    if (a?.t === 'phase' && a.on === 1) this.phaseLight();
    if (p) {
      if (!a || this.reduced || (a.t !== 'hit' && a.t !== 'ult')) this.showProc(p);
      else this.pendingProc = p;
    }
    if (!a || this.reduced) {
      this.applySnap(e);
      if (a && a.t === 'ko') this.F[a.on!].setDown(true);
      if (a && a.t === 'revive') this.F[a.on!].setDown(false);
      await this.tw.wait((e.cls === 'special' ? 650 : 420) * sp);
      return;
    }
    try {
      switch (a.t) {
        case 'hit':
          if (a.kind === 'melee') await this.melee(e, a);
          else await this.ranged(e, a);
          break;
        case 'ult':
          await this.ult(e, a);
          break;
        case 'miss':
          await this.miss(e, a);
          break;
        case 'guard': {
          void this.armTo(a.on!, [0, -50, -50, 0], 760 * sp);
          void this.popEmoji(a.on!, '🛡️', 0, 760 * sp, a.on === 0 ? 44 : -44);
          this.applySnap(e);
          this.floatAt(a.on!, 'Guard', 'info');
          beep(520, 0.1, 'triangle', 0.04);
          await this.tw.wait(640 * sp);
          break;
        }
        case 'skip': {
          void this.popEmoji(a.on!, (a.fx as string) || '💤', 'top', 900 * sp);
          const b = this.F[a.on!].body;
          void this.tw.keys(600 * sp, [0, -8, 8, 0], (v) => (b.rotation = (v * Math.PI) / 180));
          this.applySnap(e);
          beep(300, 0.12, 'triangle', 0.03);
          await this.tw.wait(760 * sp);
          break;
        }
        case 'self': {
          void this.popEmoji(a.on!, a.fx as string, 'top', 720 * sp);
          await this.tw.wait(200 * sp);
          this.applySnap(e);
          const f = this.F[a.on!];
          const home = this.homes[a.on!];
          void this.tw.keys(320 * sp, [0, -8, 8, -4.8, 3.2, 0], (v) => (f.x = home + v));
          void this.flash(a.on!, 2.2, 260 * sp);
          if (a.tint) this.tintFlash(a.tint as string, 420 * sp);
          if (e.d != null) this.floatAt(a.on!, '−' + e.d);
          thud(false);
          await this.tw.wait(560 * sp);
          break;
        }
        case 'uno': {
          const c = this.ctr(a.by!);
          const card = this.emoji('🃏', 40);
          card.position.set(c.x + (a.by === 0 ? 44 : -44), c.y);
          await this.tw.run(460 * sp, (k) => {
            card.scale.set((0.5 + 0.8 * k) * Math.cos(k * Math.PI * 2), 0.5 + 0.8 * k);
          });
          card.destroy();
          this.floatAt(a.by!, 'Uno reverse!', 'info');
          await this.projectile(a.by!, a.to!, '💥', 300 * sp, { size: 36 });
          this.impact(e, { ...a, kind: 'power', fx: '🃏' });
          await this.tw.wait(360 * sp);
          break;
        }
        case 'heal': {
          this.applySnap(e);
          void this.flash(a.on!, 1.4, 620 * sp);
          if (e.d != null) this.floatAt(a.on!, '+' + e.d, 'heal');
          beep(660, 0.1, 'triangle', 0.04);
          beep(990, 0.12, 'triangle', 0.04, 0.08);
          await this.tw.wait(580 * sp);
          break;
        }
        case 'dot': {
          void this.popEmoji(a.on!, '🫧', 30, 640 * sp);
          this.applySnap(e);
          this.tintFlash('poison', 360 * sp);
          if (e.d != null) this.floatAt(a.on!, '−' + e.d);
          await this.tw.wait(560 * sp);
          break;
        }
        case 'status': {
          void this.popEmoji(a.on!, a.fx as string, 'top', 900 * sp);
          if (a.tint) this.tintFlash(a.tint as string, 460 * sp);
          this.applySnap(e);
          beep(440, 0.12, 'triangle', 0.04);
          await this.tw.wait(760 * sp);
          break;
        }
        case 'pet':
          await this.projectile(a.by!, a.to!, a.fx as string, 520 * sp, { size: 38, arc: 14 });
          this.impact(e, { ...a, kind: 'melee' });
          await this.tw.wait(300 * sp);
          break;
        case 'timestop': {
          const d = this.dims;
          const t = this.emoji('⏱️', 64);
          t.position.set(d.fcx, d.groundY / 2 - 14);
          void this.tw.run(900 * sp, (k) => {
            t.scale.set(k < 0.3 ? 0.3 + 0.9 * (k / 0.3) : k < 0.8 ? 1.2 - 0.2 * ((k - 0.3) / 0.5) : 1 + 0.4 * ((k - 0.8) / 0.2));
            t.alpha = k < 0.3 ? k / 0.3 : k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2;
          }).then(() => t.destroy());
          this.world.filters = [this.gray];
          void this.tw.keys(1000 * sp, [0, 1, 1, 0], (v) => this.gray.greyscale(v, false), ease.linear, [0, 0.2, 0.85, 1]).then(() => (this.world.filters = null));
          void this.armTo(a.by!, [0, -140, -140, 0], 900 * sp);
          this.applySnap(e);
          beep(1200, 0.3, 'sine', 0.04);
          await this.tw.wait(820 * sp);
          break;
        }
        case 'revive': {
          const f = this.F[a.on!];
          f.setDown(false);
          void this.popEmoji(a.on!, (a.fx as string) || '✨', 'top', 820 * sp);
          void this.tw.keys(620 * sp, [0, 1, 0], (v) => {
            f.body.y = -18 * v;
            f.body.scale.set(1 + 0.12 * v);
          });
          this.applySnap(e);
          this.floatAt(a.on!, 'Back up!', 'info');
          [330, 440, 660].forEach((fq, i) => beep(fq, 0.12, 'triangle', 0.04, i * 0.07));
          await this.tw.wait(760 * sp);
          break;
        }
        case 'ko': {
          this.applySnap(e);
          await this.hitStop(180);
          this.F[a.on!].setDown(true);
          const c = this.ctr(a.on!);
          setTimeout(() => this.particles(c.x, c.y + 40, [0xb0a49c, 0xd7ccc8, 0x8d6e63], 14, 50), 380 * sp);
          await this.tw.wait(300 * sp);
          this.dropProc();
          void this.banner('K.O.', 700 * sp, true);
          this.finisherOut();
          const w = a.win as 0 | 1;
          const cw = this.ctr(w);
          setTimeout(() => this.particles(cw.x, cw.y - 30, [0xffb627, 0xff4f8b, 0x3dd6c6, 0xb388ff, 0xffffff], 30, 90), 200 * sp);
          thud(true);
          await this.victoryPose(w);
          break;
        }
        case 'win': {
          this.applySnap(e);
          void this.banner('Decision', 700 * sp, true);
          await this.victoryPose(a.on! as 0 | 1);
          break;
        }
        case 'read': {
          this.applySnap(e);
          void this.popEmoji(a.on!, '🎯', 'top', 700 * sp);
          this.floatAt(a.on!, 'Read it!', 'weak');
          beep(880, 0.08, 'triangle', 0.04);
          beep(1320, 0.1, 'triangle', 0.04, 0.07);
          await this.tw.wait(560 * sp);
          break;
        }
        case 'banner':
          this.applySnap(e);
          void this.banner(a.text as string, 1300 * sp);
          await this.tw.wait(1000 * sp);
          break;
        case 'phase': {
          this.applySnap(e);
          void this.shake(16, 600 * sp);
          const c = this.ctr(a.on!);
          this.particles(c.x, c.y - 10, [0xff5a5f, 0xf2b544, 0xffffff], 30, 90);
          this.ring(c.x, c.y - 10, 0xff5a5f, 3);
          const b = this.F[a.on!].body;
          void this.tw.keys(600 * sp, [1, 1.15, 1], (v) => b.scale.set(v));
          this.tintFlash('fire', 800 * sp);
          beep(110, 0.5, 'sawtooth', 0.07);
          buzz([80, 60, 120]);
          void this.banner((a.text as string) || 'Phase two', 1500 * sp, true);
          await this.tw.wait(1300 * sp);
          this.clearBanner();
          break;
        }
        default:
          this.applySnap(e);
          await this.tw.wait(420 * sp);
      }
    } catch {
      this.applySnap(e);
    }
    if (this.pendingProc) {
      this.showProc(this.pendingProc);
      this.pendingProc = null;
    }
  }

  private async melee(e: BattleEvent, a: Record<string, unknown> & { by?: 0 | 1; to?: 0 | 1 }) {
    const sp = this.sp;
    const by = a.by!;
    const dir = by === 0 ? 1 : -1;
    const A0 = this.ctr(by);
    const B0 = this.ctr(a.to!);
    const dist = Math.max(0, Math.abs(B0.x - A0.x) - 80);
    await this.windUp(by);
    const f = this.F[by];
    const home = this.homes[by];
    const lunge = this.tw.keys(600 * sp, [0, dir * dist, dir * dist, 0], (v) => (f.x = home + v), ease.inOut, [0, 0.45, 0.6, 1]);
    void this.armTo(by, [0, -85, 60, 0], 600 * sp);
    await this.tw.wait(300 * sp);
    this.impact(e, a);
    if (a.crit) await this.hitStop(110);
    await lunge;
    await this.tw.wait(150 * sp);
  }
  private async ranged(e: BattleEvent, a: Record<string, unknown> & { by?: 0 | 1; to?: 0 | 1 }) {
    const sp = this.sp;
    const pw = a.kind === 'power';
    void this.armTo(a.by!, pw ? [0, -125, -125, 0] : [0, -25, -25, 0], (pw ? 640 : 440) * sp);
    if (pw) void this.flash(a.by!, 1.7, 340 * sp);
    await this.windUp(a.by!);
    if (pw) {
      const c = this.ctr(a.by!);
      this.particles(c.x, c.y, [TINT_COL[a.tint as string] ?? 0xffffff], 8, 26);
    }
    await this.projectile(a.by!, a.to!, a.fx as string, (pw ? 460 : 340) * sp, {
      size: pw ? 40 : 28,
      arc: pw ? 26 : 10,
      spin: !!a.spin,
      trail: TINT_COL[a.tint as string] ?? 0xffffff,
    });
    this.impact(e, a);
    if (a.crit) await this.hitStop(110);
    await this.tw.wait(320 * sp);
  }
  private async ult(e: BattleEvent, a: Record<string, unknown> & { by?: 0 | 1; to?: 0 | 1 }) {
    const sp = this.sp;
    void this.banner(a.name as string, 1200 * sp);
    void this.armTo(a.by!, [0, -150, -150, 70, 0], 1100 * sp);
    const b = this.F[a.by!].body;
    void this.tw.keys(720 * sp, [1, 1.25, 1], (v) => b.scale.set(v), ease.inOut, [0, 0.6, 1]);
    this.tintFlash('ult', 520 * sp);
    [392, 523, 659, 880].forEach((f, i) => beep(f, 0.14, 'sawtooth', 0.04, i * 0.06));
    await this.tw.wait(640 * sp);
    const c = this.ctr(a.by!);
    this.particles(c.x, c.y, [0xffffff, TINT_COL[a.tint as string] ?? 0xffb627], 18, 60);
    await this.projectile(a.by!, a.to!, a.fx as string, 380 * sp, { size: 64, arc: 34, trail: TINT_COL[a.tint as string] ?? 0xffb627 });
    this.impact(e, a);
    await this.hitStop(160);
    await this.tw.wait(480 * sp);
  }
  private async miss(e: BattleEvent, a: Record<string, unknown> & { by?: 0 | 1; to?: 0 | 1 }) {
    const sp = this.sp;
    const by = a.by!;
    const dir = by === 0 ? 1 : -1;
    if (a.kind === 'melee') {
      const A0 = this.ctr(by);
      const B0 = this.ctr(a.to!);
      const dist = Math.max(0, Math.abs(B0.x - A0.x) - 100);
      const f = this.F[by];
      const home = this.homes[by];
      void this.tw.keys(540 * sp, [0, dir * dist, 0], (v) => (f.x = home + v), ease.inOut, [0, 0.5, 1]);
      void this.armTo(by, [0, -85, 60, 0], 540 * sp);
      await this.tw.wait(230 * sp);
    } else {
      void this.armTo(by, [0, -60, 0], 440 * sp);
      void this.projectile(by, a.to!, a.fx as string, 340 * sp, { size: a.kind === 'power' ? 40 : 28, arc: 20 });
      await this.tw.wait(230 * sp);
    }
    const t = this.F[a.to!];
    const home = this.homes[a.to!];
    void this.tw.keys(440 * sp, [0, 1, 0], (v) => {
      t.x = home + dir * 30 * v;
      t.y = this.dims.groundY - 32 * v;
    }, ease.out, [0, 0.4, 1]);
    this.applySnap(e);
    this.floatAt(a.to!, 'Miss', 'info');
    beep(700, 0.05, 'triangle', 0.02);
    await this.tw.wait(520 * sp);
  }

  /** Skips whatever is animating (skip, forfeit). */
  settle() {
    this.tw.clear();
    this.finisherOut(true);
    this.world.pivot.set(0, 0);
    if (this.phaseAmt > 0) this.phaseAmt = 1;
    this.dropProc();
    this.pendingProc = null;
    this.world.scale.set(1);
    this.world.position.set(0, 0);
    this.world.filters = null;
    this.tint.alpha = 0;
    for (const i of [0, 1] as const) {
      const f = this.F[i];
      f.x = this.homes[i];
      f.y = this.dims.groundY;
      f.alpha = 1;
      f.body.scale.set(1);
      f.body.y = 0;
      f.armAngle = 0;
      f.setBrightness(1);
    }
  }

  destroy() {
    this.tw.clear();
    for (const g of this.grads) g.destroy();
  }
}

/** What a fighter hits with, from their weapon's kind (upgrade 36). */
function hitKindOf(look: Look): HitKind {
  const w = WEAPONS.find((x) => x.n === look.weapon);
  if (!w || (w as { fists?: boolean }).fists) return 'fist';
  const t = new Set(w.t || []);
  if (t.has('ranged') || t.has('string')) return 'ranged';
  if (t.has('blade')) return 'blade';
  if (t.has('blunt')) return 'blunt';
  return 'fist';
}

/** Victory poses by class (upgrade 39). */
type Pose = 'flex' | 'float' | 'twirl' | 'salute' | 'dance' | 'hop';
const POSE: Record<string, Pose> = {
  brawler: 'flex', berserker: 'flex', tank: 'flex', wrestler: 'flex', slayer: 'flex', resilient: 'flex',
  mage: 'float', necro: 'float', alchemist: 'float', druid: 'float', chosen: 'float', monk: 'float',
  assassin: 'twirl', trickster: 'twirl', ninja: 'twirl', gunslinger: 'twirl',
  paladin: 'salute', samurai: 'salute', pirate: 'salute', tamer: 'salute',
  bard: 'dance', streamer: 'dance', gambler: 'dance', chef: 'dance',
};
