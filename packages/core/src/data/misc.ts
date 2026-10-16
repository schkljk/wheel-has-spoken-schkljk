// Smaller tables: level-ups, events, injuries, achievements, contracts, daily wheel, mutators.
// Ported from the legacy game by tools/parity/extract-data.ts (final values after all legacy patches).
import type { Boon, Injury, Quality } from '../types';

export const LEVELUP: (Boon & { w: number; q: Quality; respin?: number })[] = [
  { k: 'str', n: '+1 Strength', e: '💪', w: 2.24, q: 2 },
  { k: 'spd', n: '+1 Speed', e: '👟', w: 2.24, q: 2 },
  { k: 'dur', n: '+1 Durability', e: '🛡️', w: 2.24, q: 2 },
  { k: 'iq', n: '+1 IQ', e: '🧠', w: 2, q: 1 },
  { k: 'wm', n: '+1 Weapon mastery', e: '🗡️', w: 2, q: 2 },
  { k: 'pm', n: '+1 Power mastery', e: '✨', w: 2, q: 2 },
  { k: 'str2', n: '+2 Strength', e: '🦾', w: 1.22, q: 3 },
  { k: 'dur2', n: '+2 Durability', e: '🧱', w: 1.22, q: 3 },
  { k: 'all1', n: '+1 to everything', e: '🌟', w: 1.1, q: 3 },
  { k: 'cure', n: 'Weakness overcome', e: '🩹', w: 1, q: 3 },
  { k: 'awaken', n: 'Awakening: new power', e: '👁️', w: 1, q: 3, respin: 1 },
  { k: 'arsenal', n: 'New weapon spin', e: '🗃️', w: 1, q: 2, respin: 1 },
];

/** Bonus wheel. */
export const BONUS: (Boon & { w: number; q: Quality })[] = [
  { k: 'str', n: '+1 Strength', e: '💪', w: 2.24, q: 2 },
  { k: 'spd', n: '+1 Speed', e: '👟', w: 2.24, q: 2 },
  { k: 'dur', n: '+1 Durability', e: '🛡️', w: 2.24, q: 2 },
  { k: 'iq', n: '+1 IQ', e: '🧠', w: 2, q: 1 },
  { k: 'wm', n: '+1 Weapon mastery', e: '🗡️', w: 2, q: 2 },
  { k: 'pm', n: '+1 Power mastery', e: '✨', w: 2, q: 2 },
  { k: 'cure', n: 'Weakness cured', e: '🩹', w: 1.26, q: 3 },
  { k: 'all', n: '+2 to everything', e: '👹', w: 0.95, q: 3 },
  { k: 'nothing', n: 'Nothing', e: '💀', w: 2, q: 0 },
  { k: 'curse', n: 'Cursed: −1 to everything', e: '🕳️', w: 1.26, q: 0 },
];

export const EVENTS: { k: string; n: string; e: string; w: number; q: Quality; d: string }[] = [
  { k: 'train', n: 'Training montage', e: '🏋️', w: 2.45, q: 2, d: '+1 to a random stat for good' },
  { k: 'sponsor', n: 'Sponsor deal', e: '💰', w: 2.24, q: 2, d: '+4 coins' },
  { k: 'injury', n: 'Tweaked something', e: '🤕', w: 2, q: 0, d: 'Picks up an injury' },
  { k: 'taunt', n: "Rival's taunt", e: '😤', w: 2.24, q: 2, d: 'Fired up: +15% damage next fight' },
  { k: 'stranger', n: 'Mysterious stranger', e: '🧙', w: 1.73, q: 2, d: 'Teaches them a trick: +1 power mastery' },
  { k: 'food', n: 'Bad street food', e: '🌭', w: 2, q: 0, d: 'Starts the next fight at 80 HP' },
  { k: 'energy', n: 'Energy drink', e: '🥤', w: 2, q: 2, d: 'Starts the next fight with full energy' },
  { k: 'fan', n: 'Fan mail', e: '💌', w: 2.24, q: 1, d: 'Nice, but it does nothing' },
  { k: 'scout', n: 'Scouted the opponent', e: '🔭', w: 1.73, q: 2, d: 'Reads the next opponent 20% better' },
  { k: 'relic', n: 'Cursed relic', e: '🗿', w: 1.41, q: 1, d: '+2 strength, −2 IQ, for good' },
  { k: 'blessing', n: 'Cosmic blessing', e: '🌠', w: 0.89, q: 3, d: '+1 to everything, for good' },
  { k: 'nothing', n: 'Nothing happened', e: '💤', w: 2.24, q: 0, d: 'A quiet day' },
];

