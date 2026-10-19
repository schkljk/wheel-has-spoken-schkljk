import type { Json, SerFighter } from './fighter';
import { SAVE_GAME_ID, SAVE_VERSION, defaultProfile, defaultSettings, type Profile, type Roster, type SaveData, type Slot } from './schema';

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

/** A count that may have been stored as text ("5"): a number, or 0. */
const countish = (v: unknown) => count(typeof v === 'string' && v.trim() !== '' ? Number(v) : v);
const strs = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const numMap = (v: unknown): v is Record<string, number> => isObj(v) && Object.values(v).every((x) => typeof x === 'number' && Number.isFinite(x));
const PLACES = new Set(['map', 'hub', 'bracket']);

/**
 * The parts of profile.extra the newer features keep (review G14). Each is checked the way its feature reads it,
 * and a damaged part goes back to empty (keeping what of it is still good) instead of throwing on every win.
 */
function repairExtra(x: Raw, fixed: string[]) {
  const note = (what: string) => fixed.push(`${what} was repaired`);
  if (x.bounty !== undefined) {
    const b = isObj(x.bounty) ? x.bounty : {};
    const job = b.job == null || (isObj(b.job) && typeof b.job.k === 'string' && typeof b.job.gems === 'number');
    const ok = isObj(x.bounty) && strs(b.up) && strs(b.done) && (b.prog === undefined || numMap(b.prog)) && (b.last == null || typeof b.last === 'string') && job;
    if (!ok) {
      x.bounty = { up: strs(b.up) ? b.up : [], done: strs(b.done) ? b.done : [], prog: numMap(b.prog) ? b.prog : {}, ...(job && b.job ? { job: b.job } : {}) };
      note('the bounty board');
    }
  }
  if (x.cos !== undefined) {
    const c = isObj(x.cos) ? x.cos : {};
    const onOk = isObj(c.on) && Object.values(c.on).every((v) => typeof v === 'string');
    if (!isObj(x.cos) || !strs(c.own) || !onOk) {
      x.cos = { own: strs(c.own) ? c.own : [], on: onOk ? c.on : {} };
      note('your locker');
    }
  }
  if (x.duels !== undefined) {
    const d = isObj(x.duels) ? x.duels : {};
    const good = Object.fromEntries(Object.entries(d).filter(([, v]) => isObj(v) && typeof v.won === 'boolean' && typeof v.rounds === 'number' && typeof v.hp === 'number'));
    if (!isObj(x.duels) || Object.keys(good).length !== Object.keys(d).length) {
      x.duels = good as Json;
      note('your duel scores');
    }
  }
  if (x.run != null) {
    const r = x.run;
    const ok = isObj(r) && isObj(r.f) && isObj(r.f.picks) && typeof r.i === 'number' && typeof r.hp === 'number' && typeof r.seed === 'number' && (r.offer == null || strs(r.offer)) && strs(r.took);
    if (!ok) {
      x.run = null;
      fixed.push('a damaged Spin & Run run was ended');
    }
  }
  if (x.runBest != null && !(isObj(x.runBest) && typeof x.runBest.wins === 'number')) {
    x.runBest = null;
    note('your best run');
  }
  if (x.resume !== undefined) {
    const r = isObj(x.resume) ? x.resume : {};
    const steps = r.steps == null || (Array.isArray(r.steps) && r.steps.every((st) => isObj(st) && typeof st.t === 'string'));
    const place = r.place == null || PLACES.has(r.place as string);
    const build = r.build == null || (isObj(r.build) && isObj(r.build.f) && typeof r.build.idx === 'number' && typeof r.build.done === 'boolean');
    const lv = r.lv == null || strs(r.lv);
    const slot = r.slot == null || typeof r.slot === 'number';
    // a fight under way (G2): its dice and every round played, or nothing
    const f = r.fight;
    const nums = (o: Raw, ks: string[]) => ks.every((k) => typeof o[k] === 'number' && Number.isFinite(o[k]));
    const move = (m: unknown) => isObj(m) && typeof m.c === 'string';
    const fight = f == null || (isObj(f) && typeof f.kind === 'string' && typeof f.opp === 'string' && nums(f, ['seed', 'wheel', 'arena', 'dn']) && Array.isArray(f.moves) && f.moves.every(move) && (f.pend == null || move(f.pend)));
    if (!isObj(x.resume) || !steps || !place || !build || !lv || !slot || !fight) {
      x.resume = {
        ...r,
        slot: slot ? (r.slot ?? null) : null,
        steps: steps ? (r.steps ?? null) : null,
        place: place ? (r.place ?? null) : null,
        build: build ? (r.build ?? null) : null,
        lv: lv ? (r.lv ?? null) : null,
        fight: fight ? (r.fight ?? null) : null,
      } as Json;
      note('what you were in the middle of');
    }
  }
  if (x.tower !== undefined && !(isObj(x.tower) && typeof x.tower.floor === 'number' && typeof x.tower.who === 'string')) {
    const t = isObj(x.tower) ? x.tower : {};
    x.tower = { floor: countish(t.floor), who: typeof t.who === 'string' ? t.who : '' };
    note('your tower record');
  }
  if (x.trials !== undefined && !(isObj(x.trials) && typeof x.trials.best === 'number')) {
    x.trials = { best: countish(isObj(x.trials) ? x.trials.best : 0) };
    note('your trials record');
  }
  if (x.dayMax !== undefined && !(typeof x.dayMax === 'number' && Number.isFinite(x.dayMax))) delete x.dayMax;
  if (x.season !== undefined && !numMap(x.season)) delete x.season;
}

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
    // career counts read as numbers: a "5" stored as text became "51" after one more win
    const stats = p.stats as Raw;
    for (const [k, v] of Object.entries(stats)) if (typeof v !== 'number' || !Number.isFinite(v)) stats[k] = countish(v);
    repairExtra(p.extra as Raw, fixed);
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
