// ================= ARMORY: collect gear and swap it around =================
const ARMORY_CAP=60;
function syncArmory(f){
  if(!f)return;f.armory=f.armory||[];
  for(const k of Object.values(f.gear||{}))if(k&&!f.armory.includes(k))f.armory.push(k);
  if(f===F&&typeof track==='function'){
    DB.gearSeen=DB.gearSeen||[];let added=0;for(const k of f.armory)if(!DB.gearSeen.includes(k)){DB.gearSeen.push(k);added++;}
    if(added)track('gearFound',added);
    const sets={knight:6,shadow:6,arcane:6,clown:4};trackMax('setsDone',Object.keys(sets).filter(s=>setCount(f,s)>=sets[s]).length);
    trackMax('topLevel',f.lvl||1);
  }
}
// new gear goes into the armory; nothing is lost when you swap
function gearChoice(g,then){
  syncArmory(F);
  if(!F.armory.includes(g.k))F.armory.push(g.k);
  const old=GEARK[F.gear[g.slot]],salv=Math.max(2,Math.round(g.cost/3));
  askChoice({icon:g.e,title:`New ${SLOT_N[g.slot].toLowerCase()}: ${g.n}`,sub:`${RARITY[g.r]?RARITY[g.r].n:''}. ${g.d}`,body:`You're wearing ${old?`${old.e} <b>${esc(old.n)}</b>: ${esc(old.d)}`:'nothing in this slot'}. Whatever you don't wear stays in your armory.`,options:[
    {label:`Wear ${g.n}`,sub:old?`${old.n} goes to your armory`:'Equip it now',fn:()=>{F.gear[g.slot]=g.k;F._win=null;saveCareer();toast(`${g.e} ${g.n} equipped`);then();}},
    {label:old?`Keep wearing ${old.n}`:'Store it for later',sub:`${g.n} goes to your armory`,fn:()=>{saveCareer();toast(`${g.e} ${g.n} added to your armory`);then();}},
    {label:`Salvage ${g.n}`,sub:`Get ${salv} 🪙 instead. It's gone for good`,fn:()=>{F.armory=F.armory.filter(k=>k!==g.k);DB.coins+=salv;saveCareer();saveDB();toast(`+${salv} 🪙`);then();}}
  ]});
}
let ARM_SLOT=null;
function openArmory(slot){
  syncArmory(F);ARM_SLOT=slot||null;
  const own=F.armory.map(k=>GEARK[k]).filter(Boolean);
  const order=['premium','mythic','legendary','epic','rare','common','junk'];
  let body;
  if(!ARM_SLOT){
    const tiles=GEAR_SLOTS.map(s=>{const g=GEARK[F.gear[s]],n=own.filter(x=>x.slot===s).length;return `<button class="arm-slot${g?' r-'+g.r:''}" data-armslot="${s}"><span class="as-e">${g?g.e:SLOT_E[s]}</span><span class="as-t"><small>${SLOT_N[s]}</small><b>${g?esc(g.n):'Empty'}</b><small>${pl(n,'piece')} owned</small></span></button>`;}).join('');
    const sets=synOf(F).filter(x=>x.k.startsWith('set_'));
    body=`<div class="arm-grid">${tiles}</div>${sets.length?`<span class="sec-label">Set bonuses</span>${sets.map(x=>`<div class="arm-set">${x.e} <b>${esc(x.n)}</b> <small>${esc(x.d)}</small></div>`).join('')}`:`<p class="hint">Wear matching knight, shadow, arcane or clown pieces for set bonuses.</p>`}`;
  }else{
    const list=own.filter(x=>x.slot===ARM_SLOT).sort((a,b)=>order.indexOf(a.r)-order.indexOf(b.r));
    body=`<button class="btn ghost sm" data-armback="1">← All slots</button><span class="sec-label">${SLOT_N[ARM_SLOT]} (${list.length})</span>`+(list.length?list.map(g=>{const on=F.gear[g.slot]===g.k;return `<div class="shopitem r-${g.r}"><span class="se">${g.e}</span><div class="st2"><b>${esc(g.n)}${on?' ✓':''}</b><small><span class="rar r-${g.r}">${RARITY[g.r]?RARITY[g.r].n:''}</span>${g.set?`<span class="rar">${g.set} set</span>`:''} ${esc(g.d)}${flav(g.n)}</small></div><div class="buy2">${on?`<button class="buy ghostbuy" data-armoff="${g.k}">Take off</button>`:`<button class="buy" data-armon="${g.k}">Wear</button>`}${on?'':`<button class="buy ghostbuy" data-armsalv="${g.k}">Salvage</button>`}</div></div>`;}).join(''):'<p class="hint">Nothing for this slot yet. Loot spins, merchants and the base shop all drop gear.</p>');
  }
  setSheet(`<div class="ch-h"><span class="ch-i">🛡️</span><div><b>Armory</b><small>${own.length} of ${ARMORY_CAP} spaces used. Swap any time</small></div></div>${body}<button class="btn ghost" data-close="1">Done</button>`);
}
document.getElementById('choice').addEventListener('click',e=>{
  const s=e.target.closest('[data-armslot]');if(s){tick();openArmory(s.dataset.armslot);return;}
  if(e.target.closest('[data-armback]')){openArmory();return;}
  const on=e.target.closest('[data-armon]');if(on){const g=GEARK[on.dataset.armon];F.gear[g.slot]=g.k;F._win=null;saveCareer();landSound(2);toast(`${g.e} ${g.n} equipped`);openArmory(g.slot);if(!$('#s-hub').hidden)showHub();return;}
  const off=e.target.closest('[data-armoff]');if(off){const g=GEARK[off.dataset.armoff];delete F.gear[g.slot];F._win=null;saveCareer();tick();openArmory(g.slot);if(!$('#s-hub').hidden)showHub();return;}
  const sv=e.target.closest('[data-armsalv]');if(sv){const g=GEARK[sv.dataset.armsalv],v=Math.max(1,g.r==='premium'?20:Math.round(g.cost/3));F.armory=F.armory.filter(k=>k!==g.k);DB.coins+=v;saveCareer();saveDB();landSound(2);toast(`+${v} 🪙`);openArmory(g.slot);}
});
// the armory is one tap away from the fighter page and the bag
document.addEventListener('click',e=>{if(e.target.closest('#armoryBtn,[data-openarmory]'))openArmory();});

