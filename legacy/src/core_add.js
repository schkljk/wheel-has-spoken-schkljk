// ---- v4 additions: more races and wheel choices, arenas, career data ----
const addO=(it,o)=>{(it.o||(it.o=[])).push(o);};
RACES.push(
  {n:'Dwarf',e:'⛏️',w:7,q:1,m:{str:1,dur:2,spd:-1},o:[{w:'size',n:['Tiny','Small'],x:3},{w:'size',n:['Huge','Colossal'],x:0},{w:'weapon',n:['War hammer','Planet-cracker axe','Greatsword'],x:2.5}]},
  {n:'Merfolk',e:'🧜',w:5,q:1,m:{spd:1,iq:1},o:[{w:'power',n:['Water','Ice'],x:4},{w:'weapon',n:['Trident','Spear','Fishing rod'],x:4},{w:'weak',n:['Sunlight'],x:2},{w:'weak',n:['Water'],x:0}]},
  {n:'Insectoid',e:'🪲',w:5,q:1,m:{dur:1,spd:1,iq:-1},o:[{w:'power',n:['Poison'],x:3},{w:'weak',n:['The cold'],x:3}]},
  {n:'Fairy',e:'🧚',w:4,q:1,m:{str:-2,spd:3,pm:1},o:[{w:'size',n:['Tiny'],x:6},{w:'power',n:['No power'],x:0.3},{w:'weak',n:['Strong winds'],x:4}]},
  {n:'Minotaur',e:'🐂',w:4,q:2,m:{str:3,iq:-2},o:[{w:'size',n:['Large','Huge'],x:2.5},{w:'weapon',n:['Planet-cracker axe','War hammer'],x:3}]},
  {n:'Mushroom folk',e:'🍄',w:5,q:1,m:{dur:1,pm:1},immune:1,o:[{w:'power',n:['Poison','Vines'],x:4},{w:'weak',n:['Sunlight'],x:2}]},
  {n:'Zombie',e:'🧟',w:6,q:0,m:{dur:2,spd:-2,iq:-2},unholy:1,immune:1,o:[{w:'iq',s:-1},{w:'weak',n:['Easily confused','Forgets own name'],x:3},{w:'weak',n:['Weak stomach'],x:0}]},
  {n:'Kitsune',e:'🦊',w:3,q:2,m:{spd:1,iq:1,pm:2},o:[{w:'power',n:['Fire','Illusions','Mind control'],x:3},{w:'power',n:['No power'],x:0.2}]},
  {n:'Frogfolk',e:'🐸',w:5,q:0,m:{spd:1,str:-1},o:[{w:'power',n:['Water','Poison'],x:3},{w:'weak',n:['The cold'],x:2.5}]},
  {n:'Yeti',e:'🐻‍❄️',w:3,q:2,m:{str:2,dur:2,spd:-1},o:[{w:'power',n:['Ice'],x:5},{w:'weak',n:['The cold'],x:0},{w:'size',n:['Huge','Colossal'],x:2}]},
  {n:'Sentient toaster',e:'🍞',w:1.5,q:0,m:{iq:-1,dur:1},r:'A toaster. With feelings 😭',o:[{w:'weak',n:['Water'],x:6},{w:'power',n:['Fire','Lightning'],x:3}]}
);
Object.assign(RSUB,{
  'Dwarf':{label:'Hold',items:[
    {n:'Deep miner',e:'⛏️',w:7,q:1,m:{str:1},d:'+1 strength'},
    {n:'Brewmaster',e:'🍺',w:5,q:2,m:{dur:1},fx:{regen:3},d:'+1 durability, regenerates'},
    {n:'Runesmith',e:'🔨',w:4,q:2,fx:{wlvl:1},o:[{w:'ench',n:['None'],x:0.2}],d:'Weapons hit harder and are almost always enchanted'},
    {n:'Shieldwall',e:'🛡️',w:4,q:2,fx:{guardX:.25},d:'Guard blocks 75%'},
    {n:'King under the mountain',e:'👑',w:0.8,q:3,m:ALL(2),d:'+2 to everything'}]},
  'Merfolk':{label:'Waters',items:[
    {n:'Reef dweller',e:'🐠',w:7,q:1,m:{spd:1},d:'+1 speed'},
    {n:'River folk',e:'🏞️',w:6,q:1,m:{iq:1},d:'+1 IQ'},
    {n:'Abyssal',e:'🌑',w:3,q:2,m:{str:2},o:[{w:'power',n:['Shadow'],x:3}],d:'+2 strength, shadow more likely'},
    {n:'Siren',e:'🎶',w:3,q:2,fx:{rizz:.15},o:[{w:'power',n:['Sonic scream'],x:4}],d:'Distracts opponents, sonic scream more likely'},
    {n:'Kraken-born',e:'🦑',w:0.8,q:3,m:ALL(2),fx:{pet:{e:'🦑',n:'kraken tentacle',x:1.2}},d:'+2 to everything, a tentacle helps out'}]},
  'Insectoid':{label:'Hive role',items:[
    {n:'Drone',e:'🐜',w:8,q:0,d:'Expendable'},
    {n:'Worker',e:'🧺',w:6,q:1,m:{dur:1},d:'+1 durability'},
    {n:'Soldier',e:'🪖',w:4,q:2,m:{str:2},d:'+2 strength'},
    {n:'Swarm caller',e:'🐝',w:3,q:2,fx:{pet:{e:'🐝',n:'swarm',x:1.0}},d:'A swarm attacks every round'},
    {n:'Hive queen',e:'👑',w:0.8,q:3,m:ALL(2),fx:{pet:{e:'🐜',n:'royal guard',x:1.2}},d:'+2 to everything and royal guards'}]},
  'Fairy':{label:'Court',items:[
    {n:'Pixie',e:'✨',w:7,q:1,fx:{dodgeB:.08},d:'Dodges more'},
    {n:'Tooth fairy',e:'🦷',w:5,q:1,fx:{drain:8},d:'Steals energy on hits'},
    {n:'Seelie court',e:'🌸',w:4,q:2,m:{pm:2},o:[{w:'power',n:['Holy light','Vines'],x:3}],d:'+2 power mastery'},
    {n:'Unseelie court',e:'🥀',w:3,q:2,m:{str:2},fx:{unholy:1},o:[{w:'power',n:['Shadow','Illusions'],x:3}],d:'+2 strength, turns unholy'},
    {n:'Fairy queen',e:'👑',w:0.8,q:3,m:ALL(2),d:'+2 to everything'}]},
  'Minotaur':{label:'Labyrinth',items:[
    {n:'Lost',e:'🧭',w:6,q:0,m:{iq:-1},d:'Still looking for the exit. −1 IQ'},
    {n:'Guardian',e:'🚪',w:6,q:1,m:{dur:2},d:'+2 durability'},
    {n:'Gladiator',e:'🏟️',w:4,q:2,m:{str:2},fx:{critB:.06},d:'+2 strength, crits more'},
    {n:'Charging bull',e:'💨',w:3,q:2,fx:{firstStrike:1,extra:.1},d:'Charges in first, hits twice more often'},
    {n:'Labyrinth lord',e:'👑',w:0.8,q:3,m:ALL(2),d:'+2 to everything'}]},
  'Mushroom folk':{label:'Spores',items:[
    {n:'Edible',e:'🍳',w:6,q:0,d:'Delicious. Not a combat trait'},
    {n:'Poisonous',e:'☠️',w:5,q:2,fx:{venom:3},d:'Strikes poison the target'},
    {n:'Psychedelic',e:'🌈',w:4,q:2,fx:{rizz:.12},d:'Opponents lose turns seeing things'},
    {n:'Fairy ring',e:'⭕',w:3,q:2,fx:{regen:4},d:'Regenerates every round'},
    {n:'Ancient mycelium',e:'🕸️',w:0.8,q:3,m:ALL(2),d:'+2 to everything'}]},
  'Zombie':{label:'Decay',items:[
    {n:'Fresh',e:'🆕',w:6,q:1,m:{spd:1},d:'Still mobile. +1 speed'},
    {n:'Rotting',e:'🪰',w:7,q:0,fx:{venom:2},d:'Gross. Strikes poison a little'},
    {n:'Hungry',e:'🧠',w:4,q:2,fx:{rage:60},d:'Rages below 60 HP'},
    {n:'Patient zero',e:'☣️',w:2,q:2,m:{str:1},fx:{venom:4},d:'Very contagious. Strikes poison'},
    {n:'Zombie lord',e:'👑',w:0.8,q:3,m:ALL(2),fx:{pet:{e:'🧟',n:'zombie horde',x:1.3}},d:'+2 to everything and a horde'}]},
  'Kitsune':{label:'Tails',items:[
    {n:'One tail',e:'🦊',w:7,q:1,d:'A young fox'},
    {n:'Three tails',e:'🍂',w:5,q:2,m:{pm:1,iq:1},d:'+1 power mastery, +1 IQ'},
    {n:'Seven tails',e:'🏮',w:3,q:2,m:{pm:2,spd:1},fx:{dodgeB:.06},d:'+2 power mastery, dodges more'},
    {n:'Nine tails',e:'🌕',w:0.8,q:3,m:ALL(2),o:[{w:'power',n:['Fire'],x:3}],d:'+2 to everything'}]},
  'Frogfolk':{label:'Pond',items:[
    {n:'Tadpole',e:'🫧',w:6,q:0,m:{str:-1},d:'Still a baby. −1 strength'},
    {n:'Bullfrog',e:'🐸',w:6,q:1,m:{str:1,dur:1},d:'+1 strength and durability'},
    {n:'Poison dart',e:'🎯',w:4,q:2,fx:{venom:4},d:'Strikes poison the target'},
    {n:'Long tongue',e:'👅',w:4,q:2,fx:{wlvl:1,extra:.1},d:'Grabs from range, extra hits'},
    {n:'Frog prince',e:'👑',w:0.8,q:3,m:ALL(2),fx:{rizz:.1},d:'+2 to everything, princely charm'}]},
  'Yeti':{label:'Peak',items:[
    {n:'Foothills',e:'🌲',w:7,q:1,d:'Lives at the bottom'},
    {n:'Snowline',e:'🏔️',w:5,q:2,m:{dur:2},d:'+2 durability'},
    {n:'Avalanche',e:'⛷️',w:3,q:2,m:{str:2},fx:{firstStrike:1},d:'+2 strength, strikes first'},
    {n:'Abominable',e:'👣',w:0.8,q:3,m:ALL(2),d:'+2 to everything'}]},
  'Sentient toaster':{label:'Setting',items:[
    {n:'Defrost',e:'🧊',w:6,q:0,m:{str:-1},d:'Lukewarm. −1 strength'},
    {n:'Medium',e:'🍞',w:7,q:1,d:'Golden brown'},
    {n:'Bagel mode',e:'🥯',w:4,q:2,m:{dur:2},d:'+2 durability'},
    {n:'Max heat',e:'🔥',w:2,q:2,m:{str:2},fx:{breath:'fire'},d:'+2 strength, burning strikes'},
    {n:'Smart toaster',e:'📶',w:0.8,q:3,m:{iq:4},d:'+4 IQ. Has Wi-Fi'}]}
});

