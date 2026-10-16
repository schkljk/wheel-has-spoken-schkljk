const pl=(n,one,many)=>`${n} ${n===1?one:(many||one+'s')}`;
// ---------- screens ----------
const SCREENS=['s-title','s-spin','s-card','s-hub','s-shop','s-bracket','s-fight','s-codex','s-map'];
function show(id){
  SCREENS.forEach(s=>{$('#'+s).hidden=s!==id});
  document.body.dataset.screen=id;
  document.body.classList.toggle('fullfight',id==='s-fight');
  window.scrollTo(0,0);
  const el=document.getElementById(id);el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');
  updateCoins();
}
function updateCoins(){
  const c=document.getElementById('coinChip');if(!c)return;
  const scr=document.body.dataset.screen;
  c.hidden=scr==='s-title';c.textContent='🪙 '+DB.coins;
  const h=document.getElementById('homeBtn');
  if(h)h.hidden=!['s-hub','s-shop','s-bracket','s-codex','s-map'].includes(scr);
}
// keeps an element on screen above the sticky action bar
function dockH(){const d=[...document.querySelectorAll('.screen:not([hidden]) .dock')].find(x=>x.offsetParent!==null&&x.offsetHeight>0);return d?d.getBoundingClientRect().height:0;}
function ensureVisible(el,alignTop){
  if(!el)return;
  const r=el.getBoundingClientRect(),limit=innerHeight-dockH()-8;
  let dy=0;
  if(alignTop)dy=r.top-12;
  else if(r.bottom>limit)dy=Math.min(r.bottom-limit,r.top-12);
  else if(r.top<0)dy=r.top-12;
  if(Math.abs(dy)>2)window.scrollBy(0,dy);
}
let Q=[];
function nextQ(){const fn=Q.shift();(fn||showHub)();}

// ---------- title ----------
function renderTitle(){
  F=DB.career?loadCareer():null;
  const any=DB.slots.some(Boolean),full=freeSlot()<0;
  $('#careerWrap').hidden=!any;
  $('#careerWrap').innerHTML=any?`<h2 class="screen-title">Your fighters</h2><div class="roster">${DB.slots.map((sl,i)=>{
    const f=sl&&deserFighter(sl.career);
    if(!f)return `<div class="slot empty"><span class="slot-n">${i+1}</span><span>Empty slot</span></div>`;
    const st=f.story?`chapter ${f.story.ch}${f.story.ng?`, encore ${f.story.ng}`:''}`:'story not started';
    return `<div class="slot${i===DB.active?' active':''}"><span class="mini">${charSVG(lookOf(f),{h:78})}</span><div class="slot-t"><b>${esc(fullName(f))}</b><span>Level ${f.lvl||1}, ${st}. ${sl.coins||0} 🪙</span></div><div class="slot-b"><button class="btn sm" data-play="${i}">Play</button><button class="btn ghost sm" data-retire="${i}" data-label="Retire">Retire</button></div></div>`;
  }).join('')}</div>`:'';
  $('#newWrap').hidden=false;
  $('#startBtn').disabled=full;$('#startBtn').textContent=full?'Roster full: retire someone to spin again':'Spin a new fighter';
  $('#fullNote').hidden=!full;
  let r='';
  if(DB.spins>0)r=`<div class="records"><div class="rec"><b>${DB.won}</b><span>Tournaments won</span></div><div class="rec"><b>${DB.entered}</b><span>Tournaments entered</span></div><div class="rec"><b>🪙 ${DB.coins}</b><span>Coins</span></div><div class="rec"><b>🔥 ${DB.gbest}</b><span>Best gauntlet streak</span></div></div>`;
  $('#records').innerHTML=r;
  $('#seasonBox').innerHTML=`<div class="coll"><div class="coll-top"><b>Season ${DB.season.n}</b><span>${DB.season.tourneys} of 3 tournaments played</span></div><p class="hint" style="margin:8px 0 0">After every 3 tournaments, the game buffs whatever keeps losing and nerfs whatever keeps winning.</p>${DB.patchNotes?'<button class="btn ghost sm" id="pnBtn">Read the latest patch notes</button>':''}</div>`;
  $('#seasonBox').insertAdjacentHTML('beforeend',(DB.lastLegacy?`<p class="note sub" style="display:block;text-align:center">Your last fighter left ${DB.lastLegacy} ✦ of legacy</p>`:'')+renderLegacy());
  const cc=codexCount();
  $('#collBox').innerHTML=`<div class="coll"><div class="coll-top"><b>Collection</b><span>${cc.f} of ${cc.t} found</span></div><div class="prog-track"><i style="width:${Math.round(cc.f/cc.t*100)}%"></i></div><button class="btn ghost sm" id="codexBtn">Open the collection</button></div>`;
  let h='<h2>Hall of fame</h2><p class="hint" style="margin:-4px 0 6px">Only the top 10 champions stay. The best can return as legends to challenge future fighters.</p>';
  if(!DB.champs.length)h+='<p class="empty">No champions yet. Win a tournament to get your fighter in here. Champions can come back later as reincarnations.</p>';
  else h+='<ol>'+DB.champs.slice(0,15).map(c=>`<li><span class="mini">${c.look?charSVG(c.look,{h:46}):esc(c.e||'🏆')}</span><span><span class="n">${esc(c.n)}</span><br><span class="s">${esc(c.s)}</span></span><span class="d">${esc(c.d)}</span></li>`).join('')+'</ol>';
  if(DB.retired.length)h+='<h2 style="margin-top:22px">Retired legends</h2><ol>'+DB.retired.slice(0,15).map(c=>`<li><span class="mini">${c.look?charSVG(c.look,{h:46}):''}</span><span><span class="n">${esc(c.n)}</span><br><span class="s">${esc(c.s)}</span></span><span class="d">${esc(c.d)}</span></li>`).join('')+'</ol>';
  $('#hall').innerHTML=h;
}
const idleCv=$('#idle');
function drawIdle(){drawWheel(idleCv,RACES);}
function toTitle(){$('#nameIn').value='';renderTitle();show('s-title');}
function openPatchNotes(){
  const pn=DB.patchNotes;if(!pn)return;
  pn.unseen=false;saveDB();
  const rows=pn.notes.length?pn.notes.map(n=>`<li class="${n.up?'up':'down'}"><b>${n.up?'▲':'▼'} ${esc(n.txt)}</b><small>${esc(n.why)}</small></li>`).join(''):'<li>No changes this time. Not enough fights to judge yet.</li>';
  $('#ovBody').innerHTML=`<h2 class="screen-title">Season ${pn.season} patch notes</h2><p class="hint">Based on last season's tournaments plus 400 league fights played behind the scenes.</p><ul class="pn">${rows}</ul>`;
  $('#ov').hidden=false;
}
let retireArm=0;
function armRetire(btn,then){
  if(Date.now()-retireArm<3500){retireArm=0;then();return;}
  retireArm=Date.now();btn.textContent=`Tap again to retire ${F?F.name:'them'}`;
  setTimeout(()=>{if(Date.now()-retireArm>=3400&&btn.isConnected)btn.textContent=btn.dataset.label||'Retire this fighter';},3500);
}
function retire(){
  if(!F)return;
  const belts=TIERS_T.filter(t=>F.belts&&F.belts[t.k]).map(t=>t.e).join('');
  const lp=legacyEarned(F);DB.legacy.pts+=lp;DB.lastLegacy=lp;
  if(DB.nemesis&&DB.nemesis.f)archiveRival(DB.nemesis.f,DB.nemesis.beats);
  DB.retired.unshift({n:fullName(F),look:lookOf(F),s:`Level ${F.lvl} ${RANKS[rankOf(F)].n}, ${pl(F.rec.w,'win')}, ${pl(F.rec.l,'loss','losses')}${belts?', belts '+belts:''}`,d:new Date().toLocaleDateString(),score:(F.lvl||1)+Object.values(F.belts||{}).filter(Boolean).length*3+rankOf(F)*2});
  pruneDB();
  DB.retired=DB.retired.slice(0,20);
  if(DB.active!=null)DB.slots[DB.active]=null;
  DB.active=null;DB.career=null;DB.nemesis=null;DB.tourney=null;DB.coins=0;F=null;saveDB();
}
$('#careerWrap').addEventListener('click',e=>{
  const p=e.target.closest('[data-play]');
  if(p){if(switchSlot(+p.dataset.play))showHub();return;}
  const r=e.target.closest('[data-retire]');
  if(r){
    const i=+r.dataset.retire,sl=DB.slots[i],f=sl&&deserFighter(sl.career);if(!f)return;
    r.dataset.label='Retire';
    if(Date.now()-retireArm<3500&&retireSlot===i){retireArm=0;switchSlot(i);retire();renderTitle();return;}
    retireArm=Date.now();retireSlot=i;r.textContent=`Tap again (+${legacyEarned(f)} ✦)`;
    setTimeout(()=>{if(Date.now()-retireArm>=3400&&r.isConnected)r.textContent='Retire';},3500);
  }
});
let retireSlot=-1;
$('#seasonBox').addEventListener('click',e=>{if(e.target.id==='pnBtn')openPatchNotes();});
$('#collBox').addEventListener('click',e=>{if(e.target.id==='codexBtn')openCodex();});

