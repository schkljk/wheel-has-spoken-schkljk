import { describe, expect, it } from 'vitest';
import * as D from '../../packages/core/src/data';
import { readLegacyGlobals } from './extract-content';

// The content tables (story, progression, economy, text) equal the running legacy game.
const NAMES = [
  'CHAPTERS', 'BOSSES', 'NODE', 'ITEMS', 'SEVENTS', 'MYSTERY', 'TRAIN', 'MERCHANTS', 'STORY_STOCK', 'CH_PCT', 'TIER_PCT',
  'RANKS', 'FAME_WIN', 'FAME_CUP', 'LEGACY', 'GOALS', 'MASTERY', 'MASTERY_RW', 'COL_STEP', 'ACHIEVEMENTS',
  'TIERS_T', 'SHOP', 'CONTRACTS', 'BASIC', 'LOOT_SLICES',
  'FLAVOR', 'STAT_INFO', 'RULES', 'STATUS_INFO', 'PILL_INFO', 'COMBO_INFO', 'ARCH_MECH', 'TAGN', 'WHEELN', 'CATN', 'QN', 'TUT', 'INTENT_TXT', 'HOW',
];

describe('ported content equals the running legacy game', async () => {
  const legacy = await readLegacyGlobals(NAMES);
  it.each(NAMES)('%s', (n) => {
    expect((D as Record<string, unknown>)[n]).toEqual(legacy[n]);
  });
  it('has the expected amount of content', () => {
    expect(D.CHAPTERS).toHaveLength(20);
    expect(D.BOSSES).toHaveLength(20);
    expect(D.GOALS).toHaveLength(39);
    expect(D.LEGACY).toHaveLength(14);
    expect(D.RANKS).toHaveLength(10);
  });
});
