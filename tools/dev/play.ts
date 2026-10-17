/**
 * Plays the new game headless and takes screenshots, for checking flows by eye.
 *   npm run build && npx tsx tools/dev/play.ts <out-dir> <script> [WxH]
 * Scripts: build (spin a fighter and start the career).
 */
import { chromium, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { careerSaveKV } from '../fixtures/career-save';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [out = resolve(ROOT, 'test-results/play'), script = 'build', size = '390x844'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number) as [number, number];
const PORT = 4181;
mkdirSync(out, { recursive: true });
const server = spawn('npx', ['vite', 'preview', 'apps/game', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
let n = 0;
const shot = async (page: Page, name: string) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${name}.png` });
};
try {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.route('**/fonts.{googleapis,gstatic}.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  for (let i = 0; i < 50; i++) {
    try {
      await page.goto(`http://localhost:${PORT}/?seed=7`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  if (script === 'build') await buildScript(page);
  else await storyScript(page);
  console.log('errors:', errors);
  await browser.close();
} finally {
  server.kill();
}

async function buildScript(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Skip the tour' }).click();
  await shot(page, 'title');
  await page.getByRole('button', { name: 'Spin one' }).first().click();
  await page.getByLabel('Fighter name').fill('Test Hero');
  await shot(page, 'name');
  await page.getByRole('button', { name: 'Spin a new fighter' }).click();
  await shot(page, 'build-start');
  await page.getByRole('button', { name: /^Spin for/ }).click();
  await page.waitForTimeout(5500);
  await shot(page, 'build-landed');
  await page.getByRole('button', { name: 'Spin the rest for me' }).click();
  // spinning the rest goes straight to the finished fighter
  await page.getByRole('button', { name: 'Start their career' }).waitFor({ timeout: 240_000 });
  await shot(page, 'card');
  await page.getByRole('button', { name: 'Start their career' }).click();
  await shot(page, 'hub');
}

async function storyScript(page: Page) {
  const kv = careerSaveKV({ seed: 3, lvl: 3 });
  await page.evaluate((s) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, kv);
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await shot(page, 'hub');
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await shot(page, 'map');
  await page.locator('.mnode.now').first().click();
  await page.waitForTimeout(800);
  await shot(page, 'arena');
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  await page.locator('.readpill').waitFor({ timeout: 60_000 });
  await shot(page, 'fight');
  await page.getByRole('button', { name: 'Spin your move' }).click();
  await page.waitForTimeout(1200);
  await shot(page, 'fight-spin');
  await page.waitForTimeout(2500);
  await shot(page, 'fight-anim');
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await shot(page, 'menu');
  await page.getByRole('switch', { name: /Auto-battle/ }).click();
  await page.keyboard.press('Escape');
  await page.locator('.fresult').waitFor({ timeout: 180_000 });
  await page.waitForTimeout(800);
  await shot(page, 'result');
  await page.locator('.fresult .btn').first().click();
  await page.waitForTimeout(600);
  await shot(page, 'after');
}
