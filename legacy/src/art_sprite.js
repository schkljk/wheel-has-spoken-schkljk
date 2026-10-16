// ================= PIXEL SPRITES, BUILT FROM SCRATCH =================
// 70x84 sprites. Each race has its own body plan and features, each class its own outfit and headgear,
// each weapon its own pixel model. Shading uses hue-shifted ramps lit from the top left, with
// selective outlines. The weapon arm is a separate sprite so swing animations keep working.
const SW=70,SH=84;
const SPR={cache:new Map()};
// ---------- color ----------
function h2r(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255];}
function r2hsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return [h,s,l];}
function hsl2r(h,s,l){h=((h%360)+360)%360;s=clamp(s,0,1);l=clamp(l,0,1);const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];}
const toward=(h,t,a)=>{let d=((t-h+540)%360)-180;return h+d*a;};
// four shades per material: outline, shadow, base, light. Shadows drift toward violet, lights toward warm yellow.
function ramp(hex){
  const [h,s,l]=r2hsl(h2r(hex));
  return [hsl2r(toward(h,255,0.35),Math.min(1,s+0.1),Math.max(0.06,l*0.38)),hsl2r(toward(h,255,0.18),Math.min(1,s+0.06),Math.max(0.1,l-0.16)),h2r(hex),hsl2r(toward(h,50,0.12),s*0.95,Math.min(0.96,l+0.13))];
}
// ---------- canvas ----------
function sbuf(){return {px:new Array(SW*SH).fill(null),rp:new Array(SW*SH).fill(null),a:new Uint8Array(SW*SH)};}
function put(B,x,y,c,rp,al){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=SW||y>=SH)return;const i=y*SW+x;B.px[i]=c;B.rp[i]=rp||null;B.a[i]=al==null?255:al;}
// fill a shape with shading: lit edges top-left, shadow edges and a soft terminator bottom-right
function shape(B,test,x0,y0,x1,y1,R,o){
  o=o||{};const pts=[];const inS=(x,y)=>test(x+0.5,y+0.5);
  for(let y=Math.floor(y0);y<=Math.ceil(y1);y++)for(let x=Math.floor(x0);x<=Math.ceil(x1);x++)if(inS(x,y))pts.push([x,y]);
  const w=Math.max(1,x1-x0),h=Math.max(1,y1-y0);
  for(const [x,y] of pts){
    let c=R[2];
    if(!o.flat){
      const t=(x-x0)/w*0.75+(y-y0)/h*0.55;
      if(!inS(x+1,y)||!inS(x,y+1))c=R[1];
      else if(!inS(x-1,y)||!inS(x,y-1))c=R[3];
      else if(t>(o.term||0.95))c=R[1];
    }
    put(B,x,y,c,R,o.al);
  }
}
const ell=(cx,cy,rx,ry)=>(x,y)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
const box=(x0,y0,x1,y1,r)=>(x,y)=>{if(x<x0||x>x1||y<y0||y>y1)return false;r=r||0;const cx=Math.min(Math.max(x,x0+r),x1-r),cy=Math.min(Math.max(y,y0+r),y1-r);return (x-cx)**2+(y-cy)**2<=r*r+0.01;};
function poly(pts){return (x,y)=>{let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))ins=!ins;}return ins;};}
const bb=pts=>[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
function P(B,pts,R,o){const [a,b,c,d]=bb(pts);shape(B,poly(pts),a,b,c,d,R,o);}
function E(B,cx,cy,rx,ry,R,o){shape(B,ell(cx,cy,rx,ry),cx-rx,cy-ry,cx+rx,cy+ry,R,o);}
function Bx(B,x0,y0,x1,y1,R,r,o){shape(B,box(x0,y0,x1,y1,r),x0,y0,x1,y1,R,o);}
// a thick line (limbs, poles)
function cap(B,x0,y0,x1,y1,w,R,o){
  const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1,r=w/2;
  const t=(x,y)=>{const u=clamp(((x-x0)*dx+(y-y0)*dy)/L2,0,1),px=x0+u*dx,py=y0+u*dy;return (x-px)**2+(y-py)**2<=r*r;};
  shape(B,t,Math.min(x0,x1)-r,Math.min(y0,y1)-r,Math.max(x0,x1)+r,Math.max(y0,y1)+r,R,o);
}
function line(B,x0,y0,x1,y1,c,R){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;for(;;){put(B,x0,y0,c,R);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}}
// outline: transparent pixels next to the sprite take the darkest shade of their neighbor
function outline(B){
  const add=[];
  for(let y=0;y<SH;y++)for(let x=0;x<SW;x++){const i=y*SW+x;if(B.px[i])continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=SW||ny>=SH)continue;const j=ny*SW+nx;if(B.px[j]&&B.a[j]>200){const R=B.rp[j];add.push([i,R?R[0]:[22,14,34]]);break;}}}
  for(const [i,c] of add){B.px[i]=c;B.a[i]=255;}
}
function toURL(B){
  const cv=document.createElement('canvas');cv.width=SW;cv.height=SH;const ctx=cv.getContext('2d');const id=ctx.createImageData(SW,SH);
  for(let i=0;i<SW*SH;i++){const c=B.px[i];if(!c)continue;id.data[i*4]=c[0];id.data[i*4+1]=c[1];id.data[i*4+2]=c[2];id.data[i*4+3]=B.a[i];}
  ctx.putImageData(id,0,0);return cv.toDataURL('image/png');
}
// ---------- tables ----------
const RAMP_CACHE=new Map();const RP=h=>{let r=RAMP_CACHE.get(h);if(!r){r=ramp(h);RAMP_CACHE.set(h,r);}return r;};
const SUBCOL={
  'Golem/Clay':'#B97A56','Golem/Stone':'#9A9A96','Golem/Iron':'#7C8790','Golem/Flesh':'#C98F86','Golem/Diamond':'#8FE3F2',
  'Elemental/Fire':'#FF7A2F','Elemental/Ice':'#9FE3FF','Elemental/Storm':'#9C8BFF','Elemental/Water':'#3D8BFF','Elemental/Earth':'#8D6E46','Elemental/Void':'#3B2A55',
  'Dragonkin/Red':'#C0392B','Dragonkin/White':'#DDE6EC','Dragonkin/Blue':'#3D7BD9','Dragonkin/Black':'#3A3344','Dragonkin/Gold':'#E8B33A',
  'Slime/Acid slime':'#C6F04A','Slime/King slime':'#4FC1E9','Slime/Metal slime':'#A9B4C2',
  'Werewolf/Blood moon':'#7A3B35','Catfolk/Sphynx':'#F0C8B8','Catfolk/Void cat':'#2A2236','Catfolk/Lion-blooded':'#D9A441','Robot/Battle droid':'#6E7B5A','Robot/Butler bot':'#C9CED6','Robot/Vacuum bot':'#4A4F5A','Sharkfolk/Megalodon':'#4E5E70','Treant/Venus flytrap':'#5DAA4B','Treant/Sapling':'#9C7A52','Snowman/Slush':'#C9D6E2','Clown/Horror clown':'#E8E2DA','Ratfolk/Lab rat':'#F4F1EA','Ogre/Swamp ogre':'#7FA04A','Mummy/Pharaoh':'#E8D9A8','Werewolf/Full moon':'#6E6A70','Demon/Ninth circle':'#7A1020','Angel/Fallen':'#B9A9C9',
  'Vampire/Nosferatu':'#C9C3B8','Ghost/Wraith':'#8C86A8','Ghost/Banshee':'#D7E6F5','Skeleton/Lich bones':'#D8E8C8','Cosmic warrior/Supernova':'#5B2A6B'
};
const RACE_SP={
  Human:{b:'normal',hair:1},Goblin:{b:'small',skin:'#8DBF4A',ears:'goblin',nose:1,hair:1},Skeleton:{b:'slim',skin:'#EDE6D6',skull:1,boney:1},
  Orc:{b:'big',skin:'#6E9E4A',tusks:1,brow:1,hair:1},Elf:{b:'slim',skin:'#F2D3B3',ears:'elf',hair:1},Pigeon:{plan:'pigeon',skin:'#8C96A3'},
  Raccoon:{b:'small',skin:'#8E8E96',head:'raccoon',tail:'raccoon'},Slime:{plan:'slime',skin:'#7BD657'},Vampire:{b:'slim',skin:'#E8E0EE',fangs:1,hair:1,cape:'#2A0F1E',eye:'#E5484D'},
  Werewolf:{b:'big',skin:'#8D7A68',head:'wolf',tail:'wolf',fur:1},Cyborg:{b:'normal',skin:'#E8C4A0',cyborg:1,hair:1},Ghost:{plan:'ghost',skin:'#CDE6FF'},
  Golem:{b:'big',skin:'#9A9A96',golem:1},Demon:{b:'normal',skin:'#C0392B',horns:'demon',tail:'demon',wings:'bat',hair:1},Angel:{b:'slim',skin:'#F7E3C9',wings:'feather',halo:1,hair:1},
  Elemental:{plan:'elemental',skin:'#FF7A2F'},Dragonkin:{b:'normal',skin:'#C0392B',head:'dragon',tail:'dragon',wings:'bat',scales:1},'Cosmic warrior':{b:'normal',skin:'#2C2A6B',stars:1,eye:'#7FE3FF'},
  Titan:{b:'big',skin:'#C9A27A',laurel:1,hair:1},'Eldritch horror':{plan:'eldritch',skin:'#6A4C93'},Dwarf:{b:'stocky',skin:'#E9B996',beard:1,hair:1},
  Merfolk:{b:'normal',skin:'#5FB3A8',fins:1,tailLegs:1,hair:1},Insectoid:{b:'slim',skin:'#6B8E23',antennae:1,bugeyes:1,chitin:1},Fairy:{b:'small',skin:'#FBD9E6',ears:'elf',wings:'fairy',hair:1},
  Minotaur:{b:'big',skin:'#7B5233',head:'bull',fur:1},'Mushroom folk':{b:'small',skin:'#F3E7D3',cap:1},Zombie:{b:'normal',skin:'#8FA67A',zombie:1,hair:1},
  Kitsune:{b:'slim',skin:'#F6D6B8',ears:'fox',tail:'fox',hair:1,hairCol:'#E8862E'},Frogfolk:{b:'small',skin:'#5DAA4B',head:'frog'},Yeti:{b:'big',skin:'#EEF2F6',head:'yeti',fur:1},
  'Sentient toaster':{plan:'toaster',skin:'#B8C2CC'},
  Catfolk:{b:'slim',skin:'#E9A86A',ears:'cat',tail:'cat',hair:1,whiskers:1},Lizardfolk:{b:'normal',skin:'#6FA84A',head:'dragon',tail:'dragon',scales:1,noHorns:1},
  Harpy:{b:'slim',skin:'#F0D2B4',wings:'feather',beak:1,hair:1,talons:1},Sharkfolk:{b:'big',skin:'#7F98AE',head:'shark',tail:'dragon',fin:1},
  Robot:{b:'normal',skin:'#9AA6B2',robot:1},Gnome:{b:'small',skin:'#F1C9A5',beard:1,gnomehat:1},Satyr:{b:'normal',skin:'#E6B98E',horns:'goat',hooves:1,hair:1},
  Mummy:{b:'slim',skin:'#E6DCC2',mummy:1},Djinn:{plan:'djinn',skin:'#4F8DF5'},Clown:{b:'normal',skin:'#F7F4EE',clown:1,hair:1,hairCol:'#FF4F8B'},
  Beefolk:{b:'small',skin:'#F2C14E',bee:1,antennae:1,wings:'fairy',bugeyes:1},Snowman:{plan:'snowman',skin:'#F4F8FC'},Treant:{b:'big',skin:'#7A5A3A',treant:1},
  'Rubber duck':{plan:'duck',skin:'#F7D23E'},Ratfolk:{b:'small',skin:'#9A8F8A',head:'rat',tail:'rat'},Ogre:{b:'big',skin:'#8DA35A',tusks:1,brow:1,ogre:1}
};
const BUILDS={
  normal:{tw:17,sy:31,hy:53,hr:8.5,hc:20,lw:6},slim:{tw:14,sy:30,hy:53,hr:8,hc:19,lw:5},
  big:{tw:23,sy:31,hy:54,hr:9,hc:19,lw:8},stocky:{tw:22,sy:36,hy:58,hr:9,hc:25,lw:7},small:{tw:15,sy:39,hy:59,hr:10,hc:27,lw:5}
};
const OUT={
  brawler:{top:'tank',c:'#E5484D',c2:'#2B2B33',hat:'band',hatC:'#E5484D',wraps:1},
  mage:{top:'robe',c:'#4B5BD6',c2:'#F2B544',hat:'wizard',hatC:'#3B47B8',stars:1},
  assassin:{top:'leather',c:'#2E2A3A',c2:'#B3262B',hat:'hood',hatC:'#24202E',mask:1},
  paladin:{top:'plate',c:'#C9D1DA',c2:'#F2E6B8',hat:'circlet',hatC:'#E8B33A',tabard:'#F4F1EA',cross:1,cape:'#2F5BB7'},
  berserker:{top:'bare',c:'#7A4E2D',c2:'#8D6E63',hat:'horned',hatC:'#8A97A6',pelt:1,paint:1},
  tank:{top:'plate',c:'#8A97A6',c2:'#5A6572',hat:'helm',hatC:'#7C8896',shield:1},
  trickster:{top:'motley',c:'#8E44AD',c2:'#2ECC71',hat:'jester',hatC:'#8E44AD'},
  necro:{top:'robe',c:'#2B2238',c2:'#8E5BD6',hat:'hood',hatC:'#211A2C',skullBelt:1},
  tamer:{top:'vest',c:'#6B7A3A',c2:'#8D6E46',hat:'ranger',hatC:'#7A5A36',furTrim:1},
  monk:{top:'gi',c:'#E8952E',c2:'#7A3E14',hat:'none',bald:1,beads:1},
  slayer:{top:'coat',c:'#6E1F2B',c2:'#3A2A22',hat:'wide',hatC:'#2E2620',belts:1},
  resilient:{top:'tunic',c:'#7D8597',c2:'#B6A58A',hat:'none',bandage:1},
  npc:{top:'tunic',c:'#C9B38A',c2:'#6D5A44',hat:'none'},
  chosen:{top:'tunic',c:'#F4F1EA',c2:'#E8B33A',hat:'none',cape:'#C62F35',glow:1},
  bard:{top:'motley',c:'#C0392B',c2:'#F2B544',hat:'ranger',hatC:'#7A2E8E',feather:1},
  ninja:{top:'leather',c:'#1E1E28',c2:'#3A3A4A',hat:'hood',hatC:'#16161E',mask:1},
  samurai:{top:'plate',c:'#A3242E',c2:'#2B2B33',hat:'kabuto',hatC:'#2B2B33'},
  pirate:{top:'coat',c:'#2C3E70',c2:'#C9A25B',hat:'tricorn',hatC:'#1F1F26',patch:1,belts:1},
  alchemist:{top:'tunic',c:'#6B5B3E',c2:'#C9B38A',hat:'none',goggles:1,apron:1},
  druid:{top:'robe',c:'#3E7A3A',c2:'#8D6E46',hat:'antlers',hatC:'#8D6E46'},
  gunslinger:{top:'coat',c:'#8A5A36',c2:'#3A2A22',hat:'wide',hatC:'#6B4A2E',belts:1},
  chef:{top:'tunic',c:'#F4F1EA',c2:'#C9CED6',hat:'toque',hatC:'#FFFFFF'},
  wrestler:{top:'bare',c:'#2E86DE',c2:'#F2B544',hat:'none',lucha:1,wraps:1},
  gambler:{top:'vest',c:'#2E5E3E',c2:'#E8E2DA',hat:'visor',hatC:'#2E8B57'},
  streamer:{top:'tunic',c:'#7B3FE4',c2:'#2B2B33',hat:'cap',hatC:'#2B2B33',headset:1}
};
const HAIRS=['#2B1B12','#5A3825','#C9A25B','#A33A1D','#1F1F1F','#D8D2C8','#7B4A2D','#E8C872'];
const HSKIN=['#FFDBAC','#F1C27D','#E0AC69','#C68642','#8D5524','#5C3A21'];

