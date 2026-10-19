import { GEAR_SLOTS } from '../data/gear';
import { TREE } from '../data/talents';
import { ASUB, CURSED, HOLY, POWERS, RSUB, SPELLBOOK } from '../data/wheels';
import { WHEELS, itemsOf, type PartialFighter } from '../fighter';
import { deserFighter, hashStr, serFighter, type CareerFighter, type SerFighter } from '../save/fighter';
import { GEARK } from '../stats';
import { invalidate, track } from './career';
import type { FightOutcome, FightResult, FightTier } from './fight';
import type { Game } from './game';

/**
 * Ghost codes (review F9): a fighter as a line of text a friend can paste and fight. Only the build travels
 * (wheel results, bonuses, level, gear, talents): no story, coins or records. A checksum catches a code that
 * lost a character on the way. Codes are short (H8): every wheel result is its place on its wheel, one
 * character each, so a whole fighter fits in about 80 characters (the first codes, WHS1, spelled it all out in
 * 700; they still read).
 */
const PREFIX = 'WHS1.';
const PREFIX2 = 'WHS2.';
export const GHOST_TIER: FightTier = { k: 'ghost', n: 'Ghost fight', e: '👻', xpW: 0, coins: 0 };

type Build = Pick<SerFighter, 'name' | 'picks' | 'bonus' | 'lvl' | 'gear' | 'talents'> & { gup?: Record<string, number>; reinc?: SerFighter['reinc']; cured?: 1 };

// base64url over UTF-8, by hand: the core runs without browser APIs (tests, workers, the UI alike)
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const utf8 = (s: string) => encodeURIComponent(s).replace(/%([0-9A-F]{2})|(.)/gs, (_, h: string | undefined, c: string) => String.fromCharCode(h ? parseInt(h, 16) : c.charCodeAt(0)));
const unutf8 = (b: string) => decodeURIComponent(b.replace(/[\s\S]/g, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')));
function toB64(s: string) {
  const b = utf8(s);
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b.charCodeAt(i) << 16) | ((b.charCodeAt(i + 1) || 0) << 8) | (b.charCodeAt(i + 2) || 0);
    const k = Math.min(3, b.length - i);
    for (let j = 0; j <= k; j++) out += B64[(n >> (18 - 6 * j)) & 63];
  }
  return out;
}
function fromB64(s: string) {
  let b = '';
  for (let i = 0; i < s.length; i += 4) {
    let n = 0;
    const k = Math.min(4, s.length - i);
    for (let j = 0; j < 4; j++) {
      const v = j < k ? B64.indexOf(s[i + j]!) : 0;
      if (v < 0) throw new Error('not base64');
      n = (n << 6) | v;
    }
    for (let j = 0; j < k - 1; j++) b += String.fromCharCode((n >> (16 - 8 * j)) & 255);
  }
  return unutf8(b);
}
const check = (body: string) => (hashStr(body) % 46656).toString(36).padStart(3, '0');

/** The fighter's ghost code: the short one, or the long one for a build the short one can't spell. */
export function ghostCode(f: CareerFighter): string {
  return shortCode(f) ?? ghostCodeLong(f);
}

// ---------------------------------------------------------------- the short code (H8)
const STAT_ORDER = ['str', 'spd', 'dur', 'iq', 'wm', 'pm', 'cha'] as const;
const GEARS = Object.keys(GEARK);
const TALS = TREE.flatMap((t) => t.t.map((r) => r[0]));
/** What the indexes point into: a code from a version with other wheels says so instead of reading wrong. */
let cv = -1;
const contentVersion = () => {
  if (cv >= 0) return cv;
  const names = (l: readonly { n: string }[]) => l.map((x) => x.n).join(',');
  const lists = WHEELS.map((W) => (typeof W.items === 'function' ? '' : names(W.items)));
  for (const r of Object.values(RSUB)) lists.push(names(r.items));
  for (const a of Object.values(ASUB)) lists.push(names(a.items));
  for (const p of [POWERS, HOLY, CURSED, SPELLBOOK]) lists.push(names(p));
  return (cv = hashStr(lists.join('|') + GEARS.join(',') + TALS.join(',')) % 4096);
};
const c1 = (v: number) => B64[Math.min(63, Math.max(0, v))]!;
const c2 = (v: number) => c1(v >> 6) + c1(v & 63);

