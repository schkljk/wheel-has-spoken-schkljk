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

test('G4: starting a new fighter asks before it scraps the one being built', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.getByRole('button', { name: 'Spin one' }).first().click();
  await page.getByRole('textbox', { name: 'Fighter name' }).fill('Keeper');
  await page.getByRole('button', { name: 'Spin a new fighter' }).click();
  const prog = page.locator('.prog-n');
  await expect(prog).toHaveText(/^Spin 1 of/, { timeout: 20_000 });
  await page.locator('.spin-foot .btn.block').click();
  await expect(prog).toHaveText(/^Spin 2 of/, { timeout: 20_000 });
  await page.reload();
  await expect(page.getByRole('button', { name: /Keep building Keeper/ })).toBeVisible();
  // changing your mind keeps them
  await page.getByRole('button', { name: 'Spin one' }).first().click();
  const ask = page.getByRole('alertdialog');
  await expect(ask.getByText('Scrap Keeper?')).toBeVisible();
  await ask.getByRole('button', { name: 'Keep Keeper' }).click();
  await expect(page.getByRole('button', { name: /Keep building Keeper/ })).toBeVisible();
  // saying yes goes on to the new fighter
  await page.getByRole('button', { name: 'Spin one' }).first().click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Scrap and spin new' }).click();
  await expect(page.getByRole('textbox', { name: 'Fighter name' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('G8: a second tab that is behind asks to reload instead of writing over the first', async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, careerSaveKV({ seed: 4, lvl: 6 }));
  // the same game in another tab
  const other = await context.newPage();
  await other.route('**/fonts.{googleapis,gstatic}.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await other.goto('./');
  await expect(other.getByRole('button', { name: /Continue with Test Hero/ })).toBeVisible();
  // the first tab plays on
  await page.getByRole('button', { name: /Continue with Test Hero/ }).click();
  await page.locator('.tabbar').waitFor();
  // the second tab finds out, and offers a reload rather than its old copy
  await expect(other.getByRole('alertdialog').getByText('Open somewhere else')).toBeVisible();
  await other.getByRole('button', { name: 'Reload' }).click();
  await expect(other.getByRole('alertdialog')).toHaveCount(0);
  await expect(other.getByRole('button', { name: /Continue with Test Hero/ })).toBeVisible();
});

test('G2: closing the app mid-fight comes back to the same fight, not a fresh one', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // a fight that lasts a few rounds (the move history test's)
  await open(page, { ...careerSaveKV({ seed: 4, lvl: 12, ch: 3, fast: true }), 'whs:seed': 'move history' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.locator('.mnode.now').first().click();
  const spin = page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ });
  await expect(spin).toBeEnabled({ timeout: 60_000 });
  for (let r = 1; r <= 2; r++) {
    await spin.click();
    await expect(spin).toBeEnabled({ timeout: 60_000 });
  }
  const hp = page.getByRole('button', { name: /^\d+\/\d+ HP$/ });
  const before = await hp.allTextContents();
  // the phone closes the app; it opens again with other dice
  await page.evaluate(() => localStorage.setItem('whs:seed', 'another launch'));
  await page.reload();
  const cont = page.getByRole('button', { name: /Continue with Test Hero/ });
  await expect(cont).toContainText('Back into the fight');
  await cont.click();
  await expect(page.getByText(/Back in the fight: round 3 of/)).toBeVisible({ timeout: 60_000 });
  await expect(spin).toBeEnabled({ timeout: 60_000 });
  expect(await hp.allTextContents()).toEqual(before);
  // and it goes on to a result like any fight
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.locator('.fresult').waitFor({ timeout: 60_000 });
  await page.reload();
  await expect(page.getByRole('button', { name: /Continue with Test Hero/ })).not.toContainText('Back into the fight');
  expect(errors).toEqual([]);
});

test('G2: closing the app mid-spin lands the wheel on the same slice', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  // the same new fighter spun twice: once straight through, once with the app closed during the second spin
  const landed: string[] = [];
  for (const close of [false, true]) {
    await open(page, { 'whs:seed': close ? 'one launch' : 'other launch' });
    await page.getByRole('button', { name: 'Spin one' }).first().click();
    await page.getByRole('textbox', { name: 'Fighter name' }).fill('Same Dice');
    await page.getByRole('button', { name: 'Spin a new fighter' }).click();
    const prog = page.locator('.prog-n');
    const go = page.locator('.spin-foot .btn.block');
    await expect(prog).toHaveText(/^Spin 1 of/, { timeout: 20_000 });
    await go.click();
    await expect(prog).toHaveText(/^Spin 2 of/, { timeout: 60_000 });
    await go.click();
    if (close) {
      await page.waitForTimeout(300);
      await page.evaluate(() => localStorage.setItem('whs:seed', 'third launch'));
      await page.reload();
      await page.getByRole('button', { name: /Keep building Same Dice/ }).click();
      await expect(prog).toHaveText(/^Spin 2 of/, { timeout: 20_000 });
      await go.click();
    }
    await expect(prog).toHaveText(/^Spin 3 of/, { timeout: 60_000 });
    landed.push((await page.locator('.landed .ln').textContent())!);
  }
  expect(landed[1]).toBe(landed[0]);
  expect(errors).toEqual([]);
});
