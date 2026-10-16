import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Builds legacy/src/core_new.js once, before test workers start: several parity suites load it
// in parallel, and racing builds could hand one of them a half-written file.
export default function setup() {
  const src = resolve(dirname(fileURLToPath(import.meta.url)), '../../legacy/src');
  execFileSync('python3', ['build_core.py'], { cwd: src, stdio: 'ignore' });
}
