import os
import asyncio
from playwright.async_api import async_playwright
async def spin(pg):
    await pg.click('#spinBtn');await pg.wait_for_function('!spinning&&!phys',timeout=20000);await pg.wait_for_timeout(300)
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
        print('sidekick:',await pg.evaluate("F.side&&F.side.n"),'| card row:',await pg.evaluate("document.querySelector('#cardBox').innerHTML.includes('Sidekick')"))
        await pg.click('#enterBtn');await pg.wait_for_timeout(300)
        await pg.click('.hubtabs [data-tab="story"]');await pg.wait_for_timeout(300)
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','MD1.png'))
        # daily challenge: mutator wheel, intro, fight, result, loot
        await pg.click('[data-mode="daily"]');await pg.wait_for_timeout(300)
        print('mutator wheel:',await pg.inner_text('#catLabel'))
        await spin(pg);print('mutator:',await pg.evaluate("DB.dc.mut"))
        await pg.click('#spinBtn');await pg.wait_for_timeout(400)
        print('intro:',(await pg.inner_text('#choiceBody')).replace('\n',' / ')[:200])
        await pg.click('#choiceBody [data-ci="0"]');await pg.wait_for_timeout(300)
        if await pg.evaluate("document.body.dataset.screen")=='s-spin':await spin(pg)
        await pg.wait_for_selector('#cwWrap',timeout=20000)
        await pg.evaluate("for(const k of KS6)F.bonus[k]=12;F._win=null")
        await pg.click('#fmenuBtn');await pg.click('[data-fm="skip"]');await pg.wait_for_selector('#result .res',timeout=30000)
        print('daily result:',(await pg.inner_text('#result')).replace('\n',' / ')[:200])
        await pg.click('#fightActions [data-a]');await pg.wait_for_timeout(400)
        if await pg.evaluate("document.body.dataset.screen")=='s-spin':
            print('loot wheel slices:',await pg.evaluate("curList.map(e=>e.it.n).join(', ')"))
            await spin(pg);print('loot landed:',(await pg.inner_text('#landed')).replace('\n',' / ')[:150])
            await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','MD2.png'))
        print('daily done:',await pg.evaluate("DB.dc.done"))
        # boss rush
        for i in range(14):
            scr=await pg.evaluate("document.body.dataset.screen")
            if scr=='s-hub':break
            if await pg.is_visible('#choice .ch-opt'):await pg.click('#choice .ch-opt >> nth=0')
            elif scr=='s-spin' and await pg.is_enabled('#spinBtn'):await pg.click('#spinBtn')
            await pg.wait_for_timeout(1200)
        await pg.evaluate("Q=[];closeChoice();F.lvl=10;saveCareer();showHub();setHubTab('story')");await pg.wait_for_timeout(600)
        print('screen before rush:',await pg.evaluate("document.body.dataset.screen"))
        await pg.click('[data-mode="rush"]');await pg.wait_for_timeout(500)
        print('rush intro:',(await pg.inner_text('#cine'))[:60].replace('\n',' / '))
        await pg.click('#cine .cine-btn');await spin(pg)
        await pg.wait_for_selector('#cwWrap',timeout=20000)
        await pg.click('#fmenuBtn');await pg.click('[data-fm="skip"]');await pg.wait_for_selector('#result .res',timeout=30000)
        print('rush result:',(await pg.inner_text('#result')).replace('\n',' / ')[:160])
        await pg.click('#fightActions [data-a]');await pg.wait_for_timeout(500)
        print('after rush fight 1:',await pg.evaluate("document.body.dataset.screen"),'cine:',await pg.is_visible('#cine .cine-btn'),'BR',await pg.evaluate("JSON.stringify(BR)"))
        if await pg.is_visible('#cine .cine-btn'):
            await pg.evaluate("document.querySelector('#cine').hidden=true")
        # fight club
        await pg.evaluate("Q=[];DB.coins=100;saveDB();showHub();setHubTab('story')");await pg.wait_for_timeout(300)
        await pg.click('[data-mode="club"]');await pg.wait_for_timeout(400)
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','MD3.png'))
        await pg.click('[data-clubbet="25"]');await pg.click('[data-club="A"]')
        await pg.wait_for_selector('#fcEnd button',timeout=60000)
        print('club:',(await pg.inner_text('#fcEnd')).replace('\n',' / ')[:120],'coins',await pg.evaluate("DB.coins"))
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','MD4.png'))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
