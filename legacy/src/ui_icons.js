// ================= PIXEL ICONS: hand-made 12x12 sprites instead of vague emojis =================
// palette: k outline, w white, then colors. '.' is transparent
const PXP={k:'#1A1426',w:'#FFFFFF',y:'#F2B544',Y:'#FFE08A',o:'#E8862E',r:'#E5484D',R:'#FF8A8A',p:'#FF4F8B',P:'#FFB3D1',b:'#3D8BFF',B:'#9CC7FF',c:'#4FC3F7',C:'#B9ECFF',g:'#2DD4BF',G:'#9FF2E3',v:'#9C6BFF',V:'#D1BCFF',s:'#9AA6B2',S:'#D8DEE6',n:'#8A5A36',N:'#C08457',l:'#5DAA4B',L:'#A6E08F'};
const PXI={
 coin:['...kkkkk....','..kyyyyyk...','.kyYYyyyyk..','kyYyyyyyyyk.','kyYyykkyyyk.','kyyyykyyyyk.','kyyyykyyyyk.','kyyykkkyyyk.','kyyyyyyyyyk.','.kyyyyyyyk..','..kyyyyyk...','...kkkkk....'],
 gem:['............','..kkkkkkk...','.kcCCcccck..','kcCCccccccck','kkkkkkkkkkkk','.kcCcccccck.','..kcCcccck..','...kcCcck...','....kcck....','.....kk.....','............','............'],
 legacy:['.....k......','....kyk.....','....kyk.....','kkkkkYkkkkk.','.kyyYYyyyk..','..kyyyyyk...','..kyykyyk...','.kyyk.kyyk..','.kyk...kyk..','.kk.....kk..','............','............'],
 gear:['....kkk.....','.k.kSSSk.k..','kSkSSSSSkSk.','.kSSkkkSSk..','kSSk...kSSk.','kSSk...kSSk.','.kSSkkkSSk..','kSkSSSSSkSk.','.k.kSSSk.k..','....kkk.....','............','............'],
 sound:['.....k......','....kk...k..','...kwk.k..k.','kkkwwk..k.k.','kwwwwk.k.k.k','kwwwwk.k.k.k','kkkwwk..k.k.','...kwk.k..k.','....kk...k..','.....k......','............','............'],
 mute:['.....k......','....kk......','...kwk......','kkkwwk.k...k','kwwwwk..k.k.','kwwwwk...k..','kkkwwk..k.k.','...kwk.k...k','....kk......','.....k......','............','............'],
 bolt:['......kkk...','.....kyyk...','....kyyk....','...kyyk.....','..kyyyykk...','.kkkkyyyk...','....kyyk....','...kyyk.....','..kyyk......','..kyk.......','..kk........','............'],
 house:['.....kk.....','....krrk....','...krrrrk...','..krrrrrrk..','.krrrrrrrrk.','kkkkkkkkkkkk','.kNNNNNNNNk.','.kNkkNNkkNk.','.kNkBNNkBNk.','.kNNNkkNNNk.','.kNNNknNNNk.','.kkkkkkkkkk.'],
 play:['............','..kkkkkkkk..','.kvvvvvvvvk.','kvvwvvvvkvvk','kvwwwvvkpkvk','kvvwvvvvkvvk','kvvvvvvvvvvk','kvvvkkkkvvvk','.kvk....kvk.','..k......k..','............','............'],
 fist:['............','...kkkkkk...','..kNNkNkNk..','..kNNkNkNkk.','.kkNNkNkNkNk','.kNNNNNNNNNk','.kNNNNNNNNk.','.kNNNNNNNNk.','..kNNNNNNk..','..kkNNNNkk..','....kkkk....','............'],
 target:['...kkkkk....','..krrrrrk...','.krwwwwwrk..','krwkrrrkwrk.','krwrkkkrwrk.','krwrkwkrwrk.','krwrkkkrwrk.','krwkrrrkwrk.','.krwwwwwrk..','..krrrrrk...','...kkkkk....','............'],
 menu:['............','.kkkkkkkkkk.','.kwwwwwwwwk.','.kkkkkkkkkk.','............','.kkkkkkkkkk.','.kwwwwwwwwk.','.kkkkkkkkkk.','............','.kkkkkkkkkk.','.kwwwwwwwwk.','.kkkkkkkkkk.'],
 book:['............','.kkkkk.kkkk.','kNNNNNkNNNNk','kNwwwNkNwwNk','kNNNNNkNNNNk','kNwwwNkNwwNk','kNNNNNkNNNNk','kNwwNNkNwwNk','kNNNNNkNNNNk','.kkkkkkkkkk.','............','............'],
 calendar:['..k....k....','.kkkkkkkkkk.','.krrrrrrrrk.','.kkkkkkkkkk.','.kwwwwwwwwk.','.kwkwwkwwwk.','.kwwwwwwkwk.','.kwkwwkwwwk.','.kwwwwwwwwk.','.kkkkkkkkkk.','............','............'],
 skull:['...kkkkkk...','..kwwwwwwk..','.kwwwwwwwwk.','.kwkkwwkkwk.','.kwkkwwkkwk.','.kwwwkkwwwk.','..kwwwwwwk..','..kwkwkwkk..','...kkkkkk...','............','............','............'],
 dice:['............','..kkkkkkkk..','.kwwwwwwwwk.','.kwkwwwwkwk.','.kwwwwwwwwk.','.kwwwkkwwwk.','.kwwwkkwwwk.','.kwwwwwwwwk.','.kwkwwwwkwk.','.kwwwwwwwwk.','..kkkkkkkk..','............'],
 cart:['k...........','kkk.........','.kkkkkkkkkk.','.kyyyyyyyyk.','..kyyyyyyk..','..kyyyyyyk..','...kkkkkkk..','...k......k.','...kkkkkkkk.','...kk....kk.','...kk....kk.','............'],
 cup:['............','kkkkkkkkkkk.','kyYyyyyyyyk.','kykyYyyyykyk','kykyYyyyykyk','.kkyYyyyykk.','..kyyyyyyk..','...kyyyyk...','....kyyk....','...kkyykk...','..kyyyyyyk..','..kkkkkkkk..'],
 chain:['............','.kkkk.......','kssssk......','ks..sk......','kssskkkk....','.kkkssssk...','....ks..sk..','....kssskkk.','.....kkksssk','.......ks.sk','.......kssk.','........kk..'],
 bag:['....kkkk....','...k....k...','.kkkkkkkkkk.','kNNNNNNNNNNk','kNNNNNNNNNNk','kNkkkkkkkkNk','kNkyyyyyykNk','kNkkkkkkkkNk','kNNNNNNNNNNk','kNNNNNNNNNNk','.kkkkkkkkkk.','............'],
 shield:['kkkkkkkkkkk.','kbbbbbwbbbk.','kbbbbbwbbbk.','kbbbbbwbbbk.','kwwwwwwwwwk.','kbbbbbwbbbk.','.kbbbbwbbk..','.kbbbbwbbk..','..kbbbwbk...','...kbbwk....','....kkk.....','............'],
 heart:['............','.kkk..kkk...','krRrkkrrrk..','kRrrrrrrrrk.','krrrrrrrrrk.','krrrrrrrrrk.','.krrrrrrrk..','..krrrrrk...','...krrrk....','....krk.....','.....k......','............'],
 sword:['.........kkk','........kSSk','.......kSSk.','......kSSk..','.....kSSk...','.kk.kSSk....','.kykSSk.....','..kykk......','.kykyk......','kykk.yk.....','kk...kk.....','............'],
 spark:['.....k......','.....v......','..k.kVk.k...','...kVVVk....','.kvVwwwVvk..','...kVVVk....','..k.kVk.k...','.....v......','.....k......','............','............','............'],
 wing:['............','.......kkk..','.....kkwwwk.','...kkwwwwk..','..kwwwwwk...','.kwwwwkk....','kwwwkk......','kwwk........','kkk.........','............','............','............'],
 swirl:['....kkkk....','..kkggggkk..','.kggkkkkggk.','kggk....kgk.','kgk..kk..kgk','kgk.kggk.kgk','kgk.kgk..kgk','kggk.kkkgk..','.kggkkggk...','..kkkkkk....','............','............'],
 chat:['.kkkkkkkkk..','kpPPPPPPPpk.','kPwwPwwPwPk.','kPPPPPPPPPk.','kPwwwPwwPPk.','kpPPPPPPPpk.','.kkkpkkkkk..','...kpk......','...kk.......','............','............','............'],
 star:['.....k......','....kyk.....','....kyk.....','kkkkyYykkkk.','.kyyYYYyyk..','..kyyYyyk...','..kyykyyk...','.kyyk.kyyk..','.kyk...kyk..','.kk.....kk..','............','............'],
 lock:['...kkkkk....','..ks...sk...','..ks...sk...','..ks...sk...','.kkkkkkkkk..','.kyyyyyyyk..','.kyyykyyyk..','.kyyykyyyk..','.kyyyyyyyk..','.kkkkkkkkk..','............','............'],
 people:['..kk....kk..','.kNNk..kNNk.','.kNNk..kNNk.','..kk....kk..','.kbbk..krrk.','kbbbbkkrrrrk','kbbbbkkrrrrk','kbbbbkkrrrrk','.kkkk..kkkk.','............','............','............'],
 card:['............','kkkkkkkkkkk.','kwwwwwwwwwk.','kwkkkwwkkwk.','kwkNkwwwwwk.','kwkkkwwkkwk.','kwwwwwwwwwk.','kwkkkkkkkwk.','kwwwwwwwwwk.','kkkkkkkkkkk.','............','............'],
 flag:['k...........','kkkkkkk.....','kwwwwwwk....','kwwwwwwwkkk.','kwwwwwwwwwk.','kkkkkkkwwwk.','k......kkkk.','k...........','k...........','k...........','k...........','............'],
 skip:['............','k...k...k...','kk..kk..kk..','kwk.kwk.kwk.','kwwkkwwkkwwk','kwk.kwk.kwk.','kk..kk..kk..','k...k...k...','............','............','............','............'],
 scroll:['.kkkkkkkk...','kNwwwwwwwk..','.kwkkkkwwk..','.kwwwwwwwk..','.kwkkkkkwk..','.kwwwwwwwk..','.kwkkkwwwk..','.kwwwwwwwkk.','.kkkkkkkkNk.','.........k..','............','............'],
 robot:['.....k......','....kkk.....','.kkkkkkkkk..','.kssssssssk.','.kscksscksk.','.kssssssssk.','.kskkkkkksk.','.kssssssssk.','..kkkkkkkk..','............','............','............'],
 question:['...kkkkk....','..kwwwwwk...','.kwwkkkwwk..','.kkk..kwwk..','.....kwwk...','....kwwk....','....kwwk....','....kkkk....','....kwwk....','....kkkk....','............','............'],
 attack:['k.........kk','kk.......kSk','.kk.....kSk.','..kk...kSk..','...kk.kSk...','....kkSk....','....kSkk....','...kSk.kk...','.kkSk...kk..','kyk.k....kk.','kk.........k','............'],
 special:['.....k......','....kyk.....','..k.kYk.k...','...kyYyk....','kkkyYwYykkk.','..kyyYyyk...','...kyyyk....','..kyk.kyk...','.kyk...kyk..','.kk.....kk..','............','............']
};
function pxSVG(name,cls){
  const rows=PXI[name];if(!rows)return '';
  let r='';
  rows.forEach((row,y)=>{let x=0;while(x<row.length){const c=row[x];if(c==='.'){x++;continue;}let w=1;while(x+w<row.length&&row[x+w]===c)w++;r+=`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${PXP[c]}"/>`;x+=w;}});
  return `<svg class="pxi${cls?' '+cls:''}" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
// ---------- swap the interface emojis for icons ----------
const EMO_ICON={'🪙':'coin','💎':'gem','✦':'legacy','⚙️':'gear','🔊':'sound','🔇':'mute','⚡':'bolt','🏠':'house','🎮':'play','🥊':'fist','🎯':'target','☰':'menu','📆':'calendar','🏃':'skull','🎰':'dice','🛒':'cart','🎒':'bag','🛡️':'shield','❤️':'heart','⚔️':'attack','✨':'spark','💨':'wing','🌀':'swirl','💬':'chat','🌟':'special','🔒':'lock','📚':'book','👥':'people','🪪':'card','🏳️':'flag','⏭':'skip','📜':'scroll','🤖':'robot','❓':'question','📖':'book'};
// only these places get icons; wheel slices, gear and races keep their own pictures
const ICON_ZONES='#app>header.bar, .hubtabs, .mode .mo-e, .tier .te, .nb-i>span, .fchip, .menu-i>span, .fm-grid .menu-i>span, .shop-tabs .fchip, .gl-top, .sc-row, #shopCoins, .buy, .coinchip, .statpop .sp-r>span:first-child, .goal .g-r, .fc-side .btn, #fcEnd, .lockbar, .tt-pts';
const COIN_RX=/(🪙|💎|✦)/;
function iconizeText(root){
  const zones=root.querySelectorAll?[...(root.matches&&root.matches(ICON_ZONES)?[root]:[]),...root.querySelectorAll(ICON_ZONES)]:[];
  for(const z of zones){
    const tw=document.createTreeWalker(z,NodeFilter.SHOW_TEXT);const nodes=[];
    while(tw.nextNode()){const t=tw.currentNode;if(t.parentElement&&t.parentElement.closest('svg,canvas,textarea,input'))continue;if(/[\u2600-\u27BF\u{1F300}-\u{1FAFF}✦]/u.test(t.nodeValue))nodes.push(t);}
    for(const t of nodes){
      const parts=t.nodeValue.split(/(🪙|💎|✦|⚙️|🔊|🔇|⚡|🏠|🎮|🥊|🎯|☰|📆|🏃|🎰|🛒|🎒|🛡️|❤️|⚔️|✨|💨|🌀|💬|🌟|🔒|📚|👥|🪪|🏳️|⏭|📜|🤖|❓|📖)/u);
      if(parts.length<2)continue;
      const frag=document.createDocumentFragment();
      for(const p of parts){if(!p)continue;const ic=EMO_ICON[p];if(ic){const s=document.createElement('span');s.className='pxw';s.innerHTML=pxSVG(ic);frag.appendChild(s);}else frag.appendChild(document.createTextNode(p));}
      t.replaceWith(frag);
    }
  }
}
{
  let pend=false;
  const run=()=>{pend=false;iconizeText(document.body);};
  new MutationObserver(()=>{if(!pend){pend=true;requestAnimationFrame(run);}}).observe(document.body,{childList:true,subtree:true,characterData:true});
  run();
}