export const INJURIES: Injury[] = [
  { k: 'ankle', n: 'Sprained ankle', e: '🦶', m: { spd: -2 }, dur: 2 },
  { k: 'concussion', n: 'Concussion', e: '😵', m: { iq: -2 }, dur: 1 },
  { k: 'arm', n: 'Broken arm', e: '🦴', m: { wm: -2, str: -1 }, dur: 2 },
  { k: 'ego', n: 'Bruised ego', e: '🥲', m: { str: -1, spd: -1, dur: -1, iq: -1, wm: -1, pm: -1 }, dur: 1 },
  { k: 'ribs', n: 'Cracked ribs', e: '🩻', m: { dur: -2 }, dur: 2 },
];

/** Core achievements; story ones are added with the story data. */
export const ACHIEVEMENTS: { k: string; n: string; e: string; q: Quality; d: string }[] = [
  { k: 'giant', n: 'Giant Slayer', e: '🗡️', q: 3, d: 'Beat an opponent you had under 35% odds against' },
  { k: 'comeback', n: 'Comeback Kid', e: '📈', q: 2, d: 'Win a fight with less than 10 HP left' },
  { k: 'flawless', n: 'Flawless', e: '💎', q: 3, d: 'Win a fight without taking damage' },
  { k: 'onepunch', n: 'One Punch', e: '👊', q: 2, d: 'Win a fight in the first round' },
  { k: 'untouch', n: 'Untouchable', e: '👻', q: 2, d: 'Dodge 3 attacks in one fight' },
  { k: 'reader', n: 'Mind Reader', e: '🔮', q: 2, d: 'Win the move matchup 4 times in one fight' },
  { k: 'combo', n: 'Combo Artist', e: '⚗️', q: 2, d: 'Land 3 element combos in one fight' },
  { k: 'defender', n: 'Title Defender', e: '🛡️', q: 3, d: 'Win a tournament while defending its belt' },
  { k: 'revenge', n: 'Revenge Served Cold', e: '🧊', q: 3, d: 'Beat your nemesis' },
  { k: 'iron', n: 'Iron Will', e: '🦾', q: 2, d: 'Fight 25 times with one fighter' },
  { k: 'regional', n: 'Regional Champion', e: '🥈', q: 2, d: 'Win the Regional cup' },
  { k: 'world', n: 'World Champion', e: '🌍', q: 3, d: 'Win the World championship' },
  { k: 'gauntlet', n: 'Gauntlet Legend', e: '🔥', q: 3, d: 'Win 10 gauntlet fights in a row' },
  { k: 'underdog', n: 'Underdog Story', e: '🐭', q: 3, d: 'Win a tournament with a fighter rated Cooked or Mid' },
  { k: 'pigeon', n: 'Pigeon Supremacy', e: '🐦', q: 3, d: 'Win any tournament as a pigeon' },
  { k: 'lvl10', n: 'Veteran', e: '🎖️', q: 2, d: 'Reach level 10' },
  { k: 'surpass', n: 'Surpassed a Legend', e: '👑', q: 3, d: 'Beat a hall of fame legend in a challenge' },
  { k: 'oldscore', n: 'Old Score Settled', e: '⚔️', q: 2, d: 'Beat a returning rival in a rematch' },
  { k: 'mythic', n: 'Mythic', e: '🌌', q: 3, d: 'Reach the Mythic rank' },
  { k: 'rush', n: 'Boss Rusher', e: '🏃', q: 3, d: 'Beat all five bosses back to back in the boss rush' },
  { k: 'bigbet', n: 'High Roller', e: '🎰', q: 2, d: 'Win a fight club bet that paid 3× or more' },
  { k: 'daily5', n: 'Creature of Habit', e: '📆', q: 2, d: 'Win the daily challenge five days in a row' },
];

