import { expect, test } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { layoutProblems, open, textOverlaps, watchErrors } from './helpers';

// Review items A4, B3, B5 and C1: nothing is lost when the app closes, Continue goes straight back, a story
// win's spoils are picked on the result, and the result says why the fight went the way it did.

test('a half-built fighter survives closing the app, and Continue picks it up', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.getByRole('button', { name: 'Spin one' }).first().click();
  await page.getByRole('textbox', { name: 'Fighter name' }).fill('Halfway');
  await page.getByRole('button', { name: 'Spin a new fighter' }).click();
  const prog = page.locator('.prog-n');
  for (let i = 1; i <= 3; i++) {
    await expect(prog).toHaveText(new RegExp(`^Spin ${i} of`), { timeout: 20_000 });
    await page.locator('.spin-foot .btn.block').click();
  }
  await expect(prog).toHaveText(/^Spin 4 of/, { timeout: 20_000 });
  // the phone closes the app
  await page.reload();
  await page.getByRole('button', { name: /Keep building Halfway/ }).click();
  await expect(prog).toHaveText(/^Spin 4 of/);
  expect(errors).toEqual([]);
});

test('a story win: spoils on the result, a recap, and the steps after it survive closing the app', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // a level 30 fighter in chapter 1: the first fight is a sure win
  await open(page, { ...careerSaveKV({ seed: 3, lvl: 30, ch: 1, row: 0, fast: true }), 'whs:seed': 'spoils' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  const begin = page.getByRole('button', { name: 'Begin' });
  if (await begin.isVisible().catch(() => false)) await begin.click();
  await page.locator('.mnode.now.t-fight').first().click();
  await expect(page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.getByRole('button', { name: /^Skip/ }).click();
  const res = page.locator('.fresult');
  await expect(res.locator('.big')).toHaveText('Victory', { timeout: 60_000 });
  // why it went that way
  await expect(res.locator('.recap')).toContainText('How it went');
  await expect(res.locator('.recap-tip')).not.toBeEmpty();
  // the spoils are right here, one tap
  await expect(res.getByRole('button', { name: /Prize money/ })).toBeVisible();
  for (const [width, height] of [[390, 844], [320, 568], [844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    expect((await layoutProblems(page)).clipped, `${width}x${height}`).toEqual([]);
    // the lines, the titles and the recap stack and scroll; none of them land on another
    expect(await textOverlaps(page, '.fresult'), `${width}x${height}: overlapping text`).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  // the phone closes the app on the result: the reward still waits
  await page.reload();
  const cont = page.getByRole('button', { name: /Continue with Test Hero/ });
  await expect(cont).toContainText('Your spoils are waiting');
  await cont.click();
  await expect(page.getByText('Pick your reward')).toBeVisible();
  await page.getByRole('button', { name: /Prize money/ }).click();
  // and back on the map, one step on
  await expect(page.locator('.maphead')).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole('button', { name: /Continue with Test Hero/ })).toContainText('Back to the story map');
  expect(errors).toEqual([]);
});
