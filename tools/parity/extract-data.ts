/**
 * One-off port tool: loads the legacy core (after every splice, push, odds flattening and trait
 * amplification has run) and writes its final data tables as typed TypeScript modules into
 * packages/core/src/data/. Functions (synergy tests, wheel conditions) are ported by hand.
 *
 *   npx tsx tools/parity/extract-data.ts
 *
 * After the port the data files are the source of truth; tools/parity/data.test.ts keeps them
 * equal to the legacy tables for as long as parity matters.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mulberry32 } from '../../packages/core/src/rng';
import { clean } from './extract-data-clean';
import { loadLegacyCore } from './legacy';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../packages/core/src/data');
const L = loadLegacyCore(mulberry32(1));
const get = <T = unknown>(n: string) => L.get<T>(n);

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const str = (s: string) => (s.includes("'") ? JSON.stringify(s) : `'${s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n')}'`);
const key = (k: string) => (IDENT.test(k) ? k : str(k));

function lit(v: unknown, ind = ''): string {
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

type Table = { name: string; type: string; value: unknown; doc?: string };

function writeModule(file: string, header: string, imports: string, tables: Table[]) {
  const body = tables
    .map((t) => `${t.doc ? `/** ${t.doc} */\n` : ''}export const ${t.name}: ${t.type} = ${lit(clean(t.value))};\n`)
    .join('\n');
  const src = `// ${header}\n// Ported from the legacy game by tools/parity/extract-data.ts (final values after all legacy patches).\n${imports ? imports + '\n' : ''}\n${body}`;
  writeFileSync(resolve(OUT, file), src);
  console.log(`wrote ${file}`);
}

// ---------- build wheels ----------
const SEQ = get<{ k: string; items: unknown }[]>('SEQ');
const tierItems = (k: string) => SEQ.find((w) => w.k === k)!.items;

writeModule(
  'wheels.ts',
  'Build wheels: every slice a fighter can roll.',
  "import type { Arch, Backstory, Enchant, Growth, KeyedItem, Power, Race, Stance, SubWheel, TierItem, Weakness, Weapon, WheelItem } from '../types';",
  [
    { name: 'RACES', type: 'Race[]', value: get('RACES') },
    { name: 'RSUB', type: 'Record<string, SubWheel>', value: get('RSUB'), doc: 'Sub-race wheel per race.' },
    { name: 'ARCHS', type: 'Arch[]', value: get('ARCHS'), doc: 'Archetypes (classes).' },
    { name: 'ASUB', type: 'Record<string, SubWheel>', value: get('ASUB'), doc: 'Specialty wheel per archetype.' },
    { name: 'ULTS', type: 'Record<string, string>', value: get('ULTS'), doc: 'Signature move name per archetype.' },
    { name: 'STANCES', type: 'Stance[]', value: get('STANCES') },
    { name: 'SIZES', type: 'WheelItem[]', value: get('SIZES') },
    { name: 'BACKS', type: 'Backstory[]', value: get('BACKS'), doc: 'Backstories.' },
    { name: 'TIERNAMES', type: 'Record<string, string[]>', value: get('TIERNAMES'), doc: 'The 14 tier names per stat family.' },
    { name: 'STR_TIERS', type: 'TierItem[]', value: tierItems('str') },
    { name: 'SPD_TIERS', type: 'TierItem[]', value: tierItems('spd') },
    { name: 'DUR_TIERS', type: 'TierItem[]', value: tierItems('dur') },
    { name: 'IQ_TIERS', type: 'TierItem[]', value: tierItems('iq') },
    { name: 'CHA_TIERS', type: 'TierItem[]', value: tierItems('cha') },
    { name: 'WM_TIERS', type: 'TierItem[]', value: tierItems('wm') },
    { name: 'PM_TIERS', type: 'TierItem[]', value: tierItems('pm') },
    { name: 'GROWTH', type: 'Growth[]', value: get('GROWTH') },
    { name: 'WEAPONS', type: 'Weapon[]', value: get('WEAPONS') },
    { name: 'POWERS', type: 'Power[]', value: get('POWERS'), doc: 'The default power wheel.' },
    { name: 'POWER_ALL', type: 'Power[]', value: get('POWER_ALL'), doc: 'Every power, including class-only ones.' },
    { name: 'HOLY', type: 'Power[]', value: get('HOLY'), doc: 'Paladin power wheel.' },
    { name: 'CURSED', type: 'Power[]', value: get('CURSED'), doc: 'Necromancer power wheel.' },
    { name: 'SPELLBOOK', type: 'Power[]', value: get('SPELLBOOK'), doc: 'Mage power wheel.' },
    { name: 'ENCHANTS', type: 'Enchant[]', value: get('ENCHANTS') },
    { name: 'WEAKS', type: 'Weakness[]', value: get('WEAKS'), doc: 'Weaknesses.' },
    { name: 'CURED', type: 'Weakness', value: get('CURED'), doc: 'What a cured weakness becomes.' },
    { name: 'CHAOS', type: 'KeyedItem[]', value: get('CHAOS'), doc: 'Chaos factors.' },
    { name: 'QUIRKS', type: 'KeyedItem[]', value: get('QUIRKS') },
    { name: 'SIDEKICKS', type: 'KeyedItem[]', value: get('SIDEKICKS') },
    { name: 'TITLES', type: 'KeyedItem[]', value: get('TITLES') },
    { name: 'SKIPPED', type: 'TierItem', value: get('SKIPPED'), doc: 'Placeholder for a wheel that was skipped (power mastery without a power).' },
  ],
);

