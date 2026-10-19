import { expect, test, type Page } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { layoutProblems, open, watchErrors } from './helpers';

// The review's new features (docs/SUGGESTIONS.md, F2-F8), each on a small phone with nothing cut off.
test.use({ viewport: { width: 320, height: 568 } });
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});
async function fits(page: Page, what: string) {
  await page.waitForTimeout(300);
  const p = await layoutProblems(page);
  expect.soft(p.clipped, `${what}: clipped`).toEqual([]);
  expect.soft(p.pageScrolls, `${what}: page scrolls`).toBe(false);
}
const play = async (page: Page) => {
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.locator('.tabbar').waitFor();
};

test('F2: the daily duel, played, scored and kept', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 3, lvl: 6, fast: true }));
  await play(page);
  await page.getByRole('button', { name: /Daily duel/ }).click();
  await expect(page.getByRole('heading', { name: /Daily duel #\d+/ })).toBeVisible();
  await fits(page, 'duel sheet');
  await page.getByRole('button', { name: /^⚔️ Fight/ }).click();
  await page.locator('.readpill').waitFor({ timeout: 60_000 });
  // the stand-in fights, not the career fighter
  const me = await page.evaluate(() => (window as unknown as { __whsBattle: { P: { f: { name: string } }[] } }).__whsBattle.P[0]!.f.name);
  expect(me).not.toBe('Test Hero');
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.locator('.fresult').waitFor({ timeout: 60_000 });
  await expect(page.getByRole('button', { name: /Copy the score/ })).toBeVisible();
  await fits(page, 'duel result');
  await page.locator('.fresult > .btn').first().click();
  await page.locator('.tabbar').waitFor();
  await page.getByRole('button', { name: /Daily duel/ }).click();
  await expect(page.locator('.duel-best')).toBeVisible();
  expect(errors).toEqual([]);
});

test('F4: a level-up spins twice and you keep one', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 5, lvl: 4, fast: true, pendingLv: 1 }));
  // going to the fighter page spins waiting level-ups first
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: 'Spin the level-up wheel' }).click();
  await expect(page.getByRole('heading', { name: 'Second opinion' })).toBeVisible({ timeout: 30_000 });
  await fits(page, 'second opinion');
  await page.getByRole('button', { name: 'Spin for a second opinion' }).click();
  // two different slices: pick one; the same twice: it says so and moves on
  const keep = page.getByRole('heading', { name: 'Keep one' });
  await expect(keep.or(page.locator('.tabbar'))).toBeVisible({ timeout: 30_000 });
  if (await keep.count()) {
    await fits(page, 'keep one');
    await page.locator('.ch-opt').first().click();
  }
  await page.locator('.tabbar').or(page.locator('.spin-foot')).first().waitFor({ timeout: 30_000 });
  expect(errors).toEqual([]);
});

test('F5: the bounty board on the Goals tab', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 7, lvl: 6, gems: 3 }));
  await play(page);
  await page.getByRole('tab', { name: 'Goals' }).click();
  await expect(page.getByText(/^Bounty board/)).toBeVisible();
  await expect(page.locator('.goal.bounty')).toHaveCount(3);
  const first = await page.locator('.goal.bounty b').first().textContent();
  await page.locator('.goal.bounty').first().getByRole('button', { name: /^Swap/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Swap it' }).click();
  await expect(page.locator('.goal.bounty b').filter({ hasText: first! })).toHaveCount(0);
  await expect(page.locator('.goal.bounty')).toHaveCount(3);
  await fits(page, 'goals tab');
  expect(errors).toEqual([]);
});

test('F6: an undiscovered synergy is a riddle', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 9, lvl: 8 }));
  await play(page);
  await page.getByRole('tab', { name: 'More' }).click();
  await page.getByRole('button', { name: /Collection/ }).click();
  await page.locator('.tile.riddle').first().click();
  await expect(page.getByText('A synergy riddle')).toBeVisible();
  await fits(page, 'riddle');
  expect(errors).toEqual([]);
});

test('F8: the fight club insider tells the real odds for a gem', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 26, lvl: 5, coins: 100, gems: 2 }));
  await play(page);
  await page.getByRole('button', { name: /Fight club/ }).click();
  await page.getByRole('button', { name: /insider/ }).click();
  await expect(page.getByText('🕵️ The insider says')).toBeVisible();
  await fits(page, 'club with the tip');
  expect(errors).toEqual([]);
});
