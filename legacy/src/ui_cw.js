// ================= COMBAT WHEEL =================
// Every round: pick a focus, then spin. The wheel's slices are your moves, sized by your stats and focus.
const CW_FOCUS=[['atk','⚔️','Attack'],['def','🛡️','Defend'],['pow','✨','Skill'],['ult','🌟','Special']];
const CW_REC={strike:'def',power:'atk',guard:'pow',ult:'def',feint:'atk',focus:'atk'};
let cwFocus=null,cwBusy=false,cwRot=0,cwSegsL=[],cwList=[],cwItems=[],cwRespins=0,cwPending=null,cwTimer=null,cwDrag=null;
Object.assign(RULES,{
  moves:['🎡','The combat wheel',['Every round pick a focus, then spin. The wheel only holds that focus\'s moves, with near-equal slices: your stats nudge them a little.','Attack: strike, heavy blow, quick jab, feint. Defend: guard, counter, sidestep. Power: your power, Overcharge when you have 40 energy, and Charge up. Signature: when your energy is full, unleash it directly; it spins its own damage wheel.','Strike beats Power, Power breaks Guard, Guard beats Strike. The read on your opponent marks the focus that counters them.']]
});
function cwReset(){cwFocus=null;cwBusy=false;cwRot=0;cwRespins=0;cwPending=null;clearTimeout(cwTimer);}
function cwPowOk(me){return me.f.power.k!=='none'&&!me.f.power.passive&&me.powOn&&canPower(me)&&me.en>=POW_COST;}
// a focus wheel only holds that focus's moves, with near-equal slices that your stats nudge a little
// each focus mixes this fighter's own moves (class, race, weapon) with a few basics
function cwSlices(me,focus){
  const s=me.s,f=me.f,pw=cwPowOk(me);
  const nudge=v=>clamp(1+(v-6)*0.035,0.8,1.25);
  const basics={
    atk:[
      {k:'strike',n:'Strike',e:f.weapon.e||'👊',c:'strike',q:1,w:nudge(s.str),d:'Beats Power'},
      {k:'heavy',n:'Heavy blow',e:'🔨',c:'strike',m:{dmgX:1.45,slow:1,label:'Heavy blow'},q:1,w:nudge((s.str+s.wm)/2),d:'+45% damage, goes second'},
      {k:'feint',n:'Feint',e:'🎭',c:'feint',q:1,w:nudge(s.iq),d:'Baits a guard: the next hit lands 40% harder'}],
    def:[
      {k:'guard',n:'Guard',e:'🛡️',c:'guard',q:1,w:nudge(s.dur),d:'Beats Strike, blocks and counters'},
      {k:'dodge',n:'Sidestep',e:'💨',c:'dodge',m:{dodge:0.45},q:1,w:nudge(s.spd),d:'Big dodge chance against anything but a signature'},
      {k:'counter',n:'Counter',e:'🔁',c:'guard',m:{counterX:1.7,label:'Counter'},q:1,w:nudge(s.iq),d:'A guard that counters 70% harder'}],
    pow:[
      pw?{k:'power',n:f.power.n,e:f.power.e,c:'power',q:1,w:nudge(s.pm),d:'Breaks Guard'}:null,
      pw&&me.en>=POW_COST+15?{k:'surge',n:'Overcharge',e:'🌩️',c:'power',m:{dmgX:1.4,enCost:15,label:'Overcharge'},q:1,w:nudge(s.pm),d:'+40% power damage, costs 15 more energy'}:null,
      {k:'focus',n:'Charge up',e:'🧘',c:'focus',q:1,w:nudge(s.iq),d:'+30 energy, your next hit lands 25% harder'}]
  }[focus]||[];
  const own=kitMoves(f).filter(m=>m.fam===focus&&(m.c!=='power'||pw)).map(m=>({k:'kit_'+m.n,n:m.n,e:m.e,c:m.c,m:Object.assign({},m.rm),q:m.src==='class'?3:2,w:1.15,d:m.d,src:m.src}));
  // your own moves always make the wheel; basics fill the rest, five slices at most
  const list=[...own,...basics.filter(Boolean)].slice(0,Math.max(5,own.length+1));
  return list.map(it=>({it,w:Math.round(it.w*100)/100,mult:1}));
}
function cwSize(){return fightDims().cw;}
function renderMoves(plan){
  if(!BT)return;
  const me=BT.P[0],op=BT.P[1],pw=cwPowOk(me),ult=me.en>=100;
  if(!cwFocus||(cwFocus==='ult'&&!ult))cwFocus=ult?'ult':'atk';
  let rec=plan?CW_REC[plan.shown]:null;if(rec==='pow'&&!pw)rec='atk';
  const RP_N={strike:'Strike',power:'Power',guard:'Guard',ult:'Signature',feint:'Feint',focus:'Charging up'};
  $('#intent').innerHTML=plan?`<div class="readpill${plan.acc>=0.8?' good':plan.acc<0.6?' weak':''}">🔮 <span class="rp-acc">${readClue(plan.acc)}:</span> <b>${RP_N[plan.shown]||'?'}</b></div>`:'';
  const chips=CW_FOCUS.map(([k,e,n])=>{const ok=k==='ult'?ult:true;const label=n;return `<button class="fchip${cwFocus===k?' on':''}${rec===k?' rec':''}${k==='ult'&&ult?' gold':''}" data-focus="${k}"${ok?'':' disabled'}>${e} ${esc(label)}</button>`;}).join('');
  const S=cwSize();
  $('#moves').innerHTML=`<div class="cw">
    <div class="cw-chips">${chips}<span class="inf cw-help" role="button" tabindex="0" data-info="rule|moves">?</span></div>
    <div class="cw-row"><div class="cw-wrap ready" id="cwWrap" style="width:${S}px;height:${S}px"><canvas id="cwc"></canvas><div class="cw-ptr"></div><div class="cw-hub" id="cwHub">${me.f.arch.e}</div></div>
    <div class="cw-out" id="cwOut">${cwFocus==='ult'?`<b class="q3">🌟 ${esc(ULTS[me.f.arch.k]||'Signature move')}</b><small>Full energy. This wheel is the damage: spin it and hope for a jackpot. It can't be dodged.</small>`:`<b>${CW_FOCUS.find(x=>x[0]===cwFocus)[2]} moves</b><small>Tap or flick the wheel to spin.</small>`}</div></div>
    <button class="btn cw-spin${cwFocus==='ult'?' gold':''}" id="cwSpin">${cwFocus==='ult'?'Unleash your signature':'Spin your move'}</button>
  </div>`;
  cwBuild();
}
function cwBuild(){
  if(!BT)return;
  cwList=cwFocus==='ult'?(()=>{const me=BT.P[0],w=ultWeights(me),sig=ULTS[me.f.arch.k]||'Signature';return ULT_WHEEL.map((u,i)=>({it:{k:'ult_'+u.k,n:`${u.n} ×${u.m}`,e:u.e,c:'ult',q:u.q,w:w[i],ultIdx:i,d:`${sig} lands for ${u.m}× damage`},w:Math.round(w[i]*100)/100,mult:1}));})():cwSlices(BT.P[0],cwFocus);
  cwItems=cwList.map(e=>Object.assign({},e.it,{w:e.w}));
  const cv=document.getElementById('cwc');if(!cv)return;
  cwSegsL=drawWheel(cv,cwItems);cwSetRot(cwRot);
}
function cwSetRot(r){const cv=document.getElementById('cwc');if(cv)cv.style.transform=`rotate(${r}rad)`;}
function cwSegAt(r){const TAU=Math.PI*2,l=((-r%TAU)+TAU)%TAU;for(let i=0;i<cwSegsL.length;i++)if(l>=cwSegsL[i][0]&&l<cwSegsL[i][1])return i;return cwSegsL.length-1;}
function cwFlap(dir){const p=document.querySelector('.cw-ptr');if(p&&p.animate&&!RM)p.animate([{transform:'translateX(-50%) rotate(0)'},{transform:`translateX(-50%) rotate(${dir>0?-16:16}deg)`},{transform:'translateX(-50%) rotate(0)'}],{duration:110});}
function cwSpin(flickW){
  if(cwBusy||playing||ended||!BT||BT.over)return;
  cwBusy=true;ac();clearTimeout(cwTimer);
  const TAU=Math.PI*2,idx=pickW(cwList),seg=cwSegsL[idx],target=seg[0]+(seg[1]-seg[0])*(0.2+Math.random()*0.6);
  const dir=flickW&&flickW<0?-1:1;
  const turns=flickW?clamp(Math.round(Math.abs(flickW)/5),2,6):3+Math.floor(Math.random()*2);
  const want=((-target%TAU)+TAU)%TAU;
  let end=cwRot-((cwRot%TAU)+TAU)%TAU+want;
  if(dir>0){while(end<cwRot+TAU*turns)end+=TAU;}else{while(end>cwRot-TAU*turns)end-=TAU;}
  const start=cwRot,dur=RM?150:fastMode?900:1600,t0=performance.now();
  const wrap=document.getElementById('cwWrap');if(wrap){wrap.classList.add('spinning');wrap.classList.remove('ready');}
  document.querySelectorAll('#moves .fchip,#cwSpin').forEach(b=>b.disabled=true);
  $('#cwOut').innerHTML='<b>Spinning…</b><small>&nbsp;</small>';
  let lastSeg=cwSegAt(start);
  const frame=now=>{
    const t=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-t,4);
    cwRot=start+(end-start)*e;cwSetRot(cwRot);
    const sg=cwSegAt(cwRot);if(sg!==lastSeg){lastSeg=sg;tick();cwFlap(dir);}
    if(t<1)requestAnimationFrame(frame);else cwLand(idx);
  };
  requestAnimationFrame(frame);
}
function cwLand(idx){
  const it=cwList[idx].it;
  const wrap=document.getElementById('cwWrap');if(wrap)wrap.classList.remove('spinning');
  const cv=document.getElementById('cwc');if(cv){drawWheel(cv,cwItems,idx);cwSetRot(cwRot);}
  const hub=document.getElementById('cwHub');if(hub){hub.textContent=it.e;hub.classList.remove('pop');void hub.offsetWidth;hub.classList.add('pop');}
  landSound(it.q);buzz(it.q>=3?[30,40,50]:20);
  if(it.q>=3&&wrap){const r=wrap.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2);}
  cwPending={c:it.c,m:Object.assign({},it.m||{}),ultIdx:it.ultIdx};
  const delay=fastMode?350:650;
  $('#cwOut').innerHTML=`<b class="q${it.q}">${it.e} ${esc(it.n)}</b><small>${esc(it.d||'')}</small>`;
  cwTimer=setTimeout(cwCommit,delay);
}
function cwCommit(){
  clearTimeout(cwTimer);
  if(!cwPending)return;
  const p=cwPending;cwPending=null;cwBusy=false;
  // the signature move still spins its own damage wheel
  if(p.c==='ult'){if(p.ultIdx!=null)BT.P[0].ultSpin=ULT_WHEEL[p.ultIdx];doRound('ult',p.m);return;}
  doRound(p.c,p.m);
}
$('#moves').addEventListener('click',e=>{
  const f=e.target.closest('[data-focus]');
  if(f&&!f.disabled&&!cwBusy){cwFocus=f.dataset.focus;tick();renderMoves(curPlan);return;}
  if(e.target.closest('#cwSpin')){cwSpin();return;}
  if(e.target.closest('#cwGo')){cwCommit();return;}
});
// flick the combat wheel
document.addEventListener('pointerdown',e=>{
  const w=e.target.closest('#cwWrap');if(!w||cwBusy||playing||ended||!BT||BT.over)return;
  e.preventDefault();ac();
  const r=w.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  cwDrag={id:e.pointerId,cx,cy,a:Math.atan2(e.clientY-cy,e.clientX-cx),samples:[{t:performance.now(),r:cwRot}]};
});
document.addEventListener('pointermove',e=>{
  if(!cwDrag||e.pointerId!==cwDrag.id)return;
  const TAU=Math.PI*2,a=Math.atan2(e.clientY-cwDrag.cy,e.clientX-cwDrag.cx);let d=a-cwDrag.a;d=((d+Math.PI)%TAU+TAU)%TAU-Math.PI;cwDrag.a=a;
  cwRot+=d;cwSetRot(cwRot);const now=performance.now();cwDrag.samples.push({t:now,r:cwRot});while(cwDrag.samples.length>2&&now-cwDrag.samples[0].t>100)cwDrag.samples.shift();
});
document.addEventListener('pointerup',e=>{
  if(!cwDrag||e.pointerId!==cwDrag.id)return;
  const s=cwDrag.samples;cwDrag=null;
  const moved=s.length>=2?Math.abs(s[s.length-1].r-s[0].r):0;
  if(moved<0.08){if(cwFocus==='ult'||document.getElementById('cwWrap'))cwSpin();return;}
  if(s.length<2)return;
  const a=s[0],b=s[s.length-1],dt=(b.t-a.t)/1000;if(dt<=0||performance.now()-b.t>120)return;
  const w=(b.r-a.r)/dt;if(Math.abs(w)>3)cwSpin(w);
});
document.addEventListener('pointercancel',()=>{cwDrag=null;});
