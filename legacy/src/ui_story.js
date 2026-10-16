// ================= STORY MODE =================
const CHAPTERS=[
  {n:'Back Alley Brawls',e:'🗑️',col:'#C08457',lvl:1,len:10,intro:'Nobody knows your name yet. The alley behind the laundromat is where everyone starts. Win enough and the Bouncer might let you through the back door.'},
  {n:'The Night Market',e:'🏮',col:'#E8862E',lvl:2,len:10,intro:'Lanterns, street food and fights behind the noodle stalls. Everyone here answers to Mama Gnocchi.'},
  {n:'The City Circuit',e:'🌆',col:'#8C99AB',lvl:4,len:11,intro:'Word got around. The city circuit runs on rooftops, parking garages and grudges, and its queen has never lost.'},
  {n:'Harbor Docks',e:'⚓',col:'#3D8BFF',lvl:5,len:11,intro:'Salt, rust and rumors of a shark who runs every boat in the harbor.'},
  {n:'National League',e:'🏟️',col:'#2DD4BF',lvl:7,len:12,intro:'Stadiums, sponsors, cameras. The league is run by someone who reads every move before it happens.'},
  {n:'The Haunted Highlands',e:'🏚️',col:'#8E7AB5',lvl:9,len:12,intro:'Fog, graves and a castle whose owner refuses to stay dead.'},
  {n:'World Stage',e:'🌍',col:'#F2B544',lvl:10,len:13,intro:'Fighters from every corner of the map. At the top stands something that might not be a fighter at all.'},
  {n:'Neon Megacity',e:'🌃',col:'#FF4FD8',lvl:12,len:13,intro:'A city that never sleeps, guarded by a samurai made of chrome and lightning.'},
  {n:'The Hive',e:'🐝',col:'#F2C14E',lvl:13,len:14,intro:'Something enormous hums beneath the world. The swarm is waiting for you.'},
  {n:"The Wheel's Domain",e:'🎡',col:'#E5484D',lvl:15,len:14,intro:'Past the last bracket there is only the Wheel, and the one who spins it.'}
];
let LASTCH=CHAPTERS.length;
const BOSSES=[
  {name:'Big Tony',title:'The Bouncer of Back Alley',e:'🚪',picks:{race:'Orc',arch:'tank',size:'Huge',weapon:'Baseball bat',power:'none',stance:'Counter-puncher',ench:'heavy',weak:'Bad ankles',chaos:'nothing',quirk:'Thick skull'},stats:{str:6,spd:3,dur:7,iq:3,wm:5,pm:1},maxHp:150,fx:{counterB:.15},aiSkill:.15,phase:{txt:'Big Tony cracks his knuckles. He is done being polite.',m:{str:2},fx:{strikeX:1.2}},lines:["You're not on the list.","Back door's closed, kid. Turn around."]},
  {name:'Mama Gnocchi',title:'Queen of the Night Market',e:'🍝',picks:{race:'Human',arch:'chef',size:'Large',weapon:'Frying pan',power:'fire',ench:'flame',stance:'Aggressive',weak:'Weak stomach',chaos:'crowd',quirk:'Snack break'},stats:{str:7,spd:4,dur:7,iq:5,wm:6,pm:5},maxHp:160,fx:{snack:30},aiSkill:.2,phase:{txt:'Mama Gnocchi turns the heat all the way up.',m:{str:2},fx:{strikeX:1.2}},lines:['You look hungry. Let me fix that.','Nobody leaves my kitchen without dessert.']},
  {name:'Lady Venom',title:'Queen of the City Circuit',e:'🐍',picks:{race:'Vampire',arch:'assassin',size:'Average',weapon:'Dagger',power:'poison',ench:'venom',stance:'Tactical',weak:'Sunlight',chaos:'rizz',quirk:'Lucky socks'},stats:{str:7,spd:10,dur:6,iq:9,wm:8,pm:8},maxHp:170,fx:{dodgeB:.08},aiSkill:.3,phase:{txt:'Lady Venom sheds her coat. The real fight starts now.',m:{spd:2},fx:{critB:.12}},lines:['Darling. You came all this way just to lose?']},
  {name:'Admiral Saltbeard',title:'Terror of the Harbor',e:'🦈',picks:{race:'Sharkfolk',arch:'pirate',size:'Huge',weapon:'Harpoon spear',power:'water',ench:'heavy',stance:'Aggressive',weak:'Loud noises',chaos:'nothing',quirk:'Sore loser'},stats:{str:10,spd:7,dur:9,iq:6,wm:9,pm:7},maxHp:180,fx:{drain:.06},aiSkill:.35,phase:{txt:'The Admiral raises the black flag.',m:{str:2},fx:{critB:.1}},lines:['Yarr. Your ship has sailed.','Every boat in this harbor pays me. So will you.']},
  {name:'The Professor',title:'Commissioner of the League',e:'🎓',picks:{race:'Eldritch horror',arch:'mage',size:'Large',weapon:'Magic staff',power:'mind',ench:'echo',stance:'Tactical',weak:'Loud noises',chaos:'main',quirk:'Read the manual'},stats:{str:6,spd:9,dur:10,iq:13,wm:6,pm:11},maxHp:190,fx:{readB:.25},aiSkill:.6,phase:{txt:'The Professor closes his book. He has seen enough.',m:{pm:2},fx:{dr:.1}},lines:['I already know your next three moves.']},
  {name:'Count Crypt',title:'Lord of the Haunted Highlands',e:'🦇',picks:{race:'Skeleton',arch:'necro',size:'Large',weapon:'Scythe',power:'drain',ench:'cursed',stance:'Tactical',weak:'Sunlight',chaos:'main',quirk:'Secret twin'},stats:{str:9,spd:9,dur:10,iq:12,wm:9,pm:12},maxHp:205,fx:{drain:.08},aiSkill:.5,phase:{txt:'Count Crypt rises from his coffin. He looks annoyed.',m:{pm:2},fx:{dr:.1}},lines:['The dead do not tire. Do you?']},
  {name:'Titan Prime',title:'The Mountain That Walks',e:'🏔️',picks:{race:'Titan',arch:'berserker',size:'Colossal',weapon:'Planet-cracker axe',power:'earth',ench:'heavy',stance:'Aggressive',weak:'Strong winds',chaos:'plot',quirk:'Built different'},stats:{str:13,spd:6,dur:13,iq:7,wm:10,pm:9},maxHp:240,fx:{pet:{e:'🪨',n:'falling rocks',x:1.4}},aiSkill:.4,phase:{txt:'The ground splits open. Titan Prime stops holding back.',m:{str:2,dur:1},fx:{strikeX:1.25}},lines:['...','The mountain does not talk. It moves.']},
  {name:'Neon Ronin',title:'Blade of the Megacity',e:'⚡',picks:{race:'Cyborg',arch:'samurai',size:'Average',weapon:'Katana',power:'lightning',ench:'thunder',stance:'Counter-puncher',weak:'Water',chaos:'nothing',quirk:'Early bird'},stats:{str:12,spd:13,dur:10,iq:11,wm:13,pm:10},maxHp:240,fx:{critB:.1},aiSkill:.6,phase:{txt:'The Neon Ronin overclocks. Sparks everywhere.',m:{spd:2},fx:{strikeX:1.25}},lines:['One cut. That is all it takes.']},
  {name:'Queen Hivemind',title:'Mother of the Swarm',e:'🐝',picks:{race:'Beefolk',arch:'tamer',size:'Huge',weapon:'Spear',power:'summon',ench:'venom',stance:'Tactical',weak:'The cold',chaos:'main',quirk:'Hype man'},stats:{str:12,spd:12,dur:12,iq:13,wm:11,pm:13},maxHp:265,fx:{pet:{e:'🐝',n:'royal swarm',x:1.4},venom:4},aiSkill:.65,phase:{txt:'The hive answers its queen.',m:{pm:2},fx:{dmgX:1.15}},lines:['We are many. You are one.']},
  {name:'The Wheelmaster',title:'The One Who Spins',e:'🎡',picks:{race:'Cosmic warrior',arch:'chosen',size:'Large',weapon:'Uno reverse card',power:'reality',ench:'godslayer',stance:'Showboat',weak:'No weakness',chaos:'main',quirk:'Secret twin'},stats:{str:13,spd:13,dur:13,iq:14,wm:13,pm:14},maxHp:300,wheelBoss:1,aiSkill:.7,phase:{txt:'The Wheelmaster laughs. The wheel spins faster.',m:{pm:2,spd:1},fx:{ultX:1.3}},lines:['Every fighter you have ever been came from my wheel.','Let us see what it decides for you.']}
];
const NODE={fight:{e:'👊',n:'Fight',d:'An opponent, then pick a reward'},elite:{e:'💀',n:'Elite',d:'Tougher, guaranteed loot plus a reward'},event:{e:'❓',n:'Encounter',d:'Something happens. You decide'},rest:{e:'🔥',n:'Campfire',d:'Heal, train or patch up'},shop:{e:'🛒',n:'Merchant',d:'Supplies for coins'},treasure:{e:'🎁',n:'Treasure',d:'A free loot spin'},boss:{e:'👑',n:'Boss',d:'The chapter boss'}};
const ITEMS=[
  {k:'bandage',n:'Bandages',e:'🩹',cost:6,d:'Heal 35% HP'},
  {k:'medkit',n:'Med kit',e:'🧰',cost:14,d:'Heal to full and cure injuries'},
  {k:'drink',n:'Energy drink',e:'🥤',cost:5,d:'Start the next fight with full energy'},
  {k:'scout',n:'Scouting report',e:'🔭',cost:5,d:'Read the next opponent 20% better'},
  {k:'salts',n:'Smelling salts',e:'🧂',cost:12,d:'Get back up once with 30% HP in the next fight'},
  {k:'charm',n:'Lucky charm',e:'🍀',cost:8,d:'Better odds on your next loot spin'}
];
const ITEMK=Object.fromEntries(ITEMS.map(i=>[i.k,i]));
ACHIEVEMENTS.push(
  {k:'story1',n:'Out of the Alley',e:'🗑️',q:2,d:'Beat Big Tony in chapter 1'},
  {k:'story2',n:'Kitchen Closed',e:'🍝',q:2,d:'Beat Mama Gnocchi in chapter 2'},
  {k:'story3',n:'Queen Slayer',e:'🐍',q:2,d:'Beat Lady Venom in chapter 3'},
  {k:'story4',n:'Mutiny',e:'🦈',q:2,d:'Beat Admiral Saltbeard in chapter 4'},
  {k:'story5',n:'Top of the Class',e:'🎓',q:3,d:'Beat the Professor in chapter 5'},
  {k:'story6',n:'Stake Through the Heart',e:'🦇',q:3,d:'Beat Count Crypt in chapter 6'},
  {k:'story7',n:'Mountain Mover',e:'🏔️',q:3,d:'Beat Titan Prime in chapter 7'},
  {k:'story8',n:'Short Circuit',e:'⚡',q:3,d:'Beat the Neon Ronin in chapter 8'},
  {k:'story9',n:'Pest Control',e:'🐝',q:3,d:'Beat Queen Hivemind in chapter 9'},
  {k:'story10',n:'The Wheel Has Spoken',e:'🎡',q:3,d:'Beat the Wheelmaster and finish the story'}
);
for(const a of ACHIEVEMENTS)ACHK[a.k]=a;
// side events pay less and open up as the story moves on
Object.assign(TIERK.local,{coins:5,xpW:8});
Object.assign(TIERK.regional,{coins:9,xpW:11,lock:'Reach chapter 2 of the story',unlock:f=>((f.story&&f.story.ch)||1)>=2});
Object.assign(TIERK.world,{coins:16,xpW:15,lock:'Reach chapter 4 of the story',unlock:f=>((f.story&&f.story.ch)||1)>=4});
// legacy: the old reroll perk becomes extra grit
{const i=LEGACY.findIndex(p=>p.k==='reroll');if(i>=0)LEGACY[i]={k:'grit',n:'Thick skin',e:'❤️',max:1,cost:[4],d:'+1 grit in every story chapter'};}
Object.assign(RULES,{
  story:['📖','Story mode',['Five chapters of 10 to 14 stages. Most stages are a fight, sometimes with an elite option; every third stage is a rest spot; the last is the boss.','Your HP carries over between fights. Winning restores 10% HP, and after every win you pick a reward: a loot spin, 25% HP back, or prize money. Rest spots between fights let you heal, shop or take a chance on an encounter.','Opponents are matched to how strong you are, so a lucky build still gets a real fight.']],
  grit:['❤️','Grit',['Every chapter starts with 3 grit. Losing a fight costs one.','Run out and the chapter starts over with a new path, and you lose a quarter of your coins. Your fighter keeps their levels and gear.']],
  loot:['🎁','Loot',['Gear now comes from loot spins, not the shop. Elites and treasure always give a spin, regular fights sometimes do, bosses give the best ones.','When you land gear for a slot that is taken, you choose: equip the new piece or keep yours and salvage the new one for coins.']],
  bag:['🎒','Bag',['Items from merchants, loot and the supply tent go in your bag.','Use them from the map before a fight. Bandages and med kits heal right away; the rest apply to your next fight.']]
});

