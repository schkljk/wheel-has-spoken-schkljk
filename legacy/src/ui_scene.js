// ---------- arena scenery: each arena gets its own backdrop ----------
function seeded(n){let x=n*9301+49297;return()=>{x=(x*9301+49297)%233280;return x/233280;};}
function sceneSVG(k){
  const r=seeded(k?k.length*17+k.charCodeAt(0):7);
  const dots=(n,col,y0,y1,rmin,rmax,op)=>{let s='';for(let i=0;i<n;i++)s+=`<circle cx="${(r()*400).toFixed(1)}" cy="${(y0+r()*(y1-y0)).toFixed(1)}" r="${(rmin+r()*(rmax-rmin)).toFixed(1)}" fill="${Array.isArray(col)?col[i%col.length]:col}" opacity="${op}"/>`;return s;};
  let g='';
  switch(k){
    case 'colosseum':
      for(let i=0;i<8;i++){const x=i*52-6;g+=`<path d="M${x} 150 V96 a22 22 0 0 1 44 0 V150 Z" fill="#7A5A2E" opacity=".28"/>`;}
      g+=`<rect x="0" y="40" width="400" height="18" fill="#7A5A2E" opacity=".25"/>`+dots(70,['#E5484D','#2DD4BF','#F2B544','#5B4BB7','#FFFFFF'],8,38,2,3.4,.55);
      break;
    case 'lava':
      for(let i=0;i<9;i++){const x=i*48+r()*20;g+=`<path d="M${x} 0 L${x+16} 0 L${x+8} ${40+r()*50} Z" fill="#000" opacity=".35"/>`;}
      g+=`<path d="M0 205 Q60 190 120 204 T240 200 T400 206 V240 H0Z" fill="#FF7A2F" opacity=".35"/><path d="M30 214 L80 206 L110 216 M200 210 L260 202 L300 214 M330 208 L380 214" stroke="#FFD180" stroke-width="2.5" fill="none" opacity=".8"/>`+dots(26,['#FFB627','#FF7A2F'],60,190,1,2.4,.75);
      break;
    case 'flood':
      for(let i=0;i<5;i++){const x=20+i*90;g+=`<rect x="${x}" y="30" width="22" height="170" fill="#0B2E4F" opacity=".45"/><rect x="${x-6}" y="26" width="34" height="10" fill="#0B2E4F" opacity=".5"/>`;}
      g+=`<path d="M0 186 Q25 178 50 186 T100 186 T150 186 T200 186 T250 186 T300 186 T350 186 T400 186 V240 H0Z" fill="#8FD3FF" opacity=".3"/>`;
      break;
    case 'tundra':
      g+=`<ellipse cx="80" cy="200" rx="160" ry="60" fill="#FFFFFF" opacity=".75"/><ellipse cx="330" cy="205" rx="150" ry="55" fill="#E6F4FB" opacity=".85"/><path d="M250 120 L300 60 L350 120 Z" fill="#A7C7DB" opacity=".6"/><path d="M290 72 L300 60 L310 72 Z" fill="#fff"/>`+dots(40,'#FFFFFF',0,180,1,2.2,.9);
      break;
    case 'graveyard':
      g+=`<circle cx="320" cy="50" r="24" fill="#F3EEFF" opacity=".85"/><circle cx="330" cy="44" r="22" fill="#2E2A3A" opacity=".9"/>`;
      for(let i=0;i<7;i++){const x=10+i*58+r()*14,h=26+r()*18;g+=i%3===1?`<path d="M${x+10} ${200-h} v${h} M${x} ${208-h} h20" stroke="#15121C" stroke-width="6" opacity=".7"/>`:`<path d="M${x} 200 V${200-h+10} a12 12 0 0 1 24 0 V200 Z" fill="#15121C" opacity=".7"/>`;}
      g+=`<rect x="0" y="176" width="400" height="20" fill="#B9A9C9" opacity=".18"/>`;
      break;
    case 'cathedral':
      for(let i=0;i<4;i++){const x=24+i*96;g+=`<path d="M${x} 196 V78 a26 34 0 0 1 52 0 V196 Z" fill="#8A6A12" opacity=".22"/><path d="M${x+10} 150 V88 a16 22 0 0 1 32 0 V150 Z" fill="url(#sg)" opacity=".75"/>`;}
      g=`<defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E5484D"/><stop offset=".5" stop-color="#5B4BB7"/><stop offset="1" stop-color="#2DD4BF"/></linearGradient></defs>`+g+`<path d="M0 0 L400 0 L240 240 L160 240 Z" fill="#FFFFFF" opacity=".08"/>`;
      break;
    case 'thunder':
      for(let i=0;i<14;i++)g+=`<rect x="${i*30}" y="0" width="3" height="200" fill="#9C8BD9" opacity=".25"/>`;
      g+=`<path d="M230 0 L205 70 L228 70 L196 150 L250 58 L226 58 L248 0 Z" fill="#FFE14D" opacity=".75"/>`;
      break;
    case 'forest':
      for(let i=0;i<9;i++){const x=i*48-10+r()*14,h=90+r()*60;g+=`<path d="M${x} 200 L${x+24} ${200-h} L${x+48} 200 Z" fill="#0B1F14" opacity=".75"/>`;}
      g+=`<rect x="0" y="150" width="400" height="40" fill="#C9E7D3" opacity=".12"/>`+dots(10,'#B6F23B',40,170,1.2,2,.8);
      break;
    case 'space':
      g+=dots(70,'#FFFFFF',0,200,.5,1.6,.9)+`<circle cx="310" cy="70" r="30" fill="#5B4BB7" opacity=".85"/><ellipse cx="310" cy="70" rx="52" ry="10" fill="none" stroke="#B388FF" stroke-width="3" opacity=".7"/><rect x="0" y="150" width="400" height="12" fill="#8FA1C4" opacity=".25"/>`;
      break;
    case 'kitchen':
      for(let y=0;y<4;y++)for(let x=0;x<14;x++)if((x+y)%2)g+=`<rect x="${x*30}" y="${20+y*22}" width="30" height="22" fill="#D7C4A8" opacity=".5"/>`;
      g+=`<rect x="0" y="110" width="400" height="70" fill="#B98B5E" opacity=".45"/><rect x="0" y="108" width="400" height="6" fill="#8E6440" opacity=".6"/><circle cx="90" cy="30" r="12" fill="#37474F" opacity=".7"/><rect x="88" y="0" width="4" height="20" fill="#37474F" opacity=".7"/><circle cx="300" cy="34" r="10" fill="#B0BEC5" opacity=".8"/><rect x="298" y="0" width="4" height="26" fill="#37474F" opacity=".7"/>`;
      break;
    case 'rooftop':
      g+=`<circle cx="70" cy="45" r="18" fill="#F3EEFF" opacity=".85"/>`;
      for(let i=0;i<10;i++){const x=i*42-6,h=60+r()*90;g+=`<rect x="${x}" y="${190-h}" width="38" height="${h}" fill="#0A1124" opacity=".85"/>`;for(let w=0;w<4;w++)g+=`<rect x="${x+6+(w%2)*16}" y="${200-h+8+Math.floor(w/2)*16}" width="8" height="8" fill="#FFD180" opacity="${r()>.4?.8:.15}"/>`;}
      break;
    case 'mirror':
      for(let i=0;i<9;i++){const x=r()*380,y=r()*150;g+=`<path d="M${x} ${y} l${20+r()*30} ${10+r()*20} l${-10-r()*20} ${20+r()*30} Z" fill="#FFFFFF" opacity="${.25+r()*.35}" stroke="#9C8BD9" stroke-width="1"/>`;}
      break;
    case 'beach':
      g+=`<circle cx="320" cy="50" r="26" fill="#FFE082" opacity=".95"/><rect x="0" y="150" width="400" height="40" fill="#2F80FF" opacity=".55"/><path d="M0 152 Q25 144 50 152 T100 152 T150 152 T200 152 T250 152 T300 152 T350 152 T400 152" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".7"/><path d="M60 190 Q70 120 66 70" stroke="#6D4C41" stroke-width="6" fill="none"/><path d="M66 70 q-30 -10 -44 8 M66 70 q30 -14 46 4 M66 70 q-12 -24 -36 -26 M66 70 q12 -26 36 -24" stroke="#2E7D32" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      break;
    case 'ballpit':
      g+=dots(90,['#E5484D','#2DD4BF','#F2B544','#5B4BB7','#3D8BFF'],150,240,6,10,.85);
      break;
    case 'void':
      g+=dots(40,'#B388FF',0,220,.6,1.8,.8);
      for(let i=1;i<=4;i++)g+=`<ellipse cx="200" cy="90" rx="${i*40}" ry="${i*14}" fill="none" stroke="#B388FF" stroke-width="1.5" opacity="${.5-i*.09}"/>`;
      break;
  }
  return `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${g}</svg>`;
}
