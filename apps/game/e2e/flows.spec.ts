import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deserFighter, migrate, numStats } from '@whs/core';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { autopilot, layoutProblems, legacySave, open, watchErrors } from './helpers';

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

test('the combat wheel can be nudged one slice, once a fight', async ({ page }) => {
  // story, map, arena and two rounds take most of two minutes with software rendering on CI: fast mode and room
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, { ...careerSaveKV({ seed: 4, lvl: 12, ch: 3, fast: true }), 'whs:seed': 'nudge' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.locator('.mnode.now').first().click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  // a full energy bar turns the spin button into the signature
  const spin = page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ });
  await expect(spin).toBeEnabled({ timeout: 60_000 });
  // the test needs a second round: no knockout in the first, whatever balance does to the seeded fight
  await page.evaluate('(() => { const b = window.__whsBattle.P[1]; b.maxHp *= 5; b.hp = b.maxHp; })()');
  // take the offer the moment it shows (it lasts a couple of seconds, and a software-rendered frame can take
  // longer than that, so the click comes from a DOM observer rather than a per-frame poll)
  await page.evaluate(`(() => {
    const w = window;
    new MutationObserver((_, ob) => {
      const b = document.querySelector('.btn.nudge');
      if (!b || w.__nudged) return;
      w.__nudged = b.textContent;
      b.click();
      ob.disconnect();
    }).observe(document.body, { childList: true, subtree: true });
  })()`);
  await spin.click();
  const offer = await (await page.waitForFunction('window.__nudged', null, { polling: 100, timeout: 60_000 })).jsonValue();
  const to = String(offer).replace('↷ Nudge to', '').replace('once a fight', '').trim();
  await expect(page.locator('.cw-out b')).toHaveText(to);
  // the next spin offers no second nudge
  await expect(spin).toBeEnabled({ timeout: 60_000 });
  await spin.click();
  await page.locator('.cw-out b').waitFor();
  await page.waitForTimeout(400);
  await expect(page.locator('.btn.nudge')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the opponent's last three moves show by their HP bar, after each round", async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // four rounds with software rendering: fast mode, and room for slow machines
  test.setTimeout(240_000);
  await open(page, { ...careerSaveKV({ seed: 4, lvl: 12, ch: 3, fast: true }), 'whs:seed': 'move history' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.locator('.mnode.now').first().click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  // a full energy bar turns the spin button into the signature
  const spin = page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ });
  const moves = page.locator('.mhist i');
  await expect(spin).toBeEnabled({ timeout: 60_000 });
  await expect(moves).toHaveCount(0);
  const over = page.locator('.fresult');
  let rounds = 0;
  for (let r = 1; r <= 4; r++) {
    await spin.click();
    await expect(over.or(spin.and(page.locator(':enabled')))).toBeVisible({ timeout: 60_000 });
    if (await over.count()) break;
    rounds = r;
    // only rounds that have played out, and never more than three
    await expect(moves).toHaveCount(Math.min(r, 3));
  }
  expect(rounds, 'the fight lasts long enough to fill the row').toBeGreaterThanOrEqual(3);
  await expect(page.locator('.mhist')).toHaveAttribute('aria-label', /^Their last moves: (Strike|Power|Guard|Signature|Feint|Charge up|Sidestep)(, .+){2}$/);
  // the momentum meters show as many lit pips as their label says, and explain themselves when tapped
  for (const m of await page.locator('.mom').all()) {
    const n = Number((await m.getAttribute('aria-label'))!.match(/^Momentum (\d) of 3/)![1]);
    await expect(m.locator('i.on')).toHaveCount(n);
    if (n) await expect(m.locator('small')).toHaveText(`+${n * 10}%`);
  }
  await page.locator('.mom').first().click();
  await expect(page.getByText(/\+10% damage per pip/)).toBeVisible();
  await page.keyboard.press('Escape');
  for (const [width, height] of [[320, 568], [844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(400);
    const p = await layoutProblems(page);
    expect(p.clipped, `${width}x${height}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('holding a combat wheel slice previews it, and letting go does not spin', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, { ...careerSaveKV({ seed: 4, lvl: 12, ch: 3, fast: true }), 'whs:seed': 'peek' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.locator('.mnode.now').first().click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  const spin = page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ });
  await expect(spin).toBeEnabled({ timeout: 60_000 });
  /** a point on the wheel at `deg` (0 is the top, clockwise) and the slice name there */
  const at = (deg: number) =>
    page.evaluate(`(() => {
      const w = window.__whsFight.wheel;
      const cv = document.querySelector('.fight canvas').getBoundingClientRect();
      const phi = (${deg} - 90) * Math.PI / 180;
      const r = w.size * 0.3;
      return { x: cv.left + w.x + Math.cos(phi) * r, y: cv.top + w.y + Math.sin(phi) * r, n: w.items[w.segAtAngle(phi)].n, top: w.items[w.segAt()].n };
    })()`) as Promise<{ x: number; y: number; n: string; top: string }>;
  const a = await at(0);
  // the slice right under the pointer is the one a spin with no turn would land on
  expect(a.n).toBe(a.top);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  const peek = page.locator('.cw-out .peek');
  await expect(peek).toBeVisible();
  await expect(peek.locator('b').first()).toContainText(a.n);
  await expect(peek).toContainText(/damage|counters|No damage/);
  await expect(peek).toContainText(/Beats|Breaks|Baits|Dodges|No damage|Can't be dodged/);
  // slide to the other side of the wheel: the preview follows the finger
  const b = await at(180);
  await page.mouse.move(b.x, b.y, { steps: 4 });
  await expect(peek.locator('b').first()).toContainText(b.n);
  await page.mouse.up();
  await expect(peek).toHaveCount(0);
  await page.waitForTimeout(500);
  await expect(spin).toBeEnabled();
  await expect(page.locator('.cw-out b').first()).toHaveText(/moves$/);
  expect(errors).toEqual([]);
});

test("a boss's phase two changes the light and adds its slice to one wheel", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, { ...careerSaveKV({ seed: 25, lvl: 10, fast: true }), 'whs:seed': 'phase two' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Boss rush/ }).click();
  await page.getByRole('button', { name: 'Fight', exact: true }).click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  const spin = page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ });
  await expect(spin).toBeEnabled({ timeout: 60_000 });
  await expect(page.locator('.fchip.new')).toHaveCount(0);
  expect(await page.evaluate('window.__whsFight.phaseAmt')).toBe(0);
  // knock the boss under half HP; the next round sets off phase two
  await page.evaluate('(() => { const b = window.__whsBattle.P[1]; b.hp = b.maxHp * 0.45; })()');
  await page.getByRole('button', { name: 'Defend', exact: true }).click();
  await spin.click();
  await expect(spin).toBeEnabled({ timeout: 60_000 });
  expect(await page.evaluate('window.__whsBattle.P[1].phased')).toBe(1);
  expect(await page.evaluate('window.__whsFight.phaseAmt')).toBeGreaterThan(0);
  const chip = page.locator('.fchip.new');
  await expect(chip).toHaveCount(1);
  // on that wheel, the hint names the slice and the wheel carries it
  await chip.click();
  await page.waitForTimeout(300);
  const hint = page.locator('.cw-out small').filter({ hasText: /^Phase two: / });
  await expect(hint).toHaveCount(1);
  const named = (await hint.innerText()).replace(/^Phase two: \S+ /, '').replace(/ is on your .*$/, '');
  expect((await page.evaluate('window.__whsFight.wheel.items.map((i) => i.n)')) as string[]).toContain(named);
  for (const [width, height] of [[320, 568], [844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(400);
    expect((await layoutProblems(page)).clipped, `${width}x${height}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('the knockout blow plays in slow motion with the camera pushed in, then the view comes back', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await open(page, { ...careerSaveKV({ seed: 4, lvl: 12, ch: 3, fast: true }), 'whs:seed': 'finisher' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.locator('.mnode.now').first().click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  const spin = page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ });
  await expect(spin).toBeEnabled({ timeout: 120_000 });
  // one touch from the floor, round after round (revives and misses happen), until they go down
  const result = page.locator('.fresult');
  for (let r = 0; r < 8 && !(await result.count()); r++) {
    await page.evaluate('(() => { const o = window.__whsBattle.P[1]; o.hp = 1; })()');
    await spin.click();
    await expect(result.or(spin.and(page.locator(':enabled')))).toBeVisible({ timeout: 120_000 });
  }
  await expect(result).toBeVisible();
  expect(await page.evaluate('window.__whsBattle.w')).toBe(0);
  expect(await page.evaluate('window.__whsFight.finishers')).toBe(1);
  expect(await page.evaluate('window.__whsFight.world.scale.x')).toBe(1);
  expect(errors).toEqual([]);
});

test('the hidden balance lab: five taps on the build line, a mass simulation, tables that fit', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await open(page, careerSaveKV({ seed: 4, lvl: 3 }));
  await page.getByRole('button', { name: 'Settings' }).first().click();
  const build = page.getByText(/^The Wheel Has Spoken · build /);
  for (let i = 0; i < 5; i++) await build.click();
  await expect(page.getByRole('heading', { name: 'Balance lab' })).toBeVisible();
  await page.getByRole('button', { name: '2,000' }).click();
  await page.getByRole('button', { name: 'Run the simulation' }).click();
  await expect(page.getByRole('button', { name: 'Run again' })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(/^2,000 fights, seed \d+\. Flagged: above 58% or below 42%\.$/)).toBeVisible();
  for (const tab of ['Classes', 'Races', 'Weapons', 'Sidekicks', 'Gear sets', 'Growth', 'Personalities']) {
    await page.getByRole('tab', { name: tab }).click();
    expect(await page.locator('.lab-list li').count(), tab).toBeGreaterThan(1);
  }
  for (const [width, height] of [[320, 568], [1280, 720], [844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    const p = await layoutProblems(page);
    expect(p.clipped, `${width}x${height}`).toEqual([]);
    expect(p.pageScrolls, `${width}x${height}`).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('a hidden synergy is a mystery on the card until the first fight gives it away', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // seed 12 rolls an NPC: the Unnamed extra
  await open(page, { ...careerSaveKV({ seed: 12, lvl: 3, ch: 1, fast: true }), 'whs:seed': 'secret' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Fighter' }).click();
  await page.getByRole('button', { name: 'Every wheel result and trait' }).click();
  await expect(page.locator('.syn.secret').filter({ hasText: '???' })).toHaveCount(1);
  await expect(page.getByText('Unnamed extra')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close' }).last().click();
  await page.getByRole('tab', { name: 'Play' }).click();
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.locator('.mnode.now').first().click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  await expect(page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.locator('.fresult').waitFor({ timeout: 60_000 });
  await page.locator('.fresult .btn').first().click();
  await autopilot(page, async () => (await page.locator('.maphead').count()) > 0, 40);
  await page.getByRole('button', { name: 'Fighter page' }).click();
  await page.getByRole('tab', { name: 'Fighter' }).click();
  await page.getByRole('button', { name: 'Every wheel result and trait' }).click();
  await expect(page.locator('.syn.secret').filter({ hasText: 'Unnamed extra' })).toHaveCount(1);
  await expect(page.locator('.syn.secret').filter({ hasText: '???' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the nemesis waits on the story map with a speech about your last fight', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, { ...careerSaveKV({ seed: 7, lvl: 7, ch: 3, row: 2, fast: true, nemesis: true }), 'whs:seed': 'grudge' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await expect(page.locator('.nem.card')).toContainText('and on your story map');
  await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
  const step = page.locator('.mnode.now.t-nemesis');
  await expect(step).toContainText('Gary');
  await expect(page.locator('.mnode.now')).toHaveCount(3);
  for (const [width, height] of [[320, 568], [844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    expect((await layoutProblems(page)).clipped, `map ${width}x${height}`).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await step.click();
  // the speech remembers where, which round or how much HP Gary had left
  await expect(page.getByText('Your nemesis · meeting 1')).toBeVisible();
  await expect(page.getByText('They beat you once.')).toBeVisible();
  await expect(page.locator('.cine')).toContainText(/City Circuit|6|17/);
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.getByRole('button', { name: 'Settle it' }).click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  await expect(page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await expect(page.getByText('Nemesis fight')).toBeVisible();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.locator('.fresult').waitFor({ timeout: 60_000 });
  await expect(page.locator('.fresult')).toContainText('😈');
  expect(errors).toEqual([]);
});

test("a chapter's own encounter: what it does under each option, then what happened and the joke", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  // the Night Market's own are skewers and the noodle challenge; a few pinned seeds, until one deals them
  let skewers = false;
  for (const seed of ['market', 'stall', 'lantern', 'gnocchi', 'noodle', 'skewer']) {
    await open(page, { ...careerSaveKV({ seed: 3, lvl: 4, ch: 2, row: 2, fast: true, event: true }), 'whs:seed': seed });
    await page.getByRole('button', { name: 'Play', exact: true }).first().click();
    await page.getByRole('button', { name: /Start the chapter|Continue the story/ }).click();
    await page.locator('.mnode.now').first().click();
    await page.locator('.ch-opts').waitFor();
    if ((await page.getByText(/^(Mystery skewers|The noodle challenge)$/).count()) === 0) continue;
    skewers = (await page.getByText('Mystery skewers').count()) > 0;
    break;
  }
  await expect(page.getByText(/^(Mystery skewers|The noodle challenge)$/)).toBeVisible();
  await expect(page.getByText(skewers ? '4 coins. 70%: heal 30% HP. 30%: lose 10% HP' : '5 coins. 50%: +20 coins, +3 fame. 50%: lose 15% HP')).toBeVisible();
  await expect(page.locator('.ch-opt.talk')).toHaveCount(1);
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.getByRole('button', { name: skewers ? /Just one, to be polite/ : /Watch from a stool/ }).click();
  await expect(page.locator('.ev-fx')).toHaveText(skewers ? 'Heal 10% HP' : 'Heal 15% HP');
  await expect(page.locator('.ev-flav')).toContainText(skewers ? 'Crunchy' : 'restorative');
  expect((await layoutProblems(page)).clipped).toEqual([]);
  expect(errors).toEqual([]);
});

test('the forge: upgrade a worn piece with a copy, confirm, and see the numbers change', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, careerSaveKV({ seed: 9, lvl: 8, coins: 200, forge: true }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Fighter' }).click();
  await expect(page.locator('.gl-up')).toHaveText('+3');
  await page.getByRole('button', { name: /Armory/ }).click();
  await page.locator('.arm-slot').first().click();
  await expect(page.locator('.up-lv').first()).toHaveText(' +3');
  await expect(page.getByText('1 copy')).toBeVisible();
  await page.getByRole('button', { name: /^Forge/ }).first().click();
  await expect(page.locator('.forge-pips .pip.on')).toHaveCount(3);
  await expect(page.getByText('Next: +4, +2% damage reduction')).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.getByRole('button', { name: /^Upgrade for \d+ 🪙 \+ a copy$/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Upgrade it' }).click();
  await expect(page.locator('.forge-pips .pip.on')).toHaveCount(4);
  // its own number goes up and the popup says so
  await expect(page.locator('.statpop')).toContainText('Defense');
  await expect(page.getByText(/Needs a copy of it|Needs \d+ coins/)).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  expect(errors).toEqual([]);
});

test('the trophy room: belts, boss kills, rare titles and class mastery on shelves that fit', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, careerSaveKV({ seed: 2, lvl: 12, trophies: true }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('tab', { name: 'More' }).click();
  await page.getByRole('button', { name: /Trophy room/ }).click();
  await expect(page.locator('.shelf.belts .trophy:not(.locked)')).toHaveCount(1);
  await expect(page.getByText('Boss kills (3 of 20)')).toBeVisible();
  await expect(page.getByText('Rare titles (2 of')).toBeVisible();
  await expect(page.getByText('Class mastery (1 mastered, 3 started)')).toBeVisible();
  await expect(page.locator('.shelf.classes .trophy.gold')).toHaveCount(1);
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1280, 720]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    expect((await layoutProblems(page)).clipped, `${width}x${height}`).toEqual([]);
  }
  // a title opens its info card
  await page.locator('.shelf.titles .trophy:not(.locked)').first().click();
  await expect(page.getByText('Giant Slayer').last()).toBeVisible();
  expect(errors).toEqual([]);
});

test('an exhibition: two legends from the hall of fame fight while the commentators talk', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, careerSaveKV({ seed: 6, lvl: 8, legends: true, fast: true }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /^Exhibition/ }).click();
  await expect(page.getByText('The hall of fame (4)')).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.getByRole('button', { name: 'Old Man Uppercut in the blue corner' }).click();
  await page.getByRole('button', { name: /Ring the bell/ }).click();
  // reduced motion plays the whole broadcast at once
  await expect(page.getByRole('button', { name: /Rematch/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.ex-call')).not.toHaveCount(0);
  await expect(page.locator('.ex-call.c0').first()).toContainText('Rex Thundermic');
  await expect(page.locator('.ex-corner.lost')).toHaveCount(1);
  await expect(page.locator('.ex-corner').nth(1)).toContainText('Old Man Uppercut');
  for (const [width, height] of [[320, 568], [844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    expect((await layoutProblems(page)).clipped, `${width}x${height}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('the endless tower: a floor, its hearts, a fight, and the next floor or a heart down', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, { ...careerSaveKV({ seed: 4, lvl: 9, fast: true }), 'whs:seed': 'tower' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /^Endless tower/ }).click();
  await expect(page.getByText('Tower, floor 1')).toBeVisible();
  await expect(page.getByText(/❤️❤️❤️\. Record/)).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.getByRole('button', { name: /Climb/ }).click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  await expect(page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await expect(page.getByText('Tower, floor 1').first()).toBeVisible();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.locator('.fresult').waitFor({ timeout: 60_000 });
  await page.locator('.fresult .btn').first().click();
  // either floor 2, or floor 1 again with a heart gone
  await expect(page.getByText(/^Tower, floor (2|1)$/)).toBeVisible({ timeout: 30_000 });
  const again = (await page.getByText('Tower, floor 1').count()) > 0;
  if (again) await expect(page.getByText(/❤️❤️🖤\. Record/)).toBeVisible();
  await page.getByRole('button', { name: /Walk back down/ }).click();
  await expect(page.locator('.tabbar, [role=tablist]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('hard mode: pick a cleared chapter, see its twist, fight on hard, then walk away to the story', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, { ...careerSaveKV({ seed: 4, lvl: 12, ch: 3, fast: true }), 'whs:seed': 'hard' });
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: /^Hard mode/ }).click();
  await expect(page.getByText('Beaten on hard: 0 of 2', { exact: true })).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.getByRole('button', { name: /Chapter 1/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: /Bring it/ }).click();
  await expect(page.getByText(/Twist for the whole chapter/)).toBeVisible();
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.locator('.maphead').getByText('🔥 Hard, chapter 1')).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.locator('.mnode.now.t-fight').first().click();
  await page.getByRole('button', { name: 'Spin the arena' }).click();
  await expect(page.getByRole('button', { name: /^(Spin your move|Unleash your signature)$/ })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Fight menu' }).click();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.locator('.fresult').waitFor({ timeout: 60_000 });
  await page.locator('.fresult .btn').first().click();
  // a win offers a reward first, then it is the hard map again
  await expect(page.locator('.maphead, [role=dialog]').first()).toBeVisible({ timeout: 30_000 });
  const prize = page.getByRole('button', { name: /Prize money/ });
  if (await prize.count()) await prize.click();
  await expect(page.locator('.maphead').getByText('🔥 Hard, chapter 1')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Fighter page' }).click();
  await expect(page.getByText('🔥 Hard mode, chapter 1')).toBeVisible();
  expect((await layoutProblems(page)).clipped).toEqual([]);
  await page.getByRole('button', { name: /Walk away/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Leave it' }).click();
  await expect(page.getByText(/^Story, chapter 3 of/)).toBeVisible();
  expect(errors).toEqual([]);
});
