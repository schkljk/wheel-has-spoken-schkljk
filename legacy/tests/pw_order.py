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
        # clear chapters one after another the way the game does after a boss win
        seq=await pg.evaluate("""(()=>{storyEnsure();const seen=[F.story.ch];for(let i=0;i<21;i++){const S=F.story,ch=S.ch;S.cleared=[...new Set([...(S.cleared||[]),ch])];let nxt=ch<LASTCH?ch+1:LASTCH;while(nxt<LASTCH&&S.cleared.includes(nxt))nxt++;F.story=Object.assign(newChapter(nxt,S.ng),{cleared:S.cleared});saveCareer();storyEnsure();act2Migrate();seen.push(F.story.ch);}return seen.join(', ');})()""")
        print('chapter order:',seq)
        # a save broken by the bug: cleared 1 and 3, now in 7
        await pg.evaluate("F.story={ch:7,ng:0,rows:genMap(CHAPTERS[6]),row:2,picks:[],hp:80,grit:2,cleared:[1,5],v2:1,v3:1};saveCareer();showMap()")
        await pg.wait_for_timeout(300)
        print('repaired:',await pg.evaluate("JSON.stringify({ch:F.story.ch,name:CHAPTERS[F.story.ch-1].n,cleared:F.story.cleared,hp:F.story.hp,grit:F.story.grit})"))
        # a healthy save is left alone
        await pg.evaluate("F.story=Object.assign(newChapter(4,0),{cleared:[1,2,3]});saveCareer();showMap()")
        print('healthy save untouched:',await pg.evaluate("F.story.ch"))
        # the repaired save goes 2, then skips the City Circuit it already beat, then 4
        print('after repair, next chapters:',await pg.evaluate("""(()=>{F.story={ch:7,ng:0,rows:genMap(CHAPTERS[6]),row:2,picks:[],hp:80,grit:2,cleared:[1,5],v2:1,v3:1};storyEnsure();const out=[F.story.ch];for(let i=0;i<3;i++){const S=F.story,ch=S.ch;S.cleared=[...new Set([...(S.cleared||[]),ch])];let nxt=ch<LASTCH?ch+1:LASTCH;while(nxt<LASTCH&&S.cleared.includes(nxt))nxt++;F.story=Object.assign(newChapter(nxt,0),{cleared:S.cleared});storyEnsure();out.push(F.story.ch);}return out.join(', ');})()"""))
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
