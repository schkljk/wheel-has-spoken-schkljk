import os
import asyncio,sys,json
from playwright.async_api import async_playwright
VIEWS=[(320,568),(375,667),(390,844),(430,932),(360,800),(412,915),(768,1024),(1024,768),(1280,720),(1440,900),(844,390),(667,375)]
if len(sys.argv)>1:VIEWS=[tuple(map(int,v.split('x'))) for v in sys.argv[1:]]
CLIP="""(()=>{const s=document.querySelector('.screen:not([hidden])');if(!s)return {id:null};
  const out=[];const sb=s.getBoundingClientRect();const vw=innerWidth,vh=innerHeight;
  const els=s.querySelectorAll('button,.btn,h1,h2,b,small,canvas,svg.ch,.fi,.fchip,.mnode,.slot,input,.readpill,.res .big,.gains li,.st,.tier,.offer,.menu-i,.cw-out,.legend,.landed,.storycard,.maphead');
  for(const el of els){
    if(el.closest('[hidden]'))continue;const r=el.getBoundingClientRect();if(r.width<2||r.height<2)continue;
    const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')continue;
    // the viewport itself
    if(el.id==='idle')continue;
    // content inside a scrolling panel is reachable, so it is not cut off
    let sc=el.parentElement,inScroll=false;while(sc&&sc!==s){const st=getComputedStyle(sc);if(/(auto|scroll)/.test(st.overflowY+st.overflowX)){inScroll=true;break;}sc=sc.parentElement;}
    if(inScroll){const sr=sc.getBoundingClientRect();if(sr.bottom>vh+1||sr.right>vw+1||sr.left<-1)out.push('PANEL:'+(sc.id||String(sc.className).split(' ')[0]));continue;}
    let bad=r.right>vw+1||r.left<-1||r.bottom>vh+1||r.top<-1;
    // clipped by a non-scrolling ancestor
    let a=el.parentElement;
    while(a&&!bad&&a!==document.body){const st=getComputedStyle(a);
      if(st.overflowY!=='visible'||st.overflowX!=='visible'){const ar=a.getBoundingClientRect();const scrollY=/(auto|scroll)/.test(st.overflowY),scrollX=/(auto|scroll)/.test(st.overflowX);
        if(!scrollY&&(r.bottom>ar.bottom+2||r.top<ar.top-2))bad=true;if(!scrollX&&(r.right>ar.right+2||r.left<ar.left-2))bad=true;
        if(scrollY||scrollX)break;}
      a=a.parentElement;}
    if(bad)out.push(((el.id?'#'+el.id:'')||(el.className&&el.className.baseVal===undefined?String(el.className).split(' ')[0]:el.tagName)).slice(0,18)+'@'+Math.round(r.top)+','+Math.round(r.left));
  }
  return {id:s.id,n:out.length,ex:out.slice(0,4),page:document.scrollingElement.scrollHeight>vh+1||document.scrollingElement.scrollWidth>vw+1};})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        # build one save to reuse
        pg=await b.new_page(viewport={'width':390,'height':844})
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','wheel-has-spoken.html')));await pg.wait_for_timeout(500)
        await pg.evaluate("DB.tut=1;saveDB();document.querySelector('#cine').hidden=true")
        await pg.click('#fastBtn');await pg.click('#startBtn');await pg.click('#autoBtn')
        await pg.wait_for_selector('#s-card:not([hidden])',timeout=120000);await pg.click('#enterBtn')
        await pg.evaluate("""(()=>{F.name='Bartholomew McThunder';F.contract=null;storyEnsure();F.story.seenIntro=true;F.story.row=4;F.gear={armor:'chain',trinket:'coin'};F.talents=['o1'];saveCareer();
          for(let i=1;i<3;i++){const f=randomFighter('Filler Fighter Number '+i);f.career=true;f.cid='x'+i;Object.assign(f,{lvl:7,xp:0,rec:{w:9,l:4},earned:[],inj:[],belts:{},gear:{}});DB.slots[i]={career:serFighter(f),nemesis:null,tourney:null,coins:55};}saveDB();})()""")
        save=await pg.evaluate("localStorage.getItem(STORE)")
        await pg.close()
        res={}
        for (W,H) in VIEWS:
            ctx=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=1,has_touch=True)
            await ctx.add_init_script(f"localStorage.setItem('wheel-has-spoken-v1',{json.dumps(save)})")
            pg=await ctx.new_page();errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
            await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
            await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','wheel-has-spoken.html')));await pg.wait_for_timeout(500)
            row={}
            async def chk(tag,shot=False):
                await pg.wait_for_timeout(250);r=await pg.evaluate(CLIP);row[tag]=r
                if shot:await pg.screenshot(path=os.path.join(os.path.dirname(__file__),'shots',f'MX_{W}x{H}_{tag}.png'))
            await chk('title',True)
            await pg.evaluate("switchSlot(0);startBuild('Test Person');");await chk('spin',True)
            await pg.evaluate("switchSlot(0);document.querySelector('#cardBox').innerHTML=cardHTML(F);show('s-card')");await chk('card',True)
            for t in ['story','fighter','events','more']:
                await pg.evaluate(f"showHub();setHubTab('{t}')");await chk('hub_'+t,t=='story')
            await pg.evaluate("showMap()");await chk('map',True)
            await pg.evaluate("renderShop();show('s-shop')");await chk('shop')
            await pg.evaluate("""(()=>{T={tier:{k:'story',n:'Story fight',e:'📖',xpW:0,coins:0},story:true,node:'fight'};curOppF=randomFighter('Opponent With Long Name');curOppF.lvl=2;curArena=ARENAS[2];openFight();})()""")
            try:
                await pg.wait_for_selector('#cwWrap',timeout=15000);await pg.wait_for_timeout(900)
            except Exception:pass
            await chk('fight',True)
            await pg.evaluate("BT.over=true;BT.w=1;skipFlag=true;if(!playing)finishFight()")
            try:await pg.wait_for_selector('#result .res',timeout=15000)
            except Exception:pass
            await pg.wait_for_timeout(500);await chk('result',True)
            res[f'{W}x{H}']=row
            bad={k:(v.get('n'),v.get('ex'),'PAGE' if v.get('page') else '') for k,v in row.items() if v.get('n') or v.get('page')}
            print(f'{W}x{H}',json.dumps(bad)[:600] if bad else 'OK','ERR' if errs else '',errs[:1])
            await ctx.close()
        await b.close()
asyncio.run(main())
