import { signal } from '@preact/signals';
import { kv } from './storage';

/**
 * The hidden error log (upgrade 45): uncaught errors, failed promises and console errors, the last 60, kept on
 * this device (not in the save). Settings shows a small badge when there is something in it.
 */
export interface LoggedError {
  /** when (ms) */
  t: number;
  where: string;
  msg: string;
  stack?: string;
  /** the same error again right after */
  n?: number;
}
const KEY = 'whs:errlog';
const MAX = 60;
function read(): LoggedError[] {
  try {
    const v = JSON.parse(kv.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export const errLog = signal<LoggedError[]>(read());

export function logError(where: string, err: unknown) {
  const e = err instanceof Error ? err : null;
  const msg = (e ? `${e.name}: ${e.message}` : String(err)).slice(0, 300);
  const stack = e?.stack?.split('\n').slice(1, 7).join('\n');
  const list = [...errLog.value];
  const last = list[list.length - 1];
  if (last && last.msg === msg && last.where === where) last.n = (last.n || 1) + 1;
  else list.push({ t: Date.now(), where, msg, ...(stack ? { stack } : {}) });
  errLog.value = list.slice(-MAX);
  try {
    kv.setItem(KEY, JSON.stringify(errLog.value));
  } catch {
    // a full storage shouldn't make things worse
  }
}
export function clearErrors() {
  errLog.value = [];
  try {
    kv.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

/** Catches what would otherwise only reach the browser console. */
export function installErrorLog() {
  addEventListener('error', (ev) => logError('page', ev.error ?? ev.message));
  addEventListener('unhandledrejection', (ev) => logError('promise', ev.reason));
  const orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    logError('console', args.find((a) => a instanceof Error) ?? args.map(String).join(' '));
    orig(...args);
  };
}
