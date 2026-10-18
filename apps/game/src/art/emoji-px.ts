// Every emoji the game shows becomes a pixel icon, in the same style as the drawn ones. The common ones map to a
// hand-drawn icon (art/icons.ts); the rest are pixelized from the phone's own emoji: drawn large, averaged down to
// 16x16, cut to a few colors, and given the dark colored outline the sprites have. Browser only.

import { iconCanvas } from './portraits';

/** Emojis with a hand-drawn icon of the same thing. */
export const EMOJI_ICON: Record<string, string> = {
  '🪙': 'coin', '💰': 'coin', '💎': 'gem', '❤️': 'heart', '♥️': 'heart', '⚡': 'bolt', '🔥': 'flame', '🛡️': 'shield', '⚔️': 'attack',
  '🗡️': 'sword', '💀': 'skull', '☠️': 'skull', '⭐': 'star', '🌟': 'star', '✨': 'spark', '🎁': 'gift', '🎲': 'dice', '🛒': 'cart',
  '📅': 'calendar', '📆': 'calendar', '🗼': 'tower', '🔒': 'lock', '🎒': 'bag', '👊': 'fist', '🎯': 'target', '📖': 'book', '⚙️': 'gear',
  '🏠': 'house', '🔊': 'sound', '🔇': 'mute', '💾': 'save', '❓': 'question', '❔': 'question', '✅': 'check', '⏱️': 'clock', '🔨': 'hammer',
  '🔍': 'search', '🃏': 'card', '👥': 'people', '🚩': 'flag', '📜': 'scroll', '🤖': 'robot', '🩹': 'it_bandage', '🥤': 'it_drink',
  '🔭': 'it_scout', '🍀': 'it_charm', '🌀': 'swirl', '💬': 'chat', '❄️': 'st_frozen', '🧊': 'st_frozen', '💧': 'st_soaked', '💫': 'st_stun',
  '🏆': 'cup', '🧲': 'pw_magnet', '💥': 'pw_boom', '🌿': 'pw_vines', '🔋': 'bolt', '🏕️': 'camp', '🪵': 'camp', '🧰': 'chest',
};

type RGB = [number, number, number];

function toHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn,
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl(h: number, s: number, l: number): RGB {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
    p = 2 * l - q;
  const f = (t: number) => {
    t = ((t % 1) + 1) % 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  const H = h / 360;
  return [Math.round(f(H + 1 / 3) * 255), Math.round(f(H) * 255), Math.round(f(H - 1 / 3) * 255)];
}
/** The outline color next to a pixel: dark and a little more saturated, drifting violet like the sprites' shadows. */
function ink(c: RGB): RGB {
  const [h, s, l] = toHsl(c);
  // something already near black gets a pale rim instead, or it vanishes on the dark panels
  if (l < 0.2) return fromHsl(s < 0.08 ? 255 : h, 0.22, 0.62);
  const hv = s < 0.08 ? 255 : h + ((((255 - h + 540) % 360) - 180) * 0.3);
  return fromHsl(hv, Math.min(1, (s < 0.08 ? 0.14 : s) * 0.75 + 0.18), Math.max(0.05, l * 0.26));
}

/** A handful of colors that stand for all of them (k-means, seeded with far-apart colors). */
function palette(cs: RGB[], k: number): RGB[] {
  const cent: RGB[] = [cs[0]!];
  while (cent.length < k) {
    let best = -1,
      bi = 0;
    cs.forEach((c, i) => {
      const d = Math.min(...cent.map((q) => (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2));
      if (d > best) {
        best = d;
        bi = i;
      }
    });
    if (best < 300) break;
    cent.push([...cs[bi]!] as RGB);
  }
  for (let it = 0; it < 8; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (const c of cs) {
      let bi = 0,
        bd = Infinity;
      cent.forEach((q, i) => {
        const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2;
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      const s = sum[bi]!;
      s[0]! += c[0];
      s[1]! += c[1];
      s[2]! += c[2];
      s[3]!++;
    }
    sum.forEach((s, i) => s[3] && (cent[i] = [s[0]! / s[3], s[1]! / s[3], s[2]! / s[3]]));
  }
  return cent.map((c) => c.map(Math.round) as RGB);
}

let glyph: CanvasRenderingContext2D | null = null;
/** The emoji as pixel art, SZ x SZ plus its outline (16 for the page, 32 for big pictures), or null when the phone can't draw it. */
export function pixelEmoji(e: string, SZ = 16): HTMLCanvasElement | null {
  const OUT = SZ + 2;
  const S = SZ * 4.5;
  if (!glyph) {
    const c = document.createElement('canvas');
    glyph = c.getContext('2d', { willReadFrequently: true });
    if (!glyph) return null;
  }
  const g = glyph;
  if (g.canvas.width !== S) g.canvas.width = g.canvas.height = S;
  g.clearRect(0, 0, S, S);
  g.font = `${Math.round(S * 0.8)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Twemoji Mozilla", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(e, S / 2, S / 2 + S / 24);
  const d = g.getImageData(0, 0, S, S).data;
  let x0 = S,
    y0 = S,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++)
      if (d[(y * S + x) * 4 + 3]! > 40) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return null;
  // the glyph's box, square, averaged down to 16x16
  const side = Math.max(x1 - x0 + 1, y1 - y0 + 1);
  const ox = x0 - (side - (x1 - x0 + 1)) / 2,
    oy = y0 - (side - (y1 - y0 + 1)) / 2;
  const sc = side / SZ;
  const px: (RGB | null)[] = new Array(SZ * SZ).fill(null);
  for (let ty = 0; ty < SZ; ty++)
    for (let tx = 0; tx < SZ; tx++) {
      let r = 0,
        gg = 0,
        b = 0,
        a = 0,
        n = 0;
      for (let sy = Math.floor(oy + ty * sc); sy < Math.floor(oy + (ty + 1) * sc); sy++)
        for (let sx = Math.floor(ox + tx * sc); sx < Math.floor(ox + (tx + 1) * sc); sx++) {
          n++;
          if (sx < 0 || sy < 0 || sx >= S || sy >= S) continue;
          const i = (sy * S + sx) * 4,
            al = d[i + 3]! / 255;
          r += d[i]! * al;
          gg += d[i + 1]! * al;
          b += d[i + 2]! * al;
          a += al;
        }
      if (!n || a / n < 0.42) continue;
      px[ty * SZ + tx] = [r / a, gg / a, b / a];
    }
  const on = px.filter(Boolean) as RGB[];
  if (!on.length) return null;
  // a few flat colors, a touch more saturated, like hand-picked pixel art
  const pal = palette(on, Math.min(SZ > 16 ? 10 : 7, on.length)).map((c) => {
    const [h, s, l] = toHsl(c);
    return fromHsl(h, Math.min(1, s * 1.15), l);
  });
  const near = (c: RGB) => pal.reduce((best, q) => ((q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2 < (best[0] - c[0]) ** 2 + (best[1] - c[1]) ** 2 + (best[2] - c[2]) ** 2 ? q : best), pal[0]!);
  const out = document.createElement('canvas');
  out.width = out.height = OUT;
  const o = out.getContext('2d')!;
  const id = o.createImageData(OUT, OUT);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= SZ || y >= SZ ? null : px[y * SZ + x]!);
  for (let y = -1; y <= SZ; y++)
    for (let x = -1; x <= SZ; x++) {
      const c = at(x, y);
      let col: RGB | null = c ? near(c) : null;
      if (!col) {
        // the outline: the dark ink of whichever neighbor it borders
        const nb = at(x + 1, y) ?? at(x - 1, y) ?? at(x, y + 1) ?? at(x, y - 1);
        if (!nb) continue;
        col = ink(near(nb));
      }
      const i = ((y + 1) * OUT + x + 1) * 4;
      id.data[i] = col[0];
      id.data[i + 1] = col[1];
      id.data[i + 2] = col[2];
      id.data[i + 3] = 255;
    }
  o.putImageData(id, 0, 0);
  return out;
}

const canvases = new Map<string, HTMLCanvasElement | null>();
/**
 * The pixel icon for an emoji as a canvas (a hand-drawn icon when there is one), for Pixi and the wheels; `fine`
 * draws it at twice the detail, for pictures shown big.
 */
export function emojiCanvas(e: string, fine = false): HTMLCanvasElement | null {
  const key = fine ? e + '|fine' : e;
  const hit = canvases.get(key);
  if (hit !== undefined) return hit;
  let cv: HTMLCanvasElement | null = null;
  try {
    const name = EMOJI_ICON[e] ?? EMOJI_ICON[e.replace(/\uFE0F/g, '')] ?? EMOJI_ICON[e + '\uFE0F'];
    cv = name ? iconCanvas(name, fine ? 2 : 1) : pixelEmoji(e, fine ? 32 : 16);
  } catch {
    cv = null;
  }
  canvases.set(key, cv);
  return cv;
}

const urls = new Map<string, string | null>();
/** The same icon as an image URL, for the page. */
export function emojiUrl(e: string): string | null {
  const hit = urls.get(e);
  if (hit !== undefined) return hit;
  const cv = emojiCanvas(e);
  const u = cv ? cv.toDataURL('image/png') : null;
  urls.set(e, u);
  return u;
}
