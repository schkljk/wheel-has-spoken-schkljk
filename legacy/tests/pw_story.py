import os
import asyncio,sys,json
from playwright.async_api import async_playwright
STEPS=int(sys.argv[1]) if len(sys.argv)>1 else 160
BOOST=int(sys.argv[2]) if len(sys.argv)>2 else 0
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,color_scheme='dark',has_touch=True)
        errs=[]
        pg.on('pageerror',lambda e:errs.append((e.stack or str(e))[:500]))
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','wheel-has-spoken.html')))
        await pg.wait_for_timeout(600);await pg.evaluate("DB.tut=1;saveDB();document.querySelector('#cine').hidden=true")
        await pg.click('#fastBtn')
        await pg.click('#startBtn');await pg.click('#autoBtn')
        await pg.wait_for_selector('#s-card:not([hidden])',timeout=120000)
        await pg.click('#enterBtn')
        if BOOST:await pg.evaluate(f"for(const k of KS6)F.bonus[k]={BOOST};F._win=null;saveCareer();showHub()")
        await pg.click('#storyBtn')
        log=[];shots=set()
        try:
         for step in range(STEPS):
             await pg.wait_for_timeout(120)
             st=await pg.evaluate("""(()=>({scr:document.body.dataset.screen,cine:!document.querySelector('#cine').hidden,sheet:!document.querySelector('#choice').hidden,
               ch:F&&F.story?F.story.ch:0,row:F&&F.story?F.story.row:0,hp:F&&F.story?F.story.hp:0,grit:F&&F.story?F.story.grit:0,lvl:F?F.lvl:0}))()""")
             key=f"{st['scr']}|{st['cine']}|{st['sheet']}"
             if st['cine']:
                 txt=(await pg.inner_text('#cine'))[:80].replace('\n',' / ')
                 log.append(f"[cine] {txt}")
                 if 'boss' in txt.lower() and 'bossintro' not in shots:shots.add('bossintro');await pg.wait_for_timeout(900);await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','SB1.png'))
                 elif 'Chapter' in txt and 'chintro' not in shots:shots.add('chintro');await pg.wait_for_timeout(700);await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','SB0.png'))
                 await pg.click('#cine .cine-btn');continue
             if st['sheet']:
                 txt=(await pg.inner_text('#choiceBody'))[:90].replace('\n',' / ')
                 log.append(f"[sheet] {txt}")
                 if 'sheet' not in shots:shots.add('sheet');await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','SB2.png'))
                 opts=await pg.query_selector_all('#choiceBody .ch-opt:not([disabled])')
                 if opts:await opts[0].click();continue
                 c=await pg.query_selector('#choiceBody [data-close]')
                 if c:await c.click();continue
             scr=st['scr']
             if scr=='s-map':
                 if 'map' not in shots:shots.add('map');await pg.wait_for_timeout(400);await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','SB3.png'))
                 nodes=await pg.query_selector_all('.mnode.now')
                 # prefer fights early to exercise the fight flow
                 await nodes[step%len(nodes)].click();log.append(f"[map] ch{st['ch']} row{st['row']} hp{st['hp']} grit{st['grit']} lvl{st['lvl']}");continue
             if scr=='s-spin':
                 if await pg.is_enabled('#spinBtn'):
                     lab=await pg.inner_text('#spinBtn');await pg.click('#spinBtn')
                     if lab.startswith('Spin'):
                         await pg.wait_for_function('!spinning&&!phys',timeout=20000);await pg.wait_for_timeout(200)
                         log.append(f"[wheel] {await pg.inner_text('#catLabel')}: {(await pg.inner_text('#landed')).splitlines()[0] if (await pg.inner_text('#landed')).strip() else ''}")
                 continue
             if scr=='s-fight':
                 if await pg.query_selector('#result .res'):
                     big=await pg.inner_text('#result .big');log.append(f"[result] {big} | {(await pg.inner_text('#result')).replace(chr(10),' / ')[:200]}")
                     if 'result' not in shots:shots.add('result');await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots','SB5.png'))
                     await pg.click('#fightActions [data-a]');continue
                 await pg.evaluate("document.querySelector('#skipBtn')&&document.querySelector('#skipBtn').click()")
                 continue
             if scr=='s-hub':
                 await pg.click('#storyBtn');continue
             log.append('[?] '+scr)
        except Exception as ex:
            print('EXC',str(ex)[:200])
        for l in log:print(l[:230])
        print('FINAL',await pg.evaluate("JSON.stringify({ch:F.story.ch,row:F.story.row,hp:F.story.hp,grit:F.story.grit,lvl:F.lvl,coins:DB.coins,gear:F.gear,bag:F.bag,cleared:F.story.cleared,fame:F.fame})"))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