// ---------- state ----------
function newChapter(ch,ng){return {ch,ng:ng||0,rows:genMap(CHAPTERS[ch-1]),row:0,picks:[],hp:100,grit:3+lgLvl('grit'),seenIntro:false,used:[],v2:1,v3:1,v4:1};}
function storyEnsure(){if(!F.story)F.story=Object.assign(newChapter(1,0),{cleared:[],v2:1,v3:1});
  // repair stories that skipped chapters because of the conversion bug: put them right after the chapters they actually cleared
  if(F.story.v2&&!F.story.v4){const S=F.story;S.v4=1;const n=new Set(S.cleared||[]).size;
    if((S.ng||0)===0&&S.ch>n+1){const keep={hp:S.hp,grit:S.grit};let to=n+1,cl=Array.from({length:n},(_,i)=>i+1);
      if(S.ch===7&&n===2){to=2;cl=[1,3];}else if(S.ch===3&&n===1){to=2;cl=[1];}
      F.story=Object.assign(newChapter(to,0),{cleared:cl,hp:keep.hp,grit:keep.grit});F.story.fixedOrder=1;}}
  if(!F.story.v2){const M={1:1,2:3,3:5,4:7,5:10};const S=F.story;const keep={hp:S.hp,grit:S.grit,ng:S.ng||0};F.story=Object.assign(newChapter(M[S.ch]||1,keep.ng),{cleared:[...new Set((S.cleared||[]).map(c=>M[c]||c))],v2:1,hp:keep.hp,grit:keep.grit});}if(!F.bag)F.bag={};if(!F.gear)F.gear={};
  // chapters got longer: older saves get the new, longer path
  const C=CHAPTERS[F.story.ch-1];if(F.story.rows.length<C.len){F.story.rows=genMap(C);F.story.picks=(F.story.picks||[]).slice(0,F.story.row);if(F.story.row>=C.len)F.story.row=C.len-1;}}
