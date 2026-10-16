// ===== CHARACTER ART =====
const OL='#1A1328';
const SO=`stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"`;
function hashStr(s){let h=7;s=String(s||'');for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
const HUMAN_SKIN=['#FFDBAC','#F1C27D','#E0AC69','#C68642','#8D5524','#5C3A21'];
const HAIR=['#2B1B12','#5A3825','#C9A25B','#A33A1D','#1F1F1F','#D8D2C8','#7B4A2D'];
const OUTFIT={brawler:['#E53935','#37474F'],mage:['#3949AB','#1A237E'],assassin:['#2E3440','#11151C'],paladin:['#CFD8DC','#78909C'],berserker:['#8D6E63','#4E342E'],tank:['#90A4AE','#455A64'],trickster:['#8E24AA','#FDD835'],necro:['#4A148C','#1B0B2E'],tamer:['#558B2F','#33691E'],monk:['#FB8C00','#BF360C'],slayer:['#795548','#3E2723'],npc:['#BCAAA4','#8D6E63'],chosen:['#FFF8E1','#FFB300'],resilient:['#00897B','#004D40']};
const RSKIN={Goblin:'#7CB342',Skeleton:'#EFE9DA',Orc:'#6E8B3D',Elf:'#F6D9B5',Pigeon:'#9AA3AD',Raccoon:'#8E8E93',Slime:'#5DD39E',Vampire:'#DCE1EA',Werewolf:'#8D6E63',Cyborg:'#AAB7C4',Ghost:'#F4F6FF',Golem:'#9E9A90',Demon:'#D9443F',Angel:'#FBE3C4',Elemental:'#FF9F43',Dragonkin:'#2E9E8F','Cosmic warrior':'#3B4CCA',Titan:'#B08968','Eldritch horror':'#7E57C2',Insectoid:'#6A8F3A',Minotaur:'#7B5137','Mushroom folk':'#F3E5D0',Zombie:'#8FAF8A',Kitsune:'#F08A3C',Frogfolk:'#6DBE45',Yeti:'#EEF2F6','Sentient toaster':'#CFD8DC'};
const SUBSKIN={'Elemental/Fire':'#FF7A2F','Elemental/Ice':'#8FDFFF','Elemental/Storm':'#FFE14D','Elemental/Water':'#3D8BFF','Elemental/Earth':'#A0805A','Elemental/Void':'#4A2C7A','Dragonkin/Red':'#D9443F','Dragonkin/White':'#E8F1F5','Dragonkin/Blue':'#3D7BFF','Dragonkin/Black':'#4A4A55','Dragonkin/Gold':'#E8B33A','Golem/Clay':'#C08457','Golem/Iron':'#6F7A85','Golem/Flesh':'#D99A8C','Golem/Diamond':'#B9F2FF','Slime/Acid slime':'#B6F23B','Slime/Metal slime':'#B0BEC5','Slime/King slime':'#4FC3F7','Demon/Ninth circle':'#7FB8FF','Angel/Fallen':'#C9B9D6','Insectoid/Hive queen':'#8E44AD','Frogfolk/Poison dart':'#1E88E5','Kitsune/Nine tails':'#F4F1EC','Zombie/Fresh':'#A5C4A0'};
const PAURA={fire:'#FF7A2F',ice:'#7FE3FF',lightning:'#FFE14D',water:'#3D8BFF',shadow:'#1B0B2E',light:'#FFE082',tk:'#A1887F',mind:'#FF4FD8',tele:'#B388FF',regen:'#4CD964',luck:'#7CB342',poison:'#B6F23B',gravity:'#6B2FBF',clones:'#B0BEC5',shape:'#26A69A',time:'#CFD8DC',reality:'#FF4F8B',negate:'#E53935',smite:'#FFD54F',ward:'#FFF3B0',miracle:'#FFFDE7',drain:'#B71C1C',chains:'#37474F',arcane:'#B388FF',earth:'#A1887F',wind:'#CFF4FF',sonic:'#FFD180',vines:'#66BB6A',boom:'#FF7043',magnet:'#B0BEC5',illusion:'#E1BEE7',summon:'#9575CD'};
const EGLOW={flame:'#FF7A2F',frost:'#7FE3FF',thunder:'#FFE14D',holy:'#FFF3B0',vamp:'#D50000',cursed:'#8E24AA',godslayer:'#FFD54F',sharp:'#E0F7FA',venom:'#76FF03',lucky:'#7CB342',heavy:'#90A4AE',swift:'#E0F7FA',echo:'#B388FF'};
const SIZE_H={Tiny:0.72,Small:0.86,Average:1,Large:1.1,Huge:1.2,Colossal:1.32};
const BODY={Slime:'slime',Ghost:'ghost',Pigeon:'pigeon',Golem:'golem',Elemental:'elemental','Eldritch horror':'eldritch','Sentient toaster':'toaster'};
const limb=(x1,y1,x2,y2,w,c)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${OL}" stroke-width="${w+2.2}" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const EYES=`<g class="ey"><circle cx="55" cy="33" r="2.2" fill="${OL}"/><circle cx="61.5" cy="33" r="2.2" fill="${OL}"/></g>`;
const XEYES=`<g class="xe"><path d="M52.8 30.8l4.4 4.4M57.2 30.8l-4.4 4.4M59.3 30.8l4.4 4.4M63.7 30.8l-4.4 4.4" stroke="${OL}" stroke-width="1.7" stroke-linecap="round"/></g>`;
const MOUTH=`<path d="M56 41 Q59 43.5 62.5 40.5" stroke="${OL}" fill="none" stroke-width="1.7" stroke-linecap="round"/>`;
function lookOf(f){return {name:f.name,race:f.race&&f.race.n,rsub:f.rsub&&f.rsub.n,arch:f.arch&&f.arch.k,size:f.size&&f.size.n,weapon:f.weapon&&f.weapon.n,power:f.power&&f.power.k,ench:f.ench&&f.ench.k};}

function weaponSVG(n,ench){
  const glow=n&&EGLOW[ench]?`<circle cx="0" cy="-20" r="15" fill="${EGLOW[ench]}" opacity=".38"/>`:'';
  const S=`stroke="${OL}" stroke-width="1.6"`;
  let g='';
  switch(n){
    case 'Wet noodle':g=`<path d="M0 2 q-5 -6 0 -12 q5 -6 0 -12 q-5 -6 0 -12" stroke="#F4D35E" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;break;
    case 'Rubber chicken':g=`<ellipse cx="0" cy="-13" rx="5" ry="12" fill="#FFD54F" ${S}/><circle cx="0" cy="-26" r="3.2" fill="#E53935"/><path d="M3 -23 l6 2 l-6 2z" fill="#FB8C00"/>`;break;
    case 'Frying pan':g=`<rect x="-1.6" y="-12" width="3.2" height="13" fill="#3E2723"/><circle cx="0" cy="-20" r="9" fill="#37474F" ${S}/><circle cx="-2" cy="-22" r="3" fill="#546E7A"/>`;break;
    case 'Brick':g=`<rect x="-7" y="-13" width="14" height="10" rx="1.5" fill="#B5523B" ${S}/><path d="M-7 -8 h14 M0 -13 v5" stroke="#E8C9B8" stroke-width="1"/>`;break;
    case 'Baseball bat':g=`<path d="M-1.6 3 L1.6 3 L4.5 -30 Q0 -34 -4.5 -30 Z" fill="#C8A26B" ${S}/>`;break;
    case 'Dagger':g=`<rect x="-1.6" y="-3" width="3.2" height="7" fill="#5D4037"/><rect x="-5.5" y="-6" width="11" height="3" rx="1" fill="#B0BEC5" ${S}/><path d="M-2.8 -6 L2.8 -6 L0 -22 Z" fill="#ECEFF1" ${S}/>`;break;
    case 'Bow':g=`<path d="M-2 16 Q16 0 -2 -16" stroke="#8D6E63" stroke-width="3.2" fill="none"/><line x1="-2" y1="16" x2="-2" y2="-16" stroke="#E0E0E0" stroke-width="1"/>`;break;
    case 'Katana':g=`<rect x="-1.8" y="-2" width="3.6" height="9" fill="#212121"/><ellipse cx="0" cy="-3" rx="5" ry="1.8" fill="#FFC107"/><path d="M-1.8 -4 Q-3 -24 2 -42 L3.6 -41 Q0.5 -24 1.8 -4 Z" fill="#ECEFF1" ${S}/>`;break;
    case 'War hammer':g=`<rect x="-1.8" y="-34" width="3.6" height="38" fill="#6D4C41" ${S}/><rect x="-10" y="-42" width="20" height="11" rx="2" fill="#90A4AE" ${S}/>`;break;
    case 'Scythe':g=`<rect x="-1.5" y="-44" width="3" height="48" fill="#5D4037"/><path d="M0 -44 Q20 -44 26 -28 Q14 -37 0 -37 Z" fill="#CFD8DC" ${S}/>`;break;
    case 'Trident':g=`<rect x="-1.5" y="-38" width="3" height="42" fill="#FFB300"/><path d="M-8 -48 V-38 H8 V-48 M0 -54 V-38" stroke="#FFB300" stroke-width="3" fill="none" stroke-linecap="round"/>`;break;
    case 'Chainsaw':g=`<rect x="-6" y="-10" width="12" height="12" rx="2" fill="#FB8C00" ${S}/><rect x="-3.5" y="-36" width="7" height="27" rx="3.5" fill="#B0BEC5" ${S}/><path d="M-3.5 -34 V-11" stroke="#37474F" stroke-width="1.5" stroke-dasharray="2 2"/>`;break;
    case 'Laser rifle':g=`<rect x="-3.5" y="-28" width="7" height="30" rx="2" fill="#37474F" ${S}/><rect x="-1.5" y="-38" width="3" height="11" fill="#78909C"/><circle cx="0" cy="-39" r="3" fill="#FF1744"/>`;break;
    case 'Uno reverse card':g=`<g transform="rotate(20)"><rect x="-7" y="-20" width="14" height="20" rx="2" fill="#E53935" ${S}/><path d="M-7 -10 h14 v8 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2z" fill="#1E88E5"/><ellipse cx="0" cy="-10" rx="4" ry="6" fill="#fff" transform="rotate(30 0 -10)"/></g>`;break;
    case 'Cursed blade':g=`<rect x="-1.8" y="-2" width="3.6" height="8" fill="#212121"/><path d="M-6 -4 h12" stroke="#4A148C" stroke-width="3"/><path d="M-3 -5 L3 -5 L1 -40 L-1 -40 Z" fill="#4A148C" stroke="#CE93D8" stroke-width="1.4"/>`;break;
    case 'Planet-cracker axe':g=`<rect x="-2" y="-44" width="4" height="48" fill="#4E342E" ${S}/><path d="M2 -46 Q20 -52 22 -34 Q20 -22 2 -26 Z M-2 -46 Q-16 -50 -18 -36 Q-16 -26 -2 -28 Z" fill="#7E57C2" ${S}/><circle cx="12" cy="-38" r="2" fill="#FFF59D"/>`;break;
    case 'Spear':g=`<rect x="-1.4" y="-46" width="2.8" height="50" fill="#8D6E63"/><path d="M-4 -46 L0 -58 L4 -46 Z" fill="#CFD8DC" ${S}/>`;break;
    case 'Magic staff':g=`<rect x="-1.6" y="-40" width="3.2" height="44" fill="#6D4C41"/><circle cx="0" cy="-44" r="5" fill="#B388FF" ${S}/><circle cx="-1.5" cy="-45.5" r="1.6" fill="#fff"/>`;break;
    case 'Greatsword':g=`<rect x="-2" y="-2" width="4" height="10" fill="#4E342E"/><rect x="-8" y="-5" width="16" height="3.5" rx="1" fill="#FFC107" ${S}/><path d="M-3.6 -5 L3.6 -5 L3 -48 L0 -54 L-3 -48 Z" fill="#ECEFF1" ${S}/>`;break;
    case 'Shuriken':g=`<path d="M0 -20 L3 -13 L10 -10 L3 -7 L0 0 L-3 -7 L-10 -10 L-3 -13 Z" fill="#90A4AE" ${S}/><circle cx="0" cy="-10" r="1.6" fill="${OL}"/>`;break;
    case 'Boomerang':g=`<path d="M-2 2 Q-4 -18 8 -26 L11 -22 Q2 -16 3 2 Z" fill="#C8A26B" ${S}/>`;break;
    case 'Electric guitar':g=`<rect x="-1.6" y="-34" width="3.2" height="22" fill="#5D4037"/><rect x="-3" y="-40" width="6" height="7" rx="1" fill="#212121"/><path d="M-9 -12 Q-12 -2 -6 2 Q0 4 6 2 Q12 -2 9 -12 Q5 -8 0 -10 Q-5 -8 -9 -12 Z" fill="#E53935" ${S}/>`;break;
    case 'Whip':g=`<rect x="-1.6" y="-8" width="3.2" height="10" fill="#4E342E"/><path d="M0 -8 Q10 -20 2 -30 Q-8 -40 6 -48" stroke="#6D4C41" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;break;
    case 'Nunchucks':g=`<rect x="-2" y="-14" width="4" height="15" rx="2" fill="#212121"/><path d="M0 -14 Q6 -18 8 -22" stroke="#9E9E9E" stroke-width="1.2" fill="none"/><rect x="6" y="-36" width="4" height="15" rx="2" fill="#212121" transform="rotate(15 8 -28)"/>`;break;
    case 'Fishing rod':g=`<path d="M0 4 L2 -50" stroke="#8D6E63" stroke-width="2.4"/><path d="M2 -50 Q14 -40 12 -18" stroke="#E0E0E0" stroke-width=".8" fill="none"/><circle cx="12" cy="-16" r="2.2" fill="#E53935"/>`;break;
    case 'Giant lollipop':g=`<rect x="-1.4" y="-24" width="2.8" height="28" fill="#FFFFFF" ${S}/><circle cx="0" cy="-32" r="10" fill="#FF80AB" ${S}/><path d="M0 -32 m-6 0 a6 6 0 1 0 6 -6" stroke="#fff" stroke-width="2" fill="none"/>`;break;
    default:g='';
  }
  return glow+g;
}
function headAcc(a,o1,o2){
  switch(a){
    case 'brawler':return `<rect x="36" y="24.5" width="28.5" height="4.6" fill="#E53935" ${SO}/><path d="M37 26.5 L28 31 M37 27.5 L29 34" stroke="#E53935" stroke-width="2.6" stroke-linecap="round"/>`;
    case 'mage':return `<ellipse cx="50" cy="22" rx="19" ry="4.2" fill="${o1}" ${SO}/><path d="M38 21 Q46 8 59 -3 Q56 11 62.5 21 Z" fill="${o1}" ${SO}/><circle cx="52" cy="11" r="2" fill="#FFEB3B"/>`;
    case 'assassin':return `<path d="M34 40 Q31 15 50 15 Q67 15 67 30 L65 31 Q56 22 45 26 Q38 30 38 45 Z" fill="${o1}" ${SO}/><rect x="51" y="37" width="15.5" height="7" rx="3" fill="${o2}" ${SO}/>`;
    case 'necro':return `<path d="M34 40 Q31 15 50 15 Q67 15 67 30 L65 31 Q56 22 45 26 Q38 30 38 45 Z" fill="${o1}" ${SO}/>`;
    case 'paladin':return `<path d="M35 35 Q35 18 50 18 Q65 18 65 35 L65 39 L35 39 Z" fill="#CFD8DC" ${SO}/><rect x="52" y="30" width="13" height="2.8" fill="${OL}"/><path d="M47 18 Q45 5 53 3 Q51 10 53 18 Z" fill="#E53935" ${SO}/>`;
    case 'tank':return `<rect x="33.5" y="17" width="33" height="27" rx="10" fill="#90A4AE" ${SO}/><rect x="51" y="29" width="14" height="3" fill="${OL}"/>`;
    case 'berserker':return `<path d="M36 29 Q36 18 50 18 Q64 18 64 29 Z" fill="#9E9E9E" ${SO}/><path d="M37 24 Q27 20 29 7 Q33 18 41 21 Z M63 24 Q73 20 71 7 Q67 18 59 21 Z" fill="#FFF8E1" ${SO}/>`;
    case 'trickster':return `<path d="M37 27 Q29 9 20 14 Q30 15 41 25 Z" fill="#8E24AA" ${SO}/><path d="M61 26 Q70 7 80 13 Q70 15 59 24 Z" fill="#FDD835" ${SO}/><path d="M36 28 Q50 14 64 28 Z" fill="#8E24AA" ${SO}/><circle cx="20" cy="14" r="2.4" fill="#FDD835"/><circle cx="80" cy="13" r="2.4" fill="#8E24AA"/>`;
    case 'tamer':return `<ellipse cx="50" cy="23" rx="18.5" ry="3.6" fill="#6D4C41" ${SO}/><path d="M40 23 Q41 12 50 12 Q59 12 60 23 Z" fill="#795548" ${SO}/><path d="M58 15 Q68 5 73 7 Q66 12 60 18 Z" fill="#E53935"/>`;
    case 'slayer':return `<path d="M35.5 27 Q50 18 64.5 27 L64.5 31 Q50 24 35.5 31 Z" fill="#B71C1C" ${SO}/><path d="M36 29 L29 33 M36 30 L30 36" stroke="#B71C1C" stroke-width="2.4" stroke-linecap="round"/><path d="M59 34 l3.5 7" stroke="#B71C1C" stroke-width="1.4"/>`;
    case 'chosen':return `<path d="M39.5 22 L41.5 12 L46 18.5 L50 10 L54 18.5 L58.5 12 L60.5 22 Z" fill="#FFC107" ${SO}/>`;
    case 'resilient':return `<rect x="41" y="23" width="15" height="4.2" rx="2" fill="#FFFDE7" ${SO} transform="rotate(-14 48 25)"/><path d="M58 38 h5 M60.5 35.5 v5" stroke="#E57373" stroke-width="1.6"/>`;
    default:return '';
  }
}
function torsoAcc(a,o1,o2){
  switch(a){
    case 'paladin':return `<path d="M50 59 v13 M45 63.5 h10" stroke="#FFC107" stroke-width="2.6"/>`;
    case 'tank':return `<rect x="40" y="56" width="20" height="18" rx="4" fill="#B0BEC5" ${SO}/><ellipse cx="38" cy="54" rx="6" ry="4.5" fill="#78909C" ${SO}/><ellipse cx="62" cy="54" rx="6" ry="4.5" fill="#78909C" ${SO}/>`;
    case 'berserker':return `<path d="M36 55 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5" fill="none" stroke="#D7CCC8" stroke-width="3"/>`;
    case 'trickster':return `<path d="M50 56 l6 8 l-6 8 l-6 -8z" fill="#FDD835" ${SO}/>`;
    case 'monk':return `<path d="M39 54 L61 80" stroke="#BF360C" stroke-width="5"/>`;
    case 'necro':return `<circle cx="54" cy="62" r="3.6" fill="#EFE9DA" ${SO}/>`;
    case 'chosen':return `<path d="M39 54 L61 80" stroke="#FFC107" stroke-width="4"/>`;
    case 'mage':return `<path d="M50 54 V98" stroke="${o2}" stroke-width="2"/>`;
    case 'assassin':return `<path d="M38 66 L62 60" stroke="${o2}" stroke-width="3"/>`;
    case 'tamer':case 'slayer':return `<path d="M38 56 L60 78" stroke="#4E342E" stroke-width="3"/>`;
    case 'resilient':return `<path d="M42 62 h8 M46 58 v8" stroke="#FFFDE7" stroke-width="2.4"/>`;
    default:return '';
  }
}
function face(L,skin,hair){
  const r=L.race;let f='';
  if(r==='Skeleton')return `<g class="ey"><circle cx="55" cy="33" r="3.2" fill="${OL}"/><circle cx="62" cy="33" r="3.2" fill="${OL}"/></g>${XEYES}<path d="M58 37 l1.5 2.5 h-3z" fill="${OL}"/><path d="M54 41.5 h9 M56 40 v3 M59 40 v3 M62 40 v3" stroke="${OL}" stroke-width="1.2"/>`;
  if(r==='Cyborg')return `<g class="ey"><rect x="51" y="30" width="15" height="6" rx="3" fill="#FF1744" stroke="${OL}" stroke-width="1.4"/></g>${XEYES}${MOUTH}`;
  if(r==='Insectoid')return `<g class="ey"><ellipse cx="56" cy="32" rx="3.6" ry="4.6" fill="#1B1B1F"/><ellipse cx="63" cy="32" rx="3.6" ry="4.6" fill="#1B1B1F"/><circle cx="55" cy="30.5" r="1" fill="#fff"/><circle cx="62" cy="30.5" r="1" fill="#fff"/></g>${XEYES}<path d="M57 41 l3 4 M64 41 l-3 4" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>`;
  if(r==='Frogfolk')return `<g class="ey"><circle cx="52" cy="23" r="5" fill="${skin}" ${SO}/><circle cx="62" cy="23" r="5" fill="${skin}" ${SO}/><circle cx="53" cy="23" r="2.2" fill="${OL}"/><circle cx="63" cy="23" r="2.2" fill="${OL}"/></g><g class="xe"><path d="M50 21l4 4M54 21l-4 4M60 21l4 4M64 21l-4 4" stroke="${OL}" stroke-width="1.7"/></g><path d="M47 38 Q57 46 66 37" stroke="${OL}" fill="none" stroke-width="1.8" stroke-linecap="round"/>`;
  if(r==='Raccoon')f+=`<path d="M48 29.5 Q58 25.5 67 29.5 L66 37 Q58 34 48 37.5 Z" fill="#37373B"/><g class="ey"><circle cx="55" cy="33" r="2" fill="#fff"/><circle cx="61.5" cy="33" r="2" fill="#fff"/></g>`;
  else if(r==='Cosmic warrior')f+=`<g class="ey"><circle cx="55" cy="33" r="2.4" fill="#fff" stroke="#80DEEA" stroke-width="1.2"/><circle cx="61.5" cy="33" r="2.4" fill="#fff" stroke="#80DEEA" stroke-width="1.2"/></g><circle cx="44" cy="30" r=".9" fill="#fff"/><circle cx="47" cy="42" r=".7" fill="#fff"/><circle cx="41" cy="37" r=".6" fill="#fff"/>`;
  else if(r==='Zombie')f+=`<g class="ey"><circle cx="55" cy="33" r="3" fill="#fff" stroke="${OL}" stroke-width="1"/><circle cx="55.5" cy="33" r="1.3" fill="${OL}"/><circle cx="61.5" cy="33" r="1.8" fill="${OL}"/></g>`;
  else if(r==='Yeti')f+=`<ellipse cx="58" cy="35" rx="9" ry="9" fill="#9FB3C8"/>`+EYES;
  else f+=EYES;
  f+=XEYES;
  if(r==='Werewolf')f+=`<ellipse cx="63" cy="38.5" rx="8" ry="5" fill="#6D4C41" ${SO}/><circle cx="70" cy="37" r="2" fill="${OL}"/>`;
  else if(r==='Kitsune')f+=`<path d="M57 36 L72 39.5 L57 43 Z" fill="#FFF8E1" ${SO}/><circle cx="71" cy="39.5" r="1.6" fill="${OL}"/>`;
  else if(r==='Minotaur')f+=`<ellipse cx="62" cy="40" rx="8" ry="5.5" fill="#BCAAA4" ${SO}/><circle cx="64" cy="45" r="2.4" fill="none" stroke="#FFC107" stroke-width="1.4"/>`;
  else if(r==='Dragonkin')f+=`<ellipse cx="62" cy="39" rx="8" ry="4.6" fill="${skin}" ${SO}/><circle cx="68" cy="37.5" r="1" fill="${OL}"/>`;
  else if(r==='Goblin')f+=`<path d="M62 33 L72 38 L62 39.5 Z" fill="${skin}" ${SO}/>`+MOUTH;
  else if(L.arch==='npc')f+=`<path d="M56 41 h6" stroke="${OL}" stroke-width="1.7"/>`;
  else f+=MOUTH;
  if(r==='Zombie')f+=`<path d="M43 26 l7 5 M44.5 29.5 l2 -3 M47.5 31.5 l2 -3" stroke="${OL}" stroke-width="1.2"/>`;
  if(r==='Dwarf')f+=`<path d="M44 36 Q45 58 56 56 Q67 53 66 37 Q60 44 53 42 Q47 41 44 36 Z" fill="${hair}" ${SO}/>`;
  if(r==='Orc')f+=`<path d="M57 42 l1.2 -5 l1.8 5 Z M61.5 41.5 l1 -4.5 l1.6 4.5 Z" fill="#FFF8E1" stroke="${OL}" stroke-width=".8"/><path d="M52 28.5 h13" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>`;
  if(r==='Vampire')f+=`<path d="M57 41.3 l1 3 l1 -3 Z M60.5 41 l1 3 l1 -3 Z" fill="#fff"/>`;
  if(r==='Titan')f+=`<path d="M48 40 Q57 56 66 40 Q57 46 48 40 Z" fill="#9E9E9E" ${SO}/>`;
  return f;
}
function humanoid(L,skin,o1,o2,hair){
  const r=L.race,a=L.arch;
  const thin=r==='Skeleton';
  const robe=['mage','monk','necro'].includes(a);
  const armC=(a==='paladin'||a==='tank')?o1:skin;
  let s='';
  if(r==='Angel'){const wc=L.rsub==='Fallen'?'#4A4453':'#FFFFFF';s+=`<ellipse cx="30" cy="56" rx="17" ry="9" transform="rotate(-32 30 56)" fill="${wc}" ${SO}/><ellipse cx="28" cy="66" rx="15" ry="7.5" transform="rotate(-12 28 66)" fill="${wc}" ${SO}/>`;}
  if(r==='Fairy')s+=`<ellipse cx="31" cy="55" rx="15" ry="10" transform="rotate(-30 31 55)" fill="#B3E5FC" opacity=".85" ${SO}/><ellipse cx="31" cy="69" rx="11" ry="7" transform="rotate(20 31 69)" fill="#F8BBD0" opacity=".85" ${SO}/>`;
  if(r==='Vampire')s+=`<path d="M38 52 L62 52 L71 110 L29 110 Z" fill="#8E1B1B" ${SO}/>`;
  if(r==='Werewolf')s+=limb(38,82,20,66,6,skin);
  if(r==='Kitsune'){
    const n={'One tail':1,'Three tails':3,'Seven tails':7,'Nine tails':9}[L.rsub]||1;
    for(let k=0;k<n;k++){const ang=n>1?-85+k*(70/(n-1)):-45;s+=`<g transform="rotate(${ang.toFixed(1)} 40 84)"><ellipse cx="40" cy="65" rx="5.5" ry="16" fill="${skin}" ${SO}/><ellipse cx="40" cy="52" rx="3.6" ry="5" fill="#FFF8E1"/></g>`;}
  }
  if(r==='Dragonkin')s+=limb(40,86,14,92,9,skin)+`<path d="M14 92 L5 86 L9 97 Z" fill="${skin}" ${SO}/>`;
  if(r==='Demon')s+=limb(40,84,22,96,3,'#3E2723')+`<path d="M22 96 L13 92 L17 103 Z" fill="#3E2723"/>`;
  if(r==='Raccoon')s+=`<line x1="38" y1="84" x2="17" y2="74" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><line x1="38" y1="84" x2="17" y2="74" stroke="${skin}" stroke-width="9" stroke-linecap="round"/><line x1="36" y1="83" x2="19" y2="75" stroke="#37373B" stroke-width="9" stroke-dasharray="3 4"/>`;
  if(r==='Insectoid')s+=limb(43,64,30,72,5,skin)+limb(43,68,32,86,5,skin);
  const lc=thin&&!robe?skin:o2,lw=thin?5:9;
  if(r==='Merfolk'){
    s+=`<path d="M37 82 H63 Q64 100 55 108 L64 117 L48 114 L40 118 L46 106 Q36 98 37 82 Z" fill="#26A69A" ${SO}/><path d="M44 92 h4 M52 96 h4 M46 100 h4" stroke="#B2DFDB" stroke-width="1.4"/>`;
  }else{
    s+=limb(45,86,43,112,lw,lc)+limb(55,86,57,112,lw,lc);
    const shoe=['Minotaur','Yeti'].includes(r)?'#4E342E':'#3E2723';
    s+=`<ellipse cx="44" cy="114" rx="6.5" ry="3.2" fill="${shoe}"/><ellipse cx="59" cy="114" rx="6.5" ry="3.2" fill="${shoe}"/>`;
  }
  s+=limb(41,58,35,80,thin?5:7,armC)+`<circle cx="35" cy="81" r="3.6" fill="${skin}" ${SO}/>`;
  if(robe)s+=`<path d="M37 51 H63 L68 102 H32 Z" fill="${o1}" ${SO}/><path d="M37 51 H46 L42 102 H32 Z" fill="#000" opacity=".16"/><path d="M58 53 L62 53 L66 98 L63 98 Z" fill="#fff" opacity=".12"/>`;
  else s+=`<rect x="36" y="51" width="28" height="${r==='Merfolk'?33:37}" rx="8" fill="${o1}" ${SO}/><rect x="36.8" y="52" width="9" height="${r==='Merfolk'?31:35}" rx="6" fill="#000" opacity=".16"/><rect x="57" y="54" width="4" height="${r==='Merfolk'?22:26}" rx="2" fill="#fff" opacity=".13"/><rect x="36.5" y="${r==='Merfolk'?77:80}" width="27" height="5" fill="${o2}"/>`;
  s+=torsoAcc(a,o1,o2);
  const covered=['paladin','tank','assassin','necro','berserker'].includes(a);
  if(r==='Werewolf')s+=`<path d="M41 24 L43 9 L51 20 Z M52 20 L59 8 L61 23 Z" fill="${skin}" ${SO}/>`;
  if(r==='Kitsune')s+=`<path d="M41 24 L42 9 L50 20 Z M53 20 L59 7 L61 23 Z" fill="${skin}" ${SO}/><path d="M43 21 L43.5 13 L47.5 19 Z M55 19 L58.5 12 L59.5 21 Z" fill="#FFF8E1"/>`;
  if(r==='Raccoon')s+=`<circle cx="41" cy="22" r="5" fill="${skin}" ${SO}/><circle cx="56" cy="20" r="5" fill="${skin}" ${SO}/>`;
  if(r==='Minotaur')s+=`<ellipse cx="36" cy="30" rx="6" ry="3" fill="${skin}" ${SO} transform="rotate(-20 36 30)"/>`;
  s+=r==='Frogfolk'?`<ellipse cx="51" cy="35" rx="15.5" ry="12.5" fill="${skin}" ${SO}/>`:`<circle cx="50" cy="34" r="14" fill="${skin}" ${SO}/><path d="M50 20.4a13.6 13.6 0 0 0 0 27.2a9 13.6 0 0 1 0-27.2z" fill="#000" opacity=".14"/><ellipse cx="55" cy="26.5" rx="4.6" ry="2.6" fill="#fff" opacity=".28"/>`;
  if(r==='Titan')s+=`<circle cx="44" cy="28" r="1.2" fill="#8D6E63"/><circle cx="47" cy="40" r="1" fill="#8D6E63"/>`;
  if(r==='Yeti')s+=`<path d="M37 26 l3 -6 l3 5 l3 -6 l3 5 l3 -6 l3 5 l3 -6 l3 6" fill="${skin}" ${SO}/>`;
  const hairy=['Human','Elf','Vampire','Cosmic warrior','Dwarf','Merfolk','Fairy'];
  if(!covered&&a!=='monk'&&hairy.includes(r)){
    const hc=r==='Elf'?'#F2D16B':r==='Vampire'?'#1B1B1F':r==='Cosmic warrior'?'#E1F5FE':r==='Merfolk'?'#26A69A':hair;
    s+=`<path d="M36 35 Q35 19 50 19 Q63 19 64.5 28 Q57 24 47 27 Q41 29 39 40 Z" fill="${hc}" ${SO}/>`;
  }
  if(r==='Mushroom folk')s+=`<path d="M31 33 Q30 9 50 9 Q71 9 70 33 Q50 27 31 33 Z" fill="#E53935" ${SO}/><circle cx="42" cy="18" r="3" fill="#fff"/><circle cx="55" cy="14" r="2.6" fill="#fff"/><circle cx="62" cy="23" r="2.2" fill="#fff"/>`;
  if(r==='Elf')s+=`<path d="M39 33 L26 21 L42 38 Z" fill="${skin}" ${SO}/>`;
  if(r==='Goblin')s+=`<path d="M39 31 L21 23 L40 40 Z" fill="${skin}" ${SO}/>`;
  if(r==='Demon')s+=`<path d="M41 24 Q35 14 39 7 Q42 16 47 21 Z M54 21 Q57 11 63 8 Q61 17 59.5 24 Z" fill="#3E2723" ${SO}/>`;
  if(r==='Dragonkin')s+=`<path d="M41 25 L27 17 L43 22 Z M44 21 L33 11 L48 19 Z" fill="#ECEFF1" ${SO}/>`;
  if(r==='Minotaur')s+=`<path d="M40 25 Q27 22 25 10 Q33 18 43 21 Z M58 21 Q69 16 71 4 Q74 18 63 25 Z" fill="#FFF8E1" ${SO}/>`;
  if(r==='Insectoid')s+=`<path d="M47 22 Q44 10 38 8 M55 21 Q58 9 64 7" stroke="${OL}" stroke-width="1.6" fill="none"/><circle cx="38" cy="8" r="2" fill="${skin}" ${SO}/><circle cx="64" cy="7" r="2" fill="${skin}" ${SO}/>`;
  if(r==='Cyborg')s+=`<path d="M45 21 L42 11" stroke="${OL}" stroke-width="1.6"/><circle cx="42" cy="10" r="2.2" fill="#FF1744"/>`;
  s+=face(L,skin,hair);
  if(r==='Angel')s+=`<ellipse cx="50" cy="13" rx="11" ry="3.2" fill="none" stroke="#FFC107" stroke-width="2.4"/>`;
  if(r==='Fairy')s+=`<circle cx="30" cy="40" r="1.2" fill="#FFF59D"/><circle cx="70" cy="22" r="1" fill="#FFF59D"/><circle cx="26" cy="72" r="1" fill="#FFF59D"/>`;
  s+=r==='Mushroom folk'?`<g transform="translate(0 -9)">${headAcc(a,o1,o2)}</g>`:headAcc(a,o1,o2);
  const hx=69,hy=76,fists=L.weapon==='Bare fists';
  let arm=limb(60,57,hx,hy-1,thin?5:7,armC);
  arm+=`<g transform="translate(${hx} ${hy}) rotate(${L.weapon==='Bow'?8:-35})">${weaponSVG(L.weapon,L.ench)}</g>`;
  arm+=`<circle cx="${hx}" cy="${hy}" r="${fists||a==='brawler'?5.6:3.8}" fill="${a==='brawler'?'#E53935':skin}" ${SO}/>`;
  return {body:s,arm,sx:60,sy:57};
}
const held=(L,x,y,rot)=>`<g transform="translate(${x} ${y}) rotate(${rot})">${weaponSVG(L.weapon,L.ench)}</g>`;
const NONHUM={
  toaster(L,skin,o1,o2){
    let b=limb(42,100,40,114,3.5,'#455A64')+limb(58,100,60,114,3.5,'#455A64')+limb(30,72,22,86,4,'#455A64');
    b+=`<rect x="42" y="34" width="11" height="20" rx="2" fill="#E0B07A" ${SO}/><rect x="56" y="37" width="11" height="17" rx="2" fill="#E0B07A" ${SO}/>`;
    b+=`<rect x="28" y="46" width="46" height="56" rx="10" fill="${skin}" ${SO}/><rect x="40" y="48" width="12" height="3" rx="1.5" fill="${OL}"/><rect x="55" y="48" width="12" height="3" rx="1.5" fill="${OL}"/><rect x="74" y="62" width="5" height="12" rx="2" fill="#78909C" ${SO}/>`;
    b+=`<g transform="translate(2 40)">${EYES}${XEYES}${L.arch==='npc'?'':MOUTH}</g>`;
    b+=`<g transform="translate(5 14)">${headAcc(L.arch,o1,o2)}</g>`;
    const arm=limb(70,82,80,92,4,'#455A64')+held(L,80,92,-35)+`<circle cx="80" cy="92" r="3.6" fill="#90A4AE" ${SO}/>`;
    return {body:b,arm,sx:70,sy:82};
  },
  slime(L,skin,o1,o2){
    let b=`<path d="M19 114 Q15 66 50 60 Q85 66 81 114 Z" fill="${skin}" ${SO} opacity=".96"/><ellipse cx="33" cy="82" rx="5" ry="10" fill="#fff" opacity=".45"/>`;
    b+=`<g transform="translate(6 44)">${EYES}${XEYES}${L.arch==='npc'?'':MOUTH}${headAcc(L.arch,o1,o2)}</g>`;
    if(L.rsub==='King slime'&&L.arch!=='chosen')b+=`<g transform="translate(6 46)">${headAcc('chosen')}</g>`;
    const arm=limb(74,94,85,82,7,skin)+held(L,85,82,-30)+`<circle cx="85" cy="82" r="3.8" fill="${skin}" ${SO}/>`;
    return {body:b,arm,sx:74,sy:94};
  },
  ghost(L,skin,o1,o2){
    let b=`<path d="M30 106 Q27 50 50 44 Q73 50 70 106 Q65 100 60 106 Q55 100 50 106 Q45 100 40 106 Q35 100 30 106 Z" fill="${skin}" ${SO} opacity=".95"/>`;
    b+=`<g transform="translate(2 22)"><g class="ey"><ellipse cx="55" cy="33" rx="2.4" ry="3.6" fill="${OL}"/><ellipse cx="61.5" cy="33" rx="2.4" ry="3.6" fill="${OL}"/></g>${XEYES}<ellipse cx="59" cy="42" rx="2.2" ry="2.8" fill="${OL}"/>${headAcc(L.arch,o1,o2)}</g>`;
    const arm=limb(66,74,77,66,6,skin)+held(L,77,66,-30)+`<circle cx="77" cy="66" r="3.6" fill="${skin}" ${SO}/>`;
    return {body:b,arm,sx:66,sy:74};
  },
  pigeon(L,skin,o1,o2){
    let b=`<path d="M26 86 L9 79 L11 94 Z" fill="#7D8790" ${SO}/>`+limb(42,102,40,114,2.5,'#FF8A65')+limb(52,102,54,114,2.5,'#FF8A65');
    b+=`<ellipse cx="46" cy="88" rx="24" ry="17" fill="${skin}" ${SO}/><path d="M54 68 Q62 78 72 68 L72 74 Q62 84 54 74 Z" fill="#5E9C76" ${SO}/><circle cx="62" cy="58" r="12" fill="${skin}" ${SO}/><path d="M73 55 L83 59 L73 62 Z" fill="#FFB74D" ${SO}/>`;
    b+=`<g class="ey"><circle cx="66" cy="55" r="3" fill="#FF9800"/><circle cx="66.5" cy="55" r="1.4" fill="${OL}"/></g><g class="xe"><path d="M63.5 52.5l5 5M68.5 52.5l-5 5" stroke="${OL}" stroke-width="1.7"/></g>`;
    b+=`<g transform="translate(62 58) scale(.86) translate(-50 -34)">${headAcc(L.arch,o1,o2)}</g>`;
    const arm=held(L,62,92,-50)+`<ellipse cx="48" cy="86" rx="15" ry="8.5" fill="#7D8790" ${SO} transform="rotate(25 48 86)"/>`;
    return {body:b,arm,sx:38,sy:82};
  },
  golem(L,skin,o1,o2){
    let b=`<rect x="38" y="86" width="10" height="27" rx="2" fill="${skin}" ${SO}/><rect x="53" y="86" width="10" height="27" rx="2" fill="${skin}" ${SO}/>`+limb(34,56,27,82,10,skin);
    b+=`<rect x="30" y="47" width="40" height="43" rx="5" fill="${skin}" ${SO}/><path d="M40 55 l6 8 l-3 7 M60 66 l-5 6" stroke="${OL}" stroke-width="1.4" fill="none"/>`;
    b+=`<rect x="37.5" y="19" width="25" height="27" rx="4" fill="${skin}" ${SO}/><g class="ey"><rect x="52.5" y="31.5" width="5" height="3.5" fill="#4DD0E1"/><rect x="59" y="31.5" width="5" height="3.5" fill="#4DD0E1"/></g>${XEYES}<path d="M54 41 h8" stroke="${OL}" stroke-width="1.6"/>`;
    b+=`<g transform="translate(0 -2)">${headAcc(L.arch,o1,o2)}</g>`;
    const arm=limb(66,54,75,76,10,skin)+held(L,75,78,-35)+`<rect x="70" y="73" width="10" height="9" rx="2" fill="${skin}" ${SO}/>`;
    return {body:b,arm,sx:66,sy:54};
  },
  elemental(L,skin,o1,o2){
    let b=`<path d="M50 22 Q74 40 65 70 Q58 90 50 116 Q42 90 35 70 Q26 40 50 22 Z" fill="${skin}" ${SO}/><path d="M50 42 Q60 54 54 70 Q50 84 50 102" stroke="#fff" stroke-width="2.4" fill="none" opacity=".5"/>`+limb(40,62,31,76,6,skin);
    b+=`<g transform="translate(1 12)">${EYES}${XEYES}${L.arch==='npc'?'':MOUTH}${headAcc(L.arch,o1,o2)}</g>`;
    const arm=limb(60,62,72,74,6,skin)+held(L,72,76,-35)+`<circle cx="72" cy="76" r="3.6" fill="${skin}" ${SO}/>`;
    return {body:b,arm,sx:60,sy:62};
  },
  eldritch(L,skin,o1,o2){
    let b='';
    for(const [x1,x2] of [[34,22],[44,38],[56,60],[66,80]])b+=`<path d="M${x1} 92 Q${(x1+x2)/2-6} 108 ${x2} 114" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x1} 92 Q${(x1+x2)/2-6} 108 ${x2} 114" stroke="${skin}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    b+=`<ellipse cx="50" cy="76" rx="28" ry="25" fill="${skin}" ${SO}/>`;
    const n={'Three eyes':3,'Twelve eyes':12,'Too many eyes':18,'Infinite eyes':26}[L.rsub]||5;
    let ey='',xe='';
    for(let k=0;k<n;k++){const ang=k*2.4,rad=Math.sqrt((k+0.5)/n)*18;const x=(53+Math.cos(ang)*rad*1.1).toFixed(1),y=(72+Math.sin(ang)*rad*0.75).toFixed(1);const rr=n>10?2.4:3.4;ey+=`<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" stroke="${OL}" stroke-width=".8"/><circle cx="${(+x+rr*0.35).toFixed(1)}" cy="${y}" r="${(rr*0.45).toFixed(1)}" fill="${OL}"/>`;if(k<3)xe+=`<path d="M${x-2} ${y-2}l4 4M${+x+2} ${y-2}l-4 4" stroke="${OL}" stroke-width="1.4"/>`;}
    b+=`<g class="ey">${ey}</g><g class="xe">${xe}</g><path d="M40 90 l4 3 l4 -3 l4 3 l4 -3 l4 3" stroke="${OL}" stroke-width="1.6" fill="none"/>`;
    b+=`<g transform="translate(0 26)">${headAcc(L.arch,o1,o2)}</g>`;
    const arm=limb(70,80,84,64,6,skin)+held(L,84,64,-30);
    return {body:b,arm,sx:70,sy:80};
  }
};
function charSVGVec(L,opt){
  opt=opt||{};
  const sc=opt.sized?(SIZE_H[L.size]||1):1;
  const hh=Math.round((opt.h||110)*sc),ww=Math.round(hh*100/120);
  let inner;
  if(!L.race){
    inner=`<g opacity=".55">${limb(45,86,43,112,9,'#B9A9C9')}${limb(55,86,57,112,9,'#B9A9C9')}<rect x="36" y="51" width="28" height="37" rx="8" fill="#B9A9C9"/><circle cx="50" cy="34" r="14" fill="#B9A9C9"/></g><text x="50" y="40" text-anchor="middle" font-size="17" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">?</text>`;
  }else{
    let skin=RSKIN[L.race]||HUMAN_SKIN[hashStr(L.name)%HUMAN_SKIN.length];
    if(SUBSKIN[L.race+'/'+L.rsub])skin=SUBSKIN[L.race+'/'+L.rsub];
    const [o1,o2]=OUTFIT[L.arch]||['#A79BB0','#6E6378'];
    const hair=HAIR[hashStr((L.name||'x')+'#')%HAIR.length];
    const t=BODY[L.race];
    const p=t?NONHUM[t](L,skin,o1,o2):humanoid(L,skin,o1,o2,hair);
    const aura=L.power&&L.power!=='none'&&PAURA[L.power]?`<ellipse cx="50" cy="115" rx="31" ry="5.5" fill="${PAURA[L.power]}" opacity=".55"/>`:'';
    const halo=L.arch==='chosen'?`<circle cx="50" cy="62" r="46" fill="#FFE082" opacity=".22"/>`:'';
    inner=`<ellipse cx="50" cy="116" rx="25" ry="4.6" fill="#000" opacity=".22"/>${halo}${aura}${p.body}<g class="armw" data-sx="${p.sx}" data-sy="${p.sy}">${p.arm}</g>`;
  }
  if(opt.mirror)inner=`<g transform="translate(100 0) scale(-1 1)">${inner}</g>`;
  return `<svg class="ch" viewBox="0 0 100 120" width="${ww}" height="${hh}" aria-hidden="true">${inner}</svg>`;
}
