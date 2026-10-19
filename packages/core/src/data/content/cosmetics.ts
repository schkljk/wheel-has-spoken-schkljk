// Earned cosmetics (review F11): a gem sink with no power in it. Gems only come from playing (elites, bosses,
// bounties...), nothing here is for sale for money, and none of it changes a fight. One row each.

export type CosmeticKind = 'rim' | 'charm' | 'confetti' | 'plate';
export interface Cosmetic {
  k: string;
  n: string;
  kind: CosmeticKind;
  e: string;
  gems: number;
  /** the joke */
  f: string;
  /** rim: rim and lip; confetti: the pieces; plate: background and text */
  col?: string[];
}

export const COSMETIC_KINDS: [CosmeticKind, string, string][] = [
  ['rim', 'Wheel rims', 'Every wheel you spin wears it'],
  ['charm', 'Pointer charms', 'Hangs off the pointer of every wheel'],
  ['confetti', 'Victory confetti', 'Thrown on every win'],
  ['plate', 'Nameplates', "Your fighter's name, on the card and in fights"],
];

// prettier-ignore
export const COSMETICS: Cosmetic[] = [
  { k: 'rim_neon', n: 'Neon rim', kind: 'rim', e: '💡', gems: 6, col: ['#2dd4bf', '#0e6f64'], f: 'Visible from space. Also from the bathroom.' },
  { k: 'rim_ruby', n: 'Ruby rim', kind: 'rim', e: '❤️', gems: 6, col: ['#e5484d', '#7a1d22'], f: 'Real ruby. Do not check.' },
  { k: 'rim_chrome', n: 'Chrome rim', kind: 'rim', e: '🪞', gems: 8, col: ['#cfd6e4', '#5b6478'], f: 'Shiny enough to see your bad decisions in.' },
  { k: 'rim_obsidian', n: 'Obsidian rim', kind: 'rim', e: '🖤', gems: 8, col: ['#3a3150', '#120d28'], f: 'Edgy. Literally. Mind your fingers.' },
  { k: 'rim_bubble', n: 'Bubblegum rim', kind: 'rim', e: '🍬', gems: 5, col: ['#ff8fc7', '#a3346f'], f: 'Already chewed. Still good.' },
  { k: 'ch_dice', n: 'Lucky die', kind: 'charm', e: '🎲', gems: 4, f: 'It is not lucky. It is just a die. Believe anyway.' },
  { k: 'ch_skull', n: 'Tiny skull', kind: 'charm', e: '💀', gems: 4, f: 'From a previous owner of the wheel.' },
  { k: 'ch_duck', n: 'Rubber duck', kind: 'charm', e: '🦆', gems: 5, f: 'Debugs your spins. Silently judges them.' },
  { k: 'ch_crown', n: 'Little crown', kind: 'charm', e: '👑', gems: 8, f: 'The wheel is royalty now. It knows.' },
  { k: 'ch_pigeon', n: 'Pigeon', kind: 'charm', e: '🐦', gems: 5, f: 'It came with the wheel. It refuses to leave.' },
  { k: 'ch_pepper', n: 'Hot pepper', kind: 'charm', e: '🌶️', gems: 4, f: 'Spicy spins only.' },
  { k: 'cf_gold', n: 'Gold rush', kind: 'confetti', e: '🪙', gems: 4, col: ['#ffd25e', '#ffe27a', '#c27400', '#ffffff'], f: 'Fake gold. Real smugness.' },
  { k: 'cf_blood', n: 'Bad blood', kind: 'confetti', e: '🩸', gems: 5, col: ['#e5484d', '#a3202a', '#ff8a8d', '#3a0b0e'], f: 'It is paint. Mostly.' },
  { k: 'cf_ice', n: 'Cold shoulder', kind: 'confetti', e: '❄️', gems: 5, col: ['#8cc0ff', '#3d8bff', '#ffffff', '#cfe8ff'], f: 'For wins that say "I did not even try".' },
  { k: 'cf_toxic', n: 'Toxic', kind: 'confetti', e: '☢️', gems: 5, col: ['#5ee07a', '#b6ff3d', '#1f7a3a', '#e8ffd0'], f: 'Do not breathe it in. Do celebrate.' },
  { k: 'cf_void', n: 'The void', kind: 'confetti', e: '🕳️', gems: 6, col: ['#5b4bb7', '#120d28', '#b388ff', '#2c2257'], f: 'Confetti that stares back.' },
  { k: 'pl_gold', n: 'Gold plate', kind: 'plate', e: '🥇', gems: 6, col: ['#ffd25e', '#3a2200'], f: 'Laminated. For durability.' },
  { k: 'pl_neon', n: 'Neon sign', kind: 'plate', e: '🌃', gems: 6, col: ['#0b0718', '#2dd4bf'], f: 'Open 24 hours. Like your losing streaks.' },
  { k: 'pl_wanted', n: 'Wanted poster', kind: 'plate', e: '📜', gems: 6, col: ['#e8d3a0', '#3a2200'], f: 'Dead or alive. Mostly tired.' },
  { k: 'pl_royal', n: 'Royal banner', kind: 'plate', e: '👑', gems: 8, col: ['#5b4bb7', '#ffd25e'], f: 'By appointment to nobody in particular.' },
];
