// ---------- progression: fame ranks, talents, legacy, challenges ----------
const RANKS=[
  {n:'Rookie',e:'🥉',fame:0,perk:'Where everyone starts'},
  {n:'Contender',e:'🥈',fame:25,perk:'Unlocks the Regional cup'},
  {n:'Pro',e:'🥇',fame:70,perk:'10% off everything in the shop'},
  {n:'Elite',e:'💠',fame:150,perk:'Unlocks the World championship'},
  {n:'Champion',e:'🏆',fame:280,perk:'Legendary gear in the shop'},
  {n:'Legend',e:'👑',fame:450,perk:'2 extra talent points'},
  {n:'Mythic',e:'🌌',fame:700,perk:'A golden aura in every fight'},
  {n:'Ascended',e:'🪽',fame:1000,perk:'5 gems'},
  {n:'Eternal',e:'♾️',fame:1400,perk:'10 gems and 2 talent points'},
  {n:'Wheelborn',e:'🎡',fame:2000,perk:'25 gems. The Wheel knows your name'}
];
function rankOf(f){const fm=(f&&f.fame)||0;let r=0;RANKS.forEach((x,i)=>{if(fm>=x.fame)r=i;});return r;}
const FAME_WIN={local:3,regional:5,world:8,gauntlet:2,challenge:6};
const FAME_CUP={local:10,regional:20,world:40};
// adds fame and returns lines describing any rank-ups
function gainFame(n){
  if(!F||!F.career||!n)return [];
  n=Math.round(n*(1+0.1*talEcon(F,'fame')+0.1*lgLvl('famous')));
  const before=rankOf(F);F.fame=(F.fame||0)+n;const after=rankOf(F);
  const out=[];
  for(let r=before+1;r<=after;r++){
    const R=RANKS[r];const coins=6*r;DB.coins+=coins;F.tp=(F.tp||0)+1+(r===5||r===8?2:0);if(r>=7&&typeof awardGems==='function')awardGems({7:5,8:10,9:25}[r]||0);
    out.push(`${R.e} Rank up: ${R.n}! +${coins} 🪙 and ${r===5?3:1} talent point${r===5?'s':''}. ${R.perk}`);
    if(r===6){const got=[];award(['mythic'],got);}
  }
  return out;
}
const priceOf=c=>Math.max(1,Math.ceil(c*(F&&rankOf(F)>=2?0.9:1)*shopMult()));
// rank also unlocks the bigger tournaments
TIERK.regional.unlock=f=>f.lvl>=3||!!f.belts.local||rankOf(f)>=1;
TIERK.regional.lock='Reach level 3, win a Local brawl, or reach Contender rank';
TIERK.world.unlock=f=>f.lvl>=6||!!f.belts.regional||rankOf(f)>=3;
TIERK.world.lock='Reach level 6, win the Regional cup, or reach Elite rank';

// ---- talents ----
const BRANCHES=['Offense','Defense','Tactics'];
function canLearn(t){if(!F||(F.tp||0)<1||(F.talents||[]).includes(t.k))return false;return t.t===1||(F.talents||[]).includes(t.br[0].toLowerCase()+(t.t-1));}
function openTalents(){
  const own=new Set(F.talents||[]);
  const col=br=>`<div class="tcol"><h3>${br}</h3>${TALENTS.filter(t=>t.br===br).map(t=>{const has=own.has(t.k),ok=canLearn(t);return `<button class="talent${has?' has':''}" data-tal="${t.k}"${!has&&!ok?' disabled':''}><span class="te">${t.e}</span><b>${esc(t.n)}</b><small>${esc(t.d)}</small>${has?'<small class="ok">Learned</small>':''}</button>`;}).join('')}</div>`;
  $('#ovBody').innerHTML=`<h2 class="screen-title">Talents</h2><p class="hint">${pl(F.tp||0,'point')} to spend. You earn one every level and every rank-up. Each branch unlocks top to bottom.</p><div class="tgrid">${BRANCHES.map(col).join('')}</div>`;
  $('#ov').hidden=false;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-tal]');if(!b||b.disabled||!F)return;
  const t=TALENTK[b.dataset.tal];if(!t||!canLearn(t))return;
  F.talents=(F.talents||[]).concat(t.k);F.tp--;F._win=null;saveCareer();landSound(3);
  const r=b.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2);
  openTalents();if(!$('#s-hub').hidden)showHub();
});

