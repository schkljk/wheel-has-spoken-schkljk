import os
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':760})
        errs=[]
        pg.on('pageerror',lambda e:errs.append((e.stack or str(e))[:400]))
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','wheel-has-spoken.html')))
        await pg.wait_for_timeout(600);await pg.evaluate("DB.tut=1;saveDB();document.querySelector('#cine').hidden=true")
        await pg.click('#fastBtn')
        await pg.click('#startBtn');await pg.click('#autoBtn')
        await pg.wait_for_selector('#s-card:not([hidden])',timeout=90000)
        await pg.click('#enterBtn')
        await pg.evaluate("for(const k of KS6)F.bonus[k]=12;F._win=null;saveCareer();showHub()")
        await pg.click('.hubtabs [data-tab="story"]');await pg.click('.tier[data-t="gauntlet"]')
        for i in range(4):
            await pg.click('#goFightBtn');await pg.click('#spinBtn');await pg.wait_for_function('!spinning&&!phys',timeout=20000)
            await pg.wait_for_selector('#cwWrap',timeout=30000);await pg.evaluate("document.querySelector('#skipBtn').click()")
            await pg.wait_for_selector('#result .res',timeout=60000)
            big=await pg.inner_text('#result .big');nxt=await pg.inner_text('#fightActions [data-a="next"]')
            await pg.click('#fightActions [data-a="next"]')
            seen=[]
            for k in range(10):
                await pg.wait_for_timeout(250)
                if await pg.is_visible('#choice'):
                    seen.append('choice: '+(await pg.inner_text('#choiceBody .ch-opt >> nth=0')).split('\n')[0]);await pg.click('#choiceBody .ch-opt >> nth=0');continue
                scr=await pg.evaluate("document.body.dataset.screen")
                if scr=='s-spin':
                    seen.append(await pg.inner_text('#catLabel'))
                    await pg.click('#spinBtn');await pg.wait_for_function('!spinning&&!phys',timeout=20000);await pg.wait_for_timeout(150);await pg.click('#spinBtn');continue
                break
            print('fight',i,big,'| button:',nxt,'| wheels:',seen,'| now:',scr,'| saved streak:',await pg.evaluate("DB.tourney&&DB.tourney.streak"))
            if scr!='s-bracket':break
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
