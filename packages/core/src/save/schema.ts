import type { Json, SerFighter } from './fighter';

/** Current save schema version. Bump it and add a migration in migrate.ts for every change. */
export const SAVE_VERSION = 1;
/** Marks exported save files. */
export const SAVE_GAME_ID = 'wheel-has-spoken';

export type TextSize = 'small' | 'normal' | 'large' | 'huge';
export type MotionPref = 'system' | 'reduced' | 'full';

export interface Settings {
  sound: boolean;
  haptics: boolean;
  /** quicker spins and fight animations */
  fast: boolean;
  /** fights play themselves unless switched off */
  autoBattle: boolean;
  motion: MotionPref;
  textSize: TextSize;
  tutorialSeen: boolean;
}

/** One roster slot: a career fighter and what belongs to them. */
export interface Slot {
  career: SerFighter;
  /** the opponent who beat them, back for revenge */
  nemesis: { f: SerFighter; beats?: number; owner?: string } | null;
  /** an unfinished cup or gauntlet run */
  tourney: Json;
  coins: number;
}

export interface Roster {
  /** index of the fighter being played, or null on the title screen */
  active: number | null;
  /** always three slots */
  slots: (Slot | null)[];
  /** retired fighters (hall of fame) */
  retired: SerFighter[];
  rivals: Json[];
}

/** Collection, records and account-wide progress. */
export interface Profile {
  gems: number;
  /** wheel spins ever */
  spins: number;
  entered: number;
  won: number;
  /** collection: seen keys per category */
  seen: Record<string, string[]>;
  gearSeen: string[];
  /** last few landed slices for the "new!" markers */
  last: string[];
  ach: Record<string, boolean>;
  champs: Json[];
  champIds: Record<string, Json>;
  lastTop: Json[];
  gbest: number;
  lastArena: string | null;
  season: { n: number; tourneys: number; stats: Record<string, Record<string, { w: number; l: number }>> };
  patch: { race: Record<string, Record<string, number>>; arch: Record<string, Record<string, number>> };
  patchNotes: Json;
  legacy: { pts: number; perks: Record<string, number> };
  lastLegacy?: number;
  stats: Record<string, number>;
  goalsDone: string[];
  mastery: Record<string, number>;
  colMiles: number;
  /** daily challenge */
  dc?: Json;
  rushBest?: number;
  /** base shop daily deal, haggle and stock */
  deal?: Json;
  baseHag?: Json;
  gstock?: Json;
  /** date key of the last daily wheel */
  daily?: string;
  /** anything else the old game stored, kept so nothing is lost */
  extra: Record<string, Json>;
}

export interface SaveData {
  game: typeof SAVE_GAME_ID;
  version: number;
  savedAt: number;
  settings: Settings;
  roster: Roster;
  profile: Profile;
}

export const defaultSettings = (): Settings => ({
  sound: true,
  haptics: true,
  fast: false,
  autoBattle: false,
  motion: 'system',
  textSize: 'normal',
  tutorialSeen: false,
});

export const defaultProfile = (): Profile => ({
  gems: 0,
  spins: 0,
  entered: 0,
  won: 0,
  seen: {},
  gearSeen: [],
  last: [],
  ach: {},
  champs: [],
  champIds: {},
  lastTop: [],
  gbest: 0,
  lastArena: null,
  season: { n: 1, tourneys: 0, stats: { race: {}, arch: {} } },
  patch: { race: {}, arch: {} },
  patchNotes: null,
  legacy: { pts: 0, perks: {} },
  stats: {},
  goalsDone: [],
  mastery: {},
  colMiles: 0,
  extra: {},
});

export const newSave = (now = Date.now()): SaveData => ({
  game: SAVE_GAME_ID,
  version: SAVE_VERSION,
  savedAt: now,
  settings: defaultSettings(),
  roster: { active: null, slots: [null, null, null], retired: [], rivals: [] },
  profile: defaultProfile(),
});
