// Writes plain data as readable, typed TypeScript modules (used by the one-off port tools).
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const str = (s: string) => (s.includes("'") ? JSON.stringify(s) : `'${s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n')}'`);
const key = (k: string) => (IDENT.test(k) ? k : str(k));

export function lit(v: unknown, ind = ''): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return str(v);
  if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
  if (typeof v === 'boolean') return String(v);
  const inner = ind + '  ';
  if (Array.isArray(v)) {
    const flat = `[${v.map((x) => lit(x, inner)).join(', ')}]`;
    if (flat.length + ind.length <= 120 && !flat.includes('\n')) return flat;
    if (v.every((x) => typeof x !== 'object' || x === null)) {
      // pack long lists of plain values into wrapped lines
      const lines: string[] = [];
      let line = '';
      for (const x of v.map((y) => lit(y) + ',')) {
        if (line && inner.length + line.length + 1 + x.length > 120) {
          lines.push(line);
          line = x;
        } else line = line ? `${line} ${x}` : x;
      }
      if (line) lines.push(line);
      return `[\n${lines.map((l) => inner + l).join('\n')}\n${ind}]`;
    }
    return `[\n${v.map((x) => inner + lit(x, inner)).join(',\n')},\n${ind}]`;
  }
  const ents = Object.entries(v as Record<string, unknown>);
  if (!ents.length) return '{}';
  const flat = `{ ${ents.map(([k, x]) => `${key(k)}: ${lit(x, inner)}`).join(', ')} }`;
  if (flat.length + ind.length <= 120 && !flat.includes('\n')) return flat;
  return `{\n${ents.map(([k, x]) => `${inner}${key(k)}: ${lit(x, inner)}`).join(',\n')},\n${ind}}`;
}

export type Table = { name: string; type: string; value: unknown; doc?: string };

export function writeModule(outDir: string, file: string, header: string, imports: string, tables: Table[], tool = 'tools/parity/extract-data.ts') {
  const body = tables
    .map((t) => `${t.doc ? `/** ${t.doc} */\n` : ''}export const ${t.name}: ${t.type} = ${lit(clean(t.value))};\n`)
    .join('\n');
  const src = `// ${header}\n// Ported from the legacy game by ${tool} (final values after all legacy patches).\n${imports ? imports + '\n' : ''}\n${body}`;
  writeFileSync(resolve(outDir, file), src);
  console.log(`wrote ${file}`);
}

