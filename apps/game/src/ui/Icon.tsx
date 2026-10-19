import { cpuCanvas } from '../art/canvas';
import { hasIcon, iconPixels, ICON_NAMES, type Tint } from './icon-pixels';

export type { Tint };
/** Every icon name (for checks like "is there an icon for this item?"). */
export const ICONS: Record<string, true> = Object.fromEntries(ICON_NAMES.map((n) => [n, true as const]));
export type IconName = string;
export { hasIcon };

/**
 * An icon as a PNG data URL, drawn once per name and tint. They used to be SVGs with a rect per run of pixels:
 * 2,073 of the Play tab's 2,256 elements, and 1.4 s to open the hub on a mid-range phone.
 */
function iconUrl(name: string, tint?: Tint): string | null {
  const p = iconPixels(name, tint);
  if (!p) return null;
  const [cv, x] = cpuCanvas(p.size, p.size);
  const id = x.createImageData(p.size, p.size);
  p.px.forEach((c, i) => c && id.data.set([c[0], c[1], c[2], p.a ? p.a[i]! : 255], i * 4));
  x.putImageData(id, 0, 0);
  return cv.toDataURL('image/png');
}
const cache = new Map<string, string | null>();
const urlOf = (name: string, tint?: Tint) => {
  const key = tint ? `${name}|${tint.x}|${tint.X}` : name;
  let url = cache.get(key);
  if (url === undefined) {
    try {
      url = iconUrl(name, tint);
    } catch {
      url = null;
    }
    cache.set(key, url);
  }
  return url;
};

/** Draws every plain icon while the game is idle, a few at a time, so the first hub doesn't stop to draw two dozen. */
export function warmIcons() {
  const todo = ICON_NAMES.filter((n) => !cache.has(n));
  const step = (d?: IdleDeadline) => {
    do urlOf(todo.shift()!);
    while (todo.length && d && d.timeRemaining() > 3);
    if (todo.length) idle(step);
  };
  const idle = (f: (d?: IdleDeadline) => void) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 2000 }) : setTimeout(f, 50));
  if (todo.length) idle(step);
}

/** A crisp pixel icon (16x16, or 12x12 for the few older ones). Size it with CSS (font-size based by default). */
export function Icon({ name, class: cls, label, tint }: { name: IconName; class?: string; label?: string; tint?: Tint }) {
  const url = urlOf(name, tint);
  if (!url) return null;
  // nearest-neighbour scaling (.pxi) keeps it as crisp as the rects were; the label, when there is one, is the alt text
  return <img class={`pxi${cls ? ' ' + cls : ''}`} data-i={name} src={url} alt={label ?? ''} aria-hidden={label ? undefined : true} draggable={false} decoding="sync" />;
}
