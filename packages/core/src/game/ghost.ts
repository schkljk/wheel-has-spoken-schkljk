import { TREE } from '../data/talents';
import { deserFighter, hashStr, serFighter, type CareerFighter, type SerFighter } from '../save/fighter';
import { GEARK } from '../stats';
import { invalidate, track } from './career';
import type { FightOutcome, FightResult, FightTier } from './fight';
import type { Game } from './game';

/**
 * Ghost codes (review F9): a fighter as a line of text a friend can paste and fight. Only the build travels
 * (wheel results, bonuses, level, gear, talents): no story, coins or records. A checksum catches a code that
 * lost a character on the way.
 */
const PREFIX = 'WHS1.';
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

/** The fighter's ghost code. */
export function ghostCode(f: CareerFighter): string {
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
  const c = code.replace(/\s+/g, '');
  if (!c.startsWith(PREFIX)) return null;
  const [body = '', sum = ''] = c.slice(PREFIX.length).split('.');
  if (!body || check(body) !== sum) return null;
  let b: Build;
  try {
    b = JSON.parse(fromB64(body)) as Build;
  } catch {
    return null;
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
