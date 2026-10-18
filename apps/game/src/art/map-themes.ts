// What each chapter's map looks like: the ground, the road and the scenery scattered around it. One row per
// chapter, so a new chapter's map is one more entry. The scenery pieces are drawn in map-deco.ts.

/** How the ground is patterned. */
export type Ground =
  | 'asphalt' // speckled, with cracks
  | 'tiles' // square slabs with grout
  | 'grass' // tufts and mowing stripes
  | 'moor' // dark patchy grass
  | 'water' // wave lines
  | 'hex' // honeycomb
  | 'check' // checkerboard
  | 'sky' // soft clouds
  | 'rock' // dark rock with glowing cracks
  | 'plates' // riveted metal plates
  | 'sand' // seabed sand with ripples
  | 'stripes' // circus tent stripes
  | 'snow' // snow with sparkles
  | 'dream' // pastel swirls
  | 'void' // black with stars
  | 'marble'; // veined stone

/** The road's look. */
export type Road = 'dirt' | 'cobble' | 'planks' | 'neon' | 'gold' | 'rope' | 'ice';

export interface MapTheme {
  ground: Ground;
  /** ground colors: dark, base, light */
  g: [string, string, string];
  road: Road;
  /** road colors: edge, fill, light */
  r: [string, string, string];
  /** scenery, more copies = more often */
  deco: string[];
  /** how much scenery: 0..1 */
  dens: number;
  /** the glow around the boss's lair */
  glow: string;
  /** the scenery piece that stands for the chapter on its badge */
  icon: string;
}

