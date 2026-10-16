// ================= ACT II: ten more chapters past the Wheel =================
CHAPTERS.push(
  {n:'Sky Islands',e:'☁️',col:'#7FB8FF',lvl:17,len:13,act:2,intro:'The Wheelmaster falls, and the arena floor splits open to the sky. Floating islands, rope bridges and a pirate who rules the clouds.'},
  {n:'The Underworld',e:'🔥',col:'#E5484D',lvl:19,len:13,act:2,intro:'Below everything, the fights never stop and the floor is always hot. A baron of brimstone keeps the score.'},
  {n:'Clockwork Citadel',e:'⚙️',col:'#C9A25B',lvl:21,len:14,act:2,intro:'Gears the size of houses, and a tiny inventor who has already timed your defeat to the second.'},
  {n:'The Sunken Kingdom',e:'🌊',col:'#2D9CDB',lvl:23,len:14,act:2,intro:'A drowned city full of fighters who learned to hold their breath forever. Its king is very, very large.'},
  {n:'Carnival of Nightmares',e:'🎪',col:'#B388FF',lvl:25,len:14,act:2,intro:'Rides that should not move, laughter with no source, and a ringmaster who never stops smiling.'},
  {n:'The Glacier Court',e:'❄️',col:'#9EE6FF',lvl:27,len:15,act:2,intro:'A palace of ice where every fight is a formal duel. The queen has not lost, or blinked, in a century.'},
  {n:'The Dream Realm',e:'💭',col:'#FFB3D9',lvl:29,len:15,act:2,intro:'Nothing here is real, except the punches. The Sandman decides who wakes up.'},
  {n:'The Void',e:'🕳️',col:'#5A4A7A',lvl:31,len:15,act:2,intro:'Past the edge of the map there is nothing. Something lives in the nothing.'},
  {n:'The Pantheon',e:'⚡',col:'#F2C14E',lvl:33,len:16,act:2,intro:'The gods heard about you. They want a turn.'},
  {n:'The First Wheel',e:'🎡',col:'#FF4F8B',lvl:35,len:16,act:2,intro:'Before the Wheelmaster, before the arena, there was the Wheel. It has been waiting to spin you.'}
);
BOSSES.push(
  {name:'Captain Cumulus',title:'Admiral of the Clouds',e:'☁️',picks:{race:'Harpy',arch:'pirate',size:'Large',weapon:'Boomerang',power:'wind',ench:'swift',stance:'Aggressive',weak:'Electricity',chaos:'crowd',quirk:'Cardio king'},stats:{str:14,spd:16,dur:13,iq:13,wm:14,pm:14},maxHp:320,fx:{dodgeB:.1},aiSkill:.7,phase:{txt:'Captain Cumulus whistles up a storm.',m:{spd:2},fx:{extra:.15}},lines:['The sky is mine. Mind the drop.']},
  {name:'Baron Brimstone',title:'Keeper of the Pit',e:'😈',picks:{race:'Demon',arch:'berserker',size:'Huge',weapon:'Greatsword',power:'fire',ench:'flame',stance:'Reckless',weak:'Water',chaos:'unhinged',quirk:'Built different'},stats:{str:17,spd:13,dur:15,iq:12,wm:15,pm:15},maxHp:340,fx:{rage:50},aiSkill:.7,phase:{txt:'Baron Brimstone sets the whole arena on fire.',m:{str:2},fx:{dmgX:1.15}},lines:['Down here, everyone burns eventually.']},
  {name:'The Clockmaker',title:'Master of the Citadel',e:'⏱️',picks:{race:'Gnome',arch:'alchemist',size:'Small',weapon:'Sledgehammer',power:'time',ench:'echo',stance:'Tactical',weak:'Easily confused',chaos:'main',quirk:'Read the manual'},stats:{str:13,spd:17,dur:14,iq:18,wm:14,pm:17},maxHp:340,fx:{readB:.25,firstStrike:1},aiSkill:.85,phase:{txt:'The Clockmaker winds himself up. Everything speeds up.',m:{spd:3},fx:{extra:.2}},lines:['You lose in four minutes and eleven seconds. I checked.']},
  {name:'Leviathan Rex',title:'King of the Sunken Kingdom',e:'🐋',picks:{race:'Sharkfolk',arch:'tank',size:'Colossal',weapon:'Trident',power:'water',ench:'heavy',stance:'Counter-puncher',weak:'Electricity',chaos:'plot',quirk:'Thick skull'},stats:{str:18,spd:11,dur:19,iq:12,wm:16,pm:15},maxHp:380,fx:{dr:.1,drain:.06},aiSkill:.75,phase:{txt:'Leviathan Rex rises. The water rises with him.',m:{dur:2},fx:{counterB:.3}},lines:['The sea forgives nothing.']},
  {name:'Mister Giggles',title:'Ringmaster of Nightmares',e:'🤡',picks:{race:'Clown',arch:'trickster',size:'Large',weapon:'Rubber chicken',power:'illusion',ench:'cursed',stance:'Showboat',weak:'Loud noises',chaos:'unhinged',quirk:'Secret twin'},stats:{str:15,spd:17,dur:15,iq:17,wm:15,pm:17},maxHp:360,fx:{taunt:1,dodgeB:.12},aiSkill:.85,phase:{txt:'The lights go out. Mister Giggles is everywhere at once.',m:{spd:2},fx:{critB:.15}},lines:['Why so tense? It is only the rest of your life.']},
  {name:'The Frost Queen',title:'Ruler of the Glacier Court',e:'👸',picks:{race:'Elemental',arch:'mage',size:'Large',weapon:'Magic staff',power:'ice',ench:'frost',stance:'Tactical',weak:'Sunlight',chaos:'main',quirk:'Clutch gene'},stats:{str:15,spd:16,dur:17,iq:19,wm:15,pm:19},maxHp:380,fx:{readB:.2,dr:.08},aiSkill:.9,phase:{txt:'The Frost Queen lowers the temperature of the entire court.',m:{pm:2},fx:{ultX:1.3}},lines:['Kneel. It is warmer down there.']},
  {name:'The Sandman',title:'Lord of the Dream Realm',e:'😴',picks:{race:'Djinn',arch:'monk',size:'Average',weapon:'Bare fists',power:'mind',ench:'echo',stance:'Balanced',weak:'Loud noises',chaos:'plot',quirk:'Night owl'},stats:{str:17,spd:18,dur:17,iq:19,wm:17,pm:19},maxHp:390,fx:{readB:.3,regen:4},aiSkill:.9,phase:{txt:'The Sandman yawns. You feel very, very sleepy.',m:{iq:2},fx:{dodgeB:.12}},lines:['Shh. This is only a dream. Mostly.']},
  {name:'Null',title:'The Thing in the Void',e:'🕳️',picks:{race:'Eldritch horror',arch:'necro',size:'Colossal',weapon:'Scythe',power:'negate',ench:'cursed',stance:'Tactical',weak:'No weakness',chaos:'glitch',quirk:'Plot holes'},stats:{str:19,spd:16,dur:19,iq:19,wm:18,pm:19},maxHp:420,fx:{drain:.1,venom:5},aiSkill:.9,phase:{txt:'Null opens. There is nothing inside. It is looking at you.',m:{pm:2,dur:1},fx:{dmgX:1.2}},lines:['...']},
  {name:'Aurelion the Radiant',title:'Champion of the Pantheon',e:'🌞',picks:{race:'Angel',arch:'paladin',size:'Huge',weapon:'Greatsword',power:'light',ench:'holy',stance:'Aggressive',weak:'Overconfident',chaos:'crowd',quirk:'Clutch gene'},stats:{str:20,spd:18,dur:20,iq:18,wm:20,pm:20},maxHp:440,fx:{regen:5,revive:60},aiSkill:.95,phase:{txt:'Aurelion shines so bright the crowd looks away.',m:{str:2},fx:{strikeX:1.25}},lines:['The gods are watching. Do not disappoint them.']},
  {name:'The First Wheel',title:'The Beginning and the End',e:'🎡',picks:{race:'Cosmic warrior',arch:'chosen',size:'Colossal',weapon:'Uno reverse card',power:'reality',ench:'godslayer',stance:'Showboat',weak:'No weakness',chaos:'main',quirk:'Secret twin'},stats:{str:20,spd:20,dur:20,iq:20,wm:20,pm:20},maxHp:500,wheelBoss:1,aiSkill:1,phase:{txt:'The First Wheel spins backwards. Everything you are is up for grabs.',m:{pm:2,spd:2},fx:{ultX:1.4}},lines:['Every wheel you ever spun was me.','Let us find out what you really are.']}
);
ACHIEVEMENTS.push(
  {k:'story11',n:'Head in the Clouds',e:'☁️',q:3,d:'Beat Captain Cumulus in chapter 11'},
  {k:'story12',n:'Hell Raiser',e:'😈',q:3,d:'Beat Baron Brimstone in chapter 12'},
  {k:'story13',n:'Right on Time',e:'⏱️',q:3,d:'Beat the Clockmaker in chapter 13'},
  {k:'story14',n:'Deep Diver',e:'🐋',q:3,d:'Beat Leviathan Rex in chapter 14'},
  {k:'story15',n:'Last Laugh',e:'🤡',q:3,d:'Beat Mister Giggles in chapter 15'},
  {k:'story16',n:'Thaw',e:'👸',q:3,d:'Beat the Frost Queen in chapter 16'},
  {k:'story17',n:'Wide Awake',e:'😴',q:3,d:'Beat the Sandman in chapter 17'},
  {k:'story18',n:'Into the Nothing',e:'🕳️',q:3,d:'Beat Null in chapter 18'},
  {k:'story19',n:'Godslayer',e:'🌞',q:3,d:'Beat Aurelion the Radiant in chapter 19'},
  {k:'story20',n:'The Wheel Has Spoken, Again',e:'🎡',q:3,d:'Beat the First Wheel and finish Act II'}
);
for(const a of ACHIEVEMENTS)ACHK[a.k]=a;
LASTCH=CHAPTERS.length;
CH_PCT.push(...Array.from({length:10},(_,i)=>[0.84+i*0.012,1]));
MERCHANTS.push(['☁️','Sky courier','Delivers anything, anywhere, eventually'],['🔥','Brimstone dealer','Everything is slightly singed'],['⚙️','Gear grinder','Sells parts, and parts of parts'],['🐚','Shell trader','Pays and takes in pearls, mostly'],['🎪','Carnival barker','Step right up, no refunds'],['🧊','Ice sculptor','Beautiful and very cold'],['💤','Dream peddler','Prices change when you blink'],['🕳️','Void merchant','Do not ask where it came from'],['🏛️','Temple keeper','Divine goods at divine prices'],['🎡','The Wheel itself','Everything is a spin']);
// players who already finished the story and were replaying it move on to Act II
function act2Migrate(){
  if(!F||!F.story||F.story.v3)return;
  const S=F.story;S.v3=1;
  if((S.ng||0)>0&&(S.cleared||[]).includes(10)&&S.ch<=10){
    const keep={hp:S.hp,grit:S.grit,cleared:S.cleared};
    F.story=Object.assign(newChapter(11,0),{cleared:keep.cleared,v2:1,v3:1,hp:keep.hp,grit:keep.grit});
    toast('☁️ Act II is open: ten new chapters past the Wheel');
  }
  saveCareer();
}
// boss rush: Act I bosses, then Act II bosses once you have reached them
const rushBosses=()=>F&&F.story&&(F.story.cleared||[]).includes(11)?BOSSES.slice(10,20):BOSSES.slice(0,10);
Object.assign(RULES,{act2:['☁️','Act II',['Beating the Wheelmaster opens Act II: ten more chapters, from the Sky Islands to the First Wheel, with ten new bosses, new merchants and tougher fighters from the top of the rankings.','Boss rush switches to the Act II bosses once you clear chapter 11.']]});
