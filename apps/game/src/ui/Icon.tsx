import { LEGACY_ICONS, PALETTE } from './icon-data';
import { CONTENT_ICONS } from './icons-content';
import { EXTRA_ICONS } from './icons-extra';

export const ICONS: Record<string, string[]> = { ...LEGACY_ICONS, ...EXTRA_ICONS, ...CONTENT_ICONS };
export type IconName = keyof typeof ICONS & string;
/** Colors for the tint letters of content icons: 'x' main, 'X' highlight. */
export type Tint = { x: string; X: string };

/** Runs of the same color on a row become one rect (fewer DOM nodes, same picture). */
function rects(rows: string[], tint?: Tint) {
  const out: { x: number; y: number; w: number; fill: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x]!;
      if (c === '.') {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === c) w++;
      out.push({ x, y, w, fill: (tint && (c === 'x' || c === 'X') ? tint[c] : PALETTE[c]) ?? '#000' });
      x += w;
    }
  });
  return out;
}
const cache = new Map<string, ReturnType<typeof rects>>();

/** A crisp 12x12 pixel icon. Size it with CSS (font-size based by default). */
export function Icon({ name, class: cls, label, tint }: { name: IconName; class?: string; label?: string; tint?: Tint }) {
  const rows = ICONS[name];
  if (!rows) return null;
  const key = tint ? `${name}|${tint.x}` : name;
  let r = cache.get(key);
  if (!r) cache.set(key, (r = rects(rows, tint)));
  return (
    <svg
      class={`pxi${cls ? ' ' + cls : ''}`}
      viewBox="0 0 12 12"
      shape-rendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {r.map((p) => (
        <rect key={`${p.x},${p.y}`} x={p.x} y={p.y} width={p.w} height={1} fill={p.fill} />
      ))}
    </svg>
  );
}
