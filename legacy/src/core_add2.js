// ---- v6: quirks, gear, contracts, daily wheel, power scale, more influence, flatter odds ----
const POWER_SCALE=['Harmless','Below average','Street level','Peak human','Superhuman','Wall level','Building level','City block','City level','Mountain level','Island level','Continental','Planetary','Stellar','Galactic','Universal','Multiversal','Outerversal','Boundless','Author level'];
function powerScale(f){
  const s=eff(f);
  const att=Math.max(s.str*0.6+s.wm*0.4,activePower(f)?s.pm*0.75+s.iq*0.25:0);
  const v=clamp(Math.round((att*1.2+s.dur+s.spd*0.4)/2.6),1,20);
  return {v,n:POWER_SCALE[v-1]};
}

const QUIRKS=[
  {k:'none',n:'Nothing special',e:'😐',w:10,q:0,d:'Just a regular guy'},
  {k:'ambi',n:'Ambidextrous',e:'🤲',w:4,q:2,fx:{extra:.12},d:'+12% chance of an extra hit'},
  {k:'skull',n:'Thick skull',e:'🪖',w:4,q:2,fx:{bluntDR:.3},d:'Takes 30% less from blunt hits'},
  {k:'owl',n:'Night owl',e:'🦉',w:3,q:2,fx:{darkX:1.25},d:'+25% damage in dark arenas'},
  {k:'hype',n:'Hype man',e:'📣',w:4,q:2,fx:{enRegen:8},d:'+8 energy every round'},
  {k:'snack',n:'Snack break',e:'🍔',w:4,q:2,fx:{snack:25},d:'Eats a snack below 30 HP and heals 25, once'},
  {k:'stomach',n:'Iron stomach',e:'🥫',w:3,q:1,fx:{immune:1},d:'Immune to poison'},
  {k:'socks',n:'Lucky socks',e:'🧦',w:4,q:2,fx:{critB:.08,dodgeB:.04},d:'+8% crit, +4% dodge'},
  {k:'sore',n:'Sore loser',e:'😤',w:4,q:2,fx:{behindX:1.25},d:'+25% damage while behind on HP'},
  {k:'trash',n:'Trash talker',e:'🗯️',w:4,q:2,fx:{taunt:1},d:'Opponents read them 15% worse and start with 15 less energy'},
  {k:'early',n:'Early bird',e:'⏰',w:3,q:1,fx:{firstStrike:1},d:'Always acts first in round 1'},
  {k:'cardio',n:'Cardio king',e:'🏃',w:3,q:2,m:{spd:1},fx:{enRegen:5},d:'+1 speed, +5 energy every round'},
  {k:'clutch',n:'Clutch gene',e:'🧬',w:2.5,q:2,fx:{clutchX:1.4},d:'+40% damage below 25 HP'},
  {k:'twin',n:'Secret twin',e:'👯',w:1.5,q:3,fx:{revive:30},d:'A twin swaps in once with 30 HP. Nobody notices'},
  {k:'built',n:'Built different',e:'💪',w:1.2,q:3,m:ALL(1),d:'+1 to everything'},
  {k:'holes',n:'Plot holes',e:'🕳️',w:2,q:1,fx:{dodgeB:.1,dr:-0.1},d:'Dodges 10% more, takes 10% more. Makes no sense'},
  {k:'nerd',n:'Read the manual',e:'📖',w:3,q:1,m:{iq:2,str:-1},d:'+2 IQ, −1 strength'},
  {k:'gymrat',n:'Gym rat',e:'🏋️',w:3,q:1,m:{str:2,iq:-1},d:'+2 strength, −1 IQ'}
];
SEQ.splice(SEQ.findIndex(w=>w.k==='title'),0,{k:'quirk',label:'Quirk',lc:'quirk',items:QUIRKS});