function pickWeighted(o){const arr=Object.entries(o).filter(([,w])=>w>0).map(([k,w])=>({k,w}));return arr[pickW(arr)].k;}
function genMap(C){
  const rows=[];
  for(let r=0;r<C.len;r++){
    if(r===C.len-1){rows.push(['boss']);continue;}
    const rest=r===C.len-2||((r+1)%3===0&&r<C.len-3);
    if(rest){
      // rest spots: no fight, pick how to recover
      const opts=new Set(r===C.len-2?['rest']:[]),n=Math.random()<0.5?3:2;let g=0;
      while(opts.size<n&&g++<40)opts.add(pickWeighted({rest:2,shop:1.5,event:2,treasure:0.8}));
      rows.push(shuffleArr([...opts]));
    }else rows.push(r>=2&&Math.random()<0.6?['fight','elite']:['fight']);
  }
  return rows;
}
const healS=n=>{F.story.hp=Math.min(100,F.story.hp+n);};
const hurtS=n=>{F.story.hp=Math.max(1,F.story.hp-n);};
function completeNode(){F.story.row++;saveCareer();}
function backToMap(){completeNode();showMap();}

// ---------- the map ----------
function showMap(){
  storyEnsure();if(typeof act2Migrate==='function')act2Migrate();
  if(!F||!F.career){showHub();return;}
  storyEnsure();
  const S=F.story,C=CHAPTERS[S.ch-1];
  const hearts=Array.from({length:3+lgLvl('grit')},(_,i)=>i<S.grit?'❤️':'🖤').join('');
  $('#mapHead').innerHTML=`<div class="maphead" style="--ch:${C.col}">
    <div class="mh-top"><span class="mh-e">${C.e}</span><div class="mh-t"><small>Chapter ${S.ch}${S.ng?`, encore ${S.ng}`:''}</small><b>${esc(C.n)}</b></div><span class="inf" role="button" tabindex="0" data-info="rule|story">How it works</span></div>
    <div class="mh-stats"><div class="mh-hp"><span>HP ${hpTxt(S.hp)}</span><div class="hpbar2"><i style="width:${S.hp}%"></i></div></div><div class="mh-grit" role="button" tabindex="0" data-info="rule|grit">${hearts}</div></div>
  </div>`;
  const bossDef=BOSSES[S.ch-1];
  $('#mapRows').innerHTML=S.rows.map((row,r)=>{
    const state=r<S.row?'done':r===S.row?'now':'later';
    const nodes=row.map((t,i)=>{
      const N=NODE[t],label=t==='boss'?bossDef.name:N.n,desc=t==='boss'?bossDef.title:N.d;
      if(state==='now')return `<button class="mnode now t-${t}" data-node="${i}"><span class="mn-e">${t==='boss'?bossDef.e:N.e}</span><span class="mn-t"><b>${esc(label)}</b><small>${esc(desc)}</small></span></button>`;
      const cls=state==='done'?(S.picks[r]===i?'chosen':'skipped'):'later';
      return `<div class="mnode ${cls} t-${t}"><span class="mn-e">${t==='boss'?bossDef.e:N.e}</span>${state==='done'&&S.picks[r]===i?'<span class="mn-ok">✓</span>':''}</div>`;
    }).join('');
    return `<div class="mrow ${state}"><div class="mstep">${r===S.rows.length-1?'Boss':'Step '+(r+1)}</div><div class="mnodes">${nodes}</div></div>`;
  }).join('');
  show('s-map');
  mapWindow();
  if(!S.seenIntro){S.seenIntro=true;saveCareer();chapterIntro();}
}
$('#mapRows').addEventListener('click',e=>{const b=e.target.closest('[data-node]');if(b)enterNode(+b.dataset.node);});
$('#mapHub').addEventListener('click',()=>showHub());
$('#bagBtn').addEventListener('click',openBag);
function enterNode(i){
  const S=F.story,t=S.rows[S.row][i];
  S.picks[S.row]=i;saveCareer();
  if(t==='fight'||t==='elite'){storyFight(t);return;}
  if(t==='boss'){const b=makeBoss(S.ch);bossIntro(b,()=>storyFight('boss',b));return;}
  if(t==='event'){storyEvent();return;}
  if(t==='rest'){campfire();return;}
  if(t==='shop'){merchant();return;}
  if(t==='treasure'){Q=[backToMap];lootTask('treasure');return;}
}

// ---------- opponents: matched to how strong you are ----------
function storyOdds(o,n){return headToHead(F,o,n||60,null,[{hp:F.story.hp},o.maxHp?{maxHp:o.maxHp}:{}]);}
function tuneUp(o,target,cap){for(let i=0;i<(cap||6);i++){if(storyOdds(o)<=target+0.08)break;applyBonus(o,{k:'all1',n:'+1 to everything',e:'💪'});o.lvl=(o.lvl||1)+1;}o._win=null;}
function storyOpponent(kind){
  const S=F.story,C=CHAPTERS[S.ch-1];
  const o=randomFighter(randName());
  levelUp(o,Math.max(0,C.lvl+S.ng*4+(kind==='elite'?2:0)+Math.floor(Math.random()*2)-1));
  if(kind==='elite'||S.ch>=3)randomGear(o,kind==='elite'?2:1);
  o.aiSkill=0.06*(S.ch-1)+(kind==='elite'?0.1:0)+S.ng*0.05;
  const ch=S.ch+S.ng;tuneUp(o,(kind==='elite'?0.58:0.72)-0.03*(ch-1));
  // the first two chapters ease off when you're badly outmatched, later ones don't
  if(ch<=2){const floor=kind==='elite'?0.35:(ch===1?0.5:0.42);for(let i=0;i<6&&storyOdds(o)<floor;i++){applyBonus(o,{k:'curse',n:'Eased off',e:'🕊️'});o._win=null;}}
  return o;
}
function makeBoss(ch){
  const def=BOSSES[ch-1],ng=F.story.ng||0;
  const f={name:def.name,bonus:{},boons:[]};
  for(const W of SEQ){
    if(W.cond&&!W.cond(f))continue;
    if(W.skipIf&&W.skipIf(f)){f[W.k]=SKIPPED;continue;}
    const list=itemsOf(W,f);let it=null;
    if(W.tier)it=list.find(x=>x.v===clamp(def.stats[W.k]||5,1,14));
    else if(def.picks[W.k]!=null)it=list.find(x=>x.n===def.picks[W.k]||x.k===def.picks[W.k]);
    if(!it)it=W.k==='title'?list[0]:list[pickW(list)];
    f[W.k]=it;
  }
  Object.assign(f,{title:TITLES[0],maxHp:def.maxHp+ng*40,bossFx:def.fx,phase:def.phase,aiSkill:def.aiSkill+ng*0.05,wheelBoss:def.wheelBoss,isBoss:true,bossTitle:def.title,lvl:CHAPTERS[ch-1].lvl+3+ng*4});
  if(ng)for(const k of ['str','spd','dur','iq','wm','pm'])f.bonus[k]=(f.bonus[k]||0)+ng*2;
  // bosses get stronger to stay a real fight, and ease off a little if you are badly outmatched
  tuneUp(f,0.45-0.02*(ch-1+ng),8);
  for(let i=0;i<3&&storyOdds(f)<0.18;i++){applyBonus(f,{k:'curse',n:'Eased off',e:'🕊️'});f._win=null;}
  return f;
}
function storyFight(kind,o){
  o=o||storyOpponent(kind);
  T={tier:{k:'story',n:kind==='boss'?'Boss fight':kind==='elite'?'Elite fight':'Story fight',e:'📖',xpW:0,coins:0},story:true,node:kind};
  curOpp=-1;curOppF=o;
  goFight();
}
function fightMods(O){
  const m0=Object.assign({},F.next||{});
  if(T&&T.story){m0.hp=F.story.hp;if(m0.halfHp)m0.hp=Math.max(1,Math.ceil(F.story.hp/2));}
  return [m0,O&&O.maxHp?{maxHp:O.maxHp}:{}];
}