WEAPONS.push(
  {n:'Spear',e:'🍢',w:4,q:2,l:2,t:['blade'],v:'{a} jabs {b} with a spear',o:[{w:'wm',s:1}]},
  {n:'Magic staff',e:'🪄',w:4,q:2,l:1,t:['blunt'],v:'{a} bonks {b} with a magic staff',o:[{w:'power',n:['No power'],x:0.4},{w:'pm',s:1}]},
  {n:'Greatsword',e:'🗡️',w:3,q:2,l:4,t:['blade'],v:'{a} swings a greatsword at {b}'},
  {n:'Shuriken',e:'✴️',w:4,q:2,l:2,t:['blade','ranged'],v:'{a} throws shuriken at {b}',ranged:1,proj:'✴️'},
  {n:'Boomerang',e:'🪃',w:3,q:1,l:1,t:['blunt','ranged'],v:'{a} throws a boomerang at {b}',ranged:1,proj:'🪃'},
  {n:'Electric guitar',e:'🎸',w:3,q:1,l:1,t:['blunt','sonic'],v:'{a} shreds a solo on {b}\'s head'},
  {n:'Whip',e:'➰',w:3,q:1,l:1,t:['blade'],v:'{a} whips {b}'},
  {n:'Nunchucks',e:'🥢',w:4,q:1,l:1,t:['blunt'],v:'{a} spins nunchucks into {b}',o:[{w:'wm',s:1}]},
  {n:'Fishing rod',e:'🎣',w:3,q:0,l:0,t:['blunt'],v:'{a} hooks {b} with a fishing rod'},
  {n:'Giant lollipop',e:'🍭',w:2,q:0,l:0,t:['blunt'],v:'{a} bonks {b} with a giant lollipop',r:'A lollipop 😭'}
);
{const cb=WEAPONS.find(w=>w.n==='Cursed blade');if(cb)cb.e='☠️';}

