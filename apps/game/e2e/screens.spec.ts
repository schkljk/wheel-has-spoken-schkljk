import { expect, test, type Page } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { VIEWS, autopilot, layoutProblems, open, watchErrors } from './helpers';

// Phase 3 acceptance: every game screen fits every required screen size, with nothing cut off and no page
// scroll. Reduced motion makes wheels and fights quick, so the whole tour runs in seconds per size.
async function check(page: Page, what: string) {
  await page.waitForTimeout(350);
  const p = await layoutProblems(page);
  expect.soft(p.clipped, `${what}: clipped`).toEqual([]);
  expect.soft(p.pageScrolls, `${what}: page scrolls`).toBe(false);
}
const save = (o: Parameters<typeof careerSaveKV>[0] = {}) => careerSaveKV({ seed: 4, lvl: 12, ch: 3, coins: 400, gems: 40, ...o });
const sheetClose = (page: Page) => page.keyboard.press('Escape');
const play = async (page: Page) => {
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.locator('.tabbar').waitFor();
};

for (const [width, height] of VIEWS) {
  test.describe(`${width}x${height}`, () => {
    // layout is the same at any pixel density; 1× keeps software WebGL on test machines quick
    test.use({ viewport: { width, height }, deviceScaleFactor: 1 });
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('building a fighter fits', async ({ page }) => {
      const errors = watchErrors(page);
      await open(page, save());
      await page.getByRole('button', { name: 'Spin one' }).first().click();
      await check(page, 'new fighter sheet');
      await page.getByRole('button', { name: 'Spin a new fighter' }).click();
      await page.locator('.pixiwheel canvas').waitFor();
      await check(page, 'build');
      await page.getByRole('button', { name: /^Spin for/ }).click();
      await page.locator('.landed .ln').waitFor();
      await check(page, 'build, landed');
      await page.getByRole('button', { name: 'So far' }).click();
      await check(page, 'so far sheet');
      await sheetClose(page);
      await page.getByRole('button', { name: 'Spin the rest for me' }).click();
      await page.getByRole('button', { name: 'Start their career' }).waitFor({ timeout: 90_000 });
      await check(page, 'fighter card');
      expect(errors).toEqual([]);
    });

    test('the fighter page and its sheets fit', async ({ page }) => {
      const errors = watchErrors(page);
      await open(page, save());
      await check(page, 'title with fighters');
      await play(page);
      for (const tab of ['Play', 'Fighter', 'Goals', 'More']) {
        await page.getByRole('tab', { name: tab }).click();
        await check(page, `${tab} tab`);
      }
      await page.getByRole('tab', { name: 'Fighter' }).click();
      await page.getByRole('button', { name: /^Talents/ }).click();
      await check(page, 'talents');
      await sheetClose(page);
      await page.getByRole('button', { name: /Armory/ }).click();
      await check(page, 'armory');
      await page.locator('.arm-slot').first().click();
      await check(page, 'armory slot');
      await sheetClose(page);
      await page.getByRole('button', { name: 'Every wheel result and trait' }).click();
      await check(page, 'full card');
      await sheetClose(page);
      await page.getByRole('tab', { name: 'Play' }).click();
      await page.getByRole('button', { name: /Base shop/ }).click();
      for (const t of ['Basics', 'Deal', 'Premium', 'Services']) {
        await page.getByRole('tab', { name: new RegExp(t) }).click();
        await check(page, `shop ${t}`);
      }
      await sheetClose(page);
      await page.getByRole('button', { name: /Fight club/ }).click();
      await check(page, 'fight club');
      await sheetClose(page);
      await page.getByRole('button', { name: /^Bag/ }).first().click();
      await check(page, 'bag');
      await sheetClose(page);
      await page.getByRole('tab', { name: 'More' }).click();
      await page.getByRole('button', { name: /Records and legacy/ }).click();
      await check(page, 'records');
      await sheetClose(page);
      await page.getByRole('button', { name: /Collection/ }).click();
      await check(page, 'collection');
      expect(errors).toEqual([]);
    });

    test('the story, a fight and a cup fit', async ({ page }) => {
      const errors = watchErrors(page);
      await open(page, save());
      await play(page);
      await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
      await check(page, 'chapter intro');
      await page.getByRole('button', { name: 'Begin' }).click();
      await check(page, 'map');
      await page.locator('.mnode.now').first().click();
      await page.getByRole('button', { name: 'Spin the arena' }).waitFor();
      await check(page, 'arena wheel');
      await page.getByRole('button', { name: 'Spin the arena' }).click();
      await page.locator('.readpill').waitFor({ timeout: 60_000 });
      await check(page, 'fight');
      await page.getByRole('button', { name: 'Fight menu' }).click();
      await check(page, 'fight menu');
      await page.getByRole('button', { name: /^Skip/ }).click();
      await page.locator('.fresult').waitFor({ timeout: 60_000 });
      await check(page, 'fight result');
      const share = page.getByRole('button', { name: /Save this win/ });
      if (await share.count()) {
        await share.click();
        await page.locator('.share-prev img').waitFor({ timeout: 30_000 });
        await check(page, 'share card');
        await sheetClose(page);
      }
      await page.locator('.fresult .btn').first().click();
      await page.locator('.ch-opt, .tabbar, .maphead, .spin-foot').first().waitFor();
      await check(page, 'after the fight');
      await autopilot(page, async () => (await page.locator('.maphead').count()) > 0, 40);
      await page.getByRole('button', { name: 'Fighter page' }).click();
      await page.locator('.tabbar').waitFor();
      await page.getByRole('button', { name: /Local brawl/ }).click();
      await check(page, 'bracket');
      await page.getByRole('button', { name: 'Back to your fighter' }).click();
      await page.getByRole('button', { name: 'Resume' }).waitFor();
      await page.getByRole('button', { name: 'Abandon it' }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Abandon it' }).click();
      await page.getByRole('button', { name: /The gauntlet/ }).click();
      await check(page, 'gauntlet');
      expect(errors).toEqual([]);
    });
  });
}
