// What each power looks like when it hits: fire throws a fireball, ice a volley of shards, lightning strikes
// from the sky, holy light falls as a pillar, earth splits the floor into spikes, telekinesis hurls a rock,
// gravity crushes, vines grow out of the ground, clones run in, luck drops an anvil... One choreography per
// power key; ultimates play the same, bigger. Every one calls `hit` once, when it lands (or is dodged).

import { Container, Graphics } from 'pixi.js';
import { type Blow, ghostOf } from './attacks';
import { beam, burst, dirOf, dust, fade, fly, fxTex, gfx, iconTex, mix, piece, pillar, popIn, shock, wait, zap, type Pt, type Stage } from './fx-kit';
import { ease } from './tween';

const WHITE = 0xffffff;

/** The power's color (for powers without their own choreography, and for the aura flash). */
export const POWER_COL: Record<string, number> = {
  fire: 0xff7a2f, ice: 0x8fe7ff, lightning: 0xffe14d, water: 0x3d8bff, shadow: 0x6a1b9a, light: 0xfff3b0, tk: 0xa1887f, mind: 0xff4fd8,
  tele: 0xb388ff, regen: 0x4cd964, luck: 0x7cb342, poison: 0x9be22d, gravity: 0x6b2fbf, clones: 0xb0bec5, shape: 0x26a69a, time: 0xcfd8dc,
  reality: 0xff4f8b, negate: 0xe53935, smite: 0xffd54f, ward: 0xfff3b0, miracle: 0xfffde7, drain: 0xd50000, chains: 0x78909c, arcane: 0xb388ff,
  earth: 0xa1887f, wind: 0xcff4ff, sonic: 0xffd180, vines: 0x66bb6a, boom: 0xff7043, magnet: 0xb0bec5, illusion: 0xe1bee7, summon: 0x9575cd,
};
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

function aim(S: Stage, b: Blow, dy = -6): Pt {
  const c = S.ctr(b.to);
  return { x: c.x - dirOf(b.by) * 8, y: c.y + dy };
}
const arm = (S: Stage, i: 0 | 1, angles: number[], dur: number, at?: number[]) => S.tw.keys(dur * S.sp, angles, (v) => (S.F[i].armAngle = v), ease.inOut, at);
/** The caster gathers it: the arm goes up (or out), a glow at the hand. */
async function gather(S: Stage, b: Blow, col: number, up = true) {
  void arm(S, b.by, up ? [0, -150, -150, -90, 0] : [0, -88, -88, -88, 0], 900, [0, 0.25, 0.55, 0.7, 1]);
  void S.flash(b.by, 1.6, 320 * S.sp);
  await wait(S, 180);
  const h = S.hand(b.by);
  S.particles(h.x, h.y, [col, WHITE], 6, 20);
  await wait(S, 80);
}
const sz = (b: Blow) => (b.big ? 1.6 : 1);

