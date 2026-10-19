// Fame ranks, legacy perks, goals, class mastery and achievements.
// Ported from the legacy game by tools/parity/extract-content.ts (final values after all legacy patches).

/** Fame ranks. */
export const RANKS: { n: string; e: string; fame: number; perk: string }[] = [
  { n: 'Rookie', e: '🥉', fame: 0, perk: 'Where everyone starts' },
  { n: 'Contender', e: '🥈', fame: 25, perk: 'Unlocks the Regional cup' },
  { n: 'Pro', e: '🥇', fame: 70, perk: '10% off everything in the shop' },
  { n: 'Elite', e: '💠', fame: 150, perk: 'Unlocks the World championship' },
  { n: 'Champion', e: '🏆', fame: 280, perk: 'Legendary gear in the shop' },
  { n: 'Legend', e: '👑', fame: 450, perk: '2 extra talent points' },
  { n: 'Mythic', e: '🌌', fame: 700, perk: 'A golden aura in every fight' },
  { n: 'Ascended', e: '🪽', fame: 1000, perk: '5 gems' },
  { n: 'Eternal', e: '♾️', fame: 1400, perk: '10 gems and 2 talent points' },
  { n: 'Wheelborn', e: '🎡', fame: 2000, perk: '25 gems. The Wheel knows your name' },
];

/** Fame per win by mode. */
export const FAME_WIN: Record<string, number> = { local: 3, regional: 5, world: 8, gauntlet: 2, challenge: 6 };

/** Fame per cup win. */
export const FAME_CUP: Record<string, number> = { local: 10, regional: 20, world: 40 };

/** Legacy perks bought with points from retired fighters. */
export const LEGACY: { k: string; n: string; e: string; max: number; cost: number[]; d: string }[] = [
  { k: 'coins', n: 'Head start', e: '💰', max: 3, cost: [2, 3, 4], d: 'New fighters start with 15 coins per level' },
  { k: 'xp', n: 'Veteran trainer', e: '📚', max: 3, cost: [2, 3, 5], d: '+10% XP per level' },
  { k: 'grit', n: 'Thick skin', e: '❤️', max: 1, cost: [4], d: '+1 grit in every story chapter' },
  { k: 'gear', n: 'Family heirloom', e: '🗝️', max: 1, cost: [4], d: 'New fighters start with a random trinket' },
  { k: 'talent', n: 'Born ready', e: '🌟', max: 2, cost: [3, 5], d: 'New fighters start with 1 talent point per level' },
  { k: 'recipe', n: 'Family recipe', e: '🍲', max: 2, cost: [2, 4], d: 'New fighters start with 2 bandages per level' },
  {
    k: 'crest',
    n: 'Family crest',
    e: '🛡️',
    max: 1,
    cost: [6],
    d: 'New fighters start with a random rare piece of gear',
  },
  {
    k: 'mentor',
    n: 'Old mentor',
    e: '🧓',
    max: 3,
    cost: [2, 3, 4],
    d: 'New fighters get +1 to a random stat per level',
  },
  {
    k: 'scouts',
    n: 'Scouting network',
    e: '🔭',
    max: 2,
    cost: [3, 5],
    d: 'All your fighters read opponents 5% better per level',
  },
  {
    k: 'iron',
    n: 'Iron constitution',
    e: '🦾',
    max: 2,
    cost: [4, 6],
    d: 'All your fighters get +1 durability per level',
  },
  {
    k: 'trust',
    n: 'Trust fund',
    e: '🏦',
    max: 3,
    cost: [2, 3, 4],
    d: '+10 coins per level whenever a story chapter is cleared',
  },
  {
    k: 'bloodline',
    n: 'Lucky bloodline',
    e: '🍀',
    max: 2,
    cost: [4, 6],
    d: 'Epic and better loot 15% more likely per level',
  },
  { k: 'famous', n: 'Famous name', e: '⭐', max: 2, cost: [3, 5], d: '+10% fame per level' },
  { k: 'merchant', n: 'Merchant friends', e: '🤝', max: 2, cost: [3, 4], d: 'Shops and merchants 5% cheaper per level' },
];

