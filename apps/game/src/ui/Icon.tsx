import { hasIcon, iconPixels, ICON_NAMES, type Tint } from './icon-pixels';

export type { Tint };
/** Every icon name (for checks like "is there an icon for this item?"). */
export const ICONS: Record<string, true> = Object.fromEntries(ICON_NAMES.map((n) => [n, true as const]));
export type IconName = string;
export { hasIcon };

/** Runs of the same color on a row become one rect (fewer DOM nodes, same picture). */
function rects(name: string, tint?: Tint) {
  const p = iconPixels(name, tint);
  if (!p) return null;
  const out: { x: number; y: number; w: number; fill: string; o?: number }[] = [];
  const hex = (c: readonly number[]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  for (let y = 0; y < p.size; y++) {
    let x = 0;
    while (x < p.size) {
      const i = y * p.size + x;
      const c = p.px[i];
      if (!c) {
        x++;
        continue;
      }
      const a = p.a ? p.a[i]! : 255;
      let w = 1;
      while (x + w < p.size) {
        const j = i + w,
          d = p.px[j];
        if (!d || d[0] !== c[0] || d[1] !== c[1] || d[2] !== c[2] || (p.a ? p.a[j]! : 255) !== a) break;
        w++;
      }
      out.push({ x, y, w, fill: hex(c), ...(a < 255 ? { o: a / 255 } : {}) });
      x += w;
    }
  }
  return { size: p.size, out };
}
const cache = new Map<string, ReturnType<typeof rects>>();

/** A crisp pixel icon (16x16, or 12x12 for the few older ones). Size it with CSS (font-size based by default). */
export function Icon({ name, class: cls, label, tint }: { name: IconName; class?: string; label?: string; tint?: Tint }) {
  const key = tint ? `${name}|${tint.x}|${tint.X}` : name;
  let r = cache.get(key);
  if (r === undefined) cache.set(key, (r = rects(name, tint)));
  if (!r) return null;
  return (
    <svg
      class={`pxi${cls ? ' ' + cls : ''}`}
      viewBox={`0 0 ${r.size} ${r.size}`}
      shape-rendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {r.out.map((p) => (
        <rect key={`${p.x},${p.y}`} x={p.x} y={p.y} width={p.w} height={1} fill={p.fill} fill-opacity={p.o} />
      ))}
    </svg>
  );
}
