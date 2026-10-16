// ---- v21: many more synergies, traits that matter more, softer stat scaling ----
const HAS=(f,k,v)=>f[k]&&(f[k].k===v||f[k].n===v);
SYN.push(
  {k:'samurai_katana',n:'Way of the blade',e:'⚔️',q:3,d:'Samurai with a katana: strikes 20% harder, +8% crit',fx:{strikeX:1.2,critB:.08},test:f=>HAS(f,'arch','samurai')&&f.weapon?.n==='Katana'},
  {k:'ninja_stars',n:'Shadow artist',e:'🥷',q:2,d:'Ninja with shuriken or a chakram: +10% dodge, +1 speed',m:{spd:1},fx:{dodgeB:.1},test:f=>HAS(f,'arch','ninja')&&['Shuriken','Chakram'].includes(f.weapon?.n)},
  {k:'chef_pan',n:'Kitchen nightmare',e:'🍳',q:3,d:'Chef with a frying pan: +2 strength, snacks heal more',m:{str:2},fx:{snack:35},test:f=>HAS(f,'arch','chef')&&/frying pan/i.test(f.weapon?.n||'')},
  {k:'bard_guitar',n:'Headliner',e:'🎸',q:3,d:'Bard with an electric guitar: +10 energy every round, signature 25% harder',fx:{enRegen:10,ultX:1.25},test:f=>HAS(f,'arch','bard')&&f.weapon?.n==='Electric guitar'},
  {k:'pirate_parrot',n:'Captain and crew',e:'🦜',q:2,d:'Pirate with a sea weapon or a water power: +1 strength, +8% crit',m:{str:1},fx:{critB:.08},test:f=>HAS(f,'arch','pirate')&&(['Trident','Harpoon spear','Fishing rod','Cursed blade'].includes(f.weapon?.n)||f.power?.k==='water')},
  {k:'druid_vines',n:'One with the forest',e:'🌳',q:3,d:'Druid or treant with vines or earth: heals 4 every round, +2 power mastery',m:{pm:2},fx:{regen:4},test:f=>(HAS(f,'arch','druid')||f.race?.n==='Treant')&&['vines','earth'].includes(f.power?.k)},
  {k:'gunslinger_draw',n:'Fastest in the west',e:'🤠',q:3,d:'Gunslinger with a ranged weapon: acts first, +10% extra hit chance',fx:{firstStrike:1,extra:.1},test:f=>HAS(f,'arch','gunslinger')&&(f.weapon?.t||[]).includes('ranged')},
  {k:'alch_poison',n:'Mad chemist',e:'🧪',q:2,d:'Alchemist with poison: venom bites harder, immune to poison',fx:{venom:5,immune:1},test:f=>HAS(f,'arch','alchemist')&&f.power?.k==='poison'},
  {k:'wrestler_fists',n:'Main event',e:'🤼',q:2,d:'Wrestler fighting bare-handed: +2 strength, counters 25% harder',m:{str:2},fx:{counterB:.25},test:f=>HAS(f,'arch','wrestler')&&!!f.weapon?.fists},
  {k:'gambler_luck',n:'House always wins',e:'🎰',q:3,d:'Gambler with absurd luck: +15% crit, +8% dodge',fx:{critB:.15,dodgeB:.08},test:f=>HAS(f,'arch','gambler')&&f.power?.k==='luck'},
  {k:'streamer_crowd',n:'Going viral',e:'📈',q:2,d:'Streamer who is the main character or a crowd favorite: +8 energy every round',fx:{enRegen:8},test:f=>HAS(f,'arch','streamer')&&['main','crowd'].includes(f.chaos?.k)},
  {k:'cat_nine',n:'Nine lives',e:'🐈',q:3,d:'Catfolk with a revive anywhere: gets back up with more HP, +6% dodge',fx:{revive:45,dodgeB:.06},test:f=>f.race?.n==='Catfolk'&&(traitsBase(f).revive>0)},
  {k:'shark_water',n:'Apex predator',e:'🦈',q:3,d:'Sharkfolk with water power or in a sea weapon: +2 strength, bites heal 10%',m:{str:2},fx:{drain:.1},test:f=>f.race?.n==='Sharkfolk'&&(f.power?.k==='water'||(f.weapon?.t||[]).includes('water'))},
  {k:'robot_laser',n:'Terminator protocol',e:'🤖',q:3,d:'Robot or cyborg with a laser rifle: +2 weapon mastery, +10% crit',m:{wm:2},fx:{critB:.1},test:f=>['Robot','Cyborg'].includes(f.race?.n)&&f.weapon?.n==='Laser rifle'},
  {k:'snow_ice',n:'Winter is here',e:'☃️',q:3,d:'Snowman or yeti with ice power: +3 durability',m:{dur:3},test:f=>['Snowman','Yeti'].includes(f.race?.n)&&f.power?.k==='ice'},
  {k:'mummy_tomb',n:'Curse of the pharaoh',e:'⚱️',q:2,d:'Mummy with shadow or poison: venom bites, +1 power mastery',m:{pm:1},fx:{venom:4},test:f=>f.race?.n==='Mummy'&&['shadow','poison'].includes(f.power?.k)},
  {k:'djinn_wish',n:'Three wishes',e:'🧞',q:3,d:'Djinn with reality warping or teleportation: +2 power mastery, gets back up once',m:{pm:2},fx:{revive:25},test:f=>f.race?.n==='Djinn'&&['reality','tele'].includes(f.power?.k)},
  {k:'clown_chicken',n:'Honk honk',e:'🤡',q:2,d:'Clown with a rubber chicken, pool noodle or lollipop: opponents read 25% worse, +8% dodge',fx:{taunt:1,dodgeB:.08},test:f=>f.race?.n==='Clown'&&['Rubber chicken','Pool noodle','Giant lollipop'].includes(f.weapon?.n)},
  {k:'bee_swarm',n:'The hive mind',e:'🐝',q:3,d:'Beefolk with summoning or poison: a swarm attacks every round',fx:{pet:{e:'🐝',n:'bee swarm',x:1.1}},test:f=>f.race?.n==='Beefolk'&&['summon','poison'].includes(f.power?.k)},
  {k:'duck_debug',n:'Rubber duck debugging',e:'🦆',q:2,d:'Rubber duck with high IQ: reads 20% better',fx:{readB:.2},test:f=>f.race?.n==='Rubber duck'&&(f.iq?.v||0)>=9},
  {k:'ogre_club',n:'Smash',e:'🧌',q:2,d:'Ogre with a blunt weapon: blunt hits land 20% harder',fx:{strikeX:1.2},test:f=>f.race?.n==='Ogre'&&(f.weapon?.t||[]).includes('blunt')},
  {k:'tamer_dragon',n:'Dragon rider',e:'🐉',q:3,d:'Beast tamer or dragonkin with a tiny dragon sidekick: +2 strength, the dragon hits harder',m:{str:2},fx:{pet:{e:'🔥',n:'dragon fire',x:1}},test:f=>(HAS(f,'arch','tamer')||f.race?.n==='Dragonkin')&&f.side?.k==='dragon'},
  {k:'squire_knight',n:'Knight and squire',e:'🛡️',q:2,d:'Paladin or tank with a squire: guards block 10% more, +1 durability',m:{dur:1},fx:{guardAdd:-0.1},test:f=>(HAS(f,'arch','paladin')||HAS(f,'arch','tank'))&&f.side?.k==='squire'},
  {k:'coach_gym',n:'Training montage',e:'🏋️',q:2,d:'A personal coach with the gym rat quirk or a gym teacher past: +2 strength, +1 speed',m:{str:2,spd:1},test:f=>f.side?.k==='coach'&&(f.quirk?.k==='gymrat'||f.back?.k==='gymteacher')},
  {k:'goose_rematch',n:'Revenge on the goose',e:'🪿',q:2,d:'Lost a fight to a goose and became a sore loser: +40% damage while behind',fx:{behindX:1.4},test:f=>f.back?.k==='goose'&&f.quirk?.k==='sore'},
  {k:'timeloop_reader',n:'I have seen this before',e:'🔁',q:3,d:'Stuck in a time loop with high IQ: reads 25% better, counters harder',fx:{readB:.25,counterB:.15},test:f=>f.back?.k==='timeloop'&&(f.iq?.v||0)>=8},
  {k:'glasscannon_title',n:'All gas, no brakes',e:'💥',q:2,d:'The Glass Cannon with an aggressive or reckless stance: +15% damage',fx:{dmgX:1.15},test:f=>f.title?.k==='glass'&&['aggressive','reckless'].includes(f.stance?.k)},
  {k:'nightowl_shadow',n:'Nocturnal',e:'🦉',q:2,d:'Owl, cat or bat-winged fighter with the night owl quirk: +40% damage in the dark',fx:{darkX:1.4},test:f=>f.quirk?.k==='owl'&&(['Harpy','Catfolk','Vampire'].includes(f.race?.n))},
  {k:'phoenix_fire',n:'Rebirth in flame',e:'🔥',q:3,d:'Fire power with a phoenix feather or phoenix robe: gets back up with 50 HP',fx:{revive:50},test:f=>f.power?.k==='fire'&&['phoenix','phoenixrobe'].some(k=>Object.values(f.gear||{}).includes(k))},
  {k:'fullset_mythic',n:'Touched by the Wheel',e:'🎡',q:3,d:'Wearing two or more mythic pieces: +2 to everything',m:ALL(2),test:f=>Object.values(f.gear||{}).filter(k=>GEARK[k]&&GEARK[k].r==='mythic').length>=2},
  {k:'junk_pile',n:'Dumpster champion',e:'🗑️',q:1,d:'Wearing two or more junk pieces with pride: +2 durability, taunts',m:{dur:2},fx:{taunt:1},test:f=>Object.values(f.gear||{}).filter(k=>GEARK[k]&&GEARK[k].r==='junk').length>=2},
  {k:'speedster_boots',n:'Gotta go fast',e:'💨',q:2,d:'Speed of lightning or faster in rocket or seven-league boots: +10% extra hit chance',fx:{extra:.1},test:f=>(f.spd?.v||0)>=8&&['rocket','sevenleague'].includes((f.gear||{}).boots)}
);
// synergy traits feed the engine; also make every trait a little stronger relative to raw stats
function traitsBase(f){return _trBase(f);}
const _trBase=traitsOf;
{
  const T_AMP=1.5;
  const amp=x=>{if(!x||x.__amp)return;x.__amp=1;
    for(const k of T_ADD)if(typeof x[k]==='number')x[k]=Math.round(x[k]*T_AMP*1000)/1000;
    for(const k of T_MUL)if(typeof x[k]==='number')x[k]=Math.round((1+(x[k]-1)*T_AMP)*1000)/1000;
    if(x.pet&&x.pet.x)x.pet.x=Math.round(x.pet.x*1.3*100)/100;};
  const lists=[STANCES,BACKS,QUIRKS,TITLES,SIDEKICKS,GEAR,TALENTS,...Object.values(RSUB).map(s=>s.items),...Object.values(ASUB).map(s=>s.items),NEW_RACES,NEW_ARCHS];
  for(const L of lists)for(const it of L)if(it&&it.fx)amp(it.fx);
  for(const s of SYN)if(s.fx)amp(s.fx);
}
traitsOf=function(f){
  const t=_trBase(f);
  for(const s of synOf(f)){const x=s.fx;if(!x)continue;
    for(const k of T_ADD)if(x[k])t[k]+=x[k];for(const k of T_MUL)if(x[k])t[k]*=x[k];for(const k of T_MAX)if(x[k])t[k]=Math.max(t[k],x[k]);for(const k of T_BOOL)if(x[k])t[k]=true;if(x.pet)t.pets.push(x.pet);}
  return t;
};
