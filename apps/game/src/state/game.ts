import { computed, effect, signal } from '@preact/signals';
import { SaveStore, StorageFullError, loadCareer, type SaveData } from '@whs/core';
import { kv, persistent } from './storage';

export const store = new SaveStore(kv);
const first = store.load();

/** The whole save. Mutate it only through commit(). */
export const save = signal<SaveData>(first.save);
/** Problems found while loading (shown once on the title screen). */
export const loadProblems = signal<string[]>(persistent ? first.problems : [...first.problems, 'This browser is not keeping saves (private mode?)']);

/**
 * Changes the save and writes it. The change works on a copy, so every part of the save that
 * changed is a new object and anything computed from it updates.
 */
export function commit(change: (s: SaveData) => void): void {
  const s = structuredClone(save.value);
  change(s);
  try {
    store.write(s);
  } catch (e) {
    toast(e instanceof StorageFullError ? 'Storage is full: export your save from More, Your save' : 'Could not save just now');
  }
  save.value = s;
}

/** Replaces the whole save (import, restore), with a backup of the current one first. */
export function replaceSave(next: SaveData, reason: string): void {
  store.replace(save.value, next, reason);
  save.value = next;
}

export const settings = computed(() => save.value.settings);
export const activeSlot = computed(() => {
  const r = save.value.roster;
  return r.active != null ? r.slots[r.active] ?? null : null;
});
/** The fighter being played, rebuilt from the save. */
export const activeFighter = computed(() => loadCareer(activeSlot.value, save.value.profile));

// ---------- navigation ----------
export type Tab = 'play' | 'fighter' | 'goals' | 'more';
export type Route = { screen: 'title' } | { screen: 'hub'; tab: Tab };
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

// ---------- feel ----------
export function buzz(ms = 12) {
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
