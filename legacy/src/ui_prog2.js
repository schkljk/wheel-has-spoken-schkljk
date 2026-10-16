// ================= RANKED FIGHTER POOL =================
// 1000 random fighters, rated against each other in the background, then sorted by strength.
// Opponents are drawn from the slice of that ranking where they belong.
const FPOOL={list:[],elo:[],ranked:null,ready:false,building:false,N:1000,games:5000};
function poolBuild(){
  if(FPOOL.building)return;FPOOL.building=true;
  const gen=()=>{const t0=performance.now();while(FPOOL.list.length<FPOOL.N&&performance.now()-t0<12){FPOOL.list.push(randomFighter('pool'));FPOOL.elo.push(1000);}
    if(FPOOL.list.length<FPOOL.N){setTimeout(gen,0);return;}setTimeout(rate,0);};
  let g=0;
  const rate=()=>{const t0=performance.now(),N=FPOOL.N;
    while(g<FPOOL.games&&performance.now()-t0<12){const a=Math.floor(Math.random()*N),b=(a+1+Math.floor(Math.random()*(N-1)))%N;
      const w=simulate(FPOOL.list[a],FPOOL.list[b])===0?1:0,ea=1/(1+Math.pow(10,(FPOOL.elo[b]-FPOOL.elo[a])/400)),K=g<FPOOL.games*0.4?40:g<FPOOL.games*0.75?24:12;
      FPOOL.elo[a]+=K*(w-ea);FPOOL.elo[b]-=K*(w-ea);g++;}
    if(g<FPOOL.games){setTimeout(rate,0);return;}
    const idx=FPOOL.list.map((_,i)=>i).sort((x,y)=>FPOOL.elo[x]-FPOOL.elo[y]);
    FPOOL.ranked=idx.map(i=>FPOOL.list[i]);FPOOL.ready=true;};
  setTimeout(gen,200);
}
// pick a fighter from a slice of the ranking (0 = weakest, 1 = strongest)
function poolPick(lo,hi,name){
  if(!FPOOL.ready){const o=randomFighter(name||randName());return o;}
  const n=FPOOL.ranked.length,i=clamp(Math.floor((lo+Math.random()*Math.max(0.001,hi-lo))*n),0,n-1);
  const o=deserFighter(serFighter(FPOOL.ranked[i]));o.name=name||randName();o.poolPct=i/n;o._win=null;return o;
}
const rankTxt=o=>o&&o.poolPct!=null?`Top ${Math.max(1,Math.round((1-o.poolPct)*100))}%`:'';
poolBuild();
const CH_PCT=[[0.03,0.30],[0.12,0.42],[0.22,0.52],[0.32,0.62],[0.42,0.72],[0.50,0.80],[0.58,0.86],[0.66,0.92],[0.74,0.97],[0.82,1]];
const TIER_PCT={local:[0,0.5],regional:[0.25,0.75],world:[0.5,1]};
function storyOpponent(kind){
  const S=F.story,C=CHAPTERS[S.ch-1],ng=S.ng||0;
  let [lo,hi]=CH_PCT[S.ch-1];
  if(kind==='elite'){lo=Math.min(0.96,lo+0.15);hi=Math.min(1,hi+0.12);}
  lo=Math.min(0.96,lo+ng*0.08);hi=Math.min(1,hi+ng*0.08);
  const o=poolPick(lo,hi);
  levelUp(o,Math.max(0,C.lvl+ng*4+(kind==='elite'?2:0)+Math.floor(Math.random()*2)-1));
  if(kind==='elite'||S.ch>=3)randomGear(o,kind==='elite'?2:1);
  o.aiSkill=0.06*(S.ch-1)+(kind==='elite'?0.1:0)+ng*0.05;
  return o;
}

