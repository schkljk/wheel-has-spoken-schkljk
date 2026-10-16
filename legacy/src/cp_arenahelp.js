const stageEl=()=>document.getElementById('stage');
const ftrEl=i=>document.getElementById('ftr'+i);
const bodyEl=i=>ftrEl(i).querySelector('.body');
function ctr(i){const s=stageEl().getBoundingClientRect(),b=bodyEl(i).getBoundingClientRect();return {x:b.left+b.width/2-s.left,y:b.top+b.height/2-s.top,top:b.top-s.top};}
function A(el,kf,opt){try{const a=el.animate(kf,opt);return a.finished.then(()=>{},()=>{});}catch(e){return wait(opt.duration||0);}}
function spawn(cls,text,x,y,size){const el=document.createElement('span');el.className=cls;el.textContent=text;el.style.left=x+'px';el.style.top=y+'px';if(size)el.style.fontSize=size+'px';document.getElementById('fxl').appendChild(el);return el;}
function floatAt(i,text,cls,dy){
  const c=ctr(i);const el=spawn('float '+(cls||''),text,c.x,Math.max(4,c.top-4-(dy||0)));
  A(el,[{transform:'translate(-50%,0) scale(.6)',opacity:0},{transform:'translate(-50%,-14px) scale(1.12)',opacity:1,offset:.22},{transform:'translate(-50%,-46px) scale(1)',opacity:0}],{duration:1000*SPF(),easing:'ease-out'}).then(()=>el.remove());
}
function tintFlash(k,dur){if(!k)return;const t=document.getElementById('tint');t.className='tint t-'+k;A(t,[{opacity:0},{opacity:.42},{opacity:0}],{duration:dur});}
function shakeEl(el,amp,dur){return A(el,[{transform:'translate(0,0)'},{transform:`translate(${-amp}px,0)`},{transform:`translate(${amp}px,0)`},{transform:`translate(${-amp*.6}px,0)`},{transform:`translate(${amp*.4}px,0)`},{transform:'translate(0,0)'}],{duration:dur});}
function popEmoji(i,emoji,dy,dur,dx){
  const c=ctr(i);const el=spawn('fxe',emoji,c.x+(dx||0),dy==='top'?c.top-8:c.y-(dy||0));
  return A(el,[{transform:'translate(-50%,-50%) scale(0)',opacity:0},{transform:'translate(-50%,-50%) scale(1.3)',opacity:1,offset:.3},{transform:'translate(-50%,-60%) scale(1)',opacity:1,offset:.75},{transform:'translate(-50%,-85%) scale(1)',opacity:0}],{duration:dur}).then(()=>el.remove());
}
function projectile(from,to,emoji,dur,o){
  o=o||{};const a=ctr(from),b=ctr(to);const dx=b.x-a.x,dy=b.y-a.y;
  const el=spawn('fxe',emoji,a.x,a.y,o.size);const arc=o.arc||0;const rot=o.spin?720*(dx>0?1:-1):0;
  if(o.trail&&!RM){
    // a fading streak follows the projectile
    for(let k=1;k<=5;k++)setTimeout(()=>{if(!el.isConnected)return;const r=el.getBoundingClientRect(),s=stageEl().getBoundingClientRect();const d=document.createElement('i');d.className='pt';d.style.width=d.style.height=(10-k)+'px';d.style.background=o.trail;d.style.left=(r.left+r.width/2-s.left)+'px';d.style.top=(r.top+r.height/2-s.top)+'px';document.getElementById('fxl').appendChild(d);A(d,[{transform:'translate(-50%,-50%) scale(1)',opacity:.85},{transform:'translate(-50%,-50%) scale(.2)',opacity:0}],{duration:300}).then(()=>d.remove());},dur*k/6);
  }
  return A(el,[{transform:'translate(-50%,-50%) translate(0px,0px) rotate(0deg)'},{transform:`translate(-50%,-50%) translate(${dx/2}px,${dy/2-arc}px) rotate(${rot/2}deg)`},{transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${rot}deg)`}],{duration:dur,easing:'ease-in'}).then(()=>el.remove());
}
function showBanner(text,dur,keep){
  const bn=document.getElementById('banner');bn.textContent=text;
  const kf=keep?[{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-50%) scale(1.12)',opacity:1,offset:.35},{transform:'translate(-50%,-50%) scale(1)',opacity:1}]
    :[{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-50%) scale(1.12)',opacity:1,offset:.25},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.7},{transform:'translate(-50%,-50%) scale(1.15)',opacity:0}];
  return A(bn,kf,{duration:dur,fill:keep?'forwards':'none'});
}
// swings the weapon arm of a drawn character by tweening its rotation
function armTo(i,angles,dur){
  const f=ftrEl(i);const g=f&&f.querySelector('.armw');
  if(!g||RM)return wait(0);
  const sx=g.dataset.sx,sy=g.dataset.sy,n=angles.length-1;
  return new Promise(res=>{
    const t0=performance.now();
    function fr(now){
      const t=Math.min(1,(now-t0)/dur),p=t*n,k=Math.min(n-1,Math.floor(p)),u=p-k;
      const e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
      const ang=angles[k]+(angles[k+1]-angles[k])*e;
      g.setAttribute('transform',`rotate(${ang.toFixed(1)} ${sx} ${sy})`);
      if(t<1)requestAnimationFrame(fr);else res();
    }
    requestAnimationFrame(fr);
  });
}
