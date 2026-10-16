// ================= MOVE KITS on cards and in help =================
function kitStrip(f){
  const ks=kitMoves(f);if(!ks.length)return '';
  if(f===F)for(const m of ks)markSeen('moves','mv/'+m.n);
  return `<div class="card-kit"><span class="ck-l">Moves</span><div class="kitlist">${ks.map(m=>`<span class="kitmv k-${m.src}" role="button" tabindex="0" data-info="mv|${esc(m.n)}">${m.e} ${esc(m.n)}</span>`).join('')}</div></div>`;
}
function findMove(n){
  for(const [k,ms] of Object.entries(ARCH_KIT))for(const m of ms)if(m.n===n)return Object.assign({src:'class'},m);
  for(const m of Object.values(RACE_KIT))if(m.n===n)return Object.assign({src:'race'},m);
  for(const w of WEAPONS){const m=weaponKit(w);if(m.n===n)return Object.assign({src:'weapon'},m);}
  return null;
}
Object.assign(RULES,{
  moves:['⚔️','Your moves',['Every fighter brings their own moves to the combat wheel: two from their class, one from their race and one from their weapon. A goblin assassin with a dagger plays nothing like a titan monk with bare fists.','Gold slices are class moves, teal ones come from race and weapon. Basics like Strike and Guard fill the rest of the wheel.','Moves are built on Strike, Guard, Power, Focus or Sidestep, so the usual rules still apply: Strike beats Power, Power beats Guard, Guard beats Strike.']]
});
CODEX.push(['moves','Moves',()=>[...Object.entries(ARCH_KIT).flatMap(([k,ms])=>ms.map(m=>({it:Object.assign({q:3},m),key:'mv/'+m.n,par:ARCHK[k]?ARCHK[k].n:k}))),...Object.entries(RACE_KIT).map(([r,m])=>({it:Object.assign({q:2},m),key:'mv/'+m.n,par:r}))]]);

function markKits(){for(const f of [F,curOppF])if(f)for(const m of kitMoves(f))markSeen('moves','mv/'+m.n);}
