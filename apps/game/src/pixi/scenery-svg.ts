// Arena and chapter backdrops as SVG strings: pure, no Pixi (the share card uses them too).

export function seeded(n: number) {
  let x = n * 9301 + 49297;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/** The backdrop of an arena as SVG in a 400 x 240 box (same shapes as legacy). */
export function sceneSVG(k: string | undefined): string {
  const r = seeded(k ? k.length * 17 + k.charCodeAt(0) : 7);
  const dots = (n: number, col: string | string[], y0: number, y1: number, rmin: number, rmax: number, op: number) => {
    let s = '';
    for (let i = 0; i < n; i++)
      s += `<circle cx="${(r() * 400).toFixed(1)}" cy="${(y0 + r() * (y1 - y0)).toFixed(1)}" r="${(rmin + r() * (rmax - rmin)).toFixed(1)}" fill="${Array.isArray(col) ? col[i % col.length] : col}" opacity="${op}"/>`;
    return s;
  };
  let g = '';
  switch (k) {
    case 'colosseum':
      for (let i = 0; i < 8; i++) {
        const x = i * 52 - 6;
        g += `<path d="M${x} 150 V96 a22 22 0 0 1 44 0 V150 Z" fill="#7A5A2E" opacity=".28"/>`;
      }
      g += `<rect x="0" y="40" width="400" height="18" fill="#7A5A2E" opacity=".25"/>` + dots(70, ['#E5484D', '#2DD4BF', '#F2B544', '#5B4BB7', '#FFFFFF'], 8, 38, 2, 3.4, 0.55);
      break;
    case 'lava':
      for (let i = 0; i < 9; i++) {
        const x = i * 48 + r() * 20;
        g += `<path d="M${x} 0 L${x + 16} 0 L${x + 8} ${40 + r() * 50} Z" fill="#000" opacity=".35"/>`;
      }
      g +=
        `<path d="M0 205 Q60 190 120 204 T240 200 T400 206 V240 H0Z" fill="#FF7A2F" opacity=".35"/><path d="M30 214 L80 206 L110 216 M200 210 L260 202 L300 214 M330 208 L380 214" stroke="#FFD180" stroke-width="2.5" fill="none" opacity=".8"/>` +
        dots(26, ['#FFB627', '#FF7A2F'], 60, 190, 1, 2.4, 0.75);
      break;
    case 'flood':
      for (let i = 0; i < 5; i++) {
        const x = 20 + i * 90;
        g += `<rect x="${x}" y="30" width="22" height="170" fill="#0B2E4F" opacity=".45"/><rect x="${x - 6}" y="26" width="34" height="10" fill="#0B2E4F" opacity=".5"/>`;
      }
      g += `<path d="M0 186 Q25 178 50 186 T100 186 T150 186 T200 186 T250 186 T300 186 T350 186 T400 186 V240 H0Z" fill="#8FD3FF" opacity=".3"/>`;
      break;
    case 'tundra':
      g +=
        `<ellipse cx="80" cy="200" rx="160" ry="60" fill="#FFFFFF" opacity=".75"/><ellipse cx="330" cy="205" rx="150" ry="55" fill="#E6F4FB" opacity=".85"/><path d="M250 120 L300 60 L350 120 Z" fill="#A7C7DB" opacity=".6"/><path d="M290 72 L300 60 L310 72 Z" fill="#fff"/>` +
        dots(40, '#FFFFFF', 0, 180, 1, 2.2, 0.9);
      break;
    case 'graveyard':
      g += `<circle cx="320" cy="50" r="24" fill="#F3EEFF" opacity=".85"/><circle cx="330" cy="44" r="22" fill="#2E2A3A" opacity=".9"/>`;
      for (let i = 0; i < 7; i++) {
        const x = 10 + i * 58 + r() * 14;
        const h = 26 + r() * 18;
        g +=
          i % 3 === 1
            ? `<path d="M${x + 10} ${200 - h} v${h} M${x} ${208 - h} h20" stroke="#15121C" stroke-width="6" opacity=".7"/>`
            : `<path d="M${x} 200 V${200 - h + 10} a12 12 0 0 1 24 0 V200 Z" fill="#15121C" opacity=".7"/>`;
      }
      g += `<rect x="0" y="176" width="400" height="20" fill="#B9A9C9" opacity=".18"/>`;
      break;
    case 'cathedral':
      for (let i = 0; i < 4; i++) {
        const x = 24 + i * 96;
        g += `<path d="M${x} 196 V78 a26 34 0 0 1 52 0 V196 Z" fill="#8A6A12" opacity=".22"/><path d="M${x + 10} 150 V88 a16 22 0 0 1 32 0 V150 Z" fill="#9B5DE5" opacity=".55"/>`;
      }
      g += `<path d="M0 0 L400 0 L240 240 L160 240 Z" fill="#FFFFFF" opacity=".08"/>`;
      break;
    case 'thunder':
      for (let i = 0; i < 14; i++) g += `<rect x="${i * 30}" y="0" width="3" height="200" fill="#9C8BD9" opacity=".25"/>`;
      g += `<path d="M230 0 L205 70 L228 70 L196 150 L250 58 L226 58 L248 0 Z" fill="#FFE14D" opacity=".75"/>`;
      break;
    case 'forest':
      for (let i = 0; i < 9; i++) {
        const x = i * 48 - 10 + r() * 14;
        const h = 90 + r() * 60;
        g += `<path d="M${x} 200 L${x + 24} ${200 - h} L${x + 48} 200 Z" fill="#0B1F14" opacity=".75"/>`;
      }
      g += `<rect x="0" y="150" width="400" height="40" fill="#C9E7D3" opacity=".12"/>` + dots(10, '#B6F23B', 40, 170, 1.2, 2, 0.8);
      break;
    case 'space':
      g +=
        dots(70, '#FFFFFF', 0, 200, 0.5, 1.6, 0.9) +
        `<circle cx="310" cy="70" r="30" fill="#5B4BB7" opacity=".85"/><ellipse cx="310" cy="70" rx="52" ry="10" fill="none" stroke="#B388FF" stroke-width="3" opacity=".7"/><rect x="0" y="150" width="400" height="12" fill="#8FA1C4" opacity=".25"/>`;
      break;
    case 'kitchen':
      for (let y = 0; y < 4; y++) for (let x = 0; x < 14; x++) if ((x + y) % 2) g += `<rect x="${x * 30}" y="${20 + y * 22}" width="30" height="22" fill="#D7C4A8" opacity=".5"/>`;
      g += `<rect x="0" y="110" width="400" height="70" fill="#B98B5E" opacity=".45"/><rect x="0" y="108" width="400" height="6" fill="#8E6440" opacity=".6"/><circle cx="90" cy="30" r="12" fill="#37474F" opacity=".7"/><rect x="88" y="0" width="4" height="20" fill="#37474F" opacity=".7"/><circle cx="300" cy="34" r="10" fill="#B0BEC5" opacity=".8"/><rect x="298" y="0" width="4" height="26" fill="#37474F" opacity=".7"/>`;
      break;
    case 'rooftop':
      g += `<circle cx="70" cy="45" r="18" fill="#F3EEFF" opacity=".85"/>`;
      for (let i = 0; i < 10; i++) {
        const x = i * 42 - 6;
        const h = 60 + r() * 90;
        g += `<rect x="${x}" y="${190 - h}" width="38" height="${h}" fill="#0A1124" opacity=".85"/>`;
        for (let w = 0; w < 4; w++) g += `<rect x="${x + 6 + (w % 2) * 16}" y="${200 - h + 8 + Math.floor(w / 2) * 16}" width="8" height="8" fill="#FFD180" opacity="${r() > 0.4 ? 0.8 : 0.15}"/>`;
      }
      break;
    case 'mirror':
      for (let i = 0; i < 9; i++) {
        const x = r() * 380;
        const y = r() * 150;
        g += `<path d="M${x} ${y} l${20 + r() * 30} ${10 + r() * 20} l${-10 - r() * 20} ${20 + r() * 30} Z" fill="#FFFFFF" opacity="${0.25 + r() * 0.35}" stroke="#9C8BD9" stroke-width="1"/>`;
      }
      break;
    case 'beach':
      g += `<circle cx="320" cy="50" r="26" fill="#FFE082" opacity=".95"/><rect x="0" y="150" width="400" height="40" fill="#2F80FF" opacity=".55"/><path d="M0 152 Q25 144 50 152 T100 152 T150 152 T200 152 T250 152 T300 152 T350 152 T400 152" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".7"/><path d="M60 190 Q70 120 66 70" stroke="#6D4C41" stroke-width="6" fill="none"/><path d="M66 70 q-30 -10 -44 8 M66 70 q30 -14 46 4 M66 70 q-12 -24 -36 -26 M66 70 q12 -26 36 -24" stroke="#2E7D32" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      break;
    case 'ballpit':
      g += dots(90, ['#E5484D', '#2DD4BF', '#F2B544', '#5B4BB7', '#3D8BFF'], 150, 240, 6, 10, 0.85);
      break;
    case 'void':
      g += dots(40, '#B388FF', 0, 220, 0.6, 1.8, 0.8);
      for (let i = 1; i <= 4; i++) g += `<ellipse cx="200" cy="90" rx="${i * 40}" ry="${i * 14}" fill="none" stroke="#B388FF" stroke-width="1.5" opacity="${0.5 - i * 0.09}"/>`;
      break;
    // ---- calendar-themed arenas (upgrade 27)
    case 'snowglobe':
      for (let i = 0; i < 7; i++) {
        const x = 18 + i * 58 + r() * 12;
        const h = 50 + r() * 40;
        g += `<path d="M${x} 196 L${x + 20} ${196 - h} L${x + 40} 196 Z" fill="#2E5E4E" opacity=".7"/><path d="M${x + 12} ${196 - h + 22} L${x + 20} ${196 - h} L${x + 28} ${196 - h + 22} Z" fill="#FFFFFF" opacity=".9"/>`;
      }
      g +=
        `<ellipse cx="200" cy="214" rx="240" ry="38" fill="#FFFFFF" opacity=".85"/><path d="M14 210 A186 186 0 0 1 386 210" fill="none" stroke="#FFFFFF" stroke-width="6" opacity=".5"/><path d="M60 120 A150 150 0 0 1 150 44" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".55"/>` +
        dots(46, '#FFFFFF', 0, 190, 1, 2.6, 0.9);
      break;
    case 'newyear':
      g += `<circle cx="340" cy="40" r="14" fill="#F3EEFF" opacity=".8"/>`;
      for (let i = 0; i < 10; i++) {
        const x = i * 42 - 6;
        const h = 50 + r() * 70;
        g += `<rect x="${x}" y="${190 - h}" width="38" height="${h}" fill="#081029" opacity=".9"/>`;
        for (let w = 0; w < 4; w++) g += `<rect x="${x + 6 + (w % 2) * 16}" y="${200 - h + 8 + Math.floor(w / 2) * 16}" width="8" height="8" fill="#FFD180" opacity="${r() > 0.5 ? 0.8 : 0.15}"/>`;
      }
      for (const [cx, cy, col] of [
        [90, 48, '#FF5C8A'],
        [210, 30, '#FFE14D'],
        [290, 70, '#5CF2A0'],
      ] as const) {
        let rays = '';
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          rays += `M${(cx + Math.cos(a) * 6).toFixed(1)} ${(cy + Math.sin(a) * 6).toFixed(1)} L${(cx + Math.cos(a) * 24).toFixed(1)} ${(cy + Math.sin(a) * 24).toFixed(1)} `;
        }
        g += `<path d="${rays}" stroke="${col}" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>`;
      }
      break;
    case 'valentine': {
      const heart = (x: number, y: number, s: number, col: string, op: number) =>
        `<path d="M${x} ${y - 4 * s} C${x - 8 * s} ${y - 14 * s} ${x - 22 * s} ${y - 2 * s} ${x} ${y + 14 * s} C${x + 22 * s} ${y - 2 * s} ${x + 8 * s} ${y - 14 * s} ${x} ${y - 4 * s} Z" fill="${col}" opacity="${op}"/>`;
      for (let i = 0; i < 9; i++) g += heart(20 + r() * 360, 20 + r() * 110, 0.6 + r() * 0.9, i % 2 ? '#E5484D' : '#FF8FB1', 0.55);
      g += `<rect x="20" y="120" width="8" height="80" fill="#B0174A" opacity=".7"/><rect x="372" y="120" width="8" height="80" fill="#B0174A" opacity=".7"/>`;
      for (const y of [132, 150, 168]) g += `<rect x="24" y="${y}" width="352" height="3" fill="#FFFFFF" opacity=".75"/>`;
      break;
    }
    case 'clover':
      g += `<path d="M40 150 A160 160 0 0 1 360 150" fill="none" stroke="#E5484D" stroke-width="6" opacity=".35"/><path d="M50 150 A150 150 0 0 1 350 150" fill="none" stroke="#F2B544" stroke-width="6" opacity=".35"/><path d="M60 150 A140 140 0 0 1 340 150" fill="none" stroke="#5CF2A0" stroke-width="6" opacity=".35"/><path d="M70 150 A130 130 0 0 1 330 150" fill="none" stroke="#3D8BFF" stroke-width="6" opacity=".35"/>`;
      g += `<path d="M0 190 Q100 150 200 182 T400 176 V240 H0Z" fill="#2E7D32" opacity=".55"/>`;
      for (let i = 0; i < 12; i++) {
        const x = 12 + r() * 376;
        const y = 186 + r() * 40;
        g += `<circle cx="${x - 4}" cy="${y}" r="4.5" fill="#1B5E20" opacity=".8"/><circle cx="${x + 4}" cy="${y}" r="4.5" fill="#1B5E20" opacity=".8"/><circle cx="${x}" cy="${y - 6}" r="4.5" fill="#1B5E20" opacity=".8"/>`;
      }
      break;
    case 'egghunt':
      g += `<circle cx="70" cy="46" r="22" fill="#FFF59D" opacity=".9"/><path d="M0 182 Q90 140 190 176 T400 168 V240 H0Z" fill="#7CB342" opacity=".5"/>`;
      for (let i = 0; i < 9; i++) {
        const x = 20 + i * 44 + r() * 10;
        const y = 196 + r() * 26;
        const col = ['#FF8FB1', '#82B1FF', '#FFE082', '#B9F6CA', '#CE93D8'][i % 5];
        g += `<ellipse cx="${x}" cy="${y}" rx="7" ry="9" fill="${col}" opacity=".95"/><rect x="${x - 6}" y="${y - 1}" width="12" height="2.5" fill="#FFFFFF" opacity=".8"/>`;
      }
      g += dots(16, ['#FFFFFF', '#FFD1DC'], 150, 200, 1.4, 2.4, 0.9);
      break;
    case 'bonfire':
      g += `<circle cx="300" cy="120" r="34" fill="#FFB74D" opacity=".8"/><rect x="0" y="150" width="400" height="10" fill="#6D4C41" opacity=".3"/>`;
      g += `<path d="M160 196 L240 176 M160 176 L240 196" stroke="#4E342E" stroke-width="9" stroke-linecap="round" opacity=".85"/>`;
      g += `<path d="M168 184 Q176 140 192 150 Q196 112 208 136 Q220 104 226 146 Q240 132 232 184 Z" fill="#FF7A2F" opacity=".85"/><path d="M184 184 Q190 158 200 164 Q206 140 214 162 Q222 156 218 184 Z" fill="#FFE14D" opacity=".9"/>`;
      g += dots(22, ['#FFB627', '#FF7A2F'], 60, 170, 1, 2.2, 0.8);
      break;
    case 'poolparty':
      g += `<circle cx="330" cy="44" r="24" fill="#FFE082" opacity=".95"/><rect x="0" y="160" width="400" height="44" fill="#0288D1" opacity=".45"/><path d="M0 162 Q25 154 50 162 T100 162 T150 162 T200 162 T250 162 T300 162 T350 162 T400 162" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".7"/>`;
      g += `<path d="M40 160 V120 M58 160 V120 M40 132 H58 M40 146 H58" stroke="#ECEFF1" stroke-width="3" opacity=".85"/>`;
      g += `<circle cx="250" cy="172" r="14" fill="none" stroke="#FF5C8A" stroke-width="8" opacity=".9"/><path d="M110 150 V80 M70 92 Q110 56 150 92 Z" stroke="#ECEFF1" stroke-width="3" fill="#FF7043" opacity=".8"/>`;
      break;
    case 'pumpkin':
      g += `<circle cx="80" cy="46" r="22" fill="#FFE0B2" opacity=".85"/>`;
      for (let i = 0; i < 4; i++) {
        const x = 30 + i * 110 + r() * 20;
        g += `<path d="M${x} 196 V110 M${x} 140 L${x - 22} 118 M${x} 128 L${x + 20} 104 M${x} 160 L${x + 18} 146" stroke="#140C1C" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
      }
      for (let i = 0; i < 6; i++) {
        const x = 30 + i * 68 + r() * 16;
        const y = 206 + r() * 14;
        g += `<ellipse cx="${x}" cy="${y}" rx="16" ry="12" fill="#F57C00" opacity=".95"/><rect x="${x - 2}" y="${y - 17}" width="4" height="7" fill="#33691E"/><path d="M${x - 8} ${y - 3} l4 -5 l4 5 Z M${x + 1} ${y - 3} l4 -5 l4 5 Z M${x - 7} ${y + 4} h14 l-3 3 h-8 Z" fill="#FFE14D" opacity=".95"/>`;
      }
      break;
    case 'leafpile':
      for (let i = 0; i < 5; i++) {
        const x = 20 + i * 90 + r() * 16;
        g += `<rect x="${x - 4}" y="110" width="8" height="86" fill="#5D4037" opacity=".75"/><circle cx="${x}" cy="96" r="${28 + r() * 10}" fill="${i % 2 ? '#E65100' : '#F9A825'}" opacity=".7"/>`;
      }
      g += `<ellipse cx="110" cy="214" rx="70" ry="18" fill="#D84315" opacity=".8"/><ellipse cx="300" cy="218" rx="80" ry="20" fill="#EF6C00" opacity=".8"/>`;
      g += dots(30, ['#E65100', '#F9A825', '#BF360C'], 196, 230, 1.6, 3, 0.9);
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">${g}</svg>`;
}

// ---------------------------------------------------------------- Act II horizons (upgrade 37)
/**
 * Each Act II chapter has its own place on the horizon, drawn behind whatever arena the wheel picked (same
 * 400 x 240 box, mostly dark silhouettes so the arena stays readable in front). Chapters 11 to 20.
 */
export function chapterSVG(ch: number | undefined): string | null {
  if (!ch || ch < 11) return null;
  const r = seeded(ch * 31 + 7);
  const K = '#0E0A1A';
  let g = '';
  const poly = (pts: [number, number][], fill: string, op: number) => `<path d="M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z" fill="${fill}" opacity="${op}"/>`;
  const gear = (cx: number, cy: number, rad: number, teeth: number, op: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i / (teeth * 2)) * Math.PI * 2;
      const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
      const rr = i % 2 ? rad : rad * 1.18;
      pts.push([cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr], [cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr]);
    }
    return poly(pts, K, op) + `<circle cx="${cx}" cy="${cy}" r="${(rad * 0.35).toFixed(1)}" fill="#C9A25B" opacity="${op * 0.6}"/>`;
  };
  switch (ch) {
    case 11: // Sky Islands: floating islands with dangling roots and a rope bridge
      for (const [x, y, w] of [
        [60, 70, 70],
        [200, 46, 90],
        [330, 84, 64],
      ] as const) {
        g += `<path d="M${x - w / 2} ${y} Q${x} ${y - 14} ${x + w / 2} ${y} L${x + w / 4} ${y + 22} L${x} ${y + 34} L${x - w / 4} ${y + 20} Z" fill="${K}" opacity=".35"/>`;
        for (let i = 0; i < 3; i++) g += `<path d="M${x - w / 4 + i * (w / 4)} ${y + 18} q${3 - r() * 6} 14 ${2 - r() * 4} 26" stroke="${K}" stroke-width="1.5" fill="none" opacity=".3"/>`;
      }
      g += `<path d="M95 72 Q145 92 160 50" stroke="${K}" stroke-width="2" fill="none" opacity=".3"/><path d="M245 50 Q290 90 300 86" stroke="${K}" stroke-width="2" fill="none" opacity=".3"/>`;
      break;
    case 12: // The Underworld: stalactites, chains and a glow from below
      for (let i = 0; i < 12; i++) {
        const x = i * 36 + r() * 12;
        g += `<path d="M${x} 0 L${x + 14} 0 L${x + 7} ${30 + r() * 46} Z" fill="${K}" opacity=".45"/>`;
      }
      for (const x of [110, 290]) for (let k = 0; k < 6; k++) g += `<ellipse cx="${x}" cy="${20 + k * 13}" rx="4" ry="6.5" fill="none" stroke="${K}" stroke-width="2" opacity=".35"/>`;
      g += `<rect x="0" y="170" width="400" height="30" fill="#FF7A2F" opacity=".2"/>`;
      break;
    case 13: // Clockwork Citadel: house-sized gears and a clock tower
      g += gear(80, 90, 38, 10, 0.32) + gear(150, 130, 24, 8, 0.3) + gear(330, 70, 46, 12, 0.3);
      g += `<rect x="220" y="40" width="44" height="160" fill="${K}" opacity=".32"/><circle cx="242" cy="70" r="16" fill="#F3E6C2" opacity=".35"/><path d="M242 70 V60 M242 70 H252" stroke="${K}" stroke-width="2.5" opacity=".6"/>`;
      break;
    case 14: // The Sunken Kingdom: a drowned domed city, seaweed and bubbles
      g += `<path d="M120 200 V120 Q170 70 220 120 V200 Z" fill="${K}" opacity=".3"/><rect x="40" y="130" width="40" height="70" fill="${K}" opacity=".28"/><rect x="290" y="110" width="30" height="90" fill="${K}" opacity=".28"/><path d="M286 110 L305 80 L324 110 Z" fill="${K}" opacity=".28"/>`;
      for (let i = 0; i < 6; i++) {
        const x = 20 + i * 70 + r() * 20;
        g += `<path d="M${x} 200 q-8 -20 0 -40 q8 -20 0 -40" stroke="#1B5E4A" stroke-width="4" fill="none" opacity=".4"/>`;
      }
      for (let i = 0; i < 16; i++) g += `<circle cx="${(r() * 400).toFixed(1)}" cy="${(r() * 190).toFixed(1)}" r="${(1.5 + r() * 3).toFixed(1)}" fill="none" stroke="#BFE9FF" stroke-width="1" opacity=".45"/>`;
      break;
    case 15: { // Carnival of Nightmares: a big top, a ferris wheel and bunting
      g += `<path d="M40 200 L40 130 L110 80 L180 130 L180 200 Z" fill="${K}" opacity=".32"/><path d="M110 80 L110 66" stroke="${K}" stroke-width="2" opacity=".4"/><path d="M110 66 L124 70 L110 74 Z" fill="#E5484D" opacity=".6"/>`;
      g += `<circle cx="300" cy="100" r="62" fill="none" stroke="${K}" stroke-width="5" opacity=".32"/>`;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g += `<path d="M300 100 L${(300 + Math.cos(a) * 62).toFixed(1)} ${(100 + Math.sin(a) * 62).toFixed(1)}" stroke="${K}" stroke-width="2" opacity=".3"/><rect x="${(294 + Math.cos(a) * 62).toFixed(1)}" y="${(100 + Math.sin(a) * 62).toFixed(1)}" width="12" height="9" fill="${K}" opacity=".35"/>`;
      }
      g += `<path d="M260 200 L300 100 L340 200" stroke="${K}" stroke-width="5" fill="none" opacity=".32"/>`;
      let b = '';
      for (let i = 0; i < 12; i++) b += `<path d="M${i * 34} 18 L${i * 34 + 17} 18 L${i * 34 + 8.5} 30 Z" fill="${['#E5484D', '#F2B544', '#B388FF'][i % 3]}" opacity=".5"/>`;
      g += `<path d="M0 18 Q200 30 400 18" stroke="${K}" stroke-width="1.5" fill="none" opacity=".4"/>` + b;
      break;
    }
    case 16: // The Glacier Court: an ice palace and icicles
      for (const [x, h, w] of [
        [140, 120, 30],
        [175, 160, 38],
        [215, 130, 30],
        [250, 100, 24],
      ] as const)
        g += `<rect x="${x}" y="${200 - h}" width="${w}" height="${h}" fill="#4F7FA3" opacity=".42"/><path d="M${x - 4} ${200 - h} L${x + w / 2} ${200 - h - 34} L${x + w + 4} ${200 - h} Z" fill="#6E9FC4" opacity=".55"/><rect x="${x + w / 2 - 3}" y="${200 - h + 14}" width="6" height="10" fill="#E8F8FF" opacity=".6"/>`;
      for (let i = 0; i < 18; i++) {
        const x = i * 23 + r() * 8;
        g += `<path d="M${x} 0 L${x + 8} 0 L${x + 4} ${10 + r() * 22} Z" fill="#E8F8FF" opacity=".55"/>`;
      }
      break;
    case 17: // The Dream Realm: moons, stairs to nowhere and clouds
      g += `<circle cx="80" cy="50" r="26" fill="#FFF3B0" opacity=".45"/><circle cx="90" cy="44" r="22" fill="#FFB3D9" opacity=".6"/><circle cx="330" cy="40" r="10" fill="#FFF3B0" opacity=".5"/>`;
      for (let i = 0; i < 7; i++) g += `<rect x="${200 + i * 16}" y="${150 - i * 14}" width="18" height="6" fill="${K}" opacity=".28"/>`;
      for (let i = 0; i < 6; i++) g += `<rect x="${60 + i * 16}" y="${80 + i * 12}" width="18" height="6" fill="${K}" opacity=".22"/>`;
      for (const [x, y] of [
        [40, 150],
        [300, 120],
        [160, 30],
      ] as const)
        g += `<ellipse cx="${x}" cy="${y}" rx="34" ry="10" fill="#FFFFFF" opacity=".35"/><ellipse cx="${x + 18}" cy="${y - 6}" rx="22" ry="9" fill="#FFFFFF" opacity=".35"/>`;
      break;
    case 18: // The Void: broken pieces of the world drifting, and something watching
      for (let i = 0; i < 9; i++) {
        const x = 20 + r() * 360;
        const y = 20 + r() * 150;
        const s2 = 10 + r() * 22;
        g += poly(
          [
            [x, y],
            [x + s2, y + s2 * 0.2],
            [x + s2 * 0.7, y + s2 * 0.9],
            [x - s2 * 0.2, y + s2 * 0.6],
          ],
          '#2B1033',
          0.55,
        );
      }
      g += `<ellipse cx="200" cy="70" rx="46" ry="16" fill="#B388FF" opacity=".18"/><circle cx="200" cy="70" r="9" fill="#B388FF" opacity=".5"/><circle cx="200" cy="70" r="4" fill="${K}" opacity=".8"/>`;
      break;
    case 19: // The Pantheon: a temple on the horizon and lightning
      g += `<path d="M110 92 L200 56 L290 92 Z" fill="${K}" opacity=".32"/><rect x="110" y="92" width="180" height="10" fill="${K}" opacity=".32"/>`;
      for (let i = 0; i < 6; i++) g += `<rect x="${118 + i * 32}" y="104" width="12" height="90" fill="${K}" opacity=".3"/>`;
      g += `<rect x="100" y="194" width="200" height="8" fill="${K}" opacity=".3"/><path d="M340 0 L322 50 L338 50 L316 110 L356 40 L340 40 L356 0 Z" fill="#FFE14D" opacity=".5"/>`;
      break;
    case 20: { // The First Wheel: the wheel itself, enormous, on the horizon
      g += `<circle cx="200" cy="150" r="120" fill="none" stroke="${K}" stroke-width="9" opacity=".35"/><circle cx="200" cy="150" r="14" fill="${K}" opacity=".45"/>`;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g += `<path d="M200 150 L${(200 + Math.cos(a) * 120).toFixed(1)} ${(150 + Math.sin(a) * 120).toFixed(1)}" stroke="${K}" stroke-width="3" opacity=".3"/>`;
      }
      g += `<path d="M192 18 L208 18 L200 34 Z" fill="#FF4F8B" opacity=".7"/>`;
      break;
    }
    default:
      return null;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">${g}</svg>`;
}