const NEW_POWERS=[
  {k:'earth',n:'Earthquake',e:'⛰️',w:3,q:2,l:1,t:['blunt','earth'],v:'{a} splits the ground under {b}',d:'Blunt damage, can stagger'},
  {k:'wind',n:'Wind',e:'🌬️',w:4,q:1,l:1,t:['wind'],v:'{a} blasts {b} with a gale',d:'Wind damage, fans flames'},
  {k:'sonic',n:'Sonic scream',e:'📢',w:3,q:2,l:1,t:['sonic'],v:'{a} screams at {b}',d:'Can stun the opponent'},
  {k:'vines',n:'Vines',e:'🌿',w:3,q:1,l:0,t:['plant'],v:'{a} wraps {b} in vines',d:'Can root the opponent in place'},
  {k:'boom',n:'Explosions',e:'💣',w:2.5,q:2,l:3,t:['fire','boom'],v:'{a} blows up {b}',d:'Huge damage, sometimes catches themself in the blast'},
  {k:'magnet',n:'Magnetism',e:'🧲',w:2.5,q:2,l:1,t:['blunt'],v:'{a} yanks {b}\'s weapon around',d:'Bends the opponent\'s weapon'},
  {k:'illusion',n:'Illusions',e:'🪞',w:3,q:2,l:0,t:[],passive:1,d:'Opponents often attack an illusion'},
  {k:'summon',n:'Summoning',e:'🔯',w:2.5,q:2,l:0,t:[],passive:1,d:'A spirit attacks every round'}
];
POWERS.push(...NEW_POWERS);
for(const p of NEW_POWERS){POWER_ALL.push(p);POWK[p.k]=p;}
SPELLBOOK.push(...pool([['wind',4],['earth',3],['sonic',2],['illusion',3],['summon',2]]));
CURSED.push(...pool([['summon',3]]));
HOLY.push(...pool([['sonic',1.5]]));
{const w=POWERS.find(p=>p.k==='wind');addO(w,{w:'ench',n:['Swift'],x:3});const v=POWERS.find(p=>p.k==='vines');addO(v,{w:'weak',n:['Hay fever'],x:0});}

