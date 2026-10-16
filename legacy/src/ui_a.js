const $=s=>document.querySelector(s);
const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const STORE='wheel-has-spoken-v1';
function loadDB(){try{const v=JSON.parse(localStorage.getItem(STORE)||'null');return v&&typeof v==='object'?v:{}}catch(e){return {}}}
const DB=Object.assign({spins:0,entered:0,won:0,champs:[],sound:true,fast:false,coins:0,seen:{},last:[],champIds:{},lastTop:[],career:null,retired:[],nemesis:null,season:null,patch:null,patchNotes:null,ach:{},gbest:0,lastArena:null,tourney:null,legacy:null,rivals:[]},loadDB());
if(!DB.legacy||typeof DB.legacy!=='object')DB.legacy={pts:0,perks:{}};
if(!DB.legacy.perks)DB.legacy.perks={};
if(!Array.isArray(DB.rivals))DB.rivals=[];
if(!Array.isArray(DB.slots)){DB.slots=[null,null,null];if(DB.career){DB.slots[0]={career:DB.career,nemesis:DB.nemesis||null,tourney:DB.tourney||null,coins:DB.coins||0};DB.active=0;}else DB.active=null;}
while(DB.slots.length<3)DB.slots.push(null);
if(DB.active!=null&&DB.slots[DB.active]){const s=DB.slots[DB.active];DB.career=s.career;DB.nemesis=s.nemesis||null;DB.tourney=s.tourney||null;DB.coins=s.coins||0;}
else{DB.active=null;DB.career=null;DB.nemesis=null;DB.tourney=null;}
(function migrate(){
  if(!Array.isArray(DB.champs))DB.champs=[];
  if(!DB.seen||typeof DB.seen!=='object'||Array.isArray(DB.seen))DB.seen={};
  if(!Array.isArray(DB.last))DB.last=[];
  if(!DB.champIds||typeof DB.champIds!=='object')DB.champIds={};
  if(!Array.isArray(DB.lastTop))DB.lastTop=[];
  if(!Array.isArray(DB.retired))DB.retired=[];
  if(!DB.season||typeof DB.season!=='object')DB.season={n:1,tourneys:0,stats:{race:{},arch:{}}};
  if(!DB.season.stats)DB.season.stats={race:{},arch:{}};
  if(!DB.patch||typeof DB.patch!=='object')DB.patch={race:{},arch:{}};
  if(!DB.ach||typeof DB.ach!=='object')DB.ach={};
  if(DB.tokens){DB.coins=(+DB.coins||0)+Math.floor(+DB.tokens||0)*2;}
  delete DB.tokens;
  DB.coins=Math.max(0,Math.floor(+DB.coins||0));
  DB.gbest=Math.max(0,Math.floor(+DB.gbest||0));
})();
function saveDB(){syncSlot();try{localStorage.setItem(STORE,JSON.stringify(Object.assign({},DB,{career:null,nemesis:null,tourney:null})))}catch(e){}if(typeof updateCoins==='function')updateCoins();}
function syncHistory(){HISTORY.champs=DB.champs.filter(c=>c&&c.best);HISTORY.lastTop=DB.lastTop;}
function syncPatch(){PATCH.race=DB.patch.race||{};PATCH.arch=DB.patch.arch||{};}
syncHistory();syncPatch();
let soundOn=DB.sound!==false,fastMode=!!DB.fast;
const SPF=()=>fastMode?0.5:1;
const STATN={str:'Strength',spd:'Speed',dur:'Durability',iq:'IQ',wm:'Weapon mastery',pm:'Power mastery'};
const KS6=['str','spd','dur','iq','wm','pm'];

