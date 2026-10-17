import { deserFighter, type Json, type SerFighter } from './fighter';
import { repair } from './repair';
import { SAVE_GAME_ID, SAVE_VERSION, defaultProfile, defaultSettings, type Profile, type SaveData, type Slot } from './schema';

/**
 * Save migrations. MIGRATIONS[n] turns a version-n save into version n+1.
 * Version 0 is the legacy game's raw save (localStorage key `wheel-has-spoken-v1`,
 * or the text its "Back up your save" button copies), so importing it is just migration #1.
 */
type Raw = Record<string, unknown>;
export const MIGRATIONS: ((s: Raw, now: number) => Raw)[] = [
  // 0 -> 1: the legacy save becomes settings, roster and profile
  (raw, now) => importLegacy(raw, now) as unknown as Raw,
];

export class SaveFormatError extends Error {}

export const LEGACY_STORE_KEY = 'wheel-has-spoken-v1';

const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);

/** Which version a stored object is, or null if it is not a save of this game. */
export function saveVersion(v: unknown): number | null {
  if (!isObj(v)) return null;
  if (v.game === SAVE_GAME_ID && typeof v.version === 'number') return v.version;
  // the legacy game accepted any object with coins or slots as a save
  if ('coins' in v || 'slots' in v) return 0;
  return null;
}

/** Brings any supported save (legacy or newer) up to the current version and repairs it (notes say what was fixed). */
export function migrate(input: unknown, now = Date.now(), notes?: string[]): SaveData {
  let s = typeof input === 'string' ? parseJson(input) : input;
  let v = saveVersion(s);
  if (v === null) throw new SaveFormatError("That doesn't look like a save from this game");
  if (v > SAVE_VERSION) throw new SaveFormatError('This save comes from a newer version of the game. Update the game first');
  while (v < SAVE_VERSION) {
    s = MIGRATIONS[v]!(s as Raw, now);
    v++;
    (s as Raw).version = v;
  }
  const r = repair(s as SaveData);
  notes?.push(...r.fixed);
  return r.save;
}

function parseJson(txt: string): unknown {
  try {
    return JSON.parse(txt.trim());
  } catch {
    throw new SaveFormatError("That doesn't look like a save from this game");
  }
}

/** What an import found, for the confirmation screen. */
export interface ImportSummary {
  fighters: { slot: number; name: string; lvl: number; ok: boolean }[];
  retired: number;
  gems: number;
  coins: number;
  /** fighters whose picks could not be rebuilt (they stay in the save untouched) */
  warnings: string[];
}

export function summarize(save: SaveData): ImportSummary {
  const fighters: ImportSummary['fighters'] = [];
  const warnings: string[] = [];
  save.roster.slots.forEach((s, slot) => {
    if (!s) return;
    const ok = !!deserFighter(s.career);
    fighters.push({ slot, name: s.career?.name ?? '?', lvl: s.career?.lvl || 1, ok });
    if (!ok) warnings.push(`${s.career?.name ?? 'A fighter'} in slot ${slot + 1} could not be rebuilt`);
  });
  return {
    fighters,
    retired: save.roster.retired.length,
    gems: save.profile.gems,
    coins: save.roster.slots.reduce((a, s) => a + (s ? s.coins : 0), 0),
    warnings,
  };
}

// keys the new save stores in a named place; everything else goes to profile.extra
const SETTINGS_KEYS = ['sound', 'haptics', 'fast', 'autoDefault', 'tut'];
const ROSTER_KEYS = ['slots', 'active', 'career', 'nemesis', 'tourney', 'coins', 'tokens', 'retired', 'rivals'];
const PROFILE_KEYS = Object.keys(defaultProfile()).filter((k) => k !== 'extra').concat(['lastLegacy', 'dc', 'rushBest', 'deal', 'baseHag', 'gstock', 'daily']);

const num = (v: unknown) => Math.max(0, Math.floor(+(v as number) || 0));
const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

