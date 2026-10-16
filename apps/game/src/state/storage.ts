import type { KV } from '@whs/core';

/** localStorage when the browser allows it (private modes may not), memory otherwise. */
function pickKV(): { kv: KV; persistent: boolean } {
  try {
    const ls = window.localStorage;
    const probe = '__whs_probe';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return { kv: ls, persistent: true };
  } catch {
    const m = new Map<string, string>();
    return {
      kv: { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) },
      persistent: false,
    };
  }
}
export const { kv, persistent } = pickKV();