// ---------- saving fighters ----------
function serFighter(f){
  const picks={};
  for(const W of SEQ){const v=f[W.k];if(!v)continue;picks[W.k]=v===SKIPPED?'__skip':v.n;}
  const o={name:f.name,picks,bonus:f.bonus||{},boons:(f.boons||[]).slice(-20).map(b=>({n:b.n,e:b.e})),fame:f.fame||0,tp:f.tp||0,talents:f.talents||[],challenge:f.challenge||null,chalLvl:f.chalLvl||0,story:f.story||null,bag:f.bag||{},lootBoost:!!f.lootBoost,lvl:f.lvl||1,xp:f.xp||0,pendingLv:f.pendingLv||0,rec:f.rec||{w:0,l:0},earned:f.earned||[],inj:f.inj||[],next:f.next||null,belts:f.belts||{},defenses:f.defenses||0,tourneys:f.tourneys||0,fights:f.fights||0,gbest:f.gbest||0,trained:f.trained||0,isNem:f.isNem?1:0,cid:f.cid||null,gear:f.gear||null,armory:f.armory||[],contract:f.contract||null,offers:f.offers||null};
  if(f.reinc&&!f.reinc.skip)o.reinc={n:f.reinc.n,e:f.reinc.e,q:f.reinc.q,m:f.reinc.m,d:f.reinc.d};
  if(f.weak&&f.weak.k==='cured')o.cured=1;
  return o;
}
function deserFighter(o){
  if(!o||!o.picks)return null;
  const f={cid:o.cid||null,name:o.name,bonus:Object.assign({},o.bonus),boons:(o.boons||[]).map(b=>({n:b.n,e:b.e})),lvl:o.lvl||1,xp:o.xp||0,pendingLv:o.pendingLv||0,rec:Object.assign({w:0,l:0},o.rec),earned:(o.earned||[]).slice(),inj:(o.inj||[]).map(j=>Object.assign({},j)),next:o.next||null,belts:Object.assign({},o.belts),defenses:o.defenses||0,tourneys:o.tourneys||0,fights:o.fights||0,gbest:o.gbest||0,trained:o.trained||0};
  if(o.isNem)f.isNem=true;
  for(const W of SEQ){
    const n=o.picks[W.k];if(n==null)continue;
    if(n==='__skip'){
      // older saves stored turn-skipping weaknesses this way; restore a matching one instead of an empty slot
      if(W.k==='weak'){const sk=WEAKS.filter(x=>x.skip&&x.st);f.weak=sk[hashStr(o.name)%sk.length];continue;}
      if(W.k!=='pm'){f[W.k]=itemsOf(W,f)[0];continue;}
      f[W.k]=SKIPPED;continue;
    }
    if(W.k==='reinc'){f.reinc=o.reinc?Object.assign({w:1},o.reinc):{n,e:'🔁',q:1,w:1};continue;}
    if(W.cond&&!W.cond(f))continue;
    const list=itemsOf(W,f);const it=list.find(x=>x.n===n);
    if(it)f[W.k]=it;else if(W.k==='weak'&&o.cured)f.weak=CURED;else f[W.k]=list[0];
  }
  if(o.cured)f.weak=CURED;
  for(const k of ['race','arch','size','str','spd','dur','iq','weapon','wm','power','pm','ench','weak','chaos'])if(!f[k])return null;
  if(!f.title)f.title=TITLES[0];
  if(!f.back)f.back=BACKS[0];
  if(!f.stance)f.stance=STANCES.find(s=>s.k==='balanced');
  if(!f.quirk)f.quirk=QUIRKS[0];
  f.gear=o.gear?Object.assign({},o.gear):{};
  f.armory=(o.armory||[]).slice();
  f.contract=o.contract||null;f.offers=o.offers||null;
  f.fame=o.fame||0;f.tp=o.tp||0;f.talents=Array.isArray(o.talents)?o.talents.slice():Object.assign({},o.talents||{});f.challenge=o.challenge||null;f.chalLvl=o.chalLvl||0;f.story=o.story||null;f.bag=Object.assign({},o.bag||{});f.lootBoost=!!o.lootBoost;
  return f;
}
let F=null;
function saveCareer(){if(F&&F.career){syncArmory(F);if(typeof statWatch==='function')statWatch();DB.career=serFighter(F);saveDB();}}
const newCid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function loadCareer(){
  if(!DB.career)return null;
  const f=deserFighter(DB.career);
  if(!f){DB.career=null;saveDB();return null;}
  f.career=true;f.lfx=legacyFx();
  if(!f.cid){f.cid=newCid();DB.career=serFighter(f);saveDB();}
  return f;
}
// a nemesis only haunts the fighter they actually beat
function myNemesis(){
  const n=DB.nemesis;
  if(!n||!n.f||!F)return null;
  if(n.owner&&n.owner!==F.cid){DB.nemesis=null;saveDB();return null;}
  if(!n.owner){
    if((n.f.lvl||1)>(F.lvl||1)+3){DB.nemesis=null;saveDB();return null;}
    n.owner=F.cid;saveDB();
  }
  return n;
}
const xpNeed=l=>20+(l-1)*15;
function gainXP(f,n){n=Math.round(n*(1+0.1*lgLvl('xp')));f.xp=(f.xp||0)+n;let ups=0;while(f.lvl<50&&f.xp>=xpNeed(f.lvl)){f.xp-=xpNeed(f.lvl);f.lvl++;ups++;}f.pendingLv=(f.pendingLv||0)+ups;if(ups&&f.career){f.tp=(f.tp||0)+ups;maybeOfferChallenge();}return ups;}
function addInjury(f){const have=new Set((f.inj||[]).map(j=>j.k));const opts=INJURIES.filter(j=>!have.has(j.k));if(!opts.length)return null;const j=pick(opts);(f.inj||(f.inj=[])).push({k:j.k,left:j.dur});f._win=null;return j;}
function tickInjuries(f){f.inj=(f.inj||[]).map(j=>({k:j.k,left:j.left-1})).filter(j=>j.left>0);f._win=null;}
const injText=j=>Object.entries(j.m).map(([k,v])=>`${v>0?'+':'−'}${Math.abs(v)} ${STATLBL[k]}`).join(', ');
function setNemesis(O){
  {const old=DB.nemesis;if(old&&old.f&&old.f.name!==O.name)archiveRival(old.f,old.beats);}
  const cur=myNemesis();
  if(cur&&cur.f.name===O.name){cur.beats=(cur.beats||1)+1;levelUp(O,1);O.isNem=true;cur.f=serFighter(O);}
  else{O.isNem=true;DB.nemesis={f:serFighter(O),beats:1,owner:F.cid};}
  saveDB();
}