/** Permanent goals (progress counters are ported with the save system). */
export const GOALS: { k: string; n: string; e: string; d: string; need: number; rw: { gems?: number; coins?: number; legacy?: number } }[] = [
  { k: 'w10', n: 'First steps', e: '👣', d: 'Win 10 fights', need: 10, rw: { gems: 1, coins: 10 } },
  { k: 'w50', n: 'Regular', e: '🥊', d: 'Win 50 fights', need: 50, rw: { gems: 3, coins: 25 } },
  { k: 'w150', n: 'Veteran', e: '🎖️', d: 'Win 150 fights', need: 150, rw: { gems: 6, legacy: 1 } },
  { k: 'w400', n: 'Living legend', e: '🏛️', d: 'Win 400 fights', need: 400, rw: { gems: 12, legacy: 2 } },
  { k: 'w1000', n: 'The thousand', e: '👑', d: 'Win 1000 fights', need: 1000, rw: { gems: 25, legacy: 4 } },
  { k: 'e5', n: 'Elite hunter', e: '⚔️', d: 'Beat 5 elites', need: 5, rw: { gems: 2 } },
  { k: 'e25', n: 'Elite slayer', e: '🗡️', d: 'Beat 25 elites', need: 25, rw: { gems: 6 } },
  { k: 'e75', n: 'Nobody is elite', e: '💀', d: 'Beat 75 elites', need: 75, rw: { gems: 12, legacy: 1 } },
  { k: 'b3', n: 'Boss fight', e: '👹', d: 'Beat 3 bosses', need: 3, rw: { gems: 3 } },
  { k: 'b10', n: 'Boss collector', e: '🏆', d: 'Beat 10 bosses', need: 10, rw: { gems: 6 } },
  { k: 'b30', n: 'Boss hunter', e: '🔥', d: 'Beat 30 bosses', need: 30, rw: { gems: 12, legacy: 1 } },
  { k: 'ch5', n: 'Halfway there', e: '🗺️', d: 'Clear 5 chapters', need: 5, rw: { gems: 4, coins: 30 } },
  { k: 'ch10', n: 'Act I', e: '📖', d: 'Clear 10 chapters', need: 10, rw: { gems: 8, legacy: 1 } },
  { k: 'ch20', n: 'Act II', e: '📚', d: 'Clear 20 chapters', need: 20, rw: { gems: 15, legacy: 2 } },
  {
    k: 'ch40',
    n: 'Again and again',
    e: '♻️',
    d: 'Clear 40 chapters, any fighter, any run',
    need: 40,
    rw: { gems: 25, legacy: 3 },
  },
  { k: 'cup1', n: 'Silverware', e: '🥇', d: 'Win a cup', need: 1, rw: { gems: 2 } },
  { k: 'cup10', n: 'Trophy cabinet', e: '🏆', d: 'Win 10 cups', need: 10, rw: { gems: 8 } },
  {
    k: 'world3',
    n: 'World beater',
    e: '🌍',
    d: 'Win the World championship 3 times',
    need: 3,
    rw: { gems: 10, legacy: 1 },
  },
  { k: 'g5', n: 'Gauntlet runner', e: '🔥', d: 'Reach a 5-win gauntlet streak', need: 5, rw: { gems: 2 } },
  { k: 'g12', n: 'Gauntlet master', e: '⛓️', d: 'Reach a 12-win gauntlet streak', need: 12, rw: { gems: 8 } },
  { k: 'g25', n: 'Unbreakable', e: '💎', d: 'Reach a 25-win gauntlet streak', need: 25, rw: { gems: 20, legacy: 2 } },
  { k: 'dc7', n: 'Daily grind', e: '📆', d: 'Win 7 daily challenges', need: 7, rw: { gems: 4 } },
  { k: 'dc30', n: 'Every single day', e: '🗓️', d: 'Win 30 daily challenges', need: 30, rw: { gems: 12, legacy: 1 } },
  { k: 'rush1', n: 'Rush hour', e: '🏃', d: 'Clear a boss rush', need: 1, rw: { gems: 6 } },
  { k: 'bet10', n: 'Bookie', e: '🎰', d: 'Win 10 fight club bets', need: 10, rw: { gems: 3, coins: 30 } },
  { k: 'loot25', n: 'Treasure hunter', e: '💰', d: 'Spin 25 loot wheels', need: 25, rw: { gems: 3 } },
  { k: 'loot100', n: 'Hoarder', e: '🧺', d: 'Spin 100 loot wheels', need: 100, rw: { gems: 8 } },
  { k: 'gear20', n: 'Collector', e: '🛡️', d: 'Find 20 different gear pieces', need: 20, rw: { gems: 3 } },
  { k: 'gear50', n: 'Armory', e: '🏰', d: 'Find 50 different gear pieces', need: 50, rw: { gems: 8 } },
  {
    k: 'gear100',
    n: 'Every piece',
    e: '💠',
    d: 'Find 100 different gear pieces',
    need: 100,
    rw: { gems: 20, legacy: 2 },
  },
  { k: 'set', n: 'Fashion statement', e: '👗', d: 'Complete any gear set', need: 1, rw: { gems: 5 } },
  { k: 'lv10', n: 'Double digits', e: '🔟', d: 'Reach level 10 with any fighter', need: 10, rw: { gems: 2 } },
  { k: 'lv25', n: 'Seasoned', e: '⭐', d: 'Reach level 25 with any fighter', need: 25, rw: { gems: 6 } },
  { k: 'lv50', n: 'Maxed out', e: '🌟', d: 'Reach level 50 with any fighter', need: 50, rw: { gems: 20, legacy: 2 } },
  { k: 'm1', n: 'Specialist', e: '🎓', d: 'Master any class to level 3', need: 3, rw: { gems: 5 } },
  { k: 'm5', n: 'Grandmaster', e: '🧠', d: 'Fully master any class', need: 5, rw: { gems: 15, legacy: 2 } },
  {
    k: 'mall',
    n: 'Jack of all trades',
    e: '🃏',
    d: 'Win a fight with 15 different classes',
    need: 15,
    rw: { gems: 10, legacy: 1 },
  },
  { k: 'build10', n: 'Wheel enjoyer', e: '🎡', d: 'Start 5 fighter careers', need: 5, rw: { gems: 2 } },
  { k: 'build50', n: 'Wheel addict', e: '🌀', d: 'Start 20 fighter careers', need: 20, rw: { gems: 8 } },
];