writeModule('gear.ts', 'Gear, rarities and slots.', "import type { Gear, GearSlot, RarityKey } from '../types';", [
  { name: 'RARITY', type: 'Record<RarityKey, { n: string; q: 0 | 1 | 2 | 3; c: string }>', value: get('RARITY') },
  { name: 'RARITY_ORDER', type: 'RarityKey[]', value: get('RARITY_ORDER') },
  { name: 'GEAR_SLOTS', type: 'GearSlot[]', value: get('GEAR_SLOTS') },
  { name: 'SLOT_N', type: 'Record<GearSlot, string>', value: get('SLOT_N') },
  { name: 'SLOT_E', type: 'Record<GearSlot, string>', value: get('SLOT_E') },
  { name: 'GEAR', type: 'Gear[]', value: get('GEAR') },
  { name: 'GEM_PRICE', type: 'Record<string, number>', value: get('GEM_PRICE'), doc: 'Gem price of premium gear.' },
]);

writeModule(
  'synergies.ts',
  'Synergies: combos of picks that unlock bonuses. Their conditions live in ../synergy-tests.ts.',
  "import type { Synergy } from '../types';",
  [{ name: 'SYN', type: 'Synergy[]', value: get('SYN') }],
);

writeModule('arenas.ts', 'Arenas.', "import type { Arena } from '../types';", [{ name: 'ARENAS', type: 'Arena[]', value: get('ARENAS') }]);

writeModule(
  'kits.ts',
  'Move kits: class, race and signature-wheel data. Weapon moves are rules in ../kits.ts.',
  "import type { KitMove } from '../types';",
  [
    { name: 'ARCH_KIT', type: 'Record<string, KitMove[]>', value: get('ARCH_KIT'), doc: 'Two class moves per archetype.' },
    { name: 'RACE_KIT', type: 'Record<string, KitMove>', value: get('RACE_KIT'), doc: 'One racial move per race.' },
    {
      name: 'ULT_WHEEL',
      type: '{ k: string; n: string; e: string; m: number; q: 0 | 1 | 2 | 3 }[]',
      value: get('ULT_WHEEL'),
      doc: 'Signature damage wheel slices.',
    },
  ],
);

writeModule('talents.ts', 'Talent tree: five branches of twelve talents in six tiers.', '', [
  {
    name: 'TREE',
    type: '{ k: string; n: string; e: string; col: string; t: [string, string, string, number, TalentEffect, string][] }[]',
    value: get('TREE'),
    doc: 'Rows are [key, name, emoji, max rank, effect per rank, description].',
  },
  { name: 'OLD_TAL', type: 'Record<string, string>', value: get('OLD_TAL'), doc: 'Old flat talent keys mapped to tree nodes.' },
]);

writeModule(
  'misc.ts',
  'Smaller tables: level-ups, events, injuries, achievements, contracts, daily wheel, mutators.',
  "import type { Boon, Injury, Quality } from '../types';",
  [
    { name: 'LEVELUP', type: '(Boon & { w: number; q: Quality; respin?: number })[]', value: get('LEVELUP') },
    { name: 'BONUS', type: '(Boon & { w: number; q: Quality })[]', value: get('BONUS'), doc: 'Bonus wheel.' },
    { name: 'EVENTS', type: '{ k: string; n: string; e: string; w: number; q: Quality; d: string }[]', value: get('EVENTS') },
    { name: 'INJURIES', type: 'Injury[]', value: get('INJURIES') },
    { name: 'ACHIEVEMENTS', type: '{ k: string; n: string; e: string; q: Quality; d: string }[]', value: get('ACHIEVEMENTS'), doc: 'Core achievements; story ones are added with the story data.' },
    { name: 'CONTRACTS', type: '{ k: string; n: string; e: string; d: string; coins: number; xp: number }[]', value: get('CONTRACTS') },
    { name: 'DAILY', type: '{ k: string; n: string; e: string; w: number; q: Quality }[]', value: get('DAILY'), doc: 'Daily wheel.' },
    {
      name: 'MUTATORS',
      type: '{ k: string; n: string; e: string; w: number; q: Quality; d: string; mods: [FightMod, FightMod]; arena?: string }[]',
      value: get('MUTATORS'),
      doc: 'Daily challenge mutators.',
    },
    { name: 'POWER_SCALE', type: 'string[]', value: get('POWER_SCALE') },
  ],
);

// talents.ts and misc.ts reference helper types; append them.
import { appendFileSync } from 'node:fs';
appendFileSync(
  resolve(OUT, 'talents.ts'),
  "\nexport interface TalentEffect {\n  m?: import('../types').StatMods;\n  fx?: import('../types').TraitFx;\n  econ?: string;\n}\n",
);
appendFileSync(
  resolve(OUT, 'misc.ts'),
  "\n/** Per-fighter fight modifiers (engine HP units: 100 = normal). */\nexport interface FightMod {\n  hp?: number;\n  maxHp?: number;\n  en?: number;\n  readB?: number;\n  revive?: number;\n  dmgX?: number;\n  halfHp?: number;\n}\n",
);

// names
const names: Table[] = ['N_TITLE', 'N_FIRST', 'N_EPI', 'N_ADJ', 'N_NOUN', 'N_PLACE', 'N_SURN', 'N_NICK', 'N_DESTROY', 'N_ROLE', 'N_ROMAN', 'N_TAG'].map(
  (n) => ({ name: n, type: 'string[]', value: get(n) }),
);
writeModule('names.ts', 'Meme name parts. Templates live in ../names.ts.', '', names);
