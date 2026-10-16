// ================= GOALS: milestones, class mastery, collection =================
// everything here is permanent: no timers, no resets, just more to work toward
DB.stats=DB.stats||{};DB.goalsDone=DB.goalsDone||[];DB.mastery=DB.mastery||{};DB.colMiles=DB.colMiles||0;
const ST=k=>DB.stats[k]||0;
function track(k,n){DB.stats[k]=(DB.stats[k]||0)+(n==null?1:n);saveDB();checkGoals();}
function trackMax(k,v){if(v>(DB.stats[k]||0)){DB.stats[k]=v;saveDB();checkGoals();}}
const G2=(k,n,e,d,need,cur,rw)=>({k,n,e,d,need,cur,rw});
const GOALS=[
  G2('w10','First steps','👣','Win 10 fights',10,()=>ST('wins'),{gems:1,coins:10}),
  G2('w50','Regular','🥊','Win 50 fights',50,()=>ST('wins'),{gems:3,coins:25}),
  G2('w150','Veteran','🎖️','Win 150 fights',150,()=>ST('wins'),{gems:6,legacy:1}),
  G2('w400','Living legend','🏛️','Win 400 fights',400,()=>ST('wins'),{gems:12,legacy:2}),
  G2('w1000','The thousand','👑','Win 1000 fights',1000,()=>ST('wins'),{gems:25,legacy:4}),
  G2('e5','Elite hunter','⚔️','Beat 5 elites',5,()=>ST('elites'),{gems:2}),
  G2('e25','Elite slayer','🗡️','Beat 25 elites',25,()=>ST('elites'),{gems:6}),
  G2('e75','Nobody is elite','💀','Beat 75 elites',75,()=>ST('elites'),{gems:12,legacy:1}),
  G2('b3','Boss fight','👹','Beat 3 bosses',3,()=>ST('bosses'),{gems:3}),
  G2('b10','Boss collector','🏆','Beat 10 bosses',10,()=>ST('bosses'),{gems:6}),
  G2('b30','Boss hunter','🔥','Beat 30 bosses',30,()=>ST('bosses'),{gems:12,legacy:1}),
  G2('ch5','Halfway there','🗺️','Clear 5 chapters',5,()=>ST('chapters'),{gems:4,coins:30}),
  G2('ch10','Act I','📖','Clear 10 chapters',10,()=>ST('chapters'),{gems:8,legacy:1}),
  G2('ch20','Act II','📚','Clear 20 chapters',20,()=>ST('chapters'),{gems:15,legacy:2}),
  G2('ch40','Again and again','♻️','Clear 40 chapters, any fighter, any run',40,()=>ST('chapters'),{gems:25,legacy:3}),
  G2('cup1','Silverware','🥇','Win a cup',1,()=>ST('cups'),{gems:2}),
  G2('cup10','Trophy cabinet','🏆','Win 10 cups',10,()=>ST('cups'),{gems:8}),
  G2('world3','World beater','🌍','Win the World championship 3 times',3,()=>ST('worlds'),{gems:10,legacy:1}),
  G2('g5','Gauntlet runner','🔥','Reach a 5-win gauntlet streak',5,()=>ST('gauntletBest'),{gems:2}),
  G2('g12','Gauntlet master','⛓️','Reach a 12-win gauntlet streak',12,()=>ST('gauntletBest'),{gems:8}),
  G2('g25','Unbreakable','💎','Reach a 25-win gauntlet streak',25,()=>ST('gauntletBest'),{gems:20,legacy:2}),
  G2('dc7','Daily grind','📆','Win 7 daily challenges',7,()=>ST('dailies'),{gems:4}),
  G2('dc30','Every single day','🗓️','Win 30 daily challenges',30,()=>ST('dailies'),{gems:12,legacy:1}),
  G2('rush1','Rush hour','🏃','Clear a boss rush',1,()=>ST('rushes'),{gems:6}),
  G2('bet10','Bookie','🎰','Win 10 fight club bets',10,()=>ST('bets'),{gems:3,coins:30}),
  G2('loot25','Treasure hunter','💰','Spin 25 loot wheels',25,()=>ST('loot'),{gems:3}),
  G2('loot100','Hoarder','🧺','Spin 100 loot wheels',100,()=>ST('loot'),{gems:8}),
  G2('gear20','Collector','🛡️','Find 20 different gear pieces',20,()=>ST('gearFound'),{gems:3}),
  G2('gear50','Armory','🏰','Find 50 different gear pieces',50,()=>ST('gearFound'),{gems:8}),
  G2('gear100','Every piece','💠','Find 100 different gear pieces',100,()=>ST('gearFound'),{gems:20,legacy:2}),
  G2('set','Fashion statement','👗','Complete any gear set',1,()=>ST('setsDone'),{gems:5}),
  G2('lv10','Double digits','🔟','Reach level 10 with any fighter',10,()=>ST('topLevel'),{gems:2}),
  G2('lv25','Seasoned','⭐','Reach level 25 with any fighter',25,()=>ST('topLevel'),{gems:6}),
  G2('lv50','Maxed out','🌟','Reach level 50 with any fighter',50,()=>ST('topLevel'),{gems:20,legacy:2}),
  G2('m1','Specialist','🎓','Master any class to level 3',3,()=>Math.max(0,...Object.keys(DB.mastery).map(k=>masteryLvl(k))),{gems:5}),
  G2('m5','Grandmaster','🧠','Fully master any class',5,()=>Math.max(0,...Object.keys(DB.mastery).map(k=>masteryLvl(k))),{gems:15,legacy:2}),
  G2('mall','Jack of all trades','🃏','Win a fight with 15 different classes',15,()=>Object.keys(DB.mastery).filter(k=>DB.mastery[k]>0).length,{gems:10,legacy:1}),
  G2('build10','Wheel enjoyer','🎡','Start 5 fighter careers',5,()=>ST('built'),{gems:2}),
  G2('build50','Wheel addict','🌀','Start 20 fighter careers',20,()=>ST('built'),{gems:8})
];
function grant(rw,lines){
  const parts=[];
  if(rw.gems){DB.gems=(DB.gems||0)+rw.gems;parts.push(`💎 ${rw.gems}`);}
  if(rw.coins){DB.coins+=rw.coins;parts.push(`🪙 ${rw.coins}`);}
  if(rw.legacy){DB.legacy=DB.legacy||{pts:0,perks:{}};DB.legacy.pts=(DB.legacy.pts||0)+rw.legacy;parts.push(`✦ ${rw.legacy} legacy`);}
  if(rw.tp&&F){F.tp=(F.tp||0)+rw.tp;parts.push(`🌟 ${rw.tp} talent ${rw.tp===1?'point':'points'}`);}
  saveDB();if(F&&F.career)saveCareer();
  return parts.join(', ');
}
let goalQueue=[],goalShowing=false;
function checkGoals(){
  for(const g of GOALS){if(DB.goalsDone.includes(g.k))continue;if(g.cur()>=g.need){DB.goalsDone.push(g.k);const r=grant(g.rw);goalQueue.push(`${g.e} Goal: ${g.n}. ${r}`);}}
  checkCollection();
  saveDB();flushGoals();
}
function flushGoals(){if(goalShowing||!goalQueue.length)return;goalShowing=true;toast('🎯 '+goalQueue.shift());setTimeout(()=>{goalShowing=false;flushGoals();},2600);}
// ---------- class mastery ----------
const MASTERY=[5,15,30,60,100];
const MASTERY_RW=[{gems:2},{gems:3,note:'New fighters of this class start with a talent point'},{gems:5},{gems:6,note:'New fighters of this class start with +1 to everything'},{gems:12,legacy:2,note:'A gold mastery badge on every fighter of this class'}];
function masteryLvl(k){const w=DB.mastery[k]||0;let l=0;for(const t of MASTERY)if(w>=t)l++;return l;}
function addMasteryWin(f){
  if(!f||!f.arch)return;const k=f.arch.k,before=masteryLvl(k);
  DB.mastery[k]=(DB.mastery[k]||0)+1;const after=masteryLvl(k);
  if(after>before){const r=grant(MASTERY_RW[after-1]);goalQueue.push(`${f.arch.e} ${f.arch.n} mastery ${after}. ${r}`);flushGoals();}
  saveDB();
}
{const _als=applyLegacyStart;applyLegacyStart=function(f){_als(f);track('built');const l=masteryLvl(f.arch.k);if(l>=2)f.tp=(f.tp||0)+1;if(l>=4)applyBonus(f,{k:'all1',n:'+1 to everything',e:'🎓'});};}
// ---------- collection milestones ----------
const COL_STEP=75;
function checkCollection(){
  const {f}=codexCount(),reached=Math.floor(f/COL_STEP);
  while((DB.colMiles||0)<reached){DB.colMiles=(DB.colMiles||0)+1;const r=grant({gems:3,coins:15});goalQueue.push(`📚 Collection: ${DB.colMiles*COL_STEP} entries found. ${r}`);}
}
// ---------- the Goals tab ----------
function renderGoals(){
  const box=document.getElementById('tab-goals');if(!box||!F)return;
  const open=GOALS.filter(g=>!DB.goalsDone.includes(g.k)).sort((a,b)=>(b.cur()/b.need)-(a.cur()/a.need)).slice(0,6);
  const row=g=>{const c=Math.min(g.need,g.cur()),p=Math.round(c/g.need*100);const rw=[g.rw.gems?`💎${g.rw.gems}`:'',g.rw.coins?`🪙${g.rw.coins}`:'',g.rw.legacy?`✦${g.rw.legacy}`:''].filter(Boolean).join(' ');return `<div class="goal"><span class="g-e">${g.e}</span><div class="g-t"><b>${esc(g.n)}</b><small>${esc(g.d)}</small><div class="g-bar"><i style="width:${p}%"></i></div></div><span class="g-r"><small>${c}/${g.need}</small>${rw}</span></div>`;};
  const mk=F.arch.k,ml=masteryLvl(mk),mw=DB.mastery[mk]||0,next=MASTERY[ml];
  const {f,t}=codexCount(),nextCol=(Math.floor(f/COL_STEP)+1)*COL_STEP;
  box.innerHTML=`<span class="sec-label">Goals <small>${DB.goalsDone.length} of ${GOALS.length} done</small></span>${open.map(row).join('')||'<p class="hint">Every goal is done. Incredible.</p>'}
    <button class="btn ghost sm" data-allgoals="1">See all goals</button>
    <span class="sec-label">${F.arch.e} ${esc(F.arch.n)} mastery</span>
    <div class="goal"><span class="g-e">🎓</span><div class="g-t"><b>Level ${ml} of 5</b><small>${next?`${mw}/${next} wins with this class. Next: ${esc(MASTERY_RW[ml].note||rwText(MASTERY_RW[ml]))}`:'Fully mastered'}</small><div class="g-bar"><i style="width:${next?Math.round(mw/next*100):100}%"></i></div></div></div>
    <button class="btn ghost sm" data-allmastery="1">All classes</button>
    <span class="sec-label">Collection</span>
    <div class="goal"><span class="g-e">📚</span><div class="g-t"><b>${f} of ${t} found</b><small>Every ${COL_STEP} new entries: 💎3 🪙15. Next at ${nextCol}</small><div class="g-bar"><i style="width:${Math.round((f%COL_STEP)/COL_STEP*100)}%"></i></div></div></div>`;
}
const rwText=rw=>[rw.gems?`💎 ${rw.gems}`:'',rw.coins?`🪙 ${rw.coins}`:'',rw.legacy?`✦ ${rw.legacy} legacy`:''].filter(Boolean).join(', ');
document.addEventListener('click',e=>{
  if(e.target.closest('[data-allgoals]')){
    setSheet(`<div class="ch-h"><span class="ch-i">🎯</span><div><b>All goals</b><small>${DB.goalsDone.length} of ${GOALS.length} done</small></div></div>${GOALS.map(g=>{const done=DB.goalsDone.includes(g.k),c=Math.min(g.need,g.cur());return `<div class="goal${done?' done':''}"><span class="g-e">${done?'✅':g.e}</span><div class="g-t"><b>${esc(g.n)}</b><small>${esc(g.d)}. ${rwText(g.rw)}</small><div class="g-bar"><i style="width:${Math.round(c/g.need*100)}%"></i></div></div><span class="g-r"><small>${c}/${g.need}</small></span></div>`;}).join('')}<button class="btn ghost" data-close="1">Close</button>`);
  }
  if(e.target.closest('[data-allmastery]')){
    setSheet(`<div class="ch-h"><span class="ch-i">🎓</span><div><b>Class mastery</b><small>Win with a class to master it. Rewards at ${MASTERY.join(', ')} wins</small></div></div><div class="mast-grid">${ARCHS.map(a=>{const l=masteryLvl(a.k),w=DB.mastery[a.k]||0;return `<div class="mast${l>=5?' max':''}"><span>${a.e}</span><b>${esc(a.n)}</b><small>Level ${l}, ${w} wins</small><span class="mast-pips">${MASTERY.map((t,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</span></div>`;}).join('')}</div><button class="btn ghost" data-close="1">Close</button>`);
  }
});
Object.assign(RULES,{goals:['🎯','Goals',['Permanent milestones for everything you do: fights, elites, bosses, chapters, cups, the gauntlet, loot, gear, levels and more. Each one pays out once, for good.','Class mastery: every win with a class counts toward mastering it, across all your fighters. Higher mastery gives gems, legacy points, and perks for future fighters of that class.','Collection: every 75 new entries you discover in the collection pays out too.']]});