/** Every wheel result as its place on its wheel (the wheels before it decide which wheel that is). Null if one isn't on it. */
function packPicks(f: CareerFighter): string | null {
  const p: Record<string, unknown> = {};
  let out = '';
  for (const W of WHEELS) {
    const v = f[W.k] as { n: string; skip?: unknown } | undefined;
    if (!v) {
      out += '~';
      continue;
    }
    // a reincarnation's wheel is made of past champions: the short code can't point at it
    if (W.k === 'reinc') return null;
    const list = itemsOf(W, p as PartialFighter);
    const i = list.findIndex((x) => x.n === v.n);
    if (i < 0) {
      // off the wheel: no power to master, or a weakness overcome (the code's cured flag brings it back)
      if ((W.k === 'pm' && v.skip) || (W.k === 'weak' && (v as { k?: string }).k === 'cured')) {
        out += '!';
        p[W.k] = v;
        continue;
      }
      return null;
    }
    out += i < 64 ? c1(i) : '*' + c2(i);
    p[W.k] = list[i];
  }
  return out;
}
function shortCode(f: CareerFighter): string | null {
  const s = serFighter(f);
  if (s.reinc) return null;
  const picks = packPicks(f);
  if (picks == null) return null;
  let body = c2(contentVersion()) + c1(s.lvl || 1) + STAT_ORDER.map((k) => c1(((s.bonus as Record<string, number>)[k] || 0) + 32)).join('') + c1(s.cured ? 1 : 0);
  body += picks;
  const gear = (s.gear || {}) as Record<string, string>;
  const gup = (s.gup || {}) as Record<string, number>;
  for (const sl of GEAR_SLOTS) body += c2(gear[sl] ? GEARS.indexOf(gear[sl]!) + 1 : 0);
  for (const sl of GEAR_SLOTS) body += c1(gear[sl] ? gup[gear[sl]!] || 0 : 0);
  const tal: [number, number][] = [];
  if (Array.isArray(s.talents)) {
    const n = new Map<string, number>();
    for (const k of s.talents) n.set(k, (n.get(k) || 0) + 1);
    for (const [k, r] of n) if (TALS.includes(k)) tal.push([TALS.indexOf(k), r]);
  } else for (const [k, r] of Object.entries(s.talents || {})) if (r && TALS.includes(k)) tal.push([TALS.indexOf(k), r as number]);
  body += c1(tal.length) + tal.map(([i, r]) => c2(i) + c1(r)).join('');
  body += '.' + toB64(s.name);
  return `${PREFIX2}${body}.${check(body)}`;
}
/** Reads a short code back into the long code's build. Null if it doesn't add up. */
function unpack(body: string): Build | 'version' | null {
  const [head = '', nameB = ''] = body.split('.');
  let i = 0;
  const r1 = () => {
    const v = B64.indexOf(head[i++] ?? '?');
    if (v < 0) throw new Error('bad');
    return v;
  };
  const r2 = () => (r1() << 6) | r1();
  try {
    if (r2() !== contentVersion()) return 'version';
    const lvl = r1();
    const bonus: Record<string, number> = {};
    for (const k of STAT_ORDER) {
      const v = r1() - 32;
      if (v) bonus[k] = v;
    }
    const cured = r1() === 1;
    const p: Record<string, unknown> = {};
    const picks: Record<string, string> = {};
    for (const W of WHEELS) {
      const ch = head[i];
      if (ch === '~') {
        i++;
        continue;
      }
      if (ch === '!') {
        i++;
        picks[W.k] = '__skip';
        continue;
      }
      const at = ch === '*' ? (i++, r2()) : r1();
      const list = itemsOf(W, p as PartialFighter);
      const it = list[at];
      if (!it) return null;
      p[W.k] = it;
      picks[W.k] = it.n;
    }
    const gear: Record<string, string> = {};
    for (const sl of GEAR_SLOTS) {
      const g = r2();
      if (g) gear[sl] = GEARS[g - 1] ?? '';
    }
    const gup: Record<string, number> = {};
    for (const sl of GEAR_SLOTS) {
      const u = r1();
      if (u && gear[sl]) gup[gear[sl]!] = u;
    }
    const talents: Record<string, number> = {};
    for (let n = r1(); n > 0; n--) {
      const k = TALS[r2()];
      const rank = r1();
      if (k) talents[k] = rank;
    }
    if (i !== head.length) return null;
    return { name: fromB64(nameB), picks, bonus, lvl, gear: gear as Build['gear'], talents, gup, ...(cured ? { cured: 1 as const } : {}) };
  } catch {
    return null;
  }
}