function openCodex(){
  const cc=codexCount();
  $('#codexSum').textContent=`${cc.f} of ${cc.t} found. Everything your own fighters land gets logged here, plus synergies, arenas and titles you earn. Undiscovered slices get a small odds boost.`;
  let h='';
  for(const [k,label,get] of CODEX){
    const list=get(),s=DB.seen[k]||[];const found=list.filter(x=>s.includes(x.key)).length;
    h+=`<div class="cx-cat"><h3>${label}<span>${found} of ${list.length}</span></h3><div class="cx-grid">`;
    h+=list.map(x=>s.includes(x.key)
      ?`<div class="tile q${x.it.q==null?1:x.it.q}" role="button" tabindex="0" data-info="${ik(k,x.key)}"><span class="e">${x.it.e}</span><span>${esc(x.it.n)}${x.par?`<small>${esc(x.par)}</small>`:''}${k==='syn'||k==='ach'||k==='arena'?`<small>${esc(x.it.d)}</small>`:''}</span></div>`
      :`<div class="tile unk q${x.it.q==null?1:x.it.q}"><span class="e">?</span><span>???${x.par?`<small>${esc(x.par)}</small>`:''}${k==='ach'?`<small>${esc(x.it.d)}</small>`:''}</span></div>`).join('');
    h+='</div></div>';
  }
  $('#codex').innerHTML=h;
  show('s-codex');
}
$('#codexBack').addEventListener('click',()=>{renderTitle();show('s-title');});