// ---------- after a story fight ----------
function storyEndFight(won,O){
  const S=F.story,me=BT.P[0],node=T.node,ch=S.ch;
  lastFight={A:F,B:O,w:BT.w,ev:fightLog.slice()};
  F.fights=(F.fights||0)+1;F.rec[won?'w':'l']++;recordMatch(won?F:O,won?O:F);
  const lines=[],got=[],keys=[];
  let xp=won?({fight:8,elite:14,boss:30}[node]+ch*2):4;
  let coins=won?({fight:2,elite:4,boss:14}[node]+Math.floor(ch/2)):0;
  let fame=won?({fight:2,elite:5,boss:20}[node]+ch):0;
  if(won){
    S.hp=Math.min(100,Math.max(1,Math.ceil(me.hp))+10);
    if(curOdds<0.35)keys.push('giant');if(me.hp<10)keys.push('comeback');if(me.st.taken<0.5)keys.push('flawless');if(BT.round<=1)keys.push('onepunch');
  }else{
    S.grit--;S.hp=60;lines.push(`💔 You lose a grit. ${pl(S.grit,'grit','grit')} left`);
    if(Math.random()<0.3){const j=addInjury(F);if(j)lines.push(`${j.e} Injury: ${esc(j.n)} (${injText(j)})`);}
  }
  if(me.st.dodges>=3)keys.push('untouch');if(me.st.rps>=4)keys.push('reader');if(me.st.combos>=3)keys.push('combo');if(F.fights>=25)keys.push('iron');
  if(F.contract&&CONTRACTK[F.contract]){
    const c=CONTRACTK[F.contract],AR=curArena||{};
    const ok={combo2:me.st.combos>=2,reads3:me.st.rps>=3,clean:won&&me.st.taken<25,upset:won&&curOdds<0.45,quick:won&&BT.round<=3,ults:me.st.ults>=2,wall:won&&me.st.guards>=3,hazard:won&&!!(AR.hazard||AR.sunBurn),bigger:won&&(O.lvl||1)>=(F.lvl||1)+2}[c.k];
    if(ok){coins+=c.coins;xp+=c.xp;fame+=4;lines.push(`📜 Contract done: ${c.e} ${esc(c.n)}, +${c.coins} 🪙, +${c.xp} XP`);F.contract=null;F.offers=null;}
  }
  if(won)coins=Math.round((coins+2*talEcon(F,'coins'))*(1+0.25*talEcon(F,'gold')));
  let cleared=false,reset=false;
  if(won&&node==='boss'){
    cleared=true;keys.push('story'+ch);
    S.cleared=(S.cleared||[]).concat(ch);
    lines.push(`👑 Chapter ${ch} cleared: ${esc(CHAPTERS[ch-1].n)}`);
    if(lgLvl('trust')){coins+=10*lgLvl('trust');lines.push(`🏦 Trust fund: +${10*lgLvl('trust')} 🪙`);}
    if(ch===LASTCH){DB.champs.unshift({n:fullName(F),e:F.race.e,s:`Beat the Wheelmaster${S.ng?' (encore '+S.ng+')':''}. Level ${F.lvl} ${F.race.n.toLowerCase()}`,d:new Date().toLocaleDateString(),look:lookOf(F),best:bestStat(F),score:60+F.lvl+S.ng*10,fd:serFighter(F)});pruneDB();syncHistory();}
  }else if(!won&&S.grit<=0){
    reset=true;const lost=Math.floor(DB.coins*0.25);DB.coins-=lost;
    lines.push(`☠️ Out of grit. Chapter ${ch} starts over on a new path${lost?`, and you drop ${lost} 🪙`:''}`);
  }
  gainXP(F,xp);DB.coins+=coins;award(keys,got);
  lines.unshift(`+${xp} XP, +${coins} 🪙`);
  if(won)awardGems((node==='boss'?2+Math.floor(ch/3):node==='elite'?1:0)+(BT&&BT.sd?1:0),lines);
  if(won){track('wins');addMasteryWin(F);if(node==='elite')track('elites');if(node==='boss')track('bosses');}
  if(cleared)track('chapters');
  lines.push(...gainFame(fame));if(fame)lines.push(`⭐ +${fame} fame`);
  // move along the map
  if(cleared){let nxt=ch<LASTCH?ch+1:LASTCH;const ng=ch<LASTCH?S.ng:(S.ng||0)+1;if(ch<LASTCH)while(nxt<LASTCH&&(S.cleared||[]).includes(nxt)&&!S.ng)nxt++;F.story=Object.assign(newChapter(nxt,ng),{cleared:S.cleared});}
  else if(reset)F.story=Object.assign(newChapter(ch,S.ng),{cleared:S.cleared});
  else if(won||node!=='boss')S.row++;
  saveCareer();saveDB();
  const big=cleared?(ch===LASTCH?'The wheel has spoken':`Chapter ${ch} cleared`):won?(node==='boss'?'Boss down':'Victory'):'Defeat';
  const desc=won?`${esc(F.name)} beats ${esc(O.name)}.${!cleared?` HP ${hpTxt(S.hp)}.`:''}`:`${esc(O.name)} wins this one.${!reset?` ${node==='boss'?'The boss is still waiting.':'You move on.'}`:''}`;
  $('#result').innerHTML=`<div class="res ${won?'win':'lose'}"><div class="big">${big}</div><p>${desc}</p><ul class="gains">${lines.map(l=>`<li>${l}</li>`).join('')}</ul>${got.length?`<div class="chips">${got.map(a=>`<span class="oc up" role="button" tabindex="0" data-info="${ik('ach',a.n)}">${a.e} New title: ${esc(a.n)}</span>`).join('')}</div>`:''}</div>`;
  Q=[];
  if(won){
    if(node==='boss')Q.push(()=>lootTask('boss'));
    else{if(node==='elite')Q.push(()=>lootTask('elite'));Q.push(()=>rewardChoice(nextQ));}
  }
  const n=F.pendingLv||0;for(let i=0;i<n;i++)Q.push(levelUpTask);
  if(cleared)Q.push(()=>celebrate(CHAPTERS[ch-1].e,ch===LASTCH?'Story complete':`Chapter ${ch} cleared`,ch===LASTCH?'The Wheelmaster falls. The wheel keeps spinning, and so do you: encore mode starts now, with tougher fights.':`Next up: ${CHAPTERS[ch].n}`,showMap));
  else Q.push(showMap);
  $('#fightActions').innerHTML=`<button class="btn" data-a="next">${cleared?'Claim the boss loot':won&&Q.length>1?'Continue':'Back to the map'}</button>`;
  setTimeout(()=>ensureVisible($('#result'),true),80);
  if(won)setTimeout(()=>{const r=$('#result').getBoundingClientRect();burstAt(r.left+r.width/2,r.top+30);},300);
  landSound(won?(cleared?3:2):0);buzz(won?40:80);
}

