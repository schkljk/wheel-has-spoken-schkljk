import { computed, effect, signal } from '@preact/signals';
import {
  SaveStore,
  StorageFullError,
  clockAt,
  ctxOf,
  hashStr,
  loadCareer,
  mulberry32,
  newCid,
  numStats,
  persistFighter,
  serFighter,
  type Game,
  type NumStats,
  type SaveData,
} from '@whs/core';
import { kv, persistent } from './storage';

export const store = new SaveStore(kv);
const first = store.load();

/** The save as screens see it (a fresh snapshot after every change). */
export const save = signal<SaveData>(first.save);
/** Problems found while loading (shown once on the title screen). */
export const loadProblems = signal<string[]>(persistent ? first.problems : [...first.problems, 'This browser is not keeping saves (private mode?)']);

/**
 * The live game the rules act on: the save being changed, the fighter being played and the random
 * source. Tests can pin the random source with `?seed=123` or the `whs:seed` key.
 */
function seed() {
  const q = new URLSearchParams(location.search).get('seed') ?? kv.getItem('whs:seed');
  if (q) return hashStr(q);
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]!;
}
export const G: Game = { save: structuredClone(first.save), F: null, rng: mulberry32(seed()), clock: clockAt(), pool: null, notes: [] };
/** Bumps whenever the live fighter changes, so screens that show it update. */
export const fver = signal(0);

/** Writes the game and publishes a new snapshot. */
export function sync(): void {
  persistFighter(G);
  try {
    store.write(G.save);
  } catch (e) {
    toast(e instanceof StorageFullError ? 'Storage is full: export your save from More, Your save' : 'Could not save just now');
  }
  save.value = structuredClone(G.save);
  fver.value++;
  watchStats();
  flushNotes();
}

/** Runs a rule against the live game, then saves. */
export function act<T>(fn: (g: Game) => T): T {
  G.clock = clockAt();
  const r = fn(G);
  sync();
  return r;
}

/**
 * Runs a rule while a screen renders (e.g. today's offers or deal get rolled the first time they are shown).
 * Saves afterwards only if something changed, so rendering never loops.
 */
export function ensure<T>(fn: (g: Game) => T): T {
  const snap = () => JSON.stringify(G.save) + JSON.stringify(G.F ? serFighter(G.F) : null);
  const before = snap();
  const r = fn(G);
  if (snap() !== before) queueMicrotask(sync);
  return r;
}

/** Changes the save (settings, roster) and writes it. */
export function commit(change: (s: SaveData) => void): void {
  change(G.save);
  sync();
}

/** Replaces the whole save (import, restore, erase), with a backup of the current one first. */
export function replaceSave(next: SaveData, reason: string): void {
  store.replace(G.save, next, reason);
  loadSave(next);
}
/** Starts over from a save that is already stored. */
export function loadSave(next: SaveData): void {
  G.save = structuredClone(next);
  G.F = null;
  save.value = next;
  fver.value++;
}

/** Makes a roster slot the fighter being played. */
export function enterSlot(i: number): boolean {
  G.save.roster.active = i;
  G.F = loadCareer(G.save.roster.slots[i], G.save.profile);
  if (!G.F) return false;
  if (!G.F.cid) G.F.cid = newCid(G);
  sync();
  return true;
}

export const settings = computed(() => save.value.settings);
export const activeSlot = computed(() => {
  const r = save.value.roster;
  return r.active != null ? (r.slots[r.active] ?? null) : null;
});
/**
 * The fighter being played (live). Rules change it in place, so it never becomes a new object: reading it
 * subscribes to `fver` instead, and whoever shows it renders again after every change.
 */
export const activeFighter = {
  get value() {
    void fver.value;
    return G.F;
  },
};

// ---------- navigation ----------
export type Tab = 'play' | 'fighter' | 'goals' | 'more';
export type Route = { screen: 'title' } | { screen: 'hub'; tab: Tab } | { screen: string; [k: string]: unknown };
/** The game always opens on the title screen, as the legacy game did. */
export const route = signal<Route>({ screen: 'title' });
export const go = (r: Route) => {
  route.value = r;
};

// ---------- toasts ----------
export const toasts = signal<{ id: number; text: string }[]>([]);
let toastId = 0;
export function toast(text: string, ms = 2600) {
  const id = ++toastId;
  toasts.value = [...toasts.value, { id, text }];
  setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), ms);
}
/** Goal, mastery and collection rewards, one at a time. */
let noteBusy = false;
function flushNotes() {
  if (noteBusy || !G.notes.length) return;
  noteBusy = true;
  toast('🎯 ' + G.notes.shift()!, 2500);
  setTimeout(() => {
    noteBusy = false;
    flushNotes();
  }, 2600);
}

// ---------- every change to the fighter's numbers pops up ----------
export interface StatChange {
  k: keyof NumStats;
  a: number;
  b: number;
}
export const statPop = signal<{ id: number; rows: StatChange[] } | null>(null);
let lastNs: { cid: string; n: NumStats } | null = null;
const WATCH: (keyof NumStats)[] = ['hp', 'atk', 'pow', 'def', 'spd', 'crit', 'dodge', 'cha'];
function watchStats() {
  const F = G.F;
  if (!F || !F.career || !F.cid) return;
  let n: NumStats;
  try {
    n = numStats(F, ctxOf(G));
  } catch {
    return;
  }
  const prev = lastNs;
  lastNs = { cid: F.cid, n };
  if (!prev || prev.cid !== F.cid) return;
  const rows = WATCH.filter((k) => n[k] != null && prev.n[k] != null && n[k] !== prev.n[k]).map((k) => ({ k, a: prev.n[k] as number, b: n[k] as number }));
  if (rows.length) statPop.value = { id: Date.now(), rows };
}

// ---------- feel ----------
export function buzz(ms: number | number[] = 12) {
  if (!settings.value.haptics) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported
  }
}

/** Settings that change the whole page: text size and motion. */
effect(() => {
  const st = settings.value;
  const root = document.documentElement;
  root.dataset.text = st.textSize;
  const reduce = st.motion === 'reduced' || (st.motion === 'system' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.dataset.motion = reduce ? 'reduced' : 'full';
});
export const reducedMotion = () => document.documentElement.dataset.motion === 'reduced';
/** Speed factor for animations: fast mode halves them. */
export const SPF = () => (settings.value.fast ? 0.5 : 1);