ENCHANTS.push(
  {k:'venom',n:'Venom',e:'🐍',w:3,q:2,l:0.5,t:['poison'],d:'Weapon hits poison'},
  {k:'lucky',n:'Lucky',e:'🍀',w:3,q:2,l:0,d:'+10% crit chance'},
  {k:'heavy',n:'Heavy',e:'⚓',w:3,q:2,l:1,t:['blunt'],d:'Hits harder and counts as blunt'},
  {k:'swift',n:'Swift',e:'💨',w:3,q:2,l:0,d:'More extra hits'},
  {k:'echo',n:'Echo',e:'🔁',w:2,q:2,l:0,d:'Hits sometimes repeat for half damage'}
);
WEAKS.push(
  {k:'loud',n:'Loud noises',e:'🔊',w:3,q:1,trig:['sonic','boom'],d:'Sonic attacks and explosions hit them extra hard'},
  {k:'windy',n:'Strong winds',e:'🌬️',w:3,q:1,trig:['wind'],d:'Wind hits them extra hard'},
  {k:'hay',n:'Hay fever',e:'🌾',w:3,q:1,trig:['plant'],skip:0.06,sfx:'🤧',st:'🤧 {a} sneezes at the pollen',d:'Plants hit them extra hard, sometimes sneezes'},
  {k:'magic',n:'Allergic to magic',e:'🪄',w:3,q:0,magicWeak:1,d:'Every power hits them 40% harder'},
  {k:'cocky',n:'Overconfident',e:'😎',w:4,q:1,cocky:1,d:'Takes 25% more damage while above 70 HP'},
  {k:'bees',n:'Bees',e:'🐝',w:3,q:1,trig:['pet'],d:'Pets and summons hit them extra hard'}
);
CHAOS.push(
  {k:'crowd',n:'Crowd favorite',e:'📣',w:2.2,q:2,d:'The crowd cheers them back to health every round'},
  {k:'sponsor',n:'Sponsored',e:'💸',w:2.2,q:2,d:'Starts every fight with full energy'},
  {k:'glitch',n:'Glitched',e:'👾',w:2,q:1,d:'Random things happen every round'},
  {k:'lag',n:'Lag spike',e:'📶',w:2,q:1,d:'Sometimes freezes, sometimes acts twice'}
);
BACKS.push(
  {k:'athlete',n:'Former pro athlete',e:'🏅',w:4,q:2,m:{spd:1,dur:1},d:'+1 speed, +1 durability'},
  {k:'dungeon',n:'Raised in a dungeon',e:'🕯️',w:4,q:1,m:{dur:1},o:[{w:'weak',n:['Sunlight'],x:3}],d:'+1 durability, probably hates sunlight'},
  {k:'witch',n:'Cursed by a witch',e:'🧙',w:3,q:0,m:{iq:-1},o:[{w:'weak',n:['Allergic to magic'],x:4}],d:'−1 IQ, and magic might be a problem'},
  {k:'bottom',n:'Started from the bottom',e:'🪜',w:4,q:2,fx:{rage:30,dmgX:1.04},d:'Hungry: +4% damage, rages below 30 HP'},
  {k:'influencer',n:'Influencer',e:'🤳',w:3,q:1,o:[{w:'chaos',n:['Crowd favorite','Sponsored'],x:4}],d:'Fans and sponsors are much more likely'},
  {k:'cult',n:'Escaped a cult',e:'🫥',w:3,q:1,m:{iq:1},o:[{w:'power',n:['Shadow','Summoning'],x:2}],d:'+1 IQ, a bit too comfortable with shadows'},
  {k:'retired',n:'Came out of retirement',e:'👴',w:3,q:1,m:{iq:2,spd:-1},d:'+2 IQ, −1 speed. One last job'}
);
TITLES.push(
  {k:'unbothered',n:'the Unbothered',e:'😌',w:2,q:2,fx:{dr:.08},d:'Takes 8% less damage'},
  {k:'mainevent',n:'Main Event',e:'🎤',w:2,q:2,fx:{dmgX:1.06},d:'+6% damage'},
  {k:'aura',n:'Aura Farmer',e:'🌀',w:2,q:2,fx:{rizz:.08},d:'Opponents get distracted'},
  {k:'twist',n:'Plot Twist',e:'🔀',w:1.5,q:2,fx:{revive:20},d:'Gets back up once with 20 HP'},
  {k:'washed',n:'Washed',e:'🧽',w:2,q:0,m:{spd:-1,str:-1},d:'−1 strength and speed. Past their prime'}
);

