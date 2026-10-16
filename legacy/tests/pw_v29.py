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
        await pg.wait_for_selector('#s-card:not([hidden])',timeout=120000);await pg.click('#enterBtn');await pg.wait_for_timeout(800)
        print('icons on page:',await pg.evaluate("document.querySelectorAll('svg.pxi').length"),'| header icons:',await pg.evaluate("document.querySelectorAll('header .pxi').length"),'| tab icons:',await pg.evaluate("document.querySelectorAll('.hubtabs .pxi').length"))
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','V29a.png'))
        # flavor in help
        await pg.evaluate("openInfo(ik('gear','Rocket boots'))");await pg.wait_for_timeout(300)
        print('gear help:',(await pg.inner_text('#infoBody')).replace('\n',' / ')[:200])
        await pg.evaluate("closeInfo()")
        # vault gem prices
        await pg.evaluate("DB.coins=50;DB.gems=5;saveDB();$('#shopBtn').click()");await pg.click('[data-s2="vault"]');await pg.wait_for_timeout(300)
        print('vault prices:',await pg.evaluate("[...document.querySelectorAll('.buy.gem')].map(b=>b.textContent.trim()).join(', ')"))
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','V29b.png'))
        # healing shows percentages
        await pg.evaluate("storyEnsure();F.story.hp=50;F.bag={bandage:1};saveCareer();openBag()");await pg.wait_for_timeout(300)
        print('bag:',(await pg.inner_text('#choiceBody')).replace('\n',' / ')[:120])
        await pg.click('#choiceBody .buy >> nth=0');await pg.wait_for_timeout(300)
        print('toast:',await pg.inner_text('#toast'),'| story hp now',await pg.evaluate("F.story.hp"))
        await pg.evaluate("closeChoice()")
        # before the fight the scoreboard already shows real HP
        await pg.evaluate("fastMode=false;Q=[];F.story.hp=60;saveCareer();showMap()");await pg.wait_for_timeout(300)
        if await pg.is_visible('#cine .cine-btn'):await pg.click('#cine .cine-btn')
        await pg.click('.mnode.now >> nth=0');await pg.wait_for_timeout(250)
        if await pg.evaluate("document.body.dataset.screen")=='s-spin':await pg.click('#spinBtn')
        await pg.wait_for_function("document.body.dataset.screen==='s-fight'&&document.querySelector('.hud .hpv')",timeout=20000)
        print('scoreboard as the fight opens:',await pg.evaluate("[...document.querySelectorAll('.hud .hpv')].map(x=>x.textContent).join(' vs ')"),'| expected',await pg.evaluate("hpTxt(60)"))
        await pg.wait_for_selector('#cwWrap',timeout=30000);await pg.wait_for_timeout(600)
        # signature: the real damage wheel is the combat wheel
        await pg.evaluate("BT.P[0].en=100;renderMoves(curPlan)");await pg.wait_for_timeout(200)
        await pg.click('[data-focus="ult"]');await pg.wait_for_timeout(200)
        print('special wheel slices:',await pg.evaluate("cwList.map(e=>e.it.n).join(', ')"))
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','V29c.png'))
        await pg.evaluate("cwSpin()");await pg.wait_for_timeout(2600)
        print('second wheel overlay appeared:',await pg.evaluate("!!document.querySelector('.ultspin')"))
        await pg.wait_for_timeout(3000)
        print('log mentions the landed slice:',await pg.evaluate("fightLog.map(e=>e.html.replace(/<[^>]+>/g,'')).filter(t=>/signature wheel lands/.test(t)).slice(-1)[0]||'none'"))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
