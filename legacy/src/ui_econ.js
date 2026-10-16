// ================= ECONOMY: gems, haggling, the base shop, story merchants =================
STATN.cha='Charisma';
Object.assign(STAT_INFO,{cha:['✨','Charisma','How much the crowd and everyone else loves this fighter. Higher charisma reads opponents a bit better, crits a little more, starts fights with extra energy, makes haggling succeed far more often, and nudges some wheels toward flashy results.']});
Object.assign(RULES,{
  gems:['💎','Gems',['A rare currency earned only from hard fights: elites, bosses, boss rush, tournament finals, legend challenges and the daily challenge.','Gems buy premium gear in the base shop. You can also buy that gear with coins, but the coin price is absurd on purpose.']],
  haggle:['🤝','Haggling',['Ask for 10%, 25%, 40% or 60% off. The more you ask for, the less likely it works.','Charisma matters most. Bards, streamers and gamblers are natural hagglers, Professional Yappers talk their way in, trash talkers annoy people, and the Bargain hunter talent helps.','If it fails, prices go up for that visit. Merchants let you haggle once per visit; the base shop once per day.']],
  base:['🏠','Your base',['The fighter page is your base. Its shop sells basics, a daily gear deal, premium gear and services.','You can only shop at base between chapters: once a chapter has started, use the merchants you meet on the map instead.']]
});
for(const c of CONTRACTS)c.coins=Math.max(3,Math.round(c.coins*0.6));
Object.assign(TIERK.local,{coins:3});Object.assign(TIERK.regional,{coins:6});Object.assign(TIERK.world,{coins:10});
// ---------- gems ----------
if(typeof DB.gems!=='number')DB.gems=0;
function awardGems(n,lines){if(!n)return;DB.gems=(DB.gems||0)+n;saveDB();if(lines)lines.push(`💎 +${n} ${n===1?'gem':'gems'}`);}
{const chip=document.createElement('button');chip.id='gemChip';chip.className='coinchip gemchip';chip.setAttribute('data-info','rule|gems');chip.hidden=true;document.getElementById('coinChip').after(chip);}
setInterval(()=>{const c=document.getElementById('coinChip'),g=document.getElementById('gemChip');if(!g)return;g.hidden=c.hidden;const v=String(DB.gems||0);if(g.dataset.v!==v){const up=g.dataset.v!=null&&+v>+g.dataset.v;g.dataset.v=v;g.textContent='💎 '+v;if(g.dataset.seen){g.classList.remove('bump','gain','spend');void g.offsetWidth;g.classList.add('bump',up?'gain':'spend');setTimeout(()=>g.classList.remove('gain','spend'),700);}g.dataset.seen=1;}},250);
// ---------- haggling ----------
function haggleChance(pct){
  const base={10:.85,25:.62,40:.4,60:.2}[pct];
  const cha=F?eff(F).cha:5,a=F&&F.arch&&F.arch.k;
  let b=clamp((cha-6)*0.035,-0.25,0.3);
  if(['bard','streamer','gambler'].includes(a))b+=0.08;
  if(F&&F.title&&F.title.n==='Professional Yapper')b+=0.05;
  if(F&&F.quirk&&F.quirk.k==='trash')b-=0.06;
  b+=0.03*talEcon(F,'shop')+0.03*lgLvl('merchant');
  return clamp(base+b,0.03,0.95);
}
function openHaggle(where,back){
  const opts=[10,25,40,60].map(p=>{const c=Math.round(haggleChance(p)*100);return {label:`Ask for ${p}% off`,sub:`${c}% chance it works. If not, prices go up ${Math.round(p/2)}%`,fn:()=>{
    const ok=Math.random()<c/100,mult=ok?1-p/100:1+p/200;
    if(where==='merchant'){F.story.hagMult=mult;F.story.hagDone=1;saveCareer();}else{DB.baseHag={date:todayKey(),mult};saveDB();}
    landSound(ok?3:0);toast(ok?`🤝 Deal! ${p}% off everything`:`😤 Not happening. Prices up ${Math.round(p/2)}%`);back();}};});
  opts.push({label:'Never mind',sub:'Keep the current prices',fn:back});
  askChoice({icon:'🤝',title:'Haggle',sub:`Your charisma: ${F.cha?F.cha.n:'Likeable'} (${eff(F).cha})`,body:'Pick how hard to push. You only get one try.',options:opts});
}
const baseHagMult=()=>DB.baseHag&&DB.baseHag.date===todayKey()?DB.baseHag.mult:1;
const hagMult=()=>F&&F.story&&F.story.hagMult||1;
// ---------- base shop: only between chapters ----------
const baseOpen=()=>!F||!F.story||F.story.row===0;
const basePrice=c=>Math.max(1,Math.round(priceOf(c)*baseHagMult()));
const BASIC=['bandage','drink','scout','charm'];
function dailyDeal(){
  if(!DB.deal||DB.deal.date!==todayKey()||DB.deal.cid!==(F&&F.cid)){
    const own=new Set(Object.values((F&&F.gear)||{}));
    const pickR=rs=>{const p=GEAR.filter(g=>rs.includes(g.r)&&!g.req&&!own.has(g.k));return p.length?pick(p).k:null;};
    DB.deal={date:todayKey(),cid:F&&F.cid,star:pickR(['epic','rare']),more:[pickR(['common']),pickR(['rare'])].filter(Boolean),sold:[]};saveDB();
  }
  return DB.deal;
}
let SHOP_TAB2='basics';
function renderShop(){
  const open=baseOpen();
  $('#shopCoins').innerHTML=`🪙 ${DB.coins}  💎 ${DB.gems||0}${baseHagMult()!==1?`. ${baseHagMult()<1?'🤝 Haggled: '+Math.round((1-baseHagMult())*100)+'% off today':'😤 Prices up '+Math.round((baseHagMult()-1)*100)+'% today'}`:''}`;
  const tabs=[['basics','🎒 Basics'],['deal','⭐ Deal'],['vault','💎 Premium'],['services','🧰 Services']].map(([k,n])=>`<button class="fchip${SHOP_TAB2===k?' on':''}" data-s2="${k}">${n}</button>`).join('');
  const lockNote=open?'':`<div class="lockbar">🔒 You're in the middle of chapter ${F.story.ch}. The base shop opens again once you finish it. Merchants on the map sell supplies on the road.</div>`;
  const dis=ok=>open&&ok?'':' disabled';
  let body='';
  if(SHOP_TAB2==='basics')body=BASIC.map(k=>{const i=ITEMK[k],p=basePrice(i.cost+3);return `<div class="shopitem"><span class="se">${i.e}</span><div class="st2"><b>${esc(i.n)}${F.bag&&F.bag[k]?` (have ${F.bag[k]})`:''}</b><small>${esc(i.d)}${flav(i.n)}</small></div><button class="buy" data-b2item="${k}"${dis(DB.coins>=p)}>${p} 🪙</button></div>`;}).join('');
  if(SHOP_TAB2==='deal'){const d=dailyDeal();const row=(k,star)=>{const g=GEARK[k];if(!g)return '';const sold=d.sold.includes(k),p=basePrice(Math.round(g.cost*(star?1.15:1.6)));return `<div class="shopitem r-${g.r}${star?' deal':''}"><span class="se">${g.e}</span><div class="st2"><b>${star?'⭐ ':''}${esc(g.n)}</b><small><span class="rar r-${g.r}">${RARITY[g.r].n} ${g.slot}</span> ${esc(g.d)}${flav(g.n)}${star?'. Today only: deal price':''}</small></div>${sold?'<span class="price">Sold</span>':`<button class="buy" data-b2gear="${k}" data-p="${p}"${dis(DB.coins>=p)}>${p} 🪙</button>`}</div>`;};
    body=`<p class="hint">One deal a day, plus two regular pieces. Legendary and mythic gear only come from loot.</p>`+row(d.star,1)+d.more.map(k=>row(k,0)).join('');}
  if(SHOP_TAB2==='vault')body=`<p class="hint">Premium gear. Earn 💎 gems from elites, bosses, finals and other hard fights.</p>`+GEAR.filter(g=>g.r==='premium').map(g=>{const own=F.gear&&F.gear[g.slot]===g.k,gp=GEM_PRICE[g.k],cp=g.cost;return `<div class="shopitem r-premium"><span class="se">${g.e}</span><div class="st2"><b>${esc(g.n)}</b><small><span class="rar r-premium">Premium ${g.slot}</span> ${esc(g.d)}${flav(g.n)}</small></div>${own?'<span class="price">Equipped</span>':`<div class="buy2"><button class="buy gem" data-b2prem="${g.k}" data-cur="gem"${dis((DB.gems||0)>=gp)}>${gp} 💎</button><button class="buy" data-b2prem="${g.k}" data-cur="coin"${dis(DB.coins>=cp)}>${cp} 🪙</button></div>`}</div>`;}).join('');
  if(SHOP_TAB2==='services'){
    const nT=Object.values(talMap(F)).reduce((a,b)=>a+b,0),gear=gearOf(F);
    const svc=[['physio','🩺','Physio','Cure all your injuries',8,(F.inj||[]).length>0],['respec','🔁','Talent respec',`Refund all ${nT} talent points`,20,nT>0],['box','🎁','Mystery box','A random piece of gear, any rarity. Usually common',16,true]];
    body=svc.map(([k,e,n,d,c,ok])=>{const p=basePrice(c);return `<div class="shopitem"><span class="se">${e}</span><div class="st2"><b>${n}</b><small>${esc(d)}</small></div><button class="buy" data-b2svc="${k}"${dis(ok&&DB.coins>=p)}>${p} 🪙</button></div>`;}).join('')
      +(gear.length?`<h3 class="gear-h">Sell gear</h3>`+gear.map(g=>`<div class="shopitem"><span class="se">${g.e}</span><div class="st2"><b>${esc(g.n)}</b><small>${RARITY[g.r]?RARITY[g.r].n:''} ${g.slot}. ${g.r==='premium'?'Premium gear sells for very little':'Sells for a third of its value'}</small></div><button class="buy" data-b2sell="${g.k}"${open?'':' disabled'}>+${sellValue(g)} 🪙</button></div>`).join(''):'');
  }
  const hag=open&&!(DB.baseHag&&DB.baseHag.date===todayKey())?`<button class="btn ghost sm hagbtn" data-b2hag="1">🤝 Haggle (once a day)</button>`:'';
  $('#shopList').innerHTML=`${lockNote}<div class="shop-tabs four">${tabs}</div>${body}${hag}`;
  $('#gearList').innerHTML='';
}
$('#shopList').addEventListener('click',e=>{
  const t=e.target.closest('[data-s2]');if(t){SHOP_TAB2=t.dataset.s2;tick();renderShop();e.stopImmediatePropagation();return;}
  if(!baseOpen())return;
  const h=e.target.closest('[data-b2hag]');if(h){openHaggle('base',()=>{closeChoice();renderShop();});return;}
  const it=e.target.closest('[data-b2item]');
  if(it&&!it.disabled){const i=ITEMK[it.dataset.b2item],p=basePrice(i.cost+3);if(DB.coins<p)return;DB.coins-=p;F.bag=F.bag||{};F.bag[i.k]=(F.bag[i.k]||0)+1;saveCareer();saveDB();landSound(2);toast(`${i.e} ${i.n} added to your bag`);renderShop();return;}
  const gb=e.target.closest('[data-b2gear]');
  if(gb&&!gb.disabled){const g=GEARK[gb.dataset.b2gear],p=+gb.dataset.p;if(DB.coins<p)return;DB.coins-=p;F.gear=F.gear||{};F.gear[g.slot]=g.k;F._win=null;markSeen('gear',g.n);DB.deal.sold.push(g.k);saveCareer();saveDB();landSound(3);toast(`${g.e} ${g.n} equipped`);renderShop();return;}
  const pb=e.target.closest('[data-b2prem]');
  if(pb&&!pb.disabled){const g=GEARK[pb.dataset.b2prem];if(pb.dataset.cur==='gem'){const gp=GEM_PRICE[g.k];if((DB.gems||0)<gp)return;DB.gems-=gp;}else{if(DB.coins<g.cost)return;DB.coins-=g.cost;}
    F.gear=F.gear||{};F.gear[g.slot]=g.k;F._win=null;markSeen('gear',g.n);saveCareer();saveDB();landSound(3);toast(`${g.e} ${g.n} equipped`);const r=pb.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2);renderShop();return;}
  const sl=e.target.closest('[data-b2sell]');
  if(sl&&!sl.disabled){const g=GEARK[sl.dataset.b2sell];DB.coins+=sellValue(g);delete F.gear[g.slot];F._win=null;saveCareer();saveDB();landSound(2);toast(`Sold ${g.n}`);renderShop();return;}
  const sv=e.target.closest('[data-b2svc]');if(!sv||sv.disabled)return;
  const k=sv.dataset.b2svc,p=basePrice({physio:8,respec:20,box:16}[k]);if(DB.coins<p)return;DB.coins-=p;
  if(k==='physio'){F.inj=[];F._win=null;toast('All patched up');}
  if(k==='respec'){const n=Object.values(talMap(F)).reduce((a,b)=>a+b,0);F.talents={};F.tp=(F.tp||0)+n;F._win=null;toast(`${pl(n,'point')} refunded`);}
  if(k==='box'){const W={junk:2.4,common:4,rare:1.8,epic:.6,legendary:.1,mythic:.015},rs=Object.keys(W),r=rs[pickW(rs.map(x=>({w:W[x]})))],g=pick(GEAR.filter(x=>x.r===r));markSeen('gear',g.n);toast(`${RARITY[g.r].n}: ${g.e} ${g.n}`);
    F.gear=F.gear||{};if(!F.gear[g.slot]){F.gear[g.slot]=g.k;F._win=null;}else if(F.gear[g.slot]!==g.k){saveCareer();saveDB();gearChoice(g,()=>renderShop());}}
  saveCareer();saveDB();landSound(2);renderShop();
},true);
// ---------- story merchants: their own stock and their own gear ----------
const itemPriceM=i=>Math.max(1,Math.round(priceOf(i.cost+2+F.story.ch)*hagMult()));
const gearPriceM=g=>Math.max(1,Math.round(priceOf(Math.round(g.cost*1.8+6*F.story.ch))*hagMult()));
function merchant(){
  const S=F.story;
  if(S.stockRow!==S.row){
    S.stock=shuffleArr(STORY_STOCK).slice(0,4);S.stockRow=S.row;S.hagMult=1;S.hagDone=0;
    const own=Object.values(F.gear||{}),rs=S.ch>=7?['rare','epic','legendary']:S.ch>=3?['common','rare','epic']:['common','rare'];
    S.gearOffers=shuffleArr(GEAR.filter(x=>!x.req&&rs.includes(x.r)&&!own.includes(x.k))).slice(0,2).map(g=>g.k);
    saveCareer();
  }
  renderMerchant();
}
function renderMerchant(){
  const S=F.story,M=MERCHANTS[S.ch-1];
  const rows=S.stock.map(k=>{const i=ITEMK[k],p=itemPriceM(i);return `<div class="shopitem"><span class="se">${i.e}</span><div class="st2"><b>${esc(i.n)}${F.bag[k]?` (have ${F.bag[k]})`:''}</b><small>${esc(i.d)}${flav(i.n)}</small></div><button class="buy" data-m2item="${k}"${DB.coins>=p?'':' disabled'}>${p} 🪙</button></div>`;}).join('');
  const gear=(S.gearOffers||[]).map(k=>{const g=GEARK[k],p=gearPriceM(g);return `<div class="shopitem r-${g.r}"><span class="se">${g.e}</span><div class="st2"><b>${esc(g.n)}</b><small><span class="rar r-${g.r}">${RARITY[g.r].n} ${g.slot}</span> ${esc(g.d)}${flav(g.n)}${F.gear[g.slot]?`. Replaces your ${esc(GEARK[F.gear[g.slot]].n.toLowerCase())}`:''}</small></div><button class="buy" data-m2gear="${k}"${DB.coins>=p?'':' disabled'}>${p} 🪙</button></div>`;}).join('');
  const hm=hagMult(),hag=!S.hagDone?`<button class="btn ghost sm" data-m2hag="1">🤝 Haggle</button>`:`<p class="hint" style="text-align:center">${hm<1?`🤝 Deal: ${Math.round((1-hm)*100)}% off everything`:`😤 Prices up ${Math.round((hm-1)*100)}%`}</p>`;
  setSheet(`<div class="ch-h"><span class="ch-i">${M[0]}</span><div><b>${M[1]}</b><small>${esc(M[2])}. 🪙 ${DB.coins}</small></div></div>${rows}${gear}${hag}<div class="row2"><button class="btn ghost sm" data-m2bag="1">🎒 Open bag</button><button class="btn ghost sm" data-close="map">Leave</button></div>`);
}
document.getElementById('choice').addEventListener('click',e=>{
  if(!F||!F.story)return;
  if(e.target.closest('[data-m2hag]')){openHaggle('merchant',renderMerchant);return;}
  if(e.target.closest('[data-m2bag]')){openBag();return;}
  const b=e.target.closest('[data-m2item]');
  if(b&&!b.disabled){const i=ITEMK[b.dataset.m2item],p=itemPriceM(i);if(DB.coins<p)return;DB.coins-=p;F.bag[i.k]=(F.bag[i.k]||0)+1;F.story.stock=F.story.stock.filter(k=>k!==i.k);saveCareer();saveDB();landSound(2);toast(`${i.e} ${i.n} is in your bag. Use it any time`);renderMerchant();return;}
  const g=e.target.closest('[data-m2gear]');
  if(g&&!g.disabled){const G=GEARK[g.dataset.m2gear],p=gearPriceM(G);if(DB.coins<p)return;DB.coins-=p;F.gear[G.slot]=G.k;F._win=null;markSeen('gear',G.n);F.story.gearOffers=F.story.gearOffers.filter(k=>k!==G.k);saveCareer();saveDB();landSound(3);toast(`${G.e} ${G.n} equipped`);renderMerchant();}
});

function sellValue(g){return g.r==='premium'?20:Math.max(1,Math.round(g.cost/3));}
