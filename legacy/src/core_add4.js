// ---- v20: gear rarities and a boots slot, a sidekick wheel, more weapons, mutators ----
const RARITY={junk:{n:'Junk',q:0,c:'#8A8F99'},common:{n:'Common',q:1,c:'#B9B2CC'},rare:{n:'Rare',q:2,c:'#2DD4BF'},epic:{n:'Epic',q:2,c:'#B388FF'},legendary:{n:'Legendary',q:3,c:'#F2B544'},mythic:{n:'Mythic',q:3,c:'#FF4F8B'}};
const RARITY_ORDER=['junk','common','rare','epic','legendary','mythic'];
const GEAR_SLOTS=['armor','trinket','boots'];
for(const g of GEAR)g.r=g.k==='infinity'?'mythic':g.req||g.q>=3?'legendary':g.q>=2?'rare':'common';
const G_=(slot,r,k,n,e,cost,o,d)=>Object.assign({k,slot,r,n,e,cost,q:RARITY[r].q,d},o);
GEAR.push(
  // armor
  G_('armor','junk','cardboard','Cardboard armor','📦',2,{m:{dur:1,spd:-1}},'+1 durability, −1 speed. Soggy when wet'),
  G_('armor','junk','bubble','Bubble wrap suit','🫧',3,{fx:{bluntDR:.1}},'Takes 10% less from blunt hits. Pops a lot'),
  G_('armor','common','hoodie','Padded hoodie','🧥',5,{m:{dur:1}},'+1 durability'),
  G_('armor','common','hockey','Hockey pads','🏒',7,{m:{dur:1},fx:{counterB:.05}},'+1 durability, counters a bit more'),
  G_('armor','rare','riot','Riot gear','🛡️',14,{m:{dur:2},fx:{guardAdd:-0.05}},'+2 durability, guards block 5% more'),
  G_('armor','rare','wetsuit','Wetsuit','🤿',12,{m:{dur:1,spd:1}},'+1 durability, +1 speed'),
  G_('armor','epic','shadowcloak','Shadow cloak','🌑',24,{m:{spd:2},fx:{dodgeB:.08}},'+2 speed, +8% dodge'),
  G_('armor','epic','thornmail','Thornmail','🌵',26,{m:{dur:2},fx:{counterB:.25}},'+2 durability, counters 25% harder'),
  G_('armor','epic','mirrorplate','Mirror plate','🪞',28,{m:{dur:2},fx:{readB:.1}},'+2 durability, reads 10% better'),
  G_('armor','legendary','bulwark','Titan bulwark','🏰',50,{m:{dur:4,spd:-1},fx:{dr:.08}},'+4 durability, −1 speed, takes 8% less damage'),
  G_('armor','legendary','phoenixrobe','Phoenix robe','🔥',55,{fx:{revive:30,regen:2}},'Gets back up once with 30 HP, heals 2 every round'),
  G_('armor','mythic','wheelarmor','Armor of the Wheel','🎡',110,{m:ALL(2),fx:{dr:.05}},'+2 to everything, takes 5% less damage'),
  // trinkets
  G_('trinket','junk','penny','Lucky penny (not lucky)','🪙',1,{},'Does nothing. Shiny though'),
  G_('trinket','junk','trophy','Participation trophy','🏅',3,{fx:{enRegen:2}},'+2 energy every round. Everyone gets one'),
  G_('trinket','common','rabbit','Rabbit foot','🐇',6,{fx:{critB:.05}},'+5% crit'),
  G_('trinket','common','proteinbar','Protein bar','🍫',6,{fx:{snack:20}},'Eats it below 30 HP and heals 20'),
  G_('trinket','common','whistle','Referee whistle','📯',7,{fx:{taunt:1}},'Blows it constantly: taunts'),
  G_('trinket','rare','fang','Vampire fang','🦷',15,{fx:{drain:.08}},'Hits heal 8% of the damage'),
  G_('trinket','rare','hourglass','Hourglass','⏳',14,{fx:{startEn:30}},'Starts fights with +30 energy'),
  G_('trinket','rare','thirdeye','Third eye','👁️',16,{m:{iq:1},fx:{readB:.15}},'+1 IQ, reads 15% better'),
  G_('trinket','rare','warpaint','War paint','🎨',13,{fx:{strikeX:1.1}},'Strikes hit 10% harder'),
  G_('trinket','epic','dragonheart','Dragon heart','❤️‍🔥',28,{m:{str:2},fx:{rage:45}},'+2 strength, hits 35% harder below 45 HP'),
  G_('trinket','epic','stormjar','Storm in a jar','⛈️',26,{m:{pm:2},fx:{enRegen:4}},'+2 power mastery, +4 energy every round'),
  G_('trinket','epic','idol','Cursed idol','🗿',22,{m:{str:3,iq:-2}},'+3 strength, −2 IQ. Whispers at night'),
  G_('trinket','epic','clover','Four-leaf clover','🍀',30,{fx:{critB:.12,dodgeB:.05}},'+12% crit, +5% dodge'),
  G_('trinket','legendary','crown','Champion crown','👑',60,{m:ALL(1),fx:{startEn:20}},'+1 to everything, +20 starting energy'),
  G_('trinket','legendary','sands','Sands of time','⌛',55,{fx:{firstStrike:1,extra:.1}},'Acts first in round 1, +10% extra hit chance'),
  G_('trinket','mythic','goldenwheel','The Golden Wheel','🌟',120,{m:ALL(1),fx:{critB:.15,revive:40}},'+1 to everything, +15% crit, gets back up once with 40 HP'),
  // boots
  G_('boots','junk','crocs','Crocs in sport mode','🐊',2,{m:{spd:1,dur:-1}},'+1 speed, −1 durability'),
  G_('boots','junk','socks','Socks on hardwood','🧦',2,{fx:{dodgeB:.03},m:{str:-1}},'+3% dodge, −1 strength. Slippery'),
  G_('boots','common','runners','Running shoes','👟',6,{m:{spd:1}},'+1 speed'),
  G_('boots','common','steeltoe','Steel-toe boots','🥾',6,{m:{str:1,spd:-1}},'+1 strength, −1 speed'),
  G_('boots','rare','tabi','Ninja tabi','🥷',14,{m:{spd:2}},'+2 speed'),
  G_('boots','rare','spring','Spring boots','🦘',12,{fx:{dodgeB:.06}},'+6% dodge'),
  G_('boots','rare','kickboots','Kick boots','🦵',15,{m:{str:1},fx:{strikeX:1.08}},'+1 strength, strikes 8% harder'),
  G_('boots','epic','rocket','Rocket boots','🚀',28,{m:{spd:3},fx:{firstStrike:1}},'+3 speed, acts first in round 1'),
  G_('boots','epic','grounding','Grounding boots','⚡',24,{m:{dur:2},fx:{immune:1}},'+2 durability, immune to poison'),
  G_('boots','legendary','sevenleague','Seven-league boots','🌍',55,{m:{spd:4},fx:{dodgeB:.06}},'+4 speed, +6% dodge'),
  G_('boots','mythic','laststep','Boots of the Last Step','🌌',100,{m:{spd:3},fx:{dodgeB:.1,clutchX:1.4}},'+3 speed, +10% dodge, +40% damage below 25 HP')
);
for(const g of GEAR)GEARK[g.k]=g;
gearOf=function(f){return f&&f.gear?GEAR_SLOTS.map(s=>GEARK[f.gear[s]]).filter(Boolean):[];};
randomGear=function(f,n){f.gear=f.gear||{};const slots=shuffleArr(GEAR_SLOTS).slice(0,n);for(const s of slots){const opts=GEAR.filter(g=>g.slot===s&&!g.req&&['common','rare','epic'].includes(g.r));f.gear[s]=pick(opts).k;}f._win=null;};

