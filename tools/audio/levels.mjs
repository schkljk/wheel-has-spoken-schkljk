// The loudness check: renders every sound effect offline in Chromium (the game's own synth) and prints its
// peak and RMS, loudest first, so levels can be balanced without ears. Needs the game served (npx vite preview
// apps/game --port 4173). Usage: node tools/audio/levels.mjs [url]
import { chromium } from '@playwright/test';

const url = process.argv[2] || 'http://localhost:4173/';
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
await page.goto(url);
await page.waitForFunction(() => globalThis.__whsSfx);
const rows = await page.evaluate(async () => {
  const S = globalThis.__whsSfx;
  const out = [];
  for (const n of S.names()) out.push(await S.measure(n));
  return out;
});
await browser.close();
const db = (x) => (x > 0 ? (20 * Math.log10(x)).toFixed(1) : '-inf');
rows.sort((a, b) => b.rms - a.rms);
console.log('sound'.padEnd(20), 'len'.padStart(5), 'peak dB'.padStart(8), 'rms dB'.padStart(8));
for (const r of rows) console.log(r.name.padEnd(20), r.len.toFixed(2).padStart(5), db(r.peak).padStart(8), db(r.rms).padStart(8));
const hot = rows.filter((r) => r.peak > 0.9);
console.log(hot.length ? `\nclipping risk (peak > 0.9): ${hot.map((r) => r.name).join(', ')}` : '\nno sound peaks above 0.9');
