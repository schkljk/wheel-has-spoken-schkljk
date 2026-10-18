import { expect, test } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { layoutProblems, open, watchErrors } from './helpers';

// Upgrade 30: filters and search in the armory and the collection.
test('armory search and filters: by name, slot and set, then back to the slots', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, careerSaveKV({ seed: 9, lvl: 8, compare: true }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Fighter' }).click();
  await page.getByRole('button', { name: /Armory/ }).click();
  await page.getByRole('searchbox', { name: 'Search your gear' }).fill('knight');
  await expect(page.getByText('Matching pieces (4 of 5)')).toBeVisible();
  await page.getByRole('button', { name: /^Filters/ }).click();
  await page.getByRole('group', { name: 'Slot' }).getByRole('button', { name: 'Helmet' }).click();
  await expect(page.getByText('Matching pieces (1 of 5)')).toBeVisible();
  await expect(page.locator('.shopitem')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Filters \(1\)/ })).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.getByRole('searchbox', { name: 'Search your gear' }).fill('nothing like this');
  await expect(page.getByText(/Nothing matches/)).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.arm-slot')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('collection search and filters: found, missing, tier and category', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, careerSaveKV({ seed: 9, lvl: 8, seen: true }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'More' }).click();
  await page.getByRole('button', { name: /Collection/ }).click();
  await page.getByRole('button', { name: /^Filters/ }).click();
  const show = page.getByRole('group', { name: 'Show' });
  await show.getByRole('button', { name: 'Still missing' }).click();
  await expect(page.locator('.cx-cat:not(.cx-season) .tile:not(.unk)')).toHaveCount(0);
  await show.getByRole('button', { name: 'Found' }).click();
  await expect(page.locator('.cx-cat .tile.unk')).toHaveCount(0);
  expect(await page.locator('.cx-cat:not(.cx-season) .tile').count()).toBeGreaterThanOrEqual(6);
  await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Races', exact: true }).click();
  await expect(page.locator('.cx-cat:not(.cx-season)')).toHaveCount(1);
  await expect(page.locator('.cx-cat h3').first()).toContainText('Races');
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.setViewportSize({ width: 667, height: 375 });
  expect((await layoutProblems(page)).clipped).toEqual([]);
  expect((await layoutProblems(page)).pageScrolls).toBe(false);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole('searchbox', { name: 'Search the collection' }).fill('zzzz qqqq');
  await expect(page.getByText(/Nothing matches/)).toBeVisible();
  expect(errors).toEqual([]);
});
