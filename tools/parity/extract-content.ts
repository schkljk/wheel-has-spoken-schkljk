/**
 * One-off port tool for the game content that lives in the legacy UI files (story, bosses, items,
 * progression, economy, help and flavor text). Those files touch the DOM as they load, so this
 * reads the final tables from the real legacy game running in headless Chromium.
 *
 *   npx tsx tools/parity/extract-content.ts
 *
 * Functions inside these tables (story event effects, goal progress counters, unlock checks)
 * are game rules that act on the save; they are ported with the save system and screens.
 */
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openLegacyPage } from './browser';
import { writeModule, type Table } from './emit';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'packages/core/src/data/content');
const TOOL = 'tools/parity/extract-content.ts';

/** Reads named globals from the running legacy game, dropping functions. */
export async function readLegacyGlobals(names: string[]): Promise<Record<string, unknown>> {
  const { page, browser } = await openLegacyPage();
  try {
    const json = await page.evaluate(
      `JSON.stringify(Object.fromEntries(${JSON.stringify(names)}.map((n) => [n, (0, eval)(n)])), (k, v) => (typeof v === 'function' ? undefined : v))`,
    );
    return JSON.parse(json as string) as Record<string, unknown>;
  } finally {
    await browser.close();
  }
}

const NAMES = [
  'CHAPTERS', 'BOSSES', 'NODE', 'ITEMS', 'SEVENTS', 'MYSTERY', 'TRAIN', 'MERCHANTS', 'STORY_STOCK', 'CH_PCT', 'TIER_PCT',
  'RANKS', 'FAME_WIN', 'FAME_CUP', 'LEGACY', 'GOALS', 'MASTERY', 'MASTERY_RW', 'COL_STEP', 'ACHIEVEMENTS',
  'TIERS_T', 'SHOP', 'CONTRACTS', 'BASIC', 'LOOT_SLICES',
  'FLAVOR', 'STAT_INFO', 'RULES', 'STATUS_INFO', 'PILL_INFO', 'COMBO_INFO', 'ARCH_MECH', 'TAGN', 'WHEELN', 'CATN', 'QN', 'TUT', 'INTENT_TXT', 'HOW',
];

async function main() {
  const G = await readLegacyGlobals(NAMES);
  mkdirSync(OUT, { recursive: true });
  const t = (name: string, type: string, doc?: string): Table => ({ name, type, value: G[name], doc });
  const write = (file: string, header: string, imports: string, tables: Table[]) => writeModule(OUT, file, header, imports, tables, TOOL);

  write('story.ts', 'Story mode: chapters, bosses, map nodes, items, events and merchants.', "import type { Quality, StatMods, TraitFx } from '../../types';", [
    t('CHAPTERS', '{ n: string; e: string; col: string; lvl: number; len: number; intro: string; act?: number }[]', 'Story chapters (Act I is 1-10, Act II 11-20).'),
    t(
      'BOSSES',
      '{ name: string; title: string; e: string; picks: Record<string, string>; stats: Record<string, number>; maxHp: number; fx?: TraitFx; aiSkill: number; phase: { txt: string; m?: StatMods; fx?: Record<string, number> }; lines: string[]; wheelBoss?: number }[]',
      'One boss per chapter, each with a phase two.',
    ),
    t('NODE', 'Record<string, { e: string; n: string; d: string }>', 'Map node kinds.'),
    t('ITEMS', '{ k: string; n: string; e: string; cost: number; d: string; story?: number }[]', 'Bag items.'),
    t(
      'SEVENTS',
      '{ k: string; e: string; t: string; d: string; o: { l: string; s: string; cost?: number; fight?: string; wheel?: number; loot?: string; risk?: number }[] }[]',
      'Story events and their options (effects are ported with the story screens).',
    ),
    t('MYSTERY', '{ k: string; n: string; e: string; q: Quality; w: number }[]', 'Mystery box wheel.'),
    t('TRAIN', '{ k: string; n: string; e: string; q: Quality; w: number }[]', 'Training wheel.'),
    t('MERCHANTS', '[e: string, n: string, d: string][]', 'One merchant per chapter: emoji, name, pitch.'),
    t('STORY_STOCK', 'string[]', 'Items story merchants can stock.'),
    t('CH_PCT', '[lo: number, hi: number][]', 'Ranked-pool percentile window per chapter.'),
    t('TIER_PCT', 'Record<string, [lo: number, hi: number]>', 'Ranked-pool percentile window per cup.'),
  ]);

  write('progression.ts', 'Fame ranks, legacy perks, goals, class mastery and achievements.', '', [
    t('RANKS', '{ n: string; e: string; fame: number; perk: string }[]', 'Fame ranks.'),
    t('FAME_WIN', 'Record<string, number>', 'Fame per win by mode.'),
    t('FAME_CUP', 'Record<string, number>', 'Fame per cup win.'),
    t('LEGACY', '{ k: string; n: string; e: string; max: number; cost: number[]; d: string }[]', 'Legacy perks bought with points from retired fighters.'),
    t('GOALS', '{ k: string; n: string; e: string; d: string; need: number; rw: { gems?: number; coins?: number; legacy?: number } }[]', 'Permanent goals (progress counters are ported with the save system).'),
    t('MASTERY', 'number[]', 'Class mastery thresholds (wins).'),
    t('MASTERY_RW', '{ gems: number; legacy?: number; note?: string }[]', 'Class mastery rewards per level.'),
    t('COL_STEP', 'number', 'A collection milestone every this many entries.'),
    t('ACHIEVEMENTS', '{ k: string; n: string; e: string; q: 0 | 1 | 2 | 3; d: string }[]', 'Every achievement, including story ones.'),
  ]);

  write('economy.ts', 'Cups, the base shop, contracts and loot.', '', [
    t('TIERS_T', '{ k: string; n: string; e: string; size: number; lvl: number; coins: number; xpW: number; d: string; lock: string }[]', 'Cups and the gauntlet (unlock checks are ported with the screens).'),
    t('SHOP', '{ k: string; n: string; e: string; cost: number; d: string; na?: string }[]', 'Old services list.'),
    t('CONTRACTS', '{ k: string; n: string; e: string; d: string; coins: number; xp: number }[]'),
    t('BASIC', 'string[]', 'Items the base shop always stocks.'),
    t('LOOT_SLICES', '[rarity: string, n: string, e: string][]', 'Loot wheel rarity slices.'),
  ]);

  write('text.ts', 'Help, rules and flavor text.', '', [
    t('FLAVOR', 'Record<string, string>', 'One-liners per item name, in the house voice.'),
    t('STAT_INFO', 'Record<string, [e: string, n: string, d: string]>'),
    t('RULES', 'Record<string, [e: string, title: string, paragraphs: string[]]>', 'Tap-for-info rules pages.'),
    t('STATUS_INFO', 'Record<string, [e: string, n: string, d: string]>'),
    t('PILL_INFO', 'Record<string, [e: string, n: string, d: string]>'),
    t('COMBO_INFO', 'Record<string, string>'),
    t('ARCH_MECH', 'Record<string, string>', 'What each class does mechanically.'),
    t('TAGN', 'Record<string, string>', 'Damage tag names.'),
    t('WHEELN', 'Record<string, string>', 'Wheel names.'),
    t('CATN', 'Record<string, string>', 'Collection category names.'),
    t('QN', 'string[]', 'Quality names.'),
    t('TUT', '[e: string, title: string, text: string][]', 'Tutorial pages.'),
    t('INTENT_TXT', 'Record<string, string>'),
    t('HOW', 'Record<string, string>', 'How each basic move works.'),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