// ---------- seasons and balance patches ----------
function recordMatch(W,L){
  const S=DB.season.stats;
  const inc=(cat,k,res)=>{if(!S[cat])S[cat]={};const o=S[cat][k]||(S[cat][k]={w:0,l:0});o[res]++;};
  inc('race',W.race.n,'w');inc('race',L.race.n,'l');inc('arch',W.arch.k,'w');inc('arch',L.arch.k,'l');
}
function rollSeason(){
  const S=DB.season,notes=[];
  // the league also plays behind the scenes, so every race and archetype gets a fair sample
  for(let i=0;i<400;i++){const a=randomFighter('a'),b=randomFighter('b');const w=simulate(a,b,ARENAS[pickW(ARENAS)]);recordMatch(w===0?a:b,w===0?b:a);}
  for(const cat of ['race','arch']){
    const rows=Object.entries(S.stats[cat]||{}).map(([k,v])=>({k,n:v.w+v.l,wr:v.w/Math.max(1,v.w+v.l)})).filter(r=>r.n>=8).sort((a,b)=>b.wr-a.wr);
    if(rows.length<4)continue;
    const PT=DB.patch[cat]||(DB.patch[cat]={});
    const name=k=>cat==='race'?k:(ARCHK[k]?ARCHK[k].n:k);
    const emo=k=>cat==='race'?((RACES.find(r=>r.n===k)||{}).e||''):((ARCHK[k]||{}).e||'');
    for(const r of rows.slice(0,2)){const st=pick(['str','spd','dur']);const o=PT[r.k]||(PT[r.k]={});o[st]=Math.max(-3,(o[st]||0)-1);notes.push({up:false,txt:`${emo(r.k)} ${name(r.k)}: −1 ${STATLBL[st]}`,why:`Won ${Math.round(r.wr*100)}% of ${r.n} fights last season`});}
    for(const r of rows.slice(-2)){const st=pick(['str','spd','dur']);const o=PT[r.k]||(PT[r.k]={});o[st]=Math.min(3,(o[st]||0)+1);notes.push({up:true,txt:`${emo(r.k)} ${name(r.k)}: +1 ${STATLBL[st]}`,why:`Won only ${Math.round(r.wr*100)}% of ${r.n} fights last season`});}
  }
  const n=S.n+1;
  DB.season={n,tourneys:0,stats:{race:{},arch:{}}};
  DB.patchNotes={season:n,notes,unseen:true};
  saveDB();syncPatch();
  if(F)F._win=null;
}