// ================= TALENT TREE =================
let TAL_BR='off';
function canRank(n){
  if(!F)return false;const r=talRank(F,n.key);
  return r<n.max&&(F.tp||0)>=1&&(F.lvl||1)>=TIER_LVL(n.tier)&&branchPts(F,n.br)>=TIER_PTS(n.tier);
}
function openTalents(br){
  if(br)TAL_BR=br;
  const B=TREE.find(b=>b.k===TAL_BR),lv=F.lvl||1,pts=branchPts(F,B.k);
  const tabs=TREE.map(b=>`<button class="tt-tab${b.k===TAL_BR?' on':''}" data-tbr="${b.k}" style="--c:${b.col}"><span>${b.e}</span>${b.n}<small>${branchPts(F,b.k)}</small></button>`).join('');
  let rows='';
  for(let t=1;t<=6;t++){
    const nodes=B.t.slice((t-1)*2,t*2).map(x=>TNODE[B.k+'_'+x[0]]);
    const lockLv=lv<TIER_LVL(t),lockPts=pts<TIER_PTS(t),locked=lockLv||lockPts;
    rows+=`<div class="tt-tier${locked?' locked':''}"><div class="tt-req">${t===6?'Capstone':'Tier '+t}${locked?`<small>${lockLv?`Level ${TIER_LVL(t)}`:''}${lockLv&&lockPts?', ':''}${lockPts?`${TIER_PTS(t)} pts in ${B.n}`:''}</small>`:''}</div>
      ${nodes.map(n=>{const r=talRank(F,n.key),ok=canRank(n);return `<button class="tt-node${r?' has':''}${r>=n.max?' max':''}" data-tn="${n.key}"${ok?'':' disabled'} style="--c:${B.col}"><span class="tt-e">${n.e}</span><b>${esc(n.n)}</b><small>${esc(n.d)}</small><span class="tt-pips">${Array.from({length:n.max},(_,i)=>`<i class="${i<r?'on':''}"></i>`).join('')}</span></button>`;}).join('')}</div>`;
  }
  $('#ovBody').innerHTML=`<div class="tt-head"><h2 class="screen-title">Talents</h2><span class="tt-pts">${pl(F.tp||0,'point')} to spend</span></div>
    <p class="hint" style="margin:0 0 8px">One point every level and rank-up. Deeper tiers need more points in that branch and a higher level. Many talents have several ranks.</p>
    <div class="tt-tabs">${tabs}</div><div class="tt-body">${rows}</div>`;
  $('#ov').hidden=false;
}
document.addEventListener('click',e=>{
  const tb=e.target.closest('[data-tbr]');if(tb){tick();openTalents(tb.dataset.tbr);return;}
  const b=e.target.closest('[data-tn]');if(!b||b.disabled||!F)return;
  const n=TNODE[b.dataset.tn];if(!n||!canRank(n))return;
  const m=talMap(F);m[n.key]=(m[n.key]||0)+1;F.tp--;F._win=null;saveCareer();landSound(m[n.key]>=n.max?3:2);
  const r=b.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2);
  openTalents();if(!$('#s-hub').hidden)showHub();
});
Object.assign(RULES,{talents:['🌟','Talents',['Five branches: Offense, Defense, Tactics, Spirit and Fortune. Each has 12 talents in six tiers, many with several ranks: 118 ranks in all.','You earn a talent point every level and every rank-up. A deeper tier needs a higher level and more points spent in that branch, so you can never take everything. Pick a direction.','Fortune talents also make shops cheaper, loot better, fame bigger and story wins pay more coins.']]});

// ================= LEGACY =================
LEGACY.push(
  {k:'recipe',n:'Family recipe',e:'🍲',max:2,cost:[2,4],d:'New fighters start with 2 bandages per level'},
  {k:'crest',n:'Family crest',e:'🛡️',max:1,cost:[6],d:'New fighters start with a random rare piece of gear'},
  {k:'mentor',n:'Old mentor',e:'🧓',max:3,cost:[2,3,4],d:'New fighters get +1 to a random stat per level'},
  {k:'scouts',n:'Scouting network',e:'🔭',max:2,cost:[3,5],d:'All your fighters read opponents 5% better per level'},
  {k:'iron',n:'Iron constitution',e:'🦾',max:2,cost:[4,6],d:'All your fighters get +1 durability per level'},
  {k:'trust',n:'Trust fund',e:'🏦',max:3,cost:[2,3,4],d:'+10 coins per level whenever a story chapter is cleared'},
  {k:'bloodline',n:'Lucky bloodline',e:'🍀',max:2,cost:[4,6],d:'Epic and better loot 15% more likely per level'},
  {k:'famous',n:'Famous name',e:'⭐',max:2,cost:[3,5],d:'+10% fame per level'},
  {k:'merchant',n:'Merchant friends',e:'🤝',max:2,cost:[3,4],d:'Shops and merchants 5% cheaper per level'}
);
function legacyFx(){return {m:{dur:lgLvl('iron')},fx:{readB:0.05*lgLvl('scouts')}};}
function applyLegacyStart(f){
  DB.coins+=15*lgLvl('coins');
  f.tp=(f.tp||0)+lgLvl('talent');
  f.gear=f.gear||{};f.bag=f.bag||{};
  if(lgLvl('gear')){const g=pick(GEAR.filter(x=>x.slot==='trinket'&&['common','rare'].includes(x.r)));f.gear.trinket=g.k;}
  if(lgLvl('crest')){const g=pick(GEAR.filter(x=>x.r==='rare'&&!f.gear[x.slot]));if(g)f.gear[g.slot]=g.k;}
  if(lgLvl('recipe'))f.bag.bandage=(f.bag.bandage||0)+2*lgLvl('recipe');
  for(let i=0;i<lgLvl('mentor');i++){const k=pick(['str','spd','dur','iq','wm','pm']);applyBonus(f,{k,n:'+1 '+STATN[k],e:'🧓'});}
  f.lfx=legacyFx();
}
const shopMult=()=>Math.max(0.5,1-0.04*talEcon(F,'shop')-0.05*lgLvl('merchant'));