// ---------- loot: gear comes from spins ----------
function lootList(table){
  const boost=F.lootBoost?1.7:1,own=new Set(Object.values(F.gear||{}));
  const c=F.story.ch+(F.story.ng||0);
  const W={normal:[1.4,3,1,0.05+0.03*c],elite:[0.6,2,2,0.15+0.1*c],boss:[0,0.6,1.6,0.4+0.4*c],treasure:[0.6,2,2,0.15+0.1*c]}[table]||[1,2,1,0.2];
  const list=[];
  GEAR.filter(g=>!own.has(g.k)).forEach(g=>{const r=g.req?3:(g.q||1);list.push({it:{n:g.n,e:g.e,q:r,w:1,gear:g.k,d:g.d},w:W[r]*(r>=2?boost:1)*0.55,mult:r>=2&&boost>1?boost:1});});
  list.push({it:{n:'A few coins',e:'🪙',q:0,coins:5+F.story.ch},w:W[0]*2.2,mult:1});
  list.push({it:{n:'Coin pouch',e:'💰',q:1,coins:12+F.story.ch*2},w:W[1]*0.9,mult:1});
  ITEMS.forEach(i=>list.push({it:{n:i.n,e:i.e,q:1,item:i.k,d:i.d},w:W[1]*0.35,mult:1}));
  return list.filter(e=>e.w>0);
}
let pendingGear=null;
function lootTask(table){
  storyEnsure();
  const list=lootList(table);
  const reasons=[{cls:'up',txt:{normal:'Regular fight loot',elite:'Elite loot: rares more likely',boss:'Boss loot: the good stuff',treasure:'Treasure: rares more likely'}[table]||'Loot'}];
  if(F.lootBoost)reasons.push({cls:'up',txt:'🍀 Lucky charm: rare and legendary slices ×1.7'});
  F.lootBoost=false;saveCareer();
  pendingGear=null;
  runWheel({cat:'gear',title:'Loot',who:`${F.name} searches the spoils`,list,reasons,spinLabel:'Spin for loot',
    onLand(it){
      if(it.coins){DB.coins+=it.coins;saveDB();return `<div class="note sub">+${it.coins} coins</div>`;}
      if(it.item){F.bag[it.item]=(F.bag[it.item]||0)+1;saveCareer();return `<div class="note sub">Added to your bag</div>`;}
      if(it.gear){
        const g=GEARK[it.gear];markSeen('gear',g.n);
        if(!F.gear[g.slot]){F.gear[g.slot]=g.k;F._win=null;saveCareer();return `<div class="note sub">Equipped</div>`;}
        pendingGear=g;return `<div class="ds">${esc(g.d)}</div>`;
      }
      return '';
    },
    next:()=>{if(pendingGear){const g=pendingGear;pendingGear=null;gearChoice(g,nextQ);}else nextQ();},nextLabel:'Continue'});
}
function gearChoice(g,then){
  const old=GEARK[F.gear[g.slot]],salv=Math.max(2,Math.round(g.cost/3));
  askChoice({icon:'⚖️',title:'Equip or keep?',sub:`Both go in your ${g.slot} slot`,options:[
    {label:`Equip ${g.e} ${g.n}`,sub:`${g.d}. Your ${old.n.toLowerCase()} is salvaged for ${Math.max(2,Math.round(old.cost/3))} coins`,fn:()=>{DB.coins+=Math.max(2,Math.round(old.cost/3));F.gear[g.slot]=g.k;F._win=null;saveCareer();saveDB();toast(`${g.e} ${g.n} equipped`);then();}},
    {label:`Keep ${old.e} ${old.n}`,sub:`${old.d}. Salvage the new one for ${salv} coins`,fn:()=>{DB.coins+=salv;saveDB();toast(`+${salv} 🪙 from salvage`);then();}}
  ]});
}

