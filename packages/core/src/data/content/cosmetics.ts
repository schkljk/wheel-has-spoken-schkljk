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
  // review round 2 (K8): more to spend gems on, still looks only. Themed fits of four, and a few pricey ones
  // ---- pigeon
  { k: 'rim_pigeon', n: 'Pigeon grey', kind: 'rim', e: '🐦', gems: 6, col: ['#9aa3b5', '#3d4456'], f: 'The color of every city and most regrets.' },
  { k: 'cf_feathers', n: 'Feathers', kind: 'confetti', e: '🪶', gems: 6, col: ['#c9ced8', '#8a93a6', '#ffffff', '#5b6478'], f: 'A pigeon exploded with joy. It is fine. Probably.' },
  { k: 'pl_crumbs', n: 'Bread crumbs', kind: 'plate', e: '🍞', gems: 6, col: ['#e8c48a', '#3a2200'], f: 'Leave a trail. The pigeons will find you.' },
  // ---- arcade
  { k: 'rim_arcade', n: 'Arcade cabinet', kind: 'rim', e: '🕹️', gems: 7, col: ['#ff3df0', '#2a0b4a'], f: 'Insert coin. Lose coin. Insert coin.' },
  { k: 'ch_joystick', n: 'Joystick', kind: 'charm', e: '🕹️', gems: 5, f: 'Wiggling it does nothing. Wiggle it anyway.' },
  { k: 'cf_pixel', n: 'Pixel dust', kind: 'confetti', e: '👾', gems: 6, col: ['#ff3df0', '#3dfff0', '#fff23d', '#2a0b4a'], f: 'Rendered at 8 bits. Celebrated at 100%.' },
  { k: 'pl_highscore', n: 'High score', kind: 'plate', e: '🏁', gems: 7, col: ['#0b0718', '#fff23d'], f: 'Three letters. All of them rude.' },
  // ---- the deep
  { k: 'rim_deepsea', n: 'Deep sea', kind: 'rim', e: '🌊', gems: 6, col: ['#1b4fae', '#0b1a3a'], f: 'Pressure-rated to the bottom of your bracket.' },
  { k: 'ch_octopus', n: 'Tiny octopus', kind: 'charm', e: '🐙', gems: 6, f: 'Eight arms. Zero opinions about your build. Lies.' },
  { k: 'cf_seafoam', n: 'Sea foam', kind: 'confetti', e: '🫧', gems: 5, col: ['#5ee0c8', '#2dd4bf', '#e8fffb', '#0e6f64'], f: 'Smells like a beach. Tastes like a beach. Do not taste it.' },
  { k: 'pl_shipwreck', n: 'Shipwreck', kind: 'plate', e: '⚓', gems: 6, col: ['#1a3a4a', '#d6f3ff'], f: 'Sank once. Floated back out of spite.' },
  // ---- haunted
  { k: 'rim_ecto', n: 'Ectoplasm', kind: 'rim', e: '👻', gems: 7, col: ['#9cff8a', '#1f4a1a'], f: 'Slightly sticky. Slightly screaming.' },
  { k: 'ch_ghost', n: 'Little ghost', kind: 'charm', e: '👻', gems: 6, f: 'Haunts the pointer. Union rules say it can.' },
  { k: 'cf_spooked', n: 'Spooked', kind: 'confetti', e: '🎃', gems: 6, col: ['#ff8a2b', '#3a3150', '#b6ff3d', '#120d28'], f: 'Every win is a jump scare for someone.' },
  { k: 'pl_tomb', n: 'Tombstone', kind: 'plate', e: '🪦', gems: 7, col: ['#8b93a6', '#120d28'], f: 'Here lies their confidence.' },
  // ---- the diner
  { k: 'rim_glazed', n: 'Glazed', kind: 'rim', e: '🍩', gems: 5, col: ['#ffb3d9', '#b8577f'], f: 'Fresh from the fryer. Hands off the rim.' },
  { k: 'ch_pizza', n: 'Pizza slice', kind: 'charm', e: '🍕', gems: 4, f: 'Cold. Still elite. Like you, after round 12.' },
  { k: 'cf_sprinkles', n: 'Sprinkles', kind: 'confetti', e: '🧁', gems: 5, col: ['#ff8fc7', '#ffe27a', '#8cc0ff', '#5ee07a'], f: 'Victory, but make it dessert.' },
  { k: 'pl_menu', n: 'Diner menu', kind: 'plate', e: '🍔', gems: 5, col: ['#fff3d6', '#a3202a'], f: "Today's special: you. Served cold." },
  // ---- the expensive stuff: for when the gems have nowhere else to go
  { k: 'rim_gold', n: 'Solid gold', kind: 'rim', e: '🥇', gems: 15, col: ['#ffd25e', '#8a5a00'], f: 'Heavy enough to change the odds. It does not. We checked.' },
  { k: 'ch_trophy', n: 'Tiny trophy', kind: 'charm', e: '🏆', gems: 12, f: 'Participation, but solid.' },
  { k: 'cf_diamonds', n: 'Diamond rain', kind: 'confetti', e: '💎', gems: 14, col: ['#bfefff', '#7fd8ff', '#ffffff', '#3d8bff'], f: 'Throwing gems at your own win. Peak economy.' },
  { k: 'pl_hall', n: 'Hall of fame', kind: 'plate', e: '🏛️', gems: 15, col: ['#3a2200', '#ffd25e'], f: 'Carved in marble. The marble asked for a raise.' },
];