export const MAP_THEMES: MapTheme[] = [
  // 1 Back Alley Brawls
  { ground: 'asphalt', g: ['#2b2630', '#3a3440', '#4a4352'], road: 'cobble', r: ['#1d1822', '#6b5a4c', '#8c7766'], deco: ['bin', 'bin', 'crate', 'puddle', 'lamp', 'bricks', 'tire'], dens: 0.6, glow: '#C08457', icon: 'bin' },
  // 2 The Night Market
  { ground: 'tiles', g: ['#3a2224', '#4d2c2a', '#5e3833'], road: 'cobble', r: ['#24130f', '#9a6a44', '#c08a5a'], deco: ['lantern', 'lantern', 'stall', 'stall', 'crate', 'barrel'], dens: 0.65, glow: '#E8862E', icon: 'lantern' },
  // 3 The City Circuit
  { ground: 'asphalt', g: ['#2c3140', '#3a4152', '#4a5266'], road: 'cobble', r: ['#1b1e28', '#6a7385', '#8d97aa'], deco: ['building', 'building', 'vent', 'antenna', 'tower', 'lamp'], dens: 0.6, glow: '#8C99AB', icon: 'building' },
  // 4 Harbor Docks
  { ground: 'water', g: ['#123a6b', '#1a4d8a', '#2c68ad'], road: 'planks', r: ['#3b2414', '#8a5a33', '#b07a48'], deco: ['crate', 'barrel', 'buoy', 'boat', 'buoy', 'rock'], dens: 0.45, glow: '#3D8BFF', icon: 'boat' },
  // 5 National League
  { ground: 'grass', g: ['#1f6b44', '#2a8455', '#38a068'], road: 'dirt', r: ['#5a3a1e', '#c99a62', '#e2b880'], deco: ['flood', 'cone', 'flag', 'bench', 'cone', 'bush'], dens: 0.45, glow: '#2DD4BF', icon: 'flood' },
  // 6 The Haunted Highlands
  { ground: 'moor', g: ['#262236', '#332d47', '#433a5c'], road: 'dirt', r: ['#1a1622', '#6e6070', '#8c7f8c'], deco: ['deadtree', 'deadtree', 'grave', 'grave', 'pumpkin', 'fence', 'rock'], dens: 0.65, glow: '#8E7AB5', icon: 'grave' },
  // 7 World Stage
  { ground: 'grass', g: ['#356b2c', '#44843a', '#58a04a'], road: 'gold', r: ['#5a3d10', '#d9a53a', '#f2c96a'], deco: ['flag', 'tree', 'tree', 'statue', 'rock', 'flood'], dens: 0.55, glow: '#F2B544', icon: 'flag' },
  // 8 Neon Megacity
  { ground: 'tiles', g: ['#15122a', '#1d1838', '#2a2250'], road: 'neon', r: ['#0c0a18', '#2b2156', '#ff4fd8'], deco: ['building', 'building', 'neon', 'neon', 'vent', 'antenna'], dens: 0.65, glow: '#FF4FD8', icon: 'neon' },
  // 9 The Hive
  { ground: 'hex', g: ['#8a5a0e', '#b07614', '#d39a2a'], road: 'gold', r: ['#4a2c06', '#f2c14e', '#ffe08a'], deco: ['comb', 'flower', 'drip', 'comb', 'flower', 'bee'], dens: 0.55, glow: '#F2C14E', icon: 'comb' },
  // 10 The Wheel's Domain
  { ground: 'check', g: ['#2a1418', '#3d1c22', '#55262e'], road: 'gold', r: ['#3a1206', '#d9a53a', '#f2c96a'], deco: ['wheel', 'flood', 'banner', 'wheel', 'banner'], dens: 0.5, glow: '#E5484D', icon: 'wheel' },
  // 11 Sky Islands
  { ground: 'sky', g: ['#5f9fe8', '#7fb8ff', '#b3d6ff'], road: 'rope', r: ['#3b2414', '#a8713f', '#c99a62'], deco: ['cloud', 'cloud', 'isle', 'isle', 'bird'], dens: 0.5, glow: '#7FB8FF', icon: 'isle' },
  // 12 The Underworld
  { ground: 'rock', g: ['#24110f', '#341815', '#4a221c'], road: 'cobble', r: ['#120806', '#5a3a30', '#7a5244'], deco: ['lava', 'spike', 'spike', 'skull', 'lava', 'flame'], dens: 0.6, glow: '#E5484D', icon: 'flame' },
  // 13 Clockwork Citadel
  { ground: 'plates', g: ['#4a3a22', '#5e4a2c', '#76603a'], road: 'cobble', r: ['#2a1e10', '#8a7a62', '#b0a084'], deco: ['gear', 'gear', 'pipe', 'pipe', 'bolt', 'clock'], dens: 0.6, glow: '#C9A25B', icon: 'gear' },
  // 14 The Sunken Kingdom
  { ground: 'sand', g: ['#1d4a5e', '#25607a', '#327a96'], road: 'dirt', r: ['#203848', '#c9b98a', '#e2d6a8'], deco: ['coral', 'coral', 'weed', 'weed', 'column', 'shell'], dens: 0.6, glow: '#2D9CDB', icon: 'coral' },
  // 15 Carnival of Nightmares
  { ground: 'stripes', g: ['#2a1a3e', '#3a2452', '#4c3068'], road: 'cobble', r: ['#160d22', '#7a5a9a', '#a07ec0'], deco: ['tent', 'tent', 'balloon', 'balloon', 'wheel', 'booth'], dens: 0.6, glow: '#B388FF', icon: 'tent' },
  // 16 The Glacier Court
  { ground: 'snow', g: ['#9ec8de', '#c4e2f2', '#eef8ff'], road: 'ice', r: ['#3a6c8a', '#7fc4e8', '#bfe9ff'], deco: ['pine', 'pine', 'icespike', 'icespike', 'snowman', 'rock'], dens: 0.55, glow: '#9EE6FF', icon: 'icespike' },
  // 17 The Dream Realm
  { ground: 'dream', g: ['#6a4a8a', '#8a62a8', '#b088c8'], road: 'gold', r: ['#4a2a5a', '#ffb3d9', '#ffe0f0'], deco: ['cloud', 'star', 'moon', 'candy', 'star', 'cloud'], dens: 0.55, glow: '#FFB3D9', icon: 'moon' },
  // 18 The Void
  { ground: 'void', g: ['#07060e', '#0e0c1a', '#1a1630'], road: 'neon', r: ['#05040a', '#2a2248', '#9c6bff'], deco: ['shard', 'shard', 'floatrock', 'floatrock', 'star'], dens: 0.45, glow: '#9C6BFF', icon: 'shard' },
  // 19 The Pantheon
  { ground: 'marble', g: ['#b8b0a4', '#d6cfc4', '#efe9df'], road: 'gold', r: ['#6a4a10', '#e2b84a', '#f8dc8a'], deco: ['column', 'column', 'statue', 'cloud', 'brazier'], dens: 0.5, glow: '#F2C14E', icon: 'column' },
  // 20 The First Wheel
  { ground: 'void', g: ['#1a0814', '#2a0e22', '#3e1634'], road: 'gold', r: ['#3a1206', '#d9a53a', '#f2c96a'], deco: ['wheel', 'star', 'shard', 'wheel', 'star', 'floatrock'], dens: 0.5, glow: '#FF4F8B', icon: 'wheel' },
];

/** The theme for a chapter (1-based); later chapters reuse the last one. */
export const mapTheme = (ch: number) => MAP_THEMES[Math.max(0, Math.min(MAP_THEMES.length, ch) - 1)]!;