const STANCES=[
  {k:'aggressive',n:'Aggressive',e:'😤',w:6,q:2,fx:{strikeX:1.15,guardAdd:.15},ai:{strike:1.6,guard:0.5},d:'Strikes hit 15% harder, guard is weaker'},
  {k:'defensive',n:'Defensive',e:'🛡️',w:6,q:2,fx:{guardX:.25,guardEn:15},ai:{guard:2},d:'Guard blocks 75% and builds more energy'},
  {k:'tactical',n:'Tactical',e:'🧠',w:5,q:2,fx:{readB:.15},d:'Reads opponents 15% better'},
  {k:'counter',n:'Counter-puncher',e:'↩️',w:5,q:2,fx:{counterB:.4},ai:{guard:1.5},d:'Counters hit 40% harder'},
  {k:'showboat',n:'Showboat',e:'🕺',w:4,q:1,fx:{ultX:1.3},d:'Signature move does 30% more'},
  {k:'balanced',n:'Balanced',e:'☯️',w:6,q:1,m:{iq:1},d:'+1 IQ, and opponents have a harder time reading them'},
  {k:'reckless',n:'Reckless',e:'🤪',w:3,q:0,fx:{strikeX:1.25,dr:-0.15},ai:{guard:0.2,strike:1.3},d:'Hits 25% harder, takes 15% more'}
];
SEQ.splice(SEQ.findIndex(w=>w.k==='asub')+1,0,{k:'stance',label:'Fighting stance',lc:'fighting stance',items:STANCES});
addO(ARCHK.tank,{w:'stance',n:['Defensive'],x:3});
addO(ARCHK.berserker,{w:'stance',n:['Reckless','Aggressive'],x:3});
addO(ARCHK.assassin,{w:'stance',n:['Tactical'],x:3});
addO(ARCHK.brawler,{w:'stance',n:['Counter-puncher'],x:3});
addO(ARCHK.monk,{w:'stance',n:['Balanced'],x:3});
addO(ARCHK.trickster,{w:'stance',n:['Showboat'],x:2.5});
addO(ARCHK.chosen,{w:'stance',n:['Showboat'],x:3});

SYN.push(
  {k:'merking',n:'Ruler of the deep',e:'🔱',q:3,d:'Merfolk with a trident: +2 strength',m:{str:2},test:f=>f.race?.n==='Merfolk'&&f.weapon?.n==='Trident'},
  {k:'rocker',n:'Rock star',e:'🎸',q:2,d:'Guitar and sonic scream: +2 power mastery',m:{pm:2},test:f=>f.weapon?.n==='Electric guitar'&&f.power?.k==='sonic'},
  {k:'forge',n:'Master forge',e:'⚒️',q:2,d:'Dwarf with a hammer, axe or greatsword: +2 weapon mastery',m:{wm:2},test:f=>f.race?.n==='Dwarf'&&['War hammer','Planet-cracker axe','Greatsword'].includes(f.weapon?.n)},
  {k:'foxfire',n:'Foxfire',e:'🦊',q:3,d:'Kitsune with fire or illusions: +2 power mastery',m:{pm:2},test:f=>f.race?.n==='Kitsune'&&['fire','illusion'].includes(f.power?.k)},
  {k:'toast',n:'Perfectly toasted',e:'🍞',q:3,d:'A toaster with fire: +3 strength. It finally makes sense',m:{str:3},test:f=>f.race?.n==='Sentient toaster'&&(f.power?.k==='fire'||f.ench?.k==='flame')},
  {k:'wizard',n:'Proper wizard',e:'🪄',q:2,d:'Mage with a magic staff: +2 power mastery',m:{pm:2},test:f=>f.arch?.k==='mage'&&f.weapon?.n==='Magic staff'},
  {k:'tank2',n:'Fortress',e:'🏰',q:2,d:'Tank in a defensive stance: guard blocks 85%',test:f=>f.arch?.k==='tank'&&f.stance?.k==='defensive'},
  {k:'storm2',n:'Hurricane',e:'🌀',q:2,d:'Wind power and a swift weapon: more extra hits',test:f=>f.power?.k==='wind'&&f.ench?.k==='swift'}
);

