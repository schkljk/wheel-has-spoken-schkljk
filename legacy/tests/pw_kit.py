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
        print('fighter:',await pg.evaluate("[F.race.n,F.arch.n,F.weapon.n].join(' / ')"))
        print('card moves:',await pg.evaluate("[...document.querySelectorAll('.kitmv')].map(x=>x.textContent).join(', ')"))
        await pg.click('.kitmv >> nth=0');await pg.wait_for_timeout(200)
        print('move info:',(await pg.inner_text('#infoBody')).replace('\n',' / ')[:200])
        await pg.evaluate("closeInfo&&closeInfo()")
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','KT0.png'))
        await pg.click('#enterBtn');await pg.wait_for_timeout(300)
        await pg.evaluate("fastMode=false;Q=[];showHub();setHubTab('story')");await pg.click('#storyBtn');await pg.wait_for_timeout(500)
        if await pg.is_visible('#cine .cine-btn'):await pg.click('#cine .cine-btn')
        await pg.click('.mnode.now >> nth=0');await pg.wait_for_timeout(300)
        if await pg.evaluate("document.body.dataset.screen")=='s-spin':await pg.click('#spinBtn')
        await pg.wait_for_selector('#cwWrap',timeout=30000);await pg.wait_for_timeout(800)
        for fam in ['atk','def','pow']:
            await pg.click(f'[data-focus="{fam}"]');await pg.wait_for_timeout(150)
            print(fam,'wheel:',await pg.evaluate("cwList.map(e=>e.it.n+(e.it.src?'*':'')).join(', ')"))
        await pg.click('[data-focus="atk"]');await pg.wait_for_timeout(150)
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','KT1.png'))
        # play three rounds with own moves
        for r in range(3):
            await pg.evaluate("cwSpin()");await pg.wait_for_timeout(5200)
        print('log has special moves:',await pg.evaluate("fightLog.map(e=>e.html.replace(/<[^>]+>/g,'')).filter(t=>/:/.test(t)).slice(0,6).join(' || ')"))
        print('xp to level 2:',await pg.evaluate("xpNeed(1)"),'level 10->11:',await pg.evaluate("xpNeed(10)"),'| ranks',await pg.evaluate("RANKS.length"),'| talent tier 6 level',await pg.evaluate("TIER_LVL(6)"))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
