import { sceneSVG } from '../pixi/scenery-svg';
import { spriteImages } from '../art/sprite-dom';
import type { Look } from '../art/sprite';

/** Everything a share card shows about one fight. */
export interface CardData {
  /** the result headline ("Boss down", "Chapter 3 cleared", "Champion") */
  big: string;
  winner: { name: string; line: string; look: Look };
  loser: { name: string; line: string; look: Look };
  /** the winner is the player (left) or the opponent */
  playerWon: boolean;
  arena: { k: string; n: string; sky?: string; floor?: string } | null;
  blow: { text: string; d: number | null } | null;
  rounds: number;
  /** "Story, chapter 3", "World cup final"... */
  where: string;
}

export const CARD_W = 1080;
export const CARD_H = 1350;
const HORIZON = 780;
const FONT = '"Saira Condensed", "Arial Narrow", "Roboto Condensed", sans-serif';
const BODY = '"Inter", "Segoe UI", system-ui, sans-serif';
const INK = '#1A1426';

function img(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => fail(new Error('image'));
    i.src = src;
  });
}
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0'), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

/** Text with a dark outline so it reads on any arena. */
function outlined(x: CanvasRenderingContext2D, t: string, px: number, py: number, fill: string, stroke = INK, w = 10) {
  x.lineJoin = 'round';
  x.strokeStyle = stroke;
  x.lineWidth = w;
  x.strokeText(t, px, py);
  x.fillStyle = fill;
  x.fillText(t, px, py);
}
/** Wraps text into lines that fit `max` pixels. */
function wrap(x: CanvasRenderingContext2D, t: string, max: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of t.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (x.measureText(next).width > max && line) {
      out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** A fighter's pixel sprite: body plus weapon arm at its shoulder, feet at (cx, feetY). */
async function fighter(x: CanvasRenderingContext2D, look: Look, cx: number, feetY: number, h: number, o: { mirror?: boolean; down?: boolean; armDeg?: number }) {
  const s = spriteImages(look);
  if (!s) return;
  const [body, arm] = await Promise.all([img(s.body), img(s.arm)]);
  const w = (h * 100) / 120;
  x.save();
  x.translate(cx, feetY);
  if (o.down) x.rotate(((o.mirror ? -1 : 1) * Math.PI) / 2);
  if (o.mirror) x.scale(-1, 1);
  x.imageSmoothingEnabled = false;
  if (!o.down) {
    x.fillStyle = 'rgba(0,0,0,0.3)';
    x.beginPath();
    x.ellipse(0, -h * 0.02, w * 0.3, h * 0.04, 0, 0, Math.PI * 2);
    x.fill();
  }
  x.drawImage(body, -w / 2, -h, w, h);
  // the weapon arm turns around the shoulder pivot
  const px = -w / 2 + (s.sx / 100) * w;
  const py = -h + (s.sy / 120) * h;
  x.translate(px, py);
  x.rotate(((o.armDeg ?? 0) * Math.PI) / 180);
  x.drawImage(arm, -px - w / 2, -py - h, w, h);
  x.restore();
}

/** Draws the card. Fonts should be loaded first (document.fonts.ready). */
export async function drawShareCard(c: CardData): Promise<HTMLCanvasElement> {
  const cv = document.createElement('canvas');
  cv.width = CARD_W;
  cv.height = CARD_H;
  const x = cv.getContext('2d')!;
  const sky = c.arena?.sky || '#2A2342';
  const floor = c.arena?.floor || '#3A2F55';

  // sky, scenery and floor, as in the fight
  const g = x.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, shade(sky, 0.75));
  g.addColorStop(1, sky);
  x.fillStyle = g;
  x.fillRect(0, 0, CARD_W, HORIZON);
  if (c.arena?.k) {
    try {
      const svg = await img(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneSVG(c.arena.k))}`);
      const k = Math.max(CARD_W / 400, (HORIZON - 20) / 240);
      x.drawImage(svg, CARD_W / 2 - 200 * k, HORIZON - 20 - 240 * k, 400 * k, 240 * k);
    } catch {
      // plain sky then
    }
  }
  const fg = x.createLinearGradient(0, HORIZON - 30, 0, CARD_H);
  fg.addColorStop(0, floor);
  fg.addColorStop(1, shade(floor, 0.45));
  x.fillStyle = fg;
  x.fillRect(0, HORIZON - 30, CARD_W, CARD_H - HORIZON + 30);
  const vg = x.createRadialGradient(CARD_W / 2, CARD_H * 0.42, CARD_W * 0.3, CARD_W / 2, CARD_H * 0.42, CARD_W * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  x.fillStyle = vg;
  x.fillRect(0, 0, CARD_W, CARD_H);

  // the winner stands, arm up; the loser is down on the floor
  const left = c.playerWon ? c.winner : c.loser;
  const right = c.playerWon ? c.loser : c.winner;
  // the fallen lie on the floor in front of the horizon, clear of the winner's feet
  if (c.playerWon) {
    await fighter(x, left.look, 300, HORIZON, 420, { armDeg: -70 });
    await fighter(x, right.look, 960, HORIZON - 50, 300, { mirror: true, down: true });
  } else {
    await fighter(x, left.look, 120, HORIZON - 50, 300, { down: true });
    await fighter(x, right.look, 780, HORIZON, 420, { mirror: true, armDeg: 70 });
  }

  // the final blow over the fallen
  if (c.blow?.d) {
    x.textAlign = 'center';
    x.font = `800 150px ${FONT}`;
    outlined(x, `-${c.blow.d}`, c.playerWon ? 760 : 320, HORIZON - 200, '#FFE08A', INK, 16);
  }

  // headline
  x.textAlign = 'center';
  x.font = `800 128px ${FONT}`;
  const head = wrap(x, c.big.toUpperCase(), CARD_W - 120);
  head.forEach((l, i) => outlined(x, l, CARD_W / 2, 150 + i * 120, '#FFFFFF', INK, 18));
  x.font = `700 40px ${BODY}`;
  outlined(x, `${c.where} · ${c.rounds} ${c.rounds === 1 ? 'round' : 'rounds'}`, CARD_W / 2, 150 + head.length * 120 - 40, '#F3EEFF', INK, 8);

  // name plates
  const plate = (y: number, label: string, f: CardData['winner'], gold: boolean) => {
    x.fillStyle = 'rgba(16, 11, 28, 0.78)';
    x.beginPath();
    x.roundRect(60, y, CARD_W - 120, 140, 26);
    x.fill();
    x.strokeStyle = gold ? '#F2B544' : 'rgba(255,255,255,0.25)';
    x.lineWidth = 4;
    x.stroke();
    x.textAlign = 'left';
    x.font = `700 30px ${BODY}`;
    x.fillStyle = gold ? '#FFE08A' : '#CFC6E6';
    x.fillText(label, 96, y + 42);
    x.font = `800 54px ${FONT}`;
    x.fillStyle = '#FFFFFF';
    const nm = wrap(x, f.name, CARD_W - 200)[0]!;
    x.fillText(nm, 96, y + 92);
    x.font = `500 30px ${BODY}`;
    x.fillStyle = '#CFC6E6';
    x.fillText(f.line, 96, y + 128);
  };
  plate(HORIZON + 70, 'WINNER', c.winner, true);
  plate(HORIZON + 225, 'DEFEATED', c.loser, false);

  // the narration of the last blow, and the footer
  x.textAlign = 'center';
  if (c.blow?.text) {
    x.font = `italic 500 32px ${BODY}`;
    x.fillStyle = '#F3EEFF';
    const lines = wrap(x, `“${c.blow.text}”`, CARD_W - 160);
    if (lines.length > 2) lines[1] = `${lines[1]!.replace(/[.,;:!?”]*$/, '')}…”`;
    lines.slice(0, 2).forEach((l, i) => x.fillText(l, CARD_W / 2, HORIZON + 420 + i * 40));
  }
  x.font = `800 30px ${FONT}`;
  x.fillStyle = 'rgba(255,255,255,0.7)';
  x.fillText(`THE WHEEL HAS SPOKEN · ${new Date().toLocaleDateString()}`, CARD_W / 2, CARD_H - 28);
  return cv;
}

/** The card as a PNG file (for sharing or saving). */
export function cardFile(cv: HTMLCanvasElement, name = 'the-wheel-has-spoken.png'): Promise<File> {
  return new Promise((ok, fail) => cv.toBlob((b) => (b ? ok(new File([b], name, { type: 'image/png' })) : fail(new Error('png'))), 'image/png'));
}
