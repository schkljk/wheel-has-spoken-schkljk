import { expect, test, type Page } from '@playwright/test';
import { VIEWS, layoutProblems, legacySave, open, watchErrors } from './helpers';

// Every screen fits every common screen size: nothing cut off, the page never scrolls.
async function check(page: Page, what: string) {
  await page.waitForTimeout(450); // let entrance animations settle
  const p = await layoutProblems(page);
  expect.soft(p.clipped, `${what}: clipped`).toEqual([]);
  expect.soft(p.pageScrolls, `${what}: page scrolls`).toBe(false);
}

for (const [width, height] of VIEWS) {
  test.describe(`${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test('every screen fits', async ({ page }) => {
      const errors = watchErrors(page);
      await open(page);
      await check(page, 'tutorial');
      await page.getByRole('button', { name: 'Skip the tour' }).click();
      await check(page, 'empty title');
      await open(page, { 'wheel-has-spoken-v1': legacySave() });
      await page.getByRole('button', { name: 'Skip the tour' }).click();
      await check(page, 'title with old save offer');
      await page.getByRole('button', { name: 'Bring it over' }).first().click();
      await check(page, 'import confirmation');
      await page.getByRole('button', { name: /^Load / }).click();
      await check(page, 'roster');
      await page.getByRole('button', { name: 'Play', exact: true }).first().click();
      for (const tab of ['Play', 'Fighter', 'Goals', 'More']) {
        await page.getByRole('tab', { name: tab }).click();
        await check(page, `${tab} tab`);
      }
      await page.getByRole('button', { name: 'Settings' }).first().click();
      await check(page, 'settings');
      await page.getByRole('button', { name: 'Your save and backups' }).click();
      await check(page, 'save sheet');
      await page.getByRole('button', { name: 'Paste save text' }).click();
      await check(page, 'save sheet with paste box');
      expect(errors).toEqual([]);
    });
  });
}
