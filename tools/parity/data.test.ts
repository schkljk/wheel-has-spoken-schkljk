import { describe, expect, it } from 'vitest';
import * as D from '../../packages/core/src/data';
import { mulberry32 } from '../../packages/core/src/rng';
import { clean } from './emit';
import { rewordDeep } from '../../packages/core/src/data/wording';
import { loadLegacyCore } from './legacy';

const legacy = loadLegacyCore(mulberry32(1));
const tierOf = (k: string) => legacy.get<{ k: string; items: unknown }[]>('SEQ').find((w) => w.k === k)!.items;

// [ported table, legacy expression]
const TABLES: [string, unknown, unknown][] = [
  ...(['RACES', 'RSUB', 'ARCHS', 'ASUB', 'ULTS', 'STANCES', 'SIZES', 'BACKS', 'TIERNAMES', 'GROWTH', 'WEAPONS', 'POWERS', 'POWER_ALL',
    'HOLY', 'CURSED', 'SPELLBOOK', 'ENCHANTS', 'WEAKS', 'CURED', 'CHAOS', 'QUIRKS', 'SIDEKICKS', 'TITLES', 'SKIPPED',
    'RARITY', 'RARITY_ORDER', 'GEAR_SLOTS', 'SLOT_N', 'SLOT_E', 'GEAR', 'GEM_PRICE', 'SYN', 'ARENAS', 'ARCH_KIT', 'RACE_KIT',
    'ULT_WHEEL', 'TREE', 'OLD_TAL', 'LEVELUP', 'BONUS', 'EVENTS', 'INJURIES', 'DAILY', 'MUTATORS',
    'POWER_SCALE', 'N_TITLE', 'N_FIRST', 'N_EPI', 'N_ADJ', 'N_NOUN', 'N_PLACE', 'N_SURN', 'N_NICK', 'N_DESTROY', 'N_ROLE',
    'N_ROMAN', 'N_TAG'] as const).map((n): [string, unknown, unknown] => [n, (D as Record<string, unknown>)[n], legacy.get(n)]),
  ...(['str', 'spd', 'dur', 'iq', 'cha', 'wm', 'pm'] as const).map((k): [string, unknown, unknown] => [
    `${k.toUpperCase()}_TIERS`,
    (D as Record<string, unknown>)[`${k.toUpperCase()}_TIERS`],
    tierOf(k),
  ]),
];

// the descriptions carry the wording fixes (data/wording.ts): lay them over the legacy tables too
describe('ported data equals the legacy tables', () => {
  it.each(TABLES)('%s', (_name, ported, original) => {
    expect(ported).toBeDefined();
    expect(ported).toEqual(rewordDeep(clean(original)));
  });
});
