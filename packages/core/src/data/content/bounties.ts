// The bounty board (review F5): standing build challenges with no timers. Three are up at a time and a new one
// goes up only when one is done (or swapped). One row each: the event that can complete it (a career stat key),
// what the fighter has to be (and the wheel slice that makes them it, for "Take the job": L1), how many times,
// the reward, and the joke.
import type { Fighter, WheelKey } from '../../types';

export interface Bounty {
  k: string;
  n: string;
  e: string;
  /** the career stat whose step counts toward it: bosses, cups, chapters, elites, wins, rushes, dailies */
  on: 'bosses' | 'cups' | 'chapters' | 'elites' | 'wins' | 'rushes' | 'dailies';
  /** what the active fighter has to be when it happens */
  is: (f: Fighter) => boolean;
  /** the wheel slice that makes a fighter fit it (by name or key), when one does */
  pin?: { w: WheelKey; n?: string; k?: string };
  /** how many times (default once) */
  need?: number;
  gems: number;
  /** the joke under the mechanics */
  f: string;
}

const race = (n: string) => ({ is: (f: Fighter) => f.race?.n === n, pin: { w: 'race' as const, n } });
const weapon = (n: string) => ({ is: (f: Fighter) => f.weapon?.n === n, pin: { w: 'weapon' as const, n } });
/** A slice by its key on one wheel: No power, Glass jaw, Reckless... */
const has = (w: WheelKey, k: string) => ({ is: (f: Fighter) => (f[w] as { k?: string } | undefined)?.k === k, pin: { w, k } });

// prettier-ignore
export const BOUNTIES: Bounty[] = [
  { k: 'pigeonboss', n: 'Beat a story boss as a Pigeon', e: '🐦', on: 'bosses', ...race('Pigeon'), gems: 5, f: 'It will not remember the win. It will remember the bread.' },
  { k: 'nopowercup', n: 'Win a cup with No power', e: '🚫', on: 'cups', ...has('power', 'none'), gems: 4, f: 'Raw talent. Mostly raw.' },
  { k: 'noodleboss', n: 'Beat a story boss with a Wet noodle', e: '🍜', on: 'bosses', ...weapon('Wet noodle'), gems: 5, f: 'Death by a thousand slaps.' },
  { k: 'npcchapter', n: 'Clear a chapter as an NPC', e: '🧍', on: 'chapters', ...has('arch', 'npc'), gems: 4, f: 'The background character has entered the foreground. Briefly.' },
  { k: 'toastercup', n: 'Win a cup as a Sentient toaster', e: '🍞', on: 'cups', ...race('Sentient toaster'), gems: 5, f: 'Keep it away from the bathtub. And the trophy.' },
  { k: 'jawboss', n: 'Beat a story boss with a Glass jaw', e: '🥛', on: 'bosses', ...has('weak', 'jaw'), gems: 4, f: 'Never got hit in the face. Not once. Allegedly.' },
  { k: 'lowcup', n: 'Win a cup at level 5 or lower', e: '🍼', on: 'cups', is: (f) => (f.lvl || 1) <= 5, gems: 3, f: 'Too young to fight. Old enough to win.' },
  { k: 'duckelite', n: 'Win 3 elite fights as a Rubber duck', e: '🦆', on: 'elites', ...race('Rubber duck'), need: 3, gems: 4, f: 'Squeak once for yes. Squeak three times for a knockout.' },
  { k: 'cookedboss', n: 'Beat a story boss while Cooked', e: '🍳', on: 'bosses', ...has('chaos', 'cooked'), gems: 4, f: 'It is so over. Except it isn\'t.' },
  { k: 'sleeprush', n: 'Finish a boss rush while sleeping 20 hours a day', e: '😴', on: 'rushes', ...has('weak', 'sleep'), gems: 5, f: 'Ten bosses in four waking hours.' },
  { k: 'clownchapter', n: 'Clear a chapter as a Clown', e: '🤡', on: 'chapters', ...race('Clown'), gems: 4, f: 'The joke was the whole chapter.' },
  { k: 'chickencup', n: 'Win a cup with a Rubber chicken', e: '🐔', on: 'cups', ...weapon('Rubber chicken'), gems: 4, f: 'Every hit squeaks. Every opponent hears it in their sleep.' },
  { k: 'goblinboss', n: 'Beat a story boss as a Goblin', e: '👺', on: 'bosses', ...race('Goblin'), gems: 3, f: 'Short king behavior.' },
  { k: 'slimewins', n: 'Win 10 fights as a Slime', e: '🟢', on: 'wins', ...race('Slime'), need: 10, gems: 3, f: 'Nobody knows where the punches come from. Including the slime.' },
  { k: 'recklessboss', n: 'Beat a story boss with a Reckless stance', e: '🎢', on: 'bosses', ...has('stance', 'reckless'), gems: 3, f: 'The plan was no plan. The plan worked.' },
  { k: 'rockcup', n: 'Win a cup with a Loyal rock at your side', e: '🪨', on: 'cups', ...has('side', 'rock'), gems: 3, f: 'It did nothing. It was there. That is loyalty.' },
  { k: 'snowmanboss', n: 'Beat a story boss as a Snowman', e: '☃️', on: 'bosses', ...race('Snowman'), gems: 4, f: 'Fought with everything it had. It had about a week.' },
  { k: 'catdaily', n: 'Win the daily challenge with Black cat luck', e: '🐈‍⬛', on: 'dailies', ...has('chaos', 'badluck'), gems: 3, f: 'Crossed its own path. Twice.' },
  { k: 'lollichapter', n: 'Clear a chapter with a Giant lollipop', e: '🍭', on: 'chapters', ...weapon('Giant lollipop'), gems: 4, f: 'Sugar rush, then a regular rush, then a win.' },
  { k: 'frogelite', n: 'Win 5 elite fights as Frogfolk', e: '🐸', on: 'elites', ...race('Frogfolk'), need: 5, gems: 4, f: 'It is Wednesday every time they win.' },
  { k: 'paperboss', n: 'Beat a story boss with Paper cuts as a weakness', e: '📄', on: 'bosses', ...has('weak', 'paper'), gems: 3, f: 'The boss brought a sword. Thank god it was not a folder.' },
  { k: 'streamercup', n: 'Win a cup as a Streamer', e: '📹', on: 'cups', ...has('arch', 'streamer'), gems: 3, f: 'Like, subscribe, and hold this L.' },
  { k: 'zombiewins', n: 'Win 10 fights as a Zombie', e: '🧟', on: 'wins', ...race('Zombie'), need: 10, gems: 3, f: 'Technically all of them were comebacks.' },
  { k: 'fishchapter', n: 'Clear a chapter with a Fishing rod', e: '🎣', on: 'chapters', ...weapon('Fishing rod'), gems: 4, f: 'Caught a whole chapter. Released nothing.' },
];