/**
 * Goals added after the port (review L6), kept apart so the table above stays a faithful copy of the legacy
 * one. Synergies matter (none wins about 45% of fights, four about 57%): hunting them is a goal of its own.
 */
export const GOALS_MORE: typeof GOALS = [
  { k: 'syn10', n: 'Matchmaker', e: '🤝', d: 'Find 10 different synergies', need: 10, rw: { gems: 3 } },
  { k: 'syn25', n: 'Chemistry set', e: '⚗️', d: 'Find 25 different synergies', need: 25, rw: { gems: 6 } },
  { k: 'syn50', n: 'Two bad ideas, holding hands', e: '🫱', d: 'Find 50 different synergies', need: 50, rw: { gems: 12, legacy: 1 } },
  // the remix workshop (L4)
  { k: 'remix1', n: 'Mad scientist', e: '🧪', d: 'Beat a remix you built yourself', need: 1, rw: { gems: 3 } },
  { k: 'remix10', n: 'It lives, and it lost', e: '⚡', d: 'Beat 10 remixes you built yourself', need: 10, rw: { gems: 10, legacy: 1 } },
];
/** Every goal the game counts. */
export const ALL_GOALS: typeof GOALS = [...GOALS, ...GOALS_MORE];

/** Class mastery thresholds (wins). */
export const MASTERY: number[] = [5, 15, 30, 60, 100];

/** Class mastery rewards per level. */
export const MASTERY_RW: { gems: number; legacy?: number; note?: string }[] = [
  { gems: 2 },
  { gems: 3, note: 'New fighters of this class start with a talent point' },
  { gems: 5 },
  { gems: 6, note: 'New fighters of this class start with +1 to everything' },
  { gems: 12, legacy: 2, note: 'A gold mastery badge on every fighter of this class' },
];

/** A collection milestone every this many entries. */
export const COL_STEP: number = 75;

/** Every achievement, including story ones. */
export const ACHIEVEMENTS: { k: string; n: string; e: string; q: 0 | 1 | 2 | 3; d: string }[] = [
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
  { k: 'story1', n: 'Out of the Alley', e: '🗑️', q: 2, d: 'Beat Big Tony in chapter 1' },
  { k: 'story2', n: 'Kitchen Closed', e: '🍝', q: 2, d: 'Beat Mama Gnocchi in chapter 2' },
  { k: 'story3', n: 'Queen Slayer', e: '🐍', q: 2, d: 'Beat Lady Venom in chapter 3' },
  { k: 'story4', n: 'Mutiny', e: '🦈', q: 2, d: 'Beat Admiral Saltbeard in chapter 4' },
  { k: 'story5', n: 'Top of the Class', e: '🎓', q: 3, d: 'Beat the Professor in chapter 5' },
  { k: 'story6', n: 'Stake Through the Heart', e: '🦇', q: 3, d: 'Beat Count Crypt in chapter 6' },
  { k: 'story7', n: 'Mountain Mover', e: '🏔️', q: 3, d: 'Beat Titan Prime in chapter 7' },
  { k: 'story8', n: 'Short Circuit', e: '⚡', q: 3, d: 'Beat the Neon Ronin in chapter 8' },
  { k: 'story9', n: 'Pest Control', e: '🐝', q: 3, d: 'Beat Queen Hivemind in chapter 9' },
  { k: 'story10', n: 'The Wheel Has Spoken', e: '🎡', q: 3, d: 'Beat the Wheelmaster and finish the story' },
  { k: 'story11', n: 'Head in the Clouds', e: '☁️', q: 3, d: 'Beat Captain Cumulus in chapter 11' },
  { k: 'story12', n: 'Hell Raiser', e: '😈', q: 3, d: 'Beat Baron Brimstone in chapter 12' },
  { k: 'story13', n: 'Right on Time', e: '⏱️', q: 3, d: 'Beat the Clockmaker in chapter 13' },
  { k: 'story14', n: 'Deep Diver', e: '🐋', q: 3, d: 'Beat Leviathan Rex in chapter 14' },
  { k: 'story15', n: 'Last Laugh', e: '🤡', q: 3, d: 'Beat Mister Giggles in chapter 15' },
  { k: 'story16', n: 'Thaw', e: '👸', q: 3, d: 'Beat the Frost Queen in chapter 16' },
  { k: 'story17', n: 'Wide Awake', e: '😴', q: 3, d: 'Beat the Sandman in chapter 17' },
  { k: 'story18', n: 'Into the Nothing', e: '🕳️', q: 3, d: 'Beat Null in chapter 18' },
  { k: 'story19', n: 'Godslayer', e: '🌞', q: 3, d: 'Beat Aurelion the Radiant in chapter 19' },
  { k: 'story20', n: 'The Wheel Has Spoken, Again', e: '🎡', q: 3, d: 'Beat the First Wheel and finish Act II' },
];
