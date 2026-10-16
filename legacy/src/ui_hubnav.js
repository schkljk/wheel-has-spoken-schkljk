// ================= NAVIGATION: every way to play in one place, tabs along the bottom =================
{
  const t=document.querySelector('.hubtabs [data-tab="story"]');if(t)t.innerHTML='<span>🎮</span>Play';
  const ev=document.querySelector('.hubtabs [data-tab="events"]');if(ev)ev.hidden=true;
  const g=document.querySelector('.hubtabs [data-tab="goals"]'),f=document.querySelector('.hubtabs [data-tab="fighter"]');
  if(g&&f)f.after(g);
}
// the Play tab: story first, then everything else
function playLayout(){
  const st=document.getElementById('tab-story');if(!st)return;
  const modes=document.getElementById('modeList'),tiers=document.getElementById('tierList');
  let more=document.getElementById('playMore');
  if(!more){more=document.createElement('div');more.id='playMore';}
  st.appendChild(more);
  more.innerHTML='';
  if(modes)more.appendChild(modes);
  if(tiers){const h=document.createElement('span');h.className='sec-label';h.textContent='Cups and the gauntlet';more.appendChild(h);more.appendChild(tiers);}
  const lede=document.querySelector('#tab-events .tab-lede');if(lede)lede.remove();
  // stagger the cards in
  [...st.querySelectorAll(':scope > *, #playMore > *, #modeList > *, #tierList > *')].forEach((el,i)=>{el.style.setProperty('--d',Math.min(i,12)*40+'ms');el.classList.add('rise');});
}
{const _st=setHubTab;setHubTab=function(t){if(t==='events')t='story';_st(t);const p=document.getElementById('tab-'+t);if(p)[...p.children].forEach((el,i)=>{el.style.setProperty('--d',Math.min(i,10)*40+'ms');el.classList.remove('rise');void el.offsetWidth;el.classList.add('rise');});};}
// the base shop is one of the modes too
{const _rm=renderModes;renderModes=function(){_rm();const m=document.getElementById('modeList');if(!m)return;
  const h=m.querySelector('h3.gear-h');if(h)h.remove();
  m.insertAdjacentHTML('afterbegin','<span class="sec-label">More ways to play</span>');
  m.insertAdjacentHTML('beforeend',`<button class="mode" data-mode="shop"><span class="mo-e">🛒</span><span><b>Base shop</b><small>${baseOpen()?'Supplies, one daily deal, gear priced like rent':'Closed. Finish the chapter, then shop'}</small></span></button>`);};}
document.addEventListener('click',e=>{if(e.target.closest('[data-mode="shop"]'))$('#shopBtn').click();});

// ================= FEEL: ripples on every press, counters that roll =================
const PRESSABLE='.btn,.mode,.tier,.fchip,.menu-i,.ch-opt,.buy,.tt-node,.tt-tab,.arm-slot,.hubtabs button,.slot,.coinchip,.mnode,.kitmv,.nb-i';
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest(PRESSABLE);if(!b||b.disabled)return;
  const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*2.2;
  const rp=document.createElement('span');rp.className='ripple';rp.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;
  b.appendChild(rp);setTimeout(()=>rp.remove(),600);
},{passive:true});
// coins bump when they change (the counter itself already rolls)
{let last=null;setInterval(()=>{const c=document.getElementById('coinChip');if(!c||c.hidden)return;if(last!==null&&DB.coins!==last){c.classList.remove('bump','gain','spend');void c.offsetWidth;c.classList.add('bump',DB.coins>last?'gain':'spend');setTimeout(()=>c.classList.remove('gain','spend'),700);}last=DB.coins;},200);}
