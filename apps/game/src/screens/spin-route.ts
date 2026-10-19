import { go } from '../state/game';
import type { SpinSpec } from './Spin';

/**
 * A single wheel (loot, level-ups, events, arenas...). Resolves with what landed once Continue is tapped. On its
 * own, so the menus can ask for a wheel without loading the wheel screen (it loads with the screen, on use).
 */
export function spinWheel<T extends { n: string; e?: string; q?: number; d?: string }>(spec: SpinSpec<T>): Promise<T> {
  return new Promise((resolve) => go({ screen: 'spin', spec, done: resolve, key: Math.random() }));
}
