import { expect, test } from '@playwright/test';

test('app shell loads without errors and never scrolls', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'The Wheel Has Spoken' })).toBeVisible();
  await expect(page.locator('.tabbar button')).toHaveCount(4);
  await expect(page.locator('canvas')).toBeVisible();
  const scrolls = await page.evaluate(() => {
    const s = document.scrollingElement!;
    return s.scrollHeight > innerHeight + 1 || s.scrollWidth > innerWidth + 1;
  });
  expect(scrolls).toBe(false);
  expect(errors).toEqual([]);
});