/** Plays power `key` from b.by to b.to. */
export async function powerAttack(S: Stage, key: string, b: Blow): Promise<void> {
  const col = POWER_COL[key] ?? b.tint ?? 0xb388ff;
  const by = b.by,
    to = b.to,
    dir = dirOf(by);
  const k = sz(b);
  const tgt = () => aim(S, b);
  const miss = !!b.miss;
  const dodge = () => ({ x: tgt().x + dir * 46, y: tgt().y - 18 });
  const end = () => (miss ? dodge() : tgt());
  const T = S.ctr(to);
  const G = S.dims.groundY;
  switch (key) {
    case 'fire': {
      await gather(S, b, col, false);
      const h = S.hand(by);
      const f = piece(S, fxTex('fireball'), h, 1.1 * k);
      f.scale.x *= dir;
      await fly(S, f, h, end(), 300, { arc: 14, embers: [0xff7a2f, 0xffd166, 0xffe27a] });
      f.destroy();
      b.hit();
      if (!miss) {
        void burst(S, tgt(), '#FF7A2F', 1.3 * k);
        for (let i = 0; i < 3; i++) {
          const p = piece(S, fxTex('puff', '#5A4A52'), { x: tgt().x + (i - 1) * 14, y: tgt().y - 4 }, 0.9);
          void fade(S, p, 600, 0.7, 26);
        }
        S.particles(tgt().x, tgt().y, [0xff7a2f, 0xffd166], 10, 40);
      }
      return;
    }
    case 'ice': {
      await gather(S, b, col, false);
      const h = S.hand(by);
      for (let i = 0; i < 3; i++) {
        const s = piece(S, fxTex('shard'), h, k);
        const e = { x: end().x, y: end().y + (i - 1) * 12 };
        void fly(S, s, h, e, 220, { face: true, trail: 0xbff4ff }).then(() => {
          s.destroy();
          if (!miss) S.particles(e.x, e.y, [0xbff4ff, WHITE, 0x8fe7ff], 5, 22);
        });
        await wait(S, 80);
      }
      await wait(S, 140);
      b.hit();
      if (!miss) void shock(S, tgt(), 0xbff4ff, S.dims.chH * 0.35, 380);
      return;
    }
    case 'lightning': {
      void arm(S, by, [0, -172, -172, 0], 800, [0, 0.25, 0.7, 1]);
      await wait(S, 240);
      S.tintFlash('lightning', 200 * S.sp);
      const x = miss ? T.x + dir * 50 : T.x;
      const yEnd = miss ? G - 4 : T.y - 6;
      void zap(S, { x: x + (Math.random() - 0.5) * 40, y: 0 }, { x, y: yEnd }, 0xffe14d, 12 * k, 360, 22);
      await wait(S, 40);
      b.hit();
      if (!miss) {
        S.particles(x, yEnd, [0xffe14d, WHITE], 12, 40);
        void zap(S, { x, y: yEnd }, { x: x + 30, y: G }, 0xffe14d, 4, 220, 10);
        void zap(S, { x, y: yEnd }, { x: x - 30, y: G }, 0xffe14d, 4, 220, 10);
      } else void shock(S, { x, y: G }, 0xffe14d, 40, 300, true);
      await wait(S, 260);
      return;
    }
    case 'water': {
      await gather(S, b, col, false);
      const h = S.hand(by);
      for (let i = 0; i < 6; i++) {
        const d = piece(S, fxTex('drop', '#3D8BFF'), h, 0.9 * k);
        const e = { x: end().x, y: end().y + (Math.random() - 0.5) * 10 };
        void fly(S, d, h, e, 230, { arc: 10, face: true }).then(() => {
          d.destroy();
          if (!miss) S.particles(e.x, e.y, [0x3d8bff, 0x9fd0ff, WHITE], 3, 26);
        });
        if (i === 1) void wait(S, 230).then(() => b.hit());
        await wait(S, 45);
      }
      await wait(S, 260);
      if (!miss) void shock(S, { x: T.x, y: G }, 0x9fd0ff, S.F[to].w * 0.7, 360, true);
      return;
    }
    case 'shadow':
    case 'summon':
    case 'chains': {
      // a pool of darkness under the target, and something comes out of it
      void arm(S, by, [0, -60, -60, 0], 900, [0, 0.2, 0.75, 1]);
      const x = miss ? T.x + dir * 40 : T.x;
      const pool = gfx(S, { x, y: G });
      const pc = key === 'summon' ? 0x5e35b1 : key === 'chains' ? 0x2b1033 : 0x1b0b2e;
      await S.tw.run(260 * S.sp, (u) => {
        pool.clear().ellipse(0, 0, S.F[to].w * 0.62 * ease.out(u) * k, 9 * ease.out(u)).fill({ color: pc, alpha: 0.85 }).stroke({ width: 2, color: key === 'summon' ? 0xb388ff : 0x8e24aa, alpha: 0.9 });
      });
      if (key === 'chains') {
        // two chains shoot up and cross over the target
        const links: Container[] = [];
        for (const s of [-1, 1]) {
          const a = { x: x + s * S.F[to].w * 0.5, y: G };
          const e = { x: x - s * S.F[to].w * 0.25, y: T.top + 18 };
          const n = 10;
          for (let i = 0; i < n; i++) {
            const p = piece(S, fxTex('link'), mix(a, e, i / (n - 1)), 1.7 * k);
            p.rotation = Math.atan2(e.y - a.y, e.x - a.x) + (i % 2 ? Math.PI / 2 : 0);
            p.alpha = 0;
            links.push(p);
            void wait(S, i * 30).then(() => (p.alpha = 1));
          }
        }
        await wait(S, 240);
        b.hit();
        await wait(S, 260);
        for (const l of links) {
          const y0 = l.y;
          void S.tw.run(320 * S.sp, (u) => {
            l.y = y0 + (G - y0) * ease.in(u);
            l.alpha = 1 - u;
          }).then(() => l.destroy());
        }
      } else {
        // tendrils (shadow) or a summoned tentacle (summon) rise, curl over and strike
        const n = key === 'summon' ? 1 : 3;
        const gs: Graphics[] = [];
        for (let i = 0; i < n; i++) gs.push(gfx(S));
        await S.tw.run(300 * S.sp, (u) => {
          gs.forEach((g, i) => {
            const bx = x + (n === 1 ? -dir * 30 : (i - 1) * 16);
            const h = (T.y - T.top) * 1.6 * ease.out(u) * (n === 1 ? 1.3 : 1);
            const top = { x: bx + (i - 1) * 8 + (n === 1 ? dir * 26 * u : 0), y: G - h };
            const w = (n === 1 ? 18 : 6) * k;
            g.clear()
              .moveTo(bx, G)
              .quadraticCurveTo(bx - (i - 1) * 14 - dir * 16, G - h * 0.5, top.x, top.y)
              .stroke({ width: w, color: n === 1 ? 0x4527a0 : 0x2b0f3e, cap: 'round' })
              .moveTo(bx, G)
              .quadraticCurveTo(bx - (i - 1) * 14 - dir * 16, G - h * 0.5, top.x, top.y)
              .stroke({ width: w * 0.35, color: n === 1 ? 0xb388ff : 0x8e24aa, cap: 'round' });
          });
        });
        b.hit();
        if (!miss) void burst(S, tgt(), hex(key === 'summon' ? 0xb388ff : 0x8e24aa), 0.9 * k);
        await wait(S, 180);
        for (const g of gs) void fade(S, g, 260);
      }
      void fade(S, pool, 300);
      await wait(S, 160);
      return;
    }
    case 'light':
    case 'smite': {
      void arm(S, by, [0, -172, -172, 0], 900, [0, 0.25, 0.7, 1]);
      await wait(S, 220);
      const x = miss ? T.x + dir * 50 : T.x;
      if (key === 'smite') {
        // the mark first, then the blow
        const m = gfx(S, { x, y: T.y - 6 });
        const r = S.dims.chH * 0.22;
        m.circle(0, 0, r).stroke({ width: 3, color: 0xffd54f }).moveTo(-r * 1.3, 0).lineTo(r * 1.3, 0).moveTo(0, -r * 1.3).lineTo(0, r * 1.3).stroke({ width: 2, color: 0xffd54f });
        await popIn(S, m, 140);
        await wait(S, 120);
        m.destroy();
      }
      void pillar(S, x, miss ? G : T.y + (key === 'smite' ? 30 : 10), key === 'smite' ? 0xffc93a : 0xfff3b0, (key === 'smite' ? 16 : 26) * k, 520);
      await wait(S, 110);
      b.hit();
      S.particles(x, T.y, [0xfff3b0, WHITE, 0xffd54f], 10, 36);
      for (let i = 0; i < 4; i++) {
        const t = piece(S, fxTex('twinkle', '#FFF3B0'), { x: x + (Math.random() - 0.5) * 50, y: T.top + Math.random() * (T.y - T.top) }, 1.2);
        void fade(S, t, 500, 0.4, 16);
      }
      if (key === 'smite') {
        void shock(S, { x, y: G }, 0xffd54f, S.F[to].w, 420, true);
        void S.shake(6 * k, 240);
      }
      await wait(S, 200);
      return;
    }
    case 'tk':
    case 'earth': {
      if (key === 'earth') {
        // a stomp, and the floor splits toward them in spikes
        const bd = S.F[by].body;
        void S.tw.keys(300 * S.sp, [1, 0.86, 1], (v) => bd.scale.set(2 - v, v));
        await wait(S, 160);
        void S.shake(5, 520);
        const x0 = S.homes[by] + dir * 30;
        const x1 = miss ? T.x + dir * 40 : T.x;
        for (let i = 0; i < 3; i++) {
          const x = x0 + (x1 - x0) * ((i + 1) / 3);
          const s = piece(S, fxTex('spike'), { x, y: G + 4 }, (1.5 + i * 0.45) * k);
          s.anchor.set(0.5, 1);
          const sy = s.scale.y;
          s.scale.y = 0;
          void S.tw.run(130 * S.sp, (u) => (s.scale.y = sy * ease.back(u)));
          dust(S, x, 2);
          void wait(S, 420).then(() => fade(S, s, 200));
          if (i === 2) b.hit();
          await wait(S, 110);
        }
        await wait(S, 240);
        return;
      }
      // telekinesis: a rock lifts off the floor, then flies at them
      void arm(S, by, [0, -130, -130, -70, 0], 1000, [0, 0.2, 0.55, 0.65, 1]);
      const at = { x: S.homes[by] + dir * S.F[by].w * 0.5, y: G - 6 };
      const r = piece(S, fxTex('rock'), at, 1.3 * k);
      dust(S, at.x, 1);
      const up = { x: at.x, y: S.ctr(by).top - 10 };
      await S.tw.run(320 * S.sp, (u) => {
        r.y = at.y + (up.y - at.y) * ease.out(u);
        r.rotation = Math.sin(u * 12) * 0.08;
      });
      await fly(S, r, up, end(), 260, { spin: 0.8 * dir, arc: 8 });
      b.hit();
      if (!miss) S.particles(r.x, r.y, [0x8c7a6b, 0xb8a898], 12, 40);
      void fade(S, r, 160);
      await wait(S, 200);
      return;
    }
    case 'mind':
    case 'sonic': {
      void arm(S, by, key === 'mind' ? [0, -140, -140, 0] : [0, -40, -40, 0], 820, [0, 0.2, 0.75, 1]);
      if (key === 'sonic') {
        const bd = S.F[by].body;
        void S.tw.keys(500 * S.sp, [1, 1.08, 1], (v) => bd.scale.set(v));
      }
      await wait(S, 200);
      const A = S.ctr(by);
      const from = { x: A.x + dir * 12, y: key === 'mind' ? A.top + 14 : A.top + 22 };
      const e = miss ? dodge() : { x: T.x, y: key === 'mind' ? T.top + 14 : T.y - 10 };
      for (let i = 0; i < 4; i++) {
        const g = gfx(S);
        const c = key === 'mind' ? 0xff4fd8 : 0xffd180;
        void S.tw.run(320 * S.sp, (u) => {
          const p = mix(from, e, u);
          const r = (8 + 22 * u) * k;
          g.clear();
          if (key === 'mind') g.circle(p.x, p.y, r);
          else g.arc(p.x - dir * r * 0.6, p.y, r * 1.5, dir > 0 ? -0.8 : Math.PI - 0.8, dir > 0 ? 0.8 : Math.PI + 0.8);
          g.stroke({ width: key === 'mind' ? 3 : 5, color: c, alpha: 0.9 * (1 - u * 0.5) });
        }).then(() => g.destroy());
        await wait(S, 70);
      }
      await wait(S, 200);
      b.hit();
      if (!miss) {
        const bd = S.F[to].body;
        if (key === 'mind') void S.tw.keys(420 * S.sp, [0, 0.1, -0.1, 0], (v) => (bd.rotation = v));
        else void S.shake(4 * k, 260);
        for (let i = 0; i < 3; i++) {
          const t = piece(S, fxTex('twinkle', key === 'mind' ? '#FF9DEB' : '#FFE0B0'), { x: T.x + (i - 1) * 14, y: T.top + 4 }, 1);
          void fade(S, t, 420, 0.3, 12);
        }
      }
      await wait(S, 160);
      return;
    }
    case 'tele': {
      // gone, behind them, a hit, gone again, home
      const f = S.F[by];
      const home = S.homes[by];
      const A = S.ctr(by);
      S.particles(A.x, A.y, [0xb388ff, WHITE], 10, 30);
      await S.tw.run(140 * S.sp, (u) => (f.alpha = 1 - u));
      f.x = T.x + dir * (miss ? 70 : 46);
      // behind them, facing them
      const fx0 = f.flip.scale.x;
      f.flip.scale.x = -fx0;
      S.particles(f.x, A.y, [0xb388ff, WHITE], 10, 30);
      await S.tw.run(120 * S.sp, (u) => (f.alpha = u));
      void arm(S, by, [0, -150, 50, 0], 360, [0, 0.35, 0.6, 1]);
      await wait(S, 200);
      b.hit();
      if (!miss) void burst(S, { x: T.x + dir * 10, y: T.y - 6 }, '#B388FF', 0.9 * k);
      await wait(S, 200);
      await S.tw.run(120 * S.sp, (u) => (f.alpha = 1 - u));
      f.x = home;
      f.flip.scale.x = fx0;
      await S.tw.run(140 * S.sp, (u) => (f.alpha = u));
      return;
    }
    case 'gravity': {
      void arm(S, by, [0, -110, -110, 0], 900, [0, 0.2, 0.75, 1]);
      const x = miss ? T.x + dir * 40 : T.x;
      const o = piece(S, fxTex('orb', '#7B3FE0'), { x, y: T.top - 20 }, 0.3);
      const k0 = o.scale.x;
      // it pulls things in as it grows
      S.particles(x, T.top - 20, [0x9c6bff, 0x3b1f5e], 10, 50);
      await S.tw.run(300 * S.sp, (u) => o.scale.set(k0 * (1 + 7 * ease.out(u)) * k));
      void shock(S, { x, y: T.y }, 0x9c6bff, S.dims.chH * 0.5, 300);
      await S.tw.run(160 * S.sp, (u) => (o.y = T.top - 20 + (T.y - T.top) * 0.7 * ease.in(u)));
      b.hit();
      if (!miss) {
        const bd = S.F[to].body;
        void S.tw.keys(420 * S.sp, [1, 0.78, 1], (v) => bd.scale.set(2 - v, v), ease.out, [0, 0.3, 1]);
        void S.shake(6 * k, 260);
        S.particles(x, G - 10, [0x6b2fbf, 0x9c6bff], 10, 40);
      }
      void fade(S, o, 220);
      await wait(S, 220);
      return;
    }
    case 'shape': {
      // turns into something with claws for one swipe
      const f = S.F[by];
      void S.flash(by, 2.2, 300 * S.sp);
      void S.tw.keys(300 * S.sp, [1, 1.18, 1.1], (v) => f.body.scale.set(v));
      const home = S.homes[by];
      const dist = Math.max(0, Math.abs(S.homes[to] - home) - 74) * dir;
      const go = S.tw.keys(640 * S.sp, [0, dist, dist, 0], (v) => (f.x = home + v), ease.inOut, [0, 0.42, 0.62, 1]);
      await wait(S, 300);
      const c = piece(S, fxTex('claws', '#FFFFFF'), tgt(), 1.4 * k);
      c.scale.x *= dir;
      void fade(S, c, 300, 0.2);
      b.hit();
      if (!miss) S.particles(tgt().x, tgt().y, [0x26a69a, WHITE], 8, 30);
      await go;
      f.body.scale.set(1);
      return;
    }
    case 'reality': {
      void arm(S, by, [0, -120, -120, 0], 800, [0, 0.2, 0.75, 1]);
      await wait(S, 160);
      const g = gfx(S);
      const f = S.F[to];
      const home = S.homes[to];
      await S.tw.run(380 * S.sp, (u) => {
        g.clear();
        for (let i = 0; i < 6; i++) {
          const y = T.top + Math.random() * (G - T.top);
          g.rect(T.x - 40 + (Math.random() - 0.5) * 30, y, 50 + Math.random() * 40, 3 + Math.random() * 6).fill({ color: i % 2 ? 0xff4f8b : 0x2de2e6, alpha: 0.75 });
        }
        if (!miss) f.x = home + (Math.random() - 0.5) * 10 * (1 - u);
      });
      f.x = home;
      g.destroy();
      b.hit();
      if (!miss) S.particles(T.x, T.y, [0xff4f8b, 0x2de2e6, WHITE], 12, 44);
      await wait(S, 180);
      return;
    }
    case 'negate':
    case 'ward': {
      void arm(S, by, [0, -88, -88, 0], 760, [0, 0.2, 0.75, 1]);
      await wait(S, 200);
      if (key === 'ward') {
        // a shield of light, pushed into them
        const h = S.hand(by);
        const s = piece(S, iconTex('shield'), h, 1.6 * k);
        await fly(S, s, h, end(), 260, { trail: 0xfff3b0 });
        b.hit();
        if (!miss) {
          void shock(S, tgt(), 0xfff3b0, S.dims.chH * 0.4, 320);
          void S.knockback(to, 18);
        }
        void fade(S, s, 180, 0.4);
      } else {
        // the no-entry sign, over them
        const m = gfx(S, { x: miss ? T.x + dir * 40 : T.x, y: T.y - 10 });
        const r = S.dims.chH * 0.24 * k;
        m.circle(0, 0, r).stroke({ width: 5, color: 0xe53935 }).moveTo(-r * 0.7, -r * 0.7).lineTo(r * 0.7, r * 0.7).stroke({ width: 5, color: 0xe53935 });
        await popIn(S, m, 160);
        b.hit();
        if (!miss) S.particles(T.x, T.y, [0xe53935, 0x9e9e9e], 10, 36);
        await wait(S, 200);
        void fade(S, m, 200, 0.3);
      }
      await wait(S, 160);
      return;
    }
    case 'miracle':
    case 'regen':
    case 'luck': {
      if (key === 'luck') {
        // absurd luck: an anvil, from nowhere
        void arm(S, by, [0, -60, 0], 600);
        const x = miss ? T.x + dir * 54 : T.x;
        const a = piece(S, fxTex('anvil'), { x, y: -30 }, 1.3 * k);
        const sh = gfx(S, { x, y: G });
        await S.tw.run(420 * S.sp, (u) => {
          a.y = -30 + (T.top + 6 + 30) * ease.in(u);
          sh.clear().ellipse(0, 0, 26 * u, 5 * u).fill({ color: 0x000000, alpha: 0.35 * u });
        });
        sh.destroy();
        b.hit();
        dust(S, x, 3);
        void S.shake(8 * k, 280);
        if (!miss) void dizzy4(S, to);
        void fade(S, a, 260);
        await wait(S, 220);
        return;
      }
      // golden rays (miracle) or a swirl of leaves (regen) around them
      void arm(S, by, [0, -160, -160, 0], 900, [0, 0.2, 0.75, 1]);
      await wait(S, 200);
      const c = { x: miss ? T.x + dir * 40 : T.x, y: T.y - 6 };
      if (key === 'miracle') {
        const g = gfx(S, c);
        await S.tw.run(420 * S.sp, (u) => {
          g.clear();
          const R = S.dims.chH * 0.7 * k;
          for (let i = 0; i < 10; i++) {
            const a = u * 1.2 + (i * Math.PI * 2) / 10;
            g.poly([0, 0, Math.cos(a - 0.08) * R, Math.sin(a - 0.08) * R, Math.cos(a + 0.08) * R, Math.sin(a + 0.08) * R]).fill({ color: 0xfff3b0, alpha: 0.45 * Math.sin(u * Math.PI) });
          }
        });
        g.destroy();
      } else {
        const leaves: Container[] = [];
        for (let i = 0; i < 6; i++) leaves.push(piece(S, fxTex('leaf', '#4CD964'), c, 1.1));
        await S.tw.run(460 * S.sp, (u) => {
          leaves.forEach((l, i) => {
            const a = u * Math.PI * 3 + (i * Math.PI * 2) / 6;
            const r = S.F[to].w * 0.5 * (1 - u * 0.7);
            l.position.set(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.5 - 20 * u);
            l.rotation = a;
          });
        });
        leaves.forEach((l) => l.destroy());
      }
      b.hit();
      if (!miss) void burst(S, c, key === 'miracle' ? '#FFF3B0' : '#4CD964', k);
      await wait(S, 200);
      return;
    }
    case 'drain': {
      void arm(S, by, [0, -88, -88, 0], 1000, [0, 0.2, 0.8, 1]);
      await wait(S, 200);
      const h = S.hand(by);
      void beam(S, h, end(), 0xd50000, 4 * k, 300);
      await wait(S, 60);
      b.hit();
      if (!miss) {
        // their life, flowing back
        for (let i = 0; i < 6; i++) {
          const o = piece(S, fxTex('orb', '#D50000'), tgt(), 0.45);
          void fly(S, o, tgt(), S.hand(by), 300, { arc: (i - 2.5) * 10 }).then(() => o.destroy());
          await wait(S, 50);
        }
        void S.flash(by, 1.5, 300 * S.sp);
      }
      await wait(S, 260);
      return;
    }
    case 'arcane': {
      void arm(S, by, [0, -110, -110, 0], 900, [0, 0.2, 0.8, 1]);
      await wait(S, 200);
      const h = S.hand(by);
      for (let i = 0; i < 3; i++) {
        const o = piece(S, fxTex('orb', '#B388FF'), h, 0.7 * k);
        const e = { x: end().x, y: end().y + (i - 1) * 8 };
        void fly(S, o, h, e, 300, { bend: (i - 1) * 50 * dir + 20, embers: [0xb388ff, WHITE] }).then(() => {
          o.destroy();
          if (!miss) void burst(S, e, '#B388FF', 0.5);
        });
        if (i === 0) void wait(S, 300).then(() => b.hit());
        await wait(S, 90);
      }
      await wait(S, 320);
      return;
    }
    case 'wind': {
      void arm(S, by, [0, -88, -88, 0], 820, [0, 0.2, 0.75, 1]);
      await wait(S, 180);
      const A = S.ctr(by);
      for (let i = 0; i < 5; i++) {
        const g = gfx(S);
        const y = A.top + 10 + i * ((G - A.top - 20) / 5);
        void S.tw.run(300 * S.sp, (u) => {
          const x0 = A.x + dir * 20 + (T.x - A.x) * u;
          g.clear().moveTo(x0, y).quadraticCurveTo(x0 + dir * 26, y - 10, x0 + dir * 52, y - 2).stroke({ width: 3, color: 0xe8fbff, alpha: 0.8 * (1 - u * 0.6) });
        }).then(() => g.destroy());
        await wait(S, 40);
      }
      await wait(S, 160);
      b.hit();
      if (!miss) {
        void S.knockback(to, 30 * k);
        for (let i = 0; i < 3; i++) {
          const l = piece(S, fxTex('leaf', '#8FD16A'), { x: T.x, y: T.y - 10 + i * 10 }, 0.9);
          void fly(S, l, l.position.clone(), { x: T.x + dir * 80, y: T.y - 30 + i * 10 }, 400, { spin: 1 }).then(() => l.destroy());
        }
      }
      await wait(S, 180);
      return;
    }
    case 'vines': {
      void arm(S, by, [0, -60, -60, 0], 900, [0, 0.2, 0.75, 1]);
      await wait(S, 160);
      const x = miss ? T.x + dir * 40 : T.x;
      const gs = [gfx(S), gfx(S)];
      const tips: Container[] = [];
      for (let i = 0; i < 2; i++) tips.push(piece(S, fxTex('leaf', '#66BB6A'), { x, y: G }, 1.2));
      await S.tw.run(320 * S.sp, (u) => {
        gs.forEach((g, i) => {
          const s = i ? 1 : -1;
          const h = (G - T.top) * 0.85 * ease.out(u);
          const p0 = { x: x + s * 18, y: G };
          const p1 = { x: x - s * 26, y: G - h * 0.55 };
          const p2 = { x: x + s * 10, y: G - h };
          g.clear().moveTo(p0.x, p0.y).quadraticCurveTo(p1.x, p1.y, p2.x, p2.y).stroke({ width: 5 * k, color: 0x2e7d32, cap: 'round' });
          g.moveTo(p0.x, p0.y).quadraticCurveTo(p1.x, p1.y, p2.x, p2.y).stroke({ width: 2 * k, color: 0x81c784, cap: 'round' });
          tips[i]!.position.set(p2.x, p2.y);
        });
      });
      b.hit();
      if (!miss) S.particles(T.x, T.y, [0x66bb6a, 0xa5d6a7], 8, 30);
      await wait(S, 220);
      for (const g of gs) void fade(S, g, 240);
      for (const t of tips) void fade(S, t, 240);
      await wait(S, 120);
      return;
    }
    case 'boom': {
      void arm(S, by, [0, -165, 30, 0], 520, [0, 0.4, 0.55, 1]);
      await wait(S, 230);
      const h = S.hand(by);
      const bomb = piece(S, fxTex('bomb'), h, 1.1 * k);
      await fly(S, bomb, h, miss ? { x: T.x + dir * 50, y: G - 10 } : tgt(), 380, { arc: 56, spin: dir });
      bomb.destroy();
      b.hit();
      const p = miss ? { x: T.x + dir * 50, y: G - 16 } : tgt();
      void burst(S, p, '#FF7043', 1.6 * k);
      for (let i = 0; i < 4; i++) {
        const q = piece(S, fxTex('puff', '#6E6470'), { x: p.x + (i - 1.5) * 16, y: p.y - 6 }, 1.1);
        void fade(S, q, 700, 0.8, 30);
      }
      void S.shake(10 * k, 340);
      S.particles(p.x, p.y, [0xff7043, 0xffd166, 0x3a3448], 16, 60);
      await wait(S, 260);
      return;
    }
    case 'magnet': {
      void arm(S, by, [0, -88, -88, 0], 900, [0, 0.2, 0.75, 1]);
      await wait(S, 160);
      const A = S.ctr(by);
      const g = gfx(S);
      await S.tw.run(320 * S.sp, (u) => {
        g.clear();
        for (let i = 0; i < 3; i++) {
          const yy = A.y - 20 + i * 18;
          const mid = (A.x + T.x) / 2;
          g.moveTo(A.x + dir * 14, yy).quadraticCurveTo(mid, yy - 30 + i * 20, T.x, T.y - 20 + i * 18).stroke({ width: 2, color: i % 2 ? 0xe5484d : 0x3d8bff, alpha: 0.85 * Math.sin(u * Math.PI) });
        }
      });
      g.destroy();
      if (!miss) {
        const f = S.F[to];
        const home = S.homes[to];
        await S.tw.keys(260 * S.sp, [0, -dir * 36, 0], (v) => (f.x = home + v), ease.inOut, [0, 0.6, 1]);
        S.particles(T.x, T.y, [0xb0bec5, 0x78909c], 8, 30);
      }
      b.hit();
      await wait(S, 160);
      return;
    }
    case 'clones':
    case 'illusion': {
      // copies of them run in first (clones hit, illusions only distract), then the real one
      const n = key === 'clones' ? 3 : 2;
      const A = S.homes[by];
      const ghosts: Container[] = [];
      for (let i = 0; i < n; i++) ghosts.push(ghostOf(S, by, A - dir * (i + 1) * 18, key === 'clones' ? 0xcfd8dc : 0xe1bee7, key === 'clones' ? 0.8 : 0.5));
      const dist = Math.abs(S.homes[to] - A) - 70;
      await Promise.all(
        ghosts.map((g, i) =>
          wait(S, i * 70).then(() =>
            S.tw.run(300 * S.sp, (u) => {
              g.x = A - dir * (i + 1) * 18 + dir * (dist + (i + 1) * 18) * ease.in(u);
            }),
          ),
        ),
      );
      b.hit();
      if (!miss) void burst(S, tgt(), '#E1E6EA', 0.9 * k);
      for (const g of ghosts) void fade(S, g, 240, 0.1);
      await wait(S, 260);
      return;
    }
    case 'poison': {
      void arm(S, by, [0, -150, 20, 0], 560, [0, 0.4, 0.55, 1]);
      await wait(S, 240);
      const h = S.hand(by);
      const d = piece(S, fxTex('drop', '#9BE22D'), h, 1.8 * k);
      await fly(S, d, h, end(), 320, { arc: 40, face: true });
      d.destroy();
      b.hit();
      if (!miss) {
        for (let i = 0; i < 4; i++) {
          const p = piece(S, fxTex('puff', '#9BE22D'), { x: T.x + (i - 1.5) * 14, y: T.y - 6 + (i % 2) * 8 }, 0.9);
          p.alpha = 0.7;
          void fade(S, p, 800, 0.6, 20);
        }
        for (let i = 0; i < 5; i++) {
          const o = piece(S, fxTex('orb', '#9BE22D'), { x: T.x + (Math.random() - 0.5) * 40, y: T.y }, 0.3);
          void fade(S, o, 600, 0.5, 40 + Math.random() * 20);
        }
      }
      await wait(S, 260);
      return;
    }
    case 'time': {
      void arm(S, by, [0, -140, -140, 0], 900, [0, 0.2, 0.75, 1]);
      await wait(S, 180);
      const c = { x: miss ? T.x + dir * 40 : T.x, y: T.y - 10 };
      const g = gfx(S, c);
      const R = S.dims.chH * 0.36 * k;
      await S.tw.run(460 * S.sp, (u) => {
        g.clear().circle(0, 0, R).stroke({ width: 3, color: 0xcfd8dc, alpha: 0.9 });
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          g.moveTo(Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85).lineTo(Math.cos(a) * R, Math.sin(a) * R);
        }
        g.stroke({ width: 2, color: 0xcfd8dc });
        const a = -Math.PI / 2 + u * Math.PI * 6;
        g.moveTo(0, 0).lineTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8).stroke({ width: 3, color: WHITE });
        g.moveTo(0, 0).lineTo(Math.cos(a / 12) * R * 0.5, Math.sin(a / 12) * R * 0.5).stroke({ width: 3, color: WHITE });
      });
      b.hit();
      void fade(S, g, 260, 0.3);
      if (!miss) void burst(S, c, '#CFD8DC', 0.8);
      await wait(S, 180);
      return;
    }
    default: {
      // anything else: a bolt of its color
      await gather(S, b, col, false);
      const h = S.hand(by);
      const o = piece(S, fxTex('orb', hex(col)), h, 0.8 * k);
      await fly(S, o, h, end(), 300, { arc: 18, embers: [col, WHITE] });
      o.destroy();
      b.hit();
      if (!miss) void burst(S, tgt(), hex(col), k);
      await wait(S, 200);
    }
  }
}

/** Stars around a head after an anvil. */
function dizzy4(S: Stage, i: 0 | 1) {
  const c = S.ctr(i);
  const stars: Container[] = [];
  for (let k = 0; k < 4; k++) stars.push(piece(S, fxTex('twinkle', '#FFE27A'), { x: c.x, y: c.top }, 1.2));
  const r = S.F[i].w * 0.34;
  return S.tw
    .run(800 * S.sp, (u) => {
      stars.forEach((s, k) => {
        const a = u * Math.PI * 4 + (k * Math.PI) / 2;
        s.position.set(c.x + Math.cos(a) * r, c.top + 6 + Math.sin(a) * r * 0.3);
        s.alpha = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2;
      });
    })
    .then(() => stars.forEach((s) => s.destroy()));
}