// ---- a new wheel: who has your back ----
const SIDEKICKS=[
  {k:'none',n:'Flying solo',e:'🚶',w:8,q:0,d:'No sidekick. More glory for you'},
  {k:'dog',n:'Attack dog',e:'🐕',w:4,q:2,fx:{pet:{e:'🐕',n:'attack dog',x:1}},d:'Bites the opponent every round'},
  {k:'pigeon',n:'Messenger pigeon',e:'🕊️',w:4,q:1,fx:{readB:.1},d:'Brings intel: reads 10% better'},
  {k:'goblin',n:'Hype goblin',e:'📣',w:4,q:1,fx:{enRegen:6},d:'+6 energy every round'},
  {k:'medic',n:'Medic slime',e:'🧪',w:3,q:2,fx:{regen:3},d:'Heals 3 every round'},
  {k:'dragon',n:'Tiny dragon',e:'🐉',w:1.5,q:3,fx:{pet:{e:'🐉',n:'tiny dragon',x:1.4}},d:'Breathes fire on the opponent every round'},
  {k:'ex',n:'Ghost of your ex',e:'👻',w:3,q:1,fx:{taunt:1},d:'Haunts the opponent: taunts'},
  {k:'rock',n:'Loyal rock',e:'🪨',w:4,q:0,d:'It believes in you. Does nothing'},
  {k:'cat',n:'Judgmental cat',e:'🐈‍⬛',w:3,q:1,fx:{critB:.06},d:'Stares at weak spots: +6% crit'},
  {k:'squire',n:'Overeager squire',e:'🛡️',w:3,q:2,fx:{guardAdd:-0.08},d:'Holds your shield: guards block 8% more'},
  {k:'coach',n:'Personal coach',e:'📋',w:2.5,q:2,m:{str:1,spd:1},d:'+1 strength, +1 speed'},
  {k:'bard',n:'Hired bard',e:'🎻',w:2,q:2,fx:{behindX:1.2,enRegen:3},d:'Sings when you are losing: +20% damage behind, +3 energy'}
].map(x=>Object.assign(x,{w:fw(x.w)}));
SEQ.splice(SEQ.findIndex(w=>w.k==='title'),0,{k:'side',label:'Sidekick',lc:'sidekick',items:SIDEKICKS});
MOD_SRC.push('side');
{const _tr2=traitsOf;traitsOf=function(f){const t=_tr2(f);const x=f.side&&f.side.fx;if(x){for(const k of T_ADD)if(x[k])t[k]+=x[k];for(const k of T_MUL)if(x[k])t[k]*=x[k];for(const k of T_MAX)if(x[k])t[k]=Math.max(t[k],x[k]);for(const k of T_BOOL)if(x[k])t[k]=true;if(x.pet)t.pets.push(x.pet);}return t;};}
// classes and races that bring friends
for(const a of ARCHS){if(a.k==='tamer')addO(a,{w:'side',n:['Attack dog','Tiny dragon','Judgmental cat'],x:2.5});if(a.k==='paladin'||a.k==='tank')addO(a,{w:'side',n:['Overeager squire'],x:3});if(a.k==='bard')addO(a,{w:'side',n:['Hired bard'],x:3});}

