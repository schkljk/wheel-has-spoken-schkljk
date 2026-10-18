import { expect, test } from '@playwright/test';
import { careerSaveKV } from '../../../tools/fixtures/career-save';
import { open } from './helpers';

// Upgrade 45: a hidden error log in settings, only visible once something went wrong.
test('errors are logged on the device and show up in settings, ready to copy', async ({ page }) => {
  await open(page, careerSaveKV({ seed: 4, lvl: 6 }));
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('button', { name: /errors? logged/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  // something breaks, twice in a row (counted once), and a promise fails
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error('test boom');
    });
    setTimeout(() => {
      throw new Error('test boom');
    }, 10);
    setTimeout(() => void Promise.reject(new Error('promise went bad')), 30);
  });
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: '⚠ 2 errors logged' }).click();
  await expect(page.getByText('Error: test boom')).toBeVisible();
  await expect(page.getByText(/page · ×2/)).toBeVisible();
  await expect(page.getByText('Error: promise went bad')).toBeVisible();
  // it survives a reload (it's on the device), and Clear empties it
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: '⚠ 2 errors logged' }).click();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByText(/Nothing logged/)).toBeVisible();
});