// ---- legacy: retiring fighters earns points for every future fighter ----
const LEGACY=[
  {k:'coins',n:'Head start',e:'💰',max:3,cost:[2,3,4],d:'New fighters start with 15 coins per level'},
  {k:'xp',n:'Veteran trainer',e:'📚',max:3,cost:[2,3,5],d:'+10% XP per level'},
  {k:'reroll',n:'Lucky family',e:'🎲',max:2,cost:[2,4],d:'+1 free reroll per level while spinning a fighter'},
  {k:'gear',n:'Family heirloom',e:'🗝️',max:1,cost:[4],d:'New fighters start with a random trinket'},
  {k:'talent',n:'Born ready',e:'🌟',max:2,cost:[3,5],d:'New fighters start with 1 talent point per level'}
];
const lgLvl=k=>(DB.legacy.perks&&DB.legacy.perks[k])||0;
function legacyEarned(f){return Math.floor((f.lvl||1)/2)+Object.values(f.belts||{}).filter(Boolean).length*2+Math.floor((f.earned||[]).length/3)+rankOf(f);}
function renderLegacy(){
  const L=DB.legacy;
  const rows=LEGACY.map(p=>{const lv=lgLvl(p.k),maxed=lv>=p.max,cost=maxed?0:p.cost[lv];return `<div class="shopitem"><span class="se">${p.e}</span><div class="st2"><b>${esc(p.n)} ${lv?`(${lv}/${p.max})`:''}</b><small>${esc(p.d)}</small></div>${maxed?'<span class="price">Maxed</span>':`<button class="buy" data-legacy="${p.k}"${L.pts>=cost?'':' disabled'}>${cost} ✦</button>`}</div>`;}).join('');
  return `<div class="coll legacy"><div class="coll-top"><b>Legacy</b><span>${L.pts} ✦ to spend</span></div><p class="hint" style="margin:8px 0 0">Retiring a fighter earns legacy points based on their level, belts, titles and rank. Perks help every fighter after them.</p>${rows}</div>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-legacy]');if(!b||b.disabled)return;
  const p=LEGACY.find(x=>x.k===b.dataset.legacy);const lv=lgLvl(p.k);if(lv>=p.max)return;
  const cost=p.cost[lv];if(DB.legacy.pts<cost)return;
  DB.legacy.pts-=cost;DB.legacy.perks[p.k]=lv+1;saveDB();landSound(3);renderTitle();
});
function applyLegacyStart(f){
  DB.coins+=15*lgLvl('coins');
  f.tp=(f.tp||0)+lgLvl('talent');
  if(lgLvl('gear')){const g=pick(GEAR.filter(x=>x.slot==='trinket'&&!x.req));f.gear=Object.assign({},f.gear,{trinket:g.k});}
}

// ---- rivals and legends come back as challenges when you level up ----
function rivalScore(o,beats){return (o.lvl||1)*2+(beats||1)*3;}
function archiveRival(ser,beats){
  if(!ser||!ser.name)return;
  DB.rivals=(DB.rivals||[]).filter(r=>r.f.name!==ser.name);
  DB.rivals.push({f:ser,beats:beats||1,score:rivalScore(ser,beats),at:DB.entered||0});
  DB.rivals.sort((a,b)=>b.score-a.score);DB.rivals=DB.rivals.slice(0,6);
}
function legends(){return DB.champs.filter(c=>c.fd&&c.fd.cid!==(F&&F.cid));}
function maybeOfferChallenge(){
  if(!F||!F.career||F.challenge||F.lvl<3||F.lvl-(F.chalLvl||0)<2)return;
  const riv=(DB.rivals||[]).filter(r=>r.f.cid!==F.cid),leg=legends();
  if(!riv.length&&!leg.length)return;
  const useLegend=leg.length&&(!riv.length||Math.random()<0.5);
  F.chalLvl=F.lvl;
  if(useLegend){const l=pick(leg.slice(0,6));F.challenge={kind:'legend',name:l.fd.name};}
  else{const r=pick(riv);F.challenge={kind:'rival',name:r.f.name};}
}
function challengeFighter(){
  const c=F&&F.challenge;if(!c)return null;
  let o=null;
  if(c.kind==='rival'){const r=(DB.rivals||[]).find(x=>x.f.name===c.name);if(r)o=deserFighter(r.f);}
  else{const l=DB.champs.find(x=>x.fd&&x.fd.name===c.name);if(l)o=deserFighter(l.fd);}
  if(!o)return null;
  const target=F.lvl+(c.kind==='legend'?2:1);
  if((o.lvl||1)<target)levelUp(o,target-(o.lvl||1));
  o.isRival=c.kind;o.isNem=false;o.career=false;o._win=null;
  return o;
}
function startChallenge(){
  const o=challengeFighter();
  if(!o){F.challenge=null;saveCareer();showHub();return;}
  T={tier:{k:'challenge',n:F.challenge.kind==='legend'?'Legend challenge':'Rival rematch',e:'⚔️',xpW:16,coins:0},challenge:true};
  curOpp=-1;curOppF=o;
  goFight();
}

// ---- storage: keep the save small, only the best of everything ----
const champScore=c=>c.score!=null?c.score:0;
function pruneDB(){
  DB.champs=(DB.champs||[]).filter(Boolean);
  DB.champs.sort((a,b)=>champScore(b)-champScore(a));
  DB.champs=DB.champs.slice(0,10);
  DB.champs.forEach((c,i)=>{if(i>=6&&c.fd)delete c.fd;});
  DB.retired=(DB.retired||[]).filter(Boolean).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,10);
  DB.rivals=(DB.rivals||[]).filter(r=>r&&r.f&&(DB.entered||0)-(r.at||0)<=25).slice(0,6);
  const ids=Object.entries(DB.champIds||{}).sort((a,b)=>b[1]-a[1]).slice(0,60);DB.champIds=Object.fromEntries(ids);
  if(DB.patchNotes&&!DB.patchNotes.unseen&&(DB.season.tourneys||0)>=2)DB.patchNotes=null;
  if(DB.career&&DB.career.boons&&DB.career.boons.length>20)DB.career.boons=DB.career.boons.slice(-20);
}
