// ---------- odds shaped by your history ----------
function karmaOf(f){let k=0;for(const W of SEQ){const v=f[W.k];if(v&&!v.skip&&W.k!=='reinc')k+=((v.q==null?1:v.q)-1.4);}return k;}
function playerOdds(W,f){
  const od=oddsFor(W,f);
  const list=od.list,reasons=od.reasons.slice();
  // no more hot or cold streak adjustments: every spin uses the same odds no matter how lucky you have been
  if(CX_CATS.has(W.k)){
    const last=new Set(DB.last),seen=DB.seen[W.k]||[];
    let hitL=false,hitC=false;
    const und=list.filter(e=>!seen.includes(cxKey(W.k,e.it,f)));
    list.forEach(e=>{
      const key=cxKey(W.k,e.it,f),id=W.k+'|'+key;
      if(last.has(id)){e.mult*=0.6;e.w*=0.6;hitL=true;}
      const c=DB.champIds[id];if(c){const m=Math.max(0.5,Math.pow(0.85,c));e.mult*=m;e.w*=m;hitC=true;}
    });
    if(und.length&&und.length<list.length){und.forEach(e=>{e.mult*=1.25;e.w*=1.25;});reasons.push({cls:'up',txt:'🔍 Undiscovered slices ×1.25'});}
    if(hitL)reasons.push({cls:'down',txt:'🔁 Your last fighter had it: ×0.6'});
    if(hitC)reasons.push({cls:'down',txt:'🏆 Past champion picks nerfed'});
  }
  return {list,reasons,karma:0};
}

