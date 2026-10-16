// ---------- title actions + toggles ----------
$('#diceBtn').addEventListener('click',()=>{$('#nameIn').value=randName();});
$('#startBtn').addEventListener('click',()=>{
  let n=$('#nameIn').value.trim().replace(/\s+/g,' ');
  if(!n)n=randName();
  if(freeSlot()<0){toast('Your roster is full. Retire a fighter first');return;}
  startBuild(n.slice(0,24));
});
$('#nameIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('#startBtn').click();});
function syncToggles(){
  $('#sndBtn').setAttribute('aria-pressed',String(soundOn));$('#sndBtn').textContent=soundOn?'🔊':'🔇';
  $('#fastBtn').setAttribute('aria-pressed',String(fastMode));
}
$('#sndBtn').addEventListener('click',()=>{soundOn=!soundOn;DB.sound=soundOn;saveDB();syncToggles();if(soundOn){ac();beep(880,0.08,'triangle',0.05);}});
$('#fastBtn').addEventListener('click',()=>{fastMode=!fastMode;DB.fast=fastMode;saveDB();syncToggles();});
let rz=null;
window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(!$('#s-spin').hidden&&items.length)segs=drawWheel(cv,items);if(!$('#s-title').hidden)drawIdle();},150);});
syncToggles();renderTitle();drawIdle();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(!$('#s-title').hidden)drawIdle();if(!$('#s-spin').hidden&&items.length)segs=drawWheel(cv,items);});
getSample();

pruneDB();saveDB();