/**
 * The legacy save -> version 1. Applies the same repairs the legacy game ran when it loaded a save
 * (ui_a.js): old single-fighter saves move into slot 1, tokens become coins, missing parts get
 * defaults. Fighters stay in their saved form; the story repairs run when a fighter is played.
 */
export function importLegacy(input: Raw, now: number): SaveData {
  const DB = clone(input) as Raw & Record<string, unknown>;
  const out = {
    game: SAVE_GAME_ID,
    version: 1,
    savedAt: now,
  } as SaveData;

  // roster (ui_a.js lines 10-13): old saves had one career at the top level
  let slots: (Slot | null)[];
  let active: number | null = null;
  if (!Array.isArray(DB.slots)) {
    slots = [null, null, null];
    if (DB.career) {
      slots[0] = { career: DB.career as SerFighter, nemesis: (DB.nemesis as Slot['nemesis']) || null, tourney: (DB.tourney as Json) || null, coins: num(DB.coins) };
      active = 0;
    }
  } else {
    slots = (DB.slots as (Slot | null)[]).map((s) => (isObj(s) && s.career ? { career: s.career, nemesis: s.nemesis || null, tourney: s.tourney ?? null, coins: num(s.coins) } : null));
    active = typeof DB.active === 'number' && slots[DB.active] ? DB.active : null;
  }
  while (slots.length < 3) slots.push(null);
  // old tokens were worth two coins each; the active fighter's purse gets them, as in the legacy game
  if (DB.tokens && active != null) slots[active]!.coins = num(slots[active]!.coins + Math.floor(+(DB.tokens as number) || 0) * 2);
  out.roster = {
    active,
    slots,
    retired: Array.isArray(DB.retired) ? (DB.retired as SerFighter[]) : [],
    rivals: Array.isArray(DB.rivals) ? (DB.rivals as Json[]) : [],
  };

  // settings
  const st = defaultSettings();
  st.sound = DB.sound !== false;
  st.haptics = DB.haptics !== false;
  st.fast = !!DB.fast;
  st.autoBattle = !!DB.autoDefault;
  // the legacy game marked the tutorial seen as soon as a fighter existed
  st.tutorialSeen = !!DB.tut || slots.some(Boolean);
  out.settings = st;

  // profile (ui_a.js migrate())
  const p = defaultProfile();
  const P = p as unknown as Record<string, unknown>;
  for (const k of PROFILE_KEYS) if (DB[k] !== undefined && DB[k] !== null) P[k] = DB[k];
  if (!Array.isArray(p.champs)) p.champs = [];
  if (!isObj(p.seen)) p.seen = {};
  if (!Array.isArray(p.last)) p.last = [];
  if (!isObj(p.champIds)) p.champIds = {};
  if (!Array.isArray(p.lastTop)) p.lastTop = [];
  if (!isObj(p.season)) p.season = defaultProfile().season;
  if (!p.season.stats) p.season.stats = { race: {}, arch: {} };
  if (!isObj(p.patch)) p.patch = { race: {}, arch: {} };
  if (!isObj(p.ach)) p.ach = {};
  if (!isObj(p.legacy)) p.legacy = { pts: 0, perks: {} };
  if (!p.legacy.perks) p.legacy.perks = {};
  if (!Array.isArray(p.gearSeen)) p.gearSeen = [];
  if (!Array.isArray(p.goalsDone)) p.goalsDone = [];
  if (!isObj(p.mastery)) p.mastery = {};
  if (!isObj(p.stats)) p.stats = {};
  p.gems = num(p.gems);
  p.gbest = num(p.gbest);
  p.colMiles = num(p.colMiles);
  const known = new Set([...SETTINGS_KEYS, ...ROSTER_KEYS, ...PROFILE_KEYS]);
  p.extra = {};
  for (const [k, v] of Object.entries(DB)) if (!known.has(k) && v !== undefined) p.extra[k] = v as Json;
  out.profile = p as Profile;
  return out;
}