// ================= ITEMS: a few belong to the road =================
ITEMS.push(
  {k:'ration',n:'Field rations',e:'🥫',cost:4,d:'Heal 25% HP right away',story:1},
  {k:'grit',n:'Grit tonic',e:'❤️‍🩹',cost:16,d:'+1 grit, up to your maximum',story:1},
  {k:'whetstone',n:'Whetstone',e:'🪨',cost:7,d:'Your next fight: +15% damage',story:1}
);
for(const i of ITEMS)ITEMK[i.k]=i;
function useItem(k){
  if(!(F.bag[k]>0))return;
  storyEnsure();const med=10*talEcon(F,'heal'),maxGrit=3+lgLvl('grit');
  if(k==='grit'&&F.story.grit>=maxGrit){toast('Your grit is already full');return;}
  F.bag[k]--;
  if(k==='bandage'){healS(35+med);toast(`+${pctHp(35+med)}`);}
  else if(k==='ration'){healS(25+med);toast(`+${pctHp(25+med)}`);}
  else if(k==='medkit'){F.story.hp=100;F.inj=[];F._win=null;toast('Fully healed');}
  else if(k==='grit'){F.story.grit=Math.min(maxGrit,F.story.grit+1);toast('+1 grit');}
  else if(k==='whetstone'){F.next=Object.assign({},F.next,{dmgX:1.15});toast('+15% damage next fight');}
  else if(k==='drink'){F.next=Object.assign({},F.next,{en:100});toast('Full energy next fight');}
  else if(k==='scout'){F.next=Object.assign({},F.next,{readB:.2});toast('Better reads next fight');}
  else if(k==='salts'){F.next=Object.assign({},F.next,{revive:30});toast('You will get back up once next fight');}
  else if(k==='charm'){F.lootBoost=true;toast('Next loot spin is luckier');}
  saveCareer();openBag();if(!$('#s-map').hidden)showMap();
}

