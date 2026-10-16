// ================= FIGHT SCREEN EXTRAS, SETTINGS, TUTORIAL =================
// a one-line scouting strip under the stage instead of a panel over the fighters
function compactScout(O,label){
  const AR=curArena||{},pct=Math.round(curOdds*100);
  const cls=pct>=60?'good':pct>=40?'even':'bad';
  $('#scout').innerHTML=`<div class="finfo">
    <span class="fi fi-odds ${cls}" role="button" tabindex="0" data-info="rule|verdict">${pct}% to win</span>
    <span class="fi" role="button" tabindex="0" data-info="rule|scale">📈 ${esc(powerScale(F).n)} vs ${esc(powerScale(O).n)}</span>
    ${AR.n?`<span class="fi" role="button" tabindex="0" data-info="${ik('arena',AR.n)}">${AR.e} ${esc(AR.d||AR.n)}</span>`:''}
    ${T&&T.story?`<span class="fi">❤️ ${fightMods(O)[0].hp} HP${O.maxHp?`, they have ${O.maxHp}`:''}</span>`:''}
    <button class="fi fi-card" id="scoutCard">${esc(O.name)}'s card</button>
  </div>`;
}
// forfeit needs two taps
let forfeitArm=0;
$('#forfeitBtn').addEventListener('click',e=>{
  if(!BT||ended)return;
  if(Date.now()-forfeitArm>3000){forfeitArm=Date.now();toast('Tap 🏳️ again to forfeit this fight');return;}
  forfeitArm=0;BT.over=true;BT.w=1;BT.P[0].hp=Math.min(BT.P[0].hp,0);skipFlag=true;
  if(!playing)finishFight();
});
$('#speedTog').addEventListener('click',()=>{$('#fastBtn').click();syncAuto();});
// ---------- settings ----------
function openSettings(){
  const row=(id,label,sub,on)=>`<button class="setrow" data-set="${id}" aria-pressed="${on}"><span><b>${label}</b><small>${sub}</small></span><i class="sw2${on?' on':''}"></i></button>`;
  setSheet(`<div class="ch-h"><span class="ch-i">⚙️</span><div><b>Settings</b><small>Saved on this device</small></div></div>
    ${row('sound','Sound','Wheel ticks, hits and fanfares',soundOn)}
    ${row('haptics','Vibration','Buzzes on big hits and spins, on phones that support it',DB.haptics!==false)}
    ${row('fast','Fast mode','Quicker spins and fight animations',fastMode)}
    ${row('auto','Auto-battle by default','Fights play themselves unless you switch it off',!!DB.autoDefault)}
    <div class="setgrp">
      <button class="menu-i" data-set="tutorial"><span>📘</span><b>How to play</b><small>A quick tour of the game</small></button>
      <button class="menu-i" data-set="export"><span>💾</span><b>Back up your save</b><small>Copy your save so you can restore it later</small></button>
      <button class="menu-i" data-set="import"><span>📥</span><b>Restore a save</b><small>Paste a backup you made earlier</small></button>
      <button class="menu-i danger" data-set="reset"><span>🗑️</span><b>Erase everything</b><small>All fighters, legacy and records. Tap twice</small></button>
    </div>
    <button class="btn ghost" data-close="1">Done</button>`);
}
let resetArm=0;
$('#choice').addEventListener('click',e=>{
  const b=e.target.closest('[data-set]');if(!b)return;
  const k=b.dataset.set;
  if(k==='sound'){$('#sndBtn').click();openSettings();}
  else if(k==='haptics'){DB.haptics=DB.haptics===false;saveDB();if(DB.haptics!==false)buzz(30);openSettings();}
  else if(k==='fast'){$('#fastBtn').click();openSettings();}
  else if(k==='auto'){DB.autoDefault=!DB.autoDefault;saveDB();openSettings();}
  else if(k==='tutorial'){closeChoice();tutorial(0);}
  else if(k==='export'){
    const data=localStorage.getItem(STORE)||'';
    setSheet(`<div class="ch-h"><span class="ch-i">💾</span><div><b>Your save</b><small>${Math.round(data.length/1024)} KB</small></div></div><p class="ch-body">It's copied to your clipboard if your browser allows it. You can also select the text below and copy it somewhere safe.</p><textarea class="savebox" readonly>${esc(data)}</textarea><button class="btn ghost" data-close="1">Done</button>`);
    try{navigator.clipboard.writeText(data).then(()=>toast('Save copied to your clipboard'),()=>{});}catch(err){}
  }
  else if(k==='import'){
    setSheet(`<div class="ch-h"><span class="ch-i">📥</span><div><b>Restore a save</b><small>This replaces everything on this device</small></div></div><textarea class="savebox" id="importBox" placeholder="Paste your backup here"></textarea><button class="btn" data-set="doimport">Restore it</button><button class="btn ghost" data-close="1">Cancel</button>`);
  }
  else if(k==='doimport'){
    const txt=($('#importBox').value||'').trim();
    try{const o=JSON.parse(txt);if(!o||typeof o!=='object'||!('coins' in o||'slots' in o))throw 0;localStorage.setItem(STORE,txt);toast('Save restored. Reloading…');setTimeout(()=>location.reload(),700);}
    catch(err){toast("That doesn't look like a save from this game");}
  }
  else if(k==='reset'){
    if(Date.now()-resetArm>3500){resetArm=Date.now();b.querySelector('b').textContent='Tap again to erase everything';return;}
    try{localStorage.removeItem(STORE);}catch(err){}
    location.reload();
  }
});
$('#setBtn').addEventListener('click',openSettings);
// ---------- first-launch tutorial ----------
const TUT=[
  ['🎡','Spin a fighter','Every part of your fighter comes from a wheel: race, class, stats, weapon, power, weakness and more. Flick the wheel with your finger or tap Spin. You get one free reroll per fighter.'],
  ['📖','Play the story','Five chapters, each a branching path of fights, rest spots and a boss. Your HP carries over between fights, and losing costs grit. Pick a reward after every win.'],
  ['⚔️','Fight with the combat wheel','Each round, read what your opponent is planning, pick a focus that counters it (Attack, Defend or Power), then spin for your move. When your energy is full, unleash your signature.'],
  ['🏆','Grow your fighters','Level up for wheel spins and talent points, earn fame to rank up, collect gear from loot spins, and keep up to three fighters. Retiring one earns legacy for the next.']
];
function tutorial(i){
  if(i>=TUT.length){DB.tut=1;saveDB();return;}
  const [e,t,d]=TUT[i];
  cine(`<div class="cine-kicker">How to play, ${i+1} of ${TUT.length}</div><div class="cine-emoji">${e}</div><h2 class="cine-title">${esc(t)}</h2><p class="cine-text">${esc(d)}</p><div class="tut-dots">${TUT.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>`,i<TUT.length-1?'Next':"Let's go",()=>tutorial(i+1));
}
setTimeout(()=>{if(!DB.tut&&!DB.slots.some(Boolean))tutorial(0);else if(!DB.tut){DB.tut=1;saveDB();}},400);