// ================= CONFIRM BIG CHOICES =================
let CONF_OK=false;
function confirmBig(o){
  askChoice({icon:o.icon||'❓',title:o.title,body:o.body||'',options:[{label:o.yes||'Yes, do it',sub:o.yesSub||'',fn:o.fn},{label:o.no||'Cancel',sub:'Nothing changes',fn:o.back||(()=>{})}]});
}
const CONFIRM_RULES=[
  ['[data-b2prem]',b=>{const g=GEARK[b.dataset.b2prem],gem=b.dataset.cur==='gem';return {icon:g.e,title:`Buy ${g.n}?`,body:`It costs <b>${gem?GEM_PRICE[g.k]+' 💎':g.cost+' 🪙'}</b>. You have ${gem?(DB.gems||0)+' 💎':DB.coins+' 🪙'}.`,yes:'Buy it'};}],
  ['[data-b2gear]',b=>{const g=GEARK[b.dataset.b2gear];return {icon:g.e,title:`Buy ${g.n}?`,body:`It costs <b>${b.dataset.p} 🪙</b>. You have ${DB.coins} 🪙.`,yes:'Buy it'};}],
  ['[data-m2gear]',b=>{const g=GEARK[b.dataset.m2gear];return {icon:g.e,title:`Buy ${g.n}?`,body:`It costs <b>${b.textContent.trim()}</b>. You have ${DB.coins} 🪙.`,yes:'Buy it',back:renderMerchant};}],
  ['[data-b2sell]',b=>{const g=GEARK[b.dataset.b2sell];return {icon:g.e,title:`Sell ${g.n}?`,body:`You get <b>${b.textContent.trim()}</b>. It's gone for good, including from your armory.`,yes:'Sell it'};}],
  ['[data-armsalv]',b=>{const g=GEARK[b.dataset.armsalv];return {icon:g.e,title:`Salvage ${g.n}?`,body:'You get a few coins. It is gone for good.',yes:'Salvage it',back:()=>openArmory(g.slot)};}],
  ['[data-b2svc="respec"]',()=>({icon:'🔁',title:'Reset all your talents?',body:'Every talent point comes back so you can spend it again.',yes:'Reset them'})],
  ['[data-fm="forfeit"]',()=>({icon:'🏳️',title:'Forfeit this fight?',body:'It counts as a loss.',yes:'Forfeit',back:openFightMenu})],
  ['[data-set="reset"]',()=>({icon:'🗑️',title:'Erase everything?',body:'All fighters, legacy, gems and records on this device are deleted. This cannot be undone.',yes:'Erase everything',back:openSettings})],
  ['#abandonBtn',()=>({icon:'🏳️',title:'Abandon this tournament?',body:'Your progress in it is lost.',yes:'Abandon it'})],
  ['#retireBtn',()=>({icon:'👋',title:`Retire ${F?F.name:'this fighter'}?`,body:`They leave your roster for good and you get <b>${F?legacyEarned(F):0} ✦</b> legacy points.`,yes:'Retire them'})],
  ['[data-retire]',b=>{const sl=DB.slots[+b.dataset.retire],f=sl&&deserFighter(sl.career);return {icon:'👋',title:`Retire ${f?f.name:'this fighter'}?`,body:`They leave your roster for good and you get <b>${f?legacyEarned(f):0} ✦</b> legacy points.`,yes:'Retire them'};}],
  ['.mnode.now.t-boss',()=>({icon:BOSSES[F.story.ch-1].e,title:`Face ${BOSSES[F.story.ch-1].name}?`,body:`You go in with <b>${F.story.hp} HP</b>. Boss fights last up to 30 rounds and end in sudden death. ${F.story.hp<70?'You might want to heal first.':''}`,yes:'Fight the boss',no:'Not yet'})]
];
document.addEventListener('click',e=>{
  if(CONF_OK)return;
  for(const [sel,mk] of CONFIRM_RULES){
    const b=e.target.closest(sel);if(!b||b.disabled)continue;
    e.preventDefault();e.stopImmediatePropagation();
    const o=mk(b);
    confirmBig(Object.assign(o,{fn:()=>{
      if(sel==='#retireBtn'){retire();toTitle();return;}
      if(sel==='[data-retire]'){const i=+b.dataset.retire;switchSlot(i);retire();renderTitle();return;}
      if(sel==='#abandonBtn'){DB.tourney=null;T=null;G=null;saveDB();showHub();return;}
      if(sel==='[data-fm="forfeit"]'){forfeitArm=Date.now();$('#forfeitBtn').click();return;}
      if(sel==='[data-set="reset"]'){try{localStorage.removeItem(STORE);}catch(err){}location.reload();return;}
      if(sel==='.mnode.now.t-boss'){enterNode(+b.dataset.node);return;}
      if(sel==='[data-m2gear]'){openMerchantThen(()=>{CONF_OK=true;const nb=document.querySelector(`[data-m2gear="${b.dataset.m2gear}"]`);if(nb)nb.click();CONF_OK=false;});return;}
      if(sel==='[data-armsalv]'){openArmory(GEARK[b.dataset.armsalv].slot);CONF_OK=true;const nb=document.querySelector(`[data-armsalv="${b.dataset.armsalv}"]`);if(nb)nb.click();CONF_OK=false;return;}
      CONF_OK=true;b.click();CONF_OK=false;
    }}));
    return;
  }
},true);
function openMerchantThen(fn){renderMerchant();fn();}

// ================= READS: words, not numbers =================
function readClue(a){return a>=0.9?'Clear as day':a>=0.8?'Pretty sure':a>=0.7?'Probably':a>=0.6?'Maybe':a>=0.5?'Just a hunch':'Wild guess';}
RULES.read=['🔮','Reading the opponent',['Before each round you get a read on their next move. How sure you are shows as a clue: Clear as day, Pretty sure, Probably, Maybe, Just a hunch, or Wild guess.','The surer the clue, the more often the read is right. Higher IQ and charisma than them, a Tactical stance, scouting reports and some gear make reads clearer. Tricksters and trash talkers are harder to read.']];