// ================= THE SUPPLY TENT (general shop) =================
let SHOP_TAB='supplies';
function gearStock(){
  if(!DB.gstock||DB.gstock.date!==todayKey()){
    const own=new Set(Object.values((F&&F.gear)||{}));
    const pickR=r=>{const p=GEAR.filter(g=>g.r===r&&!g.req&&!own.has(g.k));return p.length?pick(p).k:null;};
    DB.gstock={date:todayKey(),keys:[pickR('common'),pickR('rare'),pickR('rare'),pickR('epic')].filter(Boolean),sold:[]};saveDB();
  }
  return DB.gstock;
}
const tentGearPrice=g=>priceOf(Math.round(g.cost*1.4));
function renderShop(){
  $('#shopCoins').textContent=`You have ${DB.coins} 🪙`;
  const tabs=[['supplies','🎒 Supplies'],['gear','🛡️ Gear of the day'],['services','🧰 Services']].map(([k,n])=>`<button class="fchip${SHOP_TAB===k?' on':''}" data-stab="${k}">${n}</button>`).join('');
  let body='';
  if(SHOP_TAB==='supplies')body=ITEMS.filter(i=>!i.story).map(i=>{const p=priceOf(i.cost+2);return `<div class="shopitem"><span class="se">${i.e}</span><div class="st2"><b>${esc(i.n)}${F.bag&&F.bag[i.k]?` (have ${F.bag[i.k]})`:''}</b><small>${esc(i.d)}</small></div><button class="buy" data-tent="${i.k}"${DB.coins>=p?'':' disabled'}>${p} 🪙</button></div>`;}).join('');
  if(SHOP_TAB==='gear'){const st=gearStock();body=`<p class="hint" style="margin:4px 0 6px">New stock every day. Legendary and mythic gear only come from loot.</p>`+st.keys.map(k=>{const g=GEARK[k],sold=st.sold.includes(k),p=tentGearPrice(g),cur=F.gear&&F.gear[g.slot];return `<div class="shopitem r-${g.r}"><span class="se">${g.e}</span><div class="st2"><b>${esc(g.n)}</b><small><span class="rar r-${g.r}">${RARITY[g.r].n} ${g.slot}</span> ${esc(g.d)}${cur?`. Replaces your ${esc(GEARK[cur].n.toLowerCase())}`:''}</small></div>${sold?'<span class="price">Sold</span>':`<button class="buy" data-gbuy="${k}"${DB.coins>=p?'':' disabled'}>${p} 🪙</button>`}</div>`;}).join('');}
  if(SHOP_TAB==='services'){
    const nT=Object.values(talMap(F)).reduce((a,b)=>a+b,0);
    const svc=[['physio','🩺','Physio','Cure all your injuries',6,(F.inj||[]).length>0],['respec','🔁','Talent respec',`Refund all ${nT} talent points`,15,nT>0],['box','🎁','Mystery box','A random piece of gear, any rarity. Usually common',12,true]];
    body=svc.map(([k,e,n,d,c,ok])=>{const p=priceOf(c);return `<div class="shopitem"><span class="se">${e}</span><div class="st2"><b>${n}</b><small>${esc(d)}</small></div><button class="buy" data-svc="${k}"${ok&&DB.coins>=p?'':' disabled'}>${p} 🪙</button></div>`;}).join('');
  }
  $('#shopList').innerHTML=`<div class="shop-tabs">${tabs}</div>${body}`;
  $('#gearList').innerHTML='';
}
function renderGearShop(){$('#gearList').innerHTML='';}
$('#shopList').addEventListener('click',e=>{
  const t=e.target.closest('[data-stab]');if(t){SHOP_TAB=t.dataset.stab;tick();renderShop();return;}
  const gb=e.target.closest('[data-gbuy]');
  if(gb&&!gb.disabled){const g=GEARK[gb.dataset.gbuy],p=tentGearPrice(g);if(DB.coins<p)return;DB.coins-=p;F.gear=F.gear||{};F.gear[g.slot]=g.k;F._win=null;markSeen('gear',g.n);DB.gstock.sold.push(g.k);saveCareer();saveDB();landSound(3);toast(`${g.e} ${g.n} equipped`);renderShop();return;}
  const sv=e.target.closest('[data-svc]');if(!sv||sv.disabled)return;
  const k=sv.dataset.svc,p=priceOf({physio:6,respec:15,box:12}[k]);if(DB.coins<p)return;DB.coins-=p;
  if(k==='physio'){F.inj=[];F._win=null;toast('All patched up');}
  if(k==='respec'){const n=Object.values(talMap(F)).reduce((a,b)=>a+b,0);F.talents={};F.tp=(F.tp||0)+n;F._win=null;toast(`${pl(n,'point')} refunded`);}
  if(k==='box'){const W={junk:2,common:4,rare:2.2,epic:.8,legendary:.15,mythic:.02},rs=Object.keys(W),r=rs[pickW(rs.map(x=>({w:W[x]})))],pool=GEAR.filter(g=>g.r===r);const g=pick(pool);markSeen('gear',g.n);toast(`${RARITY[g.r].n}: ${g.e} ${g.n}`);
    F.gear=F.gear||{};if(!F.gear[g.slot]){F.gear[g.slot]=g.k;F._win=null;}else if(F.gear[g.slot]!==g.k){saveCareer();saveDB();gearChoice(g,()=>{renderShop();});}}
  saveCareer();saveDB();landSound(2);renderShop();
});

