// 14 tiers per stat: a much wider power range, from wet tissue to universal
const TW=[5,8,11,13,13,12,11,9,7,5,4,3,2,1];
const TQ=v=>v<=3?0:v<=6?1:v<=10?2:3;
const TIERNAMES={
  str:['Wet tissue','Noodle arms','Mid','Peak human','Superhuman','Wall level','Building level','City level','Mountain level','Continental','Planetary','Stellar','Galactic','Universal'],
  spd:['Sloth','Snail','Jogger','Peak human','Athlete','Supersonic','Hypersonic','Lightning','Lightspeed','Faster than light','Teleport fast','Time-skipping','Omnipresent','Already there'],
  dur:['Wet paper','Glass','Paper','Peak human','Bulletproof','Tank','Bunker','Mountain','Continental','Planetary','Stellar','Cosmic','Immortal','Conceptually unkillable'],
  iq:['One brain cell','Brainrot','Below average','Average','Street smart','Clever','Genius','Prodigy','Mastermind','Galaxy brain','Nearly omniscient','Omniscient','Knows the script','Wrote the script'],
  mast:['Clueless','Beginner','Amateur','Hobbyist','Trained','Skilled','Veteran','Expert','Master','Grandmaster','Legendary','Mythic','Absolute','Transcendent']
};
function tiers(names,key,lab){
  return TIERNAMES[names].map((n,i)=>{
    const v=i+1,it={n,v,w:TW[i],q:TQ(v),lab};
    if(key==='iq'){if(v<=3)it.o=[{w:'weak',n:['Easily confused','Forgets own name'],x:3},{w:'chaos',n:['Unhinged'],x:2},{w:'quirk',n:['Gym rat'],x:2}];else if(v>=10)it.o=[{w:'weak',n:['Easily confused','Forgets own name'],x:0.2},{w:'quirk',n:['Read the manual'],x:2.5}];}
    if(key==='spd'&&v>=10)it.o=[{w:'weak',n:['Bad ankles'],x:0.25},{w:'quirk',n:['Early bird','Cardio king'],x:2}];
    if(key==='spd'&&v<=2)it.o=[{w:'weak',n:['Bad ankles'],x:2}];
    if(key==='dur'&&v<=3)it.o=[{w:'weak',n:['Glass jaw','Fragile bones'],x:2.5},{w:'quirk',n:['Thick skull'],x:0.4}];
    if(key==='dur'&&v>=11)it.o=[{w:'weak',n:['Glass jaw'],x:0.2}];
    if(key==='str'&&v>=11)it.o=[{w:'weapon',n:['Planet-cracker axe','War hammer','Greatsword'],x:2}];
    if(key==='str'&&v<=2)it.o=[{w:'weapon',n:['Wet noodle','Giant lollipop','Rubber chicken'],x:2}];
    return it;
  });
}

