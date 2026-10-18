// The scouting report after the wheels (Phase 4, upgrade 29): a fighter's three strengths, biggest weakness and
// best synergy in plain words, each with a joke. One row per thing that can stand out; jokes are picked by name,
// so a fighter always gets the same report.

/** What a strength or weakness can be about: the rolled stats, plus crit and dodge chances. */
export type SumKey = 'str' | 'spd' | 'dur' | 'iq' | 'wm' | 'pm' | 'cha' | 'crit' | 'dodge';

/** [icon, label as a strength, jokes] */
export const STRENGTH_LINES: Record<SumKey, [e: string, n: string, jokes: string[]]> = {
  str: ['💪', 'Hits hard', ['Opponents tend to leave in a different shape.', 'Has never once asked "is this door a push or a pull".', 'The gym asked them to stop. The gym is a crater now.']],
  spd: ['💨', 'Fast', ['Usually swings twice before the other one finishes blinking.', 'Already at the fight. Also already home.', 'Speed tickets: 14. Fights lost to slowness: 0.']],
  dur: ['🛡️', 'Tough', ['Has been hit by worse. Mostly by furniture.', 'Treats a punch like a strongly worded email.', 'Doctors call them "a wall with opinions".']],
  iq: ['🧠', 'Smart', ['Reads moves like a bored detective.', 'Already knows how this ends. Is politely waiting.', 'Brought notes to the fight. The notes were right.']],
  wm: ['🗡️', 'Knows the weapon', ['The weapon is basically a limb now.', 'Has named it. It answers.', 'Could juggle it. Has juggled it. Insurance said no.']],
  pm: ['✨', 'Strong power', ['The power does most of the talking.', 'Lights flicker when they warm up. Not metaphorically.', 'The power has its own fan club.']],
  cha: ['🗣️', 'Charming', ['Talks their way out of half the fights and into the other half.', 'Referees laugh at their jokes. Suspicious.', 'Could sell sand to a sand golem.']],
  crit: ['🎯', 'Lands crits', ['Finds the soft spot. Every spot is the soft spot.', 'Aims for the knees. Hits the soul.', 'Statistically rude.']],
  dodge: ['🌀', 'Hard to hit', ['Has dodged two fights, three taxes and one wedding.', 'Is mostly somewhere else.', 'Hitting them is a rumour.']],
};

/** [icon, label as a weakness, jokes] */
export const WEAKNESS_LINES: Record<SumKey, [e: string, n: string, jokes: string[]]> = {
  str: ['🥖', 'Hits soft', ['Punches like an apology.', 'Their strongest move is a firm handshake.', 'Opponents have mistaken hits for compliments.']],
  spd: ['🐌', 'Slow', ['Arrives fashionably late. Every round.', 'Has been overtaken by a parked car.', 'Their reflexes are on a payment plan.']],
  dur: ['🥚', 'Fragile', ['Bruises if you describe a punch in too much detail.', 'Comes with a "this side up" sticker.', 'Was injured by this sentence.']],
  iq: ['🥴', 'Not a thinker', ['Reads the opponent like a menu in a foreign language.', 'Their plan is "yes".', 'Lost a staring contest to a mirror.']],
  wm: ['🙃', 'Clumsy with the weapon', ['Holds it like it owes them money.', 'The weapon has filed a complaint.', 'Has hit themself with it twice, today.']],
  pm: ['🕯️', 'Weak power', ['The power is more of a party trick.', 'Their power once lit a candle. Most of a candle.', 'The power is shy. Very shy.']],
  cha: ['😶', 'No charisma', ['Crowds go quiet. Not the good quiet.', 'Their walk-out song is silence.', 'Even the nemesis forgets their name.']],
  crit: ['🎲', 'Rarely crits', ['Hits exactly where you expect. Every time.', 'Has never found a weak spot. Not even their own.', 'Crits on special occasions. Like leap years.']],
  dodge: ['🧱', 'Easy to hit', ['A very large target with feelings.', 'Dodging is a rumour they heard once.', 'Gets hit by things aimed at other people.']],
};

/** When no stat is clearly the worst: the weakness the wheel gave them. */
export const TRAIT_JOKES = ['Every fighter has one. This one wears it on a T-shirt.', 'Opponents will find out. Opponents always find out.', 'Keep it quiet and nobody will notice. Somebody will notice.'];
/** A synergy with no flavor line of its own. */
export const SYN_JOKES = ['The parts work together. Nobody knows how. Nobody asks.', 'Two things that should not mix, mixing beautifully.', 'Accidental genius. The best kind.'];
/** No synergy at all. */
export const NO_SYNERGY = [
  'None. Every part of this fighter is meeting the others for the first time.',
  'None. The parts are polite to each other, at best.',
  'None. It is a group project and nobody read the brief.',
];
/** The sign-off, by how good the build is (verdict quality 0 to 3). */
export const CLOSERS: [string[], string[], string[], string[]] = [
  ['Bold of the wheel. Bolder of you if you keep them.', 'Every legend starts somewhere. This is somewhere.', 'The wheel has spoken. It mumbled.'],
  ['Solid. Unremarkable. The backbone of every bracket.', 'A fighter you could take home to your parents.', 'Fine. Genuinely fine. Fine is underrated.'],
  ['The bracket should be a little nervous.', 'This one could go places. Mostly forward, fast.', 'Promising. Annoyingly so, for everyone else.'],
  ['Unfair, frankly. The wheel was in a good mood.', 'Tell the bosses to stretch.', 'If this goes wrong, it is a skill issue.'],
];
