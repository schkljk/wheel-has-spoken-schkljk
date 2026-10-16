import os
import asyncio
from playwright.async_api import async_playwright
VIEWS=[(320,568),(375,667),(390,844),(360,800),(412,915),(768,1024),(1280,720),(844,390),(667,375)]
CHK="""(()=>{const s=document.querySelector('#s-spin');const vh=innerHeight,vw=innerWidth;const bad=[];
  s.querySelectorAll('button,.btn,.wheel-wrap,.landed,.cat').forEach(el=>{if(el.closest('[hidden]')||el.hidden)return;const r=el.getBoundingClientRect();if(r.height<2)return;
    if(r.bottom>vh+1||r.right>vw+1||r.top<-1||r.left<-1)bad.push((el.id||String(el.className).split(' ')[0])+'@'+Math.round(r.top)+'-'+Math.round(r.bottom));});
  const w=s.querySelector('.wheel-wrap').getBoundingClientRect();
  return {bad,wheel:Math.round(w.width)+'x'+Math.round(w.height),reroll:!document.getElementById('rerollBtn').hidden};})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for (W,H) in VIEWS:
            pg=await b.new_page(viewport={'width':W,'height':H})
            await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
            await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','wheel-has-spoken.html')));await pg.wait_for_timeout(400)
            await pg.evaluate("DB.tut=1;saveDB();document.querySelector('#cine').hidden=true;fastMode=true")
            await pg.evaluate("startBuild('Test')");await pg.wait_for_timeout(200)
            a=await pg.evaluate(CHK)
            await pg.evaluate("doSpin()");await pg.wait_for_function("!phys",timeout=15000);await pg.wait_for_timeout(1700)
            b2=await pg.evaluate(CHK)
            await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots',f'SPC_{W}x{H}.png'))
            print(f'{W}x{H}','before',a,'| after landing',b2)
            await pg.close()
        await b.close()
asyncio.run(main())
