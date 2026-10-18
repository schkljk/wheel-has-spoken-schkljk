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
import { autopilot } from '../../apps/game/e2e/helpers';

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
  else if (script === 'modes') await modesScript(page);
  else if (script === 'more') await moreScript(page);
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
  await page.getByRole('button', { name: 'Spin the rest' }).click();
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

async function modesScript(page: Page) {
  const kv = careerSaveKV({ seed: 5, lvl: 12, ch: 3, coins: 300, gems: 30, fast: true, auto: true });
  await page.evaluate((s) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, kv);
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await shot(page, 'play');
  await page.getByRole('tab', { name: 'Fighter' }).click();
  await shot(page, 'fighter');
  await page.getByRole('button', { name: /Talents/ }).click();
  await shot(page, 'talents');
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Goals' }).click();
  await shot(page, 'goals');
  await page.getByRole('tab', { name: 'Play' }).click();
  await page.getByRole('button', { name: /daily wheel/ }).click();
  await page.getByRole('button', { name: 'Spin the daily wheel' }).click();
  await page.getByRole('button', { name: 'Home' }).waitFor({ timeout: 30_000 });
  await shot(page, 'daily-wheel');
  await page.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: /Base shop/ }).click();
  await shot(page, 'shop');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Fight club/ }).click();
  await shot(page, 'club');
  await page.locator('.fc-side .btn').first().click();
  await page.getByRole('button', { name: 'Another fight' }).waitFor({ timeout: 60_000 });
  await shot(page, 'club-end');
  await page.getByRole('button', { name: 'Leave' }).click();
  await page.getByRole('button', { name: /Local brawl/ }).click();
  await shot(page, 'bracket');
  await page.getByRole('button', { name: /^Fight / }).click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  await page.locator('.fresult').waitFor({ timeout: 120_000 });
  await shot(page, 'cup-result');
  await page.locator('.fresult .btn').first().click();
  await page.waitForTimeout(800);
  await shot(page, 'cup-after');
}

async function moreScript(page: Page) {
  const kv = careerSaveKV({ seed: 9, lvl: 12, ch: 3, coins: 300, gems: 30, fast: true, auto: true });
  await page.evaluate((s) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, kv);
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  const atHub = async () => (await page.locator('.tabbar').count()) > 0 && (await page.locator('.scrim, .cine').count()) === 0;
  // the gauntlet until it ends
  await page.getByRole('button', { name: /The gauntlet/ }).click();
  await shot(page, 'gauntlet');
  console.log('gauntlet taps', await autopilot(page, atHub, 120));
  await shot(page, 'after-gauntlet');
  const home = async () => {
    if (await atHub()) return;
    await page.reload();
    await page.getByRole('button', { name: 'Play', exact: true }).first().click();
    await autopilot(page, atHub, 20);
  };
  await home();
  // daily challenge
  await page.getByRole('button', { name: /Daily challenge/ }).click();
  console.log('daily taps', await autopilot(page, atHub, 200));
  await shot(page, 'after-daily');
  await home();
  // boss rush until it ends
  await page.getByRole('button', { name: /Boss rush/ }).click();
  console.log('rush taps', await autopilot(page, atHub, 300));
  await shot(page, 'after-rush');
  await home();
  // a whole story chapter
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  const ch = async () => (await page.locator('.maphead small').first().textContent()) || '';
  const start = await ch();
  console.log('story taps', await autopilot(page, async () => (await page.locator('.maphead').count()) > 0 && (await ch()) !== start, 1500));
  await shot(page, 'after-chapter');
}