/** The long ghost code (WHS1): the build spelled out. Any build fits in it. */
export function ghostCodeLong(f: CareerFighter): string {
  const s = serFighter(f);
  const b: Build = { name: s.name, picks: s.picks, bonus: s.bonus, lvl: s.lvl, gear: s.gear, talents: s.talents };
  if (s.gup) b.gup = s.gup as Record<string, number>;
  if (s.reinc) b.reinc = s.reinc;
  if (s.cured) b.cured = 1;
  const body = toB64(JSON.stringify(b));
  return `${PREFIX}${body}.${check(body)}`;
}

const TAL_MAX = new Map(TREE.flatMap((t) => t.t.map((r) => [r[0], r[3]] as const)));
const STATS = new Set(['str', 'spd', 'dur', 'iq', 'wm', 'pm', 'cha']);
const int = (v: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(v) || 0)));
/**
 * A code is text anyone can edit, and its checksum only catches typos: keep what it claims inside the game's
 * bounds (review G16). Level 1 to 50, bonuses as big as play can make them, real gear in its own slot, real
 * talents up to their ranks.
 */
function sane(b: Build): Build {
  const bonus: Record<string, number> = {};
  for (const [k, v] of Object.entries(b.bonus || {})) if (STATS.has(k)) bonus[k] = int(v, -12, 12);
  const gear: Record<string, string> = {};
  for (const [slot, k] of Object.entries(b.gear || {})) if (typeof k === 'string' && GEARK[k]?.slot === slot) gear[slot] = k;
  const gup: Record<string, number> = {};
  for (const [k, v] of Object.entries(b.gup || {})) if (Object.values(gear).includes(k)) gup[k] = int(v, 0, 5);
  let talents: Build['talents'];
  if (Array.isArray(b.talents)) talents = b.talents.filter((k): k is string => typeof k === 'string' && TAL_MAX.has(k));
  else {
    const t: Record<string, number> = {};
    for (const [k, v] of Object.entries(b.talents || {})) if (TAL_MAX.has(k)) t[k] = int(v, 0, TAL_MAX.get(k)!);
    talents = t;
  }
  const rm: Record<string, number> = {};
  for (const [k, v] of Object.entries(b.reinc?.m || {})) if (STATS.has(k)) rm[k] = int(v, -3, 3);
  const reinc = b.reinc && typeof b.reinc.n === 'string' ? { ...b.reinc, q: int(b.reinc.q, 0, 3), m: rm } : undefined;
  return { ...b, lvl: int(b.lvl, 1, 50), bonus, gear: gear as Build['gear'], gup, talents, reinc };
}

/** Reads a ghost code (spaces and line breaks from a chat app are fine). Null if it isn't one, or got damaged. */
export function readGhost(code: string): CareerFighter | null {
  const r = ghostOf(code);
  return r === 'version' ? null : r;
}
/** Like readGhost, but says when a short code comes from a version of the game with other wheels. */
export function ghostOf(code: string): CareerFighter | null | 'version' {
  const c = code.replace(/\s+/g, '');
  let b: Build;
  if (c.startsWith(PREFIX2)) {
    const rest = c.slice(PREFIX2.length);
    const cut = rest.lastIndexOf('.');
    const body = rest.slice(0, cut);
    if (cut < 0 || !body || check(body) !== rest.slice(cut + 1)) return null;
    const u = unpack(body);
    if (u === 'version' || u == null) return u;
    b = u;
  } else {
    if (!c.startsWith(PREFIX)) return null;
    const [body = '', sum = ''] = c.slice(PREFIX.length).split('.');
    if (!body || check(body) !== sum) return null;
    try {
      b = JSON.parse(fromB64(body)) as Build;
    } catch {
      return null;
    }
  }
  if (!b || typeof b !== 'object' || typeof b.name !== 'string' || !b.picks || typeof b.picks !== 'object') return null;
  b = sane(b);
  const f = deserFighter({ ...b, boons: [], rec: { w: 0, l: 0 }, armory: [] } as unknown as SerFighter);
  if (!f) return null;
  f.name = b.name.slice(0, 40);
  f.isGhost = true;
  invalidate(f);
  return f;
}

/** After a ghost fight: bragging rights only. */
export function endGhostFight(g: Game, O: CareerFighter, o: FightOutcome): FightResult {
  const won = o.w === 0;
  if (won) track(g, 'ghosts');
  return {
    won,
    big: won ? 'Ghost busted' : 'Haunted',
    desc: won ? `${o.me.f.name} beats the ghost of ${O.name}. Tell them. Twice.` : `The ghost of ${O.name} wins. They will hear about this, from you, never.`,
    lines: ['A ghost fight: no XP, no coins, all pride'],
    got: [],
    next: [{ t: 'hub' }],
    button: 'Done',
    q: won ? 2 : 0,
    confetti: won,
  };
}