// ---------- encounters ----------
const gainFameText=n=>{const l=gainFame(n);return `+${n} fame.${l.length?' '+l.map(x=>x.replace(/<[^>]+>/g,'')).join(' '):''}`;};
function trainStat(k){hurtS(20);applyBonus(F,{k,n:'+1 '+STATN[k],e:'🥋'});return `+1 ${STATN[k].toLowerCase()} for good. Your body hates you right now (−20 HP).`;}
function blessing(){const r=Math.floor(Math.random()*4);if(r===0){healS(40);return 'Warmth fills you. +40% HP';}if(r===1){const k=pick(['str','spd','dur','iq','wm','pm']);applyBonus(F,{k,n:'+1 '+STATN[k],e:'⛩️'});return `+1 ${STATN[k].toLowerCase()} for good`;}if(r===2){DB.coins+=10;return '+10 coins appear in your pocket';}const it=pick(ITEMS);F.bag[it.k]=(F.bag[it.k]||0)+1;return `A gift: ${it.e} ${it.n}`;}
const SEVENTS=[
  {k:'promoter',e:'🕴️',t:'The shady promoter',d:'A man in sunglasses offers you cash to take it easy in your next fight.',o:[
    {l:'Take the money',s:'+15 coins, but you start the next fight at half your HP',fn:()=>{DB.coins+=15;F.next=Object.assign({},F.next,{halfHp:1});return 'You pocket the cash. Your conscience will be quiet by the next fight.';}},
    {l:'Tell him to get lost',s:'+4 fame',fn:()=>gainFameText(4)}]},
  {k:'doctor',e:'🩺',t:'Underground doctor',d:'A doctor with a very suspicious license offers treatment.',o:[
    {l:'Full treatment',s:'10 coins: heal to full and cure injuries',cost:10,fn:()=>{F.story.hp=100;F.inj=[];F._win=null;return 'Good as new. Mostly.';}},
    {l:'Stitch yourself up',s:'Heal 30% HP, with a 30% chance of an injury',fn:()=>{healS(30);if(Math.random()<0.3){const j=addInjury(F);if(j)return `It heals crooked. ${j.e} ${j.n}`;}return 'Not bad for a first try. +30% HP';}},
    {l:'Walk on',s:'Nothing happens',fn:()=>'You keep moving.'}]},
  {k:'street',e:'👊',t:'Street challenge',d:'A local tough blocks your path and wants to see what you have got.',o:[
    {l:'Fight them',s:'An elite fight with guaranteed loot',fight:'elite'},
    {l:'Walk away',s:'Lose 3 fame',fn:()=>{F.fame=Math.max(0,(F.fame||0)-3);return 'The crowd boos. You walk on.';}}]},
  {k:'mystery',e:'🎡',t:'A mysterious wheel',d:'A rusty wheel sits in an empty lot. A sign says SPIN ME.',o:[
    {l:'Spin it',s:'Could be great. Could be awful',wheel:1},
    {l:'Leave it alone',s:'Safe and boring',fn:()=>'You leave it. Somewhere, a wheel sulks.'}]},
  {k:'trainer',e:'🥋',t:'An old trainer',d:'An old trainer offers one brutal session. It will cost you.',o:[
    {l:'Strength drills',s:'+1 strength for good, lose 20% HP',fn:()=>trainStat('str')},
    {l:'Footwork',s:'+1 speed for good, lose 20% HP',fn:()=>trainStat('spd')},
    {l:'Sparring',s:'+1 weapon mastery for good, lose 20% HP',fn:()=>trainStat('wm')}]},
  {k:'gambler',e:'🎲',t:'The gambler',d:'"Double or nothing," says a guy wearing too many rings.',o:[
    {l:'Bet 10 coins',s:'A coin flip to win 20',cost:10,fn:()=>{if(Math.random()<0.5){DB.coins+=20;return 'You win! +20 coins';}return 'You lose. The rings jingle smugly.';}},
    {l:'No thanks',s:'Keep your coins',fn:()=>'Smart.'}]},
  {k:'shrine',e:'⛩️',t:'A forgotten shrine',d:'Candles are still burning at an old shrine.',o:[
    {l:'Pray',s:'Heal 25% HP',fn:()=>{healS(25);return 'You feel lighter. +25% HP';}},
    {l:'Leave an offering',s:'8 coins: a random blessing',cost:8,fn:()=>blessing()}]},
  {k:'spy',e:'🕵️',t:'An informant',d:'Someone in a trench coat knows things about your next opponent.',o:[
    {l:'Pay for intel',s:'6 coins: read your next opponent 25% better',cost:6,fn:()=>{F.next=Object.assign({},F.next,{readB:.25});return 'Now you know their tells.';}},
    {l:'Ignore them',s:'Nothing happens',fn:()=>'They vanish into the fog.'}]},
  {k:'fans',e:'📸',t:'Fans!',d:'A crowd of fans recognizes you on the street.',o:[
    {l:'Sign everything',s:'+8 coins and +3 fame, lose 10% HP',fn:()=>{DB.coins+=8;hurtS(10);return '+8 coins. '+gainFameText(3);}},
    {l:'Slip away and rest',s:'+15% HP',fn:()=>{healS(15);return 'A quiet moment. +15% HP';}}]},
  {k:'ambush',e:'🥷',t:'Ambush!',d:'Someone jumps you in an alley. There is no talking your way out of this one.',o:[
    {l:'Fight',s:'A regular fight at your current HP',fight:'fight'}]},
  {k:'smith',e:'⚒️',t:'Traveling weaponsmith',d:'A weaponsmith offers to work on your weapon.',o:[
    {l:'Sharpen it',s:'12 coins: +1 weapon mastery for good',cost:12,fn:()=>{applyBonus(F,{k:'wm',n:'+1 Weapon mastery',e:'⚒️'});return 'Your weapon has never felt better.';}},
    {l:'Pass',s:'Nothing happens',fn:()=>'Maybe next time.'}]},
  {k:'box',e:'📦',t:'A strange box',d:'A box hums quietly. Something valuable might be inside.',o:[
    {l:'Open it',s:'A loot spin, but a 40% chance it bites for 20% HP',loot:'treasure',risk:20},
    {l:'Leave it',s:'Nothing happens',fn:()=>'You leave the humming box alone.'}]}
];
const MYSTERY=[
  {k:'all1',n:'+1 to everything',e:'🌟',q:3,w:0.8},{k:'heal',n:'Full heal',e:'💚',q:2,w:2},{k:'coins',n:'+15 coins',e:'💰',q:2,w:2},
  {k:'item',n:'A random item',e:'🎁',q:1,w:2},{k:'curse',n:'Cursed: −1 to everything',e:'🕳️',q:0,w:1},{k:'hurt',n:'Lose 30% HP',e:'🩸',q:0,w:2}
];
function storyEvent(){
  const S=F.story,pool=SEVENTS.filter(e=>!(S.used||[]).includes(e.k)),ev=pick(pool.length?pool:SEVENTS);
  S.used=(S.used||[]).concat(ev.k);saveCareer();
  askChoice({icon:ev.e,title:ev.t,body:esc(ev.d),options:ev.o.map(o=>({label:o.l,sub:o.s,disabled:!!o.cost&&DB.coins<o.cost,fn:()=>{
    if(o.cost)DB.coins-=o.cost;
    if(o.fight){storyFight(o.fight);return;}
    if(o.wheel){Q=[backToMap];mysteryWheel();return;}
    if(o.loot){if(Math.random()<0.4){hurtS(o.risk);toast(`It bites! −${o.risk} HP`);}Q=[backToMap];lootTask(o.loot);return;}
    const txt=o.fn();F._win=null;saveCareer();saveDB();
    askChoice({icon:ev.e,title:ev.t,body:esc(txt),options:[{label:'Continue',fn:backToMap}]});
  }}))});
}
function mysteryWheel(){
  runWheel({cat:'mystery',title:'Mystery wheel',who:'It creaks as it turns',list:MYSTERY.map(it=>({it,w:it.w,mult:1})),spinLabel:'Spin it',
    onLand(it){
      let t='';
      if(it.k==='all1'){applyBonus(F,{k:'all1',n:'+1 to everything',e:'🌟'});t='+1 to everything, for good';}
      else if(it.k==='heal'){F.story.hp=100;t='Back to full HP';}
      else if(it.k==='coins'){DB.coins+=15;t='+15 coins';}
      else if(it.k==='item'){const i=pick(ITEMS);F.bag[i.k]=(F.bag[i.k]||0)+1;t=`${i.e} ${i.n} added to your bag`;}
      else if(it.k==='curse'){applyBonus(F,{k:'curse',n:'Cursed: −1 to everything',e:'🕳️'});t='−1 to everything. Ouch';}
      else if(it.k==='hurt'){hurtS(30);t='−30% HP';}
      F._win=null;saveCareer();saveDB();return `<div class="note sub">${esc(t)}</div>`;
    },nextLabel:'Back to the map'});
}
function campfire(){
  askChoice({icon:'🔥',title:'Campfire',sub:`HP ${hpTxt(F.story.hp)}`,body:'A quiet spot to catch your breath. You only have time for one thing.',options:[
    {label:'Sleep it off',sub:'Heal 45% HP',fn:()=>{healS(45);saveCareer();toast('+45% HP');backToMap();}},
    {label:'Train',sub:'10 HP: spin the training wheel for a permanent stat point',fn:()=>{hurtS(10);Q=[backToMap];trainingWheel();}},
    {label:'See the medic',sub:`Cure injuries and heal 20% HP${(F.inj||[]).length?'':'. You have no injuries right now'}`,fn:()=>{F.inj=[];F._win=null;healS(20);saveCareer();toast('Patched up. +20% HP');backToMap();}}
  ]});
}
const TRAIN=[{k:'str',n:'+1 Strength',e:'💪',q:2,w:3},{k:'spd',n:'+1 Speed',e:'👟',q:2,w:3},{k:'dur',n:'+1 Durability',e:'🛡️',q:2,w:3},{k:'iq',n:'+1 IQ',e:'🧠',q:1,w:2},{k:'wm',n:'+1 Weapon mastery',e:'🗡️',q:2,w:2.5},{k:'pm',n:'+1 Power mastery',e:'✨',q:2,w:2.5},{k:'oops',n:'Pulled a muscle',e:'🤕',q:0,w:2}];
function trainingWheel(){
  runWheel({cat:'train',title:'Training',who:`${F.name} hits the training dummy`,list:TRAIN.map(it=>({it,w:it.w,mult:1})),spinLabel:'Spin the training wheel',preview:true,
    onLand(it){if(it.k==='oops'){hurtS(10);saveCareer();return '<div class="note sub">−10 more HP. Nothing gained</div>';}applyBonus(F,it);F._win=null;saveCareer();return '';},nextLabel:'Back to the map'});
}
function merchant(){
  const S=F.story;
  if(S.stockRow!==S.row){
    S.stock=shuffleArr(ITEMS.map(i=>i.k)).slice(0,3);S.stockRow=S.row;
    const own=Object.values(F.gear||{});const g=pick(GEAR.filter(x=>!x.req&&['rare','epic'].includes(x.r)&&!own.includes(x.k)));
    S.gearOffer=Math.random()<0.45&&g?g.k:null;saveCareer();
  }
  renderMerchant();
}
function renderMerchant(){
  const S=F.story;
  const rows=S.stock.map(k=>{const i=ITEMK[k],p=itemPrice(i);return `<div class="shopitem"><span class="se">${i.e}</span><div class="st2"><b>${esc(i.n)}</b><small>${esc(i.d)}</small></div><button class="buy" data-mbuy="${k}"${DB.coins>=p?'':' disabled'}>${p} 🪙</button></div>`;}).join('');
  const g=S.gearOffer&&GEARK[S.gearOffer];
  const gear=g?`<div class="shopitem rare"><span class="se">${g.e}</span><div class="st2"><b>${esc(g.n)}</b><small>${esc(g.d)}. ${g.slot==='armor'?'Armor':'Trinket'}${F.gear[g.slot]?`, replaces your ${esc(GEARK[F.gear[g.slot]].n.toLowerCase())}`:''}</small></div><button class="buy" data-mgear="${g.k}"${DB.coins>=gearPrice(g)?'':' disabled'}>${gearPrice(g)} 🪙</button></div>`:'';
  setSheet(`<div class="ch-h"><span class="ch-i">🛒</span><div><b>Merchant</b><small>You have ${DB.coins} 🪙</small></div></div>${rows}${gear}<button class="btn ghost" data-close="map">Leave</button>`);
}
// ---------- the bag ----------
function openBag(){
  const bag=F.bag||{},keys=ITEMS.filter(i=>bag[i.k]>0);
  setSheet(`<div class="ch-h"><span class="ch-i">🎒</span><div><b>Bag</b><small>HP ${hpTxt(F.story?F.story.hp:100)}</small></div><span class="inf" role="button" tabindex="0" data-info="rule|bag">How it works</span></div>${keys.length?keys.map(i=>`<div class="shopitem"><span class="se">${i.e}</span><div class="st2"><b>${esc(i.n)} ×${bag[i.k]}</b><small>${esc(i.d)}</small></div><button class="buy" data-use="${i.k}">Use</button></div>`).join(''):'<p class="hint">Your bag is empty. Merchants, loot spins and the supply tent fill it up.</p>'}<div class="row2"><button class="btn ghost" data-openarmory="1">🛡️ Armory</button><button class="btn ghost" data-close="1">Close</button></div>`);
}
function useItem(k){
  if(!(F.bag[k]>0))return;
  storyEnsure();
  F.bag[k]--;
  if(k==='bandage'){healS(35);toast('+35% HP');}
  else if(k==='medkit'){F.story.hp=100;F.inj=[];F._win=null;toast('Fully healed');}
  else if(k==='drink'){F.next=Object.assign({},F.next,{en:100});toast('Full energy next fight');}
  else if(k==='scout'){F.next=Object.assign({},F.next,{readB:.2});toast('Better reads next fight');}
  else if(k==='salts'){F.next=Object.assign({},F.next,{revive:30});toast('You will get back up once next fight');}
  else if(k==='charm'){F.lootBoost=true;toast('Next loot spin is luckier');}
  saveCareer();openBag();if(!$('#s-map').hidden)showMap();
}

