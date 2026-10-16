import os
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,color_scheme='dark',has_touch=True)
        errs=[]
        pg.on('pageerror',lambda e:errs.append((e.stack or str(e))[:300]))
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','wheel-has-spoken.html')));await pg.wait_for_timeout(500)
        await pg.evaluate("DB.tut=1;saveDB();document.querySelector('#cine').hidden=true")
        await pg.click('#fastBtn');await pg.click('#startBtn');await pg.click('#autoBtn')
        await pg.wait_for_selector('#s-card:not([hidden])',timeout=120000)
        print('charisma:',await pg.evaluate("F.cha&&F.cha.n"),'| card row:',await pg.evaluate("document.querySelector('#cardBox').textContent.includes('Charisma')"))
        await pg.click('#enterBtn');await pg.wait_for_timeout(300)
        print('header:',await pg.evaluate("[document.getElementById('homeBtn').textContent,document.getElementById('gemChip').textContent,document.getElementById('gemChip').hidden]"))
        await pg.evaluate("DB.coins=300;DB.gems=20;saveDB();storyEnsure();F.gear={armor:'vest'};saveCareer();showHub();setHubTab('more')")
        await pg.click('#shopBtn');await pg.wait_for_timeout(200)
        print('basics:',await pg.evaluate("[...document.querySelectorAll('#shopList .st2 b')].map(b=>b.textContent).join(', ')"))
        await pg.click('[data-b2item="bandage"]');print('bag after buying:',await pg.evaluate("JSON.stringify(F.bag)"))
        await pg.click('[data-s2="deal"]');print('deal:',(await pg.inner_text('#shopList')).replace('\n',' / ')[:200])
        await pg.click('[data-s2="vault"]');print('vault:',await pg.evaluate("[...document.querySelectorAll('#shopList .shopitem')].length"),'items')
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','EC1.png'))
        await pg.click('[data-b2prem="rizzcrown"][data-cur="gem"]');print('bought with gems: gems',await pg.evaluate("DB.gems"),'trinket',await pg.evaluate("F.gear.trinket"))
        await pg.click('[data-s2="services"]');await pg.click('[data-b2sell="vest"]');print('sold vest, coins',await pg.evaluate("DB.coins"))
        # haggle at base
        await pg.click('[data-b2hag]');await pg.wait_for_timeout(200)
        print('haggle options:',(await pg.inner_text('#choiceBody')).replace('\n',' / ')[:300])
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','EC2.png'))
        await pg.click('#choiceBody [data-ci="1"]');await pg.wait_for_timeout(200)
        print('base haggle:',await pg.evaluate("JSON.stringify(DB.baseHag)"))
        # mid-chapter: base shop locks
        await pg.evaluate("F.story.row=2;saveCareer();renderShop()")
        print('locked:',await pg.evaluate("!!document.querySelector('.lockbar')"),'buttons disabled:',await pg.evaluate("[...document.querySelectorAll('#shopList .buy')].every(b=>b.disabled)"))
        # story merchant
        await pg.evaluate("F.story.ch=4;F.story.stockRow=-1;merchant()");await pg.wait_for_timeout(200)
        print('merchant:',(await pg.inner_text('#choiceBody')).replace('\n',' / ')[:260])
        await pg.click('[data-m2hag]');await pg.wait_for_timeout(200);await pg.click('#choiceBody [data-ci="0"]');await pg.wait_for_timeout(300)
        print('merchant haggle mult',await pg.evaluate("F.story.hagMult"),'| still haggle button?',await pg.evaluate("!!document.querySelector('[data-m2hag]')"))
        it=await pg.evaluate("F.story.stock[0]");await pg.click(f'[data-m2item="{it}"]');print('bought',it,'bag',await pg.evaluate("JSON.stringify(F.bag)"))
        await pg.click('[data-m2bag]');await pg.wait_for_timeout(200);print('bag opens:',(await pg.inner_text('#choiceBody'))[:60].replace('\n',' / '))
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','EC3.png'))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
