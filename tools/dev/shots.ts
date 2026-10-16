/**
 * Screenshots of the new game's screens, for checking the design by eye.
 *   npm run build && npx tsx tools/dev/shots.ts <out-dir> [WxH ...]
 * Seeds the save from the played legacy fixture, so every screen has content.
 */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [out = resolve(ROOT, 'test-results/shots'), ...sizes] = process.argv.slice(2);
const VIEWS = (sizes.length ? sizes : ['390x844']).map((s) => s.split('x').map(Number) as [number, number]);
const PORT = 4180;
mkdirSync(out, { recursive: true });

const server = spawn('npx', ['vite', 'preview', 'apps/game', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
const legacy = readFileSync(resolve(ROOT, 'packages/core/test/fixtures/legacy-played.json'), 'utf8');

try {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  for (const [w, h] of VIEWS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
    for (let i = 0; i < 50; i++) {
      try {
        await page.goto(`http://localhost:${PORT}/`);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    const shot = async (name: string) => {
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/${w}x${h}-${name}.png` });
    };
    // first launch: tutorial
    await shot('0-tutorial');
    // the old version's save is on the same site
    await page.evaluate((txt) => {
      localStorage.clear();
      localStorage.setItem('wheel-has-spoken-v1', txt);
    }, legacy);
    await page.reload();
    await page.getByRole('button', { name: 'Skip the tour' }).click();
    await shot('1-title-offer');
    await page.getByRole('button', { name: 'Bring it over' }).first().click();
    await shot('2-confirm');
    await page.getByRole('button', { name: /^Load / }).click();
    await shot('3-title');
    await page.getByRole('button', { name: 'Play', exact: true }).first().click();
    await shot('4-play');
    for (const t of ['Fighter', 'Goals', 'More']) {
      await page.getByRole('tab', { name: t }).click();
      await shot(`5-${t.toLowerCase()}`);
    }
    await page.getByRole('button', { name: /^Settings/ }).last().click();
    await shot('6-settings');
    await page.getByRole('button', { name: 'Your save and backups' }).click();
    await shot('7-save');
    await page.close();
  }
  await browser.close();
} finally {
  server.kill();
}
console.log('screenshots in', out);