// ---------- spinning ----------
const cv=$('#wheel');
let mode='build',spinIdx=0,spinning=false,autoRun=false,bonusDone=false,buildDone=false,lastSpun=-1,task=null;
let curList=[],items=[],segs=[],rot=0;
const REACT=[["💀💀💀","Bro is cooked","It's over","Pain.","Chat, it's over"],["Mid","Could be worse","It'll do","Fine, I guess","Meh"],["Okay, we're cooking","Respectable","W spin","Now we're talking","Solid"],["👹👹👹","GOATED","Absolute cinema","The wheel loves you","Bro is HIM"]];
function segAt(r){
  const TAU=Math.PI*2,l=((-r%TAU)+TAU)%TAU;
  for(let i=0;i<segs.length;i++)if(l>=segs[i][0]&&l<segs[i][1])return i;
  return segs.length-1;
}
function setRot(r){cv.style.transform=`rotate(${r}rad)`;}
function spinTo(idx,dur,done){
  const TAU=Math.PI*2,[a0,a1]=segs[idx];
  const theta=a0+(a1-a0)*rnd(0.2,0.8);
  const target=(TAU-theta)%TAU,cur=((rot%TAU)+TAU)%TAU;
  const delta=((target-cur)+TAU)%TAU;
  const turns=dur<1200?2:5;
  const start=rot,end=rot+turns*TAU+delta,t0=performance.now();
  let last=segAt(start);
  function fr(now){
    const t=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-t,4);
    rot=start+(end-start)*e;setRot(rot);
    const s=segAt(rot);if(s!==last){last=s;tick();}
    if(t<1)requestAnimationFrame(fr);
    else{rot=end%TAU;setRot(rot);done();}
  }
  requestAnimationFrame(fr);
}
function spinDur(){if(RM)return 500;if(autoRun)return 800;return fastMode?1000:3400;}
function updateReroll(){
  const b=$('#rerollBtn');
  const ok=F&&(F.free>0||DB.coins>=2);
  if(mode!=='build'||autoRun||lastSpun<0||spinning||!ok){b.hidden=true;return;}
  b.hidden=false;b.textContent=`🎲 Reroll ${SEQ[lastSpun].lc} (${F.free>0?'free':'2 🪙'})`;
}
function applicable(W){return !W.cond||W.cond(F);}
function renderSheet(){
  let h='';
  SEQ.forEach((W,i)=>{
    if(!applicable(W))return;
    const v=F[W.k];
    const now=mode==='build'&&i===spinIdx&&!v&&!buildDone;
    h+=`<dt>${esc(labelOf(W,F))}</dt>`;
    if(v)h+=`<dd>${v.skip?'—':(W.k==='reinc'?esc((v.e?v.e+' ':'')+v.n):`<span class="inf" role="button" tabindex="0" data-info="${itemKeyFor(W.k,v,F)}">${esc((v.e?v.e+' ':'')+v.n)}</span>`)}</dd>`;
    else h+=`<dd class="${now?'now':'pending'}">${now?'Spinning next':'?'}</dd>`;
  });
  const syns=synOf(F);
  h+=`<dt>Synergies</dt><dd class="${syns.length?'':'pending'}">${syns.length?syns.map(s=>`<span class="inf" role="button" tabindex="0" data-info="${ik('syn',s.n)}">${esc(s.e+' '+s.n)}</span>`).join(', '):'None yet'}</dd>`;
  $('#sheet').innerHTML=h;
}
function renderPreview(){
  const bits=[F.race&&F.race.n,F.rsub&&F.rsub.n,F.arch&&F.arch.n,F.asub&&F.asub.n,F.stance&&F.stance.n].filter(Boolean);
  $('#preview').innerHTML=`<div class="pv-art">${charSVG(lookOf(F),{h:118})}</div><div class="pv-txt"><b>${esc(fullName(F))}</b><span>${bits.length?esc(bits.join(', ')):'The wheel is about to decide everything'}</span>${F.back?`<span>${esc(F.back.e+' '+F.back.n)}</span>`:''}</div>`;
}
function startBuild(name){
  F={name,bonus:{},boons:[],free:1};
  mode='build';spinIdx=0;autoRun=false;spinning=false;buildDone=false;lastSpun=-1;task=null;
  $('#spinWho').textContent=`Spinning ${name}`;
  $('#progWrap').hidden=false;$('#sheet').hidden=false;$('#preview').hidden=false;$('#autoBtn').hidden=false;
  $('#landed').innerHTML='';
  show('s-spin');
  loadWheel();
}
function renderOddsBox(reasons,unlock){
  let h=unlock?`<div class="unlock">${unlock}</div>`:'';
  if(reasons.length){
    const shown=reasons.slice(0,5);
    h+=`<div class="chips">${shown.map(r=>`<span class="oc ${r.cls}" role="button" tabindex="0" data-info="rule|${r.txt.startsWith('😇')||r.txt.startsWith('🤨')?'karma':'odds'}">${r.cls==='up'?'▲':r.cls==='down'?'▼':'✕'} ${esc(r.txt)}</span>`).join('')}${reasons.length>5?`<span class="oc">+${reasons.length-5} more</span>`:''}</div>`;
  }
  $('#oddsBox').innerHTML=h;
}
const toItems=list=>list.map(e=>({n:e.it.n,e:e.it.e,q:e.it.q,w:e.w,mark:e.mult>=1.5?'up':e.mult<=0.67?'down':''}));
function loadWheel(){
  while(spinIdx<SEQ.length){
    const W=SEQ[spinIdx];
    if(W.cond&&!W.cond(F)){spinIdx++;continue;}
    if(W.skipIf&&W.skipIf(F)){F[W.k]=SKIPPED;spinIdx++;continue;}
    break;
  }
  const total=SEQ.filter(applicable).length;
  if(spinIdx>=SEQ.length){
    if(autoRun){finishBuild();return;}
    buildDone=true;
    $('#progFill').style.width='100%';
    $('#progTxt').textContent=`${total} of ${total} spun`;
    $('#spinBtn').textContent='See the finished fighter';$('#spinBtn').disabled=false;
    $('#spinHint').hidden=true;
    $('#autoBtn').hidden=true;$('#oddsBox').innerHTML='';
    renderSheet();renderPreview();updateReroll();return;
  }
  const W=SEQ[spinIdx];
  const od=playerOdds(W,F);
  curList=od.list;items=toItems(curList);
  const done=SEQ.slice(0,spinIdx).filter(w=>applicable(w)).length;
  $('#catLabel').textContent=labelOf(W,F);
  $('#progFill').style.width=(done/total*100)+'%';
  $('#progTxt').textContent=`Spin ${done+1} of ${total}`;
  $('#spinBtn').textContent=`Spin for ${W.k==='rsub'||W.k==='asub'?labelOf(W,F).toLowerCase():W.lc}`;
  $('#spinHint').hidden=!!autoRun;
  $('#spinBtn').disabled=false;$('#autoBtn').disabled=false;
  $('#hub').textContent='?';
  const src=W.from&&W.from(F);
  renderOddsBox(od.reasons,src?(W.k==='power'?`${src.e} ${esc(src.n)}s spin the ${esc(labelOf(W,F).toLowerCase())} wheel`:`Sub-wheel unlocked by ${src.e} ${esc(src.n)}`):'');
  segs=drawWheel(cv,items);
  renderSheet();renderPreview();updateReroll();
}
// one-off wheels (arena, events, level-ups, re-spins)
function runWheel(t){
  mode='single';task=t;spinning=false;bonusDone=false;autoRun=false;lastSpun=-1;
  curList=t.list;items=toItems(curList);
  $('#spinWho').textContent=t.who||'';
  $('#progWrap').hidden=true;$('#sheet').hidden=true;$('#autoBtn').hidden=true;$('#rerollBtn').hidden=true;
  $('#preview').hidden=!t.preview;if(t.preview)renderPreview();
  $('#catLabel').textContent=t.title;
  renderOddsBox(t.reasons||[],t.unlock||'');
  $('#landed').innerHTML='';$('#hub').textContent='?';
  $('#spinBtn').textContent=t.spinLabel||`Spin the ${t.title.toLowerCase()} wheel`;$('#spinBtn').disabled=false;
  $('#spinHint').hidden=false;$('#hub').classList.remove('reveal','wait');
  show('s-spin');
  segs=drawWheel(cv,items);
}
function reaction(it){
  if(mode==='single'&&it.k==='pm'&&F.power.k==='none')return "You don't even have a power 💀";
  if(it.r)return it.r;
  return pick(REACT[it.q==null?1:it.q]);
}
// ---------- wheel physics: flick it with a finger or tap Spin ----------
const TAU2=Math.PI*2,MIN_TURNS=1.5;
let phys=null,drag=null,drumT=null,lastFlap=0,lastTurns=0,lastFlick=false;
// friction is randomized a little every spin, so nobody can aim for a slice
function frictionFor(kind){
  const v=rnd(0.88,1.12);
  if(kind==='auto')return {k:2.0*v,c:3*v};
  if(kind==='button'&&fastMode)return {k:1.4*v,c:2.5*v};
  return {k:0.55*v,c:0.9*v};
}
function predictTravel(w,fr){let o=Math.abs(w),th=0,t=0;const dt=1/120;while(o>0.02&&t<40){o=Math.max(0,o-(fr.c+fr.k*o)*dt);th+=o*dt;t+=dt;}return th;}
function canSpin(){return !spinning&&!phys&&!$('#s-spin').hidden&&mode!=='idle'&&!(mode==='single'&&bonusDone)&&!(mode==='build'&&buildDone);}
function prepSpin(){
  document.querySelector('.wheel-wrap').classList.add('spinning');
  spinning=true;ac();lastSpun=-1;updateReroll();
  $('#spinBtn').disabled=true;$('#autoBtn').disabled=true;$('#rerollBtn').hidden=true;
  $('#landed').classList.remove('pop');
  $('#landed').innerHTML='<div class="rx">Round and round it goes…</div>';
  $('#hub').textContent='?';$('#hub').classList.remove('reveal');
  $('#spinHint').hidden=true;
}
function flap(dir){
  const now=performance.now();if(RM||now-lastFlap<35)return;lastFlap=now;
  const p=document.querySelector('.wheel-wrap .pointer');
  if(p&&p.animate)p.animate([{transform:'rotate(0deg)'},{transform:`rotate(${dir>0?-18:18}deg)`},{transform:'rotate(0deg)'}],{duration:130});
}
function startSuspense(){
  document.querySelector('.wheel-wrap').classList.add('suspense');
  $('#hub').textContent='…';$('#hub').classList.add('wait');
  $('#landed').innerHTML='<div class="rx">Slowing down…</div>';
  if(soundOn&&!RM){let i=0;drumT=setInterval(()=>{beep(i++%2?190:160,0.05,'square',0.022);},95);}
}
function stopSuspense(){clearInterval(drumT);drumT=null;document.querySelector('.wheel-wrap').classList.remove('suspense');$('#hub').classList.remove('wait');}
function startPhysics(w,kind,fr){
  fr=fr||frictionFor(kind);
  const valid=predictTravel(w,fr)>=MIN_TURNS*TAU2;
  phys={w,fr,valid,kind,last:performance.now(),seg:segAt(rot),bounces:0,suspense:false,travel:0};
  lastFlick=kind==='flick';
  requestAnimationFrame(physFrame);
}
function physFrame(now){
  const p=phys;if(!p)return;
  const dt=Math.min(0.05,(now-p.last)/1000);p.last=now;
  const steps=Math.max(1,Math.ceil(dt/0.004)),h=dt/steps;
  for(let i=0;i<steps;i++){
    const s=Math.sign(p.w),o=Math.abs(p.w);
    const no=Math.max(0,o-(p.fr.c+p.fr.k*o)*h);
    p.w=s*no;
    const step=p.w*h;rot+=step;p.travel+=Math.abs(step);
    const sg=segAt(rot);
    if(sg!==p.seg){
      // a peg sits on every slice edge: a crawling wheel can bounce off it and settle back
      if(p.valid&&no<0.55&&p.bounces<2&&Math.random()<0.55){rot-=step*1.5;p.w=-p.w*0.45;p.bounces++;flap(-s);tick(true);continue;}
      p.seg=sg;tick();flap(s);
    }
    if(no<=0.02)break;
  }
  setRot(rot);
  if(p.valid&&!p.suspense&&Math.abs(p.w)<2.4){p.suspense=true;startSuspense();}
  if(Math.abs(p.w)<=0.02){phys=null;stopSuspense();settle(p);return;}
  requestAnimationFrame(physFrame);
}
function settle(p){
  document.querySelector('.wheel-wrap').classList.remove('spinning');
  rot=((rot%TAU2)+TAU2)%TAU2;setRot(rot);
  lastTurns=p.travel/TAU2;
  if(!p.valid){
    spinning=false;
    const L=$('#landed');
    L.innerHTML=`<div class="ln">Too gentle 😴</div><div class="rx">That only went around ${lastTurns.toFixed(1)} times. A spin needs at least 1½ to count, so flick harder.</div>`;
    void L.offsetWidth;L.classList.add('pop');
    $('#spinBtn').disabled=false;$('#autoBtn').disabled=false;$('#spinHint').hidden=false;
    beep(220,0.18,'triangle',0.04);
    return;
  }
  const idx=segAt(rot);
  segs=drawWheel(cv,items,idx);
  $('#hub').textContent='!';
  // a beat of silence before the reveal
  setTimeout(()=>{$('#hub').classList.add('reveal');landed(idx);},RM?0:(fastMode||autoRun?220:480));
}
function doSpin(){
  if(!canSpin()&&!(mode==='build'&&spinning&&!phys&&F&&F.arch&&F.arch.k==='resilient'))return;
  prepSpin();
  if(RM){const idx=pickW(items);spinTo(idx,spinDur(),()=>{segs=drawWheel(cv,items,idx);landed(idx);});return;}
  // machine spins always clear the 1½-turn rule: pick how far it should go, then find the push for it
  const kind=autoRun?'auto':'button',fr=frictionFor(kind);
  const want=(kind==='auto'?rnd(1.8,2.6):fastMode?rnd(2.2,3.2):rnd(3.2,5))*TAU2;
  let w=6;while(predictTravel(w,fr)<want&&w<90)w*=1.08;
  startPhysics(w,kind,fr);
}
// finger flicks
const wheelWrap=document.querySelector('.wheel-wrap');
function angleAt(e){const r=wheelWrap.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2));}
wheelWrap.addEventListener('pointerdown',e=>{
  if(!canSpin()||RM)return;
  const r=wheelWrap.getBoundingClientRect();
  if(Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2))<r.width*0.15)return;
  e.preventDefault();ac();
  drag={id:e.pointerId,a:angleAt(e),seg:segAt(rot),samples:[{t:performance.now(),r:rot}]};
  try{wheelWrap.setPointerCapture(e.pointerId);}catch(err){}
});
wheelWrap.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const a=angleAt(e);let d=a-drag.a;d=((d+Math.PI)%TAU2+TAU2)%TAU2-Math.PI;drag.a=a;
  rot+=d;setRot(rot);
  const now=performance.now();drag.samples.push({t:now,r:rot});
  while(drag.samples.length>2&&now-drag.samples[0].t>100)drag.samples.shift();
  const sg=segAt(rot);if(sg!==drag.seg){drag.seg=sg;tick();flap(Math.sign(d));}
});
function endDrag(e){
  if(!drag||e.pointerId!==drag.id)return;
  const s=drag.samples,now=performance.now();drag=null;
  if(s.length<2)return;
  const a=s[0],b=s[s.length-1],dt=(b.t-a.t)/1000;
  if(now-b.t>120||dt<=0)return;
  let w=(b.r-a.r)/dt;
  if(Math.abs(w)<1.2)return;
  w=Math.sign(w)*Math.min(Math.abs(w),36);
  prepSpin();startPhysics(w,'flick');
}
wheelWrap.addEventListener('pointerup',endDrag);
wheelWrap.addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.id)drag=null;});
function landed(idx){
  const it=curList[idx].it;
  DB.spins++;saveDB();
  $('#hub').textContent=it.e||it.v||'✓';
  const L=$('#landed');
  let notes='',bestQ=it.q==null?1:it.q;
  if(mode==='single'){
    notes=task.onLand(it)||'';
    const lnm=esc((it.e?it.e+' ':'')+it.n);
    L.innerHTML=`<div class="ln">${task.cat?`<span class="inf" role="button" tabindex="0" data-info="${ik(task.cat,it.n)}">${lnm}</span>`:lnm}</div><div class="rx">${esc(reaction(it))}</div>${it.d&&!task.noDesc?`<div class="ds">${esc(it.d)}</div>`:''}${notes}`;
    void L.offsetWidth;L.classList.add('pop');
    landSound(bestQ);buzz(bestQ>=3?[30,50,60]:25);if(bestQ>=3){const hr=$('#hub').getBoundingClientRect();burstAt(hr.left+hr.width/2,hr.top+hr.height/2);}
    bonusDone=true;spinning=false;
    if(task.preview)renderPreview();
    $('#spinBtn').textContent=task.nextLabel||'Continue';$('#spinBtn').disabled=false;
    setTimeout(()=>ensureVisible(L),60);
    return;
  }
  const W=SEQ[spinIdx];
  if(F.arch&&F.arch.k==='resilient'&&RESIL.includes(W.k)&&it.v<4){
    L.innerHTML=`<div class="ln">${esc(it.n)}</div><div class="rx">🩹 Resilient: below Peak human, so the wheel spins again</div>`;
    void L.offsetWidth;L.classList.add('pop');landSound(1);
    setTimeout(()=>{spinning=false;doSpin();},fastMode?600:1100);
    return;
  }
  const before=new Set(synOf(F).map(s=>s.k));
  F[W.k]=it;
  if(CX_CATS.has(W.k)&&markSeen(W.k,cxKey(W.k,it,F)))notes+=`<div class="note new">New in your collection</div>`;
  synOf(F).filter(s=>!before.has(s.k)).forEach(s=>{
    const isNew=markSeen('syn',s.n);
    notes+=`<div class="note ${s.anti?'anti':'syn'}" role="button" tabindex="0" data-info="${ik('syn',s.n)}">${s.anti?'Uh oh':'Synergy'}: ${s.e} ${esc(s.n)}${isNew?' (new)':''}</div>`;
    if(!s.anti)bestQ=3;
  });
  if(lastFlick)notes+=`<div class="turns">Your flick: ${lastTurns.toFixed(1)} turns</div>`;
  const next=SEQ[spinIdx+1];
  if(next&&next.cond&&next.cond(F)&&next.from&&next.from(F)===it)notes+=`<div class="note sub">Sub-wheel unlocked: ${esc(labelOf(next,F))}</div>`;
  const desc=it.d?`<div class="ds">${esc(it.d)}</div>`:'';
  L.innerHTML=`<div class="ln"><span class="inf" role="button" tabindex="0" data-info="${itemKeyFor(W.k,it,F)}">${esc((it.e?it.e+' ':'')+it.n)}</span></div><div class="rx">${esc(reaction(it))}</div>${desc}${notes}`;
  void L.offsetWidth;L.classList.add('pop');
  landSound(bestQ);buzz(bestQ>=3?[30,50,60]:25);if(bestQ>=3){const hr=$('#hub').getBoundingClientRect();burstAt(hr.left+hr.width/2,hr.top+hr.height/2);}
  lastSpun=spinIdx;spinIdx++;
  renderSheet();renderPreview();
  if(!autoRun)setTimeout(()=>ensureVisible(L),60);
  setTimeout(()=>{spinning=false;loadWheel();if(autoRun&&spinIdx<SEQ.length)setTimeout(doSpin,250);},autoRun?650:(fastMode?750:1300));
}
$('#spinBtn').addEventListener('click',()=>{
  if(mode==='single'&&bonusDone){const t=task;task=null;mode='idle';(t&&t.next?t.next:nextQ)();return;}
  if(mode==='build'&&buildDone){finishBuild();return;}
  if(mode==='idle')return;
  doSpin();
});
$('#autoBtn').addEventListener('click',()=>{autoRun=true;$('#autoBtn').hidden=true;updateReroll();doSpin();});
$('#rerollBtn').addEventListener('click',()=>{
  if(spinning||lastSpun<0)return;
  if(F.free>0)F.free--;else return;
  for(let j=lastSpun;j<SEQ.length;j++)delete F[SEQ[j].k];
  spinIdx=lastSpun;lastSpun=-1;buildDone=false;$('#autoBtn').hidden=false;
  loadWheel();doSpin();
});