// ---------- sheets, cinematics, toasts ----------
let CH=null,sheetClose=null;
function setSheet(html){$('#choiceBody').innerHTML=html;const c=$('#choice');c.hidden=false;c.classList.remove('show');void c.offsetWidth;c.classList.add('show');}
function closeChoice(){$('#choice').hidden=true;}
function askChoice(o){
  CH=o;
  setSheet(`<div class="ch-h">${o.icon?`<span class="ch-i">${o.icon}</span>`:''}<div><b>${esc(o.title)}</b>${o.sub?`<small>${esc(o.sub)}</small>`:''}</div></div>${o.body?`<p class="ch-body">${o.body}</p>`:''}<div class="ch-opts">${o.options.map((x,i)=>`<button class="ch-opt" data-ci="${i}"${x.disabled?' disabled':''}><b>${esc(x.label)}</b>${x.sub?`<small>${esc(x.sub)}</small>`:''}</button>`).join('')}</div>`);
}
$('#choice').addEventListener('click',e=>{
  const o=e.target.closest('[data-ci]');
  if(o&&!o.disabled&&CH){const opt=CH.options[+o.dataset.ci];CH=null;closeChoice();if(opt.fn)opt.fn();return;}
  const b=e.target.closest('[data-mbuy]');
  if(b&&!b.disabled){const i=ITEMK[b.dataset.mbuy],p=itemPrice(i);if(DB.coins<p)return;DB.coins-=p;F.bag[i.k]=(F.bag[i.k]||0)+1;F.story.stock=F.story.stock.filter(k=>k!==i.k);saveCareer();saveDB();landSound(2);toast(`${i.e} ${i.n} added to your bag`);renderMerchant();return;}
  const g=e.target.closest('[data-mgear]');
  if(g&&!g.disabled){const G=GEARK[g.dataset.mgear],p=gearPrice(G);if(DB.coins<p)return;DB.coins-=p;F.gear[G.slot]=G.k;F._win=null;markSeen('gear',G.n);F.story.gearOffer=null;saveCareer();saveDB();landSound(3);toast(`${G.e} ${G.n} equipped`);renderMerchant();return;}
  const u=e.target.closest('[data-use]');
  if(u){useItem(u.dataset.use);return;}
  const c=e.target.closest('[data-close]');
  if(c){closeChoice();if(c.dataset.close==='map')backToMap();}
});
let toastT=null;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('on');void t.offsetWidth;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2300);}
function cine(html,btn,then){
  const c=$('#cine');
  c.innerHTML=`<div class="cine-in">${html}<button class="btn cine-btn">${esc(btn)}</button></div>`;
  c.hidden=false;c.classList.remove('show');void c.offsetWidth;c.classList.add('show');
  c.querySelector('.cine-btn').onclick=()=>{c.hidden=true;c.innerHTML='';if(then)then();};
}
function typeLine(el,text){if(!el)return;if(RM){el.textContent=text;return;}let i=0;const t=setInterval(()=>{el.textContent=text.slice(0,++i);if(i>=text.length)clearInterval(t);},26);}
function chapterIntro(){
  const S=F.story,C=CHAPTERS[S.ch-1];
  cine(`<div class="cine-kicker">Chapter ${S.ch}${S.ng?`, encore ${S.ng}`:''}</div><div class="cine-emoji">${C.e}</div><h2 class="cine-title">${esc(C.n)}</h2><p class="cine-text">${esc(C.intro)}</p><div class="cine-meta">${pl(3+lgLvl('grit'),'grit','grit')}. ${S.rows.length} steps. One boss.</div>`,'Begin',null);
  [262,330,392].forEach((f,i)=>beep(f,0.25,'triangle',0.05,i*0.12));
}
function bossIntro(b,then){
  const def=BOSSES[F.story.ch-1];
  cine(`<div class="cine-kicker">Chapter ${F.story.ch} boss</div><div class="boss-art">${charSVG(lookOf(b),{h:190,sized:false})}</div><div class="boss-plate"><b>${esc(b.name)}</b><span>${esc(b.bossTitle)}</span></div><p class="boss-line">"<span id="bossLine"></span>"</p><div class="cine-meta">Level ${b.lvl}. ${Math.round(b.maxHp*LS(b))} HP, you have ${hpTxt(F.story.hp)}. Power scale: ${esc(powerScale(b).n)}. Has a second phase.</div>`,'Fight',then);
  typeLine(document.getElementById('bossLine'),pick(def.lines));
  [98,110,82].forEach((f,i)=>beep(f,0.35,'sawtooth',0.05,i*0.32));buzz([60,80,60]);
}
function celebrate(icon,title,sub,then){
  cine(`<div class="cele-badge">${icon}</div><h2 class="cine-title">${esc(title)}</h2><p class="cine-text">${esc(sub)}</p>`,'Continue',then);
  [523,659,784,1047].forEach((f,i)=>beep(f,0.2,'triangle',0.06,i*0.09));
  setTimeout(()=>burstAt(innerWidth/2,innerHeight*0.35),150);
}

