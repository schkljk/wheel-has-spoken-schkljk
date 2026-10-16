import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import type { Rng } from '../../packages/core/src';

const LEGACY_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../legacy/src');
const CORE_FILE = resolve(LEGACY_SRC, 'core_new.js');

/** Builds legacy/src/core_new.js from the legacy sources if it is missing. */
export function ensureLegacyCore(): string {
  if (!existsSync(CORE_FILE)) execFileSync('python3', ['build_core.py'], { cwd: LEGACY_SRC, stdio: 'ignore' });
  return readFileSync(CORE_FILE, 'utf8');
}

export interface LegacyCore {
  /** Look up any top-level binding (function, const or let) of the legacy core. */
  get<T = unknown>(name: string): T;
  /** Replace the random source used by the legacy code from now on. */
  setRng(rng: Rng): void;
}

/** Loads the legacy core into an isolated vm context whose Math.random is `rng`. */
export function loadLegacyCore(rng: Rng): LegacyCore {
  const ctx = vm.createContext({ console });
  const setRng = (r: Rng) => {
    ctx.__rng = r;
  };
  setRng(rng);
  vm.runInContext('Math.random = () => __rng();', ctx);
  vm.runInContext(ensureLegacyCore(), ctx, { filename: 'core_new.js' });
  return {
    // Evaluating a bare identifier in the same context sees global const/let bindings too.
    get: <T>(name: string) => vm.runInContext(name, ctx) as T,
    setRng,
  };
}
