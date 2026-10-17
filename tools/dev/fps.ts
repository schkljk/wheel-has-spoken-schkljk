/**
 * Frame rate of a story fight on a mid-range phone profile: Chrome's CPU throttled 4×, a 390×844 screen
 * at 2× density, normal speed with full animation, auto-battle on.
 *   npm run build && npx tsx tools/dev/fps.ts [seconds] [cpu-rate]
 * Prints frames per second, the slowest frames and how busy the main thread was.
 */
import { chromium, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { careerSaveKV } from '../fixtures/career-save';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [secs = '15', rate = '4'] = process.argv.slice(2);
const PORT = 4185;
const server = spawn('npx', ['vite', 'preview', 'apps/game', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });

/** Records every animation frame for `ms` and sums the main thread's busy time over the same window. */
async function measure(page: Page, ms: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const busy = async () => {
    const { metrics } = await cdp.send('Performance.getMetrics');
    return metrics.find((m) => m.name === 'TaskDuration')!.value;
  };
  const b0 = await busy();
  const dts = await page.evaluate(
    (ms) =>
      new Promise<number[]>((done) => {
        const out: number[] = [];
        let last = performance.now();
        const end = last + ms;
        const tick = (t: number) => {
          out.push(t - last);
          last = t;
          if (t < end) requestAnimationFrame(tick);
          else done(out);
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );
  const b1 = await busy();
  dts.shift();
  const total = dts.reduce((a, b) => a + b, 0);
  const sorted = [...dts].sort((a, b) => b - a);
  const low = sorted.slice(0, Math.max(1, Math.floor(dts.length / 100)));
  return {
    fps: +((dts.length / total) * 1000).toFixed(1),
    low1: +(1000 / (low.reduce((a, b) => a + b, 0) / low.length)).toFixed(1),
    over20ms: dts.filter((d) => d > 20).length,
    frames: dts.length,
    mainThreadBusy: `${Math.round(((b1 - b0) / (total / 1000)) * 100)}%`,
  };
}

try {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.route('**/fonts.{googleapis,gstatic}.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  for (let i = 0; i < 50; i++) {
    try {
      await page.goto(`http://localhost:${PORT}/`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  const kv = careerSaveKV({ seed: 4, lvl: 12, ch: 3, auto: true });
  await page.evaluate((s) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, kv);
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.locator('.mnode.now').first().click();
  await page.getByRole('button', { name: 'Spin the arena' }).waitFor();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(rate) });
  console.log(`CPU ${rate}× slower, 390×844 @2×, full animation`);
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  console.log('arena wheel spin', await measure(page, 2500));
  await page.locator('.readpill').waitFor({ timeout: 60_000 });
  console.log('fight on auto  ', await measure(page, Number(secs) * 1000));
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.waitForTimeout(600);
  console.log('fight menu open', await measure(page, 2000));
  console.log('errors:', errors);
  await browser.close();
} finally {
  server.kill();
}
