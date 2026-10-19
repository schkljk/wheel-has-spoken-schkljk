// The bounty board (review F5): standing build challenges with no timers. Three are up at a time and a new one
// goes up only when one is done (or swapped). One row each: the event that can complete it (a career stat key),
// what the fighter has to be, how many times, the reward, and the joke.
import type { Fighter } from '../../types';

export interface Bounty {
  k: string;
  n: string;
  e: string;
  /** the career stat whose step counts toward it: bosses, cups, chapters, elites, wins, rushes, dailies */
  on: 'bosses' | 'cups' | 'chapters' | 'elites' | 'wins' | 'rushes' | 'dailies';
  /** what the active fighter has to be when it happens */
  is: (f: Fighter) => boolean;
  /** how many times (default once) */
  need?: number;
  gems: number;
  /** the joke under the mechanics */
  f: string;
}

const race = (n: string) => (f: Fighter) => f.race?.n === n;
const weapon = (n: string) => (f: Fighter) => f.weapon?.n === n;

// prettier-ignore
export const BOUNTIES: Bounty[] = [
  { k: 'pigeonboss', n: 'Beat a story boss as a Pigeon', e: '🐦', on: 'bosses', is: race('Pigeon'), gems: 5, f: 'It will not remember the win. It will remember the bread.' },
  { k: 'nopowercup', n: 'Win a cup with No power', e: '🚫', on: 'cups', is: (f) => f.power?.k === 'none', gems: 4, f: 'Raw talent. Mostly raw.' },
  { k: 'noodleboss', n: 'Beat a story boss with a Wet noodle', e: '🍜', on: 'bosses', is: weapon('Wet noodle'), gems: 5, f: 'Death by a thousand slaps.' },
  { k: 'npcchapter', n: 'Clear a chapter as an NPC', e: '🧍', on: 'chapters', is: (f) => f.arch?.k === 'npc', gems: 4, f: 'The background character has entered the foreground. Briefly.' },
  { k: 'toastercup', n: 'Win a cup as a Sentient toaster', e: '🍞', on: 'cups', is: race('Sentient toaster'), gems: 5, f: 'Keep it away from the bathtub. And the trophy.' },
  { k: 'jawboss', n: 'Beat a story boss with a Glass jaw', e: '🥛', on: 'bosses', is: (f) => f.weak?.k === 'jaw', gems: 4, f: 'Never got hit in the face. Not once. Allegedly.' },
  { k: 'lowcup', n: 'Win a cup at level 5 or lower', e: '🍼', on: 'cups', is: (f) => (f.lvl || 1) <= 5, gems: 3, f: 'Too young to fight. Old enough to win.' },
  { k: 'duckelite', n: 'Win 3 elite fights as a Rubber duck', e: '🦆', on: 'elites', is: race('Rubber duck'), need: 3, gems: 4, f: 'Squeak once for yes. Squeak three times for a knockout.' },
  { k: 'cookedboss', n: 'Beat a story boss while Cooked', e: '🍳', on: 'bosses', is: (f) => f.chaos?.k === 'cooked', gems: 4, f: 'It is so over. Except it isn\'t.' },
  { k: 'sleeprush', n: 'Finish a boss rush while sleeping 20 hours a day', e: '😴', on: 'rushes', is: (f) => f.weak?.k === 'sleep', gems: 5, f: 'Ten bosses in four waking hours.' },
  { k: 'clownchapter', n: 'Clear a chapter as a Clown', e: '🤡', on: 'chapters', is: race('Clown'), gems: 4, f: 'The joke was the whole chapter.' },
  { k: 'chickencup', n: 'Win a cup with a Rubber chicken', e: '🐔', on: 'cups', is: weapon('Rubber chicken'), gems: 4, f: 'Every hit squeaks. Every opponent hears it in their sleep.' },
  { k: 'goblinboss', n: 'Beat a story boss as a Goblin', e: '👺', on: 'bosses', is: race('Goblin'), gems: 3, f: 'Short king behavior.' },
  { k: 'slimewins', n: 'Win 10 fights as a Slime', e: '🟢', on: 'wins', is: race('Slime'), need: 10, gems: 3, f: 'Nobody knows where the punches come from. Including the slime.' },
  { k: 'recklessboss', n: 'Beat a story boss with a Reckless stance', e: '🎢', on: 'bosses', is: (f) => f.stance?.k === 'reckless', gems: 3, f: 'The plan was no plan. The plan worked.' },
  { k: 'rockcup', n: 'Win a cup with a Loyal rock at your side', e: '🪨', on: 'cups', is: (f) => f.side?.k === 'rock', gems: 3, f: 'It did nothing. It was there. That is loyalty.' },
  { k: 'snowmanboss', n: 'Beat a story boss as a Snowman', e: '☃️', on: 'bosses', is: race('Snowman'), gems: 4, f: 'Fought with everything it had. It had about a week.' },
  { k: 'catdaily', n: 'Win the daily challenge with Black cat luck', e: '🐈‍⬛', on: 'dailies', is: (f) => f.chaos?.k === 'badluck', gems: 3, f: 'Crossed its own path. Twice.' },
  { k: 'lollichapter', n: 'Clear a chapter with a Giant lollipop', e: '🍭', on: 'chapters', is: weapon('Giant lollipop'), gems: 4, f: 'Sugar rush, then a regular rush, then a win.' },
  { k: 'frogelite', n: 'Win 5 elite fights as Frogfolk', e: '🐸', on: 'elites', is: race('Frogfolk'), need: 5, gems: 4, f: 'It is Wednesday every time they win.' },
  { k: 'paperboss', n: 'Beat a story boss with Paper cuts as a weakness', e: '📄', on: 'bosses', is: (f) => f.weak?.k === 'paper', gems: 3, f: 'The boss brought a sword. Thank god it was not a folder.' },
  { k: 'streamercup', n: 'Win a cup as a Streamer', e: '📹', on: 'cups', is: (f) => f.arch?.k === 'streamer', gems: 3, f: 'Like, subscribe, and hold this L.' },
  { k: 'zombiewins', n: 'Win 10 fights as a Zombie', e: '🧟', on: 'wins', is: race('Zombie'), need: 10, gems: 3, f: 'Technically all of them were comebacks.' },
  { k: 'fishchapter', n: 'Clear a chapter with a Fishing rod', e: '🎣', on: 'chapters', is: weapon('Fishing rod'), gems: 4, f: 'Caught a whole chapter. Released nothing.' },
];
