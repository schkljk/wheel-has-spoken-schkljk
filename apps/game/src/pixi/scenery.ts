import { Container, FillGradient, Graphics } from 'pixi.js';

// Arena scenery (legacy ui_scene.js sceneSVG and ui_c.js ambient particles), drawn in Pixi.

import { chapterSVG, sceneSVG } from './scenery-svg';

export { chapterSVG, sceneSVG };

// ---------------------------------------------------------------- ambient particles
type AmbKind = 'ember' | 'snow' | 'rain' | 'leaf' | 'star' | 'spark' | 'fog' | 'dust' | 'steam' | 'autumn' | 'petal' | 'confetti';
const AMB: Record<string, AmbKind> = {
  lava: 'ember',
  tundra: 'snow',
  flood: 'rain',
  thunder: 'rain',
  rooftop: 'rain',
  forest: 'leaf',
  space: 'star',
  void: 'star',
  graveyard: 'fog',
  cathedral: 'dust',
  colosseum: 'dust',
  kitchen: 'steam',
  mirror: 'spark',
  beach: 'spark',
  ballpit: 'dust',
  snowglobe: 'snow',
  newyear: 'confetti',
  valentine: 'petal',
  clover: 'leaf',
  egghunt: 'petal',
  bonfire: 'ember',
  poolparty: 'spark',
  pumpkin: 'autumn',
  leafpile: 'autumn',
};
const CONFETTI = [0xff5c8a, 0xffe14d, 0x5cf2a0, 0x82b1ff, 0xce93d8];
interface Mote {
  g: Graphics;
  x: number;
  y: number;
  dur: number;
  t: number;
  sz: number;
}
/** Embers rising, snow falling, rain, leaves, twinkling stars... matched to the arena. */
export class Ambient extends Container {
  private kind: AmbKind;
  private motes: Mote[] = [];
  private w = 1;
  private h = 1;
  constructor(arena: string | undefined) {
    super();
    this.kind = AMB[arena || ''] || 'dust';
    const n = this.kind === 'fog' ? 5 : this.kind === 'rain' ? 26 : 18;
    for (let i = 0; i < n; i++) {
      const t = this.kind;
      const g = new Graphics();
      const flake = t === 'leaf' || t === 'autumn' || t === 'petal';
      const sz = t === 'fog' ? 120 + (i % 3) * 60 : flake ? 7 + (i % 3) * 2 : t === 'confetti' ? 5 + (i % 3) : 2 + (i % 4);
      const col = {
        ember: 0xffb627,
        snow: 0xffffff,
        rain: 0xc8e1ff,
        leaf: 0x7cb342,
        star: 0xffffff,
        spark: 0xffffff,
        fog: 0xdcd2f0,
        dust: 0xfff0d2,
        steam: 0xffffff,
        autumn: i % 2 ? 0xe65100 : 0xf9a825,
        petal: i % 2 ? 0xff8fb1 : 0xffd1dc,
        confetti: CONFETTI[i % CONFETTI.length]!,
      }[t];
      if (t === 'rain') g.rect(-0.75, -7, 1.5, 14).fill({ color: col, alpha: 0.8 });
      else if (t === 'fog') g.ellipse(0, 0, sz / 2, sz / 6).fill({ color: col, alpha: 0.16 });
      else if (flake) g.ellipse(0, 0, sz / 2, sz / 4).fill({ color: col });
      else if (t === 'confetti') g.rect(-sz / 2, -sz / 4, sz, sz / 2).fill({ color: col });
      else g.circle(0, 0, sz / 2).fill({ color: col, alpha: t === 'steam' ? 0.35 : t === 'dust' ? 0.7 : 1 });
      const dur = t === 'rain' ? 0.7 + (i % 5) * 0.12 : t === 'star' || t === 'spark' ? 2 + (i % 4) : 5 + (i % 6) * 1.3;
      this.motes.push({ g, x: ((i * 37 + 13) % 100) / 100, y: ((i * 29) % 70) / 100, dur, t: (i * 0.61) % 6, sz });
      this.addChild(g);
    }
  }
  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }
  update(dt: number) {
    const { w, h, kind } = this;
    for (const m of this.motes) {
      m.t += dt;
      const k = (m.t % m.dur) / m.dur;
      const x = m.x * w;
      let y = 0;
      let a = 1;
      switch (kind) {
        case 'ember':
        case 'steam':
          y = h * (0.92 - k * 0.9);
          a = Math.sin(k * Math.PI);
          m.g.x = x + Math.sin(k * 6 + m.x * 9) * 8;
          break;
        case 'snow':
        case 'leaf':
        case 'autumn':
        case 'petal':
        case 'confetti':
          y = h * (-0.06 + k * 1.06);
          a = Math.min(1, Math.sin(k * Math.PI) * 2);
          m.g.x = x + Math.sin(k * 5 + m.x * 7) * 18;
          if (kind !== 'snow') m.g.rotation = k * (kind === 'confetti' ? 14 : 6);
          break;
        case 'rain':
          y = h * (-0.1 + k * 1.1);
          a = 0.8;
          m.g.x = x - k * 20;
          break;
        case 'star':
        case 'spark':
          y = m.y * h;
          a = 0.25 + 0.75 * Math.abs(Math.sin(k * Math.PI));
          m.g.x = x;
          break;
        case 'fog':
          y = h * 0.82;
          a = Math.sin(k * Math.PI);
          m.g.x = ((m.x + k * 0.6) % 1.2) * w - 0.1 * w;
          break;
        default:
          y = h * (0.8 - k * 0.5);
          a = Math.sin(k * Math.PI) * 0.8;
          m.g.x = x + Math.sin(k * 4) * 12;
      }
      m.g.y = y;
      m.g.alpha = Math.max(0, a);
    }
  }
}

/** The arena floor from the horizon down: its color, a perspective grid, light and shade. */
export function drawFloor(g: Graphics, w: number, top: number, h: number, color: string) {
  g.clear();
  g.rect(0, top, w, h).fill({ color });
  // perspective grid: lines run to a vanishing point above the horizon
  const vx = w / 2;
  const vy = top - h * 1.4;
  for (let i = -14; i <= 14; i++) {
    const x = vx + i * 56;
    const k = (top - vy) / (top + h - vy);
    g.moveTo(vx + (x - vx) * k, top)
      .lineTo(x, top + h)
      .stroke({ width: 1, color: 0xffffff, alpha: 0.08 });
  }
  let y = top + 4;
  let step = 6;
  while (y < top + h) {
    g.moveTo(0, y).lineTo(w, y).stroke({ width: 1, color: 0xffffff, alpha: 0.08 });
    step *= 1.35;
    y += step;
  }
  const shade = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: 'rgba(255,255,255,0.10)' },
      { offset: 0.14, color: 'rgba(255,255,255,0)' },
      { offset: 0.45, color: 'rgba(0,0,0,0.18)' },
      { offset: 1, color: 'rgba(0,0,0,0.5)' },
    ],
    textureSpace: 'local',
  });
  g.rect(0, top, w, h).fill(shade);
  return shade;
}
