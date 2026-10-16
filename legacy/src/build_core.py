s=open('v3.html').read()
a=s.index('// ===== CORE START ====='); b=s.index('// ===== CORE END =====')
core=s[a:b]
def rep_between(txt,start,end,new,keep_end=True):
    i=txt.index(start); j=txt.index(end,i)
    return txt[:i]+new+(txt[j:] if keep_end else txt[j+len(end):])
add=open('core_add.js').read()
core=rep_between(core,'const TW=','const RACES=[',open('core_tiers.js').read())
core=core.replace('while(it.v<3&&n++<8)','while(it.v<4&&n++<8)')
i=core.index('const NA=');core=core[:i]+open('core_names.js').read()
core=rep_between(core,'const MOD_SRC=','function activePower',add+'\n'+open('core_add2.js').read()+'\n'+open('core_add3.js').read()+'\n'+open('core_add4.js').read()+'\n'+open('core_add5.js').read()+'\n'+open('core_add6.js').read()+'\n'+open('core_add7.js').read()+'\n'+open('core_add8.js').read()+'\n'+open('core_add9.js').read()+'\n'+open('core_add10.js').read()+'\n')
newApply='''function applyBonus(f,it){
  f.boons.push(it);
  const KS=['str','spd','dur','iq','wm','pm'];
  const add=(k,n)=>{f.bonus[k]=(f.bonus[k]||0)+n;};
  if(KS.includes(it.k))add(it.k,1);
  else if(it.k==='str2')add('str',2);
  else if(it.k==='dur2')add('dur',2);
  else if(it.k==='all')KS.forEach(k=>add(k,2));
  else if(it.k==='all1')KS.forEach(k=>add(k,1));
  else if(it.k==='curse')KS.forEach(k=>add(k,-1));
  else if(it.k==='relic'){add('str',2);add('iq',-2);}
  else if(it.k==='cure')f.weak=CURED;
  f._win=null;
}
function levelUp(f,n){const pool=LEVELUP.filter(x=>!x.respin);for(let i=0;i<n;i++)applyBonus(f,pool[pickW(pool)]);f.lvl=(f.lvl||1)+n;}
'''
core=rep_between(core,'function applyBonus(f,it){','const fullName=',newApply)
eng=open('engine.js').read()
core=rep_between(core,'// ---- battle engine ----','function verdict(',eng+'\n')
open('core_new.js','w').write(core)
print(len(core.splitlines()),'lines')
