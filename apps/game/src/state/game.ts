import { computed, effect, signal } from '@preact/signals';
import {
  SaveStore,
  StaleSaveError,
  StorageFullError,
  clockAt,
  forwardDay,
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
import { keepSave, kv, persistent } from './storage';

export const store = new SaveStore(kv);
const first = store.load();
/** Another tab or window has saved since this one loaded (G8): this one reloads before it plays on. */
export const staleTab = signal(false);
addEventListener('storage', (e) => {
  if (e.key === 'whs:meta' && store.stale()) staleTab.value = true;
});

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
/** Today, or the day tests pin with `?today=2026-12-10` or the `whs:today` key (seasonal arenas follow the date). */
const pinned = (() => {
  const q = new URLSearchParams(location.search).get('today') ?? kv.getItem('whs:today');
  const [y, m, d] = (q || '').split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d, 12).getTime() : 0;
})();
const today = () => (pinned ? new Date(pinned) : new Date());
export const G: Game = { save: structuredClone(first.save), F: null, rng: mulberry32(seed()), clock: clockAt(today()), pool: null, notes: [] };
// the game's day never goes back (G12)
const now = () => clockAt(forwardDay(G, today()));
G.clock = now();
/** Bumps whenever the live fighter changes, so screens that show it update. */
export const fver = signal(0);

/** Writes the game and publishes a new snapshot. */
export function sync(): void {
  persistFighter(G);
  if (G.save.roster.slots.some(Boolean)) keepSave();
  try {
    store.write(G.save);
  } catch (e) {
    if (e instanceof StaleSaveError) staleTab.value = true;
    else toast(e instanceof StorageFullError ? 'Storage is full: export your save from More, Your save' : 'Could not save just now');
  }
  save.value = structuredClone(G.save);
  fver.value++;
  watchStats();
  flushNotes();
}

/** Runs a rule against the live game, then saves. */
export function act<T>(fn: (g: Game) => T): T {
  G.clock = now();
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
export function replaceSave(next: SaveData, reason: string): boolean {
  try {
    store.replace(G.save, next, reason);
  } catch (e) {
    // too big for this device: nothing changed, the current save is still the one in use (G14)
    toast(e instanceof StorageFullError ? 'That save is too big for the storage left on this device. Nothing was changed' : 'Could not load that save. Nothing was changed');
    return false;
  }
  loadSave(next);
  return true;
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
export interface ToastAction {
  label: string;
  run: () => void;
}
export const toasts = signal<{ id: number; text: string; action?: ToastAction }[]>([]);
let toastId = 0;
/** A short message at the top; with an action (like Undo), tapping it runs the action and closes the toast. */
export function toast(text: string, ms = 2600, action?: ToastAction) {
  const id = ++toastId;
  toasts.value = [...toasts.value, { id, text, action }];
  setTimeout(() => dropToast(id), ms);
  return id;
}
export const dropToast = (id: number) => (toasts.value = toasts.value.filter((t) => t.id !== id));
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
  popStats(prev.n, n);
}
/** The old → new popup for any fighter's numbers (a Spin & Run runner, a mentor's lesson: G15). */
export function popStats(a: NumStats, b: NumStats) {
  const rows = WATCH.filter((k) => b[k] != null && a[k] != null && b[k] !== a[k]).map((k) => ({ k, a: a[k] as number, b: b[k] as number }));
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
/** How big hits look (upgrade 33): screen shake and particle bursts scale with it. */
export const fxScale = () => ({ soft: 0.45, normal: 1, big: 1.6 })[settings.value.fx || 'normal'] ?? 1;
/** Speed factor for animations: fast mode halves them. */
export const SPF = () => (settings.value.fast ? 0.5 : 1);
