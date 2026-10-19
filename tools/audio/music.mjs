// Renders the music offline in Chromium (the game's own sequencer and synth): prints each track's length,
// peak and RMS, and with --wav saves a preview of each (mono, 22 kHz) next to the given folder.
// Needs the game served (npx vite preview apps/game --port 4173). Usage: node tools/audio/music.mjs [--wav dir]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const i = process.argv.indexOf('--wav');
const dir = i > 0 ? process.argv[i + 1] : null;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
await page.goto('http://localhost:4173/');
await page.waitForFunction(() => globalThis.__whsMusic);
const db = (x) => (20 * Math.log10(x)).toFixed(1);
for (const id of ['theme', 'arena', 'phase']) {
  const r = await page.evaluate(([id, wav]) => globalThis.__whsMusic.measure(id, wav), [id, !!dir]);
  console.log(id.padEnd(8), `${r.seconds.toFixed(1)}s`, 'peak', db(r.peak), 'dB', 'rms', db(r.rms), 'dB');
  if (dir && r.wav) writeFileSync(`${dir}/${id}.wav`, Buffer.from(r.wav, 'base64'));
}
await browser.close();
