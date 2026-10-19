// How each weapon is used: bows and crossbows shoot, lasers fire a beam, shuriken, chakrams, boomerangs and
// bricks are thrown (the returning ones come back to the hand), blades slash or thrust, hammers and pans come
// down on heads, bats swing, nunchucks flurry, whips crack from a distance, fishing rods hook and yank, magic
// staves cast, chainsaws grind. Every attack calls `hit` once, at the moment of contact (or of the dodge).

import { Container } from 'pixi.js';
import { EGLOW } from '../art/sprite';
import type { Look } from '../art/sprite';
import { beam, burst, dirOf, dust, fade, fly, fxTex, gfx, hexN, mix, piece, popIn, shock, wait, weaponTex, type Pt, type Stage } from './fx-kit';
import { ease } from './tween';
import { weaponStyle } from './weapon-style';
import { sfx } from '../audio/engine';

export interface Blow {
  by: 0 | 1;
  to: 0 | 1;
  look: Look;
  /** the target dodges: the move plays the same, nothing lands */
  miss?: boolean;
  /** an ultimate: bigger in every way */
  big?: boolean;
  /** the element's color, for trails and bursts */
  tint?: number;
  /** contact (or the dodge): called once */
  hit: () => void;
}

const WHITE = 0xffffff;
const toHex = (n: number) => '#' + n.toString(16).padStart(6, '0');

/** Moves the attacker toward the target and back: arrives at `tIn`, leaves at `tOut` (fractions of dur). */
function dash(S: Stage, by: 0 | 1, to: 0 | 1, gap: number, dur: number, tIn = 0.42, tOut = 0.62) {
  const f = S.F[by];
  const home = S.homes[by];
  const dist = Math.max(0, Math.abs(S.homes[to] - home) - gap) * dirOf(by);
  return S.tw.keys(dur * S.sp, [0, dist, dist, 0], (v) => (f.x = home + v), ease.inOut, [0, tIn, tOut, 1]);
}
/** Arm keyframes at given offsets. */
const arm = (S: Stage, i: 0 | 1, angles: number[], dur: number, at?: number[]) => S.tw.keys(dur * S.sp, angles, (v) => (S.F[i].armAngle = v), ease.inOut, at);

/** The point an attack lands on: the target's middle, a little toward the attacker. */
function aim(S: Stage, b: Blow, dy = -6): Pt {
  const c = S.ctr(b.to);
  return { x: c.x - dirOf(b.by) * 8, y: c.y + dy };
}
/** Where a dodged projectile ends up: past the target and off. */
function past(S: Stage, b: Blow, from: Pt): Pt {
  const t = aim(S, b);
  const k = 1.9;
  return { x: from.x + (t.x - from.x) * k, y: from.y + (t.y - from.y) * k - 30 };
}
const glowOf = (b: Blow) => b.tint ?? (b.look.ench && EGLOW[b.look.ench] ? hexN(EGLOW[b.look.ench]!) : undefined);

/** A blade's arc at the target: a crescent that flashes and widens. `rot` turns it (radians), `k` sizes it. */
function slashMark(S: Stage, b: Blow, at: Pt, rot: number, k: number, col = WHITE) {
  const s = piece(S, fxTex('slash', toHex(col)), at, 1.25 * k * (b.big ? 1.5 : 1));
  s.scale.x *= dirOf(b.by);
  s.rotation = rot * dirOf(b.by);
  s.blendMode = 'add';
  void fade(S, s, 380, 0.3);
}
/** Dizzy stars that circle a head for a moment. */
function dizzy(S: Stage, i: 0 | 1) {
  const c = S.ctr(i);
  const stars: Container[] = [];
  for (let k = 0; k < 3; k++) stars.push(piece(S, fxTex('twinkle', '#FFE27A'), { x: c.x, y: c.top }, 1.2));
  const r = S.F[i].w * 0.32;
  return S.tw
    .run(700 * S.sp, (u) => {
      stars.forEach((s, k) => {
        const a = u * Math.PI * 4 + (k * Math.PI * 2) / 3;
        s.position.set(c.x + Math.cos(a) * r, c.top + 6 + Math.sin(a) * r * 0.3);
        s.alpha = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2;
      });
    })
    .then(() => stars.forEach((s) => s.destroy()));
}

