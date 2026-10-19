import { expect, test, type Page } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { autopilot, open, watchErrors } from './helpers';

// Phase 3 acceptance: every way to play runs end to end with no console errors.
// Fights run on auto-battle and reduced motion keeps them quick.
test.describe.configure({ timeout: 300_000 });
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const atHub = (page: Page) => async () => (await page.locator('.tabbar').count()) > 0 && (await page.locator('.scrim, .cine').count()) === 0;
async function start(page: Page, o: Parameters<typeof careerSaveKV>[0], pin?: string) {
  // `pin` fixes the game's dice, for a mode whose length would otherwise change from run to run
  await open(page, { ...careerSaveKV({ auto: true, fast: true, coins: 200, ...o }), ...(pin ? { 'whs:seed': pin } : {}) });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.locator('.tabbar').waitFor();
}

test('a whole story chapter, boss included', async ({ page }) => {
  const errors = watchErrors(page);
  await start(page, { seed: 21, lvl: 14 });
  await page.getByRole('button', { name: /Start the chapter/ }).click();
  const chapter = () => page.locator('.maphead small').first().textContent();
  await autopilot(page, async () => (await page.locator('.maphead').count()) > 0, 10, { stop: '.maphead' });
  const first = await chapter();
  // fights are skipped from the fight menu here: the other modes watch theirs play out
  const taps = await autopilot(page, async () => (await page.locator('.maphead').count()) > 0 && (await chapter()) !== first, 1500, { skipFights: true });
  expect(taps).toBeLessThan(1500);
  expect(await chapter()).toContain('Chapter 2');
  expect(errors).toEqual([]);
});

test('a cup from the first round to the end', async ({ page }) => {
  const errors = watchErrors(page);
  await start(page, { seed: 22, lvl: 10 });
  await page.getByRole('button', { name: /Local brawl/ }).click();
  expect(await autopilot(page, atHub(page), 600)).toBeLessThan(600);
  expect(await page.getByText(/in progress/).count()).toBe(0);
  expect(errors).toEqual([]);
});

test('the gauntlet until it ends', async ({ page }) => {
  // it runs until a loss, so its dice are pinned: an unpinned long streak ran past the time limit on CI
  test.setTimeout(600_000);
  const errors = watchErrors(page);
  await start(page, { seed: 23, lvl: 1 }, 'gauntlet');
  await page.getByRole('button', { name: /The gauntlet/ }).click();
  expect(await autopilot(page, atHub(page), 800)).toBeLessThan(800);
  expect(errors).toEqual([]);
});

test('the daily challenge, once a day', async ({ page }) => {
  const errors = watchErrors(page);
  await start(page, { seed: 24, lvl: 8 });
  await page.getByRole('button', { name: /Daily challenge/ }).click();
  expect(await autopilot(page, atHub(page), 300)).toBeLessThan(300);
  await expect(page.getByText(/Won today|Done for today/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('a boss rush until it ends', async ({ page }) => {
  // up to ten boss fights back to back: a strong run takes over five minutes on a slow CI machine
  test.setTimeout(600_000);
  const errors = watchErrors(page);
  await start(page, { seed: 25, lvl: 10 });
  await page.getByRole('button', { name: /Boss rush/ }).click();
  expect(await autopilot(page, atHub(page), 1200)).toBeLessThan(1200);
  expect(errors).toEqual([]);
});

test('fight club: bet and watch', async ({ page }) => {
  const errors = watchErrors(page);
  await start(page, { seed: 26, lvl: 5 });
  await page.getByRole('button', { name: /Fight club/ }).click();
  await page.locator('.fc-side .btn').first().click();
  await page.getByRole('button', { name: 'Another fight' }).waitFor({ timeout: 120_000 });
  await expect(page.getByText(/You collect|are gone/)).toBeVisible();
  expect(errors).toEqual([]);
});