// re-spin specific wheels of an existing fighter (shop, level-ups)
function respin(keys,opts){
  opts=opts||{};
  const ks=keys.slice();
  for(const k of ks)delete F[k];
  const step=()=>{
    const k=ks.shift();
    if(!k){F._win=null;saveCareer();nextQ();return;}
    const W=SEQ.find(w=>w.k===k);
    if(W.skipIf&&W.skipIf(F)){F[k]=SKIPPED;step();return;}
    const od=playerOdds(W,F);
    if(opts.awaken){od.list.forEach(e=>{if(e.it.q===3){e.w*=2;e.mult*=2;}});od.reasons.unshift({cls:'up',txt:'👁️ Awakening: goated slices ×2'});}
    runWheel({cat:k,title:labelOf(W,F),who:`${F.name} ${opts.awaken?'awakens':'tries something new'}`,list:od.list,reasons:od.reasons,preview:true,
      onLand(it){F[k]=it;if(CX_CATS.has(k))markSeen(k,cxKey(k,it,F));return '';},next:step,nextLabel:ks.length?'Next spin':'Done'});
  };
  step();
}
function levelUpTask(){
  runWheel({cat:'lvl',title:'Level up',who:`${F.name} reached level ${F.lvl}`,list:LEVELUP.map(it=>({it,w:it.w,mult:1})),spinLabel:'Spin the level-up wheel',preview:true,
    onLand(it){
      F.pendingLv=Math.max(0,(F.pendingLv||0)-1);saveCareer();
      if(it.k==='awaken'){Q.unshift(()=>respin(['power','pm'],{awaken:true}));return '<div class="ds">Spin a new power next, with goated slices boosted</div>';}
      if(it.k==='arsenal'){Q.unshift(()=>respin(['weapon','wm']));return '<div class="ds">Spin a new weapon next</div>';}
      applyBonus(F,it);saveCareer();return '';
    },nextLabel:'Continue'});
}
function applyEvent(it){
  let out='';
  switch(it.k){
    case 'train':{const k=pick(KS6);applyBonus(F,{k,n:'+1 '+STATN[k],e:'🏋️'});out=`+1 ${STATN[k]}`;break;}
    case 'sponsor':DB.coins+=4;out='+4 coins';break;
    case 'injury':{const j=addInjury(F);out=j?`${j.e} ${j.n}: ${injText(j)} for ${j.dur} tournament${j.dur>1?'s':''}`:'Shook it off';break;}
    case 'taunt':F.next=Object.assign({},F.next,{dmgX:1.15});out='+15% damage next fight';break;
    case 'stranger':applyBonus(F,{k:'pm',n:'+1 Power mastery',e:'🧙'});out='+1 power mastery';break;
    case 'food':F.next=Object.assign({},F.next,{hp:80});out='Starts the next fight at 80 HP';break;
    case 'energy':F.next=Object.assign({},F.next,{en:100});out='Full energy next fight';break;
    case 'scout':F.next=Object.assign({},F.next,{readB:.2});out='Reads 20% better next fight';break;
    case 'relic':applyBonus(F,{k:'relic',n:'Cursed relic',e:'🗿'});out='+2 strength, −2 IQ';break;
    case 'blessing':applyBonus(F,{k:'all1',n:'Cosmic blessing',e:'🌠'});out='+1 to everything';break;
  }
  F._win=null;saveCareer();saveDB();
  return out?`<div class="note sub">${esc(out)}</div>`:'';
}
function eventTask(){
  runWheel({cat:'event',title:'Between rounds',who:`Something happens to ${F.name}`,list:EVENTS.map(it=>({it,w:it.w,mult:1})),spinLabel:'Spin the event wheel',noDesc:false,onLand:applyEvent,nextLabel:'Continue'});
}

