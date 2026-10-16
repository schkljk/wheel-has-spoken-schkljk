import os
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':844})
        errs=[]
        pg.on('pageerror',lambda e:errs.append((e.stack or str(e))[:300]))
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','wheel-has-spoken.html')));await pg.wait_for_timeout(500)
        await pg.evaluate("DB.tut=1;saveDB();document.querySelector('#cine').hidden=true")
        await pg.click('#fastBtn');await pg.click('#startBtn');await pg.click('#autoBtn')
        await pg.wait_for_selector('#s-card:not([hidden])',timeout=120000);await pg.click('#enterBtn')
        await pg.evaluate("storyEnsure();F.story.ch=3;F.story.rows=genMap(CHAPTERS[2]);F.story.row=F.story.rows.length-1;F.story.seenIntro=true;saveCareer();showMap();enterNode(0)")
        await pg.wait_for_timeout(1200);await pg.click('#cine .cine-btn');await pg.wait_for_timeout(300);await pg.click('#spinBtn')
        await pg.wait_for_selector('#cwWrap',timeout=30000)
        await pg.evaluate("BT.P[1].hp=1;BT.P[1].tr.revive=0;BT.P[1].f.phase=null")
        await pg.click('#fmenuBtn');await pg.click('[data-fm="skip"]');await pg.wait_for_selector('#result .res',timeout=60000)
        print('boss result:',(await pg.inner_text('#result')).replace('\n',' / ')[:260])
        print('gems',await pg.evaluate("DB.gems"),'coins',await pg.evaluate("DB.coins"),'chapter now',await pg.evaluate("F.story.ch"),'row',await pg.evaluate("F.story.row"))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
