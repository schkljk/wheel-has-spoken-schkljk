// ================= REAL NUMBERS: stat blocks, modifiers, and every change shown =================
const NS_META=[['hp','❤️','HP'],['atk','⚔️','Attack'],['pow','✨','Power'],['def','🛡️','Defense'],['spd','💨','Speed'],['crit','🎯','Crit','%'],['dodge','🌀','Dodge','%'],['cha','💬','Charisma']];
function hpTxt(p){if(!F)return p+'%';const mx=numStats(F).hp;return `${Math.max(0,Math.round(p/100*mx))}/${mx}`;}
function numBlock(f){
  const n=numStats(f);
  return `<div class="numblock">${NS_META.filter(([k])=>n[k]!=null).map(([k,e,l,u])=>`<div class="nb-i" role="button" tabindex="0" data-info="rule|numstats"><span>${e}</span><b>${n[k]}${u||''}</b><small>${l}</small></div>`).join('')}</div>`;
}
// what a rolled stat does to the real numbers, shown next to it
function modTxt(k,v){
  const p=x=>`${x>=0?'+':'−'}${Math.abs(Math.round(x))}%`;
  if(k==='str')return p((Math.pow(1.17,0.6*(v-6))-1)*100)+' Attack';
  if(k==='wm')return p((Math.pow(1.17,0.4*(v-6))-1)*100)+' Attack';
  if(k==='dur')return p((Math.pow(1.17,v-6)-1)*100)+' Defense';
  if(k==='pm')return p((Math.pow(1.17,0.75*(v-6))-1)*100)+' Power';
  if(k==='iq')return p((v-6)*0.8)+' crit, reads';
  if(k==='spd')return `${4*v} Speed`;
  if(k==='cha')return p((v-6)*0.4)+' crit, haggling';
  return '';
}
Object.assign(RULES,{numstats:['📊','Your numbers',['Level sets the base, about 12% more per level, shaped by your Growth wheel. Rolled stats are modifiers on top: Strength and weapon mastery raise Attack, Durability raises Defense, Power mastery raises Power.','Damage comes from Attack (or Power) against the target\'s Defense, so a higher level hits harder and takes less. Gear, talents and traits add to the numbers too.','Whenever something changes your numbers, a popup shows exactly what went up or down.']],
  growth:['📈','Growth',['How a fighter grows with levels. Early bloomers start strong and grow slower, late bloomers start weak and grow faster, and prodigies are good at both.']]});
// ---------- every change to your numbers pops up ----------
let statPopT=null;
function statWatch(){
  if(!F||!F.career)return;
  let n;try{n=numStats(F);}catch(e){return;}
  const prev=F._ns;F._ns=n;
  if(!prev||prev._cid!==F.cid){F._ns._cid=F.cid;return;}
  F._ns._cid=F.cid;
  const ch=NS_META.filter(([k])=>n[k]!=null&&prev[k]!=null&&n[k]!==prev[k]);
  if(!ch.length)return;
  showStatPop(ch.map(([k,e,l,u])=>({e,l,u:u||'',a:prev[k],b:n[k]})));
}
function showStatPop(rows){
  let el=document.getElementById('statPop');
  if(!el){el=document.createElement('div');el.id='statPop';el.className='statpop';document.body.appendChild(el);}
  el.innerHTML=`<b class="sp-h">📊 Stats changed</b>${rows.map(r=>{const d=r.b-r.a;return `<div class="sp-r ${d>0?'up':'down'}"><span>${r.e} ${r.l}</span><span class="sp-v"><s>${r.a}${r.u}</s> → <b data-to="${r.b}" data-from="${r.a}">${r.a}</b>${r.u} <em>${d>0?'+':'−'}${Math.abs(d)}${r.u}</em></span></div>`;}).join('')}`;
  el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  // count the numbers up (or down)
  el.querySelectorAll('[data-to]').forEach(b=>{const a=+b.dataset.from,z=+b.dataset.to,t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/600);b.textContent=Math.round(a+(z-a)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step);};requestAnimationFrame(step);});
  clearTimeout(statPopT);statPopT=setTimeout(()=>el.classList.remove('show'),3800);
}
document.addEventListener('click',e=>{if(e.target.closest('#statPop'))e.target.closest('#statPop').classList.remove('show');});

function hudHpTxt(i){const f=i===0?F:curOppF;if(!f)return '';const mx=Math.round((f.maxHp||100)*LS(f));let p=100;
  if(i===0){if(T&&T.story&&F.story)p=F.story.hp;else if(T&&T.rush&&typeof BR!=='undefined'&&BR)p=BR.hp;if(F.next&&F.next.halfHp)p=Math.ceil(p/2);}
  return `${Math.max(1,Math.round(p/100*mx))}/${mx} HP`;}
function pctHp(p){if(!F)return p+'% HP';return `${p}% HP (+${Math.round(p/100*numStats(F).hp)})`;}