// ---------- fighter card ----------
function statRows(f){
  const s=eff(f);
  const rows=[['Strength','str'],['Speed','spd'],['Durability','dur'],['IQ','iq'],['Weapon mastery','wm']];
  if(f.power.k!=='none')rows.push(['Power mastery','pm']);
  if(f.cha)rows.push(['Charisma','cha']);
  return rows.map(([lb,k])=>{
    const base=f[k],v=s[k],diff=v-base.v;
    const mod=diff?`<em class="${diff<0?'neg':''}">${diff>0?'+':'−'}${Math.abs(diff)}</em>`:'';
    return `<div class="st"><span class="lb"><span class="inf" role="button" tabindex="0" data-info="stat|${k}">${lb}</span></span><span class="vl">${esc(base.n)}${mod}<small class="modv">${modTxt(k,v)}</small></span><span class="tr"><i class="f${TQ(Math.min(14,v))}" style="width:${Math.round(v/20*100)}%"></i></span></div>`;
  }).join('');
}
const row=(dt,it,extra,key)=>it&&!it.skip?`<dt>${esc(dt)}</dt><dd>${key?`<span class="inf" role="button" tabindex="0" data-info="${key}">`:''}${it.e||''} ${esc(it.n)}${key?'</span>':''}${it.d||extra?`<small>${esc([it.d,extra].filter(Boolean).join('. '))}</small>`:''}</dd>`:'';
function cardHTML(f){
  const w=winRate(f),v=verdict(w);
  const boons=f.boons.length?`<dt>Upgrades</dt><dd>${f.boons.slice(-12).map(b=>esc(b.e+' '+b.n)).join(', ')}${f.boons.length>12?` and ${f.boons.length-12} more`:''}</dd>`:'';
  const syns=synOf(f);
  const synH=syns.length?`<dt>Synergies</dt><dd>${syns.map(s=>`<span class="syn${s.anti?' anti':''}"><span class="inf" role="button" tabindex="0" data-info="${ik('syn',s.n)}">${s.e} ${esc(s.n)}</span><small>${esc(s.d)}</small></span>`).join('')}</dd>`:'';
  const pw=f.power.k==='none'?row('Power',f.power,'',ik('power',f.power.n)):`<dt>Power</dt><dd><span class="inf" role="button" tabindex="0" data-info="${ik('power',f.power.n)}">${f.power.e} ${esc(f.power.n)}</span><small>${esc(f.pm.n)}. ${esc(f.power.d)}</small></dd>`;
  const inj=(f.inj||[]).length?`<dt>Injuries</dt><dd>${f.inj.map(j=>{const d=INJK[j.k];return d?`<span class="inf" role="button" tabindex="0" data-info="${ik('inj',d.k)}">${d.e} ${esc(d.n)}</span><small>${esc(injText(d))}, ${j.left} more tournament${j.left>1?'s':''}</small>`:'';}).join('')}</dd>`:'';
  const earned=(f.earned||[]).length?`<dt>Earned titles</dt><dd>${f.earned.map(k=>ACHK[k]).filter(Boolean).map(a=>`<span class="inf" role="button" tabindex="0" data-info="${ik('ach',a.n)}">${esc(a.e+' '+a.n)}</span>`).join(', ')}</dd>`:'';
  const patch=[f.race&&PATCH.race[f.race.n],f.arch&&PATCH.arch[f.arch.k]].filter(Boolean).flatMap(m=>Object.entries(m).filter(([k,x])=>x)).map(([k,x])=>`${x>0?'+':'−'}${Math.abs(x)} ${STATLBL[k]}`);
  return `<div class="fcard">
    <div class="fc-top"><div>${charSVG(lookOf(f),{h:120})}</div><div><div class="fc-name">${esc(fullName(f))}</div><div class="fc-sub">Level ${f.lvl||1} ${esc(f.size.n.toLowerCase())} ${esc(f.race.n.toLowerCase())} ${esc(f.arch.n.toLowerCase())}${f.isNem?'. Your nemesis 😈':''}</div><div class="fc-sub">Power scale: <span class="inf" role="button" tabindex="0" data-info="rule|scale">${esc(powerScale(f).n)}</span></div></div><div class="stamp q${v.q}" role="button" tabindex="0" data-info="rule|verdict">${v.t}</div></div>
    <p class="fc-win">Beats about <b>${Math.round(w*100)}%</b> of random level 1 fighters.</p>
    ${numBlock(f)}
    <div class="stats">${statRows(f)}</div>
    ${kitStrip(f)}
    <dl class="loadout">
      ${f.rsub?row(RSUB[f.race.n].label,f.rsub,'',ik('rsub',f.race.n+'/'+f.rsub.n)):''}
      ${row('Archetype',f.arch,'Signature move: '+ULTS[f.arch.k],ik('arch',f.arch.n))}
      ${f.asub?row(ASUB[f.arch.k].label,f.asub,'',ik('asub',f.arch.k+'/'+f.asub.n)):''}
      ${row('Stance',f.stance,'',ik('stance',f.stance.n))}
      ${row('Backstory',f.back,'',ik('back',f.back.n))}
      ${f.reinc?row('Reincarnation of',f.reinc):''}
      ${row('Weapon',f.weapon,f.wm.n+' with it',ik('weapon',f.weapon.n))}
      ${pw}
      ${row('Enchant',f.ench,'',ik('ench',f.ench.n))}
      ${row('Weakness',f.weak,'',ik('weak',f.weak.n))}
      ${row('Chaos',f.chaos,'',ik('chaos',f.chaos.n))}
      ${f.quirk?row('Quirk',f.quirk,'',ik('quirk',f.quirk.n)):''}
      ${f.side?row('Sidekick',f.side,'',ik('side',f.side.n)):''}
      ${gearOf(f).length?`<dt>Gear</dt><dd>${gearOf(f).map(g=>`<span class="inf" role="button" tabindex="0" data-info="${ik('gear',g.n)}">${g.e} ${esc(g.n)}</span><small>${esc(g.d)}</small>`).join('')}</dd>`:''}
      ${f.title&&f.title.k!=='none'?row('Title',f.title,'',ik('title',f.title.n)):''}
      ${synH}${inj}${earned}
      ${patch.length?`<dt>Season patch</dt><dd>${esc(patch.join(', '))}</dd>`:''}
      ${boons}
    </dl>
  </div>`;
}
function finishBuild(){
  buildDone=false;
  $('#progFill').style.width='100%';
  synOf(F).forEach(s=>markSeen('syn',s.n));
  DB.last=SEQ.filter(W=>CX_CATS.has(W.k)&&F[W.k]&&!F[W.k].skip).map(W=>W.k+'|'+cxKey(W.k,F[W.k],F));saveDB();
  F._win=null;
  $('#cardBox').innerHTML=cardHTML(F);
  show('s-card');
}
$('#enterBtn').addEventListener('click',()=>{
  syncSlot();
  {const fi=freeSlot();DB.active=fi<0?0:fi;}
  DB.coins=0;DB.nemesis=null;DB.tourney=null;
  Object.assign(F,{career:true,cid:newCid(),lvl:1,xp:0,pendingLv:0,rec:{w:0,l:0},earned:[],inj:[],next:null,belts:{},defenses:0,tourneys:0,fights:0,gbest:0,trained:0,fame:0,tp:0,talents:[],challenge:null});
  applyLegacyStart(F);
  delete F.free;
  saveCareer();showHub();
});
$('#scrapBtn').addEventListener('click',()=>{$('#nameIn').value=F?F.name:'';F=null;renderTitle();show('s-title');});
function openSheet(f){$('#ovBody').innerHTML=cardHTML(f);$('#ov').hidden=false;$('#ovClose').focus();}
function closeSheet(){$('#ov').hidden=true;}
$('#ovClose').addEventListener('click',closeSheet);
$('#ov').addEventListener('click',e=>{if(e.target.id==='ov')closeSheet();});

