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
      await page.getByRole('button', { name: 'Spin the rest' }).click();
      await page.getByRole('button', { name: 'Start their career' }).waitFor({ timeout: 90_000 });
      // the scouting report: three strengths, the biggest weakness, the best synergy
      await expect(page.locator('.scout .sr-l')).toHaveCount(5);
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

    test('hard mode fits', async ({ page }) => {
      const errors = watchErrors(page);
      await open(page, save());
      await play(page);
      await page.getByRole('button', { name: /^Hard mode/ }).click();
      await check(page, 'hard mode picker');
      await page.getByRole('button', { name: /Chapter 2/ }).click();
      await check(page, 'hard mode confirm');
      await page.getByRole('alertdialog').getByRole('button', { name: /Bring it/ }).click();
      await page.getByText(/Twist for the whole chapter/).waitFor();
      await check(page, 'hard chapter intro');
      await page.getByRole('button', { name: 'Begin' }).click();
      await check(page, 'hard map');
      await page.getByRole('button', { name: 'Home' }).click();
      await page.getByText('Hard mode, chapter 2').waitFor();
      await check(page, 'hard story card');
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
      // combo and synergy banners (the longest of each) stay on the stage, under the HP bars
      const ban = await page.evaluate(`(() => {
        const sc = window.__whsFight;
        const out = [];
        for (const side of [0, 1]) {
          sc.showProc({ kind: 'synergy', k: 'selfown', n: 'Allergic to own kit', e: '', sub: 'The attack backfires', side, anti: true });
          out.push(sc.procBounds());
          sc.showProc({ kind: 'combo', k: 'Fanned flames', n: 'Fanned flames', e: '', sub: 'Wind on burning: +60% damage', side, anti: false });
          out.push(sc.procBounds());
        }
        const cv = document.querySelector('.fight canvas').getBoundingClientRect();
        const hud = document.querySelector('.fhud').getBoundingClientRect();
        return { out, stageW: sc.dims.stageW, hudBottom: hud.bottom - cv.top };
      })()`);
      const { out, stageW, hudBottom } = ban as { out: { left: number; top: number; right: number }[]; stageW: number; hudBottom: number };
      for (const b of out) {
        expect.soft(b.left, 'combo banner left edge').toBeGreaterThanOrEqual(0);
        expect.soft(b.right, 'combo banner right edge').toBeLessThanOrEqual(stageW + 0.5);
        expect.soft(b.top, 'combo banner under the HP bars').toBeGreaterThanOrEqual(hudBottom - 2);
      }
      // statuses on both fighters: icons with counters over their heads, and the legend in the fight menu
      await page.evaluate(`(() => {
        const bt = window.__whsBattle;
        Object.assign(bt.P[0], { poison: 6, guard: 1, focused: 1, wdebuff: 2 });
        bt.P[0].buffs.push({ k: 'dmgX', v: 0.2, r: 3 }, { k: 'dr', v: 0.2, r: 2 });
        Object.assign(bt.P[1], { frozen: 1, burning: 2, soaked: 2, opened: 1 });
        bt.P[1].buffs.push({ k: 'vuln', v: 0.2, r: 3 }, { k: 'weak', v: 0.2, r: 2 });
        window.__whsFight.applySnap(bt.snap());
      })()`);
      await page.getByRole('button', { name: 'Fight menu' }).click();
      // their AI personality is part of the scouting report
      await expect(page.locator('.fm-scout .chip').filter({ hasText: /Aggressive|Turtle|Gambler|Tactician/ })).toHaveCount(1);
      await expect(page.locator('.fm-st')).toHaveCount(2);
      // (the arena or the opening round may have added more)
      expect(await page.locator('.fm-st').first().locator('.stchip').count()).toBeGreaterThanOrEqual(6);
      await expect(page.locator('.fm-st').first().locator('.stchip.bad').filter({ hasText: '×2' })).toHaveCount(1);
      await expect(page.locator('.fm-st').first().locator('.stchip.bad').filter({ hasText: /^−\d+$/ })).toHaveCount(1);
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
      await page.getByRole('button', { name: 'Home' }).click();
      await page.locator('.tabbar').waitFor();
      await page.getByRole('button', { name: /Local brawl/ }).click();
      await check(page, 'bracket');
      await page.getByRole('button', { name: /^Leave for now/ }).click();
      await page.getByRole('button', { name: 'Resume' }).waitFor();
      await page.getByRole('button', { name: 'Abandon it' }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Abandon it' }).click();
      await page.getByRole('button', { name: /The gauntlet/ }).click();
      await check(page, 'gauntlet');
      expect(errors).toEqual([]);
    });
  });
}
