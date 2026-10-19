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
  // a day with no seasonal arena on the wheel, so seeded fights don't change with the calendar; and no
  // first-time tips, which only their own test wants
  await page.evaluate((s) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, { 'whs:today': '2026-05-15', 'whs:notips': '1', ...seed });
  await page.reload();
}

/**
 * Nothing on screen may be cut off and the page itself must not scroll (a port of the legacy
 * pw_matrix.py check). Content inside a scrolling panel is reachable, so only the panel must fit.
 */
/**
 * Pairs of text boxes inside `sel` that sit on top of each other (more than 4 px both ways). Clipping checks
 * can't see this: a row that collapses to no height still fits, and its text spills over its neighbours.
 */
export async function textOverlaps(page: Page, sel: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return [];
    // the part of a box you can see: what a scrolling panel hides is not on top of anything
    const seen = (e: Element) => {
      const r = e.getBoundingClientRect();
      let [l, t, rt, b] = [r.left, r.top, r.right, r.bottom];
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        const st = getComputedStyle(p);
        if (!/(auto|scroll|hidden)/.test(st.overflowY + st.overflowX)) continue;
        const q = p.getBoundingClientRect();
        [l, t, rt, b] = [Math.max(l, q.left), Math.max(t, q.top), Math.min(rt, q.right), Math.min(b, q.bottom)];
      }
      return { l, t, r: rt, b };
    };
    const els = [...root.querySelectorAll('li, p, b, small, span, button, .chip, h2, h3, .oc')]
      .filter((e) => [...e.childNodes].some((c) => c.nodeType === 3 && (c.textContent || '').trim()))
      .map((e) => ({ e, v: seen(e) }))
      .filter(({ v }) => v.r - v.l > 2 && v.b - v.t > 2);
    const out: string[] = [];
    for (let i = 0; i < els.length; i++)
      for (let j = i + 1; j < els.length; j++) {
        const a = els[i]!;
        const b = els[j]!;
        if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
        const ix = Math.min(a.v.r, b.v.r) - Math.max(a.v.l, b.v.l);
        const iy = Math.min(a.v.b, b.v.b) - Math.max(a.v.t, b.v.t);
        if (ix > 4 && iy > 4) out.push(`"${(a.e.textContent || '').trim().slice(0, 24)}" over "${(b.e.textContent || '').trim().slice(0, 24)}"`);
      }
    return out;
  }, sel);
}

/**
 * Buttons you can't hit with a thumb: a tap 21 px from the centre (up, down, left, right) has to land on the
 * button itself, so a hit area stretched by padding or a pseudo-element counts, and a neighbour on top doesn't.
 */
export async function smallTargets(page: Page, sel: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || getComputedStyle(el).visibility === 'hidden') continue;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const miss = [
        [cx - 21, cy],
        [cx + 21, cy],
        [cx, cy - 21],
        [cx, cy + 21],
      ].filter(([x, y]) => {
        const hit = document.elementFromPoint(x!, y!);
        return !hit || !(hit === el || el.contains(hit));
      });
      if (miss.length) out.push(`${(el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 24)} (${Math.round(r.width)}×${Math.round(r.height)})`);
    }
    return out;
  }, sel);
}

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
      // the title wheel's layers: see-through squares that turn (the face) or flick (the pointer), so their
      // boxes swing past the corners while the wheel itself (.tw-box, fit by CSS) stays put
      if (el.classList.contains('tw')) continue;
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
        // horizontal clipping inside a vertical scroller is still clipping; rows marked data-hscroll scroll
        // sideways on purpose (filter chips), so what's past their edge is reachable
        if ((r.right > sr.right + 2 || r.left < sr.left - 2) && !sc.hasAttribute('data-hscroll')) out.push(name(el));
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

/**
 * Plays on its own: taps whatever the current screen asks for (spin, continue, the first open choice,
 * the current map step, fight results...) until `done` says stop. Fights should run on auto-battle.
 * Some screens move on by themselves (loot and level-up wheels), so `stop` (a selector) is also checked
 * right before each tap: reaching the map between a `done` check and the next tap must not start a fight.
 * Returns how many taps it made.
 */
export async function autopilot(page: Page, done: () => Promise<boolean>, max = 400, o: { skipFights?: boolean; stop?: string } = {}): Promise<number> {
  const src = `(${TAP_NEXT})(${JSON.stringify(o)})`;
  for (let i = 0; i < max; i++) {
    if (await done()) return i;
    const tapped = await page.evaluate(src);
    if (tapped === 'stop') return i;
    await page.waitForTimeout(tapped ? 250 : 400);
  }
  return max;
}

// plain source (not a function) so compilers can't add helpers the page doesn't have
const TAP_NEXT = `((o) => {
  if (o.stop && document.querySelector(o.stop)) return 'stop';
  const vis = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.disabled && getComputedStyle(el).visibility !== 'hidden';
  };
  const tap = (el) => {
    if (!vis(el)) return false;
    el.click();
    return true;
  };
  const dlg = document.querySelector('[role=alertdialog]');
  if (dlg) return tap(dlg.querySelector('.btn'));
  if (o.skipFights && document.querySelector('.fmenu') && !document.querySelector('.fresult')) {
    const skip = [...document.querySelectorAll('.sheet .menu-i')].find((b) => b.querySelector('b')?.textContent === 'Skip');
    return skip ? tap(skip) : tap(document.querySelector('.fmenu'));
  }
  if (tap(document.querySelector('.cine-btn'))) return true;
  const opt = [...document.querySelectorAll('.ch-opt')].find((b) => vis(b));
  if (opt) return tap(opt);
  const sheet = document.querySelector('.sheet');
  if (sheet) {
    const out = [...sheet.querySelectorAll('button')].find((b) => /^(Leave|Close|Back|Done)$/i.test(b.textContent.trim()) || b.getAttribute('aria-label') === 'Close');
    return tap(out || null);
  }
  // a story win's spoils are picked right on the result (B3)
  if (tap(document.querySelector('.fresult .spoil'))) return true;
  // the result's own button, not the share button in its scrolling part
  if (tap(document.querySelector('.fresult > .btn'))) return true;
  if (tap(document.querySelector('.spin-foot .btn'))) return true;
  if (tap(document.querySelector('.mnode.now'))) return true;
  if (tap(document.querySelector('.bracket-screen .dock .btn'))) return true;
  return false;
})`;
