import { expect, test } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { layoutProblems, open, watchErrors } from './helpers';

// The sound pass: the theme starts with the first tap, the volumes stick, and the sound test page plays every
// sound and fits the screen.
const playing = (page: import('@playwright/test').Page) => page.evaluate(() => (globalThis as unknown as { __whsMusic: { playing: () => string | null } }).__whsMusic.playing());

test('the theme starts with the first tap, and the volumes stick', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 4, lvl: 12, ch: 3 }));
  // no sound before a tap (browsers would refuse it anyway)
  expect(await playing(page)).toBeNull();
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await expect.poll(() => playing(page)).toBe('theme');
  const fx = page.locator('.slider', { hasText: 'Effects' }).locator('input');
  const music = page.locator('.slider', { hasText: 'Music' }).locator('input');
  await expect(fx).toHaveValue('80');
  await expect(music).toHaveValue('55');
  await fx.fill('40');
  await music.fill('20');
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await expect(page.locator('.slider', { hasText: 'Effects' }).locator('input')).toHaveValue('40');
  await expect(page.locator('.slider', { hasText: 'Music' }).locator('input')).toHaveValue('20');
  // switching music off hides its slider
  await page.getByRole('switch', { name: /^Music/ }).click();
  await expect(page.locator('.slider', { hasText: 'Music' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const [width, height] of [
  [320, 568],
  [844, 390],
] as const) {
  test(`the sound test page plays every kind of sound and fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = watchErrors(page);
    await open(page);
    await page.getByRole('button', { name: 'Settings' }).first().click();
    await page.getByRole('button', { name: 'Sound test' }).click();
    for (const g of ['Music', 'Weapons', 'Powers', 'Fight', 'Wheels', 'Menus', 'Story']) await expect(page.locator('.st-h', { hasText: g })).toHaveCount(1);
    const p = await layoutProblems(page);
    expect(p.clipped).toEqual([]);
    expect(p.pageScrolls).toBe(false);
    for (const name of ['Bow: swing', 'Frying pan: hit', 'Fire: hit', 'Absurd luck: hit', 'Win fanfare', 'Landed: goated', 'Level up', 'Boss appears']) await page.getByRole('button', { name, exact: true }).click();
    // the music buttons switch between tracks
    await page.getByRole('button', { name: /an arena$/ }).click();
    await expect.poll(() => playing(page)).toBe('arena:colosseum');
    await page.getByRole('button', { name: /boss phase two$/ }).click();
    await expect.poll(() => playing(page)).toMatch(/^phase:/);
    // closing the page brings the theme back
    await page.keyboard.press('Escape');
    await expect.poll(() => playing(page)).toBe('theme');
    expect(errors).toEqual([]);
  });
}
