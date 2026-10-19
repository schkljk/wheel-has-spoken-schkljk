// Writes packages/core/src/game/population-table.ts: what an ordinary fighter looks like, for the scouting report
// (game/summary.ts). It only changes when the rules for rolling or rating a fighter do. Part of `npm run bake`.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { computePopulation } from '../../packages/core/src/game/summary';

export function populationSource(): string {
  const P = computePopulation();
  const rows = Object.entries(P).map(([k, [m, sd]]) => `  ${k}: [${JSON.stringify(m)}, ${JSON.stringify(sd)}],`);
  return [
    '// Written by tools/build/population.ts (`npm run bake`): computePopulation() in summary.ts, worked out ahead of',
    '// time because it takes a second on a phone. A test fails when the rules change it: run `npm run bake` again.',
    "import type { Population } from './summary';",
    '',
    'export const POPULATION: Population = {',
    ...rows,
    '};',
    '',
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = resolve(import.meta.dirname, '../../packages/core/src/game/population-table.ts');
  writeFileSync(out, populationSource());
  console.log('wrote', out);
}