export const CONTRACTS: { k: string; n: string; e: string; d: string; coins: number; xp: number }[] = [
  { k: 'combo2', n: 'Combo specialist', e: '⚗️', d: 'Land 2 element combos in one fight', coins: 8, xp: 6 },
  { k: 'reads3', n: 'Mind games', e: '🔮', d: 'Win the move matchup 3 times in one fight', coins: 7, xp: 6 },
  { k: 'clean', n: 'Clean win', e: '🧼', d: 'Win a fight taking less than 25 damage', coins: 10, xp: 8 },
  { k: 'upset', n: 'Upset special', e: '📉', d: 'Beat someone you had under 45% odds against', coins: 12, xp: 10 },
  { k: 'quick', n: 'Quick work', e: '⏱️', d: 'Win a fight in 3 rounds or fewer', coins: 7, xp: 6 },
  { k: 'ults', n: 'Show-off', e: '🌟', d: 'Use your signature move twice in one fight', coins: 8, xp: 6 },
  { k: 'wall', n: 'Brick wall', e: '🧱', d: 'Guard 3 times in a fight and still win', coins: 7, xp: 6 },
  { k: 'hazard', n: 'Hostile territory', e: '🌋', d: 'Win in an arena with a hazard', coins: 9, xp: 6 },
  { k: 'semis', n: 'Deep run', e: '🏟️', d: 'Reach the semifinals of any tournament', coins: 12, xp: 10 },
  { k: 'streak', n: 'Hot streak', e: '🔥', d: 'Win 3 gauntlet fights in a row', coins: 14, xp: 10 },
  {
    k: 'bigger',
    n: 'The bigger they are',
    e: '🗡️',
    d: 'Beat an opponent 2 or more levels above you',
    coins: 12,
    xp: 10,
  },
];

/** Daily wheel. */
export const DAILY: { k: string; n: string; e: string; w: number; q: Quality }[] = [
  { k: 'c5', n: '5 coins', e: '🪙', w: 2.45, q: 1 },
  { k: 'c10', n: '10 coins', e: '💰', w: 2, q: 2 },
  { k: 'c25', n: '25 coins', e: '🤑', w: 1.1, q: 3 },
  { k: 'xp', n: '+15 XP', e: '⬆️', w: 2, q: 2 },
  { k: 'gear', n: 'Free trinket', e: '🎁', w: 1.41, q: 3 },
  { k: 'lvl', n: 'Free level-up spin', e: '🌟', w: 1, q: 3 },
  { k: 'drink', n: 'Energy drink', e: '🥤', w: 1.73, q: 1 },
  { k: 'scout', n: 'Scouting report', e: '🔭', w: 1.73, q: 1 },
  { k: 'nothing', n: 'Absolutely nothing', e: '💀', w: 1.73, q: 0 },
];

/** Daily challenge mutators. */
export const MUTATORS: { k: string; n: string; e: string; w: number; q: Quality; d: string; mods: [FightMod, FightMod]; arena?: string }[] = [
  {
    k: 'glass',
    n: 'Glass cannons',
    e: '💥',
    w: 3,
    q: 2,
    d: 'Both fighters deal 50% more damage',
    mods: [{ dmgX: 1.5 }, { dmgX: 1.5 }],
  },
  {
    k: 'sudden',
    n: 'Sudden death',
    e: '☠️',
    w: 3,
    q: 2,
    d: 'Both fighters start at 40 HP',
    mods: [{ hp: 40 }, { hp: 40 }],
  },
  {
    k: 'charged',
    n: 'Supercharged',
    e: '⚡',
    w: 3,
    q: 2,
    d: 'Both fighters start with full energy',
    mods: [{ en: 100 }, { en: 100 }],
  },
  {
    k: 'underdog',
    n: 'Underdog',
    e: '🐶',
    w: 3,
    q: 1,
    d: 'You start at 70 HP and they hit 25% harder',
    mods: [{ hp: 70 }, { dmgX: 1.25 }],
  },
  { k: 'openbook', n: 'Open book', e: '📖', w: 3, q: 3, d: 'You read them 30% better', mods: [{ readB: 0.3 }, {}] },
  {
    k: 'secondwind',
    n: 'Second wind',
    e: '💨',
    w: 3,
    q: 2,
    d: 'Both fighters get back up once with 30 HP',
    mods: [{ revive: 30 }, { revive: 30 }],
  },
  {
    k: 'lava',
    n: 'The floor is lava',
    e: '🌋',
    w: 2,
    q: 1,
    d: 'The fight takes place in the lava pit',
    mods: [{}, {}],
    arena: 'lava',
  },
  { k: 'miniboss', n: 'Mini boss', e: '👹', w: 2, q: 1, d: 'They have 150 HP', mods: [{}, { maxHp: 150 }] },
];

export const POWER_SCALE: string[] = [
  'Harmless', 'Below average', 'Street level', 'Peak human', 'Superhuman', 'Wall level', 'Building level', 'City block',
  'City level', 'Mountain level', 'Island level', 'Continental', 'Planetary', 'Stellar', 'Galactic', 'Universal',
  'Multiversal', 'Outerversal', 'Boundless', 'Author level',
];

/** Per-fighter fight modifiers (engine HP units: 100 = normal). */
export interface FightMod {
  hp?: number;
  maxHp?: number;
  en?: number;
  readB?: number;
  revive?: number;
  dmgX?: number;
  halfHp?: number;
}
