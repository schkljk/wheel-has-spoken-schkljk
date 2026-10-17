/**
 * Frame budget of a story fight on a mid-range phone profile: Chrome's CPU throttled 4×, a 390×844 screen at
 * 2× density, normal speed with full animation, auto-battle on.
 *   npm run build && npx tsx tools/dev/fps.ts [seconds] [cpu-rate]
 *
 * Prints the frame rate this machine reached and, more useful, how long each frame's Pixi work took on the
 * main thread (updates and draw calls). 60 fps needs that under 16.7 ms. On a machine without a GPU the
 * frame rate itself is capped by software drawing (even a static page can't reach 60), so the work per frame
 * is what tells whether a phone with a GPU will keep up.
 */
import { chromium, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { careerSaveKV } from '../fixtures/career-save';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [secs = '15', rate = '4'] = process.argv.slice(2);
const PORT = 4185;
const server = spawn('npx', ['vite', 'preview', 'apps/game', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });

const q = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? +s[Math.min(s.length - 1, Math.floor(p * s.length))]!.toFixed(1) : 0;
};

/** Counts animation frames for `ms` and collects the Pixi work of every frame in that window. */
async function measure(page: Page, ms: number) {
  await page.evaluate(() => {
    // emptied in place: running Pixi apps hold on to these arrays
    const w = window as unknown as { __pixiFrames?: number[]; __long?: number[] };
    (w.__pixiFrames ??= []).length = 0;
    (w.__long ??= []).length = 0;
  });
  const frames = await page.evaluate(
    `new Promise((done) => {
      let n = 0;
      const t0 = performance.now();
      const tick = (t) => (++n, t - t0 < ${ms} ? requestAnimationFrame(tick) : done({ n, t: t - t0 }));
      requestAnimationFrame(tick);
    })`,
  );
  const { n, t } = frames as { n: number; t: number };
  const { work, long } = await page.evaluate(() => {
    const w = window as unknown as { __pixiFrames: number[]; __long: number[] };
    return { work: w.__pixiFrames, long: w.__long };
  });
  return {
    fpsHere: +((n / t) * 1000).toFixed(1),
    pixiMsMedian: q(work, 0.5),
    pixiMs95: q(work, 0.95),
    pixiMsMax: q(work, 1),
    framesOver16ms: work.filter((x) => x > 16.7).length,
    frames: work.length,
    longTasks: long.length,
  };
}

try {
  // GPU-style compositing even on a software GPU, so Chrome doesn't read every WebGL frame back on the main thread
  const args = process.env.CHROME_ARGS ?? '--ignore-gpu-blocklist --enable-gpu-rasterization --enable-unsafe-swiftshader --use-angle=swiftshader';
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: args.split(' ').filter(Boolean) });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // tsx names inline functions with a helper the page doesn't have
  await page.addInitScript('window.__name = (f) => f');
  // main-thread tasks over 50 ms (menus, screens): these drop frames whatever the GPU
  await page.addInitScript(() => {
    const w = window as unknown as { __long: number[] };
    w.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long.push(e.duration))).observe({ type: 'longtask', buffered: false });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.route('**/fonts.{googleapis,gstatic}.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  for (let i = 0; i < 50; i++) {
    try {
      await page.goto(`http://localhost:${PORT}/?perf`);
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
  console.log(`CPU ${rate}× slower, 390×844 at 2×, full animation`);
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  console.log('arena wheel spin', await measure(page, 2500));
  await page.locator('.fhud').waitFor({ timeout: 120_000 });
  if (process.env.TRACE) await browser.startTracing(page, { path: process.env.TRACE, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'gpu', 'toplevel'] });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  const ms = Number(secs) * 1000;
  console.log('fight on auto  ', await measure(page, ms));
  if (process.env.TRACE) await browser.stopTracing();
  const { profile } = await cdp.send('Profiler.stop');
  if (process.env.PROFILE) writeFileSync(process.env.PROFILE, JSON.stringify(profile));
  // sampled JavaScript time (the game, Pixi and Preact), apart from idle and the browser's own work
  const byNode = new Map(profile.nodes.map((n) => [n.id, n.callFrame.functionName]));
  let js = 0;
  profile.samples!.forEach((id, i) => {
    if (!['(idle)', '(program)', '(garbage collector)'].includes(byNode.get(id)!)) js += profile.timeDeltas![i]!;
  });
  console.log(`JavaScript during the fight: ${Math.round(js / 1000)} ms in ${ms / 1000} s (${((js / 1000 / ms) * 100).toFixed(1)}% of the main thread)`);
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.waitForTimeout(600);
  console.log('fight menu open', await measure(page, 2000));
  console.log('errors:', errors);
  await browser.close();
} finally {
  server.kill();
}