// ---------- career hub ----------
function showHub(){
  if(!F||!F.career)F=loadCareer();
  if(!F){toTitle();return;}
  if(F.pendingLv>0){const n=F.pendingLv;Q=[];for(let i=0;i<n;i++)Q.push(levelUpTask);Q.push(showHub);nextQ();return;}
  const need=xpNeed(F.lvl);
  const belts=TIERS_T.filter(t=>t.size).map(t=>`<span class="belt${F.belts[t.k]?' on':''}" title="${esc(t.n)}" role="button" tabindex="0" data-info="tier|${t.k}">${t.e}</span>`).join('');
  const inj=(F.inj||[]).map(j=>{const d=INJK[j.k];return d?`<span class="oc down" role="button" tabindex="0" data-info="${ik('inj',d.k)}">${d.e} ${esc(d.n)}, ${j.left} more</span>`:'';}).join('');
  const earned=F.earned.map(k=>ACHK[k]).filter(Boolean).map(a=>`<span class="oc up" role="button" tabindex="0" data-info="${ik('ach',a.n)}">${a.e} ${esc(a.n)}</span>`).join('');
  const nx=F.next||{};
  const nextB=[nx.dmgX?'+15% damage':'',nx.hp?'starts at 80 HP':'',nx.en?'full energy':'',nx.readB?'reads 20% better':''].filter(Boolean);
  const NM=myNemesis();
  const nem=NM?`<p class="nem" role="button" tabindex="0" data-info="rule|nemesis">😈 Nemesis: <b>${esc(NM.f.name)}</b> has beaten you ${NM.beats===1?'once':NM.beats+' times'}. They'll show up in your next tournament, a level stronger each time they win.</p>`:'';
  $('#hubTop').innerHTML=`<div class="hubcard"><div class="hub-art">${charSVG(lookOf(F),{h:140})}</div><div class="hub-info"><div class="fc-name">${esc(fullName(F))}</div><div class="fc-sub">${esc(F.race.n)} ${esc(F.arch.n.toLowerCase())}</div><div class="lvl" role="button" tabindex="0" data-info="rule|xp">Level ${F.lvl}</div><div class="prog-track"><i style="width:${Math.round(F.xp/need*100)}%"></i></div><div class="sub2">${F.xp} of ${need} XP to level ${F.lvl+1}</div><div class="sub2">${pl(F.rec.w,'win')}, ${pl(F.rec.l,'loss','losses')}. 🪙 ${DB.coins}</div><div class="belts">${belts}</div></div></div>${inj||earned?`<div class="chips left">${inj}${earned}</div>`:''}${nextB.length?`<p class="hint" style="margin:10px 0 0">Next fight: ${esc(nextB.join(', '))}</p>`:''}${nem}`;
  const tr=DB.tourney;
  let resume='';
  if(tr){
    const tn=tr.g?TIERK.gauntlet:TIERK[tr.k];
    resume=`<div class="resume"><b>${tn?tn.e+' '+esc(tn.n):'Tournament'} in progress</b><span>${tr.g?`${pl(tr.streak||0,'win')} in a row so far`:`Up next: ${RNAMES[tr.size>>tr.r]||'the next round'}`}</span><button class="btn" id="resumeBtn">Resume</button><button class="btn ghost sm" id="abandonBtn">Abandon it</button></div>`;
  }
  $('#tierList').innerHTML=resume+TIERS_T.map(t=>{
    const ok=t.unlock(F)&&!tr,def=F.belts[t.k];
    const reward=t.size?`Win it: ${t.coins} 🪙${def?'. You hold this belt':''}`:`Your best: ${F.gbest} in a row`;
    return `<button class="tier${ok?'':' locked'}" data-t="${t.k}"${ok?'':' disabled'}><span class="te">${t.e}</span><span class="tt"><b>${esc(t.n)}${def?' (defending)':''}</b><small>${esc(ok?t.d:(tr&&t.unlock(F)?'Finish or abandon the current one first':t.lock))}</small>${ok?`<small>${esc(reward)}</small>`:''}</span></button>`;
  }).join('');
  {const sb=document.querySelector('#shopBtn b');if(sb)sb.textContent=`Supply tent (${DB.coins} 🪙)`;}
  $('#retireBtn').textContent='Retire this fighter';$('#retireBtn').dataset.label='Retire this fighter';
  renderHubExtras();renderStoryCard();organizeHub();renderModes();if(typeof playLayout==='function')playLayout();
  show('s-hub');
  if(DB.patchNotes&&DB.patchNotes.unseen)openPatchNotes();
}
$('#tierList').addEventListener('click',e=>{
  if(e.target.id==='resumeBtn'){if(loadTourney())showBracket();else showHub();return;}
  if(e.target.id==='abandonBtn'){
    const btn=e.target;
    if(Date.now()-(+btn.dataset.armed||0)<3500){DB.tourney=null;T=null;G=null;saveDB();showHub();return;}
    btn.dataset.armed=Date.now();btn.textContent='Tap again to abandon it';
    setTimeout(()=>{if(btn.isConnected)btn.textContent='Abandon it';},3500);return;
  }
  const b=e.target.closest('.tier');if(!b||b.disabled)return;startTournament(b.dataset.t);
});
let shopReturn=showHub;
$('#shopBtn').addEventListener('click',()=>{shopReturn=showHub;showShop();});
$('#fullCardBtn').addEventListener('click',()=>openSheet(F));
$('#retireBtn').addEventListener('click',e=>armRetire(e.target,()=>{retire();toTitle();}));
$('#hubTitleBtn').addEventListener('click',toTitle);

// ---------- shop ----------
const shopCost=s=>priceOf(s.k==='stat'?6+2*(F.trained||0):s.cost);
function showShop(){renderShop();show('s-shop');}
function renderShop(){
  $('#shopCoins').textContent=`You have ${DB.coins} 🪙. Fights pay coins, winning tournaments pays more.`;
  renderGearShop();
  $('#shopList').innerHTML=SHOP.map(s=>{
    const cost=shopCost(s),ok=!s.ok||s.ok(F),can=ok&&DB.coins>=cost;
    const extra=s.k==='stat'?`<div class="statpick">${KS6.map(k=>`<button class="sp" data-buy="stat" data-stat="${k}"${can?'':' disabled'}>${STATN[k]}</button>`).join('')}</div>`:'';
    const btn=s.k==='stat'?`<span class="price">${cost} 🪙</span>`:`<button class="buy" data-buy="${s.k}"${can?'':' disabled'}>${cost} 🪙</button>`;
    return `<div class="shopitem${ok?'':' na'}"><span class="se">${s.e}</span><div class="st2"><b>${esc(s.n)}</b><small>${esc(ok?s.d:s.na)}</small>${extra}</div>${btn}</div>`;
  }).join('');
}
$('#shopList').addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(!b||b.disabled)return;buy(b.dataset.buy,b.dataset.stat);});
$('#shopBack').addEventListener('click',()=>shopReturn());
function buy(k,stat){
  const s=SHOP.find(x=>x.k===k);if(!s)return;
  const cost=shopCost(s);if(DB.coins<cost||(s.ok&&!s.ok(F)))return;
  DB.coins-=cost;saveDB();
  const back=()=>{Q=[showShop];};
  switch(k){
    case 'cure':F.weak=CURED;break;
    case 'heal':F.inj=[];break;
    case 'stat':applyBonus(F,{k:stat,n:'+1 '+STATN[stat],e:'🏋️'});F.trained=(F.trained||0)+1;break;
    case 'drink':F.next=Object.assign({},F.next,{en:100});break;
    case 'scout':F.next=Object.assign({},F.next,{readB:.2});break;
    case 'weapon':saveCareer();back();respin(['weapon','wm']);return;
    case 'power':saveCareer();back();respin(['power','pm']);return;
    case 'stance':saveCareer();back();respin(['stance']);return;
  }
  F._win=null;saveCareer();landSound(2);renderShop();
}

