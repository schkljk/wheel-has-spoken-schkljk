// ---------- arena ----------
let curOpp=-1,curOppF=null,curArena=null,curOdds=0.5,curPlan=null,BT=null,playing=false,autoBattle=false,skipFlag=false,ended=false,fightLog=[],lastFight=null;
function renderArena(a,b){
  const AR=curArena||{};
  const hs=(f,i)=>`<div class="hs${i?' r':' me'}" id="hud${i}"><div class="hn" role="button" tabindex="0" data-card="${i}">${esc(f.name)}</div><div class="mom" aria-label="Momentum"></div><div class="mbar hp"><b class="ghost"></b><i></i></div><div class="mbar en"><i style="width:50%"></i></div><div class="hv"><span class="hpv">${hudHpTxt(i)}</span><span class="env" role="button" tabindex="0" data-info="rule|energy">⚡ 50</span></div></div>`;
  // the stage shrinks on short screens so the move buttons stay in view
  // full-screen fights: the stage takes whatever the action wheel leaves free
  const FD=applyFightVars(),stH=FD.stageH,chH=FD.chH;
  const ft=(f,i)=>`<div class="ftr side${i}${i===0&&F&&F.career&&rankOf(F)>=6?' mythic':''}" id="ftr${i}"><div class="badges"></div><div class="body">${charSVG(lookOf(f),{h:chH,sized:true,mirror:i===1})}</div></div>`;
  const style=` style="height:${stH}px${AR.sky?`;--sky:${AR.sky};--floor:${AR.floor}`:''}"`;
  $('#arena').innerHTML=`<div class="hud">${hs(a,0)}<div class="rd" id="rd">Round 1</div>${hs(b,1)}</div><div class="stage" id="stage"${style}><div class="scene">${AR.k?sceneSVG(AR.k):''}</div>${ambientHTML(AR.k)}<div class="tint" id="tint"></div>${AR.n?`<div class="arena-tag" role="button" tabindex="0" data-info="${ik('arena',AR.n)}">${AR.e} ${esc(AR.n)}</div>`:''}<div class="floor"></div>${ft(a,0)}${ft(b,1)}<div class="fxl" id="fxl"></div><div class="banner" id="banner"></div><div class="ticker" id="ticker" aria-live="polite"></div></div>`;
  {const mb=document.createElement('button');mb.className='fmenu-btn';mb.id='fmenuBtn';mb.setAttribute('aria-label','Fight menu');mb.textContent='☰';document.getElementById('arena').appendChild(mb);}
  {const st=document.getElementById('stage'),tk=document.getElementById('ticker'),tag=st&&st.querySelector('.arena-tag');
   document.querySelectorAll('#fstrip').forEach(x=>x.remove());
   const strip=document.createElement('div');strip.id='fstrip';strip.className='fstrip';
   if(tag)strip.appendChild(tag);if(tk)strip.appendChild(tk);
   document.getElementById('arena').after(strip);}
}
function applySnap(s){
  if(!s)return;
  for(const i of [0,1]){
    const hud=document.getElementById('hud'+i);if(!hud)return;
    const hp=s.h[i],en=s.en[i];
    const hb=hud.querySelector('.mbar.hp i');hb.style.width=hp+'%';hb.classList.toggle('low',hp<30);
    const gh=hud.querySelector('.mbar.hp .ghost');if(gh)gh.style.width=hp+'%';
    hud.querySelector('.mbar.en i').style.width=en+'%';hud.querySelector('.mbar.en').classList.toggle('full',en>=100);
    hud.querySelector('.hpv').textContent=s.hr?`${s.hr[i]}/${s.mx?s.mx[i]:''} HP`:hp+' HP';hud.querySelector('.env').textContent='⚡ '+en;
    const st=s.st[i],b=bodyEl(i);
    b.classList.toggle('frozen',st.frozen);b.classList.toggle('poisoned',st.poison);
    ftrEl(i).querySelector('.badges').innerHTML=[['guard','🛡️'],['frozen','❄️'],['soaked','💧'],['burning','🔥'],['poison','🧪']].filter(([k])=>st[k]).map(([k,e])=>`<span role="button" tabindex="0" data-info="status|${k}">${e}</span>`).join('');
  }
  {const mr=BT&&BT.maxR||12,rd=document.getElementById('rd');if(rd)rd.textContent=BT&&BT.sd?'Sudden death':`Round ${Math.max(1,s.r||1)}/${mr}`;}
}

$('#arena').addEventListener('click',e=>{const h=e.target.closest('[data-card]');if(!h)return;openSheet(h.dataset.card==='0'?F:curOppF);});

// ambient particles: embers, snow, rain, stars... matched to the arena
const AMB={lava:'ember',tundra:'snow',flood:'rain',thunder:'rain',rooftop:'rain',forest:'leaf',space:'star',void:'star',graveyard:'fog',cathedral:'dust',colosseum:'dust',kitchen:'steam',mirror:'spark',beach:'spark',ballpit:'dust'};
function ambientHTML(k){
  const t=AMB[k]||'dust',n=t==='fog'?5:t==='rain'?26:18;let h='';
  for(let i=0;i<n;i++){const l=(i*37+13)%100,d=(i*0.61)%6,du=t==='rain'?0.7+(i%5)*0.12:t==='star'||t==='spark'?2+(i%4):5+(i%6)*1.3,sz=t==='fog'?120+(i%3)*60:t==='leaf'?7+(i%3)*2:2+(i%4);
    h+=`<i style="left:${l}%;top:${t==='star'||t==='spark'?(i*29)%70:''}${t==='star'||t==='spark'?'%':''};animation-delay:-${d.toFixed(2)}s;animation-duration:${du.toFixed(2)}s;width:${sz}px;height:${t==='rain'?14:t==='fog'?sz/3:sz}px"></i>`;}
  return `<div class="amb amb-${t}" aria-hidden="true">${h}</div>`;
}
