import type { NumStats } from '@whs/core';
import type { IconName } from './Icon';

/** The real numbers' rows: key, icon, label and unit (on its own, so the first chunk can use it without the card). */
export const NS_META: [keyof NumStats, IconName, string, string?][] = [
  ['hp', 'heart', 'HP'],
  ['atk', 'sword', 'Attack'],
  ['pow', 'spark', 'Power'],
  ['def', 'shield', 'Defense'],
  ['spd', 'wing', 'Speed'],
  ['crit', 'target', 'Crit', '%'],
  ['dodge', 'swirl', 'Dodge', '%'],
  ['cha', 'chat', 'Charisma'],
];