/** Plays the weapon attack of `b.look`. */
export async function weaponAttack(S: Stage, b: Blow): Promise<void> {
  const style = weaponStyle(b.look.weapon);
  const by = b.by,
    to = b.to,
    dir = dirOf(by);
  const big = !!b.big;
  const glow = glowOf(b);
  const tgt = () => aim(S, b);
  // the sounds: an ultimate's are bigger and deeper; a dodged blow makes no contact sound
  const snd = (name: string, delay = 0) => sfx(name, { pitch: big ? 0.85 : 1, gain: big ? 1.25 : 1, delay: (Math.max(0, delay) * S.sp) / 1000 });
  const contact = (name: string) => !b.miss && snd(name);
  switch (style) {
    case 'shoot': {
      const bolt = (b.look.weapon || '').toLowerCase().includes('crossbow');
      if (!bolt) snd('w.shoot.draw');
      await arm(S, by, [0, -86], 200);
      snd(bolt ? 'w.xbow.go' : 'w.shoot.go');
      const h = S.hand(by);
      const a = piece(S, fxTex(bolt ? 'bolt' : 'arrow'), h, big ? 1.5 : 1);
      void arm(S, by, [-86, -96, -86, 0], 520, [0, 0.12, 0.5, 1]);
      const end = b.miss ? past(S, b, h) : tgt();
      if (b.miss) {
        void fly(S, a, h, end, 300, { arc: 8, face: true, trail: glow }).then(() => a.destroy());
        await wait(S, 150);
        b.hit();
      } else {
        await fly(S, a, h, end, 190, { arc: 6, face: true, trail: glow ?? 0xd8d2c2 });
        contact('w.shoot.hit');
        b.hit();
        // it sticks for a moment
        a.x += dir * 6;
        void wait(S, 260).then(() => fade(S, a, 160));
      }
      await wait(S, 300);
      return;
    }
    case 'beam': {
      await arm(S, by, [0, -88], 180);
      const h = S.hand(by);
      const m = { x: h.x + dir * 10, y: h.y - 3 };
      const charge = piece(S, fxTex('orb', '#FF4D4D'), m, 0.2);
      snd('w.beam.charge');
      await S.tw.run(160 * S.sp, (k) => charge.scale.set((0.1 + 0.5 * k) * (S.dims.chH / 84)));
      charge.destroy();
      const end = b.miss ? { x: m.x + dir * S.dims.stageW, y: m.y + 10 } : tgt();
      void beam(S, m, end, 0xff3b3b, big ? 12 : 7, 300);
      snd('w.beam.go');
      void arm(S, by, [-88, -94, 0], 500, [0, 0.15, 1]);
      await wait(S, 40);
      contact('w.beam.hit');
      b.hit();
      if (!b.miss) S.particles(end.x, end.y, [0xff3b3b, 0xffd0d0, WHITE], 10, 30);
      await wait(S, 380);
      return;
    }
    case 'throw': {
      const name = b.look.weapon || '';
      const comes = name === 'Chakram' || name === 'Boomerang';
      const lob = name === 'Brick';
      const card = name === 'Uno reverse card';
      void arm(S, by, [0, -165, 35, 0], 520, [0, 0.4, 0.55, 1]);
      await wait(S, 230);
      snd(card ? 'w.card.go' : 'w.throw.go');
      if (!lob && !card) snd('w.throw.fly', 40);
      const h = S.hand(by);
      const p = piece(S, weaponTex(name, b.look.ench), h, big ? 1.5 : 1);
      if (comes || lob) S.F[by].holdWeapon(false);
      const end = b.miss ? past(S, b, h) : tgt();
      const spin = name === 'Uno reverse card' ? 4 : lob ? 1.2 : 3;
      const opts = { arc: lob ? 46 : name === 'Boomerang' ? 10 : 4, spin: spin * dir, bend: name === 'Boomerang' ? -36 * dir : 0, trail: glow };
      if (b.miss && !comes) {
        void fly(S, p, h, end, 420, opts).then(() => p.destroy());
        await wait(S, 200);
        b.hit();
        await wait(S, 260);
        if (lob) S.F[by].holdWeapon(true);
        return;
      }
      await fly(S, p, h, b.miss ? tgt() : end, lob ? 360 : 260, opts);
      contact(lob ? 'w.brick.hit' : card ? 'w.card.go' : 'w.throw.hit');
      b.hit();
      if (comes) {
        // back to the hand it came from
        snd('w.throw.fly');
        await fly(S, p, p.position.clone(), S.hand(by), 300, { spin: spin * dir, bend: name === 'Boomerang' ? 36 * dir : 0, trail: glow });
        p.destroy();
        S.F[by].holdWeapon(true);
      } else if (lob) {
        // the brick drops to the floor, and another one is in the hand
        const y0 = p.y;
        void S.tw.run(300 * S.sp, (k) => {
          p.y = y0 + (S.dims.groundY - 8 - y0) * ease.in(k);
          p.x += dir * 0.6;
          p.rotation += 0.12 * dir;
        }).then(() => {
          dust(S, p.x, 1);
          void fade(S, p, 200);
        });
        await wait(S, 320);
        S.F[by].holdWeapon(true);
      } else void fade(S, p, 180);
      await wait(S, 200);
      return;
    }
    case 'whip':
    case 'rod': {
      const rod = style === 'rod';
      const step = dash(S, by, to, Math.abs(S.homes[to] - S.homes[by]) * 0.62, 760, 0.3, 0.7);
      void arm(S, by, rod ? [0, -165, -60, -60, -100, 0] : [0, -165, -60, 0], 760, rod ? [0, 0.3, 0.45, 0.62, 0.72, 1] : [0, 0.32, 0.45, 1]);
      snd(rod ? 'w.rod.go' : 'w.whip.go', rod ? 170 : 200);
      await wait(S, 320);
      const line = gfx(S);
      const end = b.miss ? { x: tgt().x + dir * 30, y: tgt().y - 24 } : tgt();
      if (rod) end.y = S.ctr(to).top + 10;
      // the line flies out along a curve that settles
      await S.tw.run(170 * S.sp, (k) => {
        const h = S.hand(by);
        const e = mix(h, end, ease.out(k));
        const c = { x: (h.x + e.x) / 2, y: Math.min(h.y, e.y) - (rod ? 70 : 34) * (1 - k * 0.6) };
        line.clear().moveTo(h.x, h.y).quadraticCurveTo(c.x, c.y, e.x, e.y).stroke({ width: rod ? 1.5 : 3, color: rod ? 0xe8e8e8 : 0x5a3a22, cap: 'round' });
        if (rod) line.moveTo(e.x, e.y).lineTo(e.x, e.y + 5).lineTo(e.x - 3 * dir, e.y + 3).stroke({ width: 2, color: 0xb4bec9 });
      });
      // a whip cracks even when they dodge it
      snd(rod ? 'w.rod.hit' : 'w.whip.hit');
      if (!rod) {
        const t = piece(S, fxTex('twinkle', '#FFF3B0'), end, 1.4);
        void fade(S, t, 220, 0.6);
      }
      if (rod && !b.miss) {
        // the yank: the target comes a step closer
        const f = S.F[to];
        const home = S.homes[to];
        void S.tw.keys(380 * S.sp, [0, -dir * 22, 0], (v) => (f.x = home + v), ease.out, [0, 0.3, 1]);
      }
      b.hit();
      void S.tw.run(160 * S.sp, (k) => (line.alpha = 1 - k)).then(() => line.destroy());
      await step;
      return;
    }
    case 'cast': {
      void arm(S, by, [0, -165, -165, -95, 0], 760, [0, 0.3, 0.55, 0.65, 1]);
      await wait(S, 230);
      const col = glow ?? 0xb388ff;
      const h = S.hand(by);
      const top = { x: h.x - dir * 4, y: h.y - S.dims.chH * 0.22 };
      const orb = piece(S, fxTex('orb', toHex(col)), top, 0.3);
      snd('w.cast.charge');
      const k0 = orb.scale.x;
      await S.tw.run(200 * S.sp, (k) => orb.scale.set(k0 * (1 + 2.3 * k) * (big ? 1.4 : 1)));
      S.particles(top.x, top.y, [col, WHITE], 5, 14);
      snd('w.cast.go');
      const end = b.miss ? past(S, b, top) : tgt();
      if (b.miss) {
        void fly(S, orb, top, end, 380, { arc: 14, embers: [col, WHITE] }).then(() => orb.destroy());
        await wait(S, 190);
        b.hit();
        await wait(S, 200);
        return;
      }
      await fly(S, orb, top, end, 260, { arc: 14, embers: [col, WHITE] });
      orb.destroy();
      void burst(S, end, toHex(col), big ? 1.4 : 1);
      contact('w.cast.hit');
      b.hit();
      await wait(S, 220);
      return;
    }
    case 'saw': {
      const go = dash(S, by, to, 74, 1000, 0.25, 0.78);
      void arm(S, by, [0, -72], 240);
      await wait(S, 260);
      const c = tgt();
      const f = S.F[by];
      snd('w.saw.go');
      // it grinds: the arm shakes, sparks fly
      await S.tw.run(420 * S.sp, (k) => {
        f.armAngle = -72 + Math.sin(k * 80) * 5;
        if (!b.miss && Math.random() < 0.35) S.particles(c.x, c.y + 4, [0xffd54f, 0xff9a2f, WHITE], 2, 22);
      });
      if (!b.miss) void S.shake(3, 200);
      contact('w.saw.hit');
      b.hit();
      void arm(S, by, [-72, 0], 260);
      await go;
      return;
    }
    case 'fists': {
      const go = dash(S, by, to, 64, 700, 0.3, 0.72);
      void arm(S, by, [0, -95, -35, -98, 0], 700, [0, 0.32, 0.46, 0.58, 1]);
      snd('w.fists.go', 150);
      await wait(S, 230);
      if (!b.miss) {
        void burst(S, tgt(), '#FFE082', 0.5);
        sfx('w.flurry.hit', { gain: 0.7 });
      }
      snd('w.fists.go', 80);
      await wait(S, 170);
      if (!b.miss) void burst(S, { x: tgt().x, y: tgt().y - 10 }, '#FFE082', big ? 1.2 : 0.8);
      contact('w.fists.hit');
      b.hit();
      await go;
      return;
    }
    case 'flurry': {
      const go = dash(S, by, to, 74, 900, 0.25, 0.76);
      void arm(S, by, [0, -155, 25, -155, 25, -150, 0], 900, [0, 0.22, 0.34, 0.46, 0.58, 0.7, 1]);
      for (let k = 0; k < 3; k++) {
        snd('w.fists.go', k ? 30 : 220);
        await wait(S, k ? 110 : 300);
        if (!b.miss) {
          sfx('w.flurry.hit', { pitch: 1 + k * 0.08, gain: k === 2 ? 1.2 : 0.8 });
          const p = tgt();
          void burst(S, { x: p.x, y: p.y - 14 + k * 12 }, '#FFE082', 0.45 + (k === 2 ? 0.3 : 0));
        }
      }
      b.hit();
      await go;
      return;
    }
    default: {
      // the melee swings: a blade, a hammer, a pan, a bat or a noodle, after a dash
      const T: Record<string, { gap: number; dur: number; angles: number[]; at: number[]; contact: number }> = {
        slash: { gap: 78, dur: 620, angles: [0, -150, -150, 55, 0], at: [0, 0.28, 0.4, 0.52, 1], contact: 0.48 },
        heavy: { gap: 82, dur: 760, angles: [0, -168, -168, 60, 0], at: [0, 0.32, 0.46, 0.58, 1], contact: 0.54 },
        reap: { gap: 92, dur: 760, angles: [0, -170, -170, 80, 0], at: [0, 0.3, 0.44, 0.6, 1], contact: 0.52 },
        // the arm goes back so the point comes level, then drives forward
        thrust: { gap: 70, dur: 600, angles: [0, 85, 85, 58, 58, 0], at: [0, 0.25, 0.36, 0.45, 0.62, 1], contact: 0.45 },
        smash: { gap: 76, dur: 720, angles: [0, -178, -178, 35, 0], at: [0, 0.3, 0.46, 0.56, 1], contact: 0.55 },
        bonk: { gap: 76, dur: 700, angles: [0, -175, -175, 30, 0], at: [0, 0.3, 0.44, 0.54, 1], contact: 0.53 },
        riff: { gap: 76, dur: 720, angles: [0, -178, -178, 35, 0], at: [0, 0.3, 0.46, 0.56, 1], contact: 0.55 },
        swing: { gap: 80, dur: 640, angles: [0, -130, -130, -15, 0], at: [0, 0.3, 0.42, 0.52, 1], contact: 0.5 },
        flop: { gap: 74, dur: 760, angles: [0, -140, 25, -90, 40, 0], at: [0, 0.25, 0.4, 0.5, 0.6, 1], contact: 0.52 },
      };
      const m = T[style] ?? T.slash!;
      const go = dash(S, by, to, m.gap, m.dur, m.contact - 0.08, m.contact + 0.12);
      void arm(S, by, m.angles, m.dur, m.at);
      // the whoosh of the swing, just before it lands
      const GO: Record<string, string> = { slash: 'w.slash.go', heavy: 'w.heavy.go', reap: 'w.reap.go', thrust: 'w.thrust.go', smash: 'w.smash.go', riff: 'w.smash.go', bonk: 'w.swing.go', swing: 'w.swing.go', flop: 'w.flop.go' };
      snd(GO[style] ?? 'w.slash.go', Math.max(0, m.dur * m.contact - (style === 'reap' ? 300 : style === 'flop' ? 260 : 150)));
      await wait(S, m.dur * m.contact);
      const p = tgt();
      const col = glow ?? WHITE;
      if (style === 'thrust') {
        // the lunge: a straight streak through the target
        const f = S.F[by];
        void S.tw.keys(200 * S.sp, [0, dir * 14, 0], (v) => (f.body.x = v));
        const g = gfx(S, { x: p.x - dir * 30, y: p.y });
        g.rect(0, -1.5, dir * 70, 3).fill({ color: col });
        void fade(S, g, 200);
        if (!b.miss) void burst(S, p, '#E8FBFF', big ? 1 : 0.55);
      } else if (style === 'swing') slashMark(S, b, p, Math.PI / 2 + 0.3, 1.1, col);
      else if (style === 'slash' || style === 'heavy' || style === 'reap') {
        slashMark(S, b, { x: p.x, y: p.y - 4 }, -0.5, style === 'slash' ? 1 : 1.35, col);
        if (style === 'reap') slashMark(S, b, { x: p.x + dir * 6, y: p.y + 6 }, -0.2, 1.2, col);
      }
      if (b.miss) {
        b.hit();
        await go;
        return;
      }
      if (style === 'smash' || style === 'riff' || style === 'heavy') {
        void shock(S, { x: S.ctr(to).x, y: S.dims.groundY }, 0xe0d6c8, S.F[to].w * 0.7, 360, true);
        dust(S, S.ctr(to).x, 3);
        void S.shake(big ? 9 : 5, 260);
      }
      if (style === 'riff') for (let k = 0; k < 3; k++) void wait(S, k * 90).then(() => shock(S, p, 0xffd180, S.dims.chH * 0.3, 380));
      if (style === 'bonk') {
        void shock(S, { x: p.x, y: S.ctr(to).top + 12 }, WHITE, S.dims.chH * 0.18, 260);
        void dizzy(S, to);
      }
      if (style === 'flop') {
        const f = S.F[to].body;
        void S.tw.keys(300 * S.sp, [1, 0.9, 1], (v) => f.scale.set(2 - v, v));
        if ((b.look.weapon || '').includes('Wet')) S.particles(p.x, p.y, [0xf2e2a0, 0xffffff], 6, 20);
      }
      if (style !== 'flop' && style !== 'thrust') void burst(S, p, glow ? toHex(glow) : '#FFD166', big ? 1.3 : style === 'heavy' ? 1 : 0.8);
      const HIT: Record<string, string> = { slash: 'w.slash.hit', heavy: 'w.heavy.hit', reap: 'w.slash.hit', thrust: 'w.thrust.hit', smash: 'w.smash.hit', riff: 'w.riff.hit', bonk: 'w.bonk.hit', swing: 'w.swing.hit', flop: 'w.flop.hit' };
      contact(HIT[style] ?? 'w.slash.hit');
      b.hit();
      await go;
      return;
    }
  }
}

/** A ghostly copy of a fighter (clones, illusions), standing at x. */
export function ghostOf(S: Stage, i: 0 | 1, x: number, tint: number, alpha: number): Container {
  // the copy is the fighter's own body, drawn again
  const c = S.F[i].cloneBody();
  c.tint = tint;
  c.alpha = alpha;
  c.position.set(x, S.dims.groundY);
  S.fx.addChild(c);
  void popIn(S, c, 140);
  return c;
}
