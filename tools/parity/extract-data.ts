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
import { appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mulberry32 } from '../../packages/core/src/rng';
import { writeModule as write, type Table } from './emit';
import { loadLegacyCore } from './legacy';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../packages/core/src/data');
const L = loadLegacyCore(mulberry32(1));
const get = <T = unknown>(n: string) => L.get<T>(n);

// ---------- build wheels ----------
const SEQ = get<{ k: string; items: unknown }[]>('SEQ');
const tierItems = (k: string) => SEQ.find((w) => w.k === k)!.items;

write(OUT,
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

write(OUT, 'gear.ts', 'Gear, rarities and slots.', "import type { Gear, GearSlot, RarityKey } from '../types';", [
  { name: 'RARITY', type: 'Record<RarityKey, { n: string; q: 0 | 1 | 2 | 3; c: string }>', value: get('RARITY') },
  { name: 'RARITY_ORDER', type: 'RarityKey[]', value: get('RARITY_ORDER') },
  { name: 'GEAR_SLOTS', type: 'GearSlot[]', value: get('GEAR_SLOTS') },
  { name: 'SLOT_N', type: 'Record<GearSlot, string>', value: get('SLOT_N') },
  { name: 'SLOT_E', type: 'Record<GearSlot, string>', value: get('SLOT_E') },
  { name: 'GEAR', type: 'Gear[]', value: get('GEAR') },
  { name: 'GEM_PRICE', type: 'Record<string, number>', value: get('GEM_PRICE'), doc: 'Gem price of premium gear.' },
]);

write(OUT,
  'synergies.ts',
  'Synergies: combos of picks that unlock bonuses. Their conditions live in ../synergy-tests.ts.',
  "import type { Synergy } from '../types';",
  [{ name: 'SYN', type: 'Synergy[]', value: get('SYN') }],
);

write(OUT, 'arenas.ts', 'Arenas.', "import type { Arena } from '../types';", [{ name: 'ARENAS', type: 'Arena[]', value: get('ARENAS') }]);

write(OUT,
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

write(OUT, 'talents.ts', 'Talent tree: five branches of twelve talents in six tiers.', '', [
  {
    name: 'TREE',
    type: '{ k: string; n: string; e: string; col: string; t: [string, string, string, number, TalentEffect, string][] }[]',
    value: get('TREE'),
    doc: 'Rows are [key, name, emoji, max rank, effect per rank, description].',
  },
  { name: 'OLD_TAL', type: 'Record<string, string>', value: get('OLD_TAL'), doc: 'Old flat talent keys mapped to tree nodes.' },
]);

write(OUT,
  'misc.ts',
  'Smaller tables: level-ups, events, injuries, daily wheel, mutators. Achievements and contracts are in content/.',
  "import type { Boon, Injury, Quality } from '../types';",
  [
    { name: 'LEVELUP', type: '(Boon & { w: number; q: Quality; respin?: number })[]', value: get('LEVELUP') },
    { name: 'BONUS', type: '(Boon & { w: number; q: Quality })[]', value: get('BONUS'), doc: 'Bonus wheel.' },
    { name: 'EVENTS', type: '{ k: string; n: string; e: string; w: number; q: Quality; d: string }[]', value: get('EVENTS') },
    { name: 'INJURIES', type: 'Injury[]', value: get('INJURIES') },
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
write(OUT, 'names.ts', 'Meme name parts. Templates live in ../names.ts.', '', names);
