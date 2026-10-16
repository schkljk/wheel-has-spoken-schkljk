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
        # an old five-chapter save moves onto the new ten chapters
        await pg.evaluate("storyEnsure();F.story={ch:3,ng:0,rows:[['fight']],row:0,picks:[],hp:70,grit:2,cleared:[1,2]};storyEnsure();saveCareer()")
        print('migrated old chapter 3:',await pg.evaluate("JSON.stringify({ch:F.story.ch,name:CHAPTERS[F.story.ch-1].n,cleared:F.story.cleared,len:F.story.rows.length,hp:F.story.hp,grit:F.story.grit})"))
        print('story card says:',await pg.evaluate("showHub(),document.querySelector('.storycard small').textContent"))
        # a boss fight uses 30 rounds and sudden death
        await pg.evaluate("F.story.ch=8;F.story.rows=genMap(CHAPTERS[7]);F.story.row=F.story.rows.length-1;F.story.seenIntro=true;saveCareer();showMap()")
        await pg.evaluate("enterNode(0)");await pg.wait_for_timeout(1200)
        print('cine visible:',await pg.is_visible('#cine .cine-btn'),'errors so far',errs[:1])
        print('boss intro:',(await pg.inner_text('#cine'))[:80].replace('\n',' / '))
        await pg.click('#cine .cine-btn');await pg.wait_for_timeout(300);await pg.click('#spinBtn')
        await pg.wait_for_selector('#cwWrap',timeout=30000);await pg.wait_for_timeout(800)
        print('round label:',await pg.inner_text('#rd'),'| rules:',await pg.evaluate("JSON.stringify({max:BT.maxR,sd:BT.sdOn})"))
        print('timer bar present after a spin?',end=' ')
        await pg.evaluate("cwSpin()");await pg.wait_for_timeout(1900)
        print(await pg.evaluate("!!document.querySelector('.cw-timer')"))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
