import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deserFighter, migrate, numStats } from '@whs/core';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { legacySave, open, watchErrors } from './helpers';

const skipTour = (page: Page) => page.getByRole('button', { name: 'Skip the tour' }).click();
const confirmLoad = (page: Page) => page.getByRole('alertdialog').getByRole('button', { name: /^Load / }).click();
const openSave = async (page: Page) => {
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.getByRole('button', { name: 'Your save and backups' }).click();
};

test('first launch: the tour, once', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page);
  for (const title of ['Spin a fighter', 'Play the story', 'Fight with the combat wheel']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByText('Twenty chapters in two acts')).toHaveCount(0);
  await page.getByRole('button', { name: "Let's go" }).click();
  await expect(page.getByText('Your fighters')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Spin a fighter' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("brings over the old version's save from the same site, without touching it", async ({ page }) => {
  const errors = watchErrors(page);
  const txt = legacySave();
  await open(page, { 'wheel-has-spoken-v1': txt });
  await skipTour(page);
  await expect(page.getByText('Found your save from the old version')).toBeVisible();
  await page.getByRole('button', { name: 'Bring it over' }).click();
  await expect(page.getByRole('alertdialog').getByText(/3 fighters: /)).toBeVisible();
  await confirmLoad(page);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(3);
  expect(await page.evaluate(() => localStorage.getItem('wheel-has-spoken-v1'))).toBe(txt);
  // it stays after a reload, and the offer is gone
  await page.reload();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(3);
  await expect(page.getByText('Found your save from the old version')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the Fighter tab shows the engine numbers', async ({ page }) => {
  await open(page, { 'wheel-has-spoken-v1': legacySave() });
  await skipTour(page);
  await page.getByRole('button', { name: 'Bring it over' }).click();
  await confirmLoad(page);
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Fighter' }).click();
  const s = migrate(legacySave());
  const ns = numStats(deserFighter(s.roster.slots[0]!.career)!, { patch: s.profile.patch });
  const stat = (label: string) => page.locator('.nb-i', { hasText: label }).locator('b');
  await expect(stat('HP')).toHaveText(String(ns.hp));
  await expect(stat('Attack')).toHaveText(String(ns.atk));
  await expect(stat('Defense')).toHaveText(String(ns.def));
  await expect(stat('Crit')).toHaveText(`${ns.crit}%`);
});

test('paste a save; junk is refused', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page);
  await skipTour(page);
  await openSave(page);
  await page.getByRole('button', { name: 'Paste save text' }).click();
  await page.getByLabel('Save text').fill('definitely not a save');
  await page.getByRole('button', { name: 'Load this save' }).click();
  await expect(page.getByText("That doesn't look like a save from this game")).toBeVisible();
  await page.getByLabel('Save text').fill('\n  ' + legacySave() + '  ');
  await page.getByRole('button', { name: 'Load this save' }).click();
  await confirmLoad(page);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('a backup file survives erasing everything; automatic backups restore', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, { 'wheel-has-spoken-v1': legacySave() });
  await skipTour(page);
  await page.getByRole('button', { name: 'Bring it over' }).click();
  await confirmLoad(page);
  await openSave(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save a backup file' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^wheel-has-spoken-\d{4}-\d{2}-\d{2}\.json$/);
  const file = await dl.path();
  const exported = JSON.parse(readFileSync(file, 'utf8')) as { game: string; roster: { slots: unknown[] } };
  expect(exported.game).toBe('wheel-has-spoken');
  expect(exported.roster.slots.filter(Boolean)).toHaveLength(3);
  // erase, with a confirmation
  await page.getByRole('button', { name: 'Erase everything' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Erase everything' }).click();
  await expect(page.getByText('Empty slot')).toHaveCount(3);
  // load the file back
  await openSave(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Load a backup file' }).click()]);
  await chooser.setFiles(file);
  await confirmLoad(page);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(3);
  // the erase made a backup: restoring it gives the same fighters
  await openSave(page);
  await expect(page.getByText('Before erasing everything')).toBeVisible();
  await page.locator('.card', { hasText: 'Before erasing everything' }).getByRole('button', { name: 'Restore' }).click();
  await confirmLoad(page);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('settings stick and change the page', async ({ page }) => {
  await open(page);
  await skipTour(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  const sound = page.getByRole('switch', { name: /^Sound/ });
  await expect(sound).toHaveAttribute('aria-checked', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('group', { name: 'Text size' }).getByRole('button', { name: 'Large' }).click();
  await page.getByRole('group', { name: 'Animations' }).getByRole('button', { name: 'Calm' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('switch', { name: /^Sound/ })).toHaveAttribute('aria-checked', 'false');
});

test("today's ranked pool builds in a worker and is cached", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await open(page, { 'wheel-has-spoken-v1': legacySave() });
  await skipTour(page);
  await page.getByRole('button', { name: 'Bring it over' }).click();
  await confirmLoad(page);
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'More' }).click();
  await expect(page.getByText("today's 1,000 are ranked")).toBeVisible({ timeout: 90_000 });
  const cached = await page.evaluate(() => JSON.parse(localStorage.getItem('whs:pool') || 'null') as { ranking: { order: number[] } } | null);
  expect(cached?.ranking.order).toHaveLength(1000);
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'More' }).click();
  await expect(page.getByText("today's 1,000 are ranked")).toBeVisible({ timeout: 2000 });
  expect(errors).toEqual([]);
});

test('a damaged save comes back from its backup, and the player is told', async ({ page }) => {
  const errors = watchErrors(page);
  const kv = careerSaveKV({ seed: 31, name: 'Backup Bob', lvl: 6 });
  expect(Object.keys(kv).some((k) => k.startsWith('whs:backup:'))).toBe(true);
  // the records section got cut off mid-write
  kv['whs:profile'] = kv['whs:profile']!.slice(0, 20);
  await open(page, kv);
  await expect(page.getByText('About your save')).toBeVisible();
  await expect(page.getByText(/Restored the backup/)).toBeVisible();
  await expect(page.getByText('Backup Bob').first()).toBeVisible();
  expect(errors).toEqual([]);
});
