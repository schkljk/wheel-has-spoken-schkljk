/**
 * One-off port tool: the legacy pixel icon set (12x12 sprites and their palette) into the app.
 *   npx tsx tools/parity/extract-icons.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLegacyGlobals } from './extract-content';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../apps/game/src/ui/icon-data.ts');
const G = await readLegacyGlobals(['PXP', 'PXI']);
const pal = G.PXP as Record<string, string>;
const icons = G.PXI as Record<string, string[]>;
const q = (s: string) => `'${s}'`;
let src = `// Pixel icons: hand-made 12x12 sprites. Each row is 12 palette letters; '.' is transparent.\n`;
src += `// Ported from the legacy game (ui_icons.js) by tools/parity/extract-icons.ts; new icons go in icons-extra.ts.\n\n`;
src += `export const PALETTE: Record<string, string> = {\n${Object.entries(pal).map(([k, v]) => `  ${k}: ${q(v)},`).join('\n')}\n};\n\n`;
src += `export const LEGACY_ICONS: Record<string, string[]> = {\n`;
for (const [k, rows] of Object.entries(icons)) src += `  ${k}: [\n${rows.map((r) => `    ${q(r)},`).join('\n')}\n  ],\n`;
src += `};\n`;
writeFileSync(OUT, src);
console.log('wrote', OUT, Object.keys(icons).length, 'icons');
