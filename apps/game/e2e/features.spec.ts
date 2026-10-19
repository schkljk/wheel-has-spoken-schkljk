import { expect, test, type Page } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { layoutProblems, open, watchErrors } from './helpers';

// The review's new features (docs/SUGGESTIONS.md, F2-F12), each on a small phone with nothing cut off.
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
  await expect(page.locator('.fc-tip').getByText('The insider says')).toBeVisible();
  await fits(page, 'club with the tip');
  expect(errors).toEqual([]);
});

test('F9: a ghost code copies out, pastes back in, and fights', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 11, lvl: 8, fast: true }));
  await play(page);
  await page.getByRole('tab', { name: 'More' }).click();
  await page.getByRole('button', { name: /Ghost codes/ }).click();
  const code = (await page.locator('.ghost-code').textContent())!.trim();
  expect(code).toMatch(/^WHS1\./);
  await fits(page, 'ghost codes');
  await page.getByLabel("A friend's ghost code").fill(`  ${code.slice(0, 30)}\n${code.slice(30)}  `);
  await expect(page.locator('.ghost-prev')).toBeVisible();
  await page.getByRole('button', { name: /Fight the ghost/ }).click();
  await page.locator('.readpill').waitFor({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await expect(page.locator('.fresult .big')).toHaveText(/Ghost busted|Haunted/, { timeout: 60_000 });
  expect(errors).toEqual([]);
});

test('F11: the locker sells looks for gems, and they go on', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 12, lvl: 8, gems: 10 }));
  await play(page);
  await page.getByRole('tab', { name: 'More' }).click();
  await page.getByRole('button', { name: /Locker/ }).click();
  await fits(page, 'locker');
  await page.locator('.locker-item').filter({ hasText: 'Neon rim' }).getByRole('button', { name: /6/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: /^Buy/ }).click();
  await expect(page.locator('.locker-item.on').filter({ hasText: 'Neon rim' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Locker' }).locator('..')).toContainText('4');
  expect(errors).toEqual([]);
});

test('F12: the Wheelborn trials open at level 32 and fight a remix', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 13, lvl: 32, fast: true }));
  await play(page);
  await page.getByRole('button', { name: /Wheelborn trials/ }).click();
  await expect(page.locator('.goal.trial')).toHaveCount(10);
  await fits(page, 'trials');
  await page.locator('.goal.trial').first().getByRole('button', { name: 'Fight' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Fight the remix' }).click();
  await page.locator('.cine-btn').click();
  await page.locator('.readpill').waitFor({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await expect(page.locator('.fresult .big')).toHaveText(/Trial 1 cleared|The remix wins/, { timeout: 60_000 });
  expect(errors).toEqual([]);
});

test('F3: Spin & Run, a throwaway fighter, a fight, a boon and a walk away', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await open(page, { ...careerSaveKV({ seed: 15, lvl: 6, fast: true }), 'whs:seed': 'run' });
  await play(page);
  await page.getByRole('button', { name: /Spin & Run/ }).click();
  await expect(page.getByRole('heading', { name: 'Spin & Run' })).toBeVisible();
  await fits(page, 'run intro');
  await page.locator('.ch-opt').first().click();
  await page.locator('.cine-btn').click();
  await expect(page.getByRole('heading', { name: /fight 1 of 9/ })).toBeVisible();
  await fits(page, 'run fight pick');
  await page.locator('.ch-opt').first().click();
  await page.locator('.readpill').waitFor({ timeout: 60_000 });
  // the runner fights, not the career fighter
  const me = await page.evaluate(() => (window as unknown as { __whsBattle: { P: { f: { name: string } }[] } }).__whsBattle.P[0]!.f.name);
  expect(me).not.toBe('Test Hero');
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.getByRole('button', { name: /^Skip/ }).click();
  // a first loss is the run's second wind (review K3), not the end
  await expect(page.locator('.fresult .big')).toHaveText(/Fight 1 of 9 won|Down, not out/, { timeout: 60_000 });
  const won = /won/.test((await page.locator('.fresult .big').textContent()) || '');
  await page.locator('.fresult > .btn').first().click();
  if (!won) {
    await expect(page.getByRole('heading', { name: /fight 1 of 9/ })).toBeVisible();
    await expect(page.getByText(/second wind used/)).toBeVisible();
    await page.locator('.ch-opt').nth(1).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'End the run' }).click();
  }
  if (won) {
    await expect(page.getByRole('heading', { name: 'Pick a boon' })).toBeVisible();
    await fits(page, 'boons');
    await page.locator('.ch-opt').first().click();
    await expect(page.getByRole('heading', { name: /fight 2 of 9/ })).toBeVisible();
    await page.locator('.ch-opt').nth(1).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'End the run' }).click();
  }
  await page.locator('.tabbar').waitFor();
  await expect(page.getByRole('button', { name: /Spin & Run/ })).toContainText(won ? 'Best: 1 of 9' : 'Best: 0 of 9');
  expect(errors).toEqual([]);
});
