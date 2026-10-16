// ---------- tap-for-info ----------
const QN=['Cooked tier','Mid tier','Good tier','Goated tier'];
const TAGN={fire:'fire',ice:'ice',lightning:'lightning',water:'water',shadow:'shadow',light:'holy light',poison:'poison',gravity:'gravity',mind:'mind control',blade:'blades',blunt:'blunt hits',ranged:'ranged attacks',wind:'wind',plant:'plants',sonic:'sonic attacks',earth:'earth',boom:'explosions',pet:'pets and summons'};
const WHEELN={race:'race',rsub:'sub-race',arch:'archetype',asub:'specialty',stance:'stance',size:'size',back:'backstory',str:'strength',spd:'speed',dur:'durability',iq:'IQ',weapon:'weapon',wm:'weapon mastery',power:'power',pm:'power mastery',ench:'enchantment',weak:'weakness',chaos:'chaos factor',title:'title'};
const CATN={side:'Sidekick',mut:'Mutator',quirk:'Quirk',gear:'Gear',daily:'Daily wheel',race:'Race',rsub:'Sub-race',arch:'Archetype',asub:'Specialty',stance:'Fighting stance',size:'Size',back:'Backstory',weapon:'Weapon',power:'Power',ench:'Enchantment',weak:'Weakness',chaos:'Chaos factor',title:'Title',syn:'Synergy',arena:'Arena',ach:'Earned title',inj:'Injury',event:'Event',lvl:'Level-up',bonus:'Bonus',str:'Strength tier',spd:'Speed tier',dur:'Durability tier',iq:'IQ tier',wm:'Weapon mastery tier',pm:'Power mastery tier',reinc:'Reincarnation'};
const ARCH_MECH={
  brawler:'Bare fists count as a level 3 weapon.',
  mage:'Spins the Spellbook instead of the normal power wheel: no chance of "No power".',
  assassin:'Always acts first in round 1. +12% crit chance.',
  paladin:'+50% damage to unholy fighters. Spins the Holy powers wheel.',
  berserker:'Hits 35% harder once below 50 HP (the Rage wheel changes that line).',
  tank:'Built to guard. Durability up, speed down.',
  trickster:'+15% dodge chance, and 12% harder to read.',
  necro:'Rises once after dying. Spins the Cursed powers wheel and gets a minion.',
  tamer:'An animal companion attacks every round.',
  monk:'Fast and strong with bare fists.',
  slayer:'+40% damage against fighters rated stronger than them.',
  resilient:'Strength, speed, durability or IQ below Peak human gets spun again.',
  npc:'−1 to everything. It is what it is.',
  chosen:'+2 to everything.'
};
const tagList=t=>(t||[]).map(x=>TAGN[x]||x);
const pctS=v=>Math.round(Math.abs(v)*100)+'%';
function modsText(m){return Object.entries(m||{}).filter(([k,v])=>v&&STATLBL[k]).map(([k,v])=>`${v>0?'+':'−'}${Math.abs(v)} ${STATLBL[k]}`).join(', ');}
function fxLines(fx){
  if(!fx)return [];
  const L=[];
  if(fx.rizz)L.push(`Opponents lose about ${pctS(fx.rizz)} of their turns distracted`);
  if(fx.regen)L.push(`Heals ${fx.regen} HP every round`);
  if(fx.venom)L.push(`Strikes poison the target for ${fx.venom} a round`);
  if(fx.critB)L.push(`+${pctS(fx.critB)} crit chance`);
  if(fx.dodgeB)L.push(`+${pctS(fx.dodgeB)} dodge chance`);
  if(fx.dr)L.push(fx.dr>0?`Takes ${pctS(fx.dr)} less damage`:`Takes ${pctS(fx.dr)} more damage`);
  if(fx.drain)L.push(`Steals ${fx.drain} energy per hit`);
  if(fx.extra)L.push(`+${pctS(fx.extra)} chance of an extra hit`);
  if(fx.wlvl)L.push(`Weapon hits harder (+${fx.wlvl} weapon level)`);
  if(fx.dmgX)L.push(`+${pctS(fx.dmgX-1)} damage`);
  if(fx.strikeX)L.push(`Strikes do +${pctS(fx.strikeX-1)} damage`);
  if(fx.ultX)L.push(`Signature move does +${pctS(fx.ultX-1)} damage`);
  if(fx.rage)L.push(`Hits 35% harder below ${fx.rage} HP`);
  if(fx.rageAt!=null)L.push(fx.rageAt>100?'Always raging: +35% damage':`Berserker rage starts below ${fx.rageAt} HP`);
  if(fx.guardX)L.push(`Guard blocks ${Math.round((1-fx.guardX)*100)}% instead of 60%`);
  if(fx.guardAdd)L.push(`Guard blocks ${pctS(fx.guardAdd)} less`);
  if(fx.guardEn)L.push(`Guarding gives +${fx.guardEn} extra energy`);
  if(fx.readB)L.push(`Reads opponents ${pctS(fx.readB)} better`);
  if(fx.counterB)L.push(`+${pctS(fx.counterB)} counter chance when guarding`);
  if(fx.revive)L.push(`Gets back up once with ${fx.revive} HP`);
  if(fx.pet)L.push(`${fx.pet.e} A ${fx.pet.n} attacks every round`);
  if(fx.unholy)L.push('Counts as unholy: paladins and cathedrals hurt more');
  if(fx.immune)L.push('Immune to poison');
  if(fx.breath)L.push(`Strikes also count as ${TAGN[fx.breath]||fx.breath}`);
  if(fx.firstStrike)L.push('Always acts first in round 1');
  return L;
}
function oddsLines(o){
  return (o||[]).map(x=>{
    const wl=WHEELN[x.w]||x.w;
    if(x.n){const names=x.n.join(', ');return x.x===0?`Removes ${names} from the ${wl} wheel`:`${names}: ${x.x}× ${x.x>1?'more':'less'} likely on the ${wl} wheel`;}
    return `Pushes ${wl} ${x.s>0?'higher':'lower'}`;
  });
}
function findItem(cat,name){
  let list=[];
  switch(cat){
    case 'race':list=RACES;break;
    case 'rsub':{const [r,n]=name.split('/');const s=RSUB[r];return s?s.items.find(x=>x.n===n):null;}
    case 'arch':return ARCHS.find(a=>a.n===name||a.k===name);
    case 'asub':{const [k,n]=name.split('/');const s=ASUB[k];return s?s.items.find(x=>x.n===n):null;}
    case 'stance':list=STANCES;break;case 'size':list=SIZES;break;case 'back':list=BACKS;break;
    case 'weapon':list=WEAPONS;break;case 'power':list=POWER_ALL;break;case 'ench':list=ENCHANTS;break;
    case 'weak':list=WEAKS.concat([CURED]);break;case 'chaos':list=CHAOS;break;case 'title':list=TITLES;break;
    case 'syn':list=SYN;break;case 'arena':list=ARENAS;break;case 'ach':list=ACHIEVEMENTS;break;
    case 'inj':return INJURIES.find(j=>j.k===name||j.n===name);
    case 'event':list=EVENTS;break;case 'quirk':list=QUIRKS;break;case 'side':list=SIDEKICKS;break;case 'mut':list=MUTATORS;break;case 'gear':list=GEAR;break;case 'daily':list=DAILY;break;case 'lvl':list=LEVELUP;break;case 'bonus':list=BONUS;break;
    default:{const W=SEQ.find(w=>w.k===cat);if(W&&W.tier)list=W.items;}
  }
  return list.find(x=>x.n===name)||null;
}
const STAT_INFO={
  str:['💪','Strength','How hard strikes hit. Tiers run 1 to 14, and bonuses can push it up to 20.'],
  spd:['👟','Speed','Who acts first each round, how often attacks get dodged, and the chance of a bonus extra hit when faster.'],
  dur:['🛡️','Durability','How much damage gets shrugged off. Every point of attack above durability makes hits about 32% harder.'],
  iq:['🧠','IQ','Crit chance, how accurately you read the opponent, and how smart autopilot moves are.'],
  wm:['🗡️','Weapon mastery','Adds to strike damage on top of strength and the weapon itself.'],
  pm:['✨','Power mastery','How hard powers hit. Powers cost 25 energy.']
};
const RULES={
  moves:['🎯','How moves work',['You and your opponent pick a move at the same time each round, on the action wheel.','Strike beats Power: it interrupts the cast. Power beats Guard: it breaks through. Guard beats Strike: it blocks and counters.','Feint beats Guard: no damage, but +30 energy and your next hit lands 40% harder. Strike and Power punish a feint.','Focus: +30 energy and your next hit lands 25% harder, but you take 15% more that round. Attacks punish it.','Winning a read gives +15 energy and a momentum point. Each point is +10% damage, up to three. Losing a read wipes your momentum.','Your signature move needs full energy and spins its own wheel: from a whiff (×0.5) to a jackpot (×2.5). Higher mastery tilts it toward the big slices.']],
  read:['🔮','Reading the opponent',['Before each round you get a read on their next move, with how sure you are. The read is right that often.','Higher IQ than them, a Tactical stance, or a scouting report make reads more accurate. Tricksters and Balanced fighters are harder to read.','Smarter opponents notice your habits. Repeat the same move and they start countering it.']],
  energy:['⚡','Energy',['Strike: +25. Guard: +40. Getting hit: +8. Winning the move matchup: +15.','Powers cost 25.','A full bar (100) unlocks the signature move, which uses all of it.']],
  combos:['⚗️','Element combos',['Water soaks a fighter for 2 rounds. Fire sets them burning for 2 rounds.','Lightning on a soaked fighter: Electrocuted, double damage.','A blunt hit on a frozen fighter: Shatter, double damage.','Wind on a burning fighter: Fanned flames, +60%.','Sonic on a frozen fighter: Resonance, +80%.','Plants on a soaked fighter: Overgrowth, +40%.','Ice on a soaked fighter: Flash freeze, they lose their next turn.','Fire on a soaked fighter fizzles for 40% less.']],
  xp:['⬆️','Levels and XP',['Winning a fight gives 10 XP in the Local brawl, 14 in the Regional cup, 20 at the World championship and 8 in the gauntlet. Losing gives 4.','Every level-up spins the level-up wheel for permanent upgrades.','Opponents scale with your level, so leveling never makes things trivial.']],
  coins:['🪙','Coins',['Every win pays 3, every loss pays 1, and gauntlet wins pay 2.','Winning a tournament pays a bonus: 8, 15 or 30 depending on the tier. Each new earned title pays 3.','Spend them in the shop, or on rerolls (2 each) while spinning a new fighter.']],
  belts:['🏆','Belts',['Winning a tournament earns its belt.','Next time you enter that tournament you\'re the defending champion. Lose and the belt is gone.','Winning a Local brawl unlocks the Regional cup, and winning that unlocks the World championship.']],
  nemesis:['😈','Nemesis',['Whoever knocks you out becomes your nemesis.','They show up in your next tournament, on the other side of the bracket, and get a level stronger every time they beat you again.','Beat them for +6 coins, +10 XP and the Revenge Served Cold title.']],
  season:['📜','Seasons',['Every 3 tournaments a new season starts.','The game looks at last season\'s fights plus 400 league fights behind the scenes, then buffs the two weakest races and archetypes and nerfs the two strongest.','The changes stack across seasons, up to 3 points either way.']],
  verdict:['🏷️','Verdict',['Simulates this fighter against 200 random level 1 fighters.','Cooked under 15% wins, Mid under 35%, Decent under 55%, Cracked under 75%, Goated under 90%, Absolute menace above that.']],
  odds:['🎡','Shifting odds',['Slices marked ▲ or ▼ had their odds changed, and the chips above the wheel say why.','Earlier spins push related slices. A vampire makes Sunlight more likely as a weakness, for example.','Your last fighter\'s picks are less likely, picks that won tournaments get nerfed, and slices you haven\'t discovered yet get a small boost.']],
  simodds:['📊','Simulated odds',['The game runs this exact matchup 160 times in this arena with both fighters on autopilot.','Good reads beat these odds. Autopilot doesn\'t use the read at all.']],
  injuries:['🤕','Injuries',['Losing a fight has a 35% chance to cause one, and some events do too.','They lower stats for 1 or 2 tournaments, then heal. A physio session in the shop heals them right away.']],
  reroll:['🎲','Rerolls',['Every new fighter gets one free reroll. After that each reroll costs 2 coins.','A reroll re-spins the last wheel you landed.']],
  karma:['😇','No luck streaks',['Spins never adjust for how lucky or unlucky you have been. Every build plays by the same odds.']],
  scale:['📈','Power scale',['A rough read on how strong a fighter is overall, from Harmless through Street level, City level, Planetary and Universal all the way to Author level.','Stats now run on 14 tiers, and bonuses can push a stat as high as 20, so the gap between fighters can be huge.','Every point of attack above the target\'s durability makes hits about 26% harder, so a Planetary fighter flattens a Street level one.']],
  gear:['🎒','Gear',['Every fighter has an armor slot and a trinket slot.','Buy gear in the shop. A new piece replaces whatever was in that slot.','Opponents in the Regional cup and World championship, and deep in the gauntlet, bring their own gear.']],
  contracts:['📜','Sponsor contracts',['Pick one contract from three offers on your fighter\'s page.','Complete its goal in a fight and it pays coins and XP on top of the normal rewards.','You can drop a contract any time to get three new offers.']],
  daily:['🎁','Daily wheel',['One free spin every day from your fighter\'s page.','Coins, XP, a free trinket, a level-up spin, or nothing at all.']],
  ranks:['🏅','Ranks and fame',['Wins earn fame: more in bigger tournaments, plus bonuses for winning a tournament, beating your nemesis and challenges.','Ranks: Rookie, Contender (25), Pro (70), Elite (150), Champion (280), Legend (450), Mythic (700).','Every rank-up pays coins and a talent point, and unlocks something: bigger tournaments, a shop discount, legendary gear, and finally a golden aura.']],
  talents:['🌟','Talents',['You earn a talent point every level and every rank-up.','Three branches: Offense, Defense and Tactics. Each unlocks top to bottom, and each talent is permanent for that fighter.']],
  legacy:['✦','Legacy',['Retiring a fighter earns legacy points from their level, belts, titles and rank.','Spend them on perks that help every future fighter: starting coins, more XP, extra rerolls, a starting trinket, or starting talent points.']],
  challenge:['⚔️','Challenges',['When you level up, an old rival or a hall of fame legend can show up asking for a fight.','Rivals are nemeses from before, the toughest few are kept. Legends are your own past champions, the best six are kept.','Challenges are a single fight. Winning pays coins, XP and fame.']],
  flick:['👆','Spinning the wheel',['Drag the wheel around and let go. The harder you flick, the longer it spins.','A spin has to go around at least 1½ times to count. Too gentle and it doesn\'t count, so flick again.','Pegs sit between the slices. At the very end a slow wheel can bounce off one and settle back.','Tapping Spin gives it a strong random spin instead. Either way, bigger slices are more likely, because the slice size is the odds.']],
  arena:['🏟️','Arenas',['Every fight spins an arena first. Each changes damage, stats or adds hazards.','Arenas that match either fighter\'s elements are more likely, and the last arena is less likely.']]
};
const STATUS_INFO={
  guard:['🛡️','Guarding','Blocks most of a strike this round and often counters. A power breaks it.'],
  frozen:['❄️','Loses next turn','Frozen, stunned, staggered, chained or tangled: skips their next turn. A blunt hit shatters ice for double damage.'],
  soaked:['💧','Soaked','Lightning does double, plants +40%, ice freezes instantly, fire fizzles. Lasts 2 rounds.'],
  burning:['🔥','Burning','Takes 4 damage a round for 2 rounds. Wind makes it worse, water puts it out.'],
  poison:['🧪','Poisoned','Takes damage at the end of every round for the rest of the fight.']
};
const PILL_INFO={
  crit:['💥','Critical hit','80% extra damage, or 160% against a glass jaw. IQ, assassins, luck and some traits raise the chance.'],
  weak:['🎯','Weak spot','The attack hit their weakness for 80% extra damage.'],
  guard:['🛡️','Guarded','The defender guarded and blocked most of it.'],
  broke:['💔','Guard broken','A power hit a guard: 35% extra damage and the defender lost 25 energy.'],
  interrupted:['✋','Interrupted','The opponent struck while this power was being cast, so it did 60% less.'],
  caught:['⚡','Caught mid-cast','A strike caught the opponent casting a power: 35% extra damage.']
};
const COMBO_INFO={Electrocuted:'Lightning on a soaked fighter: double damage.',Shatter:'A blunt hit on a frozen fighter: double damage, and the ice breaks.','Fanned flames':'Wind on a burning fighter: +60% damage.',Resonance:'Sonic on a frozen fighter: +80% damage.',Overgrowth:'Plants on a soaked fighter: +40% damage.','Flash freeze':'Ice on a soaked fighter: they lose their next turn.'};
const head=(e,t,sub)=>`<div class="ih"><span class="ie">${e||''}</span><div><b>${esc(t)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div></div>`;
const ul=lines=>lines.length?`<ul class="il">${lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:'';
function infoHTML(key){
  const [kind,a,b]=key.split('|');
  if(kind==='mv'){const m=findMove(a);return m?head(m.e,m.n)+`<p>${esc(m.d)}</p><p class="hint">${m.src==='class'?'Class move':m.src==='race'?'Racial move':'Weapon move'}, on the ${{atk:'Attack',def:'Defend',pow:'Skill'}[m.fam]} wheel. Built on ${{strike:'a strike',guard:'a guard',power:'a power move',focus:'a focus',dodge:'a sidestep'}[m.c]||'a move'}, so it wins and loses the same way.</p>`:'';}
  if(kind==='rule'){const r=RULES[a];return r?head(r[0],r[1])+ul(r[2]):'';}
  if(kind==='stat'){const s=STAT_INFO[a];return s?head(s[0],s[1])+`<p>${esc(s[2])}</p>`:'';}
  if(kind==='status'){const s=STATUS_INFO[a];return s?head(s[0],s[1])+`<p>${esc(s[2])}</p>`+`<p class="hint">Tap "Element combos" in a fight's help for more.</p>`:'';}
  if(kind==='pill'){
    if(a==='combo'){return head('⚗️',b,'Element combo')+`<p>${esc(COMBO_INFO[b]||'')}</p>`+ul(RULES.combos[2].slice(1));}
    const p=PILL_INFO[a];return p?head(p[0],p[1])+`<p>${esc(p[2])}</p>`:'';
  }
  if(kind==='move'){return infoHTML('rule|moves');}
  if(kind==='tier'){const t=TIERK[a];if(!t)return '';return head(t.e,t.n,'Tournament')+`<p>${esc(t.d)}.</p>`+ul([t.size?`Winning pays ${t.coins} coins and the belt`:`Wins pay 2 coins and 8 XP each`,t.lock?`Unlock: ${t.lock}`:'Always open',`Wins give ${t.xpW} XP`]);}
  if(kind!=='it')return '';
  const it=findItem(a,b);if(!it)return '';
  const lines=[];
  const mt=modsText(it.m);if(mt)lines.push(mt);
  lines.push(...fxLines(it.fx));
  if(a==='race'){if(it.unholy)lines.push('Unholy: paladins and cathedrals hurt more');if(it.immune)lines.push('Immune to poison');if(RSUB[it.n])lines.push(`Spins the ${RSUB[it.n].label} sub-wheel next`);}
  if(a==='arch'){if(ARCH_MECH[it.k])lines.push(ARCH_MECH[it.k]);lines.push(`Signature move: ${ULTS[it.k]}`);if(ASUB[it.k])lines.push(`Spins the ${ASUB[it.k].label} wheel next`);}
  if(a==='weapon'){lines.push(`Weapon level ${it.l>0?'+':''}${it.l}`);if(it.t&&it.t.length)lines.push(`Counts as ${tagList(it.t).join(' and ')}`);if(it.ranged)lines.push('Ranged: 10% harder to dodge');if(it.uno)lines.push('Once per fight, reflects a big hit back at the attacker');}
  if(a==='power'){lines.push(it.k==='none'?'No power at all':it.passive?'Passive: always on, nothing to spend':`Costs 25 energy to use${it.t&&it.t.length?'. Counts as '+tagList(it.t).join(' and '):''}`);}
  if(a==='ench'&&it.t&&it.t.length)lines.push(`Weapon hits also count as ${tagList(it.t).join(' and ')}`);
  if(a==='weak'){if(it.trig)lines.push(`${tagList(it.trig).join(' and ')} do 80% extra damage to them`.replace(/^./,c=>c.toUpperCase()));if(it.skip)lines.push(`Loses about ${pctS(it.skip)} of turns`);}
  if(a==='arena'){
    if(it.tag)lines.push(...Object.entries(it.tag).map(([t,x])=>`${(TAGN[t]||t).replace(/^./,c=>c.toUpperCase())} ${x>1?'+':'−'}${Math.round(Math.abs(x-1)*100)}%`));
    if(it.stat)lines.push(`Both fighters: ${modsText(it.stat)}`);
    if(it.hazard)lines.push(it.hazard.one?`${Math.round(it.hazard.chance*100)}% chance each round to hit someone for ${it.hazard.dmg}`:`Both fighters take ${it.hazard.dmg} damage every round`);
  }
  if(a==='inj'){return head(it.e,it.n,'Injury')+ul([modsText(it.m),`Lasts ${it.dur} tournament${it.dur>1?'s':''}, or heal it in the shop`]);}
  if(a==='ach'){lines.push('Earning it pays 3 coins');}
  if(it.v)lines.unshift(`Tier ${it.v} of 14`);
  if(a==='gear')lines.unshift(`${RARITY[it.r]?RARITY[it.r].n:'Common'} ${it.slot}`);
  lines.push(...oddsLines(it.o));
  const sub=[CATN[a]||'',it.q!=null&&a!=='ach'?QN[it.q]:''].filter(Boolean).join('. ');
  return head(it.e||'',it.n,sub)+(it.d?`<p>${esc(it.d)}</p>`:'')+ul(lines.filter((l,i,arr)=>l&&arr.indexOf(l)===i&&l!==it.d));
}
// markup helpers used by the renderers
const ik=(cat,name)=>esc(`it|${cat}|${name}`);
const infIt=(cat,it,label)=>it&&!it.skip?`<span class="inf" role="button" tabindex="0" data-info="${ik(cat,it.n)}">${label!=null?label:esc((it.e?it.e+' ':'')+it.n)}</span>`:(label||'');
const infKey=(key,label,cls)=>`<span class="inf${cls?' '+cls:''}" role="button" tabindex="0" data-info="${esc(key)}">${label}</span>`;
function itemKeyFor(k,it,f){if(k==='rsub')return ik('rsub',(f.race?f.race.n:'')+'/'+it.n);if(k==='asub')return ik('asub',(f.arch?f.arch.k:'')+'/'+it.n);return ik(k,it.n);}
function openInfo(key){
  const html=infoHTML(key);if(!html)return;
  $('#infoBody').innerHTML=html;$('#info').hidden=false;$('#infoClose').focus();
}
function closeInfo(){$('#info').hidden=true;}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-info]');
  if(!el)return;
  e.preventDefault();e.stopPropagation();
  openInfo(el.dataset.info);
},true);
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.dataset&&e.target.dataset.info){e.preventDefault();openInfo(e.target.dataset.info);}
  if(e.key==='Escape'){if(!$('#info').hidden)closeInfo();else closeSheet();}
});
$('#infoClose').addEventListener('click',closeInfo);
$('#info').addEventListener('click',e=>{if(e.target.id==='info')closeInfo();});
