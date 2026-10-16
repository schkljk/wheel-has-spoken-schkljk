// ---- v26: move kits. Every class, race and weapon brings its own moves to the combat wheel ----
// fam: which focus the move sits under. c: the engine move it is built on. rm: what makes it special.
const A_=(n,e,fam,c,rm,d)=>({n,e,fam,c,rm,d});
const ARCH_KIT={
  brawler:[A_('Haymaker','🥊','atk','strike',{dmgX:1.8,miss:.3},'+80% damage, but misses 30% of the time'),A_('Combo string','👊','atk','strike',{hits:3,dmgX:.45},'Three quick hits')],
  tank:[A_('Bulwark','🏰','def','guard',{counterX:2.2,buff:{k:'dr',v:.15,r:2}},'Guard and counter hard. Take 15% less for 2 rounds'),A_('Shield bash','🛡️','atk','strike',{dmgX:.9,apply:{s:'stun',ch:.35}},'May stun them for a turn')],
  assassin:[A_('Backstab','🗡️','atk','strike',{critPlus:.5,dmgX:1.1},'+50% crit chance'),A_('Vanish','💨','def','dodge',{dodge:.75},'75% chance to dodge anything but a signature')],
  mage:[A_('Arcane bolt','🔮','pow','power',{pierce:1,dmgX:.9},'A blast guards cannot soften'),A_('Mana shield','💠','def','focus',{buff:{k:'dr',v:.3,r:2},en:10},'Take 30% less damage for 2 rounds')],
  paladin:[A_('Smite','⚡','atk','strike',{dmgX:1.3,unholyX:1.6},'+30% damage, much more against undead and demons'),A_('Lay on hands','🙏','def','focus',{heal:22},'Heal 22 HP')],
  necro:[A_('Drain soul','💀','pow','power',{drainX:.4},'Heal 40% of the damage dealt'),A_('Raise skeleton','🦴','pow','focus',{summon:{e:'🦴',n:'skeleton',x:.55}},'A skeleton fights with you for the rest of the fight')],
  berserker:[A_('Frenzy','😡','atk','strike',{hits:2,dmgX:.95,buff:{k:'vuln',v:.15,r:1}},'Hit twice, but take 20% more next round'),A_('Blood rage','🩸','pow','focus',{buff:{k:'dmgX',v:.35,r:2},selfDmg:8},'Lose 8 HP, deal 35% more for 2 rounds')],
  trickster:[A_('Pickpocket','🫳','atk','strike',{dmgX:.6,steal:25},'Steals 25 energy'),A_('Smoke and mirrors','🪞','def','dodge',{dodge:.55,debuff:{k:'weak',v:.25,r:2}},'Dodge, and they deal 25% less for 2 rounds')],
  monk:[A_('Flurry','🌪️','atk','strike',{hits:4,dmgX:.37,first:1},'Four fast hits, goes first'),A_('Meditate','🧘','def','focus',{heal:12,en:20},'Heal 12 and gain extra energy')],
  chosen:[A_('Destiny','🌟','pow','focus',{buff:{k:'critB',v:.3,r:2}},'+30% crit for 2 rounds'),A_('Heroic strike','⚔️','atk','strike',{dmgX:1.25,behindBonus:.5},'+25% damage, +50% more while behind')],
  resilient:[A_('Grit teeth','😤','def','focus',{healMissing:.4},'Heal 40% of your missing HP'),A_('Second effort','💪','atk','strike',{dmgX:1.1,lowBonus:.8},'+80% damage below half HP')],
  tamer:[A_("Sic 'em",'🐾','atk','strike',{petNow:3,dmgX:.6},'Your companion attacks three times right now'),A_('Call the pack','🐺','pow','focus',{summon:{e:'🐺',n:'wolf',x:.7}},'A wolf joins the fight')],
  npc:[A_('Background character','🧍','def','dodge',{dodge:.68,en:10},'Nobody notices you: big dodge and some energy'),A_('Generic attack','🗨️','atk','strike',{dmgX:1.15,en:20},'A perfectly average hit, somehow 15% harder. Extra energy')],
  slayer:[A_("Hunter's mark",'🎯','pow','focus',{debuff:{k:'vuln',v:.3,r:3}},'They take 30% more damage for 3 rounds'),A_('Silver bolt','🏹','atk','strike',{dmgX:1.2,unholyX:1.5},'+20% damage, +50% against monsters')],
  bard:[A_('Battle hymn','🎶','pow','focus',{buff:{k:'dmgX',v:.25,r:3}},'+25% damage for 3 rounds'),A_('Dissonance','🎸','atk','strike',{dmgX:.8,debuff:{k:'weak',v:.2,r:2}},'They deal 20% less for 2 rounds')],
  ninja:[A_('Shadow step','👣','def','dodge',{dodge:.6,en:15},'Dodge and gain energy'),A_('Kunai barrage','🗡️','atk','strike',{hits:3,dmgX:.4,first:1},'Three thrown blades, goes first')],
  samurai:[A_('Iaido','⚔️','atk','strike',{first:1,critPlus:.3,dmgX:1.15},'Goes first, +30% crit'),A_('Parry','🤺','def','guard',{counterX:2.4},'A guard with a deadly counter')],
  pirate:[A_('Plunder','💰','atk','strike',{dmgX:.9,steal:20,heal:6},'Steal energy and heal a little'),A_('Cannon blast','💣','pow','power',{dmgX:1.5,miss:.25},'+50% damage, misses 25%')],
  alchemist:[A_('Volatile flask','🧪','pow','power',{apply:{s:'random',ch:1}},'Burns, freezes, poisons or soaks them'),A_('Elixir','⚗️','def','focus',{heal:15,cleanse:1},'Heal 15 and cure burns and poison')],
  druid:[A_('Entangle','🌿','pow','power',{dmgX:.6,apply:{s:'stun',ch:.5}},'Half the time they lose a turn'),A_('Barkskin','🌳','def','guard',{buff:{k:'dr',v:.2,r:3}},'Take 20% less for 3 rounds')],
  gunslinger:[A_('Quickdraw','🔫','atk','strike',{first:1,dmgX:1.2},'Goes first, +20% damage'),A_('Fan the hammer','💥','atk','strike',{hits:5,dmgX:.3,miss:.15},'Five shots, some miss')],
  chef:[A_('Snack time','🍔','def','focus',{heal:18,en:10},'Heal 18'),A_('Hot pan','🍳','atk','strike',{dmgX:1.1,apply:{s:'burn',ch:.6}},'May set them on fire')],
  wrestler:[A_('Grapple','🤼','atk','strike',{pierce:1,nododge:1},'Ignores guards and dodges'),A_('Suplex','🌀','atk','strike',{dmgX:1.5,slow:1,apply:{s:'stun',ch:.25}},'+50% damage, may stun, goes second')],
  gambler:[A_('Coin flip','🪙','atk','strike',{gamble:1},'Heads: triple damage. Tails: a miss'),A_('All in','🎰','pow','power',{dmgX:1.8,miss:.3},'+80% damage, misses 30%')],
  streamer:[A_('Hype the chat','📣','pow','focus',{en:45},'+45 energy'),A_('Clip it','🎬','atk','strike',{dmgX:1.1,critPlus:.2},'+20% crit')]
};
const RACE_KIT={
  'Human':A_('Adapt','🧠','pow','focus',{buff:{k:'critB',v:.15,r:2},en:10},'+15% crit for 2 rounds'),
  'Goblin':A_('Dirty trick','🪤','atk','strike',{dmgX:.7,apply:{s:'stun',ch:.3}},'Sand in the eyes: may stun'),
  'Skeleton':A_('Bone rattle','🦴','def','focus',{debuff:{k:'weak',v:.2,r:2}},'Spooky: they deal 20% less for 2 rounds'),
  'Orc':A_('Warcry','📢','pow','focus',{buff:{k:'dmgX',v:.3,r:2}},'+30% damage for 2 rounds'),
  'Elf':A_('Volley','🏹','atk','strike',{hits:3,dmgX:.4},'Three arrows'),
  'Pigeon':A_('Coo menacingly','🐦','def','dodge',{dodge:.5,en:10},'Flutters away'),
  'Raccoon':A_('Rummage','🗑️','pow','focus',{heal:10,en:15},'Finds a snack and some energy'),
  'Slime':A_('Absorb','🫧','def','guard',{counterX:1.3,heal:8},'Guard and heal 8'),
  'Vampire':A_('Bite','🧛','atk','strike',{dmgX:.9,drainX:.6},'Heal 60% of the damage'),
  'Werewolf':A_('Maul','🐺','atk','strike',{dmgX:1.3,apply:{s:'bleed',ch:.5}},'+30% damage, may cause bleeding'),
  'Cyborg':A_('Laser eye','🔴','atk','strike',{pierce:1,dmgX:.9},'Ignores guards'),
  'Ghost':A_('Phase','👻','def','dodge',{dodge:.7},'Turns intangible: big dodge'),
  'Golem':A_('Stone skin','🗿','def','guard',{buff:{k:'dr',v:.25,r:2}},'Take 25% less for 2 rounds'),
  'Demon':A_('Hellfire','🔥','pow','power',{apply:{s:'burn',ch:1},dmgX:1.1},'Sets them on fire'),
  'Angel':A_('Blessing','😇','def','focus',{heal:16},'Heal 16'),
  'Elemental':A_('Elemental surge','🌀','pow','power',{dmgX:1.25},'+25% power damage'),
  'Dragonkin':A_('Dragon breath','🐉','atk','strike',{pierce:1,apply:{s:'burn',ch:.7}},'Burns right through guards'),
  'Cosmic warrior':A_('Starfall','🌠','pow','power',{hits:2,dmgX:.75},'Two meteors'),
  'Titan':A_('Earthshaker','🌋','atk','strike',{dmgX:1.4,slow:1,apply:{s:'stun',ch:.3}},'Huge hit that may stun'),
  'Eldritch horror':A_('Madness','🌀','pow','focus',{debuff:{k:'vuln',v:.25,r:2},steal:15},'They take 25% more for 2 rounds'),
  'Dwarf':A_('Ale break','🍺','def','focus',{heal:14,buff:{k:'dr',v:.1,r:2}},'Heal 14 and toughen up'),
  'Merfolk':A_('Tidal splash','🌊','atk','strike',{apply:{s:'soak',ch:1},dmgX:.8},'Soaks them. Lightning loves that'),
  'Insectoid':A_('Venom sting','🦂','atk','strike',{apply:{s:'poison',ch:1},dmgX:.7},'Poisons them'),
  'Fairy':A_('Pixie dust','✨','def','dodge',{dodge:.5,heal:6},'Dodge and heal a little'),
  'Minotaur':A_('Gore','🐂','atk','strike',{dmgX:1.35,first:1},'Charges first, +35% damage'),
  'Mushroom folk':A_('Spore cloud','🍄','pow','focus',{apply:{s:'poison',ch:1},debuff:{k:'weak',v:.15,r:2}},'Poisons and weakens them'),
  'Zombie':A_('Infect','🧟','atk','strike',{apply:{s:'poison',ch:.8},dmgX:.9},'Infectious bite'),
  'Kitsune':A_('Foxfire','🦊','pow','power',{apply:{s:'burn',ch:1},hits:2,dmgX:.6},'Two fox flames'),
  'Frogfolk':A_('Tongue lash','🐸','atk','strike',{first:1,steal:15,dmgX:.7},'Goes first, steals energy'),
  'Yeti':A_('Avalanche','🏔️','atk','strike',{apply:{s:'freeze',ch:.35},dmgX:1.2},'May freeze them solid'),
  'Sentient toaster':A_('Pop!','🍞','atk','strike',{apply:{s:'burn',ch:.8},first:1,dmgX:.8},'Toast to the face, goes first'),
  'Catfolk':A_('Pounce','🐾','atk','strike',{first:1,critPlus:.25},'Goes first, +25% crit'),
  'Lizardfolk':A_('Shed skin','🦎','def','focus',{heal:12,cleanse:1},'Heal 12 and clear burns and poison'),
  'Harpy':A_('Screech','🦅','pow','focus',{debuff:{k:'weak',v:.25,r:2}},'They deal 25% less for 2 rounds'),
  'Sharkfolk':A_('Frenzy bite','🦈','atk','strike',{dmgX:1.2,lowTargetBonus:.6,drainX:.3},'+60% damage on wounded targets'),
  'Robot':A_('Overclock','🤖','pow','focus',{buff:{k:'dmgX',v:.2,r:3},selfDmg:5},'+20% damage for 3 rounds, overheats a little'),
  'Gnome':A_('Gadget','⚙️','pow','focus',{summon:{e:'⚙️',n:'clockwork turret',x:.6}},'Deploys a turret'),
  'Satyr':A_('Panpipes','🪈','pow','focus',{buff:{k:'critB',v:.2,r:2},en:15},'+20% crit for 2 rounds'),
  'Mummy':A_('Curse of the tomb','⚱️','pow','focus',{debuff:{k:'vuln',v:.2,r:3},apply:{s:'poison',ch:1}},'Curses and poisons them'),
  'Djinn':A_('Wish','🧞','pow','focus',{wish:1},'Random: a big heal, full energy, or a crit buff'),
  'Clown':A_('Pie to the face','🥧','atk','strike',{dmgX:.5,apply:{s:'stun',ch:.45}},'May stun them'),
  'Beefolk':A_('Swarm','🐝','pow','focus',{summon:{e:'🐝',n:'bees',x:.5},apply:{s:'poison',ch:1}},'Bees join the fight'),
  'Snowman':A_('Snowball','❄️','atk','strike',{apply:{s:'freeze',ch:.3},first:1,dmgX:.7},'Goes first, may freeze'),
  'Treant':A_('Root','🌳','def','guard',{heal:10,buff:{k:'dr',v:.15,r:2}},'Dig in: heal and toughen'),
  'Rubber duck':A_('Squeak','🦆','def','dodge',{dodge:.45,debuff:{k:'weak',v:.15,r:1}},'Startles them'),
  'Ratfolk':A_('Plague bite','🐀','atk','strike',{apply:{s:'poison',ch:1},first:1,dmgX:.6},'Goes first, poisons'),
  'Ogre':A_('Club smash','🧌','atk','strike',{dmgX:1.6,miss:.2,slow:1},'+60% damage, but clumsy')
};
function weaponKit(w){
  const n=(w&&w.n)||'',t=(w&&w.t)||[];
  if(w&&w.fists)return A_('Uppercut','👊','atk','strike',{dmgX:1.25,apply:{s:'stun',ch:.15}},'+25% damage, may stun');
  if(/crossbow|bow|rifle/i.test(n))return A_('Aimed shot','🎯','atk','strike',{critPlus:.35,slow:1},'+35% crit, goes second');
  if(/dagger|rapier/i.test(n))return A_('Twin stab','🗡️','atk','strike',{hits:2,dmgX:.6,first:1},'Two quick stabs, goes first');
  if(/katana/i.test(n))return A_('Draw cut','⚔️','atk','strike',{first:1,dmgX:1.2},'Goes first, +20% damage');
  if(/chainsaw/i.test(n))return A_('Rev up','🪚','atk','strike',{hits:3,dmgX:.5,apply:{s:'bleed',ch:.5}},'Three grinding hits');
  if(/hammer|bat|brick|pan|staff$|bo staff/i.test(n))return A_('Stagger','🔨','atk','strike',{dmgX:1.1,apply:{s:'stun',ch:.3}},'May stun them');
  if(/axe|scythe|greatsword/i.test(n))return A_('Cleave','🪓','atk','strike',{dmgX:1.4,slow:1,apply:{s:'bleed',ch:.4}},'+40% damage, may cause bleeding');
  if(/spear|trident|harpoon/i.test(n))return A_('Lunge','🔱','atk','strike',{first:1,dmgX:1.15},'Long reach: goes first');
  if(/whip|nunchuck|fishing/i.test(n))return A_('Lash','〰️','atk','strike',{hits:2,dmgX:.55,steal:10},'Two lashes, steals energy');
  if(/shuriken|chakram|boomerang/i.test(n))return A_('Ricochet','🌀','atk','strike',{hits:2,dmgX:.65},'Hits twice');
  if(/guitar/i.test(n))return A_('Power chord','🎸','atk','strike',{debuff:{k:'weak',v:.15,r:2}},'Deafens them: they deal 15% less');
  if(/chicken|noodle|lollipop|uno/i.test(n))return A_('Bonk','🤪','atk','strike',{dmgX:.6,apply:{s:'stun',ch:.3},en:10},'Silly, but it may stun');
  if(/staff/i.test(n))return A_('Channel','🪄','pow','focus',{en:30,buff:{k:'critB',v:.1,r:2}},'+30 energy, +10% crit');
  if(t.includes('blade'))return A_('Slash','⚔️','atk','strike',{dmgX:1.15,apply:{s:'bleed',ch:.3}},'May cause bleeding');
  return A_('Weapon strike',(w&&w.e)||'⚔️','atk','strike',{dmgX:1.1},'+10% damage');
}
// a fighter's full kit: class moves, a racial move and a weapon move
function kitMoves(f){
  const out=[];
  const add=(m,src)=>{if(!m)return;const c=m.c==='power'&&!(f.power&&f.power.k!=='none'&&!f.power.passive)?'strike':m.c;out.push(Object.assign({},m,{c,src,rm:Object.assign({label:m.n,e:m.e},m.rm)}));};
  for(const m of ARCH_KIT[f.arch&&f.arch.k]||[])add(m,'class');
  add(RACE_KIT[f.race&&f.race.n],'race');
  add(weaponKit(f.weapon),'weapon');
  return out;
}
