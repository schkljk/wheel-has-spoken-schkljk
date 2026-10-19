// First-time tips (Phase 4, upgrade 31): each system explains itself the first time it shows up, instead of a
// tour up front. One row each: what it is, how it works in plain words, and a joke. Shown once, ever.

export type TipKey =
  | 'fight'
  | 'reads'
  | 'sudden'
  | 'map'
  | 'shop'
  | 'merchant'
  | 'haggle'
  | 'talents'
  | 'armory'
  | 'forge'
  | 'bracket'
  | 'gauntlet'
  | 'club'
  | 'tower'
  | 'hard'
  | 'speed'
  | 'claim';

export const TIPS: Record<TipKey, { e: string; t: string; d: string; f: string }> = {
  fight: {
    e: '🎡',
    t: 'The combat wheel',
    d: 'Spin it each round to pick your move. Strike beats Power, Power beats Guard, Guard beats Strike. The teal ring marks the focus that counters their read; tap the read for the full cheat sheet. A full energy bar unlocks your signature move. The ☰ menu has everything else.',
    f: 'You can also just watch. The wheel does not judge. Much.',
  },
  reads: {
    e: '🔮',
    t: 'Reading them',
    d: 'Before each round you get a clue about their next move, from "Clear as day" down to "Wild guess". The surer the clue, the more you can trust it. IQ, charisma and some gear make clues clearer: a step clearer is one word up the scale, like Maybe to Probably.',
    f: 'A wild guess is still a guess. So is your horoscope.',
  },
  sudden: {
    e: '💀',
    t: 'Sudden death',
    d: 'The round limit is up and this fight never goes to the judges. Every hit lands harder, more each round, until someone falls. A story win in sudden death pays a gem.',
    f: 'Nobody leaves until somebody leaves horizontally.',
  },
  map: {
    e: '🗺️',
    t: 'The story map',
    d: 'Pick one step at a time: fights, elites, rests, events, merchants, treasure, then the boss. HP carries between fights. A lost fight costs a grit; run out and the chapter starts over on a new path.',
    f: 'The boss waits at the top, so you walk up. Bosses always take the view. It is a union thing.',
  },
  shop: {
    e: '🏪',
    t: 'The base shop',
    d: 'Basics, a daily deal, premium gear and services. It is only open between chapters, at the start of a chapter map, so stock up before you set off.',
    f: 'No refunds. No returns. No eye contact.',
  },
  merchant: {
    e: '🛒',
    t: 'Story merchants',
    d: 'Merchants on the map sell gear and items for the road. Their stock is different each time, and you can try haggling once per visit.',
    f: 'Every merchant swears this is their last one. It is never the last one.',
  },
  haggle: {
    e: '🤝',
    t: 'Haggling',
    d: 'Pick how big a discount to ask for: the bigger, the less likely. Charisma helps a lot. A failed haggle raises the prices a little, and you get one try per visit.',
    f: 'The trick is to look like you have other options. You do not.',
  },
  talents: {
    e: '⭐',
    t: 'Talents',
    d: 'You earn a point every level and every rank-up. Spend them in five branches; deeper tiers need a higher level and more points in that branch. A respec in the base shop gives them all back.',
    f: 'Choose wisely. Or choose quickly and blame the wheel.',
  },
  armory: {
    e: '🛡️',
    t: 'The armory',
    d: 'Every piece you find is kept here, by slot. Swap any time; nothing is lost by swapping. Matching set pieces give bonuses, and the forge upgrades pieces up to +5.',
    f: 'Fashion is a stat now. It always was.',
  },
  forge: {
    e: '🔨',
    t: 'The forge',
    d: 'Upgrade a piece with coins, and from +4 on with a copy of it too. Copies come from finding the same piece again. Each level adds a little of what the piece is good at.',
    f: 'Hit it until it is better. Ancient technique. Still works.',
  },
  bracket: {
    e: '🏆',
    t: 'Tournaments',
    d: 'Win every round to take the belt. Next time you enter, you defend it. Lose once and you are out, with whatever you earned on the way.',
    f: 'Single elimination: like dating, but with more referees.',
  },
  gauntlet: {
    e: '⚔️',
    t: 'The gauntlet',
    d: 'Fight one opponent after another until someone beats you. Every win pays 2 coins and 8 XP, so the longer the streak, the better.',
    f: 'It is a queue, but everyone in it wants to hit you.',
  },
  club: {
    e: '🎲',
    t: 'Fight club',
    d: 'Two strangers fight; you bet on one. Better odds on the underdog pay more. You never fight yourself here, you only lose money.',
    f: 'The first rule of fight club is: check the odds.',
  },
  tower: {
    e: '🗼',
    t: 'The endless tower',
    d: 'One fight per floor, each a bit harder, HP carried up. Every five floors bring a new twist and a full rest. Three hearts: a loss costs one and you try the floor again.',
    f: 'There is no top. There is just more tower. It is very confident about that.',
  },
  hard: {
    e: '🔥',
    t: 'Hard mode',
    d: 'Replay a cleared chapter with tougher fights, a meaner boss and one twist for the whole chapter. Better loot. Your story waits where you left it.',
    f: 'You beat it once. It took that personally.',
  },
  speed: {
    e: '⏩',
    t: 'Fight speed',
    d: 'The 1× button at the top of every fight switches to 2×: same fight, same odds, half the waiting. Tap it again to slow back down. It remembers.',
    f: 'For people who have seen a sword before.',
  },
  claim: {
    e: '🏆',
    t: 'A sure thing',
    d: 'When a story fight is a Sure thing or close to it, the ☰ menu can claim the win before the first round: full rewards, and it costs the HP a real win would.',
    f: 'They saw your card and asked for a draw. You declined.',
  },
};
