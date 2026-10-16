// Cups, the base shop, contracts and loot.
// Ported from the legacy game by tools/parity/extract-content.ts (final values after all legacy patches).

/** Cups and the gauntlet (unlock checks are ported with the screens). */
export const TIERS_T: { k: string; n: string; e: string; size: number; lvl: number; coins: number; xpW: number; d: string; lock: string }[] = [
  {
    k: 'local',
    n: 'Local brawl',
    e: '🥊',
    size: 8,
    lvl: 0,
    coins: 3,
    xpW: 8,
    d: 'Eight fighters, three rounds, one parking lot.',
    lock: '',
  },
  {
    k: 'regional',
    n: 'Regional cup',
    e: '🏆',
    size: 16,
    lvl: 2,
    coins: 6,
    xpW: 11,
    d: 'Sixteen fighters. The sandwiches are better here.',
    lock: 'Reach chapter 2 of the story',
  },
  {
    k: 'world',
    n: 'World championship',
    e: '🌍',
    size: 32,
    lvl: 4,
    coins: 10,
    xpW: 15,
    d: 'Thirty-two fighters. Cameras. Regret, live.',
    lock: 'Reach chapter 4 of the story',
  },
  {
    k: 'gauntlet',
    n: 'The gauntlet',
    e: '🔥',
    size: 0,
    lvl: 0,
    coins: 0,
    xpW: 8,
    d: "Keep winning until you don't. That's the whole format.",
    lock: '',
  },
];

/** Old services list. */
export const SHOP: { k: string; n: string; e: string; cost: number; d: string; na?: string }[] = [
  { k: 'cure', n: 'Cure weakness', e: '🩹', cost: 10, d: 'Removes their weakness for good', na: 'No weakness to cure' },
  { k: 'heal', n: 'Physio session', e: '🩺', cost: 4, d: 'Heals every injury right away', na: 'No injuries right now' },
  { k: 'stat', n: 'Personal trainer', e: '🏋️', cost: 6, d: '+1 to a stat you pick. Gets pricier each time' },
  { k: 'weapon', n: 'Weapon shop', e: '🗡️', cost: 5, d: 'Spin a new weapon and weapon mastery' },
  { k: 'power', n: 'Power swap', e: '✨', cost: 8, d: 'Spin a new power and power mastery' },
  { k: 'stance', n: 'Stance coach', e: '🥋', cost: 3, d: 'Spin a new fighting stance' },
  {
    k: 'drink',
    n: 'Energy drink',
    e: '🥤',
    cost: 2,
    d: 'Start the next fight with full energy',
    na: 'Already stocked for the next fight',
  },
  {
    k: 'scout',
    n: 'Scouting report',
    e: '🔭',
    cost: 2,
    d: 'Read the next opponent 20% better',
    na: 'Already scouted for the next fight',
  },
];

export const CONTRACTS: { k: string; n: string; e: string; d: string; coins: number; xp: number }[] = [
  { k: 'combo2', n: 'Combo specialist', e: '⚗️', d: 'Land 2 element combos in one fight', coins: 5, xp: 6 },
  { k: 'reads3', n: 'Mind games', e: '🔮', d: 'Win the move matchup 3 times in one fight', coins: 4, xp: 6 },
  { k: 'clean', n: 'Clean win', e: '🧼', d: 'Win a fight taking less than 25 damage', coins: 6, xp: 8 },
  { k: 'upset', n: 'Upset special', e: '📉', d: 'Beat someone you had under 45% odds against', coins: 7, xp: 10 },
  { k: 'quick', n: 'Quick work', e: '⏱️', d: 'Win a fight in 3 rounds or fewer', coins: 4, xp: 6 },
  { k: 'ults', n: 'Show-off', e: '🌟', d: 'Use your signature move twice in one fight', coins: 5, xp: 6 },
  { k: 'wall', n: 'Brick wall', e: '🧱', d: 'Guard 3 times in a fight and still win', coins: 4, xp: 6 },
  { k: 'hazard', n: 'Hostile territory', e: '🌋', d: 'Win in an arena with a hazard', coins: 5, xp: 6 },
  { k: 'semis', n: 'Deep run', e: '🏟️', d: 'Reach the semifinals of any tournament', coins: 7, xp: 10 },
  { k: 'streak', n: 'Hot streak', e: '🔥', d: 'Win 3 gauntlet fights in a row', coins: 8, xp: 10 },
  {
    k: 'bigger',
    n: 'The bigger they are',
    e: '🗡️',
    d: 'Beat an opponent 2 or more levels above you',
    coins: 7,
    xp: 10,
  },
];

/** Items the base shop always stocks. */
export const BASIC: string[] = ['bandage', 'drink', 'scout', 'charm'];

/** Loot wheel rarity slices. */
export const LOOT_SLICES: [rarity: string, n: string, e: string][] = [
  ['junk', 'Junk gear', '🗑️'],
  ['common', 'Common gear', '📦'],
  ['rare', 'Rare gear', '💎'],
  ['epic', 'Epic gear', '🔮'],
  ['legendary', 'Legendary gear', '👑'],
  ['mythic', 'Mythic gear', '🌌'],
];