const GEAR=[
  {k:'vest',slot:'armor',n:'Leather vest',e:'🦺',cost:6,q:1,m:{dur:1},d:'+1 durability'},
  {k:'chain',slot:'armor',n:'Chainmail shirt',e:'⛓️',cost:10,q:2,m:{dur:2,spd:-1},d:'+2 durability, −1 speed'},
  {k:'gi',slot:'armor',n:'Ninja gi',e:'🥋',cost:12,q:2,m:{spd:2},fx:{dodgeB:.05},d:'+2 speed, +5% dodge'},
  {k:'spikes',slot:'armor',n:'Spiked pauldrons',e:'🦔',cost:12,q:2,m:{dur:1},fx:{counterB:.2},d:'+1 durability, counters a lot more'},
  {k:'scale',slot:'armor',n:'Dragonscale coat',e:'🐉',cost:22,q:3,m:{dur:3},fx:{dr:.05},d:'+3 durability, takes 5% less damage'},
  {k:'coin',slot:'trinket',n:'Lucky coin',e:'🍀',cost:8,q:1,fx:{critB:.08},d:'+8% crit chance'},
  {k:'crystal',slot:'trinket',n:'Energy crystal',e:'🔷',cost:10,q:2,fx:{startEn:25},d:'Starts every fight with +25 energy'},
  {k:'amulet',slot:'trinket',n:'Health amulet',e:'📿',cost:12,q:2,fx:{regen:3},d:'Heals 3 HP every round'},
  {k:'scouter',slot:'trinket',n:'Scouter',e:'🥽',cost:10,q:2,fx:{readB:.15},d:'Reads opponents 15% better'},
  {k:'knuckles',slot:'trinket',n:'Brass knuckles',e:'👊',cost:8,q:1,m:{str:1},d:'+1 strength'},
  {k:'tome',slot:'trinket',n:'Spell tome',e:'📕',cost:14,q:2,m:{pm:2},d:'+2 power mastery'},
  {k:'phoenix',slot:'trinket',n:'Phoenix feather',e:'🪶',cost:20,q:3,fx:{revive:25},d:'Gets back up once with 25 HP'},
  {k:'ring',slot:'trinket',n:'Rage ring',e:'💍',cost:9,q:1,fx:{rage:40},d:'Hits 35% harder below 40 HP'}
];
const GEARK=Object.fromEntries(GEAR.map(g=>[g.k,g]));
function gearOf(f){return f&&f.gear?['armor','trinket'].map(s=>GEARK[f.gear[s]]).filter(Boolean):[];}
function randomGear(f,n){f.gear=f.gear||{};const slots=shuffleArr(['armor','trinket']).slice(0,n);for(const s of slots){const opts=GEAR.filter(g=>g.slot===s&&!g.req);f.gear[s]=pick(opts).k;}f._win=null;}
function shuffleArr(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

const CONTRACTS=[
  {k:'combo2',n:'Combo specialist',e:'⚗️',d:'Land 2 element combos in one fight',coins:8,xp:6},
  {k:'reads3',n:'Mind games',e:'🔮',d:'Win the move matchup 3 times in one fight',coins:7,xp:6},
  {k:'clean',n:'Clean win',e:'🧼',d:'Win a fight taking less than 25 damage',coins:10,xp:8},
  {k:'upset',n:'Upset special',e:'📉',d:'Beat someone you had under 45% odds against',coins:12,xp:10},
  {k:'quick',n:'Quick work',e:'⏱️',d:'Win a fight in 3 rounds or fewer',coins:7,xp:6},
  {k:'ults',n:'Show-off',e:'🌟',d:'Use your signature move twice in one fight',coins:8,xp:6},
  {k:'wall',n:'Brick wall',e:'🧱',d:'Guard 3 times in a fight and still win',coins:7,xp:6},
  {k:'hazard',n:'Hostile territory',e:'🌋',d:'Win in an arena with a hazard',coins:9,xp:6},
  {k:'semis',n:'Deep run',e:'🏟️',d:'Reach the semifinals of any tournament',coins:12,xp:10},
  {k:'streak',n:'Hot streak',e:'🔥',d:'Win 3 gauntlet fights in a row',coins:14,xp:10},
  {k:'bigger',n:'The bigger they are',e:'🗡️',d:'Beat an opponent 2 or more levels above you',coins:12,xp:10}
];
const CONTRACTK=Object.fromEntries(CONTRACTS.map(c=>[c.k,c]));

const DAILY=[
  {k:'c5',n:'5 coins',e:'🪙',w:6,q:1},{k:'c10',n:'10 coins',e:'💰',w:4,q:2},{k:'c25',n:'25 coins',e:'🤑',w:1.2,q:3},
  {k:'xp',n:'+15 XP',e:'⬆️',w:4,q:2},{k:'gear',n:'Free trinket',e:'🎁',w:2,q:3},{k:'lvl',n:'Free level-up spin',e:'🌟',w:1,q:3},
  {k:'drink',n:'Energy drink',e:'🥤',w:3,q:1},{k:'scout',n:'Scouting report',e:'🔭',w:3,q:1},{k:'nothing',n:'Absolutely nothing',e:'💀',w:3,q:0}
];

// dark arenas for the Night owl quirk
for(const a of ARENAS)if(['graveyard','forest','rooftop','void','thunder'].includes(a.k))a.dark=1;

// ---- earlier spins steer later wheels much more ----
const findN=(list,n)=>list.find(x=>x.n===n);
const ARCH_PULL={
  'Human':{'Chosen one':2},'Goblin':{'Trickster':2,'Assassin':2},'Skeleton':{'Necromancer':3},'Orc':{'Berserker':2.5,'Brawler':1.6},
  'Elf':{'Mage':2,'Trickster':1.6},'Pigeon':{'NPC':2.5},'Raccoon':{'Trickster':3},'Slime':{'Tank':2},'Vampire':{'Assassin':2,'Necromancer':1.6},
  'Werewolf':{'Berserker':2,'Beast tamer':2},'Cyborg':{'Tank':1.8,'Resilient':1.8},'Ghost':{'Trickster':2,'Necromancer':1.6},'Golem':{'Tank':3},
  'Demon':{'Berserker':2,'Necromancer':1.6},'Angel':{'Paladin':3},'Elemental':{'Mage':3},'Dragonkin':{'Berserker':1.8,'Paladin':1.6},
  'Cosmic warrior':{'Chosen one':2.5},'Titan':{'Tank':2,'Brawler':1.6},'Eldritch horror':{'Mage':2.5},'Dwarf':{'Tank':2,'Brawler':1.6},
  'Merfolk':{'Beast tamer':2},'Insectoid':{'Assassin':2},'Fairy':{'Mage':2,'Trickster':2},'Minotaur':{'Berserker':2,'Brawler':2},
  'Mushroom folk':{'Mage':2,'Monk':1.6},'Zombie':{'NPC':2,'Berserker':1.6},'Kitsune':{'Trickster':3},'Frogfolk':{'Monk':2},
  'Yeti':{'Brawler':2,'Tank':1.6},'Sentient toaster':{'NPC':3}
};
for(const [race,pulls] of Object.entries(ARCH_PULL)){const r=findN(RACES,race);if(!r)continue;for(const [n,x] of Object.entries(pulls))addO(r,{w:'arch',n:[n],x});}
for(const s of SIZES){
  if(['Tiny','Small'].includes(s.n))addO(s,{w:'weapon',n:['Dagger','Shuriken','Bow','Whip'],x:2});
  if(['Huge','Colossal'].includes(s.n))addO(s,{w:'weapon',n:['War hammer','Greatsword','Planet-cracker axe','Chainsaw'],x:2});
}
for(const wp of WEAPONS){
  if(wp.t.includes('blade'))addO(wp,{w:'ench',n:['Sharpness'],x:2});
  if(wp.t.includes('blunt'))addO(wp,{w:'ench',n:['Heavy'],x:2});
  if(wp.t.includes('ranged'))addO(wp,{w:'ench',n:['Swift'],x:2});
}
const POW_WEAK={fire:[['Water'],2],ice:[['Sunlight'],1.8],lightning:[['Water'],1.8],shadow:[['Sunlight'],3],light:[['Fear of the dark'],2.5],earth:[['Strong winds'],2],wind:[['Strong winds'],0],sonic:[['Loud noises'],0],boom:[['Loud noises'],0]};
for(const p of POWER_ALL){const r=POW_WEAK[p.k];if(r)addO(p,{w:'weak',n:r[0],x:r[1]});}
const STANCE_PULL={showboat:[['Main character'],3],reckless:[['Unhinged'],3],aggressive:[['Unhinged'],1.5],balanced:[['Nothing'],1.5]};
for(const s of STANCES){const r=STANCE_PULL[s.k];if(r)addO(s,{w:'chaos',n:r[0],x:r[1]});}
const BACK_PULL={influencer:[['Main Event','Aura Farmer'],3],retired:[['Washed'],3],athlete:[['the Speedrunner'],2],royal:[['the Unbothered'],2],bet:[['Certified Goofball'],2],bottom:[['Menace to Society'],2]};
for(const b of BACKS){const r=BACK_PULL[b.k];if(r)addO(b,{w:'title',n:r[0],x:r[1]});}
const CHAOS_PULL={main:[['Clutch gene','Secret twin'],2.5],unhinged:[['Plot holes'],3],cooked:[['Nothing special'],2],glitch:[['Plot holes'],2],crowd:[['Hype man'],3],sponsor:[['Hype man'],2]};
for(const c of CHAOS){const r=CHAOS_PULL[c.k];if(r)addO(c,{w:'quirk',n:r[0],x:r[1]});}
const QUIRK_PULL={trash:[['Menace to Society'],3],gymrat:[['Menace to Society'],1.5],nerd:[['Galaxy Brain'],3],built:[['the Undisputed GOAT'],2],none:[['No title'],1.5]};
for(const q of QUIRKS){const r=QUIRK_PULL[q.k];if(r)addO(q,{w:'title',n:r[0],x:r[1]});}

SYN.push(
  {k:'gymbro',n:'Gym bro',e:'🏋️',q:2,d:'Gym rat with bare fists or brass knuckles: +2 strength',m:{str:2},test:f=>f.quirk?.k==='gymrat'&&(!!f.weapon?.fists||f.gear?.trinket==='knuckles')},
  {k:'owlnight',n:'Creature of the night',e:'🌙',q:2,d:'Night owl who is a vampire, ghost or shadow user: +2 speed',m:{spd:2},test:f=>f.quirk?.k==='owl'&&(['Vampire','Ghost'].includes(f.race?.n)||f.power?.k==='shadow')},
  {k:'hypetrain',n:'Hype train',e:'🚂',q:2,d:'Hype man showboat: signature move does even more',m:{iq:1},test:f=>f.quirk?.k==='hype'&&f.stance?.k==='showboat'},
  {k:'twinpower',n:'Twin telepathy',e:'👯',q:3,d:'Secret twin with mind control: +2 power mastery',m:{pm:2},test:f=>f.quirk?.k==='twin'&&f.power?.k==='mind'}
);

// ---- flatter odds: rare slices are still rarer, just not nearly as rare ----
(function flattenOdds(){
  const seen=new Set();
  const lists=[RACES,ARCHS,SIZES,BACKS,WEAPONS,POWERS,HOLY,CURSED,SPELLBOOK,ENCHANTS,WEAKS,CHAOS,TITLES,STANCES,QUIRKS,ARENAS,EVENTS,LEVELUP,BONUS,DAILY,
    ...Object.values(RSUB).map(s=>s.items),...Object.values(ASUB).map(s=>s.items)];
  for(const W of SEQ)if(W.tier)lists.push(W.items);
  for(const list of lists)for(const it of list){if(!it||seen.has(it)||!(it.w>0))continue;seen.add(it);it.w=Math.round(Math.pow(it.w,0.5)*100)/100;}
})();

// ---- talents: one point per level, spent on three branches ----
const TALENTS=[
  {k:'o1',br:'Offense',t:1,n:'Sharp eye',e:'🎯',fx:{critB:.06},d:'+6% crit chance'},
  {k:'o2',br:'Offense',t:2,n:'Heavy hands',e:'👊',fx:{strikeX:1.1},d:'Strikes do 10% more'},
  {k:'o3',br:'Offense',t:3,n:'Finisher',e:'💥',fx:{ultX:1.25},d:'Signature move does 25% more'},
  {k:'o4',br:'Offense',t:4,n:'Killer instinct',e:'🩸',fx:{dmgX:1.1},d:'+10% damage on everything'},
  {k:'d1',br:'Defense',t:1,n:'Tough',e:'🧱',m:{dur:1},d:'+1 durability'},
  {k:'d2',br:'Defense',t:2,n:'Iron guard',e:'🛡️',fx:{guardAdd:-0.1},d:'Guard blocks 10% more'},
  {k:'d3',br:'Defense',t:3,n:'Second wind',e:'💨',fx:{revive:20},d:'Gets back up once with 20 HP'},
  {k:'d4',br:'Defense',t:4,n:'Unbreakable',e:'💎',fx:{dr:.1},d:'Takes 10% less damage'},
  {k:'t1',br:'Tactics',t:1,n:'Read the room',e:'🔮',fx:{readB:.1},d:'Reads opponents 10% better'},
  {k:'t2',br:'Tactics',t:2,n:'Quick start',e:'⚡',fx:{startEn:20},d:'Starts fights with +20 energy'},
  {k:'t3',br:'Tactics',t:3,n:'Momentum',e:'🔄',fx:{enRegen:6},d:'+6 energy every round'},
  {k:'t4',br:'Tactics',t:4,n:'Mastermind',e:'🧠',m:{iq:2},fx:{counterB:.1},d:'+2 IQ, counters more'}
];
const TALENTK=Object.fromEntries(TALENTS.map(t=>[t.k,t]));
function talentsOf(f){return f&&f.talents?f.talents.map(k=>TALENTK[k]).filter(Boolean):[];}
ACHIEVEMENTS.push(
  {k:'surpass',n:'Surpassed a Legend',e:'👑',q:3,d:'Beat a hall of fame legend in a challenge'},
  {k:'oldscore',n:'Old Score Settled',e:'⚔️',q:2,d:'Beat a returning rival in a rematch'},
  {k:'mythic',n:'Mythic',e:'🌌',q:3,d:'Reach the Mythic rank'}
);
for(const a of ACHIEVEMENTS)ACHK[a.k]=a;
GEAR.push(
  {k:'mythril',slot:'armor',n:'Mythril plate',e:'🪬',cost:35,q:3,req:4,m:{dur:4},fx:{dr:.06},d:'+4 durability, takes 6% less damage'},
  {k:'infinity',slot:'trinket',n:'Infinity shard',e:'💠',cost:40,q:3,req:4,m:ALL(1),fx:{startEn:10},d:'+1 to everything, +10 starting energy'}
);
for(const g of GEAR)GEARK[g.k]=g;
