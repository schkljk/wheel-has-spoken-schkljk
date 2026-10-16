// ---------- fight flow ----------
const PILLN={crit:'crit',weak:'weak spot',guard:'guarded',broke:'guard broken',interrupted:'interrupted',caught:'caught mid-cast'};
function evHTML(e){
  const pills=e.pills.map(p=>p.startsWith('combo:')?`<span class="pill combo" role="button" tabindex="0" data-info="${esc('pill|combo|'+p.slice(6))}">${esc(p.slice(6))}</span>`:`<span class="pill ${p}" role="button" tabindex="0" data-info="pill|${p}">${PILLN[p]||p}</span>`).join('');
  const d=e.d!=null?`<span class="dmg">${e.cls==='heal'?'+':'−'}${e.d}</span>`:'';
  return `<li class="${e.cls}"><span>${e.html}${pills}</span>${d}</li>`;
}
function appendLogs(list){
  if(!list.length)return;
  fightLog.push(...list);
  const log=$('#log');log.insertAdjacentHTML('beforeend',list.map(evHTML).join(''));log.scrollTop=log.scrollHeight;
}
function arenaOdds(A,B){
  const list=ARENAS.map(it=>({it,w:it.w,mult:1})),reasons=[];
  for(const f of [A,B]){
    const tags=new Set([...(activePower(f)?f.power.t:[]),...f.weapon.t,...(f.ench.t||[])]);
    let hit=false;
    list.forEach(e=>{const tm=e.it.tag||{};if([...tags].some(t=>tm[t]>1)){e.mult*=1.6;hit=true;}});
    if(hit)reasons.push({cls:'up',txt:`${f.race.e} ${f.name}'s element pulls matching arenas ×1.6`});
  }
  if(DB.lastArena){const e=list.find(x=>x.it.k===DB.lastArena);if(e){e.mult*=0.5;reasons.push({cls:'down',txt:`${e.it.e} ${e.it.n} was the last arena ×0.5`});}}
  list.forEach(e=>{e.w=e.it.w*e.mult;});
  return {list,reasons};
}
function goFight(){
  if(T.challenge||T.story||T.daily||T.rush){curOpp=-1;}
  else if(T.gauntlet){curOpp=-1;curOppF=G.opp;}
  else{const m=T.rounds[T.r][myMatch()];curOpp=m[0]===T.me?m[1]:m[0];curOppF=T.fs[curOpp];}
  const O=curOppF,od=arenaOdds(F,O);
  runWheel({cat:'arena',title:'Arena',who:`${F.name} vs ${O.name}: where does this go down?`,list:od.list,reasons:od.reasons,spinLabel:'Spin the arena',
    onLand(it){curArena=it;markSeen('arena',it.n);DB.lastArena=it.k;saveDB();
      setTimeout(()=>{if(task&&task.cat==='arena'&&bonusDone&&!$('#s-spin').hidden)$('#spinBtn').click();},RM?200:fastMode?650:1200);
      return '<div class="ds">Heading into the arena…</div>';},next:openFight,nextLabel:'To the fight'});
}
function openFight(){
  const O=curOppF,AR=curArena||{};
  BT=null;ended=false;skipFlag=false;playing=false;curPlan=null;
  const label=(T.challenge||T.story||T.daily||T.rush)?T.tier.n:T.gauntlet?`Gauntlet fight ${G.streak+1}`:RNAME1[T.size>>T.r];
  $('#roundName').textContent=`${label}${O.isNem?' 😈 nemesis fight':''}`;
  renderArena(F,O);
  curOdds=headToHead(F,O,120,curArena,fightMods(O));
  const vo=verdict(winRate(O));
  const syns=synOf(O);
  const sub=[O.rsub&&O.rsub.n,O.asub&&O.asub.n].filter(Boolean).join(', ');
  const nx=F.next||{};
  const buffs=[nx.dmgX?'+15% damage':'',nx.hp?'starting at 80 HP':'',nx.en?'full energy':'',nx.readB?'reading 20% better':''].filter(Boolean);
  awSel=null;
  $('#scout').innerHTML=`<div class="scout"><div class="vs-h"><span class="vs-k">${esc(label)}${O.isNem?' 😈':''}</span><div class="vs-row"><span class="vs-n me">${esc(F.name)}</span><span class="vs-x">VS</span><span class="vs-n op">${esc(O.name)}</span></div></div>${T.story?`<p class="hint" style="margin:0 0 8px">You go in with ${(fightMods(O)[0].hp)} HP${O.maxHp?`. ${esc(O.name)} has ${O.maxHp} HP and a second phase`:''}.</p>`:''}
    <p class="odds"><span class="inf" role="button" tabindex="0" data-info="rule|simodds">You win ${Math.round(curOdds*100)}% of simulated fights</span></p>
    <p class="hint" style="margin:-4px 0 6px"><span class="inf" role="button" tabindex="0" data-info="rule|scale">Power scale</span>: you're ${esc(powerScale(F).n)}, they're ${esc(powerScale(O).n)}</p>
    <p class="hint" style="margin:0 0 8px">${curOdds<0.1?'Pray. 💀':curOdds<0.35?'Rough. Read them well and hope the wheel was lying.':curOdds<0.65?'Coin flip. Your reads decide this one.':curOdds<0.9?'You should take this.':'Light work 👹'}</p>
    ${AR.n?`<p class="hint" style="margin:0 0 8px"><span class="inf" role="button" tabindex="0" data-info="${ik('arena',AR.n)}">${AR.e} <b>${esc(AR.n)}</b></span>: ${esc(AR.d)}</p>`:''}
    ${buffs.length?`<p class="hint" style="margin:0 0 8px">You're going in with ${esc(buffs.join(', '))}.</p>`:''}
    <dl class="loadout" style="margin-top:6px">
      <dt>Who</dt><dd>${esc(fullName(O))}${O.isNem?' 😈':''}<small>Level ${O.lvl||1} ${esc(O.race.n.toLowerCase()+' '+O.arch.n.toLowerCase()+(sub?', '+sub:''))}</small></dd>
      <dt>Verdict</dt><dd>${vo.t}</dd>
      <dt>Stance</dt><dd>${infIt('stance',O.stance)}<small>${esc(O.stance.d)}</small></dd>
      <dt>Weapon</dt><dd>${infIt('weapon',O.weapon)}</dd>
      <dt>Power</dt><dd>${infIt('power',O.power)}</dd>
      <dt>Weakness</dt><dd>${infIt('weak',O.weak)}<small>${esc(O.weak.d)}</small></dd>
      ${syns.length?`<dt>Synergies</dt><dd>${syns.map(s=>infIt('syn',s)).join(', ')}</dd>`:''}
    </dl>
    <button class="linkish" id="scoutCard">See ${esc(O.name)}'s full card</button>
    <p class="tip">Every round you pick a focus and spin your combat wheel, with a read on their next move to guide you. Strike beats Power, Power breaks Guard, Guard beats Strike. Feints bait guards, Focus charges you up. Winning reads builds momentum, up to +30% damage. Your signature move spins its own wheel.</p>
    <div class="help"><span class="inf" role="button" tabindex="0" data-info="rule|moves">How moves work</span><span class="inf" role="button" tabindex="0" data-info="rule|read">About reads</span><span class="inf" role="button" tabindex="0" data-info="rule|combos">Element combos</span><span class="inf" role="button" tabindex="0" data-info="rule|energy">Energy</span></div>
  </div>`;
  $('#moves').hidden=true;$('#moverow').hidden=true;$('#intent').innerHTML='';
  $('#log').innerHTML='';$('#result').innerHTML='';$('#narr').innerHTML='';
  $('#fightActions').innerHTML='';
  show('s-fight');
  compactScout(O,label);
  setTimeout(()=>{if(!BT&&!ended&&document.body.dataset.screen==='s-fight')startFight();},RM?60:700);
}
$('#scout').addEventListener('click',e=>{if(e.target.id==='scoutCard')openSheet(curOppF);});
const INTENT_TXT={strike:'a strike',power:'a power move',guard:'a guard',ult:'their signature move'};
const HOW={strike:'Guard beats Strike.',power:'Strike interrupts Power.',guard:'Power breaks Guard.',ult:'Guarding softens it.'};
const CTR={strike:'guard',power:'strike',guard:'power',ult:'guard'};
function renderMoves(plan){
  const me=BT.P[0],op=BT.P[1],f=me.f;
  const weakPill='<span class="pill weak">weak spot</span>';
  const ctrPill='<span class="pill ctr">counters the read</span>';
  const ctr=plan?CTR[plan.shown]:null;
  let pSub,pOk=false,pPill='';
  if(f.power.k==='none')pSub='No power';
  else if(!me.powOn)pSub='Shut off by negation';
  else if(f.power.passive)pSub='Passive, always on';
  else{pOk=me.en>=POW_COST;pSub=pOk?`Breaks Guard. Costs ${POW_COST}`:`Needs ${POW_COST} energy`;if(hitsWeak(op,f.power.t))pPill=weakPill;}
  const uOk=me.en>=100;
  const gPct=Math.round((1-gxOf(me))*100);
  $('#intent').innerHTML=plan?`<div class="intent"><span class="ie">🔮</span><div>You read <b>${esc(op.f.name)}</b> going for <b>${INTENT_TXT[plan.shown]}</b><small>${Math.round(plan.acc*100)}% sure. ${HOW[plan.shown]}</small></div></div><div class="help"><span class="inf" role="button" tabindex="0" data-info="rule|moves">How moves work</span><span class="inf" role="button" tabindex="0" data-info="rule|read">About reads</span><span class="inf" role="button" tabindex="0" data-info="rule|combos">Combos</span><span class="inf" role="button" tabindex="0" data-info="rule|energy">Energy</span></div>`:'';
  $('#moves').innerHTML=`
    <button class="mv" data-m="strike"><span class="mi">${f.weapon.e}</span><span class="mt">Strike${hitsWeak(op,physTags(me))?weakPill:''}${ctr==='strike'?ctrPill:''}</span><span class="ms">Beats Power. +25 energy</span></button>
    <button class="mv" data-m="power"${pOk?'':' disabled'}><span class="mi">${f.power.e}</span><span class="mt">${esc(f.power.k==='none'?'Power':f.power.n)}${pPill}${ctr==='power'&&pOk?ctrPill:''}</span><span class="ms">${pSub}</span></button>
    <button class="mv" data-m="guard"><span class="mi">🛡️</span><span class="mt">Guard${ctr==='guard'?ctrPill:''}</span><span class="ms">Beats Strike. Blocks ${gPct}%, counters</span></button>
    <button class="mv ult${uOk?' ready':''}" data-m="ult"${uOk?'':' disabled'}><span class="mi">${f.arch.e}</span><span class="mt">${esc(ULTS[f.arch.k])}</span><span class="ms">${uOk?"Ready. Can't be dodged":`Needs full energy (${me.en}/100)`}</span></button>`;
}
function setBusy(b){$('#moves').classList.toggle('busy',b);}
function syncAuto(){$('#autoTog').setAttribute('aria-pressed',String(autoBattle));$('#autoTog').textContent=autoBattle?'🤖 Auto on':'🤖 Auto';const sp=$('#speedTog');if(sp){sp.setAttribute('aria-pressed',String(fastMode));sp.textContent=fastMode?'⚡ Fast on':'⚡ Fast';}}
async function startFight(){
  ac();
  const O=curOppF;
  BT=newBattle(F,O,false,Object.assign({arena:curArena,mods:fightMods(O)},fightRules()));
  F.next=null;saveCareer();
  fightLog=[];skipFlag=false;ended=false;playing=true;cwReset();if(DB.autoDefault)autoBattle=true;
  {const st=document.getElementById('stage');if(st&&!RM){st.classList.remove('intro');void st.offsetWidth;st.classList.add('intro');}}
  $('#fightActions').innerHTML='';
  applySnap(BT.snap());
  renderMoves(null);$('#moves').hidden=false;$('#moverow').hidden=false;setBusy(true);syncAuto();
  try{await playEvents(BT.start());}catch(err){console.error(err);forceEnd();}
  playing=false;nextTurn();
}
async function playEvents(evs){
  for(let i=0;i<evs.length;i++){
    if(skipFlag){appendLogs(evs.slice(i));applySnap(evs[evs.length-1]);return;}
    appendLogs([evs[i]]);
    await playOne(evs[i]);
  }
}
function nextTurn(){
  if(ended||!BT)return;
  if(skipFlag&&!BT.over){finishInstant();return;}
  if(BT.over){finishFight();return;}
  applySnap(BT.snap());
  curPlan=BT.plan();
  renderMoves(curPlan);
  if(autoBattle){doRound(null);return;}
  setBusy(false);
  setTimeout(()=>ensureVisible($('#moves')),30);
}
async function doRound(choice,m){
  if(playing||ended||!BT||BT.over)return;
  playing=true;setBusy(true);
  try{
    const evs=choice?BT.step(choice,null,m||{}):BT.step(autoChoice(BT.P[0],BT.P[1],BT.hist[1]));
    await playEvents(evs);
  }catch(err){console.error(err);forceEnd();}
  playing=false;nextTurn();
}
// if anything breaks mid-fight, settle it on HP so the game can carry on
function forceEnd(){if(!BT)return;BT.over=true;if(BT.w==null)BT.w=BT.P[0].hp>=BT.P[1].hp?0:1;}
function finishInstant(){
  const rest=[];
  try{while(!BT.over)rest.push(...BT.step());}catch(err){console.error(err);forceEnd();}
  appendLogs(rest);
  if(rest.length)applySnap(rest[rest.length-1]);
  finishFight();
}
function finishFight(){
  if(ended)return;ended=true;$('#scout').innerHTML='';
  $('#moves').hidden=true;$('#moverow').hidden=true;$('#intent').innerHTML='';
  const w=BT.w;
  try{bodyEl(1-w).classList.toggle('down',BT.P[1-w].hp<=0);}catch(e){}
  try{endFight();}
  catch(err){
    console.error(err);
    try{saveCareer();}catch(e){}
    $('#result').innerHTML=`<div class="res ${w===0?'win':'lose'}"><div class="big">${w===0?'You won':'You lost'}</div><p>Something went wrong while tallying the results, but your fighter is saved.</p></div>`;
    $('#fightActions').innerHTML=`<button class="btn" data-a="home">Back to your fighter</button>`;
  }
}
$('#moves').addEventListener('click',e=>{
  const b=e.target.closest('.mv');if(!b||b.disabled||playing||ended)return;
  doRound(b.dataset.m);
});
$('#autoTog').addEventListener('click',()=>{
  autoBattle=!autoBattle;syncAuto();
  if(autoBattle&&BT&&!playing&&!ended&&!BT.over)doRound(null);
});
$('#skipBtn').addEventListener('click',()=>{
  if(!BT||ended)return;
  skipFlag=true;setBusy(true);
  if(!playing)finishInstant();
});
function finishTournament(won,keys,lines){
  const tier=T.tier;
  F.tourneys=(F.tourneys||0)+1;
  tickInjuries(F);
  recordTournament();
  if(won){
    DB.won++;
    if(T.defending){F.defenses=(F.defenses||0)+1;keys.push('defender');lines.push(`🛡️ Title defended (${F.defenses} so far)`);}
    F.belts[tier.k]=true;
    if(tier.k==='regional')keys.push('regional');
    if(tier.k==='world')keys.push('world');
    if((F._win!=null?F._win:winRate(F))<0.35)keys.push('underdog');
    if(F.race.n==='Pigeon')keys.push('pigeon');
    DB.champs.unshift({n:fullName(F),e:F.race.e,s:`${tier.n}. Level ${F.lvl} ${F.race.n.toLowerCase()} ${F.arch.n.toLowerCase()}`,d:new Date().toLocaleDateString(),look:lookOf(F),best:bestStat(F),score:({local:1,regional:2,world:3}[tier.k]||1)*10+F.lvl,fd:serFighter(F)});
    pruneDB();syncHistory();
    lines.push(`🏆 ${esc(tier.n)} champion: +${tier.coins} 🪙`);
  }else if(T.defending){F.belts[tier.k]=false;lines.push(`💔 Lost the ${esc(tier.n)} belt`);}
  DB.season.tourneys=(DB.season.tourneys||0)+1;
  if(DB.season.tourneys>=3){rollSeason();lines.push(`📜 Season ${DB.season.n} starts. The patch notes are waiting at your fighter's page`);}
}
function endFight(){
  if(T&&T.story){storyEndFight(BT.w===0,curOppF);return;}
  if(T&&T.daily){dailyEnd(BT.w===0,curOppF);return;}
  if(T&&T.rush){rushEnd(BT.w===0,curOppF);return;}
  const won=BT.w===0,O=curOppF,me=BT.P[0];
  if(won){track('wins');addMasteryWin(F);}
  lastFight={A:F,B:O,w:BT.w,ev:fightLog.slice()};
  const gaunt=!!T.gauntlet,tier=T.tier,rIdx=T.r;
  F.fights=(F.fights||0)+1;F.rec[won?'w':'l']++;
  const lines=[],got=[],keys=[];
  let xp=won?(gaunt?8:tier.xpW):4,coins=won?(gaunt?1:2):0,fame=won?(FAME_WIN[T.challenge?'challenge':gaunt?'gauntlet':tier.k]||0):0;
  let nemBeaten=false;
  if(O.isNem&&won){nemBeaten=true;DB.nemesis=null;coins+=6;xp+=10;lines.push('😈 Nemesis defeated: +6 🪙, +10 XP');}
  if(!won&&!T.challenge){setNemesis(O);lines.push(`😈 ${esc(O.name)} is now your nemesis`);}
  if(!won&&Math.random()<0.35){const j=addInjury(F);if(j)lines.push(`${j.e} Injury: ${esc(j.n)} (${esc(injText(j))})`);}
  if(won&&curOdds<0.35)keys.push('giant');
  if(won&&me.hp<10)keys.push('comeback');
  if(won&&me.st.taken<0.5)keys.push('flawless');
  if(won&&BT.round<=1)keys.push('onepunch');
  if(me.st.dodges>=3)keys.push('untouch');
  if(me.st.rps>=4)keys.push('reader');
  if(me.st.combos>=3)keys.push('combo');
  if(nemBeaten)keys.push('revenge');
  if(F.fights>=25)keys.push('iron');
  let tWon=false;
  if(T.challenge){
    recordMatch(won?F:O,won?O:F);
    if(won){coins+=6;if(O.isRival==='legend')awardGems(2,lines);keys.push(O.isRival==='legend'?'surpass':'oldscore');if(O.isRival==='rival')DB.rivals=(DB.rivals||[]).filter(r=>r.f.name!==O.name);lines.push(`⚔️ Challenge won: +10 🪙`);}
    else lines.push(`⚔️ ${esc(O.name)} wins this one. They might come back`);
    F.challenge=null;
  }else if(gaunt){
    recordMatch(won?F:O,won?O:F);
    if(won){G.streak++;trackMax('gauntletBest',G.streak);if(G.streak>=10)keys.push('gauntlet');}
    else{
      G.over=true;
      if(G.streak>F.gbest)F.gbest=G.streak;
      if(G.streak>DB.gbest)DB.gbest=G.streak;
      lines.push(`🔥 Gauntlet over: ${G.streak} in a row`);
      tickInjuries(F);F.tourneys=(F.tourneys||0)+1;
    }
  }else{
    if(won)resolveMyRound(T.me);else{resolveMyRound(curOpp);T.out=true;simRest();}
    if(T.done){tWon=T.champ===T.me;finishTournament(tWon,keys,lines);if(tWon){coins+=tier.coins;fame+=FAME_CUP[tier.k]||0;track('cups');if(tier.k==='world')track('worlds');awardGems(tier.k==='world'?3:tier.k==='regional'?1:0,lines);}}
  }
  // sponsor contract
  if(F.contract&&CONTRACTK[F.contract]){
    const c=CONTRACTK[F.contract],AR=curArena||{};
    const semis=!gaunt&&!T.challenge&&won&&!T.done&&T.rounds&&T.rounds[T.r]&&T.rounds[T.r].length<=2;
    const ok={combo2:me.st.combos>=2,reads3:me.st.rps>=3,clean:won&&me.st.taken<25,upset:won&&curOdds<0.45,quick:won&&BT.round<=3,ults:me.st.ults>=2,wall:won&&me.st.guards>=3,hazard:won&&!!(AR.hazard||AR.sunBurn),semis:semis||(tWon),streak:gaunt&&won&&G.streak>=3,bigger:won&&(O.lvl||1)>=(F.lvl||1)+2}[c.k];
    if(ok){coins+=c.coins;xp+=c.xp;lines.push(`📜 Contract done: ${c.e} ${esc(c.n)}, +${c.coins} 🪙, +${c.xp} XP`);F.contract=null;F.offers=null;}
  }
  gainXP(F,xp);
  if(F.lvl>=10)keys.push('lvl10');
  DB.coins+=coins;
  award(keys,got);
  if(nemBeaten)fame+=5;
  lines.push(...gainFame(fame));
  if(fame)lines.push(`⭐ +${fame} fame`);
  if(F.pendingLv)lines.push(`⬆️ Level ${F.lvl} reached`);
  lines.unshift(`+${xp} XP, +${coins} 🪙${got.length?`, +${got.length*3} 🪙 for new titles`:''}`);
  F._win=null;saveCareer();saveDB();
  let big,desc;
  if(T.challenge){big=won?'Challenge won':'Challenge lost';desc=won?`${esc(F.name)} beats ${esc(O.name)}.`:`${esc(O.name)} still has it. Train up and try again.`;}
  else if(gaunt){big=won?`${G.streak} in a row`:'Gauntlet over';desc=won?`${esc(F.name)} keeps going.`:`${esc(O.name)} ends the run. Who's next? 💀`;}
  else if(tWon){big='Champion';desc=`${esc(fullName(F))} won the ${esc(tier.n)}. 👹`;}
  else if(won){big=`${RNAME1[T.size>>rIdx]} won`;desc=`${esc(F.name)} advances.`;}
  else{big='Eliminated';desc=`${esc(O.name)} sends ${esc(F.name)} home.${T.done&&T.champ!=null?` ${esc(T.fs[T.champ].name)} went on to win it all.`:''} Who's next? 💀`;}
  $('#result').innerHTML=`<div class="res ${won?'win':'lose'}"><div class="big">${big}</div><p>${desc}</p><ul class="gains">${lines.map(l=>`<li>${l}</li>`).join('')}</ul>${got.length?`<div class="chips" style="margin-top:10px">${got.map(a=>`<span class="oc up">${a.e} New title: ${esc(a.n)}</span>`).join('')}</div>`:''}</div>`;
  Q=[];
  const lvQ=()=>{const n=F.pendingLv||0;for(let i=0;i<n;i++)Q.push(levelUpTask);};
  let acts='';
  if(gaunt){
    if(won){if(G.streak%3===0)Q.push(eventTask);lvQ();nextGauntletOpp();Q.push(showGauntlet);acts=`<button class="btn" data-a="next">Keep going</button>`;}
    else{lvQ();Q.push(showHub);acts=`<button class="btn" data-a="next">Back to your fighter</button>`;}
  }else if(won&&!T.done&&!T.challenge){
    Q.push(eventTask);lvQ();Q.push(showBracket);
    acts=`<button class="btn" data-a="next">Spin the event wheel</button>`;
  }else{
    lvQ();Q.push(showHub);
    acts=`<button class="btn" data-a="next">Back to your fighter</button><button class="btn ghost" data-a="bracket">See how the bracket ended</button>`;
  }
  if(won)landSound(tWon?3:2);else landSound(0);
  buzz(tWon?[40,60,40,60,120]:won?40:80);
  $('#fightActions').innerHTML=acts;
  saveTourney();
  setTimeout(()=>ensureVisible($('#result'),true),80);
  if(tWon||(gaunt&&won&&G.streak%5===0))setTimeout(()=>{const r=$('#result').getBoundingClientRect();burstAt(r.left+r.width/2,r.top+30);},350);
}
$('#fightActions').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.id==='startFightBtn')startFight();
  else if(t.id==='narrBtn')narrate(t);
  else if(t.dataset.a==='next')nextQ();
  else if(t.dataset.a==='bracket')showBracket();
  else if(t.dataset.a==='home'){Q=[];T=null;DB.tourney=null;saveDB();showHub();}
});
