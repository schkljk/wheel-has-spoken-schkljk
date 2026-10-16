// ---- v28: real numbers. Level sets the base, rolled stats are modifiers on top ----
const GROWTH=[
  {k:'steady',n:'Steady',e:'📈',w:6,q:1,s:1,g:1,d:'Grows at a normal pace'},
  {k:'early',n:'Early bloomer',e:'🌱',w:4,q:1,s:1.12,g:0.85,d:'Starts strong, grows a bit slower'},
  {k:'late',n:'Late bloomer',e:'🌳',w:4,q:2,s:0.9,g:1.25,d:'Starts weak, grows much faster'},
  {k:'plateau',n:'Plateau',e:'🏔️',w:3,q:0,s:1.1,g:0.7,d:'Strong start, then levels barely help'},
  {k:'prodigy',n:'Prodigy',e:'🌟',w:1.6,q:3,s:1.05,g:1.15,d:'Better start and faster growth'},
  {k:'unstop',n:'Unstoppable',e:'🚀',w:1,q:3,s:0.88,g:1.4,d:'A slow start, then nothing can stop them'}
].map(x=>Object.assign(x,{w:fw(x.w)}));
SEQ.splice(SEQ.findIndex(w=>w.k==='cha')+1,0,{k:'growth',label:'Growth',lc:'growth',items:GROWTH});
// the base every number grows from: 1 at level 1, about +12% per level
function LS(f){const g=(f&&f.growth)||{};const l=(f&&f.lvl)||1;return (g.s||1)*(1+0.12*(g.g||1)*(l-1));}
// the numbers a player sees. They mirror the fight math: Attack against Defense decides damage, level scales both
function numStats(f){
  const s=eff(f),tr=traitsOf(f),ls=LS(f);
  const wl=(f.arch.k==='brawler'&&f.weapon.fists?3:f.weapon.l)+(tr.wlvl||0);
  const off=0.6*s.str+0.4*s.wm+0.5*wl+(f.ench.l||0);
  const pw=f.power&&f.power.k!=='none'&&!f.power.passive?0.75*s.pm+0.25*s.iq+0.5*(f.power.l||0):null;
  const hpBase=(f.maxHp||100);
  return {
    hp:Math.round(hpBase*ls),
    atk:Math.round(10*ls*Math.pow(1.17,off-6)),
    pow:pw==null?null:Math.round(10*ls*Math.pow(1.17,pw-6)),
    def:Math.round(10*ls*Math.pow(1.17,s.dur-6)*(1+(tr.dr||0))),
    spd:Math.round(4*s.spd+2*((f.lvl||1)-1)),
    crit:Math.round(Math.min(60,(0.06+s.iq*0.008+((s.cha||5)-6)*0.004+(tr.critB||0))*100)),
    dodge:Math.round(Math.min(45,(0.03+s.spd*0.012+(tr.dodgeB||0))*100)),
    cha:Math.round((s.cha||5)*5)
  };
}