// ---------- the body ----------
function buildBody(L){
  const race=RACE_SP[L.race]||RACE_SP.Human,out=OUT[L.arch]||OUT.npc,hs=hashStr(L.name||'x');
  const skinHex=SUBCOL[L.race+'/'+L.rsub]||(L.race==='Human'?HSKIN[hs%HSKIN.length]:race.skin);
  const S=RP(skinHex),O1=RP(out.c),O2=RP(out.c2),HAIR=RP(race.hairCol||HAIRS[(hs>>3)%HAIRS.length]);
  const B=sbuf(),A=sbuf();
  const plan=race.plan||'humanoid';
  let sx=46,sy=34;
  if(plan==='humanoid'){[sx,sy]=humanoidSprite(B,A,L,race,out,S,O1,O2,HAIR,hs);}
  else{[sx,sy]=CREATURE[plan](B,A,L,race,out,S,O1,O2,hs,skinHex);}
  weaponSprite(A,L.weapon,L.ench,sx,sy);
  outline(B);outline(A);
  return {body:toURL(B),arm:toURL(A),sx:sx*100/SW,sy:sy*120/SH};
}
function humanoidSprite(B,A,L,race,out,S,O1,O2,HAIR,hs){
  const K=BUILDS[race.b||'normal'],cx=35,G=81;
  const tl=cx-Math.floor(K.tw/2),tr=tl+K.tw-1,shY=K.sy,hipY=K.hy,hc=K.hc,hr=K.hr;
  const boots=out.top==='plate'?O2:out.top==='robe'?RP('#3A2E26'):RP('#4A3428');
  const pants=out.top==='plate'?O2:out.top==='gi'?O1:out.top==='tank'?RP('#2E3A5C'):out.top==='robe'?O1:RP(out.c2);
  // behind everything: cape, wings, tail
  if(out.cape||race.cape){const C=RP(out.cape||race.cape);P(B,[[tl+1,shY+1],[tr-2,shY+1],[tr+2,G-4],[tl-5,G-3]],C);}
  if(race.wings==='feather'){const W=RP(L.rsub==='Fallen'?'#4A4458':'#F4F1EA');P(B,[[cx-2,shY+2],[cx-10,shY-9],[cx-22,shY-12],[cx-27,shY-3],[cx-21,shY+9],[cx-8,shY+14]],W);for(let k=0;k<3;k++)line(B,cx-12-k*4,shY-6+k*2,cx-9-k*3,shY+8,W[1],W);}
  if(race.wings==='bat'){const W=RP(race.scales?skinHexDark(L):'#3A1F2E');P(B,[[cx-2,shY+3],[cx-12,shY-10],[cx-24,shY-4],[cx-20,shY+2],[cx-24,shY+8],[cx-14,shY+8],[cx-4,shY+12]],W);}
  if(race.wings==='fairy'){const W=RP('#C9F1FF');E(B,cx-12,shY+2,9,6,W,{al:170});E(B,cx-10,shY+12,6,4,W,{al:170});}
  if(race.tail==='cat'||race.tail==='rat'){const T=race.tail==='rat'?RP('#D9A0A8'):S;cap(B,tl+2,hipY-2,tl-7,hipY-12,2.6,T);cap(B,tl-7,hipY-12,tl-5,hipY-22,2.4,T);}
  if(race.tail==='wolf'||race.tail==='fox'||race.tail==='raccoon'){const T=race.tail==='fox'?RP('#E8862E'):S;const n=race.tail==='fox'?1+(hs%3):1;
    for(let k=0;k<n;k++){P(B,[[tl+2,hipY-3],[tl-8-k*2,hipY-10-k*5],[tl-14-k*3,hipY-16-k*6],[tl-10-k*2,hipY-4-k*4],[tl+1,hipY+2]],T);}
    if(race.tail==='raccoon')for(let k=0;k<3;k++)line(B,tl-4-k*3,hipY-5-k*3,tl-2-k*3,hipY-9-k*3,S[0],S);
    if(race.tail==='fox')put(B,tl-14,hipY-16,[255,250,240],S);}
  if(race.tail==='demon'||race.tail==='dragon'){const T=race.tail==='dragon'?S:RP('#7A1020');cap(B,tl+3,hipY-2,tl-8,hipY+12,3,T);cap(B,tl-8,hipY+12,tl-14,hipY+8,2.4,T);P(B,[[tl-16,hipY+5],[tl-12,hipY+4],[tl-14,hipY+10]],T);}
  if(race.fin)P(B,[[tl+1,shY+4],[tl-6,shY+2],[tl,shY+12]],S);
  // back arm (the shield hangs on it for tanks)
  const ba=[tl+1,shY+3,tl-3,shY+18];
  cap(B,ba[0],ba[1],ba[2],ba[3],5,out.top==='bare'||out.top==='tank'?S:O1);
  E(B,ba[2],ba[3]+2,2.6,2.6,out.top==='plate'?O2:S);
  if(out.shield){E(B,tl-3,shY+14,8,10,RP('#5A6572'));E(B,tl-3,shY+14,4,5,RP('#C9D1DA'));}
  // legs
  if(race.tailLegs){const T=S;P(B,[[tl+2,hipY-2],[tr-2,hipY-2],[cx+5,G-10],[cx+1,G-4],[cx-5,G-10]],T);P(B,[[cx-1,G-7],[cx+12,G-3],[cx+9,G+1],[cx,G-2],[cx-9,G+1],[cx-12,G-3]],RP('#3FA79A'));
    for(let y=hipY;y<G-8;y+=3)line(B,cx-3,y,cx+2,y+1,S[1],S);}
  else{
    const lw=K.lw,g=race.b==='big'||race.b==='stocky'?2:1;
    for(const s of [-1,1]){
      const lx=s<0?cx-g-lw:cx+g;
      if(out.top==='robe'){}else Bx(B,lx,hipY-1,lx+lw-1,G-4,race.boney?S:pants,1);
      if(race.boney&&out.top!=='robe'){/* bony legs show through */}
      const hoof=race.head==='bull'||race.hooves;
      Bx(B,lx-(hoof?0:1),G-5,lx+lw+(s>0?1:0),G,hoof?RP('#2E2420'):boots,1);
    }
  }
  // torso by outfit
  const tt=shY,tb=hipY+1;
  if(out.top==='robe'){P(B,[[tl,tt+1],[tr,tt+1],[tr+4,G-2],[tl-4,G-2]],O1,{term:0.8});line(B,cx+1,tt+3,cx+3,G-3,O2[2],O2);Bx(B,tl,tb-6,tr,tb-4,O2,0,{flat:1});
    if(out.stars)for(const [x,y] of [[tl+3,tt+12],[tr-2,tt+20],[cx-3,G-12],[cx+6,G-8]])put(B,x,y,[255,236,150],O2);
    if(out.skullBelt){E(B,cx+2,tb-5,2,2,RP('#EDE6D6'));}}
  else{
    const T=out.top==='bare'||out.top==='tank'?S:O1;
    Bx(B,tl,tt,tr,tb,T,3,{term:0.85});
    if(out.top==='tank'){Bx(B,tl+2,tt+3,tr-2,tb-2,O1,2);}
    if(out.top==='plate'){Bx(B,tl+1,tt+1,tr-1,tt+9,O1,3);line(B,tl+2,tt+10,tr-2,tt+10,O1[1],O1);for(let x=tl+3;x<tr-1;x+=4)put(B,x,tt+4,O1[3],O1);
      if(out.tabard){Bx(B,cx-4,tt+8,cx+5,tb+6,RP(out.tabard),1);if(out.cross){Bx(B,cx,tt+11,cx+1,tt+19,RP('#E8B33A'),0,{flat:1});Bx(B,cx-2,tt+13,cx+3,tt+14,RP('#E8B33A'),0,{flat:1});}}}
    if(out.top==='leather'||out.top==='coat'){line(B,tl+1,tt+2,tr-1,tb-3,O2[2],O2);if(out.belts)line(B,tr-1,tt+2,tl+1,tb-3,O2[2],O2);}
    if(out.top==='gi'){P(B,[[cx-3,tt],[cx+4,tt],[cx+1,tt+9]],S);Bx(B,tl,tb-6,tr,tb-4,O2,0,{flat:1});}
    if(out.top==='vest'){Bx(B,tl,tt,cx-2,tb,O2,2);if(out.furTrim)Bx(B,tl,tt,tr,tt+3,RP('#D7C4A3'),1);}
    if(out.top==='motley'){Bx(B,cx,tt,tr,tb,O2,3);}
    if(out.top==='tunic'){Bx(B,tl,tb-5,tr,tb-3,O2,0,{flat:1});if(out.glow)Bx(B,cx-1,tt+2,cx+1,tb-6,RP('#F2B544'),0,{flat:1});}
    if(out.top==='coat'){P(B,[[tl,tb-2],[tr,tb-2],[tr+2,tb+10],[tl-2,tb+10]],O1);}
    if(out.top==='bare'){line(B,cx,tt+4,cx,tt+10,S[1],S);if(out.paint){line(B,tl+3,tt+5,tl+7,tt+9,[200,40,50],S);}}
    if(out.pelt){P(B,[[tl-2,tt-1],[tr+2,tt-1],[tr+1,tt+6],[cx,tt+9],[tl-1,tt+6]],RP('#8D6E63'),{term:0.7});}
    if(race.chitin)for(let y=tt+5;y<tb-2;y+=4)line(B,tl+2,y,tr-2,y,S[1],S);
    if(race.boney&&(out.top==='bare'||out.top==='tank'))for(let y=tt+4;y<tb-4;y+=3)line(B,tl+3,y,tr-3,y,[110,100,90],S);
  }
  if(out.apron){Bx(B,cx-5,tt+6,cx+6,tb+8,RP('#E8E2DA'),1);}
  if(race.bee)for(let y=tt+5;y<tb;y+=5)Bx(B,tl+1,y,tr-1,y+1,RP('#2A2230'),0,{flat:1});
  if(race.mummy)for(let y=tt+2;y<tb;y+=3)line(B,tl,y,tr,y+1,S[1],S);
  if(race.treant){for(const [x,y] of [[tl+3,tt+6],[tr-4,tt+12],[cx,tt+17]])line(B,x,y,x+1,y+4,S[0],S);}
  if(race.robot){Bx(B,cx-3,tt+5,cx+4,tt+11,RP('#3A4450'),1);put(B,cx-1,tt+8,[90,230,255]);put(B,cx+2,tt+8,[255,90,90]);}
  if(out.beads)for(let k=0;k<6;k++)put(B,cx-4+k*1.6,tt+3+Math.abs(2.5-k),[120,60,30],O2);
  if(out.bandage){line(B,tl+1,tt+6,tr-1,tt+12,[240,235,220],S);line(B,tl+1,tt+7,tr-1,tt+13,[220,210,190],S);}
  if(race.beard){P(B,[[cx-6,hc+4],[cx+9,hc+4],[cx+7,tt+12],[cx+1,tt+16],[cx-4,tt+10]],HAIR);}
  // neck and head
  Bx(B,cx-2,hc+hr-3,cx+3,tt+1,S,1);
  headSprite(B,L,race,out,S,HAIR,hs,cx,hc,hr);
  // shoulder pads
  if(out.top==='plate'){E(B,tr-1,tt+2,4,3.5,O1);E(B,tl+1,tt+2,4,3.5,O1);}
  if(out.pelt){E(B,tr,tt+1,4,3,RP('#8D6E63'));}
  // the front arm goes on its own sprite so it can swing
  const shx=tr-1,shy=tt+3,hx=tr+4,hy=tt+18;
  const sleeve=out.top==='bare'||out.top==='tank'?S:race.cyborg?RP('#8A97A6'):O1;
  cap(A,shx,shy,hx,hy,5,sleeve);
  E(A,hx,hy+1,2.8,2.8,out.top==='plate'?O2:(out.wraps?RP('#F4F1EA'):(race.cyborg?RP('#8A97A6'):S)));
  return [shx,shy];
}
function skinHexDark(L){return SUBCOL[L.race+'/'+L.rsub]||'#8B2A20';}
function headSprite(B,L,race,out,S,HAIR,hs,cx,hc,hr){
  const hidesHair=['helm','hood','wizard','jester','wide','ranger','horned','kabuto','tricorn','toque','cap'].includes(out.hat)||out.lucha;
  const eyeC=race.eye?h2r(race.eye):[30,20,40];
  // hair behind the head
  if(race.hair&&!hidesHair&&!out.bald&&(hs%5===1||race.b==='slim'))P(B,[[cx-hr,hc-2],[cx+hr-3,hc-2],[cx+hr-4,hc+hr+5],[cx-hr-2,hc+hr+7]],HAIR);
  // ears behind the head
  if(race.ears==='elf'){P(B,[[cx-hr+3,hc-2],[cx-hr-7,hc-8],[cx-hr-2,hc+1],[cx-hr+2,hc+4]],S);}
  if(race.ears==='goblin'){P(B,[[cx-hr+2,hc],[cx-hr-9,hc-3],[cx-hr+1,hc+5]],S);}
  if(race.ears==='fox'){P(B,[[cx-5,hc-hr+2],[cx-4,hc-hr-7],[cx+1,hc-hr+1]],RP('#E8862E'));P(B,[[cx+1,hc-hr+1],[cx+4,hc-hr-7],[cx+6,hc-hr+3]],RP('#E8862E'));}
  // head shapes
  const h=race.head;
  if(h==='wolf'||h==='dragon'){E(B,cx,hc,hr,hr-0.5,S);P(B,[[cx+2,hc-1],[cx+hr+7,hc+1],[cx+hr+7,hc+5],[cx+2,hc+6]],S);put(B,cx+hr+6,hc+1,[30,20,30],S);
    if(h==='wolf'){P(B,[[cx-6,hc-hr+3],[cx-4,hc-hr-5],[cx,hc-hr+2]],S);P(B,[[cx,hc-hr+2],[cx+3,hc-hr-5],[cx+5,hc-hr+3]],S);line(B,cx+5,hc+4,cx+hr+5,hc+4,[250,250,245],S);}
    else if(!race.noHorns){P(B,[[cx-5,hc-hr+3],[cx-12,hc-hr-4],[cx-2,hc-hr+1]],RP('#EDE6D6'));P(B,[[cx-1,hc-hr+2],[cx-6,hc-hr-6],[cx+3,hc-hr+1]],RP('#EDE6D6'));for(let k=0;k<4;k++)put(B,cx-4+k*3,hc+3+(k%2),S[1],S);}}
  else if(h==='bull'){E(B,cx,hc,hr+1,hr,S);E(B,cx+5,hc+4,5,3.5,RP('#C9A27A'));put(B,cx+7,hc+4,[30,20,20],S);put(B,cx+4,hc+4,[30,20,20],S);
    P(B,[[cx-hr,hc-3],[cx-hr-8,hc-9],[cx-hr-6,hc-4],[cx-hr+1,hc]],RP('#EDE6D6'));P(B,[[cx+hr-2,hc-4],[cx+hr+7,hc-11],[cx+hr+6,hc-5],[cx+hr-1,hc]],RP('#EDE6D6'));
    const ring=RP('#E8B33A');put(B,cx+6,hc+7,ring[2],ring);put(B,cx+5,hc+7,ring[2],ring);}
  else if(h==='frog'){E(B,cx+1,hc+2,hr+3,hr-1,S);E(B,cx-3,hc-hr+2,3.5,3.5,S);E(B,cx+5,hc-hr+2,3.5,3.5,S);put(B,cx-2,hc-hr+2,[20,20,20],S);put(B,cx+6,hc-hr+2,[20,20,20],S);line(B,cx-2,hc+4,cx+hr+2,hc+4,S[0],S);}
  else if(h==='raccoon'){E(B,cx,hc,hr,hr-1,S);E(B,cx-5,hc-hr+1,3,3,S);E(B,cx+4,hc-hr+1,3,3,S);Bx(B,cx-3,hc-2,cx+hr-1,hc+1,RP('#2A2A30'),1,{flat:1});E(B,cx+hr-1,hc+3,2.5,2,RP('#EEEEEE'));put(B,cx+hr,hc+3,[20,20,20],S);}
  else if(h==='shark'){E(B,cx+1,hc,hr+1,hr-0.5,S);P(B,[[cx+2,hc+1],[cx+hr+7,hc+3],[cx+2,hc+7]],S);Bx(B,cx+2,hc+3,cx+hr+5,hc+6,RP('#F4F1EA'),1,{flat:1});for(let k=0;k<4;k++)put(B,cx+3+k*2,hc+4,[60,60,70],S);P(B,[[cx-4,hc-hr+2],[cx-2,hc-hr-7],[cx+3,hc-hr+1]],S);}
  else if(h==='rat'){E(B,cx,hc,hr,hr-1,S);P(B,[[cx+3,hc-1],[cx+hr+7,hc+3],[cx+3,hc+5]],S);put(B,cx+hr+6,hc+3,[240,140,160],S);E(B,cx-5,hc-hr+1,3.5,3.5,RP('#D9A0A8'));E(B,cx+3,hc-hr,3,3,RP('#D9A0A8'));}
  else if(h==='yeti'){E(B,cx,hc,hr+1,hr,S);E(B,cx+2,hc+1,5,5,RP('#7FA8D9'));}
  else if(race.robot){Bx(B,cx-hr+1,hc-hr+1,cx+hr,hc+hr-1,S,2);Bx(B,cx-1,hc-3,cx+hr,hc+1,RP('#1A2230'),1,{flat:1});line(B,cx,hc-1,cx+hr-1,hc-1,[90,230,255],S);line(B,cx+2,hc-hr+1,cx+2,hc-hr-4,S[0],S);E(B,cx+2,hc-hr-5,1.5,1.5,RP('#E5484D'));}
  else if(race.golem){Bx(B,cx-hr+1,hc-hr+2,cx+hr-1,hc+hr-1,S,2);line(B,cx-3,hc-4,cx+1,hc+2,RP(L.rsub==='Diamond'?'#E0FFFF':'#FFB627')[3],S);}
  else{E(B,cx,hc,hr,hr+0.5,S);}
  if(race.ears==='cat'){P(B,[[cx-6,hc-hr+3],[cx-5,hc-hr-5],[cx-1,hc-hr+1]],S);P(B,[[cx+1,hc-hr+1],[cx+4,hc-hr-5],[cx+6,hc-hr+3]],S);put(B,cx-5,hc-hr-1,[240,160,170],S);put(B,cx+4,hc-hr-1,[240,160,170],S);}
  if(race.cap){P(B,[[cx-hr-5,hc-1],[cx,hc-hr-7],[cx+hr+5,hc-1]],RP('#D64545'));E(B,cx,hc-3,hr+5,5,RP('#D64545'));for(const [x,y] of [[cx-6,hc-5],[cx+2,hc-7],[cx+7,hc-3]])E(B,x,y,1.5,1.2,RP('#FFF6EA'));}
  // face (looking right)
  const ex=cx+3,ey=hc-1;
  if(race.skull){Bx(B,ex-1,ey-1,ex+1,ey+1,RP('#2A2230'),0,{flat:1});Bx(B,ex+4,ey-1,ex+5,ey+1,RP('#2A2230'),0,{flat:1});line(B,cx+2,hc+5,cx+7,hc+5,[60,50,50],S);for(let k=0;k<3;k++)put(B,cx+3+k*2,hc+6,[60,50,50],S);}
  else if(race.robot){}
  else if(race.bugeyes){E(B,cx+5,hc-1,3,3.5,RP('#C0392B'));}
  else if(h!=='frog'&&h!=='bull'){
    if(!(out.mask)){put(B,ex,ey,[245,245,245],S);put(B,ex+1,ey,eyeC,S);put(B,ex+5,ey,[245,245,245],S);put(B,ex+6,ey,eyeC,S);}
    else{put(B,ex+1,ey,eyeC,S);put(B,ex+6,ey,eyeC,S);}
    if(!h&&!race.golem)put(B,cx+hr,hc+2,S[1],S);
    if(!h&&!out.mask)line(B,cx+3,hc+5,cx+6,hc+5,S[0],S);
  }
  if(race.stars){for(const [x,y] of [[cx-4,hc-3],[cx-1,hc+4],[cx+2,hc-6]])put(B,x,y,[255,255,255],S);put(B,ex+1,ey,[127,227,255],S);put(B,ex+6,ey,[127,227,255],S);}
  if(race.whiskers){line(B,cx+hr-2,hc+3,cx+hr+3,hc+2,[240,235,225],S);line(B,cx+hr-2,hc+4,cx+hr+3,hc+5,[240,235,225],S);}
  if(race.beak)P(B,[[cx+hr-1,hc],[cx+hr+5,hc+2],[cx+hr-1,hc+4]],RP('#E8A93A'));
  if(race.clown){E(B,cx+hr,hc+2,2,2,RP('#E5484D'));line(B,cx+2,hc+5,cx+7,hc+6,[200,40,60],S);put(B,ex+1,ey-2,[60,120,220],S);}
  if(race.mummy){for(let y=hc-hr+2;y<hc+hr;y+=3)line(B,cx-hr+1,y,cx+hr-1,y+1,S[1],S);}
  if(race.treant){for(let k=0;k<6;k++)E(B,cx-6+k*2.6,hc-hr+(k%2?0:2),3.2,2.6,RP(k%2?'#5DAA4B':'#3E7A3A'));}
  if(race.ogre){line(B,cx+1,hc+4,cx+8,hc+4,S[0],S);}
  if(race.gnomehat){P(B,[[cx-hr-2,hc-1],[cx+hr+1,hc-1],[cx-3,hc-hr-13]],RP('#D64545'));}
  if(race.tusks){put(B,cx+3,hc+6,[245,240,225],S);put(B,cx+7,hc+6,[245,240,225],S);put(B,cx+3,hc+5,[245,240,225],S);put(B,cx+7,hc+5,[245,240,225],S);}
  if(race.brow)line(B,cx+1,hc-3,cx+8,hc-3,S[0],S);
  if(race.nose)P(B,[[cx+hr-1,hc],[cx+hr+5,hc+3],[cx+hr-1,hc+4]],S);
  if(race.fangs){put(B,cx+4,hc+6,[255,255,255],S);put(B,cx+6,hc+6,[255,255,255],S);}
  if(race.fins){P(B,[[cx-3,hc+1],[cx-10,hc-4],[cx-8,hc+4]],RP('#3FA79A'));}
  if(race.zombie){line(B,cx-3,hc-5,cx+1,hc-1,[60,30,40],S);put(B,cx-2,hc-3,[60,30,40],S);put(B,cx,hc-4,[60,30,40],S);}
  if(race.cyborg){Bx(B,cx+1,hc-4,cx+hr,hc+3,RP('#8A97A6'),1);put(B,ex+6,ey,[255,60,60],S);put(B,ex+5,ey,[255,140,140],S);}
  if(race.antennae){line(B,cx+1,hc-hr,cx+4,hc-hr-7,S[0],S);line(B,cx+4,hc-hr,cx+9,hc-hr-6,S[0],S);}
  if(out.mask)Bx(B,cx-1,hc+2,cx+hr+1,hc+7,RP(out.c2),1);
  if(out.patch){Bx(B,ex+4,ey-1,ex+6,ey+1,RP('#1A1A20'),0,{flat:1});line(B,cx-hr+1,hc-4,ex+5,ey-1,[30,30,36],S);}
  if(out.goggles){Bx(B,cx-hr+1,hc-hr+3,cx+hr,hc-hr+5,RP('#5A4632'),0,{flat:1});E(B,ex+1,hc-hr+4,2,2,RP('#7FE3FF'));E(B,ex+6,hc-hr+4,2,2,RP('#7FE3FF'));}
  if(out.lucha){shape(B,(x,y)=>ell(cx,hc,hr+0.6,hr+1)(x,y)&&!(y>hc+3&&x>cx),cx-hr-1,hc-hr-1,cx+hr+1,hc+hr+1,RP(out.c));put(B,ex,ey,[255,255,255]);put(B,ex+1,ey,[20,20,30]);put(B,ex+5,ey,[255,255,255]);put(B,ex+6,ey,[20,20,30]);line(B,cx-2,hc-hr,cx-2,hc+2,RP(out.c2)[2],RP(out.c2));}
  if(out.headset){line(B,cx-hr,hc-2,cx-hr,hc+3,[30,30,36]);E(B,cx-hr,hc+1,1.6,2.2,RP('#2B2B33'));line(B,cx-hr+1,hc+4,cx+4,hc+6,[30,30,36]);}
  if(out.paint)line(B,ex-1,ey+2,ex+6,ey+2,[200,40,50],S);
  // hair on top
  if(race.hair&&!hidesHair&&!out.bald&&!race.cap&&!race.gnomehat){
    const st=hs%5;
    if(st===0)P(B,[[cx-hr,hc-1],[cx-hr+1,hc-hr+1],[cx+2,hc-hr-2],[cx+hr,hc-hr+2],[cx+hr,hc-3],[cx+2,hc-5],[cx-3,hc-3]],HAIR);
    else if(st===2){for(let k=0;k<5;k++)P(B,[[cx-hr+k*3.5,hc-hr+3],[cx-hr+1+k*3.5,hc-hr-4],[cx-hr+4+k*3.5,hc-hr+3]],HAIR);E(B,cx,hc-hr+3,hr,3,HAIR);}
    else if(st===3)P(B,[[cx-2,hc-hr+1],[cx+1,hc-hr-5],[cx+4,hc-hr+1]],HAIR);
    else E(B,cx-1,hc-hr+3,hr+0.5,4.5,HAIR);
  }
  if(race.laurel&&!hidesHair){for(let k=-3;k<=3;k++)put(B,cx+k*2,hc-hr+1+Math.abs(k)*0.6,[90,160,60],S);}
  if(race.horns==='goat'){P(B,[[cx-3,hc-hr+2],[cx-9,hc-hr-4],[cx-10,hc-hr+3],[cx-5,hc-hr+3]],RP('#C9B38A'));P(B,[[cx+1,hc-hr+1],[cx-2,hc-hr-6],[cx+4,hc-hr]],RP('#C9B38A'));}
  if(race.horns==='demon'){P(B,[[cx-4,hc-hr+2],[cx-8,hc-hr-6],[cx-2,hc-hr+1]],RP('#2E2420'));P(B,[[cx+2,hc-hr+1],[cx+6,hc-hr-7],[cx+5,hc-hr+2]],RP('#2E2420'));}
  if(race.halo)E(B,cx,hc-hr-4,7,2,RP('#F2B544'),{al:230});
  hatSprite(B,out,cx,hc,hr);
}
function hatSprite(B,out,cx,hc,hr,cr){
  const C=RP(out.hatC||'#555');const t=hc-hr;
  switch(out.hat){
    case 'wizard':E(B,cx,t+3,hr+5,2.5,C);P(B,[[cx-hr+1,t+3],[cx+hr-1,t+3],[cx-6,t-14]],C);put(B,cx-2,t-2,[242,181,68],C);break;
    case 'hood':{if(cr)break;const outer=ell(cx-0.5,hc-0.5,hr+2.2,hr+2.6),face=ell(cx+4.5,hc+2.5,hr-1.6,hr-1.4);shape(B,(x,y)=>outer(x,y)&&!face(x,y),cx-hr-3,hc-hr-4,cx+hr+3,hc+hr+3,C);P(B,[[cx-hr-2,hc+1],[cx-1,hc+4],[cx+1,hc+hr+5],[cx-hr-3,hc+hr+6]],C);break;}
    case 'helm':P(B,[[cx-hr-1,hc+3],[cx-hr-1,t+4],[cx,t-1],[cx+hr+1,t+4],[cx+hr+1,hc+3]],C);Bx(B,cx+1,hc-2,cx+hr+1,hc-1,RP('#1A1328'),0,{flat:1});line(B,cx-2,t,cx-2,hc+2,C[3],C);break;
    case 'horned':P(B,[[cx-hr,hc-1],[cx-hr+1,t+2],[cx+hr-1,t+2],[cx+hr,hc-1]],C);P(B,[[cx-hr+1,t+3],[cx-hr-6,t-6],[cx-hr+4,t+1]],RP('#EDE6D6'));P(B,[[cx+hr-3,t+1],[cx+hr+4,t-7],[cx+hr,t+3]],RP('#EDE6D6'));break;
    case 'jester':P(B,[[cx-hr,t+4],[cx-hr-7,t-4],[cx-2,t]],C);P(B,[[cx-2,t],[cx+hr+6,t-5],[cx+hr,t+4]],RP('#2ECC71'));E(B,cx-hr-7,t-4,1.6,1.6,RP('#F2B544'));E(B,cx+hr+6,t-5,1.6,1.6,RP('#F2B544'));Bx(B,cx-hr,t+2,cx+hr,t+4,C,1);break;
    case 'circlet':line(B,cx-hr+1,t+4,cx+hr-1,t+4,C[2],C);put(B,cx+2,t+3,[229,72,77],C);break;
    case 'band':Bx(B,cx-hr,t+4,cx+hr,t+6,C,1);P(B,[[cx-hr,t+5],[cx-hr-6,t+9],[cx-hr-4,t+5]],C);break;
    case 'ranger':E(B,cx,t+4,hr+5,2.2,C);Bx(B,cx-hr+2,t-2,cx+hr-2,t+4,C,3);line(B,cx-hr+2,t+2,cx+hr-2,t+2,RP('#B3262B')[2],C);if(out.feather)P(B,[[cx-4,t+1],[cx-12,t-9],[cx-9,t-10],[cx-2,t]],RP('#F2F2F2'));break;
    case 'wide':E(B,cx,t+4,hr+8,2.5,C);Bx(B,cx-hr+2,t-3,cx+hr-2,t+4,C,2);break;
    case 'tricorn':P(B,[[cx-hr-4,t+5],[cx-2,t-4],[cx+hr+4,t+5],[cx,t+2]],C);line(B,cx-hr-3,t+5,cx+hr+3,t+5,RP('#C9A25B')[2],C);put(B,cx-1,t,[240,240,240],C);break;
    case 'antlers':for(const s2 of [-1,1]){const bx=cx+s2*3;line(B,bx,t+2,bx+s2*4,t-6,[141,110,70]);line(B,bx+s2*2,t-2,bx+s2*6,t-3,[141,110,70]);line(B,bx+s2*3,t-4,bx+s2*2,t-9,[141,110,70]);}E(B,cx,t+3,hr,1.6,RP('#3E7A3A'));break;
    case 'toque':Bx(B,cx-hr+1,t-1,cx+hr-1,t+4,C,1);E(B,cx,t-4,hr,5,C);break;
    case 'cap':Bx(B,cx-hr,t,cx+hr-1,t+5,C,3);P(B,[[cx+hr-2,t+3],[cx+hr+7,t+5],[cx+hr-2,t+6]],C);break;
    case 'visor':P(B,[[cx-hr,t+4],[cx+hr+6,t+5],[cx+hr+1,t+7],[cx-hr,t+6]],C);break;
    case 'kabuto':P(B,[[cx-hr-2,hc+2],[cx-hr-1,t+3],[cx,t-1],[cx+hr+1,t+3],[cx+hr+2,hc+1]],C);P(B,[[cx-4,t+1],[cx-9,t-8],[cx-1,t-1]],RP('#E8B33A'));P(B,[[cx+1,t-1],[cx+7,t-9],[cx+4,t+1]],RP('#E8B33A'));break;
  }
}
// ---------- creatures with their own body plans ----------
const CREATURE={
  slime(B,A,L,race,out,S,O1,O2,hs){
    E(B,35,64,19,17,S,{al:235});E(B,28,56,4,3,RP('#FFFFFF'),{al:190,flat:1});
    put(B,38,60,[20,30,20],S);put(B,44,60,[20,30,20],S);line(B,39,66,44,66,S[0],S);
    if(L.rsub==='King slime'){const G=RP('#F2B544');P(B,[[26,48],[28,40],[31,45],[35,38],[39,45],[42,40],[44,48]],G);}
    else hatSprite(B,out,35,52,10,1);
    cap(A,48,62,53,58,4,S);E(A,53,57,2.6,2.6,S);return [48,62];
  },
  ghost(B,A,L,race,out,S,O1,O2,hs){
    P(B,[[22,40],[48,40],[50,64],[46,72],[41,66],[36,74],[31,66],[26,73],[20,64]],S,{al:215});E(B,35,30,13,13,S,{al:215});
    put(B,38,28,[30,30,60],S);put(B,43,28,[30,30,60],S);E(B,40,35,2,2.5,RP('#2A2240'));
    if(L.rsub==='Banshee')for(let k=0;k<4;k++)line(B,24+k*2,22,20+k,42,S[3],S);
    hatSprite(B,out,35,30,12,1);cap(A,46,42,51,52,4.5,S,{al:215});return [46,42];
  },
  pigeon(B,A,L,race,out,S,O1,O2,hs){
    const F=RP('#E8862E');line(B,32,72,30,80,F[2],F);line(B,38,72,40,80,F[2],F);line(B,28,80,33,80,F[2],F);line(B,38,80,43,80,F[2],F);
    E(B,33,62,15,12,S);P(B,[[20,60],[12,66],[22,68]],S);E(B,44,40,8,8,S);E(B,42,49,6,5,RP('#5FB37A'));E(B,42,50,4,3,RP('#8E5BD6'),{flat:1});
    P(B,[[51,39],[57,41],[51,43]],RP('#4A4A4A'));put(B,46,38,[255,140,40],S);put(B,47,38,[20,20,20],S);
    E(B,30,60,9,6,RP('#6E7783'));line(B,24,62,34,64,S[0],S);
    if(L.rsub==='War pigeon')Bx(B,38,30,50,34,RP('#5A6572'),2);else hatSprite(B,out,44,40,8,1);
    cap(A,40,58,47,62,4,RP('#6E7783'));return [40,58];
  },
  toaster(B,A,L,race,out,S,O1,O2,hs){
    Bx(B,24,68,28,80,RP('#3A3A40'),1);Bx(B,41,68,45,80,RP('#3A3A40'),1);
    Bx(B,20,42,50,70,S,4,{term:0.8});Bx(B,24,44,30,46,RP('#2A2A30'),0,{flat:1});Bx(B,36,44,42,46,RP('#2A2A30'),0,{flat:1});
    Bx(B,25,34,30,44,RP('#D9A35A'),1);Bx(B,37,37,42,44,RP('#C98A44'),1);
    Bx(B,36,52,38,54,RP('#1A1A20'),0,{flat:1});Bx(B,43,52,45,54,RP('#1A1A20'),0,{flat:1});line(B,37,60,44,60,[40,40,50],S);
    Bx(B,51,50,53,58,RP('#3A3A40'),1);hatSprite(B,out,35,40,10,1);
    cap(B,22,50,16,62,3,RP('#3A3A40'));cap(A,48,52,53,62,3,RP('#3A3A40'));E(A,53,63,2.4,2.4,S);return [48,52];
  },
  eldritch(B,A,L,race,out,S,O1,O2,hs){
    for(let k=0;k<5;k++){const x=22+k*6.5;cap(B,x,64,x+(k%2?3:-3),79,4,S);}
    E(B,35,50,17,20,S);
    const n=L.rsub==='Three eyes'?3:L.rsub==='Twelve eyes'?7:L.rsub==='Too many eyes'?9:11;
    for(let k=0;k<n;k++){const x=27+((k*37)%18),y=40+((k*23)%22);E(B,x,y,2,2,RP('#F4F1EA'),{flat:1});put(B,x+1,y,[200,30,60],S);}
    line(B,30,62,44,62,S[0],S);hatSprite(B,out,35,36,13,1);
    cap(A,48,46,56,56,4,S);return [48,46];
  },
  djinn(B,A,L,race,out,S,O1,O2,hs,hex){
    const G=RP(hex),SM=RP('#9DB8F5');
    P(B,[[26,50],[44,50],[40,62],[34,70],[30,78],[36,80],[24,74],[28,64]],SM,{al:200});
    Bx(B,25,30,45,52,G,5,{term:0.8});Bx(B,25,46,45,50,RP('#E8B33A'),1);E(B,35,20,9,9,G);
    P(B,[[34,11],[36,2],[38,11]],RP('#1F1F26'));Bx(B,32,9,38,12,RP('#1F1F26'),1);
    put(B,38,19,[255,255,255],G);put(B,43,19,[255,255,255],G);line(B,38,24,42,24,G[0],G);E(B,35,26,3,3,RP('#1F1F26'));
    E(B,24,40,2.5,2.5,RP('#E8B33A'));
    cap(B,26,33,22,48,5,G);cap(A,44,33,49,48,5,G);E(A,49,49,2.8,2.8,G);hatSprite(B,out,35,20,9,1);return [44,33];
  },
  snowman(B,A,L,race,out,S,O1,O2,hs){
    E(B,35,70,15,11,S);E(B,35,50,11,10,S);E(B,35,30,9,9,S);
    for(const y of [46,52,58])E(B,35,y,1.3,1.3,RP('#2A2230'),{flat:1});
    put(B,37,28,[20,20,30]);put(B,41,28,[20,20,30]);P(B,[[41,31],[49,32],[41,33]],RP('#E8862E'));
    Bx(B,26,38,44,40,RP(out.c||'#C0392B'),1);Bx(B,26,40,29,46,RP(out.c||'#C0392B'),1);
    line(B,26,48,16,40,[110,80,50]);line(B,19,43,16,44,[110,80,50]);
    hatSprite(B,out,35,30,9,1);
    cap(A,44,48,52,40,2,RP('#6E4A30'));return [44,48];
  },
  duck(B,A,L,race,out,S,O1,O2,hs){
    E(B,34,66,17,12,S);P(B,[[18,62],[12,56],[20,66]],S);E(B,42,44,10,10,S);
    P(B,[[50,45],[59,47],[50,51]],RP('#E8862E'));put(B,45,41,[20,20,20],S);put(B,46,41,[20,20,20],S);
    E(B,30,64,8,5,RP('#E9C032'));E(B,26,58,2.5,2,RP('#FFFFFF'),{al:200,flat:1});
    if(L.rsub==='Debugging duck'){Bx(B,40,38,50,40,RP('#2B2B33'),0,{flat:1});}
    else hatSprite(B,out,42,44,10,1);
    cap(A,42,62,50,58,4,S);return [42,62];
  },
  elemental(B,A,L,race,out,S,O1,O2,hs,hex){
    const G=RP(hex);
    P(B,[[24,52],[46,52],[42,66],[38,62],[35,80],[31,64],[27,68]],G,{al:230});
    Bx(B,25,30,45,54,G,5,{term:0.8});E(B,35,20,9,9,G);
    for(let k=0;k<4;k++)P(B,[[28+k*4,14],[30+k*4,4+(k%2)*3],[32+k*4,14]],G);
    put(B,38,19,[255,255,255],G);put(B,43,19,[255,255,255],G);
    for(const [x,y] of [[30,38],[40,44],[34,58]])put(B,x,y,G[3],G);
    cap(B,26,33,22,50,5,G);cap(A,44,33,49,50,5,G);E(A,49,51,2.8,2.8,G);return [44,33];
  }
};
// ---------- weapons ----------
function wcol(n){return RP(n);}
function weaponSprite(A,name,ench,sx,sy){
  const n=(name||'').toLowerCase();
  // the hand sits at the end of the front arm; aim the weapon up and forward
  const hx=sx+5,hy=sy+16;
  const steel=wcol('#C9D1DA'),wood=wcol('#8D5E3A'),dark=wcol('#3A3344'),gold=wcol('#E8B33A');
  const g=EGLOW[ench];
  const blade=(x0,y0,x1,y1,w,R)=>{if(g)cap(A,x0,y0,x1,y1,w+3,RP(g),{al:110,flat:1});cap(A,x0,y0,x1,y1,w,R);};
  if(n.includes('greatsword')){blade(hx+1,hy-3,hx+14,hy-30,3.5,steel);cap(A,hx-3,hy-1,hx+4,hy-5,2,gold);}
  else if(n.includes('katana')){blade(hx+1,hy-3,hx+11,hy-28,2.4,steel);cap(A,hx-1,hy,hx+2,hy-4,2.4,dark);}
  else if(n.includes('cursed')){blade(hx+1,hy-3,hx+11,hy-24,3,wcol('#6A1B9A'));cap(A,hx-3,hy-1,hx+4,hy-4,2,dark);}
  else if(n.includes('dagger')){blade(hx+1,hy-2,hx+6,hy-12,2.4,steel);cap(A,hx-2,hy,hx+3,hy-3,1.6,gold);}
  else if(n.includes('scythe')){cap(A,hx-2,hy+8,hx+8,hy-26,2,wood);P(A,[[hx+8,hy-26],[hx-6,hy-30],[hx-12,hy-22],[hx-2,hy-26]],steel);}
  else if(n.includes('trident')){cap(A,hx-2,hy+8,hx+8,hy-24,2,gold);for(const d of [-4,0,4])cap(A,hx+8+d,hy-24,hx+8+d,hy-31,1.6,gold);cap(A,hx+4,hy-24,hx+12,hy-24,1.6,gold);}
  else if(n.includes('spear')){cap(A,hx-2,hy+8,hx+8,hy-24,2,wood);P(A,[[hx+6,hy-24],[hx+10,hy-23],[hx+10,hy-32]],steel);}
  else if(n.includes('axe')){cap(A,hx-2,hy+6,hx+6,hy-22,2.4,wood);P(A,[[hx+5,hy-24],[hx+15,hy-30],[hx+18,hy-18],[hx+7,hy-16]],steel);if(g)E(A,hx+13,hy-23,7,7,RP(g),{al:90,flat:1});}
  else if(n.includes('hammer')){cap(A,hx-1,hy+6,hx+5,hy-20,2.4,wood);Bx(A,hx-2,hy-28,hx+12,hy-19,steel,1);}
  else if(n.includes('bat')){cap(A,hx,hy,hx+10,hy-24,2,wood);cap(A,hx+5,hy-12,hx+11,hy-26,4.5,wood);}
  else if(n.includes('pan')){cap(A,hx,hy,hx+6,hy-10,2,dark);E(A,hx+9,hy-16,7,7,dark);E(A,hx+9,hy-16,4.5,4.5,wcol('#55505E'),{flat:1});}
  else if(n.includes('brick')){Bx(A,hx-1,hy-9,hx+8,hy-2,wcol('#B5523B'),1);}
  else if(n.includes('chicken')){E(A,hx+5,hy-10,4,6,wcol('#F4D03F'));E(A,hx+7,hy-17,3,3,wcol('#F4D03F'));P(A,[[hx+9,hy-17],[hx+12,hy-16],[hx+9,hy-15]],wcol('#E8862E'));put(A,hx+8,hy-21,[220,40,40]);}
  else if(n.includes('noodle')){for(let k=0;k<12;k++)put(A,hx+1+k,hy-2-k*1.6+Math.sin(k)*1.5,[244,214,120],RP('#F4D678'));}
  else if(n.includes('fists')){E(A,hx,hy+1,3.4,3.4,wcol('#F4F1EA'));}
  else if(n.includes('bow')){for(let k=-12;k<=12;k++){const x=hx+4+Math.round(Math.sqrt(Math.max(0,144-k*k))/2.2);put(A,x,hy+k-3,[141,94,58],wood);}line(A,hx+4,hy-15,hx+4,hy+9,[230,225,210],wood);}
  else if(n.includes('rifle')){Bx(A,hx-3,hy-6,hx+16,hy-2,dark,1);Bx(A,hx+12,hy-5,hx+18,hy-3,wcol('#7FE3FF'),0);Bx(A,hx-1,hy-2,hx+2,hy+3,dark,0);}
  else if(n.includes('uno')){Bx(A,hx,hy-10,hx+6,hy-1,wcol('#E5484D'),1);put(A,hx+3,hy-6,[255,255,255]);}
  else if(n.includes('staff')){cap(A,hx-1,hy+10,hx+6,hy-24,2,wood);E(A,hx+6,hy-27,3.6,3.6,RP(g||'#7FE3FF'));}
  else if(n.includes('shuriken')){P(A,[[hx+4,hy-10],[hx+6,hy-6],[hx+10,hy-4],[hx+6,hy-2],[hx+4,hy+2],[hx+2,hy-2],[hx-2,hy-4],[hx+2,hy-6]],steel);}
  else if(n.includes('boomerang')){cap(A,hx,hy-2,hx+10,hy-8,3,wood);cap(A,hx+10,hy-8,hx+6,hy-18,3,wood);}
  else if(n.includes('guitar')){cap(A,hx,hy,hx+12,hy-22,2,dark);E(A,hx+1,hy+1,6,5,wcol('#E5484D'));E(A,hx+5,hy-4,4,4,wcol('#E5484D'));Bx(A,hx+11,hy-26,hx+14,hy-21,dark,0);}
  else if(n.includes('whip')){for(let k=0;k<16;k++)put(A,hx+k,hy-2-Math.sin(k/3)*5-k*0.6,[90,60,40],wood);cap(A,hx,hy,hx+2,hy-3,2,dark);}
  else if(n.includes('nunchuck')){cap(A,hx,hy,hx+3,hy-9,2.2,dark);line(A,hx+3,hy-9,hx+8,hy-12,[160,160,170],steel);cap(A,hx+8,hy-12,hx+14,hy-6,2.2,dark);}
  else if(n.includes('fishing')){cap(A,hx,hy+4,hx+12,hy-26,1.5,wood);line(A,hx+12,hy-26,hx+16,hy-6,[220,220,230],steel);put(A,hx+16,hy-5,[229,72,77]);}
  else if(n.includes('lollipop')){cap(A,hx,hy,hx+6,hy-16,1.6,wcol('#F4F1EA'));E(A,hx+7,hy-22,6,6,wcol('#FF6FA8'));for(let k=0;k<3;k++)put(A,hx+5+k*2,hy-24+k*2,[255,255,255]);}
  else{blade(hx+1,hy-3,hx+10,hy-22,3,steel);}
}
// ---------- drop-in replacement for the old renderer ----------
function spriteKey(L){return [L.name,L.race,L.rsub,L.arch,L.weapon,L.ench].join('|');}
function charSVG(L,opt){
  opt=opt||{};
  if(!L||!L.race)return charSVGVec(L,opt);
  const sc=opt.sized?(SIZE_H[L.size]||1):1;
  const hh=Math.round((opt.h||110)*sc),ww=Math.round(hh*100/120);
  const k=spriteKey(L);let c=SPR.cache.get(k);
  if(!c){
    try{c=buildBody(L);}catch(e){console.warn('sprite failed',e);return charSVGVec(L,opt);}
    SPR.cache.set(k,c);if(SPR.cache.size>140)SPR.cache.delete(SPR.cache.keys().next().value);
  }
  const aura=L.power&&L.power!=='none'&&PAURA[L.power]?`<ellipse cx="50" cy="115" rx="31" ry="5.5" fill="${PAURA[L.power]}" opacity=".5"/>`:'';
  const halo=L.arch==='chosen'?`<circle cx="50" cy="60" r="44" fill="#FFE082" opacity=".18"/>`:'';
  const ir=`style="image-rendering:pixelated"`;
  let inner=`<ellipse cx="50" cy="116.5" rx="24" ry="4.2" fill="#000" opacity=".28"/>${halo}${aura}<image href="${c.body}" x="0" y="0" width="100" height="120" preserveAspectRatio="none" ${ir}/><g class="armw" data-sx="${c.sx.toFixed(1)}" data-sy="${c.sy.toFixed(1)}"><image href="${c.arm}" x="0" y="0" width="100" height="120" preserveAspectRatio="none" ${ir}/></g>`;
  if(opt.mirror)inner=`<g transform="translate(100 0) scale(-1 1)">${inner}</g>`;
  return `<svg class="ch px" viewBox="0 0 100 120" width="${ww}" height="${hh}" aria-hidden="true">${inner}</svg>`;
}
