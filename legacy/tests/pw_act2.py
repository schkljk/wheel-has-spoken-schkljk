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
        print('chapters',await pg.evaluate("CHAPTERS.length"),'bosses',await pg.evaluate("BOSSES.length"))
        r=await pg.evaluate("""(()=>{storyEnsure();const out=[];for(let ch=11;ch<=20;ch++){F.story.ch=ch;try{const b=makeBoss(ch);out.push(ch+':'+b.name+' hp'+b.maxHp+' lvl'+b.lvl);}catch(e){out.push(ch+':ERR '+e.message);}}F.story.ch=1;return out.join(' | ');})()""")
        print('act II bosses:',r)
        # an old finished-story save in encore moves on to Act II
        await pg.evaluate("F.story={ch:2,ng:1,rows:genMap(CHAPTERS[1]),row:0,picks:[],hp:90,grit:3,cleared:[1,2,3,4,5,6,7,8,9,10],v2:1};saveCareer();showMap()")
        await pg.wait_for_timeout(400)
        print('after migration:',await pg.evaluate("JSON.stringify({ch:F.story.ch,ng:F.story.ng,name:CHAPTERS[F.story.ch-1].n,len:F.story.rows.length})"))
        if await pg.is_visible('#cine .cine-btn'):
            print('chapter intro:',(await pg.inner_text('#cine'))[:90].replace('\n',' / '));await pg.click('#cine .cine-btn')
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','A2a.png'))
        # goals tab
        await pg.evaluate("for(let i=0;i<12;i++){track('wins');addMasteryWin(F);}track('elites',5);checkGoals();showHub();setHubTab('goals')")
        await pg.wait_for_timeout(500)
        print('goals tab:',(await pg.inner_text('#tab-goals')).replace('\n',' / ')[:300])
        print('goals done',await pg.evaluate("JSON.stringify(DB.goalsDone)"),'gems',await pg.evaluate("DB.gems"),'mastery',await pg.evaluate("JSON.stringify(DB.mastery)"))
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','A2b.png'))
        await pg.click('[data-allmastery]');await pg.wait_for_timeout(200);await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','A2c.png'))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
