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
        await pg.wait_for_selector('#s-card:not([hidden])',timeout=120000);await pg.click('#enterBtn')
        await pg.evaluate("storyEnsure();F.gear={armor:'vest',helm:'ironhelm'};F.armory=['vest','ironhelm','irongauntlets','greaves','shadowhood'];DB.coins=500;DB.gems=30;saveCareer();showHub();setHubTab('fighter')")
        await pg.wait_for_timeout(300);await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','AR0.png'))
        await pg.click('#armoryBtn');await pg.wait_for_timeout(200)
        print('armory:',(await pg.inner_text('#choiceBody')).replace('\n',' / ')[:220])
        await pg.click('[data-armslot="gloves"]');await pg.click('[data-armon="irongauntlets"]')
        await pg.click('[data-armback]');await pg.click('[data-armslot="boots"]');await pg.click('[data-armon="greaves"]')
        await pg.click('[data-armback]');await pg.wait_for_timeout(200)
        print('equipped:',await pg.evaluate("JSON.stringify(F.gear)"),'| set bonus shown:',await pg.evaluate("document.querySelector('#choiceBody').textContent.includes('Knight set (2)')"))
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','AR1.png'))
        # swapping a helmet keeps the old one
        await pg.click('[data-armslot="helm"]');await pg.click('[data-armon="shadowhood"]')
        print('after swap: helm',await pg.evaluate("F.gear.helm"),'armory still has iron helm:',await pg.evaluate("F.armory.includes('ironhelm')"))
        # salvage asks first
        await pg.click('[data-armsalv="ironhelm"]');await pg.wait_for_timeout(200)
        print('confirm:',(await pg.inner_text('#choiceBody')).replace('\n',' / ')[:120])
        await pg.click('#choiceBody [data-ci="1"]');await pg.wait_for_timeout(200)
        print('cancelled, still owned:',await pg.evaluate("F.armory.includes('ironhelm')"),'| back in armory:',await pg.evaluate("document.querySelector('#choiceBody').textContent.includes('Armory')"))
        await pg.click('[data-close]')
        # premium purchase asks first
        await pg.evaluate("showHub();setHubTab('more')");await pg.click('#shopBtn');await pg.click('[data-s2="vault"]')
        await pg.click('[data-b2prem="rizzcrown"][data-cur="gem"]');await pg.wait_for_timeout(200)
        print('premium confirm:',(await pg.inner_text('#choiceBody')).replace('\n',' / ')[:120])
        await pg.click('#choiceBody [data-ci="0"]');await pg.wait_for_timeout(300)
        print('bought: gems',await pg.evaluate("DB.gems"),'trinket',await pg.evaluate("F.gear.trinket"))
        # reads are words now
        await pg.evaluate("Q=[];showHub();setHubTab('story')");await pg.click('#storyBtn');await pg.wait_for_timeout(500)
        if await pg.is_visible('#cine .cine-btn'):await pg.click('#cine .cine-btn')
        await pg.click('.mnode.now >> nth=0');await pg.wait_for_timeout(300)
        if await pg.evaluate("document.body.dataset.screen")=='s-spin':await pg.click('#spinBtn')
        await pg.wait_for_selector('.readpill',timeout=30000)
        print('read:',await pg.inner_text('.readpill'))
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','AR2.png'))
        # forfeit asks first
        await pg.click('#fmenuBtn');await pg.click('[data-fm="forfeit"]');await pg.wait_for_timeout(200)
        print('forfeit confirm:',(await pg.inner_text('#choiceBody')).replace('\n',' / ')[:80])
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
