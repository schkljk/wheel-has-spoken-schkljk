// Checks that the theme loops without a seam: renders it twice in a row (the way the game plays it), compares
// the join with the bar lines inside the song, and saves one pass that loops gaplessly as a WAV.
// Needs the game served. Usage: node tools/audio/seam.mjs [out.wav] [url]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const out = process.argv[2];
const url = process.argv[3] || 'http://localhost:4173/';
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
await page.goto(url);
await page.waitForFunction(() => globalThis.__whsMusic);
const r = await page.evaluate(() => globalThis.__whsMusic.seam());
await browser.close();
console.log(`loop: ${r.loopSeconds.toFixed(3)} s`);
console.log(`level change across the loop point: ${r.seamLevelChangeDb.toFixed(2)} dB`);
console.log(`level change across bar lines inside the song: median ${r.barLevelChangeDb.median.toFixed(2)} dB, largest ${r.barLevelChangeDb.max.toFixed(2)} dB`);
console.log(`biggest sample jump at the loop point: ${r.jumpAtSeam.toFixed(4)} (anywhere: ${r.jumpAnywhere.toFixed(4)})`);
if (out) {
  writeFileSync(out, Buffer.from(r.wav, 'base64'));
  console.log('saved', out);
}
