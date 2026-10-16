// ---- v25: three more gear slots, gear sets, many more pieces ----
GEAR_SLOTS.push('helm','gloves','cape');
const SLOT_N={armor:'Armor',trinket:'Trinket',boots:'Boots',helm:'Helmet',gloves:'Gloves',cape:'Cape'};
const SLOT_E={armor:'🛡️',trinket:'💎',boots:'🥾',helm:'⛑️',gloves:'🧤',cape:'🧣'};
const S_=(set,g)=>Object.assign(g,{set});
GEAR.push(
  // helmets
  G_('helm','junk','papercrown','Paper crown','👑',2,{m:{cha:1,dur:-1}},'+1 charisma, −1 durability. Royalty, technically'),
  G_('helm','junk','cone','Traffic cone hat','🚧',3,{m:{dur:1,cha:-1}},'+1 durability, −1 charisma'),
  G_('helm','common','leathercap','Leather cap','🧢',5,{m:{dur:1}},'+1 durability'),
  G_('helm','common','thinkcap','Thinking cap','🎓',6,{m:{iq:1}},'+1 IQ'),
  G_('helm','epic','hornedcrown','Horned crown','🐂',26,{m:{str:2},fx:{taunt:1}},'+2 strength, taunts'),
  G_('helm','epic','foresight','Visor of foresight','🥽',28,{m:{iq:1},fx:{readB:.15}},'+1 IQ, reads 15% better'),
  G_('helm','legendary','kingcrown','Crown of kings','👑',52,{m:Object.assign(ALL(1),{cha:3})},'+1 to everything, +3 charisma'),
  G_('helm','mythic','wheelhalo','Halo of the Wheel','😇',105,{m:ALL(1),fx:{revive:35,critB:.1}},'+1 to everything, +10% crit, gets back up once with 35 HP'),
  // gloves
  G_('gloves','junk','ovenmitts','Oven mitts','🧤',2,{fx:{bluntDR:.05}},'Take 5% less from blunt hits. Toasty'),
  G_('gloves','junk','fingerless','Fingerless gloves','🖐️',3,{m:{cha:1}},'+1 charisma. Very cool, very cold'),
  G_('gloves','common','handwraps','Hand wraps','🩹',5,{m:{str:1}},'+1 strength'),
  G_('gloves','common','grip','Grip gloves','🧤',6,{m:{wm:1}},'+1 weapon mastery'),
  G_('gloves','epic','thunderfists','Thunder fists','⚡',26,{fx:{strikeX:1.12,enRegen:3}},'Strikes 12% harder, +3 energy every round'),
  G_('gloves','epic','vampgloves','Vampire gloves','🧛',28,{fx:{drain:.1}},'Hits heal 10% of damage'),
  G_('gloves','legendary','titangrips','Titan grips','🦾',52,{m:{str:3,wm:2}},'+3 strength, +2 weapon mastery'),
  G_('gloves','mythic','fatehands','Hands of fate','🫴',105,{m:{str:2},fx:{critB:.15,extra:.12}},'+2 strength, +15% crit, +12% extra hit chance'),
  // capes
  G_('cape','junk','towel','Bath towel cape','🛁',2,{m:{cha:1},fx:{dodgeB:.02}},'+1 charisma, +2% dodge. Still damp'),
  G_('cape','junk','curtain','Shower curtain','🚿',3,{fx:{bluntDR:.05}},'Take 5% less from blunt hits'),
  G_('cape','common','travelcloak','Travel cloak','🧥',5,{m:{spd:1}},'+1 speed'),
  G_('cape','common','herocape','Hero cape','🦸',7,{m:{cha:2}},'+2 charisma. Flaps dramatically'),
  G_('cape','epic','vampcape','Vampire cape','🦇',26,{fx:{drain:.06,darkX:1.2}},'Hits heal 6%, +20% damage in the dark'),
  G_('cape','epic','phoenixwings','Phoenix wings','🪽',30,{m:{spd:1},fx:{revive:25}},'+1 speed, gets back up once with 25 HP'),
  G_('cape','legendary','mantle','Royal mantle','🧣',55,{m:Object.assign(ALL(1),{cha:3})},'+1 to everything, +3 charisma'),
  G_('cape','mythic','dramacape','Cape of infinite drama','🎭',100,{m:{cha:3},fx:{behindX:1.4,clutchX:1.3}},'+3 charisma, +40% damage while behind, +30% below 25 HP'),
  // the knight set
  S_('knight',G_('helm','rare','ironhelm','Iron helm','⛑️',14,{m:{dur:2}},'+2 durability. Knight set')),
  S_('knight',G_('gloves','rare','irongauntlets','Iron gauntlets','🦾',14,{m:{str:1,dur:1}},'+1 strength, +1 durability. Knight set')),
  S_('knight',G_('cape','rare','tabard',"Knight's tabard",'🎽',14,{m:{dur:1},fx:{guardAdd:-0.05}},'+1 durability, guards block 5% more. Knight set')),
  S_('knight',G_('armor','rare','knightplate','Knight plate','🛡️',16,{m:{dur:2},fx:{dr:.03}},'+2 durability, takes 3% less damage. Knight set')),
  S_('knight',G_('boots','rare','greaves','Steel greaves','🥾',13,{m:{dur:1,str:1}},'+1 durability, +1 strength. Knight set')),
  S_('knight',G_('trinket','rare','sigil',"Knight's sigil",'⚜️',12,{m:{cha:1},fx:{guardAdd:-0.04}},'+1 charisma, guards block 4% more. Knight set')),
  // the shadow set
  S_('shadow',G_('helm','rare','shadowhood','Shadow hood','🥷',14,{m:{spd:1},fx:{dodgeB:.05}},'+1 speed, +5% dodge. Shadow set')),
  S_('shadow',G_('gloves','rare','shadowgloves','Shadow gloves','🖤',14,{fx:{critB:.06}},'+6% crit. Shadow set')),
  S_('shadow',G_('cape','rare','shadowcape','Shadow cape','🌑',14,{fx:{dodgeB:.06}},'+6% dodge. Shadow set')),
  S_('shadow',G_('armor','rare','shadowleathers','Shadow leathers','🦺',15,{m:{spd:1},fx:{dodgeB:.04}},'+1 speed, +4% dodge. Shadow set')),
  S_('shadow',G_('boots','rare','shadowsteps','Shadow steps','👣',14,{m:{spd:2}},'+2 speed. Shadow set')),
  S_('shadow',G_('trinket','rare','shadowcharm','Shadow charm','🔮',12,{fx:{critB:.05}},'+5% crit. Shadow set')),
  // the arcane set
  S_('arcane',G_('helm','rare','wizhat','Wizard hat','🧙',15,{m:{pm:2}},'+2 power mastery. Arcane set')),
  S_('arcane',G_('gloves','rare','arcanegloves','Arcane gloves','✨',15,{m:{pm:1},fx:{ultX:1.1}},'+1 power mastery, signature 10% harder. Arcane set')),
  S_('arcane',G_('cape','rare','starcloak','Star cloak','🌌',15,{m:{pm:1},fx:{enRegen:4}},'+1 power mastery, +4 energy every round. Arcane set')),
  S_('arcane',G_('armor','rare','arcanerobe','Arcane robe','🥻',15,{m:{pm:2}},'+2 power mastery. Arcane set')),
  S_('arcane',G_('boots','rare','arcaneslippers','Arcane slippers','🩰',13,{fx:{enRegen:3}},'+3 energy every round. Arcane set')),
  S_('arcane',G_('trinket','rare','arcanefocus','Arcane focus','🔷',13,{m:{pm:1},fx:{ultX:1.08}},'+1 power mastery, signature 8% harder. Arcane set')),
  // the clown set
  S_('clown',G_('helm','common','rubbernose','Rubber nose','🔴',4,{m:{cha:1}},'+1 charisma. Honk. Clown set')),
  S_('clown',G_('gloves','common','joybuzzer','Joy buzzer','🤝',4,{fx:{taunt:1}},'Taunts. Bzzt. Clown set')),
  S_('clown',G_('cape','common','polkacape','Polka-dot cape','🎪',4,{fx:{dodgeB:.03}},'+3% dodge. Clown set')),
  S_('clown',G_('boots','common','squeaky','Squeaky shoes','🤡',4,{m:{spd:1}},'+1 speed. Every step squeaks. Clown set')),
  // premium for the new slots
  G_('helm','premium','diamondhelm','Diamond helm','💠',2300,{m:{dur:2,cha:2},fx:{readB:.12,dr:.05}},'+2 durability, +2 charisma, reads 12% better, takes 5% less damage'),
  G_('gloves','premium','gildedgaunt','Gilded gauntlets','🥇',2500,{m:{str:3},fx:{strikeX:1.15,critB:.08}},'+3 strength, strikes 15% harder, +8% crit'),
  G_('cape','premium','auroracape','Aurora cape','🌈',2400,{m:{spd:2,pm:2},fx:{enRegen:6,dodgeB:.06}},'+2 speed, +2 power mastery, +6 energy every round, +6% dodge')
);
for(const g of GEAR)GEARK[g.k]=g;
Object.assign(GEM_PRICE,{diamondhelm:32,gildedgaunt:36,auroracape:34});
// set bonuses for wearing matching pieces
const setCount=(f,set)=>gearOf(f).filter(g=>g.set===set).length;
SYN.push(
  {k:'set_knight2',n:'Knight set (2)',e:'⚜️',q:1,d:'2 knight pieces: +1 durability',m:{dur:1},test:f=>setCount(f,'knight')>=2},
  {k:'set_knight4',n:'Knight set (4)',e:'⚜️',q:2,d:'4 knight pieces: +2 durability, guards block 10% more',m:{dur:2},fx:{guardAdd:-0.1},test:f=>setCount(f,'knight')>=4},
  {k:'set_knight6',n:'Knight set (6)',e:'⚜️',q:3,d:'Full knight set: takes 10% less damage, counters 20% harder',fx:{dr:.1,counterB:.2},test:f=>setCount(f,'knight')>=6},
  {k:'set_shadow2',n:'Shadow set (2)',e:'🥷',q:1,d:'2 shadow pieces: +4% dodge',fx:{dodgeB:.04},test:f=>setCount(f,'shadow')>=2},
  {k:'set_shadow4',n:'Shadow set (4)',e:'🥷',q:2,d:'4 shadow pieces: +1 speed, +8% crit',m:{spd:1},fx:{critB:.08},test:f=>setCount(f,'shadow')>=4},
  {k:'set_shadow6',n:'Shadow set (6)',e:'🥷',q:3,d:'Full shadow set: acts first, +10% extra hit chance',fx:{firstStrike:1,extra:.1},test:f=>setCount(f,'shadow')>=6},
  {k:'set_arcane2',n:'Arcane set (2)',e:'🔮',q:1,d:'2 arcane pieces: +1 power mastery',m:{pm:1},test:f=>setCount(f,'arcane')>=2},
  {k:'set_arcane4',n:'Arcane set (4)',e:'🔮',q:2,d:'4 arcane pieces: signature 15% harder, +5 energy every round',fx:{ultX:1.15,enRegen:5},test:f=>setCount(f,'arcane')>=4},
  {k:'set_arcane6',n:'Arcane set (6)',e:'🔮',q:3,d:'Full arcane set: +2 power mastery, signature 25% harder',m:{pm:2},fx:{ultX:1.25},test:f=>setCount(f,'arcane')>=6},
  {k:'set_clown2',n:'Clown set (2)',e:'🤡',q:1,d:'2 clown pieces: taunts',fx:{taunt:1},test:f=>setCount(f,'clown')>=2},
  {k:'set_clown4',n:'Clown set (4)',e:'🤡',q:2,d:'Full clown set: +10% dodge, +2 charisma. The crowd loves it',m:{cha:2},fx:{dodgeB:.1},test:f=>setCount(f,'clown')>=4}
);