// ================= STORY MERCHANTS: different people, different stock =================
const MERCHANTS=[['🗑️','Alley peddler','Sells whatever fell off a truck'],['🏮','Noodle stall owner','Snacks and suspicious tonics'],['🌆','Rooftop fence','No questions asked'],['⚓','Dockside trader','Smells like fish, prices are fair'],['🏟️','Stadium vendor','Overpriced, but it is a stadium'],['🕯️','Graveyard keeper','Sells things the dead left behind'],['🌍','World bazaar','Rare goods from everywhere'],['🌃','Neon street vendor','Cash only, no refunds'],['🍯','Hive trader','Honey and sharper things'],['🎡',"The Wheel's broker",'Deals in fate']];
const STORY_STOCK=['ration','grit','whetstone','bandage','salts','drink','scout','medkit','charm'];
function merchant(){
  const S=F.story;
  if(S.stockRow!==S.row){
    S.stock=shuffleArr(STORY_STOCK).slice(0,4);S.stockRow=S.row;S.haggle=0;
    const own=Object.values(F.gear||{}),rs=S.ch>=7?['rare','epic','legendary']:['rare','epic'];
    S.gearOffers=shuffleArr(GEAR.filter(x=>!x.req&&rs.includes(x.r)&&!own.includes(x.k))).slice(0,S.ch>=5?2:1).map(g=>g.k);
    saveCareer();
  }
  renderMerchant();
}
const itemPrice=i=>Math.max(1,Math.round(priceOf(i.cost+2*(F.story.ch-1))*hagMult()));
const gearPrice=g=>Math.max(1,Math.round(priceOf(Math.round(g.cost*1.2+4*(F.story.ch-1)))*hagMult()));
function renderMerchant(){
  const S=F.story,M=MERCHANTS[S.ch-1];
  const rows=S.stock.map(k=>{const i=ITEMK[k],p=itemPrice(i);return `<div class="shopitem"><span class="se">${i.e}</span><div class="st2"><b>${esc(i.n)}</b><small>${esc(i.d)}</small></div><button class="buy" data-mbuy="${k}"${DB.coins>=p?'':' disabled'}>${p} 🪙</button></div>`;}).join('');
  const gear=(S.gearOffers||[]).map(k=>{const g=GEARK[k],p=gearPrice(g);return `<div class="shopitem r-${g.r}"><span class="se">${g.e}</span><div class="st2"><b>${esc(g.n)}</b><small><span class="rar r-${g.r}">${RARITY[g.r].n} ${g.slot}</span> ${esc(g.d)}${F.gear[g.slot]?`. Replaces your ${esc(GEARK[F.gear[g.slot]].n.toLowerCase())}`:''}</small></div><button class="buy" data-mgear="${k}"${DB.coins>=p?'':' disabled'}>${p} 🪙</button></div>`;}).join('');
  const hag=S.haggle===0?`<button class="btn ghost sm" data-haggle="1">🤝 Haggle: maybe 25% off, maybe they get annoyed</button>`:`<p class="hint" style="text-align:center">${S.haggle===-1?'🤝 Deal! Everything is 25% off':'😤 They did not like that. Prices are up 20%'}</p>`;
  setSheet(`<div class="ch-h"><span class="ch-i">${M[0]}</span><div><b>${M[1]}</b><small>${esc(M[2])}. You have ${DB.coins} 🪙</small></div></div>${rows}${gear}${hag}<button class="btn ghost" data-close="map">Leave</button>`);
}
document.getElementById('choice').addEventListener('click',e=>{
  const h=e.target.closest('[data-haggle]');if(!h||!F||!F.story)return;
  F.story.haggle=Math.random()<0.55?-1:1;saveCareer();landSound(F.story.haggle===-1?3:0);renderMerchant();
});
// buying gear at a merchant removes it from the offers
document.getElementById('choice').addEventListener('click',e=>{
  const g=e.target.closest('[data-mgear]');if(!g||!F||!F.story||!F.story.gearOffers)return;
  setTimeout(()=>{F.story.gearOffers=F.story.gearOffers.filter(k=>F.gear[GEARK[k].slot]!==k);saveCareer();if(!$('#choice').hidden)renderMerchant();},0);
},true);

// ================= REROLL: next to "Spin the rest for me", greyed out once used =================
function updateReroll(){
  const b=$('#rerollBtn');
  if(mode!=='build'||autoRun){b.hidden=true;return;}
  b.hidden=false;
  const has=F&&F.free>0;
  b.disabled=!(has&&lastSpun>=0&&!spinning);
  b.textContent=has?(lastSpun>=0?`🎲 Reroll ${SEQ[lastSpun].lc}`:'🎲 Reroll (1 free)'):'🎲 Reroll used';
}

// which round limit a fight uses
function fightRules(){
  if(!T)return {};
  if(T.rush||(T.story&&T.node==='boss'))return {maxRounds:30,suddenDeath:true};
  if(T.story&&T.node==='elite')return {maxRounds:20};
  if(T.challenge&&curOppF&&curOppF.isRival==='legend')return {maxRounds:20};
  if(T.rounds&&!T.gauntlet&&T.rounds[T.r]&&T.rounds[T.r].length===1)return {maxRounds:T.tier&&T.tier.k==='world'?30:20};
  return {};
}
