// ---- v16: many more races, archetypes, backstories and titles ----
const fw=w=>Math.round(Math.sqrt(w)*100)/100;   // same flattening the rest of the wheels got
const F_=items=>items.map(it=>Object.assign({},it,{w:fw(it.w)}));
const NEW_RACES=[
  {n:'Catfolk',e:'🐱',w:5,q:2,m:{spd:2,dur:-1},fx:null,d:'+2 speed, −1 durability. Lands on their feet',o:[{w:'arch',n:['Ninja','Assassin','Trickster'],x:2},{w:'weak',n:['Water'],x:2.5}],
    sub:{label:'Breed',items:[{n:'Alley cat',e:'🗑️',w:4,q:1,m:{str:1,spd:1},d:'+1 strength, +1 speed'},{n:'House cat',e:'🛋️',w:4,q:0,m:{spd:-1},fx:{regen:3},d:'Naps between rounds: heals 3, −1 speed'},{n:'Sphynx',e:'🥚',w:2.5,q:1,m:{iq:2},d:'+2 IQ. Unsettling'},{n:'Lion-blooded',e:'🦁',w:2,q:3,m:{str:3},d:'+3 strength'},{n:'Void cat',e:'🌑',w:1.2,q:3,fx:{dodgeB:.12},d:'Phases out of the way: +12% dodge'}]}},
  {n:'Lizardfolk',e:'🦎',w:5,q:1,m:{dur:1},fx:{regen:2},d:'+1 durability, regrows tails and HP',o:[{w:'weak',n:['The cold'],x:3}],
    sub:{label:'Species',items:[{n:'Gecko',e:'🦎',w:4,q:1,m:{spd:2},d:'+2 speed'},{n:'Komodo',e:'🐊',w:3,q:2,fx:{venom:4},d:'Venomous bite'},{n:'Chameleon',e:'🎨',w:3,q:2,fx:{dodgeB:.08},d:'+8% dodge'},{n:'Iguana',e:'🌿',w:4,q:1,m:{dur:2},d:'+2 durability'}]}},
  {n:'Harpy',e:'🦅',w:4,q:2,m:{spd:2,iq:-1},d:'+2 speed, −1 IQ. Screeches',o:[{w:'power',n:['Wind','Sonic scream'],x:3},{w:'weapon',n:['Bow','Spear'],x:2}],
    sub:{label:'Bird',items:[{n:'Crow',e:'🐦‍⬛',w:4,q:1,m:{iq:2},d:'+2 IQ. Holds grudges'},{n:'Owl',e:'🦉',w:3,q:2,fx:{darkX:1.25,readB:.08},d:'Strong in the dark, reads better'},{n:'Eagle',e:'🦅',w:3,q:2,m:{spd:2},d:'+2 speed'},{n:'Flamingo',e:'🦩',w:3,q:0,m:{dur:-1},fx:{rizz:.05},d:'Stands on one leg. Fabulous, fragile'}]}},
  {n:'Sharkfolk',e:'🦈',w:4,q:2,m:{str:2,dur:1,iq:-1},d:'+2 strength, +1 durability, −1 IQ',o:[{w:'weapon',n:['Trident'],x:3},{w:'power',n:['Water'],x:3}],
    sub:{label:'Shark',items:[{n:'Hammerhead',e:'🔨',w:3,q:2,fx:{bluntDR:.2},m:{str:1},d:'+1 strength, shrugs off blunt hits'},{n:'Great white',e:'🦷',w:3,q:2,fx:{drain:.1},d:'Bites heal 10% of damage'},{n:'Baby shark',e:'🎵',w:4,q:0,m:{str:-2},fx:{taunt:1},d:'Very catchy, very weak'},{n:'Megalodon',e:'🌊',w:1.2,q:3,m:{str:3,dur:2},d:'+3 strength, +2 durability'}]}},
  {n:'Robot',e:'🤖',w:5,q:2,m:{dur:2,iq:1,spd:-1},fx:{immune:1},d:'+2 durability, +1 IQ, −1 speed. Immune to poison',o:[{w:'weak',n:['Water','Electricity'],x:3},{w:'weapon',n:['Laser rifle','Chainsaw'],x:2.5}],
    sub:{label:'Model',items:[{n:'Vacuum bot',e:'🧹',w:4,q:0,m:{str:-1},fx:{guardEn:10},d:'Mostly bumps into walls'},{n:'Battle droid',e:'🦾',w:3,q:2,m:{str:2},d:'+2 strength'},{n:'Butler bot',e:'🎩',w:3,q:1,fx:{readB:.1},d:'Anticipates your needs: reads 10% better'},{n:'AI chatbot',e:'💬',w:2.5,q:2,m:{iq:3,str:-1},d:'+3 IQ, −1 strength. Confidently wrong sometimes'}]}},
  {n:'Gnome',e:'🧙',w:4,q:1,m:{iq:2,str:-1},d:'+2 IQ, −1 strength. Pointy hat mandatory',o:[{w:'size',n:['Tiny','Small'],x:3},{w:'arch',n:['Alchemist','Trickster'],x:2}],
    sub:{label:'Gnome type',items:[{n:'Garden gnome',e:'🏡',w:4,q:1,m:{dur:2},d:'Made of ceramic: +2 durability'},{n:'Tinker gnome',e:'🔧',w:3,q:2,m:{iq:2},d:'+2 IQ'},{n:'Gnome with a grudge',e:'😠',w:3,q:2,fx:{behindX:1.3},d:'+30% damage while behind'},{n:'Lawn ornament',e:'🗿',w:2,q:0,m:{spd:-2,dur:1},d:'Does not move much'}]}},
  {n:'Satyr',e:'🐐',w:3,q:1,m:{spd:1,iq:1},d:'+1 speed, +1 IQ. Plays the pipes badly',o:[{w:'arch',n:['Bard','Druid'],x:2.5}],
    sub:{label:'Satyr type',items:[{n:'Party goat',e:'🎉',w:4,q:1,fx:{enRegen:5},d:'+5 energy every round'},{n:'Mountain goat',e:'⛰️',w:3,q:2,m:{dur:2},d:'+2 durability'},{n:'Panpiper',e:'🪈',w:3,q:2,m:{pm:2},d:'+2 power mastery'}]}},
  {n:'Mummy',e:'🧻',w:3,q:1,m:{dur:2,spd:-1},fx:{unholy:1},d:'+2 durability, −1 speed. Undead',o:[{w:'weak',n:['Paper cuts'],x:4},{w:'power',n:['Shadow','Summoning'],x:2}],
    sub:{label:'Tomb',items:[{n:'Pharaoh',e:'👑',w:2,q:3,m:{pm:2,dur:1},d:'+2 power mastery, +1 durability'},{n:'Intern mummy',e:'📎',w:4,q:0,m:{str:-1},d:'Wrapped in printer paper'},{n:'Cursed tomb',e:'⚱️',w:3,q:2,fx:{venom:3},d:'A curse that eats at enemies'},{n:'Half unwrapped',e:'🎁',w:3,q:1,m:{spd:1,dur:-1},d:'+1 speed, −1 durability'}]}},
  {n:'Djinn',e:'🧞',w:2.5,q:3,m:{pm:2,iq:1},d:'+2 power mastery, +1 IQ. Grants wishes, technically',o:[{w:'power',n:['Reality warping','Teleportation','Wind'],x:2.5},{w:'power',n:['No power'],x:0.2}],
    sub:{label:'Bond',items:[{n:'Lamp-bound',e:'🪔',w:4,q:1,m:{spd:-1},fx:{revive:20},d:'Pops back out once with 20 HP'},{n:'Free djinn',e:'🕊️',w:3,q:2,m:{spd:2},d:'+2 speed'},{n:'Wish lawyer',e:'⚖️',w:3,q:2,fx:{readB:.15},d:'Reads the fine print: reads 15% better'}]}},
  {n:'Clown',e:'🤡',w:4,q:0,m:{iq:-1},fx:{taunt:1,dodgeB:.05},d:'−1 IQ. Annoying to fight: taunts, dodges',o:[{w:'arch',n:['Trickster','Bard'],x:2.5},{w:'weapon',n:['Rubber chicken','Giant lollipop'],x:3}],
    sub:{label:'Clown type',items:[{n:'Birthday clown',e:'🎈',w:4,q:1,fx:{enRegen:5},d:'+5 energy every round'},{n:'Rodeo clown',e:'🐂',w:3,q:2,m:{spd:2},d:'+2 speed'},{n:'Horror clown',e:'🎪',w:2.5,q:2,m:{str:2},fx:{darkX:1.2},d:'+2 strength, stronger in the dark'},{n:'Sad clown',e:'😢',w:3,q:1,fx:{behindX:1.3},d:'Cries harder when losing: +30% damage behind'}]}},
  {n:'Beefolk',e:'🐝',w:3,q:1,m:{spd:2,dur:-1},fx:{venom:3},d:'+2 speed, −1 durability, stings',o:[{w:'weak',n:['Bees'],x:0},{w:'power',n:['Poison','Summoning'],x:2}],
    sub:{label:'Hive role',items:[{n:'Worker bee',e:'🍯',w:4,q:1,m:{dur:2},d:'+2 durability'},{n:'Drone',e:'💤',w:3,q:0,m:{str:-1},d:'Mostly decorative'},{n:'Royal guard',e:'🛡️',w:3,q:2,m:{str:1,dur:1},d:'+1 strength, +1 durability'},{n:'Queen bee',e:'👑',w:1.3,q:3,fx:{pet:{e:'🐝',n:'swarm',x:1}},d:'Fights with a swarm at her side'}]}},
  {n:'Snowman',e:'☃️',w:3,q:0,m:{dur:1,spd:-2},d:'+1 durability, −2 speed. Melts under pressure',o:[{w:'weak',n:['Sunlight'],x:4},{w:'power',n:['Ice'],x:4}],
    sub:{label:'Snow quality',items:[{n:'Fresh powder',e:'❄️',w:4,q:1,m:{spd:1},d:'+1 speed'},{n:'Packed snow',e:'🧱',w:3,q:2,m:{dur:2},d:'+2 durability'},{n:'Slush',e:'💧',w:3,q:0,m:{dur:-1},d:'−1 durability. Squishy'},{n:'Abominable',e:'👹',w:1.3,q:3,m:{str:3,dur:2},d:'+3 strength, +2 durability'}]}},
  {n:'Treant',e:'🌳',w:3,q:2,m:{dur:3,spd:-2},fx:{regen:3},d:'+3 durability, −2 speed, regrows',o:[{w:'power',n:['Vines','Earthquake'],x:3},{w:'weak',n:['Sunlight'],x:0.2}],
    sub:{label:'Tree',items:[{n:'Sapling',e:'🌱',w:4,q:0,m:{dur:-2,spd:2},d:'Young and bendy: +2 speed, −2 durability'},{n:'Ancient oak',e:'🌳',w:2,q:3,m:{dur:2,str:1},d:'+2 durability, +1 strength'},{n:'Bonsai',e:'🪴',w:3,q:1,m:{iq:2},d:'Tiny and wise: +2 IQ'},{n:'Venus flytrap',e:'🪤',w:3,q:2,fx:{drain:.12},d:'Eats a little of every hit'}]}},
  {n:'Rubber duck',e:'🦆',w:3,q:0,m:{dur:1},fx:{dodgeB:.06},d:'+1 durability, bounces off things. Squeaks',o:[{w:'weak',n:['Water'],x:0},{w:'arch',n:['NPC'],x:2}],
    sub:{label:'Duck',items:[{n:'Bath duck',e:'🛁',w:4,q:0,d:'Just a duck'},{n:'Debugging duck',e:'💻',w:3,q:2,m:{iq:3},d:'Listens to your problems: +3 IQ'},{n:'Giant duck',e:'🎈',w:2,q:2,m:{str:2,dur:1},d:'+2 strength, +1 durability'}]}},
  {n:'Ratfolk',e:'🐀',w:4,q:1,m:{spd:2,str:-1},fx:{immune:1},d:'+2 speed, −1 strength, immune to poison',o:[{w:'arch',n:['Assassin','Alchemist'],x:2},{w:'power',n:['Poison','Summoning'],x:2}],
    sub:{label:'Rat type',items:[{n:'Sewer rat',e:'🕳️',w:4,q:1,m:{dur:1},d:'+1 durability'},{n:'Lab rat',e:'🧪',w:3,q:2,m:{iq:2},d:'+2 IQ'},{n:'Rat king',e:'👑',w:1.3,q:3,fx:{pet:{e:'🐀',n:'rat swarm',x:1}},d:'Commands a rat swarm'},{n:'Chef rat',e:'👨‍🍳',w:2.5,q:2,fx:{snack:30},d:'Cooks a snack below 30 HP'}]}},
  {n:'Ogre',e:'🧌',w:4,q:1,m:{str:3,dur:1,iq:-2},d:'+3 strength, +1 durability, −2 IQ',o:[{w:'size',n:['Large','Huge'],x:2.5},{w:'weapon',n:['War hammer','Brick','Baseball bat'],x:2},{w:'arch',n:['Wrestler','Brawler'],x:2}],
    sub:{label:'Ogre type',items:[{n:'Swamp ogre',e:'🟢',w:4,q:1,m:{dur:1},d:'Layers like an onion: +1 durability'},{n:'Bridge troll',e:'🌉',w:3,q:2,fx:{guardAdd:-0.1},d:'Guards block 10% more'},{n:'Ogre mage',e:'🔮',w:2,q:2,m:{pm:2,iq:1},d:'+2 power mastery, +1 IQ'}]}}
];
for(const r of NEW_RACES){
  const {sub,...race}=r;race.w=fw(race.w);if(!race.fx)delete race.fx;
  RACES.push(race);
  if(sub)RSUB[race.n]={label:sub.label,items:F_(sub.items)};
}
const NEW_ARCHS=[
  {k:'bard',n:'Bard',e:'🎸',w:4,q:2,m:{iq:1},fx:{enRegen:6},d:'+1 IQ, +6 energy every round. Never stops singing',o:[{w:'weapon',n:['Electric guitar'],x:5},{w:'stance',n:['Showboat'],x:2.5}],sub:{label:'Instrument',items:[{n:'Lute',e:'🪕',w:4,q:1,fx:{regen:3},d:'Soothing tunes: heals 3 every round'},{n:'War drums',e:'🥁',w:3,q:2,m:{str:2},d:'+2 strength'},{n:'Kazoo',e:'🎺',w:3,q:0,fx:{taunt:1},d:'Deeply irritating'},{n:'Bagpipes',e:'🎶',w:2.5,q:2,fx:{dmgX:1.08},d:'Pure aggression: +8% damage'}]},ult:'Encore'},
  {k:'ninja',n:'Ninja',e:'🥷',w:4,q:2,m:{spd:2},fx:{dodgeB:.06},d:'+2 speed, +6% dodge',o:[{w:'weapon',n:['Shuriken','Katana'],x:3.5},{w:'power',n:['Teleportation','Clone army','Shadow'],x:2}],sub:{label:'Clan',items:[{n:'Shadow clan',e:'🌑',w:3,q:2,fx:{darkX:1.3},d:'+30% damage in dark arenas'},{n:'Smoke bomb',e:'💨',w:4,q:2,fx:{dodgeB:.08},d:'+8% dodge'},{n:'Mountain clan',e:'⛰️',w:3,q:2,m:{dur:2},d:'+2 durability'},{n:'Ninja-ish',e:'🎭',w:3,q:0,d:'Bought the outfit online'}]},ult:'Shadow barrage'},
  {k:'samurai',n:'Samurai',e:'🏯',w:3,q:2,m:{str:1,wm:2},d:'+1 strength, +2 weapon mastery',o:[{w:'weapon',n:['Katana'],x:5},{w:'stance',n:['Counter-puncher','Balanced'],x:2}],sub:{label:'Code',items:[{n:'Ronin',e:'🍂',w:4,q:2,fx:{critB:.08},d:'+8% crit'},{n:'Honor-bound',e:'🎌',w:3,q:2,m:{dur:2},d:'+2 durability'},{n:'Iaido master',e:'⚔️',w:2,q:3,fx:{firstStrike:1,strikeX:1.15},d:'Acts first in round 1, strikes 15% harder'}]},ult:'Final cut'},
  {k:'pirate',n:'Pirate',e:'🏴‍☠️',w:4,q:1,m:{str:1},fx:{critB:.06},d:'+1 strength, +6% crit. Arr',o:[{w:'weapon',n:['Cursed blade','Trident','Fishing rod'],x:2.5},{w:'weak',n:['Water'],x:0.3}],sub:{label:'Rank',items:[{n:'Deckhand',e:'🧹',w:4,q:0,m:{dur:1},d:'+1 durability'},{n:'First mate',e:'⚓',w:3,q:2,m:{str:1,spd:1},d:'+1 strength, +1 speed'},{n:'Captain',e:'🦜',w:2,q:3,fx:{pet:{e:'🦜',n:'parrot',x:0.7}},m:{iq:1},d:'+1 IQ and a parrot that bites'},{n:'Ghost pirate',e:'👻',w:2,q:2,fx:{dodgeB:.08,unholy:1},d:'+8% dodge, undead'}]},ult:'Broadside'},
  {k:'alchemist',n:'Alchemist',e:'⚗️',w:3,q:2,m:{iq:2,pm:1},d:'+2 IQ, +1 power mastery',o:[{w:'power',n:['Poison','Explosions','Shapeshifting'],x:2.5}],sub:{label:'Specialty',items:[{n:'Potions',e:'🧪',w:4,q:2,fx:{snack:30},d:'Drinks a potion below 30 HP: heals 30'},{n:'Explosives',e:'💣',w:3,q:2,fx:{dmgX:1.1},d:'+10% damage'},{n:'Transmutation',e:'🪙',w:3,q:2,m:{pm:2},d:'+2 power mastery'}]},ult:'Volatile brew'},
  {k:'druid',n:'Druid',e:'🌿',w:3,q:2,m:{pm:2},fx:{regen:2},d:'+2 power mastery, heals 2 every round',o:[{w:'power',n:['Vines','Earthquake','Wind'],x:3},{w:'weapon',n:['Magic staff'],x:2.5}],sub:{label:'Circle',items:[{n:'Circle of the moon',e:'🌙',w:3,q:2,m:{str:2},d:'+2 strength'},{n:'Circle of thorns',e:'🌹',w:3,q:2,fx:{counterB:.25},d:'Counters 25% harder'},{n:'Circle of spores',e:'🍄',w:3,q:2,fx:{venom:3},d:'Spores poison enemies'}]},ult:'Wrath of nature'},
  {k:'gunslinger',n:'Gunslinger',e:'🤠',w:3,q:2,m:{spd:1,wm:2},d:'+1 speed, +2 weapon mastery',o:[{w:'weapon',n:['Laser rifle','Boomerang'],x:3.5},{w:'stance',n:['Aggressive'],x:2}],sub:{label:'Style',items:[{n:'Quickdraw',e:'⚡',w:3,q:2,fx:{firstStrike:1},d:'Always acts first in round 1'},{n:'Sharpshooter',e:'🎯',w:3,q:2,fx:{critB:.1},d:'+10% crit'},{n:'Trick shot',e:'🔄',w:3,q:2,fx:{extra:.12},d:'+12% extra hit chance'}]},ult:'Fan the hammer'},
  {k:'chef',n:'Chef',e:'👨‍🍳',w:4,q:1,m:{str:1,dur:1},fx:{snack:25},d:'+1 strength, +1 durability, snacks when low',o:[{w:'weapon',n:['Frying pan'],x:6},{w:'weak',n:['Weak stomach'],x:0.2}],sub:{label:'Station',items:[{n:'Line cook',e:'🔥',w:4,q:1,m:{spd:1},d:'+1 speed'},{n:'Pastry chef',e:'🧁',w:3,q:1,fx:{regen:3},d:'Heals 3 every round'},{n:'Grill master',e:'🍖',w:3,q:2,m:{str:2},d:'+2 strength'},{n:'Three-star chef',e:'⭐',w:1.3,q:3,m:ALL(1),d:'+1 to everything'}]},ult:'Kitchen nightmare'},
  {k:'wrestler',n:'Wrestler',e:'🤼',w:4,q:1,m:{str:2,dur:1,iq:-1},d:'+2 strength, +1 durability, −1 IQ',o:[{w:'weapon',n:['Bare fists'],x:4},{w:'stance',n:['Showboat'],x:2}],sub:{label:'Persona',items:[{n:'Luchador',e:'🎭',w:3,q:2,m:{spd:2},d:'+2 speed, high flyer'},{n:'Heel',e:'😈',w:3,q:2,fx:{taunt:1,strikeX:1.1},d:'Cheats a little: taunts, strikes 10% harder'},{n:'Face',e:'😇',w:3,q:2,fx:{behindX:1.3},d:'The crowd carries them: +30% damage behind'},{n:'Jobber',e:'🫠',w:3,q:0,d:'Paid to lose'}]},ult:'Piledriver'},
  {k:'gambler',n:'Gambler',e:'🎲',w:3,q:2,m:{iq:1},fx:{critB:.1,dodgeB:.04},d:'+1 IQ, +10% crit, +4% dodge',o:[{w:'power',n:['Absurd luck'],x:4},{w:'weapon',n:['Uno reverse card'],x:3}],sub:{label:'Game',items:[{n:'High roller',e:'💎',w:3,q:2,fx:{critB:.06},d:'+6% more crit'},{n:'Card shark',e:'🃏',w:3,q:2,fx:{readB:.12},d:'Reads 12% better'},{n:'Slot gremlin',e:'🎰',w:3,q:1,fx:{enRegen:6},d:'+6 energy every round'}]},ult:'All in'},
  {k:'streamer',n:'Streamer',e:'📱',w:3,q:1,fx:{taunt:1,enRegen:5},d:'Taunts, +5 energy every round. Chat is watching',o:[{w:'chaos',n:['Main character','Crowd favorite'],x:2.5},{w:'title',n:['Main Event','Aura Farmer'],x:2.5}],sub:{label:'Content',items:[{n:'Speedrunner',e:'⏱️',w:3,q:2,m:{spd:2},d:'+2 speed'},{n:'Fitfluencer',e:'💪',w:3,q:2,m:{str:2},d:'+2 strength'},{n:'Reply guy',e:'💬',w:3,q:0,d:'Well, actually'},{n:'Just chatting',e:'🎙️',w:3,q:1,m:{iq:1},fx:{readB:.08},d:'+1 IQ, reads 8% better'}]},ult:'Ratio'}
];
for(const a of NEW_ARCHS){
  const {sub,ult,...arch}=a;arch.w=fw(arch.w);
  ARCHS.push(arch);ASUB[arch.k]={label:sub.label,items:F_(sub.items)};ULTS[arch.k]=ult;
}
// archetype traits flow into the fight engine like specialties do
{const _tr=traitsOf;traitsOf=function(f){const t=_tr(f);const a=f.arch&&NEW_ARCHS.find(x=>x.k===f.arch.k);if(a&&a.fx){const x=a.fx;for(const k of T_ADD)if(x[k])t[k]+=x[k];for(const k of T_MUL)if(x[k])t[k]*=x[k];for(const k of T_MAX)if(x[k])t[k]=Math.max(t[k],x[k]);for(const k of T_BOOL)if(x[k])t[k]=true;}const r=f.race&&NEW_RACES.find(x=>x.n===f.race.n);if(r&&r.fx){const x=r.fx;for(const k of T_ADD)if(x[k])t[k]+=x[k];for(const k of T_MUL)if(x[k])t[k]*=x[k];for(const k of T_MAX)if(x[k])t[k]=Math.max(t[k],x[k]);for(const k of T_BOOL)if(x[k])t[k]=true;}return t;};}
const NEW_BACKS=[
  {k:'childstar',n:'Former child star',e:'🎬',w:3,q:1,fx:{enRegen:4},m:{iq:-1},d:'+4 energy every round, −1 IQ'},
  {k:'auditor',n:'Ex-tax auditor',e:'🧾',w:3,q:2,m:{iq:2},fx:{readB:.08},d:'+2 IQ, reads 8% better. Finds every mistake'},
  {k:'casino',n:'Grew up in a casino',e:'🎰',w:3,q:2,fx:{critB:.08},d:'+8% crit'},
  {k:'wascat',n:'Was a cat for nine years',e:'🐈',w:2,q:2,m:{spd:1},fx:{dodgeB:.06},d:'+1 speed, +6% dodge'},
  {k:'villain',n:'Retired villain',e:'🦹',w:3,q:2,m:{str:1},fx:{taunt:1},d:'+1 strength, still monologues'},
  {k:'speedran',n:'Speedran their childhood',e:'⏩',w:3,q:1,m:{spd:2,iq:-1},d:'+2 speed, −1 IQ'},
  {k:'goose',n:'Lost a fight to a goose',e:'🪿',w:3,q:0,m:{str:-1},fx:{behindX:1.3},d:'−1 strength, +30% damage when behind. Never again'},
  {k:'monkdrop',n:'Monastery dropout',e:'🧘',w:3,q:1,m:{iq:1},fx:{regen:2},d:'+1 IQ, heals 2 every round'},
  {k:'soul',n:'Sold their soul (refund pending)',e:'👹',w:2,q:2,m:{pm:2,dur:-1},d:'+2 power mastery, −1 durability'},
  {k:'napper',n:'Professional napper',e:'😴',w:3,q:1,m:{spd:-1},fx:{regen:4},d:'−1 speed, heals 4 every round'},
  {k:'storm',n:'Born in a thunderstorm',e:'⛈️',w:2,q:2,m:{pm:1},o:[{w:'power',n:['Lightning'],x:4}],d:'+1 power mastery, lightning likes them'},
  {k:'gymteacher',n:'Former gym teacher',e:'📣',w:3,q:1,m:{str:1,spd:1,iq:-1},d:'+1 strength, +1 speed, −1 IQ'},
  {k:'boyband',n:'Ex-boy band member',e:'🎤',w:2,q:1,fx:{enRegen:5,taunt:1},d:'+5 energy every round, fans heckle opponents'},
  {k:'butterknife',n:'Pulled a sword from a stone (it was a butter knife)',e:'🧈',w:2,q:2,m:{wm:2},d:'+2 weapon mastery'},
  {k:'middlechild',n:'Middle child',e:'👶',w:3,q:0,fx:{dodgeB:.05},d:'Nobody notices them: +5% dodge'},
  {k:'timeloop',n:'Stuck in a time loop',e:'🔁',w:1.5,q:3,m:{iq:2},fx:{readB:.15},d:'+2 IQ, reads 15% better. Has seen this fight before'},
  {k:'mascot',n:'Former team mascot',e:'🦬',w:3,q:1,m:{dur:2,iq:-1},d:'+2 durability, −1 IQ'}
];
for(const b of NEW_BACKS){b.w=fw(b.w);BACKS.push(b);}
const NEW_TITLES=[
  {k:'finalboss',n:'the Final Boss',e:'👹',w:1,q:3,m:ALL(1),d:'+1 to everything'},
  {k:'yapper',n:'Professional Yapper',e:'🗣️',w:3,q:1,fx:{taunt:1},d:'Never stops talking: taunts'},
  {k:'lag',n:'the Lag Spike',e:'📶',w:2,q:2,fx:{dodgeB:.08},d:'+8% dodge'},
  {k:'gymleader',n:'Gym Leader',e:'🏅',w:2,q:2,m:{str:1,dur:1},d:'+1 strength, +1 durability'},
  {k:'npcenergy',n:'NPC Energy',e:'🧍',w:3,q:0,d:'No effect. Just stands there'},
  {k:'plotarmor',n:'Plot Armor',e:'🛡️',w:1.5,q:3,fx:{revive:20},d:'Gets back up once with 20 HP'},
  {k:'cracked',n:'Lowkey Cracked',e:'🔥',w:2,q:2,fx:{critB:.08},d:'+8% crit'},
  {k:'sleeper',n:'the Sleeper Agent',e:'🕶️',w:2,q:2,fx:{clutchX:1.35},d:'+35% damage below 25 HP'},
  {k:'online',n:'Chronically Online',e:'💻',w:3,q:1,m:{iq:2,str:-1},d:'+2 IQ, −1 strength'},
  {k:'fridge',n:'Built Like a Fridge',e:'🧊',w:2,q:2,m:{dur:3,spd:-1},d:'+3 durability, −1 speed'},
  {k:'mcsyndrome',n:'Main Character Syndrome',e:'🌟',w:2,q:2,fx:{behindX:1.25},d:'+25% damage while behind'},
  {k:'writeoff',n:'the Tax Write-off',e:'🧾',w:3,q:0,d:'No effect. Exists for accounting reasons'},
  {k:'sigma',n:'Sigma',e:'🐺',w:2,q:2,m:{spd:1,iq:1},d:'+1 speed, +1 IQ'},
  {k:'him',n:'Him',e:'😤',w:1.2,q:3,m:{str:2,spd:1},d:'+2 strength, +1 speed'},
  {k:'glass',n:'the Glass Cannon',e:'💥',w:2,q:2,m:{str:3,dur:-2},d:'+3 strength, −2 durability'},
  {k:'unc',n:'Unc',e:'👴',w:3,q:1,m:{iq:2,spd:-1},d:'+2 IQ, −1 speed. Still got it'},
  {k:'skillissue',n:'Skill Issue',e:'🫠',w:3,q:0,m:{iq:-1},d:'−1 IQ'}
];
for(const t of NEW_TITLES){t.w=fw(t.w);TITLES.push(t);}
// new races pull toward fitting classes; existing races learn about the new classes too
const ARCH_PULL2={'Elf':{'Bard':1.8,'Druid':2},'Human':{'Samurai':1.4,'Gunslinger':1.4,'Chef':1.4},'Orc':{'Wrestler':2},'Goblin':{'Alchemist':2,'Gambler':1.6},'Raccoon':{'Gambler':2,'Ninja':1.6},'Kitsune':{'Ninja':2},'Mushroom folk':{'Druid':2.5,'Alchemist':1.6},'Skeleton':{'Pirate':2},'Merfolk':{'Pirate':2.2},'Frogfolk':{'Ninja':2},'Sentient toaster':{'Chef':3},'Minotaur':{'Wrestler':2},'Yeti':{'Wrestler':1.8},'Fairy':{'Druid':2,'Bard':1.6},'Cyborg':{'Gunslinger':2},'Treant':{'Druid':3},'Catfolk':{'Gambler':1.5},'Rubber duck':{'Streamer':2},'Clown':{'Streamer':1.8},'Satyr':{'Bard':2.5},'Ratfolk':{'Chef':2}};
for(const [race,pulls] of Object.entries(ARCH_PULL2)){const r=RACES.find(x=>x.n===race);if(!r)continue;for(const [n,x] of Object.entries(pulls))addO(r,{w:'arch',n:[n],x});}
for(const a of ARCHS)ARCHK[a.k]=a;
