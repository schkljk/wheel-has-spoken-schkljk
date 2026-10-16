// ================= MORE MODES, RARER LOOT =================
CODEX.splice(CODEX.findIndex(c=>c[0]==='title'),0,['side','Sidekicks',plainList(SIDEKICKS)]);
CX_CATS.add('side');
Object.assign(RULES,{
  daily:['📆','Daily challenge',['One special fight every day against an opponent matched to your fighter, with a twist from the mutator wheel.','Win for coins, XP, fame and an elite loot spin. Win on consecutive days to grow your streak bonus. You get one attempt a day.']],
  rush:['🏃','Boss rush',['All ten story bosses back to back, with 30-round fights and sudden death. Your HP carries over, and you get 25 back after each win.','Clear them all for a big payout and a boss loot spin. Unlocks once you beat chapter 2, or reach level 10.']],
  club:['🎰','Fight club',['Bet coins on a fight between two other fighters. The payout depends on the odds: backing the underdog pays more.','Study their power scale and the odds, then pick a side.']]
});
// ---------- loot: spin for a rarity, then see what you got ----------
const LOOT_SLICES=[['junk','Junk gear','🗑️'],['common','Common gear','📦'],['rare','Rare gear','💎'],['epic','Epic gear','🔮'],['legendary','Legendary gear','👑'],['mythic','Mythic gear','🌌']];
function lootList(table){
  storyEnsure();
  const c=F.story.ch+(F.story.ng||0),boost=(F.lootBoost?1.7:1)*(1+0.15*talEcon(F,'loot')+0.15*lgLvl('bloodline'));
  const RW={
    normal:{junk:1.6,common:3,rare:1.2,epic:.35,legendary:.06+.02*c,mythic:0},
    elite:{junk:.6,common:1.6,rare:2,epic:.9,legendary:.18+.05*c,mythic:.02*c},
    boss:{junk:0,common:.4,rare:1.4,epic:1.6,legendary:.7+.25*c,mythic:.07*c},
    treasure:{junk:.8,common:1.6,rare:1.8,epic:.8,legendary:.18+.05*c,mythic:.025*c}
  }[table]||{junk:1,common:2,rare:1,epic:.3,legendary:.05,mythic:0};
  const list=[];
  for(const [r,n,e] of LOOT_SLICES){const w=RW[r]*(['epic','legendary','mythic'].includes(r)?boost:1);if(w>0)list.push({it:{n,e,q:RARITY[r].q,rar:r,d:`A random ${RARITY[r].n.toLowerCase()} piece of armor, trinket or boots`},w,mult:1});}
  list.push({it:{n:'Coin pouch',e:'💰',q:1,coins:6+c*2,d:'Coins'},w:table==='boss'?.6:1.4,mult:1});
  list.push({it:{n:'Supplies',e:'🎒',q:1,item:1,d:'A random item for your bag'},w:1.2,mult:1});
  return list;
}
function lootTask(table){
  storyEnsure();track('loot');
  const list=lootList(table);
  const reasons=[{cls:'up',txt:{normal:'Regular fight loot',elite:'Elite loot: epic and legendary more likely',boss:'Boss loot: the good stuff',treasure:'Treasure: rarer gear more likely'}[table]||'Loot'}];
  if(F.lootBoost)reasons.push({cls:'up',txt:'🍀 Lucky charm: epic and up ×1.7'});
  F.lootBoost=false;saveCareer();pendingGear=null;
  runWheel({cat:'loot',title:'Loot',who:`${F.name} searches the spoils`,list,reasons,spinLabel:'Spin for loot',
    onLand(it){
      if(it.coins){DB.coins+=it.coins;saveDB();return `<div class="note sub">+${it.coins} coins</div>`;}
      if(it.item){const i=pick(ITEMS);F.bag[i.k]=(F.bag[i.k]||0)+1;saveCareer();return `<div class="note sub">${i.e} ${esc(i.n)} added to your bag</div>`;}
      if(it.rar){
        const own=new Set([...Object.values(F.gear||{}),...(F.armory||[])]);
        let pool=GEAR.filter(g=>g.r===it.rar&&!own.has(g.k));if(!pool.length)pool=GEAR.filter(g=>g.r===it.rar);
        const g=pick(pool);markSeen('gear',g.n);
        const tag=`<div class="lootreveal r-${g.r}"><span class="lr-e">${g.e}</span><span><b>${esc(g.n)}</b><small>${RARITY[g.r].n} ${g.slot}. ${esc(g.d)}${flav(g.n)}</small></span></div>`;
        if(g.r==='legendary'||g.r==='mythic')setTimeout(()=>{const r=document.querySelector('.wheel-wrap').getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2);},200);
        if(!F.gear[g.slot]){F.gear[g.slot]=g.k;F._win=null;saveCareer();return tag+'<div class="note sub">Equipped</div>';}
        if(F.gear[g.slot]===g.k){DB.coins+=Math.max(2,Math.round(g.cost/3));saveDB();return tag+'<div class="note sub">You already have one: salvaged for coins</div>';}
        pendingGear=g;return tag;
      }
      return '';
    },
    next:()=>{if(pendingGear){const g=pendingGear;pendingGear=null;gearChoice(g,nextQ);}else nextQ();},nextLabel:'Continue'});
}
// ---------- fights for the new modes ----------
let BR=null,DC_MUT=null;
function fightMods(O){
  const m0=Object.assign({},F.next||{}),m1=O&&O.maxHp?{maxHp:O.maxHp}:{};
  if(T&&T.story){m0.hp=F.story.hp;if(m0.halfHp)m0.hp=Math.max(1,Math.ceil(F.story.hp/2));}
  if(T&&T.rush&&BR)m0.hp=BR.hp;
  if(T&&T.daily&&DC_MUT){Object.assign(m0,DC_MUT.mods[0]);Object.assign(m1,DC_MUT.mods[1]);}
  return [m0,m1];
}
function modeResult(won,big,desc,lines,got){
  $('#result').innerHTML=`<div class="res ${won?'win':'lose'}"><div class="big">${big}</div><p>${desc}</p><ul class="gains">${lines.map(l=>`<li>${l}</li>`).join('')}</ul>${got.length?`<div class="chips">${got.map(a=>`<span class="oc up">${a.e} New title: ${esc(a.n)}</span>`).join('')}</div>`:''}</div>`;
  $('#fightActions').innerHTML=`<button class="btn" data-a="next">Continue</button>`;
  landSound(won?2:0);buzz(won?40:80);
  if(won)setTimeout(()=>{const r=$('#result').getBoundingClientRect();burstAt(r.left+r.width/2,r.top+30);},300);
}
function commonAfter(won,O){
  lastFight={A:F,B:O,w:BT.w,ev:fightLog.slice()};
  F.fights=(F.fights||0)+1;F.rec[won?'w':'l']++;recordMatch(won?F:O,won?O:F);
}
// ---------- daily challenge ----------
const dayKey=d=>new Date(Date.now()-d*864e5).toDateString();
function dcEnsure(){
  if(DB.dc&&DB.dc.date===todayKey())return DB.dc;
  const prev=DB.dc||{};
  const o=poolPick(0.3,0.8);levelUp(o,Math.max(0,(F.lvl||1)));randomGear(o,2);
  for(let i=0;i<6;i++){const p=headToHead(F,o,60);if(p>0.58){applyBonus(o,{k:'all1',n:'+1 to everything',e:'💪'});o._win=null;}else if(p<0.4){applyBonus(o,{k:'curse',n:'Eased off',e:'🕊️'});o._win=null;}else break;}
  DB.dc={date:todayKey(),opp:serFighter(o),mut:null,done:false,streak:prev.lastWin===dayKey(1)?(prev.streak||0):0,lastWin:prev.lastWin||null};
  saveDB();return DB.dc;
}
function startDaily(){
  const dc=dcEnsure();
  if(dc.done){toast(dc.won?'Already won today. Come back tomorrow':'One attempt a day. Come back tomorrow');return;}
  if(!dc.mut){
    Q=[dailyIntro];
    runWheel({cat:'mut',title:'Mutator',who:"Today's twist",list:MUTATORS.map(it=>({it,w:it.w,mult:1})),spinLabel:'Spin the mutator',
      onLand(it){DB.dc.mut=it.k;saveDB();return `<div class="ds">${esc(it.d)}</div>`;},nextLabel:'See the challenge'});
    return;
  }
  dailyIntro();
}
function dailyIntro(){
  const dc=DB.dc,o=deserFighter(dc.opp),mut=MUTATORS.find(m=>m.k===dc.mut);
  if(!o||!mut){DB.dc=null;saveDB();showHub();return;}
  const bonus=3*Math.min(dc.streak+1,5);
  askChoice({icon:'📆',title:'Daily challenge',sub:dc.streak?`${dc.streak}-day streak`:'Win to start a streak',
    body:`<b>${esc(o.name)}</b>, level ${o.lvl} ${esc(o.race.n.toLowerCase())} ${esc(o.arch.n.toLowerCase())}.<br>${mut.e} <b>${esc(mut.n)}</b>: ${esc(mut.d)}.<br><span class="hint">Win: ${15+bonus} 🪙, 20 XP, fame and an elite loot spin. One attempt today.</span>`,
    options:[{label:'⚔️ Fight',sub:'Your HP starts full',fn:()=>startDailyFight(o,mut)},{label:'Not now',sub:'It will still be here today',fn:()=>showHub()}]});
}
function startDailyFight(o,mut){
  DC_MUT=mut;T={tier:{k:'daily',n:'Daily challenge',e:'📆',xpW:0,coins:0},daily:true};curOpp=-1;curOppF=o;
  if(mut.arena){curArena=ARENAS.find(a=>a.k===mut.arena)||curArena;openFight();}else goFight();
}
function dailyEnd(won,O){
  commonAfter(won,O);
  const dc=DB.dc,lines=[],got=[],keys=[];dc.done=true;dc.won=won;
  let xp=won?20:5,coins=0,fame=0;
  if(won){track('wins');addMasteryWin(F);track('dailies');dc.streak=(dc.lastWin===dayKey(1)?(dc.streak||0):0)+1;dc.lastWin=todayKey();coins=9+2*Math.min(dc.streak,5);fame=8;awardGems(1,lines);if(dc.streak>=5)keys.push('daily5');lines.push(`📆 Streak: ${pl(dc.streak,'day')}`);}
  else{dc.streak=0;lines.push('Streak reset. Try again tomorrow');}
  gainXP(F,xp);DB.coins+=coins;award(keys,got);lines.unshift(`+${xp} XP, +${coins} 🪙`);lines.push(...gainFame(fame));
  saveCareer();saveDB();
  Q=[];if(won)Q.push(()=>lootTask('elite'));const n=F.pendingLv||0;for(let i=0;i<n;i++)Q.push(levelUpTask);Q.push(showHub);
  modeResult(won,won?'Challenge won':'Challenge lost',won?`${esc(F.name)} beats ${esc(O.name)}.`:`${esc(O.name)} takes today's challenge.`,lines,got);
}
// ---------- boss rush ----------
const rushOpen=()=>F&&((F.story&&(F.story.cleared||[]).includes(2))||(F.lvl||1)>=10);
function startRush(){if(!rushOpen()){toast('Beat chapter 2 or reach level 10 to unlock');return;}BR={i:0,hp:100};nextRushFight();}
function nextRushFight(){
  storyEnsure();
  const set=rushBosses(),off=BOSSES.indexOf(set[0]);
  const keep=F.story.hp;F.story.hp=BR.hp;const b=makeBoss(off+BR.i+1);F.story.hp=keep;
  const def=set[BR.i];
  cine(`<div class="cine-kicker">Boss rush, ${BR.i+1} of ${rushBosses().length}</div><div class="boss-art">${charSVG(lookOf(b),{h:180})}</div><div class="boss-plate"><b>${esc(b.name)}</b><span>${esc(b.bossTitle)}</span></div><p class="boss-line">"<span id="bossLine"></span>"</p><div class="cine-meta">You have ${hpTxt(BR.hp)} HP. They have ${Math.round(b.maxHp*LS(b))}.</div>`,'Fight',()=>{
    T={tier:{k:'rush',n:`Boss rush ${BR.i+1}/${rushBosses().length}`,e:'🏃',xpW:0,coins:0},rush:true,node:'boss'};curOpp=-1;curOppF=b;goFight();
  });
  typeLine(document.getElementById('bossLine'),pick(def.lines));
}
function rushEnd(won,O){
  commonAfter(won,O);
  const me=BT.P[0],lines=[],got=[],keys=[];let xp=6,coins=0,fame=0;
  Q=[];
  if(won){
    track('wins');addMasteryWin(F);track('bosses');BR.i++;BR.hp=Math.min(100,Math.max(1,Math.ceil(me.hp))+25);xp=10+BR.i*3;coins=5*BR.i;fame=3*BR.i;awardGems(1,lines);
    if(BR.i>=rushBosses().length){track('rushes');coins+=90;awardGems(10,lines);fame+=35;xp+=45;keys.push('rush');DB.rushBest=rushBosses().length;lines.push('🏆 Every boss is down!');Q.push(()=>lootTask('boss'));}
    else{lines.push(`Next: boss ${BR.i+1} of ${rushBosses().length}. You'll have ${hpTxt(BR.hp)} HP`);Q.push(nextRushFight);}
  }else{DB.rushBest=Math.max(DB.rushBest||0,BR.i);coins=5*BR.i;lines.push(`Run over after ${pl(BR.i,'boss','bosses')}. Best: ${DB.rushBest}/${rushBosses().length}`);}
  gainXP(F,xp);DB.coins+=coins;award(keys,got);lines.unshift(`+${xp} XP, +${coins} 🪙`);lines.push(...gainFame(fame));
  saveCareer();saveDB();
  if(!won||BR.i>=rushBosses().length){const n=F.pendingLv||0;for(let i=0;i<n;i++)Q.push(levelUpTask);Q.push(showHub);}
  modeResult(won,won?(BR.i>=rushBosses().length?'Rush cleared':'Boss down'):'Rush over',won?`${esc(F.name)} beats ${esc(O.name)}.`:`${esc(O.name)} ends the run.`,lines,got);
}
// ---------- fight club ----------
let FC=null;
function openFightClub(){
  const lv=Math.max(1,F.lvl||1);
  const mk=()=>{const o=poolPick(0,1);levelUp(o,Math.max(0,lv-1+Math.floor(Math.random()*3)));if(Math.random()<0.6)randomGear(o,1+Math.floor(Math.random()*2));return o;};
  const A=mk(),B=mk(),pA=clamp(headToHead(A,B,100),0.05,0.95);
  FC={A,B,pA,bet:Math.min(10,DB.coins),pick:null};
  renderClub();
}
const clubMult=p=>Math.round(clamp(0.92/p,1.1,8)*10)/10;
function renderClub(){
  const {A,B,pA,bet}=FC;
  const side=(f,p,k)=>`<div class="fc-side"><div class="fc-art">${charSVG(lookOf(f),{h:96})}</div><b>${esc(f.name)}</b><small>Level ${f.lvl} ${esc(f.race.n.toLowerCase())} ${esc(f.arch.n.toLowerCase())}</small><small>📈 ${esc(powerScale(f).n)}</small><span class="fc-odds">${Math.round(p*100)}% to win</span><button class="btn sm" data-club="${k}"${DB.coins>=bet&&bet>0?'':' disabled'}>Bet ${bet} 🪙 · pays ×${clubMult(p)}</button></div>`;
  setSheet(`<div class="ch-h"><span class="ch-i">🎰</span><div><b>Fight club</b><small>You have ${DB.coins} 🪙</small></div><span class="inf" role="button" tabindex="0" data-info="rule|club">How it works</span></div>
    <div class="fc-bets">${[5,10,25,50].map(v=>`<button class="fchip${bet===v?' on':''}" data-clubbet="${v}"${DB.coins>=v?'':' disabled'}>${v} 🪙</button>`).join('')}</div>
    <div class="fc-vs">${side(A,pA,'A')}<div class="fc-v">VS</div>${side(B,1-pA,'B')}</div>
    <div class="row2"><button class="btn ghost" data-club="new">New matchup</button><button class="btn ghost" data-close="1">Leave</button></div>`);
}
function runClubFight(pick){
  const {A,B,pA,bet}=FC,mult=clubMult(pick==='A'?pA:1-pA);
  DB.coins-=bet;saveDB();
  const bt=newBattle(A,B,false);let evs=bt.start();
  setSheet(`<div class="ch-h"><span class="ch-i">🎰</span><div><b>${esc(A.name)} vs ${esc(B.name)}</b><small>You bet ${bet} 🪙 on ${esc((pick==='A'?A:B).name)}</small></div></div>
    <div class="fc-live"><div><span>${esc(A.name)}</span><div class="hpbar2"><i id="fcA" style="width:100%"></i></div></div><div><span>${esc(B.name)}</span><div class="hpbar2"><i id="fcB" style="width:100%"></i></div></div></div>
    <ol class="log full fc-log" id="fcLog"></ol><div id="fcEnd"></div>`);
  const log=document.getElementById('fcLog');
  const tickF=()=>{
    if(!document.getElementById('fcLog'))return;
    if(!bt.over){bt.plan();evs=bt.step();}
    const s=bt.snap();document.getElementById('fcA').style.width=s.h[0]+'%';document.getElementById('fcB').style.width=s.h[1]+'%';
    log.insertAdjacentHTML('beforeend',evs.slice(-3).map(evHTML).join(''));log.scrollTop=log.scrollHeight;tick();
    if(!bt.over){setTimeout(tickF,fastMode?280:620);return;}
    const won=(bt.w===0)===(pick==='A');let txt;
    if(won){const pay=Math.round(bet*mult);DB.coins+=pay;track('bets');txt=`🎉 ${esc((pick==='A'?A:B).name)} wins. You collect ${pay} 🪙`;if(mult>=3){const got=[];award(['bigbet'],got);}landSound(3);}
    else{txt=`💸 ${esc((pick==='A'?B:A).name)} wins. Your ${bet} 🪙 are gone`;landSound(0);}
    saveDB();
    document.getElementById('fcEnd').innerHTML=`<p class="ch-body"><b>${txt}</b></p><div class="row2"><button class="btn" data-club="new">Another fight</button><button class="btn ghost" data-close="1">Leave</button></div>`;
  };
  setTimeout(tickF,500);
}
document.getElementById('choice').addEventListener('click',e=>{
  const b=e.target.closest('[data-clubbet]');if(b&&!b.disabled&&FC){FC.bet=+b.dataset.clubbet;renderClub();return;}
  const c=e.target.closest('[data-club]');if(!c||c.disabled)return;
  if(c.dataset.club==='new'){openFightClub();return;}
  if(FC&&(c.dataset.club==='A'||c.dataset.club==='B')&&DB.coins>=FC.bet)runClubFight(c.dataset.club);
});
// ---------- the modes on the Events tab ----------
function renderModes(){
  const box=document.getElementById('tab-events');if(!box||!F)return;
  let m=document.getElementById('modeList');if(!m){m=document.createElement('div');m.id='modeList';m.className='modes';box.insertBefore(m,box.firstChild);}
  const dc=DB.dc&&DB.dc.date===todayKey()?DB.dc:null;
  const dTxt=dc&&dc.done?(dc.won?`Won today. Streak: ${pl(dc.streak,'day')}`:'Done for today'):`Ready${DB.dc&&DB.dc.streak?`. Streak: ${pl(DB.dc.streak,'day')}`:''}`;
  m.innerHTML=`<button class="mode" data-mode="daily"><span class="mo-e">📆</span><span><b>Daily challenge</b><small>${dTxt}. One fight, one twist, zero refunds</small></span></button>
    <button class="mode${rushOpen()?'':' locked'}" data-mode="rush"><span class="mo-e">🏃</span><span><b>Boss rush</b><small>${rushOpen()?`${(F.story&&(F.story.cleared||[]).includes(11))?'Act II':'Act I'} bosses back to back. Best: ${DB.rushBest||0}/10`:'Beat chapter 2 or reach level 10. Bosses do not do walk-ins'}</small></span></button>
    <button class="mode" data-mode="club"><span class="mo-e">🎰</span><span><b>Fight club</b><small>Bet on strangers. Lose money with friends</small></span></button>
    <h3 class="gear-h">Cups and the gauntlet</h3>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-mode]');if(!b)return;
  const k=b.dataset.mode;
  if(k==='daily')startDaily();else if(k==='rush')startRush();else if(k==='club')openFightClub();
});
