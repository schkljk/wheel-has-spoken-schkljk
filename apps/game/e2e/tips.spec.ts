import { expect, test } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { layoutProblems, open, watchErrors } from './helpers';

// Upgrade 31: no tour up front; each system explains itself once, the first time it shows up.
test('first launch has no tour; the tour is still in More', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, { 'whs:notips': '0' });
  await expect(page.getByRole('button', { name: 'Skip the tour' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Spin one' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('a tip shows once, the first time; "No more tips" stops them', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, { ...careerSaveKV({ seed: 9, lvl: 8, compare: true }), 'whs:notips': '0' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Fighter' }).click();
  await page.getByRole('button', { name: /Armory/ }).click();
  const card = page.getByRole('dialog', { name: 'The armory' });
  await expect(card).toBeVisible();
  await expect(card.getByText(/Swap any time/)).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await card.getByRole('button', { name: 'Got it' }).click();
  await expect(card).toHaveCount(0);
  // not again
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Armory/ }).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('dialog', { name: 'The armory' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  // the next new thing has its own, until tips are switched off
  await page.getByRole('button', { name: /^Talents/ }).click();
  await expect(page.getByRole('dialog', { name: 'Talents' })).toBeVisible();
  await page.getByRole('dialog', { name: 'Talents' }).getByRole('button', { name: 'No more tips' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Play' }).click();
  await page.getByRole('button', { name: /Fight club/ }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('.tipcard')).toHaveCount(0);
  expect(errors).toEqual([]);
});
