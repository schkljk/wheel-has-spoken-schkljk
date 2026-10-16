import { chromium, type Browser, type Page } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Opens the real legacy game in headless Chromium (no network fonts). */
export async function openLegacyPage(): Promise<{ page: Page; browser: Browser }> {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage();
  await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
  await page.goto('file://' + resolve(ROOT, 'legacy/dist/wheel-has-spoken.html'));
  await page.waitForTimeout(400);
  return { page, browser };
}

/**
 * Runs plain JavaScript source inside the legacy page and returns its JSON result.
 * (Source text, not a function: compiled helpers would not exist inside the page.)
 */
export async function evalLegacy<T>(page: Page, src: string): Promise<T> {
  return JSON.parse((await page.evaluate(`JSON.stringify((${src}))`)) as string) as T;
}
