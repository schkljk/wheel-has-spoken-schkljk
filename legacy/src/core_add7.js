// ---- v24: charisma, premium gear ----
TIERNAMES.cha=['Repellent','Awkward','Forgettable','Plain','Likeable','Charming','Magnetic','Captivating','Iconic','Legendary aura','Main character','Cult leader','Mythic rizz','The Wheel blushes'];
{
  const items=tiers('cha','cha','Charisma').map(it=>Object.assign(it,{w:fw(it.w)}));
  for(const it of items){
    it.o=[];
    if(it.v>=9)it.o.push({w:'chaos',n:['Crowd favorite','Main character'],x:2},{w:'title',n:['Main Event','Aura Farmer','Sigma','Him'],x:1.8},{w:'side',n:['Hired bard','Hype goblin'],x:1.6});
    if(it.v<=3)it.o.push({w:'chaos',n:['Cooked'],x:2},{w:'title',n:['NPC Energy','Skill Issue'],x:2},{w:'side',n:['Loyal rock'],x:2});
    it.d=it.v>=9?'Crowds love them: better reads, a little crit, extra starting energy and much better haggling':it.v<=3?'Nobody wants to look at them: worse reads and terrible haggling':'Affects reads, crits, starting energy and haggling a little';
  }
  SEQ.splice(SEQ.findIndex(w=>w.k==='iq')+1,0,{k:'cha',label:'Charisma',lc:'charisma',tier:true,items});
}
// who is naturally charming, or not
const CHA_M={race:{'Elf':1,'Vampire':2,'Kitsune':2,'Angel':1,'Catfolk':1,'Fairy':1,'Djinn':1,'Zombie':-2,'Mummy':-1,'Slime':-1,'Eldritch horror':-2,'Ogre':-1,'Clown':-1,'Rubber duck':1},
  arch:{bard:2,streamer:2,gambler:1,trickster:1,npc:-1,necro:-1},back:{influencer:2,childstar:1,royal:1,boyband:2,auditor:-1},title:{'Main Event':1,'Aura Farmer':2,'Sigma':1,'Him':1,'NPC Energy':-1,'Professional Yapper':1}};
for(const r of RACES)if(CHA_M.race[r.n]){r.m=Object.assign({},r.m,{cha:(r.m&&r.m.cha||0)+CHA_M.race[r.n]});}
for(const a of ARCHS)if(CHA_M.arch[a.k]){a.m=Object.assign({},a.m,{cha:(a.m&&a.m.cha||0)+CHA_M.arch[a.k]});}
for(const b of BACKS)if(CHA_M.back[b.k]){b.m=Object.assign({},b.m,{cha:(b.m&&b.m.cha||0)+CHA_M.back[b.k]});}
for(const t of TITLES)if(CHA_M.title[t.n]){t.m=Object.assign({},t.m,{cha:(t.m&&t.m.cha||0)+CHA_M.title[t.n]});}
// premium gear: bought with gems, or an absurd pile of coins
RARITY.premium={n:'Premium',q:3,c:'#4FC3F7'};
GEAR.push(
  G_('armor','premium','prismplate','Prismatic plate','🔷',2400,{m:{dur:3,cha:2},fx:{dr:.1,dodgeB:.04}},'+3 durability, +2 charisma, takes 10% less damage, +4% dodge'),
  G_('armor','premium','starcoat','Coat of a thousand stars','🌠',2600,{m:ALL(1),fx:{regen:4,revive:30}},'+1 to everything, heals 4 every round, gets back up once'),
  G_('trinket','premium','rizzcrown','Crown of rizz','💎',2200,{m:{cha:4},fx:{critB:.1,taunt:1}},'+4 charisma, +10% crit, taunts'),
  G_('trinket','premium','arenaheart','Heart of the arena','💗',2800,{m:{str:2,spd:2},fx:{enRegen:8,behindX:1.3}},'+2 strength, +2 speed, +8 energy every round, +30% damage while behind'),
  G_('boots','premium','cometboots','Comet boots','☄️',2300,{m:{spd:4},fx:{firstStrike:1,extra:.12}},'+4 speed, acts first, +12% extra hit chance'),
  G_('boots','premium','haloboots',"Gambler's halo boots",'🎲',2100,{m:{cha:2},fx:{critB:.12,dodgeB:.08}},'+2 charisma, +12% crit, +8% dodge')
);
for(const g of GEAR)GEARK[g.k]=g;
const GEM_PRICE={prismplate:32,starcoat:36,rizzcrown:28,arenaheart:40,cometboots:32,haloboots:28};
