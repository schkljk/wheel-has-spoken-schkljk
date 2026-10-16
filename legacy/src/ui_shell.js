// ================= APP SHELL: menus instead of scrolling =================
// title: records, legacy and the hall of fame live in a sheet
{
  const ov=document.createElement('div');ov.className='sheetov';ov.id='recordsOv';ov.hidden=true;
  ov.innerHTML='<div class="sheet2"><div class="ch-h"><span class="ch-i">📊</span><div><b>Records and legacy</b><small>Seasons, legacy perks, collection and the hall of fame</small></div></div><div id="recordsBody"></div><button class="btn ghost" id="recordsClose">Close</button></div>';
  document.getElementById('app').appendChild(ov);
  const body=ov.querySelector('#recordsBody');
  ['records','seasonBox','collBox','hall'].forEach(id=>{const el=document.getElementById(id);if(el)body.appendChild(el);});
  const mb=document.querySelector('#s-title .more-box');if(mb)mb.remove();
  const menu=document.createElement('div');menu.className='title-menu';
  menu.innerHTML='<button class="btn ghost" id="recordsBtn">📊 Records and legacy</button><button class="btn ghost" id="titleCodexBtn">📚 Collection</button>';
  document.getElementById('newWrap').after(menu);
  document.getElementById('recordsBtn').addEventListener('click',()=>{ov.hidden=false;ov.classList.remove('show');void ov.offsetWidth;ov.classList.add('show');});
  document.getElementById('recordsClose').addEventListener('click',()=>{ov.hidden=true;});
  ov.addEventListener('click',e=>{if(e.target===ov)ov.hidden=true;});
  document.getElementById('titleCodexBtn').addEventListener('click',()=>openCodex());
}
// spin screen: what you've landed so far is one tap away instead of below the fold
{
  const b=document.createElement('button');b.className='btn ghost sofar-btn';b.id='sofarBtn';b.textContent='📋 So far';
  document.getElementById('progWrap').appendChild(b);
  b.addEventListener('click',()=>{
    const pv=document.getElementById('preview').innerHTML,sh=document.getElementById('sheet').innerHTML;
    setSheet(`<div class="ch-h"><span class="ch-i">📋</span><div><b>${esc(F&&F.name||'Your fighter')}</b><small>Everything landed so far</small></div></div>${pv}<dl class="sheet">${sh||'<dd class="hint">Nothing yet. Spin!</dd>'}</dl><button class="btn ghost" data-close="1">Close</button>`);
  });
}
// card screen: the full list of wheel results opens in a sheet
{
  const b=document.createElement('button');b.className='btn ghost sm card-more';b.id='cardMoreBtn';b.textContent='📋 Every wheel result and trait';
  document.getElementById('cardBox').after(b);
  b.addEventListener('click',()=>{if(F)openSheet(F);});
}
// ---------- the fight menu ----------
function openFightMenu(){
  if(!BT)return;
  const O=curOppF,AR=curArena||{},pct=Math.round(curOdds*100);
  setSheet(`<div class="ch-h"><span class="ch-i">⏸️</span><div><b>${esc((T&&T.tier&&T.tier.n)||'Fight')}</b><small>Round ${BT.round||1}</small></div></div>
    <div class="fm-scout"><span class="fi fi-odds ${pct>=60?'good':pct>=40?'even':'bad'}">${pct}% to win</span><span class="fi">📈 ${esc(powerScale(F).n)} vs ${esc(powerScale(O).n)}</span>${rankTxt(O)?`<span class="fi">🏅 ${rankTxt(O)} of 1000</span>`:''}${AR.n?`<span class="fi" role="button" tabindex="0" data-info="${ik('arena',AR.n)}">${AR.e} ${esc(AR.n)}</span>`:''}</div>
    <div class="fm-grid">
      <button class="menu-i${autoBattle?' on':''}" data-fm="auto"><span>🤖</span><b>Auto-battle</b><small>${autoBattle?'On':'Off'}</small></button>
      <button class="menu-i${fastMode?' on':''}" data-fm="fast"><span>⚡</span><b>Fast mode</b><small>${fastMode?'On':'Off'}</small></button>
      <button class="menu-i" data-fm="skip"><span>⏭</span><b>Skip</b><small>Jump to the result</small></button>
      <button class="menu-i" data-fm="log"><span>📜</span><b>Fight log</b><small>Everything so far</small></button>
      <button class="menu-i" data-fm="card"><span>🪪</span><b>Their card</b><small>${esc(O.name)}</small></button>
      <button class="menu-i" data-fm="rules"><span>❓</span><b>How it works</b><small>Moves and focus</small></button>
      <button class="menu-i" data-fm="settings"><span>⚙️</span><b>Settings</b><small>Sound, vibration</small></button>
      <button class="menu-i danger" data-fm="forfeit"><span>🏳️</span><b>Forfeit</b><small>Tap twice</small></button>
    </div>
    <button class="btn" data-close="1">Back to the fight</button>`);
}
let fmForfeit=0;
document.getElementById('choice').addEventListener('click',e=>{
  const b=e.target.closest('[data-fm]');if(!b)return;
  const k=b.dataset.fm;
  if(k==='auto'){closeChoice();$('#autoTog').click();}
  else if(k==='fast'){$('#fastBtn').click();syncAuto();openFightMenu();}
  else if(k==='skip'){closeChoice();$('#skipBtn').click();}
  else if(k==='log'){$('#logBtn').click();}
  else if(k==='card'){closeChoice();openSheet(curOppF);}
  else if(k==='rules'){closeChoice();openInfo('rule|moves');}
  else if(k==='settings'){openSettings();}
  else if(k==='forfeit'){
    if(Date.now()-fmForfeit>3000){fmForfeit=Date.now();b.querySelector('small').textContent='Tap again to give up';return;}
    closeChoice();forfeitArm=Date.now();$('#forfeitBtn').click();
  }
});
document.addEventListener('click',e=>{if(e.target.closest('#fmenuBtn'))openFightMenu();});
// ---------- fight layout: one place decides every size, for any screen ----------
function fightDims(){
  const vw=innerWidth,vh=innerHeight;
  const side=vw>vh*1.15&&vh<600;                  // phones held sideways: fighters left, wheel right
  const col=Math.min(vw,760);                      // the UI column; the scene itself fills the screen
  let stageW,groundY,panelW,panelH;
  if(side){stageW=Math.round(Math.min(vw,1100)*0.6);groundY=vh-30;panelW=Math.min(vw,1100)-stageW;panelH=vh;}
  else{stageW=vw;groundY=Math.round(clamp(vh*(vh<700?0.5:0.52),220,Math.min(560,col*0.95)));panelW=col;panelH=vh-groundY;}
  const hud=vh<700?70:86,span=side?stageW*0.26:col*0.28;
  const byH=(groundY-hud-10)/1.32,byW=((side?stageW:col)*0.42)*1.2/1.32;
  const chH=Math.round(clamp(Math.min(byH,byW),70,240));
  const cw=Math.round(clamp(side?Math.min(panelW*0.55,panelH-205):Math.min(panelW*0.5,panelH-150),90,260));
  return {side,col,stageW,stageH:groundY,groundY,panelW,panelH,chH,cw,span};
}
function applyFightVars(){
  const d=fightDims(),s=document.getElementById('s-fight');
  s.classList.toggle('side',d.side);
  const set=(k,v)=>s.style.setProperty(k,v);
  set('--col',d.col+'px');set('--stageW',d.stageW+'px');set('--stageH',d.groundY+'px');set('--groundY',d.groundY+'px');
  set('--fcx',d.side?(d.stageW/2)+'px':'50%');set('--fspan',Math.round(d.span)+'px');
  if(typeof markKits==='function')try{markKits();}catch(e){}
  return d;
}
let fightResizeT=null;
addEventListener('resize',()=>{
  clearTimeout(fightResizeT);
  fightResizeT=setTimeout(()=>{
    if(document.getElementById('s-fight').hidden||!curOppF)return;
    applyFightVars();
    if(!playing){renderArena(F,curOppF);if(BT){applySnap(BT.snap());if(!ended&&!BT.over)renderMoves(curPlan);}}
  },180);
});
// the story map shows as many steps as the screen can hold
function mapWindow(){
  if(!F||!F.story)return;
  const box=document.getElementById('mapRows'),rows=[...box.querySelectorAll('.mrow')],cur=F.story.row,last=rows.length-1;
  box.querySelectorAll('.mgap').forEach(x=>x.remove());
  rows.forEach(r=>r.classList.remove('far'));
  const avail=box.clientHeight||400;
  const fit=Math.max(3,Math.floor((avail-40)/62));        // rows that fit, keeping room for the boss and markers
  const before=cur>0?1:0,after=Math.max(1,fit-before-2);
  const lo=Math.max(0,cur-before),hi=Math.min(last-1,cur+after);
  rows.forEach((r,i)=>r.classList.toggle('far',!(i>=lo&&i<=hi)&&i!==last));
  if(lo>0){const g=document.createElement('div');g.className='mgap';g.textContent=`${lo} done ⋯`;rows[lo].before(g);}
  if(hi<last-1){const g=document.createElement('div');g.className='mgap';g.textContent=`⋯ ${last-1-hi} more ⋯`;rows[last].before(g);}
}
// the card's buttons share one row with "every wheel result"
{const dock=document.querySelector('#s-card .dock'),m=document.getElementById('cardMoreBtn');if(dock&&m)dock.prepend(m);}

{const w=document.querySelector('#s-spin .wheel-wrap');if(w){const area=document.createElement('div');area.className='wheel-area';w.before(area);area.appendChild(w);}}