// ---------- tournaments ----------
const RNAMES={2:'Final',4:'Semifinals',8:'Quarterfinals',16:'Round of 16',32:'Round of 32'};
const RNAME1={2:'Final',4:'Semifinal',8:'Quarterfinal',16:'Round of 16',32:'Round of 32'};
let T=null,G=null;
const pairsOf=a=>{const o=[];for(let i=0;i<a.length;i+=2)o.push([a[i],a[i+1]]);return o;};
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const nameKey=n=>n.split(' ').slice(0,2).join(' ').toLowerCase();
function freshName(used){let n;do{n=randName()}while(used.has(nameKey(n)));used.add(nameKey(n));return n;}
function startTournament(k){
  const tier=TIERK[k];
  if(!tier.size){startGauntlet();return;}
  DB.entered++;saveDB();
  const n=tier.size,used=new Set([nameKey(F.name)]);
  let nem=null;
  const NM=myNemesis();
  if(NM){nem=deserFighter(NM.f);if(nem){nem.isNem=true;used.add(nameKey(nem.name));}}
  const others=[];
  const base=tier.lvl+Math.floor((F.lvl-1)/2);
  while(others.length<n-1-(nem?1:0)){const pr=TIER_PCT[tier.k]||[0,1],o=poolPick(pr[0],pr[1],freshName(used));levelUp(o,base+Math.floor(Math.random()*2));if(tier.k==='regional'&&Math.random()<0.6)randomGear(o,1);if(tier.k==='world')randomGear(o,Math.random()<0.5?2:1);others.push(o);}
  shuffle(others);
  const half=n/2,slots=new Array(n).fill(null);
  const mySlot=Math.floor(Math.random()*half);slots[mySlot]=F;
  if(nem)slots[half+Math.floor(Math.random()*half)]=nem;
  for(let i=0;i<n;i++)if(!slots[i])slots[i]=others.pop();
  T={tier,size:n,fs:slots,me:mySlot,nem:nem?slots.indexOf(nem):-1,rounds:[pairsOf([...Array(n).keys()])],res:[new Array(n/2).fill(null)],r:0,done:false,champ:null,out:false,defending:!!F.belts[tier.k],recorded:false};
  saveTourney();
  showBracket();
}
function myMatch(){const ms=T.rounds[T.r];for(let i=0;i<ms.length;i++)if(ms[i].includes(T.me))return i;return -1;}
function matchWinner(a,b){const A=T.fs[a],B=T.fs[b];const w=simulate(A,B,ARENAS[pickW(ARENAS)])===0?a:b;recordMatch(T.fs[w],T.fs[w===a?b:a]);return w;}
function closeRound(){
  const r=T.r,last=T.rounds[r].length===1;
  if(!last)T.res[r].forEach(wi=>{if(wi!==T.me)applyBonus(T.fs[wi],BONUS[pickW(BONUS)]);});
  if(last){T.done=true;T.champ=T.res[r][0];return;}
  T.rounds.push(pairsOf(T.res[r]));T.res.push(new Array(T.res[r].length/2).fill(null));T.r++;
}
function resolveMyRound(winnerIdx){
  const r=T.r,mi=myMatch(),m=T.rounds[r][mi];
  T.res[r][mi]=winnerIdx;recordMatch(T.fs[winnerIdx],T.fs[m[0]===winnerIdx?m[1]:m[0]]);
  T.rounds[r].forEach((mm,i)=>{if(i!==mi)T.res[r][i]=matchWinner(mm[0],mm[1]);});
  closeRound();
}
function simRest(){
  while(!T.done){const r=T.r;T.rounds[r].forEach((m,i)=>{T.res[r][i]=matchWinner(m[0],m[1]);});closeRound();}
}
function recordTournament(){
  if(!T||!T.done||T.recorded)return;T.recorded=true;
  const L=T.rounds.length-1,finals=T.rounds[L][0],semis=L>=1?T.rounds[L-1].flat():finals;
  DB.lastTop=semis.map(i=>({n:T.fs[i].name,best:bestStat(T.fs[i]),place:i===T.champ?1:finals.includes(i)?2:3,look:lookOf(T.fs[i])}));
  if(T.champ===T.me){
    for(const W of SEQ){if(!['race','rsub','arch','asub','weapon','power'].includes(W.k))continue;const it=F[W.k];if(!it||it.skip)continue;const id=W.k+'|'+cxKey(W.k,it,F);DB.champIds[id]=(DB.champIds[id]||0)+1;}
  }
  saveDB();syncHistory();
}
function chip(idx,wi,right){
  const f=T.fs[idx];
  const cls=wi==null?'':(wi===idx?'won':'lost');
  const you=idx===T.me;
  return `<button class="chip ${cls}${you?' you':''}${right?' r':''}" data-f="${idx}"><span class="mini">${charSVG(lookOf(f),{h:40,mirror:right})}</span><span class="ntx"><span class="n">${esc(f.name)}${you?' (you)':''}</span><span class="lv">Lv ${f.lvl||1}${f.isNem?' 😈 nemesis':''}</span></span></button>`;
}
function matchHTML(m,wi){return `<div class="match${m.includes(T.me)?' mine':''}">${chip(m[0],wi,false)}<span class="vs">vs</span>${chip(m[1],wi,true)}</div>`;}
function showBracket(){
  if(T.gauntlet){showGauntlet();return;}
  $('#bracketTitle').textContent=`${T.tier.e} ${T.tier.n}`;
  let h='';
  if(T.done)h+=`<p class="champ-line">🏆 Champion: ${esc(fullName(T.fs[T.champ]))}${T.champ===T.me?' (you)':''}</p>`;
  else if(T.defending)h+=`<p class="champ-line">🛡️ You're the defending champion. Lose and the belt goes.</p>`;
  const total=Math.log2(T.size);
  for(let r=0;r<total;r++){
    const ms=T.rounds[r],label=RNAMES[T.size>>r];
    if(!ms){const n=T.size>>(r+1);h+=`<div class="round"><h3>${label}</h3><p class="tbd">${n} ${n===1?'match':'matches'} to come</p></div>`;continue;}
    const body=ms.map((m,i)=>matchHTML(m,T.res[r][i])).join('');
    const open=(r===T.r)||T.size<=8||(T.done&&r===T.rounds.length-1);
    h+=open?`<div class="round"><h3>${label}</h3>${body}</div>`:`<details class="round"><summary>${label} (${ms.length} ${ms.length===1?'match':'matches'})</summary>${body}</details>`;
  }
  $('#bracket').innerHTML=h;
  let a='';
  if(!T.done&&!T.out){
    const m=T.rounds[T.r][myMatch()],oi=m[0]===T.me?m[1]:m[0];
    a=`<button class="btn" id="goFightBtn">Fight ${esc(T.fs[oi].name)}${T.fs[oi].isNem?' 😈':''}</button><button class="btn ghost sm" id="bShop">Shop (🪙 ${DB.coins})</button>`;
  }else a=`<button class="btn" id="contQ">Continue</button>`;
  $('#bracketActions').innerHTML=a;
  show('s-bracket');
}
$('#bracket').addEventListener('click',e=>{
  const b=e.target.closest('.chip');if(!b)return;
  if(b.dataset.g)openSheet(b.dataset.g==='me'?F:G.opp);else openSheet(T.fs[+b.dataset.f]);
});
$('#bracketActions').addEventListener('click',e=>{
  if(e.target.id==='goFightBtn')goFight();
  if(e.target.id==='bShop'){shopReturn=showBracket;showShop();}
  if(e.target.id==='contQ')nextQ();
});

// ---------- the gauntlet ----------
function startGauntlet(){T={tier:TIERK.gauntlet,gauntlet:true};G={streak:0,opp:null,used:new Set([nameKey(F.name)])};nextGauntletOpp();saveTourney();showGauntlet();}
// an unfinished tournament survives closing the app
function saveTourney(){
  if(T&&(T.challenge||T.story||T.daily||T.rush)){DB.tourney=null;saveDB();return;}
  if(!T||!F||!F.career){DB.tourney=null;saveDB();return;}
  if(T.gauntlet)DB.tourney=G&&!G.over?{g:1,streak:G.streak,opp:serFighter(G.opp)}:null;
  else if(T.done||T.out)DB.tourney=null;
  else DB.tourney={k:T.tier.k,size:T.size,me:T.me,nem:T.nem,fs:T.fs.map((f,i)=>i===T.me?null:serFighter(f)),rounds:T.rounds,res:T.res,r:T.r,defending:!!T.defending};
  saveDB();
}
function loadTourney(){
  const d=DB.tourney;if(!d||!F)return false;
  try{
    if(d.g){const o=deserFighter(d.opp);if(!o)throw new Error('opp');T={tier:TIERK.gauntlet,gauntlet:true};G={streak:d.streak||0,opp:o,used:new Set([nameKey(F.name),nameKey(o.name)])};return true;}
    const fs=d.fs.map((o,i)=>i===d.me?F:deserFighter(o));
    if(fs.some(f=>!f)||!TIERK[d.k])throw new Error('fighters');
    T={tier:TIERK[d.k],size:d.size,fs,me:d.me,nem:d.nem,rounds:d.rounds,res:d.res,r:d.r,done:false,champ:null,out:false,defending:!!d.defending,recorded:false};
    return true;
  }catch(e){DB.tourney=null;saveDB();return false;}
}
function nextGauntletOpp(){const o=poolPick(clamp(0.1+G.streak*0.05,0,0.9),clamp(0.3+G.streak*0.05,0.2,1),freshName(G.used));levelUp(o,Math.floor(G.streak/2)+Math.floor((F.lvl-1)/2));if(G.streak>=4)randomGear(o,G.streak>=8?2:1);G.opp=o;}
function gChip(f,me){return `<button class="chip${me?' you':' r'}" data-g="${me?'me':'opp'}"><span class="mini">${charSVG(lookOf(f),{h:46,mirror:!me})}</span><span class="ntx"><span class="n">${esc(f.name)}${me?' (you)':''}</span><span class="lv">Lv ${f.lvl||1}</span></span></button>`;}
function showGauntlet(){
  $('#bracketTitle').textContent='🔥 The gauntlet';
  $('#bracket').innerHTML=`<div class="gaunt"><div class="odds">${G.streak} in a row</div><p class="hint" style="margin:6px 0 14px">Your best: ${F.gbest}. All-time best: ${DB.gbest}. Opponents get tougher every two wins, and every third win spins the event wheel.</p><div class="match mine">${gChip(F,true)}<span class="vs">vs</span>${gChip(G.opp,false)}</div></div>`;
  $('#bracketActions').innerHTML=`<button class="btn" id="goFightBtn">Fight ${esc(G.opp.name)}</button><button class="btn ghost sm" id="bShop">Shop (🪙 ${DB.coins})</button>`;
  show('s-bracket');
}

// home: from the hub it goes to the title screen, from anywhere else back to the fighter
$('#homeBtn').addEventListener('click',()=>{
  const scr=document.body.dataset.screen;
  if(scr==='s-hub'||!(F&&F.career)||!DB.career){toTitle();return;}
  Q=[];showHub();
});

