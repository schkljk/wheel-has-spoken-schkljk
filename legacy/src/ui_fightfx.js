// ================= FULL-SCREEN BATTLE + ACTION WHEEL =================
Object.assign(INTENT_TXT,{feint:'a feint',focus:'to focus up'});
Object.assign(HOW,{feint:'Strike or Power punishes a feint.',focus:'Hit them while they focus.'});
Object.assign(CTR,{feint:'strike',focus:'strike'});
const AW_ORDER=['strike','power','guard','feint','focus','ult'];
const AW_COL={strike:['#F0565B','#B3262B'],power:['#7C6CF0','#4B3BB8'],guard:['#2DD4BF','#0E7C70'],feint:['#F2B544','#B8801C'],focus:['#5EA8FF','#2364B8'],ult:['#FFD166','#E5484D']};
let awSel=null,awPlan=null;

function moveInfo(m){
  const me=BT.P[0],op=BT.P[1],f=me.f;
  const gPct=Math.round((1-gxOf(me))*100);
  const o={m,ok:true,e:'',n:'',d:'',tag:''};
  if(m==='strike'){o.e=f.weapon.e;o.n='Strike';o.d='Beats Power and punishes feints. +25 energy';if(hitsWeak(op,physTags(me)))o.tag='weak spot';}
  if(m==='power'){
    o.e=f.power.e;o.n=f.power.k==='none'?'Power':f.power.n;
    if(f.power.k==='none'){o.ok=false;o.d='No power';}
    else if(!me.powOn){o.ok=false;o.d='Shut off by negation';}
    else if(f.power.passive){o.ok=false;o.d='Passive, always on';}
    else{o.ok=me.en>=POW_COST;o.d=o.ok?`Breaks Guard. Costs ${POW_COST} energy`:`Needs ${POW_COST} energy`;if(hitsWeak(op,f.power.t))o.tag='weak spot';}
  }
  if(m==='guard'){o.e='🛡️';o.n='Guard';o.d=`Beats Strike. Blocks ${gPct}% and counters. +40 energy`;}
  if(m==='feint'){o.e='🎭';o.n='Feint';o.d='Baits a Guard: +30 energy and your next hit lands 40% harder. Punished by attacks';}
  if(m==='focus'){o.e='🧘';o.n='Focus';o.d='+30 energy and your next hit lands 25% harder, but you take 15% more this round';}
  if(m==='ult'){o.e=f.arch.e;o.n=ULTS[f.arch.k];o.ok=me.en>=100;o.d=o.ok?'Ready. Spins the signature wheel for its power':`Needs full energy (${me.en}/100)`;}
  return o;
}
// donut slice path
function arcPath(cx,cy,r0,r1,a0,a1){
  const p=(r,a)=>`${(cx+r*Math.cos(a)).toFixed(2)} ${(cy+r*Math.sin(a)).toFixed(2)}`;
  const big=a1-a0>Math.PI?1:0;
  return `M${p(r1,a0)} A${r1} ${r1} 0 ${big} 1 ${p(r1,a1)} L${p(r0,a1)} A${r0} ${r0} 0 ${big} 0 ${p(r0,a0)} Z`;
}
function renderMoves(plan){
  awPlan=plan;
  const me=BT.P[0],op=BT.P[1];
  const ctr=plan?CTR[plan.shown]:null;
  if(awSel&&!moveInfo(awSel).ok)awSel=null;
  $('#intent').innerHTML=plan?`<div class="readchip" role="button" tabindex="0" data-info="rule|read"><span class="rc-e">🔮</span><span><b>${esc(op.f.name)}</b> is going for <b>${INTENT_TXT[plan.shown]}</b> <i>${Math.round(plan.acc*100)}% sure</i></span></div>`:'';
  const N=AW_ORDER.length,S=300,cx=S/2,cy=S/2,r0=58,r1=146,gap=0.035;
  let defs='',paths='',labels='';
  AW_ORDER.forEach((m,i)=>{
    const a0=-Math.PI/2-Math.PI/N+i*2*Math.PI/N+gap,a1=a0+2*Math.PI/N-2*gap,mid=(a0+a1)/2;
    const info=moveInfo(m),[c1,c2]=AW_COL[m];
    defs+=`<radialGradient id="awg${i}" cx="${cx}" cy="${cy}" r="${r1}" gradientUnits="userSpaceOnUse"><stop offset="${r0/r1}" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></radialGradient>`;
    const cls=['aw-p',info.ok?'':'off',awSel===m?'sel':'',ctr===m&&info.ok?'ctr':'',m==='ult'&&info.ok?'ready':''].filter(Boolean).join(' ');
    paths+=`<path class="${cls}" data-m="${m}" d="${arcPath(cx,cy,r0,r1,a0,a1)}" fill="url(#awg${i})"/>`;
    const lr=(r0+r1)/2+4,lx=(cx+lr*Math.cos(mid))/S*100,ly=(cy+lr*Math.sin(mid))/S*100;
    labels+=`<div class="aw-l${info.ok?'':' off'}${awSel===m?' sel':''}" style="left:${lx}%;top:${ly}%"><span class="aw-e">${info.e}</span><span class="aw-n">${esc(info.n)}</span>${ctr===m&&info.ok?'<span class="aw-t ctr">counters</span>':info.tag?'<span class="aw-t">weak spot</span>':''}</div>`;
  });
  const si=awSel?moveInfo(awSel):null;
  const hub=si?`<span class="hub-e">${si.e}</span><span class="hub-n">${esc(si.n)}</span><span class="hub-go">Tap to use</span>`:`<span class="hub-n">Pick a move</span><span class="hub-go">${plan?'Read the chip above':''}</span>`;
  $('#moves').innerHTML=`<div class="awheel"><svg viewBox="0 0 ${S} ${S}" aria-hidden="true"><defs>${defs}</defs><circle cx="${cx}" cy="${cy}" r="${r1+8}" class="aw-rim"/>${paths}</svg>${labels}<button class="aw-hub${si?' armed':''}" id="awHub" aria-label="${si?'Use '+esc(si.n):'Pick a move'}">${hub}</button></div><p class="aw-desc">${si?esc(si.d):'Tap a slice to see what it does, then tap the middle to use it. Tap the same slice twice to go fast.'}</p>`;
}
$('#moves').addEventListener('click',e=>{
  if(playing||ended||!BT||BT.over)return;
  const hub=e.target.closest('#awHub');
  if(hub){if(awSel)commitMove(awSel);return;}
  const p=e.target.closest('[data-m]');if(!p)return;
  const m=p.dataset.m,info=moveInfo(m);
  if(!info.ok){toast(info.d);return;}
  if(awSel===m){commitMove(m);return;}
  awSel=m;tick();renderMoves(awPlan);
});
function commitMove(m){
  const sel=m;awSel=null;
  if(sel==='ult'){ultSpin(()=>doRound('ult'));return;}
  doRound(sel);
}
// the signature move spins its own wheel before it lands
function ultSpin(then){
  const me=BT.P[0],w=ultWeights(me);
  const items=ULT_WHEEL.map((u,i)=>({n:`${u.n} ×${u.m}`,e:u.e,q:u.q,w:w[i]}));
  const idx=pickW(items);
  me.ultSpin=ULT_WHEEL[idx];
  setBusy(true);playing=true;
  const ov=document.createElement('div');ov.className='ultspin';
  ov.innerHTML=`<div class="us-k">Signature wheel</div><div class="us-wrap"><div class="us-ptr"></div><canvas width="220" height="220"></canvas></div><div class="us-res"></div>`;
  stageEl().appendChild(ov);
  const cv=ov.querySelector('canvas');const segs=drawWheel(cv,items);
  const [a0,a1]=segs[idx],mid=(a0+a1)/2+rnd(-0.3,0.3)*(a1-a0);
  const turns=RM?0:(fastMode?3:5);
  const target=turns*2*Math.PI-mid;
  const dur=RM?50:fastMode?900:1700;
  let lastSeg=-1;
  A(cv,[{transform:'rotate(0rad)'},{transform:`rotate(${target}rad)`}],{duration:dur,easing:'cubic-bezier(.12,.75,.2,1)',fill:'forwards'});
  const t0=performance.now();
  const tk=setInterval(()=>{const p=Math.min(1,(performance.now()-t0)/dur);const s=Math.floor(p*turns*items.length*1.2);if(s!==lastSeg){lastSeg=s;tick();}if(p>=1)clearInterval(tk);},30);
  setTimeout(()=>{
    const r=ULT_WHEEL[idx];
    ov.querySelector('.us-res').innerHTML=`<b class="q${r.q}">${r.e} ${r.n}</b><span>×${r.m} damage</span>`;
    landSound(r.q);buzz(r.q>=3?[30,50,80]:30);
    if(r.q>=3){const b=cv.getBoundingClientRect();burstAt(b.left+b.width/2,b.top+b.height/2);}
    setTimeout(()=>{ov.classList.add('out');setTimeout(()=>ov.remove(),250);playing=false;then();},RM?300:fastMode?450:850);
  },dur+60);
}
// a two-line ticker on the stage, with the full log a tap away
function appendLogs(list){
  if(!list.length)return;
  fightLog.push(...list);
  const log=$('#log');log.insertAdjacentHTML('beforeend',list.map(evHTML).join(''));log.scrollTop=log.scrollHeight;
  const tk=document.getElementById('ticker');
  if(tk){tk.innerHTML=fightLog.slice(-2).map(evHTML).join('');tk.classList.remove('bump');void tk.offsetWidth;tk.classList.add('bump');}
}
$('#logBtn').addEventListener('click',()=>{
  setSheet(`<div class="ch-h"><span class="ch-i">📜</span><div><b>Fight log</b><small>${fightLog.length} events</small></div></div><ol class="log full">${$('#log').innerHTML}</ol><button class="btn ghost" data-close="1">Close</button>`);
});
// momentum pips on the HUD
const _applySnap=applySnap;
applySnap=function(s){
  _applySnap(s);
  if(!s||!s.mo)return;
  for(const i of [0,1]){const el=document.querySelector(`#hud${i} .mom`);if(el)el.innerHTML=[0,1,2].map(k=>`<i class="${k<s.mo[i]?'on':''}"></i>`).join('');}
};
