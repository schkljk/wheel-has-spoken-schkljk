import type { Json, SerFighter } from './fighter';
import { SAVE_GAME_ID, SAVE_VERSION, defaultProfile, defaultSettings, type Profile, type Roster, type SaveData, type Slot } from './schema';

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

const MOTION = new Set(['system', 'reduced', 'full']);
const FX = new Set(['soft', 'normal', 'big']);
const TEXT = new Set(['small', 'normal', 'large', 'huge']);

/**
 * Makes any current-version save safe to play: every field the game reads exists with the right type, the
 * roster has its three slots and a valid active fighter. Nothing unknown is dropped (extra slots and fields
 * are kept in profile.extra). Returns what had to be fixed, for the player and the tests.
 */
export function repair(input: SaveData): { save: SaveData; fixed: string[] } {
  const fixed: string[] = [];
  const s = input as unknown as Raw;
  const save = s as unknown as SaveData;
  if (s.game !== SAVE_GAME_ID) s.game = SAVE_GAME_ID;
  if (typeof s.version !== 'number') s.version = SAVE_VERSION;
  if (typeof s.savedAt !== 'number' || !Number.isFinite(s.savedAt)) s.savedAt = 0;

  // settings: each one falls back to its default when missing or of the wrong kind
  if (!isObj(s.settings)) {
    s.settings = defaultSettings();
    fixed.push('settings were reset');
  } else {
    const st = s.settings as Raw;
    const def = defaultSettings() as unknown as Raw;
    for (const [k, v] of Object.entries(def)) {
      const bad =
        typeof st[k] !== typeof v ||
        (k === 'motion' && !MOTION.has(st[k] as string)) ||
        (k === 'textSize' && !TEXT.has(st[k] as string)) ||
        (k === 'fx' && !FX.has(st[k] as string)) ||
        (Array.isArray(v) && !(Array.isArray(st[k]) && (st[k] as unknown[]).every((x) => typeof x === 'string')));
      if (bad) {
        if (st[k] !== undefined) fixed.push(`setting "${k}" was reset`);
        st[k] = v;
      }
    }
  }

  // profile: wrong or missing parts get their defaults; unknown keys stay
  if (!isObj(s.profile)) {
    s.profile = defaultProfile();
    fixed.push('records and collection were missing');
  } else {
    const p = s.profile as Raw;
    const def = defaultProfile() as unknown as Raw;
    for (const [k, v] of Object.entries(def)) {
      const want = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
      const cur = p[k];
      const have = cur === null ? 'null' : Array.isArray(cur) ? 'array' : typeof cur;
      // lastArena and patchNotes may also hold a value where the default is null
      if (want === 'null' ? cur === undefined : have !== want) {
        if (cur !== undefined) fixed.push(`"${k}" in your records was reset`);
        p[k] = v;
      }
    }
    for (const k of ['gems', 'spins', 'entered', 'won', 'gbest', 'colMiles'] as const) p[k] = count(p[k]);
    const season = p.season as Raw;
    if (typeof season.n !== 'number') season.n = 1;
    if (typeof season.tourneys !== 'number') season.tourneys = 0;
    if (!isObj(season.stats)) season.stats = { race: {}, arch: {} };
    const patch = p.patch as Raw;
    if (!isObj(patch.race)) patch.race = {};
    if (!isObj(patch.arch)) patch.arch = {};
    const legacy = p.legacy as Raw;
    legacy.pts = count(legacy.pts);
    if (!isObj(legacy.perks)) legacy.perks = {};
    const seen = p.seen as Raw;
    for (const [k, v] of Object.entries(seen)) if (!Array.isArray(v)) seen[k] = [];
  }
  const profile = s.profile as unknown as Profile;

  // roster: three slots, each a fighter with a purse, or empty
  if (!isObj(s.roster)) {
    s.roster = { active: null, slots: [null, null, null], retired: [], rivals: [] } satisfies Roster;
    fixed.push('your fighters could not be found');
  }
  const r = s.roster as Raw;
  let slots: unknown[] = Array.isArray(r.slots) ? r.slots : [];
  if (!Array.isArray(r.slots)) fixed.push('fighter slots were rebuilt');
  if (slots.length > 3) {
    profile.extra.extraSlots = slots.slice(3) as Json;
    fixed.push('fighters beyond three slots were set aside');
    slots = slots.slice(0, 3);
  }
  r.slots = [0, 1, 2].map((i) => {
    const sl = slots[i];
    if (sl == null) return null;
    if (!isObj(sl) || !isObj(sl.career)) {
      fixed.push(`slot ${i + 1} was damaged and is empty now`);
      if (sl !== undefined) profile.extra[`damagedSlot${i + 1}`] = sl as Json;
      return null;
    }
    const slot: Slot = {
      career: sl.career as unknown as SerFighter,
      nemesis: isObj(sl.nemesis) && isObj(sl.nemesis.f) ? (sl.nemesis as unknown as Slot['nemesis']) : null,
      tourney: (sl.tourney ?? null) as Json,
      coins: count(sl.coins),
    };
    // anything else the slot carried stays with it
    return { ...(sl as object), ...slot } as Slot;
  });
  const act = r.active;
  r.active = typeof act === 'number' && Number.isInteger(act) && (r.slots as unknown[])[act] ? act : null;
  if (act != null && r.active === null) fixed.push('the active fighter was reset');
  if (!Array.isArray(r.retired)) r.retired = [];
  if (!Array.isArray(r.rivals)) r.rivals = [];
  return { save, fixed };
}