const ARENAS=[
  {k:'colosseum',n:'Colosseum',e:'🏟️',w:8,q:1,sky:'#F3D9A4',floor:'#C99A5B',ultX:1.2,d:'Neutral ground. The crowd loves signature moves: +20%'},
  {k:'lava',n:'Lava pit',e:'🌋',w:5,q:2,sky:'#4A1410',floor:'#D2491F',tag:{fire:1.4,ice:0.7},hazard:{dmg:3,txt:'The heat scorches {x}',fx:'🔥',tint:'fire'},d:'Fire +40%, ice −30%. The heat burns both fighters every round'},
  {k:'flood',n:'Flooded temple',e:'🌊',w:5,q:2,sky:'#1F4E79',floor:'#3D8BFF',tag:{water:1.4,lightning:1.4,fire:0.7},soak:1,d:'Water and lightning +40%, fire −30%. Everyone stays soaked'},
  {k:'tundra',n:'Frozen tundra',e:'🧊',w:5,q:2,sky:'#CFE8F5',floor:'#FFFFFF',tag:{ice:1.4},stat:{spd:-1},freezeB:.1,d:'Ice +40%, everyone −1 speed, more freezes'},
  {k:'graveyard',n:'Graveyard',e:'⚰️',w:4,q:2,sky:'#2E2A3A',floor:'#4B4453',tag:{shadow:1.3},unholyMod:{str:1,dur:1},d:'Unholy fighters +1 strength and durability. Shadow +30%'},
  {k:'cathedral',n:'Cathedral',e:'⛪',w:4,q:2,sky:'#F6E7B8',floor:'#D9B54A',tag:{light:1.5},unholyMod:{str:-1,spd:-1,dur:-1},d:'Holy light +50%. Unholy fighters −1 to strength, speed and durability'},
  {k:'thunder',n:'Thunderdome',e:'⚡',w:4,q:2,sky:'#2A1B4A',floor:'#4B3A78',tag:{lightning:1.3},hazard:{dmg:9,one:1,chance:.3,txt:'Lightning strikes {x}',fx:'⚡',tint:'lightning'},d:'Lightning +30%. Random lightning strikes'},
  {k:'forest',n:'Haunted forest',e:'🌲',w:4,q:2,sky:'#1E3A2A',floor:'#2F5D3A',tag:{shadow:1.3,plant:1.3},dodgeB:.05,d:'Shadow and plants +30%, everyone dodges a bit more'},
  {k:'space',n:'Space station',e:'🛰️',w:3,q:2,sky:'#0E1630',floor:'#5C6B8A',tag:{gravity:1.5},stat:{spd:2},d:'Low gravity: everyone +2 speed. Gravity +50%'},
  {k:'kitchen',n:'The kitchen',e:'🍳',w:3,q:1,sky:'#FDF1E3',floor:'#E8D3B8',weaponX:{'Frying pan':2,'Wet noodle':2,'Rubber chicken':2,'Giant lollipop':2},raceX:{'Sentient toaster':1.5},d:'Pans, noodles, chickens and lollipops deal double. Toasters feel at home'},
  {k:'rooftop',n:'Rooftop at night',e:'🌃',w:3,q:2,sky:'#14213D',floor:'#3A4A6B',tag:{shadow:1.2},critB:.1,d:'Crits +10%, shadow +20%'},
  {k:'mirror',n:'Mirror dimension',e:'🪞',w:2.5,q:2,sky:'#E9DDF7',floor:'#C9B3EA',tag:{mind:1.4},powX:{reality:1.4,arcane:1.3},dodgeB:.04,d:'Mind and reality powers +40%'},
  {k:'beach',n:'Sunny beach',e:'🏖️',w:3,q:1,sky:'#9ED8F5',floor:'#F3D48A',tag:{water:1.2},sunBurn:5,d:'Water +20%. Anyone weak to sunlight burns every round'},
  {k:'ballpit',n:'Ball pit',e:'🎈',w:2,q:0,sky:'#FFF3E0',floor:'#FF8A65',allX:0.7,d:'All damage −30%. Nobody knows why this is allowed'},
  {k:'void',n:'The void',e:'🕳️',w:0.8,q:3,sky:'#0A0612',floor:'#2B1033',powX:{reality:1.6,time:1.6},allX:1.2,d:'Everything hits 20% harder. Reality and time +60%'}
];
const LEVELUP=[
  {k:'str',n:'+1 Strength',e:'💪',w:5,q:2},{k:'spd',n:'+1 Speed',e:'👟',w:5,q:2},{k:'dur',n:'+1 Durability',e:'🛡️',w:5,q:2},
  {k:'iq',n:'+1 IQ',e:'🧠',w:4,q:1},{k:'wm',n:'+1 Weapon mastery',e:'🗡️',w:4,q:2},{k:'pm',n:'+1 Power mastery',e:'✨',w:4,q:2},
  {k:'str2',n:'+2 Strength',e:'🦾',w:1.5,q:3},{k:'dur2',n:'+2 Durability',e:'🧱',w:1.5,q:3},
  {k:'all1',n:'+1 to everything',e:'🌟',w:1.2,q:3},
  {k:'cure',n:'Weakness overcome',e:'🩹',w:1,q:3},
  {k:'awaken',n:'Awakening: new power',e:'👁️',w:1,q:3,respin:1},
  {k:'arsenal',n:'New weapon spin',e:'🗃️',w:1,q:2,respin:1}
];
const EVENTS=[
  {k:'train',n:'Training montage',e:'🏋️',w:6,q:2,d:'+1 to a random stat for good'},
  {k:'sponsor',n:'Sponsor deal',e:'💰',w:5,q:2,d:'+4 coins'},
  {k:'injury',n:'Tweaked something',e:'🤕',w:4,q:0,d:'Picks up an injury'},
  {k:'taunt',n:"Rival's taunt",e:'😤',w:5,q:2,d:'Fired up: +15% damage next fight'},
  {k:'stranger',n:'Mysterious stranger',e:'🧙',w:3,q:2,d:'Teaches them a trick: +1 power mastery'},
  {k:'food',n:'Bad street food',e:'🌭',w:4,q:0,d:'Starts the next fight at 80 HP'},
  {k:'energy',n:'Energy drink',e:'🥤',w:4,q:2,d:'Starts the next fight with full energy'},
  {k:'fan',n:'Fan mail',e:'💌',w:5,q:1,d:'Nice, but it does nothing'},
  {k:'scout',n:'Scouted the opponent',e:'🔭',w:3,q:2,d:'Reads the next opponent 20% better'},
  {k:'relic',n:'Cursed relic',e:'🗿',w:2,q:1,d:'+2 strength, −2 IQ, for good'},
  {k:'blessing',n:'Cosmic blessing',e:'🌠',w:0.8,q:3,d:'+1 to everything, for good'},
  {k:'nothing',n:'Nothing happened',e:'💤',w:5,q:0,d:'A quiet day'}
];
const INJURIES=[
  {k:'ankle',n:'Sprained ankle',e:'🦶',m:{spd:-2},dur:2},
  {k:'concussion',n:'Concussion',e:'😵',m:{iq:-2},dur:1},
  {k:'arm',n:'Broken arm',e:'🦴',m:{wm:-2,str:-1},dur:2},
  {k:'ego',n:'Bruised ego',e:'🥲',m:ALL(-1),dur:1},
  {k:'ribs',n:'Cracked ribs',e:'🩻',m:{dur:-2},dur:2}
];
const INJK=Object.fromEntries(INJURIES.map(j=>[j.k,j]));
const ACHIEVEMENTS=[
  {k:'giant',n:'Giant Slayer',e:'🗡️',q:3,d:'Beat an opponent you had under 35% odds against'},
  {k:'comeback',n:'Comeback Kid',e:'📈',q:2,d:'Win a fight with less than 10 HP left'},
  {k:'flawless',n:'Flawless',e:'💎',q:3,d:'Win a fight without taking damage'},
  {k:'onepunch',n:'One Punch',e:'👊',q:2,d:'Win a fight in the first round'},
  {k:'untouch',n:'Untouchable',e:'👻',q:2,d:'Dodge 3 attacks in one fight'},
  {k:'reader',n:'Mind Reader',e:'🔮',q:2,d:'Win the move matchup 4 times in one fight'},
  {k:'combo',n:'Combo Artist',e:'⚗️',q:2,d:'Land 3 element combos in one fight'},
  {k:'defender',n:'Title Defender',e:'🛡️',q:3,d:'Win a tournament while defending its belt'},
  {k:'revenge',n:'Revenge Served Cold',e:'🧊',q:3,d:'Beat your nemesis'},
  {k:'iron',n:'Iron Will',e:'🦾',q:2,d:'Fight 25 times with one fighter'},
  {k:'regional',n:'Regional Champion',e:'🥈',q:2,d:'Win the Regional cup'},
  {k:'world',n:'World Champion',e:'🌍',q:3,d:'Win the World championship'},
  {k:'gauntlet',n:'Gauntlet Legend',e:'🔥',q:3,d:'Win 10 gauntlet fights in a row'},
  {k:'underdog',n:'Underdog Story',e:'🐭',q:3,d:'Win a tournament with a fighter rated Cooked or Mid'},
  {k:'pigeon',n:'Pigeon Supremacy',e:'🐦',q:3,d:'Win any tournament as a pigeon'},
  {k:'lvl10',n:'Veteran',e:'🎖️',q:2,d:'Reach level 10'}
];
const ACHK=Object.fromEntries(ACHIEVEMENTS.map(a=>[a.k,a]));
const TIERS_T=[
  {k:'local',n:'Local brawl',e:'🥊',size:8,lvl:0,coins:8,xpW:10,d:'8 fighters, 3 rounds',lock:'',unlock:()=>true},
  {k:'regional',n:'Regional cup',e:'🏆',size:16,lvl:2,coins:15,xpW:14,d:'16 fighters, 4 rounds, tougher opponents',lock:'Reach level 3 or win a Local brawl',unlock:f=>f.lvl>=3||!!f.belts.local},
  {k:'world',n:'World championship',e:'🌍',size:32,lvl:4,coins:30,xpW:20,d:'32 fighters, 5 rounds, the best of the best',lock:'Reach level 6 or win the Regional cup',unlock:f=>f.lvl>=6||!!f.belts.regional},
  {k:'gauntlet',n:'The gauntlet',e:'🔥',size:0,lvl:0,coins:0,xpW:8,d:'Fight until you lose. Opponents get tougher every two wins',lock:'',unlock:()=>true}
];
const TIERK=Object.fromEntries(TIERS_T.map(t=>[t.k,t]));
const SHOP=[
  {k:'cure',n:'Cure weakness',e:'🩹',cost:10,d:'Removes their weakness for good',na:'No weakness to cure',ok:f=>!['cured','none'].includes(f.weak.k)},
  {k:'heal',n:'Physio session',e:'🩺',cost:4,d:'Heals every injury right away',na:'No injuries right now',ok:f=>(f.inj||[]).length>0},
  {k:'stat',n:'Personal trainer',e:'🏋️',cost:6,d:'+1 to a stat you pick. Gets pricier each time'},
  {k:'weapon',n:'Weapon shop',e:'🗡️',cost:5,d:'Spin a new weapon and weapon mastery'},
  {k:'power',n:'Power swap',e:'✨',cost:8,d:'Spin a new power and power mastery'},
  {k:'stance',n:'Stance coach',e:'🥋',cost:3,d:'Spin a new fighting stance'},
  {k:'drink',n:'Energy drink',e:'🥤',cost:2,d:'Start the next fight with full energy',na:'Already stocked for the next fight',ok:f=>!(f.next&&f.next.en)},
  {k:'scout',n:'Scouting report',e:'🔭',cost:2,d:'Read the next opponent 20% better',na:'Already scouted for the next fight',ok:f=>!(f.next&&f.next.readB)}
];