// ---- more weapons ----
[
  {n:'Sledgehammer',e:'🔨',w:3,q:2,l:1,t:['blunt'],v:'{a} swings a sledgehammer at {b}'},
  {n:'Crossbow',e:'🏹',w:3,q:2,l:1,t:['ranged'],v:'{a} fires a crossbow bolt at {b}'},
  {n:'Pool noodle',e:'🌀',w:2,q:0,l:-3,t:['blunt'],v:'{a} boops {b} with a pool noodle'},
  {n:'Chakram',e:'⭕',w:2,q:2,l:1,t:['blade','ranged'],v:'{a} hurls a chakram at {b}'},
  {n:'Bo staff',e:'🥢',w:3,q:1,l:0,t:['blunt'],v:'{a} spins a bo staff into {b}'},
  {n:'Harpoon spear',e:'🔱',w:2,q:2,l:1,t:['blade','water'],v:'{a} harpoons {b}'},
  {n:'Rapier',e:'🤺',w:3,q:2,l:1,t:['blade'],v:'{a} lunges at {b} with a rapier'},
  {n:'Golden frying pan',e:'🍳',w:0.8,q:3,l:3,t:['blunt'],v:'{a} clangs {b} with a golden frying pan'}
].forEach(wp=>{wp.w=fw(wp.w);WEAPONS.push(wp);});

// ---- daily challenge mutators ----
const MUTATORS=[
  {k:'glass',n:'Glass cannons',e:'💥',w:3,q:2,d:'Both fighters deal 50% more damage',mods:[{dmgX:1.5},{dmgX:1.5}]},
  {k:'sudden',n:'Sudden death',e:'☠️',w:3,q:2,d:'Both fighters start at 40 HP',mods:[{hp:40},{hp:40}]},
  {k:'charged',n:'Supercharged',e:'⚡',w:3,q:2,d:'Both fighters start with full energy',mods:[{en:100},{en:100}]},
  {k:'underdog',n:'Underdog',e:'🐶',w:3,q:1,d:'You start at 70 HP and they hit 25% harder',mods:[{hp:70},{dmgX:1.25}]},
  {k:'openbook',n:'Open book',e:'📖',w:3,q:3,d:'You read them 30% better',mods:[{readB:.3},{}]},
  {k:'secondwind',n:'Second wind',e:'💨',w:3,q:2,d:'Both fighters get back up once with 30 HP',mods:[{revive:30},{revive:30}]},
  {k:'lava',n:'The floor is lava',e:'🌋',w:2,q:1,d:'The fight takes place in the lava pit',mods:[{},{}],arena:'lava'},
  {k:'miniboss',n:'Mini boss',e:'👹',w:2,q:1,d:'They have 150 HP',mods:[{},{maxHp:150}]}
];
ACHIEVEMENTS.push(
  {k:'rush',n:'Boss Rusher',e:'🏃',q:3,d:'Beat all five bosses back to back in the boss rush'},
  {k:'bigbet',n:'High Roller',e:'🎰',q:2,d:'Win a fight club bet that paid 3× or more'},
  {k:'daily5',n:'Creature of Habit',e:'📆',q:2,d:'Win the daily challenge five days in a row'}
);
for(const a of ACHIEVEMENTS)ACHK[a.k]=a;