// ---------- level-ups never downgrade you ----------
let pendingUp=null;
function levelUpTask(){
  runWheel({cat:'lvl',title:'Level up',who:`${F.name} reached level ${F.lvl}`,list:LEVELUP.map(it=>({it,w:it.w,mult:1})),spinLabel:'Spin the level-up wheel',preview:true,
    onLand(it){
      F.pendingLv=Math.max(0,(F.pendingLv||0)-1);saveCareer();
      if(it.k==='awaken'){Q.unshift(()=>upgradeSpin('power'));return '<div class="ds">Next: a power spin with only equal or better slices. You can keep your current power if you like it more</div>';}
      if(it.k==='arsenal'){Q.unshift(()=>upgradeSpin('weapon'));return '<div class="ds">Next: a weapon spin with only equal or better slices. You can keep your current weapon</div>';}
      applyBonus(F,it);F._win=null;saveCareer();return '';
    },nextLabel:'Continue'});
}
function upgradeSpin(kind){
  const W=SEQ.find(w=>w.k===kind),MK=kind==='power'?'pm':'wm',MW=SEQ.find(w=>w.k===MK);
  const old=F[kind],oldM=F[MK]&&!F[MK].skip?F[MK]:MW.items[0],oq=old.q==null?1:old.q;
  const list=itemsOf(W,F).filter(x=>x.n!==old.n&&x.k!=='none'&&(x.q==null?1:x.q)>=oq).map(it=>({it,w:it.w,mult:1}));
  if(!list.length){applyBonus(F,{k:MK,n:'+1 '+STATN[MK],e:'⬆️'});saveCareer();toast(`Nothing better exists. +1 ${STATN[MK].toLowerCase()} instead`);nextQ();return;}
  pendingUp={kind,old,oldM};
  runWheel({cat:kind,title:kind==='power'?'Awakening':'New weapon',who:'Only equal or better slices on this wheel',list,reasons:[{cls:'up',txt:`Only slices at least as good as your ${old.n.toLowerCase()}`}],
    onLand(it){pendingUp.it=it;return '';},nextLabel:'Now the mastery',
    next:()=>{
      const mlist=MW.items.filter(x=>x.v>=oldM.v).map(it=>({it,w:it.w,mult:1}));
      runWheel({cat:MK,title:MW.label,who:'Mastery can only go up',list:mlist,reasons:[{cls:'up',txt:`Never below ${oldM.n.toLowerCase()}`}],
        onLand(m){pendingUp.m=m;return '';},nextLabel:'Compare',
        next:()=>{
          const n=pendingUp;pendingUp=null;
          askChoice({icon:'⚖️',title:'Swap or keep?',sub:'Pick the one you want to fight with',options:[
            {label:`New: ${n.it.e} ${n.it.n}`,sub:`${n.m.n} mastery${n.it.d?'. '+n.it.d:''}`,fn:()=>{F[kind]=n.it;F[MK]=n.m;if(CX_CATS.has(kind))markSeen(kind,n.it.n);F._win=null;saveCareer();toast(`${n.it.e} ${n.it.n} it is`);nextQ();}},
            {label:`Keep: ${n.old.e} ${n.old.n}`,sub:`${n.oldM.n} mastery, plus +1 mastery for staying loyal`,fn:()=>{applyBonus(F,{k:MK,n:'+1 '+STATN[MK],e:'🤝'});F._win=null;saveCareer();toast('+1 mastery');nextQ();}}
          ]});
        }});
    }});
}

// ---------- no paid rerolls, a supply tent instead of the old shop ----------
function updateReroll(){
  const b=$('#rerollBtn');
  const ok=F&&F.free>0;
  if(mode!=='build'||autoRun||lastSpun<0||spinning||!ok){b.hidden=true;return;}
  b.hidden=false;b.textContent=`🎲 Reroll ${SEQ[lastSpun].lc} (your one free reroll)`;
}
function renderShop(){
  $('#shopCoins').textContent=`You have ${DB.coins} 🪙. Supplies go in your bag. Gear only comes from loot spins now.`;
  $('#shopList').innerHTML=ITEMS.map(i=>{const p=priceOf(i.cost+2);return `<div class="shopitem"><span class="se">${i.e}</span><div class="st2"><b>${esc(i.n)}${F.bag&&F.bag[i.k]?` (have ${F.bag[i.k]})`:''}</b><small>${esc(i.d)}</small></div><button class="buy" data-tent="${i.k}"${DB.coins>=p?'':' disabled'}>${p} 🪙</button></div>`;}).join('');
  $('#gearList').innerHTML='';
}
function renderGearShop(){$('#gearList').innerHTML='';}
$('#shopList').addEventListener('click',e=>{
  const b=e.target.closest('[data-tent]');if(!b||b.disabled)return;
  const i=ITEMK[b.dataset.tent],p=priceOf(i.cost+2);if(DB.coins<p)return;
  DB.coins-=p;F.bag=F.bag||{};F.bag[i.k]=(F.bag[i.k]||0)+1;saveCareer();saveDB();landSound(2);toast(`${i.e} ${i.n} added to your bag`);renderShop();
},true);

// ---------- the story card on the fighter page ----------
function renderStoryCard(){
  storyEnsure();
  const S=F.story,C=CHAPTERS[S.ch-1];
  $('#hubExtras').insertAdjacentHTML('afterbegin',`<div class="storycard" style="--ch:${C.col}"><div class="sc-top"><span class="sc-e">${C.e}</span><div><small>Story, chapter ${S.ch} of ${LASTCH}${S.ng?`, encore ${S.ng}`:''}</small><b>${esc(C.n)}</b></div></div><div class="sc-prog">${S.rows.map((r,i)=>`<i class="${i<S.row?'d':i===S.row?'c':''}"></i>`).join('')}</div><div class="sc-meta">HP ${hpTxt(S.hp)}. ${F.lvl<C.lvl?`<span class="reclvl">Recommended level ${C.lvl}, you are ${F.lvl}</span> `:''}${'❤️'.repeat(Math.max(0,S.grit))}${'🖤'.repeat(Math.max(0,3+lgLvl('grit')-S.grit))}</div><button class="btn" id="storyBtn">${S.row===0&&!S.seenIntro?'Start the chapter':'Continue the story'}</button><div class="sc-row"><button class="btn ghost sm" id="hubBagBtn">🎒 Bag</button><button class="btn ghost sm" id="rosterBtn">👥 Your fighters</button></div></div>`);
}
document.addEventListener('click',e=>{
  if(e.target.closest('#storyBtn')){showMap();return;}
  if(e.target.closest('#hubBagBtn')){openBag();}
  if(e.target.closest('#rosterBtn')){toTitle();}
});

// ---------- coins count up in the header ----------
let shownCoins=null;
setInterval(()=>{
  const c=document.getElementById('coinChip');if(!c||c.hidden)return;
  const target=DB.coins;
  if(shownCoins===null){shownCoins=target;}
  if(shownCoins===target){if(!c.textContent.endsWith(' '+target))c.textContent='🪙 '+target;return;}
  const step=Math.max(1,Math.ceil(Math.abs(target-shownCoins)/6));
  shownCoins+=target>shownCoins?step:-step;
  if((step>0&&Math.abs(target-shownCoins)<step))shownCoins=target;
  c.textContent='🪙 '+shownCoins;
  c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');
},60);

// after every story win: pick one reward
function rewardChoice(then){
  const ch=F.story.ch,c=4+ch;
  askChoice({icon:'🏆',title:'Pick your reward',sub:`HP ${hpTxt(F.story.hp)}`,options:[
    {label:'🎁 Loot spin',sub:'Gear, items or coins',fn:()=>{Q.unshift(()=>lootTask('normal'));then();}},
    {label:'💚 Catch your breath',sub:'Heal 25% HP',fn:()=>{healS(25);saveCareer();toast('+25% HP');then();}},
    {label:'💰 Prize money',sub:`+${c} coins`,fn:()=>{DB.coins+=c;saveDB();toast(`+${c} 🪙`);then();}}
  ]});
}