const MOD_SRC=['race','rsub','arch','asub','stance','size','back','reinc','weak','quirk','title'];
function eff(f){
  const s={str:f.str.v,spd:f.spd.v,dur:f.dur.v,iq:f.iq.v,wm:f.wm.v,pm:f.pm.v,cha:f.cha&&f.cha.v||5};
  const mods=MOD_SRC.map(k=>f[k]&&f[k].m).concat([f.bonus],synOf(f).map(x=>x.m),gearOf(f).map(g=>g.m),talentsOf(f).map(t=>t.m));
  if(f.race&&PATCH.race[f.race.n])mods.push(PATCH.race[f.race.n]);
  if(f.arch&&PATCH.arch[f.arch.k])mods.push(PATCH.arch[f.arch.k]);
  if(f.inj)for(const j of f.inj){const d=INJK[j.k];if(d)mods.push(d.m);}
  for(const m of mods){if(!m)continue;for(const k in m)if(k in s)s[k]+=m[k];}
  for(const k in s)s[k]=clamp(s[k],1,20);
  return s;
}
const T_ADD=['rizz','regen','venom','critB','dodgeB','dr','drain','extra','wlvl','guardEn','readB','counterB','guardAdd','bluntDR','enRegen','startEn'];
const T_MUL=['dmgX','strikeX','ultX','darkX','behindX','clutchX'];
const T_MAX=['rage','revive','snack'];
const T_BOOL=['unholy','immune','firstStrike','taunt'];
function traitsOf(f){
  const t={pets:[],guardX:0.4,rageAt:null,breath:null};
  T_ADD.forEach(k=>t[k]=0);T_MUL.forEach(k=>t[k]=1);T_MAX.forEach(k=>t[k]=0);T_BOOL.forEach(k=>t[k]=false);
  const srcs=['rsub','asub','stance','back','reinc','quirk','title'].map(k=>f[k]).concat(gearOf(f),talentsOf(f),f.bossFx?[{fx:f.bossFx}]:[]);
  for(const it of srcs){
    const x=it&&it.fx;if(!x)continue;
    for(const a of T_ADD)if(x[a])t[a]+=x[a];
    for(const a of T_MUL)if(x[a])t[a]*=x[a];
    for(const a of T_MAX)if(x[a])t[a]=Math.max(t[a],x[a]);
    for(const a of T_BOOL)if(x[a])t[a]=true;
    if(x.rageAt!=null)t.rageAt=x.rageAt;
    if(x.guardX)t.guardX=Math.min(t.guardX,x.guardX);
    if(x.pet)t.pets.push(x.pet);
    if(x.breath)t.breath=x.breath;
  }
  return t;
}
