/** Strips functions and internal markers, keeps everything else as-is. */
export function clean(v: unknown): unknown {
  if (typeof v === 'function') return undefined;
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      if (k === '__amp' || typeof x === 'function' || x === undefined) continue;
      o[k] = clean(x);
    }
    return o;
  }
  return v;
}
