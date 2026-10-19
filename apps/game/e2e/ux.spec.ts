import { expect, test } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { layoutProblems, open, smallTargets, watchErrors } from './helpers';

// Upgrades 32, 34 and 35: tab dots, story map previews, and undo for gear swaps.
test('a gear swap can be undone for three seconds', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, careerSaveKV({ seed: 9, lvl: 8, compare: true }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Fighter' }).click();
  await page.getByRole('button', { name: /Armory/ }).click();
  await page.locator('.arm-slot').first().click();
  await page.getByRole('button', { name: 'Wear', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Wear it' }).click();
  await expect(page.locator('.shopitem').filter({ hasText: 'Knight plate ✓' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText(/Leather vest is back on/)).toBeVisible();
  await expect(page.locator('.shopitem').filter({ hasText: 'Leather vest ✓' })).toHaveCount(1);
  // and it goes away by itself
  await page.getByRole('button', { name: 'Take off' }).click();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo' })).toHaveCount(0, { timeout: 5000 });
  expect(errors).toEqual([]);
});

test('any step on the story map can be previewed; the boss shows its recommended level', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, careerSaveKV({ seed: 4, lvl: 6, ch: 3, row: 1 }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Continue the story/ }).click();
  await expect(page.locator('.mn-lv')).toHaveText(/^Lv \d+$/);
  await page.locator('.mnode.later.t-boss').click();
  await expect(page.getByText(/^Recommended level \d+\. You are level 6/)).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.keyboard.press('Escape');
  await page.locator('.mnode.chosen, .mnode.skipped').first().click();
  await expect(page.locator('.np-lines li').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('tabs get a dot when something new waits there', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 4, lvl: 6 }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Goals' }).click();
  // the daily wheel is ready, so Play has a dot while you're elsewhere
  await expect(page.getByRole('tab', { name: /^Play\b.*something new/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /^Goals\b.*something new/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('G9: every fight button and chip takes a full thumb', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, { ...careerSaveKV({ seed: 3, lvl: 30, ch: 1, row: 0 }), 'whs:seed': 'thumbs' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  const begin = page.getByRole('button', { name: 'Begin' });
  if (await begin.isVisible().catch(() => false)) await begin.click();
  await page.locator('.mnode.now.t-fight').first().click();
  await expect(page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ })).toBeEnabled({ timeout: 60_000 });
  for (const [width, height] of [[390, 844], [320, 568], [844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    expect(await smallTargets(page, '.cw-chips .fchip, .fhit'), `${width}x${height}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});
