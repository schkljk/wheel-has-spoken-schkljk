import { signal } from '@preact/signals';
import { TIPS, type TipKey } from '@whs/core';
import { commit, settings } from './game';
import { kv } from './storage';

/**
 * First-time tips (upgrade 31): each system explains itself once, the first time it shows up. Tests switch them
 * off with the `whs:notips` key, like `whs:seed`.
 */
export const tipNow = signal<TipKey | null>(null);
const queue: TipKey[] = [];
const off = (() => {
  try {
    return kv.getItem('whs:notips') === '1';
  } catch {
    return false;
  }
})();

export function tip(k: TipKey) {
  const s = settings.value;
  if (off || !TIPS[k] || s.tips === false || (s.tipsSeen || []).includes(k) || tipNow.value === k || queue.includes(k)) return;
  if (tipNow.value) queue.push(k);
  else tipNow.value = k;
}
/** "Got it": this one is never shown again. */
export function dismissTip() {
  const k = tipNow.value;
  if (k) commit((s) => (s.settings.tipsSeen = [...new Set([...(s.settings.tipsSeen || []), k])]));
  tipNow.value = queue.shift() ?? null;
}
/** "No more tips": switched off in settings (and back on there any time). */
export function noMoreTips() {
  commit((s) => (s.settings.tips = false));
  queue.length = 0;
  tipNow.value = null;
}
