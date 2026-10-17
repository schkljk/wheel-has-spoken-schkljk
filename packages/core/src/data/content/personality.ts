// AI personalities (Phase 4, upgrade 11): how a fighter plays when the AI is at the wheel. Every fighter has
// one, read off their build (stance, stats, quirks), so nothing new is rolled and old saves just work.

export type PersonalityKey = 'aggressive' | 'turtle' | 'gambler' | 'tactician';

export interface Personality {
  k: PersonalityKey;
  n: string;
  e: string;
  /** how much more (or less) often the AI picks each move */
  w: Partial<Record<'strike' | 'power' | 'guard' | 'feint' | 'focus', number>>;
  /** better at spotting the opponent's habits, and harder on them once spotted */
  smart?: number;
  punish?: number;
  /** extra chance of a heavy blow, a counter or an overcharge when it picks that move */
  heavy?: number;
  counter?: number;
  overcharge?: number;
  /** fires the signature the moment the bar is full */
  ultNow?: boolean;
  /** the mechanics line and the joke */
  d: string;
  flavor: string;
}

export const PERSONALITIES: Record<PersonalityKey, Personality> = {
  aggressive: {
    k: 'aggressive', n: 'Aggressive', e: '😤',
    w: { strike: 1.35, guard: 0.7, focus: 0.8 }, heavy: 0.1,
    d: 'Strikes a lot, guards little, swings heavy. Guard against them.',
    flavor: 'Has never once considered defense. Thinks it is a rumor.',
  },
  turtle: {
    k: 'turtle', n: 'Turtle', e: '🐢',
    w: { guard: 1.45, focus: 1.25, strike: 0.85 }, counter: 0.1,
    d: 'Guards and charges up a lot, and counters. Powers break them.',
    flavor: 'Will outlast you. Will outlast the heat death of the universe.',
  },
  gambler: {
    k: 'gambler', n: 'Gambler', e: '🎲',
    w: { power: 1.3, feint: 1.6, focus: 0.8 }, overcharge: 0.15, ultNow: true,
    d: 'Feints, overcharges powers and fires the signature the moment it can.',
    flavor: 'Has a system. The system is vibes.',
  },
  tactician: {
    k: 'tactician', n: 'Tactician', e: '🧠',
    w: { feint: 1.1 }, smart: 0.15, punish: 1.6,
    d: 'Watches your habits and punishes repeats. Mix it up.',
    flavor: 'Took notes on you. Color-coded.',
  },
};
