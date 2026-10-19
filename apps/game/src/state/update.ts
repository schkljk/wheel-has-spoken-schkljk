import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';

/**
 * New versions (review G3). The service worker keeps the running version's files until the player taps
 * Update, instead of swapping them out under a running game: lazy screens and Pixi's renderer stay loadable
 * for the whole session. A screen whose file is gone anyway (no service worker, or a version change mid-load)
 * reloads the page once instead of hanging.
 */
export const updateReady = signal(false);
let apply: ((reload?: boolean) => Promise<void>) | null = null;

/** A failed lazy import: the file belongs to a version that is no longer on the server. */
const stale = (e: unknown) => /dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(String((e as Error)?.message ?? e));

const KEY = 'whs:reloaded';
function reloadOnce() {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    // no session storage: still reload, the timestamp just can't guard a loop
  }
  // tried a moment ago and it's still missing: don't loop
  if (Date.now() - last < 30_000) return;
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // ignore
  }
  location.reload();
}

export function installUpdates() {
  apply = registerSW({ onNeedRefresh: () => (updateReady.value = true) });
  addEventListener('vite:preloadError', (ev) => {
    ev.preventDefault();
    reloadOnce();
  });
  addEventListener('unhandledrejection', (ev) => {
    if (stale(ev.reason)) reloadOnce();
  });
}

/** Swaps in the waiting version and reloads (the save is written on every action, so nothing is lost). */
export function updateNow() {
  if (apply) void apply(true);
  else location.reload();
}
