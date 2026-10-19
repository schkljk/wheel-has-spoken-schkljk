import { expect, test } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { open, watchErrors } from './helpers';

// Performance review round 2 (J1, J6, J7): guards against the costs coming back.

test('building a fighter only resizes the wheel canvas when its box really changes (J1)', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  // count real size changes of WebGL canvases on the page
  await page.addInitScript(() => {
    const w = window as unknown as { __glResize: number };
    w.__glResize = 0;
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement & { __gl?: boolean }, t: string, ...r: unknown[]) {
      if (/webgl/.test(t)) this.__gl = true;
      return (gc as (...a: unknown[]) => RenderingContext | null).call(this, t, ...r);
    } as typeof gc;
    for (const k of ['width', 'height'] as const) {
      const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k)!;
      Object.defineProperty(HTMLCanvasElement.prototype, k, {
        configurable: true,
        get: d.get,
        set(this: HTMLCanvasElement & { __gl?: boolean }, v: number) {
          if (this.__gl && this.isConnected && d.get!.call(this) !== v) w.__glResize++;
          d.set!.call(this, v);
        },
      });
    }
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, { 'whs:seed': '7' });
  await page.getByRole('button', { name: 'Spin one' }).first().click();
  await page.getByRole('button', { name: 'Spin a new fighter' }).click();
  await page.locator('.pixiwheel canvas').waitFor();
  await page.getByRole('button', { name: 'Spin the rest' }).click();
  await page.getByRole('button', { name: 'Start their career' }).waitFor({ timeout: 150_000 });
  // about two dozen wheels: it was 36 resizes (twice a spin), now only when the odds row changes its height
  expect(await page.evaluate(() => (window as unknown as { __glResize: number }).__glResize)).toBeLessThan(12);
  expect(errors).toEqual([]);
});

test('hub icons are images, not SVGs full of rects (J6)', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 4, lvl: 12, ch: 3 }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.locator('.tabbar').waitFor();
  const r = await page.evaluate(() => ({ all: document.querySelectorAll('*').length, rects: document.querySelectorAll('.pxi rect').length, icons: document.querySelectorAll('img.pxi[data-i]').length }));
  expect(r.rects).toBe(0);
  expect(r.icons).toBeGreaterThan(10);
  // 2,256 elements before, 2,073 of them icon pixels
  expect(r.all).toBeLessThan(800);
  // icons with a label keep it as their accessible name
  await expect(page.getByRole('tab', { name: 'Goals' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the music plays as one looping buffer, not note by note (J7)', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __liveNotes: number; __loops: number };
    w.__liveNotes = 0;
    w.__loops = 0;
    const p = BaseAudioContext.prototype;
    const osc = p.createOscillator;
    p.createOscillator = function (this: BaseAudioContext) {
      if (!(this instanceof OfflineAudioContext)) w.__liveNotes++;
      return osc.call(this);
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (this: AudioBufferSourceNode, ...a: Parameters<AudioBufferSourceNode['start']>) {
      if (this.loop && this.buffer && this.buffer.duration > 20) w.__loops++;
      return start.apply(this, a);
    };
  });
  await open(page, careerSaveKV({ seed: 4, lvl: 12, ch: 3 }));
  await page.getByRole('button', { name: 'Settings' }).first().click();
  const playing = () => page.evaluate(() => (globalThis as unknown as { __whsMusic: { playing: () => string | null } }).__whsMusic.playing());
  await expect.poll(playing).toBe('theme');
  // the theme's loop (about 51 s) is rendered once sound is allowed, then starts
  await expect.poll(() => page.evaluate(() => (window as unknown as { __loops: number }).__loops), { timeout: 90_000 }).toBe(1);
  await page.keyboard.press('Escape');
  const n0 = await page.evaluate(() => (window as unknown as { __liveNotes: number }).__liveNotes);
  await page.waitForTimeout(3000);
  // the live scheduler made several oscillators every second; a buffer loop makes none (button sounds aside)
  const n1 = await page.evaluate(() => (window as unknown as { __liveNotes: number }).__liveNotes);
  expect(n1 - n0).toBeLessThan(5);
  expect(errors).toEqual([]);
});
