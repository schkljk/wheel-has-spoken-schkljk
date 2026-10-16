// ---- v22: a five-branch talent tree with ranks and tiers ----
// each branch has 12 talents in 6 tiers. Tier t needs 2*(t-1) points spent in that branch and level 3*(t-1)+1.
const TREE=[
  {k:'off',n:'Offense',e:'⚔️',col:'#E5484D',t:[
    ['sharp','Sharp eye','🎯',3,{fx:{critB:.03}},'+3% crit per rank'],
    ['heavy','Heavy hands','👊',3,{fx:{strikeX:1.05}},'Strikes 5% harder per rank'],
    ['brute','Brute force','💪',3,{m:{str:1}},'+1 strength per rank'],
    ['wmast','Weapon master','🗡️',3,{m:{wm:1}},'+1 weapon mastery per rank'],
    ['twin','Twin strikes','⚡',2,{fx:{extra:.05}},'+5% extra hit chance per rank'],
    ['killer','Killer instinct','🩸',2,{fx:{dmgX:1.05}},'+5% damage on everything per rank'],
    ['finisher','Finisher','💥',2,{fx:{ultX:1.12}},'Signature move 12% harder per rank'],
    ['bloodlust','Bloodlust','😡',1,{fx:{rage:45}},'Hits 35% harder below 45 HP'],
    ['opening','Opening strike','🏁',1,{fx:{firstStrike:1}},'Always act first in round 1'],
    ['fury','Desperate fury','🔥',2,{fx:{clutchX:1.15}},'+15% damage below 25 HP per rank'],
    ['berserk','Berserk','🌋',1,{fx:{dmgX:1.1,dr:-0.05}},'+10% damage, take 5% more'],
    ['legend','Legendary blow','🌟',1,{m:{str:2},fx:{ultX:1.3}},'Capstone: +2 strength, signature 30% harder']]},
  {k:'def',n:'Defense',e:'🛡️',col:'#2DD4BF',t:[
    ['tough','Tough','🧱',3,{m:{dur:1}},'+1 durability per rank'],
    ['iguard','Iron guard','🛡️',2,{fx:{guardAdd:-0.05}},'Guards block 5% more per rank'],
    ['hide','Thick hide','🦏',2,{fx:{bluntDR:.1}},'Take 10% less from blunt hits per rank'],
    ['regen','Regenerate','💚',2,{fx:{regen:2}},'Heal 2 every round per rank'],
    ['unbreak','Unbreakable','💎',3,{fx:{dr:.03}},'Take 3% less damage per rank'],
    ['counter','Counterweight','🔁',2,{fx:{counterB:.1}},'Counters 10% harder per rank'],
    ['wind','Second wind','💨',1,{fx:{revive:20}},'Get back up once with 20 HP'],
    ['antidote','Antidote','🧪',1,{fx:{immune:1}},'Immune to poison'],
    ['ration','Hidden ration','🍖',1,{fx:{snack:25}},'Eat below 30 HP: heal 25'],
    ['wall','Shield wall','🧱',2,{fx:{guardAdd:-0.06,counterB:.05}},'Guards block 6% more and counter more per rank'],
    ['stubborn','Stubborn','🪨',1,{fx:{revive:35}},'Get back up once with 35 HP'],
    ['fortress','Fortress','🏰',1,{m:{dur:2},fx:{dr:.06}},'Capstone: +2 durability, take 6% less damage']]},
  {k:'tac',n:'Tactics',e:'🧠',col:'#9C8BFF',t:[
    ['read','Read the room','🔮',3,{fx:{readB:.05}},'Read opponents 5% better per rank'],
    ['iq','Mastermind','🧠',3,{m:{iq:1}},'+1 IQ per rank'],
    ['quick','Quick start','⚡',2,{fx:{startEn:10}},'+10 starting energy per rank'],
    ['foot','Footwork','👟',3,{m:{spd:1}},'+1 speed per rank'],
    ['momentum','Momentum','🔄',3,{fx:{enRegen:3}},'+3 energy every round per rank'],
    ['evade','Evasion','🌀',3,{fx:{dodgeB:.03}},'+3% dodge per rank'],
    ['trash','Trash talk','🗯️',1,{fx:{taunt:1}},'Opponents read you worse and start with less energy'],
    ['patience','Patience','⏳',2,{fx:{behindX:1.1}},'+10% damage while behind per rank'],
    ['combo','Combo artist','🎼',2,{fx:{extra:.05}},'+5% extra hit chance per rank'],
    ['firstmove','First move','🏃',1,{fx:{firstStrike:1}},'Always act first in round 1'],
    ['owl','Night vision','🦉',2,{fx:{darkX:1.12}},'+12% damage in dark arenas per rank'],
    ['gm','Grandmaster','♟️',1,{m:{iq:1},fx:{readB:.12}},'Capstone: +1 IQ, read 12% better']]},
  {k:'spi',n:'Spirit',e:'✨',col:'#F2B544',t:[
    ['focus','Inner focus','✨',3,{m:{pm:1}},'+1 power mastery per rank'],
    ['overflow','Overflow','🔋',2,{fx:{startEn:15}},'+15 starting energy per rank'],
    ['flow','Arcane flow','🌊',2,{fx:{enRegen:4}},'+4 energy every round per rank'],
    ['affinity','Elemental affinity','🔥',2,{fx:{ultX:1.1}},'Signature 10% harder per rank'],
    ['drain','Life drain','🩸',3,{fx:{drain:.04}},'Hits heal 4% of damage per rank'],
    ['venom','Venom','🐍',2,{fx:{venom:2}},'Poison the opponent a little more per rank'],
    ['ward','Spirit ward','🪬',2,{fx:{dr:.03}},'Take 3% less damage per rank'],
    ['soul','Soul link','💞',2,{fx:{regen:2}},'Heal 2 every round per rank'],
    ['companion','Spirit companion','🦊',1,{fx:{pet:{e:'🦊',n:'spirit fox',x:0.7}}},'A spirit fox attacks every round'],
    ['stalker','Night stalker','🌑',2,{fx:{darkX:1.12}},'+12% damage in dark arenas per rank'],
    ['guide','Spirit guide','👻',1,{fx:{readB:.08,dodgeB:.04}},'Read 8% better, +4% dodge'],
    ['ascend','Ascension','👼',1,{m:{pm:2},fx:{ultX:1.15}},'Capstone: +2 power mastery, signature 15% harder']]},
  {k:'for',n:'Fortune',e:'🍀',col:'#7CB342',t:[
    ['lucky','Lucky','🍀',3,{fx:{critB:.03}},'+3% crit per rank'],
    ['bargain','Bargain hunter','🏷️',3,{econ:'shop'},'Shops and merchants 4% cheaper per rank'],
    ['slippery','Slippery','🧈',2,{fx:{dodgeB:.03}},'+3% dodge per rank'],
    ['scavenger','Scavenger','🪙',3,{econ:'coins'},'+2 coins after every story win per rank'],
    ['treasure','Treasure sense','💎',2,{econ:'loot'},'Epic and better loot 15% more likely per rank'],
    ['fame','Fame seeker','⭐',2,{econ:'fame'},'+10% fame per rank'],
    ['break','Lucky break','🎲',1,{fx:{revive:15}},'Get back up once with 15 HP'],
    ['favor','Wheel favor','🎡',2,{fx:{extra:.04}},'+4% extra hit chance per rank'],
    ['comeback','Comeback kid','🔄',2,{fx:{behindX:1.12}},'+12% damage while behind per rank'],
    ['medic','Field medic','🩹',2,{econ:'heal'},'Bandages and rations heal 10 more per rank'],
    ['jackpot','Jackpot','💰',1,{fx:{critB:.08}},'+8% crit'],
    ['golden','Golden touch','👑',1,{econ:'gold',fx:{critB:.04}},'Capstone: +25% coins from story wins, +4% crit']]}
];
const TNODE={};
TREE.forEach(br=>br.t.forEach((x,i)=>{TNODE[br.k+'_'+x[0]]={key:br.k+'_'+x[0],br:br.k,k:x[0],n:x[1],e:x[2],max:x[3],eff:x[4],d:x[5],tier:Math.floor(i/2)+1};}));
const TIER_LVL=t=>3*(t-1)+1, TIER_PTS=t=>2*(t-1);
const OLD_TAL={o1:'off_sharp',o2:'off_heavy',o3:'off_finisher',o4:'off_killer',d1:'def_tough',d2:'def_iguard',d3:'def_wind',d4:'def_unbreak',t1:'tac_read',t2:'tac_quick',t3:'tac_momentum',t4:'tac_iq'};
function talMap(f){
  if(!f)return {};
  if(Array.isArray(f.talents)){const m={};for(const k of f.talents){const n=OLD_TAL[k];if(n)m[n]=(m[n]||0)+1;}f.talents=m;}
  return f.talents||{};
}
const talRank=(f,key)=>talMap(f)[key]||0;
function talEcon(f,kind){let r=0;for(const [key,rank] of Object.entries(talMap(f))){const n=TNODE[key];if(n&&n.eff.econ===kind)r+=rank;}return r;}
function branchPts(f,br){let s=0;for(const [key,rank] of Object.entries(talMap(f)))if(key.startsWith(br+'_'))s+=rank;return s;}
// scale a talent's effect by its rank
talentsOf=function(f){
  const out=[];
  for(const [key,rank] of Object.entries(talMap(f))){
    const n=TNODE[key];if(!n||!rank)continue;
    const e=n.eff,o={};
    if(e.m){o.m={};for(const k in e.m)o.m[k]=e.m[k]*rank;}
    if(e.fx){o.fx={};for(const k in e.fx){const v=e.fx[k];
      if(T_MUL.includes(k))o.fx[k]=Math.pow(v,rank);
      else if(T_ADD.includes(k))o.fx[k]=v*rank;
      else o.fx[k]=v;}}
    out.push(o);
  }
  return out;
};
// legacy perks give career fighters a small permanent edge
MOD_SRC.push('lfx');
{const _tr3=traitsOf;traitsOf=function(f){const t=_tr3(f);const x=f.lfx&&f.lfx.fx;if(x)for(const k of T_ADD)if(x[k])t[k]+=x[k];return t;};}