// ---------- hub extras: daily wheel, sponsor contracts, gear ----------
const todayKey=()=>new Date().toDateString();
function renderHubExtras(){
  const rk=rankOf(F),RK=RANKS[rk],NX=RANKS[rk+1],fm=F.fame||0;
  let h=`<div class="rankcard"><div class="rk-h"><span class="rk-e">${RK.e}</span><div class="rk-t"><b>${RK.n}</b><small>${fm} fame${NX?`, ${NX.fame-fm} more for ${NX.n}`:', top rank'}</small></div><span class="inf" role="button" tabindex="0" data-info="rule|ranks">Ranks</span></div><div class="prog-track"><i style="width:${NX?Math.round((fm-RK.fame)/(NX.fame-RK.fame)*100):100}%"></i></div>${NX?`<small class="rk-next">Next unlock: ${esc(NX.perk)}</small>`:''}</div>`;
  h+=`<button class="btn ghost talbtn" id="talBtn">🌟 Talents${F.tp?`: ${pl(F.tp,'point')} to spend`:''}</button>`;
  if(F.challenge){const c=F.challenge;h+=`<div class="challenge"><b>⚔️ ${c.kind==='legend'?'A hall of fame legend wants to test you':'An old rival wants a rematch'}</b><span>${esc(c.name)}${c.kind==='legend'?' 👑':' 😈'}</span><button class="btn" id="chalBtn">Accept the challenge</button><button class="linkish" id="chalDecline">Not now</button></div>`;}
  if(DB.daily!==todayKey())h+=`<button class="btn daily" id="dailyBtn">🎁 Your daily wheel is ready</button>`;
  if(!F.contract&&!(F.offers&&F.offers.length))F.offers=shuffleArr(CONTRACTS.map(c=>c.k)).slice(0,3);
  if(F.contract){
    const c=CONTRACTK[F.contract];
    if(c)h+=`<div class="contract"><div class="ct-h"><span class="inf" role="button" tabindex="0" data-info="rule|contracts">📜 Sponsor contract</span></div><b>${c.e} ${esc(c.n)}</b><span>${esc(c.d)}</span><span class="ct-r">Pays ${c.coins} 🪙 and ${c.xp} XP</span><button class="linkish" id="dropContract">Drop it</button></div>`;
  }else{
    h+=`<div class="contract"><div class="ct-h"><span class="inf" role="button" tabindex="0" data-info="rule|contracts">📜 Pick a sponsor contract</span></div><div class="offers">${F.offers.map(k=>{const c=CONTRACTK[k];return c?`<button class="offer" data-contract="${k}"><span class="oe">${c.e}</span><span><b>${esc(c.n)}</b><small>${esc(c.d)}</small><small class="ct-r">${c.coins} 🪙, ${c.xp} XP</small></span></button>`:'';}).join('')}</div></div>`;
  }
  const gear=gearOf(F);
  h+=`<div class="gearline"><div class="gl-top"><span class="inf" role="button" tabindex="0" data-info="rule|gear">🎒 Gear</span><button class="btn ghost sm" id="armoryBtn">🛡️ Armory (${(F.armory||[]).length})</button></div><div class="gl-icons">${GEAR_SLOTS.map(sl=>{const g=GEARK[(F.gear||{})[sl]];return `<span class="gl-i${g?' r-'+g.r:''}" title="${SLOT_N[sl]}">${g?g.e:'<i>'+SLOT_E[sl]+'</i>'}</span>`;}).join('')}</div></div>`;
  $('#hubExtras').innerHTML=h;
}
$('#s-hub').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.id==='dailyBtn'){dailyTask();return;}
  if(t.id==='talBtn'){openTalents();return;}
  if(t.id==='chalBtn'){startChallenge();return;}
  if(t.id==='chalDecline'){F.challenge=null;saveCareer();renderHubExtras();return;}
  if(t.id==='dropContract'){F.contract=null;F.offers=null;saveCareer();renderHubExtras();return;}
  if(t.dataset.contract){F.contract=t.dataset.contract;F.offers=null;saveCareer();landSound(2);renderHubExtras();}
});
function dailyTask(){
  if(DB.daily===todayKey())return;
  Q=[showHub];
  runWheel({cat:'daily',title:'Daily wheel',who:'One free spin every day',list:DAILY.map(it=>({it,w:it.w,mult:1})),spinLabel:'Spin the daily wheel',
    onLand(it){
      DB.daily=todayKey();
      let out='';
      switch(it.k){
        case 'c5':DB.coins+=5;out='+5 coins';break;
        case 'c10':DB.coins+=10;out='+10 coins';break;
        case 'c25':DB.coins+=25;out='+25 coins';break;
        case 'xp':gainXP(F,15);out='+15 XP';break;
        case 'gear':{if(!F.gear.trinket){const g=pick(GEAR.filter(x=>x.slot==='trinket'));F.gear.trinket=g.k;markSeen('gear',g.n);out=`Free trinket: ${g.e} ${g.n}`;}else{DB.coins+=8;out='Your trinket slot is full, so you get 8 coins instead';}break;}
        case 'lvl':F.pendingLv=(F.pendingLv||0)+1;out='A level-up spin is waiting';break;
        case 'drink':F.next=Object.assign({},F.next,{en:100});out='Full energy next fight';break;
        case 'scout':F.next=Object.assign({},F.next,{readB:.2});out='Reads 20% better next fight';break;
        default:out='Better luck tomorrow';
      }
      F._win=null;saveCareer();saveDB();
      if(it.q>=3){const r=document.querySelector('.wheel-wrap').getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2);}
      return `<div class="note sub">${esc(out)}</div>`;
    },nextLabel:'Back to your fighter'});
}
function renderGearShop(){
  const rows=['armor','trinket'].map(slot=>{
    const cur=F.gear&&F.gear[slot];
    return `<h3 class="gear-h">${slot==='armor'?'🛡️ Armor':'💎 Trinkets'}</h3>`+GEAR.filter(g=>g.slot===slot).map(g=>{
      const price=priceOf(g.cost),locked=!!g.req&&rankOf(F)<g.req,own=cur===g.k,can=!own&&!locked&&DB.coins>=price;
      return `<div class="shopitem${own?' owned':''}"><span class="se">${g.e}</span><div class="st2"><b>${esc(g.n)}</b><small>${esc(g.d)}${cur&&!own?`. Replaces your ${esc(GEARK[cur].n.toLowerCase())}`:''}</small></div>${own?'<span class="price">Equipped</span>':`<button class="buy" data-gear="${g.k}"${can?'':' disabled'}>${locked?`${RANKS[g.req].e} ${RANKS[g.req].n}`:price+' 🪙'}</button>`}</div>`;
    }).join('');
  }).join('');
  $('#gearList').innerHTML=rows;
}
$('#gearList').addEventListener('click',e=>{
  const b=e.target.closest('[data-gear]');if(!b||b.disabled)return;
  const g=GEARK[b.dataset.gear];if(!g)return;const price=priceOf(g.cost);if(DB.coins<price||(g.req&&rankOf(F)<g.req))return;
  DB.coins-=price;F.gear=F.gear||{};F.gear[g.slot]=g.k;F._win=null;markSeen('gear',g.n);
  saveCareer();saveDB();landSound(2);renderShop();
  const r=b.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2);
});
// confetti anywhere on the page, not just in the arena
function burstAt(x,y){
  if(RM)return;
  for(let i=0;i<22;i++){
    const p=document.createElement('i');p.className='pt page';p.style.left=x+'px';p.style.top=y+'px';
    const sz=4+Math.random()*5;p.style.width=p.style.height=sz+'px';p.style.background=pick(['#FFB627','#FF4F8B','#3DD6C6','#B388FF','#FFFFFF']);
    document.body.appendChild(p);
    const ang=Math.random()*Math.PI*2,d=50+Math.random()*80,dx=Math.cos(ang)*d,dy=Math.sin(ang)*d-30;
    p.animate([{transform:'translate(-50%,-50%)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`,opacity:1,offset:.6},{transform:`translate(calc(-50% + ${dx*1.1}px),calc(-50% + ${dy+60}px))`,opacity:0}],{duration:900+Math.random()*300,easing:'cubic-bezier(.2,.7,.4,1)'}).finished.then(()=>p.remove(),()=>p.remove());
  }
}

// ---------- fighter page tabs ----------
let hubTab='story';
function organizeHub(){
  const ex=$('#hubExtras'),st=$('#tab-story'),fi=$('#tab-fighter');
  {const ev=$('#tab-events');for(const id of ['modeList','tierList']){const el=document.getElementById(id);if(el&&!ev.contains(el))ev.appendChild(el);}}
  st.innerHTML='';fi.innerHTML='';
  const toStory=['storycard','challenge','daily'],toFighter=['rankcard','talbtn','contract','gearline'];
  [...ex.children].forEach(el=>{
    const c=el.classList;
    if(toFighter.some(k=>c.contains(k))||el.id==='talBtn')fi.appendChild(el);
    else st.appendChild(el);
  });
  setHubTab(hubTab);
}
function setHubTab(t){
  hubTab=t;
  document.querySelectorAll('.hubtabs [data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
  if(t==='goals'&&typeof renderGoals==='function')renderGoals();
  ['story','fighter','events','goals','more'].forEach(k=>{const p=document.getElementById('tab-'+k);p.hidden=k!==t;if(k===t){p.classList.remove('enter');void p.offsetWidth;p.classList.add('enter');}});
}
document.querySelector('.hubtabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){tick();setHubTab(b.dataset.tab);}});
$('#hubCodexBtn').addEventListener('click',()=>openCodex());