// ---------- achievements ----------
function award(keys,out){
  for(const k of keys){
    if(!F||F.earned.includes(k))continue;
    const a=ACHK[k];if(!a)continue;
    F.earned.push(k);DB.ach[k]=true;markSeen('ach',a.n);DB.coins+=3;out.push(a);
  }
}

// ---------- collection ----------
const CX_CATS=new Set(['race','rsub','arch','asub','stance','size','back','weapon','power','ench','weak','chaos','quirk','title']);
function cxKey(k,it,f){if(k==='rsub')return (f.race?f.race.n:'?')+'/'+it.n;if(k==='asub')return (f.arch?f.arch.k:'?')+'/'+it.n;return it.n;}
const plainList=list=>()=>list.map(it=>({it,key:it.n}));
const CODEX=[
  ['race','Races',plainList(RACES)],
  ['rsub','Sub-races and bloodlines',()=>Object.entries(RSUB).flatMap(([r,s])=>s.items.map(it=>({it,key:r+'/'+it.n,par:r})))],
  ['arch','Archetypes',plainList(ARCHS)],
  ['asub','Specialties',()=>Object.entries(ASUB).flatMap(([k,s])=>s.items.map(it=>({it,key:k+'/'+it.n,par:ARCHK[k].n})))],
  ['stance','Fighting stances',plainList(STANCES)],
  ['size','Sizes',plainList(SIZES)],
  ['back','Backstories',plainList(BACKS)],
  ['weapon','Weapons',plainList(WEAPONS)],
  ['power','Powers',plainList(POWER_ALL)],
  ['ench','Enchantments',plainList(ENCHANTS)],
  ['weak','Weaknesses',plainList(WEAKS)],
  ['chaos','Chaos factors',plainList(CHAOS)],
  ['quirk','Quirks',plainList(QUIRKS)],
  ['title','Titles',plainList(TITLES)],
  ['syn','Synergies',plainList(SYN)],
  ['arena','Arenas',plainList(ARENAS)],
  ['gear','Gear',plainList(GEAR)],
  ['ach','Achievements',plainList(ACHIEVEMENTS)]
];
function markSeen(cat,key){const a=Array.isArray(DB.seen[cat])?DB.seen[cat]:(DB.seen[cat]=[]);if(a.includes(key))return false;a.push(key);saveDB();if(typeof checkCollection==='function')setTimeout(()=>{checkCollection();flushGoals();},0);return true;}
function codexCount(){let f=0,t=0;for(const [k,,get] of CODEX){const list=get();t+=list.length;const s=DB.seen[k]||[];f+=list.filter(x=>s.includes(x.key)).length;}return {f,t};}

// the active fighter's career, nemesis, tournament and coins live in their roster slot
function syncSlot(){if(DB&&Array.isArray(DB.slots)&&DB.active!=null&&DB.career)DB.slots[DB.active]={career:DB.career,nemesis:DB.nemesis,tourney:DB.tourney,coins:DB.coins||0};}
function switchSlot(i){
  syncSlot();
  const s=DB.slots[i];if(!s)return false;
  DB.active=i;DB.career=s.career;DB.nemesis=s.nemesis||null;DB.tourney=s.tourney||null;DB.coins=s.coins||0;
  F=loadCareer();T=null;saveDB();return !!F;
}
const freeSlot=()=>DB.slots.findIndex(s=>!s);
