/**
 * Plays the legacy game in headless Chromium with a seeded Math.random and dumps its save, to get
 * real-shaped fixtures for the legacy save importer.
 *
 *   npx tsx tools/fixtures/legacy-saves.ts
 *
 * Writes packages/core/test/fixtures/legacy-played.json (story progress, daily challenge, three
 * roster slots, collection, goals, gems...).
 */
import { chromium, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'packages/core/test/fixtures');

const SEEDED_RANDOM = `(() => {
  let a = 20261016 >>> 0;
  Math.random = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();`;

const js = <T>(page: Page, src: string) => page.evaluate(src) as Promise<T>;

async function playStory(page: Page, steps: number) {
  for (let step = 0; step < steps; step++) {
    await page.waitForTimeout(80);
    const st = await js<{ scr: string; cine: boolean; sheet: boolean }>(
      page,
      `({scr:document.body.dataset.screen,cine:!document.querySelector('#cine').hidden,sheet:!document.querySelector('#choice').hidden})`,
    );
    if (st.cine) {
      await page.click('#cine .cine-btn');
      continue;
    }
    if (st.sheet) {
      const opts = await page.$$('#choiceBody .ch-opt:not([disabled])');
      if (opts.length) {
        await opts[0]!.click();
        continue;
      }
      const c = await page.$('#choiceBody [data-close]');
      if (c) await c.click();
      continue;
    }
    if (st.scr === 's-map') {
      const nodes = await page.$$('.mnode.now');
      if (nodes.length) await nodes[step % nodes.length]!.click();
      continue;
    }
    if (st.scr === 's-spin') {
      if (await page.isEnabled('#spinBtn')) {
        const lab = await page.innerText('#spinBtn');
        await page.click('#spinBtn');
        if (lab.startsWith('Spin')) await page.waitForFunction('!spinning&&!phys', undefined, { timeout: 20000 });
      }
      continue;
    }
    if (st.scr === 's-fight') {
      if (await page.$('#result .res')) {
        await page.click('#fightActions [data-a]');
        continue;
      }
      await js(page, `document.querySelector('#skipBtn')&&document.querySelector('#skipBtn').click()`);
      continue;
    }
    if (st.scr === 's-hub') await page.click('#storyBtn');
  }
}

async function main() {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(SEEDED_RANDOM);
  await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
  await page.goto('file://' + resolve(ROOT, 'legacy/dist/wheel-has-spoken.html'));
  await page.waitForTimeout(500);
  await js(page, `DB.tut=1;saveDB();document.querySelector('#cine').hidden=true`);
  await page.click('#fastBtn');
  await page.click('#startBtn');
  await page.click('#autoBtn');
  await page.waitForSelector('#s-card:not([hidden])', { timeout: 120000 });
  await page.click('#enterBtn');
  // a sturdier fighter gets further into the story
  await js(page, `for(const k of KS6)F.bonus[k]=4;F._win=null;saveCareer();showHub()`);
  await page.click('#storyBtn');
  await playStory(page, 90);

  // daily challenge
  await js(page, `Q=[];closeChoice();document.querySelector('#cine').hidden=true;showHub();setHubTab('story')`);
  await page.waitForTimeout(300);
  if (await page.$('[data-mode="daily"]')) {
    await page.click('[data-mode="daily"]');
    await page.waitForTimeout(300);
    await page.click('#spinBtn');
    await page.waitForFunction('!spinning&&!phys', undefined, { timeout: 20000 });
    await page.waitForTimeout(300);
    await page.click('#spinBtn');
    await page.waitForTimeout(400);
    await page.click('#choiceBody [data-ci="0"]');
    await page.waitForTimeout(300);
    if ((await js(page, 'document.body.dataset.screen')) === 's-spin') {
      await page.click('#spinBtn');
      await page.waitForFunction('!spinning&&!phys', undefined, { timeout: 20000 });
    }
    await page.waitForSelector('#cwWrap', { timeout: 20000 });
    await page.click('#fmenuBtn');
    await page.click('[data-fm="skip"]');
    await page.waitForSelector('#result .res', { timeout: 30000 });
    await page.click('#fightActions [data-a]');
    await page.waitForTimeout(400);
  }

  // fill the other roster slots with legacy-serialized fighters, retire one, add gear and talents
  await js(
    page,
    `(()=>{Q=[];closeChoice();
      F.gear=Object.assign({},F.gear,{armor:'chain',helm:'ironhelm',gloves:'irongauntlets'});F.armory=['vest','coin','ironhelm'];
      F.talents={off_sharp:2,def_tough:1};F.tp=(F.tp||0)+1;saveCareer();
      for(let i=1;i<3;i++){const f=randomFighter('Slot Fighter '+i);f.career=true;f.cid='slot'+i;
        Object.assign(f,{lvl:5+i*3,xp:4,rec:{w:6+i,l:3},earned:['onepunch'],inj:[{k:'ankle',left:1}],belts:{local:1},gear:{trinket:'coin'},talents:['o1','d1']});
        DB.slots[i]={career:serFighter(f),nemesis:null,tourney:null,coins:20*i};}
      const r=randomFighter('Retired Legend');r.lvl=22;DB.retired.push(Object.assign(serFighter(r),{retiredAt:Date.now()}));
      DB.legacy.pts=(DB.legacy.pts||0)+3;DB.legacy.perks.coins=1;DB.gems=(DB.gems||0)+5;
      saveDB();})()`,
  );
  const save = await js<string>(page, `localStorage.getItem(STORE)`);
  const parsed = JSON.parse(save) as Record<string, unknown>;
  // timestamps and dates make the fixture differ per run; pin them
  writeFileSync(resolve(OUT, 'legacy-played.json'), JSON.stringify(parsed, null, 1) + '\n');
  console.log(`wrote legacy-played.json (${Math.round(save.length / 1024)} KB), keys: ${Object.keys(parsed).join(', ')}`);
  if (errors.length) console.log('page errors:', errors);
  await browser.close();
}

await main();
