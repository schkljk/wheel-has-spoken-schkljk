import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

/** The 12 screen sizes every screen must fit (CLAUDE.md, Phase 3). */
export const VIEWS: [number, number][] = [
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
  [360, 800],
  [412, 915],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [844, 390],
  [667, 375],
];

const HERE = dirname(fileURLToPath(import.meta.url));
export const legacySave = () => readFileSync(resolve(HERE, '../../../packages/core/test/fixtures/legacy-played.json'), 'utf8');

/** Collects uncaught page errors and console errors. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

/** Opens the game with a clean slate (no fonts from the network, optional localStorage seed). */
export async function open(page: Page, seed: Record<string, string> = {}) {
  // no network fonts in tests: answer with an empty stylesheet instead of failing the request
  await page.route('**/fonts.{googleapis,gstatic}.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto('./');
  await page.evaluate((s) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, seed);
  await page.reload();
}

/**
 * Nothing on screen may be cut off and the page itself must not scroll (a port of the legacy
 * pw_matrix.py check). Content inside a scrolling panel is reachable, so only the panel must fit.
 */
export async function layoutProblems(page: Page): Promise<{ clipped: string[]; pageScrolls: boolean }> {
  return page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    const out: string[] = [];
    const scrolls = (el: Element) => {
      const st = getComputedStyle(el);
      return /(auto|scroll)/.test(st.overflowY + st.overflowX);
    };
    const name = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''}:${(el.textContent || '').trim().slice(0, 24)}`;
    const els = document.querySelectorAll('button, a, h1, h2, h3, b, small, input, textarea, .card, .chip, .stat, .tag, .pxi, canvas, .kitmv');
    for (const el of els) {
      if (el.closest('.toasts')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      // parked far off-screen on purpose (e.g. Pixi's screen-reader hook at -1000px)
      if (r.right < -500 || r.bottom < -500) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      // inside a scrolling panel: the panel must fit, its content may scroll
      let sc = el.parentElement;
      let inScroll = false;
      while (sc && sc !== document.body) {
        if (scrolls(sc)) {
          inScroll = true;
          break;
        }
        sc = sc.parentElement;
      }
      if (inScroll && sc) {
        const sr = sc.getBoundingClientRect();
        if (sr.bottom > vh + 1 || sr.right > vw + 1 || sr.left < -1 || sr.top < -1) out.push('panel ' + name(sc));
        // horizontal clipping inside a vertical scroller is still clipping
        if (r.right > sr.right + 2 || r.left < sr.left - 2) out.push(name(el));
        continue;
      }
      let bad = r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1 || r.top < -1;
      let a = el.parentElement;
      while (a && !bad && a !== document.body) {
        const st = getComputedStyle(a);
        if (st.overflowX !== 'visible' || st.overflowY !== 'visible') {
          const ar = a.getBoundingClientRect();
          if (r.bottom > ar.bottom + 2 || r.top < ar.top - 2 || r.right > ar.right + 2 || r.left < ar.left - 2) bad = true;
        }
        a = a.parentElement;
      }
      if (bad) out.push(`${name(el)} @${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    const se = document.scrollingElement!;
    return { clipped: [...new Set(out)].slice(0, 8), pageScrolls: se.scrollHeight > vh + 1 || se.scrollWidth > vw + 1 };
  });
}
